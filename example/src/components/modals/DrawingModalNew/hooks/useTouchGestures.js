import { useState, useCallback } from 'react';
import { 
  getTouchDistance, 
  getTouchCenter, 
  detectGestureType, 
  rafThrottle,
  getAdaptiveThresholds 
} from '../utils/gestureUtils';
import { getCanvasPoint, clampPosition, getContainerSize } from '../utils/canvasUtils';
import { createPointData, createShapeData, DRAWING_TOOLS } from '../utils/drawingUtils';
import { handleEraserGesture } from '../utils/eraserUtils';

export const useTouchGestures = (drawingState, setDrawingState, drawingData, setDrawingData, saveToHistoryState, undo, redo, canUndo, canRedo) => {
  const [gestureState, setGestureState] = useState({
    isActive: false,
    type: null,
    lastDistance: null,
    lastCenter: null,
  });

  // Get adaptive thresholds based on device
  const thresholds = getAdaptiveThresholds();

  // Start drawing
  const startDrawing = useCallback((e) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    if (drawingState.currentTool === DRAWING_TOOLS.PAN) return;
    
    const stage = e.target.getStage();
    const point = getCanvasPoint(e, stage);
    const pointData = createPointData(point, drawingState.currentColor, drawingState.currentThickness);

    if (drawingState.currentTool === DRAWING_TOOLS.PENCIL) {
      setDrawingState(prev => ({
        ...prev,
        isDrawing: true,
        currentLine: [pointData]
      }));
    } else if ([DRAWING_TOOLS.LINE, DRAWING_TOOLS.RECTANGLE, DRAWING_TOOLS.CIRCLE].includes(drawingState.currentTool)) {
      setDrawingState(prev => ({
        ...prev,
        isDrawing: true,
        currentShape: createShapeData(
          drawingState.currentTool,
          point,
          point,
          drawingState.currentColor,
          drawingState.currentThickness
        )
      }));
    }
  }, [drawingState.currentTool, drawingState.currentColor, drawingState.currentThickness, setDrawingState]);

  // NEW: Eraser gesture handling
  const handleEraserStart = useCallback((point) => {
    // Apply eraser to existing drawing data
    const updatedData = handleEraserGesture(point.x, point.y, drawingState.eraserSize, drawingData);
    setDrawingData(updatedData);
    
    // Save to history
    saveToHistoryState(updatedData);
  }, [drawingState.eraserSize, drawingData, setDrawingData, saveToHistoryState]);

  // NEW: Touch handlers for new tools
  const handleUndoTouch = useCallback((e) => {
    if (canUndo) {
      undo();
      // Visual feedback for touch
      showTouchFeedback('Undo', e);
    }
  }, [canUndo, undo]);

  const handleRedoTouch = useCallback((e) => {
    if (canRedo) {
      redo();
      // Visual feedback for touch
      showTouchFeedback('Redo', e);
    }
  }, [canRedo, redo]);

  // NEW: Touch feedback for new tools
  const showTouchFeedback = useCallback((action, e) => {
    // Create visual feedback for touch actions
    const stage = e.target.getStage();
    const point = getCanvasPoint(e, stage);
    
    // Show temporary feedback circle
    const feedbackCircle = new Konva.Circle({
      x: point.x,
      y: point.y,
      radius: 20,
      stroke: '#4CAF50',
      strokeWidth: 3,
      opacity: 0.8,
      listening: false
    });
    
    stage.add(feedbackCircle);
    
    // Animate and remove
    feedbackCircle.to({
      scaleX: 2,
      scaleY: 2,
      opacity: 0,
      duration: 0.3,
      onFinish: () => {
        feedbackCircle.destroy();
      }
    });
  }, []);

  // Continue drawing
  const continueDrawing = useCallback((e) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    if (!drawingState.isDrawing) return;
    
    const stage = e.target.getStage();
    const point = getCanvasPoint(e, stage);
    const pointData = createPointData(point, drawingState.currentColor, drawingState.currentThickness);

    if (drawingState.currentTool === DRAWING_TOOLS.PENCIL) {
      setDrawingState(prev => ({
        ...prev,
        currentLine: [...prev.currentLine, pointData]
      }));
    } else if (drawingState.currentShape) {
      setDrawingState(prev => ({
        ...prev,
        currentShape: {
          ...prev.currentShape,
          endX: point.x,
          endY: point.y,
        }
      }));
    }
  }, [drawingState.isDrawing, drawingState.currentTool, drawingState.currentColor, drawingState.currentThickness, drawingState.currentShape, setDrawingState]);

  // Finish drawing
  const finishDrawing = useCallback((e) => {
    if (e && e.evt) {
      e.evt.preventDefault();
      e.evt.stopPropagation();
    }
    if (!drawingState.isDrawing) return;

    if (drawingState.currentTool === DRAWING_TOOLS.PENCIL && drawingState.currentLine.length > 0) {
      setDrawingData(prev => [...prev, drawingState.currentLine]);
    } else if (drawingState.currentShape) {
      setDrawingData(prev => [...prev, drawingState.currentShape]);
    }

    setDrawingState(prev => ({
      ...prev,
      isDrawing: false,
      currentLine: [],
      currentShape: null
    }));
  }, [drawingState.isDrawing, drawingState.currentTool, drawingState.currentLine, drawingState.currentShape, setDrawingData, setDrawingState]);

  // Handle touch start with new tools support
  const handleTouchStart = useCallback((e) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    const touches = e.evt.touches;
    
    if (touches.length === 2) {
      // Two-finger gesture - always pan/zoom (disable other tools)
      setGestureState({
        isActive: true,
        type: 'pan',
        lastDistance: getTouchDistance(touches),
        lastCenter: getTouchCenter(touches),
      });
    } else if (touches.length === 1) {
      // Single finger - tool-specific actions
      if (drawingState.currentTool === DRAWING_TOOLS.ERASER) {
        // Eraser mode - disable pan gestures, enable eraser touch
        const stage = e.target.getStage();
        const point = getCanvasPoint(e, stage);
        handleEraserStart(point);
      } else if (drawingState.currentTool === DRAWING_TOOLS.UNDO) {
        // Undo tool - handle touch for undo
        handleUndoTouch(e);
      } else if (drawingState.currentTool === DRAWING_TOOLS.REDO) {
        // Redo tool - handle touch for redo
        handleRedoTouch(e);
      } else {
        // Drawing tools - existing logic
        startDrawing(e);
      }
    }
  }, [getTouchDistance, getTouchCenter, startDrawing, drawingState.currentTool, handleEraserStart, handleUndoTouch, handleRedoTouch]);

  // Throttled touch move handler
  const handleTouchMoveThrottled = useCallback(rafThrottle((e) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    const touches = e.evt.touches;
    
    if (touches.length === 2 && gestureState.isActive) {
      const gestureType = detectGestureType(touches, gestureState);
      
      if (gestureType === 'zoom') {
        // Handle zoom gesture
        const currentDistance = getTouchDistance(touches);
        const currentCenter = getTouchCenter(touches);
        const scaleChange = currentDistance / gestureState.lastDistance;
        const newZoom = Math.max(0.25, Math.min(1.0, drawingState.zoom * scaleChange));
        
        // Update zoom and position with zoom-to-point
        setDrawingState(prev => ({
          ...prev,
          zoom: newZoom,
          position: {
            x: currentCenter.x - (currentCenter.x - prev.position.x) * (newZoom / prev.zoom),
            y: currentCenter.y - (currentCenter.y - prev.position.y) * (newZoom / prev.zoom)
          }
        }));
      } else if (gestureType === 'pan') {
        // Handle pan gesture
        const currentCenter = getTouchCenter(touches);
        const deltaX = currentCenter.x - gestureState.lastCenter.x;
        const deltaY = currentCenter.y - gestureState.lastCenter.y;
        
        setDrawingState(prev => ({
          ...prev,
          position: {
            x: prev.position.x + deltaX,
            y: prev.position.y + deltaY
          }
        }));
      }
      
      // Update gesture state
      setGestureState(prev => ({
        ...prev,
        lastDistance: getTouchDistance(touches),
        lastCenter: getTouchCenter(touches),
      }));
    } else if (touches.length === 1) {
      // Single finger - tool-specific actions
      if (drawingState.currentTool === DRAWING_TOOLS.ERASER) {
        // Eraser mode - continue erasing
        const stage = e.target.getStage();
        const point = getCanvasPoint(e, stage);
        const updatedData = handleEraserGesture(point.x, point.y, drawingState.eraserSize, drawingData);
        setDrawingData(updatedData);
      } else if (drawingState.currentTool === DRAWING_TOOLS.PAN) {
        // Pan mode - continue panning
        const currentCenter = getTouchCenter(touches);
        const deltaX = currentCenter.x - gestureState.lastCenter.x;
        const deltaY = currentCenter.y - gestureState.lastCenter.y;
        
        setDrawingState(prev => ({
          ...prev,
          position: {
            x: prev.position.x + deltaX,
            y: prev.position.y + deltaY
          }
        }));
        
        setGestureState(prev => ({
          ...prev,
          lastCenter: currentCenter
        }));
      } else {
        // Drawing tools - continue drawing
        continueDrawing(e);
      }
    }
  }), [gestureState, drawingState.zoom, setDrawingState, continueDrawing]);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    handleTouchMoveThrottled(e);
  }, [handleTouchMoveThrottled]);

  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    e.evt.preventDefault();
    e.evt.stopPropagation();
    const touches = e.evt.touches;
    
    if (touches.length === 0) {
      // All fingers lifted
      finishDrawing(e);
      setGestureState({
        isActive: false,
        type: null,
        lastDistance: null,
        lastCenter: null,
      });
    } else if (touches.length === 1) {
      // One finger remaining
      setGestureState(prev => ({ ...prev, isActive: false }));
    }
  }, [finishDrawing]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // NEW: Expose new handlers
    handleEraserStart,
    handleUndoTouch,
    handleRedoTouch,
    showTouchFeedback,
  };
};
