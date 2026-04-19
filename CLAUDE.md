# Obsidian Card Grid Plugin

## What This Is
**Current Status: v1.0.0 Production Ready.**  
A TypeScript/Obsidian plugin that renders YAML-formatted card grids using a custom code fence (`card-grid`). Features include dynamic multi-column layouts, interactive drag-to-resize between cards, specialized card types (Text, Flash, Image, Procedure, Icon) with rich editing, and modal-based operations.

## Key Architecture Patterns
- **Registry Pattern**: Built-in types (Text, Flash, Image, Procedure, Spacer) + extensible via `cards/index.ts`
- **Reducer/Unidirectional Flow**: Immutable updates via `state/gridStore.ts` with typed actions
- **Factory Rendering**: Each card type implements `createView(ctx)` returning CardView
- **Grid Rebalancing**: Centralized gap configuration and grid balancing logic in `controller/GridController.ts`

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
4. **IDs**: Generated via `crypto.randomUUID()`, clones preserve prefixes

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
- **ProcedureCard**: New specialized card type with customizable layout/styling options (grouping, spacing controls)
- **Grid Rebalancing**: Centralized gap configuration and grid balancing logic in `controller/GridController.ts`
- **Independent Resizing**: Enhanced drag handles allowing independent width adjustment per card pair
- **Text/Flash rendering fixes**: Improved text handling and flash card layout consistency
- **Image flex adjustments**: Updated image rendering logic for proper resizing behavior during flex operations
- **Bug fixes**: Fixed procedural card sizing, text rendering edge cases, and image display issues

## Development Commands
- `npm run dev` — Watch mode (hot-reload)
- `npm run build` — Production bundle