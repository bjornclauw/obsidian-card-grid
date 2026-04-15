"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardTypeRegistry = void 0;
class CardTypeRegistry {
    constructor() {
        this.defs = new Map();
    }
    register(def) {
        this.defs.set(def.type, def);
    }
    get(type) {
        var _a;
        return (_a = this.defs.get(type)) !== null && _a !== void 0 ? _a : this.defs.get("unknown");
    }
    has(type) {
        return this.defs.has(type);
    }
    list() {
        return Array.from(this.defs.values());
    }
}
exports.CardTypeRegistry = CardTypeRegistry;
