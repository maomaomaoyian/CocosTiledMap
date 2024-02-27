const { ccclass, property } = cc._decorator;

@ccclass
export class TiledMapData {
    private static _instance: TiledMapData
    static get instance() {
        if (!this._instance) {
            this._instance = new TiledMapData()
        }
        return this._instance
    }

    /** X 轴网格数量 */
    row: number = 0;
    /** Y 轴网格数量 */
    col: number = 0;
    /** 网格最大数量 */
    maxCount: number = 0;
    /** 单个格子宽度 */
    tiledWidth: number = 0;
    /** 单个格子高度 */
    tiledHeight: number = 0;
    /** 单个格子一半宽度 */
    tiledWidthHalf: number = 0;
    /** 单个格子一半高度 */
    tiledHeightHalf: number = 0;
    /** 地形宽度 */
    width: number = 0;
    /** 地形高度 */
    height: number = 0;
    /** 地形一半宽度 */
    widthHalf: number = 0;
    /** 地形一半高度 */
    heightHalf: number = 0;
    /** 地形对象 */
    tiledmap: cc.TiledMap = null!;

    init(tiledmapNode: cc.Node) {
        this.tiledmap = tiledmapNode.getComponent(cc.TiledMap)
        this.row = this.tiledmap.getMapSize().width
        this.col = this.tiledmap.getMapSize().height
        this.maxCount = Math.max(this.col, this.row)
        this.tiledWidth = this.tiledmap.getTileSize().width
        this.tiledHeight = this.tiledmap.getTileSize().height
        this.tiledWidthHalf = this.tiledWidth / 2
        this.tiledHeightHalf = this.tiledHeight / 2
        this.width = this.tiledmap.node.width
        this.height = this.tiledmap.node.height
        this.widthHalf = this.width / 2
        this.heightHalf = this.height / 2
    }

    calculatePixelToTile(gamePos: cc.Vec3): cc.Vec3 {
        let size = new cc.Size(this.maxCount * this.tiledWidth, this.maxCount * this.tiledHeight);
        let pos = new cc.Vec3(0, 0);
        if (this.row < this.col) {
            pos.x = gamePos.x - (size.width - this.width) / 2;
            pos.y = gamePos.y + (size.height - this.height) / 2;
        }
        else if (this.row > this.col) {
            pos.x = gamePos.x + (size.width - this.width) / 2;
            pos.y = gamePos.y + (size.height - this.height) / 2;
        }
        else {
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

    calculateTiledToPixel(tiledX: number, tiledY: number): cc.Vec3 {
        let pos = new cc.Vec3()
        const SideLength = (this.row + this.col) / 2
        const ZeroWidthGrid = this.col / 2 + 0.5
        const ZeroHeightGrid = SideLength
        const TileGridSize = cc.size(ZeroWidthGrid + (tiledX - tiledY) * 0.5, ZeroHeightGrid + (-tiledX - tiledY) * 0.5)
        pos.x = TileGridSize.width * this.tiledWidth - this.widthHalf - this.tiledWidthHalf
        pos.y = TileGridSize.height * this.tiledHeight - this.heightHalf - this.tiledHeightHalf
        return pos
    }
}
window["TiledMapData"] = TiledMapData