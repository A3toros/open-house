import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/components-ui-index';
import { renderMathInText } from '@/utils/mathRenderer';
import { testService } from '@/services/services-index';
import TestSettingsEditor from '@/components/test/TestSettingsEditor';
import MathEditorButton from '@/components/math/MathEditorButton';

// TEST DETAILS MODAL COMPONENT - Complete Test Details Display
// ✅ COMPLETED: Full test details modal with question preview
// ✅ COMPLETED: Question-by-question display with options
// ✅ COMPLETED: Correct answers display
// ✅ COMPLETED: Responsive design with Tailwind CSS
// ✅ COMPLETED: Close functionality
// ✅ COMPLETED: Print functionality
// 🚧 IN PROGRESS: Edit mode for questions and answers

const TestDetailsModal = ({ 
  isOpen, 
  onClose, 
  testType, 
  testId, 
  testName, 
  questions = [],
  isLoading = false,
  onSave, // NEW: Callback when questions are saved
  canEdit = true, // NEW: Whether editing is allowed
  canEditSettings = true,
  // Additional test information
  subject,
  createdAt,
  assignments = [],
  testInfo = null, // Test info with settings (is_shuffled, allowed_time)
  onSettingsSave // Callback for settings save
}) => {
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const normalizedQuestions = Array.isArray(questions) ? questions : [];
  const effectiveCanEdit = !!canEdit;
  const effectiveCanEditSettings = canEditSettings !== undefined ? !!canEditSettings : !!canEdit;

  // Initialize edited questions when questions prop changes
  useEffect(() => {
    if (normalizedQuestions.length > 0) {
      setEditedQuestions(JSON.parse(JSON.stringify(normalizedQuestions))); // Deep copy
    } else {
      setEditedQuestions([]);
    }
    setHasChanges(false);
  }, [normalizedQuestions]);

  // Reset edit mode when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setHasChanges(false);
      setIsSaving(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!effectiveCanEdit && isEditMode) {
      setIsEditMode(false);
      setHasChanges(false);
    }
  }, [effectiveCanEdit, isEditMode]);

  if (!isOpen) return null;

  const getTestTypeDisplay = (type) => {
    const types = {
      'multiple_choice': 'Multiple Choice',
      'true_false': 'True/False',
      'input': 'Input',
      'matching_type': 'Matching',
      'word_matching': 'Word Matching',
      'fill_blanks': 'Fill in the Blanks'
    };
    return types[type] || type;
  };

  const renderQuestionOptions = (question, type) => {
    switch (type) {
      case 'multiple_choice':
        return (
          <div className="space-y-2">
            <p className="font-medium text-gray-700 mb-2">Options:</p>
            <div className="grid grid-cols-1 gap-2">
              {question.option_a && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">A</span>
                  <span className="text-gray-700">{question.option_a}</span>
                </div>
              )}
              {question.option_b && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">B</span>
                  <span className="text-gray-700">{question.option_b}</span>
                </div>
              )}
              {question.option_c && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">C</span>
                  <span className="text-gray-700">{question.option_c}</span>
                </div>
              )}
              {question.option_d && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">D</span>
                  <span className="text-gray-700">{question.option_d}</span>
                </div>
              )}
              {question.option_e && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">E</span>
                  <span className="text-gray-700">{question.option_e}</span>
                </div>
              )}
              {question.option_f && (
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">F</span>
                  <span className="text-gray-700">{question.option_f}</span>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'true_false':
        return (
          <div className="space-y-2">
            <p className="font-medium text-gray-700 mb-2">Options:</p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">T</span>
                <span className="text-gray-700">True</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">F</span>
                <span className="text-gray-700">False</span>
              </div>
            </div>
          </div>
        );
      
      case 'input':
        return (
          <div className="space-y-2">
            <p className="font-medium text-gray-700 mb-2">Answer Format:</p>
            <div className="bg-gray-100 p-3 rounded">
              <span className="text-gray-600 italic">Type your answer in the text input field</span>
            </div>
          </div>
        );
      
      case 'matching_type':
        return (
          <div className="space-y-2">
            <p className="font-medium text-gray-700 mb-2">Instructions:</p>
            <div className="bg-gray-100 p-3 rounded">
              <span className="text-gray-600 italic">Match the items by connecting them with lines or selecting pairs</span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderCorrectAnswer = (question, type) => {
    if (!question.correct_answer && !question.correct_answers) return null;

    let correctAnswerDisplay = '';
    switch (type) {
      case 'multiple_choice':
        correctAnswerDisplay = question.correct_answer?.toUpperCase() || '';
        break;
      case 'true_false':
        correctAnswerDisplay = question.correct_answer ? 'True' : 'False';
        break;
      case 'input':
        if (Array.isArray(question.correct_answers)) {
          correctAnswerDisplay = question.correct_answers.join(', ');
        } else {
          correctAnswerDisplay = question.correct_answer || question.correct_answers || '';
        }
        break;
      case 'matching_type':
        correctAnswerDisplay = typeof question.correct_answer === 'object' 
          ? JSON.stringify(question.correct_answer) 
          : question.correct_answer;
        break;
      default:
        correctAnswerDisplay = String(question.correct_answer || question.correct_answers || '');
    }

    return (
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <p className="font-medium text-green-800 mb-1">Correct Answer:</p>
        <p className="text-green-700 font-mono">{correctAnswerDisplay}</p>
      </div>
    );
  };

  // Save handler
  const handleSaveQuestions = async () => {
    if (!hasChanges) {
      console.log('No changes to save');
      return;
    }
    
    console.log('Saving questions...', { testType, testId, questionsCount: editedQuestions.length });
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(testType, testId, editedQuestions);
      } else {
        // Fallback: call API directly
        await testService.updateTestQuestions(testType, testId, editedQuestions);
      }
      setHasChanges(false);
      setIsEditMode(false);
      // Optionally refresh questions from parent
      if (onSave) {
        // Parent will handle refresh
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      alert('Failed to save questions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Debug: Log edit mode state
  useEffect(() => {
    if (isEditMode) {
      console.log('Edit mode is ON', { hasChanges, questionsCount: editedQuestions.length });
    }
  }, [isEditMode, hasChanges, editedQuestions.length]);

  // Editable Multiple Choice renderer
  const renderEditableMultipleChoice = (question, questionIndex) => {
    if (!isEditMode) {
      return (
        <>
          {renderQuestionOptions(question, 'multiple_choice')}
          {renderCorrectAnswer(question, 'multiple_choice')}
        </>
      );
    }

    const questionFieldId = `mc_question_${testId}_${questionIndex}`;
    const handleQuestionTextChange = (value) => {
      const updated = [...editedQuestions];
      updated[questionIndex].question = value;
      setEditedQuestions(updated);
      setHasChanges(true);
    };

    const handleOptionValueChange = (optionKey, value) => {
      const updated = [...editedQuestions];
      updated[questionIndex][optionKey] = value;
      setEditedQuestions(updated);
      setHasChanges(true);
    };

    return (
      <div className="space-y-4">
        {/* Question Text Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Text:
          </label>
          <div className="relative">
            <textarea
              id={questionFieldId}
              className="w-full p-2 pr-20 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={editedQuestions[questionIndex]?.question || ''}
              onChange={(e) => {
                handleQuestionTextChange(e.target.value);
              }}
            />
            <MathEditorButton
              showPreview={true}
              inputRef={() => document.getElementById(questionFieldId)}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
            />
          </div>
        </div>
        
        {/* Options Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Options:
            </label>
            <button
              type="button"
              onClick={() => {
                const updated = [...editedQuestions];
                const question = updated[questionIndex];
                // Find the next available option letter
                const allLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
                const existingOptions = allLetters.filter(letter => {
                  const key = `option_${letter.toLowerCase()}`;
                  return question[key] && question[key].trim() !== '';
                });
                
                if (existingOptions.length < 6) {
                  // Find first empty option
                  const nextLetter = allLetters.find(letter => {
                    const key = `option_${letter.toLowerCase()}`;
                    return !question[key] || question[key].trim() === '';
                  });
                  
                  if (nextLetter) {
                    const nextKey = `option_${nextLetter.toLowerCase()}`;
                    question[nextKey] = '';
                    setEditedQuestions(updated);
                    setHasChanges(true);
                  }
                }
              }}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              disabled={['A', 'B', 'C', 'D', 'E', 'F'].filter(letter => {
                const key = `option_${letter.toLowerCase()}`;
                return editedQuestions[questionIndex]?.[key] && editedQuestions[questionIndex][key].trim() !== '';
              }).length >= 6}
            >
              + Add Option
            </button>
          </div>
          {['A', 'B', 'C', 'D', 'E', 'F'].map((letter) => {
            const optionKey = `option_${letter.toLowerCase()}`;
            const rawValue = editedQuestions[questionIndex]?.[optionKey];
            const optionValue = rawValue ?? '';

            const hasValue = typeof rawValue === 'string' && rawValue.trim() !== '';
            const wasExplicitlyAdded = rawValue === '';

            // Always show A and B to ensure minimum options
            if (!hasValue && !wasExplicitlyAdded && letter !== 'A' && letter !== 'B') {
              return null;
            }
            
            return (
              <div key={letter} className="flex items-center space-x-2">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded w-8 text-center">
                  {letter}
                </span>
                <div className="relative flex-1">
                  <input
                    type="text"
                    id={`mc_option_${testId}_${questionIndex}_${letter}`}
                    className="w-full p-2 pr-20 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    value={optionValue}
                    onChange={(e) => {
                      handleOptionValueChange(optionKey, e.target.value);
                    }}
                    placeholder={`Option ${letter}`}
                  />
                  <MathEditorButton
                    showPreview={true}
                    inputRef={() => document.getElementById(`mc_option_${testId}_${questionIndex}_${letter}`)}
                    onChange={(e) => handleOptionValueChange(optionKey, e.target.value)}
                  />
                </div>
                {hasValue && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...editedQuestions];
                      updated[questionIndex][optionKey] = null;
                      setEditedQuestions(updated);
                      setHasChanges(true);
                    }}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                    title="Remove option"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Correct Answer Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correct Answer:
          </label>
          <select
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            value={editedQuestions[questionIndex]?.correct_answer || ''}
            onChange={(e) => {
              const updated = [...editedQuestions];
              updated[questionIndex].correct_answer = e.target.value;
              setEditedQuestions(updated);
              setHasChanges(true);
            }}
          >
            <option value="">Select correct answer</option>
            {['A', 'B', 'C', 'D', 'E', 'F'].map(letter => {
              const optionKey = `option_${letter.toLowerCase()}`;
              const optionValue = editedQuestions[questionIndex]?.[optionKey] || '';
              // Only show options that have values
              if (!optionValue || optionValue.trim() === '') return null;
              
              return (
                <option key={letter} value={letter.toLowerCase()}>
                  Option {letter}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    );
  };

  // Editable True/False renderer
  const renderEditableTrueFalse = (question, questionIndex) => {
    if (!isEditMode) {
      return (
        <>
          {renderQuestionOptions(question, 'true_false')}
          {renderCorrectAnswer(question, 'true_false')}
        </>
      );
    }

    const questionFieldId = `tf_question_${testId}_${questionIndex}`;
    const handleQuestionTextChange = (value) => {
      const updated = [...editedQuestions];
      updated[questionIndex].question = value;
      setEditedQuestions(updated);
      setHasChanges(true);
    };

    return (
      <div className="space-y-4">
        {/* Question Text Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Text:
          </label>
          <div className="relative">
            <textarea
              id={questionFieldId}
              className="w-full p-2 pr-20 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={editedQuestions[questionIndex]?.question || ''}
              onChange={(e) => {
                handleQuestionTextChange(e.target.value);
              }}
            />
            <MathEditorButton
              showPreview={true}
              inputRef={() => document.getElementById(questionFieldId)}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
            />
          </div>
        </div>
        
        {/* Correct Answer Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correct Answer:
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={`correct_answer_${questionIndex}`}
                value="true"
                checked={editedQuestions[questionIndex]?.correct_answer === true || editedQuestions[questionIndex]?.correct_answer === 'true'}
                onChange={() => {
                  const updated = [...editedQuestions];
                  updated[questionIndex].correct_answer = true;
                  setEditedQuestions(updated);
                  setHasChanges(true);
                }}
              />
              <span>True</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name={`correct_answer_${questionIndex}`}
                value="false"
                checked={editedQuestions[questionIndex]?.correct_answer === false || editedQuestions[questionIndex]?.correct_answer === 'false'}
                onChange={() => {
                  const updated = [...editedQuestions];
                  updated[questionIndex].correct_answer = false;
                  setEditedQuestions(updated);
                  setHasChanges(true);
                }}
              />
              <span>False</span>
            </label>
          </div>
        </div>
      </div>
    );
  };

  // Editable Input renderer with Math Support
  const renderEditableInput = (question, questionIndex) => {
    if (!isEditMode) {
      // Read-only with math rendering
      return (
        <div className="space-y-2">
          <p className="font-medium text-gray-700 mb-2">Question:</p>
          <div 
            className="bg-gray-100 p-3 rounded"
            dangerouslySetInnerHTML={{ 
              __html: renderMathInText(question.question || question.question_text || '') 
            }}
          />
          <p className="font-medium text-gray-700 mb-2 mt-4">Correct Answer(s):</p>
          <div className="bg-green-50 p-3 rounded border border-green-200">
            {Array.isArray(question.correct_answers) ? (
              <ul className="list-disc list-inside space-y-1">
                {question.correct_answers.map((ans, idx) => (
                  <li key={idx} dangerouslySetInnerHTML={{ __html: renderMathInText(String(ans)) }} />
                ))}
              </ul>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: renderMathInText(String(question.correct_answer || question.correct_answers || '')) }} />
            )}
          </div>
        </div>
      );
    }
    const questionFieldId = `input_question_${testId}_${questionIndex}`;
    const questionValue = editedQuestions[questionIndex]?.question ?? editedQuestions[questionIndex]?.question_text ?? '';
    const handleQuestionTextChange = (value) => {
      const updated = [...editedQuestions];
      if (updated[questionIndex].question_text !== undefined) {
        updated[questionIndex].question_text = value;
      } else {
        updated[questionIndex].question = value;
      }
      setEditedQuestions(updated);
      setHasChanges(true);
    };

    const handleArrayAnswerChange = (answerIndex, value) => {
      const updated = [...editedQuestions];
      if (!Array.isArray(updated[questionIndex].correct_answers)) {
        updated[questionIndex].correct_answers = [];
      }
      updated[questionIndex].correct_answers[answerIndex] = value;
      setEditedQuestions(updated);
      setHasChanges(true);
    };

    const handleSingleAnswerChange = (value) => {
      const updated = [...editedQuestions];
      if (updated[questionIndex].correct_answers !== undefined && !Array.isArray(updated[questionIndex].correct_answers)) {
        updated[questionIndex].correct_answers = value;
      } else if (updated[questionIndex].correct_answer !== undefined) {
        updated[questionIndex].correct_answer = value;
      } else {
        updated[questionIndex].correct_answer = value;
      }
      setEditedQuestions(updated);
      setHasChanges(true);
    };

    return (
      <div className="space-y-4">
        {/* Question Text Editor with Math Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Text (supports math: $...$ for inline, $$...$$ for display):
          </label>
          <div className="relative">
            <textarea
              id={questionFieldId}
              className="w-full p-2 pr-20 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={4}
              value={questionValue}
              onChange={(e) => {
                handleQuestionTextChange(e.target.value);
              }}
              placeholder="Enter question text. Use $x^2$ for math expressions."
            />
            <MathEditorButton
              showPreview={true}
              inputRef={() => document.getElementById(questionFieldId)}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
            />
          </div>
        </div>
        
        {/* Correct Answer(s) Editor with Math Support */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correct Answer(s) (supports math: $...$ for inline, $$...$$ for display):
          </label>
          {Array.isArray(editedQuestions[questionIndex]?.correct_answers) ? (
            <div className="space-y-2">
              {editedQuestions[questionIndex].correct_answers.map((ans, ansIndex) => (
                <div key={ansIndex} className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id={`input_answer_${testId}_${questionIndex}_${ansIndex}`}
                      className="w-full p-2 pr-20 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      value={String(ans)}
                      onChange={(e) => {
                        handleArrayAnswerChange(ansIndex, e.target.value);
                      }}
                      placeholder="Enter answer (supports math: $x^2$)"
                    />
                    <MathEditorButton
                      showPreview={true}
                      inputRef={() => document.getElementById(`input_answer_${testId}_${questionIndex}_${ansIndex}`)}
                      onChange={(e) => handleArrayAnswerChange(ansIndex, e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...editedQuestions];
                      updated[questionIndex].correct_answers.splice(ansIndex, 1);
                      setEditedQuestions(updated);
                      setHasChanges(true);
                    }}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const updated = [...editedQuestions];
                  if (!updated[questionIndex].correct_answers) {
                    updated[questionIndex].correct_answers = [];
                  }
                  updated[questionIndex].correct_answers.push('');
                  setEditedQuestions(updated);
                  setHasChanges(true);
                }}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
              >
                + Add Answer
              </button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <input
                  type="text"
                  id={`input_answer_${testId}_${questionIndex}_single`}
                  className="w-full p-2 pr-20 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  value={String(editedQuestions[questionIndex]?.correct_answer || editedQuestions[questionIndex]?.correct_answers || '')}
                  onChange={(e) => {
                    handleSingleAnswerChange(e.target.value);
                  }}
                  placeholder="Enter answer (supports math: $x^2$)"
                />
                <MathEditorButton
                  showPreview={true}
                  inputRef={() => document.getElementById(`input_answer_${testId}_${questionIndex}_single`)}
                  onChange={(e) => handleSingleAnswerChange(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleAddWordMatchingPair = React.useCallback(() => {
    setEditedQuestions(prev => {
      const existingIds = prev
        .map((q) => {
          const candidate = q?.question_id ?? q?.id;
          const numeric = Number(candidate);
          return Number.isFinite(numeric) ? numeric : null;
        })
        .filter((id) => id !== null);
      const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      return [
        ...prev,
        {
          id: null,
          question_id: nextId,
          left_word: '',
          right_word: '',
          __isNew: true
        }
      ];
    });
    setHasChanges(true);
  }, [setEditedQuestions, setHasChanges]);

  // Editable Word Matching renderer
  const renderEditableWordMatching = (question, questionIndex) => {
    if (!isEditMode) {
      // Read-only display
      return (
        <div className="space-y-2">
          <p className="font-medium text-gray-700 mb-2">Word Pair:</p>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-100 p-3 rounded">
              <span className="font-semibold text-gray-700">Left:</span> {question.left_word}
            </div>
            <span className="text-gray-400">→</span>
            <div className="flex-1 bg-gray-100 p-3 rounded">
              <span className="font-semibold text-gray-700">Right:</span> {question.right_word}
            </div>
          </div>
        </div>
      );
    }
    
    // Check for duplicates
    const checkDuplicates = (word, side, currentIndex) => {
      const duplicates = editedQuestions.filter((q, idx) => {
        if (idx === currentIndex) return false;
        return side === 'left' 
          ? q.left_word?.toLowerCase() === word?.toLowerCase()
          : q.right_word?.toLowerCase() === word?.toLowerCase();
      });
      return duplicates.length > 0;
    };
    
    const leftHasDuplicate = checkDuplicates(editedQuestions[questionIndex]?.left_word, 'left', questionIndex);
    const rightHasDuplicate = checkDuplicates(editedQuestions[questionIndex]?.right_word, 'right', questionIndex);
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Left Word */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Left Word:
            </label>
            <input
              type="text"
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                leftHasDuplicate ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={editedQuestions[questionIndex]?.left_word || ''}
              onChange={(e) => {
                const updated = [...editedQuestions];
                updated[questionIndex].left_word = e.target.value;
                setEditedQuestions(updated);
                setHasChanges(true);
              }}
              placeholder="Enter left word"
            />
            {leftHasDuplicate && (
              <p className="text-xs text-red-600 mt-1">⚠️ Duplicate left word detected</p>
            )}
          </div>
          
          {/* Right Word */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Right Word:
            </label>
            <input
              type="text"
              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                rightHasDuplicate ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={editedQuestions[questionIndex]?.right_word || ''}
              onChange={(e) => {
                const updated = [...editedQuestions];
                updated[questionIndex].right_word = e.target.value;
                setEditedQuestions(updated);
                setHasChanges(true);
              }}
              placeholder="Enter right word"
            />
            {rightHasDuplicate && (
              <p className="text-xs text-red-600 mt-1">⚠️ Duplicate right word detected</p>
            )}
          </div>
        </div>
        
        {/* Reorder buttons */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              if (questionIndex > 0) {
                const updated = [...editedQuestions];
                [updated[questionIndex - 1], updated[questionIndex]] = [updated[questionIndex], updated[questionIndex - 1]];
                setEditedQuestions(updated);
                setHasChanges(true);
              }
            }}
            disabled={questionIndex === 0}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ↑ Move Up
          </button>
          <button
            type="button"
            onClick={() => {
              if (questionIndex < editedQuestions.length - 1) {
                const updated = [...editedQuestions];
                [updated[questionIndex], updated[questionIndex + 1]] = [updated[questionIndex + 1], updated[questionIndex]];
                setEditedQuestions(updated);
                setHasChanges(true);
              }
            }}
            disabled={questionIndex === editedQuestions.length - 1}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            ↓ Move Down
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to remove this word pair?')) {
                const updated = editedQuestions.filter((_, idx) => idx !== questionIndex);
                setEditedQuestions(updated);
                setHasChanges(true);
              }
            }}
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
          >
            Remove
          </button>
        </div>
      </div>
    );
  };

  // Editable Fill Blanks renderer (simplified - works with JSONB structure)
  const renderEditableFillBlanks = (question, questionIndex) => {
    if (!isEditMode) {
      // Read-only display - show the question JSON structure
      return (
        <div className="space-y-2">
          <p className="font-medium text-gray-700 mb-2">Question:</p>
          <div className="bg-gray-100 p-3 rounded">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(question.question_json, null, 2)}
            </pre>
          </div>
          <p className="font-medium text-gray-700 mb-2 mt-4">Correct Answers:</p>
          <div className="bg-green-50 p-3 rounded border border-green-200">
            {Array.isArray(question.correct_answers) ? (
              <ul className="list-disc list-inside space-y-1">
                {question.correct_answers.map((ans, idx) => (
                  <li key={idx}>{String(ans)}</li>
                ))}
              </ul>
            ) : (
              <span>{String(question.correct_answers)}</span>
            )}
          </div>
        </div>
      );
    }
    
    // For editing, we'll provide a simplified editor that works with the JSONB structure
    // In a full implementation, this would parse and edit the structured JSON
    const questionJsonStr = JSON.stringify(question.question_json || {}, null, 2);
    const correctAnswers = Array.isArray(question.correct_answers) 
      ? question.correct_answers 
      : [question.correct_answers || ''];
    
    return (
      <div className="space-y-4">
        {/* Question JSON Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question JSON (structured text):
          </label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={6}
            value={questionJsonStr}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                const updated = [...editedQuestions];
                updated[questionIndex].question_json = parsed;
                setEditedQuestions(updated);
                setHasChanges(true);
              } catch (error) {
                // Invalid JSON - still update but mark as invalid
                console.error('Invalid JSON:', error);
              }
            }}
            placeholder='{"type": "paragraph", "children": [...]}'
          />
          <p className="text-xs text-gray-500 mt-1">Edit the JSON structure for the question text</p>
        </div>
        
        {/* Correct Answers Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correct Answer(s):
          </label>
          <div className="space-y-2">
            {correctAnswers.map((ans, ansIndex) => (
              <div key={ansIndex} className="flex items-center space-x-2">
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  value={String(ans)}
                  onChange={(e) => {
                    const updated = [...editedQuestions];
                    updated[questionIndex].correct_answers[ansIndex] = e.target.value;
                    setEditedQuestions(updated);
                    setHasChanges(true);
                  }}
                  placeholder="Enter answer"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...editedQuestions];
                    updated[questionIndex].correct_answers.splice(ansIndex, 1);
                    setEditedQuestions(updated);
                    setHasChanges(true);
                  }}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const updated = [...editedQuestions];
                if (!updated[questionIndex].correct_answers) {
                  updated[questionIndex].correct_answers = [];
                }
                updated[questionIndex].correct_answers.push('');
                setEditedQuestions(updated);
                setHasChanges(true);
              }}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
            >
              + Add Answer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const questionsToDisplay = isEditMode ? editedQuestions : normalizedQuestions;
  const questionCount = questionsToDisplay.length;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {testName || 'Test Details'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {getTestTypeDisplay(testType)} • {questionCount} Question{questionCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {effectiveCanEdit && ['input', 'multiple_choice', 'true_false', 'word_matching'].includes(testType) && (
                  <Button
                    onClick={() => {
                      if (isEditMode && hasChanges) {
                        if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
                          setIsEditMode(false);
                          setEditedQuestions(JSON.parse(JSON.stringify(questions))); // Reset to original
                          setHasChanges(false);
                        }
                      } else {
                        setIsEditMode(!isEditMode);
                      }
                    }}
                    variant={isEditMode ? "outline" : "primary"}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    {isEditMode ? '✕ Cancel Edit' : '✏️ Edit Questions'}
                  </Button>
                )}
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  ✕ Close
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading test details...</p>
                  </div>
                </div>
        ) : (
                <div className="space-y-6">
                  {!effectiveCanEdit && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                      Editing is disabled because this test has an active assignment.
                    </div>
                  )}
                  {/* Test Information Section */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {subject && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Subject:</span>
                          <p className="text-sm text-gray-900">{subject}</p>
                        </div>
                      )}
                      {createdAt && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Created:</span>
                          <p className="text-sm text-gray-900">{new Date(createdAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Classes Information */}
                    {assignments && assignments.length > 0 && (
                      <div className="mt-4">
                        <span className="text-sm font-medium text-gray-500">Classes:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {assignments.map((assignment, index) => (
                            <span 
                              key={index}
                              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium"
                            >
                              {assignment.grade}/{assignment.class}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Test Settings - Shuffle and Timer with Edit */}
                    {testInfo && onSettingsSave && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <TestSettingsEditor
                          testType={testType}
                          testId={testId}
                          isShuffled={testInfo?.is_shuffled}
                          allowedTime={testInfo?.allowed_time}
                        onSave={onSettingsSave}
                        canEdit={effectiveCanEditSettings}
                        />
                      </div>
                    )}
                  </div>

                  {/* Questions Section */}
                  {questionCount === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📝</div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">No Questions Available</h3>
                      <p className="text-gray-500 mb-4">This test doesn't have any questions yet.</p>
                      {isEditMode && testType === 'word_matching' && (
                        <button
                          type="button"
                          onClick={handleAddWordMatchingPair}
                          className="px-4 py-2 text-sm font-medium text-blue-600 border border-dashed border-blue-300 rounded hover:bg-blue-50"
                        >
                          + Add Word Pair
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                  {questionsToDisplay.map((question, index) => (
                    <motion.div
                      key={question.id || question.question_id || index}
                      className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                            Question {index + 1}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {getTestTypeDisplay(testType)}
                          </span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mb-4">
                        {isEditMode ? (
                          <div className="text-gray-800 font-medium text-lg leading-relaxed">
                            {testType === 'multiple_choice' && renderEditableMultipleChoice(question, index)}
                            {testType === 'true_false' && renderEditableTrueFalse(question, index)}
                            {testType === 'input' && renderEditableInput(question, index)}
                            {testType === 'word_matching' && renderEditableWordMatching(question, index)}
                            {testType === 'fill_blanks' && renderEditableFillBlanks(question, index)}
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-800 font-medium text-lg leading-relaxed">
                              {testType === 'input' ? (
                                <span dangerouslySetInnerHTML={{ __html: renderMathInText(question.question || question.question_text || '') }} />
                              ) : testType === 'word_matching' ? (
                                <div className="flex items-center space-x-4">
                                  <span className="bg-blue-100 px-3 py-1 rounded">{question.left_word}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="bg-green-100 px-3 py-1 rounded">{question.right_word}</span>
                                </div>
                              ) : testType === 'fill_blanks' ? (
                                <div className="bg-gray-100 p-3 rounded">
                                  <pre className="text-sm whitespace-pre-wrap">
                                    {JSON.stringify(question.question_json, null, 2)}
                                  </pre>
                                </div>
                              ) : (
                                question.question || question.question_text
                              )}
                            </p>
                            {/* Question Options */}
                            {renderQuestionOptions(question, testType)}
                            {/* Correct Answer */}
                            {renderCorrectAnswer(question, testType)}
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                      {isEditMode && testType === 'word_matching' && (
                        <div className="flex justify-center pt-2">
                          <button
                            type="button"
                            onClick={handleAddWordMatchingPair}
                            className="px-4 py-2 text-sm font-medium text-blue-600 border border-dashed border-blue-300 rounded hover:bg-blue-50"
                          >
                            + Add Word Pair
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Always visible at bottom */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="text-sm text-gray-600">
                {questionCount > 0 && (
                  <span>
                    {isEditMode ? (
                      hasChanges ? (
                        <span className="text-orange-600 font-semibold">⚠️ Unsaved changes</span>
                      ) : (
                        <span>Showing {questionCount} question{questionCount !== 1 ? 's' : ''}</span>
                      )
                    ) : (
                      <span>Showing {questionCount} question{questionCount !== 1 ? 's' : ''}</span>
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                {isEditMode && (
                  <button
                    onClick={handleSaveQuestions}
                    disabled={isSaving || !hasChanges}
                    className={`px-4 py-2 rounded-md font-medium flex items-center space-x-2 min-w-[140px] justify-center transition-all ${
                      isSaving || !hasChanges
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed opacity-60'
                        : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                )}
                <Button
                  onClick={onClose}
                  variant={isEditMode ? "outline" : "primary"}
                  className="flex items-center space-x-2"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TestDetailsModal;