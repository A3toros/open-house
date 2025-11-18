import { useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ActivityLayout } from '../ActivityLayout'
import { useRecorder } from '../../hooks/useRecorder'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'
import { useConfetti } from '../../hooks/useConfetti'
import { useBilingualText } from '../../hooks/useBilingualText'
import { apiClient } from '../../services/apiClient'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

const praiseWords = ['Great', 'Perfect', 'Awesome', 'Amazing', 'Impressive']

type VoiceAnalysis = {
  profession_en?: string
  profession_th?: string
  reason_en?: string
  reason_th?: string
}

const VoiceChallenge = () => {
  useClearLocalStorage(['voice-challenge-storage'])
  const { isRecording, startRecording, stopRecording } = useRecorder()
  const { fire } = useConfetti()
  const { renderText } = useBilingualText()

  const [transcript, setTranscript] = useState<string>()
  const hasSentRef = useRef(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [analysis, setAnalysis] = useState<VoiceAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [celebrationStage, setCelebrationStage] = useState<'idle' | 'congrats' | 'praise' | 'done'>('idle')
  const [praiseWord, setPraiseWord] = useState('')
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  const startCelebration = useCallback(() => {
    clearTimers()
    setPraiseWord(praiseWords[Math.floor(Math.random() * praiseWords.length)])
    setCelebrationStage('congrats')
    fire()
    timers.current.push(
      window.setTimeout(() => {
        setCelebrationStage('praise')
      }, 1100),
    )
    timers.current.push(
      window.setTimeout(() => {
        setCelebrationStage('done')
      }, 2300),
    )
  }, [fire])

  const finalizeRecording = useCallback(async () => {
    if (hasSentRef.current) return
    hasSentRef.current = true
    setIsAnalyzing(true)
    startCelebration()
    try {
      const blob = ensureAudioAvailable(await stopRecording())
      const base64 = await toBase64(blob)
      const response = await apiClient.post<{
        transcript: string
        analysis: VoiceAnalysis
      }>('/voice-challenge', {
        audioBlob: base64,
      })

      setTranscript(response.transcript)
      setAnalysis(response.analysis || null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Voice challenge failed')
      hasSentRef.current = false
      clearTimers()
      setCelebrationStage('idle')
    } finally {
      setIsAnalyzing(false)
    }
  }, [stopRecording, startCelebration])

  const handleRecord = async () => {
    setTranscript(undefined)
    setAnalysis(null)
    hasSentRef.current = false
    setErrorMessage(undefined)
    setCelebrationStage('idle')
    clearTimers()
    await startRecording()
  }

  return (
    <ActivityLayout
      title="AI Voice Challenge"
      subtitle="Students introduce themselves and receive bilingual future-career predictions."
    >
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-sky">Prompt</p>
            <p className="font-semibold text-white">
              {renderText({
                en: '“Speak about yourself and the things you like.”',
                th: '“พูดเกี่ยวกับตัวคุณและสิ่งที่คุณชอบ”',
              })}
            </p>
          </div>
          <div className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/70">
            {isRecording ? 'Recording in progress…' : ''}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleRecord}
            disabled={isRecording}
            className="rounded-xl bg-primary px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {isRecording ? 'Recording…' : 'Start Recording'}
          </button>
          {isRecording && (
            <button
              onClick={finalizeRecording}
              className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white hover:border-white"
            >
              Stop & Analyze
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {celebrationStage !== 'idle' && (
            <motion.div
              key={celebrationStage}
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.35 }}
              className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center text-white"
            >
              {celebrationStage === 'congrats' && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="text-4xl font-display"
                >
                  Congradulations!
                </motion.p>
              )}
              {celebrationStage === 'praise' && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-5xl font-display"
                >
                  {praiseWord || 'Great!'}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isAnalyzing && celebrationStage === 'done' && !analysis && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-midnight/40 px-4 py-3 text-white/80">
            <motion.span
              className="h-6 w-6 rounded-full border-2 border-white/40 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 0.8 }}
            />
            <span>Analyzing your English + Thai feedback…</span>
          </div>
        )}

        {analysis && (
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-midnight/40 p-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">Future career · English</p>
              <p className="text-2xl font-semibold text-white">{analysis.profession_en || '—'}</p>
              <p className="text-sm text-white/80">{analysis.reason_en || 'AI is preparing your feedback…'}</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-white/60">อาชีพแนะนำ · ภาษาไทย</p>
              <p className="text-2xl font-semibold text-white">{analysis.profession_th || '—'}</p>
              <p className="text-sm text-white/80">{analysis.reason_th || 'AI กำลังสร้างคำแนะนำ...'}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        )}
        {transcript && (
          <div className="rounded-xl bg-midnight/60 p-4 text-sm text-white/80">
            <p className="font-semibold text-white">Transcript</p>
            <p>{transcript}</p>
          </div>
        )}
      </div>
    </ActivityLayout>
  )
}

export default VoiceChallenge
