import { useCallback } from 'react'

export const CONFETTI_EVENT_NAME = 'confetti:fire'

export const useConfetti = () => {
  const fire = useCallback(() => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent(CONFETTI_EVENT_NAME))
  }, [])

  return { fire }
}

