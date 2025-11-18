import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// ✅ REUSE EXISTING COMPONENTS
import Button from '../ui/Button';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import { Notification, useNotification } from '../ui/Notification';

// ✅ REUSE EXISTING HOOKS
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

// Import matching test components
import MatchingTestCreator from './MatchingTestCreator';
import MatchingTestStudent from './MatchingTestStudent';

const MatchingTestIntegration = ({ 
  mode = 'create', // 'create' or 'take'
  testData = null,
  onTestSaved,
  onTestCompleted,
  onBackToCabinet,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();
  const { makeAuthenticatedRequest } = useApi();
  const { user } = useAuth();

  // Handle test creation
  const handleTestCreated = useCallback(async (testData) => {
    try {
      setIsLoading(true);
      
      // Prepare data for unified backend
      const saveData = {
        teacher_id: user.teacher_id || localStorage.getItem('teacher_id'),
        test_type: 'matching_type',
        test_name: testData.testName || 'Untitled Matching Test',
        num_questions: testData.blocks?.length || 0,
        questions: testData.blocks?.map((block, index) => ({
          question_id: index + 1,
          word: block.word || `Word ${index + 1}`,
          block_coordinates: block.coordinates || block,
          has_arrow: testData.arrows?.some(arrow => 
            arrow.startBlock === block.id || arrow.endBlock === block.id
          ) || false,
          arrow: testData.arrows?.find(arrow => 
            arrow.startBlock === block.id || arrow.endBlock === block.id
          ) || null,
          image_url: testData.imageUrl
        })) || [],
        assignments: [] // Will be handled by assignment modal
      };

      const response = await makeAuthenticatedRequest('/.netlify/functions/save-test-with-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        showNotification('Test created successfully!', 'success');
        if (onTestSaved) {
          onTestSaved(result);
        }
      } else {
        throw new Error(result.message || 'Failed to save test');
      }
    } catch (error) {
      console.error('Test creation error:', error);
      showNotification('Error creating test. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [user, makeAuthenticatedRequest, onTestSaved, showNotification]);

  // Handle test completion
  const handleTestCompleted = useCallback((result) => {
    showNotification('Test completed successfully!', 'success');
    if (onTestCompleted) {
      onTestCompleted(result);
    }
  }, [onTestCompleted, showNotification]);

  // Render based on mode
  if (mode === 'create') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="matching-test-integration"
      >
        <MatchingTestCreator
          testName={testData?.test_name || ''}
          onTestSaved={handleTestCreated}
          onCancel={onCancel}
          onBackToCabinet={onBackToCabinet}
          isSaving={isLoading}
        />
      </motion.div>
    );
  }

  if (mode === 'take') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="matching-test-integration"
      >
        <MatchingTestStudent
          testData={testData}
          onTestComplete={handleTestCompleted}
          onBackToCabinet={onBackToCabinet}
        />
      </motion.div>
    );
  }

  return (
    <Card>
      <Card.Body className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4">Loading matching test...</p>
      </Card.Body>
    </Card>
  );
};

export default MatchingTestIntegration;
