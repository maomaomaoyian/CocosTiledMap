import { EntityMove } from "./UI/TiledMapUI/Move";
import { TiledMapControl } from "./UI/TiledMapUI/TiledMapControl";
import { TiledMapData } from "./UI/TiledMapUI/TiledMapData";
import { TiledMapModel } from "./UI/TiledMapUI/TiledMapModel";
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
    export const mapModel = TiledMapModel.instance
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

    export enum Layer {
        BARRIER = "barrier",
        FLOOR = "floor",
    }

    export function isInCamera(node: cc.Node): boolean {
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

    export function mergeMaps<T, T1>(map1: Map<T, T1>, map2: Map<T, T1>): Map<T, T1> {
        const resultMap = new Map(map1);
        for (const [key, value] of map2) {
            resultMap.set(key, value);
        }
        return resultMap;
    }

    export function mergeSets<T>(set1: Set<T>, set2: Set<T>): Set<T> {
        const resultSet = new Set(set1);
        for (const item of set2) {
            resultSet.add(item);
        }
        return resultSet;
    }

    /** 两向量是否相交 */
    export function isIntersect(line1: [number, number][], line2: [number, number][]): boolean {
        const [[x1, y1], [x2, y2]] = line1;
        const [[x3, y3], [x4, y4]] = line2;
        // 计算向量叉积
        const crossProduct = ([x1, y1]: [number, number], [x2, y2]: [number, number]) => x1 * y2 - x2 * y1;
        const d1 = crossProduct([x2 - x1, y2 - y1], [x3 - x1, y3 - y1]);
        const d2 = crossProduct([x2 - x1, y2 - y1], [x4 - x1, y4 - y1]);
        const d3 = crossProduct([x4 - x3, y4 - y3], [x1 - x3, y1 - y3]);
        const d4 = crossProduct([x4 - x3, y4 - y3], [x2 - x3, y2 - y3]);
        return d1 * d2 < 0 && d3 * d4 < 0;
    }
}
