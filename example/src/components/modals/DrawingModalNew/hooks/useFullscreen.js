import { useState, useCallback } from 'react';

const ZOOM_CONFIG = {
  MIN: 0.25,        // 25% - shows full canvas
  MAX: 1.0,         // 100% - max zoom (shows small part)
  INITIAL: 1.0,     // Start at max zoom
};

export const useFullscreen = (drawingState, setDrawingState) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [preFullscreenState, setPreFullscreenState] = useState(null);

  // Enter fullscreen mode
  const enterFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Save current state
      setPreFullscreenState({
        zoom: drawingState.zoom,
        position: { ...drawingState.position }
      });
      
      // Enter fullscreen
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        
        // Set zoom to show full canvas
        setDrawingState(prev => ({
          ...prev,
          zoom: ZOOM_CONFIG.MIN, // 25% - show full canvas
          position: { x: 0, y: 0 }, // Center
          isFullscreen: true
        }));
      }).catch((error) => {
        console.error('Error entering fullscreen:', error);
      });
    }
  }, [drawingState.zoom, drawingState.position, setDrawingState]);

  // Exit fullscreen mode
  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        
        // Restore previous state
        if (preFullscreenState) {
          setDrawingState(prev => ({
            ...prev,
            zoom: preFullscreenState.zoom,
            position: preFullscreenState.position,
            isFullscreen: false
          }));
          setPreFullscreenState(null);
        } else {
          // Fallback to default if no previous state
          setDrawingState(prev => ({
            ...prev,
            zoom: ZOOM_CONFIG.INITIAL,
            position: { x: 0, y: 0 },
            isFullscreen: false
          }));
        }
      }).catch((error) => {
        console.error('Error exiting fullscreen:', error);
      });
    }
  }, [preFullscreenState, setDrawingState]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
  };
};
