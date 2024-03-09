import { game } from "../../Manager";

/**
 * @author 弱不禁风小书生
 */
export class TiledMapModel {
    private static _instance: TiledMapModel;
    static get instance() {
        if (!this._instance) {
            this._instance = new TiledMapModel();
        }
        return this._instance;
    }

    public $TiledMapUI: game.map_ui
    public $TiledMapControl: game.map_control
    public testPathStart: [number, number]
    public testPathEnd: [number, number]

    public isValidOperation(): boolean {
        return true
    }

    public clear() {
        this.$TiledMapUI = null
        this.$TiledMapControl = null
        this.testPathStart = null
        this.testPathEnd = null
        game.map_data.clear()
        game.view_data.clear()
        game.view_rect.clear()
        game.view_grid.clear()
    }
}
