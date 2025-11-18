const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')
const { nanoid } = require('nanoid')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { photoDataUrl, profession = 'Future explorer', style = 'Neon sci-fi', sessionId = null, visitorId = null } = body

    if (!photoDataUrl || typeof photoDataUrl !== 'string') {
      return badRequest('photoDataUrl is required')
    }

    const [, base64] = photoDataUrl.split(',')
    if (!base64) return badRequest('Invalid photoDataUrl')
    const photoBuffer = Buffer.from(base64, 'base64')
    if (photoBuffer.length > 5 * 1024 * 1024) {
      return badRequest('Photo must be under 5MB')
    }

    const styledPromptResponse = await chatCompletion(
      {
        model: 'anthropic/claude-3-haiku',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: `Create JSON with keys: caption (string), palette (string), lighting (string) describing a ${style} portrait of a ${profession}.`,
          },
        ],
      },
      { activitySlug: 'photo-booth' },
    )

    let styleMeta
    try {
      const content = styledPromptResponse?.choices?.[0]?.message?.content || '{}'
      styleMeta = typeof content === 'string' ? JSON.parse(content) : content
    } catch {
      styleMeta = { caption: `Future ${profession}`, palette: 'neon blues', lighting: 'studio glow' }
    }

    const styledImageUrl = `https://api.dicebear.com/7.x/adventurer/png?seed=${encodeURIComponent(profession)}`

    const sql = getSql()
    await sql`
      INSERT INTO photo_creations (session_id, profession, original_url, styled_url, email_sent)
      VALUES (${sessionId}, ${profession}, ${null}, ${styledImageUrl}, false)
    `

    await logEvent(sessionId, 'photo-booth', 'photo-generated', {
      visitorId,
      profession,
      style,
    })

    return ok({
      rawPhotoBytes: photoBuffer.length,
      profession,
      styledImageUrl,
      styleMeta,
    })
  } catch (error) {
    console.error('photo-booth error', error)
    return serverError('Photo booth failed', error.message)
  }
}

