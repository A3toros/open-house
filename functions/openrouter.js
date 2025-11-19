const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const crypto = require('crypto')
const { getSql } = require('./db')

// Model configuration (inlined to avoid bundling issues)
const activityModels = {
  'voice-challenge': {
    primary: 'openai/gpt-4o-mini',
    fallback: 'anthropic/claude-3-haiku',
  },
  'photo-booth': {
    primary: 'google/gemini-2.5-flash-image-preview',
    fallback: 'stability/illustration-diffusion',
  },
  'story-forge': {
    primary: 'anthropic/claude-3-haiku',
    fallback: 'mistralai/mistral-nemo-mini',
  },
  'story-ending': {
    primary: 'anthropic/claude-3-haiku',
  },
  'culture-translator': {
    primary: 'nousresearch/nous-hermes-2-vision-7b',
    fallback: 'allenai/molmo-7b-d',
  },
  'escape-mission': {
    primary: 'anthropic/claude-3-haiku',
    fallback: 'meta-llama/llama-3.1-8b-instruct',
  },
  'debate-arena': {
    primary: 'anthropic/claude-3-haiku',
    fallback: 'meta-llama/llama-3.1-8b-instruct',
  },
  'persona-builder': {
    primary: 'anthropic/claude-3-haiku',
    fallback: 'mistralai/mistral-nemo-mini',
  },
  'vocabulary-rpg': {
    primary: 'anthropic/claude-3-haiku',
  },
  'parent-corner': {
    primary: 'anthropic/claude-3-haiku',
  },
}

function getModelForActivity(activitySlug) {
  const envKey = `VITE_MODEL_${activitySlug.toUpperCase().replace(/-/g, '_')}`
  const envOverride = process.env[envKey]
  if (envOverride) {
    return { primary: envOverride }
  }
  return activityModels[activitySlug] || { primary: 'anthropic/claude-3-haiku' }
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

if (!OPENROUTER_API_KEY) {
  console.warn('OPENROUTER_API_KEY is not set. OpenRouter calls will fail.')
}

const hashPayload = (payload) =>
  crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')

const getCacheEntry = async (requestHash) => {
  try {
    const sql = getSql()
    const rows = await sql`
      SELECT payload, created_at
      FROM ai_cache
      WHERE request_hash = ${requestHash}
        AND created_at > now() - interval '30 minutes'
    `
    return rows[0]
  } catch (error) {
    console.error('Cache get error (non-fatal):', error.message)
    return null // Return null on cache error, function will continue without cache
  }
}

const setCacheEntry = async (requestHash, activitySlug, payload) => {
  try {
    const sql = getSql()
    await sql`
      INSERT INTO ai_cache (request_hash, activity_slug, payload)
      VALUES (${requestHash}, ${activitySlug}, ${JSON.stringify(payload)})
      ON CONFLICT (request_hash) DO UPDATE SET payload = ${JSON.stringify(payload)}, created_at = now()
    `
  } catch (error) {
    console.error('Cache set error (non-fatal):', error.message)
    // Don't throw - cache is optional, function should continue
  }
}

async function chatCompletion(payload, options = {}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is required')
  }

  const activitySlug = options.activitySlug || 'general'
  const useCache = options.cache !== false
  const requestHash = useCache ? hashPayload({ activitySlug, payload }) : null

  if (requestHash) {
    const cached = await getCacheEntry(requestHash)
    if (cached) {
      return cached.payload
    }
  }

  const maxRetries = options.retries ?? 3
  let lastError

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      const modelConfig = getModelForActivity(activitySlug)
      const requestPayload = {
        ...payload,
        model: payload.model || modelConfig.primary,
      }

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.URL || 'https://ep-open-house.netlify.app',
          'X-Title': 'Mathayomwatsing EP Open House 2025',
        },
        body: JSON.stringify(requestPayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter error (${response.status}): ${errorText}`)
      }

      const data = await response.json()

      if (requestHash) {
        await setCacheEntry(requestHash, activitySlug, data)
      }

      return data
    } catch (error) {
      lastError = error
      const delay = Math.min(1000, 300 * Math.pow(2, attempt))
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

module.exports = {
  chatCompletion,
}

