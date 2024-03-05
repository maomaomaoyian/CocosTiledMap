/**
 * @author panda
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

    /**
     * 计算两点角度
     * @param v1 
     * @param v2 
     * @returns 
     */
    static calculateAngleByVec3(v1: cc.Vec3, v2: cc.Vec3): number {
        // 将向量转换为单位向量
        const unitV1 = v1.normalize();
        const unitV2 = v2.normalize();
        // 计算两个单位向量的点积
        const dotProduct = unitV1.dot(unitV2);
        // 使用反余弦函数计算夹角的弧度值
        const angleInRadians = Math.acos(dotProduct);
        // 将弧度值转换为角度值
        const angleInDegrees = angleInRadians * (180 / Math.PI);
        return angleInDegrees;
    }

    /**
     * 计算两点角度
     * @param v1 
     * @param v2 
     * @returns 
     */
    static calculateAngleByVec2(v1: cc.Vec2, v2: cc.Vec2): number {
        const deltaX = v2.x - v1.x;
        const deltaY = v2.y - v1.y;
        const angleInRadians = Math.atan2(deltaY, deltaX);
        const angleInDegrees = angleInRadians * (180 / Math.PI);
        return angleInDegrees;
    }

    /**
     * 计算一个点偏移指定角度距离的另一个点
     * @param v1 
     * @param angle 
     * @param distance 
     * @returns 
     */
    static calcPointByVec2(v1: cc.Vec2, angle: number, distance: number): cc.Vec2 {
        const angleRad = angle * Math.PI / 180;
        let v2 = cc.Vec2.ZERO
        v2.x = v1.x + Math.cos(angleRad) * distance;
        v2.y = v1.y + Math.sin(angleRad) * distance;
        return v2;
    }
}
