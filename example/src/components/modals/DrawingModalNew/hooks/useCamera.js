import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// A simple camera model that manages scale and translation for a 2D canvas.
// It is container-size and rotation aware, and exposes helpers to fit and zoom.
export function useCamera({ containerRef, canvasSize, rotation = 0 }) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const containerSizeRef = useRef({ width: 1, height: 1 });
  const minScaleRef = useRef(0.01);
  const refitLockUntilRef = useRef(0);
  const userControlledRef = useRef(false);

  const getRotatedCanvasSize = useCallback(() => {
    const rawW = canvasSize?.width ?? canvasSize?.WIDTH ?? 0;
    const rawH = canvasSize?.height ?? canvasSize?.HEIGHT ?? 0;
    const rotated = Math.abs(rotation % 180) === 90;
    return {
      width: rotated ? rawH : rawW,
      height: rotated ? rawW : rawH,
    };
  }, [canvasSize, rotation]);

  const readContainerSize = useCallback(() => {
    const el = containerRef?.current;
    if (!el) return { width: 1, height: 1 };
    const width = el.clientWidth || 1;
    const height = el.clientHeight || 1;
    containerSizeRef.current = { width, height };
    return { width, height };
  }, [containerRef]);

  const computeFitScale = useCallback(() => {
    const { width: containerW, height: containerH } = containerSizeRef.current;
    const { width: canvasW, height: canvasH } = getRotatedCanvasSize();
    const fitX = containerW / Math.max(canvasW, 1);
    const fitY = containerH / Math.max(canvasH, 1);
    const marginFactor = 0.98;
    return Math.min(fitX, fitY, 1) * marginFactor;
  }, [getRotatedCanvasSize]);

  const centerAtScale = useCallback((targetScale) => {
    const { width: containerW, height: containerH } = containerSizeRef.current;
    const { width: canvasW, height: canvasH } = getRotatedCanvasSize();
    const clampedScale = Math.max(minScaleRef.current, Math.min(targetScale, 1.5));
    let x = (containerW - canvasW * clampedScale) / 2;
    let y = (containerH - canvasH * clampedScale) / 2;
    const maxX = containerW - canvasW * clampedScale;
    const maxY = containerH - canvasH * clampedScale;
    x = Math.min(Math.max(0, x), Math.max(0, maxX));
    y = Math.min(Math.max(0, y), Math.max(0, maxY));
    try {
      // eslint-disable-next-line no-console
      console.log('[Camera] centerAtScale', { targetScale, clampedScale, container: { containerW, containerH }, canvas: { canvasW, canvasH }, translate: { x, y }, rotation });
    } catch {}
    setTranslate({ x, y });
    setScale(clampedScale);
  }, [getRotatedCanvasSize]);

  // Fit the entire canvas into the container and center it
  const fitCanvas = useCallback(() => {
    const { width: containerW, height: containerH } = readContainerSize();
    const { width: canvasW, height: canvasH } = getRotatedCanvasSize();
    const clamped = computeFitScale();
    // Group-level transform: position top-left so the full canvas is centered
    let x = (containerW - canvasW * clamped) / 2;
    let y = (containerH - canvasH * clamped) / 2;
    // Clamp into container to guarantee full visibility
    const maxX = containerW - canvasW * clamped;
    const maxY = containerH - canvasH * clamped;
    x = Math.min(Math.max(0, x), Math.max(0, maxX));
    y = Math.min(Math.max(0, y), Math.max(0, maxY));
    try {
      // eslint-disable-next-line no-console
      console.log('[Camera] fitCanvas', { scale: clamped, container: { containerW, containerH }, canvas: { canvasW, canvasH }, translate: { x, y }, rotation });
    } catch {}
    setScale(clamped);
    setTranslate({ x, y });
    minScaleRef.current = clamped;
    userControlledRef.current = false;
  }, [getRotatedCanvasSize, readContainerSize, computeFitScale]);

  const oneToOne = useCallback(() => {
    const { width: containerW, height: containerH } = readContainerSize();
    const { width: canvasW, height: canvasH } = getRotatedCanvasSize();
    const x = (containerW - canvasW) / 2;
    const y = (containerH - canvasH) / 2;
    setScale(1);
    setTranslate({ x, y });
  }, [getRotatedCanvasSize, readContainerSize]);

  // Zoom to a specific point in container coordinates
  const zoomTo = useCallback((newScale, centerPoint) => {
    const { width: containerW, height: containerH } = containerSizeRef.current;
    const { width: canvasW, height: canvasH } = getRotatedCanvasSize();
    const clamped = Math.max(minScaleRef.current, Math.min(newScale, 1.5));

    if (centerPoint && Number.isFinite(centerPoint.x) && Number.isFinite(centerPoint.y)) {
      // Group-level zoom to pointer
      const pointTo = {
        x: (centerPoint.x - translate.x) / scale,
        y: (centerPoint.y - translate.y) / scale,
      };
      const newX = centerPoint.x - pointTo.x * clamped;
      const newY = centerPoint.y - pointTo.y * clamped;
      try { console.log('[Camera] zoomTo(pointer) ->', { from: scale, to: clamped }); } catch {}
      setScale(clamped);
      setTranslate({ x: newX, y: newY });
      refitLockUntilRef.current = Date.now() + 400;
      userControlledRef.current = true;
    } else {
      // Center zoom: keep full canvas centered in container, clamped into view
      let x = (containerW - canvasW * clamped) / 2;
      let y = (containerH - canvasH * clamped) / 2;
      const maxX = containerW - canvasW * clamped;
      const maxY = containerH - canvasH * clamped;
      x = Math.min(Math.max(0, x), Math.max(0, maxX));
      y = Math.min(Math.max(0, y), Math.max(0, maxY));
      try { console.log('[Camera] zoomTo(center) ->', { from: scale, to: clamped }); } catch {}
      setScale(clamped);
      setTranslate({ x, y });
      refitLockUntilRef.current = Date.now() + 400;
      userControlledRef.current = true;
    }
  }, [getRotatedCanvasSize, scale, translate]);

  const zoomByFactor = useCallback((factor, centerPoint) => {
    const next = scale * factor;
    // If no centerPoint provided, default to container center in Stage coords
    const { width, height } = containerSizeRef.current;
    const fallback = { x: width / 2, y: height / 2 };
    zoomTo(next, centerPoint || fallback);
  }, [scale, zoomTo]);

  const panBy = useCallback((dx, dy) => {
    // Group-level pan is in stage coordinates
    setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    refitLockUntilRef.current = Date.now() + 200;
    userControlledRef.current = true;
  }, []);

  // Resize observer to keep container size updated and refit when necessary
  useEffect(() => {
    const el = containerRef?.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      readContainerSize();
      // Recompute min scale, but do not force-fit unless not user controlled
      const newMin = computeFitScale();
      minScaleRef.current = newMin;
      if (Date.now() < refitLockUntilRef.current) return;
      if (!userControlledRef.current) {
        try { console.log('[Camera] resize centerAtScale', { scale }); } catch {}
        centerAtScale(scale);
      }
    });
    observer.observe(el);
    readContainerSize();
    return () => observer.disconnect();
  }, [containerRef, readContainerSize, computeFitScale, centerAtScale, scale]);

  // Refitting on rotation and canvas size changes
  useEffect(() => {
    userControlledRef.current = false;
    // Recompute min scale and re-center at current scale on rotation/canvas change
    minScaleRef.current = computeFitScale();
    centerAtScale(scale);
  }, [rotation, canvasSize?.width, canvasSize?.height, canvasSize?.WIDTH, canvasSize?.HEIGHT, computeFitScale, centerAtScale, scale]);

  return useMemo(() => ({
    scale,
    translate,
    setScale,
    setTranslate,
    centerAtScale,
    fitCanvas,
    oneToOne,
    zoomTo,
    zoomByFactor,
    panBy,
  }), [scale, translate, centerAtScale, fitCanvas, oneToOne, zoomTo, zoomByFactor, panBy]);
}


