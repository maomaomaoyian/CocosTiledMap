import { EntityMove } from "./UI/TiledMapUI/Move";
import { TiledMapControl } from "./UI/TiledMapUI/TiledMapControl";
import { TiledMapData } from "./UI/TiledMapUI/TiledMapData";
import TiledMapUI from "./UI/TiledMapUI/TiledMapUI";
import { AStar } from "./UI/road/AStar";
import { APoint } from "./UI/road/Point";
import { PriorityQueue } from "./UI/utils/PriorityQueue";
import { Vec3Util } from "./UI/utils/Vec3Util";

const { ccclass } = cc._decorator;
/**
 * @author panda
 * 2024/02/29
 * 注意：地图很大以1000x1000网格为例，加载tmx文件时同时加载tmx依赖的美术资源。这样减少卡顿
 */
@ccclass
export default class Game extends cc.Component {

    private static _instance: Game;
    static get instance() {
        if (!this._instance) {
            this._instance = new Game();
        }
        return this._instance;
    }

    public tiledMapUI: TiledMapUI

    protected onLoad(): void {
        window["Game"] = this
        this.loadRes("UI/TiledMapUI/TiledMapUI", cc.Prefab, (err: Error, res: cc.Prefab) => {
            if (!err) {
                let ui = cc.instantiate(res) as cc.Node
                this.node.parent.addChild(ui)
                ui.setPosition(0, 0)
                this.tiledMapUI = ui.addComponent(TiledMapUI)
            }
        })
    }

    private loadRes<T>(url: string, type: typeof cc.Asset, callback: (error: Error, res: T) => void) {
        cc.loader.loadRes(url, type, (err, res) => {
            callback(err, res)
        })
    }
}

export module game {
    export const PRINT = false
    export const util_vec3 = Vec3Util
    export const util_queue = PriorityQueue
    export const road_astar = AStar
    export const road_apoint = APoint
    export type road_apoint = APoint
    export const map_control = TiledMapControl
    export type map_control = TiledMapControl
    export const action_move = EntityMove
    export const map_data_ins = TiledMapData.instance
}
