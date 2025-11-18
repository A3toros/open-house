# Android Drawing Canvas Rebuild Plan

## Goals
- Restore a stable drawing canvas after the previous component was removed.
- Match the smooth zoom/pan behaviour of the web Konva implementation while preventing accidental scrolling.
- Introduce an optional fullscreen workspace that surfaces both toolbars (left instruments, bottom controls) with consistent interactions.
- Keep the experience responsive on low-end Android hardware.

## Deliverables
1. **Base Canvas Component**
   - Rebuilt `DrawingCanvas` powered by `@shopify/react-native-skia`.
   - Single-finger drawing/eraser, shape tools, text tool.
   - Two-finger pinch zoom + two-finger pan with scroll prevention.
   - Undo/redo, reset, colour/thickness pickers.

2. **Fullscreen Mode**
   - Toggle button to expand the canvas to fullscreen (overlay inside the test screen).
   - Mirror both toolbars in fullscreen (drawing instruments + test controls) with adaptive layout.
   - Keep zoom/pan state in sync when entering/exiting fullscreen.

3. **Documentation & QA**
   - Update README/usage docs for the new canvas API.
   - Device test report covering gestures, fullscreen transitions, tool switching, data persistence.

## Technical Strategy

### 1. Canvas Architecture
- **Component Split**
  - `DrawingCanvas`: core rendering + gesture handling.
  - `DrawingToolbar`: colour, thickness, undo/redo, fullscreen toggle.
  - `DrawingInstrumentPanel`: pencil/eraser/shapes/text selectors.
  - `DrawingFullscreenModal`: wraps `DrawingCanvas` in a fullscreen portal.
- Use `React.Context` or prop drilling to share state between base and fullscreen instances (stroke history, zoom state, tool selection).

### 2. Gesture Implementation
- Base gestures implemented with `react-native-gesture-handler` + `react-native-reanimated` shared values.
- Guard pattern:
  - Canvas view captures responder, calls `preventDefault()` for multi-touch.
  - Shared values (`zoom`, `panX`, `panY`) updated on UI thread; React snapshots only for toolbars.
  - ScrollView uses `simultaneousHandlers`/`waitFor` linkage so it never competes with the canvas.
- Hysteresis: re-use or adapt `detectGestureType` thresholds from web (`scaleDelta ~0.02`, `centerDelta ~10px`).

### 3. Fullscreen Flow
- Fullscreen toggle triggers a modal or `Portal` containing:
  - Canvas (same shared state) sized to device window.
  - Left instrument bar (vertical) + bottom toolbar.
  - Optional background dim / close button.
- When entering fullscreen:
  - `onEnter`: freeze parent ScrollView, set fullscreen flag.
  - `onExit`: restore scroll, persist canvas state.
  - Keep zoom/pan continuous between modes (shared values stored in context).

### 4. Performance Considerations
- Stroke storage: maintain logical coordinates; transform only at render time.
- Debounce history saves to AsyncStorage.
- Memoize Skia paths (weak map cache) and avoid re-creating on every frame.
- Use `requestAnimationFrame` batching when bridging to React state.

### 5. Data & Integration
- Accept `initialPaths` for restoring answers.
- Emit `onDrawingChange` with paths array (same schema as before).
- Ensure fullscreen mode also triggers `onDrawingStateChange`/`onGestureStateChange` for anti-cheat integration.

## Implementation Steps
1. **Scaffold Components**
   - Create new `DrawingCanvas.tsx`, `DrawingToolbar.tsx`, `FullscreenDrawingModal.tsx`.
   - Wire context/state to share tools, zoom, history.
2. **Gestures & Rendering**
   - Implement drawing touch handler (single finger) with Skia path cache.
   - Add pinch/pan gestures with scroll prevention and shared values.
   - Port existing tools (eraser, shapes, text) incrementally.
3. **Fullscreen UI**
   - Build modal overlay with toolbars.
   - Sync zoom/pan/tool state between base and fullscreen.
   - Add keyboard handling for text tool in fullscreen.
4. **Integration**
   - Update `app/tests/drawing/[testId]/index.tsx` to use new canvas + fullscreen toggle.
   - Update toolbar to reflect zoom level, tool states.
   - Ensure anti-cheat hooks receive drawing state.
5. **QA & Documentation**
   - Manual testing on physical Android device (draw, zoom, pan, fullscreen transitions, orientation changes).
   - Update `README.md` / developer docs with usage notes and known limitations.

## Risks & Mitigations
- **Gesture Conflicts:** Use RNGH `GestureDetector` + simultaneous handlers; fallback to manual responder guard if ScrollView interference persists.
- **Performance Regressions:** Profile with dev menu FPS monitor; keep shared values on UI thread, avoid heavy JS setState.
- **State Divergence between Fullscreen/Base:** Centralize canvas state in context; ensure modal uses same provider.
- **User Familiarity:** Preserve existing tool layout; fullscreen is optional with clear exit affordance.

## Definition of Done
- Drawing canvas works (draw, erase, shapes, text) with smooth gestures and no background scroll.
- Fullscreen mode mirrors toolbars, toggles without losing strokes.
- Automated lint/build pass; manual device QA signed-off.
- Documentation updated; plan items checked off in TODO list.

