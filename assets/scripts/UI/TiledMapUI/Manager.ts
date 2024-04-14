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
import { MapUtil } from "./utils/MapUtil";

export module game {


    export enum Layer { BARRIER = "barrier", FLOOR = "floor" }
    export enum VIEW_PARTICAL { TILE, PIXEL }


    export const util_vec = VecUtil
    export const util_map = MapUtil
    export const util_queue = PriorityQueue
    export const util_astar = AStar


    export const action_move = EntityMove
    export const road_apoint = APoint
    export type road_apoint = APoint


    export const map_data = TiledMapData.instance
    export const map_model = TiledMapModel.instance
    export const view_data = ViewData.instance
    export const view_grid = ViewGrid.instance
    export const view_rect = ViewRect.instance


    export const map_control = TiledMapControl
    export type map_control = TiledMapControl
    export type map_ui = TiledMapUI
    export const map_ui = TiledMapUI


    export const DEV = true
    export const PRINT = true
    export const VIEW_REALTIME_CALC = false
    export const VIEW_REALTIME_DRAW: boolean = false
    export const VIEW_UPDATE_PARTICAL = VIEW_PARTICAL.TILE


    export const VIEW = cc.winSize
    export const ROOM_ROW = 50
    export const ROOM_COL = 50

}
