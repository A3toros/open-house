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
            content: `Design an AI persona with personality "${personality}", purpose "${purpose}", tone "${tone}". Return JSON with keys: name, description, greeting, conversationStyle.`,
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
        description: 'A supportive AI friend who loves STEM and storytelling.',
        greeting: 'Hi! Ready for a fun learning mission?',
        conversationStyle: 'Ask short questions, cheer often, mix English with Thai keywords.',
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

