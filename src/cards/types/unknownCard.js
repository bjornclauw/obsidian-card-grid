"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unknownCardType = void 0;
const codec_1 = require("../../domain/codec");
function isRecord(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}
exports.unknownCardType = {
    type: "unknown",
    displayName: "Unknown card",
    editor: {
        title: "Unknown card",
        fields: []
    },
    normalize(raw) {
        const obj = isRecord(raw) ? raw : {};
        const id = typeof obj.id === "string" && obj.id.trim().length > 0
            ? obj.id.trim()
            : (0, codec_1.createId)("card");
        const type = typeof obj.type === "string" && obj.type.trim().length > 0
            ? obj.type.trim()
            : "unknown";
        return {
            id,
            type,
            raw: obj
        };
    },
    createView(ctx) {
        const box = document.createElement("div");
        box.className = "card-grid-card";
        const title = box.createEl("h4", { text: "Unknown card type" });
        const pre = box.createEl("pre");
        pre.style.whiteSpace = "pre-wrap";
        pre.style.textAlign = "left";
        return {
            el: box,
            update(card, viewCtx) {
                title.style.color = "#000000";
                box.style.border = "2px solid #ccc";
                title.setText(`Unknown card type: ${card.type}`);
                pre.textContent = JSON.stringify(card.raw, null, 2);
            }
        };
    }
};
