import { useCallback } from 'react'
import { openRouterService } from '../services/openRouterService'
import { useAIRequest } from '../contexts/AIRequestContext'

export const useOpenRouter = () => {
  const { start, succeed, fail } = useAIRequest()

  const sendPrompt = useCallback(
    async <T,>(key: string, payload: Parameters<typeof openRouterService.chatCompletion>[0]) => {
      try {
        start(key)
        const result = await openRouterService.chatCompletion<T>(payload)
        succeed(key)
        return result
      } catch (error) {
        fail(key, (error as Error).message)
        throw error
      }
    },
    [fail, start, succeed],
  )

  return { sendPrompt }
}

