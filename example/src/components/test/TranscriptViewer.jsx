import React, { useState } from 'react';

const TranscriptViewer = ({ 
  transcript, 
  wordCount, 
  grammarMistakes, 
  vocabularyMistakes 
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [highlightMode, setHighlightMode] = useState('none'); // none, grammar, vocabulary

  const getWordComplexity = (word) => {
    const syllables = word.toLowerCase().replace(/[^aeiou]/g, '').length;
    if (syllables >= 3) return 'complex';
    if (syllables >= 2) return 'medium';
    return 'simple';
  };

  const analyzeTranscript = () => {
    if (!transcript) return null;

    const words = transcript.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    const uniqueWords = new Set(words);
    const lexicalDensity = uniqueWords.size / words.length;
    
    const wordAnalysis = words.map(word => ({
      word,
      complexity: getWordComplexity(word),
      frequency: words.filter(w => w === word).length
    }));

    const complexWords = wordAnalysis.filter(w => w.complexity === 'complex');
    const repeatedWords = wordAnalysis.filter(w => w.frequency > 1);

    return {
      totalWords: words.length,
      uniqueWords: uniqueWords.size,
      lexicalDensity,
      complexWords: complexWords.length,
      repeatedWords: repeatedWords.length,
      averageWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length
    };
  };

  const analysis = analyzeTranscript();

  const getHighlightClass = (word) => {
    if (highlightMode === 'grammar' && grammarMistakes > 0) {
      // Simple grammar highlighting - in real implementation, this would use LanguageTool results
      return 'bg-yellow-100 border-b-2 border-yellow-400';
    }
    if (highlightMode === 'vocabulary') {
      const complexity = getWordComplexity(word);
      if (complexity === 'complex') return 'bg-green-100 border-b-2 border-green-400';
      if (complexity === 'simple') return 'bg-red-100 border-b-2 border-red-400';
    }
    return '';
  };

  const renderTranscript = () => {
    if (!transcript) return <p className="text-gray-500 italic">No transcript available</p>;

    const words = transcript.split(/\s+/);
    
    return (
      <div className="prose max-w-none">
        <p className="text-gray-800 leading-relaxed">
          {words.map((word, index) => (
            <span
              key={index}
              className={`${getHighlightClass(word)} transition-colors duration-200`}
            >
              {word}{' '}
            </span>
          ))}
        </p>
      </div>
    );
  };

  return (
    <div className="transcript-viewer">
      {/* Controls */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setHighlightMode(highlightMode === 'grammar' ? 'none' : 'grammar')}
            className={`px-3 py-1 rounded text-sm ${
              highlightMode === 'grammar' 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            {highlightMode === 'grammar' ? '✓' : ''} Grammar Issues
          </button>
          <button
            onClick={() => setHighlightMode(highlightMode === 'vocabulary' ? 'none' : 'vocabulary')}
            className={`px-3 py-1 rounded text-sm ${
              highlightMode === 'vocabulary' 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            {highlightMode === 'vocabulary' ? '✓' : ''} Vocabulary Analysis
          </button>
        </div>
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showAnalysis ? 'Hide Analysis' : 'Show Analysis'}
        </button>
      </div>

      {/* Transcript */}
      <div className="bg-gray-50 p-6 rounded-lg mb-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold">Transcript</h4>
          <div className="text-sm text-gray-600">
            {wordCount} words
          </div>
        </div>
        {renderTranscript()}
      </div>

      {/* Analysis Panel */}
      {showAnalysis && analysis && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Detailed Analysis</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-700">Total Words</div>
              <div className="text-lg font-bold text-blue-600">{analysis.totalWords}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Unique Words</div>
              <div className="text-lg font-bold text-green-600">{analysis.uniqueWords}</div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Lexical Density</div>
              <div className="text-lg font-bold text-purple-600">
                {(analysis.lexicalDensity * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-700">Complex Words</div>
              <div className="text-lg font-bold text-orange-600">{analysis.complexWords}</div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Average Word Length:</span>
              <span className="font-medium">{analysis.averageWordLength.toFixed(1)} characters</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-700">Repeated Words:</span>
              <span className="font-medium">{analysis.repeatedWords}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {highlightMode !== 'none' && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <h5 className="font-medium text-sm mb-2">Highlight Legend:</h5>
          <div className="flex flex-wrap gap-4 text-xs">
            {highlightMode === 'grammar' && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-100 border-b-2 border-yellow-400"></div>
                <span>Potential grammar issues</span>
              </div>
            )}
            {highlightMode === 'vocabulary' && (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border-b-2 border-green-400"></div>
                  <span>Complex vocabulary</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border-b-2 border-red-400"></div>
                  <span>Simple vocabulary</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{wordCount}</div>
          <div className="text-sm text-gray-600">Words Spoken</div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{grammarMistakes}</div>
          <div className="text-sm text-gray-600">Grammar Issues</div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">{vocabularyMistakes}</div>
          <div className="text-sm text-gray-600">Vocab Issues</div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptViewer;
