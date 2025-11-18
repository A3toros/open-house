import { useState, useCallback, useEffect, useRef } from 'react';

// Custom hook for Konva canvas management
export const useKonvaCanvas = (containerRef) => {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const stageRef = useRef(null);
  
  const updateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const maxWidth = Math.min(1200, window.innerWidth * 0.8);
      const maxHeight = Math.min(800, window.innerHeight * 0.6);
      const aspectRatio = 4/3;
      
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      setCanvasSize({ width, height });
    }
  }, [containerRef]);
  
  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);
  
  return { canvasSize, stageRef, updateCanvasSize };
};
