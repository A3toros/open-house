const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const {
      genre = 'fantasy',
      traits = 'kind + curious',
      plot = 'world in danger',
      starter = 'Once upon a time...',
      sessionId = null,
    } = body

    const completion = await chatCompletion(
      {
        model: 'anthropic/claude-3-haiku',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `You are a creative partner for middle-school writers. Return JSON with keys: story (6-8 sentences string), grammarTips (array), alternateEndings (array). Details: Genre=${genre}, Traits=${traits}, Plot=${plot}, Starter="${starter}".`,
          },
        ],
      },
      { activitySlug: 'story-forge', retries: 3 },
    )

    const rawContent = completion?.choices?.[0]?.message?.content || '{}'
    let storyPayload
    try {
      storyPayload = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent
    } catch {
      storyPayload = { story: rawContent, grammarTips: [], alternateEndings: [] }
    }

    const sql = getSql()
    await sql`
      INSERT INTO stories (session_id, genre, traits, plot, base_story, ending_variations, grammar_tips)
      VALUES (
        ${sessionId},
        ${genre},
        ${traits},
        ${plot},
        ${storyPayload.story || ''},
        ${JSON.stringify(storyPayload.alternateEndings || [])},
        ${JSON.stringify(storyPayload.grammarTips || [])}
      )
    `

    await logEvent(sessionId, 'story-forge', 'story-generated', { genre, traits, plot })

    return ok({
      story: storyPayload.story,
      grammarTips: storyPayload.grammarTips || [],
      alternateEndings: storyPayload.alternateEndings || [],
    })
  } catch (error) {
    console.error('story-forge error', error)
    return serverError('Story Forge failed', error.message)
  }
}

