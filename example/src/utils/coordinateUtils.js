// Coordinate conversion utilities for matching test
export const coordinateUtils = {
  convertToOriginal: (canvasX, canvasY, imageInfo) => {
    if (!imageInfo) return { x: canvasX, y: canvasY };
    return {
      x: Number(((canvasX - imageInfo.x) / imageInfo.scale).toFixed(4)),
      y: Number(((canvasY - imageInfo.y) / imageInfo.scale).toFixed(4))
    };
  },
  
  convertToCanvas: (originalX, originalY, imageInfo) => {
    if (!imageInfo) return { x: originalX, y: originalY };
    return {
      x: Number((imageInfo.x + (originalX * imageInfo.scale)).toFixed(4)),
      y: Number((imageInfo.y + (originalY * imageInfo.scale)).toFixed(4))
    };
  },
  
  isPointInImage: (pos, imageInfo) => {
    if (!imageInfo) return false;
    return pos.x >= imageInfo.x && 
           pos.x <= imageInfo.x + imageInfo.width &&
           pos.y >= imageInfo.y && 
           pos.y <= imageInfo.y + imageInfo.height;
  },
  
  calculateImageScale: (image, canvasSize) => {
    if (!image || !canvasSize) return 1;
    
    const padding = 40;
    const availableWidth = canvasSize.width - padding;
    const availableHeight = canvasSize.height - padding;
    
    return Math.min(availableWidth / image.width, availableHeight / image.height);
  },
  
  calculateImageInfo: (image, canvasSize) => {
    if (!image || !canvasSize) return null;
    
    const padding = 40;
    const availableWidth = canvasSize.width - padding;
    const availableHeight = canvasSize.height - padding;
    const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
    
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    const x = (canvasSize.width - scaledWidth) / 2;
    const y = (canvasSize.height - scaledHeight) / 2;
    
    return {
      x, y, width: scaledWidth, height: scaledHeight,
      scale, originalWidth: image.width, originalHeight: image.height
    };
  }
};
