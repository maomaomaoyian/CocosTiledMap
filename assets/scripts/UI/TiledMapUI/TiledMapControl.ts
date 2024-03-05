import { game } from "../../Game";

/**
 * @author panda
 */
const { ccclass } = cc._decorator;

/** 地图最小缩放 */
const LIMIT_MIN_SCALE: number = 1;
/** 地图最大缩放 */
const LIMIT_MAX_SCALE: number = 2;
/** 地图扩展宽度 */
const EXTEND_WIDTH = 0;
/** 地图扩展高度 */
const EXTEND_HEIGHT = 0;
/** 更新粒度 */
const PARTICAL = 0.01;
/** 触发时间间隔（ms） */
const TIGGER_TIME_INTERVAL = 200;
/** 触发距离间隔*/
const TIGGER_DISTANCE_INTERVAL = 10;

@ccclass
export class TiledMapControl extends cc.Component {
    /** 地形父节点 */
    private nodeParent!: cc.Node;
    /** 地形数据 */
    private tiledmap: cc.TiledMap | null = null;
    /** 触摸偏移 */
    private moveOffset: number = 2;
    /** 操作锁 */
    private locked: boolean = false;
    /** 点击回调事件 */
    private onSingleTouch: Function | null = null;
    /** 镜头跟踪目标 */
    private target: cc.Node | null = null;
    /** 是否在滑动 */
    private isMoving: boolean = false;
    /** 偏移寄存器 */
    private dir: cc.Vec3 = new cc.Vec3();
    /** 地图像素宽度 */
    private pixelWidth: number = 0;
    /** 地图像素高度 */
    private pixelHeight: number = 0;
    /** 跟随目标的位置 */
    private follow_position: cc.Vec3 = new cc.Vec3();

    /** --- 惯性移动计算相关变量 --- */
    private inertia: boolean = true;
    private inertiaTime!: number;
    private inertiaStart!: cc.Vec2;
    private inertiaVector: cc.Vec3 = new cc.Vec3();

    /** --- 视野数据 --- */
    private labelNodePool: cc.Node[] = []
    private lightTileLabel: Map<string, cc.Node>
    private viewLastCenterTile: cc.Vec3
    private viewLastCenterPos: cc.Vec3
    private viewVertices: cc.Vec3[] = []
    private viewMapData: Map<number, cc.Vec3> = new Map()
    private viewDeleteTiles: Map<number, cc.Vec3> = new Map()
    private viewAdditionTiles: Map<number, cc.Vec3> = new Map()
    private viewChangeTiles: Map<number, cc.Vec3> = new Map()
    private previewLastCenterTile: cc.Vec3
    private previewLastCenterPos: cc.Vec3
    private previewVertices: cc.Vec3[] = []
    private previewMapData: Map<number, cc.Vec3> = new Map()
    private previewDeleteTiles: Map<number, cc.Vec3> = new Map()
    private previewAdditionTiles: Map<number, cc.Vec3> = new Map()
    private previewChangeTiles: Map<number, cc.Vec3> = new Map()

    onLoad() {
        this.tiledmap = this.node.getComponent(cc.TiledMap)
        this.nodeParent = this.node.parent!;
        var mapSize = this.tiledmap.node.getContentSize()
        this.pixelWidth = mapSize.width + EXTEND_WIDTH;
        this.pixelHeight = mapSize.height + EXTEND_HEIGHT;
        this.addEvent();
        this.onSingleTouch = (clickPos: cc.Vec3) => {
            let tile = game.map_data_ins.pixelToTile(clickPos)
            let tileCenter = game.map_data_ins.tileToPixel(tile.x, tile.y)
            window["Game"].tiledMapUI.updateTouchLab(tileCenter)
        }

        this.setMapByPos(cc.v3())
    }

    getScreenPosToMapPos(event: cc.Event.EventTouch): cc.Vec3 {
        let uil = event.getLocation();
        let worldPos: cc.Vec3 = cc.v3(uil.x, uil.y);
        let mapPos: cc.Vec3 = this.node.convertToNodeSpaceAR(worldPos);
        return mapPos;
    }

    canvasCenterToMap(): cc.Vec3 {
        let canvas = cc.find("Canvas")
        let worldPos = canvas.convertToWorldSpaceAR(cc.v3())
        return this.node.convertToNodeSpaceAR(worldPos)
    }

    setTarget(node: cc.Node) {
        this.target = node
    }

    setMapByTile(tileX: number, tileY: number) {
        let pos = game.map_data_ins.tileToPixel(tileX, tileY)
        pos.x = -this.target.position.x * this.node.scale;
        pos.y = -this.target.position.y * this.node.scale;
        this.setMapByPos(pos)
    }

    setMapByPos(pos: cc.Vec3) {
        pos = this.checkPos(pos);
        this.node!.position = pos;
    }

    lateUpdate(dt: number) {
        if (this.target && this.target.isValid) {
            this.follow_position.x = -this.target.position.x * this.node.scale;
            this.follow_position.y = -this.target.position.y * this.node.scale;
            var pos = this.checkPos(this.follow_position);
            this.node.position = game.util_vec.lerp(this.node.position, pos, 0.5);
        }

        if (this.inertia) {
            this.inertiaVector = this.inertiaVector.lerp(cc.Vec3.ZERO, dt * 10)
            this.dir.set(this.inertiaVector);
            this.dealPos();
            if (this.inertiaVector.fuzzyEquals(cc.Vec3.ZERO, PARTICAL)) {
                this.inertia = false;
                this.dir.set(cc.Vec3.ZERO);
                this.inertiaVector.set(cc.Vec3.ZERO);
            }
        }

        this.calcViewData()
    }

    private calcViewData() {
        const canvasCenterPos = this.canvasCenterToMap()
        if (game.VIEW_UPDATE_PARTICAL === game.VIEW_PARTICAL.TILE) {
            let tile = game.map_data_ins.pixelToTile(canvasCenterPos)
            if (!this.viewLastCenterTile || !this.viewLastCenterTile.equals(tile)) {
                this.viewLastCenterTile = tile
                let tileCenter = game.map_data_ins.tileToPixel(tile.x, tile.y)
                this.calcSquareView()
                window["Game"].tiledMapUI.updateCenterLab(tileCenter)
                game.PRINT && console.error("视野触发计算01")
            }
        }
        else if (game.VIEW_UPDATE_PARTICAL === game.VIEW_PARTICAL.PIXEL) {
            if (!this.viewLastCenterPos || !this.viewLastCenterPos.fuzzyEquals(canvasCenterPos, 5)) {
                this.viewLastCenterPos = canvasCenterPos
                let tile = game.map_data_ins.pixelToTile(canvasCenterPos)
                let tileCenter = game.map_data_ins.tileToPixel(tile.x, tile.y)
                this.calcSquareView()
                window["Game"].tiledMapUI.updateCenterLab(tileCenter)
                game.PRINT && console.error("视野触发计算02")
            }
        }
    }

    private calcPreviewData() {
        const canvasCenterPos = this.canvasCenterToMap()
        if (game.VIEW_UPDATE_PARTICAL === game.VIEW_PARTICAL.TILE) {
            let tile = game.map_data_ins.pixelToTile(canvasCenterPos)
            if (!this.previewLastCenterTile || !this.previewLastCenterTile.equals(tile)) {
                this.previewLastCenterTile = tile
                this.calcSquarePreview()
                game.PRINT && console.error("（预）视野触发计算01")
            }
        }
        else if (game.VIEW_UPDATE_PARTICAL === game.VIEW_PARTICAL.PIXEL) {
            if (!this.previewLastCenterPos || !this.previewLastCenterPos.fuzzyEquals(canvasCenterPos, 5)) {
                this.previewLastCenterPos = canvasCenterPos
                this.calcSquarePreview()
                game.PRINT && console.error("（预）视野触发计算02")
            }
        }
    }

    private calcSquareView() {
        if (!game.VIEW_REALTIME && this.viewVertices.length) return
        if (!this.lightTileLabel) this.lightTileLabel = new Map()
        this.recordView()
        this.drawDiagonalLines(this.viewVertices, cc.Color.YELLOW)
        this.showDataView()
    }

    private calcSquarePreview() {
        if (!game.VIEW_REALTIME && this.previewVertices.length) return
        if (!this.lightTileLabel) this.lightTileLabel = new Map()
        this.recordPreview()
        this.drawDiagonalLines(this.previewVertices, cc.Color.BLACK)
        this.showDataPreview()
    }

    private justShowView(viewData: cc.Vec3[]) {
        do {
            let tile = viewData.pop()
            if (!tile) continue
            let name = `${tile.x}_${tile.y}`
            this.pushLabel(this.lightTileLabel.get(name))
            this.lightTileLabel.delete(name)
        } while (viewData.length > 0);
    }

    private getLabelNode(tile: cc.Vec3): cc.Node {
        let node = this.labelNodePool.pop()
        let label: cc.Label;
        let name = `${tile.x}_${tile.y}`;
        if (!node) {
            node = new cc.Node(name)
            label = node.addComponent(cc.Label)
            label.fontSize = 15
            label.verticalAlign = cc.Label.VerticalAlign.CENTER
        }
        else {
            node.active = true
            label = node.getComponent(cc.Label)
        }
        label.string = `${name}`
        node.color = tile.z ? cc.Color.RED : cc.Color.BLUE
        node.parent = this.node
        let pos = game.map_data_ins.tileToPixel(tile.x, tile.y)
        node.setPosition(pos)
        return node
    }

    private pushLabel(node: cc.Node) {
        if (!cc.isValid(node)) return
        node.active = false
        this.labelNodePool.push(node)
    }

    private recordView() {
        let vertices = game.getSquareVertices(this.canvasCenterToMap(), game.VIEW)
        this.viewVertices = vertices
        game.mapModel.viewVertices = vertices
        let viewData = game.getSquareView(vertices)
        let lastViewData: Map<number, cc.Vec3> = this.viewMapData || new Map()
        let nextViewData: Map<number, cc.Vec3> = new Map()
        this.viewMapData = new Map()
        for (let index = 0; index < viewData.length; index++) {
            const tile = viewData[index];
            let gid = game.tileToGID(game.map_data_ins.row, game.map_data_ins.col, tile.x, tile.y)
            this.viewMapData.set(gid, tile)
            if (lastViewData.has(gid)) {
                lastViewData.delete(gid)
            }
            else {
                nextViewData.set(gid, tile)
            }
        }
        this.viewDeleteTiles = lastViewData
        this.viewAdditionTiles = nextViewData
        const mergedMap = game.mergeMaps(lastViewData, nextViewData);
        this.viewChangeTiles = mergedMap
    }

    private recordPreview() {
        let vertices = game.getSquareVertices(this.canvasCenterToMap(), cc.size(game.VIEW.width * 3, game.VIEW.height * 3))
        this.previewVertices = vertices
        if (!game.DEV) return
        let viewData = game.getSquareView(vertices)
        let lastViewData: Map<number, cc.Vec3> = this.previewMapData || new Map()
        let nextViewData: Map<number, cc.Vec3> = new Map()
        this.previewMapData = new Map()
        for (let index = 0; index < viewData.length; index++) {
            const tile = viewData[index];
            let gid = game.tileToGID(game.map_data_ins.row, game.map_data_ins.col, tile.x, tile.y)
            this.previewMapData.set(gid, tile)
            if (lastViewData.has(gid)) {
                lastViewData.delete(gid)
            }
            else {
                nextViewData.set(gid, tile)
            }
        }
        this.previewDeleteTiles = lastViewData
        this.previewAdditionTiles = nextViewData
        const mergedMap = game.mergeMaps(lastViewData, nextViewData);
        this.previewChangeTiles = mergedMap
    }

    private showDataView() {
        if (!game.DEV) return
        let viewDelData = Array.from(this.viewDeleteTiles.values())
        this.justShowView(viewDelData)
        let viewAddData = Array.from(this.viewAdditionTiles.values())
        this.showView(viewAddData)
    }

    private showDataPreview() {
        if (!game.DEV) return
        let viewDelData = Array.from(this.previewDeleteTiles.values())
        this.justShowView(viewDelData)
        let viewAddData = Array.from(this.previewAdditionTiles.values())
        this.showView(viewAddData)
    }

    private showView(viewData: cc.Vec3[]) {
        viewData.forEach(tile => {
            let name = `${tile.x}_${tile.y}`
            let node = this.getLabelNode(tile)
            this.lightTileLabel.set(name, node)
        });
    }

    private addEvent(): void {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    private onTouchStart(event: cc.Event.EventTouch) {
        if (this.locked) return;
        this.inertia = false;
        let touches: cc.Touch[] = event.getTouches();
        if (touches.length === 1) {
            this.inertiaTime = cc.sys.now();
            this.inertiaStart = touches[0].getLocation();
        }
    }

    private onTouchMove(event: cc.Event.EventTouch) {
        if (this.locked) return;
        var d = cc.Vec2.squaredDistance(event.getStartLocation(), event.getLocation());
        if (d <= 25) return;

        let touches: cc.Touch[] = event.getTouches();
        if (touches.length > 1) {
            var touch1 = touches[0], touch2 = touches[1];
            var delta1 = touch1.getDelta(), delta2 = touch2.getDelta();
            var touchPoint1 = this.node.convertToNodeSpaceAR(touch1.getLocation())
            var touchPoint2 = this.node.convertToNodeSpaceAR(touch2.getLocation())
            var distance = touchPoint1.sub(touchPoint2);
            var delta = delta1.sub(delta2);
            var scale = LIMIT_MIN_SCALE;
            if (Math.abs(distance.x) > Math.abs(distance.y)) {
                scale = this.checkScale((distance.x + delta.x) / distance.x * this.node.scale);
            }
            else {
                scale = this.checkScale((distance.y + delta.y) / distance.y * this.node.scale);
            }
            var pos = touchPoint2.add(cc.v2(distance.x / 2, distance.y / 2))
            var disScale = scale - this.node.scale;
            var offSetPos = pos.scale(cc.v2(disScale, disScale));
            var mapPos = this.node.getPosition().sub(offSetPos);
            this.node.position = cc.v3(mapPos.x, mapPos.y)
            this.setScale(scale)
        }
        else if (touches.length === 1) {
            if (this.isMoving || this.canStartMove(touches[0])) {
                this.isMoving = true;
                let delta = touches[0].getDelta();
                delta = delta.multiplyScalar(LIMIT_MIN_SCALE);
                this.dir.set(cc.v3(delta.x, delta.y));
                this.dealPos();
            }
        }
    }

    private onTouchEnd(event: cc.Event.EventTouch) {
        if (this.locked) return;
        if (!this.inertiaStart || !this.inertiaVector) return;

        let touches: any[] = event.getTouches();
        if (touches.length <= 1) {
            var inertia = cc.sys.now() - this.inertiaTime;
            var t = touches[0];
            cc.Vec2.subtract(this.inertiaVector, t.getLocation(), this.inertiaStart);
            var distance = this.inertiaVector.len();
            if (inertia < TIGGER_TIME_INTERVAL && distance > TIGGER_DISTANCE_INTERVAL) {
                this.inertiaVector = this.inertiaVector.normalize();
                cc.Vec3.multiplyScalar(this.inertiaVector, this.inertiaVector, distance / 10);
                this.inertia = true;
            }

            if (!this.isMoving) {
                if (this.onSingleTouch) {
                    let nodePos = this.getScreenPosToMapPos(event);
                    this.onSingleTouch(nodePos);
                }
            }

            this.reset();

            this.calcPreviewData()
        }
    }

    private onMouseWheel(evt: cc.Event.EventMouse) {
        const scroll = evt.getScrollY();
        const scale = this.checkScale(this.node.scale + (scroll >= 0 ? 0.1 : -0.1));
        var pos = this.node.convertToNodeSpaceAR(evt.getLocation());
        var disScale = scale - this.node.scale;
        var offSetPos = pos.scale(cc.v2(disScale, disScale));
        var mapPos = this.node.getPosition().sub(offSetPos);
        this.node.position = cc.v3(mapPos.x, mapPos.y)
        this.setScale(scale)
    }

    reset() {
        this.dir.set(cc.Vec3.ZERO);
        this.isMoving = false;
    }

    private canStartMove(touch: cc.Touch): boolean {
        let startPos = touch.getStartLocation();
        let nowPos = touch.getLocation();
        return (Math.abs(nowPos.x - startPos.x) > this.moveOffset || Math.abs(nowPos.y - startPos.y) > this.moveOffset);
    }

    private dealPos(): void {
        let worldPos: cc.Vec3 = this.node.convertToWorldSpaceAR(cc.Vec3.ZERO);
        let nodePos: cc.Vec3 = this.nodeParent.convertToNodeSpaceAR(worldPos);
        nodePos.x += this.dir.x;
        nodePos.y += this.dir.y;
        this.node.position = this.checkPos(nodePos);
    }

    private checkPos(nodePos: cc.Vec3) {
        var size = this.nodeParent.getContentSize();
        let horizontalDistance: number = Math.floor(Math.abs((size.width - this.pixelWidth * this.node!.scale) / 2));
        let verticalDistance: number = Math.floor(Math.abs((size.height - this.pixelHeight * this.node!.scale) / 2));
        if (nodePos.x > horizontalDistance) {
            nodePos.x = horizontalDistance;
        }
        else if (nodePos.x < -horizontalDistance) {
            nodePos.x = -horizontalDistance;
        }
        if (nodePos.y > verticalDistance) {
            nodePos.y = verticalDistance;
        }
        else if (nodePos.y < -verticalDistance) {
            nodePos.y = -verticalDistance;
        }
        return nodePos;
    }

    private checkScale(scale: number) {
        if (scale > LIMIT_MAX_SCALE) {
            scale = LIMIT_MAX_SCALE;
        }
        if (scale < LIMIT_MIN_SCALE) {
            scale = LIMIT_MIN_SCALE;
        }
        return scale
    }

    private setScale(scale: number) {
        if (this.node.scale === scale) return
        this.node.scale = scale
        this.target = null
    }

    private drawDiagonalLines(viewVertices: cc.Vec3[], color: cc.Color) {
        if (!game.DEV) return
        let vec0 = game.map_data_ins.tileToPixel(viewVertices[0].x, viewVertices[0].y)
        let vec1 = game.map_data_ins.tileToPixel(viewVertices[1].x, viewVertices[1].y)
        let vec2 = game.map_data_ins.tileToPixel(viewVertices[2].x, viewVertices[2].y)
        let vec3 = game.map_data_ins.tileToPixel(viewVertices[3].x, viewVertices[3].y)

        let node = this.node;
        let diagonalNode = node.getChildByName("diagonalNode") || new cc.Node("diagonalNode");
        if (!diagonalNode.parent) diagonalNode.parent = node;
        let graphics = diagonalNode.getComponent(cc.Graphics) || diagonalNode.addComponent(cc.Graphics);
        graphics.clear();
        graphics.strokeColor = color;
        graphics.lineWidth = 5;

        graphics.moveTo(vec0.x, vec0.y);
        graphics.lineTo(vec3.x, vec3.y);
        graphics.moveTo(vec1.x, vec1.y);
        graphics.lineTo(vec2.x, vec2.y);
        graphics.stroke();
    }
}