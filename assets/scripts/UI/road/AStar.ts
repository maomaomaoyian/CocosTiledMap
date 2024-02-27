import { TiledMapData } from "../TiledMapUI/TiledMapData";
import { PriorityQueue } from "../utils/PriorityQueue";
import { APoint } from "./Point";

export class AStar {
    private openList = new PriorityQueue<APoint>((a: APoint, b: APoint) => a.getF() - b.getF())
    private openListMap: Map<number, APoint> = new Map()
    private closeMap: Map<number, APoint> = new Map()
    private barrier: Set<number> = new Set()

    private mapWidth: number
    private mapHeight: number
    private x8: boolean

    private dest: APoint

    private static readonly step = 10

    constructor(width: number, height: number, x8: boolean) {
        this.x8 = x8
        this.mapWidth = width
        this.mapHeight = height
    }

    findPath(sX: number, sY: number, eX: number, eY: number, barrier: Set<number>): [number, number][] {
        const start = new APoint(sX, sY)
        const end = new APoint(eX, eY)
        this.barrier = barrier
        this.openList.clear()
        this.openListMap.clear()
        this.closeMap.clear()

        let path: [number, number][] = new Array()
        if (start.equals(end)) {
            console.error("不能设置目的地为起点")
            return path
        }
        const startGID = this.getGID(start)
        const endGID = this.getGID(end)
        if (this.barrier.has(startGID) || this.barrier.has(endGID)) {
            console.error("起点与终点都不能是障碍")
            return path
        }

        if (this.isOutIndex(start) || this.isOutIndex(end)) {
            console.error("起点与终点都不能在地形之外")
            return path
        }

        this.openListpush(start)
        let cur: APoint
        do {
            cur = this.openListPeek()
            const curGID = this.getGID(cur)
            this.closeMap.set(curGID, cur)
            this.openListDelete(cur)
            if (this.closeMap.has(endGID)) break

            let neighborsPoint = this.getNeighbors(cur)
            for (let index = 0; index < neighborsPoint.length; index++) {
                const neighbor = neighborsPoint[index];
                const neighborGID = this.getGID(neighbor)
                if (this.closeMap.has(neighborGID)) continue
                if (this.openListHas(neighbor)) {
                    if (cur.getG() + 1 < neighbor.getG()) {
                        neighbor.setG(cur.getG() + 1)
                        neighbor.setParent(cur)
                    }
                }
                else {
                    neighbor.setG(cur.getG() + 1)
                    neighbor.setH(this.calcH(neighbor, end))
                    neighbor.setF(neighbor.getH() + neighbor.getG())
                    this.openListpush(neighbor)
                }
            }

        } while (this.openList.size() !== 0);

        let temp: APoint
        if (this.closeMap.has(endGID)) {
            temp = cur
            path.push([temp.getX(), temp.getY()])
            while (temp.getParent()) {
                temp = temp.getParent()
                path.push([temp.getX(), temp.getY()])
            }
        }

        if (path.length > 0) {
            path.reverse()
        }
        else {
            console.error("没有发生意外，但没有找到路径")
        }

        return path
    }

    openListPeek(): APoint {
        return this.openList.peek()
    }

    openListpush(ele: APoint) {
        const gid = this.getGID(ele)
        this.openList.push(ele)
        this.openListMap.set(gid, ele)
    }

    openListHas(ele: APoint): boolean {
        const gid = this.getGID(ele)
        return this.openListMap.has(gid)
    }

    openListDelete(ele: APoint) {
        let idx = this.openListEleIndex(ele)
        if (idx === -1) return
        const gid = this.getGID(ele)
        this.openList.delete(idx)
        this.openListMap.delete(gid)
    }

    openListEleIndex(ele: APoint): number {
        const data = this.openList.getData()
        for (let index = 0; index < data.length; index++) {
            const one = data[index];
            if (one.equals(ele)) {
                return index
            }
        }
        return -1
    }

    getGID(ele: APoint) {
        return TiledMapData.instance.tileToGID(ele.getX(), ele.getY())
    }

    isBarrier(ele: APoint): boolean {
        if (ele.equals(this.dest)) return false
        const gid = this.getGID(ele)
        return this.barrier.has(gid)
    }

    isOutIndex(ele: APoint): boolean {
        return TiledMapData.instance.isOutIndex(ele.getX(), ele.getY())
    }

    calcH(cur: APoint, end: APoint): number {
        let temp = Math.abs(cur.getX() - end.getX()) + Math.abs(cur.getY() - end.getY())
        return temp * AStar.step
    }

    getNeighbors(ele: APoint): APoint[] {
        let arr = []
        const x = ele.getX()
        const y = ele.getY()
        let point: APoint
        if (x + 1 < this.mapWidth) {
            point = new APoint(x + 1, y)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (x - 1 >= 0) {
            point = new APoint(x - 1, y)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (y + 1 < this.mapHeight) {
            point = new APoint(x, y + 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (y - 1 >= 0) {
            point = new APoint(x, y - 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (!this.x8) return arr

        if (x + 1 < this.mapWidth && y + 1 < this.mapHeight) {
            point = new APoint(x + 1, y + 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (x - 1 >= 0 && y - 1 >= 0) {
            point = new APoint(x - 1, y - 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (x - 1 >= 0 && y + 1 < this.mapHeight) {
            point = new APoint(x - 1, y + 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (x + 1 < this.mapWidth && y - 1 >= 0) {
            point = new APoint(x + 1, y - 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        return arr
    }
}