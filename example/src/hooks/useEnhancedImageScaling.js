import { useState, useEffect, useCallback } from 'react';

/**
 * Enhanced image scaling hook with orientation-aware scaling
 * Handles different image orientations and responsive scaling
 */
export const useEnhancedImageScaling = (image, containerSize) => {
  const [imageInfo, setImageInfo] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });

  // Get optimal scale based on image orientation
  const getOptimalScale = useCallback((image, container) => {
    if (!image || !container) return { scale: 1, width: 0, height: 0, x: 0, y: 0 };

    const containerWidth = container.width;
    const containerHeight = container.height;
    
    // Calculate scale factors
    const scaleX = containerWidth / image.width;
    const scaleY = containerHeight / image.height;
    
    // Use the smaller scale to fit within container
    const scale = Math.min(scaleX, scaleY);
    
    // Apply minimum scale for readability
    const minScale = 0.3;
    const maxScale = 2.0;
    const finalScale = Math.max(minScale, Math.min(scale, maxScale));
    
    return {
      scale: finalScale,
      width: image.width * finalScale,
      height: image.height * finalScale,
      x: (containerWidth - image.width * finalScale) / 2,
      y: (containerHeight - image.height * finalScale) / 2
    };
  }, []);

  // Get orientation-aware scale
  const getOrientationAwareScale = useCallback((image, container) => {
    if (!image || !container) return { scale: 1, width: 0, height: 0, x: 0, y: 0 };

    const isPortrait = image.height > image.width;
    const isLandscape = image.width > image.height;
    const isSquare = image.width === image.height;
    
    if (isPortrait) {
      // Portrait images: prioritize height fitting
      return getOptimalScale(image, container, 'height');
    } else if (isLandscape) {
      // Landscape images: prioritize width fitting
      return getOptimalScale(image, container, 'width');
    } else {
      // Square images: fit to smaller dimension
      return getOptimalScale(image, container, 'both');
    }
  }, [getOptimalScale]);

  // Process image when it loads
  useEffect(() => {
    if (!image || !containerSize) return;

    const processImage = () => {
      // Store original dimensions
      setOriginalDimensions({
        width: image.width,
        height: image.height
      });

      // Calculate optimal scaling
      const scaleInfo = getOrientationAwareScale(image, containerSize);
      
      setImageInfo({
        ...scaleInfo,
        image: image,
        originalWidth: image.width,
        originalHeight: image.height,
        aspectRatio: image.width / image.height,
        orientation: image.height > image.width ? 'portrait' : 
                   image.width > image.height ? 'landscape' : 'square'
      });
    };

    if (image.complete) {
      processImage();
    } else {
      image.onload = processImage;
    }
  }, [image, containerSize, getOrientationAwareScale]);

  return {
    imageInfo,
    originalDimensions,
    isPortrait: originalDimensions.height > originalDimensions.width,
    isLandscape: originalDimensions.width > originalDimensions.height,
    isSquare: originalDimensions.width === originalDimensions.height
  };
};
