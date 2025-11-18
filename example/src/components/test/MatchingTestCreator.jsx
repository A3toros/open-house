import React, { useReducer, useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { Stage, Layer, Rect, Arrow, Image as KonvaImage, Text as KonvaText, Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { motion } from 'framer-motion';

// ✅ REUSE EXISTING COMPONENTS
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import PerfectModal from '../ui/PerfectModal';
import { Notification, useNotification } from '../ui/Notification';

// ✅ REUSE EXISTING HOOKS
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

// ✅ REUSE EXISTING UTILITIES
import { validateForm, formatFormData, resetForm } from '../../utils/formHelpers';
import { validateInput } from '../../utils/validation';

// ✅ NEW CUSTOM HOOKS
import { useKonvaCanvas } from '../../hooks/useKonvaCanvas';
import { useResponsiveContainer } from '../../hooks/useResponsiveContainer';
import { useCoordinateConversion } from '../../hooks/useCoordinateConversion';

// ✅ NEW UTILITIES
import { blockUtils } from '../../utils/blockUtils';
import { arrowUtils } from '../../utils/arrowUtils';
import { wordUtils } from '../../utils/wordUtils';
import { coordinateUtils } from '../../utils/coordinateUtils';
import { validateImageFile, compressImage, fileToDataUrl, getMobileOptimizedSettings } from '../../utils/imageUtils';

// CLEAN STATE MANAGEMENT - NO MORE 15+ useState HOOKS
const initialState = {
  // Test data
  testData: {
    blocks: [],
    words: [],
    arrows: [],
    imageUrl: null
  },
  
  // Canvas state
  canvas: {
    size: { width: 800, height: 600 },
    image: null,
    imageInfo: null,
    selectedTool: 'edit'
  },
  
  // Creation state
  creation: {
    isCreatingBlock: false,
    isDrawingArrow: false,
    blockCreationStart: null,
    arrowStart: null,
    previewBlock: null,
    previewArrow: null
  },
  
  // UI state
  ui: {
    selectedBlock: null,
    showWordPanel: false,
    isLoading: false,
    error: null,
    showImageSizeModal: false,
    imageSizeError: null
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_CANVAS_SIZE':
      return { ...state, canvas: { ...state.canvas, size: action.payload } };
    case 'SET_IMAGE':
      return { ...state, canvas: { ...state.canvas, image: action.payload } };
    case 'SET_IMAGE_INFO':
      return { ...state, canvas: { ...state.canvas, imageInfo: action.payload } };
    case 'SET_SELECTED_TOOL':
      return { ...state, canvas: { ...state.canvas, selectedTool: action.payload } };
    case 'ADD_BLOCK':
      return { ...state, testData: { ...state.testData, blocks: [...state.testData.blocks, action.payload] } };
    case 'ADD_WORD':
      return { ...state, testData: { ...state.testData, words: [...state.testData.words, action.payload] } };
    case 'ADD_ARROW':
      return { ...state, testData: { ...state.testData, arrows: [...state.testData.arrows, action.payload] } };
    case 'UPDATE_BLOCK':
      return {
        ...state,
        testData: {
          ...state.testData,
          blocks: state.testData.blocks.map(block =>
            block.id === action.payload.id ? { ...block, ...action.payload.updates } : block
          )
        }
      };
    case 'DELETE_BLOCK':
      return {
        ...state,
        testData: {
          ...state.testData,
          blocks: state.testData.blocks.filter(block => block.id !== action.payload),
          words: state.testData.words.filter(word => word.blockId !== action.payload),
          arrows: state.testData.arrows.filter(arrow => 
            arrow.startBlock !== action.payload && arrow.endBlock !== action.payload
          )
        }
      };
    case 'UPDATE_WORDS':
      return { ...state, testData: { ...state.testData, words: action.payload } };
    case 'SET_CREATION_STATE':
      return { ...state, creation: { ...state.creation, ...action.payload } };
    case 'SET_UI_STATE':
      return { ...state, ui: { ...state.ui, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, ui: { ...state.ui, isLoading: action.payload } };
    case 'SET_ERROR':
      return { ...state, ui: { ...state.ui, error: action.payload } };
    case 'SHOW_IMAGE_SIZE_MODAL':
      return { ...state, ui: { ...state.ui, showImageSizeModal: true, imageSizeError: action.payload } };
    case 'HIDE_IMAGE_SIZE_MODAL':
      return { ...state, ui: { ...state.ui, showImageSizeModal: false, imageSizeError: null } };
    case 'RESET_TESTDATA':
      return {
        ...state,
        testData: { blocks: [], words: [], arrows: [], imageUrl: state.testData.imageUrl }
      };
    default:
      return state;
  }
};

// CLEAN MAIN COMPONENT - NO DEBUG LOGGING, PROPER SEPARATION
const MatchingTestCreator = ({
  testName = '',
  showQuestionCount = true,
  onTestSaved,
  onCancel,
  onBackToCabinet,
  isSaving = false,
  validationErrors = {}
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { showNotification } = useNotification();
  const { makeAuthenticatedRequest } = useApi();
  const { user } = useAuth();
  
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const transformerRef = useRef(null);
  const rectRefs = useRef({});
  const groupRefs = useRef({});
  
  // Custom hooks
  const { canvasSize, stageRef, updateCanvasSize } = useKonvaCanvas(containerRef);
  const { containerSize, responsiveSettings } = useResponsiveContainer(containerRef);
  // Use direct container height like student component
  const [imageInfo, setImageInfo] = useState(null);
  const baseStageHeight = responsiveSettings?.stageHeight ?? 600;
  const expandedStageHeight = useMemo(() => baseStageHeight + 150, [baseStageHeight]);
  const containerPadding = responsiveSettings?.padding ?? 20;
  
  // Image scaling logic (same as student)
  useEffect(() => {
    if (!state.canvas.image || !containerRef.current) return;
    
    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;
    
    const scaleX = containerWidth / state.canvas.image.width;
    const scaleY = containerHeight / state.canvas.image.height;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
    
    const scaledWidth = state.canvas.image.width * scale;
    const scaledHeight = state.canvas.image.height * scale;
    
    const x = (containerWidth - scaledWidth) / 2;
    const y = (containerHeight - scaledHeight) / 2;
    
    setImageInfo({
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
      scaleX: scale,
      scaleY: scale,
      scale: scale,
      image: state.canvas.image
    });
  }, [state.canvas.image, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);
  const { convertToOriginal, convertToCanvas } = useCoordinateConversion(imageInfo);
  
  // Update canvas size in state
  useEffect(() => {
    dispatch({ type: 'SET_CANVAS_SIZE', payload: canvasSize });
  }, [canvasSize]);
  
  // Update image info in state
  useEffect(() => {
    if (imageInfo) {
      dispatch({ type: 'SET_IMAGE_INFO', payload: imageInfo });
    }
  }, [imageInfo]);

  // Attach Transformer to the currently selected block's Rect
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const selected = state.ui.selectedBlock?.id ? rectRefs.current[state.ui.selectedBlock.id] : null;
    if (selected) {
      tr.nodes([selected]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [state.ui.selectedBlock]);

  // Reset canvas data
  const handleReset = useCallback(() => {
    dispatch({ type: 'SET_UI_STATE', payload: { selectedBlock: null } });
    dispatch({ type: 'SET_CREATION_STATE', payload: { isCreatingBlock: false, isDrawingArrow: false, blockCreationStart: null, arrowStart: null, previewBlock: null, previewArrow: null } });
    dispatch({ type: 'RESET_TESTDATA' });
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);
  
  // Event handlers
  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) {
      showNotification('Please select a file', 'error');
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Validate file
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        // Show modal with detailed error feedback
        dispatch({ 
          type: 'SHOW_IMAGE_SIZE_MODAL', 
          payload: {
            errors: validation.errors,
            fileSize: (file.size / 1024).toFixed(1),
            dimensions: validation.dimensions
          }
        });
        return;
      }
      
      // Compress if needed
      let processedFile = file;
      if (file.size > 500 * 1024) { // 500KB
        showNotification('Image is large, compressing to meet size requirements...', 'info');
        try {
          processedFile = await compressImage(file, 500);
          const originalSize = (file.size / 1024).toFixed(1);
          const compressedSize = (processedFile.size / 1024).toFixed(1);
          showNotification(`Image compressed from ${originalSize}KB to ${compressedSize}KB`, 'success');
        } catch (compressionError) {
          showNotification('Failed to compress image. Please try a smaller image.', 'error');
          return;
        }
      }
      
      // Convert to data URL
      const imageUrl = await fileToDataUrl(processedFile);
      const imageObj = new Image();
      imageObj.crossOrigin = 'anonymous';
      imageObj.onload = () => {
        dispatch({ type: 'SET_IMAGE', payload: imageObj });
        dispatch({ 
          type: 'SET_UI_STATE', 
          payload: { imageUrl } 
        });
        showNotification('Image uploaded successfully!', 'success');
      };
      imageObj.onerror = () => {
        showNotification('Failed to load image', 'error');
      };
      imageObj.src = imageUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      showNotification('Error processing image', 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [showNotification]);
  
  const handleCanvasMouseDown = useCallback((e) => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = stage.getPointerPosition();
    if (!pos) return;
    
    if (state.canvas.selectedTool === 'create') {
      // If clicking on an existing block, just select it
      const clickedBlock = blockUtils.findAtPosition(state.testData.blocks, pos.x, pos.y);
      if (clickedBlock) {
        dispatch({ type: 'SET_UI_STATE', payload: { selectedBlock: clickedBlock } });
        return;
      }
      // Start block creation anywhere on the canvas
      dispatch({ 
        type: 'SET_CREATION_STATE', 
        payload: { 
          isCreatingBlock: true, 
          blockCreationStart: { x: pos.x, y: pos.y } 
        } 
      });
    } else if (state.canvas.selectedTool === 'edit') {
      // Edit mode: select/deselect blocks like example
      const clickedBlock = blockUtils.findAtPosition(state.testData.blocks, pos.x, pos.y);
      if (clickedBlock) {
        dispatch({ type: 'SET_UI_STATE', payload: { selectedBlock: clickedBlock } });
      } else {
        dispatch({ type: 'SET_UI_STATE', payload: { selectedBlock: null } });
      }
    } else if (state.canvas.selectedTool === 'arrow') {
      // Start arrow drawing only when clicking on empty area (not on a block)
      const clickedOnEmpty = e.target === stage;
      const clickedBlock = blockUtils.findAtPosition(state.testData.blocks, pos.x, pos.y);
      if (clickedOnEmpty || !clickedBlock) {
        dispatch({ 
          type: 'SET_CREATION_STATE', 
          payload: { 
            isDrawingArrow: true, 
            arrowStart: { x: pos.x, y: pos.y } 
          } 
        });
      }
    }
  }, [state.canvas.selectedTool, imageInfo, state.testData.blocks]);
  
  const handleCanvasMouseMove = useCallback((e) => {
    if (state.creation.isCreatingBlock && state.creation.blockCreationStart) {
      const stage = stageRef.current;
      if (!stage) return;
      
      const pos = stage.getPointerPosition();
      if (!pos) return;
      
      const width = Math.abs(pos.x - state.creation.blockCreationStart.x);
      const height = Math.abs(pos.y - state.creation.blockCreationStart.y);
      const minSize = 10;
      const finalWidth = Math.max(width, minSize);
      const finalHeight = Math.max(height, minSize);
      
      dispatch({
        type: 'SET_CREATION_STATE',
        payload: {
          previewBlock: {
            x: Math.min(pos.x, state.creation.blockCreationStart.x),
            y: Math.min(pos.y, state.creation.blockCreationStart.y),
            width: finalWidth,
            height: finalHeight,
            fill: 'rgba(0, 123, 255, 0.3)',
            stroke: '#007bff',
            strokeWidth: 2,
            dash: [5, 5],
            opacity: 0.7
          }
        }
      });
    } else if (state.creation.isDrawingArrow && state.creation.arrowStart) {
      const stage = stageRef.current;
      if (!stage) return;
      
      const pos = stage.getPointerPosition();
      if (!pos) return;
      
      dispatch({
        type: 'SET_CREATION_STATE',
        payload: {
          previewArrow: {
            startX: state.creation.arrowStart.x,
            startY: state.creation.arrowStart.y,
            endX: pos.x,
            endY: pos.y,
            stroke: '#dc3545',
            fill: '#dc3545',
            strokeWidth: 3,
            dash: [5, 5],
            opacity: 0.7
          }
        }
      });
    }
  }, [state.creation]);
  
  const handleCanvasMouseUp = useCallback((e) => {
    if (state.creation.isCreatingBlock && state.creation.blockCreationStart) {
      const stage = stageRef.current;
      if (!stage) return;
      
      const pos = stage.getPointerPosition();
      if (!pos) return;
      
      const width = Math.abs(pos.x - state.creation.blockCreationStart.x);
      const height = Math.abs(pos.y - state.creation.blockCreationStart.y);
      const minSize = 10;
      const finalWidth = Math.max(width, minSize);
      const finalHeight = Math.max(height, minSize);
      const finalX = Math.min(pos.x, state.creation.blockCreationStart.x) + finalWidth / 2;
      const finalY = Math.min(pos.y, state.creation.blockCreationStart.y) + finalHeight / 2;
      
      const blockId = blockUtils.generateId();
      const newBlock = blockUtils.create(finalX, finalY, finalWidth, finalHeight, blockId);
      const newWord = wordUtils.create(blockId, `Word ${state.testData.blocks.length + 1}`, wordUtils.generateId(blockId));
      
      dispatch({ type: 'ADD_BLOCK', payload: newBlock });
      dispatch({ type: 'ADD_WORD', payload: newWord });
      dispatch({ 
        type: 'SET_CREATION_STATE', 
        payload: { 
          isCreatingBlock: false, 
          blockCreationStart: null, 
          previewBlock: null 
        } 
      });
      
      if (state.testData.blocks.length === 0) {
        dispatch({ type: 'SET_UI_STATE', payload: { showWordPanel: true } });
      }
    } else if (state.creation.isDrawingArrow && state.creation.arrowStart) {
      const stage = stageRef.current;
      if (!stage) return;
      
      const pos = stage.getPointerPosition();
      if (!pos) return;
      
      // Validate arrow placement
      if (arrowUtils.validate(state.creation.arrowStart.x, state.creation.arrowStart.y, pos.x, pos.y, state.testData.blocks)) {
        const snappedStart = arrowUtils.snapToNearestBlock(state.creation.arrowStart.x, state.creation.arrowStart.y, state.testData.blocks);
        const snappedEnd = arrowUtils.snapToNearestBlock(pos.x, pos.y, state.testData.blocks);
        
        const finalStartX = snappedStart ? snappedStart.x : state.creation.arrowStart.x;
        const finalStartY = snappedStart ? snappedStart.y : state.creation.arrowStart.y;
        const finalEndX = snappedEnd ? snappedEnd.x : pos.x;
        const finalEndY = snappedEnd ? snappedEnd.y : pos.y;
        
        const arrowId = arrowUtils.generateId();
        const mobileSettings = getMobileOptimizedSettings();
        
        const newArrow = arrowUtils.create(
          finalStartX, finalStartY, finalEndX, finalEndY,
          snappedStart ? snappedStart.blockId : null,
          snappedEnd ? snappedEnd.blockId : null,
          arrowId,
          {
            strokeWidth: mobileSettings.arrowThickness,
            isMobile: mobileSettings.isMobile
          }
        );
        
        dispatch({ type: 'ADD_ARROW', payload: newArrow });
        showNotification('Arrow created successfully!', 'success');
      } else {
        showNotification('Arrow must start near a block!', 'error');
      }
      
      dispatch({ 
        type: 'SET_CREATION_STATE', 
        payload: { 
          isDrawingArrow: false, 
          arrowStart: null, 
          previewArrow: null 
        } 
      });
    }
  }, [state.creation, state.testData.blocks, showNotification]);
  
  // Touch handlers that prevent default and call mouse handlers
  const handleCanvasTouchStart = useCallback((e) => {
    e.evt.preventDefault();
    handleCanvasMouseDown(e);
  }, [handleCanvasMouseDown]);
  
  const handleCanvasTouchMove = useCallback((e) => {
    e.evt.preventDefault();
    handleCanvasMouseMove(e);
  }, [handleCanvasMouseMove]);
  
  const handleCanvasTouchEnd = useCallback((e) => {
    e.evt.preventDefault();
    handleCanvasMouseUp(e);
  }, [handleCanvasMouseUp]);
  
  const handleSaveTest = useCallback(async () => {
    console.log('🟢 [MatchingTestCreator] handleSaveTest clicked');
    const errors = validateTestData();
    if (Object.keys(errors).length > 0) {
      console.warn('⚠️ [MatchingTestCreator] Validation errors:', errors);
      showNotification('Please fix validation errors before saving', 'error');
      return;
    }
    
    try {
      console.log('🟢 [MatchingTestCreator] Preparing data to save...', {
        blocks: state.testData.blocks.length,
        words: state.testData.words.length,
        arrows: state.testData.arrows.length,
        imageUrl: state.ui.imageUrl ? 'present' : 'missing'
      });
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Upload image to Cloudinary
      let cloudinaryUrl = state.ui.imageUrl;
      if (state.ui.imageUrl && state.ui.imageUrl.startsWith('data:')) {
        const response = await makeAuthenticatedRequest('/.netlify/functions/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: state.ui.imageUrl,
            folder: 'matching_tests'
          })
        });
        
        const result = await response.json();
        if (response.ok && result.success && result.url) {
          cloudinaryUrl = result.url;
        } else {
          throw new Error(result.message || 'Upload failed');
        }
      }
      
      // Process blocks with proper coordinate conversion
      const processedQuestions = state.testData.blocks.map((block, index) => {
        let blockCoords;
        if (imageInfo) {
          const blockTopLeft = convertToOriginal(block.x, block.y);
          const blockBottomRight = convertToOriginal(block.x + block.width, block.y + block.height);
          blockCoords = {
            x: blockTopLeft.x,
            y: blockTopLeft.y,
            width: Number((blockBottomRight.x - blockTopLeft.x).toFixed(4)),
            height: Number((blockBottomRight.y - blockTopLeft.y).toFixed(4))
          };
        } else {
          blockCoords = {
            x: Number(block.x.toFixed(4)),
            y: Number(block.y.toFixed(4)),
            width: Number(block.width.toFixed(4)),
            height: Number(block.height.toFixed(4))
          };
        }
        
        const word = state.testData.words.find(w => w.blockId === block.id);
        const arrow = state.testData.arrows.find(a => a.startBlock === block.id);
        
        return {
          question_id: index + 1,
          word: word?.word || `Word ${index + 1}`,
          block_coordinates: blockCoords,
          has_arrow: !!arrow,
          arrow: arrow && imageInfo ? (() => {
            // Convert canvas px → original px
            const startOriginal = convertToOriginal(arrow.startX, arrow.startY);
            const endOriginal = convertToOriginal(arrow.endX, arrow.endY);
            // Compute relative percentages of original
            const relStartX = (startOriginal.x / imageInfo.originalWidth) * 100;
            const relStartY = (startOriginal.y / imageInfo.originalHeight) * 100;
            const relEndX = (endOriginal.x / imageInfo.originalWidth) * 100;
            const relEndY = (endOriginal.y / imageInfo.originalHeight) * 100;
            return {
              // absolute for fallback
              start_x: Number(startOriginal.x.toFixed(4)),
              start_y: Number(startOriginal.y.toFixed(4)),
              end_x: Number(endOriginal.x.toFixed(4)),
              end_y: Number(endOriginal.y.toFixed(4)),
              // relative for proper scaling on student side
              rel_start_x: Number(relStartX.toFixed(4)),
              rel_start_y: Number(relStartY.toFixed(4)),
              rel_end_x: Number(relEndX.toFixed(4)),
              rel_end_y: Number(relEndY.toFixed(4)),
              image_width: imageInfo.originalWidth,
              image_height: imageInfo.originalHeight,
              style: arrow.style || { color: '#dc3545', thickness: 3 }
            };
          })() : null
        };
      });
      
      // Just pass the data to parent - don't save here
      if (onTestSaved) {
        console.log('🟢 [MatchingTestCreator] Calling onTestSaved with processed data');
        onTestSaved({
          success: true,
          message: 'Test data prepared for assignment',
          // Include the test data structure for TeacherTests
          blocks: state.testData.blocks,
          words: state.testData.words,
          arrows: state.testData.arrows,
          imageUrl: cloudinaryUrl, // Use the Cloudinary URL instead of original
          // Include processed questions for the assignment step
          processedQuestions: processedQuestions
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      showNotification(`Error saving test: ${error.message}`, 'error');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.testData, state.ui.imageUrl, imageInfo, convertToOriginal, makeAuthenticatedRequest, onTestSaved, showNotification, testName, user]);
  
  const validateTestData = useCallback(() => {
    const errors = {};
    
    if (!testName.trim()) {
      errors.testName = 'Test name is required';
    }
    
    if (state.testData.blocks.length === 0) {
      errors.blocks = 'At least one block is required';
    }
    
    return errors;
  }, [testName, state.testData.blocks.length]);
  
  // Render functions
  const renderCreationToolbar = () => (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 border-b">
      <Button
        onClick={() => dispatch({ type: 'SET_SELECTED_TOOL', payload: 'create' })}
        variant={state.canvas.selectedTool === 'create' ? 'primary' : 'secondary'}
        size="sm"
      >
        📦 Create Blocks
      </Button>
      <Button
        onClick={() => dispatch({ type: 'SET_SELECTED_TOOL', payload: 'edit' })}
        variant={state.canvas.selectedTool === 'edit' ? 'primary' : 'secondary'}
        size="sm"
      >
        🛠️ Edit Blocks
      </Button>
      <Button
        onClick={() => dispatch({ type: 'SET_SELECTED_TOOL', payload: 'arrow' })}
        variant={state.canvas.selectedTool === 'arrow' ? 'primary' : 'secondary'}
        size="sm"
      >
        🏹 Draw Arrows
      </Button>
      <Button
        onClick={handleReset}
        variant="secondary"
        size="sm"
      >
        ♻️ Reset
      </Button>
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="secondary"
        size="sm"
      >
        🖼️ Upload Image
      </Button>
      <div className="text-xs text-gray-500 text-center col-span-full">
        Max size: 500KB • Max dimensions: 4000x4000px
      </div>
    </div>
  );
  
  const renderCanvas = () => (
    <Stage
      width={containerSize.width}
      height={expandedStageHeight}
      ref={stageRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onTouchStart={handleCanvasTouchStart}
      onTouchMove={handleCanvasTouchMove}
      onTouchEnd={handleCanvasTouchEnd}
      className={state.canvas.selectedTool === 'arrow' || state.canvas.selectedTool === 'create' ? 'cursor-crosshair' : 'cursor-default'}
    >
      <Layer>
        {/* Background Image */}
        {state.canvas.image && imageInfo && (
          <KonvaImage
            image={state.canvas.image}
            x={imageInfo.x}
            y={imageInfo.y}
            width={imageInfo.width}
            height={imageInfo.height}
          />
        )}
        
        {/* Blocks - draggable & resizable */}
        {state.testData.blocks.map(block => (
          <Group
            key={block.id}
            ref={(node) => { if (node) groupRefs.current[block.id] = node; }}
            draggable={state.canvas.selectedTool === 'edit'}
            x={block.x}
            y={block.y}
            onMouseEnter={(e) => {
              const container = e.target.getStage()?.container();
              if (!container) return;
              container.style.cursor = state.ui.selectedBlock?.id === block.id ? 'nwse-resize' : 'move';
            }}
            onMouseLeave={(e) => {
              const container = e.target.getStage()?.container();
              if (!container) return;
              container.style.cursor = state.canvas.selectedTool === 'arrow' ? 'crosshair' : 'default';
            }}
            onDragStart={() => {
              dispatch({ type: 'SET_UI_STATE', payload: { selectedBlock: block } });
            }}
            onDragEnd={(e) => {
              const { x, y } = e.target.position();
              dispatch({ type: 'UPDATE_BLOCK', payload: { id: block.id, updates: { x, y } } });
            }}
            onClick={() => {
              dispatch({ type: 'SET_UI_STATE', payload: { selectedBlock: block } });
            }}
            onTap={() => {
              dispatch({ type: 'SET_UI_STATE', payload: { selectedBlock: block } });
            }}
          >
            <Rect
              ref={(node) => { if (node) rectRefs.current[block.id] = node; }}
              width={block.width}
              height={block.height}
              fill={block.fill}
              stroke={block.stroke}
              strokeWidth={block.strokeWidth}
              cornerRadius={block.cornerRadius}
              shadowColor={block.shadowColor}
              shadowBlur={block.shadowBlur}
              shadowOffset={block.shadowOffset}
              shadowOpacity={block.shadowOpacity}
              draggable={state.canvas.selectedTool === 'edit'}
              onDragEnd={(e) => {
                const { x, y } = e.target.getParent().position();
                dispatch({ type: 'UPDATE_BLOCK', payload: { id: block.id, updates: { x, y } } });
              }}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container();
                if (!container) return;
                container.style.cursor = state.ui.selectedBlock?.id === block.id ? 'nwse-resize' : 'move';
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container();
                if (!container) return;
                container.style.cursor = state.canvas.selectedTool === 'arrow' ? 'crosshair' : 'default';
              }}
              onTransformEnd={(e) => {
                const rectNode = rectRefs.current[block.id];
                if (!rectNode) return;
                const newWidth = Math.max(10, rectNode.width() * rectNode.scaleX());
                const newHeight = Math.max(10, rectNode.height() * rectNode.scaleY());
                rectNode.scaleX(1);
                rectNode.scaleY(1);
                dispatch({ type: 'UPDATE_BLOCK', payload: { id: block.id, updates: { width: newWidth, height: newHeight } } });
              }}
            />
            
            {/* Block Number */}
            <KonvaText
              x={2}
              y={2}
              text={`${state.testData.blocks.indexOf(block) + 1}`}
              fontSize={Math.min(responsiveSettings.fontSize, Math.max(8, block.width / 4))}
              fontFamily="Arial"
              fill="#333"
              fontStyle="bold"
              listening={false}
            />
          </Group>
        ))}

        {/* Single Transformer attached to selected block's Rect */}
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            const minW = 10;
            const minH = 10;
            return {
              ...newBox,
              width: Math.max(newBox.width, minW),
              height: Math.max(newBox.height, minH)
            };
          }}
        />
        
        {/* Arrows */}
        {state.testData.arrows.map(arrow => (
          <Arrow
            key={arrow.id}
            points={[arrow.startX, arrow.startY, arrow.endX, arrow.endY]}
            stroke={arrow.stroke}
            fill={arrow.fill}
            strokeWidth={arrow.strokeWidth || responsiveSettings.arrowThickness}
            pointerLength={arrow.pointerLength}
            pointerWidth={arrow.pointerWidth}
          />
        ))}
        
        {/* Preview Block */}
        {state.creation.previewBlock && (
          <Rect
            x={state.creation.previewBlock.x}
            y={state.creation.previewBlock.y}
            width={state.creation.previewBlock.width}
            height={state.creation.previewBlock.height}
            fill={state.creation.previewBlock.fill}
            stroke={state.creation.previewBlock.stroke}
            strokeWidth={state.creation.previewBlock.strokeWidth}
            dash={state.creation.previewBlock.dash}
            opacity={state.creation.previewBlock.opacity}
          />
        )}
        
        {/* Preview Arrow */}
        {state.creation.previewArrow && (
          <Arrow
            points={[
              state.creation.previewArrow.startX, 
              state.creation.previewArrow.startY, 
              state.creation.previewArrow.endX, 
              state.creation.previewArrow.endY
            ]}
            stroke={state.creation.previewArrow.stroke}
            fill={state.creation.previewArrow.fill}
            strokeWidth={state.creation.previewArrow.strokeWidth}
            dash={state.creation.previewArrow.dash}
            opacity={state.creation.previewArrow.opacity}
          />
        )}
      </Layer>
    </Stage>
  );
  
  const renderWordPanel = useMemo(() => {
    if (state.testData.blocks.length === 0) {
      return null;
    }
    
    return (
      <div className="word-panel bg-gray-50 border-t border-gray-200 p-4 w-full flex-shrink-0" style={{ height: 'clamp(420px, 55vh, 640px)', overflowY: 'auto' }}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Words (Auto-created with blocks)</h3>
        <div className="space-y-2">
          {state.testData.words.map(word => {
            const linkedBlock = state.testData.blocks.find(block => block.id === word.blockId);
            return (
              <div key={word.blockId} className="p-2 bg-white rounded border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Block {state.testData.blocks.indexOf(linkedBlock) + 1}</span>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_BLOCK', payload: linkedBlock.id })}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={word.word}
                  onChange={(e) => {
                    const updatedWords = wordUtils.update(state.testData.words, word.blockId, e.target.value);
                    dispatch({ type: 'UPDATE_WORDS', payload: updatedWords });
                  }}
                  className="w-full text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter word text"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [state.testData.words, state.testData.blocks]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-screen bg-gray-100"
    >
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span><strong>Test Name:</strong> {testName || 'Untitled Test'}</span>
                <span><strong>Questions:</strong> {state.testData.blocks.length} (auto-generated from blocks)</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Toolbar */}
      {renderCreationToolbar()}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-y-auto gap-4">
        {/* Canvas Container - responsive sizing */}
        <div 
          ref={containerRef} 
          className="bg-white border overflow-hidden flex-none" 
          style={{ 
            height: `${expandedStageHeight}px`,
            minHeight: `${expandedStageHeight}px`,
            maxHeight: `${expandedStageHeight + 60}px`,
            padding: `${containerPadding}px`
          }}
        >
          {renderCanvas()}
        </div>
        
        {/* Word Panel - fixed height to ensure it's always visible */}
        {renderWordPanel}
      </div>

      {/* Save Test Button - Bottom */}
      <div className="bg-white border-t p-4">
        <div className="flex justify-center">
          <Button
            onClick={handleSaveTest}
            disabled={isSaving || state.ui.isLoading}
            variant="primary"
            size="lg"
          >
            {isSaving || state.ui.isLoading ? <LoadingSpinner size="sm" /> : 'Save Test'}
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Image Size Modal */}
      <PerfectModal
        isOpen={state.ui.showImageSizeModal}
        onClose={() => dispatch({ type: 'HIDE_IMAGE_SIZE_MODAL' })}
        title="🖼️ Image Too Large"
        size="medium"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-red-600 text-2xl mr-2">⚠️</span>
              <h4 className="text-lg font-semibold text-red-800">Image Size Issues</h4>
            </div>
            <div className="text-red-700">
              {state.ui.imageSizeError?.errors.map((error, index) => (
                <div key={index} className="mb-2">
                  • {error}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-semibold text-blue-800 mb-2">📏 Current Image Details:</h5>
            <div className="text-blue-700 space-y-1">
              <div>• File size: {state.ui.imageSizeError?.fileSize}KB</div>
              {state.ui.imageSizeError?.dimensions && (
                <div>• Dimensions: {state.ui.imageSizeError.dimensions.width} × {state.ui.imageSizeError.dimensions.height} pixels</div>
              )}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h5 className="font-semibold text-green-800 mb-2">✅ Requirements:</h5>
            <div className="text-green-700 space-y-1">
              <div>• Maximum file size: 500KB</div>
              <div>• Maximum dimensions: 4000 × 4000 pixels</div>
              <div>• Supported formats: All image formats (JPEG, PNG, WebP, etc.)</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="font-semibold text-yellow-800 mb-2">💡 How to Fix:</h5>
            <div className="text-yellow-700 space-y-1">
              <div>• Use an image editor to resize your image</div>
              <div>• Compress the image using online tools</div>
              <div>• Try a different image with smaller dimensions</div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => dispatch({ type: 'HIDE_IMAGE_SIZE_MODAL' })}
              variant="secondary"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                dispatch({ type: 'HIDE_IMAGE_SIZE_MODAL' });
                fileInputRef.current?.click();
              }}
              variant="primary"
            >
              Try Another Image
            </Button>
          </div>
        </div>
      </PerfectModal>
    </motion.div>
  );
};

export default MatchingTestCreator;
