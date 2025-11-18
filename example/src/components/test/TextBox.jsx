import React, { useRef, useState, useEffect } from 'react';
import { Group, Rect, Text } from 'react-konva';

const TextBox = ({ 
  id, 
  x, 
  y, 
  width, 
  height, 
  text, 
  fontSize,
  color,
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete 
}) => {
  // ✅ Individual drag state for this TextBox instance
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const isDragEnabledRef = useRef(false);
  const longPressTimer = useRef(null);
  const pressStartPos = useRef({ x: 0, y: 0 });
  const groupRef = useRef(null);
  const MOVE_THRESHOLD_PX = 5; // cancel long-press if moved more than this before timeout

  const enableDrag = () => {
    isDragEnabledRef.current = true;
    setIsDragEnabled(true);
  };

  const disableDrag = () => {
    isDragEnabledRef.current = false;
    setIsDragEnabled(false);
    if (groupRef.current) {
      try { groupRef.current.draggable(false); } catch {}
    }
  };

  const clearTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // ✅ Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  // Keep Konva node draggable flag in sync
  useEffect(() => {
    if (groupRef.current) {
      try { groupRef.current.draggable(isDragEnabledRef.current); } catch {}
    }
  }, [isDragEnabled]);

  const handleDoubleClick = (e) => {
    e.cancelBubble = true;
    onUpdate(id, { isEditing: true });
  };
  
  const handleDragEnd = (e) => {
    onUpdate(id, { 
      x: e.target.x(), 
      y: e.target.y() 
    });
  };
  
  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable={isDragEnabled}  // ✅ Individual drag state
      dragBoundFunc={(pos) => (isDragEnabledRef.current ? pos : { x, y })}
      name={`textbox-group`}
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect(id);
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect(id);
        clearTimer();
      }}
      onDblClick={handleDoubleClick}  // ✅ Desktop double-click
      onDblTap={handleDoubleClick}     // ✅ Mobile double-tap
      onPointerDown={(e) => {          // ✅ Long-press activation
        e.cancelBubble = true;
        const ev = e.evt || {};
        pressStartPos.current = { x: ev.clientX ?? 0, y: ev.clientY ?? 0 };
        clearTimer(); // Clear any existing timer
        longPressTimer.current = setTimeout(() => {
          enableDrag();
        }, 400);
      }}
      onPointerMove={(e) => {
        // Cancel long-press if user moves finger/mouse too far before timeout
        if (!longPressTimer.current) return;
        const ev = e.evt || {};
        const dx = Math.abs((ev.clientX ?? 0) - pressStartPos.current.x);
        const dy = Math.abs((ev.clientY ?? 0) - pressStartPos.current.y);
        if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
          clearTimer();
        }
      }}
      onPointerUp={(e) => {            // ✅ Immediate cleanup
        e.cancelBubble = true;
        clearTimer();
        disableDrag(); // Immediate disable, no setTimeout
      }}
      onPointerLeave={() => {          // ✅ Immediate cleanup on leave
        clearTimer();
        disableDrag(); // Immediate disable
      }}
      onDragEnd={(e) => {
        handleDragEnd(e);
        disableDrag();
      }}
    >
      <Rect
        width={width}
        height={height}
        fill={isSelected ? "#fef3c7" : "#ffffff"}
        stroke={isSelected ? "#f59e0b" : "#d1d5db"}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={6}
        shadowColor="black"
        shadowBlur={2}
        shadowOffset={{ x: 1, y: 1 }}
        name="textbox-rect"
        onTap={(e) => { e.cancelBubble = true; onSelect(id); clearTimer(); }}
        onDblTap={(e) => { e.cancelBubble = true; handleDoubleClick(e); }}
      />
      <Text
        text={text}
        width={width}
        height={height}
        padding={8}
        align="left"
        verticalAlign="top"
        fontSize={fontSize}
        fill={color}
        wrap="word"
        name="textbox-text"
        onTap={(e) => { e.cancelBubble = true; onSelect(id); clearTimer(); }}
        onDblTap={(e) => { e.cancelBubble = true; handleDoubleClick(e); }}
      />
    </Group>
  );
};

export default TextBox;
