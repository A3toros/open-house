import { useEffect, useMemo, useRef, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
// Load full functionality - import required plugins
import { loadBasic } from '@tsparticles/basic'
import { loadEmittersPlugin } from '@tsparticles/plugin-emitters'
import { loadLifeUpdater } from '@tsparticles/updater-life'
import { loadRotateUpdater } from '@tsparticles/updater-rotate'

const loadFull = async (engine: any) => {
  await loadBasic(engine)
  await loadEmittersPlugin(engine)
  await loadLifeUpdater(engine)
  await loadRotateUpdater(engine)
}
import { CONFETTI_EVENT_NAME } from '../../hooks/useConfetti'

const ConfettiOverlay = () => {
  const [visible, setVisible] = useState(false)
  const [burstKey, setBurstKey] = useState(0)
  const timeoutRef = useRef<number | null>(null)
  const [engineReady, setEngineReady] = useState(false)
  const visibleRef = useRef(false)
  const isSettingTimeoutRef = useRef(false)
  const timeoutStartTimeRef = useRef<number | null>(null)
  const timeoutGenerationRef = useRef(0)

  useEffect(() => {
    console.log('[ConfettiOverlay] Initializing particles engine...')
    initParticlesEngine(async (engine) => {
      await loadFull(engine)
    })
      .then(() => {
        console.log('[ConfettiOverlay] Particles engine ready')
        setEngineReady(true)
      })
      .catch((error) => {
        console.error('[ConfettiOverlay] engine init failed', error)
      })
  }, [])

  // Fix #1: When engine becomes ready, force rerender a burst if visibleRef is already true
  useEffect(() => {
    if (engineReady && visibleRef.current && !visible) {
      console.log('[ConfettiOverlay] Engine ready and visibleRef is true, forcing burst')
      setBurstKey((prev) => prev + 1)
      setVisible(true)
    }
  }, [engineReady, visible])

  useEffect(() => {
    const handler = () => {
      console.log('[ConfettiOverlay] Event received, current visibleRef:', visibleRef.current)
      // Clear any existing timeout first - CRITICAL to prevent immediate firing
      if (timeoutRef.current !== null) {
        console.log('[ConfettiOverlay] Clearing existing timeout:', timeoutRef.current)
        const oldTimeout = timeoutRef.current
        window.clearTimeout(oldTimeout)
        timeoutRef.current = null
        timeoutStartTimeRef.current = null
        timeoutGenerationRef.current += 1 // Increment generation to invalidate old timeouts
        console.log('[ConfettiOverlay] Cleared timeout, timeoutRef now:', timeoutRef.current, 'generation:', timeoutGenerationRef.current)
      }
      
      // Set ref FIRST (synchronous, immediate) - this persists across renders
      visibleRef.current = true
      console.log('[ConfettiOverlay] Set visibleRef.current to true, verified:', visibleRef.current)
      
      // Then update state (triggers re-render)
      console.log('[ConfettiOverlay] Setting visible state to true')
      setVisible(true)
      setBurstKey((prev) => {
        const newKey = prev + 1
        console.log('[ConfettiOverlay] Incrementing burstKey to:', newKey)
        return newKey
      })
      
      // Keep visible longer to ensure confetti plays fully
      // Prevent setting timeout if we're already in the process
      if (isSettingTimeoutRef.current) {
        console.log('[ConfettiOverlay] Already setting timeout, skipping')
        return
      }
      
      isSettingTimeoutRef.current = true
      const startTime = Date.now()
      const currentGeneration = timeoutGenerationRef.current
      timeoutStartTimeRef.current = startTime
      
      const timeoutId = window.setTimeout(() => {
        const elapsed = timeoutStartTimeRef.current ? Date.now() - timeoutStartTimeRef.current : 0
        console.log('[ConfettiOverlay] Timeout callback executed - elapsed:', elapsed, 'ms, timeoutRef:', timeoutRef.current, 'timeoutId:', timeoutId, 'generation:', currentGeneration, 'current gen:', timeoutGenerationRef.current, 'startTime:', timeoutStartTimeRef.current)
        isSettingTimeoutRef.current = false
        
        // Check if this timeout is still valid (generation matches and timeout ID matches)
        if (timeoutGenerationRef.current !== currentGeneration) {
          console.log('[ConfettiOverlay] ❌ Timeout generation mismatch, IGNORING. Expected:', currentGeneration, 'got:', timeoutGenerationRef.current)
          return
        }
        
        // Only hide if enough time has passed (prevent immediate firing)
        if (elapsed < 2500) {
          console.log('[ConfettiOverlay] ❌ Timeout fired too quickly, IGNORING. Elapsed:', elapsed, 'ms (need at least 2500ms)')
          return
        }
        
        if (timeoutRef.current !== timeoutId) {
          console.log('[ConfettiOverlay] ❌ Timeout ID mismatch, IGNORING. Expected:', timeoutId, 'got:', timeoutRef.current)
          return
        }
        
        if (!visibleRef.current) {
          console.log('[ConfettiOverlay] ❌ visibleRef is false, IGNORING')
          return
        }
        
        console.log('[ConfettiOverlay] ✅ All checks passed - Hiding confetti now')
        visibleRef.current = false
        setVisible(false)
        timeoutRef.current = null
        timeoutStartTimeRef.current = null
      }, 3000)
      timeoutRef.current = timeoutId
      isSettingTimeoutRef.current = false
      console.log('[ConfettiOverlay] Set timeout to hide after 3 seconds, timeoutId:', timeoutId, 'timeoutRef:', timeoutRef.current, 'startTime:', startTime, 'generation:', currentGeneration)
    }

    console.log('[ConfettiOverlay] Setting up event listener for:', CONFETTI_EVENT_NAME)
    window.addEventListener(CONFETTI_EVENT_NAME, handler as EventListener)
    return () => {
      console.log('[ConfettiOverlay] Removing event listener')
      window.removeEventListener(CONFETTI_EVENT_NAME, handler as EventListener)
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  const options = useMemo(
    () => ({
      fullScreen: { enable: true },
      detectRetina: true,
      fpsLimit: 120,
      particles: {
        number: { value: 0 },
        color: {
          value: [
            '#FFD700', // Bright gold
            '#FF6B6B', // Bright red
            '#4ECDC4', // Bright turquoise
            '#FFE66D', // Bright yellow
            '#FF8B94', // Bright pink
            '#95E1D3', // Bright mint
            '#F38181', // Bright coral
            '#AA96DA', // Bright purple
            '#FCBAD3', // Bright rose
            '#FFD93D', // Bright lemon
            '#6BCB77', // Bright green
            '#4D96FF', // Bright blue
          ],
        },
        shape: { 
          type: ['circle', 'square', 'star'],
        },
        opacity: {
          value: { min: 0.8, max: 1 },
        },
        size: {
          value: { min: 6, max: 12 },
        },
        life: {
          duration: {
            sync: false,
            value: { min: 2, max: 4 },
          },
          count: 1,
        },
        move: {
          enable: true,
          gravity: { 
            enable: true, 
            acceleration: 12,
            maxSpeed: 80,
          },
          speed: { min: 40, max: 80 },
          decay: 0.05,
          direction: 'none' as const,
          outModes: {
            default: 'destroy' as const,
          },
          trail: {
            enable: false,
          },
        },
        rotate: {
          value: { min: 0, max: 360 },
          direction: 'random',
          animation: { 
            enable: true, 
            speed: { min: 20, max: 50 },
          },
        },
        shadow: {
          enable: true,
          blur: 5,
          offset: {
            x: 2,
            y: 2,
          },
          color: {
            value: '#000000',
            opacity: 0.3,
          },
        },
      },
      emitters: [
        {
          life: { 
            duration: 0.3,
            count: 1,
          },
          rate: {
            delay: 0,
            quantity: 100,
          },
          position: { 
            x: 50, 
            y: 50,
            mode: 'percent' as const,
          },
          size: { 
            width: 100, 
            height: 100,
          },
          particles: {
            move: {
              angle: { 
                value: 270, 
                offset: { min: -60, max: 60 },
              },
              speed: { min: 40, max: 80 },
            },
            life: {
              duration: {
                sync: false,
                value: { min: 3, max: 5 },
              },
            },
            size: {
              value: { min: 8, max: 16 },
            },
            color: {
              value: [
                '#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8B94',
                '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FFD93D',
                '#6BCB77', '#4D96FF',
              ],
            },
          },
        },
      ],
    }),
    [],
  )

  // Only render when both visible and engine is ready
  // If visible is true but engine not ready, wait for engine
  // Note: visibleRef is used to track state, but we check visible state for rendering
  const shouldRender = visible && engineReady
  
  if (!shouldRender) {
    console.log('[ConfettiOverlay] Not rendering - visible:', visible, 'engineReady:', engineReady, 'visibleRef:', visibleRef.current, 'burstKey:', burstKey)
    return null
  }

  console.log('[ConfettiOverlay] Rendering confetti with burstKey:', burstKey, 'visible:', visible, 'visibleRef:', visibleRef.current)
  return (
    <Particles
      id={`confetti-overlay-${burstKey}`}
      key={burstKey}
      options={options}
      className="pointer-events-none fixed inset-0 z-[9999]"
    />
  )
}

export default ConfettiOverlay

