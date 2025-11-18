import { useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'
import { motion } from 'framer-motion'

const genreOptions = ['fantasy', 'cyberpunk', 'romance', 'sports', 'mystery'] as const
const traitOptions = ['monster', 'evil', 'bad', 'normal', 'good', 'kind', 'saint'] as const
const plotOptions = ['world in danger', 'funny story', 'love story', 'magic', 'adventure'] as const
const endingOptions = ['Funny', 'Scary', 'Sad', 'Nonsense']

const StoryForge = () => {
  useClearLocalStorage(['story-forge-storage'])
  const [genre, setGenre] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [traits, setTraits] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(3)
  const [plot, setPlot] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [story, setStory] = useState<string>()
  const [grammarTips, setGrammarTips] = useState<string[]>([])
  const [endings, setEndings] = useState<string[]>([])
  const [starter, setStarter] = useState('Once upon a time in Bangkok, a curious kid...')
  const [isLoading, setIsLoading] = useState(false)
  const [endingMood, setEndingMood] = useState(endingOptions[0])
  const [isEndingLoading, setIsEndingLoading] = useState(false)

  const handleGenerate = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.post<{
        story: string
        grammarTips: string[]
        alternateEndings: string[]
      }>('/story-forge', { 
        genre: genreOptions[genre], 
        traits: traitOptions[traits], 
        plot: plotOptions[plot], 
        starter 
      })

      setStory(response.story)
      setGrammarTips(response.grammarTips || [])
      setEndings(response.alternateEndings || [])
    } catch (error) {
      setStory('Unable to generate story right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAlternateEnding = async () => {
    if (!story) return
    setIsEndingLoading(true)
    try {
      const response = await apiClient.post<{ ending: string }>('/story-ending', {
        story,
        mood: endingMood,
      })
      setEndings((prev) => [...prev, `${endingMood} ending: ${response.ending}`])
    } catch (error) {
      setEndings((prev) => [...prev, `${endingMood} ending: ${(error as Error).message}`])
    } finally {
      setIsEndingLoading(false)
    }
  }

  return (
    <ActivityLayout
      title="AI Story Forge"
      subtitle="Mini English writing lab where AI + students co-write short, fun stories."
    >
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-white/70">Skills: Writing · Creativity · Grammar</p>
          <p className="mt-1 text-sm text-white/80">
            Choose sliders for Genre, Traits, Plot, then let AI draft a 6–8 sentence story. Ask the AI grammar teacher
            for suggestions and remix the ending later.
          </p>
        </div>

        <motion.div
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
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
                className="text-sm uppercase tracking-[0.4em] text-sky mb-4 text-center"
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
                      className="text-lg font-bold text-primary capitalize px-3 py-1 rounded-lg bg-primary/10 border border-primary/30"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {genreOptions[genre]}
                    </motion.span>
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-primary/20 blur-xl -z-10"
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
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((genre + 1) / 5) * 100}%, rgba(255,255,255,0.1) ${((genre + 1) / 5) * 100}%, rgba(255,255,255,0.1) 100%)`,
                    }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <motion.div
                    className="absolute h-4 bg-primary/30 rounded-full blur-sm"
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
                className="text-sm uppercase tracking-[0.4em] text-sky mb-4 text-center"
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
                      className="text-lg font-bold text-primary capitalize px-3 py-1 rounded-lg bg-primary/10 border border-primary/30"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {traitOptions[traits]}
                    </motion.span>
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-primary/20 blur-xl -z-10"
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
                    className="absolute h-4 bg-primary/30 rounded-full blur-sm"
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
                className="text-sm uppercase tracking-[0.4em] text-sky mb-4 text-center"
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
                      className="text-lg font-bold text-primary capitalize px-3 py-1 rounded-lg bg-primary/10 border border-primary/30"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {plotOptions[plot]}
                    </motion.span>
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-primary/20 blur-xl -z-10"
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
                    className="absolute h-4 bg-primary/30 rounded-full blur-sm"
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

          <label className="block text-sm text-white/70 mt-6">
            Opening line
            <input
              className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
              value={starter}
              onChange={(e) => setStarter(e.target.value)}
            />
          </label>
        </motion.div>
        <button
          onClick={handleGenerate}
          className="rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/80 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Generating…' : 'Generate Story'}
        </button>
        {story && (
          <div className="space-y-4 rounded-2xl bg-midnight/50 p-4 text-white/80">
            <article className="space-y-2">
              <p className="text-sm uppercase tracking-[0.4em] text-sky">Story Draft</p>
              <p className="whitespace-pre-line">{story}</p>
            </article>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-white/20 p-3">
              <p className="text-sm text-white/70">Add a twist:</p>
              <div className="flex flex-wrap gap-2">
                {endingOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => setEndingMood(option)}
                    className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                      endingMood === option
                        ? 'bg-white text-midnight'
                        : 'border border-white/30 text-white/70 hover:border-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAlternateEnding}
                disabled={isEndingLoading}
                className="rounded-full bg-primary/80 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50"
              >
                {isEndingLoading ? 'Changing ending…' : `Change ending (${endingMood})`}
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/70">Grammar coach tips</p>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                  {grammarTips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/70">Alternate endings</p>
                <div className="mt-2 space-y-2 text-sm">
                  {endings.map((ending, index) => (
                    <p key={`${ending}-${index}`} className="rounded-lg bg-white/5 p-2">
                      {ending}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ActivityLayout>
  )
}

export default StoryForge
