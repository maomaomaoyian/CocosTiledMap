import { game } from "../../Manager";

const { ccclass } = cc._decorator;

/**
 * @author 弱不禁风小书生
 */
@ccclass
export class TiledMapData {
    private static _instance: TiledMapData;
    static get instance() {
        if (!this._instance) {
            this._instance = new TiledMapData();
        }
        return this._instance;
    }

    public row: number = 0;
    public col: number = 0;
    private maxCount: number = 0;
    private tiledWidth: number = 0;
    private tiledHeight: number = 0;
    private tiledWidthHalf: number = 0;
    private tiledHeightHalf: number = 0;
    private width: number = 0;
    private height: number = 0;
    private widthHalf: number = 0;
    private heightHalf: number = 0;
    private tiledmap: cc.TiledMap = null!;
    private barrier: Set<number> = new Set();

    public init(tiledmapNode: cc.Node) {
        this.tiledmap = tiledmapNode.getComponent(cc.TiledMap);
        this.row = this.tiledmap.getMapSize().width;
        this.col = this.tiledmap.getMapSize().height;
        this.maxCount = Math.max(this.col, this.row);
        this.tiledWidth = this.tiledmap.getTileSize().width;
        this.tiledHeight = this.tiledmap.getTileSize().height;
        this.tiledWidthHalf = this.tiledWidth / 2;
        this.tiledHeightHalf = this.tiledHeight / 2;
        this.width = this.tiledmap.node.width;
        this.height = this.tiledmap.node.height;
        this.widthHalf = this.width / 2;
        this.heightHalf = this.height / 2;
        this.setBarrier();
        game.PRINT && console.log(`地图像素宽度${this.width},地图像素高度${this.height},行${this.row},列${this.col},障碍${this.barrier.size}`);
    }

    /**
     * 寻路
     * @param sX 
     * @param sY 
     * @param eX 
     * @param eY 
     * @returns 
     */
    public findPath(sX: number, sY: number, eX: number, eY: number): [number, number][] {
        let t0 = cc.sys.now();
        let astar = new game.util_astar(this.row, this.col, false);
        let path = astar.findPath(sX, sY, eX, eY, this.barrier);
        game.PRINT && console.info("耗时（ms）：", cc.sys.now() - t0);
        game.view_rect.drawPath(path);
        return path
    }

    /**
     * 记录地形障碍
     */
    private setBarrier() {
        for (let x = 0; x < this.row; x++) {
            for (let y = 0; y < this.col; y++) {
                let isBarrier = this.isBarrier(x, y);
                isBarrier && this.barrier.add(game.util_map.tileToGID(this.row, this.col, x, y));
            }
        }
        game.PRINT && console.log("障碍录入完毕")
    }

    /**
     * 是否地形障碍
     * @param tiledX 
     * @param tiledY 
     * @returns 
     */
    private isBarrier(tiledX: number, tiledY: number): boolean {
        let gid = game.util_map.tileToGID(this.row, this.col, tiledX, tiledY);
        if (
            this.tiledmap.getLayer(game.Layer.BARRIER) &&
            this.tiledmap.getLayer(game.Layer.BARRIER).getTiles()[gid] > 0
        )
            return true;
        if (
            this.tiledmap.getLayer(game.Layer.FLOOR) &&
            this.tiledmap.getLayer(game.Layer.FLOOR).getTiles()[gid] === 0
        )
            return true;
        return false;
    }

    /**
     * 像素转换地块
     * @param gamePos 
     * @returns 
     */
    public pixelToTile(gamePos: cc.Vec3): cc.Vec3 {
        let size = new cc.Size(this.maxCount * this.tiledWidth, this.maxCount * this.tiledHeight);
        let pos = new cc.Vec3(0, 0);
        if (this.row < this.col) {
            pos.x = gamePos.x - (size.width - this.width) / 2;
            pos.y = gamePos.y + (size.height - this.height) / 2;
        } else if (this.row > this.col) {
            pos.x = gamePos.x + (size.width - this.width) / 2;
            pos.y = gamePos.y + (size.height - this.height) / 2;
        } else {
            pos.x = gamePos.x;
            pos.y = gamePos.y;
        }
        var r = new cc.Vec3(pos.x + size.width / 2, pos.y + size.height / 2);
        var tilePos: cc.Vec2 = cc.v2(r.x / this.tiledWidth, r.y / this.tiledHeight);
        var inverseTiledY = this.maxCount - tilePos.y;

        var halfMapWidth = this.maxCount / 2;
        var tileX = Math.floor(inverseTiledY + tilePos.x - halfMapWidth);
        var tileY = Math.floor(inverseTiledY - tilePos.x + halfMapWidth);

        r.x = tileX;
        r.y = tileY;

        return r;
    }

    /**
     * 地块转换像素
     * @param tiledX 
     * @param tiledY 
     * @returns 
     */
    public tileToPixel(tiledX: number, tiledY: number): cc.Vec3 {
        let pos = new cc.Vec3();
        const SideLength = (this.row + this.col) / 2;
        const ZeroWidthGrid = this.col / 2 + 0.5;
        const ZeroHeightGrid = SideLength;
        const TileGridSize = cc.size(ZeroWidthGrid + (tiledX - tiledY) * 0.5, ZeroHeightGrid + (-tiledX - tiledY) * 0.5);
        pos.x = TileGridSize.width * this.tiledWidth - this.widthHalf - this.tiledWidthHalf;
        pos.y = TileGridSize.height * this.tiledHeight - this.heightHalf - this.tiledHeightHalf;
        return pos;
    }

    public clear() {
        this.row = 0
        this.col = 0
        this.maxCount = 0
        this.tiledWidth = 0
        this.tiledHeight = 0
        this.tiledWidthHalf = 0
        this.tiledHeightHalf = 0
        this.width = 0
        this.height = 0
        this.widthHalf = 0
        this.heightHalf = 0
        this.tiledmap = null
        this.barrier = new Set()
    }
}
