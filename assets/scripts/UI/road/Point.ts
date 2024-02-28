export class Point {
    private _x: number
    private _y: number

    constructor(x: number, y: number) {
        this._x = x
        this._y = y
    }

    getX(): number {
        return this._x
    }

    setX(x: number) {
        this._x = x
    }

    getY(): number {
        return this._y
    }

    setY(y: number) {
        this._y = y
    }

    equals(o: Point) {
        if (!o) return false
        return this.getX() === o.getX() && this.getY() === o.getY()
    }
}

export class APoint extends Point {
    private _g: number = 0
    private _h: number
    private _f: number
    private _parent: APoint

    constructor(x: number, y: number) {
        super(x, y)
    }

    getG(): number {
        return this._g
    }

    setG(g: number) {
        this._g = g
    }

    getH(): number {
        return this._h
    }

    setH(h: number) {
        this._h = h
    }

    getF(): number {
        return this._f
    }

    setF(f: number) {
        this._f = f
    }

    setParent(parent: APoint) {
        this._parent = parent
    }

    getParent(): APoint {
        return this._parent
    }
}