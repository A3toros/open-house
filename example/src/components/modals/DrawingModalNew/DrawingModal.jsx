import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Stage, Layer, Line, Rect } from 'react-konva';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';

// Import custom hooks
import { useDrawingState } from './hooks/useDrawingState';
import { useTouchGestures } from './hooks/useTouchGestures';
import { useCanvasZoom } from './hooks/useCanvasZoom';
import { useDataParsing } from './hooks/useDataParsing';
import { useFullscreen } from './hooks/useFullscreen';

// Import components
import CanvasViewer from './components/CanvasViewer';
import ViewerCanvas from './components/ViewerCanvas';
import ZoomControls from './components/ZoomControls';
import QuestionNavigation from './components/QuestionNavigation';

// Import constants
import { CANVAS_CONFIG, ZOOM_CONFIG } from './utils/constants';

const DrawingModal = ({ 
  drawing, 
  isOpen, 
  onClose, 
  onScoreChange, 
  onMaxScoreChange, 
  isTeacherView = false,
  onSaveScore
}) => {
  // Custom hooks
  const { 
    drawingState, 
    setDrawingState, 
    drawingData, 
    setDrawingData,
    textBoxes,
    setTextBoxes,
    // NEW: Eraser and history functions
    handleThicknessChange,
    handleEraserSizeChange,
    saveToHistoryState,
    undo,
    redo,
    canUndoState,
    canRedoState
  } = useDrawingState();
  const { questionsData, setQuestionsData, currentQuestionIndex, setCurrentQuestionIndex } = useDataParsing(drawing);
  const { zoom, setZoom, position, setPosition, handleZoomIn, handleZoomOut } = useCanvasZoom(ZOOM_CONFIG, CANVAS_CONFIG);
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen(drawingState, setDrawingState);
  const { 
    handleTouchStart, 
    handleTouchMove, 
    handleTouchEnd,
    // NEW: Expose new handlers
    handleEraserStart,
    handleUndoTouch,
    handleRedoTouch,
    showTouchFeedback
  } = useTouchGestures(drawingState, setDrawingState, drawingData, setDrawingData, saveToHistoryState, undo, redo, canUndoState, canRedoState);

  // Refs
  const stageRef = useRef(null);
  const viewerRef = useRef(null);
  const [cameraScale, setCameraScale] = useState(1);

  // Teacher viewer now auto-fits to content; no canvas-fit on open
  const [scoreValue, setScoreValue] = useState('');
  const [maxScoreValue, setMaxScoreValue] = useState('');

  // Handle drawing data changes
  useEffect(() => {
    console.log('DrawingModal - questionsData:', questionsData);
    console.log('DrawingModal - currentQuestionIndex:', currentQuestionIndex);
    if (questionsData.length > 0) {
      // Pass the line segments directly, not the individual points
      const data = questionsData[currentQuestionIndex]?.drawingData || [];
      const textBoxData = questionsData[currentQuestionIndex]?.textBoxes || [];
      console.log('DrawingModal - setting drawingData:', data);
      console.log('DrawingModal - setting textBoxes:', textBoxData);
      setDrawingData(data);
      setTextBoxes(textBoxData);
    }
  }, [questionsData, currentQuestionIndex, setDrawingData, setTextBoxes]);

  // Initialize score inputs when modal opens or drawing changes
  useEffect(() => {
    if (isOpen && drawing) {
      setScoreValue((Number.isFinite(drawing.score) ? drawing.score : 0).toString());
      setMaxScoreValue('10');
    }
  }, [isOpen, drawing]);

  // Handle question navigation
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // Handle tool changes
  const handleToolChange = (tool) => {
    setDrawingState(prev => ({ ...prev, currentTool: tool }));
  };

  // Handle color changes
  const handleColorChange = (color) => {
    setDrawingState(prev => ({ ...prev, currentColor: color }));
  };

  // NEW: Missing handler functions to add to DrawingModal.jsx
  const handleUndo = () => {
    if (canUndoState) {
      undo();
    }
  };

  const handleRedo = () => {
    if (canRedoState) {
      redo();
    }
  };

  // NEW: Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          handleRedo();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Handle rotation
  const handleRotate = () => {
    setDrawingState(prev => ({ 
      ...prev, 
      rotation: (prev.rotation + 90) % 360 
    }));
  };

  // Handle download
  const handleDownload = () => {
    // Use camera-based viewer export when teacher view
    if (isTeacherView && viewerRef.current) {
      const dataURL = viewerRef.current.exportPNGFullCanvas();
      if (!dataURL) return;
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `drawing-${drawing?.name || 'student'}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const stage = stageRef.current;
    if (!stage) return;
    const dataURL = stage.toDataURL({
      mimeType: 'image/png',
      quality: 1,
      pixelRatio: 1,
      x: 0,
      y: 0,
      width: CANVAS_CONFIG.WIDTH,
      height: CANVAS_CONFIG.HEIGHT,
    });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `drawing-${drawing?.name || 'student'}-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle score submit (teacher view)
  const handleScoreSubmit = async () => {
    if (!isTeacherView) return onClose();
    const parsedScore = parseInt(scoreValue, 10);
    const parsedMax = 10;
    if (Number.isFinite(parsedScore)) {
      if (typeof onSaveScore === 'function') {
        await onSaveScore({ resultId: drawing.id, score: Math.max(0, Math.min(10, parsedScore)), maxScore: parsedMax });
      } else {
        if (onScoreChange) onScoreChange(drawing.id, parsedScore);
        if (onMaxScoreChange) onMaxScoreChange(drawing.id, parsedMax);
      }
    }
    onClose();
  };

  if (!isOpen || !drawing) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-lg shadow-xl max-w-4xl h-[90vh] w-full mx-4 flex flex-col select-none"
          style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Drawing Submission
              </h3>
              <p className="text-sm text-gray-600">
                {drawing.name} {drawing.surname} - {drawing.test_name}
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Question Navigation */}
          {questionsData.length > 1 && (
            <QuestionNavigation
              currentQuestion={currentQuestionIndex}
              totalQuestions={questionsData.length}
              onPrevious={handlePreviousQuestion}
              onNext={handleNextQuestion}
              drawingDataLength={questionsData[currentQuestionIndex]?.drawingData?.length || 0}
            />
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Drawing Container */}
            <div 
              className="flex-1 min-h-0 relative overflow-hidden bg-gray-100 p-0 sm:p-4 select-none"
              style={{ touchAction: 'none', WebkitTouchCallout: 'none' }}
            >
              {isTeacherView ? (
                <ViewerCanvas
                  ref={viewerRef}
                  drawingData={drawingData}
                  textBoxes={textBoxes}
                  canvasSize={{
                    width: CANVAS_CONFIG.WIDTH,
                    height: CANVAS_CONFIG.HEIGHT,
                    WIDTH: CANVAS_CONFIG.WIDTH,
                    HEIGHT: CANVAS_CONFIG.HEIGHT
                  }}
                  rotation={drawingState.rotation}
                  onScaleChange={setCameraScale}
                />
              ) : (
                <CanvasViewer
                  ref={stageRef}
                  drawingData={drawingData}
                  textBoxes={textBoxes}
                  drawingState={drawingState}
                  canvasSize={{
                    width: CANVAS_CONFIG.WIDTH,
                    height: CANVAS_CONFIG.HEIGHT,
                    WIDTH: CANVAS_CONFIG.WIDTH,
                    HEIGHT: CANVAS_CONFIG.HEIGHT
                  }}
                  zoom={zoom}
                  position={position}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  // NEW: Eraser cursor props
                  mousePosition={{ x: 0, y: 0 }}
                  isMouseOverCanvas={false}
                  isEraserDrawing={false}
                />
              )}


              {/* Zoom Controls */}
              <ZoomControls
                zoom={isTeacherView ? cameraScale : zoom}
                onZoomIn={() => {
                  if (isTeacherView && viewerRef.current) {
                    // Center-anchored zoom for reliable behavior from buttons
                    try {
                      // eslint-disable-next-line no-console
                      console.log('[ZoomButton] ZoomIn click (teacher)', { before: viewerRef.current.getScale?.() });
                    } catch {}
                    viewerRef.current.zoomIn(undefined);
                    setTimeout(() => {
                      try {
                        // eslint-disable-next-line no-console
                        console.log('[ZoomButton] ZoomIn after', { after: viewerRef.current.getScale?.() });
                      } catch {}
                    }, 0);
                  } else {
                    handleZoomIn();
                  }
                }}
                onZoomOut={() => {
                  if (isTeacherView && viewerRef.current) {
                    // Center-anchored zoom
                    try {
                      // eslint-disable-next-line no-console
                      console.log('[ZoomButton] ZoomOut click (teacher)', { before: viewerRef.current.getScale?.() });
                    } catch {}
                    viewerRef.current.zoomOut(undefined);
                    setTimeout(() => {
                      try {
                        // eslint-disable-next-line no-console
                        console.log('[ZoomButton] ZoomOut after', { after: viewerRef.current.getScale?.() });
                      } catch {}
                    }, 0);
                  } else {
                    handleZoomOut();
                  }
                }}
                onRotate={handleRotate}
                onDownload={handleDownload}
                onFullscreen={isFullscreen ? exitFullscreen : enterFullscreen}
                isFullscreen={isFullscreen}
              />

              {/* Zoom Level Indicator */}
              <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                {Math.round((isTeacherView ? cameraScale : zoom) * 100)}%
              </div>
            </div>

            {/* Scoring Section for Teacher View */}
            {isTeacherView && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Score:</label>
                    <input
                      type="number"
                      min="0"
                      max={10}
                      value={scoreValue}
                      onChange={(e) => setScoreValue(e.target.value)}
                      className="w-20 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Max:</label>
                    <input
                      type="number"
                      value={10}
                      disabled
                      className="w-20 px-3 py-1 text-sm border border-gray-300 rounded bg-gray-100"
                    />
                  </div>
                  <Button
                    onClick={handleScoreSubmit}
                    variant="primary"
                    size="sm"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DrawingModal;
