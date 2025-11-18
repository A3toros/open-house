const { ok, badRequest, serverError } = require('./response')
const { logEvent } = require('./db')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { sessionId, activitySlug, eventType, payload } = body
    if (!sessionId || !activitySlug || !eventType) {
      return badRequest('sessionId, activitySlug, and eventType are required')
    }

    await logEvent(sessionId, activitySlug, eventType, payload || {})
    return ok({ logged: true })
  } catch (error) {
    console.error('log-event error', error)
    return serverError('Failed to log event', error.message)
  }
}

