import { game } from "../../Game";
/**
 * @author panda
 * 2024/02/29
 */
const { ccclass } = cc._decorator;

/** 精度 */
const Accuracy = 0.01;
/** 惯性移动触发间隔时间（毫秒） */
const Inertia_Trigger_Time = 200;
/** 惯性移动触发间隔距离（像素）*/
const Inertia_Trigger_Distance = 50;
/** 地图扩大宽度 */
const Map_Dilatation_Width = 0;
/** 地图扩大高度 */
const Map_Dilatation_Height = 0;

const LIMIT_MIN_SCALE: number = 1;
const LIMIT_MAX_SCALE: number = 2;

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
    /** 位置寄存 */
    private dir: cc.Vec3 = new cc.Vec3();
    /** 地图像素宽度 */
    private width: number = 0;
    /** 地图像素高度 */
    private height: number = 0;
    /** 跟随目标的位置 */
    private follow_position: cc.Vec3 = new cc.Vec3();

    /** --- 惯性移动计算相关变量 --- */
    private inertia: boolean = true;
    private inertiaTime!: number;
    private inertiaStart!: cc.Vec2;
    private inertiaVector: cc.Vec3 = new cc.Vec3();

    /** --- 拖拽到边缘触发地图移动 --- */
    private isMapMove = true;

    /** --- 视野数据 --- */
    private recordLastPos: cc.Vec3
    private tileLabel: Map<string, cc.Node>
    private lightTileLabel: Map<string, cc.Node>

    private getSize(): cc.Size {
        return this.nodeParent.getContentSize();
    }

    protected onLoad() {
        this.tiledmap = this.node.getComponent(cc.TiledMap)
        this.nodeParent = this.node.parent!;
        var mapSize = this.tiledmap.node.getContentSize()
        this.width = mapSize.width + Map_Dilatation_Width;
        this.height = mapSize.height + Map_Dilatation_Height;
        this.addEvent();
        this.onSingleTouch = (clickPos: cc.Vec3) => {
            let tile = game.map_data_ins.pixelToTile(clickPos)
            let tileCenter = game.map_data_ins.tileToPixel(tile.x, tile.y)
            window["Game"].tiledMapUI.updateTouchLab(tileCenter)
        }
    }

    canvasCenterToMap(): cc.Vec3 {
        let canvas = cc.find("Canvas")
        let worldPos = canvas.convertToWorldSpaceAR(cc.v3())
        return this.node.convertToNodeSpaceAR(worldPos)
    }

    setTarget(node: cc.Node) {
        this.target = node
    }

    setMapByTarget(pos: cc.Vec3) {
        this.follow_position.x = -pos.x;
        this.follow_position.y = -pos.y;
        var pos = this.checkPos(this.follow_position);
        this.node!.position = pos;
    }

    lateUpdate(dt: number) {
        if (this.target && this.target.isValid) {
            this.follow_position.x = -this.target.position.x;
            this.follow_position.y = -this.target.position.y;
            var pos = this.checkPos(this.follow_position);
            this.node.position = game.util_vec3.lerp(this.node.position, pos, 0.5);
        }

        if (this.inertia) {
            this.inertiaVector = this.inertiaVector.lerp(cc.Vec3.ZERO, dt * 3)
            this.dir.set(this.inertiaVector);
            this.dealPos();
            if (this.inertiaVector.fuzzyEquals(cc.Vec3.ZERO, Accuracy)) {
                this.inertia = false;
                this.dir.set(cc.Vec3.ZERO);
                this.inertiaVector.set(cc.Vec3.ZERO);
            }
        }

        if (this.isMapMove) {
            this.dealPos();
        }

        let canvasCenterPos = this.canvasCenterToMap()
        if (!this.recordLastPos || !this.recordLastPos.fuzzyEquals(canvasCenterPos, 5)) {
            this.recordLastPos = canvasCenterPos
            let tile = game.map_data_ins.pixelToTile(canvasCenterPos)
            let tileCenter = game.map_data_ins.tileToPixel(tile.x, tile.y)
            // this.calcDiamondView(tile.x, tile.y)
            this.calcSquareView()
            window["Game"].tiledMapUI.updateCenterLab(tileCenter)
        }

    }

    private justShowView() {
        do {
            let one = this.lightTileLabel.entries().next()?.value
            if (!one) continue
            let key = one[0]
            let value = one[1]
            if (!key || !value) continue
            this.lightTileLabel.delete(key)
            value.active = false
        } while (this.lightTileLabel.size > 0);
    }

    private isFirst = true
    private calcSquareView(): cc.Vec3[] {
        if (!this.isFirst) return
        this.isFirst = false
        if (!this.tileLabel) this.tileLabel = new Map()
        if (!this.lightTileLabel) this.lightTileLabel = new Map()
        this.justShowView()
        let vertices = game.map_data_ins.getSquareVertices(cc.size(300, 500))
        let viewData = game.map_data_ins.getSquareView(vertices)
        this.showView(viewData)
        return viewData
    }

    private calcDiamondView(tileX: number, tileY: number): cc.Vec3[] {
        if (!this.tileLabel) this.tileLabel = new Map()
        if (!this.lightTileLabel) this.lightTileLabel = new Map()
        this.justShowView()
        let viewData = game.map_data_ins.getDiamondView(tileX, tileY, 9)
        this.showView(viewData)
        return viewData
    }

    private showView(viewData: cc.Vec3[]) {
        viewData.forEach(tile => {
            let name = `${tile.x}_${tile.y}`
            if (!this.tileLabel.has(name)) {
                let pos = game.map_data_ins.tileToPixel(tile.x, tile.y)
                let node = new cc.Node(name)
                let label = node.addComponent(cc.Label)
                // label.string = `${name} (${pos.x},${pos.y})`
                // label.string = `${game.map_data_ins.tileToGID(tile.x, tile.y)}`
                label.string = `${name}`
                label.fontSize = 15
                label.verticalAlign = cc.Label.VerticalAlign.CENTER
                node.color = tile.z ? cc.Color.RED : cc.Color.BLUE
                node.parent = this.node
                node.setPosition(pos)
                this.tileLabel.set(name, node)
                this.lightTileLabel.set(name, node)
            }
            else {
                this.tileLabel.get(name).active = true
                this.lightTileLabel.set(name, this.tileLabel.get(name))
            }
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
            var scX = scale;
            var disScale = scX - this.node.scaleX;
            var offSetPos = pos.scale(cc.v2(disScale, disScale));
            var mapPos = this.node.getPosition().sub(offSetPos);
            this.node.position = this.checkPos(cc.v3(mapPos.x, mapPos.y))
            this.node.scale = scale
        }
        else if (touches.length === 1) {
            if (this.isMoving || this.canStartMove(touches[0])) {
                this.isMoving = true;
                let delta = touches[0].getDelta();
                delta = delta.multiplyScalar(1 / cc.view.getScaleX());
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
            if (inertia < Inertia_Trigger_Time && distance > Inertia_Trigger_Distance) {
                this.inertiaVector = this.inertiaVector.normalize();
                cc.Vec3.multiplyScalar(this.inertiaVector, this.inertiaVector, distance / 5);
                this.inertia = true;
            }

            if (!this.isMoving) {
                if (this.onSingleTouch) {
                    let nodePos = this.getScreenPosToMapPos(event);
                    this.onSingleTouch(nodePos);
                }
            }

            this.reset();
        }
    }

    private onMouseWheel(evt: cc.Event.EventMouse) {
        const scroll = evt.getScrollY();
        const scale = this.checkScale(this.node.scale + (scroll >= 0 ? 0.1 : -0.1));
        var pos = this.node.convertToNodeSpaceAR(evt.getLocation());
        var disScale = scale - this.node.scale;
        var offSetPos = pos.scale(cc.v2(disScale, disScale));
        var mapPos = this.node.getPosition().sub(offSetPos);
        this.node.position = this.checkPos(cc.v3(mapPos.x, mapPos.y))
        this.node.scale = scale
    }

    reset() {
        this.dir.set(cc.Vec3.ZERO);
        this.isMoving = false;
        this.isMapMove = false;
    }

    getScreenPosToMapPos(event: cc.Event.EventTouch): cc.Vec3 {
        let uil = event.getLocation();
        let worldPos: cc.Vec3 = cc.v3(uil.x, uil.y);
        let mapPos: cc.Vec3 = this.node.convertToNodeSpaceAR(worldPos);
        return mapPos;
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
        var size = this.getSize();
        let horizontalDistance: number = Math.floor(Math.abs((size.width - this.width * this.node!.scaleX) / 2));
        let verticalDistance: number = Math.floor(Math.abs((size.height - this.height * this.node!.scaleY) / 2));
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
}