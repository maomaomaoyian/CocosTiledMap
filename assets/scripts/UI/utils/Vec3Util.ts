export class Vec3Util {

    /**
     * 判断两个三维向量的值是否相等
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static equals(pos1: cc.Vec3, pos2: cc.Vec3): boolean {
        if (pos1.x == pos2.x && pos1.y == pos2.y && pos1.z == pos2.z) {
            return true;
        }

        return false;
    }

    /**
     * 获得两点间的距离
     * @param pos1  向量1
     * @param pos2  向量2
     */
    static distance(pos1: cc.Vec3, pos2: cc.Vec3): number {
        return cc.Vec3.distance(pos1, pos2);
    }

    /**
     * 插值运算
     * @param posStart  开始俏步
     * @param posEnd    结束位置
     * @param t         时间
     */
    static lerp(posStart: cc.Vec3, posEnd: cc.Vec3, t: number): cc.Vec3 {
        return this.bezierOne(t, posStart, posEnd);
    }

    /**
     * 一次贝塞尔即为线性插值函数
     * @param t 
     * @param posStart 
     * @param posEnd 
     * @returns 
     */
    static bezierOne(t: number, posStart: cc.Vec3, posEnd: cc.Vec3): cc.Vec3 {
        if (t > 1) {
            t = 1;
        }
        else if (t < 0) {
            t = 0
        }

        var pStart: cc.Vec3 = posStart.clone();
        var pEnd: cc.Vec3 = posEnd.clone();

        return pStart.multiplyScalar(1 - t).add(pEnd.multiplyScalar(t));
    }
}
