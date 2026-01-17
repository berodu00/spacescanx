# Debugging Enhancement: Gemini Visibility

## Goal
Enable users and developers to verify Gemini API execution status and view raw analysis results directly in the UI. This is to diagnose why real video uploads are falling back to mock data.

## Proposed Changes

### Backend (`app/api/worker/route.ts`)
- **[MODIFY]** Update `POST` handler to:
    - Capture the **raw text response** from Gemini even if JSON parsing fails.
    - Store this `rawOutput` in the Redis job object.
    - accessible `error` details in the Redis job object if the API call fails or validation fails.

### Frontend (`app/results/[jobId]/page.tsx`)
- **[MODIFY]** Update `ResultPage` to:
    - Display a **"Debug/Raw Data"** section (collapsible or always visible in dev mode).
    - Show the `jobData.status`, `jobData.rawOutput`, and `jobData.error`.
    - Explicitly label the rendered floorplan as **"MOCK DATA"** or **"REAL DATA"** based on the source.

## Verification
- Upload a real video.
- Check the result page.
- Confirm the new "Debug Info" section shows the raw JSON (or error text) from Gemini.
