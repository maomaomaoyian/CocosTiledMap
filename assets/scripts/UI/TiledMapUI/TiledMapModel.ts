import { game } from "../../Game";

/**
 * @author 弱不禁风小书生
 */
export class TiledMapModel {
    private static _instance: TiledMapModel;
    static get instance() {
        if (!this._instance) {
            this._instance = new TiledMapModel();
        }
        return this._instance;
    }

    /** <房间号>，<GID,网格> */
    private $roooom: Map<number, Map<number, cc.Vec2>> = new Map()
    /** <GID, 房间号> */
    private $roooomGID: Map<number, number> = new Map()
    /** 已经预设 */
    private alreadyPreset: boolean
    /** 视野顶点 */
    public viewVertices: cc.Vec3[]
    /** (测试)路线起点 */
    public pathStart: [number, number]
    /** (测试)路线终点 */
    public pathEnd: [number, number]

    allotRoooom(row?: number, col?: number) {
        if (row <= 0 || col <= 0) return
        if (row === undefined || row === null) {
            row = game.PRESET_WIDTH
        }
        if (col === undefined || col === null) {
            col = game.PRESET_HEIGHT
        }
        if (!this.alreadyPreset || (this.alreadyPreset && (row !== game.PRESET_WIDTH || col !== game.PRESET_HEIGHT))) {
            this.$roooom = new Map()
            this.$roooomGID = new Map()
            let roomId: number = 0
            for (let roooomY = 0; roooomY < Math.ceil(col / game.ROOM_COL); roooomY++) {
                for (let roooomX = 0; roooomX < Math.ceil(row / game.ROOM_ROW); roooomX++) {
                    let tiles = new Map()
                    this.$roooom.set(roomId, tiles)
                    for (let gridX = 0; gridX < game.ROOM_ROW; gridX++) {
                        for (let gridY = 0; gridY < game.ROOM_COL; gridY++) {
                            let x = roooomX * game.ROOM_ROW + gridX
                            let y = roooomY * game.ROOM_COL + gridY
                            if (!game.isOutIndex(row, col, x, y)) {
                                let tile = cc.v2(x, y)
                                let gid = game.tileToGID(row, col, x, y)
                                tiles.set(gid, tile)
                                this.$roooomGID.set(gid, roomId)
                            }
                        }
                    }
                    roomId += 1
                }
            }
            this.alreadyPreset = true
        }

        game.PRINT && console.error(this.$roooom.size, this.$roooomGID.size)
    }

}

