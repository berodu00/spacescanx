# Enhancement Plan: High-Quality Floorplan (V1.5)

## Goal
Improve the visual quality and accuracy of the floorplan analysis without breaking the existing architecture (avoiding V2/Adapter complexity if possible).
- **Prompt**: Switch to Korean, emphasize accurate scaling and item dimensions (`width`, `height`, `rotation`).
- **Rendering**: Display wall lengths and ensure items are drawn with correct sizes.

## Proposed Changes

### 1. Library (`lib/gemini.ts`)
- **[MODIFY]** Update `ANALYSIS_PROMPT` to a **Korean V1.5** version.
- **Constraint**: Stick to the flat `walls` and `items` structure to maintain compatibility with `FloorplanEditor`.
- **Enhancement**: Explicitly ask for `width`, `height` (cm) and `rotation` (degrees) for every item.

### 2. Types (`types/floorplan.ts`)
- **[MODIFY]** Update `Item` interface.
  - `width`: number (required)
  - `height`: number (required)
  - `rotation`: number (optional, default 0)

### 3. Renderer (`components/FloorplanRenderer.tsx`)
- **[MODIFY]** Add **Wall Dimensions**:
  - Calculate Euclidean distance between `start` and `end`.
  - Render a text label at the midpoint of each wall showing its length (e.g., "300cm").
- **[MODIFY]** Item Labels:
  - (Optional) Add dimension text below the item label (e.g., "Desk (120x60)").

## Verification
1.  **Mock Data Check**: Update the mock data in `app/results/[jobId]/page.tsx` to include varied widths/heights to test rendering *before* real analysis.
2.  **Real Analysis**: Upload `video1.mp4` and verify Gemini returns the enhanced JSON structure.
3.  **Visual Check**: Confirm walls have length labels and items have distinct sizes/rotations.
