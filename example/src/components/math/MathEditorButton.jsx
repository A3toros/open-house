import React, { useState, useRef, useEffect } from 'react';
import MathVisualEditor from './MathVisualEditor';
import { renderMathInText, renderMathExpression, autoWrapMath } from '../../utils/mathRenderer';

/**
 * MathEditorButton - Small button that opens the math visual editor
 * 
 * Features:
 * - Captures cursor position from input field before opening editor
 * - Opens MathVisualEditor modal
 * - Inserts math formula at cursor position without deleting existing text
 * - Preview button (for teachers) to see full text field with math rendered
 */
const MathEditorButton = ({
  inputRef, // Reference to the input/textarea element
  onChange, // Optional onChange handler for controlled components
  position = 'right', // 'left' or 'right'
  size = 'small', // 'small' or 'medium'
  showPreview = false, // Show preview button (for teachers)
  className = ''
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [storedInputRef, setStoredInputRef] = useState(null);
  const [previewValue, setPreviewValue] = useState('');

  // Handle button click
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Get the actual input element - handle both ref objects and functions
    let inputElement = null;
    if (typeof inputRef === 'function') {
      inputElement = inputRef();
    } else {
      inputElement = inputRef?.current || inputRef;
    }
    
    if (!inputElement) {
      console.warn('MathEditorButton: No input reference provided');
      return;
    }

    // Ensure input is focused to capture cursor position accurately
    inputElement.focus();
    
    // Capture cursor position - use selectionStart if available, otherwise use selectionEnd, otherwise use length
    const cursorPos = inputElement.selectionStart !== null && inputElement.selectionStart !== undefined
      ? inputElement.selectionStart
      : (inputElement.selectionEnd !== null && inputElement.selectionEnd !== undefined
          ? inputElement.selectionEnd
          : (inputElement.value?.length || 0));
    
    console.log('📌 Captured cursor position:', cursorPos, 'from input value length:', inputElement.value?.length);
    setCursorPosition(cursorPos);
    setStoredInputRef(inputElement);
    setShowEditor(true);
  };

  // Handle insert from editor
  const handleInsert = (mathFormula) => {
    let inputElement = storedInputRef;
    if (!inputElement) {
      if (typeof inputRef === 'function') {
        inputElement = inputRef();
      } else {
        inputElement = inputRef?.current || inputRef;
      }
    }
    
    if (!inputElement) {
      console.warn('MathEditorButton: No input reference available for insert');
      setShowEditor(false);
      return;
    }

    // Use the stored cursor position (captured when button was clicked)
    // This is more reliable than selectionStart after modal closes
    const currentValue = inputElement.value || '';
    
    // Ensure cursorPosition is within bounds
    const safeCursorPos = Math.max(0, Math.min(cursorPosition, currentValue.length));
    
    console.log('📝 Inserting formula at position:', safeCursorPos, 'Value length:', currentValue.length, 'Formula:', mathFormula);
    
    const beforeCursor = currentValue.substring(0, safeCursorPos);
    const afterCursor = currentValue.substring(safeCursorPos);
    
    // Formulas from editor are already wrapped in $ delimiters, just insert as-is
    // Insert formula at cursor position WITHOUT deleting existing text
    const newValue = beforeCursor + mathFormula + afterCursor;
    
    console.log('📝 New value:', newValue.substring(0, safeCursorPos) + '[' + mathFormula + ']' + newValue.substring(safeCursorPos + mathFormula.length));
    
    // Update input field
    inputElement.value = newValue;
    
    // Trigger onChange for controlled components
    if (onChange) {
      onChange({
        target: {
          value: newValue,
          name: inputElement.name
        }
      });
    }
    
    // Trigger native input event
    const event = new Event('input', { bubbles: true });
    inputElement.dispatchEvent(event);
    
    // Also trigger React onChange if it's a controlled component
    if (inputElement._valueTracker) {
      const tracker = inputElement._valueTracker;
      tracker.setValue('');
      inputElement.value = newValue;
      tracker.setValue(newValue);
    }
    
    // Move cursor after inserted formula
    const newCursorPos = safeCursorPos + mathFormula.length;
    setTimeout(() => {
      inputElement.focus();
      inputElement.setSelectionRange(newCursorPos, newCursorPos);
      console.log('✅ Cursor moved to position:', newCursorPos);
    }, 0);
    
    setShowEditor(false);
  };

  // Debug: Log to see if component is rendering
  useEffect(() => {
    console.log('✅ MathEditorButton rendered', { 
      hasInputRef: !!inputRef, 
      inputRefType: typeof inputRef,
      position, 
      size 
    });
  }, [inputRef, position, size]);

  // Handle preview button click
  const handlePreviewClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Get current value when opening preview
    let inputElement = null;
    if (typeof inputRef === 'function') {
      inputElement = inputRef();
    } else {
      inputElement = inputRef?.current || inputRef;
    }
    setPreviewValue(inputElement?.value || '');
    setShowPreviewModal(true);
  };

  // Update preview value when modal is open (for live updates)
  useEffect(() => {
    if (showPreviewModal) {
      const interval = setInterval(() => {
        let inputElement = null;
        if (typeof inputRef === 'function') {
          inputElement = inputRef();
        } else {
          inputElement = inputRef?.current || inputRef;
        }
        if (inputElement) {
          setPreviewValue(inputElement.value || '');
        }
      }, 300); // Update every 300ms

      return () => clearInterval(interval);
    }
  }, [showPreviewModal, inputRef]);

  return (
    <>
      {/* Preview Button (for teachers) - positioned to the left of fx */}
      {showPreview && (
        <button
          type="button"
          onClick={handlePreviewClick}
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            right: position === 'right' ? '48px' : 'auto', // To the left of fx button
            left: position === 'left' ? '48px' : 'auto',
            width: size === 'small' ? '32px' : '40px',
            height: size === 'small' ? '32px' : '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#10b981',
            color: 'white',
            border: '2px solid #059669',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            minWidth: '32px',
            minHeight: '32px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#059669';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#10b981';
          }}
          title="Preview Math (p)"
          aria-label="Preview math rendering"
        >
          <span style={{ fontSize: '11px', fontWeight: 'bold' }}>p</span>
        </button>
      )}

      {/* Math Editor Button (fx) */}
      <button
        type="button"
        onClick={handleClick}
        style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          right: position === 'right' ? '8px' : 'auto',
          left: position === 'left' ? '8px' : 'auto',
          width: size === 'small' ? '32px' : '40px',
          height: size === 'small' ? '32px' : '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: '2px solid #2563eb',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          minWidth: '32px',
          minHeight: '32px'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#2563eb';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#3b82f6';
        }}
        title="Math Editor (fx)"
        aria-label="Open math editor"
      >
        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>fx</span>
      </button>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPreviewModal(false);
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Math Preview"
        >
          <div
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-3xl mx-auto max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Math Preview
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-gray-600 font-mono">
                LaTeX: {previewValue || '(empty)'}
              </div>
              <div 
                className="p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[200px] text-lg"
                dangerouslySetInnerHTML={{
                  __html: previewValue ? (previewValue.includes('$') 
                    ? renderMathInText(previewValue, false)
                    : renderMathInText(autoWrapMath(previewValue), false)) 
                    : '<span class="text-gray-400">No content to preview</span>'
                }}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <MathVisualEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleInsert}
        initialValue=""
        cursorPosition={cursorPosition}
        inputRef={storedInputRef || inputRef?.current || inputRef}
      />
    </>
  );
};

export default MathEditorButton;
