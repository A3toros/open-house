import React, { useState, useEffect } from 'react';

const ScoringInterface = ({ studentResults, onScoreUpdate }) => {
  const [scores, setScores] = useState({
    word_score: studentResults.word_score || 0,
    grammar_score: studentResults.grammar_score || 0,
    vocab_score: studentResults.vocab_score || 0,
    overall_score: studentResults.overall_score || 0
  });
  const [teacherNotes, setTeacherNotes] = useState(studentResults.teacher_notes || '');
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    setScores({
      word_score: studentResults.word_score || 0,
      grammar_score: studentResults.grammar_score || 0,
      vocab_score: studentResults.vocab_score || 0,
      overall_score: studentResults.overall_score || 0
    });
    setTeacherNotes(studentResults.teacher_notes || '');
    setIsModified(false);
  }, [studentResults]);

  const handleScoreChange = (scoreType, value) => {
    const newScores = {
      ...scores,
      [scoreType]: Math.max(0, Math.min(100, parseFloat(value) || 0))
    };
    
    // Recalculate overall score
    newScores.overall_score = Math.round(
      (newScores.word_score * 0.3) + 
      (newScores.grammar_score * 0.4) + 
      (newScores.vocab_score * 0.3)
    );
    
    setScores(newScores);
    setIsModified(true);
  };

  const handleSave = () => {
    onScoreUpdate({
      ...scores,
      teacher_notes: teacherNotes,
      manual_override: true,
      updated_at: new Date().toISOString()
    });
    setIsModified(false);
  };

  const handleReset = () => {
    setScores({
      word_score: studentResults.word_score || 0,
      grammar_score: studentResults.grammar_score || 0,
      vocab_score: studentResults.vocab_score || 0,
      overall_score: studentResults.overall_score || 0
    });
    setTeacherNotes(studentResults.teacher_notes || '');
    setIsModified(false);
  };

  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  return (
    <div className="scoring-interface">
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-2">Manual Score Override</h4>
        <p className="text-sm text-gray-600">
          You can manually adjust the AI-generated scores if needed. Changes will be saved automatically.
        </p>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Word Count Score */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-semibold text-gray-700">Word Count</h5>
            <span className={`text-sm font-bold ${getScoreColor(scores.word_score, 30)}`}>
              {scores.word_score}/30
            </span>
          </div>
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={scores.word_score}
              onChange={(e) => handleScoreChange('word_score', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="text-xs text-gray-600">
            Based on: {studentResults.word_count} words spoken
          </div>
        </div>

        {/* Grammar Score */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-semibold text-gray-700">Grammar</h5>
            <span className={`text-sm font-bold ${getScoreColor(scores.grammar_score, 40)}`}>
              {scores.grammar_score}/40
            </span>
          </div>
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max="40"
              step="0.5"
              value={scores.grammar_score}
              onChange={(e) => handleScoreChange('grammar_score', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="text-xs text-gray-600">
            AI found: {studentResults.grammar_mistakes} mistakes
          </div>
        </div>

        {/* Vocabulary Score */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h5 className="font-semibold text-gray-700">Vocabulary</h5>
            <span className={`text-sm font-bold ${getScoreColor(scores.vocab_score, 30)}`}>
              {scores.vocab_score}/30
            </span>
          </div>
          <div className="mb-3">
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={scores.vocab_score}
              onChange={(e) => handleScoreChange('vocab_score', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="text-xs text-gray-600">
            AI found: {studentResults.vocabulary_mistakes} issues
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-6">
        <div className="text-center">
          <h4 className="text-lg font-semibold mb-2">Overall Score</h4>
          <div className={`text-4xl font-bold ${getScoreColor(scores.overall_score, 100)}`}>
            {scores.overall_score}/100
          </div>
          <div className={`text-xl font-semibold ${getScoreColor(scores.overall_score, 100)} mt-1`}>
            Grade: {getScoreGrade(scores.overall_score, 100)}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Weighted: Word Count (30%) + Grammar (40%) + Vocabulary (30%)
          </div>
        </div>
      </div>

      {/* Teacher Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Teacher Notes
        </label>
        <textarea
          value={teacherNotes}
          onChange={(e) => {
            setTeacherNotes(e.target.value);
            setIsModified(true);
          }}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add feedback or notes for the student..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {isModified && (
            <span className="text-orange-600 font-medium">• Unsaved changes</span>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            disabled={!isModified}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!isModified}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h5 className="font-semibold mb-3">Score Breakdown</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Word Count Score:</span>
            <span className="font-medium">{scores.word_score}/30 ({(scores.word_score/30*100).toFixed(1)}%)</span>
          </div>
          <div className="flex justify-between">
            <span>Grammar Score:</span>
            <span className="font-medium">{scores.grammar_score}/40 ({(scores.grammar_score/40*100).toFixed(1)}%)</span>
          </div>
          <div className="flex justify-between">
            <span>Vocabulary Score:</span>
            <span className="font-medium">{scores.vocab_score}/30 ({(scores.vocab_score/30*100).toFixed(1)}%)</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total Score:</span>
            <span>{scores.overall_score}/100 ({(scores.overall_score/100*100).toFixed(1)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoringInterface;
