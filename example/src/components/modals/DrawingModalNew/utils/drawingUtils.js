// Drawing utility functions

// Drawing tools constants
export const DRAWING_TOOLS = {
  PENCIL: 'pencil',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  PAN: 'pan',
};

// Color palette
export const COLOR_PALETTE = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
];

// Default drawing settings
export const DEFAULT_SETTINGS = {
  color: '#000000',
  thickness: 2,
  tool: DRAWING_TOOLS.PENCIL,
};

// Create point data
export const createPointData = (point, color, thickness) => ({
  x: point.x,
  y: point.y,
  color: color || DEFAULT_SETTINGS.color,
  thickness: thickness || DEFAULT_SETTINGS.thickness,
});

// Create shape data
export const createShapeData = (type, startPoint, endPoint, color, thickness) => ({
  type,
  startX: startPoint.x,
  startY: startPoint.y,
  endX: endPoint.x,
  endY: endPoint.y,
  color: color || DEFAULT_SETTINGS.color,
  thickness: thickness || DEFAULT_SETTINGS.thickness,
});

// Calculate line length
export const getLineLength = (startPoint, endPoint) => {
  return Math.sqrt(
    Math.pow(endPoint.x - startPoint.x, 2) + 
    Math.pow(endPoint.y - startPoint.y, 2)
  );
};

// Calculate rectangle dimensions
export const getRectangleDimensions = (startPoint, endPoint) => {
  const width = Math.abs(endPoint.x - startPoint.x);
  const height = Math.abs(endPoint.y - startPoint.y);
  const x = Math.min(startPoint.x, endPoint.x);
  const y = Math.min(startPoint.y, endPoint.y);
  return { x, y, width, height };
};

// Calculate circle properties
export const getCircleProperties = (startPoint, endPoint) => {
  const radius = getLineLength(startPoint, endPoint) / 2;
  const centerX = (startPoint.x + endPoint.x) / 2;
  const centerY = (startPoint.y + endPoint.y) / 2;
  return { centerX, centerY, radius };
};

// Validate drawing data
export const validateDrawingData = (data) => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    if (Array.isArray(item)) {
      // It's a line (array of points)
      return item.every(point => 
        point && 
        typeof point.x === 'number' && 
        typeof point.y === 'number'
      );
    } else if (item && typeof item === 'object') {
      // It's a shape
      return item.type && 
             typeof item.startX === 'number' && 
             typeof item.startY === 'number' &&
             typeof item.endX === 'number' && 
             typeof item.endY === 'number';
    }
    return false;
  });
};

// Clean drawing data (remove invalid points)
export const cleanDrawingData = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.filter(item => {
    if (Array.isArray(item)) {
      // Clean line points
      const cleanLine = item.filter(point => 
        point && 
        typeof point.x === 'number' && 
        typeof point.y === 'number' &&
        !isNaN(point.x) && 
        !isNaN(point.y)
      );
      return cleanLine.length > 0;
    } else if (item && typeof item === 'object') {
      // Validate shape
      return item.type && 
             typeof item.startX === 'number' && 
             typeof item.startY === 'number' &&
             typeof item.endX === 'number' && 
             typeof item.endY === 'number' &&
             !isNaN(item.startX) && 
             !isNaN(item.startY) &&
             !isNaN(item.endX) && 
             !isNaN(item.endY);
    }
    return false;
  });
};

// Get drawing bounds
export const getDrawingBounds = (drawingData) => {
  if (!Array.isArray(drawingData) || drawingData.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  drawingData.forEach(item => {
    if (Array.isArray(item)) {
      // Line points
      item.forEach(point => {
        if (point && typeof point.x === 'number' && typeof point.y === 'number') {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        }
      });
    } else if (item && typeof item === 'object') {
      // Shape
      const { startX, startY, endX, endY } = item;
      minX = Math.min(minX, startX, endX);
      minY = Math.min(minY, startY, endY);
      maxX = Math.max(maxX, startX, endX);
      maxY = Math.max(maxY, startY, endY);
    }
  });
  
  return {
    minX: minX === Infinity ? 0 : minX,
    minY: minY === Infinity ? 0 : minY,
    maxX: maxX === -Infinity ? 0 : maxX,
    maxY: maxY === -Infinity ? 0 : maxY,
  };
};
