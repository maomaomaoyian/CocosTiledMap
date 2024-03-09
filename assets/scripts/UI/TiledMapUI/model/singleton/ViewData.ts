import { game } from "../../Manager"

export class ViewData {
    private static _instance: ViewData;
    static get instance() {
        if (!this._instance) {
            this._instance = new ViewData();
        }
        return this._instance;
    }

    private viewLastCenterTile: cc.Vec3
    private viewLastCenterPos: cc.Vec3
    private viewVertices: cc.Vec3[] = []
    private viewMapData: Map<number, cc.Vec3> = new Map()
    private viewDeleteTiles: Map<number, cc.Vec3> = new Map()
    private viewAdditionTiles: Map<number, cc.Vec3> = new Map()
    private viewChangeTiles: Map<number, cc.Vec3> = new Map()
    private previewLastCenterTile: cc.Vec3
    private previewLastCenterPos: cc.Vec3
    public previewVertices: cc.Vec3[] = []

    private get screenCenterMappingPos() {
        return game.map_model.$TiledMapControl.canvasCenterToMap()
    }

    /** --- 真实视野 --- */
    public calcViewData() {
        let isValid = game.map_model.isValidOperation()
        if (!isValid) return
        const canvasCenterPos = this.screenCenterMappingPos
        if (game.VIEW_UPDATE_PARTICAL === game.VIEW_PARTICAL.TILE) {
            let tile = game.map_data.pixelToTile(canvasCenterPos)
            if (!this.viewLastCenterTile || !this.viewLastCenterTile.equals(tile)) {
                this.viewLastCenterTile = tile
                let tileCenter = game.map_data.tileToPixel(tile.x, tile.y)
                this.calcSquareView()
                game.map_model.$TiledMapUI.updateCenterLab(tileCenter)
            }
        }
        else if (game.VIEW_UPDATE_PARTICAL === game.VIEW_PARTICAL.PIXEL) {
            if (!this.viewLastCenterPos || !this.viewLastCenterPos.fuzzyEquals(canvasCenterPos, 5)) {
                this.viewLastCenterPos = canvasCenterPos
                let tile = game.map_data.pixelToTile(canvasCenterPos)
                let tileCenter = game.map_data.tileToPixel(tile.x, tile.y)
                this.calcSquareView()
                game.map_model.$TiledMapUI.updateCenterLab(tileCenter)
            }
        }
    }

    private calcSquareView() {
        if (!game.VIEW_REALTIME_CALC && this.viewVertices.length) return
        this.recordView()
        this.showDataView()
    }

    private recordView() {
        let vertices = game.getSquareVertices(this.screenCenterMappingPos, game.VIEW)
        this.viewVertices = vertices
        let viewData = game.getSquareView(vertices)
        let lastViewData: Map<number, cc.Vec3> = this.viewMapData || new Map()
        let nextViewData: Map<number, cc.Vec3> = new Map()
        this.viewMapData = new Map()
        for (let index = 0; index < viewData.length; index++) {
            const tile = viewData[index];
            let gid = game.tileToGID(game.map_data.row, game.map_data.col, tile.x, tile.y)
            this.viewMapData.set(gid, tile)
            if (lastViewData.has(gid)) {
                lastViewData.delete(gid)
            }
            else {
                nextViewData.set(gid, tile)
            }
        }
        this.viewDeleteTiles = lastViewData
        this.viewAdditionTiles = nextViewData
        const mergedMap = game.mergeMaps(lastViewData, nextViewData);
        this.viewChangeTiles = mergedMap
    }

    private showDataView() {
        if (!game.DEV) return
        game.view_grid.justShowView(Array.from(this.viewDeleteTiles.values()))
        game.view_grid.showView(Array.from(this.viewAdditionTiles.values()))
        game.view_rect.drawRectScreen()
        game.view_rect.drawDiagonalLines(this.viewVertices, cc.Color.YELLOW)
    }


    /** --- 预处理视野 --- */
    public calcPreviewData() {
        let isValid = game.map_model.isValidOperation()
        if (!isValid) return
        const canvasCenterPos = this.screenCenterMappingPos
        if (game.VIEW_UPDATE_PARTICAL === game.VIEW_PARTICAL.TILE) {
            let tile = game.map_data.pixelToTile(canvasCenterPos)
            if (!this.previewLastCenterTile || !this.previewLastCenterTile.equals(tile)) {
                this.previewLastCenterTile = tile
                this.calcSquarePreview()
            }
        }
        else if (game.VIEW_UPDATE_PARTICAL === game.VIEW_PARTICAL.PIXEL) {
            if (!this.previewLastCenterPos || !this.previewLastCenterPos.fuzzyEquals(canvasCenterPos, 5)) {
                this.previewLastCenterPos = canvasCenterPos
                this.calcSquarePreview()
            }
        }
    }

    private calcSquarePreview() {
        if (!game.VIEW_REALTIME_CALC && this.previewVertices.length) return
        this.recordPreview()
        this.showDataPreview()
    }

    private recordPreview() {
        let vertices = game.getSquareVertices(this.screenCenterMappingPos, game.preview())
        this.previewVertices = vertices
    }

    private showDataPreview() {
        if (!game.DEV) return
        game.view_rect.drawRectPreview(this.previewVertices)
        game.view_rect.drawRooms(this.previewVertices)
    }

    public clear() {
        this.viewLastCenterTile = null
        this.viewLastCenterPos = null
        this.viewVertices = []
        this.viewMapData = new Map()
        this.viewDeleteTiles = new Map()
        this.viewAdditionTiles = new Map()
        this.viewChangeTiles = new Map()
        this.previewLastCenterTile = null
        this.previewLastCenterPos = null
        this.previewVertices = []
    }
}