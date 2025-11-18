import { useEffect, useRef, useState } from 'react'
import { ActivityLayout } from '../ActivityLayout'
import { apiClient } from '../../services/apiClient'
import { useClearLocalStorage } from '../../hooks/useClearLocalStorage'

const PhotoBooth = () => {
  useClearLocalStorage(['photo-booth-storage'])
  const [profession, setProfession] = useState('Space Chef')
  const [imageUrl, setImageUrl] = useState<string>()
  const [styledUrl, setStyledUrl] = useState<string>()
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

    try {
      const response = await apiClient.post<{
        styledImageUrl: string
        styleMeta?: { palette?: string; lighting?: string; caption?: string }
      }>('/photo-booth', {
        photoDataUrl: imageUrl,
        profession,
      })

      setStyledUrl(response.styledImageUrl)
    } catch (error) {
      setCameraError((error as Error).message)
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
              {['Comic-Book', 'Neon Glow', 'Studio Portrait', 'Futuristic'].map((style) => (
                <span key={style} className="rounded-full border border-white/20 px-3 py-1 text-white/70">
                  {style}
                </span>
              ))}
            </div>
            <button
              onClick={handleGenerate}
              className="w-full rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent/90"
            >
              Generate Portrait
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

          {styledUrl && (
            <div className="space-y-2 rounded-2xl border border-primary/40 bg-primary/10 p-4">
              <p className="text-sm text-white/60">AI-enhanced portrait</p>
              <img src={styledUrl} alt="AI Portrait" className="w-full rounded-xl border border-white/10 object-cover" />
              <div className="text-xs text-white/70">
                Sentiment: confident • Lighting: cinematic • Palette: vibrant blues + oranges
              </div>
            </div>
          )}
        </div>
      </div>
    </ActivityLayout>
  )
}

export default PhotoBooth
