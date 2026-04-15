"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
const cards_1 = require("../cards");
const GridController_1 = require("../controller/GridController");
const GridRenderChild_1 = require("./GridRenderChild");
class CardGridPlugin extends obsidian_1.Plugin {
    constructor() {
        super(...arguments);
        this.registry = (0, cards_1.createDefaultRegistry)();
    }
    onload() {
        this.registerMarkdownCodeBlockProcessor("card-grid", (source, el, ctx) => {
            var _a;
            el.empty();
            const sectionInfo = (_a = ctx.getSectionInfo) === null || _a === void 0 ? void 0 : _a.call(ctx, el);
            const ref = {
                sourcePath: ctx.sourcePath,
                lineStart: sectionInfo === null || sectionInfo === void 0 ? void 0 : sectionInfo.lineStart,
                lineEnd: sectionInfo === null || sectionInfo === void 0 ? void 0 : sectionInfo.lineEnd
            };
            const controller = new GridController_1.GridController({
                app: this.app,
                plugin: this,
                registry: this.registry,
                hostEl: el,
                ref,
                codeBlockSource: source
            });
            ctx.addChild(new GridRenderChild_1.GridRenderChild(el, controller));
        });
    }
}
exports.default = CardGridPlugin;
