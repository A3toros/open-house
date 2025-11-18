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

    // Build style-specific prompt instructions
    const styleInstructions = {
      'Comic-Book': 'comic book illustration style, bold outlines, vibrant colors, dynamic action pose',
      'Neon Glow': 'neon cyberpunk aesthetic, glowing edges, dark background with neon accents, futuristic atmosphere',
      'Studio Portrait': 'professional studio photography, soft lighting, clean background, high-quality portrait',
    }

    const stylePrompt = styleInstructions[style] || styleInstructions['Studio Portrait']

    // Create the image generation prompt - direct and simple, request URL only
    const imagePrompt = `Generate a realistic portrait showing this child as an adult (age 25-35) working as a ${profession}. Style: ${stylePrompt}. Keep facial features recognizable. Return the image URL only.`

    // Generate image - try primary model first, then fallback
    const models = ['google/gemini-2.5-flash-image-preview', 'stability/illustration-diffusion']
    let imageResponse
    let lastError
    let usedModel

    for (const model of models) {
      usedModel = model
      console.log('[photo-booth] Attempting image generation with model:', model, {
        profession,
        style,
        photoSize: photoBuffer.length,
      })

      try {
        // For stability models, use text-to-image format
        if (model.startsWith('stability/')) {
          imageResponse = await chatCompletion(
            {
              model,
              messages: [
                {
                  role: 'user',
                  content: imagePrompt,
                },
              ],
            },
            { activitySlug: 'photo-booth', cache: false },
          )
        } else {
          // For Gemini, try with image input
          // Note: We do NOT use response_format for image generation - we want the image, not JSON
          imageResponse = await chatCompletion(
            {
              model,
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: imagePrompt,
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: photoDataUrl,
                      },
                    },
                  ],
                },
              ],
              // Explicitly do NOT request JSON format - we want the image
            },
            { activitySlug: 'photo-booth', cache: false },
          )
        }

        console.log('[photo-booth] Image generation response received from', model, {
          hasChoices: !!imageResponse?.choices,
          choicesLength: imageResponse?.choices?.length,
          responseKeys: Object.keys(imageResponse || {}),
        })
        break // Success, exit loop
      } catch (apiError) {
        lastError = apiError
        console.error(`[photo-booth] ${model} API error:`, {
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
      
      // If it's a string, check if it's a URL
      if (typeof obj === 'string') {
        if (obj.startsWith('http://') || obj.startsWith('https://') || obj.startsWith('data:image')) {
          console.log(`[photo-booth] Found image URL string at path: ${path}`)
          return obj
        }
        return null
      }
      
      if (typeof obj !== 'object') return null
      
      // Check common image URL properties
      if (obj.url && typeof obj.url === 'string' && (obj.url.startsWith('http') || obj.url.startsWith('data:image'))) {
        console.log(`[photo-booth] Found image URL at path: ${path}.url`)
        return obj.url
      }
      if (obj.image_url) {
        const url = typeof obj.image_url === 'string' ? obj.image_url : obj.image_url.url
        if (url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:image'))) {
          console.log(`[photo-booth] Found image URL at path: ${path}.image_url`)
          return url
        }
      }
      if (obj.b64_json && typeof obj.b64_json === 'string') {
        console.log(`[photo-booth] Found base64 image at path: ${path}.b64_json`)
        return `data:image/png;base64,${obj.b64_json}`
      }
      
      // Recursively search in arrays and objects
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key]
          if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
              const found = findImageUrl(value[i], `${path}[${i}]`)
              if (found) return found
            }
          } else if (value && typeof value === 'object') {
            const found = findImageUrl(value, path ? `${path}.${key}` : key)
            if (found) return found
          } else if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('data:image'))) {
            console.log(`[photo-booth] Found image URL string at path: ${path}.${key}`)
            return value
          }
        }
      }
      return null
    }

    // Extract image from response
    // Gemini 2.5 Flash Image Preview returns images in the choices array
    let styledImageUrl
    const choice = imageResponse?.choices?.[0]
    
    console.log('[photo-booth] Parsing response from', usedModel)
    // Log full response but truncate very long strings to avoid log limits
    const logResponse = JSON.parse(JSON.stringify(imageResponse, (key, value) => {
      if (key === 'url' && typeof value === 'string' && value.length > 200) {
        return value.substring(0, 200) + '... (truncated, length: ' + value.length + ')'
      }
      if (typeof value === 'string' && value.length > 1000) {
        return value.substring(0, 1000) + '... (truncated, length: ' + value.length + ')'
      }
      return value
    }))
    console.log('[photo-booth] Full response structure:', JSON.stringify(logResponse, null, 2))
    
    // Use recursive search as primary method - it will find the URL anywhere in the response
    styledImageUrl = findImageUrl(imageResponse)
    if (styledImageUrl) {
      console.log('[photo-booth] ✓ Found image URL using recursive search')
      console.log('[photo-booth] URL preview:', styledImageUrl.substring(0, 150) + '...')
    } else {
      console.log('[photo-booth] Recursive search did not find URL, trying manual parsing...')
      
      // Fallback to manual parsing if recursive search fails
      if (choice?.message?.content) {
        // Gemini may return content as an array of parts or as a single object/string
        const content = Array.isArray(choice.message.content) 
          ? choice.message.content 
          : [choice.message.content]
      
      console.log('[photo-booth] Content array length:', content.length)
      
      // Look through all content parts for image data
      for (let i = 0; i < content.length; i++) {
        const part = content[i]
        console.log(`[photo-booth] Content part ${i}:`, JSON.stringify(part, null, 2))
        
        // Check for image_url object with url property (most common format)
        if (part?.type === 'image_url') {
          if (part.image_url?.url) {
            styledImageUrl = part.image_url.url
            console.log('[photo-booth] Found image_url.url')
            break
          }
          if (typeof part.image_url === 'string') {
            styledImageUrl = part.image_url
            console.log('[photo-booth] Found image_url as string')
            break
          }
        }
        
        // Check for direct image_url property
        if (part?.image_url) {
          styledImageUrl = typeof part.image_url === 'string' ? part.image_url : part.image_url.url
          console.log('[photo-booth] Found image_url property')
          break
        }
        
        // Check if part is a string with image data
        if (typeof part === 'string') {
          if (part.startsWith('data:image')) {
            styledImageUrl = part
            console.log('[photo-booth] Found data URL string')
            break
          }
          if (part.startsWith('http://') || part.startsWith('https://')) {
            styledImageUrl = part
            console.log('[photo-booth] Found HTTP URL string')
            break
          }
          // Check for base64 in string
          if (part.includes('base64')) {
            const base64Match = part.match(/data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/)
            if (base64Match) {
              styledImageUrl = base64Match[0]
              console.log('[photo-booth] Found base64 image in text')
              break
            }
          }
        }
        
        // Check for other possible image formats
        if (part?.url) {
          styledImageUrl = part.url
          console.log('[photo-booth] Found url property')
          break
        }
        
        if (part?.image) {
          styledImageUrl = typeof part.image === 'string' ? part.image : part.image.url
          console.log('[photo-booth] Found image property')
          break
        }
      }
      }
    }
    
    // Also check choice.message directly for image data
    if (!styledImageUrl && choice?.message) {
      console.log('[photo-booth] Checking choice.message directly:', Object.keys(choice.message))
      if (choice.message.image_url) {
        styledImageUrl = typeof choice.message.image_url === 'string' 
          ? choice.message.image_url 
          : choice.message.image_url.url
        console.log('[photo-booth] Found image_url in message')
      }
    }
    
    // If still not found, try one more recursive search with different patterns
    if (!styledImageUrl) {
      // Check if response itself has a direct URL property
      if (imageResponse?.url && (imageResponse.url.startsWith('http') || imageResponse.url.startsWith('data:image'))) {
        styledImageUrl = imageResponse.url
        console.log('[photo-booth] Found URL in response root')
      }
    }
    
    // Fallback: check alternative response formats
    if (!styledImageUrl) {
      console.log('[photo-booth] Trying fallback formats', {
        hasData: !!imageResponse?.data,
        dataLength: imageResponse?.data?.length,
        hasUrl: !!imageResponse?.url,
      })
      
      if (imageResponse?.data?.[0]?.url) {
        styledImageUrl = imageResponse.data[0].url
        console.log('[photo-booth] Found data[0].url')
      } else if (imageResponse?.data?.[0]?.b64_json) {
        styledImageUrl = `data:image/png;base64,${imageResponse.data[0].b64_json}`
        console.log('[photo-booth] Found data[0].b64_json')
      } else if (imageResponse?.url) {
        styledImageUrl = imageResponse.url
        console.log('[photo-booth] Found response.url')
      } else {
        // Log the full response for debugging
        const responsePreview = JSON.stringify(imageResponse, (key, value) => {
          if (key === 'image_url' && typeof value === 'string' && value.length > 100) {
            return value.substring(0, 100) + '... (truncated)'
          }
          if (typeof value === 'string' && value.length > 500) {
            return value.substring(0, 500) + '... (truncated)'
          }
          return value
        }, 2)
        
        console.error('[photo-booth] Unexpected image response format. Full response:', responsePreview)
        console.error('[photo-booth] Response structure:', {
          type: typeof imageResponse,
          keys: Object.keys(imageResponse || {}),
          hasChoices: !!imageResponse?.choices,
          choicesType: Array.isArray(imageResponse?.choices) ? 'array' : typeof imageResponse?.choices,
          firstChoiceKeys: imageResponse?.choices?.[0] ? Object.keys(imageResponse.choices[0]) : null,
        })
        
        // Check if the response contains text that might indicate an error or different format
        const textContent = choice?.message?.content
        if (typeof textContent === 'string') {
          console.error('[photo-booth] Response contains text content:', textContent.substring(0, 200))
        }
        
        throw new Error(`Failed to generate image: unexpected response format. Response keys: ${Object.keys(imageResponse || {}).join(', ')}. Check logs for full response.`)
      }
    }

    if (!styledImageUrl) {
      // Final check - maybe the response is just text describing the image
      const textResponse = choice?.message?.content
      if (typeof textResponse === 'string' && textResponse.length > 0) {
        console.error('[photo-booth] Response is text, not image:', textResponse.substring(0, 500))
        throw new Error('The model returned text instead of an image. This model may not support image generation. Try using a different model like stability/stable-diffusion-xl or stability/illustration-diffusion.')
      }
      
      console.error('[photo-booth] No image URL found in response. Full response:', JSON.stringify(imageResponse, null, 2))
      throw new Error('Failed to extract image URL from response. The model may not support image generation or returned an unexpected format.')
    }

    console.log('[photo-booth] Image URL extracted successfully', {
      urlLength: styledImageUrl.length,
      isDataUrl: styledImageUrl.startsWith('data:'),
      isHttpUrl: styledImageUrl.startsWith('http'),
    })

    const styleMeta = {
      caption: `Future ${profession}`,
      palette: style === 'Neon Glow' ? 'neon blues and purples' : style === 'Comic-Book' ? 'vibrant comic colors' : 'professional studio tones',
      lighting: style === 'Neon Glow' ? 'neon glow' : style === 'Comic-Book' ? 'dramatic comic lighting' : 'studio lighting',
    }

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

