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
  const [feedback, setFeedback] = useState<string>()
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null)
  const [lives, setLives] = useState(3)
  const [wordsAnswered, setWordsAnswered] = useState(0)
  const [history, setHistory] = useState<Array<{ definition: string; correct: boolean; word: string }>>([])
  const [runId, setRunId] = useState<string | null>(null)
  const [card, setCard] = useState<Card | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [gameSessionId, setGameSessionId] = useState<string | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [totalXP, setTotalXP] = useState(0)
  const [difficulty, setDifficulty] = useState<'normal' | 'difficult'>('normal')

  const startGame = async () => {
    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ gameSessionId: string; cards: Array<{ runId: string; card: Card }> }>('/vocabulary-rpg', {
        action: 'start-game',
        difficulty,
      })
      setGameSessionId(response.gameSessionId)
      setGameStarted(true)
      if (response.cards.length > 0) {
        setRunId(response.cards[0].runId)
        setCard(response.cards[0].card)
      }
      setGuess('')
      setFeedback(undefined)
      setFeedbackType(null)
      setTotalXP(0)
      setLives(3)
      setWordsAnswered(0)
      setHistory([])
      setGameOver(false)
      setGameWon(false)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNextCard = async () => {
    if (!gameSessionId || gameWon || gameOver) return // Don't fetch if game is already won/over
    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ runId: string | null; card: Card | null; gameComplete?: boolean }>('/vocabulary-rpg', {
        action: 'get-next',
        gameSessionId,
      })
      // Only mark as complete if we've actually answered 10 words
      // Double-check: wordsAnswered state might not be updated yet, so we check >= 10
      if ((response.gameComplete || !response.runId || !response.card)) {
        // Only set game won if we've answered 10 words - otherwise it's an error
        if (wordsAnswered >= 10 && lives > 0) {
          setGameWon(true)
        } else {
          setErrorMessage('No more cards available. Please start a new game.')
        }
        return
      }
      setRunId(response.runId)
      setCard(response.card)
      setGuess('')
      setFeedback(undefined)
      setFeedbackType(null)
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
      setFeedbackType(null)
      return
    }

    setIsLoading(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ 
        correct: boolean
        xpEarned: number
        correctWord: string
      }>('/vocabulary-rpg', {
        action: 'answer',
        runId,
        answer: answer,
      })
      
      // Track words answered in frontend state
      const newWordsAnswered = wordsAnswered + 1
      
      // Update lives first to get accurate count
      let newLives = lives
      if (!response.correct) {
        newLives = Math.max(lives - 1, 0)
        setLives(newLives)
        
        // Check if game over (no lives left)
        if (newLives === 0) {
          setFeedback(`❌ Incorrect! The correct word is "${response.correctWord}". You lost 1 life.`)
          setFeedbackType('incorrect')
          setHistory((prev) => [{ 
            definition: card.definition, 
            correct: false,
            word: response.correctWord
          }, ...prev.slice(0, 9)])
          setWordsAnswered(newWordsAnswered)
          setGameOver(true)
          setGuess('')
          return
        }
      }
      
      if (response.correct) {
        setFeedback(`✅ Correct! The word is "${response.correctWord}". +${response.xpEarned} XP`)
        setFeedbackType('correct')
        setTotalXP((prev) => prev + response.xpEarned)
        setHistory((prev) => [{ 
          definition: card.definition, 
          correct: true,
          word: response.correctWord
        }, ...prev.slice(0, 9)])
      } else {
        setFeedback(`❌ Incorrect! The correct word is "${response.correctWord}". You lost 1 life.`)
        setFeedbackType('incorrect')
        setHistory((prev) => [{ 
          definition: card.definition, 
          correct: false,
          word: response.correctWord
        }, ...prev.slice(0, 9)])
      }
      
      // Update words answered AFTER processing feedback
      setWordsAnswered(newWordsAnswered)
      setGuess('')
      
      // Check if game won (all 10 words answered with lives remaining)
      // Use local variable newWordsAnswered (not state) since state updates are async
      if (newWordsAnswered >= 10 && newLives > 0) {
        setGameWon(true)
        return // Don't fetch next card if game is won
      }
      
      // Get next card if game continues (only if we haven't won and haven't lost)
      if (!gameOver && newWordsAnswered < 10) {
        await fetchNextCard()
      }
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const getRank = (xp: number): string => {
    if (xp >= 100) return 'Master Wizard'
    if (xp >= 90) return 'Sorcerer'
    if (xp >= 80) return 'Enchanter'
    if (xp >= 70) return 'Mage'
    if (xp >= 60) return 'Wizard'
    if (xp >= 50) return 'Scholar'
    if (xp >= 40) return 'Student'
    if (xp >= 30) return 'Learner'
    if (xp >= 20) return 'Novice'
    if (xp >= 10) return 'Beginner'
    return 'Apprentice'
  }

  const levelLabel = useMemo(() => getRank(totalXP), [totalXP])

  return (
    <ActivityLayout
      title="AI Vocabulary RPG"
      subtitle="Level up ESL vocabulary by guessing words from AI definitions and audio prompts."
    >
      <motion.div
        className="space-y-4 rounded-2xl border border-[#11E0FF]/30 bg-[#1E2A49] p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {!gameStarted ? (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-[#11E0FF] text-lg font-semibold mb-2">Choose Difficulty Level:</p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDifficulty('normal')}
                  className={`px-6 py-3 rounded-lg font-bold transition ${
                    difficulty === 'normal'
                      ? 'bg-gradient-to-r from-[#11E0FF] to-[#4DD0E1] text-white shadow-[0_0_20px_rgba(17,224,255,0.6)]'
                      : 'bg-[#1C2340] text-[#11E0FF] border-2 border-[#11E0FF]/30 hover:border-[#11E0FF]/50'
                  }`}
                >
                  ⭐ Normal
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDifficulty('difficult')}
                  className={`px-6 py-3 rounded-lg font-bold transition ${
                    difficulty === 'difficult'
                      ? 'bg-gradient-to-r from-[#FFB743] to-[#FF8C42] text-white shadow-[0_0_20px_rgba(255,183,67,0.6)]'
                      : 'bg-[#1C2340] text-[#FFB743] border-2 border-[#FFB743]/30 hover:border-[#FFB743]/50'
                  }`}
                >
                  🔥 Difficult
                </motion.button>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="w-full rounded-xl bg-gradient-to-r from-[#11E0FF]/30 to-[#9B5BFF]/30 border-2 border-[#11E0FF]/50 px-8 py-4 font-bold text-white disabled:opacity-50 hover:from-[#11E0FF]/40 hover:to-[#9B5BFF]/40 hover:shadow-[0_0_30px_rgba(17,224,255,0.6)] transition text-lg"
              style={{ textShadow: '0 0 10px rgba(17, 224, 255, 0.8)' }}
              disabled={isLoading}
            >
              {isLoading ? '🚀 Starting your adventure…' : '🎮 Start Your Vocabulary Adventure!'}
            </motion.button>
          </div>
        ) : gameOver ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <h3 className="text-2xl font-bold text-red-400">💔 Game Over!</h3>
            <p className="text-white/80">You ran out of lives.</p>
            <p className="text-lg text-[#11E0FF]">Final Score: {totalXP} XP</p>
            <p className="text-lg text-[#11E0FF]">Rank: {levelLabel}</p>
            <p className="text-white/70">Words answered: {wordsAnswered}/10</p>
            <button
              onClick={startGame}
              className="w-full rounded-xl bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 px-6 py-3 font-semibold text-[#11E0FF] hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] transition"
              style={{ textShadow: '0 0 8px rgba(17, 224, 255, 0.6)' }}
            >
              Play Again
            </button>
          </motion.div>
        ) : gameWon ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <h3 className="text-3xl font-bold text-[#11E0FF]" style={{ textShadow: '0 0 15px rgba(17, 224, 255, 0.6)' }}>
              🎉 Congratulations!
            </h3>
            <p className="text-xl text-white/90">You completed all 10 words!</p>
            <div className="rounded-xl bg-[#1C2340] border border-[#11E0FF]/30 p-6 space-y-3">
              <p className="text-2xl font-bold text-[#11E0FF]">XP Earned: {totalXP}</p>
              <p className="text-xl font-semibold text-white">Rank: {levelLabel}</p>
              <div className="flex items-center justify-center gap-2 text-lg text-white/80">
                <span>Lives remaining:</span>
                <span className="text-2xl">{'❤️'.repeat(lives)}</span>
              </div>
            </div>
            <button
              onClick={startGame}
              className="w-full rounded-xl bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 px-6 py-3 font-semibold text-[#11E0FF] hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] transition"
              style={{ textShadow: '0 0 8px rgba(17, 224, 255, 0.6)' }}
            >
              Play Again
            </button>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-gradient-to-r from-[#11E0FF]/20 to-[#9B5BFF]/20 border-2 border-[#11E0FF]/30 p-4 mb-4"
            >
              <p className="text-lg font-semibold text-white leading-relaxed">
                {card?.definition || 'Loading definition…'}
              </p>
            </motion.div>
            
            <div className="flex flex-wrap items-center gap-4 text-base">
              {/* Lives with animation */}
              <div className="flex items-center gap-2">
                <span className="text-white/80 font-semibold">Lives:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((lifeNum) => (
                    <motion.span
                      key={lifeNum}
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{
                        scale: lifeNum <= lives ? 1 : 0,
                        opacity: lifeNum <= lives ? 1 : 0,
                        rotate: lifeNum <= lives ? 0 : 360,
                      }}
                      transition={{
                        duration: 0.5,
                        ease: "easeInOut"
                      }}
                      className="text-2xl"
                    >
                      ❤️
                    </motion.span>
                  ))}
                </div>
              </div>
              
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="px-3 py-1 rounded-full bg-[#11E0FF]/20 border border-[#11E0FF]/50"
              >
                <span className="text-[#11E0FF] font-bold">Words: {wordsAnswered}/10</span>
              </motion.div>
              
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="px-3 py-1 rounded-full bg-[#9B5BFF]/20 border border-[#9B5BFF]/50"
              >
                <span className="text-[#9B5BFF] font-bold">Rank: {levelLabel}</span>
              </motion.div>
        </div>
            <div className="flex gap-3">
              <motion.input
                whileFocus={{ scale: 1.02 }}
                className="flex-1 rounded-xl border-2 border-[#11E0FF]/30 bg-[#1C2340]/50 px-4 py-3 text-white placeholder-white/50 focus:border-[#11E0FF] focus:bg-[#1C2340] focus:outline-none focus:ring-2 focus:ring-[#11E0FF]/50 transition"
                placeholder="✨ Type your guess here..."
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && checkWord()}
                disabled={isLoading || isRecording}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSpeak}
                className={`rounded-xl px-5 py-3 font-bold text-white transition ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                    : 'bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)] text-[#11E0FF]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isLoading || isTranscribing}
              >
                {isRecording ? '⏹️ Stop' : isTranscribing || isLoading ? '🤔 Thinking...' : '🎤 Speak'}
              </motion.button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => checkWord()}
              className="w-full rounded-xl bg-gradient-to-r from-[#11E0FF]/30 to-[#9B5BFF]/30 border-2 border-[#11E0FF]/50 px-6 py-4 font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#11E0FF]/40 hover:to-[#9B5BFF]/40 hover:shadow-[0_0_25px_rgba(17,224,255,0.6)] transition"
              style={{ textShadow: '0 0 10px rgba(17, 224, 255, 0.8)' }}
              disabled={isLoading || isTranscribing || !guess.trim()}
            >
              {isLoading ? '🤔 Thinking...' : '🚀 Submit My Guess!'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchNextCard}
              className="w-full mt-3 rounded-xl bg-[#9B5BFF]/20 border-2 border-[#9B5BFF]/50 px-4 py-3 font-semibold text-[#9B5BFF] hover:bg-[#9B5BFF]/30 hover:shadow-[0_0_20px_rgba(155,91,255,0.5)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ textShadow: '0 0 8px rgba(155, 91, 255, 0.6)' }}
              disabled={isLoading || isTranscribing}
            >
              ⏭️ Skip Word
            </motion.button>
          </>
        )}
        {errorMessage && (
          <motion.p
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-base text-red-300 font-semibold bg-red-500/20 border border-red-500/30 rounded-xl p-3"
          >
            ⚠️ {errorMessage}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-br from-[#1E2A49] to-[#1C2340] border-2 border-[#11E0FF]/30 p-5 shadow-[0_0_30px_rgba(17,224,255,0.2)]"
        >
          <div className="flex items-center justify-between mb-3">
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="text-lg font-bold text-[#11E0FF]"
              style={{ textShadow: '0 0 10px rgba(17, 224, 255, 0.6)' }}
            >
              ⭐ XP: {totalXP}
            </motion.span>
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              className="text-lg font-bold text-[#9B5BFF]"
              style={{ textShadow: '0 0 10px rgba(155, 91, 255, 0.6)' }}
            >
              🏆 {levelLabel}
            </motion.span>
          </div>
          <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(totalXP, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-[#11E0FF] to-[#9B5BFF] shadow-[0_0_10px_rgba(17,224,255,0.5)]"
            />
          </div>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`mt-4 p-3 rounded-xl font-bold text-lg ${
                feedbackType === 'correct' 
                  ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300' 
                  : feedbackType === 'incorrect' 
                  ? 'bg-red-500/20 border-2 border-red-400 text-red-300' 
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {feedback}
            </motion.div>
          )}
        </motion.div>
        {history.length > 0 && (
          <motion.div
            className="rounded-2xl border-2 border-[#11E0FF]/30 bg-gradient-to-br from-[#1C2340] to-[#1E2A49] p-5 shadow-[0_0_20px_rgba(17,224,255,0.1)]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-base font-bold text-[#11E0FF] mb-3" style={{ textShadow: '0 0 8px rgba(17, 224, 255, 0.5)' }}>
              📚 Your Recent Words
            </p>
            <ul className="space-y-2">
              {history.map((item, index) => (
                <motion.li
                  key={`${item.definition}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <span className="flex-1 text-white/80 text-sm">{item.definition}</span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className={`ml-3 font-bold text-sm ${
                      item.correct ? 'text-emerald-300' : 'text-red-300'
                    }`}
                  >
                    {item.correct ? '✅' : '❌'} {item.word}
                  </motion.span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
        {gameStarted && !gameOver && !gameWon && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setGameOver(true)
              setGameStarted(false)
            }}
            className="w-full mt-4 rounded-xl bg-[#FF6B6B]/20 border-2 border-[#FF6B6B]/50 px-6 py-4 font-semibold text-[#FF6B6B] hover:bg-[#FF6B6B]/30 hover:shadow-[0_0_20px_rgba(255,107,107,0.5)] transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ textShadow: '0 0 8px rgba(255, 107, 107, 0.6)' }}
            disabled={isLoading || isTranscribing}
          >
            🛑 End Game
          </motion.button>
        )}
      </motion.div>
    </ActivityLayout>
  )
}

export default VocabularyRPG
