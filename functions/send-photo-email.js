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
    const { email, styledImageUrl, profession, characterType, sessionId = null } = body

    if (!email || !styledImageUrl) {
      return badRequest('email and styledImageUrl are required')
    }

    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
      if (!text) return ''
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    }

    const safeProfession = escapeHtml(profession || 'Future Innovator')
    
    // Determine if this is a superhero email
    const isSuperhero = characterType === 'superhero' || characterType === 'villain'
    const isHero = characterType === 'superhero'
    const isVillain = characterType === 'villain'
    
    // Color scheme: blue for hero, red for villain, cyan for regular
    const primaryColor = isHero ? '#11E0FF' : isVillain ? '#EF4444' : '#11E0FF'
    const secondaryColor = isHero ? '#4DD0E1' : isVillain ? '#DC2626' : '#FFB743'
    const accentColor = isHero ? '#11E0FF' : isVillain ? '#EF4444' : '#FFB743'
    
    // Email subject and caption
    const emailSubject = isSuperhero 
      ? (isHero ? `🦸 Your Superhero Portrait: ${safeProfession}` : `🦹 Your Super Villain Portrait: ${safeProfession}`)
      : `🎨 Your Future Career Portrait: ${safeProfession}`
    
    const emailTitle = isSuperhero
      ? (isHero ? '🦸 Your Superhero Portrait' : '🦹 Your Super Villain Portrait')
      : '🎨 Your Future Career Portrait'
    
    const characterLabel = isSuperhero
      ? (isHero ? 'Your Superhero Name' : 'Your Super Villain Name')
      : 'Your Future Profession'

    // Convert base64 to buffer for email attachment
    let imageBuffer = null
    let imageCid = null
    if (styledImageUrl && styledImageUrl.startsWith('data:image')) {
      try {
        // Extract base64 data from data URL
        const base64Data = styledImageUrl.split(',')[1]
        imageBuffer = Buffer.from(base64Data, 'base64')
        imageCid = `portrait-${Date.now()}`
        console.log('[send-photo-email] Converted base64 to buffer, size:', imageBuffer.length)
      } catch (bufferError) {
        console.error('[send-photo-email] Failed to convert base64 to buffer:', bufferError)
      }
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailTitle}</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #10152A 0%, #1C2340 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="width: 100%; min-height: 100vh; padding: 60px 20px; background: linear-gradient(135deg, #10152A 0%, #1C2340 100%);">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 50px;">
      <h1 style="margin: 0 0 10px 0; color: ${primaryColor}; font-size: 42px; font-weight: 700; letter-spacing: -0.5px;">
        ${emailTitle}
      </h1>
      <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 18px;">
        EP & AI – Empowering Future Minds
      </p>
    </div>

    <!-- Character Name / Profession -->
    <div style="text-align: center; margin-bottom: 40px; padding: 30px 20px; background: rgba(${isHero ? '17, 224, 255' : isVillain ? '239, 68, 68' : '17, 224, 255'}, 0.1); border-radius: 20px; border: 2px solid rgba(${isHero ? '17, 224, 255' : isVillain ? '239, 68, 68' : '17, 224, 255'}, 0.3);">
      <p style="margin: 0 0 12px 0; color: ${primaryColor}; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
        ${characterLabel}
      </p>
      <p style="margin: 0; color: #FFFFFF; font-size: 36px; font-weight: 700;">
        ${safeProfession}
      </p>
    </div>

    <!-- Image Notice -->
    <div style="text-align: center; margin-bottom: 40px; padding: 30px 20px; background: rgba(${isHero ? '17, 224, 255' : isVillain ? '239, 68, 68' : '255, 183, 67'}, 0.1); border-radius: 16px; border: 2px solid rgba(${isHero ? '17, 224, 255' : isVillain ? '239, 68, 68' : '255, 183, 67'}, 0.3);">
      <p style="margin: 0 0 8px 0; color: ${accentColor}; font-size: 24px;">
        📎 Your portrait is attached!
      </p>
      <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.6;">
        ${isSuperhero 
          ? (isHero ? 'Check the attachment below to see your AI-generated superhero portrait!' : 'Check the attachment below to see your AI-generated super villain portrait!')
          : 'Check the attachment below to see your AI-generated future career portrait.'}
      </p>
    </div>

    <!-- Message -->
    <div style="max-width: 600px; margin: 0 auto 40px auto; padding: 30px 25px; background: rgba(${isHero ? '17, 224, 255' : isVillain ? '239, 68, 68' : '17, 224, 255'}, 0.08); border-radius: 16px; border-left: 4px solid ${primaryColor};">
      <p style="margin: 0 0 16px 0; color: #FFFFFF; font-size: 18px; line-height: 1.7; font-weight: 500;">
        ${isSuperhero 
          ? (isHero ? '🌟 Amazing work! You\'re a true superhero!' : '🌟 Amazing work! You\'re a super villain!')
          : '🌟 Amazing work! This is how AI sees you in the future!'}
      </p>
      <p style="margin: 0; color: rgba(255, 255, 255, 0.85); font-size: 16px; line-height: 1.7;">
        ${isSuperhero 
          ? 'You can download your portrait, share it with your family, or print it out to remember your superhero identity!'
          : 'You can download your portrait, share it with your family, or print it out to remember your future career dreams!'}
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 40px; border-top: 1px solid rgba(${isHero ? '17, 224, 255' : isVillain ? '239, 68, 68' : '17, 224, 255'}, 0.2);">
      <p style="margin: 0 0 8px 0; color: rgba(255, 255, 255, 0.6); font-size: 14px;">
        ${isSuperhero 
          ? (isHero ? '💫 Keep saving the day, hero! 💫' : '💫 Keep causing mischief, villain! 💫')
          : '💫 Keep dreaming big and working hard! 💫'}
      </p>
      <p style="margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 12px;">
        Mathayomwatsing English Program
      </p>
    </div>

  </div>
</body>
</html>
    `

    // Prepare email payload
    const emailPayload = {
      from: RESEND_FROM,
      to: email,
      subject: emailSubject,
      html,
    }

    // Add attachment if we have image buffer
    if (imageBuffer && imageCid) {
      emailPayload.attachments = [
        {
          filename: 'future-portrait.png',
          content: imageBuffer.toString('base64'),
          cid: imageCid, // Content ID for inline image
        },
      ]
      console.log('[send-photo-email] Added image as attachment with CID:', imageCid)
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
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

