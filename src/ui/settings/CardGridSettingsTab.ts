import { App, PluginSettingTab, Setting } from "obsidian";
import type CardGridPlugin from "../../plugin/CardGridPlugin";

export class CardGridSettingsTab extends PluginSettingTab {
  plugin: CardGridPlugin;

  constructor(app: App, plugin: CardGridPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Card Grid Settings" });

    new Setting(containerEl)
      .setName("Default Columns")
      .setDesc("The default number of columns for new grids.")
      .addSlider((slider) =>
        slider
          .setLimits(1, 10, 1)
          .setValue(this.plugin.settings.defaultColumns)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.defaultColumns = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Gap")
      .setDesc("The default gap (in pixels) between cards.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 50, 1)
          .setValue(this.plugin.settings.defaultGap)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.defaultGap = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Border Radius")
      .setDesc("The default border radius (in pixels) for cards.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 30, 1)
          .setValue(this.plugin.settings.defaultBorderRadius)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.defaultBorderRadius = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Image Height")
      .setDesc("The default maximum height (in pixels) for images.")
      .addText((text) =>
        text
          .setPlaceholder("180")
          .setValue(String(this.plugin.settings.defaultImageHeight))
          .onChange(async (value) => {
            this.plugin.settings.defaultImageHeight = Number(value) || 180;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Image Fit")
      .setDesc("How images should fit within their containers by default.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("cover", "Cover")
          .addOption("contain", "Contain")
          .addOption("fill", "Fill")
          .addOption("none", "None")
          .addOption("scale-down", "Scale Down")
          .setValue(this.plugin.settings.defaultImageFit)
          .onChange(async (value: any) => {
            this.plugin.settings.defaultImageFit = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Image Position")
      .setDesc("The default CSS object-position (e.g., 'center', 'top', '50% 50%').")
      .addText((text) =>
        text
          .setPlaceholder("center")
          .setValue(this.plugin.settings.defaultImagePosition)
          .onChange(async (value) => {
            this.plugin.settings.defaultImagePosition = value || "center";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Default Image Radius")
      .setDesc("The default border radius (in pixels) for images.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 30, 1)
          .setValue(this.plugin.settings.defaultImageRadius)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.defaultImageRadius = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
