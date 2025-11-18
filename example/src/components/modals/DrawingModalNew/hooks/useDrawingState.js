import { useState, useCallback } from 'react';
import { THICKNESS_CONFIG } from '../utils/constants';
import { 
  saveToHistory, 
  getHistoryData, 
  canUndo, 
  canRedo, 
  clearHistory 
} from '../utils/historyUtils';

export const useDrawingState = () => {
  // Single state object for all drawing-related state
  const [drawingState, setDrawingState] = useState({
    // Canvas state
    zoom: 1.0,                    // Start at 100% (max zoom)
    position: { x: 0, y: 0 },     // Canvas position
    rotation: 0,                  // Canvas rotation
    
    // Drawing state
    currentTool: 'pencil',        // Current drawing tool
    currentColor: '#000000',      // Current color
    currentThickness: 2,          // Current line thickness
    eraserSize: 10,               // NEW - eraser size
    isDrawing: false,             // Currently drawing
    
    // Current drawing
    currentLine: [],              // Current line being drawn
    currentShape: null,           // Current shape being drawn
    
    // History state
    drawingHistory: [],           // NEW - Array of drawing states
    historyIndex: -1,             // NEW - Current position in history
    
    // Display state
    isFullscreen: false,          // Fullscreen mode
    preFullscreenState: null,     // State before fullscreen
  });

  // Separate state for drawing data
  const [drawingData, setDrawingData] = useState([]);
  const [textBoxes, setTextBoxes] = useState([]);

  // State update functions
  const updateDrawingState = useCallback((updates) => {
    setDrawingState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetDrawingState = useCallback(() => {
    setDrawingState({
      zoom: 1.0,
      position: { x: 0, y: 0 },
      rotation: 0,
      currentTool: 'pencil',
      currentColor: '#000000',
      currentThickness: 2,
      eraserSize: 10,               // NEW
      isDrawing: false,
      currentLine: [],
      currentShape: null,
      drawingHistory: [],           // NEW
      historyIndex: -1,             // NEW
      isFullscreen: false,
      preFullscreenState: null,
    });
  }, []);

  const startDrawing = useCallback((point) => {
    const pointData = {
      x: point.x,
      y: point.y,
      color: drawingState.currentColor,
      thickness: drawingState.currentThickness,
    };

    if (drawingState.currentTool === 'pencil') {
      setDrawingState(prev => ({
        ...prev,
        isDrawing: true,
        currentLine: [pointData]
      }));
    } else if (['line', 'rectangle', 'circle'].includes(drawingState.currentTool)) {
      setDrawingState(prev => ({
        ...prev,
        isDrawing: true,
        currentShape: {
          type: drawingState.currentTool,
          startX: point.x,
          startY: point.y,
          endX: point.x,
          endY: point.y,
          color: drawingState.currentColor,
          thickness: drawingState.currentThickness,
        }
      }));
    }
  }, [drawingState.currentTool, drawingState.currentColor, drawingState.currentThickness]);

  const continueDrawing = useCallback((point) => {
    if (!drawingState.isDrawing) return;

    const pointData = {
      x: point.x,
      y: point.y,
      color: drawingState.currentColor,
      thickness: drawingState.currentThickness,
    };

    if (drawingState.currentTool === 'pencil') {
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
  }, [drawingState.isDrawing, drawingState.currentTool, drawingState.currentColor, drawingState.currentThickness, drawingState.currentShape]);

  const finishDrawing = useCallback(() => {
    if (!drawingState.isDrawing) return;

    let newDrawingData = drawingData;
    if (drawingState.currentTool === 'pencil' && drawingState.currentLine.length > 0) {
      newDrawingData = [...drawingData, drawingState.currentLine];
      setDrawingData(newDrawingData);
    } else if (drawingState.currentShape) {
      newDrawingData = [...drawingData, drawingState.currentShape];
      setDrawingData(newDrawingData);
    }

    // Save to history after drawing completion
    if (newDrawingData !== drawingData) {
      const historyResult = saveToHistory(drawingState.drawingHistory, newDrawingData, drawingState.historyIndex);
      setDrawingState(prev => ({
        ...prev,
        isDrawing: false,
        currentLine: [],
        currentShape: null,
        drawingHistory: historyResult.history,
        historyIndex: historyResult.index
      }));
    } else {
      setDrawingState(prev => ({
        ...prev,
        isDrawing: false,
        currentLine: [],
        currentShape: null
      }));
    }
  }, [drawingState.isDrawing, drawingState.currentTool, drawingState.currentLine, drawingState.currentShape, drawingData, drawingState.drawingHistory, drawingState.historyIndex]);

  // NEW: Thickness-eraser linkage functions
  const linkThicknessToEraser = useCallback((thickness) => {
    return Math.round(thickness * THICKNESS_CONFIG.ERASER_TO_THICKNESS_RATIO);
  }, []);

  const linkEraserToThickness = useCallback((eraserSize) => {
    return Math.round(eraserSize * THICKNESS_CONFIG.THICKNESS_TO_ERASER_RATIO);
  }, []);

  // NEW: Thickness change handler with eraser linkage
  const handleThicknessChange = useCallback((thickness) => {
    setDrawingState(prev => ({
      ...prev,
      currentThickness: thickness,
      // Auto-update eraser size when thickness changes
      eraserSize: linkThicknessToEraser(thickness)
    }));
  }, [linkThicknessToEraser]);

  // NEW: Eraser size change handler with thickness linkage
  const handleEraserSizeChange = useCallback((eraserSize) => {
    setDrawingState(prev => ({
      ...prev,
      eraserSize: eraserSize,
      // Auto-update thickness when eraser size changes
      currentThickness: linkEraserToThickness(eraserSize)
    }));
  }, [linkEraserToThickness]);

  // NEW: History management functions
  const saveToHistoryState = useCallback((newDrawingData) => {
    const historyResult = saveToHistory(drawingState.drawingHistory, newDrawingData, drawingState.historyIndex);
    setDrawingState(prev => ({
      ...prev,
      drawingHistory: historyResult.history,
      historyIndex: historyResult.index
    }));
  }, [drawingState.drawingHistory, drawingState.historyIndex]);

  const undo = useCallback(() => {
    if (canUndo(drawingState.historyIndex)) {
      const newIndex = drawingState.historyIndex - 1;
      const newData = getHistoryData(drawingState.drawingHistory, newIndex);
      setDrawingData([...newData]);
      setDrawingState(prev => ({ ...prev, historyIndex: newIndex }));
    }
  }, [drawingState.historyIndex, drawingState.drawingHistory]);

  const redo = useCallback(() => {
    if (canRedo(drawingState.historyIndex, drawingState.drawingHistory.length)) {
      const newIndex = drawingState.historyIndex + 1;
      const newData = getHistoryData(drawingState.drawingHistory, newIndex);
      setDrawingData([...newData]);
      setDrawingState(prev => ({ ...prev, historyIndex: newIndex }));
    }
  }, [drawingState.historyIndex, drawingState.drawingHistory]);

  const clearHistoryState = useCallback(() => {
    const result = clearHistory();
    setDrawingState(prev => ({
      ...prev,
      drawingHistory: result.history,
      historyIndex: result.index
    }));
  }, []);

  // NEW: Computed properties for history state
  const canUndoState = canUndo(drawingState.historyIndex);
  const canRedoState = canRedo(drawingState.historyIndex, drawingState.drawingHistory.length);

  return {
    drawingState,
    setDrawingState,
    drawingData,
    setDrawingData,
    textBoxes,
    setTextBoxes,
    updateDrawingState,
    resetDrawingState,
    startDrawing,
    continueDrawing,
    finishDrawing,
    // NEW: Eraser and history functions
    handleThicknessChange,
    handleEraserSizeChange,
    saveToHistoryState,
    undo,
    redo,
    clearHistoryState,
    canUndoState,
    canRedoState,
  };
};
