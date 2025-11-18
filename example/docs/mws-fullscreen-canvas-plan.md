# Fullscreen Drawing Canvas Plan

## Goals
- Deliver a dedicated fullscreen drawing experience that mirrors Autodesk SketchBook interaction patterns.
- Keep gestures silky-smooth on Android by running zoom/pan/rotate computations on the UI thread via Reanimated shared values.
- Ship unified toolbars (top command bar + secondary palettes) with undo, redo, brush, color, and layer affordances.
- Maintain parity with the existing drawing test flow by serialising strokes back to the test screen on exit.

## Screen Architecture
- **Route**: `app/drawing/fullscreen.tsx` (modal or full-screen stack entry).
- **Layout**: Absolute-positioned tool chrome around a `Skia` canvas that fills the viewport.
- **Components**:
  - `FullscreenDrawingScreen`: orchestrates toolbars, canvas, inspectors, and navigation in/out.
  - `CanvasSurface`: wraps Skia `Canvas`, hosts gesture detectors, manages zoom/pan shared values, exposes commit hooks.
  - `CommandToolbar`: top bar actions (menu, undo, redo, brush, color, layers, exit fullscreen).
  - `QuickStrip`: bottom floating strip with brush size, opacity, color swatch, zoom controls.
  - `InspectorSheet`: slide-up panels for brush/color settings (future layer manager hook).
  - `CanvasStateStore`: JSI-backed module (or lightweight context) to track strokes, history, redo, and playback snapshots.

## Gestures & Rendering
- **Gestures**: Built with `react-native-gesture-handler` + `react-native-reanimated` v3.
  - Pinch (2 pointers) → scale around focal point; clamp inside worklet using viewport/logical shared values.
  - Pan (2 fingers or pan tool) → translate shared `panX`, `panY` after pinch focal alignment.
  - Optional rotation (future) → track `rotation.value` but default disabled.
- **Drawing**:
  - Single-pointer draws when tool === draw && no gesture in progress.
  - Convert pointer positions to logical coordinates (pre-transform) before storing.
  - Cache finished strokes into `Skia.Picture` objects to avoid per-frame path rebuilding.
- **Performance**:
  - No `runOnJS` during pinch/pan updates; only publish snapshot to JS using `useAnimatedReaction` throttled to 30 fps for UI mirrors.
  - Debounce `onChange` propagation to parent (150 ms trailing) to reduce storage churn.

## Toolbars & UI
- **CommandToolbar** (reference `layout_toolbar_top.xml`):
  - `Menu` (ties into existing navigation or placeholder).
  - `Undo` / `Redo` (disabled state when stack empty).
  - `Brush` inspector toggle.
  - `Color` inspector toggle.
  - `Layers` inspector toggle (initial stub: list of single base layer with future expansion).
  - `Exit Fullscreen` (returns strokes, closes screen).
- **QuickStrip** (inspired by SketchBook bottom buttons):
  - Large color puck, brush size slider button, zoom reset, fit-to-screen, rotate toggle.
  - Provide haptic/visual feedback on tap.
- **InspectorSheet** (pattern from `layout_toolbar_base.xml`):
  - Use `react-native-reanimated` bottom sheet or Expo `GestureHandler` `BottomSheet` mimic.
  - Brush panel: slider controls for size, opacity, hardness; dynamic preview using Skia offscreen rendering.
  - Color panel: palette grid + HSV/HSB sliders; integrate existing color picker if available.

## State Management
- **Stroke Model**: `{ id, tool, color, size, opacity, points: Vec2[], cachedPicture?: Picture }`.
- **History**: maintain undo/redo stacks, limit to ~100 entries to avoid memory blow-up.
- **Persistence**: On exit, serialise strokes to JSON and hand back via route params or context callback.
- **Sync**: On screen focus/resume, hydrate canvas from incoming stroke list; recompute cached `Picture`s lazily.

## Integration with Drawing Test
1. Replace inline canvas in `app/tests/drawing/[testId]/index.tsx` with:
   - A static preview (latest strokes rendered to PNG) or minimal canvas (optional).
   - `Open Full Canvas` button launching the fullscreen screen via router (pass test ID & current stroke payload).
2. On fullscreen exit, emit updated strokes and refresh preview/state.
3. Disable parent scroll only while preview canvas is touched (simpler now since main work lives fullscreen).

## Implementation Steps
1. **Scaffold Screen** (routing + placeholder canvas, wired navigation).
2. **Extract Canvas Logic** from existing `DrawingCanvas` into reusable hooks (`useDrawingSurface`) and adapt to fullscreen layout.
3. **Implement Gestures** using shared-value approach proven in prototype; add rotation guards.
4. **Build Toolbars** with icons (reuse existing assets or add new vector icons under `assets/`).
5. **Create Inspector Sheets** (initial brush/color; layer stub with “Coming soon”).
6. **Wire History & Sync** (undo/redo, exit handshake, preview update).
7. **QA & Polish** (Android focus, stylus, low-end devices, orientation changes, memory profiling).
8. **Docs**: Update `docs/android-drawing-canvas-rebuild-plan.md` (or replacement) with final architecture and usage instructions.

## Risks & Mitigations
- **Performance**: Large stroke sets may tax Skia; mitigate with `Picture` caching and bounding box culling.
- **Navigation latency**: Ensure strokes serialise/deserialise quickly—consider compression if payload exceeds ~1 MB.
- **Tool parity creep**: Start with core drawing tools; document backlog for layers, symmetry, perspective guides.
- **Testing**: Need real device validation for multi-touch; plan manual QA checklist + explore Detox integration later.

## Deliverables
- `docs/mws-fullscreen-canvas-plan.md` (this file).
- New fullscreen canvas route with production-ready interaction model.
- Updated drawing test screen linking to fullscreen canvas.
- QA notes + updated README snippet for testers.
