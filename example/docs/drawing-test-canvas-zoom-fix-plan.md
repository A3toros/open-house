# Drawing Test Canvas Zoom Fix Plan

## Overview
Fix the issue where zooming in/out on the drawing canvas causes unwanted line drawing. Implement automatic tool switching to pan mode when double tap is detected (to prevent drawing during zoom), and switch back to drawing mode when double tap gesture ends.

## Problem Statement
- **Current Issue**: When users zoom in/out using pinch gestures, the canvas draws lines unintentionally
- **Root Cause**: Drawing gestures are active during zoom operations, causing touch events to be interpreted as drawing strokes
- **User Impact**: Unwanted lines appear on the canvas during zoom operations, requiring manual cleanup

## Goals
1. Detect double tap gestures on the canvas
2. Automatically switch to pan mode when double tap is detected (prevents drawing)
3. Automatically switch back to drawing mode when double tap gesture ends
4. Prevent drawing during zoom/pinch operations
5. Maintain smooth zoom and pan functionality

## Current Implementation Analysis

### DrawingCanvas Component (`MWSExpo/src/components/DrawingCanvas.tsx`)

**Current Gesture Handling**:
- `pinchGesture`: Handles 2-finger pinch zoom
- `twoFingerPan`: Handles 2-finger pan
- `drawingGesture`: Handles single-finger drawing
- `isGestureActive` state: Tracks if pinch/pan is active
- `currentTool` prop: Controls tool mode ('pencil', 'pan', etc.)

**Current Issues**:
1. No double tap detection
2. Drawing gesture can still trigger during zoom if single finger touches during pinch
3. No automatic tool switching based on gestures
4. `isGestureActive` check exists but may not catch all cases

**Key Code Sections**:
- Lines 145-190: Pinch and pan gesture handlers
- Lines 228-360: Drawing gesture handler with `isGestureActive` checks
- Line 67: `isGestureActive` state
- Line 40: `currentTool` prop (controlled by parent)

## Implementation Plan

### Phase 1: Add Double Tap Detection
**File**: `MWSExpo/src/components/DrawingCanvas.tsx`

**Changes**:
1. Import `Gesture.Tap()` from `react-native-gesture-handler`
2. Add double tap gesture handler
3. Track double tap state with ref: `const isDoubleTapActiveRef = useRef<boolean>(false)`
4. Add double tap timeout (e.g., 300ms between taps)

**Implementation**:
```typescript
// Double tap detection
const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const lastTapTimeRef = useRef<number>(0);
const isDoubleTapActiveRef = useRef<boolean>(false);

const doubleTapGesture = Gesture.Tap()
  .numberOfTaps(2)
  .maxDuration(300) // Max time between taps
  .onStart(() => {
    'worklet';
    runOnJS(handleDoubleTapStart)();
  })
  .onEnd(() => {
    'worklet';
    runOnJS(handleDoubleTapEnd)();
  });
```

**Functions**:
- `handleDoubleTapStart()`: Set `isDoubleTapActiveRef.current = true`, switch to pan mode
- `handleDoubleTapEnd()`: Set `isDoubleTapActiveRef.current = false`, switch back to previous tool

### Phase 2: Automatic Tool Switching
**File**: `MWSExpo/src/components/DrawingCanvas.tsx`

**Changes**:
1. Add `onToolChange` callback prop to notify parent of tool changes
2. Store previous tool in ref: `const previousToolRef = useRef<string>(currentTool)`
3. When double tap starts:
   - Save current tool to `previousToolRef`
   - Call `onToolChange('pan')` to switch to pan mode
4. When double tap ends:
   - Call `onToolChange(previousToolRef.current)` to restore previous tool

**New Props**:
```typescript
interface DrawingCanvasProps {
  // ... existing props
  onToolChange?: (tool: string) => void; // Callback when tool should change
}
```

**Implementation**:
```typescript
const handleDoubleTapStart = useCallback(() => {
  if (currentTool !== 'pan') {
    previousToolRef.current = currentTool;
    if (onToolChange) {
      onToolChange('pan');
    }
  }
  isDoubleTapActiveRef.current = true;
  setIsGestureActive(true);
  if (onDrawingStateChange) onDrawingStateChange(true);
}, [currentTool, onToolChange, onDrawingStateChange]);

const handleDoubleTapEnd = useCallback(() => {
  isDoubleTapActiveRef.current = false;
  setIsGestureActive(false);
  if (onDrawingStateChange) onDrawingStateChange(false);
  
  // Restore previous tool after a short delay to ensure gesture is complete
  setTimeout(() => {
    if (previousToolRef.current && previousToolRef.current !== 'pan' && onToolChange) {
      onToolChange(previousToolRef.current);
    }
  }, 100);
}, [onToolChange, onDrawingStateChange]);
```

### Phase 3: Enhance Drawing Gesture Blocking
**File**: `MWSExpo/src/components/DrawingCanvas.tsx`

**Changes**:
1. Update drawing gesture handler to check `isDoubleTapActiveRef.current`
2. Block drawing when double tap is active
3. Block drawing when pinch/pan gestures are active (enhance existing check)

**Updated Drawing Gesture Handler**:
```typescript
const drawingGesture = Gesture.Pan()
  .minDistance(0)
  .onStart((e) => {
    'worklet';
    // Block drawing if double tap is active
    if (isDoubleTapActiveRef.current) {
      return;
    }
    
    // Block drawing if gesture is active (pinch/pan)
    if (isGestureActive) {
      return;
    }
    
    // ... rest of drawing logic
  })
  .onUpdate((e) => {
    'worklet';
    // Block drawing if double tap is active
    if (isDoubleTapActiveRef.current) {
      return;
    }
    
    // Block drawing if gesture is active
    if (isGestureActive) {
      return;
    }
    
    // ... rest of drawing logic
  })
  .onEnd((e) => {
    'worklet';
    // Block drawing if double tap is active
    if (isDoubleTapActiveRef.current) {
      return;
    }
    
    // Block drawing if gesture is active
    if (isGestureActive) {
      return;
    }
    
    // ... rest of drawing logic
  });
```

### Phase 4: Combine Gestures
**File**: `MWSExpo/src/components/DrawingCanvas.tsx`

**Changes**:
1. Combine double tap gesture with existing gestures
2. Use `Gesture.Race()` or `Gesture.Simultaneous()` appropriately
3. Ensure double tap has priority over drawing gesture

**Gesture Composition**:
```typescript
// Double tap should have priority, then zoom/pan, then drawing
const combinedGestures = Gesture.Race(
  doubleTapGesture,
  Gesture.Simultaneous(pinchGesture, twoFingerPan),
  drawingGesture
);
```

### Phase 5: Update Parent Component
**File**: `MWSExpo/app/tests/drawing/[testId]/index.tsx`

**Changes**:
1. Add `onToolChange` handler to `DrawingCanvas`
2. Update `currentTool` state when tool changes automatically
3. Ensure UI reflects automatic tool changes

**Implementation**:
```typescript
const handleToolChange = useCallback((newTool: string) => {
  console.log('🖊️ Tool automatically changed to:', newTool);
  setCurrentTool(newTool);
}, []);

// In DrawingCanvas component
<DrawingCanvas
  // ... existing props
  onToolChange={handleToolChange}
/>
```

## Edge Cases to Handle

1. **Rapid double taps**: Ensure timeout clears properly
2. **Double tap during drawing**: Should cancel current stroke
3. **Double tap while already in pan mode**: Should not cause issues
4. **Double tap during zoom**: Should switch to pan and prevent drawing
5. **Tool restoration**: Ensure previous tool is restored correctly
6. **Multiple double taps**: Handle rapid double tap sequences
7. **Double tap timeout**: Clear timeout if user starts drawing before timeout completes

## Testing Checklist

- [ ] Double tap switches to pan mode automatically
- [ ] Double tap ends, tool switches back to previous tool
- [ ] No lines drawn during zoom in/out
- [ ] No lines drawn during double tap
- [ ] Pan mode works correctly when auto-switched
- [ ] Drawing works correctly after tool restoration
- [ ] Rapid double taps don't cause issues
- [ ] Double tap during active drawing cancels stroke
- [ ] UI reflects automatic tool changes
- [ ] Works with all drawing tools (pencil, pen, marker, etc.)
- [ ] Works on different screen sizes
- [ ] Works with different zoom levels

## File Structure

```
MWSExpo/
├── src/
│   └── components/
│       └── DrawingCanvas.tsx          (UPDATE - add double tap, auto tool switching)
├── app/
│   └── tests/
│       └── drawing/
│           └── [testId]/
│               └── index.tsx         (UPDATE - add onToolChange handler)
└── docs/
    └── drawing-test-canvas-zoom-fix-plan.md  (THIS FILE)
```

## Dependencies

- `react-native-gesture-handler`: Already installed (for `Gesture.Tap()`)
- `react-native-reanimated`: Already installed (for `runOnJS`)

## Notes

- Double tap detection uses `Gesture.Tap().numberOfTaps(2)` which is more reliable than manual timing
- Tool switching is automatic and temporary - user's selected tool is restored after double tap ends
- The `isDoubleTapActiveRef` prevents drawing during the entire double tap gesture lifecycle
- A small delay (100ms) before tool restoration ensures the gesture is fully complete
- This solution maintains backward compatibility - existing functionality remains unchanged

## Future Enhancements (Optional)

1. **Visual feedback**: Show indicator when tool is auto-switched
2. **Configurable timeout**: Allow users to adjust double tap detection timing
3. **Triple tap**: Add triple tap for different action (e.g., reset zoom)
4. **Gesture preferences**: Allow users to disable auto tool switching

