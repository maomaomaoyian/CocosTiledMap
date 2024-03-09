import { game } from "../../Manager"

export class ViewRect {
    private static _instance: ViewRect;
    static get instance() {
        if (!this._instance) {
            this._instance = new ViewRect();
        }
        return this._instance;
    }

    private rectFillRegister: Map<string, cc.Rect> = new Map()

    private get screenCenterMappingPos() {
        return game.map_model.$TiledMapControl.canvasCenterToMap()
    }

    private get mapNode() {
        return game.map_model.$TiledMapControl.node
    }

    public drawRectScreen(): cc.Rect {
        const canvasCenterPos = this.screenCenterMappingPos
        const rectWidth = game.VIEW.width
        const rectHeight = game.VIEW.height
        const rectPos = canvasCenterPos.sub(cc.v3(rectWidth / 2, rectHeight / 2))
        const rect = new cc.Rect(rectPos.x, rectPos.y, rectWidth, rectHeight)
        this.drawArea(rect, cc.Color.GREEN, "draw_screen")
        return rect
    }

    public drawRectPreview(previewVertices: cc.Vec3[]) {
        let left_down_tile = previewVertices[2]
        let rectPreviewPos = game.map_data.tileToPixel(left_down_tile.x, left_down_tile.y)
        let rectPreviewWidth = game.calcTowVerticesDis(previewVertices[0], previewVertices[1])
        let rectPreviewHieght = game.calcTowVerticesDis(previewVertices[0], previewVertices[2])
        let rectPreview = new cc.Rect(rectPreviewPos.x, rectPreviewPos.y, rectPreviewWidth, rectPreviewHieght)
        this.drawArea(rectPreview, cc.Color.RED, "draw_preview")
    }

    private drawArea(rect: cc.Rect, color: cc.Color, register: string) {
        if (!game.VIEW_REALTIME_FILL) {
            if (this.rectFillRegister.has(register)) return
            this.rectFillRegister.set(register, rect)
        }
        let graphics = this.getGraphics(register)
        graphics.clear()
        graphics.strokeColor = color;
        graphics.lineWidth = 50;
        graphics.rect(rect.xMin, rect.yMin, rect.width, rect.height);
        graphics.stroke();
    }

    private getGraphics(register: string) {
        let mapNode = this.mapNode;
        let registerNode = mapNode.getChildByName(register) || new cc.Node(register);
        if (!registerNode.parent) registerNode.parent = mapNode;
        let graphics = registerNode.getComponent(cc.Graphics) || registerNode.addComponent(cc.Graphics);
        return graphics
    }

    /**
     * 绘制寻路结果
     * @param path 
     * @returns 
     */
    public drawPath(path: [number, number][]) {
        if (!path.length) return;
        let graphics = this.getGraphics("draw_line")
        graphics.clear();
        graphics.strokeColor = cc.Color.GREEN;
        graphics.lineWidth = 5;
        const startVec = game.map_data.tileToPixel(path[0][0], path[0][1]);
        graphics.moveTo(startVec.x, startVec.y);
        let endVec
        path.forEach((one, index) => {
            let vec2 = game.map_data.tileToPixel(one[0], one[1]);
            graphics.lineTo(vec2.x, vec2.y);
            if (!path[index + 1]) endVec = vec2
        });
        graphics.stroke();
        graphics.strokeColor = cc.Color.RED;
        graphics.moveTo(startVec.x, startVec.y);
        graphics.lineTo(endVec.x, endVec.y);
        graphics.stroke();
    }

    public drawDiagonalLines(viewVertices: cc.Vec3[], color: cc.Color) {
        let vec0 = game.map_data.tileToPixel(viewVertices[0].x, viewVertices[0].y)
        let vec1 = game.map_data.tileToPixel(viewVertices[1].x, viewVertices[1].y)
        let vec2 = game.map_data.tileToPixel(viewVertices[2].x, viewVertices[2].y)
        let vec3 = game.map_data.tileToPixel(viewVertices[3].x, viewVertices[3].y)
        let graphics = this.getGraphics("draw_diagonal")
        graphics.clear();
        graphics.strokeColor = color;
        graphics.lineWidth = 5;
        graphics.moveTo(vec0.x, vec0.y);
        graphics.lineTo(vec3.x, vec3.y);
        graphics.moveTo(vec1.x, vec1.y);
        graphics.lineTo(vec2.x, vec2.y);
        graphics.stroke();
    }

    public clear() {
        this.rectFillRegister = new Map()
    }
}