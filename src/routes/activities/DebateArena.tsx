import { useCallback, useEffect, useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { useRecorder } from '../../hooks/useRecorder'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'
import { readLocalJson, writeLocalJson } from '../../utils/storage'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

const prompts = [
  'Should robots replace teachers?',
  'Homework: necessary or outdated?',
  'Is AI dangerous or helpful?',
  'Should uniforms be required in school?',
  'Is gaming a real sport?',
  'Should homework be banned on weekends?',
  'Can AI be a fair judge in competitions?',
  'Should zoos still exist?',
  'Do teens need phones in class?',
  'Will virtual reality replace field trips?',
  'Should plastic water bottles be banned?',
  'Is space tourism a good idea?',
  'Should students choose their own teachers?',
]

type DebateTurn = {
  id: string
  transcript: string
  rebuttal: string
  createdAt: string
}

const STORAGE_KEY = 'debateArenaHistory'

const DebateArena = () => {
  useClearLocalStorage([STORAGE_KEY])
  const { isRecording, startRecording, stopRecording } = useRecorder()
  const [prompt, setPrompt] = useState(prompts[0])
  const [conversation, setConversation] = useState<DebateTurn[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [speechEnabled] = useState(true)

  useEffect(() => {
    const history = readLocalJson<Record<string, DebateTurn[]>>(STORAGE_KEY, {})
    setConversation(history[prompt] || [])
  }, [prompt])

  useEffect(() => {
    const history = readLocalJson<Record<string, DebateTurn[]>>(STORAGE_KEY, {})
    history[prompt] = conversation
    writeLocalJson(STORAGE_KEY, history)
  }, [conversation, prompt])

  const speakText = useCallback(
    (text: string) => {
      if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis || !text) return
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    },
    [speechEnabled],
  )

  useEffect(() => {
    if (conversation.length === 0) return
    const lastTurn = conversation[conversation.length - 1]
    speakText(lastTurn.rebuttal)
  }, [conversation, speakText])

  const randomizePrompt = () => {
    const next = prompts[Math.floor(Math.random() * prompts.length)]
    setPrompt(next)
  }

  const submitArgument = async () => {
    if (loading) return
    setLoading(true)
    setErrorMessage(undefined)
    try {
      const blob = ensureAudioAvailable(await stopRecording())
      const audioPayload = await toBase64(blob)

      const response = await apiClient.post<{
        result: {
          rebuttal: string
        }
        transcript?: string
      }>('/debate-arena', {
        prompt,
        audioBlob: audioPayload,
        mimeType: 'audio/webm',
      })

      const resolvedTranscript = response.transcript || '(transcribed audio)'
      const newTurn: DebateTurn = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        transcript: resolvedTranscript,
        rebuttal: response.result.rebuttal,
        createdAt: new Date().toISOString(),
      }

      setConversation((prev) => [...prev, newTurn])
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ActivityLayout
      title="AI Debate Arena"
      subtitle="Rapid-fire debate coach: speak (or type) your stance, let AI rebut, then go again."
    >
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-white/70">Current prompt:</span>
          <select
            className="rounded-xl border border-white/20 bg-midnight/50 px-3 py-2 text-white"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          >
            {prompts.map((p) => (
              <option key={p} value={p} className="bg-midnight">
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={randomizePrompt}
            className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-wide text-white/80"
          >
            Randomize prompt
          </button>
        </div>
        <div className="space-y-3 rounded-2xl border border-white/10 bg-midnight/40 p-4">
          <div className="flex flex-wrap gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="rounded-full border border-white/30 px-4 py-2 text-xs uppercase tracking-wide text-white/80 hover:border-white disabled:opacity-50"
                disabled={loading}
              >
                🎙 Start recording
              </button>
            ) : (
              <button
                onClick={submitArgument}
                className="rounded-full bg-rose-500/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                disabled={loading}
              >
                ⏹ Stop & send to AI
              </button>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-transparent" />
                Waiting for AI reply…
              </div>
            )}
          </div>
          {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}
        </div>
        {conversation.length > 0 ? (
          <div className="space-y-4 rounded-2xl bg-midnight/50 p-4">
            {conversation.map((turn) => (
              <div key={turn.id} className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4 text-white/80">
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-sky">
                    <span>Student</span>
                    <span className="text-white/50">{new Date(turn.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-2 text-sm">{turn.transcript}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <p className="text-xs uppercase tracking-[0.4em] text-sky">AI rebuttal</p>
                  <p className="mt-1 text-sm">{turn.rebuttal}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => speakText(turn.rebuttal)}
                      className="rounded-full border border-white/30 px-3 py-1 text-xs text-white/70 hover:border-white"
                    >
                      🔊 Replay AI audio
                    </button>
                    {!isRecording && !loading && (
                      <button
                        onClick={startRecording}
                        className="rounded-full bg-emerald-500/80 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        💬 Reply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/60">No debate turns yet. Record your first argument to begin.</p>
        )}
      </div>
    </ActivityLayout>
  )
}

export default DebateArena
