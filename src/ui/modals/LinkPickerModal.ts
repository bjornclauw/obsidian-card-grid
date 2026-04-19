import { FuzzySuggestModal, TFile, setIcon, App } from "obsidian";

export class LinkPickerModal extends FuzzySuggestModal<TFile> {
    private readonly onSelect: (file: TFile) => void;

    constructor(app: App, onSelect: (file: TFile) => void) {
        super(app);
        this.onSelect = onSelect;
        this.setPlaceholder("Search for a note or file to link...");
    }

    getItems(): TFile[] {
        // Return all files in the vault to allow linking to notes and attachments
        return this.app.vault.getFiles();
    }

    getItemText(item: TFile): string {
        // Search against both the file name and the full path
        return `${item.basename} ${item.path}`;
    }

    renderSuggestion(fuzzyMatch: any, el: HTMLElement): void {
        const item = fuzzyMatch.item;

        // Apply native Obsidian suggestion styles for the OEM feel
        el.addClass("mod-complex");
        const content = el.createDiv({ cls: "suggestion-content" });

        const title = content.createDiv({ cls: "suggestion-title" });
        title.setText(item.extension === "md" ? item.basename : item.name);

        const note = content.createDiv({ cls: "suggestion-note" });
        note.setText(item.path);

        const aux = el.createDiv({ cls: "suggestion-aux" });
        const isImage = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(item.extension.toLowerCase());

        if (isImage) {
            setIcon(aux, "image");
        } else if (item.extension === "md") {
            setIcon(aux, "file-text");
        } else {
            setIcon(aux, "file");
        }
    }

    onChooseItem(item: TFile): void {
        this.onSelect(item);
    }
}