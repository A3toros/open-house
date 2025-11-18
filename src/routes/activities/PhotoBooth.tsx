import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

const PhotoBooth = () => {
  useClearLocalStorage(['photo-booth-storage'])
  const [profession, setProfession] = useState('Space Chef')
  const [style, setStyle] = useState('Studio Portrait')
  const [imageUrl, setImageUrl] = useState<string>()
  const [styledUrl, setStyledUrl] = useState<string>()
  const [styleMeta, setStyleMeta] = useState<{ palette?: string; lighting?: string; caption?: string }>()
  const [isGenerating, setIsGenerating] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string>()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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

    try {
      const response = await apiClient.post<{
        styledImageUrl: string
        styleMeta?: { palette?: string; lighting?: string; caption?: string }
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

  return (
    <ActivityLayout
      title="AI Photo Booth"
      subtitle="Students take a photo, pick a future profession, and receive a stylized portrait."
    >
      <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
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
              Dream profession
              <input
                className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-white"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
              />
            </label>
            <p className="text-sm text-white/70">Style options</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {['Comic-Book', 'Neon Glow', 'Studio Portrait'].map((styleOption) => (
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
                download="photo-booth.png"
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
              <img src={styledUrl} alt="AI Portrait" className="w-full rounded-xl border border-white/10 object-cover" />
              {styleMeta && (
                <div className="text-xs text-white/70">
                  {styleMeta.caption && <span>{styleMeta.caption}</span>}
                  {styleMeta.lighting && <span> • Lighting: {styleMeta.lighting}</span>}
                  {styleMeta.palette && <span> • Palette: {styleMeta.palette}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ActivityLayout>
  )
}

export default PhotoBooth
