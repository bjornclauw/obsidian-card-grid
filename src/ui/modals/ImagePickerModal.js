"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagePickerModal = void 0;
const obsidian_1 = require("obsidian");
class ImagePickerModal extends obsidian_1.FuzzySuggestModal {
    constructor(app, onSelectFile) {
        super(app);
        this.onSelectFile = onSelectFile;
    }
    getItems() {
        return this.app.vault.getFiles().filter((f) => ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(f.extension.toLowerCase()));
    }
    getItemText(item) {
        return item.path;
    }
    onChooseItem(item) {
        this.onSelectFile(item);
    }
}
exports.ImagePickerModal = ImagePickerModal;
