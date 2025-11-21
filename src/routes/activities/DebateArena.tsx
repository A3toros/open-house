import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { useRecorder } from '../../hooks/useRecorder'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'
import { readLocalJson, writeLocalJson } from '../../utils/storage'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

const prompts = [
  'Should every kid have a robot friend?',
  'Is a flying car better than a normal car?',
  'Should school be at home on a computer or in a real classroom?',
  'Is a robot teacher better than a human teacher?',
  'Should kids go on a school trip to the Moon?',
  'Is a robot pet better than a real pet?',
  'Should all houses be smart houses that talk to you?',
  'Is it good if all food comes in one healthy pill?',
  'Should people live under the ocean in the future?',
  'Should all cars in the future drive by themselves?',
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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [playingTurnId, setPlayingTurnId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const history = readLocalJson<Record<string, DebateTurn[]>>(STORAGE_KEY, {})
    setConversation(history[prompt] || [])
  }, [prompt])

  useEffect(() => {
    const history = readLocalJson<Record<string, DebateTurn[]>>(STORAGE_KEY, {})
    history[prompt] = conversation
    writeLocalJson(STORAGE_KEY, history)
  }, [conversation, prompt])

  const stopSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setIsLoadingAudio(false)
    setPlayingTurnId(null)
  }, [])

  const speakText = useCallback(
    async (text: string, turnId?: string) => {
      if (!text) return
      
      // Stop any ongoing speech
      stopSpeech()
      
      setIsLoadingAudio(true)
      if (turnId) setPlayingTurnId(turnId)
      
      try {
        // Use English TTS API for high-quality speech
        const response = await apiClient.post<{ audioUrl: string; success: boolean }>('/english-tts', {
          text: text,
          voice: 'onyx', // Clear, confident voice for debate
        })

        if (response.success && response.audioUrl) {
          const audio = new Audio(response.audioUrl)
          audioRef.current = audio
          
          audio.onended = () => {
            audioRef.current = null
            setIsLoadingAudio(false)
            setPlayingTurnId(null)
          }
          
          audio.onerror = () => {
            audioRef.current = null
            setIsLoadingAudio(false)
            setPlayingTurnId(null)
          }
          
          setIsLoadingAudio(false)
          await audio.play()
        } else {
          setIsLoadingAudio(false)
          setPlayingTurnId(null)
          console.error('TTS API returned unsuccessful response')
        }
      } catch (error) {
        console.error('TTS API error:', error)
        setIsLoadingAudio(false)
        setPlayingTurnId(null)
      }
    },
    [stopSpeech],
  )

  useEffect(() => {
    if (conversation.length === 0) return
    const lastTurn = conversation[conversation.length - 1]
    speakText(lastTurn.rebuttal, lastTurn.id)
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
      subtitle="Debate with ai and become better and speaking"
    >
      <div className="space-y-4 rounded-2xl border border-[#11E0FF]/30 bg-[#1E2A49] p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-white/70">Current prompt:</span>
          <select
            className="rounded-xl border border-[#11E0FF]/30 bg-[#1E2A49] px-3 py-2 text-white focus:border-[#11E0FF] focus:outline-none focus:ring-2 focus:ring-[#11E0FF]/20"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          >
            {prompts.map((p) => (
              <option key={p} value={p} className="bg-[#1E2A49]">
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={randomizePrompt}
            className="rounded-full border-2 border-cyan-400/50 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-cyan-400/20 active:scale-95"
            style={{ textShadow: '0 0 8px rgba(34, 211, 238, 0.6)' }}
          >
            🎲 Randomize prompt
          </button>
        </div>
        <div className="space-y-3 rounded-2xl border border-[#11E0FF]/20 bg-[#1C2340] p-4">
          <div className="flex flex-wrap gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="rounded-full border-2 border-emerald-400/50 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-400/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                style={{ textShadow: '0 0 8px rgba(52, 211, 153, 0.6)' }}
              >
                🎙 Start recording
              </button>
            ) : (
              <button
                onClick={submitArgument}
                className="rounded-full border-2 border-rose-500/70 bg-rose-500/20 px-6 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-500 hover:bg-rose-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
                style={{ textShadow: '0 0 8px rgba(244, 63, 94, 0.6)' }}
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
          <div className="space-y-4 rounded-2xl bg-[#1E2A49] p-4">
            {conversation.map((turn) => (
              <div key={turn.id} className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4 text-white/80">
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-[#11E0FF]">
                    <span>Student</span>
                    <span className="text-white/50">{new Date(turn.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="mt-2 text-sm">{turn.transcript}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2">
                  <p className="text-xs uppercase tracking-[0.4em] text-[#11E0FF]">AI rebuttal</p>
                  <p className="mt-1 text-sm">{turn.rebuttal}</p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    <button
                      onClick={() => speakText(turn.rebuttal, turn.id)}
                      disabled={isLoadingAudio && playingTurnId === turn.id}
                      className="rounded-full border border-white/30 px-3 py-1.5 text-xs text-white/70 hover:border-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {isLoadingAudio && playingTurnId === turn.id ? '⏳ Loading...' : '🔊 Replay AI audio'}
                    </button>
                    {playingTurnId === turn.id && (
                      <button
                        onClick={stopSpeech}
                        className="rounded-full border-2 border-rose-500/70 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:border-rose-500 hover:bg-rose-500/30 transition active:scale-95"
                        style={{ textShadow: '0 0 6px rgba(244, 63, 94, 0.6)' }}
                      >
                        ⏹ Stop audio
                      </button>
                    )}
                    {!isRecording && !loading && (
                      <button
                        onClick={startRecording}
                        className="rounded-full border-2 border-[#11E0FF]/50 bg-[#11E0FF]/10 px-3 py-1.5 text-xs font-semibold text-[#11E0FF] hover:bg-[#11E0FF]/20 hover:shadow-[0_0_10px_rgba(17,224,255,0.4)] transition"
                      style={{ textShadow: '0 0 4px rgba(17, 224, 255, 0.5)' }}
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
