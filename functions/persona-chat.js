const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { personaId, message, sessionId = null } = body
    if (!personaId || !message) return badRequest('personaId and message are required')

    const sql = getSql()
    const rows = await sql`
      SELECT persona_spec, conversation_log FROM personas WHERE id = ${personaId}
    `
    if (rows.length === 0) return badRequest('Persona not found')

    const persona = rows[0].persona_spec
    const conversationLog = rows[0].conversation_log || []
    const messages = [
      {
        role: 'system',
        content: `You are ${persona.name}, ${persona.description}. Conversation style: ${persona.conversationStyle}`,
      },
      ...conversationLog,
      { role: 'user', content: message },
    ]

    const completion = await chatCompletion(
      {
        model: 'anthropic/claude-3-haiku',
        messages,
      },
      { activitySlug: 'persona-chat', retries: 3 },
    )

    const reply = completion?.choices?.[0]?.message?.content?.trim() || persona.greeting || ''

    const updatedLog = [...conversationLog, { role: 'user', content: message }, { role: 'assistant', content: reply }]

    await sql`
      UPDATE personas SET conversation_log = ${JSON.stringify(updatedLog)} WHERE id = ${personaId}
    `

    await logEvent(sessionId, 'persona-chat', 'message', { personaId })

    return ok({ reply })
  } catch (error) {
    console.error('persona-chat error', error)
    return serverError('Persona chat failed', error.message)
  }
}

