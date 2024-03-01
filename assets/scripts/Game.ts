import { EntityMove } from "./UI/TiledMapUI/Move";
import { TiledMapControl } from "./UI/TiledMapUI/TiledMapControl";
import { TiledMapData } from "./UI/TiledMapUI/TiledMapData";
import TiledMapUI from "./UI/TiledMapUI/TiledMapUI";
import { AStar } from "./UI/road/AStar";
import { APoint } from "./UI/road/Point";
import { PriorityQueue } from "./UI/utils/PriorityQueue";
import { VecUtil } from "./UI/utils/VecUtil";

const { ccclass } = cc._decorator;
/**
 * @author panda
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
    export const PRINT = true
    export const util_vec = VecUtil
    export const util_queue = PriorityQueue
    export const road_astar = AStar
    export const road_apoint = APoint
    export type road_apoint = APoint
    export const map_control = TiledMapControl
    export type map_control = TiledMapControl
    export const action_move = EntityMove
    export const map_data_ins = TiledMapData.instance
    export const VIEW = cc.winSize

    export const roomX = 30
    export const roomY = 60
    export const presetHeight = 1000
    export const presetWidth = 1000
    export const realTimeOfView = true

    export function isInView(node: cc.Node): boolean {
        let camera = cc
            .find("Canvas")
            .getChildByName("Main Camera")
            .getComponent(cc.Camera);
        let worldPos = node.convertToWorldSpaceAR(cc.Vec3.ZERO);
        let viewArea = camera.getWorldToScreenPoint(worldPos);
        return (
            viewArea.x <= cc.winSize.width &&
            worldPos.x >= 0 &&
            viewArea.y <= cc.winSize.height &&
            worldPos.y >= 0
        );
    }

    /** GID既是下标也是渲染深度 */
    export function tileToGID(row: number, col: number, tiledX: number, tiledY: number) {
        return tiledY * row + tiledX;
    }

    export function GIDToTild(row: number, col: number, gid: number) {
        return cc.v3(gid % row, gid / row);
    }

    export function isOutIndex(row: number, col: number, tiledX: number, tiledY: number) {
        return tiledX < 0 || tiledY < 0 || tiledX >= row || tiledY >= col;
    }

    export function mergeMaps<t, t1>(map1: Map<t, t1>, map2: Map<t, t1>): Map<t, t1> {
        const resultMap = new Map(map1);
        for (const [key, value] of map2) {
            resultMap.set(key, value);
        }
        return resultMap;
    }
}
