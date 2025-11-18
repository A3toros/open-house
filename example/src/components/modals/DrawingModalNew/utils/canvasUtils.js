// Canvas utility functions

// Get canvas point from touch/mouse event
export const getCanvasPoint = (e, stage) => {
  const pos = stage.getPointerPosition();
  return {
    x: (pos.x - stage.x()) / stage.scaleX(),
    y: (pos.y - stage.y()) / stage.scaleY()
  };
};

// Clamp position to keep canvas visible
export const clampPosition = (position, zoom, canvasSize, containerSize) => {
  const canvasWidth = canvasSize.width * zoom;
  const canvasHeight = canvasSize.height * zoom;
  
  // If canvas is smaller than container, center it
  const minX = Math.min(0, containerSize.width - canvasWidth);
  const minY = Math.min(0, containerSize.height - canvasHeight);
  
  const maxX = canvasWidth < containerSize.width ? (containerSize.width - canvasWidth) / 2 : 0;
  const maxY = canvasHeight < containerSize.height ? (containerSize.height - canvasHeight) / 2 : 0;
  
  return {
    x: Math.min(maxX, Math.max(minX, position.x)),
    y: Math.min(maxY, Math.max(minY, position.y)),
  };
};

// Calculate zoom with centering
export const calculateZoom = (newZoom, centerPoint, currentZoom, currentPosition, canvasSize, containerSize) => {
  const clampedZoom = Math.max(0.25, Math.min(1.0, newZoom));
  
  if (centerPoint) {
    // Zoom to point (finger center)
    const scaleChange = clampedZoom / currentZoom;
    const newPosition = {
      x: centerPoint.x - (centerPoint.x - currentPosition.x) * scaleChange,
      y: centerPoint.y - (centerPoint.y - currentPosition.y) * scaleChange
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
};

// Calculate container size
export const getContainerSize = (element) => {
  if (!element) return { width: 800, height: 600 };
  return {
    width: element.clientWidth,
    height: element.clientHeight
  };
};

// Check if point is within canvas bounds
export const isPointInCanvas = (point, canvasSize) => {
  return point.x >= 0 && point.x <= canvasSize.width && 
         point.y >= 0 && point.y <= canvasSize.height;
};

// Convert screen coordinates to canvas coordinates
export const screenToCanvas = (screenPoint, stage) => {
  return {
    x: (screenPoint.x - stage.x()) / stage.scaleX(),
    y: (screenPoint.y - stage.y()) / stage.scaleY()
  };
};

// Convert canvas coordinates to screen coordinates
export const canvasToScreen = (canvasPoint, stage) => {
  return {
    x: canvasPoint.x * stage.scaleX() + stage.x(),
    y: canvasPoint.y * stage.scaleY() + stage.y()
  };
};
