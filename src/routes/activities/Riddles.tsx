import { useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { motion } from 'framer-motion'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'
import { useRecorder } from '../../hooks/useRecorder'
import { useConfetti } from '../../hooks/useConfetti'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'

const Riddles = () => {
  useClearLocalStorage(['riddles-storage'])
  const { isRecording, startRecording, stopRecording } = useRecorder()
  const { fire: fireConfetti } = useConfetti()
  const [attempt, setAttempt] = useState('')
  const [currentRiddle, setCurrentRiddle] = useState<string | null>(null)
  const [currentRiddleIndex, setCurrentRiddleIndex] = useState<number | null>(null)
  const [riddlesRemaining, setRiddlesRemaining] = useState<number>(5)
  const [isLoading, setIsLoading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [points, setPoints] = useState(0)
  const [feedback, setFeedback] = useState<string>()
  const [correctAnswer, setCorrectAnswer] = useState<string>()
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

  const startGame = async () => {
    setIsLoading(true)
    setErrorMessage(undefined)
    setPoints(0)
    setFeedback(undefined)
    setCorrectAnswer(undefined)
    setAttempt('')
    try {
      const response = await apiClient.post<{ 
        gameSessionId: string
        riddle: string
        currentRiddleIndex: number
        totalRiddles: number
      }>('/riddles', {
        action: 'start-game',
      })
      setGameSessionId(response.gameSessionId)
      setCurrentRiddle(response.riddle)
      setCurrentRiddleIndex(response.currentRiddleIndex)
      setRiddlesRemaining(response.totalRiddles - response.currentRiddleIndex - 1)
      setGameStarted(true)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const checkAnswer = async (answerText?: string) => {
    if (currentRiddle === null || currentRiddleIndex === null) return
    const answer = answerText || attempt.trim()
    if (!answer) return

    setIsLoading(true)
    setErrorMessage(undefined)
    setFeedback(undefined)
    setCorrectAnswer(undefined)
    try {
      const response = await apiClient.post<{ 
        correct: boolean
        correctAnswer: string
        nextRiddle: string | null
        nextIndex: number | null
        points: number
      }>('/riddles', {
        action: 'check-answer',
        gameSessionId,
        currentRiddleIndex,
        attempt: answer,
      })

      if (response.correct) {
        setPoints((prev) => prev + response.points)
        const successMessages = [
          '🎉 Amazing! You got it!',
          '🌟 Brilliant! Well done!',
          '✨ Perfect! You\'re awesome!',
          '🎊 Fantastic! Keep it up!',
          '⭐ Excellent! You\'re a star!',
          '🚀 Wow! You\'re incredible!',
          '💫 Outstanding! You\'re amazing!',
          '🎈 Super job! You\'re doing great!',
          '🏆 Champion! You nailed it!',
          '💎 Incredible! You\'re a genius!',
          '🌈 Wonderful! You\'re so smart!',
          '🎯 Perfect! You\'re on fire!',
          '🔥 Awesome! You\'re unstoppable!',
          '💪 Great work! You\'re a winner!',
          '🎨 Beautiful! You\'re fantastic!',
          '✨ Marvelous! You\'re brilliant!',
          '🌟 Spectacular! You\'re a superstar!',
          '🎪 Amazing! You\'re incredible!',
          '⭐ Phenomenal! You\'re outstanding!',
          '🎊 Terrific! You\'re a champion!',
        ]
        setFeedback(successMessages[Math.floor(Math.random() * successMessages.length)])
        
        // Move to next riddle
        if (response.nextRiddle !== null && response.nextIndex !== null) {
          const nextIdx = response.nextIndex
          setTimeout(() => {
            setCurrentRiddle(response.nextRiddle!)
            setCurrentRiddleIndex(nextIdx)
            setRiddlesRemaining(5 - nextIdx - 1)
            setAttempt('')
            setFeedback(undefined)
          }, 5000) // Show feedback for 5 seconds before next riddle
        } else {
          // Game complete - all 5 riddles solved
          const finalScore = points + response.points
          fireConfetti() // Trigger confetti for completing all riddles
          setTimeout(() => {
            setFeedback(`🎉 Congratulations! You solved all 5 riddles! Your final score: ${finalScore} points!`)
            setGameStarted(false)
            setRiddlesRemaining(0)
            // Fire confetti again when showing completion message
            setTimeout(() => fireConfetti(), 100)
          }, 5000)
        }
      } else {
        setCorrectAnswer(response.correctAnswer)
        const encouragingMessages = [
          '💪 Good try! Keep going!',
          '🌟 Nice effort! You\'re learning!',
          '🎯 Almost there! Don\'t give up!',
          '✨ That\'s okay! Try the next one!',
          '🎈 Good attempt! You\'re doing great!',
          '🌈 Keep trying! You\'ve got this!',
          '🚀 Nice try! You\'re getting better!',
          '💫 That\'s alright! Keep learning!',
          '🎨 Good effort! You\'re improving!',
          '⭐ Don\'t worry! You\'re doing well!',
          '🎊 Nice attempt! Keep it up!',
          '🔥 Good try! You\'re making progress!',
          '💎 That\'s okay! Every try counts!',
          '🏆 Nice effort! You\'re a champion!',
          '🎪 Good try! You\'re awesome!',
          '💪 Keep going! You\'re doing great!',
          '🌟 Nice attempt! You\'re learning!',
          '✨ That\'s fine! Keep trying!',
          '🎯 Good effort! You\'ve got this!',
          '🌈 Nice try! You\'re getting there!',
        ]
        const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]
        setFeedback(`${randomMessage} The correct answer is: ${response.correctAnswer}`)
        
        // Move to next riddle after showing correct answer
        if (response.nextRiddle !== null && response.nextIndex !== null) {
          const nextIdx = response.nextIndex
          setTimeout(() => {
            setCurrentRiddle(response.nextRiddle!)
            setCurrentRiddleIndex(nextIdx)
            setRiddlesRemaining(5 - nextIdx - 1)
            setAttempt('')
            setFeedback(undefined)
            setCorrectAnswer(undefined)
          }, 6000) // Show feedback for 6 seconds before next riddle
        } else {
          // Game complete
          fireConfetti() // Trigger confetti for game completion
          setTimeout(() => {
            setFeedback(`🎉 Game complete! Your final score: ${points} points!`)
            setGameStarted(false)
            setRiddlesRemaining(0)
            // Fire confetti again when showing completion message
            setTimeout(() => fireConfetti(), 100)
          }, 6000)
        }
      }
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
      setAttempt('')
    }
  }

  const handleSpeak = async () => {
    if (!gameStarted || !currentRiddle) return
    setErrorMessage(undefined)
    
    if (isRecording) {
      try {
        setIsTranscribing(true)
        const blob = ensureAudioAvailable(await stopRecording())
        const base64 = await toBase64(blob)
        
        // Transcribe audio
        const transcriptResponse = await apiClient.post<{ transcript: string }>('/riddles', {
          action: 'transcribe',
          audioBlob: base64,
        })
        
        const transcribedText = transcriptResponse.transcript || ''
        if (transcribedText) {
          await checkAnswer(transcribedText)
        } else {
          setErrorMessage('Could not transcribe audio. Please try again.')
        }
      } catch (error) {
        setErrorMessage((error as Error).message)
      } finally {
        setIsTranscribing(false)
      }
    } else {
      try {
        await startRecording()
      } catch (error) {
        setErrorMessage((error as Error).message)
      }
    }
  }

  return (
    <ActivityLayout title="AI Riddles" subtitle="Solve riddles by typing or speaking your answers.">
      <motion.div
        className="space-y-4 rounded-2xl border border-[#11E0FF]/30 bg-[#1E2A49] p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {!gameStarted && !(feedback && (feedback.includes('Congratulations') || feedback.includes('Game complete'))) && (
          <div className="space-y-4">
            <p className="text-lg text-white/80 text-center">
              Ready to solve some riddles? Type or speak your answers!
            </p>
            <button
              onClick={startGame}
              className="w-full rounded-xl bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] text-[#11E0FF] px-6 py-3 text-lg font-semibold text-white hover:bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] text-[#11E0FF]/90 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : 'Start Game'}
            </button>
          </div>
        )}

        {gameStarted && (
          <>
            <div className="space-y-4">
              {/* Kid-friendly score display */}
              <motion.div
                className="rounded-2xl border-2 border-[#FFB743]/50 bg-gradient-to-br from-[#FFB743]/20 via-[#FF8C42]/20 to-[#FF6B35]/20 p-4 shadow-lg"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">⭐</span>
                    <div>
                      <p className="text-xs text-[#FFB743]/80 uppercase tracking-wide">Your Score</p>
                      <p className="text-4xl font-bold text-[#FFB743] drop-shadow-lg">{points}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#FFB743]/80 uppercase tracking-wide">Left</p>
                    <p className="text-3xl font-bold text-[#FFB743] drop-shadow-lg">{riddlesRemaining}</p>
                  </div>
                </div>
              </motion.div>

              {/* Bigger riddle text */}
              {currentRiddle && (
                <motion.div
                  className="rounded-2xl border-2 border-[#11E0FF]/50 bg-gradient-to-br from-[#11E0FF]/20 via-[#4DD0E1]/20 to-[#9B5BFF]/20 p-6 shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-2xl md:text-3xl font-bold text-white leading-relaxed text-center">
                    {currentRiddle}
                  </p>
                </motion.div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-[#11E0FF]/30 bg-[#1C2340] focus:border-[#11E0FF] focus:outline-none focus:ring-2 focus:ring-[#11E0FF]/20 px-3 py-2 text-white placeholder-white/50"
                  placeholder="Type your answer..."
                  value={attempt}
                  onChange={(e) => setAttempt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && checkAnswer()}
                  disabled={isLoading || isRecording}
                />
                <button
                  onClick={handleSpeak}
                  className={`rounded-xl px-4 py-2 font-semibold text-white transition ${
                    isRecording
                      ? 'bg-rose-500 hover:bg-rose-600'
                      : 'bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] text-[#11E0FF]'
                  } disabled:opacity-50`}
                  disabled={isLoading || isTranscribing}
                >
                  {isRecording ? '⏹️ Stop' : isTranscribing ? '🎤 Processing...' : '🎤 Speak'}
                </button>
              </div>
              <button
                onClick={() => checkAnswer()}
                className="w-full rounded-xl bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] text-[#11E0FF] px-6 py-3 font-semibold text-white hover:bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] text-[#11E0FF]/90 disabled:opacity-50"
                disabled={isLoading || !attempt.trim()}
              >
                {isLoading ? 'Checking...' : 'Submit Answer'}
              </button>
              <button
                onClick={async () => {
                  if (gameSessionId) {
                    try {
                      await apiClient.post('/riddles', {
                        action: 'end-game',
                        gameSessionId,
                      })
                    } catch (error) {
                      console.error('Failed to end game:', error)
                    }
                  }
                  setGameStarted(false)
                  setCurrentRiddle(null)
                  setCurrentRiddleIndex(null)
                  setRiddlesRemaining(5)
                  setFeedback(undefined)
                  setCorrectAnswer(undefined)
                }}
                className="w-full rounded-xl border-2 border-[#FFB743]/50 bg-[#FFB743]/10 hover:bg-[#FFB743]/20 hover:shadow-[0_0_15px_rgba(255,183,67,0.4)] text-[#FFB743] px-6 py-3 font-semibold disabled:opacity-50 transition"
                disabled={isLoading}
              >
                End Game
              </button>
            </div>
          </>
        )}

        {feedback && (
          <motion.div
            className={`rounded-2xl border-2 p-6 shadow-lg ${
              correctAnswer
                ? 'border-rose-400/50 bg-gradient-to-br from-rose-500/20 via-pink-500/20 to-red-500/20'
                : feedback.includes('Congratulations') || feedback.includes('Game complete')
                ? 'border-[#FFB743]/50 bg-gradient-to-br from-[#FFB743]/20 via-[#FF8C42]/20 to-[#FF6B35]/20'
                : 'border-[#11E0FF]/50 bg-gradient-to-br from-[#11E0FF]/20 via-[#4DD0E1]/20 to-[#9B5BFF]/20'
            }`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {feedback.includes('Congratulations') || feedback.includes('Game complete') ? (
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white mb-4">
                  {feedback.split('Your final score:')[0]}
                </p>
                {feedback.includes('Your final score:') && (
                  <motion.div
                    className="mt-4 pt-4 border-t border-white/30"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <p className="text-sm text-white/80 mb-2 uppercase tracking-wide">
                      Final Score
                    </p>
                    <p className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-[#FFB743] via-[#FF8C42] to-[#FF6B35] bg-clip-text text-transparent drop-shadow-lg">
                      {feedback.match(/Your final score: (\d+)/)?.[1] || points}
                    </p>
                    <p className="text-lg text-[#FFB743]/80 mt-2">points</p>
                  </motion.div>
                )}
                <motion.button
                  onClick={startGame}
                  className="mt-6 rounded-xl bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] text-[#11E0FF] px-8 py-3 text-lg font-semibold text-white hover:bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] text-[#11E0FF]/90 transition-transform hover:scale-105"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  🎮 Play Again
                </motion.button>
              </div>
            ) : (
              <>
                <p className="text-xl md:text-2xl font-bold text-white text-center mb-4">
                  {feedback}
                </p>
                {correctAnswer && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-sm text-white/80 text-center mb-2 uppercase tracking-wide">
                      The correct answer is:
                    </p>
                    <motion.p
                      className="text-3xl md:text-4xl font-extrabold text-center bg-gradient-to-r from-[#FFB743] via-[#FF8C42] to-[#FF6B35] bg-clip-text text-transparent drop-shadow-lg"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    >
                      {correctAnswer}
                    </motion.p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
        
        {errorMessage && (
          <motion.p
            className="text-sm text-rose-300 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {errorMessage}
          </motion.p>
        )}
      </motion.div>
    </ActivityLayout>
  )
}

export default Riddles

