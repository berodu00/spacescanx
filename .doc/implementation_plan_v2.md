# Schema Refactor Plan: V2 Floorplan Support

## Context
The `ANALYSIS_PROMPT` in `lib/gemini.ts` has been manually updated to a V2 version that returns a more structured JSON format (e.g., `rooms` array, `metadata`, `opens`). The current application logic expects a flat `walls` and `items` structure (V1).

## Goal
Update the Types and Frontend to support the new V2 Schema without breaking existing functionality (or by migrating completely to V2).

## Proposed Changes

### 1. Type Definitions (`types/floorplan.ts`)
- **[MODIFY]** Update `FloorplanData` interface to match the new JSON output:
  - Add `metadata` { `estimated_total_area_sqm`, `confidence_score` }
  - Add `rooms` array structure.
  - Mark old `walls`, `items` as deprecated or optional (for backward compatibility if needed, or simply replace).

### 2. Mock Data (`app/results/[jobId]/page.tsx`)
- **[MODIFY]** Update the fallback "Mock Data" to match the new V2 structure so tests pass even without real analysis.

### 3. Rendering Logic (`components/FloorplanRenderer.tsx`)
- **[MODIFY]** Update `FloorplanRenderer` to iterate through `rooms` instead of a global `walls`/`items` list.
- **[MODIFY]** Logic:
  - Loop through `data.rooms`
  - For each room, render its `walls`, `openings` (doors/windows), and `furniture`.
  - Handle the new `vertices` based drawing (Optional: or stick to `walls` if the prompt provides them). The prompt asks for `walls` inside `rooms`, so we use that.

### 4. Editor Logic (`components/FloorplanEditor.tsx`)
- **[NOTE]** Editing logic (Drag & Drop) needs to know *which* room's item is being moved, or we flatten the structure for the editor state.
- **Decision**: To keep Mission 3 simple, we will Flatten the V2 structure into a single coordinate space for rendering/editing, OR update the editor to handle nested data.
- **Ease of Implementation**: **Flattening** at the "Load" stage is safer for the existing "Mission 3" editor.
    - *Plan*: In `FloorplanEditor`, when `initialData` loads, if it detects V2 structure, flatten it into the V1 `walls` and `items` list for the Editor to work seamlessly.
    - *Save*: When saving, we can either save as flat V1 (simplest) or try to reconstruct. For now, we will **Render V2 directly** or **Flatten to V1**.
    - **Better Approach**: Let's update `types` to V2, but add a `SchemaAdapter` utility that converts V2 -> V1 for the current simple Editor. This allows us to keep the complex prompt but reuse the working Mission 3 Editor.

## Action Items
1.  **Update Types**: Define `FloorplanV2`.
2.  **Create Adapter**: `lib/adapter.ts` (`convertV2toV1`).
3.  **Update Worker**: Ensure worker output matches V2 type (it's `any` right now, so it's fine).
4.  **Update UI**: In `page.tsx`, use the Adapter to pass V1 data to `FloorplanEditor`.

This approach (Adapter) is the fastest way to support the new Prompt without rewriting the entire complex Interactive Editor.
