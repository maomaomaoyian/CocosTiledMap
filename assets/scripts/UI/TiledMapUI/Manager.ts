import { EntityMove } from "./model/multiton/Move";
import { TiledMapControl } from "./TiledMapControl";
import { TiledMapData } from "./model/singleton/TiledMapData";
import { TiledMapModel } from "./model/singleton/TiledMapModel";
import TiledMapUI from "./TiledMapUI";
import { ViewData } from "./model/singleton/ViewData";
import { ViewGrid } from "./model/singleton/ViewGrid";
import { ViewRect } from "./model/singleton/ViewRect";
import { AStar } from "./utils/AStar";
import { APoint } from "./model/multiton/Point";
import { PriorityQueue } from "./utils/PriorityQueue";
import { VecUtil } from "./utils/VecUtil";

export module game {
    /** 枚举 */
    export enum Layer { BARRIER = "barrier", FLOOR = "floor" }
    export enum VIEW_PARTICAL { TILE, PIXEL }

    export const util_vec = VecUtil
    export const util_queue = PriorityQueue
    export const road_astar = AStar
    export const road_apoint = APoint
    export type road_apoint = APoint
    export const map_control = TiledMapControl
    export type map_control = TiledMapControl
    export type map_ui = TiledMapUI
    export const map_ui = TiledMapUI
    export const map_data = TiledMapData.instance
    export const map_model = TiledMapModel.instance
    export const view_data = ViewData.instance
    export const view_grid = ViewGrid.instance
    export const view_rect = ViewRect.instance
    export const action_move = EntityMove

    /** 开发调试 */
    export const DEV = true
    export const PRINT = true
    export const VIEW_REALTIME_CALC = true
    export const VIEW_REALTIME_FILL: boolean = true
    export const VIEW_UPDATE_PARTICAL = VIEW_PARTICAL.TILE

    /** 固定参数 */
    export const VIEW = cc.winSize
    export const ROOM_ROW = 50
    export const ROOM_COL = 50

    export function preview() {
        return cc.size(game.VIEW.width * 6, game.VIEW.height * 3)
    }

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
        return cc.v3(gid % row, Math.floor(gid / row));
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

    export function calcTowVerticesDis(vertexA: cc.Vec3, vertexB: cc.Vec3): number {
        let vertexAPos = game.map_data.tileToPixel(vertexA.x, vertexA.y)
        let vertexBPos = game.map_data.tileToPixel(vertexB.x, vertexB.y)
        return game.util_vec.distance(vertexAPos, vertexBPos)
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
        const getGID = (point: [number, number]) => game.tileToGID(game.map_data.row, game.map_data.col, point[0], point[1])
        const pointAGID = getGID(pointA)
        const pointBGID = getGID(pointB)
        if (viewData.has(pointAGID) || viewData.has(pointBGID)) return true

        const vec0 = viewVertices[0]
        const vec1 = viewVertices[1]
        const vec2 = viewVertices[2]
        const vec3 = viewVertices[3]
        let bool = game.isIntersect([game.map_model.testPathStart, game.map_model.testPathEnd], [[vec0.x, vec0.y], [vec3.x, vec3.y]])
        if (!bool) {
            bool = game.isIntersect([game.map_model.testPathStart, game.map_model.testPathEnd], [[vec1.x, vec1.y], [vec2.x, vec2.y]])
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

        const left_up_tile = game.map_data.pixelToTile(left_up)
        left_up_tile.x -= 1
        const right_up_tile = game.map_data.pixelToTile(right_up)
        right_up_tile.y -= 1
        const left_down_tile = game.map_data.pixelToTile(left_down)
        const right_down_tile = game.map_data.pixelToTile(right_down)
        if (left_up_tile.y % 2 === 0) {
            if (left_down_tile.y % 2 === 0) {
                left_down_tile.addSelf(cc.v3(0, 1))
                right_down_tile.addSelf(cc.v3(1, 0))
            }
        }
        else {
            if (left_down_tile.y % 2 !== 0) {
                left_down_tile.addSelf(cc.v3(0, 1))
                right_down_tile.addSelf(cc.v3(1, 0))
            }
        }
        left_down_tile.y += 1
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
        const row = game.map_data.row
        const col = game.map_data.col
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
        const row = game.map_data.row
        const col = game.map_data.col
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

    /**
     * 根据地块计算房间ID
     * @param tile 
     * @returns 
     */
    export function getRoomIdByTile(tile: cc.Vec2) {
        if (tile.x < 0 || tile.y < 0) return -1
        tile = tile.add(cc.v2(1, 1))
        let { x, y } = tile
        let roomx = Math.ceil(x / game.ROOM_ROW)
        let roomy = Math.ceil(y / game.ROOM_COL)
        let roomxnum = Math.ceil(game.map_data.row / game.ROOM_ROW)
        let roomid = (roomy - 1) * roomxnum + roomx
        return roomid
    }

    /**
     * 根据房间ID获取房间的行列
     * @param roomId 
     * @returns 
     */
    export function getRoomRowCol(roomId: number) {
        let roomWidth = game.ROOM_ROW
        let roomxnum = Math.ceil(game.map_data.row / roomWidth)
        let row = Math.ceil(roomId / roomxnum)
        let col = roomId % roomxnum === 0 ? roomxnum : roomId % roomxnum
        return cc.v2(row, col)
    }

    /**
     * 获得房间顺时针四顶点
     * @param roomId 
     * @returns 
     */
    export function getRoomClockwiseVertices(roomId: number) {
        let roomWidth = game.ROOM_ROW
        let roomHeight = game.ROOM_COL
        let rowcol = game.getRoomRowCol(roomId)
        let x = (rowcol.y - 1) * roomWidth
        let y = (rowcol.x - 1) * roomHeight
        let maxx = Math.min(map_data.row, x + roomWidth) - 1
        let maxy = Math.min(map_data.col, y + roomHeight) - 1
        return [cc.v2(x, y), cc.v2(maxx, y), cc.v2(maxx, maxy), cc.v2(x, maxy)]
    }
}
