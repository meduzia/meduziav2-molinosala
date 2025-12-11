/**
 * Video Generator usando Sora 2 Pro API
 *
 * API: https://kie.ai/es/sora-2-pro
 *
 * Nota: Sora API tiene diferentes endpoints según el servicio.
 * Este es un wrapper genérico que puede adaptarse a diferentes providers.
 */

interface VideoGenerationParams {
  prompt: string
  negativePrompt?: string
  duration?: number // en segundos
  format?: string // '9:16', '16:9', '1:1'
  quality?: string // 'standard', 'high'
  fps?: number
}

interface VideoGenerationResponse {
  videoUrl?: string
  taskId?: string
  status?: string
  error?: string
}

export class SoraVideoGenerator {
  private apiKey: string
  private apiEndpoint: string

  constructor() {
    this.apiKey = process.env.SORA_API_KEY || ''
    this.apiEndpoint = process.env.SORA_API_ENDPOINT || 'https://api.openai.com/v1/videos/generations'
  }

  /**
   * Generar video usando Sora
   */
  async generateVideo(
    params: VideoGenerationParams
  ): Promise<{ success: boolean; videoUrl?: string; taskId?: string; error?: string }> {
    try {
      if (!this.apiKey) {
        throw new Error('SORA_API_KEY no configurada')
      }

      if (!params.prompt || params.prompt.trim().length === 0) {
        throw new Error('Prompt es requerido')
      }

      // Estructura del request según OpenAI's Sora API
      const requestBody = {
        prompt: params.prompt,
        duration: params.duration || 60, // Máximo 60 segundos para video UGC
        size: params.format || '1080x1920', // Formato vertical para TikTok/Reels/Shorts
        quality: params.quality || 'standard',
      }

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          `Sora API error: ${error.error?.message || response.statusText}`
        )
      }

      const data = await response.json()

      // Sora devuelve un task ID y requiere polling para obtener el resultado
      return {
        success: true,
        taskId: data.id,
        videoUrl: data.url, // Algunos endpoints retornan URL inmediata
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Video generation error:', errorMessage)

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Verificar estado de generación de video
   */
  async getVideoStatus(
    taskId: string
  ): Promise<{ status: string; videoUrl?: string; error?: string }> {
    try {
      if (!this.apiKey) {
        throw new Error('SORA_API_KEY no configurada')
      }

      // Endpoint para verificar estado
      const statusEndpoint = `${this.apiEndpoint}/${taskId}`

      const response = await fetch(statusEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Status check error: ${error.error?.message}`)
      }

      const data = await response.json()

      return {
        status: data.status, // 'pending', 'running', 'completed', 'failed'
        videoUrl: data.url, // Retorna URL cuando está completado
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('Status check error:', errorMessage)

      return {
        status: 'error',
        error: errorMessage,
      }
    }
  }

  /**
   * Generar múltiples videos con polling
   */
  async generateVideosFromPrompts(
    prompts: string[],
    pollingInterval: number = 5000
  ): Promise<
    Array<{
      promptIndex: number
      success: boolean
      videoUrl?: string
      taskId?: string
      error?: string
    }>
  > {
    // Iniciar generación de todos los videos
    const generationResults = await Promise.all(
      prompts.map(async (prompt, index) => {
        const result = await this.generateVideo({
          prompt,
          duration: 15, // 15 segundos es el estándar para UGC
          format: '9:16',
        })

        return {
          promptIndex: index,
          ...result,
        }
      })
    )

    // Separar éxitos y errores
    const successfulTasks = generationResults.filter((r) => r.success && r.taskId)
    const failedTasks = generationResults.filter((r) => !r.success)

    // Si hay tareas exitosas, hacer polling para obtener URLs finales
    if (successfulTasks.length > 0) {
      let allCompleted = false
      let attempts = 0
      const maxAttempts = 120 // 10 minutos si la interval es 5 segundos

      while (!allCompleted && attempts < maxAttempts) {
        attempts++

        // Esperar antes de hacer polling
        await new Promise((resolve) => setTimeout(resolve, pollingInterval))

        // Verificar estado de todas las tareas
        const statusResults = await Promise.all(
          successfulTasks.map(async (task) => {
            if (task.taskId) {
              return this.getVideoStatus(task.taskId)
            }
            return { status: 'error', error: 'No task ID' }
          })
        )

        // Actualizar resultados
        statusResults.forEach((status, index) => {
          const taskIndex = successfulTasks[index].promptIndex
          generationResults[taskIndex] = {
            ...generationResults[taskIndex],
            ...status,
            success: status.status === 'completed',
          }
        })

        // Verificar si todas las tareas están completadas
        allCompleted = statusResults.every(
          (s) =>
            s.status === 'completed' ||
            s.status === 'failed' ||
            s.status === 'error'
        )
      }
    }

    return generationResults
  }
}

/**
 * Factory function para crear generador de videos
 */
export function createVideoGenerator(): SoraVideoGenerator {
  return new SoraVideoGenerator()
}

/**
 * Generar un solo video (convenience function)
 */
export async function generateVideo(
  prompt: string,
  options?: Partial<VideoGenerationParams>
): Promise<{ success: boolean; videoUrl?: string; taskId?: string; error?: string }> {
  const generator = createVideoGenerator()
  return generator.generateVideo({
    prompt,
    ...options,
  })
}
