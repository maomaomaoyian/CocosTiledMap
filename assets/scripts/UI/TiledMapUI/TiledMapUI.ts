import { game } from "./Manager";

/**
 * @author 弱不禁风小书生
 */
const { ccclass } = cc._decorator;
@ccclass
export default class TiledMapUI extends cc.Component {
    private n_tiledMap: cc.Node
    private n_center: cc.Node
    private b_bind: cc.Button
    private b_unbind: cc.Button
    private e_startPos: cc.EditBox
    private e_endPos: cc.EditBox
    private e_speed: cc.EditBox
    private b_findPath: cc.Button
    private l_touch: cc.Label
    private l_center: cc.Label

    public comp_control: game.map_control

    public onLoad(): void {
        game.map_model.$TiledMapUI = this

        this.n_tiledMap = cc.find("n_tiledMap", this.node)
        this.n_center = cc.find("n_center", this.n_tiledMap)
        this.b_bind = cc.find("b_bind", this.node).getComponent(cc.Button)
        this.b_unbind = cc.find("b_unbind", this.node).getComponent(cc.Button)
        this.e_startPos = cc.find("e_startPos", this.node).getComponent(cc.EditBox)
        this.e_endPos = cc.find("e_endPos", this.node).getComponent(cc.EditBox)
        this.e_speed = cc.find("e_speed", this.node).getComponent(cc.EditBox)
        this.b_findPath = cc.find("b_findPath", this.node).getComponent(cc.Button)
        this.l_center = cc.find("l_center", this.node).getComponent(cc.Label)
        this.l_touch = cc.find("l_touch", this.node).getComponent(cc.Label)
        this.e_startPos.string = "0,0"
        this.e_endPos.string = "30,30"
        this.e_speed.string = "0.05"

        game.map_data.init(this.n_tiledMap)
        this.n_tiledMap.addComponent(game.map_control)

        this.onEvt()
    }

    private onEvt() {
        this.b_bind.node.on(cc.Node.EventType.TOUCH_END, this.onBind, this);
        this.b_unbind.node.on(cc.Node.EventType.TOUCH_END, this.onUnBind, this);
        this.b_findPath.node.on(cc.Node.EventType.TOUCH_END, this.onFindPath, this);
    }

    private onBind() {
        game.map_model.$TiledMapControl.setTarget(this.n_center)
    }

    private onUnBind() {
        game.map_model.$TiledMapControl.setTarget(null)
    }

    private onFindPath() {
        let startArr = this.e_startPos.string.split(",")
        let endArr = this.e_endPos.string.split(",")
        let sX = Number(startArr[0])
        let sY = Number(startArr[1])
        let eX = Number(endArr[0])
        let eY = Number(endArr[1])
        let speed = Number(this.e_speed.string)
        let path = game.map_data.findPath(sX, sY, eX, eY)
        let moveClz = new game.action_move(path, this.n_center, speed)
        moveClz.run()
        this.onBind()
    }

    public updateTouchLab(pos: cc.Vec3) {
        if (!game.DEV) return
        let tile = game.map_data.pixelToTile(pos)
        let roomId = game.getRoomIdByTile(tile)
        this.l_touch.string = `屏幕触摸位置：${tile.x}_${tile.y} (${pos.x},${pos.y})房间号：${roomId}`
    }

    public updateCenterLab(pos: cc.Vec3) {
        if (!game.DEV) return
        let tile = game.map_data.pixelToTile(pos)
        this.l_center.string = `屏幕中心位置：${tile.x}_${tile.y} (${pos.x},${pos.y})`
    }

    public update(dt: number): void {
        if (!game.DEV) return
        let startArr = this.e_startPos.string.split(",")
        let endArr = this.e_endPos.string.split(",")
        let sX = Number(startArr[0])
        let sY = Number(startArr[1])
        let eX = Number(endArr[0])
        let eY = Number(endArr[1])
        game.map_model.testPathStart = [sX, sY]
        game.map_model.testPathEnd = [eX, eY]
    }
}
