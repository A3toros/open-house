# Android Drawing Test Zoom/Pan Fix Plan

## Executive Summary

This document provides a comprehensive analysis of the drawing test canvas implementation differences between the web app and Android app, with a focus on fixing lag and unwanted drawing during zoom/pan gestures in the Android app.

## Problem Statement

### Current Issues in Android App
1. **Lag during zoom/pan**: Zoom and pan gestures are laggy and stuttery
2. **Unwanted drawing during gestures**: Lines are drawn unintentionally during 2-finger zoom/pan operations
3. **Poor gesture synchronization**: Drawing state conflicts with zoom/pan gesture state
4. **Performance degradation**: Canvas re-renders during zoom/pan cause frame drops

### Web App Status
- ✅ **Smooth zoom/pan**: Works perfectly with 2-finger gestures
- ✅ **No unwanted drawing**: Proper gesture state management prevents drawing during zoom/pan
- ✅ **60 FPS performance**: Uses `requestAnimationFrame` for smooth updates
- ✅ **Combined gestures**: Simultaneous zoom and pan work seamlessly

## Comprehensive Architecture Comparison

### Web App Implementation (`src/components/test/DrawingTestStudent.jsx`)

#### Architecture Overview
```
React Component (DrawingTestStudent)
  └── DrawingCanvas Component
      └── Konva Stage (react-konva)
          ├── Touch Event Handlers (onTouchStart, onTouchMove, onTouchEnd)
          ├── Combined Gesture Handler (handleCombinedGesture)
          ├── requestAnimationFrame for updates
          └── Gesture State Management (isGestureActive, isZooming)
```

#### Key Implementation Details

**1. Gesture State Management**
```javascript
// Lines 231-237: Comprehensive gesture state
const [isGestureActive, setIsGestureActive] = useState(false);
const [isZooming, setIsZooming] = useState(false);
const [lastTouchDistance, setLastTouchDistance] = useState(null);
const [lastTouchCenter, setLastTouchCenter] = useState(null);
const [gestureType, setGestureType] = useState(null); // 'zoom' | 'pan' | 'zoom+pan'
```

**2. Combined Gesture Handler (Lines 357-441)**
```javascript
const handleCombinedGesture = (doZoom, doPan, currentDistance, currentCenter) => {
  const stage = stageRef.current;
  const oldScale = stage.scaleX();
  const currentPos = stage.position();
  
  let newScale = oldScale;
  let newPos = currentPos;
  
  // Handle zoom
  if (doZoom) {
    const scaleChange = currentDistance / lastTouchDistance;
    const proposedScale = oldScale * scaleChange;
    newScale = Math.max(0.25, Math.min(maxZoom, proposedScale));
    
    // Zoom towards finger center
    const zoomPoint = currentCenter;
    const mousePointTo = {
      x: (zoomPoint.x - stage.x()) / oldScale,
      y: (zoomPoint.y - stage.y()) / oldScale,
    };
    newPos = {
      x: zoomPoint.x - mousePointTo.x * newScale,
      y: zoomPoint.y - mousePointTo.y * newScale,
    };
  }
  
  // Handle pan (if not zooming or in addition to zoom)
  if (doPan) {
    const deltaX = currentCenter.x - lastTouchCenter.x;
    const deltaY = currentCenter.y - lastTouchCenter.y;
    
    if (doZoom) {
      // Adjust pan for zoom changes
      newPos = { x: newPos.x + deltaX, y: newPos.y + deltaY };
    } else {
      // Pure pan
      newPos = { x: currentPos.x + deltaX, y: currentPos.y + deltaY };
    }
  }
  
  // Apply both changes in single update
  const updateStage = () => {
    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
    stage.batchDraw();
    animationId = null;
  };
  
  if (!animationId) {
    animationId = requestAnimationFrame(updateStage);
  }
};
```

**3. Touch Event Handling (Lines 452-572)**
```javascript
const handleTouchStart = (e) => {
  const touches = e.evt.touches;
  
  if (touches.length === 2) {
    e.evt.preventDefault();
    setIsGestureActive(true);
    setLastTouchDistance(getTouchDistance(touches));
    setLastTouchCenter(getTouchCenter(touches));
    setIsDrawing(false); // CRITICAL: Stop any drawing
  } else if (touches.length === 1) {
    setIsGestureActive(false);
    handleMouseDown(e); // Allow single finger drawing
  }
};

const handleTouchMove = (e) => {
  const touches = e.evt.touches;
  
  if (touches.length === 2 && isGestureActive) {
    e.evt.preventDefault();
    
    const currentDistance = getTouchDistance(touches);
    const currentCenter = getTouchCenter(touches);
    
    // Detect if user is zooming or panning
    const scaleDelta = Math.abs(currentDistance / lastTouchDistance - 1);
    const centerDelta = Math.sqrt(
      Math.pow(currentCenter.x - lastTouchCenter.x, 2) + 
      Math.pow(currentCenter.y - lastTouchCenter.y, 2)
    );
    
    const doZoom = scaleDelta > GESTURE_THRESHOLDS.scaleDelta;
    const doPan = centerDelta > GESTURE_THRESHOLDS.centerDelta;
    
    if (doZoom || doPan) {
      handleCombinedGesture(doZoom, doPan, currentDistance, currentCenter);
    }
    
    setLastTouchDistance(currentDistance);
    setLastTouchCenter(currentCenter);
  } else if (touches.length === 1 && !isGestureActive) {
    e.evt.preventDefault();
    handleMouseMove(e); // Only draw if not in gesture mode
  }
};
```

**4. Drawing Prevention - Touch-Level Interception (Lines 464-479, 489-547)**

**CRITICAL INSIGHT**: The web app intercepts at the **touch event level**, not in the drawing handlers themselves. The touch handlers act as gatekeepers.

```javascript
// handleTouchStart - Intercepts BEFORE calling drawing handlers
const handleTouchStart = (e) => {
  const touches = e.evt.touches;
  
  if (touches.length === 2) {
    // TWO FINGERS DETECTED - Intercept here!
    e.evt.preventDefault();
    setIsGestureActive(true);
    setIsDrawing(false); // Stop any active drawing
    // DO NOT call handleMouseDown(e) - this is the interception!
    return; // Exit early, no drawing handler called
  } else if (touches.length === 1) {
    // Single touch - safe to draw
    setIsGestureActive(false);
    handleMouseDown(e); // Only call drawing handler when safe
  }
};

// handleTouchMove - Intercepts BEFORE calling drawing handlers
const handleTouchMove = (e) => {
  const touches = e.evt.touches;
  
  if (touches.length === 2 && isGestureActive) {
    // TWO FINGERS + GESTURE ACTIVE - Intercept here!
    e.evt.preventDefault();
    // Handle zoom/pan
    handleCombinedGesture(doZoom, doPan, currentDistance, currentCenter);
    // DO NOT call handleMouseMove(e) - this is the interception!
    return; // Exit early, no drawing handler called
  } else if (touches.length === 1 && !isGestureActive) {
    // Single touch + no gesture - safe to draw
    e.evt.preventDefault();
    handleMouseMove(e); // Only call drawing handler when safe
  }
};

// handleMouseDown/Move/Up - These handlers DON'T check isGestureActive
// They rely on touch handlers to intercept before calling them
const handleMouseDown = (e) => {
  // No isGestureActive check here - already intercepted at touch level
  setIsDrawing(true);
  // ... drawing logic
};
```

**Key Mechanism**: 
- Touch handlers check `touches.length` FIRST
- If 2 touches → set gesture state, DON'T call mouse handlers
- If 1 touch + no gesture → call mouse handlers for drawing
- Drawing handlers are never called during 2-finger gestures

**5. Performance Optimization**
- Uses `requestAnimationFrame` to batch updates
- Single `batchDraw()` call per frame
- Gesture state checked before any drawing operations
- Hysteresis system to prevent gesture jitter

### Android App Implementation (`MWSExpo/src/components/DrawingCanvas.tsx`)

#### Architecture Overview
```
React Component (DrawingCanvas)
  └── GestureDetector (react-native-gesture-handler)
      ├── Pinch Gesture (Gesture.Pinch)
      ├── Two-Finger Pan Gesture (Gesture.Pan().minPointers(2))
      └── Canvas (react-native-skia)
          └── useTouchHandler (for drawing)
```

#### Key Implementation Details

**1. Gesture State Management (Lines 67, 149-151, 173-175)**
```typescript
const [isGestureActive, setIsGestureActive] = useState(false);

// Set in pinch gesture
const startPinch = (focalX: number, focalY: number) => {
  setIsGestureActive(true);
  if (onDrawingStateChange) onDrawingStateChange(true);
  if (onGestureStateChange) onGestureStateChange(true);
};

// Reset in pinch end
const endPinch = () => {
  setIsGestureActive(false);
  if (onDrawingStateChange) onDrawingStateChange(false);
  if (onGestureStateChange) onGestureStateChange(false);
};
```

**2. Separate Gesture Handlers (Lines 177-228)**
```typescript
// Pinch gesture - separate handler
const pinchGesture = Gesture.Pinch()
  .cancelsTouchesInView(false)
  .shouldCancelWhenOutside(true)
  .onBegin((e: any) => {
    if (!isTouchInCanvas(e.focalX, e.focalY)) return;
    runOnJS(startPinch)(e.focalX, e.focalY);
  })
  .onUpdate((e: any) => {
    runOnJS(updatePinch)(e.scale, e.focalX, e.focalY);
  })
  .onEnd(() => {
    runOnJS(endPinch)();
  });

// Two-finger pan - separate handler
const twoFingerPan = Gesture.Pan()
  .minPointers(2)
  .cancelsTouchesInView(false)
  .shouldCancelWhenOutside(true)
  .onBegin((e: any) => {
    if (!isTouchInCanvas(e.x, e.y)) return;
    runOnJS(startTwoFingerPan)();
  })
  .onUpdate((e: any) => {
    runOnJS(updateTwoFingerPan)(e.translationX, e.translationY);
  })
  .onEnd(() => {
    runOnJS(endTwoFingerPan)();
  });

// Combined as simultaneous
const gestures = Gesture.Simultaneous(pinchGesture, twoFingerPan);
```

**3. Touch Handler for Drawing (Lines 230-418) - CURRENT ISSUE**

**PROBLEM**: The Android app checks `isGestureActive` state, but this may be stale due to React state update timing. The web app intercepts at touch count level FIRST.

```typescript
// CURRENT IMPLEMENTATION - Has timing issues
const touchHandler = useTouchHandler({
  onStart: ({ x, y }) => {
    // ISSUE: isGestureActive may be stale (async state update)
    if (isGestureActive) {
      return; // May not catch gesture in time
    }
    
    // Drawing logic...
  },
  onActive: ({ x, y }) => {
    // ISSUE: isGestureActive may be stale
    if (isGestureActive) {
      return; // May not catch gesture in time
    }
    
    // Drawing logic...
  },
  onEnd: () => {
    // ISSUE: isGestureActive may be stale
    if (isGestureActive) {
      return; // May not catch gesture in time
    }
    
    // Drawing finalization...
  },
});
```

**WEB APP SOLUTION**: Check touch count FIRST, before checking state:
```typescript
// CORRECT APPROACH - Check touch count FIRST (like web app)
const touchHandler = useTouchHandler({
  onStart: ({ x, y, numberOfTouches }) => {
    // LAYER 1: Check touch count FIRST (immediate, no async delay)
    if (numberOfTouches && numberOfTouches > 1) {
      return; // Multi-touch - don't draw, let gesture handlers handle it
    }
    
    // LAYER 2: Check ref (immediate, no async delay)
    if (isGestureActiveRef.current) {
      return; // Gesture active - don't draw
    }
    
    // LAYER 3: Check state (backup, may be stale but extra safety)
    if (isGestureActive) {
      return; // Gesture active - don't draw
    }
    
    // Only now allow drawing (single touch, no gesture)
    // Drawing logic...
  },
  onActive: ({ x, y, numberOfTouches }) => {
    // Same triple-layer checks
    if (numberOfTouches && numberOfTouches > 1) return;
    if (isGestureActiveRef.current) return;
    if (isGestureActive) return;
    
    // Drawing logic...
  },
  onEnd: ({ numberOfTouches }) => {
    // Same triple-layer checks
    if (numberOfTouches && numberOfTouches > 1) return;
    if (isGestureActiveRef.current) return;
    if (isGestureActive) return;
    
    // Drawing finalization...
  },
});
```

**4. Zoom/Pan Updates (Lines 153-170, 197-207)**
```typescript
const updatePinch = (scale: number, focalX: number, focalY: number) => {
  if (!pinchStartRef.current) return;
  const base = pinchStartRef.current;
  const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, base.zoom * scale));
  const targetScreenX = focalX;
  const targetScreenY = focalY;
  const newPanX = targetScreenX - base.focusX * nextZoom;
  const newPanY = targetScreenY - base.focusY * nextZoom;
  setZoom(nextZoom); // State update - causes re-render
  setPanOffset({ x: clampedX, y: clampedY }); // State update - causes re-render
};

const updateTwoFingerPan = (translationX: number, translationY: number) => {
  const nextX = panOriginRef.current.x + translationX;
  const nextY = panOriginRef.current.y + translationY;
  setPanOffset({ x: clampedX, y: clampedY }); // State update - causes re-render
};
```

## Root Cause Analysis

### Issue 1: State Update Performance
**Problem**: Each zoom/pan update calls `setZoom()` and `setPanOffset()`, causing React re-renders on every gesture update.

**Web App Solution**: Uses `requestAnimationFrame` to batch updates and only calls `batchDraw()` once per frame.

**Android App Issue**: No batching - every gesture update triggers a full React re-render.

### Issue 2: Gesture State Synchronization
**Problem**: `isGestureActive` state may not be synchronized between gesture handlers and touch handler due to React state update timing.

**Web App Solution**: Uses refs and immediate state checks before any drawing operations.

**Android App Issue**: State updates are asynchronous, so `isGestureActive` check in touch handler may use stale value.

### Issue 3: Separate Gesture Handlers
**Problem**: Pinch and pan are separate gestures that may conflict or not work simultaneously.

**Web App Solution**: Single combined gesture handler that processes both zoom and pan in one update.

**Android App Issue**: Two separate gesture handlers may not coordinate properly.

### Issue 4: Drawing During Gestures
**Problem**: Touch handler checks `isGestureActive` state, but React state updates are asynchronous, so the check may use a stale value.

**Web App Solution**: 
- **Touch-level interception**: Checks `touches.length === 2` FIRST (immediate, no async delay)
- Only calls drawing handlers when `touches.length === 1 && !isGestureActive`
- Drawing handlers are never called during 2-finger gestures

**Android App Issue**: 
- Checks `isGestureActive` state (async, may be stale)
- Doesn't check `numberOfTouches` FIRST
- Touch handler may process touches before gesture state updates

## Restructuring Plan

### Phase 1: Unified Gesture Handler (Like Web App)

**Goal**: Create a single combined gesture handler that processes both zoom and pan simultaneously.

**Implementation**:
```typescript
// Replace separate pinch and pan gestures with combined handler
const combinedGesture = Gesture.Pinch()
  .minPointers(2)
  .cancelsTouchesInView(false)
  .onBegin((e: any) => {
    'worklet';
    if (!isTouchInCanvas(e.focalX, e.focalY)) return;
    runOnJS(startCombinedGesture)(e.focalX, e.focalY);
  })
  .onUpdate((e: any) => {
    'worklet';
    // Calculate both zoom and pan in single update
    runOnJS(updateCombinedGesture)(e.scale, e.focalX, e.focalY, e.translationX, e.translationY);
  })
  .onEnd(() => {
    'worklet';
    runOnJS(endCombinedGesture)();
  });
```

### Phase 2: Ref-Based State Management

**Goal**: Use refs for immediate state checks to prevent drawing during gestures.

**Implementation**:
```typescript
// Use refs for immediate state checks
const isGestureActiveRef = useRef(false);
const isDrawingRef = useRef(false);

// Update refs immediately
const startCombinedGesture = (focalX: number, focalY: number) => {
  isGestureActiveRef.current = true; // Immediate update
  setIsGestureActive(true); // React state update (for UI)
  if (onDrawingStateChange) onDrawingStateChange(true);
  if (onGestureStateChange) onGestureStateChange(true);
};

// Check refs in touch handler
const touchHandler = useTouchHandler({
  onStart: ({ x, y }) => {
    // Check ref immediately (no async delay)
    if (isGestureActiveRef.current) {
      return;
    }
    // Drawing logic...
  },
});
```

### Phase 3: Batched Updates with useAnimatedReaction

**Goal**: Batch zoom/pan updates to prevent excessive re-renders.

**Implementation**:
```typescript
import { useAnimatedReaction, useSharedValue, runOnJS } from 'react-native-reanimated';

// Use shared values for smooth updates
const zoomShared = useSharedValue(1);
const panXShared = useSharedValue(0);
const panYShared = useSharedValue(0);

// Update shared values (no re-render)
const updateCombinedGesture = (scale: number, focalX: number, focalY: number, translationX: number, translationY: number) => {
  'worklet';
  // Calculate new values
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, baseZoom * scale));
  const newPanX = basePanX + translationX;
  const newPanY = basePanY + translationY;
  
  // Update shared values (no React re-render)
  zoomShared.value = newZoom;
  panXShared.value = newPanX;
  panYShared.value = newPanY;
};

// Sync shared values to React state (batched)
useAnimatedReaction(
  () => [zoomShared.value, panXShared.value, panYShared.value],
  ([z, px, py]) => {
    runOnJS(setZoom)(z);
    runOnJS(setPanOffset)({ x: px, y: py });
  },
  [zoomShared.value, panXShared.value, panYShared.value]
);
```

### Phase 4: Enhanced Touch Handler Guards

**Goal**: Add multiple layers of protection to prevent drawing during gestures.

**Implementation**:
```typescript
const touchHandler = useTouchHandler({
  onStart: ({ x, y, numberOfTouches }) => {
    // Layer 1: Check touch count
    if (numberOfTouches && numberOfTouches > 1) {
      return; // Multi-touch - don't draw
    }
    
    // Layer 2: Check ref (immediate)
    if (isGestureActiveRef.current) {
      return; // Gesture active - don't draw
    }
    
    // Layer 3: Check React state (may be stale, but extra safety)
    if (isGestureActive) {
      return; // Gesture active - don't draw
    }
    
    // Only now allow drawing
    // Drawing logic...
  },
  onActive: ({ x, y, numberOfTouches }) => {
    // Same triple-layer checks
    if (numberOfTouches && numberOfTouches > 1) return;
    if (isGestureActiveRef.current) return;
    if (isGestureActive) return;
    
    // Drawing logic...
  },
  onEnd: ({ numberOfTouches }) => {
    // Same triple-layer checks
    if (numberOfTouches && numberOfTouches > 1) return;
    if (isGestureActiveRef.current) return;
    if (isGestureActive) return;
    
    // Drawing finalization...
  },
});
```

### Phase 5: Canvas Transform Optimization

**Goal**: Apply transforms directly to Canvas instead of transforming each path.

**Implementation**:
```typescript
import { Group, Matrix } from '@shopify/react-native-skia';

// Use Group with Matrix transform
<Group transform={[
  { translateX: panOffset.x },
  { translateY: panOffset.y },
  { scale: zoom },
]}>
  {/* All paths rendered here */}
  {paths.map((item, i) => (
    // Paths use logical coordinates (no transform needed)
    <Path key={i} path={pointsToPath(item)} />
  ))}
</Group>
```

## Complete Rewrite Structure

### New File Structure
```
MWSExpo/src/components/
  └── DrawingCanvas.tsx (REWRITE)
      ├── Combined Gesture Handler
      ├── Ref-Based State Management
      ├── Batched Updates (useAnimatedReaction)
      ├── Enhanced Touch Handler Guards
      └── Canvas Transform Optimization
```

### Key Components

#### 1. Combined Gesture Handler
```typescript
interface CombinedGestureState {
  isActive: boolean;
  startZoom: number;
  startPan: { x: number; y: number };
  startFocal: { x: number; y: number };
  startDistance: number;
  startCenter: { x: number; y: number };
}

const combinedGestureStateRef = useRef<CombinedGestureState | null>(null);

const startCombinedGesture = (focalX: number, focalY: number) => {
  isGestureActiveRef.current = true;
  setIsGestureActive(true);
  
  const contentFocus = toLogical(focalX, focalY);
  const currentDistance = calculateInitialDistance();
  const currentCenter = { x: focalX, y: focalY };
  
  combinedGestureStateRef.current = {
    isActive: true,
    startZoom: zoom,
    startPan: { ...panOffset },
    startFocal: contentFocus,
    startDistance: currentDistance,
    startCenter: currentCenter,
  };
  
  if (onDrawingStateChange) onDrawingStateChange(true);
  if (onGestureStateChange) onGestureStateChange(true);
};

const updateCombinedGesture = (
  scale: number,
  focalX: number,
  focalY: number,
  translationX: number,
  translationY: number
) => {
  if (!combinedGestureStateRef.current) return;
  
  const state = combinedGestureStateRef.current;
  
  // Calculate zoom
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, state.startZoom * scale));
  
  // Calculate pan (accounting for zoom change)
  const contentFocus = toLogical(focalX, focalY);
  const targetScreenX = focalX;
  const targetScreenY = focalY;
  const newPanX = targetScreenX - state.startFocal.x * newZoom;
  const newPanY = targetScreenY - state.startFocal.y * newZoom;
  
  // Add translation for pan gesture
  const finalPanX = newPanX + translationX;
  const finalPanY = newPanY + translationY;
  
  // Clamp pan
  const clampedPan = clampPan(finalPanX, finalPanY, newZoom);
  
  // Update shared values (no re-render)
  zoomShared.value = newZoom;
  panXShared.value = clampedPan.x;
  panYShared.value = clampedPan.y;
};

const endCombinedGesture = () => {
  isGestureActiveRef.current = false;
  setIsGestureActive(false);
  combinedGestureStateRef.current = null;
  
  if (onDrawingStateChange) onDrawingStateChange(false);
  if (onGestureStateChange) onGestureStateChange(false);
};
```

#### 2. Ref-Based State Management
```typescript
// Immediate state checks
const isGestureActiveRef = useRef(false);
const isDrawingRef = useRef(false);
const currentToolRef = useRef<string>(currentTool);

// Sync refs with props
useLayoutEffect(() => {
  currentToolRef.current = currentTool;
}, [currentTool]);

// Update refs immediately
const startCombinedGesture = () => {
  isGestureActiveRef.current = true; // Immediate
  setIsGestureActive(true); // React state (for UI)
};
```

#### 3. Batched Updates
```typescript
import { useAnimatedReaction, useSharedValue, runOnJS } from 'react-native-reanimated';

const zoomShared = useSharedValue(1);
const panXShared = useSharedValue(0);
const panYShared = useSharedValue(0);

// Update shared values (no re-render)
const updateCombinedGesture = (scale, focalX, focalY, translationX, translationY) => {
  'worklet';
  // Calculate and update shared values
  zoomShared.value = newZoom;
  panXShared.value = newPanX;
  panYShared.value = newPanY;
};

// Sync to React state (batched, throttled)
useAnimatedReaction(
  () => [zoomShared.value, panXShared.value, panYShared.value],
  ([z, px, py], prev) => {
    if (prev) {
      const [prevZ, prevPX, prevPY] = prev;
      // Only update if significant change (throttle)
      if (Math.abs(z - prevZ) > 0.01 || Math.abs(px - prevPX) > 1 || Math.abs(py - prevPY) > 1) {
        runOnJS(setZoom)(z);
        runOnJS(setPanOffset)({ x: px, y: py });
      }
    } else {
      runOnJS(setZoom)(z);
      runOnJS(setPanOffset)({ x: px, y: py });
    }
  }
);
```

#### 4. Enhanced Touch Handler
```typescript
// CORRECT APPROACH - Match web app's touch-level interception
const touchHandler = useTouchHandler({
  onStart: ({ x, y, numberOfTouches }) => {
    // LAYER 1: Check touch count FIRST (immediate, like web app)
    // This matches web app's "if (touches.length === 2)" check
    if (numberOfTouches && numberOfTouches > 1) {
      console.log('DrawingCanvas: Multi-touch detected, ignoring drawing');
      return; // Multi-touch - don't draw, let gesture handlers handle it
    }
    
    // LAYER 2: Check ref (immediate, no async delay)
    if (isGestureActiveRef.current) {
      console.log('DrawingCanvas: Gesture active (ref), ignoring drawing');
      return;
    }
    
    // LAYER 3: Check state (backup, may be stale but extra safety)
    if (isGestureActive) {
      console.log('DrawingCanvas: Gesture active (state), ignoring drawing');
      return;
    }
    
    // Only now allow drawing (single touch, no gesture active)
    // This matches web app's "else if (touches.length === 1)" path
    // ... drawing logic
  },
  onActive: ({ x, y, numberOfTouches }) => {
    // Same triple-layer checks (matches web app's handleTouchMove logic)
    if (numberOfTouches && numberOfTouches > 1) return;
    if (isGestureActiveRef.current) return;
    if (isGestureActive) return;
    
    // Only allow drawing if single touch and no gesture
    // This matches web app's "else if (touches.length === 1 && !isGestureActive)" path
    // ... drawing logic
  },
  onEnd: ({ numberOfTouches }) => {
    // Same triple-layer checks
    if (numberOfTouches && numberOfTouches > 1) return;
    if (isGestureActiveRef.current) return;
    if (isGestureActive) return;
    
    // Only finalize drawing if single touch and no gesture
    // ... drawing finalization
  },
});
```

**Key Insight**: This matches the web app's interception mechanism:
- Web app: `if (touches.length === 2)` → don't call mouse handlers
- Android app: `if (numberOfTouches > 1)` → don't process drawing
- Both check touch count FIRST, before any state checks

#### 5. Canvas Transform Optimization
```typescript
import { Group } from '@shopify/react-native-skia';

// Use Group transform instead of transforming each path
<Group transform={[
  { translateX: panOffset.x },
  { translateY: panOffset.y },
  { scale: zoom },
]}>
  {/* Background */}
  <Rect x={0} y={0} width={width} height={height} color="white" />
  
  {/* Completed paths - use logical coordinates */}
  {paths.map((item, i) => {
    if (Array.isArray(item)) {
      const path = pointsToPath(item); // No transform needed
      return <Path key={i} path={path} color={item[0]?.color} />;
    }
    // ... other shapes
  })}
  
  {/* Current path - use logical coordinates */}
  {currentPoints.length > 0 && (
    <Path
      path={pointsToPath(currentPoints)}
      color={currentColor}
    />
  )}
</Group>
```

## Implementation Steps

### Step 1: Create Backup
- Backup current `DrawingCanvas.tsx`
- Create feature branch: `fix/android-drawing-zoom-pan`

### Step 2: Implement Ref-Based State
- Add `isGestureActiveRef`, `isDrawingRef`, `currentToolRef`
- Update all gesture handlers to update refs immediately
- Update touch handler to check refs first

### Step 3: Implement Combined Gesture Handler
- Remove separate `pinchGesture` and `twoFingerPan`
- Create `combinedGesture` that handles both zoom and pan
- Implement `startCombinedGesture`, `updateCombinedGesture`, `endCombinedGesture`

### Step 4: Implement Batched Updates
- Add `useSharedValue` for zoom and pan
- Add `useAnimatedReaction` to sync shared values to React state
- Throttle updates to prevent excessive re-renders

### Step 5: Enhance Touch Handler Guards
- Add `numberOfTouches` check
- Add ref check (immediate)
- Add state check (backup)
- Add logging for debugging

### Step 6: Optimize Canvas Rendering
- Wrap paths in `Group` with transform
- Remove individual path transforms
- Use logical coordinates for all paths

### Step 7: Testing
- Test 2-finger zoom (should be smooth, no drawing)
- Test 2-finger pan (should be smooth, no drawing)
- Test simultaneous zoom+pan (should work seamlessly)
- Test single-finger drawing (should work normally)
- Test tool switching during gestures
- Test performance (should be 60 FPS)

## Performance Targets

### Before Fix
- ❌ Zoom/pan: 15-30 FPS (laggy)
- ❌ Unwanted drawing during gestures
- ❌ Frame drops during zoom/pan

### After Fix
- ✅ Zoom/pan: 60 FPS (smooth)
- ✅ No unwanted drawing during gestures
- ✅ No frame drops during zoom/pan
- ✅ Smooth simultaneous zoom+pan

## Testing Checklist

### Functional Tests
- [ ] 2-finger zoom in works smoothly
- [ ] 2-finger zoom out works smoothly
- [ ] 2-finger pan works smoothly
- [ ] Simultaneous zoom+pan works seamlessly
- [ ] No lines drawn during zoom/pan gestures
- [ ] Single-finger drawing works normally
- [ ] Tool switching works correctly
- [ ] Undo/redo works correctly

### Performance Tests
- [ ] 60 FPS during zoom gestures
- [ ] 60 FPS during pan gestures
- [ ] 60 FPS during simultaneous zoom+pan
- [ ] No frame drops during gestures
- [ ] Smooth drawing after gestures

### Edge Cases
- [ ] Rapid gesture switching
- [ ] Gesture cancellation
- [ ] Gesture during active drawing
- [ ] Multiple rapid gestures
- [ ] Gesture at canvas boundaries

## Migration Notes

### Breaking Changes
- None - API remains the same

### Dependencies
- `react-native-reanimated`: Already installed
- `react-native-gesture-handler`: Already installed
- `@shopify/react-native-skia`: Already installed

### Backward Compatibility
- All existing props remain the same
- All existing callbacks remain the same
- No changes to parent components required

## Success Criteria

1. ✅ **Smooth Performance**: 60 FPS during zoom/pan gestures
2. ✅ **No Unwanted Drawing**: Zero lines drawn during gestures
3. ✅ **Seamless Gestures**: Simultaneous zoom+pan works perfectly
4. ✅ **Web Parity**: Android app matches web app performance
5. ✅ **User Experience**: Gestures feel natural and responsive

## Timeline Estimate

- **Phase 1-2**: 2-3 hours (Ref-based state + Combined gesture)
- **Phase 3**: 2-3 hours (Batched updates)
- **Phase 4**: 1-2 hours (Enhanced guards)
- **Phase 5**: 1-2 hours (Canvas optimization)
- **Testing**: 2-3 hours
- **Total**: 8-13 hours

## References

- Web App Implementation: `src/components/test/DrawingTestStudent.jsx`
- Android App Implementation: `MWSExpo/src/components/DrawingCanvas.tsx`
- Sketchbook Analysis: `MWSExpo/SKETCHBOOK_ZOOM_ANALYSIS.md`
- React Native Skia Docs: https://shopify.github.io/react-native-skia/
- React Native Gesture Handler Docs: https://docs.swmansion.com/react-native-gesture-handler/

