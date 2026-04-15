"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultRegistry = createDefaultRegistry;
const registry_1 = require("./registry");
const textCard_1 = require("./types/textCard");
const imageCard_1 = require("./types/imageCard");
const unknownCard_1 = require("./types/unknownCard");
function createDefaultRegistry() {
    const registry = new registry_1.CardTypeRegistry();
    registry.register(textCard_1.textCardType);
    registry.register(imageCard_1.imageCardType);
    registry.register(unknownCard_1.unknownCardType);
    return registry;
}
