import { game } from "../../Game"

export class EntityMove {
    private path: [number, number][]
    private target: cc.Node
    private speed: number
    private isFirst: boolean = true

    constructor(path, target, speed) {
        this.path = path
        this.target = target
        this.speed = speed
        this.target.stopAllActions()
    }

    run() {
        let peek = this.path.shift()
        if (!peek) return
        let point = game.map_data_ins.tileToPixel(peek[0], peek[1])
        cc.tween(this.target).to(this.isFirst ? 0 : this.speed, { position: point }).call(() => { this.isFirst = false; this.run(); }).start()
    }
}