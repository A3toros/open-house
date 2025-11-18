import { useCallback, useEffect, useRef, useState } from 'react'
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

type StyleMeta = {
  palette?: string
  lighting?: string
  caption?: string
}

const FutureProfession = () => {
  useClearLocalStorage(['future-profession-storage'])

  // Voice challenge state
  const { isRecording, startRecording, stopRecording } = useRecorder()
  const { fire } = useConfetti()
  const { renderText } = useBilingualText()
  const [transcript, setTranscript] = useState<string>()
  const [analysis, setAnalysis] = useState<VoiceAnalysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [celebrationStage, setCelebrationStage] = useState<'idle' | 'praise' | 'done'>('idle')
  const [praiseWord, setPraiseWord] = useState('')
  const hasSentRef = useRef(false)
  const timers = useRef<number[]>([])

  // Photo booth state
  const [profession, setProfession] = useState('Future Innovator')
  const [style, setStyle] = useState('Studio Portrait')
  const [imageUrl, setImageUrl] = useState<string>()
  const [styledUrl, setStyledUrl] = useState<string>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [styleMeta, setStyleMeta] = useState<StyleMeta>()
  const [isGenerating, setIsGenerating] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string>()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [email, setEmail] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<string>()

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  const startCelebration = useCallback(() => {
    clearTimers()
    setPraiseWord(praiseWords[Math.floor(Math.random() * praiseWords.length)])
    setCelebrationStage('praise')
    fire()
    timers.current.push(
      window.setTimeout(() => {
        setCelebrationStage('done')
      }, 2000),
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

  useEffect(() => {
    if (analysis?.profession_en) {
      setProfession(analysis.profession_en)
    }
  }, [analysis?.profession_en])

  // Camera helpers
  const startCamera = async () => {
    try {
      setCameraError(undefined)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraReady(true)
    } catch (error) {
      setCameraError((error as Error).message)
    }
  }

  const captureFrame = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/png')
    setImageUrl(dataUrl)
  }

  const handleGenerate = async () => {
    if (!imageUrl) {
      setCameraError('Capture a photo first.')
      return
    }

    setIsGenerating(true)
    setCameraError(undefined)
    setStyledUrl(undefined)
    setStyleMeta(undefined)
    setEmailStatus(undefined)

    try {
      const response = await apiClient.post<{
        styledImageUrl: string
        styleMeta?: StyleMeta
      }>('/photo-booth', {
        photoDataUrl: imageUrl,
        profession,
        style,
      })

      setStyledUrl(response.styledImageUrl)
      setStyleMeta(response.styleMeta)
    } catch (error) {
      setCameraError((error as Error).message)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const handleSendEmail = async () => {
    if (!styledUrl) {
      setEmailStatus('Generate a portrait first.')
      return
    }
    if (!email.trim()) {
      setEmailStatus('Enter an email address.')
      return
    }
    setIsSendingEmail(true)
    setEmailStatus(undefined)
    try {
      await apiClient.post('/send-photo-email', {
        email,
        styledImageUrl: styledUrl,
        profession,
      })
      setEmailStatus('Email sent! Check your inbox.')
    } catch (error) {
      setEmailStatus((error as Error).message)
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <ActivityLayout
      title="Future Profession"
      subtitle="Record a bilingual self-intro, get an AI profession prediction, then generate a portrait with that role."
    >
      <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        {/* Voice Challenge Section */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-midnight/40 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sky">Prompt</p>
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
            {celebrationStage === 'praise' && (
              <motion.div
                key="praise"
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -30 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, duration: 0.6 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center"
              >
                <motion.p
                  key={praiseWord}
                  initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25, duration: 0.5 }}
                  className="text-5xl font-display text-white"
                >
                  {praiseWord || 'Great!'}
                </motion.p>
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
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
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

          {transcript && (
            <div className="rounded-xl bg-white/5 p-4 text-sm text-white/80">
              <p className="font-semibold text-white">Transcript</p>
              <p>{transcript}</p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              {errorMessage}
            </div>
          )}
        </section>

        {/* Photo Booth Section */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-6 md:grid-cols-[3fr,2fr]">
            <div className="space-y-3">
              <p className="text-sm text-white/70">Live camera preview</p>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
                <video ref={videoRef} className="h-60 w-full rounded-xl bg-black object-cover" playsInline muted />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    onClick={startCamera}
                    className="rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:border-white"
                  >
                    {cameraReady ? 'Restart Camera' : 'Start Camera'}
                  </button>
                  <button
                    onClick={captureFrame}
                    disabled={!cameraReady}
                    className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:border-white/20 disabled:text-white/40"
                  >
                    Capture Photo
                  </button>
                </div>
              </div>
              {cameraError && <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">{cameraError}</p>}
            </div>

            <div className="space-y-3 rounded-2xl border border-white/10 bg-midnight/50 p-4">
              <label className="text-sm text-white/70">
                Profession from AI (editable)
                <input
                  className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                />
              </label>
              <p className="text-sm text-white/70">Style options</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {['Studio Portrait', 'Comic-Book', 'Neon Glow'].map((styleOption) => (
                  <button
                    key={styleOption}
                    onClick={() => setStyle(styleOption)}
                    className={`rounded-full border px-3 py-1 transition ${
                      style === styleOption
                        ? 'border-primary bg-primary/20 text-white'
                        : 'border-white/20 bg-white/5 text-white/70 hover:border-white/60'
                    }`}
                  >
                    {styleOption}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <motion.span
                      className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, ease: 'linear', duration: 0.8 }}
                    />
                    Generating...
                  </>
                ) : (
                  'Generate Portrait'
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {imageUrl && (
              <div className="space-y-2 rounded-2xl border border-white/10 bg-midnight/40 p-4">
                <p className="text-sm text-white/60">Captured photo</p>
                <img src={imageUrl} alt="Captured" className="w-full rounded-xl border border-white/10 object-cover" />
                <a
                  href={imageUrl}
                  download="future-profession.png"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:border-white"
                >
                  Download PNG
                </a>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-2 rounded-2xl border border-white/10 bg-midnight/40 p-4 flex flex-col items-center justify-center min-h-[200px]">
                <motion.span
                  className="h-12 w-12 rounded-full border-4 border-white/20 border-t-primary"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
                />
                <p className="text-sm text-white/70 mt-4">Generating your AI-enhanced portrait...</p>
                <p className="text-xs text-white/50">This may take a few moments</p>
              </div>
            )}

            {styledUrl && !isGenerating && (
              <div className="space-y-2 rounded-2xl border border-primary/40 bg-primary/10 p-4">
                <p className="text-sm text-white/60">AI-enhanced portrait</p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-full focus:outline-none"
                >
                  <img
                    src={styledUrl}
                    alt="AI Portrait"
                    className="w-full rounded-xl border border-white/10 object-cover transition hover:opacity-90"
                  />
                </button>
                {styleMeta && (
                  <div className="text-xs text-white/70">
                    {styleMeta.caption && <span>{styleMeta.caption}</span>}
                    {styleMeta.lighting && <span> • Lighting: {styleMeta.lighting}</span>}
                    {styleMeta.palette && <span> • Palette: {styleMeta.palette}</span>}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm text-white/70 block">
                    Email the portrait
                    <input
                      type="email"
                      className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                    className="w-full rounded-xl border border-white/40 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"
                  >
                    {isSendingEmail ? 'Sending…' : 'Send to email'}
                  </button>
                  {emailStatus && (
                    <p className="text-xs text-white/70">{emailStatus}</p>
                  )}
                </div>
              </div>
            )}
            <AnimatePresence>
              {isModalOpen && styledUrl && (
                <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsModalOpen(false)}
                >
                  <motion.img
                    src={styledUrl}
                    alt="Expanded portrait"
                    className="max-h-[90vh] max-w-5xl rounded-2xl border border-white/20 object-contain"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </ActivityLayout>
  )
}

export default FutureProfession

