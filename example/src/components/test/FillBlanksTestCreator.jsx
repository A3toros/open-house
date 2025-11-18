import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotification } from '../ui/Notification';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';
import FillBlanksLexicalEditor from '../ui/FillBlanksLexicalEditor';

const FillBlanksTestCreator = ({
  testName = '',
  allowedTime = null,
  onTestSaved,
  onCancel,
  onBackToCabinet,
  isSaving = false,
  validationErrors = {}
}) => {
  const { user } = useAuth();
  const { post } = useApi();
  const { showNotification } = useNotification();

  // State management (following drawing test pattern)
  const [testData, setTestData] = useState({
    test_name: testName,
    test_text: '', // Main text content from Lexical editor
    num_questions: 1, // Auto-calculated based on blanks
    num_blanks: 0,
    passing_score: 100,
    separate_type: true, // true = separate mode, false = inline mode
    allowed_time: allowedTime, // Timer in minutes (null = no timer)
    blanks: [] // Array of blank objects with positions and options
  });

  const [ui, setUI] = useState({
    isLoading: false,
    error: null,
    showPreview: true
  });

  // Update test name and timer when props change (like drawing test)
  useEffect(() => {
    setTestData(prev => ({
      ...prev,
      test_name: testName || '',
      allowed_time: allowedTime
    }));
  }, [testName, allowedTime]);

  // Update main test text from Lexical editor
  const updateTestText = (content) => {
    setTestData(prev => ({
      ...prev,
      test_text: content
    }));
  };

  // Add blank button functionality - called by the integrated editor
  const addBlank = () => {
    const blankId = testData.blanks.length + 1;
    const newBlank = {
      id: blankId,
      position: 0, // Will be set by Lexical editor
      question: '', // Question text for this blank
      options: ['', '', '', ''], // Default 4 options
      correct_answer: ''
    };
    
    setTestData(prev => ({
      ...prev,
      blanks: [...prev.blanks, newBlank],
      num_blanks: prev.num_blanks + 1
    }));
  };

  // Remove blank functionality
  const removeBlank = (blankId) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.filter(blank => blank.id !== blankId),
      num_blanks: prev.num_blanks - 1
    }));
  };

  // Add option to blank
  const addBlankOption = (blankId) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.map(blank => 
        blank.id === blankId 
          ? { ...blank, options: [...blank.options, ''] }
          : blank
      )
    }));
  };

  // Remove option from blank
  const removeBlankOption = (blankId, optionIndex) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.map(blank => 
        blank.id === blankId 
          ? {
              ...blank,
              options: blank.options.filter((_, optIndex) => optIndex !== optionIndex),
              correct_answer: blank.correct_answer === String.fromCharCode(65 + optionIndex) ? '' : blank.correct_answer
            }
          : blank
      )
    }));
  };

  // Update blank option
  const updateBlankOption = (blankId, optionIndex, value) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.map(blank => 
        blank.id === blankId 
          ? {
              ...blank,
              options: blank.options.map((option, optIndex) => 
                      optIndex === optionIndex ? value : option
              )
            }
          : blank
      )
    }));
  };

  // Update blank question text
  const updateBlankQuestion = (blankId, question) => {
    console.log('🔍 [DEBUG] updateBlankQuestion called:', { blankId, question });
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.map(blank => 
        blank.id === blankId 
          ? { ...blank, question }
          : blank
      )
    }));
    console.log('🔍 [DEBUG] updateBlankQuestion completed');
  };

  // Update correct answer for blank
  const updateCorrectAnswer = (blankId, value) => {
    setTestData(prev => ({
      ...prev,
      blanks: prev.blanks.map(blank => 
        blank.id === blankId 
          ? { ...blank, correct_answer: value }
          : blank
      )
    }));
  };

  // Save test function (following drawing test pattern)
  const handleSaveTest = async () => {
    if (!testData.test_name.trim()) {
      setUI(prev => ({ ...prev, error: 'Test name is required' }));
      return;
    }

    if (!testData.test_text.trim()) {
      setUI(prev => ({ ...prev, error: 'Test text is required' }));
      return;
    }

    if (testData.blanks.length === 0) {
      setUI(prev => ({ ...prev, error: 'At least one blank is required' }));
      return;
    }

    // Debug: Log all blanks to see what's missing
    console.log('🔍 [DEBUG] Validating blanks:', testData.blanks);
    testData.blanks.forEach((blank, index) => {
      console.log(`🔍 [DEBUG] Blank ${index + 1}:`, {
        question: blank.question,
        questionTrimmed: blank.question?.trim(),
        correct_answer: blank.correct_answer,
        options: blank.options
      });
    });

    // For inline mode, we don't need question text - only correct answers
    if (testData.separate_type === false) {
      // Inline mode: only need correct answers, no question text required
      if (testData.blanks.some(blank => !blank.correct_answer)) {
        console.log('❌ [DEBUG] Validation failed - some blanks missing correct answer');
        setUI(prev => ({ ...prev, error: 'All blanks must have correct answers' }));
        return;
      }
    } else {
      // Separate mode: need both question text and correct answers
      if (testData.blanks.some(blank => !blank.question.trim() || !blank.correct_answer)) {
        console.log('❌ [DEBUG] Validation failed - some blanks missing question or correct answer');
        setUI(prev => ({ ...prev, error: 'All blanks must have question text and correct answer' }));
        return;
      }
    }

    console.log('✅ [DEBUG] Validation passed - all blanks have question and correct answer');

    setUI(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Prepare test data for parent component (following pattern of drawing test)
      const testDataForParent = {
        test_name: testData.test_name,
        test_text: testData.test_text,
        num_questions: testData.blanks.length, // Auto-calculated
        num_blanks: testData.blanks.length,
        separate_type: testData.separate_type, // Include mode
        passing_score: testData.passing_score,
        allowed_time: testData.allowed_time, // Timer setting
        blanks: testData.blanks.map((blank, index) => ({
          question_id: index + 1,
          question_json: blank.question, // Use the individual question text for this blank
          question: blank.question,
          options: blank.options,
          correct_answer: blank.correct_answer,
          blank_positions: {}, // Will be populated by backend
          blank_options: blank.options || [],
          correct_answers: [blank.correct_answer] || []
        }))
      };

      // Pass test data to parent component for processing (like drawing test)
      console.log('🎯 [DEBUG] Calling onTestSaved with data:', testDataForParent);
      if (onTestSaved) {
        console.log('🎯 [DEBUG] onTestSaved function exists, calling it...');
        onTestSaved(testDataForParent);
        console.log('🎯 [DEBUG] onTestSaved called successfully');
      } else {
        console.log('❌ [DEBUG] onTestSaved function is null/undefined');
      }
    } catch (error) {
      console.error('Error preparing fill blanks test:', error);
      setUI(prev => ({ 
        ...prev, 
        error: 'Failed to prepare fill blanks test. Please try again.' 
      }));
      showNotification('Failed to prepare fill blanks test', 'error');
    } finally {
      setUI(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="fill-blanks-test-creator max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Fill Blanks Test</h2>
          <p className="text-gray-600">Create a test with text content and multiple choice blanks</p>
          {ui.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{ui.error}</p>
            </div>
          )}
        </div>

        {/* Text Content Header */}
        <div className="mb-6">

          
          {/* Display Mode Selection - Card Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                testData.separate_type === true 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setTestData(prev => ({ ...prev, separate_type: true }))}
            >
              <div className="flex items-center mb-2">
                <input 
                  type="radio" 
                  checked={testData.separate_type === true} 
                  onChange={() => setTestData(prev => ({ ...prev, separate_type: true }))}
                  className="mr-3"
                />
                <h4 className="font-medium">Separate Mode</h4>
              </div>
              <p className="text-sm text-gray-600">
                Multiple choice questions below the text
              </p>
            </div>
            
            <div 
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                testData.separate_type === false 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setTestData(prev => ({ ...prev, separate_type: false }))}
            >
              <div className="flex items-center mb-2">
                <input 
                  type="radio" 
                  checked={testData.separate_type === false} 
                  onChange={() => setTestData(prev => ({ ...prev, separate_type: false }))}
                  className="mr-3"
                />
                <h4 className="font-medium">Inline Mode</h4>
              </div>
              <p className="text-sm text-gray-600">
                Dropdown for option inside the text
              </p>
            </div>
          </div>

          {/* Fill Blanks Lexical Editor with Integrated Add Blank Button */}
          <FillBlanksLexicalEditor
            value={testData.test_text}
            onChange={updateTestText}
            placeholder="Type your text here. Use the 'Add Blank' button in the toolbar to insert blanks."
            onAddBlank={addBlank}
            blankCount={testData.blanks.length}
          />
        </div>

        {/* Blank Questions and Options - Only show in separate mode */}
        {testData.separate_type === true && (
          <div className="space-y-4">
            {testData.blanks.map((blank, index) => (
              <Card key={blank.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium">Blank {blank.id} Configuration</h4>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => removeBlank(blank.id)}
                    className="px-2 py-1 text-sm"
                  >
                    Remove Blank
                  </Button>
                </div>
            
                {/* Question Text for this Blank */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text for Blank {blank.id} *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter question text for this blank"
                    value={blank.question}
                    onChange={(e) => updateBlankQuestion(blank.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
          
                {/* Blank Options */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Answer Options:</h5>
                  {blank.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                        value={option || ''}
                        onChange={(e) => updateBlankOption(blank.id, optionIndex, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      />
                      {blank.options.length > 2 && (
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => removeBlankOption(blank.id, optionIndex)}
                          className="px-2 py-1 text-sm"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {blank.options.length < 6 && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => addBlankOption(blank.id)}
                      className="w-full"
                    >
                      + Add Option
                    </Button>
                  )}
                </div>

                {/* Correct Answer Selection */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer *
                  </label>
                  <select
                    value={blank.correct_answer || ''}
                    onChange={(e) => updateCorrectAnswer(blank.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select correct answer</option>
                    {blank.options.filter(opt => opt.trim().length > 0).map((option, optIndex) => (
                      <option key={optIndex} value={String.fromCharCode(65 + optIndex)}>
                        {String.fromCharCode(65 + optIndex)}) {option}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Inline Mode - Show simplified blank configuration */}
        {testData.separate_type === false && (
          <div className="space-y-4">
            {testData.blanks.map((blank, index) => (
              <Card key={blank.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium">Blank {blank.id} Options</h4>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => removeBlank(blank.id)}
                    className="px-2 py-1 text-sm"
                  >
                    Remove Blank
                  </Button>
                </div>
                
                {/* Blank Options for Inline Mode */}
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-700">Answer Options:</h5>
                  {blank.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                        {String.fromCharCode(65 + optionIndex)}
                      </div>
                      <input
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                        value={option || ''}
                        onChange={(e) => updateBlankOption(blank.id, optionIndex, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      />
                      {blank.options.length > 2 && (
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => removeBlankOption(blank.id, optionIndex)}
                          className="px-2 py-1 text-sm"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {blank.options.length < 6 && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => addBlankOption(blank.id)}
                      className="w-full"
                    >
                      + Add Option
                    </Button>
                  )}
                </div>
                
                {/* Correct Answer Selection */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer *
                  </label>
                  <select
                    value={blank.correct_answer || ''}
                    onChange={(e) => updateCorrectAnswer(blank.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select correct answer</option>
                    {blank.options.filter(opt => opt.trim().length > 0).map((option, optIndex) => (
                      <option key={optIndex} value={String.fromCharCode(65 + optIndex)}>
                        {String.fromCharCode(65 + optIndex)}) {option}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            ))}
          </div>
        )}


        {/* Save Test Button */}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTest}
            variant="primary"
            disabled={isSaving || testData.blanks.length === 0}
          >
            {isSaving ? <LoadingSpinner size="sm" /> : 'Save Test'}
          </Button>
        </div>
    </div>
  );
};

export default FillBlanksTestCreator;
