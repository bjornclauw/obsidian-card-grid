import { FuzzySuggestModal, TFile } from "obsidian";

export class ImagePickerModal extends FuzzySuggestModal<TFile> {
  private readonly onSelectFile: (file: TFile) => void;

  constructor(app: any, onSelectFile: (file: TFile) => void) {
    super(app);
    this.onSelectFile = onSelectFile;
  }

  getItems(): TFile[] {
    return this.app.vault.getFiles().filter((f: TFile) =>
      ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(
        f.extension.toLowerCase()
      )
    );
  }

  getItemText(item: TFile): string {
    return item.path;
  }

  renderSuggestion(fuzzyMatch: any, el: HTMLElement): void {
    const item = fuzzyMatch.item; // Extract the TFile from FuzzyMatch
    const container = el.createDiv({ cls: "image-picker-suggestion" });

    // Add image preview
    const img = container.createEl("img", {
      cls: "image-picker-preview",
      attr: {
        src: this.app.vault.getResourcePath(item),
        alt: item.path
      }
    });

    // Add filename text below
    container.createDiv({
      cls: "image-picker-filename",
      text: item.path
    });
  }

  onChooseItem(item: TFile): void {
    this.onSelectFile(item);
  }
}