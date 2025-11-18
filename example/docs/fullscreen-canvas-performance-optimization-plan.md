# FullscreenCanvas Performance Optimization Plan

## Problem
Horrible lag during drawing, especially when moving finger across screen. Analysis shows multiple performance bottlenecks.

## Root Causes (Ordered by Impact)

### 1. Console.log in Worklets (UI Thread) - **CRITICAL** ⚠️
**Impact: ~70% of lag**

- **Line 749**: `console.log` fires on EVERY `onUpdate` event (60+ times/second during drawing)
- **Line 734**: `console.log` on every draw start
- **Lines 728, 740, 746**: Additional logs in gesture handlers
- **Problem**: Console logging from worklets (UI thread) is extremely expensive and blocks rendering

**Solution**: Remove ALL console.log statements from worklets. Keep only critical error logs, and move them to JS thread using `runOnJS` if absolutely necessary.

### 2. setLines on Every Point - **VERY HIGH** ⚠️
**Impact: ~20% of lag**

- **Line 396**: `setLines` called on every single point append
- **Problem**: Each point triggers a full React re-render of the entire canvas
- **Problem**: All lines re-render, not just the active one
- **Problem**: No batching - each point = one full render cycle

**Solution**: 
- Batch point updates using `requestAnimationFrame` or similar
- Only update state at intervals (e.g., every 3-5 points or every 16ms)
- Use a ref to accumulate points, flush periodically

### 3. Console.log in appendFreehandPoint - **HIGH** ⚠️
**Impact: ~10% of lag**

- **Lines 408, 421**: Logs on every point append
- **Problem**: Even on JS thread, frequent logging adds significant overhead

**Solution**: Remove or conditionally enable debug logs (only in dev mode with flag).

### 4. Cache Invalidation on Every Point - **MEDIUM**
**Impact: ~5% of lag**

- **Line 413**: `linePathCacheRef.current.delete(line.id)` called on every append
- **Problem**: Forces path rebuild on next render even if not needed immediately

**Solution**: Only invalidate cache when actually needed, or use a "dirty" flag instead of deleting.

### 5. findIndex on Every Append - **MEDIUM**
**Impact: ~3% of lag**

- **Line 397**: `prev.findIndex((line) => line.id === activeId)` is O(n) operation
- **Problem**: Linear search through all lines on every point append

**Solution**: Use a Map/object for O(1) line lookup by ID, or keep active line index in ref.

### 6. Full Canvas Re-render - **MEDIUM**
**Impact: ~2% of lag**

- **Line 951**: `{lines.map(renderLine)}` re-renders ALL lines on every state update
- **Problem**: No memoization - all lines rebuild paths even if unchanged

**Solution**: 
- Use `React.memo` for completed lines
- Only re-render active line during drawing
- Use Skia's `useValue` for active line rendering

### 7. Path Rebuilding - **LOWER**
**Impact: ~1% of lag**

- **Line 851**: `buildLinePath` rebuilds entire path from all points
- **Problem**: `buildSmoothPath` processes all points with Catmull-Rom smoothing

**Solution**: Incremental path building - only add new segments, don't rebuild entire path.

## Implementation Plan

### Phase 1: Quick Wins (Immediate Impact)
1. **Remove all console.log from worklets** (Lines 728, 734, 740, 746, 749)
   - Move critical error logs to JS thread if needed
   - Keep only essential warnings/errors
   
2. **Remove/disable debug logs in appendFreehandPoint** (Lines 408, 421)
   - Add `__DEV__` flag check
   - Or remove entirely

3. **Remove render debug logs** (Line 854)
   - Only log in development mode with explicit flag

**Expected Result**: ~70-80% lag reduction

### Phase 2: Batching Point Updates (High Impact)
1. **Implement point batching**:
   - Use `requestAnimationFrame` to batch point updates
   - Accumulate points in ref, flush every 16ms (60fps) or every 3-5 points
   - Only call `setLines` on flush, not on every point

2. **Optimize state updates**:
   - Use functional updates: `setLines(prev => ...)`
   - Minimize object spreading - only update what changed

**Expected Result**: Additional ~15-20% lag reduction

### Phase 3: Rendering Optimizations (Medium Impact)
1. **Memoize completed lines**:
   - Use `React.memo` or `useMemo` for completed line paths
   - Only active line should re-render during drawing

2. **Optimize line lookup**:
   - Replace `findIndex` with Map-based lookup
   - Keep active line index in ref

3. **Smart cache invalidation**:
   - Only delete cache when actually rebuilding
   - Use version numbers instead of delete/set pattern

**Expected Result**: Additional ~5-10% lag reduction

### Phase 4: Advanced Optimizations (Lower Impact)
1. **Incremental path building**:
   - Only add new path segments instead of rebuilding entire path
   - Cache path segments

2. **Use Skia's native optimizations**:
   - Consider using `useValue` for active line
   - Use Skia's built-in path operations

**Expected Result**: Additional ~2-5% lag reduction

## Code Changes Summary

### Files to Modify
- `MWSExpo/src/components/FullscreenCanvas.tsx`

### Key Changes

1. **Remove worklet console.logs**:
   ```typescript
   // REMOVE these lines:
   console.log(`[DRAW] UPDATE x=${event.x.toFixed(1)} y=${event.y.toFixed(1)} lineId=${activeId}`);
   console.log('[DRAW] START blocked - multi-touch active');
   console.log('[DRAW] UPDATE blocked - multi-touch active');
   console.log(`[DRAW] START x=${event.x.toFixed(1)} y=${event.y.toFixed(1)} lineId=${lineId}`);
   ```

2. **Add point batching**:
   ```typescript
   const pendingPointsRef = useRef<LinePoint[]>([]);
   const rafIdRef = useRef<number | null>(null);
   
   const flushPendingPoints = useCallback(() => {
     // Batch update logic
   }, []);
   ```

3. **Optimize line lookup**:
   ```typescript
   const activeLineIndexRef = useRef<number>(-1);
   // Use index instead of findIndex
   ```

4. **Memoize renderLine**:
   ```typescript
   const renderLine = useMemo(() => {
     // Memoized version
   }, [/* dependencies */]);
   ```

## Testing Checklist

- [ ] Drawing is smooth with no visible lag
- [ ] All lines render correctly
- [ ] Zoom/pan still works smoothly
- [ ] No console errors
- [ ] Performance is acceptable on low-end devices
- [ ] Debug overlay still works (if needed)
- [ ] Undo/redo still works
- [ ] Clear canvas still works

## Success Metrics

- **Target**: 60fps during drawing (16ms per frame)
- **Current**: Likely <30fps (33ms+ per frame)
- **Expected After Phase 1**: ~50fps (20ms per frame)
- **Expected After Phase 2**: ~55fps (18ms per frame)
- **Expected After Phase 3**: ~58fps (17ms per frame)

## Notes

- Start with Phase 1 (removing logs) - this alone should fix most of the lag
- Test after each phase before proceeding
- Keep debug logs available via feature flag for troubleshooting
- Consider using React DevTools Profiler to measure actual impact

