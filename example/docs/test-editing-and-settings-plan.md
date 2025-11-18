# Test Editing & Settings Management Plan

## Overview
Enable editing of questions, answers, and correct answers for **Input, Multiple Choice, True/False, Word Matching, and Fill-in-the-Blanks tests** in the existing Detail modal. Add math formula support to Input tests. Add edit functionality for Shuffled and Timer settings with checkboxes and time input.

**Note**: Matching tests are supported for read-only display in the modal but are NOT included in the editing functionality (Matching tests have complex coordinate-based questions that require a different editing interface).

---

## Current State Analysis

### 1. Test Details Modal (`src/components/test/TestDetailsModal.jsx`)
- **Current Functionality**: Read-only display of questions, options, and correct answers
- **Supported Test Types for Display**: Multiple Choice, True/False, Input, Matching (read-only)
- **Supported Test Types for Editing** (this plan): Multiple Choice, True/False, Input, Word Matching, Fill-in-the-Blanks
- **Display Format**: 
  - Questions shown as text
  - Options displayed for Multiple Choice
  - Correct answers highlighted in green box
  - Matching shows instructions only (no detailed question editing)
- **No Edit Capability**: Currently view-only for all types
> **Out of scope for this phase:** Matching, Drawing, and Speaking remain read-only. Each requires bespoke editors (canvas tools, audio handling, per-blank templates) and dedicated backend flows, so they are deferred until specialised UIs are designed.

### 2. Test Settings Display (`src/teacher/TeacherCabinet.jsx` lines 1387-1420)
- **Shuffled Status**: Displayed as "✓ Yes" or "✗ No" (read-only)
- **Timer Status**: Displayed as "✓ X minutes" or "✗ Not set" (read-only)
- **Location**: Inside test details modal/section
- **No Edit Capability**: Currently view-only

### 3. Math Support (`src/utils/mathRenderer.js`)
- **Existing Utility**: `renderMathInText()` function available
- **Supports**: 
  - Inline math: `$...$`
  - Display math: `$$...$$`
  - KaTeX rendering
- **Current Usage**: Used in TeacherCabinet for displaying questions
- **Input Tests**: Math support NOT yet implemented in input question rendering

### 4. Backend Update Functions
- **Existing Pattern**: `functions/update-test-score.js` (generic update function)
- **No Question Update Endpoint**: Need to create new endpoint
- **No Settings Update Endpoint**: Need to create new endpoint

---

## Implementation Plan

### Phase 1: Add Edit Mode to Test Details Modal

#### 1.1 Modal State Management
**File**: `src/components/test/TestDetailsModal.jsx`

**Add State:**
```javascript
const [isEditMode, setIsEditMode] = useState(false);
const [editedQuestions, setEditedQuestions] = useState([]);
const [isSaving, setIsSaving] = useState(false);
const [hasChanges, setHasChanges] = useState(false);
```

**Add Props:**
```javascript
const TestDetailsModal = ({ 
  isOpen, 
  onClose, 
  testType, 
  testId, 
  testName, 
  questions = [],
  isLoading = false,
  onSave, // NEW: Callback when questions are saved
  canEdit = true // NEW: Whether editing is allowed
}) => {
```

**Initialize Edited Questions:**
```javascript
useEffect(() => {
  if (questions && questions.length > 0) {
    setEditedQuestions(JSON.parse(JSON.stringify(questions))); // Deep copy
  }
}, [questions]);
```

#### 1.2 Edit Mode Toggle
**Add Edit Button in Header:**
```javascript
{/* Header */}
<div className="flex items-center justify-between p-6 border-b border-gray-200">
  <div className="flex items-center space-x-3">
    {/* ... existing header content ... */}
  </div>
  <div className="flex items-center space-x-2">
    {canEdit && ['input', 'multiple_choice', 'true_false'].includes(testType) && (
      <Button
        onClick={() => setIsEditMode(!isEditMode)}
        variant={isEditMode ? "outline" : "primary"}
        size="sm"
      >
        {isEditMode ? '✕ Cancel Edit' : '✏️ Edit Questions'}
      </Button>
    )}
    {/* ... existing Print and Close buttons ... */}
  </div>
</div>
```

#### 1.3 Editable Question Components

**For Multiple Choice Questions:**
```javascript
const renderEditableMultipleChoice = (question, questionIndex) => {
  if (!isEditMode) {
    return renderQuestionOptions(question, 'multiple_choice'); // Existing read-only
  }
  
  return (
    <div className="space-y-4">
      {/* Question Text Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Text:
        </label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={editedQuestions[questionIndex]?.question || ''}
          onChange={(e) => {
            const updated = [...editedQuestions];
            updated[questionIndex].question = e.target.value;
            setEditedQuestions(updated);
            setHasChanges(true);
          }}
        />
      </div>
      
      {/* Options Editor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Options:
        </label>
        {['A', 'B', 'C', 'D', 'E', 'F'].map((letter, optIndex) => {
          const optionKey = `option_${letter.toLowerCase()}`;
          const optionValue = editedQuestions[questionIndex]?.[optionKey] || '';
          
          // Only show options that exist or are within num_options range
          if (!optionValue && optIndex >= (testInfo?.num_options || 4)) return null;
          
          return (
            <div key={letter} className="flex items-center space-x-2">
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded w-8 text-center">
                {letter}
              </span>
              <input
                type="text"
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                value={optionValue}
                onChange={(e) => {
                  const updated = [...editedQuestions];
                  updated[questionIndex][optionKey] = e.target.value;
                  setEditedQuestions(updated);
                  setHasChanges(true);
                }}
                placeholder={`Option ${letter}`}
              />
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
          {['A', 'B', 'C', 'D', 'E', 'F'].slice(0, testInfo?.num_options || 4).map(letter => (
            <option key={letter} value={letter.toLowerCase()}>
              Option {letter}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
```

**For True/False Questions:**
```javascript
const renderEditableTrueFalse = (question, questionIndex) => {
  if (!isEditMode) {
    return renderQuestionOptions(question, 'true_false'); // Existing read-only
  }
  
  return (
    <div className="space-y-4">
      {/* Question Text Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Text:
        </label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={editedQuestions[questionIndex]?.question || ''}
          onChange={(e) => {
            const updated = [...editedQuestions];
            updated[questionIndex].question = e.target.value;
            setEditedQuestions(updated);
            setHasChanges(true);
          }}
        />
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
              checked={editedQuestions[questionIndex]?.correct_answer === true}
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
              checked={editedQuestions[questionIndex]?.correct_answer === false}
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
```

**For Input Questions (with Math Support):**
```javascript
const renderEditableInput = (question, questionIndex) => {
  if (!isEditMode) {
    // Read-only with math rendering
    return (
      <div className="space-y-2">
        <p className="font-medium text-gray-700 mb-2">Question:</p>
        <div 
          className="bg-gray-100 p-3 rounded"
          dangerouslySetInnerHTML={{ 
            __html: renderMathInText(question.question || question.question_text) 
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
            <span dangerouslySetInnerHTML={{ __html: renderMathInText(String(question.correct_answer || question.correct_answers)) }} />
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Question Text Editor with Math Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Text (supports math: $...$ for inline, $$...$$ for display):
        </label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          rows={4}
          value={editedQuestions[questionIndex]?.question || editedQuestions[questionIndex]?.question_text || ''}
          onChange={(e) => {
            const updated = [...editedQuestions];
            if (updated[questionIndex].question_text) {
              updated[questionIndex].question_text = e.target.value;
            } else {
              updated[questionIndex].question = e.target.value;
            }
            setEditedQuestions(updated);
            setHasChanges(true);
          }}
          placeholder="Enter question text. Use $x^2$ for math expressions."
        />
        {/* Math Preview */}
        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Preview:</p>
          <div 
            className="text-sm"
            dangerouslySetInnerHTML={{ 
              __html: renderMathInText(editedQuestions[questionIndex]?.question || editedQuestions[questionIndex]?.question_text || '') 
            }}
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
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  value={String(ans)}
                  onChange={(e) => {
                    const updated = [...editedQuestions];
                    updated[questionIndex].correct_answers[ansIndex] = e.target.value;
                    setEditedQuestions(updated);
                    setHasChanges(true);
                  }}
                  placeholder="Enter answer (supports math: $x^2$)"
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
        ) : (
          <div>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              value={String(editedQuestions[questionIndex]?.correct_answer || editedQuestions[questionIndex]?.correct_answers || '')}
              onChange={(e) => {
                const updated = [...editedQuestions];
                if (updated[questionIndex].correct_answers !== undefined) {
                  updated[questionIndex].correct_answers = e.target.value;
                } else {
                  updated[questionIndex].correct_answer = e.target.value;
                }
                setEditedQuestions(updated);
                setHasChanges(true);
              }}
              placeholder="Enter answer (supports math: $x^2$)"
            />
            {/* Math Preview */}
            <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Preview:</p>
              <div 
                className="text-sm"
                dangerouslySetInnerHTML={{ 
                  __html: renderMathInText(String(editedQuestions[questionIndex]?.correct_answer || editedQuestions[questionIndex]?.correct_answers || '')) 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

#### 1.4 Save Functionality
**Add Save Button in Footer:**
```javascript
{/* Footer */}
<div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
  <div className="text-sm text-gray-600">
    {questions.length > 0 && (
      <span>
        {isEditMode ? (
          hasChanges ? (
            <span className="text-orange-600">⚠️ Unsaved changes</span>
          ) : (
            <span>Showing {questions.length} question{questions.length !== 1 ? 's' : ''}</span>
          )
        ) : (
          <span>Showing {questions.length} question{questions.length !== 1 ? 's' : ''}</span>
        )}
      </span>
    )}
  </div>
  <div className="flex items-center space-x-3">
    {isEditMode && (
      <Button
        onClick={handleSaveQuestions}
        variant="primary"
        disabled={isSaving || !hasChanges}
        className="flex items-center space-x-2"
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
      </Button>
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
```

**Save Handler:**
```javascript
const handleSaveQuestions = async () => {
  if (!hasChanges) return;
  
  setIsSaving(true);
  try {
    if (onSave) {
      await onSave(testType, testId, editedQuestions);
      setHasChanges(false);
      setIsEditMode(false);
      // Optionally refresh questions from parent
    } else {
      // Fallback: call API directly
      await testService.updateTestQuestions(testType, testId, editedQuestions);
      setHasChanges(false);
      setIsEditMode(false);
    }
  } catch (error) {
    console.error('Error saving questions:', error);
    alert('Failed to save questions. Please try again.');
  } finally {
    setIsSaving(false);
  }
};
```

#### 1.5 Import Math Renderer
**Add to TestDetailsModal.jsx:**
```javascript
import { renderMathInText } from '@/utils/mathRenderer';
```

---

### Phase 2: Create Backend Update Endpoint

#### 2.1 Create Update Questions Function
**New File**: `functions/update-test-questions.js`

```javascript
const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Teacher role required.' })
      };
    }

    const { test_type, test_id, questions } = JSON.parse(event.body) || {};
    
    if (!test_type || !test_id || !Array.isArray(questions)) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'test_type, test_id, and questions array are required' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    const teacher_id = userInfo.teacher_id;

    // Verify teacher owns this test
    const tableMap = {
      'multiple_choice': 'multiple_choice_tests',
      'true_false': 'true_false_tests',
      'input': 'input_tests'
    };

    const testTable = tableMap[test_type];
    if (!testTable) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid test type' })
      };
    }

    const testCheck = await sql`
      SELECT id FROM ${sql(testTable)}
      WHERE id = ${test_id} AND teacher_id = ${teacher_id}
    `;

    if (testCheck.length === 0) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Test not found or access denied' })
      };
    }

    // Begin transaction
    await sql`BEGIN`;

    try {
      // Update each question
      const questionTableMap = {
        'multiple_choice': 'multiple_choice_test_questions',
        'true_false': 'true_false_test_questions',
        'input': 'input_test_questions'
      };

      const questionTable = questionTableMap[test_type];

      for (const question of questions) {
        const questionId = question.question_id || question.id;
        if (!questionId) continue;

        if (test_type === 'multiple_choice') {
          await sql`
            UPDATE ${sql(questionTable)}
            SET 
              question = ${question.question},
              option_a = ${question.option_a || ''},
              option_b = ${question.option_b || ''},
              option_c = ${question.option_c || null},
              option_d = ${question.option_d || null},
              option_e = ${question.option_e || null},
              option_f = ${question.option_f || null},
              correct_answer = ${question.correct_answer}
            WHERE id = ${questionId} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
          `;
        } else if (test_type === 'true_false') {
          await sql`
            UPDATE ${sql(questionTable)}
            SET 
              question = ${question.question},
              correct_answer = ${question.correct_answer}
            WHERE id = ${questionId} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
          `;
        } else if (test_type === 'input') {
          // Handle both question and question_text fields
          const questionText = question.question || question.question_text || '';
          const correctAnswers = Array.isArray(question.correct_answers) 
            ? question.correct_answers 
            : [question.correct_answer || question.correct_answers || ''];
          
          await sql`
            UPDATE ${sql(questionTable)}
            SET 
              question = ${questionText},
              correct_answers = ${sql.array(correctAnswers)}
            WHERE id = ${questionId} AND test_id = ${test_id} AND teacher_id = ${teacher_id}
          `;
        }
      }

      await sql`COMMIT`;

      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Questions updated successfully',
          updated_count: questions.length
        })
      };
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error('Error updating questions:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
```

#### 2.2 Add to testService
**File**: `src/services/testService.js`

```javascript
async updateTestQuestions(testType, testId, questions) {
  try {
    console.log(`[DEBUG] updateTestQuestions called with testType: ${testType}, testId: ${testId}`);
    
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/update-test-questions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test_type: testType,
        test_id: testId,
        questions: questions
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('[DEBUG] Update questions response:', result);

    if (result.success) {
      console.log(`Questions for ${testType}_${testId} updated successfully`);
      return { success: true, message: result.message };
    } else {
      throw new Error(result.error || 'Failed to update questions');
    }
  } catch (error) {
    console.error('Error updating questions:', error);
    throw error;
  }
}
```

---

### Phase 3: Add Settings Edit Functionality

#### 3.1 Create Settings Edit Component
**New File**: `src/components/test/TestSettingsEditor.jsx`

```javascript
import React, { useState } from 'react';
import { Button } from '@/components/ui/components-ui-index';

const TestSettingsEditor = ({
  testType,
  testId,
  isShuffled: initialIsShuffled,
  allowedTime: initialAllowedTime,
  onSave,
  onCancel
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isShuffled, setIsShuffled] = useState(initialIsShuffled || false);
  const [enableTimer, setEnableTimer] = useState(!!initialAllowedTime);
  const [timerMinutes, setTimerMinutes] = useState(
    initialAllowedTime ? Math.floor(initialAllowedTime / 60) : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const allowedTime = enableTimer && timerMinutes 
        ? Math.floor(parseFloat(timerMinutes) * 60) 
        : null;
      
      await onSave({
        is_shuffled: isShuffled,
        allowed_time: allowedTime
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsShuffled(initialIsShuffled || false);
    setEnableTimer(!!initialAllowedTime);
    setTimerMinutes(initialAllowedTime ? Math.floor(initialAllowedTime / 60) : '');
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="flex items-center space-x-4">
        {/* Shuffle Status */}
        {['input', 'true_false', 'multiple_choice'].includes(testType) && (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500">Shuffled:</span>
            <span className={`text-sm font-semibold ${isShuffled ? 'text-green-600' : 'text-gray-400'}`}>
              {isShuffled ? '✓ Yes' : '✗ No'}
            </span>
          </div>
        )}
        
        {/* Timer Status */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-500">Timer:</span>
          {enableTimer && timerMinutes ? (
            <span className="text-sm font-semibold text-blue-600">
              ✓ {timerMinutes} minutes
            </span>
          ) : (
            <span className="text-sm font-semibold text-gray-400">
              ✗ Not set
            </span>
          )}
        </div>
        
        <Button
          onClick={() => setIsEditing(true)}
          variant="outline"
          size="sm"
        >
          ✏️ Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
      {/* Shuffle Checkbox */}
      {['input', 'true_false', 'multiple_choice'].includes(testType) && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_shuffled"
            checked={isShuffled}
            onChange={(e) => setIsShuffled(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_shuffled" className="text-sm font-medium text-gray-700">
            Shuffle questions
          </label>
        </div>
      )}
      
      {/* Timer Checkbox and Input */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="enable_timer"
            checked={enableTimer}
            onChange={(e) => {
              setEnableTimer(e.target.checked);
              if (!e.target.checked) {
                setTimerMinutes('');
              }
            }}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="enable_timer" className="text-sm font-medium text-gray-700">
            Enable timer
          </label>
        </div>
        
        {enableTimer && (
          <div className="ml-6 flex items-center space-x-2">
            <input
              type="number"
              min="1"
              step="1"
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Minutes"
              className="w-24 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">minutes</span>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-2">
        <Button
          onClick={handleSave}
          variant="primary"
          size="sm"
          disabled={isSaving || (enableTimer && !timerMinutes)}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          onClick={handleCancel}
          variant="outline"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default TestSettingsEditor;
```

#### 3.2 Integrate into TeacherCabinet
**File**: `src/teacher/TeacherCabinet.jsx`

**Replace lines 1387-1420 with:**
```javascript
{/* Test Settings - Shuffle and Timer with Edit */}
{(testInfo || selectedTest) && (
  <div className="space-y-2">
    <TestSettingsEditor
      testType={selectedTest.test_type}
      testId={selectedTest.test_id}
      isShuffled={testInfo?.is_shuffled || selectedTest.is_shuffled}
      allowedTime={testInfo?.allowed_time || selectedTest.allowed_time}
      onSave={async (settings) => {
        try {
          await testService.updateTestSettings(
            selectedTest.test_type,
            selectedTest.test_id,
            settings
          );
          showNotification('Settings updated successfully!', 'success');
          // Refresh test info
          await handleShowTestDetails(selectedTest);
        } catch (error) {
          showNotification('Failed to update settings', 'error');
        }
      }}
    />
  </div>
)}
```

**Add Import:**
```javascript
import TestSettingsEditor from '@/components/test/TestSettingsEditor';
```

#### 3.3 Create Backend Update Settings Function
**New File**: `functions/update-test-settings.js`

```javascript
const { neon } = require('@neondatabase/serverless');
const { validateToken } = require('./validate-token');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const tokenValidation = validateToken(event);
    if (!tokenValidation.success) {
      return {
        statusCode: tokenValidation.statusCode || 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: tokenValidation.error })
      };
    }

    const userInfo = tokenValidation.user;
    if (userInfo.role !== 'teacher') {
      return {
        statusCode: 403,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Access denied. Teacher role required.' })
      };
    }

    const { test_type, test_id, is_shuffled, allowed_time } = JSON.parse(event.body) || {};
    
    if (!test_type || !test_id) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'test_type and test_id are required' })
      };
    }

    const sql = neon(process.env.NEON_DATABASE_URL);
    const teacher_id = userInfo.teacher_id;

    // Map test type to table
    const tableMap = {
      'multiple_choice': 'multiple_choice_tests',
      'true_false': 'true_false_tests',
      'input': 'input_tests'
    };

    const testTable = tableMap[test_type];
    if (!testTable) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid test type' })
      };
    }

    // Verify teacher owns this test
    const testCheck = await sql`
      SELECT id FROM ${sql(testTable)}
      WHERE id = ${test_id} AND teacher_id = ${teacher_id}
    `;

    if (testCheck.length === 0) {
      return {
        statusCode: 404,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Test not found or access denied' })
      };
    }

    // Build update query dynamically
    const updates = [];
    if (is_shuffled !== undefined) {
      updates.push(sql`is_shuffled = ${is_shuffled}`);
    }
    if (allowed_time !== undefined) {
      updates.push(sql`allowed_time = ${allowed_time}`);
    }

    if (updates.length === 0) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No settings to update' })
      };
    }

    // Update test
    await sql`
      UPDATE ${sql(testTable)}
      SET ${sql.join(updates, sql`, `)}, updated_at = NOW()
      WHERE id = ${test_id} AND teacher_id = ${teacher_id}
    `;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: 'Test settings updated successfully'
      })
    };
  } catch (error) {
    console.error('Error updating test settings:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
```

#### 3.4 Add to testService
**File**: `src/services/testService.js`

```javascript
async updateTestSettings(testType, testId, settings) {
  try {
    console.log(`[DEBUG] updateTestSettings called with testType: ${testType}, testId: ${testId}`);
    
    const response = await window.tokenManager.makeAuthenticatedRequest('/.netlify/functions/update-test-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test_type: testType,
        test_id: testId,
        ...settings
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('[DEBUG] Update settings response:', result);

    if (result.success) {
      console.log(`Settings for ${testType}_${testId} updated successfully`);
      return { success: true, message: result.message };
    } else {
      throw new Error(result.error || 'Failed to update settings');
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}
```

---

### Phase 4: Extend Editing Support to Word Matching & Fill-in-the-Blanks

> Goal: bring the remaining text-based test types to parity with the Phase 1–3 workflow while leaving media/canvas-heavy types for a later iteration.

#### 4.1 Word Matching & Sentence Pairing
- **Frontend**
  - Dual-column editor that lets teachers add/remove word pairs and re-order them.
  - Bulk Excel import/export for large vocab lists.
  - Real-time conflict detection (duplicate words, uneven columns).
- **Backend**
  - Update function for `word_matching_test_pairs` with optimistic locking (version column) to avoid race conditions.
  - Enforce referential integrity when pairs are deleted (clean orphaned audio/translations if present).
- **Testing**
  - Unit tests for duplicate detection.
  - Regression tests ensuring existing student answers still map to new pairs after edits.

#### 4.2 Fill-in-the-Blanks
- **Frontend**
  - Markdown-like editor where teachers mark blanks using tokens (e.g. `[[answer]]`).
  - Preview rendering that shows numbered blanks exactly as students see them.
  - Support multiple acceptable answers per blank (chips UI with add/remove).
- **Backend**
  - Parser to split prompt into segments + blanks, stored in `fill_blanks_test_questions` as structured JSON.
  - Update endpoint validates that every blank has at least one answer and no orphaned answers exist.
- **Testing**
  - Parser unit tests (round‑trip text → JSON → text).
  - E2E test verifying edited blanks sync correctly with student submissions.

### Phase 5: Cross-cutting Enhancements
- **Unified Editing Framework**
  - Extract shared editor shell (header, footer, change tracking) so each test-specific editor plugs into the same modal infrastructure.
  - Centralise cache-busting + modal refresh logic so all save actions reuse the same flow established in Phase 1–4.
- **Permission & Audit Trail**
  - Add audit logging table (`test_edit_history`) recording who edited what and when.
  - Surface last-edited metadata in TeacherCabinet.
- **Feature Flag Rollout**
  - Gate each editor via feature flags to deploy incrementally and gather feedback per test type.

> **Outcome:** once Phases 4 and 5 are complete, in-place editing will cover Input, Multiple Choice, True/False, Word Matching, and Fill-in-the-Blanks, backed by transactional updates and consistent caching behaviour. Media-heavy test types remain read-only until bespoke editors are designed.

---

## Summary of Changes

### Frontend Files to Modify:
1. ✅ `src/components/test/TestDetailsModal.jsx` - Add edit mode, editable components, math support
2. ✅ `src/teacher/TeacherCabinet.jsx` - Integrate TestSettingsEditor, pass onSave callback
3. ✅ `src/services/testService.js` - Add `updateTestQuestions()` and `updateTestSettings()` methods

### New Frontend Files:
1. ✅ `src/components/test/TestSettingsEditor.jsx` - Settings editor component

### Backend Files to Create:
1. ✅ `functions/update-test-questions.js` - Update questions endpoint
2. ✅ `functions/update-test-settings.js` - Update settings endpoint

### Features:
- ✅ Edit questions, answers, and correct answers for Input, Multiple Choice, True/False
- ✅ Math formula support in Input test questions and answers (using existing `renderMathInText`)
- ✅ Edit Shuffled setting (checkbox)
- ✅ Edit Timer setting (checkbox + minutes input)
- ✅ Real-time math preview in Input test editors
- ✅ Save/Cancel functionality with change tracking
- ✅ Loading states and error handling

---

## Testing Checklist

- [ ] Edit Multiple Choice question text, options, and correct answer
- [ ] Edit True/False question text and correct answer
- [ ] Edit Input question text with math formulas ($x^2$, $$...$$)
- [ ] Edit Input correct answers (single and multiple) with math formulas
- [ ] Math preview renders correctly in Input editors
- [ ] Toggle Shuffled checkbox and save
- [ ] Toggle Timer checkbox, enter minutes, and save
- [ ] Cancel edit mode discards changes
- [ ] Save updates database correctly
- [ ] Error handling for invalid data
- [ ] Teacher permission validation
- [ ] Refresh after save shows updated data

