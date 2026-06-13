import { Plugin, Notice, Editor, MarkdownView } from "obsidian";
import { createDefaultRegistry } from "../cards";
import { GridController } from "../controller/GridController";
import { GridRenderChild } from "./GridRenderChild";
import { CardGridSettings, DEFAULT_SETTINGS } from "./settings";
import { CardGridSettingsTab } from "../ui/settings/CardGridSettingsTab";

export default class CardGridPlugin extends Plugin {
  private readonly registry = createDefaultRegistry();
  settings: CardGridSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addSettingTab(new CardGridSettingsTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor("card-grid", (source, el, ctx) => {
      el.empty();

      const sectionInfo = ctx.getSectionInfo?.(el);
      const ref = {
        sourcePath: ctx.sourcePath,
        lineStart: sectionInfo?.lineStart,
        lineEnd: sectionInfo?.lineEnd,
        // Store the raw YAML source so the repository can use content-based
        // matching as a fallback when line numbers become stale (large
        // documents, Collapsed Codeblocks plugin remounting, etc.)
        codeBlockSource: source
      };

      const controller = new GridController({
        app: this.app,
        plugin: this,
        registry: this.registry,
        hostEl: el,
        ref,
        codeBlockSource: source
      });

      // Mount synchronously here so the grid DOM is fully built inside this
      // callback.  This is critical for two cases:
      //   1. PDF export: Obsidian snapshots the DOM for printing without
      //      waiting for MarkdownRenderChild.onload() — blocks that were
      //      never in the viewport stay as raw code blocks in the PDF.
      //   2. Live Preview virtual scrolling: CM6 may never call onload() for
      //      blocks below the fold until the user scrolls to them.
      // GridRenderChild.onload() is now a no-op guard; onunload() still owns
      // the destroy lifecycle.
      controller.mount();

      ctx.addChild(new GridRenderChild(el, controller));
    });


    // ── Command Palette ────────────────────────────────────────────────────

    this.addCommand({
      id: "insert-card-grid",
      name: "Insert New Card Grid",
      editorCallback: (editor: Editor) => {
        const s = this.settings;
        editor.replaceSelection(
          `\`\`\`card-grid
columns: ${s.defaultColumns}
gap: ${s.defaultGap}
borderRadius: ${s.defaultBorderRadius}

cards:
  - type: bannerCard
    title: "**Welcome to Card Grid**"
    text: "Experience **responsive layouts** with full *Markdown* support in every field."
    icon: "💡"
    width: 3
    backgroundColor: "var(--background-secondary-alt)"

  - type: textCard
    title: "🏗️ **Custom Widths**"
    text: >
      This card has a custom \`width: 1.8\`.
      Combine different sizes to create unique dashboards.
      ==Try dragging the right edge!==
    width: 1.8
    backgroundColor: "var(--background-modifier-border)"

  - type: verticalFlashCard
    title: "📱 **Vertical Flash**"
    text: "Vertical cards stack content beautifully for **portrait** imagery."
    image: "https://picsum.photos/seed/obsidian/400/600"
    width: 1.2

  - type: horizontalFlashCard
    title: "🖼️ **Visual Layouts**"
    text: >
      Flash cards support **side-by-side** display.
      Perfect for feature lists or documentation.
    image: https://picsum.photos/seed/flash/600/400
    width: 2

  - type: iconCard
    title: "**Settings**"
    text: "Fully *customizable*."
    icon: "settings"
    width: 1
    textColor: "var(--text-accent)"
\`\`\`
`
        );
      },
    });

    this.addCommand({
      id: "insert-gallery-grid",
      name: "Insert Gallery Grid",
      editorCallback: (editor: Editor) => {
        const s = this.settings;
        editor.replaceSelection(
          `\`\`\`card-grid
columns: ${s.defaultColumns}
gap: ${s.defaultGap}
borderRadius: ${s.defaultBorderRadius}
imageFit: ${s.defaultImageFit}
imageHeight: ${s.defaultImageHeight}
imagePosition: ${s.defaultImagePosition}
imageRadius: ${s.defaultImageRadius}

cards:
  - type: galleryCard
    title: "**Mountain** Sunrise"
    text: "A *breathtaking* view from the peak."
    image: https://picsum.photos/seed/mountain/600/400

  - type: galleryCard
    title: "**Ocean** Calm"
    text: "Still waters at the *break of dawn*."
    image: https://picsum.photos/seed/ocean/600/400

  - type: galleryCard
    title: "**Forest** Path"
    text: "A quiet trail through *ancient* trees."
    image: https://picsum.photos/seed/forest/600/400
\`\`\`
`
        );
      }
    });

    this.addCommand({
      id: "insert-procedure-grid",
      name: "Insert Procedure Grid",
      editorCallback: (editor: Editor) => {
        const s = this.settings;
        editor.replaceSelection(
          `\`\`\`card-grid
columns: ${s.defaultColumns}
gap: ${s.defaultGap}
borderRadius: ${s.defaultBorderRadius}

cards:
  - type: procedureCard
    title: "**Step ①**: Prepare"
    text: >
      Gather **everything** you need before
      starting. A *clean workspace* helps.
    image: https://picsum.photos/seed/step1/600/400

  - type: procedureCard
    title: "**Step ②**: Execute"
    text: >
      Follow each step **carefully** and
      check your *progress* as you go.
    image: https://picsum.photos/seed/step2/600/400

  - type: procedureCard
    title: "**Step ③**: Review"
    text: >
      Double-check the **result** and store
      everything *back in its place*.
    image: https://picsum.photos/seed/step3/600/400
\`\`\`
`
        );
      }
    });

    this.addCommand({
      id: "insert-icon-grid",
      name: "Insert Icon Grid",
      editorCallback: (editor: Editor) => {
        const s = this.settings;
        editor.replaceSelection(
          `\`\`\`card-grid
columns: ${s.defaultColumns}
gap: ${s.defaultGap}
borderRadius: ${s.defaultBorderRadius}

cards:
  - type: iconCard
    title: "**Search**"
    text: "Find *anything* in your vault **instantly**."
    icon: search

  - type: iconCard
    title: "**Bookmarks**"
    text: "Save and *revisit* your favourite notes."
    icon: bookmark

  - type: iconCard
    title: "**Calendar**"
    text: "Keep track of *dates* and **deadlines**."
    icon: calendar

  - type: iconCard
    title: "**Settings**"
    text: "Tweak the plugin to *suit your workflow*."
    icon: settings
\`\`\`
`
        );
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