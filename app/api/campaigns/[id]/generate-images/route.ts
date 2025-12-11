/**
 * POST /api/campaigns/[id]/generate-images
 *
 * Genera imágenes usando KIE API (Nano Banana)
 * - Recibe array de prompt IDs a generar
 * - Llama KIE API para cada imagen
 * - Descarga y sube a Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCampaignState, setCampaignState } from '@/lib/campaign-state-cache'
import { v4 as uuidv4 } from 'uuid'

interface GenerateImagesRequest {
  promptIds: string[] // IDs de los image_prompts a generar
  imageSize?: string // ej: "9:16", "1:1", "16:9"
  outputFormat?: 'png' | 'jpeg'
}

interface KIEResponse {
  code: number
  message: string
  data?: {
    taskId: string
  }
}

const KIE_API_KEY = process.env.KIE_API_KEY || ''
const KIE_API_ENDPOINT = 'https://api.kie.ai/api/v1/jobs/createTask'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const body: GenerateImagesRequest = await request.json()

    const campaign = getCampaignState(campaignId)

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    if (!campaign.image_prompts || campaign.image_prompts.length === 0) {
      return NextResponse.json(
        { error: 'No hay prompts de imagen para generar' },
        { status: 400 }
      )
    }

    // Validar que todos los prompt IDs existan
    const validPrompts = campaign.image_prompts.filter((p) =>
      body.promptIds.includes(p.id || p.angle_id)
    )

    if (validPrompts.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron prompts válidos' },
        { status: 400 }
      )
    }

    // Inicializar array de imágenes si no existe
    if (!campaign.images) {
      campaign.images = []
    }

    const generationTasks = []

    // Para cada prompt, crear una tarea en KIE
    for (const prompt of validPrompts) {
      const assetId = uuidv4()
      const taskId = uuidv4()

      try {
        const kieResponse = await fetch(KIE_API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'google/nano-banana',
            callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/campaigns/${campaignId}/generate-images/callback`,
            input: {
              prompt: prompt.prompt_text,
              output_format: body.outputFormat || 'png',
              image_size: body.imageSize || '9:16',
            },
          }),
        })

        const kieData: KIEResponse = await kieResponse.json()

        if (kieData.code === 200 && kieData.data?.taskId) {
          // Crear asset con estado pending
          campaign.images.push({
            id: assetId,
            type: 'image',
            url: '',
            prompt_id: prompt.id || prompt.angle_id,
            status: 'processing',
            kieTaskId: kieData.data.taskId,
            createdAt: new Date(),
            metadata: {
              angleName: prompt.angle_name,
              kieTaskId: kieData.data.taskId,
            },
          })

          generationTasks.push({
            assetId,
            promptId: prompt.id || prompt.angle_id,
            kieTaskId: kieData.data.taskId,
            status: 'pending',
          })

          console.log(
            `📸 Task created for prompt ${prompt.angle_name}: ${kieData.data.taskId}`
          )
        } else {
          console.warn(
            `KIE API error for prompt ${prompt.angle_name}:`,
            kieData.message
          )

          campaign.images.push({
            id: assetId,
            type: 'image',
            url: '',
            prompt_id: prompt.id || prompt.angle_id,
            status: 'failed',
            errorMessage: kieData.message || 'Error calling KIE API',
            createdAt: new Date(),
            metadata: {
              angleName: prompt.angle_name,
            },
          })
        }
      } catch (error) {
        console.error(`Error generating image for ${prompt.angle_name}:`, error)

        campaign.images.push({
          id: uuidv4(),
          type: 'image',
          url: '',
          prompt_id: prompt.id || prompt.angle_id,
          status: 'failed',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          createdAt: new Date(),
          metadata: {
            angleName: prompt.angle_name,
          },
        })
      }
    }

    // Guardar estado actualizado
    setCampaignState(campaignId, campaign)

    return NextResponse.json({
      success: true,
      message: `${generationTasks.length} tarea(s) de generación iniciada(s)`,
      tasks: generationTasks,
      totalImages: campaign.images.length,
    })
  } catch (error) {
    console.error('Error generating images:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Error generating images',
      },
      { status: 500 }
    )
  }
}
