"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridRenderChild = void 0;
const obsidian_1 = require("obsidian");
class GridRenderChild extends obsidian_1.MarkdownRenderChild {
    constructor(containerEl, controller) {
        super(containerEl);
        this.controller = controller;
    }
    onload() {
        this.controller.mount();
    }
    onunload() {
        this.controller.destroy();
    }
}
exports.GridRenderChild = GridRenderChild;
