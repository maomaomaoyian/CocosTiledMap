import { game } from "../Manager";

/**
 * @author 弱不禁风小书生
 */
export class MapUtil {
    public static preview() {
        return cc.size(game.VIEW.width * 6, game.VIEW.height * 3)
    }

    public static isNodeInCamera(node: cc.Node): boolean {
        let camera = cc.find("Canvas").getChildByName("Main Camera").getComponent(cc.Camera);
        let worldPos = node.convertToWorldSpaceAR(cc.Vec3.ZERO);
        let viewArea = camera.getWorldToScreenPoint(worldPos);
        return (viewArea.x <= cc.winSize.width && worldPos.x >= 0 && viewArea.y <= cc.winSize.height && worldPos.y >= 0);
    }

    public static tileToGID(row: number, col: number, tiledX: number, tiledY: number) {
        return tiledY * row + tiledX;
    }

    public static GIDToTild(row: number, col: number, gid: number) {
        return cc.v3(gid % row, Math.floor(gid / row));
    }

    public static isOutIndex(row: number, col: number, tiledX: number, tiledY: number) {
        return tiledX < 0 || tiledY < 0 || tiledX >= row || tiledY >= col;
    }

    public static mergeMaps<T, T1>(map1: Map<T, T1>, map2: Map<T, T1>): Map<T, T1> {
        const resultMap = new Map(map1);
        for (const [key, value] of map2) {
            resultMap.set(key, value);
        }
        return resultMap;
    }

    public static mergeSets<T>(set1: Set<T>, set2: Set<T>): Set<T> {
        const resultSet = new Set(set1);
        for (const item of set2) {
            resultSet.add(item);
        }
        return resultSet;
    }

    public static calcTowVerticesDis(vertexA: cc.Vec3, vertexB: cc.Vec3): number {
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
    public static isIntersect(line1: [number, number][], line2: [number, number][]): boolean {
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
    public static isPathInView(viewVertices: cc.Vec2[], viewData: Map<number, cc.Vec2>, pathLine: [[number, number], [number, number]]): boolean {
        const pointA = pathLine[0]
        const pointB = pathLine[1]
        const getGID = (point: [number, number]) => this.tileToGID(game.map_data.row, game.map_data.col, point[0], point[1])
        const pointAGID = getGID(pointA)
        const pointBGID = getGID(pointB)
        if (viewData.has(pointAGID) || viewData.has(pointBGID)) return true

        const vec0 = viewVertices[0]
        const vec1 = viewVertices[1]
        const vec2 = viewVertices[2]
        const vec3 = viewVertices[3]
        let bool = this.isIntersect([game.map_model.testPathStart, game.map_model.testPathEnd], [[vec0.x, vec0.y], [vec3.x, vec3.y]])
        if (!bool) {
            bool = this.isIntersect([game.map_model.testPathStart, game.map_model.testPathEnd], [[vec1.x, vec1.y], [vec2.x, vec2.y]])
        }
        return bool
    }

    /**
     * 获取视野顶点
     * @param viewCenter 
     * @param viewArea 
     * @returns 
     */
    public static getSquareVertices(viewCenter: cc.Vec3, viewArea: cc.Size): cc.Vec3[] {
        const left_up = cc.v3(viewCenter.x - viewArea.width / 2, viewCenter.y + viewArea.height / 2)
        const right_up = cc.v3(viewCenter.x + viewArea.width / 2, viewCenter.y + viewArea.height / 2)
        const left_down = cc.v3(viewCenter.x - viewArea.width / 2, viewCenter.y - viewArea.height / 2)
        const right_down = cc.v3(viewCenter.x + viewArea.width / 2, viewCenter.y - viewArea.height / 2)

        const left_up_tile = game.map_data.pixelToTile(left_up)
        left_up_tile.x -= 1
        const right_up_tile = game.map_data.pixelToTile(right_up)
        right_up_tile.y -= 1
        const left_down_tile = game.map_data.pixelToTile(left_down)
        left_down_tile.y += 1
        const right_down_tile = game.map_data.pixelToTile(right_down)
        right_down_tile.x += 1

        return [left_up_tile, right_up_tile, left_down_tile, right_down_tile]
    }

    /**
     * 获取矩形视野
     * @param vertices 
     * @returns 
     */
    public static getSquareView(vertices: cc.Vec3[]): cc.Vec3[] {
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
                if (this.isOutIndex(row, col, tile.x, tile.y)) continue;
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
    public static getDiamondView(tiledX: number, tiledY: number, R: number): cc.Vec3[] {
        const start = cc.v3(tiledX - R, tiledY - R);
        const len = R * 2 + 1;
        const row = game.map_data.row
        const col = game.map_data.col
        let arr: cc.Vec3[] = [];
        for (let y = 0; y < len; y++) {
            for (let x = 0; x < len; x++) {
                let tile = cc.v3(start.x + x, start.y + y);
                if (this.isOutIndex(row, col, tile.x, tile.y)) continue;
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
    public static getRoomIdByTile(tile: cc.Vec3) {
        if (tile.x < 0 || tile.y < 0) return -1
        tile = tile.add(cc.v3(1, 1))
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
    public static getRoomRowCol(roomId: number) {
        let roomWidth = game.ROOM_ROW
        let roomxnum = Math.ceil(game.map_data.row / roomWidth)
        let row = Math.ceil(roomId / roomxnum)
        let col = roomId % roomxnum === 0 ? roomxnum : roomId % roomxnum
        return cc.v3(row, col)
    }

    /**
     * 获得房间顺时针四顶点
     * @param roomId 
     * @returns 
     */
    public static getRoomClockwiseVertices(roomId: number) {
        let roomWidth = game.ROOM_ROW
        let roomHeight = game.ROOM_COL
        let rowcol = this.getRoomRowCol(roomId)
        let x = (rowcol.y - 1) * roomWidth
        let y = (rowcol.x - 1) * roomHeight
        let maxx = Math.min(game.map_data.row, x + roomWidth) - 1
        let maxy = Math.min(game.map_data.col, y + roomHeight) - 1
        return [cc.v3(x, y), cc.v3(maxx, y), cc.v3(maxx, maxy), cc.v3(x, maxy)]
    }

    /**
     * !#en Test line and line
     * !#zh 测试线段与线段是否相交
     * @method lineLine
     * @param {Vec2} a1 - The start point of the first line
     * @param {Vec2} a2 - The end point of the first line
     * @param {Vec2} b1 - The start point of the second line
     * @param {Vec2} b2 - The end point of the second line
     * @return {boolean}
     */
    public static lineLine(a1, a2, b1, b2) {
        // b1->b2向量 与 a1->b1向量的向量积
        var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
        // a1->a2向量 与 a1->b1向量的向量积
        var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
        // a1->a2向量 与 b1->b2向量的向量积
        var u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
        // u_b == 0时，角度为0或者180 平行或者共线不属于相交
        if (u_b !== 0) {
            var ua = ua_t / u_b;
            var ub = ub_t / u_b;

            if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
                return true;
            }
        }

        return false;
    }

    /**
     * !#en Test line and rect
     * !#zh 测试线段与矩形是否相交
     * @method lineRect
     * @param {Vec2} a1 - The start point of the line
     * @param {Vec2} a2 - The end point of the line
     * @param {Rect} b - The rect
     * @return {boolean}
     */
    public static lineRect(a1, a2, b) {
        var r0 = new cc.Vec2(b.x, b.y);
        var r1 = new cc.Vec2(b.x, b.yMax);
        var r2 = new cc.Vec2(b.xMax, b.yMax);
        var r3 = new cc.Vec2(b.xMax, b.y);
        if (this.lineLine(a1, a2, r0, r1)) return true;
        if (this.lineLine(a1, a2, r1, r2)) return true;
        if (this.lineLine(a1, a2, r2, r3)) return true;
        if (this.lineLine(a1, a2, r3, r0)) return true;
        return false;
    }

    /**
     * !#en Test line and polygon
     * !#zh 测试线段与多边形是否相交
     * @method linePolygon
     * @param {Vec2} a1 - The start point of the line
     * @param {Vec2} a2 - The end point of the line
     * @param {Vec2[]} b - The polygon, a set of points
     * @return {boolean}
     */
    public static linePolygon(a1, a2, b) {
        var length = b.length;
        for (var i = 0; i < length; ++i) {
            var b1 = b[i];
            var b2 = b[(i + 1) % length];

            if (this.lineLine(a1, a2, b1, b2))
                return true;
        }
        return false;
    }

    /**
     * !#en Test rect and rect
     * !#zh 测试矩形与矩形是否相交
     * @method rectRect
     * @param {Rect} a - The first rect
     * @param {Rect} b - The second rect
     * @return {boolean}
     */
    public static rectRect(a, b) {
        // jshint camelcase:false

        var a_min_x = a.x;
        var a_min_y = a.y;
        var a_max_x = a.x + a.width;
        var a_max_y = a.y + a.height;

        var b_min_x = b.x;
        var b_min_y = b.y;
        var b_max_x = b.x + b.width;
        var b_max_y = b.y + b.height;

        return a_min_x <= b_max_x &&
            a_max_x >= b_min_x &&
            a_min_y <= b_max_y &&
            a_max_y >= b_min_y
            ;
    }

    /**
     * !#en Test rect and polygon
     * !#zh 测试矩形与多边形是否相交
     * @method rectPolygon
     * @param {Rect} a - The rect
     * @param {Vec2[]} b - The polygon, a set of points
     * @return {boolean}
     */
    public static rectPolygon(a, b) {
        var i, l;
        var r0 = new cc.Vec2(a.x, a.y);
        var r1 = new cc.Vec2(a.x, a.yMax);
        var r2 = new cc.Vec2(a.xMax, a.yMax);
        var r3 = new cc.Vec2(a.xMax, a.y);

        // 矩形的每条边与多边形是否相交
        if (this.linePolygon(r0, r1, b)) return true;
        if (this.linePolygon(r1, r2, b)) return true;
        if (this.linePolygon(r2, r3, b)) return true;
        if (this.linePolygon(r3, r0, b)) return true;

        // 走到这可以检测出两个图形无交点
        // 检测是否矩形包含多边形，如果多边形上存在一个点在矩形内，则相交
        for (i = 0, l = b.length; i < l; ++i) {
            if (this.pointInPolygon(b[i], a))
                return true;
        }

        // 检测是否多边形包含矩形，如果矩形上存在一个点在多边形内，则相交
        if (this.pointInPolygon(r0, b)) return true;
        if (this.pointInPolygon(r1, b)) return true;
        if (this.pointInPolygon(r2, b)) return true;
        if (this.pointInPolygon(r3, b)) return true;

        return false;
    }

    /**
     * !#en Test polygon and polygon
     * !#zh 测试多边形与多边形是否相交
     * @method polygonPolygon
     * @param {Vec2[]} a - The first polygon, a set of points
     * @param {Vec2[]} b - The second polygon, a set of points
     * @return {boolean}
     */
    public static polygonPolygon(a, b) {
        var i, l;

        // a的每条边与b的每条边做相交检测
        for (i = 0, l = a.length; i < l; ++i) {
            var a1 = a[i];
            var a2 = a[(i + 1) % l];

            if (this.linePolygon(a1, a2, b))
                return true;
        }

        // 判断两个多边形的包含关系
        for (i = 0, l = b.length; i < l; ++i) {
            if (this.pointInPolygon(b[i], a))
                return true;
        }

        // 判断两个多边形的包含关系
        for (i = 0, l = a.length; i < l; ++i) {
            if (this.pointInPolygon(a[i], b))
                return true;
        }

        return false;
    }

    /**
     * !#en Test circle and circle
     * !#zh 测试圆形与圆形是否相交
     * @method circleCircle
     * @param {Object} a - Object contains position and radius
     * @param {Object} b - Object contains position and radius
     * @return {boolean}
     * @typescript circleCircle(a: {position: Vec2, radius: number}, b: {position: Vec2, radius: number}): boolean
     */
    public static circleCircle(a, b) {
        var distance = a.position.sub(b.position).mag(); // 这里用到了内部方法,写在下面了，就是在求a与b之间的距离
        // let sub = function (vector, out) {
        // 向量减法，并返回新结果。因为引擎是3d的所以是Vec3，大家可以直接用Vec2
        // out = out || new Vec3();
        // out.x = this.x - vector.x;
        // out.y = this.y - vector.y;
        // out.z = this.z - vector.z;
        // return out;
        //};
        // mag() {
        // 返回一个距离
        //  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        //}
        // function Vec2(x, y) {
        //    this.x = x;
        //    this.y = y;
        // }

        return distance < (a.radius + b.radius);
    }

    /**
     * !#en Test polygon and circle
     * !#zh 多边形与圆形是否相交
     * @method polygonCircle
     * @param {Vec2[]} polygon - The Polygon, a set of points
     * @param {Object} circle - Object contains position and radius
     * @return {boolean}
     * @typescript polygonCircle(polygon: Vec2[], circle: {position: Vec2, radius: number}): boolean
     */
    public static polygonCircle(polygon, circle) {
        //先判断圆心有没有在多边形内，如果在，一定相交
        var position = circle.position;
        if (this.pointInPolygon(position, polygon)) {
            return true;
        }
        // 否则遍历多边形的每一条边，如果圆形到边的距离小于圆的半径，则相交
        // 为什么不用点到圆心的距离？我也不清楚。。。望大佬解答
        for (var i = 0, l = polygon.length; i < l; i++) {
            var start = i === 0 ? polygon[polygon.length - 1] : polygon[i - 1];
            var end = polygon[i];

            if (this.pointLineDistance(position, start, end, true) < circle.radius) {
                return true;
            }
        }

        return false;
    }

    /**
     * !#en Test whether the point is in the polygon
     * !#zh 测试一个点是否在一个多边形中
     * @method pointInPolygon
     * @param {Vec2} point - The point
     * @param {Vec2[]} polygon - The polygon, a set of points
     * @return {boolean}
     */
    public static pointInPolygon(point, polygon) {
        //* 射线法判断点是否在多边形内
        //* 点射线（向右水平）与多边形相交点的个数为奇数则认为该点在多边形内
        //* 点射线（向右水平）与多边形相交点的个数为偶数则认为该点不在多边形内
        var inside = false;
        var x = point.x;
        var y = point.y;

        // use some raycasting to test hits
        // https://github.com/substack/point-in-polygon/blob/master/index.js
        var length = polygon.length;

        for (var i = 0, j = length - 1; i < length; j = i++) {
            var xi = polygon[i].x, yi = polygon[i].y,
                xj = polygon[j].x, yj = polygon[j].y,
                intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            // (yi > y) !== (yj > y)表示此条边的两个端点的y值一个大于这个点的y一个小于这个点的y
            //  (x < (xj - xi) * (y - yi) / (yj - yi) + xi) 这个看起来像是求投影呢，还没搞明白
            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * !#en Calculate the distance of point to line.
     * !#zh 计算点到直线的距离。如果这是一条线段并且垂足不在线段内，则会计算点到线段端点的距离。
     * @method pointLineDistance
     * @param {Vec2} point - The point
     * @param {Vec2} start - The start point of line
     * @param {Vec2} end - The end point of line
     * @param {boolean} isSegment - whether this line is a segment
     * @return {number}
     */
    public static pointLineDistance(point, start, end, isSegment) {
        var dx = end.x - start.x;
        var dy = end.y - start.y;
        var d = dx * dx + dy * dy;
        var t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / d;
        var p;

        if (!isSegment) {
            p = cc.v2(start.x + t * dx, start.y + t * dy);
        }
        else {
            if (d) {
                if (t < 0) p = start;
                else if (t > 1) p = end;
                else p = cc.v2(start.x + t * dx, start.y + t * dy);
            }
            else {
                p = start;
            }
        }

        dx = point.x - p.x;
        dy = point.y - p.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public static isLineIntersectRectangle(linePointX1, linePointY1, linePointX2, linePointY2, rectangleLeftTopX, rectangleLeftTopY, rectangleRightBottomX, rectangleRightBottomY) {
        let lineHeight = linePointY1 - linePointY2;
        let lineWidth = linePointX2 - linePointX1;  // 计算叉乘 
        let c = linePointX1 * linePointY2 - linePointX2 * linePointY1;
        if ((lineHeight * rectangleLeftTopX + lineWidth * rectangleLeftTopY + c >= 0 && lineHeight * rectangleRightBottomX + lineWidth * rectangleRightBottomY + c <= 0)
            || (lineHeight * rectangleLeftTopX + lineWidth * rectangleLeftTopY + c <= 0 && lineHeight * rectangleRightBottomX + lineWidth * rectangleRightBottomY + c >= 0)
            || (lineHeight * rectangleLeftTopX + lineWidth * rectangleRightBottomY + c >= 0 && lineHeight * rectangleRightBottomX + lineWidth * rectangleLeftTopY + c <= 0)
            || (lineHeight * rectangleLeftTopX + lineWidth * rectangleRightBottomY + c <= 0 && lineHeight * rectangleRightBottomX + lineWidth * rectangleLeftTopY + c >= 0)) {

            if (rectangleLeftTopX > rectangleRightBottomX) {
                let temp = rectangleLeftTopX;
                rectangleLeftTopX = rectangleRightBottomX;
                rectangleRightBottomX = temp;
            }
            if (rectangleLeftTopY < rectangleRightBottomY) {
                let temp1 = rectangleLeftTopY;
                rectangleLeftTopY = rectangleRightBottomY;
                rectangleRightBottomY = temp1;
            }
            if ((linePointX1 < rectangleLeftTopX && linePointX2 < rectangleLeftTopX)
                || (linePointX1 > rectangleRightBottomX && linePointX2 > rectangleRightBottomX)
                || (linePointY1 > rectangleLeftTopY && linePointY2 > rectangleLeftTopY)
                || (linePointY1 < rectangleRightBottomY && linePointY2 < rectangleRightBottomY)) {
                return false;
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }

    }
}
