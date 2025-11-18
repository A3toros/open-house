import { useEffect, useMemo, useRef, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { CONFETTI_EVENT_NAME } from '../../hooks/useConfetti'

const ConfettiOverlay = () => {
  const [visible, setVisible] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const timeoutRef = useRef<number | null>(null)
  const [engineReady, setEngineReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    })
      .then(() => {
        setEngineReady(true)
      })
      .catch((error) => {
        console.error('[ConfettiOverlay] engine init failed', error)
      })
  }, [])

  useEffect(() => {
    const handler = () => {
      // Always set visible when event fires, even if engine not ready yet
      // The component will render once engine is ready
      setVisible(true)
      setBurstKey((prev) => prev + 1)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      // Keep visible longer to ensure confetti plays fully
      timeoutRef.current = window.setTimeout(() => setVisible(false), 3000)
    }

    window.addEventListener(CONFETTI_EVENT_NAME, handler as EventListener)
    return () => {
      window.removeEventListener(CONFETTI_EVENT_NAME, handler as EventListener)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const options = useMemo(
    () => ({
      fullScreen: { enable: false },
      detectRetina: true,
      duration: 2,
      fpsLimit: 120,
      particles: {
        number: { value: 0 },
        color: {
          value: ['#4B6BFB', '#F97316', '#38BDF8', '#FDE047', '#22C55E'],
        },
        shape: { type: ['circle', 'square'] },
        opacity: {
          value: { min: 0.6, max: 1 },
        },
        size: {
          value: { min: 2, max: 6 },
        },
        life: {
          duration: { sync: true, value: 3 },
          count: 1,
        },
        move: {
          enable: true,
          gravity: { enable: true, acceleration: 15 },
          speed: { min: 20, max: 40 },
          decay: 0.05,
          direction: 'none' as const,
          outModes: {
            default: 'destroy' as const,
            top: 'none' as const,
          },
        },
        rotate: {
          direction: 'random',
          animation: { enable: true, speed: 30 },
        },
        tilt: {
          direction: 'random',
          enable: true,
          animation: { enable: true, speed: 40 },
        },
      },
      emitters: {
        life: { duration: 0.3, count: 1 },
        rate: {
          delay: 0,
          quantity: 30,
        },
        position: { x: 50, y: 50 },
        size: { width: 100, height: 0 },
        particles: {
          move: {
            angle: { value: 270, offset: { min: -30, max: 30 } },
          },
        },
      },
    }),
    [],
  )

  // Only render when both visible and engine is ready
  // If visible is true but engine not ready, wait for engine
  if (!visible || !engineReady) {
    return null
  }

  return (
    <Particles
      id={`confetti-overlay-${burstKey}`}
      key={burstKey}
      options={options}
      className="pointer-events-none fixed inset-0 z-50"
    />
  )
}

export default ConfettiOverlay

