import { Plugin, Notice, Editor, MarkdownView } from "obsidian";
import { createDefaultRegistry } from "../cards";
import { GridController } from "../controller/GridController";
import { GridRenderChild } from "./GridRenderChild";
import { ImagePickerModal } from "../ui/modals/ImagePickerModal";
import { CardGridSettings, DEFAULT_SETTINGS } from "./settings";
import { CardGridSettingsTab } from "../ui/settings/CardGridSettingsTab";

export default class CardGridPlugin extends Plugin {
  private readonly registry = createDefaultRegistry();
  settings: CardGridSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Add settings tab
    this.addSettingTab(new CardGridSettingsTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor("card-grid", (source, el, ctx) => {
      el.empty();

      const sectionInfo = ctx.getSectionInfo?.(el);
      const ref = {
        sourcePath: ctx.sourcePath,
        lineStart: sectionInfo?.lineStart,
        lineEnd: sectionInfo?.lineEnd
      };

      const controller = new GridController({
        app: this.app,
        plugin: this,
        registry: this.registry,
        hostEl: el,
        ref,
        codeBlockSource: source
      });

      ctx.addChild(new GridRenderChild(el, controller));
    });



    // Add Command Palette commands
    this.addCommand({
      id: "insert-card-grid",
      name: "Insert New Card Grid",
      editorCallback: (editor: Editor) => {
        const sampleGrid = `\`\`\`card-grid
columns: ${this.settings.defaultColumns}
gap: ${this.settings.defaultGap}

cards:
  - type: textCard
    title: Hello World
    text: This is a text card.
  - type: textCard
    title: Another Card
    text: Customize this grid in the editor.
\`\`\`
`;
        editor.replaceSelection(sampleGrid);
      },
    });

    this.addCommand({
      id: "open-image-picker",
      name: "Open Image Picker",
      editorCallback: (editor: Editor) => {
        new ImagePickerModal(this.app, (file) => {
          editor.replaceSelection(file.path);
        }).open();
      },
    });

    this.addCommand({
      id: "insert-gallery-grid",
      name: "Insert Gallery Grid",
      editorCallback: (editor: Editor) => {
        const sample = `\`\`\`card-grid
columns: 3
imageFit: cover
imageHeight: 200

cards:
  - type: galleryCard
    title: Image 1
    image: path/to/image1.jpg
  - type: galleryCard
    title: Image 2
    image: path/to/image2.jpg
  - type: galleryCard
    title: Image 3
    image: path/to/image3.jpg
\`\`\`
`;
        editor.replaceSelection(sample);
      }
    });

    this.addCommand({
      id: "insert-procedure-grid",
      name: "Insert Procedure Grid",
      editorCallback: (editor: Editor) => {
        const sample = `\`\`\`card-grid
columns: 1
gap: 20

cards:
  - type: procedureCard
    title: "Step 1: Preparation"
    text: Gather all necessary materials.
  - type: procedureCard
    title: "Step 2: Implementation"
    text: Follow the instructions carefully.
  - type: procedureCard
    title: "Step 3: Cleanup"
    text: Store everything back in its place.
\`\`\`
`;
        editor.replaceSelection(sample);
      }
    });

    this.addCommand({
      id: "insert-icon-grid",
      name: "Insert Icon Grid",
      editorCallback: (editor: Editor) => {
        const sample = `\`\`\`card-grid
columns: 4
gap: 15

cards:
  - type: iconCard
    title: Search
    icon: search
    backgroundColor: "#f0f0f0"
  - type: iconCard
    title: Settings
    icon: settings
  - type: iconCard
    title: User
    icon: user
  - type: iconCard
    title: Home
    icon: home
\`\`\`
`;
        editor.replaceSelection(sample);
      }
    });

    this.addCommand({
      id: "open-card-grid-settings",
      name: "Open Settings",
      callback: () => {
        (this.app as any).setting.open();
        (this.app as any).setting.openTabById(this.manifest.id);
      },
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}