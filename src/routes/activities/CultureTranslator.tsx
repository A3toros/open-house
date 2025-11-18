import { useEffect, useRef, useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { useRecorder } from '../../hooks/useRecorder'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'
import { motion } from 'framer-motion'
import { readLocalJson, writeLocalJson } from '../../utils/storage'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

type CultureMatch = {
  global: string
  explanation: string
  takeaway?: string
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
  const [errorMessage, setErrorMessage] = useState<string>()
  const [audioPayload, setAudioPayload] = useState<string>()
  const [transcript, setTranscript] = useState<string>()
  const narrationRef = useRef<SpeechSynthesisUtterance | null>(null)

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
    try {
      const response = await apiClient.post<{
        match: {
          global_custom: string
          explanation: string
          cultural_takeaway?: string
          narration_script?: string
        }
        transcript?: string
      }>('/culture-translator', {
        audioBlob: blobPayload,
        mimeType: 'audio/webm',
      })

      const newMatch: CultureMatch = {
        global: response.match.global_custom,
        explanation: response.match.explanation,
        takeaway: response.match.cultural_takeaway,
        narration: response.match.narration_script,
      }

      setTranscript(response.transcript)
      setMatch(newMatch)
      setHistory((prev) => [
        {
          thai: response.transcript || 'Voice clip',
          global: newMatch.global,
          takeaway: newMatch.takeaway || 'Shared respect for ancestors.',
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ])
      setAudioPayload(undefined)
    } catch (error) {
      setErrorMessage((error as Error).message)
    }
  }

  const handleNarration = () => {
    if (!match?.narration || typeof window === 'undefined' || !window.speechSynthesis) return
    if (narrationRef.current) {
      window.speechSynthesis.cancel()
      narrationRef.current = null
      setIsPlaying(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(match.narration)
    utterance.lang = 'en-US'
    utterance.onend = () => {
      narrationRef.current = null
      setIsPlaying(false)
    }
    narrationRef.current = utterance
    setIsPlaying(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <ActivityLayout title="AI Culture Translator" subtitle="Speak about a Thai custom and let AI find a global match.">
      <motion.div
        layout
        className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          className="rounded-2xl border border-white/10 bg-midnight/50 p-4 text-center text-white/80"
          layout
        >
          <button
            onClick={handleRecordToggle}
            className={`mt-4 rounded-full px-6 py-3 text-sm font-semibold ${
              isRecording ? 'bg-rose-500 text-white' : 'bg-primary text-white'
            }`}
          >
            {isRecording ? 'Tap to finish recording' : 'Tap to start speaking'}
          </button>
          {transcript && (
            <p className="mt-2 rounded-xl bg-white/5 p-2 text-xs text-white/70">
              Last transcript: <span className="text-white">{transcript}</span>
            </p>
          )}
        </motion.div>
        {errorMessage && <p className="text-sm text-rose-300">{errorMessage}</p>}
        {match && (
          <motion.div
            className="space-y-2 rounded-2xl bg-midnight/50 p-4 text-sm text-white/80"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            layout
          >
            <p className="font-semibold text-white">Similar Tradition</p>
            <p className="text-lg text-white">{match.global}</p>
            <p>{match.explanation}</p>
            {match.takeaway && (
              <p className="rounded-xl bg-white/5 p-2 text-xs uppercase tracking-[0.3em] text-sky">
                Shared value: {match.takeaway}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {history.length > 0 && (
        <motion.div
          className="rounded-2xl border border-white/10 bg-midnight/40 p-4 text-sm text-white/80"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm uppercase tracking-[0.35em] text-sky">Recent matches</p>
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
      {match?.narration && (
        <button
          onClick={handleNarration}
          className="mt-4 rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 hover:border-white"
        >
          {isPlaying ? 'Stop narration' : 'Play narration'}
        </button>
      )}
    </ActivityLayout>
  )
}

export default CultureTranslator
