import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { Stage, Layer, Rect, Line, Circle, Group, Text } from 'react-konva';
import { useCamera } from '../hooks/useCamera';

// Simple in-memory camera persistence across remounts
const __cameraMemory = new Map();

const ViewerCanvas = forwardRef(({ drawingData, textBoxes = [], canvasSize, rotation = 0, onScaleChange, persistKey = 'viewer', onTextBoxEdit }, ref) => {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const camera = useCamera({ containerRef, canvasSize, rotation });
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 });
  const contentGroupRef = useRef(null);
  const rotatedGroupRef = useRef(null);
  const [contentBounds, setContentBounds] = useState(null);

  // Debug drawing data
  useEffect(() => {
    console.log('[ViewerCanvas] drawingData received:', drawingData);
    console.log('[ViewerCanvas] drawingData length:', drawingData?.length);
    if (drawingData && drawingData.length > 0) {
      console.log('[ViewerCanvas] First drawing element:', drawingData[0]);
    }
    console.log('[ViewerCanvas] textBoxes:', textBoxes);
    console.log('[ViewerCanvas] textBoxes length:', textBoxes?.length);
  }, [drawingData]);

  useEffect(() => {
    if (typeof onScaleChange === 'function') onScaleChange(camera.scale);
    try {
      // eslint-disable-next-line no-console
      console.log('[ViewerCanvas] scale changed', { scale: camera.scale });
    } catch {}
    // Persist scale
    if (persistKey) {
      const prev = __cameraMemory.get(persistKey) || {};
      __cameraMemory.set(persistKey, { ...prev, scale: camera.scale });
    }
  }, [camera.scale, onScaleChange]);

  // Persist translate
  useEffect(() => {
    if (persistKey) {
      const prev = __cameraMemory.get(persistKey) || {};
      __cameraMemory.set(persistKey, { ...prev, translate: { x: camera.translate.x, y: camera.translate.y } });
    }
  }, [persistKey, camera.translate.x, camera.translate.y]);

  useImperativeHandle(ref, () => ({
    zoomIn: (centerPoint) => camera.zoomByFactor(1.1, centerPoint),
    zoomOut: (centerPoint) => camera.zoomByFactor(1 / 1.1, centerPoint),
    fitCanvas: () => camera.fitCanvas(),
    oneToOne: () => camera.oneToOne(),
    getScale: () => camera.scale,
    getStage: () => stageRef.current,
    getPointerPosition: () => stageRef.current?.getPointerPosition?.(),
    exportPNGFullCanvas: () => {
      const stage = stageRef.current;
      if (!stage) return null;
      const rawW = canvasSize?.width ?? canvasSize?.WIDTH ?? 1536;
      const rawH = canvasSize?.height ?? canvasSize?.HEIGHT ?? 2048;

      const prevStage = {
        scaleX: stage.scaleX(),
        scaleY: stage.scaleY(),
        x: stage.x(),
        y: stage.y(),
        width: stage.width(),
        height: stage.height(),
      };

      const cg = contentGroupRef.current;
      const rg = rotatedGroupRef.current;
      const prevCG = cg ? { x: cg.x(), y: cg.y(), scaleX: cg.scaleX(), scaleY: cg.scaleY() } : null;
      const prevRG = rg ? { x: rg.x(), y: rg.y(), rotation: rg.rotation() } : null;

      try {
        // Reset all transforms so paper is exported at native size, centered
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.size({ width: rawW, height: rawH });
        if (cg) {
          cg.position({ x: 0, y: 0 });
          cg.scale({ x: 1, y: 1 });
        }
        if (rg) {
          rg.position({ x: 0, y: 0 });
          rg.rotation(0);
        }
        stage.batchDraw();

        const dataURL = stage.toDataURL({
          mimeType: 'image/png',
          quality: 1,
          pixelRatio: 1,
          x: 0,
          y: 0,
          width: rawW,
          height: rawH,
        });
        return dataURL;
      } finally {
        // Restore previous view
        if (rg && prevRG) {
          rg.position({ x: prevRG.x, y: prevRG.y });
          rg.rotation(prevRG.rotation);
        }
        if (cg && prevCG) {
          cg.position({ x: prevCG.x, y: prevCG.y });
          cg.scale({ x: prevCG.scaleX, y: prevCG.scaleY });
        }
        stage.scale({ x: prevStage.scaleX, y: prevStage.scaleY });
        stage.position({ x: prevStage.x, y: prevStage.y });
        stage.size({ width: prevStage.width, height: prevStage.height });
        stage.batchDraw();
      }
    }
  }), [camera]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      setStageSize({ width: el.clientWidth || 1, height: el.clientHeight || 1 });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute content bounds from drawingData
  useEffect(() => {
    if (!Array.isArray(drawingData) || drawingData.length === 0) {
      setContentBounds(null);
      return;
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const addPoint = (x, y) => {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    };
    drawingData.forEach((item) => {
      if (Array.isArray(item)) {
        item.forEach(p => addPoint(p.x, p.y));
      } else if (item && typeof item === 'object') {
        if (item.type === 'line') {
          addPoint(item.startX, item.startY);
          addPoint(item.endX, item.endY);
        } else if (item.type === 'rectangle') {
          addPoint(item.startX, item.startY);
          addPoint(item.endX, item.endY);
        } else if (item.type === 'circle') {
          const radius = Math.hypot(item.endX - item.startX, item.endY - item.startY) / 2;
          const centerX = (item.startX + item.endX) / 2;
          const centerY = (item.startY + item.endY) / 2;
          addPoint(centerX - radius, centerY - radius);
          addPoint(centerX + radius, centerY + radius);
        }
      }
    });
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
      setContentBounds(null);
      return;
    }
    const padding = 16;
    const width = Math.max(1, (maxX - minX) + padding * 2);
    const height = Math.max(1, (maxY - minY) + padding * 2);
    setContentBounds({
      minX: minX - padding,
      minY: minY - padding,
      width,
      height,
      centerX: minX - padding + width / 2,
      centerY: minY - padding + height / 2,
    });
  }, [drawingData]);

  // Content normalization: translate and scale content to fit inside paper if it lies outside
  const contentNormalization = useMemo(() => {
    if (!contentBounds) return { scale: 1, x: 0, y: 0 };
    const rawW = canvasSize?.width ?? canvasSize?.WIDTH ?? 1536;
    const rawH = canvasSize?.height ?? canvasSize?.HEIGHT ?? 2048;
    const scale = Math.min(rawW / Math.max(1, contentBounds.width), rawH / Math.max(1, contentBounds.height), 1);
    const fittedW = contentBounds.width * scale;
    const fittedH = contentBounds.height * scale;
    const padX = (rawW - fittedW) / 2;
    const padY = (rawH - fittedH) / 2;
    const x = padX - contentBounds.minX * scale;
    const y = padY - contentBounds.minY * scale;
    return { scale, x, y };
  }, [contentBounds, canvasSize?.width, canvasSize?.height, canvasSize?.WIDTH, canvasSize?.HEIGHT]);

  // Initial view: restore persisted camera if available; otherwise fit once
  const didInitialFitRef = useRef(false);
  useEffect(() => {
    if (didInitialFitRef.current) return;
    const saved = persistKey ? __cameraMemory.get(persistKey) : null;
    if (saved && Number.isFinite(saved.scale) && saved.translate && Number.isFinite(saved.translate.x) && Number.isFinite(saved.translate.y)) {
      camera.setScale(saved.scale);
      camera.setTranslate(saved.translate);
    } else {
      camera.fitCanvas();
    }
    didInitialFitRef.current = true;
  }, [persistKey, camera]);

  // On rotation, re-fit to ensure the whole paper remains visible without clipping
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[ViewerCanvas] rotation changed', { rotation, scale: camera.scale, translate: camera.translate });
    } catch {}
    camera.fitCanvas();
  }, [rotation]);

  // When rotation changes, keep the current scale but re-center so the entire paper remains visible
  useEffect(() => {
    camera.centerAtScale(camera.scale);
  }, [rotation]);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    const factor = Math.pow(1.0015, -e.evt.deltaY);
    camera.zoomByFactor(factor, pointer);
  };

  // Simple mouse pan when zoomed in
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  // ✅ Removed text box drag logic - teachers need pan/zoom but text boxes should be read-only

  const computeFitScale = () => {
    const el = containerRef.current;
    if (!el) return 1;
    const cw = el.clientWidth || 1;
    const ch = el.clientHeight || 1;
    const rawW = canvasSize?.width ?? canvasSize?.WIDTH ?? 1;
    const rawH = canvasSize?.height ?? canvasSize?.HEIGHT ?? 1;
    const rotated = Math.abs(rotation % 180) === 90;
    const canvasW = rotated ? rawH : rawW;
    const canvasH = rotated ? rawW : rawH;
    const fit = Math.min(cw / canvasW, ch / canvasH);
    return Math.min(fit, 1);
  };

  const handleMouseDown = (e) => {
    // Only allow pan when above fit scale
    const fit = computeFitScale();
    if (camera.scale <= fit) return;
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const dx = e.evt.clientX - lastPosRef.current.x;
    const dy = e.evt.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
    camera.panBy(dx, dy);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const canvasW = 1536;
  const canvasH = 2048;

  const renderDrawingElement = (item, index) => {
    console.log(`[ViewerCanvas] Rendering drawing element ${index}:`, item);
    if (Array.isArray(item)) {
      console.log(`[ViewerCanvas] Array item with ${item.length} points:`, item.slice(0, 3));
      return (
        <Line
          key={index}
          points={item.flatMap(p => [p.x, p.y])}
          stroke={item[0]?.color || '#000000'}
          strokeWidth={item[0]?.thickness || 2}
          tension={0.5}
          lineCap="round"
          lineJoin="round"
        />
      );
    } else if (item?.type === 'line') {
      return (
        <Line
          key={index}
          points={[item.startX, item.startY, item.endX, item.endY]}
          stroke={item.color}
          strokeWidth={item.thickness}
          lineCap="round"
        />
      );
    } else if (item?.type === 'rectangle') {
      const width = Math.abs(item.endX - item.startX);
      const height = Math.abs(item.endY - item.startY);
      const x = Math.min(item.startX, item.endX);
      const y = Math.min(item.startY, item.endY);
      return (
        <Rect
          key={index}
          x={x}
          y={y}
          width={width}
          height={height}
          stroke={item.color}
          strokeWidth={item.thickness}
          fill="transparent"
        />
      );
    } else if (item?.type === 'circle') {
      const radius = Math.sqrt(
        Math.pow(item.endX - item.startX, 2) + Math.pow(item.endY - item.startY, 2)
      ) / 2;
      const centerX = (item.startX + item.endX) / 2;
      const centerY = (item.startY + item.endY) / 2;
      return (
        <Circle
          key={index}
          x={centerX}
          y={centerY}
          radius={radius}
          stroke={item.color}
          strokeWidth={item.thickness}
          fill="transparent"
        />
      );
    }
    return null;
  };

  // Pointer events for pinch-zoom and pan
  const activePointersRef = useRef(new Map());
  const lastPinchDistRef = useRef(null);
  const pinchCenterRef = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    el.setPointerCapture?.(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerMove = useCallback((e) => {
    const active = activePointersRef.current;
    if (!active.has(e.pointerId)) return;
    active.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (active.size === 2) {
      const pts = Array.from(active.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const dist = Math.hypot(dx, dy);
      const center = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const stage = stageRef.current;
      const centerStage = stage ? stage.getPointerPosition() || center : center;
      if (lastPinchDistRef.current != null) {
        const factor = dist / Math.max(1, lastPinchDistRef.current);
        camera.zoomByFactor(factor, centerStage);
      }
      lastPinchDistRef.current = dist;
      pinchCenterRef.current = centerStage;
    } else if (active.size === 1) {
      const fit = computeFitScale();
      if (camera.scale <= fit) return;
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      camera.panBy(dx, dy);
    }
  }, []);

  const onPointerUp = useCallback((e) => {
    const el = containerRef.current;
    if (!el) return;
    el.releasePointerCapture?.(e.pointerId);
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      lastPinchDistRef.current = null;
    }
    isDraggingRef.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'block', 
        backgroundColor: 'transparent',
        touchAction: 'none',
        WebkitTouchCallout: 'none'
      }}
      className="select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Layer>
          {/* White paper background and drawings; camera applies transform to group */}
          <Group
            ref={contentGroupRef}
            x={camera.translate.x}
            y={camera.translate.y}
            scaleX={camera.scale}
            scaleY={camera.scale}
          >
            {(() => {
              const norm = ((rotation % 360) + 360) % 360;
              let tx = 0, ty = 0;
              if (norm === 90) {
                // 90° clockwise: bbox x:[-H,0] → shift right by H
                tx = canvasH;
              } else if (norm === 180) {
                // After 180°, bbox is x:[-W,0], y:[-H,0] → shift right by W and down by H
                tx = canvasW; ty = canvasH;
              } else if (norm === 270) {
                // 270° clockwise (−90°): bbox y:[-W,0] → shift down by W
                ty = canvasW;
              }
              try {
                // eslint-disable-next-line no-console
                console.log('[ViewerCanvas] rotatedGroup offset', { rotation, norm, tx, ty, canvasW, canvasH });
              } catch {}
              return (
                <Group ref={rotatedGroupRef} x={tx} y={ty} rotation={rotation}>
                  <Rect x={0} y={0} width={canvasW} height={canvasH} fill="white" />
                  <Group x={contentNormalization.x} y={contentNormalization.y} scaleX={contentNormalization.scale} scaleY={contentNormalization.scale}>
                    {Array.isArray(drawingData) ? (() => {
                      console.log('[ViewerCanvas] Rendering', drawingData.length, 'drawing elements');
                      return drawingData.map((item, index) => renderDrawingElement(item, index));
                    })() : null}
                     {Array.isArray(textBoxes) && textBoxes.map((tb, i) => (
                       <Group 
                         key={`tb-${i}`} 
                         x={tb.x} 
                         y={tb.y}
                         // ✅ Text boxes are read-only in teacher view - no drag/edit functionality
                       >
                        <Rect
                          width={tb.width}
                          height={tb.height}
                          fill="#ffffff"
                          stroke="#d1d5db"
                          strokeWidth={1}
                          cornerRadius={6}
                          shadowColor="black"
                          shadowBlur={2}
                          shadowOffset={{ x: 1, y: 1 }}
                        />
                        <Text
                          text={tb.text}
                          x={8}
                          y={8}
                          width={Math.max(0, (tb.width || 0) - 16)}
                          height={Math.max(0, (tb.height || 0) - 16)}
                          fontSize={tb.fontSize || 14}
                          fill={tb.color || '#000000'}
                          wrap="word"
                          align="left"
                          verticalAlign="top"
                        />
                      </Group>
                    ))}
                  </Group>
                </Group>
              );
            })()}
          </Group>
        </Layer>
      </Stage>
    </div>
  );
});

ViewerCanvas.displayName = 'ViewerCanvas';

export default ViewerCanvas;


