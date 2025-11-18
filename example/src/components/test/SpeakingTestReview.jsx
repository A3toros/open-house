import React, { useEffect, useState, useRef } from 'react';
import AudioPlayer from './AudioPlayer';
import { SecureToken } from '../../utils/secureTokenStorage';

const SpeakingTestReview = ({ 
  result, 
  isOpen, 
  onClose, 
  initialTab = 'overview',
  // Speaking test score editing props
  editingSpeakingScore,
  tempSpeakingScore,
  isSavingSpeakingScore,
  onStartSpeakingScoreEdit,
  onSaveSpeakingScore,
  onCancelSpeakingScoreEdit,
  onTempSpeakingScoreChange
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const unmountedRef = useRef(false);

  // Cleanup effect to set unmounted flag
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  // Ensure the desired tab opens when the modal is shown
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  if (!isOpen || !result) return null;

  // Extract data from the result prop
  const testData = {
    test_id: result.test_id,
    test_name: result.test_name,
    subject_id: result.subject_id
  };
  
  // Normalize audio URL: allow override from caller, else from answers
  let normalizedAudioUrl = result?.__audioUrl || undefined;
  const ans = normalizedAudioUrl ? undefined : result?.answers;
  if (typeof ans === 'string') {
    normalizedAudioUrl = ans;
  } else if (ans && typeof ans === 'object') {
    normalizedAudioUrl = ans.audio_url;
  }

  // Debug: show initial transcript sources
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[SpeakingReview] Transcript sources', {
      fromResult: result?.transcript,
      fromAnswersObject: (typeof ans === 'object' && ans?.transcript) ? ans.transcript : undefined,
      hasAnswers: !!ans,
      test_id: result?.test_id,
      student_id: result?.student_id
    });
  // we intentionally depend only on ids to avoid spam
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.test_id, result?.student_id]);

  const [fetchedTranscript, setFetchedTranscript] = useState('');

  useEffect(() => {
    // If no transcript present, fetch from API (DB column)
    const controller = new AbortController();
    let isCancelled = false;
    const fallbackStudentId = result?.__studentId || result?.student_id;
    if (!result?.transcript && !(typeof ans === 'object' && ans?.transcript) && result?.test_id && fallbackStudentId) {
      (async () => {
        try {
          const url = `/.netlify/functions/get-speaking-test-new?action=transcript&test_id=${encodeURIComponent(result.test_id)}&student_id=${encodeURIComponent(fallbackStudentId)}`;
          // eslint-disable-next-line no-console
          console.log('[SpeakingReview] Fetching transcript from API:', { url });
          const token = await (window.tokenManager?.getToken() || SecureToken.get()) || localStorage.getItem('accessToken') || localStorage.getItem('token');
          const resp = await fetch(url, {
            headers: { 'Authorization': token ? `Bearer ${token}` : '' },
            signal: controller.signal
          });
          // eslint-disable-next-line no-console
          console.log('[SpeakingReview] Transcript API response:', { ok: resp.ok, status: resp.status });
          const data = await resp.json().catch(() => ({}));
          // eslint-disable-next-line no-console
          console.log('[SpeakingReview] Transcript API body:', data);
          if (!isCancelled && !unmountedRef.current) {
            if (resp.ok) {
              setFetchedTranscript(data.transcript || '');
            } else {
              // eslint-disable-next-line no-console
              console.warn('[SpeakingReview] Transcript API failed:', data?.error || 'unknown error');
            }
          }
        } catch (e) {
          if (e.name !== 'AbortError' && !unmountedRef.current) {
            // eslint-disable-next-line no-console
            console.error('[SpeakingReview] Transcript fetch error:', e);
          }
        }
      })();
    }
    return () => {
      isCancelled = true;
      try { controller.abort(); } catch (_) {}
    };
  }, [result]);

  const studentResults = {
    score: result.score,
    max_score: result.max_score,
    percentage: result.percentage,
    audio_url: normalizedAudioUrl,
    transcript: result.transcript || fetchedTranscript || ((typeof ans === 'object' && ans?.transcript) ? ans.transcript : undefined),
    time_taken: result.time_taken,
    started_at: result.started_at,
    submitted_at: result.submitted_at
  };

  const handleScoreUpdate = async (updatedScores) => {
    // For now, just log the update - in a real implementation,
    // this would call an API to update the scores in the database
    console.log('Score update requested:', updatedScores);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Speaking Test Review - {testData.test_name}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'audio', label: 'Audio' },
              { id: 'transcript', label: 'Transcript' },
              { id: 'analysis', label: 'AI Analysis' },
              { id: 'scoring', label: 'Scoring' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Test Name</label>
                  <p className="mt-1 text-sm text-gray-900">{testData.test_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Score</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {studentResults.score} / {studentResults.max_score}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Taken</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {studentResults.time_taken ? `${Math.floor(studentResults.time_taken / 60)}:${(studentResults.time_taken % 60).toString().padStart(2, '0')}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submitted At</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {studentResults.submitted_at ? new Date(studentResults.submitted_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Audio Recording</h3>
              {studentResults.audio_url ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Click the play button to listen to the student's recording:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <AudioPlayer 
                      audioUrl={studentResults.audio_url}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No audio recording available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Transcript</h3>
              {studentResults.transcript ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{studentResults.transcript}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No transcript available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">AI Analysis Results</h3>
              
              {(() => {
                let ai = result.ai_feedback;
                if (ai && typeof ai === 'string') {
                  try { ai = JSON.parse(ai); } catch (e) { ai = null; }
                }
                return ai ? (
                <>
                  {/* Overall Score */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Overall Performance</h4>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-800">
                        {ai.overall_score || 0}
                      </div>
                      <div className="text-sm text-gray-600">Overall Score (0-100)</div>
                    </div>
                  </div>

                  {/* Category Scores Grid */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Category Breakdown</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{ai.grammar_score || 0}/25</div>
                        <div className="text-xs text-gray-600">Grammar</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{ai.vocabulary_score || 0}/20</div>
                        <div className="text-xs text-gray-600">Vocabulary</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{ai.pronunciation_score || 0}/15</div>
                        <div className="text-xs text-gray-600">Pronunciation</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{ai.fluency_score || 0}/20</div>
                        <div className="text-xs text-gray-600">Fluency</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{ai.content_score || 0}/20</div>
                        <div className="text-xs text-gray-600">Content</div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Performance Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Word Count:</span>
                          <span className="text-sm font-medium">{ai.word_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Grammar Mistakes:</span>
                          <span className="text-sm font-medium text-red-600">{ai.grammar_mistakes || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Vocabulary Issues:</span>
                          <span className="text-sm font-medium text-red-600">{ai.vocabulary_mistakes || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Difficulty Level:</span>
                          <span className="text-sm font-medium">{ai.difficulty_level || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">AI Feedback</h4>
                      {ai.feedback ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-sm text-gray-700">{ai.feedback}</p>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">No AI feedback available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Improved Transcript */}
                  {ai.improved_transcript && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Improved Transcript</h4>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{ai.improved_transcript}</p>
                      </div>
                    </div>
                  )}

                  {/* Grammar Corrections */}
                  {ai.grammar_corrections && ai.grammar_corrections.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Grammar Corrections</h4>
                      <div className="space-y-3">
                        {ai.grammar_corrections.map((correction, index) => (
                          <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="text-sm">
                              <span className="font-medium text-red-800">Mistake:</span> {correction.mistake}
                            </div>
                            <div className="text-sm mt-1">
                              <span className="font-medium text-green-800">Correction:</span> {correction.correction}
                            </div>
                            {correction.explanation && (
                              <div className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">Explanation:</span> {correction.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vocabulary Corrections */}
                  {ai.vocabulary_corrections && ai.vocabulary_corrections.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Vocabulary Improvements</h4>
                      <div className="space-y-3">
                        {ai.vocabulary_corrections.map((correction, index) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div className="text-sm">
                              <span className="font-medium text-yellow-800">Original:</span> {correction.mistake}
                            </div>
                            <div className="text-sm mt-1">
                              <span className="font-medium text-green-800">Better:</span> {correction.correction}
                            </div>
                            {correction.explanation && (
                              <div className="text-xs text-gray-600 mt-1">
                                <span className="font-medium">Explanation:</span> {correction.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Language Use Suggestions */}
                  {ai.language_use_corrections && ai.language_use_corrections.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Language Use Suggestions</h4>
                      <div className="space-y-3">
                        {ai.language_use_corrections.map((item, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-sm">
                              <span className="font-medium text-blue-800">Original:</span> {item.mistake}
                            </div>
                            <div className="text-sm mt-1">
                              <span className="font-medium text-blue-800">Suggestion:</span> {item.suggestion}
                            </div>
                            {item.explanation && (
                              <div className="text-xs text-blue-700 mt-1">
                                {item.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
                ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No AI analysis available for this result</p>
                </div>
              )})()}
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 text-center">Score Details</h3>
              
              {editingSpeakingScore ? (
                <div className="space-y-4 text-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 place-items-center">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-center">Score</label>
                      <input
                        type="number"
                        min="0"
                        max={studentResults.max_score}
                        value={tempSpeakingScore}
                        onChange={(e) => onTempSpeakingScoreChange(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-center">Max Score</label>
                      <p className="mt-1 text-sm text-gray-900 text-center">{studentResults.max_score} (Fixed)</p>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={onSaveSpeakingScore}
                      disabled={isSavingSpeakingScore}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSavingSpeakingScore ? 'Saving...' : 'Save Score'}
                    </button>
                    <button
                      onClick={onCancelSpeakingScoreEdit}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="grid grid-cols-1 place-items-center gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 text-center">Current Score</label>
                      <p className="mt-1 text-sm text-gray-900 text-center">
                        {studentResults.score} / {studentResults.max_score}
                      </p>
                    </div>
                    {/* Percentage hidden per request */}
                  </div>
                  <button
                    onClick={() => onStartSpeakingScoreEdit(result.id, studentResults.score)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto"
                  >
                    Edit Score
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakingTestReview;