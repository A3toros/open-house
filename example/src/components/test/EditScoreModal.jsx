import React, { useState } from 'react';
import PerfectModal from '@/components/ui/PerfectModal';
import { API_ENDPOINTS } from '@/shared/shared-index';

const EditScoreModal = ({
  isOpen,
  onClose,
  testResult,
  onScoreUpdate
}) => {
  const [tempScore, setTempScore] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize tempScore when modal opens
  React.useEffect(() => {
    console.log('EditScoreModal: useEffect triggered', { isOpen, testResult });
    if (isOpen && testResult) {
      const currentScore = testResult.best_retest_score !== null && testResult.best_retest_score !== undefined
        ? testResult.best_retest_score
        : testResult.score || 0;
      setTempScore(currentScore.toString());
      console.log('EditScoreModal: Initialized with score', currentScore);
    }
  }, [isOpen, testResult]);

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use id field (from database view) instead of result_id
    const resultId = testResult?.id || testResult?.result_id;
    if (!resultId) {
      console.error('EditScoreModal: No id/result_id found', testResult);
      alert('Error: Test result ID not found');
      return;
    }
    
    console.log('EditScoreModal: Saving score', { resultId, score: tempScore, testType: testResult.test_type });
    
    setIsSaving(true);
    try {
      const testType = testResult.test_type || testResult.testType;
      const payload = {
        resultId: resultId,
        score: parseInt(tempScore) || 0,
        testType: testType
      };
      
      console.log('EditScoreModal: Sending payload', payload);
      
      // Use tokenManager for authenticated request if available
      let response;
      if (window.tokenManager?.makeAuthenticatedRequest) {
        response = await window.tokenManager.makeAuthenticatedRequest(API_ENDPOINTS.UPDATE_TEST_SCORE, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Fallback to regular fetch
        const { SecureToken } = await import('@/utils/secureTokenStorage');
        const token = await (window.tokenManager?.getToken() || SecureToken.get()) || localStorage.getItem('accessToken') || localStorage.getItem('token');
        response = await fetch(API_ENDPOINTS.UPDATE_TEST_SCORE, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(payload)
        });
      }
      
      console.log('EditScoreModal: Response status', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('EditScoreModal: Score updated successfully', responseData);
        // Call parent callback to update table
        if (onScoreUpdate) {
          onScoreUpdate(responseData);
        }
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('EditScoreModal: Error response', errorData);
        alert(errorData.error || `Failed to update score. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('EditScoreModal: Exception updating score:', error);
      alert(`Failed to update score: ${error.message || error}`);
    } finally {
      setIsSaving(false);
    }
  };

  console.log('EditScoreModal: Rendering', { isOpen, testResult, hasTestResult: !!testResult });

  if (!testResult) {
    console.log('EditScoreModal: No testResult, returning null');
    return null;
  }

  const currentMaxScore = testResult.best_retest_max_score || testResult.max_score || 0;
  const studentName = `${testResult.name || ''} ${testResult.surname || ''}`.trim() || testResult.student_id;
  const title = `Edit Score - ${testResult.test_name || 'Test'} - ${studentName}`;

  return (
    <PerfectModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Score
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max={currentMaxScore}
              value={tempScore}
              onChange={(e) => setTempScore(e.target.value)}
              className="w-24 px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Score"
            />
            <span className="text-lg font-semibold text-gray-600">/ {currentMaxScore}</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter a score between 0 and {currentMaxScore}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </PerfectModal>
  );
};

export default EditScoreModal;

