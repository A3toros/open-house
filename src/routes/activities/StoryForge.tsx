import { useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'
import { useRecorder } from '../../hooks/useRecorder'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'
import { motion } from 'framer-motion'

const genreOptions = ['fantasy', 'cyberpunk', 'romance', 'sports', 'mystery'] as const
const traitOptions = ['monster', 'evil', 'bad', 'normal', 'good', 'kind', 'saint'] as const
const plotOptions = ['world in danger', 'funny story', 'love story', 'magic', 'adventure'] as const
const endingOptions = ['Funny', 'Scary', 'Sad', 'Nonsense']

const StoryForge = () => {
  useClearLocalStorage(['story-forge-storage'])
  const { isRecording, startRecording, stopRecording } = useRecorder()
  const [genre, setGenre] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [traits, setTraits] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(3)
  const [plot, setPlot] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [story, setStory] = useState<string>()
  const [grammarTips, setGrammarTips] = useState<string[]>([])
  const [writingTips, setWritingTips] = useState<string[]>([])
  const [starter, setStarter] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isChangingEnding, setIsChangingEnding] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.post<{
        story: string
        grammarTips: string[]
        writingTips: string[]
      }>('/story-forge', { 
        genre: genreOptions[genre], 
        traits: traitOptions[traits], 
        plot: plotOptions[plot], 
        starter 
      })

      setStory(response.story)
      setGrammarTips(response.grammarTips || [])
      setWritingTips(response.writingTips || [])
    } catch (error) {
      setStory('Unable to generate story right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeEnding = async (mood: string) => {
    if (!story) return
    setIsChangingEnding(true)
    setErrorMessage(undefined)
    try {
      const response = await apiClient.post<{ story: string }>('/story-forge', {
        action: 'change-ending',
        story,
        mood,
      })
      setStory(response.story)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsChangingEnding(false)
    }
  }

  const handleSpeak = async () => {
    setErrorMessage(undefined)
    
    if (isRecording) {
      try {
        setIsTranscribing(true)
        const blob = ensureAudioAvailable(await stopRecording())
        const base64 = await toBase64(blob)
        
        // Transcribe audio
        const transcriptResponse = await apiClient.post<{ transcript: string }>('/story-forge', {
          action: 'transcribe',
          audioBlob: base64,
        })
        
        const transcribedText = transcriptResponse.transcript || ''
        if (transcribedText) {
          setStarter(transcribedText)
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
    <ActivityLayout
      title="AI Story Maker"
      subtitle="Mini English writing lab where AI + students co-write short, fun stories."
    >
      <div className="space-y-4 rounded-2xl border border-[#11E0FF]/30 bg-[#1E2A49] p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-[#11E0FF]" style={{ textShadow: '0 0 10px rgba(17, 224, 255, 0.8), 0 0 20px rgba(17, 224, 255, 0.5)' }}>Skills: Writing · Creativity · Grammar</p>
          <p className="mt-1 text-sm text-white/80">
            Choose sliders for Genre, Traits, Plot, then let AI draft a 6–8 sentence story. Ask the AI grammar teacher
            for suggestions and remix the ending later.
          </p>
        </div>

        <motion.div
          className="space-y-4 rounded-2xl border border-[#11E0FF]/20 bg-[#1C2340] p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-6">
            {/* Genre Slider */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="max-w-md mx-auto"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm uppercase tracking-[0.4em] text-[#11E0FF] mb-4 text-center"
              >
                Genre
              </motion.p>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-white/70">Genre</label>
                  <motion.div
                    key={genre}
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 400, 
                      damping: 15,
                      duration: 0.5
                    }}
                    className="relative"
                  >
                    <motion.span
                      className="text-lg font-bold text-[#11E0FF] capitalize px-3 py-1 rounded-lg bg-[#11E0FF]/10 border border-[#11E0FF]/30"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ textShadow: '0 0 8px rgba(17, 224, 255, 0.6)' }}
                    >
                      {genreOptions[genre]}
                    </motion.span>
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-[#11E0FF]/20 blur-xl -z-10"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  </motion.div>
                </div>
                <div className="relative px-2">
                  <motion.div
                    className="absolute inset-x-2 h-4 bg-white/10 rounded-full"
                    initial={false}
                    animate={{
                      background: `linear-gradient(to right, #11E0FF 0%, #11E0FF ${((genre + 1) / 5) * 100}%, rgba(255,255,255,0.1) ${((genre + 1) / 5) * 100}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <motion.div
                    className="absolute h-4 bg-[#11E0FF]/30 rounded-full blur-sm"
                    style={{
                      width: `${((genre + 1) / 5) * 100}%`,
                      left: '8px',
                    }}
                    animate={{
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={genre}
                    onChange={(e) => setGenre(Number(e.target.value) as 0 | 1 | 2 | 3 | 4)}
                    className="relative w-full h-4 bg-transparent rounded-full appearance-none cursor-pointer range-slider z-10"
                  />
                </div>
                <div className="flex justify-between text-xs px-2">
                  {genreOptions.map((option, index) => (
                    <motion.button
                      key={option}
                      onClick={() => setGenre(index as 0 | 1 | 2 | 3 | 4)}
                      initial={false}
                      animate={{
                        color: genre === index ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                        scale: genre === index ? 1.15 : 1,
                        y: genre === index ? -2 : 0,
                      }}
                      whileHover={{ scale: 1.1, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className={`capitalize font-medium ${genre === index ? 'font-bold' : ''}`}
                  >
                    {option}
                    </motion.button>
                ))}
              </div>
            </div>
            </motion.div>

            {/* Character Traits Slider */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}
              className="max-w-md mx-auto"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-sm uppercase tracking-[0.4em] text-[#11E0FF] mb-4 text-center"
              >
                Character Traits
              </motion.p>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-white/70">Traits</label>
                  <motion.div
                    key={traits}
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 400, 
                      damping: 15,
                      duration: 0.5
                    }}
                    className="relative"
                  >
                    <motion.span
                      className="text-lg font-bold text-[#11E0FF] capitalize px-3 py-1 rounded-lg bg-[#11E0FF]/10 border border-[#11E0FF]/30"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {traitOptions[traits]}
                    </motion.span>
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-[#11E0FF]/20 blur-xl -z-10"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  </motion.div>
                </div>
                <div className="relative px-2">
                  <motion.div
                    className="absolute inset-x-2 h-4 bg-white/10 rounded-full"
                    initial={false}
                    animate={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((traits + 1) / 7) * 100}%, rgba(255,255,255,0.1) ${((traits + 1) / 7) * 100}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <motion.div
                    className="absolute h-4 bg-[#11E0FF]/30 rounded-full blur-sm"
                    style={{
                      width: `${((traits + 1) / 7) * 100}%`,
                      left: '8px',
                    }}
                    animate={{
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="6"
                    step="1"
                    value={traits}
                    onChange={(e) => setTraits(Number(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
                    className="relative w-full h-4 bg-transparent rounded-full appearance-none cursor-pointer range-slider z-10"
                  />
                </div>
                <div className="flex justify-between text-xs px-2">
                  {traitOptions.map((option, index) => (
                    <motion.button
                      key={option}
                      onClick={() => setTraits(index as 0 | 1 | 2 | 3 | 4 | 5 | 6)}
                      initial={false}
                      animate={{
                        color: traits === index ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                        scale: traits === index ? 1.15 : 1,
                        y: traits === index ? -2 : 0,
                      }}
                      whileHover={{ scale: 1.1, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className={`capitalize font-medium ${traits === index ? 'font-bold' : ''}`}
                  >
                    {option}
                    </motion.button>
                ))}
              </div>
            </div>
            </motion.div>

            {/* Plot Slider */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
              className="max-w-md mx-auto"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm uppercase tracking-[0.4em] text-[#11E0FF] mb-4 text-center"
              >
                Plot
              </motion.p>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm text-white/70">Plot</label>
                  <motion.div
                    key={plot}
                    initial={{ scale: 0, rotate: -180, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 400, 
                      damping: 15,
                      duration: 0.5
                    }}
                    className="relative"
                  >
                    <motion.span
                      className="text-lg font-bold text-[#11E0FF] capitalize px-3 py-1 rounded-lg bg-[#11E0FF]/10 border border-[#11E0FF]/30"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {plotOptions[plot]}
                    </motion.span>
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-[#11E0FF]/20 blur-xl -z-10"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  </motion.div>
                </div>
                <div className="relative px-2">
                  <motion.div
                    className="absolute inset-x-2 h-4 bg-white/10 rounded-full"
                    initial={false}
                    animate={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((plot + 1) / 5) * 100}%, rgba(255,255,255,0.1) ${((plot + 1) / 5) * 100}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <motion.div
                    className="absolute h-4 bg-[#11E0FF]/30 rounded-full blur-sm"
                    style={{
                      width: `${((plot + 1) / 5) * 100}%`,
                      left: '8px',
                    }}
                    animate={{
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={plot}
                    onChange={(e) => setPlot(Number(e.target.value) as 0 | 1 | 2 | 3 | 4)}
                    className="relative w-full h-4 bg-transparent rounded-full appearance-none cursor-pointer range-slider z-10"
                  />
                </div>
                <div className="flex justify-between text-xs px-2">
                  {plotOptions.map((option, index) => (
                    <motion.button
                      key={option}
                      onClick={() => setPlot(index as 0 | 1 | 2 | 3 | 4)}
                      initial={false}
                      animate={{
                        color: plot === index ? '#3b82f6' : 'rgba(255,255,255,0.5)',
                        scale: plot === index ? 1.15 : 1,
                        y: plot === index ? -2 : 0,
                      }}
                      whileHover={{ scale: 1.1, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      className={`capitalize font-medium ${plot === index ? 'font-bold' : ''}`}
                  >
                    {option}
                    </motion.button>
                ))}
              </div>
            </div>
            </motion.div>
          </div>

          <div className="mt-6">
            <label className="block text-sm text-white/70 mb-2">
            Opening line
            </label>
            <div className="flex gap-2">
            <input
                className="flex-1 rounded-xl border border-[#11E0FF]/30 bg-[#1C2340] px-3 py-2 text-white placeholder:text-white/40 focus:border-[#11E0FF] focus:outline-none focus:ring-2 focus:ring-[#11E0FF]/20"
              value={starter}
              onChange={(e) => setStarter(e.target.value)}
                placeholder="Type or speak your opening line..."
              />
              <button
                onClick={handleSpeak}
                disabled={isTranscribing}
                className={`rounded-xl px-4 py-2 font-semibold text-white transition ${
                  isRecording
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)]'
                } disabled:opacity-50`}
              >
                {isTranscribing ? 'Transcribing...' : isRecording ? 'Stop' : 'Speak'}
              </button>
            </div>
            {errorMessage && (
              <p className="mt-2 text-sm text-rose-400">{errorMessage}</p>
            )}
        </div>
        </motion.div>
        <button
          onClick={handleGenerate}
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/80 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Generating…' : 'Generate Story'}
        </button>
        {story && (
          <div className="space-y-4 rounded-2xl bg-[#1E2A49] p-4 text-white/80 border border-[#11E0FF]/20">
            <article className="space-y-2">
              <p className="text-sm uppercase tracking-[0.4em] text-[#11E0FF]" style={{ textShadow: '0 0 10px rgba(17, 224, 255, 0.5)' }}>Story Draft</p>
              <p className="whitespace-pre-line">{story}</p>
            </article>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[#11E0FF]/30 bg-[#11E0FF]/5 p-4">
              <p className="text-sm font-semibold text-[#11E0FF]" style={{ textShadow: '0 0 8px rgba(17, 224, 255, 0.6)' }}>
                ✨ Change Ending:
              </p>
              <div className="flex flex-wrap gap-2">
                {endingOptions.map((option) => {
                  const colors = {
                    Funny: 'from-[#FFB743] to-[#FF8C42] border-[#FFB743]/50',
                    Scary: 'from-[#9B5BFF] to-[#C77DFF] border-[#9B5BFF]/50',
                    Sad: 'from-[#11E0FF] to-[#4DD0E1] border-[#11E0FF]/50',
                    Nonsense: 'from-[#11E0FF] to-[#9B5BFF] border-[#11E0FF]/50',
                  }
                  const optionColors = colors[option as keyof typeof colors] || 'from-[#11E0FF] to-[#4DD0E1] border-[#11E0FF]/50'
                  
                  return (
                  <button
                    key={option}
                      onClick={() => handleChangeEnding(option)}
                      disabled={isChangingEnding}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all transform ${
                        isChangingEnding
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:scale-110 hover:shadow-lg active:scale-95'
                      } bg-gradient-to-r ${optionColors} border-2 text-white shadow-lg`}
                      style={{
                        textShadow: '0 0 4px rgba(0, 0, 0, 0.5)',
                        boxShadow: isChangingEnding 
                          ? 'none' 
                          : `0 0 12px ${option === 'Funny' ? 'rgba(255, 183, 67, 0.5)' : option === 'Scary' ? 'rgba(155, 91, 255, 0.5)' : option === 'Sad' ? 'rgba(17, 224, 255, 0.5)' : 'rgba(17, 224, 255, 0.5)'}`,
                      }}
                  >
                    {option}
                  </button>
                  )
                })}
              </div>
              {isChangingEnding && (
                <motion.span 
                  className="text-xs font-semibold text-[#11E0FF]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ textShadow: '0 0 8px rgba(17, 224, 255, 0.8)' }}
                >
                  ✨ Changing ending...
                </motion.span>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-[#11E0FF]/20 bg-[#1C2340] p-4">
                <p className="text-sm text-[#11E0FF] font-semibold">Grammar coach tips</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                  {grammarTips.map((tip, index) => (
                    <li key={`grammar-${index}`}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[#9B5BFF]/20 bg-[#1C2340] p-4">
                <p className="text-sm text-[#9B5BFF] font-semibold">Writing tips</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                  {writingTips.map((tip, index) => (
                    <li key={`writing-${index}`}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </ActivityLayout>
  )
}

export default StoryForge
