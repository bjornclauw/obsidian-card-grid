"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardEditorModal = void 0;
const obsidian_1 = require("obsidian");
const ImagePickerModal_1 = require("./ImagePickerModal");
function clone(value) {
    // structuredClone exists in modern Obsidian (Electron). Keep a fallback for safety.
    const sc = globalThis
        .structuredClone;
    if (sc)
        return sc(value);
    return JSON.parse(JSON.stringify(value));
}
class CardEditorModal extends obsidian_1.Modal {
    constructor(app, plugin, sourcePath, def, card, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.sourcePath = sourcePath;
        this.def = def;
        this.draft = clone(card);
        this.onSubmit = onSubmit;
        this.setTitle(def.editor.title);
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("card-grid-editor");
        this.renderFields(this.def.editor, contentEl);
        new obsidian_1.Setting(contentEl)
            .addButton((b) => b
            .setButtonText("Cancel")
            .onClick(() => {
            this.onSubmit(null);
            this.close();
        }))
            .addButton((b) => b
            .setCta()
            .setButtonText("Save")
            .onClick(() => {
            const normalized = this.def.normalize(this.draft);
            this.onSubmit(normalized);
            this.close();
        }));
    }
    onClose() {
        this.contentEl.empty();
    }
    renderFields(spec, container) {
        for (const field of spec.fields) {
            this.renderField(field, container);
        }
    }
    renderField(field, container) {
        var _a;
        const key = field.key;
        const getString = () => typeof this.draft[key] === "string" ? this.draft[key] : "";
        const getNumber = () => typeof this.draft[key] === "number" ? this.draft[key] : undefined;
        const getBoolean = () => typeof this.draft[key] === "boolean" ? this.draft[key] : undefined;
        const setValue = (value) => {
            this.draft[key] = value;
        };
        if (field.kind === "text") {
            new obsidian_1.Setting(container).setName(field.label).addText((t) => {
                var _a;
                t.setPlaceholder((_a = field.placeholder) !== null && _a !== void 0 ? _a : "").setValue(getString());
                t.onChange((v) => setValue(v));
            });
            return;
        }
        if (field.kind === "number") {
            new obsidian_1.Setting(container).setName(field.label).addText((t) => {
                const initial = getNumber();
                t.setValue(initial === undefined ? "" : String(initial));
                t.onChange((v) => {
                    const n = Number(v);
                    setValue(Number.isFinite(n) ? n : undefined);
                });
            });
            return;
        }
        if (field.kind === "select") {
            new obsidian_1.Setting(container)
                .setName(field.label)
                .addDropdown((d) => {
                var _a, _b, _c;
                for (const opt of field.options)
                    d.addOption(opt.value, opt.label);
                const initial = typeof this.draft[key] === "string"
                    ? this.draft[key]
                    : (_c = (_a = field.defaultValue) !== null && _a !== void 0 ? _a : (_b = field.options[0]) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : "";
                if (initial)
                    d.setValue(initial);
                d.onChange((v) => setValue(v));
            });
            return;
        }
        if (field.kind === "toggle") {
            new obsidian_1.Setting(container)
                .setName(field.label)
                .addToggle((t) => {
                var _a;
                const initial = getBoolean();
                t.setValue((_a = initial !== null && initial !== void 0 ? initial : field.defaultValue) !== null && _a !== void 0 ? _a : false);
                t.onChange((v) => setValue(v));
            });
            return;
        }
        if (field.kind === "color") {
            new obsidian_1.Setting(container)
                .setName(field.label)
                .addColorPicker((c) => {
                var _a;
                const initial = typeof this.draft[key] === "string"
                    ? this.draft[key]
                    : (_a = field.defaultValue) !== null && _a !== void 0 ? _a : "#cccccc";
                c.setValue(initial);
                c.onChange((v) => setValue(v));
            });
            return;
        }
        if (field.kind === "image-file") {
            const setting = new obsidian_1.Setting(container).setName(field.label);
            const desc = setting.descEl;
            const renderDesc = () => {
                const v = getString();
                desc.setText(v ? v : "(none)");
            };
            renderDesc();
            setting.addButton((b) => b.setButtonText("Choose…").onClick(() => {
                new ImagePickerModal_1.ImagePickerModal(this.app, (file) => {
                    setValue(file.path);
                    renderDesc();
                }).open();
            }));
            setting.addButton((b) => b.setButtonText("Clear").onClick(() => {
                setValue("");
                renderDesc();
            }));
            return;
        }
        // Markdown field: edit + preview toggle.
        if (field.kind === "markdown") {
            const setting = new obsidian_1.Setting(container).setName(field.label);
            const wrapper = setting.controlEl.createDiv("card-grid-md-field");
            const toolbar = wrapper.createDiv("card-grid-md-toolbar");
            const editorWrap = wrapper.createDiv("card-grid-md-editor");
            const previewWrap = wrapper.createDiv("card-grid-md-preview");
            const textarea = new obsidian_1.TextAreaComponent(editorWrap);
            textarea.inputEl.rows = 8;
            textarea.setPlaceholder((_a = field.placeholder) !== null && _a !== void 0 ? _a : "");
            textarea.setValue(getString());
            textarea.onChange((v) => {
                setValue(v);
            });
            let showingPreview = false;
            const renderPreview = () => __awaiter(this, void 0, void 0, function* () {
                previewWrap.empty();
                const md = getString();
                yield obsidian_1.MarkdownRenderer.render(this.app, md || " ", previewWrap, this.sourcePath, this.plugin);
            });
            const updateVisibility = () => {
                editorWrap.style.display = showingPreview ? "none" : "";
                previewWrap.style.display = showingPreview ? "" : "none";
            };
            new obsidian_1.ButtonComponent(toolbar)
                .setButtonText("Edit")
                .setCta()
                .onClick(() => {
                showingPreview = false;
                updateVisibility();
            });
            new obsidian_1.ButtonComponent(toolbar).setButtonText("Preview").onClick(() => __awaiter(this, void 0, void 0, function* () {
                showingPreview = true;
                updateVisibility();
                yield renderPreview();
            }));
            updateVisibility();
            return;
        }
    }
}
exports.CardEditorModal = CardEditorModal;
