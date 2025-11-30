const nodemailer = require('nodemailer')
const { ok, badRequest, serverError } = require('./response')
const { logEvent } = require('./db')

const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
const GMAIL_FROM_NAME = process.env.GMAIL_FROM_NAME || 'EP Open House'

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return badRequest('GMAIL_USER and GMAIL_APP_PASSWORD are required')
    }

    const body = JSON.parse(event.body || '{}')
    const { email, styledImageUrl, profession, characterType, sessionId = null } = body

    if (!email || !styledImageUrl) {
      return badRequest('email and styledImageUrl are required')
    }

    // Create Gmail transporter
    // Remove any spaces from app password (Google app passwords don't have spaces)
    const cleanAppPassword = GMAIL_APP_PASSWORD.replace(/\s+/g, '')
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER.trim(),
        pass: cleanAppPassword,
      },
    })
    
    // Verify transporter configuration
    console.log('[send-photo-email] Gmail config:', {
      user: GMAIL_USER.trim(),
      passwordLength: cleanAppPassword.length,
      passwordPreview: cleanAppPassword.substring(0, 4) + '...',
    })

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

    // Update HTML to use attachment CID for inline image
    let htmlWithImage = html
    if (imageCid) {
      // Replace the attachment notice section with the actual inline image
      const imageSection = `
    <!-- Image -->
    <div style="text-align: center; margin-bottom: 40px;">
      <img src="cid:${imageCid}" alt="Portrait" style="max-width: 100%; max-height: 600px; height: auto; border-radius: 12px; border: 2px solid ${accentColor}; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);" />
    </div>
`
      // Replace the "Image Notice" section with the actual image
      htmlWithImage = html.replace(
        /<!-- Image Notice -->[\s\S]*?<\/div>/,
        imageSection
      )
    }

    // Prepare email options for nodemailer
    const mailOptions = {
      from: `${GMAIL_FROM_NAME} <${GMAIL_USER}>`,
      to: email,
      subject: emailSubject,
      html: htmlWithImage,
    }

    // Add attachment if we have image buffer
    if (imageBuffer && imageCid) {
      mailOptions.attachments = [
        {
          filename: 'future-portrait.png',
          content: imageBuffer,
          cid: imageCid, // Content ID for inline image
        },
      ]
      console.log('[send-photo-email] Added image as attachment with CID:', imageCid)
    }

    // Send email using Gmail SMTP
    const info = await transporter.sendMail(mailOptions)
    console.log('[send-photo-email] Email sent successfully:', info.messageId)

    await logEvent(sessionId, 'photo-booth', 'email-sent', { email })

    return ok({ delivered: true })
  } catch (error) {
    console.error('send-photo-email error', error)
    return serverError('Failed to send email', error.message)
  }
}

