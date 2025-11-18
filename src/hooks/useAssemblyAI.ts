import { useCallback } from 'react'
import { assemblyAiService } from '../services/assemblyAiService'
import { useAIRequest } from '../contexts/AIRequestContext'

export const useAssemblyAI = () => {
  const { start, succeed, fail } = useAIRequest()

  const transcribe = useCallback(
    async (key: string, base64Audio: string, mime: string) => {
      try {
        start(key)
        const result = await assemblyAiService.transcribeAudio(base64Audio, mime)
        succeed(key)
        return result
      } catch (error) {
        fail(key, (error as Error).message)
        throw error
      }
    },
    [fail, start, succeed],
  )

  return { transcribe }
}

