/**
 * Eraser Utilities for Drawing Interface
 * Handles collision detection, line splitting, and eraser gesture processing
 */

// Distance to line segment calculation
export const distanceToLineSegment = (px, py, x1, y1, x2, y2) => {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;
  
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

// Line splitting logic
export const splitLineAtEraser = (line, collisions) => {
  if (collisions.length === 0) return [line];
  
  const sortedCollisions = collisions.sort((a, b) => a.index - b.index);
  const result = [];
  let startIndex = 0;
  
  for (const collision of sortedCollisions) {
    if (collision.index > startIndex) {
      result.push(line.slice(startIndex, collision.index + 1));
    }
    startIndex = collision.index + 1;
  }
  
  if (startIndex < line.length) {
    result.push(line.slice(startIndex));
  }
  
  return result.filter(segment => segment.length > 0);
};

// Eraser collision detection
export const detectEraserCollision = (eraserX, eraserY, eraserSize, lineData) => {
  const collisions = [];
  const radius = eraserSize / 2;
  
  for (let i = 0; i < lineData.length - 1; i++) {
    const point1 = lineData[i];
    const point2 = lineData[i + 1];
    
    // Check if line segment intersects with eraser circle
    const distance = distanceToLineSegment(eraserX, eraserY, point1.x, point1.y, point2.x, point2.y);
    if (distance <= radius) {
      collisions.push({
        index: i,
        point: { x: point1.x, y: point1.y },
        distance: distance
      });
    }
  }
  
  return collisions;
};

// Apply eraser to line data
export const applyEraserToLine = (line, eraserX, eraserY, eraserSize) => {
  const collisions = detectEraserCollision(eraserX, eraserY, eraserSize, line);
  if (collisions.length === 0) return [line];
  
  // Split line at collision points
  return splitLineAtEraser(line, collisions);
};

// Shape intersection detection
export const isEraserInsideShape = (eraserX, eraserY, eraserSize, shape) => {
  if (shape.type === 'rectangle') {
    const x = Math.min(shape.startX, shape.endX);
    const y = Math.min(shape.startY, shape.endY);
    const width = Math.abs(shape.endX - shape.startX);
    const height = Math.abs(shape.endY - shape.startY);
    
    return eraserX >= x && eraserX <= x + width && 
           eraserY >= y && eraserY <= y + height;
  } else if (shape.type === 'circle') {
    const centerX = (shape.startX + shape.endX) / 2;
    const centerY = (shape.startY + shape.endY) / 2;
    const radius = Math.sqrt(
      Math.pow(shape.endX - shape.startX, 2) + 
      Math.pow(shape.endY - shape.startY, 2)
    ) / 2;
    
    const distance = Math.sqrt(
      Math.pow(eraserX - centerX, 2) + 
      Math.pow(eraserY - centerY, 2)
    );
    
    return distance <= radius;
  }
  
  return false;
};

// Complete eraser gesture handling
export const handleEraserGesture = (eraserX, eraserY, eraserSize, drawingData) => {
  const updatedData = [];
  
  for (const item of drawingData) {
    if (Array.isArray(item)) {
      // It's a line - apply eraser
      const erasedSegments = applyEraserToLine(item, eraserX, eraserY, eraserSize);
      updatedData.push(...erasedSegments);
    } else if (item.type === 'line') {
      // It's a line shape - check if eraser intersects
      const distance = distanceToLineSegment(eraserX, eraserY, item.startX, item.startY, item.endX, item.endY);
      if (distance > eraserSize / 2) {
        updatedData.push(item); // Keep if not erased
      }
    } else if (item.type === 'rectangle' || item.type === 'circle') {
      // For shapes, check if eraser center is inside bounding box
      const isInside = isEraserInsideShape(eraserX, eraserY, eraserSize, item);
      if (!isInside) {
        updatedData.push(item); // Keep if not erased
      }
    }
  }
  
  return updatedData;
};
