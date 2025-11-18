import { useEffect, useState, useRef } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { motion } from 'framer-motion'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'
import { useRecorder } from '../../hooks/useRecorder'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'

type Puzzle = {
  id: string
  riddle_en: string
  riddle_th: string
  answer: string
}

const CountdownSeconds = 90
const motivatingMessages = [
  'Great thinking! 🎯',
  'You\'re doing amazing! ⭐',
  'Keep going, you\'ve got this! 💪',
  'Brilliant answer! 🌟',
  'Wow, you\'re smart! 🧠',
  'Excellent work! 🎉',
  'You\'re on fire! 🔥',
  'Amazing progress! 🚀',
]

const EscapeMission = () => {
  useClearLocalStorage(['escape-mission-storage'])
  const { isRecording, startRecording, stopRecording } = useRecorder()
  const [attempt, setAttempt] = useState('')
  const [feedback, setFeedback] = useState<string>()
  const [timeLeft, setTimeLeft] = useState(CountdownSeconds)
  const [isActive, setIsActive] = useState(false)
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [points, setPoints] = useState(0)
  const [riddlesSolved, setRiddlesSolved] = useState(0)
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)
  const [gameComplete, setGameComplete] = useState(false)
  const [currentMessage, setCurrentMessage] = useState<string>()
  const messageTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [isActive, timeLeft])

  const showMotivatingMessage = () => {
    const message = motivatingMessages[Math.floor(Math.random() * motivatingMessages.length)]
    setCurrentMessage(message)
    if (messageTimeoutRef.current) window.clearTimeout(messageTimeoutRef.current)
    messageTimeoutRef.current = window.setTimeout(() => setCurrentMessage(undefined), 2000)
  }

  const endGame = async () => {
    setIsActive(false)
    setGameComplete(true)
    setCurrentMessage('🎉 You Won! Amazing job! 🎉')
    if (gameSessionId) {
      try {
        await apiClient.post('/escape-mission', {
          action: 'end-game',
          gameSessionId,
        })
      } catch (error) {
        console.error('Failed to end game session:', error)
      }
    }
  }

  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      endGame()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isActive])

  const startMission = async () => {
    setIsLoading(true)
    setErrorMessage(undefined)
    setGameComplete(false)
    setPoints(0)
    setRiddlesSolved(0)
    setCurrentMessage(undefined)
    try {
      const response = await apiClient.post<{ 
        gameSessionId: string
        puzzleId: string
        puzzle: { riddle_en: string; riddle_th: string; answer: string }
        message?: string
      }>('/escape-mission', {
        action: 'start-game',
      })
      setGameSessionId(response.gameSessionId)
      setPuzzle({
        id: response.puzzleId,
        riddle_en: response.puzzle.riddle_en,
        riddle_th: response.puzzle.riddle_th,
        answer: response.puzzle.answer,
      })
      setAttempt('')
      setFeedback(undefined)
      setTimeLeft(CountdownSeconds)
      setIsActive(true)
      if (response.message) {
        setCurrentMessage(response.message)
      }
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const checkAnswer = async (answerText?: string) => {
    if (!puzzle || !isActive) return
    const answer = answerText || attempt.trim()
    if (!answer) return

    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ 
        correct: boolean
        points: number
        totalPoints: number
        message: string
        nextRiddle?: { puzzleId: string; riddle_en: string; riddle_th: string; answer: string }
      }>('/escape-mission', {
        action: 'answer',
        gameSessionId,
        puzzleId: puzzle.id,
        attempt: answer,
      })

      if (response.correct) {
        setRiddlesSolved((prev) => prev + 1)
        setPoints(response.totalPoints)
        showMotivatingMessage()
        setFeedback(response.message || '✅ Correct! Great job!')
        
        // Get next riddle automatically
        if (response.nextRiddle) {
          setPuzzle({
            id: response.nextRiddle.puzzleId,
            riddle_en: response.nextRiddle.riddle_en,
            riddle_th: response.nextRiddle.riddle_th,
            answer: response.nextRiddle.answer,
          })
          setAttempt('')
        }
      } else {
        setFeedback(response.message || 'Good try! Keep thinking! 💭')
      }
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
      setAttempt('')
    }
  }

  const handleSpeak = async () => {
    if (!isActive || !puzzle) return
    setErrorMessage(undefined)
    
    if (isRecording) {
      try {
        setIsTranscribing(true)
        const blob = ensureAudioAvailable(await stopRecording())
        const base64 = await toBase64(blob)
        
        // Transcribe audio
        const transcriptResponse = await apiClient.post<{ transcript: string }>('/culture-translator', {
          audioBlob: base64,
        })
        
        const transcribedText = transcriptResponse.transcript || ''
        if (transcribedText) {
          await checkAnswer(transcribedText)
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
    <ActivityLayout title="AI Escape Mission" subtitle="Solve riddles with speech or text to beat the countdown.">
      <motion.div
        className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {!gameComplete && (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              {puzzle ? (
                <div className="space-y-2 flex-1">
                  <p className="text-lg font-semibold text-white">
                    {puzzle.riddle_en}
                  </p>
                  <p className="text-base text-white/80">
                    {puzzle.riddle_th}
                  </p>
                </div>
              ) : (
                <p className="text-lg font-semibold text-white">
                  Tap "Start mission" to receive a fresh puzzle.
                </p>
              )}
              {isActive && (
                <div className="rounded-full border border-white/20 bg-primary/20 px-4 py-2 text-sm font-semibold text-white flex-shrink-0">
                  ⏱️ {timeLeft}s
                </div>
              )}
            </div>

            {isActive && (
              <div className="rounded-2xl border border-white/10 bg-midnight/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/60">Progress</span>
                  <span className="text-sm font-semibold text-white">
                    {riddlesSolved} solved • {points} points
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / CountdownSeconds) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
              </div>
            )}

            {!isActive && (
              <button
                onClick={startMission}
                className="w-full rounded-xl bg-accent px-6 py-3 text-lg font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Starting...' : 'Start Mission'}
              </button>
            )}

            {isActive && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
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
                        : 'bg-primary hover:bg-primary/90'
                    } disabled:opacity-50`}
                    disabled={isLoading || isTranscribing}
                  >
                    {isRecording ? '⏹️ Stop' : isTranscribing ? '🎤 Processing...' : '🎤 Speak'}
                  </button>
                </div>
                <button
                  onClick={() => checkAnswer()}
                  className="w-full rounded-xl bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
                  disabled={!isActive || isLoading || !attempt.trim()}
                >
                  {isLoading ? 'Checking...' : 'Submit Answer'}
                </button>
                <button
                  onClick={endGame}
                  className="w-full rounded-xl border border-white/30 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                  disabled={!isActive || isLoading}
                >
                  Abort Mission
                </button>
              </div>
            )}
          </>
        )}

        {gameComplete && (
          <motion.div
            className="rounded-2xl border border-primary/50 bg-primary/10 p-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <h3 className="text-3xl font-bold text-primary mb-4">🎉 You Won! 🎉</h3>
            <p className="text-xl text-white mb-4">Amazing job completing the mission!</p>
            <div className="space-y-2 text-white/80">
              <p>Riddles solved: <span className="font-bold text-white">{riddlesSolved}</span></p>
              <p>Total points: <span className="font-bold text-white">{points}</span></p>
            </div>
            <button
              onClick={startMission}
              className="mt-6 rounded-xl bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90"
            >
              Play Again
            </button>
          </motion.div>
        )}
        {currentMessage && (
          <motion.p
            className="text-lg font-semibold text-primary text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {currentMessage}
          </motion.p>
        )}
        {feedback && (
          <motion.p
            className="text-white/90 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {feedback}
          </motion.p>
        )}
        {errorMessage && <p className="text-sm text-rose-300 text-center">{errorMessage}</p>}
      </motion.div>
    </ActivityLayout>
  )
}

export default EscapeMission
