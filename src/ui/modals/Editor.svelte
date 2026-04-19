<script lang="ts">
    import { onMount } from "svelte";
    import type { App, Plugin } from "obsidian";
    import type { CardGridData } from "../../domain/types";
    import type {
        CardTypeDefinition,
        CardEditorField,
    } from "../../cards/registry";
    import { ImagePickerModal } from "./ImagePickerModal";

    export let app: App;
    export let plugin: Plugin;
    export let grid: CardGridData;
    export let def: CardTypeDefinition;
    export let draft: Record<string, any>;
    export let sourcePath: string;
    export let onSave: (draft: any) => void;
    export let onCancel: () => void;

    let previewContainer: HTMLElement;
    let previewView: any;
    let debounceTimer: number;
    let previewPanelEl: HTMLElement;

    // Cast grid to any in the script block where TS is allowed
    $: gridAny = grid as any;

    // Calculate dynamic constraints for the width field to match CardResizer logic
    $: widthConstraints = (() => {
        const columns = grid.columns || 3;
        if (!draft.id) return { min: 0.3, max: columns };

        const cards = grid.cards;
        const index = cards.findIndex((c) => c.id === draft.id);
        if (index === -1) return { min: 0.3, max: columns };

        const indexInRow = (index % columns) + 1;

        // Logic matching CardResizer.ts behavior
        if (indexInRow < columns && index + 1 < cards.length) {
            // Balanced resize behavior
            const currentCard = cards[index];
            const nextCard = cards[index + 1];
            const total = (currentCard.width ?? 1) + (nextCard.width ?? 1);
            return {
                min: 0.3,
                max: Math.max(0.3, Math.floor((total - 0.3) * 100) / 100),
            };
        } else {
            // Unbalanced resize behavior (at the end of a row or end of grid)
            const rowIndex = Math.floor(index / columns);
            const startOfRow = rowIndex * columns;
            let sumPrev = 0;
            for (let i = startOfRow; i < index; i++) {
                sumPrev += cards[i].width ?? 1;
            }
            return {
                min: 0.3,
                max: Math.max(0.3, Math.floor((columns - sumPrev) * 100) / 100),
            };
        }
    })();

    $: {
        draft;
        if (previewView) {
            clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(updatePreview, 80);
        }
    }

    onMount(() => {
        const ctx = { app, plugin, sourcePath, grid };
        previewView = def.createView(ctx);

        // Reset flex properties that might interfere with modal layout
        previewView.el.style.flex = "none";

        previewContainer.appendChild(previewView.el);
        updatePreview();
    });

    function updatePreview() {
        if (!previewView) return;
        const ctx = { app, plugin, sourcePath, grid };

        // 1. Determine the actual width of the grid on screen to replicate layout accurately
        const gridHost = document.querySelector(
            `[data-card-grid-id="${grid.id}"]`,
        );
        const gridContainer = gridHost?.querySelector(
            ".card-grid-container",
        ) as HTMLElement;
        const gridWidth = gridContainer?.offsetWidth || 800;

        const columns = grid.columns || 3;
        const gap = grid.gap ?? 10;
        const widthFraction = Number(draft.width) || 1;

        // 2. Calculate exactly how wide this card is in the actual grid
        const realPixelWidth =
            ((gridWidth + gap) / columns) * widthFraction - gap;

        // 3. Update view with current data
        const normalized = def.normalize(draft);
        previewView.update(normalized, ctx);

        // 4. Apply the real width and the "spot on" zoom factors
        previewView.el.style.width = `${realPixelWidth}px`;
        previewView.el.style.height = "auto";
        previewView.el.style.flex = "none";

        // Apply grid-level styling to preview
        previewView.el.style.borderRadius = `${grid.borderRadius}px`;
        previewView.el.style.overflow = "hidden";

        const ratio = widthFraction / columns;
        let zoom = ratio > 0.8 ? 0.5 : ratio > 0.4 ? 0.6 : 0.8;
        if (def.type === "procedureCard" && ratio > 0.4) zoom = 0.45;

        // @ts-ignore - zoom works reliably in Obsidian's Electron environment
        previewView.el.style.zoom = String(zoom);
    }

    function openImagePicker(key: string) {
        new ImagePickerModal(app, (file) => {
            draft[key] = file.path;
            draft = { ...draft };
        }).open();
    }

    // Color fields shown inline
    // Number fields shown as compact spinner
</script>

<div class="cge-wrap">
    <div class="cge-left">
        <div class="cge-fields">
            {#each def.editor.fields.filter((f) => !["imageEnabled", "titleEnabled"].includes(f.key)) as field}
                <div
                    class="cge-row"
                    class:cge-row-tall={field.kind === "markdown"}
                >
                    <div class="cge-field-label">{field.label}</div>
                    <div class="cge-field-control">
                        {#if field.kind === "text"}
                            <div class="cge-image-row">
                                {#if def.editor.fields.some((f) => f.key === field.key + "Enabled")}
                                    <div
                                        class="cge-toggle-mini"
                                        class:cge-on={draft[
                                            field.key + "Enabled"
                                        ] !== false}
                                        role="checkbox"
                                        aria-checked={draft[
                                            field.key + "Enabled"
                                        ] !== false}
                                        tabindex="0"
                                        on:click={() => {
                                            draft[field.key + "Enabled"] =
                                                draft[field.key + "Enabled"] ===
                                                false;
                                            draft = { ...draft };
                                        }}
                                        on:keydown={(e) => {
                                            if (
                                                e.key === " " ||
                                                e.key === "Enter"
                                            ) {
                                                e.preventDefault();
                                                draft[field.key + "Enabled"] =
                                                    draft[
                                                        field.key + "Enabled"
                                                    ] === false;
                                                draft = { ...draft };
                                            }
                                        }}
                                        title="Show/Hide {field.label}"
                                    ></div>
                                {/if}
                                <input
                                    class="cge-text-input"
                                    type="text"
                                    bind:value={draft[field.key]}
                                    placeholder={field.placeholder ?? ""}
                                />
                            </div>
                        {:else if field.kind === "number"}
                            <div class="cge-number-row">
                                <button
                                    class="cge-stepper"
                                    on:click={() => {
                                        const step =
                                            field.key === "width"
                                                ? 0.1
                                                : (field.step ?? 1);
                                        const base =
                                            draft[field.key] ??
                                            gridAny[field.key] ??
                                            0;
                                        let val = Number(base) - step;
                                        if (field.key === "width") {
                                            val = Math.max(
                                                widthConstraints.min,
                                                Math.round(val * 100) / 100,
                                            );
                                        }
                                        draft[field.key] = val;
                                        draft = { ...draft };
                                    }}>−</button
                                >
                                <input
                                    class="cge-number-input"
                                    type="number"
                                    value={draft[field.key] ??
                                        (field.key === "width"
                                            ? (gridAny[field.key] ?? 1)
                                            : (gridAny[field.key] ?? "")) ??
                                        ""}
                                    on:input={(e) => {
                                        let val =
                                            e.currentTarget.value === ""
                                                ? undefined
                                                : Number(e.currentTarget.value);

                                        if (
                                            val !== undefined &&
                                            field.key === "width"
                                        ) {
                                            // Clamp strictly to bounds first to prevent overshooting constraints
                                            val = Math.min(
                                                widthConstraints.max,
                                                Math.max(
                                                    widthConstraints.min,
                                                    val,
                                                ),
                                            );
                                            // Round to 0.01 precision to prevent floating point row-wrap issues
                                            val = Math.round(val * 100) / 100;
                                        }

                                        draft[field.key] = val;
                                        draft = { ...draft };
                                    }}
                                    step={field.key === "width"
                                        ? 0.1
                                        : (field.step ?? 1)}
                                    min={field.key === "width"
                                        ? widthConstraints.min
                                        : (field.min ?? undefined)}
                                    max={field.key === "width"
                                        ? widthConstraints.max
                                        : undefined}
                                />
                                <button
                                    class="cge-stepper"
                                    on:click={() => {
                                        const step =
                                            field.key === "width"
                                                ? 0.1
                                                : (field.step ?? 1);
                                        const base =
                                            draft[field.key] ??
                                            gridAny[field.key] ??
                                            0;
                                        let val = Number(base) + step;
                                        if (field.key === "width") {
                                            val = Math.min(
                                                widthConstraints.max,
                                                Math.round(val * 100) / 100,
                                            );
                                        }
                                        draft[field.key] = val;
                                        draft = { ...draft };
                                    }}>+</button
                                >
                            </div>
                        {:else if field.kind === "toggle"}
                            <div
                                class="cge-toggle"
                                class:cge-on={draft[field.key]}
                                role="checkbox"
                                aria-checked={draft[field.key]}
                                tabindex="0"
                                on:click={() => {
                                    draft[field.key] = !draft[field.key];
                                    draft = { ...draft };
                                }}
                                on:keydown={(e) => {
                                    if (e.key === " " || e.key === "Enter") {
                                        e.preventDefault();
                                        draft[field.key] = !draft[field.key];
                                        draft = { ...draft };
                                    }
                                }}
                            >
                                <div class="cge-thumb"></div>
                                <span class="cge-toggle-label"
                                    >{draft[field.key] ? "On" : "Off"}</span
                                >
                            </div>
                        {:else if field.kind === "select"}
                            {#if field.options.length <= 5}
                                <div class="cge-btn-group">
                                    {#each field.options as opt}
                                        <button
                                            class="cge-opt-btn"
                                            class:cge-opt-active={draft[
                                                field.key
                                            ] === opt.value}
                                            on:click={() => {
                                                draft[field.key] = opt.value;
                                                draft = { ...draft };
                                            }}>{opt.label}</button
                                        >
                                    {/each}
                                </div>
                            {:else}
                                <select
                                    class="cge-select"
                                    bind:value={draft[field.key]}
                                >
                                    {#each field.options as opt}
                                        <option value={opt.value}
                                            >{opt.label}</option
                                        >
                                    {/each}
                                </select>
                            {/if}
                        {:else if field.kind === "color"}
                            <div class="cge-color-row">
                                <label
                                    class="cge-color-swatch-btn"
                                    style="background:{draft[field.key] ||
                                        '#cccccc'}"
                                >
                                    <input
                                        type="color"
                                        bind:value={draft[field.key]}
                                    />
                                </label>
                                <input
                                    class="cge-text-input cge-color-text"
                                    type="text"
                                    bind:value={draft[field.key]}
                                    placeholder="#cccccc"
                                    maxlength="7"
                                />
                                {#if draft[field.key] !== undefined && draft[field.key] !== field.defaultValue}
                                    <button
                                        class="cge-action-btn cge-danger-btn"
                                        title="Reset to default"
                                        on:click={() => {
                                            draft[field.key] =
                                                field.defaultValue;
                                            draft = { ...draft };
                                        }}>✕</button
                                    >
                                {/if}
                            </div>
                        {:else if field.kind === "image-file"}
                            <div class="cge-image-row">
                                {#if def.editor.fields.some((f) => f.key === field.key + "Enabled")}
                                    <div
                                        class="cge-toggle-mini"
                                        class:cge-on={draft[
                                            field.key + "Enabled"
                                        ] !== false}
                                        role="checkbox"
                                        aria-checked={draft[
                                            field.key + "Enabled"
                                        ] !== false}
                                        tabindex="0"
                                        on:click={() => {
                                            draft[field.key + "Enabled"] =
                                                draft[field.key + "Enabled"] ===
                                                false;
                                            draft = { ...draft };
                                        }}
                                        on:keydown={(e) => {
                                            if (
                                                e.key === " " ||
                                                e.key === "Enter"
                                            ) {
                                                e.preventDefault();
                                                draft[field.key + "Enabled"] =
                                                    draft[
                                                        field.key + "Enabled"
                                                    ] === false;
                                                draft = { ...draft };
                                            }
                                        }}
                                        title="Show/Hide Image"
                                    ></div>
                                {/if}
                                <span class="cge-path-chip"
                                    >{draft[field.key]
                                        ? draft[field.key].split("/").pop()
                                        : "None"}</span
                                >
                                <button
                                    class="cge-action-btn"
                                    on:click={() => openImagePicker(field.key)}
                                    >Browse</button
                                >
                                {#if draft[field.key]}
                                    <button
                                        class="cge-action-btn cge-danger-btn"
                                        on:click={() => {
                                            draft[field.key] = "";
                                            draft = { ...draft };
                                        }}>✕</button
                                    >
                                {/if}
                            </div>
                        {:else if field.kind === "markdown"}
                            <textarea
                                class="cge-textarea"
                                bind:value={draft[field.key]}
                                rows="5"
                                placeholder={field.placeholder ?? "Markdown…"}
                            ></textarea>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>

        <div class="cge-footer">
            <button class="cge-foot-btn cge-cancel" on:click={onCancel}
                >Cancel</button
            >
            <button class="cge-foot-btn cge-save" on:click={() => onSave(draft)}
                >Save</button
            >
        </div>
    </div>

    <div class="cge-preview" bind:this={previewPanelEl}>
        <div class="cge-preview-label">Preview</div>
        <div class="cge-preview-inner" bind:this={previewContainer}></div>
    </div>
</div>

<style>
    /* ── Shell ── */
    .cge-wrap {
        display: flex;
        gap: 0;
        height: 58vh;
        min-height: 360px;
        margin: 0 -16px -16px;
        overflow: hidden;
    }

    /* ── Left: form ── */
    .cge-left {
        flex: 1.2;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: 1px solid var(--background-modifier-border);
    }

    .cge-fields {
        flex: 1;
        overflow-y: auto;
        padding: 6px 14px 0;
    }

    /* ── Rows ── */
    .cge-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 0;
        border-bottom: 1px solid var(--background-modifier-border);
        min-height: 36px;
    }

    .cge-row-tall {
        align-items: flex-start;
        padding: 8px 0;
    }

    .cge-row:last-child {
        border-bottom: none;
    }

    .cge-field-label {
        flex: 0 0 100px;
        font-size: 12px;
        font-weight: 500;
        color: var(--text-muted);
        text-transform: capitalize;
        white-space: nowrap;
        padding-top: 1px;
    }

    .cge-row-tall .cge-field-label {
        padding-top: 6px;
    }

    .cge-field-control {
        flex: 1;
        min-width: 0;
    }

    /* ── Text input ── */
    .cge-text-input {
        width: 100%;
        height: 28px;
        padding: 0 8px;
        font-size: 13px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 5px;
        background: var(--background-primary);
        color: var(--text-normal);
        box-sizing: border-box;
        outline: none;
    }

    .cge-text-input:focus {
        border-color: var(--interactive-accent);
    }

    /* ── Number stepper ── */
    .cge-number-row {
        display: flex;
        align-items: center;
        gap: 0;
        width: fit-content;
        border: 1px solid var(--background-modifier-border);
        border-radius: 5px;
        overflow: hidden;
        background: var(--background-primary);
    }

    .cge-stepper {
        width: 26px;
        height: 28px;
        border: none;
        background: var(--background-secondary);
        color: var(--text-normal);
        font-size: 15px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        line-height: 1;
    }

    .cge-stepper:hover {
        background: var(--background-modifier-hover);
    }

    .cge-number-input {
        width: 52px;
        height: 28px;
        border: none;
        border-left: 1px solid var(--background-modifier-border);
        border-right: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        color: var(--text-normal);
        font-size: 13px;
        text-align: center;
        outline: none;
        padding: 0;
        -moz-appearance: textfield;
    }

    .cge-number-input::-webkit-inner-spin-button,
    .cge-number-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
    }

    /* ── Toggle ── */
    .cge-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        user-select: none;
        width: fit-content;
    }

    .cge-toggle::before {
        content: "";
        display: block;
        width: 36px;
        height: 20px;
        border-radius: 10px;
        background: var(--background-modifier-border);
        position: relative;
        transition: background 0.18s;
        flex-shrink: 0;
    }

    .cge-toggle.cge-on::before {
        background: var(--interactive-accent);
    }

    .cge-thumb {
        display: none; /* Using ::before + ::after instead */
    }

    .cge-toggle {
        position: relative;
    }

    .cge-toggle::after {
        content: "";
        position: absolute;
        left: 3px;
        top: 50%;
        transform: translateY(-50%);
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        transition: left 0.18s;
        pointer-events: none;
    }

    .cge-toggle.cge-on::after {
        left: 19px;
    }

    .cge-toggle-label {
        font-size: 12px;
        color: var(--text-muted);
        padding-left: 44px;
    }

    /* ── Mini Toggle (Inline) ── */
    .cge-toggle-mini {
        width: 28px;
        height: 16px;
        border-radius: 8px;
        background: var(--background-modifier-border);
        position: relative;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.15s;
    }
    .cge-toggle-mini.cge-on {
        background: var(--interactive-accent);
    }
    .cge-toggle-mini::after {
        content: "";
        position: absolute;
        left: 2px;
        top: 2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        transition: transform 0.15s;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    .cge-toggle-mini.cge-on::after {
        transform: translateX(12px);
    }

    /* ── Button group (select replacement) ── */
    .cge-btn-group {
        display: flex;
        gap: 3px;
        flex-wrap: wrap;
    }

    .cge-opt-btn {
        padding: 3px 10px;
        font-size: 12px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background: var(--background-primary);
        color: var(--text-muted);
        cursor: pointer;
        transition: all 0.12s;
        white-space: nowrap;
    }

    .cge-opt-btn:hover {
        background: var(--background-modifier-hover);
        color: var(--text-normal);
    }

    .cge-opt-active {
        background: var(--interactive-accent) !important;
        color: var(--text-on-accent) !important;
        border-color: var(--interactive-accent) !important;
    }

    /* ── Fallback select ── */
    .cge-select {
        height: 28px;
        padding: 0 8px;
        font-size: 13px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 5px;
        background: var(--background-primary);
        color: var(--text-normal);
        cursor: pointer;
        outline: none;
        max-width: 200px;
    }

    /* ── Color ── */
    .cge-color-row {
        display: flex;
        align-items: center;
        gap: 7px;
    }

    .cge-color-swatch-btn {
        width: 28px;
        height: 28px;
        border-radius: 5px;
        border: 1px solid var(--background-modifier-border);
        cursor: pointer;
        flex-shrink: 0;
        overflow: hidden;
        display: block;
    }

    .cge-color-swatch-btn input {
        opacity: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
        padding: 0;
        border: none;
    }

    .cge-color-text {
        width: 90px !important;
        font-family: var(--font-monospace);
        font-size: 12px !important;
    }

    /* ── Image file ── */
    .cge-image-row {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
    }

    .cge-path-chip {
        font-size: 11px;
        color: var(--text-muted);
        background: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        padding: 3px 7px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 140px;
        font-family: var(--font-monospace);
    }

    .cge-action-btn {
        padding: 3px 9px;
        font-size: 12px;
        border: 1px solid var(--background-modifier-border);
        border-radius: 4px;
        background: var(--background-secondary);
        color: var(--text-normal);
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .cge-action-btn:hover {
        background: var(--background-modifier-hover);
    }

    .cge-danger-btn {
        color: var(--text-error);
        border-color: var(--text-error);
    }

    /* ── Textarea ── */
    .cge-textarea {
        width: 100%;
        padding: 7px 9px;
        font-size: 13px;
        font-family: var(--font-monospace);
        border: 1px solid var(--background-modifier-border);
        border-radius: 5px;
        background: var(--background-primary);
        color: var(--text-normal);
        resize: none;
        box-sizing: border-box;
        outline: none;
        line-height: 1.5;
    }

    .cge-textarea:focus {
        border-color: var(--interactive-accent);
    }

    /* ── Footer ── */
    .cge-footer {
        display: flex;
        justify-content: flex-end;
        gap: 7px;
        padding: 10px 14px;
        border-top: 1px solid var(--background-modifier-border);
        flex-shrink: 0;
    }

    .cge-foot-btn {
        padding: 5px 16px;
        font-size: 13px;
        font-weight: 500;
        border-radius: 5px;
        cursor: pointer;
        border: 1px solid var(--background-modifier-border);
    }

    .cge-cancel {
        background: var(--background-secondary);
        color: var(--text-muted);
    }

    .cge-cancel:hover {
        color: var(--text-normal);
        background: var(--background-modifier-hover);
    }

    .cge-save {
        background: var(--interactive-accent);
        color: var(--text-on-accent);
        border-color: transparent;
    }

    .cge-save:hover {
        opacity: 0.88;
    }

    /* ── Preview panel ── */
    .cge-preview {
        flex: 0.9;
        display: flex;
        flex-direction: column;
        background: var(--background-secondary);
        overflow: hidden;
        position: relative;
    }

    .cge-preview-label {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--text-faint);
        padding: 10px 14px 6px;
        border-bottom: 1px solid var(--background-modifier-border);
        background: var(--background-primary);
        flex-shrink: 0;
    }

    .cge-preview-inner {
        flex: 1;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 20px 16px;
        overflow: hidden;
    }
</style>
