import React, { useCallback, useState } from 'react';
import LexicalEditor from './LexicalEditor';
import Button from './Button';

// Custom Add Blank button component for Lexical toolbar
const AddBlankButton = ({ onAddBlank, disabled = false }) => (
  <button
    onClick={onAddBlank}
    disabled={disabled}
    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
    title="Add Blank Space"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
    Add Blank
  </button>
);

// Enhanced LexicalEditor wrapper with blank functionality
const LexicalEditorWithBlanks = ({ 
  value, 
  onChange, 
  placeholder, 
  showAddBlankButton = false, 
  onAddBlank,
  blanks = [],
  disabled = false
}) => {
  // Insert blank placeholder at cursor position
  const insertBlank = useCallback(() => {
    if (onAddBlank) {
      onAddBlank();
    }
  }, [onAddBlank]);

  return (
    <div className="lexical-editor-with-blanks">
      {/* Custom toolbar with Add Blank button */}
      {showAddBlankButton && (
        <div className="border-b border-gray-300 p-2 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rich Text Editor</span>
            <AddBlankButton onAddBlank={insertBlank} disabled={disabled} />
          </div>
        </div>
      )}
      
      {/* Main Lexical Editor (following drawing test pattern) */}
      <LexicalEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      
      {/* Blank indicators display */}
      {blanks.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <div className="text-sm text-yellow-800">
            <strong>Blanks:</strong> {blanks.length} blank(s) added to text
          </div>
        </div>
      )}
    </div>
  );
};

export default LexicalEditorWithBlanks;
