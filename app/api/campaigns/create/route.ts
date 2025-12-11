/**
 * POST /api/campaigns/create
 *
 * Inicia una nueva campaña UGC con todos los agentes
 *
 * Request body:
 * {
 *   "type": "producto" | "servicio",
 *   "brief_text": "Descripción del producto/servicio",
 *   "product_image_url": "URL de la imagen (opcional)",
 *   "target_audience": "Descripción del público objetivo",
 *   "info_extra": "Información adicional (opcional)",
 *   "num_videos_initial": 50,
 *   "idioma": "español",
 *   "executeOptions": {
 *     "executeResearch": true,
 *     "executeAngles": true,
 *     "executeScriptwriting": true,
 *     "executeVariations": false,
 *     "numVariationsPerPrompt": 3
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import {
  createCampaign,
  saveCampaignResearch,
  saveCampaignAngles,
  saveCampaignPrompts,
  saveCampaignImagePrompts,
  saveCampaignVariations,
  updateCampaignStatus,
  saveCampaignFlow,
  saveCampaignState,
} from '@/lib/campaigns-db'
import { CampaignOrchestrator } from '@/lib/agents/orchestrator'
import { setCampaignState } from '@/lib/campaign-state-cache'
import { calculateCampaignCost, getCostSummary } from '@/lib/cost-calculator'
import type { CampaignInput } from '@/lib/agents/types'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (or use test user for development)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Use test user if not authenticated (for development/testing)
    const userId = user?.id || 'test-user-demo'

    if (!userId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validar inputs requeridos
    if (!body.type || !body.brief_text) {
      return NextResponse.json(
        { error: 'type y brief_text son requeridos' },
        { status: 400 }
      )
    }

    if (!['producto', 'servicio'].includes(body.type)) {
      return NextResponse.json(
        { error: 'type debe ser "producto" o "servicio"' },
        { status: 400 }
      )
    }

    // Construir input de campaña
    const campaignInput: CampaignInput = {
      type: body.type,
      brief_text: body.brief_text,
      product_image_url: body.product_image_url,
      target_audience: body.target_audience,
      info_extra: body.info_extra,
      num_videos_initial: body.num_videos_initial || 50,
      num_images: body.num_images || 5,
      idioma: body.idioma || 'español',
    }

    // Opciones de ejecución
    const executeOptions = body.executeOptions || {
      executeResearch: true,
      executeAngles: true,
      executeScriptwriting: false,
      executeImageGeneration: true,
      executeVariations: false,
    }

    // 1. Create campaign record in DB (with error handling)
    let campaignId: string
    try {
      campaignId = await createCampaign(campaignInput, userId)
      console.log('Campaign created in DB:', campaignId)
    } catch (dbError) {
      console.error('DB error creating campaign, using generated ID:', dbError)
      // If DB fails, generate an ID anyway to allow demo mode
      campaignId = 'campaign-' + Date.now()
    }

    // 2. Update status to in_progress
    try {
      await updateCampaignStatus(campaignId, 'in_progress')
    } catch (dbError) {
      console.warn('Could not update campaign status:', dbError)
    }

    // 3. Create orchestrator with ID
    const orchestrator = new CampaignOrchestrator({
      ...campaignInput,
      id: campaignId,
    })

    // 4. Set up callback to save each flow to DB
    orchestrator.onFlowComplete = async (flow) => {
      try {
        // Store in cache as flows complete
        const currentState = orchestrator.getCampaign()
        setCampaignState(campaignId, {
          id: campaignId,
          status: currentState.status,
          flows: currentState.flows,
          input: currentState.input,
          research: currentState.research,
          angles: currentState.angles,
          prompts: currentState.prompts,
          image_prompts: currentState.image_prompts,
        })

        // Save state to BD for persistence
        await saveCampaignState(campaignId, {
          status: currentState.status,
          updatedAt: new Date(),
        })

        await saveCampaignFlow(campaignId, flow)

        if (flow.step === 'research' && flow.status === 'completed' && flow.output) {
          await saveCampaignResearch(campaignId, flow.output)
        }

        if (flow.step === 'angles' && flow.status === 'completed' && flow.output) {
          await saveCampaignAngles(campaignId, flow.output)
        }

        if (flow.step === 'scriptwriting' && flow.status === 'completed' && flow.output) {
          await saveCampaignPrompts(campaignId, flow.output.prompts)
        }

        if (flow.step === 'image_generation' && flow.status === 'completed' && flow.output) {
          await saveCampaignImagePrompts(campaignId, flow.output.prompts)
        }

        if (flow.step === 'variations' && flow.status === 'completed' && flow.output) {
          await saveCampaignVariations(campaignId, flow.output.variations)
        }
      } catch (saveError) {
        console.warn(`Could not save flow ${flow.step}:`, saveError)
      }
    }

    // 5. Execute campaign in background (non-blocking)
    // Ejecuta en background sin bloquear la respuesta
    // Also store the initial "in_progress" state immediately
    setCampaignState(campaignId, {
      id: campaignId,
      status: 'in_progress',
      flows: [],
      input: campaignInput,
    })

    orchestrator.executeFull(executeOptions)
      .then(async (campaign) => {
        // Update final status to completed
        console.log(`✅ Campaign ${campaignId} execution completed`)

        // Store in cache for immediate retrieval (BEFORE trying DB operations)
        setCampaignState(campaignId, {
          id: campaignId,
          status: campaign.status,
          flows: campaign.flows,
          input: campaign.input,
          research: campaign.research,
          angles: campaign.angles,
          prompts: campaign.prompts,
          image_prompts: campaign.image_prompts,
        })

        // Try to update DB but don't fail the cache if DB fails
        try {
          await updateCampaignStatus(campaignId, campaign.status)
          console.log(`Campaign ${campaignId} status updated in DB: ${campaign.status}`)
        } catch (dbError) {
          console.warn(`Could not update campaign status in DB (but cache is stored):`, dbError)
        }
      })
      .catch(async (error) => {
        // Orchestrator execution itself failed
        console.error(`❌ Campaign ${campaignId} execution failed:`, error)

        // Store failure state in cache
        const currentState = orchestrator.getCampaign()
        setCampaignState(campaignId, {
          id: campaignId,
          status: 'failed',
          flows: currentState.flows,
          input: currentState.input,
          research: currentState.research,
          angles: currentState.angles,
          prompts: currentState.prompts,
          image_prompts: currentState.image_prompts,
        })

        // Try to update DB but don't fail if DB fails
        try {
          await updateCampaignStatus(campaignId, 'failed')
          console.error(`Campaign ${campaignId} marked as failed in DB`)
        } catch (dbError) {
          console.warn(`Could not update failed status in DB:`, dbError)
        }
      })

    // 6. Calculate and include estimated costs
    const costBreakdown = calculateCampaignCost(executeOptions)
    const costSummary = getCostSummary(costBreakdown)

    // 7. Return immediately with campaign ID and in_progress status
    return NextResponse.json(
      {
        success: true,
        campaign: {
          id: campaignId,
          status: 'in_progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          message: 'Campaña iniciada. Los agentes están generando contenido...',
          flows: [],
        },
        estimatedCost: costSummary,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Campaign creation error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al crear campaña',
      },
      { status: 500 }
    )
  }
}
