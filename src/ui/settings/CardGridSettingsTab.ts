import { App, PluginSettingTab, Setting } from "obsidian";
import type CardGridPlugin from "../../plugin/CardGridPlugin";
import { DEFAULT_SETTINGS } from "../../plugin/settings";

export class CardGridSettingsTab extends PluginSettingTab {
  plugin: CardGridPlugin;

  constructor(app: App, plugin: CardGridPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ── Page header ────────────────────────────────────────────────────────
    const header = containerEl.createDiv({ cls: "card-grid-settings-header" });
    header.createEl("h2", { text: "Card Grid" });
    header.createEl("p", {
      text: "Configure the default appearance for newly inserted grids. " +
        "These values are used when running the Insert commands — " +
        "you can always override them per-grid in the YAML.",
      cls: "card-grid-settings-subtitle"
    });

    // ── Section: Grid Layout ───────────────────────────────────────────────
    this.createSectionHeader(containerEl, "Grid Layout", "grid-2x2");

    new Setting(containerEl)
      .setName("Columns")
      .setDesc("Number of columns in a new grid.")
      .addSlider(slider => slider
        .setLimits(1, 10, 1)
        .setValue(this.plugin.settings.defaultColumns)
        .setDynamicTooltip()
        .onChange(async value => {
          this.plugin.settings.defaultColumns = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Gap")
      .setDesc("Space between cards, in pixels.")
      .addSlider(slider => slider
        .setLimits(0, 50, 1)
        .setValue(this.plugin.settings.defaultGap)
        .setDynamicTooltip()
        .onChange(async value => {
          this.plugin.settings.defaultGap = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Border Radius")
      .setDesc("Corner rounding for cards, in pixels.")
      .addSlider(slider => slider
        .setLimits(0, 30, 1)
        .setValue(this.plugin.settings.defaultBorderRadius)
        .setDynamicTooltip()
        .onChange(async value => {
          this.plugin.settings.defaultBorderRadius = value;
          await this.plugin.saveSettings();
        })
      );

    // ── Section: Images ────────────────────────────────────────────────────
    this.createSectionHeader(containerEl, "Images", "image");

    new Setting(containerEl)
      .setName("Image Height")
      .setDesc("Maximum height for card images, in pixels.")
      .addSlider(slider => slider
        .setLimits(60, 600, 10)
        .setValue(this.plugin.settings.defaultImageHeight)
        .setDynamicTooltip()
        .onChange(async value => {
          this.plugin.settings.defaultImageHeight = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Image Fit")
      .setDesc("How images fill their container.")
      .addDropdown(dropdown => dropdown
        .addOption("cover", "Cover — fill the area, crop if needed")
        .addOption("contain", "Contain — show the whole image, letterbox if needed")
        .addOption("fill", "Fill — stretch to fit exactly")
        .addOption("scale-down", "Scale Down — shrink only, never enlarge")
        .addOption("none", "None — display at natural size")
        .setValue(this.plugin.settings.defaultImageFit)
        .onChange(async (value: any) => {
          this.plugin.settings.defaultImageFit = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Image Position")
      .setDesc("CSS object-position — controls which part of the image is visible when cropped. " +
        "Examples: center, top, bottom, 50% 20%")
      .addText(text => text
        .setPlaceholder("center")
        .setValue(this.plugin.settings.defaultImagePosition)
        .onChange(async value => {
          this.plugin.settings.defaultImagePosition = value || "center";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Image Border Radius")
      .setDesc("Corner rounding applied to images inside cards, in pixels.")
      .addSlider(slider => slider
        .setLimits(0, 30, 1)
        .setValue(this.plugin.settings.defaultImageRadius)
        .setDynamicTooltip()
        .onChange(async value => {
          this.plugin.settings.defaultImageRadius = value;
          await this.plugin.saveSettings();
        })
      );

    // ── Section: Reset ─────────────────────────────────────────────────────
    this.createSectionHeader(containerEl, "Reset", "rotate-ccw");

    new Setting(containerEl)
      .setName("Restore Defaults")
      .setDesc("Reset all settings above to their original values.")
      .addButton(button => button
        .setButtonText("Restore Defaults")
        .setWarning()
        .onClick(async () => {
          Object.assign(this.plugin.settings, DEFAULT_SETTINGS);
          await this.plugin.saveSettings();
          this.display(); // re-render the tab with fresh values
        })
      );

    // ── Inline styles ──────────────────────────────────────────────────────
    // Scoped to this tab only — no external CSS file needed.
    this.injectStyles(containerEl);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private createSectionHeader(
    parent: HTMLElement,
    title: string,
    iconName: string
  ): void {
    const wrap = parent.createDiv({ cls: "card-grid-settings-section" });

    try {
      const { setIcon } = require("obsidian");
      const iconEl = wrap.createSpan({ cls: "card-grid-settings-section-icon" });
      setIcon(iconEl, iconName);
    } catch (_) { /* ignore */ }

    // Use a span instead of h3 — heading elements have UA margin/padding
    // that fights flexbox vertical alignment
    wrap.createEl("span", { text: title, cls: "card-grid-settings-section-title" });
  }

  private injectStyles(containerEl: HTMLElement): void {
    // Remove any previous injected style to avoid duplicates on re-render
    containerEl.querySelector("#card-grid-settings-style")?.remove();

    const style = containerEl.createEl("style");
    style.id = "card-grid-settings-style";
    style.textContent = `
      .card-grid-settings-header {
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid var(--background-modifier-border);
      }
      .card-grid-settings-header h2 {
        margin: 0 0 6px;
        font-size: 1.4em;
        font-weight: 700;
        color: var(--text-normal);
      }
      .card-grid-settings-subtitle {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.9em;
        line-height: 1.5;
        max-width: 540px;
      }

      /* Section dividers */
      .card-grid-settings-section {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 28px 0 4px;
        padding-bottom: 6px;
        border-bottom: 1px solid var(--background-modifier-border);
      }
      .card-grid-settings-section-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-accent);
        flex-shrink: 0;
      }
      .card-grid-settings-section-icon svg {
        width: 14px;
        height: 14px;
        display: block;
      }
      .card-grid-settings-section-title {
        font-size: 0.8em;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }

      /* Make sliders feel more at home */
      .card-grid-settings-section ~ .setting-item .slider {
        flex: 1;
        min-width: 160px;
      }

      /* Restore Defaults button spacing */
      .setting-item-control .mod-warning {
        margin-left: auto;
      }
    `;
  }
}