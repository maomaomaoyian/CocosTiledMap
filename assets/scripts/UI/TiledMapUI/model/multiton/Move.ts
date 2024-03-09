import { game } from "../../Manager"

/**
 * @author 弱不禁风小书生
 */
export class EntityMove {
    private path: [number, number][]
    private target: cc.Node
    private speed: number
    private isFirst: boolean = true

    public constructor(path, target, speed) {
        this.path = path
        this.target = target
        this.speed = speed
        this.target.stopAllActions()
    }

    public run() {
        let peek = this.path.shift()
        if (!peek) return
        let point = game.map_data.tileToPixel(peek[0], peek[1])
        cc.tween(this.target).to(this.isFirst ? 0 : this.speed, { position: point }).call(() => { this.isFirst = false; this.run(); }).start()
    }
}