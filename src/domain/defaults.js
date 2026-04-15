"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENT_GRID_VERSION = void 0;
exports.defaultGridData = defaultGridData;
exports.CURRENT_GRID_VERSION = 1;
function defaultGridData(id) {
    return {
        id,
        version: exports.CURRENT_GRID_VERSION,
        columns: 3,
        gap: 10,
        imageFit: "cover",
        imageHeight: 180,
        imagePosition: "center",
        imageRadius: 0,
        cards: []
    };
}
