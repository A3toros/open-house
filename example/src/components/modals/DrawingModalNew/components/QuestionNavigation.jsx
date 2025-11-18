import React from 'react';
import Button from '../../../ui/Button';

const QuestionNavigation = ({ 
  currentQuestion, 
  totalQuestions, 
  onPrevious, 
  onNext, 
  drawingDataLength 
}) => {
  if (totalQuestions <= 1) return null;

  return (
    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            onClick={onPrevious}
            disabled={currentQuestion === 0}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <Button
            onClick={onNext}
            disabled={currentQuestion === totalQuestions - 1}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          {drawingDataLength} lines
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigation;
