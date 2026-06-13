# Obsidian Card Grid Plugin

## What This Is
**Current Status: v1.0.0 Production Ready.**  
A TypeScript/Obsidian plugin that renders YAML-formatted card grids using a custom code fence (`card-grid`). Features include dynamic multi-column layouts, interactive drag-to-resize between cards, specialized card types (Text, Flash, Image, Procedure, Icon, Banner, Spacer) with rich editing, and modal-based operations.

## Key Architecture Patterns
- **Registry Pattern**: Extensible built-in types via `cards/index.ts`
- **Reducer/Unidirectional Flow**: Immutable updates via `state/gridStore.ts` with typed actions
- **Factory Rendering**: Each card type implements `createView(ctx)` returning CardView
- **Grid Rebalancing**: Centralized gap configuration and grid balancing logic in `controller/GridController.ts`
- **Synchronous Mount**: `controller.mount()` is called inside the code block processor callback (not in `GridRenderChild.onload()`). This ensures grids render even when off-screen (virtual scrolling) or during PDF export.
- **Three-Priority Block Resolution**: When saving back to markdown, `CardGridRepository` locates the target block by: **1) id field** (UUID, most reliable) → **2) content match** (raw YAML source captured at render time, handles stale line numbers) → **3) line numbers** (last resort, can drift after saves).

## Core Files to Know
| File | Responsibility |
|------|---------------|
| `controller/GridController.ts` | Event orchestration, save debouncing, resize guards |
| `state/gridStore.ts` | Reducer with subscribe pattern, skip-during-resize guard |
| `cards/registry.ts` | Abstract CardTypeDefinition<TCard> interface |
| `ui/GridView.ts` | Flexbox renderer, cardDom Map memoization, update dispatch |
| `ui/CardResizer.ts` | Drag handles, flex basis adjustment (direct DOM manipulation) |
| `domain/types.ts` | Immutable data contracts: CardGridData, BaseCard, BuiltInCard |
| `plugin/CardGridPlugin.ts` | Processor registration; mounts controller **synchronously** before addChild |
| `plugin/GridRenderChild.ts` | Lifecycle wrapper; `onload()` is a no-op, `onunload()` calls destroy |
| `infrastructure/CardGridRepository.ts` | Saves grid state to vault using three-priority block resolution |

## Development Commands
- `npm run dev` — Watch mode (hot-reload)
- `npm run build` — Production bundle

## Common Patterns
1. **Adding card types**: Implement interface → register in `createDefaultRegistry()`
2. **State updates**: Call reducer, don't mutate store directly
3. **Resizing**: Direct DOM style changes during drag; dispatch only on release
4. **IDs**: Generated via `crypto.randomUUID()`, clones preserve prefixes
5. **Mounting**: Always mount synchronously in the processor callback — never rely solely on `GridRenderChild.onload()` for initial render
6. **Saving**: `GridBlockRef` carries `codeBlockSource` (original raw YAML) alongside line numbers; `CardGridRepository.save()` uses it for content-based block matching when line numbers are stale

## File Structure
```
domain/                          # Immutable contracts & core types
├── codec.ts                     # UUIDs, YAML serialization with error handling
├── defaults.ts                  # Grid config defaults (columns, gaps)
└── types.ts                     # CardGridData, BaseCard, BuiltInCard interfaces

cards/                           # Registry implementations (Factory pattern)
├── index.ts                     # Factory: createDefaultRegistry()
├── registry.ts                  # Abstract CardTypeDefinition<TCard>
├── shared/imageStyle.ts         # Constraint-based styling inheritance
└── types/
    ├── textCard.ts              # MarkdownRenderer integration
    ├── horizontalFlashCard.ts   # Side-by-side image and text layout
    ├── verticalFlashCard.ts     # Stacked image and text layout
    ├── galleryCard.ts           # Pure image display
    ├── procedureCard.ts         # Step-by-step workflow layout
    ├── bannerCard.ts            # Large centered text on background
    ├── iconCard.ts              # Small card for icons
    ├── spacerCard.ts            # Flex basis for multi-column layout control
    └── unknownCard.ts           # Fallback preserving raw data (forward compat)

controller/
└── GridController.ts            # Event orchestration, saveChain debouncing, resize guards

plugin/                          # Obsidian entry points
├── CardGridPlugin.ts            # onload(), markdown processor registration
├── GridRenderChild.ts           # MarkdownRenderChild lifecycle hook
└── menus/cardMenu.ts            # Context menu (Edit/Clone/Delete)

state/
├── actions.ts                   # GridAction union type: immutable additions only
└── gridStore.ts                 # publish-subscribe with skip-during-resize guard

ui/
├── GridView.ts                  # Flexbox renderer, cardDom Map memoization, resize guards
├── CardResizer.ts               # Drag handles, flex basis adjustment (direct DOM)
└── modals/
    ├── CardEditorModal.ts       # Builder pattern: dynamic field rendering from specs
    ├── CardTypeSuggestModal.ts  # Type selection with suggestions
    ├── ImagePickerModal.ts      # Native file picker integration
    └── LinkPickerModal.ts       # Obsidian internal link and file suggest modal
```

## Recent Changes
**Latest commits**:
- **`isFenceStart` fence variant fix**: `findCardGridBlocks` now accepts ` ```card-grid: ` and other info-string variants (e.g. manually written blocks with a trailing colon). Previously these blocks were invisible to the repository so all saves were silently dropped — the first successful save rewrites the fence to the canonical ` ```card-grid` form, self-healing the file.
- **`tryParseYaml` utility**: Added to `infrastructure/yaml.ts` — returns a discriminated union `{ ok, value } | { ok, error }` so callers can detect and report YAML syntax errors without swallowing them (foundation for the upcoming YAML validation feature).
- **Synchronous mount fix**: `controller.mount()` now called inside the processor callback, not in `GridRenderChild.onload()`. Fixes card grids below the fold not rendering in Live Preview (CM6 virtual scrolling) and all card grids appearing as raw code blocks in PDF exports.
- **Robust block resolution for saves**: `CardGridRepository` now uses three-priority lookup — id field → content match (raw YAML source captured at render time via `ref.codeBlockSource`) → line numbers. Fixes saves silently failing when using the "Collapsed Codeblocks" plugin or in documents with many card grids (where line numbers drift after previous saves).
- **`GridBlockRef` extended**: Added `codeBlockSource?: string` to carry the original YAML source for content-based block matching.
- **ProcedureCard**: New specialized card type with customizable layout/styling options (grouping, spacing controls)
- **Grid Rebalancing**: Centralized gap configuration and grid balancing logic in `controller/GridController.ts`
- **Independent Resizing**: Enhanced drag handles allowing independent width adjustment per card pair
- **Text/Flash rendering fixes**: Improved text handling and flash card layout consistency
- **Image flex adjustments**: Updated image rendering logic for proper resizing behavior during flex operations

## Development Commands
- `npm run dev` — Watch mode (hot-reload)
- `npm run build` — Production bundle