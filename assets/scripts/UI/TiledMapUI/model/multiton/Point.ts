/**
 * @author 弱不禁风小书生
 */
export class Point {
    private _x: number
    private _y: number

    public constructor(x: number, y: number) {
        this._x = x
        this._y = y
    }

    public getX(): number {
        return this._x
    }

    public setX(x: number) {
        this._x = x
    }

    public getY(): number {
        return this._y
    }

    public setY(y: number) {
        this._y = y
    }

    public equals(o: Point) {
        if (!o) return false
        return this.getX() === o.getX() && this.getY() === o.getY()
    }
}

export class APoint extends Point {
    private _g: number = 0
    private _h: number
    private _f: number
    private _parent: APoint

    public constructor(x: number, y: number) {
        super(x, y)
    }

    public getG(): number {
        return this._g
    }

    public setG(g: number) {
        this._g = g
    }

    public getH(): number {
        return this._h
    }

    public setH(h: number) {
        this._h = h
    }

    public getF(): number {
        return this._f
    }

    public setF(f: number) {
        this._f = f
    }

    public setParent(parent: APoint) {
        this._parent = parent
    }

    public getParent(): APoint {
        return this._parent
    }
}