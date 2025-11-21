import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { useRecorder } from '../../hooks/useRecorder'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'
import { motion } from 'framer-motion'
import { readLocalJson, writeLocalJson } from '../../utils/storage'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

type CultureMatch = {
  global: string
  country?: string
  place?: string
  whatPeopleDo?: string
  narration?: string
}

const HISTORY_KEY = 'culture-translator-history'

const CultureTranslator = () => {
  useClearLocalStorage([HISTORY_KEY])
  const { isRecording, startRecording, stopRecording } = useRecorder()
  const [match, setMatch] = useState<CultureMatch>()
  const [history, setHistory] = useState<
    Array<{ thai: string; global: string; takeaway: string; timestamp: string }>
  >([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [audioPayload, setAudioPayload] = useState<string>()
  const [transcript, setTranscript] = useState<string>()
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Get a female voice from available voices (kept for potential fallback, but not used with API TTS)
  const getFemaleVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null
    const availableVoices = window.speechSynthesis.getVoices()
    // Try to find a female voice (common patterns: 'female', 'woman', or specific voice names)
    const femaleVoice = availableVoices.find(
      (voice) =>
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('zira') || // Windows female voice
        voice.name.toLowerCase().includes('samantha') || // macOS female voice
        voice.name.toLowerCase().includes('karen') || // macOS female voice
        voice.name.toLowerCase().includes('susan') || // macOS female voice
        voice.name.toLowerCase().includes('victoria') || // macOS female voice
        voice.name.toLowerCase().includes('salli') || // AWS Polly female voice
        voice.name.toLowerCase().includes('joanna'), // AWS Polly female voice
    )
    return femaleVoice || availableVoices.find((v) => v.lang.startsWith('en')) || availableVoices[0]
  }, [])

  useEffect(() => {
    const cached = readLocalJson(HISTORY_KEY, [])
    setHistory(Array.isArray(cached) ? cached : [])
  }, [])

  useEffect(() => {
    writeLocalJson(HISTORY_KEY, history.slice(0, 6))
  }, [history])

  const handleRecordToggle = async () => {
    setErrorMessage(undefined)
    if (isRecording) {
      try {
        const blob = ensureAudioAvailable(await stopRecording())
        const base64 = await toBase64(blob)
        await handleAnalyze(base64)
      } catch (error) {
        setErrorMessage((error as Error).message)
      }
    } else {
      setMatch(undefined)
      setAudioPayload(undefined)
      setTranscript(undefined)
      try {
        await startRecording()
      } catch (error) {
        setErrorMessage((error as Error).message)
      }
    }
  }

  const handleAnalyze = async (payload?: string) => {
    const blobPayload = payload || audioPayload
    if (!blobPayload) {
      setErrorMessage('Tap the mic, describe the custom aloud, then send to AI.')
      return
    }
    setErrorMessage(undefined)
    setIsSearching(true)
    setMatch(undefined)
    try {
      const response = await apiClient.post<{
        match: {
          global_custom: string
          country?: string
          place?: string
          what_people_do?: string
          narration_script?: string
        }
        transcript?: string
      }>('/culture-translator', {
        audioBlob: blobPayload,
        mimeType: 'audio/webm',
      })

      const newMatch: CultureMatch = {
        global: response.match.global_custom,
        country: response.match.country,
        place: response.match.place,
        whatPeopleDo: response.match.what_people_do,
        narration: response.match.narration_script,
      }

      setTranscript(response.transcript)
      setMatch(newMatch)
      setHistory((prev) => [
        {
          thai: response.transcript || 'Voice clip',
          global: newMatch.global,
          takeaway: 'Similar tradition found',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ])
      setAudioPayload(undefined)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsSearching(false)
    }
  }

  const handleNarration = async () => {
    if (!match?.narration) return
    
    // Stop any ongoing narration
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
      setIsPlaying(false)
      return
    }
    
    setIsLoadingAudio(true)
    setIsPlaying(true)
    try {
      // Use English TTS API for high-quality narration
      const response = await apiClient.post<{ audioUrl: string; success: boolean }>('/english-tts', {
        text: match.narration,
        voice: 'nova', // Natural female voice
      })

      if (response.success && response.audioUrl) {
        const audio = new Audio(response.audioUrl)
        audioRef.current = audio
        
        audio.onended = () => {
          audioRef.current = null
          setIsPlaying(false)
          setIsLoadingAudio(false)
        }
        
        audio.onerror = () => {
          audioRef.current = null
          setIsPlaying(false)
          setIsLoadingAudio(false)
        }
        
        setIsLoadingAudio(false)
        await audio.play()
      } else {
        setIsLoadingAudio(false)
        setIsPlaying(false)
        console.error('TTS API returned unsuccessful response')
      }
    } catch (error) {
      console.error('TTS API error:', error)
      setIsLoadingAudio(false)
      setIsPlaying(false)
    }
  }

  return (
    <ActivityLayout title="AI Culture Translator" subtitle="Speak about a Thai custom and let AI find a global match.">
      <motion.div
        layout
        className="space-y-4 rounded-2xl border border-[#11E0FF]/30 bg-[#1E2A49] p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="rounded-2xl border border-white/10 bg-[#1E2A49] p-4 text-center text-white/80"
          layout
        >
          <button
            onClick={handleRecordToggle}
            disabled={isSearching}
            className={`mt-4 rounded-full px-6 py-3 text-sm font-semibold transition ${
              isSearching
                ? 'bg-gray-500 text-white cursor-not-allowed opacity-50'
                : isRecording
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-[#11E0FF]/20 border-2 border-[#11E0FF]/50 text-[#11E0FF] hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)]'
            }`}
          >
            {isSearching
              ? 'Searching...'
              : isRecording
              ? 'Tap to finish recording'
              : 'Tap to start speaking'}
          </button>
          {transcript && (
            <p className="mt-2 rounded-xl bg-white/5 p-2 text-xs text-white/70">
              Last transcript: <span className="text-white">{transcript}</span>
            </p>
          )}
        </motion.div>
        {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}
        {isSearching && (
          <motion.div
            className="flex items-center gap-3 rounded-2xl border border-[#11E0FF]/30 bg-[#11E0FF]/10 p-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.span
              className="h-5 w-5 rounded-full border-2 border-[#11E0FF] border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
            />
            <p className="text-sm font-semibold text-[#11E0FF]" style={{ textShadow: '0 0 8px rgba(17, 224, 255, 0.6)' }}>
              AI is searching for similar tradition around the world...
            </p>
          </motion.div>
        )}
        {match && (
          <motion.div
            className="space-y-3 rounded-2xl bg-[#1E2A49] p-4 text-sm text-white/80"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            layout
          >
            <p className="font-semibold text-lg text-white">Similar Tradition</p>
            <div className="space-y-2">
              <p className="text-xl font-bold text-[#11E0FF]">{match.global}</p>
              {match.country && (
                <p className="text-white">
                  <span className="text-white/60">Country:</span> {match.country}
                </p>
              )}
              {match.place && (
                <p className="text-white">
                  <span className="text-white/60">Place:</span> {match.place}
                </p>
              )}
              {match.whatPeopleDo && (
                <p className="text-white">
                  <span className="text-white/60">What people do:</span> {match.whatPeopleDo}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {match?.narration && (
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={handleNarration}
            disabled={isLoadingAudio}
            className="rounded-full border-2 border-cyan-400/50 bg-cyan-400/10 px-6 py-3 text-sm font-semibold text-[#11E0FF] transition hover:border-cyan-400 hover:bg-cyan-400/20 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ textShadow: '0 0 8px rgba(17, 224, 255, 0.6)' }}
          >
            {isLoadingAudio ? '⏳ Loading...' : isPlaying ? '⏸ Stop narration' : '▶ Play narration'}
          </button>
        </motion.div>
      )}

      {history.length > 0 && (
        <motion.div
          className="rounded-2xl border border-white/10 bg-[#1C2340] p-4 text-sm text-white/80"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm uppercase tracking-[0.35em] text-[#11E0FF]">Recent matches</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {history.map((item) => (
              <div key={`${item.takeaway}-${item.timestamp}`} className="rounded-xl border border-white/10 p-3">
                <p className="text-xs text-white/50">{item.timestamp}</p>
                <p className="font-semibold text-white">{item.thai}</p>
                <p className="text-xs text-white/60">↔ {item.global}</p>
                <p className="mt-2 text-white/80">{item.takeaway}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </ActivityLayout>
  )
}

export default CultureTranslator
