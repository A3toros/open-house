const { ok, badRequest, serverError } = require('./response')
const { chatCompletion } = require('./openrouter')
const { getSql, logEvent } = require('./db')
const { nanoid } = require('nanoid')

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok()
  if (event.httpMethod !== 'POST') return badRequest('Use POST')

  try {
    const body = JSON.parse(event.body || '{}')
    const { photoDataUrl, transcript, characterType = 'superhero', style = '', sessionId = null, visitorId = null } = body

    if (!photoDataUrl || typeof photoDataUrl !== 'string') {
      return badRequest('photoDataUrl is required')
    }
    if (!transcript || typeof transcript !== 'string') {
      return badRequest('transcript is required')
    }

    const [, base64] = photoDataUrl.split(',')
    if (!base64) return badRequest('Invalid photoDataUrl')
    const photoBuffer = Buffer.from(base64, 'base64')
    if (photoBuffer.length > 5 * 1024 * 1024) {
      return badRequest('Photo must be under 5MB')
    }

    // Build style-specific prompt instructions
    const superheroStyles = {
      'Classic Hero': 'classic superhero style, bold and heroic, vibrant primary colors (red, blue, yellow), dynamic heroic pose, cape flowing, confident expression, comic book aesthetic',
      'Cosmic Champion': 'cosmic superhero style, space-themed costume with stars and galaxies, glowing cosmic energy, ethereal lighting, powerful stance, otherworldly atmosphere',
      'Mighty Protector': 'mighty protector style, strong and powerful appearance, armor-like elements, shield or protective gear visible, determined expression, heroic and trustworthy',
    }

    const villainStyles = {
      'Dark Villain': 'dark villain style, menacing appearance, dark colors (black, dark purple, dark red), shadowy atmosphere, sinister expression, dramatic lighting',
      'Sinister Shadow': 'sinister shadow style, mysterious and threatening, dark cloak or shadow effects, glowing eyes, ominous presence, gothic aesthetic',
      'Evil Mastermind': 'evil mastermind style, intelligent and cunning appearance, dark suit or costume, calculating expression, dramatic shadows, villainous but sophisticated',
    }

    const allStyles = { ...superheroStyles, ...villainStyles }
    // Ensure we have a valid style, default to first option if style is empty or invalid
    const defaultStyle = characterType === 'superhero' ? 'Classic Hero' : 'Dark Villain'
    const validStyle = style && allStyles[style] ? style : defaultStyle
    const stylePrompt = allStyles[validStyle] || allStyles[defaultStyle]
    
    console.log('[superhero-portrait] Style mapping:', { requested: style, validStyle, stylePrompt: stylePrompt.substring(0, 100) })

    // First, analyze the transcript to extract character name and superpowers
    console.log('[superhero-portrait] Analyzing transcript for character type:', characterType)
    const analysisPrompt = characterType === 'superhero'
      ? `Analyze this student's speech about their good qualities: "${transcript}"

Based on their qualities, create:
1. A creative superhero name (kid-friendly, 1-3 words)
2. 3-5 superpowers that match their qualities (each 1-4 words, fun and appropriate for kids)
3. A brief description (1-2 sentences)

Return ONLY valid JSON:
{
  "characterName": "string",
  "superpowers": ["power1", "power2", "power3"],
  "description": "string"
}`
      : `Analyze this student's speech about their bad qualities: "${transcript}"

Based on their qualities, create:
1. A creative super villain name (kid-friendly, 1-3 words, not scary)
2. 3-5 "villain powers" that match their qualities (each 1-4 words, fun and appropriate for kids, like "Mischief Master" or "Gadget Creator")
3. A brief description (1-2 sentences, playful not scary)

Return ONLY valid JSON:
{
  "characterName": "string",
  "superpowers": ["power1", "power2", "power3"],
  "description": "string"
}`

    let analysis
    try {
      const analysisResponse = await chatCompletion({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.8,
      })

      const analysisText = analysisResponse.choices?.[0]?.message?.content || ''
      console.log('[superhero-portrait] Analysis response:', analysisText.substring(0, 200))

      // Extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in analysis response')
      }
    } catch (analysisError) {
      console.error('[superhero-portrait] Analysis failed, using defaults:', analysisError)
      // Fallback defaults
      analysis = {
        characterName: characterType === 'superhero' ? 'Super Hero' : 'Super Villain',
        superpowers: ['Super Strength', 'Flight', 'Laser Vision'],
        description: `A ${characterType === 'superhero' ? 'brave hero' : 'mischievous villain'} with amazing powers!`,
      }
    }

    // Create the image generation prompt - realistic portrait style like photo-booth
    const characterTypeText = characterType === 'superhero' ? 'superhero' : 'super villain'
    const imagePrompt = `Generate a realistic portrait showing this person as a ${characterTypeText} named "${analysis.characterName}". Style: ${stylePrompt}. Keep facial features recognizable and realistic. The portrait should be photorealistic, not cartoon or illustration. Show the person wearing ${characterType === 'superhero' ? 'heroic' : 'villainous'} costume and accessories appropriate for a ${characterTypeText}, but maintain realistic photography quality. Return the image URL only.`

    // Generate image - try primary model first, then fallback
    const models = ['google/gemini-2.5-flash-image-preview', 'stability/illustration-diffusion']
    let imageResponse
    let lastError
    let usedModel

    for (const model of models) {
      usedModel = model
      console.log('[superhero-portrait] Attempting image generation with model:', model, {
        characterType,
        characterName: analysis.characterName,
        style,
        photoSize: photoBuffer.length,
      })

      try {
        imageResponse = await chatCompletion({
          model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: photoDataUrl,
                  },
                },
                {
                  type: 'text',
                  text: imagePrompt,
                },
              ],
            },
          ],
          temperature: 0.7,
        })

        console.log('[superhero-portrait] Image generation response received from', model, {
          hasChoices: !!imageResponse.choices,
          choicesLength: imageResponse.choices?.length || 0,
          responseKeys: Object.keys(imageResponse || {}),
        })

        // Check if response contains text instead of image (e.g., Gemini refusal)
        const textResponse = imageResponse.choices?.[0]?.message?.content
        if (typeof textResponse === 'string' && textResponse.length > 0) {
          const lowerText = textResponse.toLowerCase()
          if (lowerText.includes("can't") || lowerText.includes("cannot") || lowerText.includes("prevent") || 
              lowerText.includes("refuse") || lowerText.includes("safety") || lowerText.includes("child") ||
              lowerText.includes("individual")) {
            console.warn('[superhero-portrait] Model refused to generate:', textResponse.substring(0, 200))
            // Continue to next model if available
            if (model === models[0] && models.length > 1) {
              lastError = new Error('Model refused to generate image based on child photo')
              continue
            }
            throw new Error('The AI model cannot generate images based on photos of children for safety reasons. Please try using a different image or contact support.')
          }
        }

        if (imageResponse.choices && imageResponse.choices.length > 0) {
          // Check if we actually got an image, not just text
          const hasImage = imageResponse.choices[0]?.message?.images || 
                          imageResponse.choices[0]?.message?.image_url ||
                          imageResponse.choices[0]?.message?.image
          if (hasImage || !textResponse) {
            break // Success, exit loop
          }
        }
      } catch (apiError) {
        lastError = apiError
        console.error(`[superhero-portrait] ${model} API error:`, {
          message: apiError.message,
          stack: apiError.stack,
        })
        // Continue to next model
        continue
      }
    }

    if (!imageResponse) {
      throw new Error(`Image generation failed with all models. Last error: ${lastError?.message || 'Unknown error'}`)
    }

    // Helper function to recursively search for image URLs in the response
    const findImageUrl = (obj, path = '') => {
      if (obj === null || obj === undefined) return null
      
      if (typeof obj === 'string') {
        if (obj.startsWith('http://') || obj.startsWith('https://') || obj.startsWith('data:image')) {
          console.log(`[superhero-portrait] Found image URL string at path: ${path}`)
          return obj
        }
        return null
      }
      
      if (typeof obj !== 'object') return null
      
      if (obj.url && typeof obj.url === 'string' && (obj.url.startsWith('http') || obj.url.startsWith('data:image'))) {
        console.log(`[superhero-portrait] Found image URL at path: ${path}.url`)
        return obj.url
      }
      if (obj.image_url) {
        const url = typeof obj.image_url === 'string' ? obj.image_url : obj.image_url.url
        if (url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:image'))) {
          console.log(`[superhero-portrait] Found image URL at path: ${path}.image_url`)
          return url
        }
      }
      if (obj.b64_json && typeof obj.b64_json === 'string') {
        console.log(`[superhero-portrait] Found base64 image at path: ${path}.b64_json`)
        return `data:image/png;base64,${obj.b64_json}`
      }
      
      // Recursively search in arrays and objects
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const found = findImageUrl(obj[i], `${path}[${i}]`)
          if (found) return found
        }
      } else {
        for (const [key, value] of Object.entries(obj)) {
          const found = findImageUrl(value, path ? `${path}.${key}` : key)
          if (found) {
            console.log(`[superhero-portrait] Found image URL string at path: ${path}.${key}`)
            return found
          }
        }
      }
      
      return null
    }

    let styledImageUrl
    styledImageUrl = findImageUrl(imageResponse)
    if (styledImageUrl) {
      console.log('[superhero-portrait] ✓ Found image URL using recursive search')
      console.log('[superhero-portrait] URL preview:', styledImageUrl.substring(0, 150) + '...')
    }

    // Fallback parsing methods
    if (!styledImageUrl) {
      const choice = imageResponse.choices?.[0]
      if (choice?.message) {
        // Check for image_url object with url property (most common format)
        if (choice.message.images && Array.isArray(choice.message.images)) {
          for (const part of choice.message.images) {
            if (part?.type === 'image_url') {
              if (part.image_url?.url) {
                styledImageUrl = part.image_url.url
                console.log('[superhero-portrait] Found image_url.url')
                break
              }
              if (typeof part.image_url === 'string') {
                styledImageUrl = part.image_url
                console.log('[superhero-portrait] Found image_url as string')
                break
              }
            }
            
            // Check for direct image_url property
            if (part?.image_url) {
              styledImageUrl = typeof part.image_url === 'string' ? part.image_url : part.image_url.url
              console.log('[superhero-portrait] Found image_url property')
              break
            }
            
            // Check if part itself is a URL string
            if (typeof part === 'string' && (part.startsWith('http') || part.startsWith('data:image'))) {
              styledImageUrl = part
              console.log('[superhero-portrait] Found URL string in images array')
              break
            }
            
            // Check for base64 JSON
            const base64Match = part?.match?.(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
            if (base64Match) {
              styledImageUrl = base64Match[0]
              console.log('[superhero-portrait] Found base64 in images array')
              break
            }
          }
        }
        
        // Check for direct url property
        if (!styledImageUrl && choice.message.url) {
          styledImageUrl = choice.message.url
          console.log('[superhero-portrait] Found url in message')
        }
        
        // Check for image property
        if (!styledImageUrl && choice.message.image) {
          styledImageUrl = typeof choice.message.image === 'string' ? choice.message.image : choice.message.image.url
          console.log('[superhero-portrait] Found image property')
        }
      }
    }

    if (!styledImageUrl) {
      // Final check - maybe the response is just text describing the image
      const textResponse = imageResponse.choices?.[0]?.message?.content
      if (typeof textResponse === 'string' && textResponse.length > 0) {
        console.error('[superhero-portrait] Response is text, not image:', textResponse.substring(0, 500))
        throw new Error('The model returned text instead of an image. This model may not support image generation.')
      }
      
      console.error('[superhero-portrait] No image URL found in response. Full response:', JSON.stringify(imageResponse, null, 2))
      throw new Error('Failed to extract image URL from response. The model may not support image generation or returned an unexpected format.')
    }

    console.log('[superhero-portrait] Image URL extracted successfully', {
      urlLength: styledImageUrl.length,
      isDataUrl: styledImageUrl.startsWith('data:'),
      isHttpUrl: styledImageUrl.startsWith('http'),
    })

    const styleMeta = {
      caption: `${analysis.characterName}`,
      palette: style === 'Neon Glow' ? 'neon blues and purples' : style === 'Comic-Book' ? 'vibrant comic colors' : 'professional studio tones',
      lighting: style === 'Neon Glow' ? 'neon glow' : style === 'Comic-Book' ? 'dramatic comic lighting' : 'studio lighting',
    }

    const sql = getSql()
    await sql`
      INSERT INTO photo_creations (session_id, profession, original_url, styled_url, email_sent)
      VALUES (${sessionId}, ${analysis.characterName || 'Superhero'}, ${null}, ${styledImageUrl}, false)
    `

    await logEvent(sessionId, 'superhero-portrait', 'portrait-generated', {
      visitorId,
      characterType,
      characterName: analysis.characterName,
      style,
    })

    return ok({
      rawPhotoBytes: photoBuffer.length,
      styledImageUrl,
      styleMeta,
      analysis,
    })
  } catch (error) {
    console.error('superhero-portrait error', error)
    return serverError('Superhero portrait failed', error.message)
  }
}

