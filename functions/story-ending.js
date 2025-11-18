const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { logEvent } = require('./db')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()

  const body = JSON.parse(event.body || '{}')
  const { story, mood, sessionId = null } = body

  if (!story || !mood) {
    return badRequest('story and mood are required')
  }

  try {
    const completion = await chatCompletion(
      {
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'user',
            content: `Rewrite only the ending paragraph of this story with mood "${mood}". Story:\n${story}`,
          },
        ],
      },
      { activitySlug: 'story-ending', retries: 3 },
    )

    const newEnding = completion?.choices?.[0]?.message?.content?.trim() || ''

    await logEvent(sessionId, 'story-forge', 'ending-variant', { mood })

    return ok({ ending: newEnding })
  } catch (error) {
    console.error('story-ending error', error)
    return serverError('Failed to generate alternate ending', error.message)
  }
}

