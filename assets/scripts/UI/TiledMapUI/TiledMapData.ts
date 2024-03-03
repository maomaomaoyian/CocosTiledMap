import { game } from "../../Game";
const { ccclass } = cc._decorator;

/**
 * @author panda
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

    row: number = 0;
    col: number = 0;
    maxCount: number = 0;
    tiledWidth: number = 0;
    tiledHeight: number = 0;
    tiledWidthHalf: number = 0;
    tiledHeightHalf: number = 0;
    width: number = 0;
    height: number = 0;
    widthHalf: number = 0;
    heightHalf: number = 0;
    tiledmap: cc.TiledMap = null!;
    barrier: Set<number> = new Set();

    init(tiledmapNode: cc.Node) {
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

    findPath(sX: number, sY: number, eX: number, eY: number): [number, number][] {
        let t0 = cc.sys.now();
        let astar = new game.road_astar(this.row, this.col, false);
        let path = astar.findPath(sX, sY, eX, eY, this.barrier);
        game.PRINT && console.info("耗时（ms）：", cc.sys.now() - t0);
        this.drawPath(path);
        return path
    }

    drawPath(path: [number, number][]) {
        if (!path.length) return;
        let node = this.tiledmap.node;
        let lineNode = node.getChildByName("lineNode") || new cc.Node("lineNode");
        if (!lineNode.parent) lineNode.parent = node;

        let graphics =
            lineNode.getComponent(cc.Graphics) || lineNode.addComponent(cc.Graphics);
        graphics.clear();
        graphics.strokeColor = cc.Color.GREEN;
        graphics.lineWidth = 5;
        let vec2 = null;
        vec2 = this.tileToPixel(path[0][0], path[0][1]);
        graphics.moveTo(vec2.x, vec2.y);
        path.forEach((one) => {
            vec2 = this.tileToPixel(one[0], one[1]);
            graphics.lineTo(vec2.x, vec2.y);
        });
        graphics.stroke();
    }

    setBarrier() {
        for (let x = 0; x < this.row; x++) {
            for (let y = 0; y < this.col; y++) {
                let isBarrier = this.isBarrier(x, y);
                isBarrier && this.barrier.add(game.tileToGID(this.row, this.col, x, y));
            }
        }
        game.PRINT && console.log("障碍录入完毕")
    }

    isBarrier(tiledX: number, tiledY: number): boolean {
        let gid = game.tileToGID(this.row, this.col, tiledX, tiledY);
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

    pixelToTile(gamePos: cc.Vec3): cc.Vec3 {
        let size = new cc.Size(
            this.maxCount * this.tiledWidth,
            this.maxCount * this.tiledHeight
        );
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

    tileToPixel(tiledX: number, tiledY: number): cc.Vec3 {
        let pos = new cc.Vec3();
        const SideLength = (this.row + this.col) / 2;
        const ZeroWidthGrid = this.col / 2 + 0.5;
        const ZeroHeightGrid = SideLength;
        const TileGridSize = cc.size(
            ZeroWidthGrid + (tiledX - tiledY) * 0.5,
            ZeroHeightGrid + (-tiledX - tiledY) * 0.5
        );
        pos.x =
            TileGridSize.width * this.tiledWidth -
            this.widthHalf -
            this.tiledWidthHalf;
        pos.y =
            TileGridSize.height * this.tiledHeight -
            this.heightHalf -
            this.tiledHeightHalf;
        return pos;
    }

    getSquareVertices(viewArea: cc.Size): cc.Vec3[] {
        const CanvasCenter = window["Game"].tiledMapUI.comp_control.canvasCenterToMap()

        const left_up = cc.v3(CanvasCenter.x - viewArea.width / 2, CanvasCenter.y + viewArea.height / 2)
        const right_up = cc.v3(CanvasCenter.x + viewArea.width / 2, CanvasCenter.y + viewArea.height / 2)
        const left_down = cc.v3(CanvasCenter.x - viewArea.width / 2, CanvasCenter.y - viewArea.height / 2)
        const right_down = cc.v3(CanvasCenter.x + viewArea.width / 2, CanvasCenter.y - viewArea.height / 2)

        const left_up_tile = this.pixelToTile(left_up)
        left_up_tile.x -= 1
        const right_up_tile = this.pixelToTile(right_up)
        right_up_tile.y -= 1
        const left_down_tile = this.pixelToTile(left_down)
        left_down_tile.y += 1
        const right_down_tile = this.pixelToTile(right_down)
        right_down_tile.x += 1

        return [left_up_tile, right_up_tile, left_down_tile, right_down_tile]
    }

    getSquareView(vertices: cc.Vec3[]): cc.Vec3[] {
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
        for (let index = 0; index < leftBorderTiles.length; index++) {
            let startTile = leftBorderTiles[index]
            let endTile = rightBorderTiles[index]
            let x = startTile.x
            let yMin = Math.min(startTile.y, endTile.y)
            let yMax = Math.max(startTile.y, endTile.y)
            for (let y = yMax; y >= yMin; y--) {
                let tile = cc.v3(x, y)
                if (game.isOutIndex(this.row, this.col, tile.x, tile.y)) continue;
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

    getDiamondView(tiledX: number, tiledY: number, R: number): cc.Vec3[] {
        let start = cc.v3(tiledX - R, tiledY - R);
        let len = R * 2 + 1;
        let arr: cc.Vec3[] = [];
        for (let y = 0; y < len; y++) {
            for (let x = 0; x < len; x++) {
                let tile = cc.v3(start.x + x, start.y + y);
                if (game.isOutIndex(this.row, this.col, tile.x, tile.y)) continue;
                arr.push(tile);
            }
        }
        return arr;
    }


}
