import { useEffect, useMemo, useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { motion } from 'framer-motion'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

type Card = { level?: string; definition: string }

const VocabularyRPG = () => {
  useClearLocalStorage(['vocabulary-rpg-storage'])
  const [guess, setGuess] = useState('')
  const [xp, setXp] = useState(0)
  const [feedback, setFeedback] = useState<string>()
  const [streak, setStreak] = useState(0)
  const [lives, setLives] = useState(3)
  const [history, setHistory] = useState<Array<{ definition: string; correct: boolean }>>([])
  const [runId, setRunId] = useState<string | null>(null)
  const [card, setCard] = useState<Card | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const fetchCard = async () => {
    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ runId: string; card: Card }>('/vocabulary-rpg', {
        action: 'generate',
      })
      setRunId(response.runId)
      setCard(response.card)
      setGuess('')
      setFeedback(undefined)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCard()
  }, [])

  const checkWord = async () => {
    if (!runId || !card) {
      await fetchCard()
      return
    }
    if (!guess.trim()) {
      setFeedback('Type a guess first.')
      return
    }

    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ correct: boolean; xpEarned: number }>('/vocabulary-rpg', {
        action: 'answer',
        runId,
        answer: guess,
      })
      setFeedback(response.correct ? `Correct! +${response.xpEarned} XP` : 'Keep trying — listen again.')
      setHistory((prev) => [{ definition: card.definition, correct: response.correct }, ...prev.slice(0, 4)])
      if (response.correct) {
        setXp((prev) => prev + response.xpEarned)
        setStreak((prev) => prev + 1)
      } else {
        setLives((prev) => Math.max(prev - 1, 0))
        setStreak(0)
      }
      setGuess('')
      await fetchCard()
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const levelLabel = useMemo(() => {
    if (xp >= 80) return 'Scholar'
    if (xp >= 40) return 'Apprentice'
    return 'Rookie'
  }, [xp])

  return (
    <ActivityLayout
      title="AI Vocabulary RPG"
      subtitle="Level up ESL vocabulary by guessing words from AI definitions and audio prompts."
    >
      <motion.div
        className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-sm text-white/70">
          Level {card?.level || 'A2'} definition: {card?.definition || 'Loading definition…'}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
          <span>Lives: {'❤️'.repeat(lives) || '💔'}</span>
          <span>Streak: {streak}</span>
          <span>Rank: {levelLabel}</span>
        </div>
        <input
          className="w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
          placeholder="Type or speak the word"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
        />
        <button onClick={checkWord} className="rounded-xl bg-primary px-6 py-3 font-semibold text-white">
          {isLoading ? 'Checking…' : 'Submit Guess'}
        </button>
        {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}
        <div className="rounded-xl bg-midnight/50 p-4 text-sm text-white">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-sky">
            <span>XP: {xp}</span>
            <span>{levelLabel}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-primary"
              style={{ width: `${Math.min(xp, 100)}%` }}
            />
          </div>
          {feedback && <p>{feedback}</p>}
        </div>
        {history.length > 0 && (
          <motion.div
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/70"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm uppercase tracking-[0.35em] text-sky">Recent cards</p>
            <ul className="mt-2 space-y-1">
              {history.map((item, index) => (
                <li key={`${item.definition}-${index}`} className="flex items-center justify-between">
                  <span>{item.definition}</span>
                  <span className={item.correct ? 'text-emerald-300' : 'text-rose-300'}>
                    {item.correct ? '+10 xp' : 'miss'}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </motion.div>
    </ActivityLayout>
  )
}

export default VocabularyRPG
