import { useMemo, useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { motion } from 'framer-motion'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'
import { useRecorder } from '../../hooks/useRecorder'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'

type Card = { level?: string; definition: string; word?: string }

const VocabularyRPG = () => {
  useClearLocalStorage(['vocabulary-rpg-storage'])
  const { isRecording, startRecording, stopRecording } = useRecorder()
  const [guess, setGuess] = useState('')
  const [xp, setXp] = useState(0)
  const [feedback, setFeedback] = useState<string>()
  const [streak, setStreak] = useState(0)
  const [lives, setLives] = useState(3)
  const [history, setHistory] = useState<Array<{ definition: string; correct: boolean }>>([])
  const [runId, setRunId] = useState<string | null>(null)
  const [card, setCard] = useState<Card | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

  const startGame = async () => {
    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ gameSessionId: string; cards: Array<{ runId: string; card: Card }> }>('/vocabulary-rpg', {
        action: 'start-game',
      })
      setGameSessionId(response.gameSessionId)
      setGameStarted(true)
      if (response.cards.length > 0) {
        setRunId(response.cards[0].runId)
        setCard(response.cards[0].card)
      }
      setGuess('')
      setFeedback(undefined)
      setXp(0)
      setStreak(0)
      setLives(3)
      setHistory([])
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNextCard = async () => {
    if (!gameSessionId) return
    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ runId: string; card: Card }>('/vocabulary-rpg', {
        action: 'get-next',
        gameSessionId,
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

  const handleSpeak = async () => {
    if (!gameStarted) return
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
          setGuess(transcribedText)
          await checkWord(transcribedText)
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

  const checkWord = async (answerText?: string) => {
    if (!runId || !card) {
      if (gameStarted) {
        await fetchNextCard()
      }
      return
    }
    
    const answer = answerText || guess.trim()
    if (!answer) {
      setFeedback('Type or speak a guess first.')
      return
    }

    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ correct: boolean; xpEarned: number }>('/vocabulary-rpg', {
        action: 'answer',
        runId,
        answer: answer,
      })
      setFeedback(response.correct ? `Correct! +${response.xpEarned} XP` : 'Keep trying!')
      setHistory((prev) => [{ definition: card.definition, correct: response.correct }, ...prev.slice(0, 4)])
      if (response.correct) {
        setXp((prev) => prev + response.xpEarned)
        setStreak((prev) => prev + 1)
      } else {
        setLives((prev) => Math.max(prev - 1, 0))
        setStreak(0)
      }
      setGuess('')
      await fetchNextCard()
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
        {!gameStarted ? (
          <button
            onClick={startGame}
            className="w-full rounded-xl bg-accent px-6 py-3 font-semibold text-white disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Starting game…' : 'Start Game'}
          </button>
        ) : (
          <>
            <p className="text-sm text-white/70">
              Level {card?.level || 'A2'} definition: {card?.definition || 'Loading definition…'}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span>Lives: {'❤️'.repeat(lives) || '💔'}</span>
              <span>Streak: {streak}</span>
              <span>Rank: {levelLabel}</span>
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
                placeholder="Type or speak the word"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && checkWord()}
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
                {isRecording ? '⏹️ Stop' : isTranscribing ? '🎤 Processing…' : '🎤 Speak'}
              </button>
            </div>
            <button
              onClick={() => checkWord()}
              className="w-full rounded-xl bg-primary px-6 py-3 font-semibold text-white disabled:opacity-50"
              disabled={isLoading || !guess.trim()}
            >
              {isLoading ? 'Checking…' : 'Submit Guess'}
            </button>
          </>
        )}
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
