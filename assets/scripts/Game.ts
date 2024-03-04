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

    /** 地形层级 */
    export enum Layer { BARRIER = "barrier", FLOOR = "floor", }
    /** 视野刷新粒度枚举 */
    export enum VIEW_PARTICAL { TILE, PIXEL }

    /** 开发模式 */
    export const DEV = true
    /** 打印日志 */
    export const PRINT = true
    /** 视野范围 */
    export const VIEW = cc.winSize
    /** 实时视野 */
    export const VIEW_REALTIME = true
    /** 视野更新精度 */
    export const VIEW_UPDATE_PARTICAL = VIEW_PARTICAL.TILE
    /** 房间横向跨度 */
    export const ROOM_ROW = 30
    /** 房间纵向跨度 */
    export const ROOM_COL = 60
    /** 房间预设高度 */
    export const PRESET_HEIGHT = 1000
    /** 房间预设宽度 */
    export const PRESET_WIDTH = 1000

    export function isNodeInCamera(node: cc.Node): boolean {
        let camera = cc.find("Canvas").getChildByName("Main Camera").getComponent(cc.Camera);
        let worldPos = node.convertToWorldSpaceAR(cc.Vec3.ZERO);
        let viewArea = camera.getWorldToScreenPoint(worldPos);
        return (viewArea.x <= cc.winSize.width && worldPos.x >= 0 && viewArea.y <= cc.winSize.height && worldPos.y >= 0);
    }

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

    /**
     * 两向量是否相交
     * @param line1 
     * @param line2 
     * @returns 
     */
    export function isIntersect(line1: [number, number][], line2: [number, number][]): boolean {
        const [[x1, y1], [x2, y2]] = line1;
        const [[x3, y3], [x4, y4]] = line2;
        const crossProduct = ([x1, y1]: [number, number], [x2, y2]: [number, number]) => x1 * y2 - x2 * y1;
        const d1 = crossProduct([x2 - x1, y2 - y1], [x3 - x1, y3 - y1]);
        const d2 = crossProduct([x2 - x1, y2 - y1], [x4 - x1, y4 - y1]);
        const d3 = crossProduct([x4 - x3, y4 - y3], [x1 - x3, y1 - y3]);
        const d4 = crossProduct([x4 - x3, y4 - y3], [x2 - x3, y2 - y3]);
        return d1 * d2 < 0 && d3 * d4 < 0;
    }

    /**
     * 路线是否在视野
     * @returns 
     */
    export function isPathInView(viewVertices: cc.Vec2[], viewData: Map<number, cc.Vec2>, pathLine: [[number, number], [number, number]]): boolean {
        const pointA = pathLine[0]
        const pointB = pathLine[1]
        const getGID = (point: [number, number]) => game.tileToGID(game.map_data_ins.row, game.map_data_ins.col, point[0], point[1])
        const pointAGID = getGID(pointA)
        const pointBGID = getGID(pointB)
        if (viewData.has(pointAGID) || viewData.has(pointBGID)) return true

        const vec0 = viewVertices[0]
        const vec1 = viewVertices[1]
        const vec2 = viewVertices[2]
        const vec3 = viewVertices[3]
        let bool = game.isIntersect([game.mapModel.pathStart, game.mapModel.pathEnd], [[vec0.x, vec0.y], [vec3.x, vec3.y]])
        if (!bool) {
            bool = game.isIntersect([game.mapModel.pathStart, game.mapModel.pathEnd], [[vec1.x, vec1.y], [vec2.x, vec2.y]])
        }
        return bool
    }

    /**
     * 获取视野顶点
     * @param viewCenter 
     * @param viewArea 
     * @returns 
     */
    export function getSquareVertices(viewCenter: cc.Vec3, viewArea: cc.Size): cc.Vec3[] {
        const left_up = cc.v3(viewCenter.x - viewArea.width / 2, viewCenter.y + viewArea.height / 2)
        const right_up = cc.v3(viewCenter.x + viewArea.width / 2, viewCenter.y + viewArea.height / 2)
        const left_down = cc.v3(viewCenter.x - viewArea.width / 2, viewCenter.y - viewArea.height / 2)
        const right_down = cc.v3(viewCenter.x + viewArea.width / 2, viewCenter.y - viewArea.height / 2)

        const left_up_tile = game.map_data_ins.pixelToTile(left_up)
        left_up_tile.x -= 1
        const right_up_tile = game.map_data_ins.pixelToTile(right_up)
        right_up_tile.y -= 1
        const left_down_tile = game.map_data_ins.pixelToTile(left_down)
        left_down_tile.y += 1
        const right_down_tile = game.map_data_ins.pixelToTile(right_down)
        right_down_tile.x += 1

        return [left_up_tile, right_up_tile, left_down_tile, right_down_tile]
    }

    /**
     * 获取矩形视野
     * @param vertices 
     * @returns 
     */
    export function getSquareView(vertices: cc.Vec3[]): cc.Vec3[] {
        let left_up_tile: cc.Vec3 = vertices[0],
            right_up_tile: cc.Vec3 = vertices[1],
            left_down_tile: cc.Vec3 = vertices[2],
            right_down_tile: cc.Vec3 = vertices[3]

        let leftBorderTiles: cc.Vec3[] = (() => {
            let arr: cc.Vec3[] = []
            let idx = 0
            let add: boolean = false
            for (let x = left_up_tile.x; x <= right_down_tile.x; x++) {
                let y = !add ? left_up_tile.y + idx : right_up_tile.y + idx
                arr.push(cc.v3(x, y))
                if (y === right_up_tile.y) {
                    add = true
                    idx = 0
                }
                idx = add ? idx + 1 : idx - 1
            }
            return arr
        })()

        let rightBorderTiles: cc.Vec3[] = (() => {
            let arr: cc.Vec3[] = []
            let idx = 0
            let add: boolean = true
            for (let x = left_up_tile.x; x <= right_down_tile.x; x++) {
                let y = add ? left_up_tile.y + idx : left_down_tile.y + idx
                arr.push(cc.v3(x, y))
                if (y === left_down_tile.y) {
                    add = false
                    idx = 0
                }
                idx = add ? idx + 1 : idx - 1
            }
            return arr
        })()

        let returnArr: cc.Vec3[] = []
        const row = game.map_data_ins.row
        const col = game.map_data_ins.col
        for (let index = 0; index < leftBorderTiles.length; index++) {
            let startTile = leftBorderTiles[index]
            let endTile = rightBorderTiles[index]
            let x = startTile.x
            let yMin = Math.min(startTile.y, endTile.y)
            let yMax = Math.max(startTile.y, endTile.y)
            for (let y = yMax; y >= yMin; y--) {
                let tile = cc.v3(x, y)
                if (game.isOutIndex(row, col, tile.x, tile.y)) continue;
                if ((tile.x === left_up_tile.x && tile.y === left_up_tile.y)
                    || (tile.x === right_up_tile.x && tile.y === right_up_tile.y)
                    || (tile.x === left_down_tile.x && tile.y === left_down_tile.y)
                    || (tile.x === right_down_tile.x && tile.y === right_down_tile.y)) {
                    tile.z = 1
                }
                returnArr.push(tile)
            }
        }
        return returnArr
    }

    /**
     * 获取菱形视野
     * @param tiledX 
     * @param tiledY 
     * @param R 
     * @returns 
     */
    export function getDiamondView(tiledX: number, tiledY: number, R: number): cc.Vec3[] {
        const start = cc.v3(tiledX - R, tiledY - R);
        const len = R * 2 + 1;
        const row = game.map_data_ins.row
        const col = game.map_data_ins.col
        let arr: cc.Vec3[] = [];
        for (let y = 0; y < len; y++) {
            for (let x = 0; x < len; x++) {
                let tile = cc.v3(start.x + x, start.y + y);
                if (game.isOutIndex(row, col, tile.x, tile.y)) continue;
                arr.push(tile);
            }
        }
        return arr;
    }

}
