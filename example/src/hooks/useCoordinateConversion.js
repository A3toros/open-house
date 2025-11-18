import { useCallback } from 'react';
import { coordinateUtils } from '../utils/coordinateUtils';

// Custom hook for coordinate conversion
export const useCoordinateConversion = (imageInfo) => {
  const convertToOriginal = useCallback((canvasX, canvasY) => {
    return coordinateUtils.convertToOriginal(canvasX, canvasY, imageInfo);
  }, [imageInfo]);
  
  const convertToCanvas = useCallback((originalX, originalY) => {
    return coordinateUtils.convertToCanvas(originalX, originalY, imageInfo);
  }, [imageInfo]);
  
  return { convertToOriginal, convertToCanvas };
};
