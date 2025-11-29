import { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StarsBackground } from '../ui/stars-background'
import { ShootingStars } from '../ui/shooting-stars'
import { presentationSlides, type Slide } from './presentationSlides'

interface PresentationModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PresentationModal = ({ isOpen, onClose }: PresentationModalProps) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [showImage, setShowImage] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [volume, setVolume] = useState(0.5)
  const [muted, setMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mouseActivityTimeoutRef = useRef<number | null>(null)

  const currentSlide: Slide | undefined = presentationSlides[currentSlideIndex]

  // Preload all images and audio
  useEffect(() => {
    // Preload audio
    const audioLink = document.createElement('link')
    audioLink.rel = 'preload'
    audioLink.as = 'audio'
    audioLink.href = '/audio.mp3'
    document.head.appendChild(audioLink)

    // Preload all images from slides
    const imageUrls = new Set<string>()
    presentationSlides.forEach((slide) => {
      if (slide.image && slide.imageType === 'image') {
        imageUrls.add(slide.image)
      }
    })

    // Preload images
    imageUrls.forEach((url) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = url
      document.head.appendChild(link)

      // Also preload using Image object for better caching
      const img = new Image()
      img.src = url
    })

    // Preload video
    const videoUrl = presentationSlides.find((slide) => slide.imageType === 'video')?.image
    if (videoUrl) {
      const videoLink = document.createElement('link')
      videoLink.rel = 'preload'
      videoLink.as = 'video'
      videoLink.href = videoUrl
      document.head.appendChild(videoLink)
    }

    return () => {
      // Cleanup preload links on unmount
      document.head.querySelectorAll('link[rel="preload"][as="audio"], link[rel="preload"][as="image"], link[rel="preload"][as="video"]').forEach((link) => {
        if (link.getAttribute('href')?.includes('audio.mp3') || 
            Array.from(imageUrls).some(url => link.getAttribute('href') === url) ||
            link.getAttribute('href') === videoUrl) {
          link.remove()
        }
      })
    }
  }, [])

  // Reset when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentSlideIndex(0)
      setShowImage(false)
      // Restart audio when presentation opens
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch((err) => {
          console.error('Error playing audio:', err)
        })
      }
    }
  }, [isOpen])

  // Restart audio when presentation loops back to first slide
  useEffect(() => {
    if (isOpen && currentSlideIndex === 0 && audioRef.current) {
      audioRef.current.currentTime = 0
      if (audioRef.current.paused) {
        audioRef.current.play().catch((err) => {
          console.error('Error playing audio:', err)
        })
      }
    }
  }, [isOpen, currentSlideIndex])

  // Auto-advance logic
  useEffect(() => {
    if (!isOpen || !currentSlide) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Show text for 5 seconds
    setShowImage(false)
    timeoutRef.current = setTimeout(() => {
      // If slide has an image, show it
      if (currentSlide.image) {
        setShowImage(true)
        // Show image for its duration (default 5 seconds)
        const imageDuration = currentSlide.imageDuration || 5000
        timeoutRef.current = setTimeout(() => {
          // Move to next slide (loop back to start)
          const nextIndex = (currentSlideIndex + 1) % presentationSlides.length
          setCurrentSlideIndex(nextIndex)
        }, imageDuration)
      } else {
        // No image, move to next slide after text duration (loop back to start)
        const nextIndex = (currentSlideIndex + 1) % presentationSlides.length
        setCurrentSlideIndex(nextIndex)
      }
    }, 5000) // Text display duration

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isOpen, currentSlideIndex, currentSlide, onClose])

  // Handle video playback
  useEffect(() => {
    if (videoRef.current && showImage && currentSlide?.imageType === 'video') {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch((err) => {
        console.error('Error playing video:', err)
      })
    }
  }, [showImage, currentSlide])

  // Handle audio playback
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.muted = muted
      audioRef.current.loop = true
    }
  }, [volume, muted])

  // Auto-play audio when presentation opens
  useEffect(() => {
    if (isOpen && audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error('Error playing audio:', err)
      })
    } else if (!isOpen && audioRef.current) {
      audioRef.current.pause()
    }
  }, [isOpen])

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleToggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
      setMuted(audioRef.current.muted)
    }
  }

  const handleToggleFullscreen = async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Mouse activity tracking - hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (!isOpen) return

    const handleMouseActivity = () => {
      setShowControls(true)
      
      // Clear existing timeout
      if (mouseActivityTimeoutRef.current) {
        clearTimeout(mouseActivityTimeoutRef.current)
      }
      
      // Set new timeout to hide controls after 3 seconds
      mouseActivityTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    // Initial timeout
    mouseActivityTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)

    // Track mouse movement, clicks, and keyboard activity
    window.addEventListener('mousemove', handleMouseActivity)
    window.addEventListener('mousedown', handleMouseActivity)
    window.addEventListener('keydown', handleMouseActivity)
    window.addEventListener('touchstart', handleMouseActivity)

    return () => {
      if (mouseActivityTimeoutRef.current) {
        clearTimeout(mouseActivityTimeoutRef.current)
      }
      window.removeEventListener('mousemove', handleMouseActivity)
      window.removeEventListener('mousedown', handleMouseActivity)
      window.removeEventListener('keydown', handleMouseActivity)
      window.removeEventListener('touchstart', handleMouseActivity)
    }
  }, [isOpen])

  // ESC key support - only exit fullscreen, don't close presentation
  useEffect(() => {
    if (!isOpen) return

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Exit fullscreen if in fullscreen
        if (document.fullscreenElement) {
          document.exitFullscreen()
        }
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="fixed inset-0 z-[9999]"
        style={{ overflow: 'visible' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Space sky background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27]" />

        {/* Stars overlay */}
        <StarsBackground
          starDensity={0.00015}
          allStarsTwinkle={true}
          twinkleProbability={0.7}
          minTwinkleSpeed={0.5}
          maxTwinkleSpeed={1}
        />

        {/* Shooting stars - only 1 at a time */}
        <ShootingStars
          minSpeed={10}
          maxSpeed={30}
          minDelay={2000}
          maxDelay={4000}
          starColor="#11E0FF"
          trailColor="#2EB9DF"
          starWidth={10}
          starHeight={1}
        />

        {/* Audio element */}
        <audio
          ref={audioRef}
          src="/audio.mp3"
          loop
          preload="auto"
          style={{ display: 'none' }}
        />

        {/* Close button */}
        <motion.button
          onClick={onClose}
          className="fixed top-4 right-4 z-50 p-3 rounded-full bg-[#1E2A49]/80 border border-[#11E0FF]/30 hover:border-[#11E0FF]/60 hover:bg-[#1E2A49] transition-colors backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: showControls ? 1 : 0,
            visibility: showControls ? 'visible' : 'hidden',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            pointerEvents: showControls ? 'auto' : 'none',
          }}
          aria-label="Close presentation"
        >
          <svg
            className="w-6 h-6 text-[#11E0FF]"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>

        {/* Text display - directly on space background */}
        <AnimatePresence mode="wait">
          {!showImage && currentSlide && (
            <motion.div
              key={`text-${currentSlideIndex}`}
              className="fixed top-1/2 left-1/2 font-bold text-white drop-shadow-[0_0_20px_rgba(17,224,255,0.5)] text-center"
              style={{ 
                overflow: 'visible', 
                background: 'transparent',
                backgroundColor: 'transparent',
                padding: 0,
                margin: 0,
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                transform: 'translate(-50%, -50%)',
                maxWidth: '95vw',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                textAlign: 'center'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(2rem, 8vw, 6rem)',
                  lineHeight: '1.2',
                  margin: 0,
                  padding: 0,
                }}
              >
                {currentSlide.text}
              </h2>
              {currentSlide.textThai && (
                <h2
                  style={{
                    fontSize: 'clamp(1.5rem, 6vw, 4.5rem)',
                    lineHeight: '1.3',
                    margin: '0.5em 0 0 0',
                    padding: 0,
                    opacity: 0.9,
                  }}
                >
                  {currentSlide.textThai}
                </h2>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image/Video display - fade in/out only */}
        <AnimatePresence mode="wait">
          {showImage && currentSlide?.image && (
            <motion.div
              key={`image-${currentSlideIndex}`}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[80vw] max-h-[60vh] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1]
              }}
            >
              {currentSlide.imageType === 'video' ? (
                <video
                  ref={videoRef}
                  src={currentSlide.image}
                  className="max-w-full max-h-full rounded-lg shadow-2xl"
                  muted
                  playsInline
                  loop={false}
                />
              ) : (
                <img
                  src={currentSlide.image}
                  alt=""
                  className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio controls - centered, visible on mouse activity */}
        <motion.div
          className="fixed bottom-4 z-50 flex items-center gap-4 p-4 rounded-xl bg-[#1E2A49]/80 border border-[#11E0FF]/30 backdrop-blur-sm"
          initial={{ opacity: 0, x: '-50%', y: 20 }}
          animate={{ 
            opacity: showControls ? 1 : 0,
            x: '-50%',
            y: showControls ? 0 : 20,
            visibility: showControls ? 'visible' : 'hidden',
          }}
          transition={{ duration: 0.2 }}
          style={{
            left: '50%',
            pointerEvents: showControls ? 'auto' : 'none',
          }}
        >
          {/* Mute button */}
          <motion.button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-[#1E2A49] border border-[#11E0FF]/30 hover:border-[#11E0FF]/60 hover:bg-[#1E2A49]/80 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={muted ? "Unmute audio" : "Mute audio"}
          >
            <svg
              className="w-5 h-5 text-[#11E0FF]"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {muted ? (
                <>
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M23 9l-6 6M17 9l6 6" />
                </>
              ) : (
                <>
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                </>
              )}
            </svg>
          </motion.button>

          {/* Fullscreen button */}
          <motion.button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-[#1E2A49] border border-[#11E0FF]/30 hover:border-[#11E0FF]/60 hover:bg-[#1E2A49]/80 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <svg
              className="w-5 h-5 text-[#11E0FF]"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isFullscreen ? (
                <>
                  <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
                </>
              ) : (
                <>
                  <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
                </>
              )}
            </svg>
          </motion.button>

          {/* Volume control */}
          <div className="flex items-center gap-2 min-w-[150px]">
            <svg
              className="w-5 h-5 text-[#11E0FF] flex-shrink-0"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {volume === 0 ? (
                <path d="M5 12h.01M17 12h.01M12 12h.01M12 19a7 7 0 01-7-7V9a7 7 0 017-7v17z" />
              ) : volume < 0.5 ? (
                <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07" />
              ) : (
                <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              )}
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-[#1E2A49] rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #11E0FF 0%, #11E0FF ${volume * 100}%, #1E2A49 ${volume * 100}%, #1E2A49 100%)`,
              }}
              aria-label="Volume control"
            />
            <span className="text-sm text-white min-w-[35px] text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

