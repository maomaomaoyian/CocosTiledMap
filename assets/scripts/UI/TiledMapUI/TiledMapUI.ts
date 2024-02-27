import { TiledMapControl } from "./TiledMapControl";
import { TiledMapData } from "./TiledMapData";

const { ccclass } = cc._decorator;
@ccclass
export default class TiledMapUI extends cc.Component {
    private n_tiledMap: cc.Node
    private n_center: cc.Node

    protected onLoad(): void {
        this.n_center = cc.find("n_center", this.node)
        this.n_tiledMap = cc.find("n_tiledMap", this.node)
        this.n_tiledMap.addComponent(TiledMapControl)
        TiledMapData.instance.init(this.n_tiledMap)
    }

    protected start(): void {
    }
}
