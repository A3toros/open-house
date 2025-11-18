import { useState, useCallback, useEffect } from 'react';
import { coordinateUtils } from '../utils/coordinateUtils';

// Custom hook for image scaling and positioning
export const useImageScaling = (imageObj, canvasSize) => {
  const [imageInfo, setImageInfo] = useState(null);
  
  const calculateImageInfo = useCallback((image, canvas) => {
    return coordinateUtils.calculateImageInfo(image, canvas);
  }, []);
  
  useEffect(() => {
    if (imageObj && canvasSize) {
      const info = calculateImageInfo(imageObj, canvasSize);
      setImageInfo(info);
    }
  }, [imageObj, canvasSize, calculateImageInfo]);
  
  return imageInfo;
};
