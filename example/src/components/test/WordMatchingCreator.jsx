import React, { useReducer, useCallback, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotification } from '../ui/Notification';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';

const WordMatchingCreator = ({ 
  testName = '', 
  onTestSaved, 
  onCancel, 
  onBackToCabinet, 
  isSaving = false, 
  validationErrors = {} 
}) => {
  const { user } = useAuth();
  const { makeAuthenticatedRequest } = useApi();
  const { showNotification } = useNotification();

  // State management
  const [wordPairs, setWordPairs] = useState([
    { leftWord: '', rightWord: '' },
    { leftWord: '', rightWord: '' },
    { leftWord: '', rightWord: '' }
  ]);
  const [interactionType, setInteractionType] = useState('drag');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Add new word pair
  const addWordPair = useCallback(() => {
    setWordPairs(prev => [...prev, { leftWord: '', rightWord: '' }]);
  }, []);

  // Remove word pair
  const removeWordPair = useCallback((index) => {
    if (wordPairs.length > 1) {
      setWordPairs(prev => prev.filter((_, i) => i !== index));
    }
  }, [wordPairs.length]);

  // Update left word
  const updateLeftWord = useCallback((index, value) => {
    setWordPairs(prev => prev.map((pair, i) => 
      i === index ? { ...pair, leftWord: value } : pair
    ));
  }, []);

  // Update right word
  const updateRightWord = useCallback((index, value) => {
    setWordPairs(prev => prev.map((pair, i) => 
      i === index ? { ...pair, rightWord: value } : pair
    ));
  }, []);

  // Validate test
  const isValidTest = useCallback(() => {
    return wordPairs.every(pair => pair.leftWord.trim() && pair.rightWord.trim());
  }, [wordPairs]);

  // Save test
  const handleSaveTest = useCallback(async () => {
    if (!isValidTest()) {
      showNotification('Please fill in all word pairs', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert to API format
      const questions = wordPairs.map((pair, index) => ({
        question_id: index + 1,
        left_word: pair.leftWord.trim(),
        right_word: pair.rightWord.trim()
      }));

      const testData = {
        test_name: testName,
        num_questions: questions.length,
        interaction_type: interactionType,
        questions: questions
      };

      console.log('🎯 Saving word matching test:', testData);

      // Pass the test data to parent component for processing
      onTestSaved({
        testName: testName,
        numQuestions: questions.length,
        interactionType: interactionType,
        wordPairs: wordPairs,
        questions: questions
      });
    } catch (error) {
      console.error('Error saving word matching test:', error);
      setError(error.message);
      showNotification('Failed to save test: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [testName, wordPairs, interactionType, isValidTest, makeAuthenticatedRequest, showNotification, onTestSaved]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto p-0"
    >
      {/* Interaction Type Selection */}
      <Card className="mb-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Choose Interaction Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className={` p-4 border-2 rounded-lg cursor-pointer transition-all ${
                interactionType === 'drag' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setInteractionType('drag')}
            >
              <div className="flex items-center mb-2">
                <input 
                  type="radio" 
                  checked={interactionType === 'drag'} 
                  onChange={() => setInteractionType('drag')}
                  className="mr-3"
                />
                <h4 className="font-medium">Drag & Drop</h4>
              </div>
              <p className="text-sm text-gray-600">
                Students drag words from left list to right list
              </p>
              <div className="mt-2 text-xs text-gray-500">
                • Easier for younger students<br/>
                • Visual feedback on placement<br/>
                • Mobile-friendly
              </div>
            </div>
            
            <div 
              className={` p-4 border-2 rounded-lg cursor-pointer transition-all ${
                interactionType === 'arrow' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setInteractionType('arrow')}
            >
              <div className="flex items-center mb-2">
                <input 
                  type="radio" 
                  checked={interactionType === 'arrow'} 
                  onChange={() => setInteractionType('arrow')}
                  className="mr-3"
                />
                <h4 className="font-medium">Draw Arrows</h4>
              </div>
              <p className="text-sm text-gray-600">
                Students draw arrows connecting matching words
              </p>
              <div className="mt-2 text-xs text-gray-500">
                • More challenging<br/>
                • Better for visual learners<br/>
                • Requires precision
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Word Pairs Section */}
      <Card className="mb-6">
        <div className="word-pairs-section">
          <div className="pairs-header flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Word Pairs</h3>
            <Button onClick={addWordPair} size="sm">
              + Add Pair
            </Button>
          </div>
          
          <div className="pairs-list space-y-3 p-0 md:p-4">
            {wordPairs.map((pair, index) => (
              <div key={index} className="word-pair-row flex items-center space-x-2 md:space-x-4 p-2 md:p-4 bg-gray-50 rounded-lg border">
                <div className="pair-number flex-shrink-0">
                  <span className="number-badge w-6 h-6 md:w-8 md:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-semibold">
                    {index + 1}
                  </span>
                </div>
                
                <div className="left-word flex-1">
                  <input
                    type="text"
                    value={pair.leftWord}
                    onChange={(e) => updateLeftWord(index, e.target.value)}
                    placeholder="Left word..."
                    className="word-input w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="pair-arrow flex-shrink-0 text-gray-500 text-lg md:text-xl">
                  →
                </div>
                
                <div className="right-word flex-1">
                  <input
                    type="text"
                    value={pair.rightWord}
                    onChange={(e) => updateRightWord(index, e.target.value)}
                    placeholder="Right word..."
                    className="word-input w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="pair-actions flex-shrink-0">
                  <Button 
                    onClick={() => removeWordPair(index)} 
                    variant="outline" 
                    size="sm"
                    className="remove-btn w-6 h-6 md:w-8 md:h-8 p-0 text-red-500 hover:bg-red-50"
                    disabled={wordPairs.length <= 1}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Preview Section */}
      <Card className="mb-6">
        <div className="preview-section">
          <h3 className="text-lg font-semibold mb-4">Preview</h3>
          <div className="preview-pairs space-y-2">
            {wordPairs.map((pair, index) => (
              <div key={index} className="preview-pair flex items-center space-x-2 text-sm">
                <span className="preview-number font-semibold text-blue-600">{index + 1}.</span>
                <span className="preview-left px-2 py-1 bg-white rounded border">
                  {pair.leftWord || 'Left word'}
                </span>
                <span className="preview-arrow text-gray-500">→</span>
                <span className="preview-right px-2 py-1 bg-white rounded border">
                  {pair.rightWord || 'Right word'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={handleSaveTest} 
          disabled={!isValidTest() || isLoading}
          className="px-8"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" color="white" className="mr-2" />
              Saving Test...
            </>
          ) : (
            'Save Test'
          )}
        </Button>
        <Button onClick={onCancel} variant="secondary">
          Cancel
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </motion.div>
  );
};

export default WordMatchingCreator;
