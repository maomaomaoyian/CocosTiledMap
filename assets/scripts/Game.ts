const { ccclass, property } = cc._decorator;
import { game } from "./UI/TiledMapUI/Manager";

/**
 * @author 弱不禁风小书生
 * 注意：
 * 1.地图很大以1000x1000网格为例，加载tmx文件时同时加载tmx依赖的美术资源。这样减少卡顿
 * 2.实时并非每帧处理，而是通过两个策略1.中心地块变化 2.距离上次位置变化超过一定范围
 */
@ccclass
export default class Game extends cc.Component {
    protected onLoad(): void {
        game.map_model.clear()
        this.loadRes("UI/TiledMapUI/TiledMapUI", cc.Prefab, (err: Error, res: cc.Prefab) => {
            if (!err) {
                let ui = cc.instantiate(res) as cc.Node
                this.node.parent.addChild(ui)
                ui.setPosition(0, 0)
                ui.addComponent(game.map_ui)
            }
        })
    }

    private loadRes<T>(url: string, type: typeof cc.Asset, callback: (error: Error, res: T) => void) {
        cc.loader.loadRes(url, type, (err, res) => {
            callback(err, res)
        })
    }
}
