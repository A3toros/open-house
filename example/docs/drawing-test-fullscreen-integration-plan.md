# Drawing Test Fullscreen Integration Plan

## Objective
Migrate the drawing test to the new fullscreen Skia canvas while preserving the legacy JSON payload (`["lines":[], "textBoxes":[]]`) expected by the API and datastore.

## Constraints
- API submission still requires the historical array-of-drawing-data format per question.
- Per-question drawings already live in AsyncStorage keys (`drawing_${studentId}_${testId}_${questionIndex}`); we must continue reading/writing them in the same structure so retakes keep working.
- The new fullscreen canvas emits `FullscreenCanvasSnapshot` with logical stroke arrays; conversion must happen before persistence/submission.
- Scrollable test content should show a square-frame preview tile that launches fullscreen and reflects the latest saved drawing.

## Phased Approach

### Phase 1 – Adapter Layer
- Create a `drawingSnapshotToLegacyJson(snapshot: FullscreenCanvasSnapshot): LegacyDrawingData` converter that separates strokes/text elements and formats the JSON identical to the current `lines/textBoxes` schema.
- Provide the inverse `legacyJsonToSnapshot` to hydrate the fullscreen canvas when reopening.
- Ensure adapters round-trip existing production samples (import a stored JSON -> snapshot -> JSON equals original).

### Phase 2 – Storage Pipeline
- Update the fullscreen screen (`app/tests/drawing/[testId]/canvas.tsx`) to persist snapshots via the adapter so AsyncStorage continues to store legacy structures.
- On exit, convert snapshot to legacy JSON and hand it back to the test screen for state/preview.
- Provide utilities in `src/utils/drawingLegacyAdapter.ts` to centralize convert/load/save helpers for reuse in submission.

### Phase 3 – Test Screen UX
- Replace the inline `DrawingCanvas` with:
  - A square-frame preview (Skia render of legacy data) to mimic the native app tile.
  - An `Open Full Canvas` button styled as a framed square.
- When pressing the button, push the fullscreen route; when control returns, update preview + legacy cache.
- Remove legacy inline tool logic that is superseded by fullscreen controls.

### Phase 4 – Submission Flow
- Modify submission builder to rely on the shared adapter utilities when reading per-question data from AsyncStorage.
- Verify the `answers` array and `answers_by_id` map identical to the current output to avoid backend regressions.

### Phase 5 – QA
- Regression-test drawing save/restore across question navigation, app backgrounding, and submission.
- Validate JSON diff against legacy app for matching strokes/text boxes.
- Test both empty and populated drawings on Android devices (touch + stylus).

## Deliverables
- `src/utils/drawingLegacyAdapter.ts` (conversion helpers).
- Updated fullscreen screen + test screen integration.
- Updated submission pipeline using the adapter.
- Manual QA checklist + sample JSON fixtures under `docs/qa`.
