import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ActivityLayout } from '../ActivityLayout'
import { useRecorder } from '../../hooks/useRecorder'
import { ensureAudioAvailable, toBase64 } from '../../utils/validators'
import { useConfetti } from '../../hooks/useConfetti'
import { useBilingualText } from '../../hooks/useBilingualText'
import { apiClient } from '../../services/apiClient'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'
import { readLocalJson, writeLocalJson } from '../../utils/storage'

const STORAGE_KEY = 'become-superhero-storage'

const praiseWords = ['Great', 'Perfect', 'Awesome', 'Amazing', 'Impressive']

type SuperheroAnalysis = {
  characterName?: string
  superpowers?: string[]
  description?: string
}

type StyleMeta = {
  palette?: string
  lighting?: string
  caption?: string
}

type TabType = 'superhero' | 'villain'

const BecomeSuperhero = () => {
  useClearLocalStorage([STORAGE_KEY])

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('superhero')

  // Voice recording state
  const { isRecording, startRecording, stopRecording } = useRecorder()
  const { fire } = useConfetti()
  const { renderText } = useBilingualText()
  const [transcript, setTranscript] = useState<string>()
  const [analysis, setAnalysis] = useState<SuperheroAnalysis | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [celebrationStage, setCelebrationStage] = useState<'idle' | 'praise' | 'done'>('idle')
  const [praiseWord, setPraiseWord] = useState('')
  const hasSentRef = useRef(false)
  const timers = useRef<number[]>([])

  // Photo booth state
  const [style, setStyle] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string>()
  const [styledUrl, setStyledUrl] = useState<string>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string>()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [email, setEmail] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<string>()
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')

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
        analysis: SuperheroAnalysis
      }>('/voice-challenge', {
        audioBlob: base64,
      })

      const transcriptText = response.transcript || ''
      setTranscript(transcriptText)
      
      // Store transcript in cache
      const cached = readLocalJson<{ superhero?: string; villain?: string }>(STORAGE_KEY, {})
      if (activeTab === 'superhero') {
        cached.superhero = transcriptText
      } else {
        cached.villain = transcriptText
      }
      writeLocalJson(STORAGE_KEY, cached)

      setAnalysis(response.analysis || null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Voice challenge failed')
      hasSentRef.current = false
      clearTimers()
      setCelebrationStage('idle')
    } finally {
      setIsAnalyzing(false)
    }
  }, [stopRecording, startCelebration, activeTab])

  const handleRecord = async () => {
    setTranscript(undefined)
    setAnalysis(null)
    hasSentRef.current = false
    setErrorMessage(undefined)
    setCelebrationStage('idle')
    clearTimers()
    await startRecording()
  }

  // Load cached transcript when switching tabs and reset style
  useEffect(() => {
    const cached = readLocalJson<{ superhero?: string; villain?: string }>(STORAGE_KEY, {})
    const cachedTranscript = activeTab === 'superhero' ? cached.superhero : cached.villain
    if (cachedTranscript) {
      setTranscript(cachedTranscript)
    } else {
      setTranscript(undefined)
    }
    setAnalysis(null)
    // Reset style when switching tabs
    setStyle('')
  }, [activeTab])

  // Get style options based on active tab
  const getStyleOptions = () => {
    if (activeTab === 'superhero') {
      return ['Classic Hero', 'Cosmic Champion', 'Mighty Protector']
    } else {
      return ['Dark Villain', 'Sinister Shadow', 'Evil Mastermind']
    }
  }

  // Camera helpers
  const enumerateCameras = async () => {
    try {
      // Request permission first to get device labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
      // Stop the temporary stream immediately
      tempStream.getTracks().forEach((track) => track.stop())
      
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === 'videoinput')
      setAvailableCameras(videoDevices)
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].deviceId)
      }
    } catch (error) {
      console.error('Error enumerating cameras:', error)
    }
  }

  const startCamera = async () => {
    try {
      setCameraError(undefined)
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: 1280,
          height: 720,
          ...(selectedCameraId ? { deviceId: { exact: selectedCameraId } } : {}),
        },
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
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

  useEffect(() => {
    enumerateCameras()
  }, [])

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

    if (!style) {
      setCameraError('Please select a style first.')
      return
    }

    // Get transcript from state or cache
    let transcriptToUse = transcript
    
    if (!transcriptToUse) {
      const cached = readLocalJson<{ superhero?: string; villain?: string }>(STORAGE_KEY, {})
      transcriptToUse = activeTab === 'superhero' ? cached.superhero : cached.villain
    }

    if (!transcriptToUse) {
      setCameraError('Please record your qualities first.')
      return
    }

    setIsGenerating(true)
    setCameraError(undefined)
    setStyledUrl(undefined)
    setEmailStatus(undefined)

    try {
      const response = await apiClient.post<{
        styledImageUrl: string
        styleMeta?: StyleMeta
        analysis: SuperheroAnalysis
      }>('/superhero-portrait', {
        photoDataUrl: imageUrl,
        transcript: transcriptToUse,
        characterType: activeTab, // 'superhero' or 'villain'
        style,
      })

      setStyledUrl(response.styledImageUrl)
      setAnalysis(response.analysis)
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
        profession: analysis?.characterName || `${activeTab === 'superhero' ? 'Superhero' : 'Super Villain'}`,
        characterType: activeTab, // 'superhero' or 'villain'
      })
      setEmailStatus('Email sent! Check your inbox.')
    } catch (error) {
      setEmailStatus((error as Error).message)
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleReset = () => {
    // Reset all state to initial values
    setTranscript(undefined)
    setAnalysis(null)
    setErrorMessage(undefined)
    setIsAnalyzing(false)
    setCelebrationStage('idle')
    setPraiseWord('')
    hasSentRef.current = false
    clearTimers()
    
    // Reset photo-related state
    setImageUrl(undefined)
    setStyledUrl(undefined)
    setEmailStatus(undefined)
    setEmail('')
    setIsModalOpen(false)
    setIsGenerating(false)
    setCameraReady(false)
    setCameraError(undefined)
    
    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    // Clear cache
    writeLocalJson(STORAGE_KEY, {})
    
    // Reset to superhero tab
    setActiveTab('superhero')
  }

  const getPrompt = () => {
    if (activeTab === 'superhero') {
      return {
        en: '"Speak about your good qualities"',
        th: '"พูดเกี่ยวกับคุณสมบัติที่ดีของคุณ"',
      }
    } else {
      return {
        en: '"Speak about your bad qualities"',
        th: '"พูดเกี่ยวกับคุณสมบัติที่ไม่ดีของคุณ"',
      }
    }
  }

  return (
    <ActivityLayout
      title="Become Superhero"
      subtitle="Record your qualities, take a photo, and become a superhero or super villain with AI-generated superpowers!"
    >
      <div className="space-y-6 rounded-3xl border border-[#11E0FF]/30 bg-[#1E2A49] p-6">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-[#11E0FF]/20 pb-4">
          <button
            onClick={() => setActiveTab('superhero')}
            className={`flex flex-col items-center gap-2 px-6 py-4 font-semibold transition ${
              activeTab === 'superhero'
                ? 'border-b-2 border-[#11E0FF] text-[#11E0FF]'
                : 'text-white/60 hover:text-white/80'
            }`}
            style={activeTab === 'superhero' ? { textShadow: '0 0 8px rgba(17, 224, 255, 0.6)' } : {}}
          >
            <img 
              src="/pics/superhero.png" 
              alt="Superhero" 
              className={`w-16 h-16 object-contain transition ${activeTab === 'superhero' ? 'opacity-100 scale-110' : 'opacity-60'}`}
            />
            <span>Superhero</span>
          </button>
          <button
            onClick={() => setActiveTab('villain')}
            className={`flex flex-col items-center gap-2 px-6 py-4 font-semibold transition ${
              activeTab === 'villain'
                ? 'border-b-2 border-red-500 text-red-400'
                : 'text-white/60 hover:text-white/80'
            }`}
            style={activeTab === 'villain' ? { textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' } : {}}
          >
            <img 
              src="/pics/super-viliain.png" 
              alt="Super Villain" 
              className={`w-16 h-16 object-contain transition ${activeTab === 'villain' ? 'opacity-100 scale-110' : 'opacity-60'}`}
            />
            <span>Super Villain</span>
          </button>
        </div>

        {/* Voice Recording Section - Only show when tab is selected */}
        {activeTab && (
        <section className={`space-y-4 rounded-2xl border p-4 ${
          activeTab === 'superhero' 
            ? 'border-[#11E0FF]/20 bg-[#1C2340]' 
            : 'border-red-500/20 bg-[#1C2340]'
        }`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={`text-xs uppercase tracking-[0.35em] ${
                activeTab === 'superhero' ? 'text-[#11E0FF]' : 'text-red-400'
              }`}>Prompt</p>
              <p className="font-semibold text-white">
                {renderText(getPrompt())}
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
              className={`rounded-xl border-2 px-6 py-3 font-semibold disabled:opacity-50 transition ${
                activeTab === 'superhero'
                  ? 'bg-[#11E0FF]/20 border-[#11E0FF]/50 text-[#11E0FF] hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)]'
                  : 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              }`}
              style={activeTab === 'superhero' ? { textShadow: '0 0 8px rgba(17, 224, 255, 0.6)' } : { textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}
            >
              {isRecording ? 'Recording…' : '🎤 Speak'}
            </button>
            {isRecording && (
              <button
                onClick={finalizeRecording}
                className={`rounded-xl border-2 px-6 py-3 font-semibold transition ${
                  activeTab === 'superhero'
                    ? 'border-[#FFB743]/50 bg-[#FFB743]/10 text-[#FFB743] hover:bg-[#FFB743]/20 hover:shadow-[0_0_15px_rgba(255,183,67,0.4)]'
                    : 'border-red-600/50 bg-red-600/10 text-red-400 hover:bg-red-600/20 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                }`}
                style={activeTab === 'superhero' ? { textShadow: '0 0 6px rgba(255, 183, 67, 0.5)' } : { textShadow: '0 0 6px rgba(239, 68, 68, 0.5)' }}
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
              <span>Analyzing your qualities…</span>
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
        )}

        {/* Photo Booth Section - Only show when tab is selected AND transcript exists */}
        {activeTab && transcript && transcript.trim().length > 0 && (
        <section className={`space-y-4 rounded-2xl border p-4 ${
          activeTab === 'superhero' 
            ? 'border-[#11E0FF]/20 bg-[#1E2A49]' 
            : 'border-red-500/20 bg-[#1E2A49]'
        }`}>
          <div className="grid gap-6 md:grid-cols-[3fr,2fr]">
            <div className="space-y-3">
              <p className="text-sm text-white/70">Live camera preview</p>
              {availableCameras.length > 0 && (
                <div className="space-y-2">
                  <label className={`text-xs block ${
                    activeTab === 'superhero' ? 'text-[#11E0FF]' : 'text-red-400'
                  }`}>Select Camera</label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value)
                      setCameraReady(false)
                      if (streamRef.current) {
                        streamRef.current.getTracks().forEach((track) => track.stop())
                      }
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 ${
                      activeTab === 'superhero'
                        ? 'border-[#11E0FF]/30 bg-[#1E2A49] focus:border-[#11E0FF] focus:ring-[#11E0FF]/20'
                        : 'border-red-500/30 bg-[#1E2A49] focus:border-red-500 focus:ring-red-500/20'
                    }`}
                  >
                    {availableCameras.map((camera) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                    className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                      activeTab === 'superhero'
                        ? 'border-[#11E0FF]/50 bg-[#11E0FF]/10 text-[#11E0FF] hover:bg-[#11E0FF]/20 hover:shadow-[0_0_15px_rgba(17,224,255,0.4)] disabled:border-[#11E0FF]/20 disabled:text-[#11E0FF]/40'
                        : 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] disabled:border-red-500/20 disabled:text-red-400/40'
                    }`}
                    style={activeTab === 'superhero' ? { textShadow: '0 0 6px rgba(17, 224, 255, 0.5)' } : { textShadow: '0 0 6px rgba(239, 68, 68, 0.5)' }}
                  >
                    Capture Photo
                  </button>
                </div>
              </div>
              {cameraError && <p className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">{cameraError}</p>}
            </div>

            <div className={`space-y-3 rounded-2xl border p-4 ${
              activeTab === 'superhero' 
                ? 'border-[#11E0FF]/20 bg-[#1C2340]' 
                : 'border-red-500/20 bg-[#1C2340]'
            }`}>
              <p className={`text-sm font-semibold ${
                activeTab === 'superhero' ? 'text-[#11E0FF]' : 'text-red-400'
              }`}>Style options</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {getStyleOptions().map((styleOption) => (
                  <button
                    key={styleOption}
                    onClick={() => setStyle(styleOption)}
                    className={`rounded-full border-2 px-3 py-1.5 font-semibold transition ${
                      style === styleOption
                        ? activeTab === 'superhero'
                          ? 'border-[#11E0FF] bg-[#11E0FF]/20 text-[#11E0FF] shadow-[0_0_15px_rgba(17,224,255,0.4)]'
                          : 'border-red-500 bg-red-500/20 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                        : activeTab === 'superhero'
                          ? 'border-[#11E0FF]/30 bg-[#1E2A49]/50 text-white/70 hover:border-[#11E0FF]/60 hover:bg-[#1E2A49]'
                          : 'border-red-500/30 bg-[#1E2A49]/50 text-white/70 hover:border-red-500/60 hover:bg-[#1E2A49]'
                    }`}
                    style={style === styleOption ? (activeTab === 'superhero' ? { textShadow: '0 0 6px rgba(17, 224, 255, 0.6)' } : { textShadow: '0 0 6px rgba(239, 68, 68, 0.6)' }) : {}}
                  >
                    {styleOption}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !transcript || !style}
                className={`w-full rounded-xl border-2 px-6 py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  activeTab === 'superhero'
                    ? 'bg-[#11E0FF]/20 border-[#11E0FF]/50 text-[#11E0FF] hover:bg-[#11E0FF]/30 hover:shadow-[0_0_20px_rgba(17,224,255,0.5)]'
                    : 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                }`}
                style={activeTab === 'superhero' ? { textShadow: '0 0 8px rgba(17, 224, 255, 0.6)' } : { textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }}
              >
                {isGenerating ? (
                  <>
                    <motion.span
                      className={`h-4 w-4 rounded-full border-2 border-white/40 ${
                        activeTab === 'superhero' ? 'border-t-[#11E0FF]' : 'border-t-red-400'
                      }`}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, ease: 'linear', duration: 0.8 }}
                    />
                    Generating...
                  </>
                ) : (
                  `Generate ${activeTab === 'superhero' ? 'Superhero' : 'Super Villain'}`
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
                  download="superhero-photo.png"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 px-4 py-2 text-sm text-white hover:border-white"
                >
                  Download PNG
                </a>
              </div>
            )}

            {isGenerating && (
              <div className="space-y-2 rounded-2xl border border-white/10 bg-midnight/40 p-4 flex flex-col items-center justify-center min-h-[200px]">
                <motion.span
                  className={`h-12 w-12 rounded-full border-4 border-white/20 ${
                    activeTab === 'superhero' ? 'border-t-[#11E0FF]' : 'border-t-red-400'
                  }`}
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
                />
                <p className="text-sm text-white/70 mt-4">Generating your {activeTab === 'superhero' ? 'superhero' : 'super villain'} portrait...</p>
                <p className="text-xs text-white/50">This may take a few moments</p>
              </div>
            )}

            {styledUrl && !isGenerating && (
              <div className={`space-y-2 rounded-2xl border p-4 ${
                activeTab === 'superhero'
                  ? 'border-[#11E0FF]/40 bg-[#11E0FF]/10'
                  : 'border-red-500/40 bg-red-500/10'
              }`}>
                <p className={`text-sm font-semibold ${
                  activeTab === 'superhero' ? 'text-[#11E0FF]' : 'text-red-400'
                }`}>{activeTab === 'superhero' ? 'Superhero' : 'Super Villain'} Portrait</p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="w-full focus:outline-none"
                >
                  <img
                    src={styledUrl}
                    alt={`${activeTab === 'superhero' ? 'Superhero' : 'Super Villain'} Portrait`}
                    className="w-full rounded-xl border border-white/10 object-cover transition hover:opacity-90"
                  />
                </button>
                
                {/* Superpowers Display */}
                {analysis?.superpowers && analysis.superpowers.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className={`text-sm font-semibold ${
                      activeTab === 'superhero' ? 'text-[#11E0FF]' : 'text-red-400'
                    }`}>✨ Superpowers ✨</p>
                    <div className="space-y-2">
                      {analysis.superpowers.map((power, index) => (
                        <div
                          key={index}
                          className={`rounded-lg border-2 px-4 py-2 text-sm text-white ${
                            activeTab === 'superhero'
                              ? 'border-[#11E0FF]/30 bg-[#11E0FF]/10'
                              : 'border-red-500/30 bg-red-500/10'
                          }`}
                        >
                          <span className={`font-semibold ${
                            activeTab === 'superhero' ? 'text-[#11E0FF]' : 'text-red-400'
                          }`}>⚡</span> {power}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis?.characterName && (
                  <p className={`text-lg font-bold mt-2 ${
                    activeTab === 'superhero' ? 'text-[#FFB743]' : 'text-red-400'
                  }`}>
                    {analysis.characterName}
                  </p>
                )}

                {analysis?.description && (
                  <p className="text-sm text-white/80 mt-2">{analysis.description}</p>
                )}

                <div className="space-y-2 mt-4">
                  <label className="text-sm text-white/70 block">
                    Email the portrait
                    <input
                      type="email"
                      className={`mt-2 w-full rounded-xl border bg-[#1C2340] px-3 py-2 text-white focus:outline-none focus:ring-2 ${
                        activeTab === 'superhero'
                          ? 'border-[#11E0FF]/30 focus:border-[#11E0FF] focus:ring-[#11E0FF]/20'
                          : 'border-red-500/30 focus:border-red-500 focus:ring-red-500/20'
                      }`}
                      placeholder="student@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                  <button
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                    className={`w-full rounded-xl border-2 px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                      activeTab === 'superhero'
                        ? 'border-[#FFB743]/50 bg-[#FFB743]/10 text-[#FFB743] hover:bg-[#FFB743]/20 hover:shadow-[0_0_15px_rgba(255,183,67,0.4)]'
                        : 'border-red-600/50 bg-red-600/10 text-red-400 hover:bg-red-600/20 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                    }`}
                    style={activeTab === 'superhero' ? { textShadow: '0 0 6px rgba(255, 183, 67, 0.5)' } : { textShadow: '0 0 6px rgba(239, 68, 68, 0.5)' }}
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
        )}

        {/* Reset Button - Shows when portrait is generated */}
        {styledUrl && (
          <div className="flex justify-center pt-4">
            <button
              onClick={handleReset}
              className="rounded-xl border-2 border-[#FFB743]/50 bg-[#FFB743]/10 px-6 py-3 font-semibold text-[#FFB743] hover:bg-[#FFB743]/20 hover:shadow-[0_0_15px_rgba(255,183,67,0.4)] transition"
              style={{ textShadow: '0 0 6px rgba(255, 183, 67, 0.5)' }}
            >
              🔄 Start Over (Back to Superhero/Super Villain Selection)
            </button>
          </div>
        )}
      </div>
    </ActivityLayout>
  )
}

export default BecomeSuperhero

