/**
 * GET /api/campaigns/[id]/generate-images/check-status
 *
 * Verifica el estado de las tareas de generación de imágenes en KIE API
 * Utiliza polling como alternativa al callback (necesario para localhost)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCampaignState, setCampaignState } from '@/lib/campaign-state-cache'

interface KIETaskResponse {
  code: number
  msg: string
  data?: {
    taskId: string
    state: 'pending' | 'running' | 'success' | 'fail'
    resultUrls?: string[]
    costTime?: number
    consumeCredits?: number
  }
}

const KIE_API_KEY = process.env.KIE_API_KEY || ''
const KIE_GET_TASK_ENDPOINT = 'https://api.kie.ai/api/v1/jobs/getTask'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params

    const campaign = getCampaignState(campaignId)

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    if (!campaign.images || campaign.images.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay imágenes para verificar',
        images: [],
      })
    }

    // Encontrar imágenes en estado "processing" que tienen taskId
    const processingImages = campaign.images.filter(
      (img) => img.status === 'processing' && img.kieTaskId
    )

    if (processingImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay imágenes en procesamiento',
        images: campaign.images.map((img) => ({
          id: img.id,
          status: img.status,
          url: img.url,
        })),
      })
    }

    // Verificar estado de cada tarea en KIE
    const statusUpdates = []

    for (const img of processingImages) {
      try {
        const response = await fetch(
          `${KIE_GET_TASK_ENDPOINT}?taskId=${img.kieTaskId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${KIE_API_KEY}`,
            },
          }
        )

        const data: KIETaskResponse = await response.json()

        console.log(`📊 Task ${img.kieTaskId} status:`, data.data?.state)

        if (data.code === 200 && data.data) {
          if (data.data.state === 'success' && data.data.resultUrls?.length) {
            // Actualizar imagen como completada
            img.url = data.data.resultUrls[0]
            img.status = 'completed'
            img.metadata = {
              ...img.metadata,
              kieImageUrl: data.data.resultUrls[0],
              costTime: data.data.costTime,
              consumeCredits: data.data.consumeCredits,
            }

            statusUpdates.push({
              id: img.id,
              status: 'completed',
              url: img.url,
            })

            console.log(`✅ Image ${img.id} completed: ${img.url}`)
          } else if (data.data.state === 'fail') {
            // Marcar como fallida
            img.status = 'failed'
            img.errorMessage = 'KIE generation failed'

            statusUpdates.push({
              id: img.id,
              status: 'failed',
              error: 'KIE generation failed',
            })

            console.log(`❌ Image ${img.id} failed`)
          } else {
            // Todavía procesando
            statusUpdates.push({
              id: img.id,
              status: 'processing',
              kieState: data.data.state,
            })
          }
        }
      } catch (error) {
        console.error(`Error checking status for task ${img.kieTaskId}:`, error)
        statusUpdates.push({
          id: img.id,
          status: 'processing',
          error: 'Error checking status',
        })
      }
    }

    // Guardar estado actualizado
    setCampaignState(campaignId, campaign)

    // Calcular resumen
    const completed = campaign.images.filter((img) => img.status === 'completed').length
    const processing = campaign.images.filter((img) => img.status === 'processing').length
    const failed = campaign.images.filter((img) => img.status === 'failed').length

    return NextResponse.json({
      success: true,
      message: `${completed} completadas, ${processing} procesando, ${failed} fallidas`,
      summary: {
        total: campaign.images.length,
        completed,
        processing,
        failed,
      },
      images: campaign.images.map((img) => ({
        id: img.id,
        prompt_id: img.prompt_id,
        status: img.status,
        url: img.url,
        metadata: img.metadata,
        errorMessage: img.errorMessage,
      })),
      statusUpdates,
    })
  } catch (error) {
    console.error('Error checking image status:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error checking status',
      },
      { status: 500 }
    )
  }
}
