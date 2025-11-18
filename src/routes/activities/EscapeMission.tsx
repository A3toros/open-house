import { useEffect, useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { motion } from 'framer-motion'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

type Puzzle = {
  id: string
  riddle: string
  hint?: string
}

const CountdownSeconds = 75

const EscapeMission = () => {
  useClearLocalStorage(['escape-mission-storage'])
  const [attempt, setAttempt] = useState('')
  const [feedback, setFeedback] = useState<string>()
  const [timeLeft, setTimeLeft] = useState(CountdownSeconds)
  const [isActive, setIsActive] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [hintMessage, setHintMessage] = useState<string>()
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [isActive, timeLeft])

  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      setIsActive(false)
      setFeedback('Time is up! Request a new mission.')
    }
  }, [timeLeft, isActive])

  const startMission = async () => {
    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ puzzleId: string; puzzle: { riddle: string; hint?: string } }>(
        '/escape-mission',
        {
          action: 'generate',
        },
      )
      setPuzzle({
        id: response.puzzleId,
        riddle: response.puzzle.riddle,
        hint: response.puzzle.hint,
      })
      setAttempt('')
      setFeedback(undefined)
      setHintsUsed(0)
      setHintMessage(undefined)
      setTimeLeft(CountdownSeconds)
      setIsActive(true)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const checkAnswer = async () => {
    if (!puzzle) return
    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ correct: boolean }>('/escape-mission', {
        action: 'answer',
        puzzleId: puzzle.id,
        attempt,
      })
      if (response.correct) {
        setFeedback('✅ Correct! Door unlocked.')
        setIsActive(false)
      } else {
        setFeedback('Keep trying — the AI says the lock is still closed.')
      }
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
      setAttempt('')
    }
  }

  const useHint = async () => {
    if (!puzzle) return
    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ hint: string }>('/escape-mission', {
        action: 'hint',
        puzzleId: puzzle.id,
      })
      setHintsUsed((prev) => prev + 1)
      setHintMessage(response.hint)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ActivityLayout title="AI Escape Mission" subtitle="Solve riddles with speech or text to beat the countdown.">
      <motion.div
        className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/70">
            Riddle: {puzzle?.riddle || 'Tap “Start mission” to receive a fresh puzzle.'}
          </p>
          <div className="rounded-full border border-white/20 px-4 py-1 text-xs text-white/70">
            Time left: <span className="font-semibold text-white">{timeLeft}s</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-midnight/40 p-4">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Mission status</span>
            <span>{isActive ? 'In progress' : 'Idle'}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={startMission}
            className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:border-white disabled:opacity-50"
            disabled={isLoading}
          >
            {isActive ? 'Regenerate mission' : 'Start mission'}
          </button>
          <button
            onClick={useHint}
            disabled={!isActive || hintsUsed >= 3 || isLoading}
            className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:border-white disabled:border-white/10 disabled:text-white/40"
          >
            Use hint ({hintsUsed}/3)
          </button>
        </div>
        <input
          className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
          placeholder="Say or type your answer"
          value={attempt}
          onChange={(e) => setAttempt(e.target.value)}
          disabled={!isActive || isLoading}
        />
        <button
          onClick={checkAnswer}
          className="rounded-xl bg-accent px-6 py-3 font-semibold text-white disabled:opacity-50"
          disabled={!isActive || isLoading}
        >
          Submit Answer
        </button>
        {hintMessage && <motion.p className="text-sm text-amber-200" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {hintMessage}
        </motion.p>}
        {feedback && (
          <motion.p className="text-white/80" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {feedback}
          </motion.p>
        )}
        {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}
      </motion.div>
    </ActivityLayout>
  )
}

export default EscapeMission
