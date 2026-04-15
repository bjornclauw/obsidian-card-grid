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

  onChooseItem(item: TFile): void {
    this.onSelectFile(item);
  }
}

