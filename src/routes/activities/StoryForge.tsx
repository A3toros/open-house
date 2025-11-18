import { useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

const genreOptions = ['Fantasy', 'Cyberpunk', 'Romance', 'Sports', 'Mystery']
const traitOptions = ['Monster', 'Evil', 'Bad', 'Normal', 'Good', 'Kind', 'Saint']
const plotOptions = ['World in danger', 'Funny story', 'Love story', 'Magic', 'Adventure']
const endingOptions = ['Funny', 'Scary', 'Sad', 'Nonsense']

const StoryForge = () => {
  useClearLocalStorage(['story-forge-storage'])
  const [genre, setGenre] = useState(genreOptions[0])
  const [traits, setTraits] = useState(traitOptions[5])
  const [plot, setPlot] = useState(plotOptions[0])
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
      }>('/story-forge', { genre, traits, plot, starter })

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

        <div className="space-y-4 rounded-2xl border border-white/10 bg-midnight/50 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Genre</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {genreOptions.map((option) => (
                  <button
                    key={option}
                    className={`rounded-full px-3 py-1 text-sm ${
                      genre === option
                        ? 'bg-primary text-white'
                        : 'border border-white/20 text-white/70 hover:border-white'
                    }`}
                    onClick={() => setGenre(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Character Traits</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {traitOptions.map((option) => (
                  <button
                    key={option}
                    className={`rounded-full px-3 py-1 text-sm ${
                      traits === option
                        ? 'bg-primary text-white'
                        : 'border border-white/20 text-white/70 hover:border-white'
                    }`}
                    onClick={() => setTraits(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Plot</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {plotOptions.map((option) => (
                  <button
                    key={option}
                    className={`rounded-full px-3 py-1 text-sm ${
                      plot === option
                        ? 'bg-primary text-white'
                        : 'border border-white/20 text-white/70 hover:border-white'
                    }`}
                    onClick={() => setPlot(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <label className="block text-sm text-white/70">
            Opening line
            <input
              className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
              value={starter}
              onChange={(e) => setStarter(e.target.value)}
            />
          </label>
        </div>
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
