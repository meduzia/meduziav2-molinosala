/**
 * POST /api/campaigns/[id]/generate-images/callback
 *
 * Callback webhook de KIE API cuando una imagen se completa
 * Descarga la imagen y la sube a Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCampaignState, setCampaignState } from '@/lib/campaign-state-cache'
import { createClient } from '@/lib/supabase'

interface KIECallbackPayload {
  code: number
  data: {
    completeTime: number
    consumeCredits: number
    costTime: number
    createTime: number
    model: string
    param: {
      callbackUrl: string
      model: string
    }
    remainedCredits: number
    resultJson: string
    resultUrls?: string[]
    state: 'success' | 'fail'
    taskId: string
    updateTime: number
  }
  msg: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const payload: KIECallbackPayload = await request.json()

    console.log(`📥 Callback received for campaign ${campaignId}, task ${payload.data.taskId}`)

    const campaign = getCampaignState(campaignId)

    if (!campaign || !campaign.images) {
      console.warn(`Campaign ${campaignId} not found`)
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    // Encontrar la imagen asociada a esta tarea
    const imageAsset = campaign.images.find(
      (img) => img.kieTaskId === payload.data.taskId
    )

    if (!imageAsset) {
      console.warn(`Image asset not found for task ${payload.data.taskId}`)
      return NextResponse.json(
        { error: 'Asset no encontrado' },
        { status: 404 }
      )
    }

    if (payload.data.state === 'success' && payload.data.resultUrls?.length) {
      // URL de la imagen generada por KIE
      const imageUrl = payload.data.resultUrls[0]

      // Verificar si Supabase está configurado correctamente
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const isSupabaseConfigured = supabaseUrl && !supabaseUrl.includes('placeholder')

      if (isSupabaseConfigured) {
        // Si Supabase está configurado, subir la imagen
        try {
          const imageResponse = await fetch(imageUrl)
          if (!imageResponse.ok) {
            throw new Error(`Failed to download image: ${imageResponse.statusText}`)
          }

          const imageBuffer = await imageResponse.arrayBuffer()
          const fileName = `${campaignId}/${imageAsset.id}.png`

          // Subir a Supabase Storage
          const supabase = createClient()
          const { data, error } = await supabase.storage
            .from('generated-images')
            .upload(fileName, imageBuffer, {
              contentType: 'image/png',
              upsert: true,
            })

          if (error) {
            throw new Error(`Supabase upload error: ${error.message}`)
          }

          // Obtener URL pública
          const {
            data: { publicUrl },
          } = supabase.storage.from('generated-images').getPublicUrl(fileName)

          // Actualizar asset
          imageAsset.url = publicUrl
          imageAsset.status = 'completed'
          imageAsset.metadata = {
            ...imageAsset.metadata,
            supabasePath: fileName,
            kieImageUrl: imageUrl,
            costTime: payload.data.costTime,
            consumeCredits: payload.data.consumeCredits,
          }

          console.log(`✅ Image completed and uploaded to Supabase: ${fileName}`)
        } catch (uploadError) {
          console.error(`Error uploading image to Supabase:`, uploadError)

          // Si falla Supabase, usar la URL de KIE directamente
          imageAsset.url = imageUrl
          imageAsset.status = 'completed'
          imageAsset.metadata = {
            ...imageAsset.metadata,
            kieImageUrl: imageUrl,
            costTime: payload.data.costTime,
            consumeCredits: payload.data.consumeCredits,
            storageError: uploadError instanceof Error ? uploadError.message : 'Storage upload failed',
          }

          console.log(`✅ Image completed (using KIE URL directly due to storage error)`)
        }
      } else {
        // Si Supabase no está configurado, usar la URL de KIE directamente
        imageAsset.url = imageUrl
        imageAsset.status = 'completed'
        imageAsset.metadata = {
          ...imageAsset.metadata,
          kieImageUrl: imageUrl,
          costTime: payload.data.costTime,
          consumeCredits: payload.data.consumeCredits,
        }

        console.log(`✅ Image completed (using KIE URL directly - no Supabase configured)`)
      }
    } else {
      // KIE generación falló
      imageAsset.status = 'failed'
      imageAsset.errorMessage = payload.msg || 'KIE generation failed'

      console.warn(`KIE generation failed for task ${payload.data.taskId}:`, payload.msg)
    }

    // Guardar estado actualizado
    setCampaignState(campaignId, campaign)

    return NextResponse.json({
      success: true,
      message: 'Callback processed',
      assetId: imageAsset.id,
      status: imageAsset.status,
    })
  } catch (error) {
    console.error('Error processing callback:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error processing callback',
      },
      { status: 500 }
    )
  }
}
