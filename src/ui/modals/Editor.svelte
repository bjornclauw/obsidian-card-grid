<script lang="ts">
    import { onMount } from "svelte";
    import type { App, Plugin } from "obsidian";
    import type { CardGridData, CardInstance } from "../../domain/types";
    import type { CardTypeDefinition } from "../../cards/registry";
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

    // Reactive preview trigger
    $: {
        draft; // Track changes to draft
        if (previewView) {
            clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(updatePreview, 100);
        }
    }

    onMount(() => {
        const ctx = { app, plugin, sourcePath, grid };
        previewView = def.createView(ctx);
        previewContainer.appendChild(previewView.el);
        updatePreview();
    });

    function updatePreview() {
        if (!previewView) return;
        const ctx = { app, plugin, sourcePath, grid };

        // Replicate the real-world layout logic
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

        const realPixelWidth =
            ((gridWidth + gap) / columns) * widthFraction - gap;
        previewView.el.style.width = `${realPixelWidth}px`;
        previewView.el.style.height = "auto";
        previewView.el.style.flex = "none";

        const ratio = widthFraction / columns;
        let zoom = ratio > 0.8 ? 0.5 : ratio > 0.4 ? 0.6 : 0.8;
        if (def.type === "procedure" && ratio > 0.4) zoom = 0.45;
        previewView.el.style.zoom = String(zoom);

        const normalized = def.normalize(draft);
        previewView.update(normalized, ctx);
    }

    function openImagePicker(key: string) {
        new ImagePickerModal(app, (file) => {
            draft[key] = file.path;
            draft = { ...draft }; // Trigger reactivity
        }).open();
    }
</script>

<div class="card-grid-modal-container">
    <div class="card-grid-editor-side">
        {#each def.editor.fields as field}
            <div class="setting-item">
                <div class="setting-item-info">
                    <div class="setting-item-name">{field.label}</div>
                </div>
                <div class="setting-item-control">
                    {#if field.kind === "text"}
                        <input
                            type="text"
                            bind:value={draft[field.key]}
                            placeholder={field.placeholder ?? ""}
                        />
                    {:else if field.kind === "number"}
                        <input
                            type="number"
                            bind:value={draft[field.key]}
                            step={field.step ?? 1}
                        />
                    {:else if field.kind === "toggle"}
                        <div
                            class="checkbox-container"
                            class:is-enabled={draft[field.key]}
                            role="checkbox"
                            aria-checked={draft[field.key]}
                            tabindex="0"
                            on:click={() => {
                                draft[field.key] = !draft[field.key];
                                draft = { ...draft };
                            }}
                            on:keydown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    draft[field.key] = !draft[field.key];
                                    draft = { ...draft };
                                }
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={draft[field.key]}
                                tabindex="-1"
                            />
                        </div>
                    {:else if field.kind === "select"}
                        <select bind:value={draft[field.key]}>
                            {#each field.options as opt}
                                <option value={opt.value}>{opt.label}</option>
                            {/each}
                        </select>
                    {:else if field.kind === "color"}
                        <input type="color" bind:value={draft[field.key]} />
                    {:else if field.kind === "image-file"}
                        <div class="image-field-row">
                            <span class="path-text"
                                >{draft[field.key] || "(none)"}</span
                            >
                            <button on:click={() => openImagePicker(field.key)}
                                >Choose...</button
                            >
                            <button
                                on:click={() => {
                                    draft[field.key] = "";
                                    draft = { ...draft };
                                }}>Clear</button
                            >
                        </div>
                    {:else if field.kind === "markdown"}
                        <textarea
                            bind:value={draft[field.key]}
                            rows="8"
                            placeholder={field.placeholder ?? ""}
                        ></textarea>
                    {/if}
                </div>
            </div>
        {/each}
    </div>

    <div class="card-grid-preview-side">
        <div class="preview-label">Preview</div>
        <div bind:this={previewContainer} class="preview-host"></div>
    </div>
</div>

<div class="modal-button-container">
    <button on:click={onCancel}>Cancel</button>
    <button class="mod-cta" on:click={() => onSave(draft)}>Save</button>
</div>

<style>
    .card-grid-modal-container {
        display: flex;
        flex-direction: row;
        gap: 20px;
        height: 60vh;
    }
    .card-grid-editor-side {
        flex: 1.2;
        overflow-y: auto;
        padding-right: 15px;
    }
    .card-grid-preview-side {
        flex: 0.8;
        display: flex;
        flex-direction: column;
        background: var(--background-secondary);
        border-radius: 8px;
        padding: 20px;
        border: 1px solid var(--background-modifier-border);
        overflow: hidden;
        justify-content: center;
        align-items: center;
    }
    .preview-label {
        font-size: 0.8em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 20px;
        font-weight: bold;
    }
    .setting-item {
        display: flex;
        flex-direction: column;
        padding: 12px 0;
        border-top: 1px solid var(--background-modifier-border);
    }
    .setting-item:first-child {
        border-top: none;
    }
    .setting-item-name {
        font-weight: 600;
        margin-bottom: 8px;
    }

    input[type="text"],
    input[type="number"],
    select,
    textarea {
        width: 100%;
    }

    .image-field-row {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .path-text {
        flex: 1;
        font-size: 0.8em;
        color: var(--text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .modal-button-container {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }

    /* Standard Obsidian toggle styling */
    .checkbox-container {
        background-color: var(--interactive-normal);
        border-radius: 12px;
        cursor: pointer;
        height: 24px;
        position: relative;
        transition: background-color 0.15s ease-in-out;
        width: 45px;
    }
    .checkbox-container.is-enabled {
        background-color: var(--interactive-accent);
    }
    .checkbox-container:focus-visible {
        outline: 2px solid var(--interactive-accent);
        outline-offset: 2px;
    }
    .checkbox-container input {
        pointer-events: none;
    }
</style>
