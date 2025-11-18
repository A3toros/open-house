import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/components-ui-index';

const TestSettingsEditor = ({
  testType,
  testId,
  isShuffled: initialIsShuffled,
  allowedTime: initialAllowedTime,
  onSave,
  onCancel,
  canEdit = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isShuffled, setIsShuffled] = useState(initialIsShuffled || false);
  const [enableTimer, setEnableTimer] = useState(!!initialAllowedTime);
  const [timerMinutes, setTimerMinutes] = useState(
    initialAllowedTime ? Math.floor(initialAllowedTime / 60) : ''
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsShuffled(initialIsShuffled || false);
  }, [initialIsShuffled]);

  useEffect(() => {
    setEnableTimer(!!initialAllowedTime);
    setTimerMinutes(initialAllowedTime ? Math.floor(initialAllowedTime / 60) : '');
  }, [initialAllowedTime]);

  useEffect(() => {
    if (!canEdit && isEditing) {
      setIsEditing(false);
    }
  }, [canEdit, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const allowedTime = enableTimer && timerMinutes 
        ? Math.floor(parseFloat(timerMinutes) * 60) 
        : null;

      const payload = {};
      if (['input', 'true_false', 'multiple_choice'].includes(testType)) {
        payload.is_shuffled = isShuffled;
      }
      payload.allowed_time = allowedTime;
      
      await onSave(payload);
      
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
        
        {canEdit && (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            size="sm"
          >
            ✏️ Edit
          </Button>
        )}
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

