# Obsidian Card Grid Plugin

## What This Is
A TypeScript/Obsidian plugin that renders YAML-formatted card grids using a custom code fence (`~~~card-grid`). Features include dynamic multi-column layouts, interactive drag-to-resize between cards, image/text card types with rich editing, and modal-based operations.

## Key Architecture Patterns
- **Registry Pattern**: Built-in types (Text, Flash, Image, Spacer) + extensible via `cards/index.ts`
- **Reducer/Unidirectional Flow**: Immutable updates via `state/gridStore.ts` with typed actions
- **Factory Rendering**: Each card type implements `createView(ctx)` returning CardView
- **Flexbox Resizing**: Direct DOM manipulation via `ui/CardResizer.ts` (bypasses controller for performance)

## Core Files to Know
| File | Responsibility |
|------|---------------|
| `controller/GridController.ts` | Event orchestration, save debouncing, resize guards |
| `state/gridStore.ts` | Reducer with subscribe pattern, skip-during-resize guard |
| `cards/registry.ts` | Abstract CardTypeDefinition<TCard> interface |
| `ui/GridView.ts` | Flexbox renderer, cardDom Map memoization, update dispatch |
| `ui/CardResizer.ts` | Drag handles, flex basis adjustment (direct DOM manipulation) |
| `domain/types.ts` | Immutable data contracts: CardGridData, BaseCard, BuiltInCard |

## Development Commands
- `npm run dev` — Watch mode (hot-reload)
- `npm run build` — Production bundle

## Common Patterns
1. **Adding card types**: Implement interface → register in `createDefaultRegistry()`
2. **State updates**: Call reducer, don't mutate store directly
3. **Resizing**: Direct DOM style changes during drag; dispatch only on release
4. **IDs**: Generated via `crypto.randomUUID()`, clones preserve prefixes for deduplication

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
    ├── flashCard.ts             # Multi-line rendering, fit/position constraints
    ├── imageCard.ts             # Pure image display
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
    └── ImagePickerModal.ts      // Native file picker integration
```

## Recent Changes
**Latest commits**:
- **Interactive resizing**: Drag handles between cards with flex basis adjustment via direct DOM manipulation (`ui/CardResizer.ts`)—bypasses controller during drag for performance, dispatches on release
- **GridController**: Central event orchestration, saveChain debouncing (250ms), resize guards to prevent flicker in `update()`
- **CardEditorModal**: Dynamic field rendering from specs using builder pattern; supports text/image card types with rich editing
- **Flash/Image/Text cards**: Added with specialized renderers—Markdown support in text cards, constraint-based styling inheritance (fit/position/radius) in flash/image cards via shared module
- **Refactoring**: Extracted image styling logic into `cards/shared/imageStyle.ts` for reuse across card types

## Development Commands
- `npm run dev` — Watch mode (hot-reload)
- `npm run build` — Production bundle