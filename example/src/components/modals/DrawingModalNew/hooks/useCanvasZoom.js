import { useState, useCallback } from 'react';

export const useCanvasZoom = (zoomConfig, canvasSize) => {
  // Start with a zoom that fits the canvas in the container
  const [zoom, setZoom] = useState(zoomConfig.MIN); // Start at 25% to show full canvas
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Calculate zoom with centering
  const calculateZoom = useCallback((newZoom, centerPoint, containerSize) => {
    const clampedZoom = Math.max(zoomConfig.MIN, Math.min(zoomConfig.MAX, newZoom));
    
    if (centerPoint) {
      // Zoom to point (finger center)
      const scaleChange = clampedZoom / zoom;
      const newPosition = {
        x: centerPoint.x - (centerPoint.x - position.x) * scaleChange,
        y: centerPoint.y - (centerPoint.y - position.y) * scaleChange
      };
      return { zoom: clampedZoom, position: newPosition };
    } else {
      // Center zoom
      const canvasWidth = canvasSize.width * clampedZoom;
      const canvasHeight = canvasSize.height * clampedZoom;
      const newPosition = {
        x: (containerSize.width - canvasWidth) / 2,
        y: (containerSize.height - canvasHeight) / 2
      };
      return { zoom: clampedZoom, position: newPosition };
    }
  }, [zoom, position, zoomConfig, canvasSize]);

  // Handle zoom in
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom * (1 + zoomConfig.STEP), zoomConfig.MAX);
    // For button zoom, just update zoom and let CanvasViewer handle positioning
    setZoom(newZoom);
  }, [zoom, zoomConfig]);

  // Handle zoom out
  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom / (1 + zoomConfig.STEP), zoomConfig.MIN);
    // For button zoom, just update zoom and let CanvasViewer handle positioning
    setZoom(newZoom);
  }, [zoom, zoomConfig]);

  // Handle zoom to point (for touch gestures)
  const handleZoomToPoint = useCallback((newZoom, centerPoint, containerSize) => {
    const result = calculateZoom(newZoom, centerPoint, containerSize);
    setZoom(result.zoom);
    setPosition(result.position);
  }, [calculateZoom]);

  // Handle pan
  const handlePan = useCallback((deltaX, deltaY) => {
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
  }, []);

  // Reset zoom and position
  const resetZoom = useCallback(() => {
    setZoom(zoomConfig.INITIAL);
    setPosition({ x: 0, y: 0 });
  }, [zoomConfig.INITIAL]);

  return {
    zoom,
    setZoom,
    position,
    setPosition,
    handleZoomIn,
    handleZoomOut,
    handleZoomToPoint,
    handlePan,
    resetZoom,
  };
};
