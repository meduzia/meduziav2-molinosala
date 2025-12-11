/**
 * Servicio de Upload de Imágenes
 *
 * Sube imágenes base64 a imgbb para obtener URLs públicas
 * que pueden ser usadas por APIs externas como KIE
 *
 * Si no hay IMGBB_API_KEY, usa el endpoint local /api/images/[id]
 */

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || ''
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'

export interface UploadResult {
  success: boolean
  url?: string
  deleteUrl?: string
  error?: string
}

/**
 * Sube una imagen base64 a imgbb y retorna la URL pública
 */
export async function uploadBase64Image(
  base64Data: string,
  filename?: string
): Promise<UploadResult> {
  console.log(`[Image Upload] Iniciando upload de imagen: ${filename || 'unknown'}`)

  if (!IMGBB_API_KEY) {
    console.warn('[Image Upload] IMGBB_API_KEY no configurada')
    return {
      success: false,
      error: 'IMGBB_API_KEY no configurada'
    }
  }

  try {
    // Extraer solo la parte base64 si viene con el prefijo data:image
    let pureBase64 = base64Data
    if (base64Data.includes(',')) {
      pureBase64 = base64Data.split(',')[1]
    }

    // Preparar form data para imgbb
    const formData = new FormData()
    formData.append('key', IMGBB_API_KEY)
    formData.append('image', pureBase64)
    if (filename) {
      formData.append('name', filename.replace(/\.[^/.]+$/, '')) // Sin extensión
    }

    const response = await fetch(IMGBB_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (data.success && data.data?.url) {
      console.log(`[Image Upload] Imagen subida exitosamente: ${data.data.url}`)
      return {
        success: true,
        url: data.data.url,
        deleteUrl: data.data.delete_url,
      }
    }

    console.error('[Image Upload] Error en respuesta de imgbb:', data)
    return {
      success: false,
      error: data.error?.message || 'Error desconocido al subir imagen',
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Image Upload] Error: ${errorMessage}`)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Cache de URLs subidas para evitar re-uploads
 */
const uploadCache = new Map<string, string>()

/**
 * Obtiene una URL pública para una imagen, usando cache si ya fue subida
 * @param imageUrl - URL de la imagen (puede ser base64 data URL o HTTP URL)
 * @param filename - Nombre del archivo (opcional)
 * @param imageId - ID de la imagen para generar URL local (opcional pero necesario para fallback)
 */
export async function getPublicImageUrl(
  imageUrl: string,
  filename?: string,
  imageId?: string
): Promise<string | null> {
  // Si ya es una URL pública (http/https), retornarla directamente
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // Verificar cache
  const cacheKey = imageId || imageUrl.substring(0, 100) // Usar imageId o primeros 100 chars como key
  if (uploadCache.has(cacheKey)) {
    console.log(`[Image Upload] Usando URL cacheada para ${filename}`)
    return uploadCache.get(cacheKey)!
  }

  // Si es base64, intentar subir a imgbb
  if (imageUrl.startsWith('data:')) {
    const result = await uploadBase64Image(imageUrl, filename)
    if (result.success && result.url) {
      uploadCache.set(cacheKey, result.url)
      return result.url
    }

    // Fallback: usar endpoint local si tenemos imageId
    if (imageId) {
      const localUrl = `${APP_URL}/api/images/${imageId}`
      console.log(`[Image Upload] Usando URL local como fallback: ${localUrl}`)
      uploadCache.set(cacheKey, localUrl)
      return localUrl
    }
  }

  return null
}

/**
 * Limpia el cache de uploads
 */
export function clearUploadCache(): void {
  uploadCache.clear()
  console.log('[Image Upload] Cache limpiado')
}
