import { game } from "../../Manager"

export class ViewGrid {
    private static _instance: ViewGrid;
    static get instance() {
        if (!this._instance) {
            this._instance = new ViewGrid();
        }
        return this._instance;
    }

    private labelNodePool: cc.Node[] = []
    private lightTileLabel: Map<string, cc.Node> = new Map()

    private get mapNode() {
        return game.map_model.$TiledMapControl.node
    }

    public justShowView(viewData: cc.Vec3[]) {
        do {
            let tile = viewData.pop()
            if (!tile) continue
            let name = `${tile.x}_${tile.y}`
            this.pushLabel(this.lightTileLabel.get(name))
            this.lightTileLabel.delete(name)
        } while (viewData.length > 0);
    }

    private pushLabel(node: cc.Node) {
        if (!cc.isValid(node)) return
        node.active = false
        this.labelNodePool.push(node)
    }

    public showView(viewData: cc.Vec3[]) {
        viewData.forEach(tile => {
            let name = `${tile.x}_${tile.y}`
            let node = this.getLabelNode(tile)
            this.lightTileLabel.set(name, node)
        });
    }

    private getLabelNode(tile: cc.Vec3): cc.Node {
        let node = this.labelNodePool.pop()
        let label: cc.Label;
        let name = `${tile.x}_${tile.y}`;
        if (!node) {
            node = new cc.Node(name)
            label = node.addComponent(cc.Label)
            label.fontSize = 15
            label.verticalAlign = cc.Label.VerticalAlign.CENTER
        }
        else {
            node.active = true
            label = node.getComponent(cc.Label)
        }
        label.string = `${name}`
        node.color = tile.z ? cc.Color.RED : cc.Color.BLUE
        node.parent = this.mapNode
        let pos = game.map_data.tileToPixel(tile.x, tile.y)
        node.setPosition(pos)
        return node
    }

    public clear() {
        this.labelNodePool = []
        this.lightTileLabel = new Map()
    }
}