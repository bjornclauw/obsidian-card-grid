"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyImageStyle = applyImageStyle;
function applyImageStyle(img, card, grid) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const fit = (_b = (_a = card.imageFit) !== null && _a !== void 0 ? _a : grid.imageFit) !== null && _b !== void 0 ? _b : "cover";
    const height = (_d = (_c = card.imageHeight) !== null && _c !== void 0 ? _c : grid.imageHeight) !== null && _d !== void 0 ? _d : 180;
    const position = (_f = (_e = card.imagePosition) !== null && _e !== void 0 ? _e : grid.imagePosition) !== null && _f !== void 0 ? _f : "center";
    const radius = (_h = (_g = card.imageRadius) !== null && _g !== void 0 ? _g : grid.imageRadius) !== null && _h !== void 0 ? _h : 0;
    img.style.objectFit = fit;
    img.style.height = `${height}px`;
    img.style.objectPosition = position;
    img.style.borderRadius = `${radius}px`;
    img.style.width = "100%";
}
