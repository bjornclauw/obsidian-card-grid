# Obsidian Card Grid Plugin: Comprehensive Architecture Analysis

## Executive Summary
This document provides a complete technical inventory of the **Obsidian Card Grid** plugin - an extensible markdown table builder using a registry-based architecture pattern. The plugin processes ````card-grid``` fenced code blocks to render interactive grid views with multiple card types, state management via reducers, and infrastructure layers for persistence.

---

## 1. Core Domain Models

### Type Definitions (`src/domain/types.ts`)
| Concept | Definition | Purpose |
|---------|-----------|---------|
| `CardId` / `GridId` | string | Unique identifiers using UUID (fallback to timestamp/random) |
| `CardTypeId` | string | Registry key; open-ended design allows dynamic registration |
| `CardInstance` = BaseCard | Shared schema with id, type, optional styling (bgColor/textColor/width) + index signature for extensibility |
| `BuiltInCard` | Union of Text\|Image\|Unknown types | Type-safe representation of card instances |

### Grid Data Model
```typescript
interface CardGridData {
  id: GridId;                    // Unique grid instance identifier
  version: number = 1;           // Schema versioning for migrations
  columns: number = 3;           // Grid column count (constraint)
  gap: number = 10;              // Pixel spacing between cards

  // Global defaults inherited by all ImageCards
  imageFit?: "cover"|"contain"|"fill"|"none"|"scale-down"
  imageHeight?: number = 180     // Constraint on max image height
  imagePosition?: string        // CSS object-position value
  imageRadius?: number          // Border radius for images

  cards: CardInstance[]         // Array of card instances (order determines DOM order)
}
```

### Card Type Specifications
| Interface | Required Fields | Extensible Properties |
|-----------|-----------------|--------------------|
| `TextCard` | title, text, id, type | backgroundColor, textColor, width |
| `ImageCard` | id, type, (optional: image/imageEnabled) | All base properties + imageFit/imageHeight/etc. |
| `SpacerCard` | id, type, width (columns to span) | No styling options (visual spacing only) |

---

## 2. Registry Pattern & Card Type Implementations

### Registry Contract (`src/cards/registry.ts`)
The **CardTypeRegistry** implements the registry/factory design pattern:

```typescript
interface CardTypeDefinition<T extends CardInstance> {
  type: string;                // Registry key (e.g., "text", "image")
  displayName: string;         // UI label for selection modals
  editor: CardEditorSpec;      // Modal field definition for editing cards
  
  // Factory methods
  normalize(raw: unknown): T;          // YAML → Domain object conversion
  createView(ctx: CardViewContext): CardView<T>;  // View creation factory
}
```

### Built-in Type Implementations

#### TextCard (`src/cards/types/textCard.ts`)
- **Purpose**: Basic content blocks with Markdown rendering support
- **Editor Fields**: Title (text), Text body (markdown with live preview toggle), Background/Title colors, Width constraint
- **View Behavior**: Renders title as HTML (MarkdownRenderer) + text body in scrollable area; applies border styling dynamically

#### ImageCard (`src/cards/types/imageCard.ts`)
- **Purpose**: Media display with advanced styling controls
- **Editor Fields**: Title, Text description, Show/hide toggle, Image file picker, Fit mode dropdown, Height constraint (10px steps), Positioning string, Border radius, Colors
- **Special Logic**: Resolves relative paths to vault resource URLs; applies `applyImageStyle()` for object-fit/object-position constraints

#### SpacerCard (`src/cards/types/spacerCard.ts`)
- **Purpose**: Layout spacing without content
- **Implementation**: Empty div with class `.card-grid-spacer`; uses flex basis only (no height/width); print-hide modifier prevents printing
- **Use Case**: Fill remaining column space in multi-column layouts, create breathing room between card groups

#### UnknownCard (`src/cards/types/unknownCard.ts`)
- **Purpose**: Forward compatibility safety net for unregistered types
- **Behavior**: Stores raw YAML as-is; displays type name + JSON dump of raw data; prevents corruption when importing old grids with missing type definitions

### Registry Mechanics
- `register()`: Sets type definition in Map keyed by typeId
- `get(type)`: Returns registered definition OR UnknownCard fallback (ensures graceful degradation)
- `has/type` helpers for conditional rendering logic
- Default registry instantiation via `createDefaultRegistry()` imports all built-in types

---

## 3. State Management Architecture

### Store Pattern (`src/state/gridStore.ts`) | Pub/Sub Observer Model

```typescript
class GridStore {
  private state: CardGridData;
  private listeners = new Set<listener>();
  
  constructor(initial: CardGridData)
  getState(): readonly CardGridData      // Immutable getter
  subscribe(listener: GridListener): unsubscribeFn
  dispatch(action: GridAction): void     // Reducer-based update
}
```

### Action Types (`src/state/actions.ts`)
The reducer handles mutations via immutable updates:
| Action | Payload Schema | Effect |
|--------|---------------|---------|
| `grid/set-options` | Patch grid metadata (columns, gap, imageFit) | Updates global constraints |
| `card/insert` | { card, atIndex? } | Splices new card into array (append default) |
| `card/delete` | id | Filters out by ID; skips if not found |
| `card/replace` | { card } | Finds existing, updates with spread operator |
| `card/move` | { id, toIndex } | Swaps positions via splice operations (O(n) but acceptable for < 100 cards) |
| `card/patch` | { id, patch: Partial<CardInstance> } | Deep merge patch into existing card; supports field-level updates without re-normalization |

### Performance Characteristics
- **Listener pattern**: O(1) add/remove; O(n) notify where n = listeners (typically 2-3: view update + scheduler)
- **Immutable state**: No `state = { ...state, cards }` side effects; prevents stale references in UI
- **Early exit**: Reducer returns unchanged state when action has no effect (`if (next === prev) return;`)

---

## 4. Controller & Lifecycle Management

### GridController (`src/controller/GridController.ts`) | Orchestration Layer

**Responsibilities:**
- **Initialization**: Parses YAML source, constructs initial grid data via codec/defaults, mounts store and view with event subscription
- **Persistence**: Debounced autosave (250ms timer) to repository; handles save chain promises to avoid race conditions during rapid edits
- **DOM Interaction**: Exposes methods for card CRUD operations invoked by menu handlers

**Key Methods:**
```typescript
mount(): void                 // Initializes CardResizer, triggers first render
scheduleSave(grid: GridData)  // Debounced async write with error chaining (non-fatal errors only)
updateCardWidth(id: string, width: number)  // Called by resizer after drag complete
setResizing(boolean): boolean  // Optimizes GridView.update() to skip during resize
```

**Lifecycle Hook:**
```typescript
destroy(): void {
  this.destroyed = true;           // Guards timer/schedule operations
  clearTimeout(this.saveTimer);    // Prevents phantom saves on plugin exit
  this.view.destroy();             // Cleans up DOM references
}
```

---

## 5. UI Rendering Architecture

### GridView (`src/ui/GridView.ts`) | Virtual View Layer

**Pattern**: Delegates to registry for type-specific views; maintains internal map of CardId → {type, view} entries.

**DOM Lifecycle:**
1. `update(grid: GridData)`: Main entry point with resize guard clause (`if (isResizing) return` prevents flicker)
2. Container setup: Applies flexbox CSS (`display:flex; flexDirection:row; wrap:wrap`) with gap property from grid data
3. Card reconciliation:
   - **Create**: EnsuresCard() creates new view via registry.get().createView(); caches in cardDom Map
   - **Update existing**: Same type cards reuse entry (avoids re-render); applies width constraint via flex shorthand: `entry.view.el.style.flex = "${width} 1 0%"`
   - **Destroy removed**: Removes DOM element and cleanup from map when card deleted/moved away

**Resizing Integration:**
- Flex basis syntax `{fraction} 1 0%` enables smooth width adjustments via CSS transition (implicit)
- MinWidth:0 prevents flex contraction overflow; dataset attributes track original fraction for resizer calculations

### CardView Interface
Minimal contract ensuring type-safety between registry and view layer:
```typescript
interface CardView<T> {
  el: HTMLElement;       // Root DOM container (created by createView)
  update(card: T, ctx): void   // Called during GridView.update(); applies styles/content based on current card state
}
```

### Context Object (`CardViewContext`) | Propagates environment to views
- `app`: Obsidian App instance for MarkdownRenderer and vault access
- `plugin`: Plugin instance (required by view logic that needs plugin context)
- `sourcePath`: Absolute file path for Markdown rendering context (line highlighting, navigation)
- `grid`: Current grid state with defaults; enables ImageCard views to apply global image settings when card-specific values are missing

---

## 6. Infrastructure & Persistence Layers

### Repository Pattern (`src/infrastructure/CardGridRepository.ts`)
Encapsulates Obsidian vault operations:

**Block Detection Algorithm:**
```typescript
findCardGridBlocks(lines: string[]): BlockMatch[] {
  // Scans for ```card-grid ... ``` fence pairs
  // Captures line indices and raw YAML content between fences
}
```

**Save Strategy (Write-Replace Pattern):**
1. Read full file as lines array
2. Serialize current grid to canonical YAML via codec
3. Construct replacement block: ````card-grid\n{yaml}\n````  
4. **Intelligent target resolution:**
   - Match by GridId (preferred): Finds existing block with matching id in blocks list
   - Fallback to reference-based resolution: Uses sourcePath/lineStart/lineEnd if provided during parsing; verifies fence markers at specified indices
   - Single-block fallback: Updates only block when exactly one exists
5. Replace target range with newBlock (preserves surrounding content)
6. Modify file via `app.vault.modify()`

**Error Handling**: Returns void on TFile not found or non-JSON parse failures; non-fatal errors caught by controller and surfaced elsewhere in Obsidian UI

### Codec Layer (`src/domain/codec.ts`)
Type conversion utilities:
- `parseCardGridObject(raw, registry)`: Deep normalization using type definitions; handles legacy field inference (image path → ImageCard), default values via `defaultGridData()`
- `serializeCardGridData()`: Flattens domain objects to plain object with explicit id/type fields preserved for round-tripping
- ID generation: UUID API fallback to random hex + timestamp
- Type normalization: Normalizes undefined/null strings; preserves raw type strings even if unknown (for UnknownCard)

### YAML Utilities (`src/infrastructure/yaml.ts`)
Obsidian's `parseYaml/stringifyYaml` wrappers with source cleaning:
- Removes non-breaking spaces (`\u00a0`), tabs → 2 spaces, trailing whitespace
- Ensures deterministic serialization regardless of markdown formatting quirks

---

## 7. Entry Points & Plugin Lifecycle

### CardGridPlugin (`src/plugin/CardGridPlugin.ts`) | Core Plugin Class

**Registration Phase:**
```typescript
registerMarkdownCodeBlockProcessor("card-grid", (source, el, ctx) => {
  // Extract section info for line references
  const ref = { sourcePath: ctx.sourcePath, lineStart: ..., lineEnd: ... }
  
  // Instantiate controller with registry from singleton instance
  const controller = new GridController({
    app: this.app,
    plugin: this,        // Required for view contexts
    registry: this.registry,
    hostEl: el,          // DOM anchor for grid container
    ref,                 // Line references for repository updates
    codeBlockSource: source  // YAML content parsed by controller
  });
  
  ctx.addChild(new GridRenderChild(el, controller)); // Lifecycle hook integration
});
```

**Lifecycle Events:**
- `onload()`: Registers markdown processor; adds ribbon icon for image picker demo functionality
- Plugin destruction: Controller instances automatically destroyed when markdown processor exits scope (Obsidian handles cleanup)

---

## 8. Shared Utilities & Components

### Image Resizer (`src/ui/CardResizer.ts`) | Drag-and-Drop Width Adjustment
**Interaction Model:**
- `mousedown` on card border triggers resize between adjacent cards (.card-grid-card or .card-grid-spacer)
- Stores starting width fractions (default 1.0) and mouse delta
- Calculates new widths using ratio: `newWidth = base + deltaX/card1Width`
- Updates flex property directly during drag (`card1El.style.flex = String(newWidth1)`); no controller dispatch until mouseup (performance optimization)
- MouseUp handler calls `controller.updateCardWidth()` for both cards; adds/removes `.card-grid-resizing` class for visual feedback

### CardEditorModal (`src/ui/modals/CardEditorModal.ts`) | Generic Type Editor
**Builder Pattern:** Generates Obsidian UI controls based on `CardTypeDefinition.editor.fields` array:
- **Field Types**: text, markdown (with toolbar preview toggle), number, select dropdown, toggle switch, color picker, image-file chooser with buttons, custom layout wrapper
- **Implementation**: Extends Modal; renders fields dynamically via renderField() factory method; injects scoped styles for editor-specific CSS variables and component styling
- **Submit**: Normalizes draft object using `def.normalize()` before callback invocation (ensures valid domain object state)

### CardTypeSuggestModal (`src/ui/modals/CardTypeSuggestModal.ts`) | Autocomplete Selection
**Pattern**: Extends SuggestModal with fuzzy matching on registry displayName:
- Filter excludes "unknown" type from suggestions list
- Match criteria: query substring in name OR type ID (case-insensitive)
- Render shows primary label + secondary monospace type identifier for visual distinction

### ImagePickerModal (`src/ui/modals/ImagePickerModal.ts`) | Fuzzy File Selection
**Pattern**: Extends FuzzySuggestModal with TFile items:
- Filters vault by supported extensions (png, jpg, jpeg, webp, gif, svg)
- Custom render: Creates thumbnail preview + path label below
- ResourcePath resolution handles relative paths correctly within Obsidian vault structure

---

## 9. Design Patterns Summary
| Pattern | Location | Implementation |
|---------|----------|---------------|
| **Registry** | `cards/registry.ts` | Map-based type lookup with factory methods |
| **Factory** | CardTypeDefinition.normalize() | Converts YAML to domain objects |
| **Observer/Pub-Sub** | GridStore | Subscribe/dispatch listener pattern |
| **Repository** | infrastructure/CardGridRepository | Abstracts vault persistence operations |
| **Builder** | CardEditorModal.renderField() | Constructs UI from field schema |
| **Singleton** | Plugin.registry creation | Default registry instantiation in plugin.ts |
| **Decorator/Composition** | GridRenderChild | Wrapper for lifecycle management (Obsidian-specific) |

---

## 10. Architecture Evolution

### Phase 1: Foundation (`defaults`, `types`)
Basic CardGridData model with versioning, grid constraints, and BaseCard extensibility via index signature.

### Phase 2: Registry Pattern (`registry`, type implementations)
Shift from hard-coded types to registry-based architecture; UnknownCard for forward compatibility prevents data corruption on schema evolution.

### Phase 3: State Management (
GridStore with reducer pattern) | Observable updates without external library overhead |

### Phase 4: Infrastructure Layer (
Repository + Codec) | Separation of domain logic from persistence and serialization concerns;

### Phase 5: Advanced UI (GridView, CardResizer)
Virtual view management with resize guard clauses; direct DOM manipulation during drag operations for performance.

---

## File Dependency Map
```
src/plugin/CardGridPlugin.ts                          [Entry]
├── src/cards/                                        [Registry layer]
│   ├── registry.ts                                   [Core registry pattern]
│   └── index.ts                                      [Built-in type registration factory]
│       ├── types/textCard.ts                         [Content rendering with Markdown]
│       ├── types/imageCard.ts                        [Media handling with constraints]
│       ├── types/spacerCard.ts                       [Layout spacing utility]
│       └── types/unknownCard.ts                      [Forward compatibility fallback]
├── src/controller/GridController.ts                  [Orchestration & persistence scheduling]
├── src/state/gridStore.ts                            [State management reducer]
│   └── actions.ts                                    [Action type definitions]
├── src/ui/                                           [View layer]
│   ├── GridView.ts                                   [Virtual view reconciliation]
│   ├── CardResizer.ts                                [Drag interaction logic]
│   └── menus/cardMenu.ts                             [Context menu handlers]
├── src/ui/modals/                                    [UI modals]
│   ├── CardEditorModal.ts                            [Generic field builder]
│   ├── CardTypeSuggestModal.ts                       [Type selection autocomplete]
│   └── ImagePickerModal.ts                           [File chooser with preview]
├── src/cards/shared/imageStyle.ts                    [Styling utilities for images]
├── src/domain/                                       [Core domain logic]
│   ├── codec.ts                                      [Serialization/deserialization]
│   └── defaults.ts                                   [Grid configuration schema]
└── src/infrastructure/                               [Persistence layer]
    ├── CardGridRepository.ts                         [Vault I/O operations]
    └── yaml.ts                                       [YAML cleaning utilities]
```

---

## Key Architectural Insights

1. **Open-Ended Registry**: Type extensions require only `CardTypeDefinition` implementation, not core file changes
2. **Immutable State Pattern**: Reducer updates prevent unintended side effects during complex multi-step operations (move/resize)
3. **Graceful Degradation**: UnknownCard ensures imported data from older versions doesn't crash on load
4. **Performance Guard Clauses**: Resize skipping in GridView; direct DOM manipulation instead of state dispatch during drag operations
5. **Single-File Persistence Model**: Write-replace strategy simplifies conflict handling (last write wins within same session)
6. **Lifecycle-Aware Rendering**: EnsuresCard tracks card types to prevent duplicate view creation during updates

This architecture supports the evolution from simple list editor to complex grid layout system while maintaining type safety and separation of concerns across domain, infrastructure, and presentation layers.
