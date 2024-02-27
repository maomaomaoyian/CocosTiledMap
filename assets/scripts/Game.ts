import { TiledMapControl } from "./UI/TiledMapUI/TiledMapControl";
import { TiledMapData } from "./UI/TiledMapUI/TiledMapData";
import TiledMapUI from "./UI/TiledMapUI/TiledMapUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Game extends cc.Component {

    public tiledMapData: TiledMapData

    public tiledMapControl: TiledMapControl

    protected onLoad(): void {
        // 以1000x1000地图来讲，在加载预设时候同时加载地图依赖资源会比只加载地图节约一半入场时间。
        this.loadRes("UI/TiledMapUI/TiledMapUI", cc.Prefab, (err: Error, res: cc.Prefab) => {
            if (!err) {
                let ui = cc.instantiate(res) as cc.Node
                this.node.parent.addChild(ui)
                ui.setPosition(0, 0)
                ui.addComponent(TiledMapUI)
            }
        })
    }

    private loadRes<T>(url: string, type: typeof cc.Asset, callback: (error: Error, res: T) => void) {
        cc.loader.loadRes(url, type, (err, res) => {
            callback(err, res)
        })
    }
}
