const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const {
      personality = 'kind',
      purpose = 'study buddy',
      tone = 'supportive',
      visitorId = null,
      sessionId = null,
    } = body

    const completion = await chatCompletion(
      {
        model: 'anthropic/claude-3-haiku',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `You are designing an AI persona that will chat with a 10-year-old child. The persona should have personality "${personality}", purpose "${purpose}", tone "${tone}".

IMPORTANT: This AI will speak to a 10-year-old child, so:
- Use simple words and short sentences that a 10-year-old can easily understand
- Avoid complex vocabulary or abstract concepts
- Be friendly, encouraging, and fun
- Keep all responses age-appropriate

Return JSON with keys: name, description, greeting, conversationStyle.`,
          },
        ],
      },
      { activitySlug: 'persona-builder' },
    )

    const content = completion?.choices?.[0]?.message?.content || '{}'
    let persona
    try {
      persona = typeof content === 'string' ? JSON.parse(content) : content
    } catch {
      persona = {
        name: 'Nova',
        description: 'A friendly AI friend who loves learning and fun stories.',
        greeting: 'Hi! Ready for a fun adventure?',
        conversationStyle: 'Use simple words. Ask short questions. Be happy and encouraging. Talk like you\'re talking to a 10-year-old friend.',
      }
    }

    const sql = getSql()
    const inserted = await sql`
      INSERT INTO personas (session_id, persona_spec, conversation_log)
      VALUES (${sessionId}, ${JSON.stringify(persona)}, ${JSON.stringify([])})
      RETURNING id
    `

    const personaId = inserted[0].id

    await logEvent(sessionId, 'persona-builder', 'persona-created', {
      visitorId,
      personaId,
    })

    return ok({ personaId, persona })
  } catch (error) {
    console.error('persona-builder error', error)
    return serverError('Persona builder failed', error.message)
  }
}

