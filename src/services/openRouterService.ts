type OpenRouterRequest = {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  response_format?: { type: 'text' | 'json_object' }
}

const OPENROUTER_BASE = '/api/openrouter'

export const openRouterService = {
  async chatCompletion<T = unknown>(payload: OpenRouterRequest): Promise<T> {
    const response = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw new Error('OpenRouter request failed')
    }
    return response.json()
  },
}

