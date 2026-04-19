import { FuzzySuggestModal, TFile } from "obsidian";

export class ImagePickerModal extends FuzzySuggestModal<TFile> {
  private readonly onSelectFile: (path: string) => void;
  private previewEl: HTMLElement | null = null;

  constructor(app: any, onSelectFile: (path: string) => void) {
    super(app);
    this.onSelectFile = onSelectFile;
    this.setPlaceholder("Search for a vault image or paste a URL...");
  }

  onOpen(): void {
    super.onOpen();
    // Add this in onOpen() after super.onOpen()
    const originalEnter = (this as any).chooser.useSelectedItem.bind((this as any).chooser);

    (this as any).chooser.useSelectedItem = (e: KeyboardEvent) => {
      const value = this.inputEl.value.trim();
      if (value.startsWith("http://") || value.startsWith("https://")) {
        e.preventDefault();
        this.selectCurrentUrl();
        return;
      }
      originalEnter(e);
    };
    // Create a preview container for external URLs
    this.previewEl = this.modalEl.createDiv({ cls: "image-picker-url-preview" });
    this.previewEl.style.display = "none";
    this.previewEl.style.padding = "10px";
    this.previewEl.style.textAlign = "center";
    this.previewEl.style.borderBottom = "1px solid var(--background-modifier-border)";
    this.previewEl.style.cursor = "pointer";
    this.previewEl.style.transition = "background 0.1s ease";

    this.previewEl.addEventListener("click", () => {
      this.selectCurrentUrl();
    });

    this.previewEl.addEventListener("mouseenter", () => {
      if (this.previewEl) this.previewEl.style.background = "var(--background-modifier-hover)";
    });
    this.previewEl.addEventListener("mouseleave", () => {
      if (this.previewEl) this.previewEl.style.background = "none";
    });

    const inputContainer = this.modalEl.querySelector(".prompt-input-container");
    if (inputContainer) {
      inputContainer.insertAdjacentElement("afterend", this.previewEl);
    }

    // Handle input changes to show preview
    this.inputEl.addEventListener("input", () => {
      this.updatePreview();
    });

    // CRITICAL: Intercept keydown on capture phase BEFORE Obsidian's handler
    // Also need to intercept on the modal itself to catch all keydown events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const value = this.inputEl.value.trim();
        if (value.startsWith("http://") || value.startsWith("https://")) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          this.selectCurrentUrl();
          return false;
        }
      }
    };

    // Listen on input element in capture phase
    this.inputEl.addEventListener("keydown", handleKeyDown, true);

    // Also listen on the modal element itself (capture phase)
    this.modalEl.addEventListener("keydown", handleKeyDown, true);
  }

  private selectCurrentUrl(): void {
    const value = this.inputEl.value.trim();
    if (value.startsWith("http://") || value.startsWith("https://")) {
      this.onSelectFile(value);
      this.close();
    }
  }

  private updatePreview(): void {
    if (!this.previewEl) return;

    const value = this.inputEl.value.trim();
    if (value.startsWith("http://") || value.startsWith("https://")) {
      this.previewEl.empty();
      this.previewEl.style.display = "block";

      const img = this.previewEl.createEl("img", {
        attr: { src: value },
        cls: "image-picker-preview"
      });

      img.style.maxWidth = "200px";
      img.style.maxHeight = "200px";
      img.style.objectFit = "contain";

      img.onerror = () => {
        this.previewEl!.style.display = "none";
      };

      img.onload = () => {
        // Image loaded successfully, keep it visible
      };

      this.previewEl.createDiv({
        text: "External URL detected. Click the image or press Enter to select.",
        attr: { style: "font-size: 0.8em; color: var(--text-muted); margin-top: 5px;" }
      });
    } else {
      this.previewEl.style.display = "none";
    }
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
    this.onSelectFile(item.path);
  }
}