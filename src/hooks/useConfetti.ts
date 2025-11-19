import { useCallback } from 'react'

export const CONFETTI_EVENT_NAME = 'confetti:fire'

export const useConfetti = () => {
  const fire = useCallback(() => {
    if (typeof window === 'undefined') {
      console.log('[useConfetti] Window not available')
      return
    }
    console.log('[useConfetti] Firing confetti event:', CONFETTI_EVENT_NAME)
    window.dispatchEvent(new CustomEvent(CONFETTI_EVENT_NAME))
  }, [])

  return { fire }
}

