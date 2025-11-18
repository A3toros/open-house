import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for responsive container sizing
 * Handles dynamic container resizing and breakpoint-based settings
 */
export const useResponsiveContainer = (containerRef) => {
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [responsiveSettings, setResponsiveSettings] = useState({});

  // Update container size when window resizes
  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({
        width: rect.width,
        height: Math.max(400, rect.height) // Minimum height
      });
    }
  }, [containerRef]);

  // Get responsive settings based on container width
  const getResponsiveSettings = useCallback((width) => {
    if (width < 480) {
      // Mobile portrait
      return {
        stageHeight: 300,
        blockMinSize: 50,
        fontSize: 12,
        padding: 10,
        touchTargetSize: 44,
        arrowThickness: 4
      };
    } else if (width < 768) {
      // Mobile landscape / small tablet
      return {
        stageHeight: 400,
        blockMinSize: 60,
        fontSize: 14,
        padding: 15,
        touchTargetSize: 44,
        arrowThickness: 4
      };
    } else if (width < 1024) {
      // Tablet
      return {
        stageHeight: 500,
        blockMinSize: 70,
        fontSize: 16,
        padding: 20,
        touchTargetSize: 40,
        arrowThickness: 3
      };
    } else {
      // Desktop
      return {
        stageHeight: 600,
        blockMinSize: 80,
        fontSize: 18,
        padding: 25,
        touchTargetSize: 32,
        arrowThickness: 2
      };
    }
  }, []);

  // Update responsive settings when container size changes
  useEffect(() => {
    const settings = getResponsiveSettings(containerSize.width);
    setResponsiveSettings(settings);
  }, [containerSize.width, getResponsiveSettings]);

  // Set up resize listener
  useEffect(() => {
    updateSize();
    
    const handleResize = () => {
      updateSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateSize]);

  return {
    containerSize,
    responsiveSettings,
    updateSize
  };
};
