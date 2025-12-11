/**
 * Image Generator usando Nano Banana API
 *
 * API: https://www.nanobananai.com/ (DALL-E 3)
 */

interface NanoBananaResponse {
  image_url: string
  image_base64?: string
  inference_id?: string
}

interface ImageGenerationParams {
  prompt: string
  negative_prompt?: string
  num_images?: number
  size?: string // "1024x1024", "1792x1024", etc.
  quality?: string // "standard" | "hd"
  style?: string // "natural" | "vivid"
}

export async function generateImage(
  params: ImageGenerationParams
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const apiKey = process.env.NANO_BANANA_API_KEY

    if (!apiKey) {
      throw new Error('NANO_BANANA_API_KEY no configurada')
    }

    // Validar que tenemos un prompt
    if (!params.prompt || params.prompt.trim().length === 0) {
      throw new Error('Prompt es requerido')
    }

    // Llamar a Nano Banana API
    // Docs: https://www.nanobananai.com/docs
    const response = await fetch('https://api.nanobananai.com/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: params.prompt,
        negative_prompt:
          params.negative_prompt ||
          'low quality, blurry, distorted, watermark',
        num_images: params.num_images || 1,
        size: params.size || '1024x1024',
        quality: params.quality || 'standard',
        style: params.style || 'natural',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(
        `Nano Banana API error: ${error.message || response.statusText}`
      )
    }

    const data: NanoBananaResponse = await response.json()

    if (!data.image_url) {
      throw new Error('No image URL returned from API')
    }

    return {
      success: true,
      imageUrl: data.image_url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error('Image generation error:', errorMessage)

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Generar múltiples imágenes basadas en prompts de video
 */
export async function generateImagesFromPrompts(
  prompts: string[],
  baseNegativePrompt?: string
): Promise<
  Array<{ promptIndex: number; success: boolean; imageUrl?: string; error?: string }>
> {
  const results = await Promise.all(
    prompts.map(async (prompt, index) => {
      const result = await generateImage({
        prompt,
        negative_prompt: baseNegativePrompt,
        size: '1024x1024',
      })

      return {
        promptIndex: index,
        success: result.success,
        imageUrl: result.imageUrl,
        error: result.error,
      }
    })
  )

  return results
}
