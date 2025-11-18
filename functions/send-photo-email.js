const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const { ok, badRequest, serverError } = require('./response')
const { logEvent } = require('./db')

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM = process.env.RESEND_FROM || 'open-house@school.ai'

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    if (!RESEND_API_KEY) {
      return badRequest('RESEND_API_KEY is not configured')
    }

    const body = JSON.parse(event.body || '{}')
    const { email, styledImageUrl, profession, sessionId = null } = body

    if (!email || !styledImageUrl) {
      return badRequest('email and styledImageUrl are required')
    }

    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Your future career portrait</h2>
        <p>Profession: <strong>${profession || 'Future leader'}</strong></p>
        <p>Download or share the image below:</p>
        <p><img src="${styledImageUrl}" alt="Future Portrait" style="max-width: 480px; border-radius: 16px;" /></p>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: email,
        subject: 'Your AI future-career portrait',
        html,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Email provider error: ${errText}`)
    }

    await logEvent(sessionId, 'photo-booth', 'email-sent', { email })

    return ok({ delivered: true })
  } catch (error) {
    console.error('send-photo-email error', error)
    return serverError('Failed to send email', error.message)
  }
}

