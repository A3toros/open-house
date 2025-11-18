# Fullscreen Canvas Pro Toolbar Plan

## Goals
- Match the legacy inline canvas toolset plus enhancements inspired by Autodesk SketchBook.
- Support pencil/eraser, line, rectangle, ellipse, pan (two-finger and drag tool), and text tools with configurable options.
- Ensure every new tool persists to/loads from the legacy `lines/textBoxes` JSON format.
- Keep the high-performance gesture pipeline (Reanimated + Skia) without regressing drawing smoothness.

## Tool Breakdown
| Tool | Behaviour | Data Model |
|------|-----------|------------|
| Pencil | Freehand stroke following finger/stylus. | `LegacyLine` with `tool: 'pencil'` + point list. |
| Eraser | Freehand stroke that removes pixels (implemented as white stroke / composite). | `LegacyLine` with `tool: 'eraser'`. |
| Pan | Drag canvas when selected (single-finger) in addition to existing two-finger pan. | No output; toggles gesture mode. |
| Line | Tap-drag to create straight line. | `LegacyLine` with two points + metadata `shape: 'line'`. |
| Rectangle | Tap-drag to create axis-aligned rectangle. | `LegacyLine` stored with bounding box metadata or special `shape`. |
| Ellipse | Tap-drag to create ellipse. | Similar to rectangle with `shape: 'ellipse'`. |
| Text | Tap to place text box, open inline editor, persist content. | `LegacyTextBox` entry with text + fontSize. |

## Architecture Changes
1. **Tool State**
   - Introduce `selectedTool` shared value/context (`'pencil' | 'eraser' | 'line' | 'rectangle' | 'ellipse' | 'text' | 'pan'`).
   - Update touch handler to branch by tool (e.g., constructing preview geometry for shapes before commit).

2. **Shape Rendering**
   - During interaction, render preview overlay using Skia primitives.
   - On finalize, convert to stroke/metadata for legacy format.
   - For rectangles/ellipses, store flattened point arrays plus `shape` tag to maintain compatibility.

3. **Text Boxes**
   - When text tool active, tap to spawn new text box with default size.
   - Show editable overlay (React component above canvas) to enter text, update snapshot + legacy data.
   - Display existing text boxes within Skia group (use `Paragraph` or fallback to overlay positioning).

4. **Toolbar UI**
   - Extend top bar to include new buttons with active states and icons matching reference app.
   - Provide secondary panels for shape settings (stroke width, fill toggle) and text options (font size, color).

5. **Persistence**
   - Update `snapshotToLegacyData` / `legacyDataToSnapshot` to encode/decode shape metadata and rich text boxes.
   - Ensure AsyncStorage + submission flows remain unchanged (still storing legacy JSON).

6. **QA**
   - Manual testing matrix: pencil/eraser, each shape, pan, text creation/edit, undo/redo, zoom/pan gestures.
   - Validate JSON payloads before submission match old schema.

## Deliverables
- Updated `FullscreenCanvas.tsx` with new toolbar, tool state, and text/shape handling.
- Extended adapter utilities for shapes/text.
- Updated docs with usage instructions and regression checklist.
