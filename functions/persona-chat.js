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
        content: `You are ${persona.name}, ${persona.description}. Conversation style: ${persona.conversationStyle}

CRITICAL RULES - You are chatting with a 10-year-old child:
- Keep responses VERY SHORT: Maximum 1 sentence, ideally under 15 words
- Use simple words that a 10-year-old can easily understand
- Avoid complex vocabulary or abstract concepts
- Be friendly, encouraging, and fun
- Use age-appropriate language and examples
- NEVER write more than 1 sentence per response
- If you need to say more, keep it to one short sentence only`,
      },
      ...conversationLog,
      { role: 'user', content: message },
    ]

    const completion = await chatCompletion(
      {
        model: 'anthropic/claude-3-haiku',
        messages,
        max_tokens: 50, // Limit response length to ~50 tokens (roughly 1-2 sentences)
      },
      { activitySlug: 'persona-chat', retries: 3 },
    )

    let reply = completion?.choices?.[0]?.message?.content?.trim() || persona.greeting || ''
    
    // Enforce maximum length: if reply is too long, truncate at first sentence or 100 characters
    if (reply.length > 100) {
      const firstSentence = reply.split(/[.!?]/)[0]
      if (firstSentence && firstSentence.length <= 100) {
        reply = firstSentence + '.'
      } else {
        reply = reply.substring(0, 97) + '...'
      }
    }

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

