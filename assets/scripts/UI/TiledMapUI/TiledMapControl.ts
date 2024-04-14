import { game } from "./Manager";

/**
 * @author 弱不禁风小书生
 */
const { ccclass } = cc._decorator;

/** 地图最小缩放 */
const LIMIT_MIN_SCALE: number = 1;
/** 地图最大缩放 */
const LIMIT_MAX_SCALE: number = 2;
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

    public onLoad() {
        game.map_model.$TiledMapControl = this

        this.tiledmap = this.node.getComponent(cc.TiledMap)
        this.nodeParent = this.node.parent!;
        var mapSize = this.tiledmap.node.getContentSize()
        this.pixelWidth = mapSize.width;
        this.pixelHeight = mapSize.height;
        this.onSingleTouch = (clickPos: cc.Vec3) => {
            let tile = game.map_data.pixelToTile(clickPos)
            let tileCenter = game.map_data.tileToPixel(tile.x, tile.y)
            game.map_model.$TiledMapUI.updateTouchLab(tileCenter)
            game.view_rect.drawClickRoom(tileCenter)
        }
        this.addEvent();
        this.onEnter()
    }

    private addEvent(): void {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
    }

    private onEnter() {
        this.setHomePos()
    }

    private setHomePos() {
        let homeTile = cc.v2(100, 100)
        this.setMapByTile(homeTile.x, homeTile.y)
    }

    private getScreenPosToMapPos(event: cc.Event.EventTouch): cc.Vec3 {
        let uil = event.getLocation();
        let worldPos: cc.Vec3 = cc.v3(uil.x, uil.y);
        let mapPos: cc.Vec3 = this.node.convertToNodeSpaceAR(worldPos);
        return mapPos;
    }

    public canvasCenterToMap(): cc.Vec3 {
        let canvas = cc.find("Canvas")
        let worldPos = canvas.convertToWorldSpaceAR(cc.v3())
        return this.node.convertToNodeSpaceAR(worldPos)
    }

    public setTarget(node: cc.Node) {
        this.target = node
    }

    private setMapByTile(tileX: number, tileY: number) {
        let pos = game.map_data.tileToPixel(tileX, tileY)
        pos.x = -pos.x * this.node.scale;
        pos.y = -pos.y * this.node.scale;
        this.setMapByPos(pos)
    }

    private setMapByPos(pos: cc.Vec3) {
        pos = this.checkPos(pos);
        this.node!.position = pos;
    }

    public lateUpdate(dt: number) {
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

        game.view_data.calcViewData(game.VIEW_UPDATE_PARTICAL)
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

            game.view_data.calcPreviewData(game.VIEW_UPDATE_PARTICAL)
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

    private reset() {
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
}