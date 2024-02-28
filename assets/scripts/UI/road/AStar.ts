import { game } from "../../Game"
/**
 * @author panda
 * 2024/02/29
 */
export class AStar {
    private openList = new game.util_queue<game.road_apoint>((a: game.road_apoint, b: game.road_apoint) => a.getF() - b.getF())
    private openListMap: Map<number, game.road_apoint> = new Map()
    private closeMap: Map<number, game.road_apoint> = new Map()
    private barrier: Set<number> = new Set()

    private mapWidth: number
    private mapHeight: number
    private x8: boolean

    private dest: game.road_apoint

    private static readonly step = 10

    constructor(width: number, height: number, x8: boolean) {
        this.x8 = x8
        this.mapWidth = width
        this.mapHeight = height
    }

    findPath(sX: number, sY: number, eX: number, eY: number, barrier: Set<number>): [number, number][] {
        const start = new game.road_apoint(sX, sY)
        const end = new game.road_apoint(eX, eY)
        this.barrier = barrier
        this.openList.clear()
        this.openListMap.clear()
        this.closeMap.clear()

        let path: [number, number][] = new Array()
        if (start.equals(end)) {
            game.PRINT && console.error("不能设置目的地为起点")
            return path
        }
        const startGID = this.getGID(start)
        const endGID = this.getGID(end)
        if (this.barrier.has(startGID) || this.barrier.has(endGID)) {
            game.PRINT && console.error("起点与终点都不能是障碍")
            return path
        }

        if (this.isOutIndex(start) || this.isOutIndex(end)) {
            game.PRINT && console.error("起点与终点都不能在地形之外")
            return path
        }

        this.openListpush(start)
        let cur: game.road_apoint
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

        let temp: game.road_apoint
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
            game.PRINT && console.error("没有发生意外，但没有找到路径")
        }

        return path
    }

    openListPeek(): game.road_apoint {
        return this.openList.peek()
    }

    openListpush(ele: game.road_apoint) {
        const gid = this.getGID(ele)
        this.openList.push(ele)
        this.openListMap.set(gid, ele)
    }

    openListHas(ele: game.road_apoint): boolean {
        const gid = this.getGID(ele)
        return this.openListMap.has(gid)
    }

    openListDelete(ele: game.road_apoint) {
        let idx = this.openListEleIndex(ele)
        if (idx === -1) return
        const gid = this.getGID(ele)
        this.openList.delete(idx)
        this.openListMap.delete(gid)
    }

    openListEleIndex(ele: game.road_apoint): number {
        const data = this.openList.getData()
        for (let index = 0; index < data.length; index++) {
            const one = data[index];
            if (one.equals(ele)) {
                return index
            }
        }
        return -1
    }

    getGID(ele: game.road_apoint) {
        return game.map_data_ins.tileToGID(ele.getX(), ele.getY())
    }

    isBarrier(ele: game.road_apoint): boolean {
        if (ele.equals(this.dest)) return false
        const gid = this.getGID(ele)
        return this.barrier.has(gid)
    }

    isOutIndex(ele: game.road_apoint): boolean {
        return game.map_data_ins.isOutIndex(ele.getX(), ele.getY())
    }

    calcH(cur: game.road_apoint, end: game.road_apoint): number {
        let temp = Math.abs(cur.getX() - end.getX()) + Math.abs(cur.getY() - end.getY())
        return temp * AStar.step
    }

    getNeighbors(ele: game.road_apoint): game.road_apoint[] {
        let arr = []
        const x = ele.getX()
        const y = ele.getY()
        let point: game.road_apoint
        if (x + 1 < this.mapWidth) {
            point = new game.road_apoint(x + 1, y)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (x - 1 >= 0) {
            point = new game.road_apoint(x - 1, y)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (y + 1 < this.mapHeight) {
            point = new game.road_apoint(x, y + 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (y - 1 >= 0) {
            point = new game.road_apoint(x, y - 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (!this.x8) return arr

        if (x + 1 < this.mapWidth && y + 1 < this.mapHeight) {
            point = new game.road_apoint(x + 1, y + 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (x - 1 >= 0 && y - 1 >= 0) {
            point = new game.road_apoint(x - 1, y - 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (x - 1 >= 0 && y + 1 < this.mapHeight) {
            point = new game.road_apoint(x - 1, y + 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        if (x + 1 < this.mapWidth && y - 1 >= 0) {
            point = new game.road_apoint(x + 1, y - 1)
            if (!this.isBarrier(point)) {
                point.setParent(ele)
                arr.push(point)
            }
        }

        return arr
    }
}