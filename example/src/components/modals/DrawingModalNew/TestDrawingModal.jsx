import React, { useState } from 'react';
import DrawingModal from './DrawingModal';

// Test component to verify the new DrawingModal works
const TestDrawingModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [drawing, setDrawing] = useState(null);

  // Mock drawing data for testing
  const mockDrawing = {
    id: 1,
    name: 'John',
    surname: 'Doe',
    test_name: 'Math Test',
    score: 85,
    max_score: 100,
    answers: JSON.stringify([
      // Mock drawing data - array of lines
      [
        { x: 100, y: 100, color: '#000000', thickness: 2 },
        { x: 150, y: 150, color: '#000000', thickness: 2 },
        { x: 200, y: 200, color: '#000000', thickness: 2 }
      ],
      [
        { x: 300, y: 300, color: '#FF0000', thickness: 3 },
        { x: 350, y: 350, color: '#FF0000', thickness: 3 }
      ]
    ])
  };

  const handleOpen = () => {
    setDrawing(mockDrawing);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setDrawing(null);
  };

  const handleScoreChange = (id, score) => {
    console.log('Score changed:', id, score);
    setDrawing(prev => ({ ...prev, score: parseInt(score) }));
  };

  const handleMaxScoreChange = (id, maxScore) => {
    console.log('Max score changed:', id, maxScore);
    setDrawing(prev => ({ ...prev, max_score: parseInt(maxScore) }));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">DrawingModal Test</h1>
      <button
        onClick={handleOpen}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Open Drawing Modal
      </button>
      
      <DrawingModal
        drawing={drawing}
        isOpen={isOpen}
        onClose={handleClose}
        onScoreChange={handleScoreChange}
        onMaxScoreChange={handleMaxScoreChange}
      />
    </div>
  );
};

export default TestDrawingModal;
