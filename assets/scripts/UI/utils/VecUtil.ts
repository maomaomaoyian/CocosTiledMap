/**
 * @author panda
 * 2024/02/29
 */
export class VecUtil {
    static equals(pos1: cc.Vec3, pos2: cc.Vec3): boolean {
        if (pos1.x == pos2.x && pos1.y == pos2.y && pos1.z == pos2.z) {
            return true;
        }

        return false;
    }

    static distance(pos1: cc.Vec3, pos2: cc.Vec3): number {
        return cc.Vec3.distance(pos1, pos2);
    }

    static lerp(posStart: cc.Vec3, posEnd: cc.Vec3, t: number): cc.Vec3 {
        return this.bezierOne(t, posStart, posEnd);
    }

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
