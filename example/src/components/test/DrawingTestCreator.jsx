import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotification } from '../ui/Notification';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import LexicalEditor from '../ui/LexicalEditor';

const DrawingTestCreator = ({
  testName = '',
  onTestSaved,
  onCancel,
  onBackToCabinet,
  isSaving = false,
  validationErrors = {}
}) => {
  const { user } = useAuth();
  const { post } = useApi();
  const { showNotification } = useNotification();

  // State management
  const [testData, setTestData] = useState({
    test_name: testName,
    num_questions: 1,
    passing_score: 100,
    questions: [
      {
        id: 1,
        question_json: '',
        canvas_width: 600,
        canvas_height: 800,
        max_canvas_width: 1536,
        max_canvas_height: 2048
      }
    ]
  });

  const [ui, setUI] = useState({
    isLoading: false,
    error: null,
    showPreview: true
  });

  // Update test name when prop changes
  useEffect(() => {
    setTestData(prev => ({
      ...prev,
      test_name: testName || ''
    }));
  }, [testName]);

  // Question management functions
  const addQuestion = () => {
    if (testData.num_questions >= 3) {
      setUI(prev => ({ 
        ...prev, 
        error: 'Maximum 3 questions allowed for performance reasons' 
      }));
      return;
    }
    
    const newQuestionId = Math.max(...testData.questions.map(q => q.id)) + 1;
    const newQuestion = {
      id: newQuestionId,
      question_json: '',
      canvas_width: 600,
      canvas_height: 800,
      max_canvas_width: 1536,
      max_canvas_height: 2048
    };
    
    setTestData(prev => ({
      ...prev,
      num_questions: prev.num_questions + 1,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const removeQuestion = (questionId) => {
    if (testData.questions.length <= 1) return;
    
    setTestData(prev => ({
      ...prev,
      num_questions: prev.num_questions - 1,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const updateQuestionJson = (questionId, jsonContent) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, question_json: jsonContent } : q
      )
    }));
  };

  const updateQuestionCanvas = (questionId, width, height) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, canvas_width: width, canvas_height: height } : q
      )
    }));
  };

  const updateQuestionMaxCanvas = (questionId, maxWidth, maxHeight) => {
    setTestData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, max_canvas_width: maxWidth, max_canvas_height: maxHeight } : q
      )
    }));
  };

  // Save test function
  const handleSaveTest = async () => {
    if (!testData.test_name.trim()) {
      setUI(prev => ({ ...prev, error: 'Test name is required' }));
      return;
    }

    if (testData.questions.some(q => !q.question_json.trim())) {
      setUI(prev => ({ ...prev, error: 'All questions must have content' }));
      return;
    }

    setUI(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Prepare test data for parent component (following pattern of other creators)
      const testDataForParent = {
        test_name: testData.test_name,
        num_questions: testData.num_questions,
        passing_score: testData.passing_score,
        questions: testData.questions.map((q, index) => ({
          question_id: index + 1,
          question_json: q.question_json,
          canvas_width: q.canvas_width,
          canvas_height: q.canvas_height,
          max_canvas_width: q.max_canvas_width,
          max_canvas_height: q.max_canvas_height
        }))
      };

      // Pass test data to parent component for processing (like other creators)
      if (onTestSaved) {
        onTestSaved(testDataForParent);
      }
    } catch (error) {
      console.error('Error preparing drawing test:', error);
      setUI(prev => ({ 
        ...prev, 
        error: 'Failed to prepare drawing test. Please try again.' 
      }));
      showNotification('Failed to prepare drawing test', 'error');
    } finally {
      setUI(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="drawing-test-creator max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Drawing Test</h2>
          <p className="text-gray-600">Create a test where students draw based on your instructions</p>
        </div>


        {/* Questions Management */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Drawing Questions ({testData.num_questions}/3)
              </h3>
              <p className="text-sm text-gray-500">Maximum 3 questions for optimal performance</p>
            </div>
            <Button
              onClick={addQuestion}
              disabled={testData.num_questions >= 3}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add Question
            </Button>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {testData.questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-800">Text {index + 1}</h4>
                  {testData.questions.length > 1 && (
                    <Button
                      onClick={() => removeQuestion(question.id)}
                      variant="secondary"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </Button>
                  )}
                </div>

                {/* Question Content */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Content *
                  </label>
                  <LexicalEditor
                    value={question.question_json}
                    onChange={(content) => updateQuestionJson(question.id, content)}
                    placeholder=""
                  />
                </div>

              </motion.div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {ui.error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
            {ui.error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            disabled={ui.isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTest}
            variant="primary"
            disabled={ui.isLoading || !testData.test_name.trim()}
            className="flex items-center gap-2"
          >
            {ui.isLoading ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                Saving...
              </>
            ) : (
              'Save Test'
            )}
          </Button>
        </div>
    </div>
  );
};

export default DrawingTestCreator;
