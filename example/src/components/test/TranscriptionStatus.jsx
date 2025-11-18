import React, { useState, useEffect } from 'react';

const TranscriptionStatus = ({ onComplete, onError }) => {
  const [status, setStatus] = useState('uploading');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Preparing your audio for transcription...');

  useEffect(() => {
    // Simulate the transcription process
    const simulateTranscription = async () => {
      try {
        // Step 1: Uploading
        setStatus('uploading');
        setMessage('Uploading audio to transcription service...');
        setProgress(10);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 2: Processing
        setStatus('processing');
        setMessage('Transcribing your speech...');
        setProgress(30);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Analyzing
        setStatus('analyzing');
        setMessage('Analyzing grammar and vocabulary...');
        setProgress(60);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 4: Scoring
        setStatus('scoring');
        setMessage('Calculating your speaking score...');
        setProgress(90);
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 5: Complete
        setStatus('complete');
        setMessage('Analysis complete!');
        setProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulate successful completion
        onComplete({
          transcript: "This is a sample transcript of the student's speech. The system has successfully analyzed the audio and provided detailed feedback on grammar, vocabulary, and overall speaking performance.",
          scores: {
            word_count: 25,
            word_score: 30,
            grammar_score: 35,
            vocab_score: 25,
            overall_score: 90,
            grammar_mistakes: 2,
            vocabulary_mistakes: 1
          }
        });

      } catch (error) {
        console.error('Transcription simulation error:', error);
        onError('Failed to process your audio. Please try again.');
      }
    };

    simulateTranscription();
  }, [onComplete, onError]);

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return '📤';
      case 'processing':
        return '🎤';
      case 'analyzing':
        return '🔍';
      case 'scoring':
        return '📊';
      case 'complete':
        return '✅';
      default:
        return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600';
      case 'processing':
        return 'text-purple-600';
      case 'analyzing':
        return 'text-orange-600';
      case 'scoring':
        return 'text-green-600';
      case 'complete':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="transcription-status bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="mb-6">
        <div className="text-6xl mb-4">{getStatusIcon()}</div>
        <h3 className="text-2xl font-semibold mb-2">Processing Your Speech</h3>
        <p className={`text-lg ${getStatusColor()}`}>{message}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm text-gray-600">{progress}% Complete</div>
      </div>

      {/* Status Steps */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div className={`p-3 rounded-lg ${status === 'uploading' ? 'bg-blue-100 text-blue-800' : progress > 10 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          <div className="font-semibold">Upload</div>
          <div className="text-xs">Audio Upload</div>
        </div>
        <div className={`p-3 rounded-lg ${status === 'processing' ? 'bg-purple-100 text-purple-800' : progress > 30 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          <div className="font-semibold">Transcribe</div>
          <div className="text-xs">Speech to Text</div>
        </div>
        <div className={`p-3 rounded-lg ${status === 'analyzing' ? 'bg-orange-100 text-orange-800' : progress > 60 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          <div className="font-semibold">Analyze</div>
          <div className="text-xs">Grammar & Vocab</div>
        </div>
        <div className={`p-3 rounded-lg ${status === 'scoring' ? 'bg-green-100 text-green-800' : progress > 90 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
          <div className="font-semibold">Score</div>
          <div className="text-xs">Calculate Score</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 text-sm text-gray-600">
        <p>This process typically takes 10-30 seconds depending on audio length.</p>
        <p className="mt-1">Please don't close this window while processing.</p>
      </div>

      {/* Loading Animation */}
      {status !== 'complete' && (
        <div className="mt-6">
          <div className="inline-flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionStatus;
