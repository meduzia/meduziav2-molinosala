/**
 * Servicio de Producción - Integración con APIs externas
 *
 * - Nano Banana 2: Generación de imágenes
 * - Sora 2 PRO: Generación de videos
 */

import type { ContentPrompt, GeneratedContent, ContentMetadata, ReferenceImage } from '../types/campaign-types'
import { getPublicImageUrl } from '../services/image-upload'

// ============================================
// CONFIGURACIÓN
// ============================================

const KIE_API_KEY = process.env.KIE_API_KEY || ''
const KIE_BASE_URL = 'https://api.kie.ai/api/v1'

// Nano Banana Pro para imágenes (modelo correcto según documentación de KIE)
const NANO_BANANA_MODEL = 'nano-banana-pro'

// Sora 2 PRO para videos (endpoint de KIE) - modelo correcto: sora-2-pro-text-to-video
const SORA_PRO_MODEL = 'sora-2-pro-text-to-video'

// ============================================
// NANO BANANA PRO - IMÁGENES
// ============================================

interface NanoBananaRequest {
  model: string
  input: {
    prompt: string
    aspect_ratio?: string
    output_format?: string
    image_size?: string // Resolución de la imagen (ej: '1080x1920' para 2K vertical)
    image_input?: string[] // URLs de imágenes de referencia para image-to-image
  }
  callbackUrl?: string
}

interface NanoBananaResponse {
  code: number
  msg: string
  data?: {
    taskId: string
    state: string
  }
}

interface NanoBananaTaskResult {
  code: number
  msg: string
  data?: {
    taskId: string
    state: 'pending' | 'running' | 'success' | 'fail' | 'waiting'
    output?: {
      image_url?: string
      video_url?: string
    }
    resultJson?: string // KIE returns this as a JSON string that needs parsing
    resultUrls?: string[]
    costTime?: number
    consumeCredits?: number
  }
}

export async function generateImageWithNanoBanana(
  prompt: ContentPrompt,
  callbackUrl?: string,
  referenceImage?: ReferenceImage | null
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  console.log(`[Nano Banana Pro] Iniciando generación para prompt: ${prompt.id}`)
  console.log(`[Nano Banana Pro] KIE_API_KEY presente: ${KIE_API_KEY ? 'Sí' : 'NO'}`)
  if (referenceImage) {
    console.log(`[Nano Banana Pro] Reference image: ${referenceImage.filename}`)
  }

  if (!KIE_API_KEY) {
    return { success: false, error: 'KIE_API_KEY no configurada' }
  }

  try {
    // Build the prompt - enhance with reference image instruction if present
    let finalPrompt = prompt.text

    // If we have a reference image, add instruction to use product from image
    if (referenceImage) {
      finalPrompt = `IMPORTANTE: Usa el producto exacto que aparece en la imagen de referencia proporcionada. Mantén el packaging, colores y diseño del producto tal como aparece en la imagen de referencia. ${prompt.text}`
    }

    const requestBody: NanoBananaRequest = {
      model: NANO_BANANA_MODEL,
      input: {
        prompt: finalPrompt,
        aspect_ratio: '9:16',
        output_format: 'png',
        image_size: '1080x1920', // 2K vertical (9:16)
      },
    }

    // Si hay imagen de referencia, obtener URL pública y agregarla al request
    if (referenceImage?.url) {
      console.log(`[Nano Banana Pro] Procesando imagen de referencia: ${referenceImage.filename}`)

      // Obtener URL pública (sube a imgbb si es base64, usa API local como fallback)
      const publicUrl = await getPublicImageUrl(
        referenceImage.url,
        referenceImage.filename,
        referenceImage.id // Pasar el ID para generar URL local si imgbb no está configurado
      )

      if (publicUrl) {
        console.log(`[Nano Banana Pro] URL pública obtenida: ${publicUrl}`)
        requestBody.input.image_input = [publicUrl]
      } else {
        console.warn(`[Nano Banana Pro] No se pudo obtener URL pública para la imagen de referencia`)
      }
    }

    if (callbackUrl) {
      requestBody.callbackUrl = callbackUrl
    }

    console.log(`[Nano Banana Pro] Request:`, JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data: NanoBananaResponse = await response.json()
    console.log(`[Nano Banana Pro] Response:`, JSON.stringify(data, null, 2))

    if (data.code === 200 && data.data?.taskId) {
      console.log(`[Nano Banana Pro] Task creada: ${data.data.taskId}`)
      return { success: true, taskId: data.data.taskId }
    }

    return { success: false, error: data.msg || `Error: código ${data.code}` }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Nano Banana Pro] Error: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

export async function checkNanoBananaTaskStatus(
  taskId: string
): Promise<NanoBananaTaskResult['data'] | null> {
  try {
    const response = await fetch(`${KIE_BASE_URL}/jobs/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
      },
    })

    const data: NanoBananaTaskResult = await response.json()
    console.log(`[Nano Banana Pro] Status check for ${taskId}:`, JSON.stringify(data, null, 2))

    if (data.code === 200 && data.data) {
      // Parse resultJson if it exists (KIE returns resultUrls inside a JSON string)
      if (data.data.resultJson && !data.data.resultUrls) {
        try {
          const parsed = JSON.parse(data.data.resultJson)
          if (parsed.resultUrls && Array.isArray(parsed.resultUrls)) {
            data.data.resultUrls = parsed.resultUrls
          }
        } catch (e) {
          console.error(`[Nano Banana Pro] Error parsing resultJson:`, e)
        }
      }

      // Fallback: Normalizar la respuesta para incluir resultUrls desde output
      if (data.data.output?.image_url && !data.data.resultUrls) {
        data.data.resultUrls = [data.data.output.image_url]
      }

      return data.data
    }

    return null
  } catch (error) {
    console.error(`[Nano Banana Pro] Error checking status: ${error}`)
    return null
  }
}

// ============================================
// SORA 2 PRO - VIDEOS
// ============================================

interface SoraProRequest {
  model: string
  input: {
    prompt: string
    aspect_ratio?: 'portrait' | 'landscape' // portrait = 9:16, landscape = 16:9
    n_frames?: '10' | '15' | '25' // Duration in seconds
    size?: 'standard' | 'high' // standard = 720p, high = 1080p
    remove_watermark?: boolean
  }
  callbackUrl?: string
}

interface SoraProResponse {
  code: number
  msg: string
  data?: {
    taskId: string
    state: string
  }
}

interface SoraProTaskResult {
  code: number
  msg: string
  data?: {
    taskId: string
    state: 'pending' | 'running' | 'success' | 'fail' | 'waiting'
    output?: {
      video_url?: string
    }
    resultJson?: string // KIE returns this as a JSON string that needs parsing
    resultUrls?: string[]
    costTime?: number
    consumeCredits?: number
  }
}

export async function generateVideoWithSoraPro(
  prompt: ContentPrompt,
  durationSeconds: number = 10,
  callbackUrl?: string
): Promise<{ success: boolean; taskId?: string; error?: string }> {
  console.log(`[Sora 2 PRO] Iniciando generación para prompt: ${prompt.id}`)
  console.log(`[Sora 2 PRO] KIE_API_KEY presente: ${KIE_API_KEY ? 'Sí' : 'NO'}`)

  if (!KIE_API_KEY) {
    return { success: false, error: 'KIE_API_KEY no configurada' }
  }

  try {
    // Map duration to n_frames (10, 15, or 25 seconds)
    let n_frames: '10' | '15' | '25' = '10'
    if (durationSeconds >= 20) {
      n_frames = '25'
    } else if (durationSeconds >= 12) {
      n_frames = '15'
    }

    const requestBody: SoraProRequest = {
      model: SORA_PRO_MODEL,
      input: {
        prompt: prompt.text,
        aspect_ratio: 'portrait', // Vertical video format (9:16)
        n_frames, // Duration in seconds
        size: 'high', // 1080p
        remove_watermark: true,
      },
    }

    if (callbackUrl) {
      requestBody.callbackUrl = callbackUrl
    }

    console.log(`[Sora 2 PRO] Request:`, JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${KIE_BASE_URL}/jobs/createTask`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const data: SoraProResponse = await response.json()
    console.log(`[Sora 2 PRO] Response:`, JSON.stringify(data, null, 2))

    if (data.code === 200 && data.data?.taskId) {
      console.log(`[Sora 2 PRO] Task creada: ${data.data.taskId}`)
      return { success: true, taskId: data.data.taskId }
    }

    // Handle specific error codes
    if (data.code === 402) {
      return { success: false, error: 'Créditos insuficientes en KIE para generar videos. Recarga tu cuenta en kie.ai' }
    }
    if (data.code === 422) {
      return { success: false, error: 'Modelo de video no disponible. Verifica la configuración.' }
    }

    return { success: false, error: data.msg || `Error: código ${data.code}` }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Sora 2 PRO] Error: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

export async function checkSoraProTaskStatus(
  taskId: string
): Promise<SoraProTaskResult['data'] | null> {
  try {
    const response = await fetch(`${KIE_BASE_URL}/jobs/recordInfo?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${KIE_API_KEY}`,
      },
    })

    const data: SoraProTaskResult = await response.json()
    console.log(`[Sora 2 PRO] Status check for ${taskId}:`, JSON.stringify(data, null, 2))

    if (data.code === 200 && data.data) {
      // Parse resultJson if it exists (KIE returns resultUrls inside a JSON string)
      if (data.data.resultJson && !data.data.resultUrls) {
        try {
          const parsed = JSON.parse(data.data.resultJson)
          if (parsed.resultUrls && Array.isArray(parsed.resultUrls)) {
            data.data.resultUrls = parsed.resultUrls
          }
        } catch (e) {
          console.error(`[Sora 2 PRO] Error parsing resultJson:`, e)
        }
      }

      // Fallback: Normalizar la respuesta para incluir resultUrls desde output
      if (data.data.output?.video_url && !data.data.resultUrls) {
        data.data.resultUrls = [data.data.output.video_url]
      }

      return data.data
    }

    return null
  } catch (error) {
    console.error(`[Sora 2 PRO] Error checking status: ${error}`)
    return null
  }
}

// ============================================
// PRODUCCIÓN UNIFICADA
// ============================================

export interface ProductionResult {
  promptId: string
  success: boolean
  taskId?: string
  error?: string
}

export async function produceContent(
  prompts: ContentPrompt[],
  callbackBaseUrl?: string,
  referenceImageMap?: Map<string, ReferenceImage | null>
): Promise<ProductionResult[]> {
  console.log(`[Production] Iniciando producción de ${prompts.length} prompts`)

  const results: ProductionResult[] = []

  for (const prompt of prompts) {
    const callbackUrl = callbackBaseUrl
      ? `${callbackBaseUrl}/${prompt.campaignId}/callback/${prompt.id}`
      : undefined

    // Get reference image for this prompt if available
    const referenceImage = referenceImageMap?.get(prompt.id) || null

    let result: ProductionResult

    if (prompt.type === 'image') {
      const imageResult = await generateImageWithNanoBanana(prompt, callbackUrl, referenceImage)
      result = {
        promptId: prompt.id,
        success: imageResult.success,
        taskId: imageResult.taskId,
        error: imageResult.error,
      }
    } else {
      const videoResult = await generateVideoWithSoraPro(prompt, 10, callbackUrl)
      result = {
        promptId: prompt.id,
        success: videoResult.success,
        taskId: videoResult.taskId,
        error: videoResult.error,
      }
    }

    results.push(result)

    // Pequeña pausa para no saturar la API
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  const successful = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length
  console.log(`[Production] Completado: ${successful} exitosos, ${failed} fallidos`)

  return results
}

// ============================================
// POLLING DE ESTADO
// ============================================

export async function checkAllTasksStatus(
  prompts: ContentPrompt[]
): Promise<Map<string, { status: string; url?: string; error?: string }>> {
  const statusMap = new Map<string, { status: string; url?: string; error?: string }>()

  for (const prompt of prompts) {
    if (!prompt.externalJobId) continue

    let taskData: NanoBananaTaskResult['data'] | SoraProTaskResult['data'] | null = null

    if (prompt.type === 'image') {
      taskData = await checkNanoBananaTaskStatus(prompt.externalJobId)
    } else {
      taskData = await checkSoraProTaskStatus(prompt.externalJobId)
    }

    if (taskData) {
      statusMap.set(prompt.id, {
        status: taskData.state,
        url: taskData.resultUrls?.[0],
      })
    } else {
      statusMap.set(prompt.id, {
        status: 'error',
        error: 'No se pudo obtener estado',
      })
    }
  }

  return statusMap
}

// ============================================
// CREAR OUTPUT DESDE RESULTADO
// ============================================

export function createOutputFromTask(
  prompt: ContentPrompt,
  taskData: {
    taskId: string
    resultUrls?: string[]
    costTime?: number
    consumeCredits?: number
  }
): GeneratedContent | null {
  if (!taskData.resultUrls?.[0]) return null

  const metadata: ContentMetadata = {
    provider: prompt.type === 'image' ? 'nano_banana' : 'sora_pro',
    jobId: taskData.taskId,
    costTime: taskData.costTime,
    credits: taskData.consumeCredits,
  }

  return {
    id: `output_${prompt.id}_${Date.now()}`,
    promptId: prompt.id,
    angleId: prompt.angleId,
    archetypeId: prompt.archetypeId,
    campaignId: prompt.campaignId,
    type: prompt.type,
    url: taskData.resultUrls[0],
    metadata,
    createdAt: new Date().toISOString(),
  }
}
