import React, { useState, useRef, useEffect } from 'react';
import { renderMathExpression } from '../../utils/mathRenderer';
import Button from '../ui/Button';

/**
 * MathVisualEditor - Visual editor for creating mathematical expressions
 * 
 * Features:
 * - Single input field with inline math preview
 * - Button toolbar for exponents, square roots, fractions
 * - Math renders inline in the same field
 * - Inserts formula at cursor position in original field without deleting existing text
 */
const MathVisualEditor = ({
  isOpen = false,
  onClose,
  onSave,
  initialValue = '',
  cursorPosition = null,
  inputRef = null
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [fractionMode, setFractionMode] = useState(null); // 'numerator' | 'denominator' | null
  const [fractionPosition, setFractionPosition] = useState(null);
  const [justInsertedExponent, setJustInsertedExponent] = useState(false); // Track if we just inserted exponent
  const editorInputRef = useRef(null);
  const previewRef = useRef(null);

  // Reset input value when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
      setFractionMode(null);
      setFractionPosition(null);
      // Focus editor input after a short delay
      setTimeout(() => {
        editorInputRef.current?.focus();
        if (inputValue) {
          editorInputRef.current?.setSelectionRange(inputValue.length, inputValue.length);
        }
      }, 100);
    }
  }, [isOpen, initialValue]);

  // Handle exponent button (x²) - inserts one symbol, editor stays open
  const handleExponent = () => {
    const { start, end } = selection;
    const beforeStart = start > 0 ? inputValue.substring(start - 1, start) : '';
    const hasBase = beforeStart && beforeStart.trim() && !beforeStart.match(/[{}()]/);
    
    let formulaToInsert = '';
    let cursorOffset = 0;
    if (hasBase) {
      // Insert ^{} after the character before cursor
      formulaToInsert = '^{}';
      cursorOffset = -1; // Place cursor inside braces
    } else {
      // Insert x^{2}
      formulaToInsert = 'x^{2}';
      cursorOffset = -3; // Place cursor before '2' inside braces
    }
    
    const newValue = 
      inputValue.substring(0, start) + 
      formulaToInsert + 
      inputValue.substring(end);
    setInputValue(newValue);
    
    // Update cursor position - stay in editor
    setTimeout(() => {
      editorInputRef.current?.focus();
      const newPos = start + formulaToInsert.length + cursorOffset;
      editorInputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Handle square root button - inserts one symbol, editor stays open
  const handleSquareRoot = () => {
    const { start, end } = selection;
    const selectedText = inputValue.substring(start, end);
    
    if (selectedText) {
      // Wrap selected text
      const newValue = 
        inputValue.substring(0, start) + 
        `\\sqrt{${selectedText}}` + 
        inputValue.substring(end);
      setInputValue(newValue);
      // Place cursor after the square root
      setTimeout(() => {
        editorInputRef.current?.focus();
        const newPos = start + selectedText.length + 8;
        editorInputRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    } else {
      // Insert empty square root
      const newValue = 
        inputValue.substring(0, start) + 
        '\\sqrt{}' + 
        inputValue.substring(end);
      setInputValue(newValue);
      // Place cursor inside braces
      setTimeout(() => {
        editorInputRef.current?.focus();
        editorInputRef.current?.setSelectionRange(start + 6, start + 6);
      }, 0);
    }
  };

  // Handle fraction button (2 modes: numerator, denominator) - editor stays open
  const handleFraction = () => {
    const { start } = selection;
    const currentValue = inputValue;
    
    if (fractionMode === 'numerator' && fractionPosition !== null) {
      // Second click: move cursor to denominator (editor stays open)
      const fracStart = fractionPosition;
      
      // Find where numerator ends
      let braceCount = 0;
      let numeratorEnd = -1;
      const searchStart = fracStart + 6; // After '\frac{'
      
      for (let i = searchStart; i < currentValue.length; i++) {
        if (currentValue[i] === '{') braceCount++;
        else if (currentValue[i] === '}') {
          if (braceCount === 0) {
            numeratorEnd = i + 1;
            break;
          }
          braceCount--;
        }
      }
      
      if (numeratorEnd > 0) {
        // Place cursor in denominator - editor stays open
        const denominatorStart = numeratorEnd + 2; // After '}{'
        setTimeout(() => {
          editorInputRef.current?.focus();
          editorInputRef.current?.setSelectionRange(denominatorStart, denominatorStart);
        }, 0);
        setFractionMode(null);
        setFractionPosition(null);
      } else {
        // Fallback: insert new fraction
        const newValue = 
          inputValue.substring(0, start) + 
          '\\frac{}{}' + 
          inputValue.substring(selection.end);
        setInputValue(newValue);
        setTimeout(() => {
          editorInputRef.current?.focus();
          editorInputRef.current?.setSelectionRange(start + 6, start + 6);
        }, 0);
        setFractionMode('numerator');
        setFractionPosition(start);
      }
    } else {
      // First click: insert fraction and place cursor in numerator (editor stays open)
      const newValue = 
        inputValue.substring(0, start) + 
        '\\frac{}{}' + 
        inputValue.substring(selection.end);
      setInputValue(newValue);
      setTimeout(() => {
        editorInputRef.current?.focus();
        editorInputRef.current?.setSelectionRange(start + 6, start + 6); // In numerator
      }, 0);
      setFractionMode('numerator');
      setFractionPosition(start);
    }
  };

  // Handle exponent power button (xⁿ) - inserts x^{} and places cursor inside
  const handleExponentPower = () => {
    const { start, end } = selection;
    const newValue = 
      inputValue.substring(0, start) + 
      'x^{}' + 
      inputValue.substring(end);
    setInputValue(newValue);
    setJustInsertedExponent(true); // Mark that we just inserted exponent
    // Place cursor inside the braces (after x^{)
    setTimeout(() => {
      editorInputRef.current?.focus();
      editorInputRef.current?.setSelectionRange(start + 3, start + 3); // Inside braces after x^{
    }, 0);
  };

  // Insert text at cursor position - editor stays open
  const insertText = (text) => {
    const { start, end } = selection;
    const newValue = 
      inputValue.substring(0, start) + 
      text + 
      inputValue.substring(end);
    setInputValue(newValue);
    // Update cursor position - stay in editor
    setTimeout(() => {
      editorInputRef.current?.focus();
      const newPos = start + text.length;
      editorInputRef.current?.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Track selection
  const handleSelect = (e) => {
    setSelection({
      start: e.target.selectionStart,
      end: e.target.selectionEnd
    });
  };

  // Handle insert button click - delegate to parent component
  const handleInsert = () => {
    // Wrap formula in $ delimiters if it contains LaTeX and isn't already wrapped
    let formulaToSave = inputValue;
    if (inputValue && !inputValue.includes('$') && inputValue.trim()) {
      // Check if it contains LaTeX commands - if so, wrap it
      const hasLatex = /\\[a-zA-Z]+|[\^_]\{|\\times|\\div|\\sqrt|\\frac/.test(inputValue);
      if (hasLatex) {
        formulaToSave = `$${inputValue}$`;
      }
    }
    
    // Pass the formula to parent component (MathEditorButton) which handles insertion
    onSave?.(formulaToSave);
    onClose();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Render preview - try to render as LaTeX directly
  let previewHtml = '';
  if (inputValue && inputValue.trim()) {
    try {
      // Try rendering the input value directly as LaTeX
      previewHtml = renderMathExpression(inputValue, false);
      // If rendering failed silently, show the LaTeX code
      if (!previewHtml || previewHtml.trim() === '') {
        previewHtml = `<span class="text-gray-500 font-mono">${escapeHtml(inputValue)}</span>`;
      }
    } catch (error) {
      console.error('Preview rendering error:', error);
      previewHtml = `<span class="text-red-500 font-mono">Error: ${escapeHtml(inputValue)}</span>`;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Math Visual Editor"
    >
      <div
        className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 w-full max-w-2xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            Math Visual Editor
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input Field and Preview */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Math Expression
          </label>
          
          {/* LaTeX Code Input */}
          <textarea
            ref={editorInputRef}
            value={inputValue}
            onChange={(e) => {
                const newValue = e.target.value;
                const cursorPos = e.target.selectionStart;
                const oldValue = inputValue;
                
                // Check if a character was just typed (not deleted)
                if (newValue.length > oldValue.length) {
                  const beforeCursor = newValue.substring(0, cursorPos);
                  const afterCursor = newValue.substring(cursorPos);
                  
                  // Check if cursor is inside various formula structures
                  let isInsideFormula = false;
                  
                  // 1. Check if inside exponent ^{...}
                  const exponentMatch = beforeCursor.match(/\^{([^}]*)$/);
                  if (exponentMatch) {
                    if (afterCursor.startsWith('}')) {
                      // Cursor is right before closing brace
                      const exponentContent = exponentMatch[1];
                      // Only auto-advance if we JUST inserted the exponent (via button click)
                      // AND we've typed one character
                      if (justInsertedExponent && exponentContent.length > 0) {
                        // Move cursor outside after typing first character
                        setTimeout(() => {
                          if (editorInputRef.current && editorInputRef.current.value === newValue) {
                            const newCursorPos = cursorPos + 1; // After the closing }
                            editorInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
                          }
                        }, 10);
                        setJustInsertedExponent(false); // Reset flag
                      } else {
                        // User manually clicked into existing exponent - allow editing
                        isInsideFormula = true;
                      }
                    } else {
                      // Inside exponent but not at closing brace - allow editing
                      isInsideFormula = true;
                      setJustInsertedExponent(false); // Reset flag if user is editing
                    }
                  } else {
                    // Not inside exponent - reset flag
                    setJustInsertedExponent(false);
                  }
                  
                  // 2. Check if inside square root \sqrt{...}
                  const sqrtMatch = beforeCursor.match(/\\sqrt\{([^}]*)$/);
                  if (sqrtMatch) {
                    // Inside square root - allow editing
                    isInsideFormula = true;
                  }
                  
                  // 3. Check if inside fraction numerator \frac{...}{...}
                  const fracNumMatch = beforeCursor.match(/\\frac\{([^}]*)$/);
                  if (fracNumMatch) {
                    // Inside fraction numerator - allow editing
                    isInsideFormula = true;
                  }
                  
                  // 4. Check if inside fraction denominator \frac{...}{...}
                  const fracDenomMatch = beforeCursor.match(/\\frac\{[^}]*\}\{([^}]*)$/);
                  if (fracDenomMatch) {
                    // Inside fraction denominator - allow editing
                    isInsideFormula = true;
                  }
                  
                  // If we're inside a formula, the typing will naturally go inside
                  // (no special handling needed - cursor stays where it is)
                }
                
                setInputValue(newValue);
              }}
              onSelect={handleSelect}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Type LaTeX code or use buttons below..."
              rows={4}
            />
          
          {/* Preview Below */}
          {inputValue && inputValue.trim() && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-xs text-gray-600 mb-2 font-medium">Preview:</div>
              <div 
                className="text-gray-700"
                style={{ 
                  minHeight: '1.5em',
                  fontSize: '16px'
                }}
                dangerouslySetInnerHTML={{
                  __html: previewHtml || escapeHtml(inputValue)
                }}
              />
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Math Symbols
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExponent}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
              title="Exponent (x²)"
            >
              x²
            </button>
            <button
              onClick={handleExponentPower}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
              title="Exponent (xⁿ) - Type letter, click this, type number"
            >
              xⁿ
            </button>
            <button
              onClick={handleSquareRoot}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
              title="Square Root (√x)"
            >
              √x
            </button>
            <button
              onClick={handleFraction}
              className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                fractionMode === 'numerator'
                  ? 'bg-green-50 hover:bg-green-100 border-green-300 text-green-700'
                  : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
              }`}
              title={fractionMode === 'numerator' ? 'Move to denominator (click again)' : 'Fraction (a/b) - Click for numerator, click again for denominator'}
            >
              a/b
            </button>
            <button
              onClick={() => insertText('\\times')}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              title="Times"
            >
              ×
            </button>
            <button
              onClick={() => insertText('\\div')}
              className="px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              title="Divide"
            >
              ÷
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleInsert}
          >
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper to escape HTML
const escapeHtml = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export default MathVisualEditor;
