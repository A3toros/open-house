import React, { useEffect, useRef } from 'react';

const TextEditOverlay = ({ 
  x, 
  y, 
  width, 
  height, 
  initialText, 
  onSave, 
  onCancel 
}) => {
  const textareaRef = useRef(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave(textareaRef.current.value);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  return (
    <textarea
      ref={textareaRef}
      defaultValue={initialText}
      style={{
        position: 'absolute',
        top: y,
        left: x,
        width: width,
        height: height,
        fontSize: '14px',
        border: '2px solid #f59e0b',
        borderRadius: '6px',
        padding: '8px',
        background: 'white',
        resize: 'none',
        outline: 'none',
        fontFamily: 'inherit',
        lineHeight: '1.4',
        zIndex: 1000
      }}
      onKeyDown={handleKeyDown}
      onBlur={() => onSave(textareaRef.current.value)}
    />
  );
};

export default TextEditOverlay;
