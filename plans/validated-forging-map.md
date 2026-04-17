# Documentation Sanitization Plan

## Context
After recent updates to the Obsidian Card Grid plugin, DOCUMENTATION.md contains outdated references and missing documentation for new features. The plan is to sanitize and expand the documentation to accurately reflect:
- New card types (SpacerCard, UnknownCard fallback)
- Interactive resizing system with drag handles  
- Advanced editing modals (EditorModal, ImagePickerModal)
- State management improvements (action/reducer pattern)
- Performance optimizations (debounced saves, view caching)

## Approach

### Phase 1: Architecture Documentation Updates
**Files to modify**: `src/domain/types.ts`, `src/cards/registry.ts`, `src/state/actions.ts`

Update the architecture section to document:
- Registry-based extensibility pattern with built-in card types table (Text, Image, Spacer, Unknown)
- Card instance properties including new `width` field for resizing support  
- Grid configuration options: added `imageRadius`, clarified optional fields

### Phase 2: UI Components & User Interactions
**Files to modify**: `src/ui/CardResizer.ts`, `src/ui/modals/CardEditorModal.ts`, `src/ui/menus/cardMenu.ts`

Document the complete interaction model:
- **Resizing System**: Drag handles between cards, flexbox-based width adjustment, visual feedback classes (`card-grid-resizing`)
- **Context Menu Actions**: Full menu structure with Move/Clone/Delete/Change Type handlers  
- **Editing UX**: Field-aware modal rendering via `getEditorSpec()` methods

### Phase 3: State Management & Data Flow
**Files to modify**: `src/state/gridStore.ts`, `src/controller/GridController.ts`

Document the action/reducer pattern:
- Immutable update flow with type safety (`GridAction` union)
- Debounced persistence mechanism (250ms chain-based saving)
- View subscription pattern with skip-during-resize optimization

### Phase 4: Performance & Technical Details
**Files to modify**: `src/cards/shared/imageStyle.ts`, `src/domain/codec.ts`

Technical deep-dives:
- Async rendering for rich content (MarkdownRenderer integration)  
- View memoization via `cardDom` Map and ID-based reuse  
- Type safety with generics (`CardTypeDefinition<TCard>`)  
- Error handling in YAML parsing/serialization

### Phase 5: Usage Examples & Extensibility
**Files to modify**: `src/cards/types/spacerCard.ts`, new example files

Add practical examples:
- Spacer card usage for layout control (width in columns)
- Mixed grid with overrides and custom styling
- Adding custom card types step-by-step guide

## Critical Files Modified
1. **DOCUMENTATION.md** - Main documentation file to be sanitized/expanded
2. `src/cards/types/spacerCard.ts` - New built-in card type documentation  
3. `src/cards/shared/imageStyle.ts` - Image styling logic (if exists)
4. Example YAML files demonstrating new capabilities

## Verification Strategy
1. **Compile check**: Ensure TypeScript compilation passes after any code changes
2. **Visual regression**: Verify grid renders correctly with spacer cards and resizing  
3. **End-to-end test flow**:
   - Create card grid → Add spacer card → Adjust widths via drag → Context menu operations work
   - Test image card Markdown rendering and styling overrides
   - Verify debounced save doesn't cause race conditions during rapid edits
4. **Type safety check**: Confirm action types match reducer handlers
5. **Performance sanity**: Check that view caching prevents duplicate DOM creation

## Expected Outcomes
- DOCUMENTATION.md accurately reflects current architecture (registry pattern, resizing system)
- All built-in card types documented with examples
- User interaction flows complete and tested (context menu, editing, moving cards)
- Extensibility guide updated for new card type implementations (SpacerCard as model)
- Technical implementation section covers performance optimizations and async rendering