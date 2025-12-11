/**
 * Database layer for campaigns
 * Handles all CRUD operations for campaign data and agent outputs
 */

import { createClient } from './supabase'
import type {
  Campaign,
  CampaignInput,
  ResearchOutput,
  AnglesOutput,
  VideoPrompt,
  ImagePrompt,
  PromptVariation,
  CampaignOrchestrationFlow,
} from './agents/types'

const supabase = createClient()

// ============= CREATE =============

/**
 * Create a new campaign record in the database
 */
export async function createCampaign(
  input: CampaignInput,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([
      {
        user_id: userId,
        type: input.type,
        brief_text: input.brief_text,
        product_image_url: input.product_image_url,
        target_audience: input.target_audience,
        info_extra: input.info_extra,
        num_videos_initial: input.num_videos_initial,
        idioma: input.idioma,
        status: 'draft',
      },
    ])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating campaign:', error)
    throw error
  }

  return data.id
}

/**
 * Save research agent output
 */
export async function saveCampaignResearch(
  campaignId: string,
  research: ResearchOutput
): Promise<void> {
  const { error } = await supabase.from('campaign_research').insert([
    {
      campaign_id: campaignId,
      pain_points: research.pain_points,
      benefits: research.benefits,
      objections: research.objections,
      promises: research.promises,
    },
  ])

  if (error) {
    console.error('Error saving research:', error)
    throw error
  }
}

/**
 * Save angles agent output
 */
export async function saveCampaignAngles(
  campaignId: string,
  angles: AnglesOutput
): Promise<void> {
  const records = angles.angles.map((angle) => ({
    campaign_id: campaignId,
    angle_id: angle.angle_id,
    angle_name: angle.angle_name,
    big_idea: angle.big_idea,
    hook_type: angle.hook_type,
    pain_point_target: angle.pain_point_target,
    key_benefit_target: angle.key_benefit_target,
    suggested_creator: angle.suggested_creator,
    context: angle.context,
  }))

  const { error } = await supabase.from('campaign_angles').insert(records)

  if (error) {
    console.error('Error saving angles:', error)
    throw error
  }
}

/**
 * Save scriptwriter agent output
 */
export async function saveCampaignPrompts(
  campaignId: string,
  prompts: VideoPrompt[]
): Promise<void> {
  const records = prompts.map((prompt) => ({
    campaign_id: campaignId,
    angle_id: prompt.angle_id,
    prompt_text: prompt.prompt_text,
    technical_parameters: prompt.technical_parameters || null,
    negative_prompt: prompt.negative_prompt || null,
  }))

  const { error } = await supabase.from('campaign_prompts').insert(records)

  if (error) {
    console.error('Error saving prompts:', error)
    throw error
  }
}

/**
 * Save image prompts from image generator agent
 */
export async function saveCampaignImagePrompts(
  campaignId: string,
  imagePrompts: ImagePrompt[]
): Promise<void> {
  const records = imagePrompts.map((prompt) => ({
    campaign_id: campaignId,
    angle_id: prompt.angle_id,
    angle_name: prompt.angle_name,
    prompt_text: prompt.prompt_text,
    style: prompt.style || null,
    technical_parameters: prompt.technical_parameters || null,
  }))

  const { error } = await supabase.from('campaign_image_prompts').insert(records)

  if (error) {
    console.error('Error saving image prompts:', error)
    throw error
  }
}

/**
 * Save variations agent output
 */
export async function saveCampaignVariations(
  campaignId: string,
  variations: PromptVariation[]
): Promise<void> {
  const records = variations.map((variation) => ({
    campaign_id: campaignId,
    parent_prompt_id: variation.parent_prompt_id,
    variation_id: variation.variation_id,
    prompt_text: variation.prompt_text,
    hypothesis: variation.hypothesis,
    target_metric: variation.target_metric,
  }))

  const { error } = await supabase
    .from('campaign_variations')
    .insert(records)

  if (error) {
    console.error('Error saving variations:', error)
    throw error
  }
}

/**
 * Save flow execution record
 */
export async function saveCampaignFlow(
  campaignId: string,
  flow: CampaignOrchestrationFlow
): Promise<void> {
  const { error } = await supabase.from('campaign_flows').insert([
    {
      campaign_id: campaignId,
      step: flow.step,
      status: flow.status,
      input: flow.input || null,
      output: flow.output || null,
      error: flow.error || null,
      started_at: flow.startedAt?.toISOString() || null,
      completed_at: flow.completedAt?.toISOString() || null,
    },
  ])

  if (error) {
    console.error('Error saving flow:', error)
    throw error
  }
}

/**
 * Save generated asset (image or video)
 */
export async function saveCampaignAsset(
  campaignId: string,
  type: 'image' | 'video',
  url: string,
  promptId?: string,
  variationId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const { error } = await supabase.from('campaign_assets').insert([
    {
      campaign_id: campaignId,
      type,
      url,
      prompt_id: promptId || null,
      variation_id: variationId || null,
      metadata: metadata || null,
    },
  ])

  if (error) {
    console.error('Error saving asset:', error)
    throw error
  }
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: Campaign['status']
): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', campaignId)

  if (error) {
    console.error('Error updating campaign status:', error)
    throw error
  }
}

// ============= READ =============

/**
 * Get complete campaign with all outputs
 */
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  try {
    // Get main campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError) {
      if (campaignError.code === 'PGRST116') {
        return null // Not found
      }
      throw campaignError
    }

    if (!campaign) return null

    // Get research
    const { data: research } = await supabase
      .from('campaign_research')
      .select('*')
      .eq('campaign_id', campaignId)
      .single()

    // Get angles
    const { data: angles } = await supabase
      .from('campaign_angles')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })

    // Get prompts
    const { data: prompts } = await supabase
      .from('campaign_prompts')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })

    // Get variations
    const { data: variations } = await supabase
      .from('campaign_variations')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })

    // Get flows
    const { data: flows } = await supabase
      .from('campaign_flows')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })

    // Get assets
    const { data: assets } = await supabase
      .from('campaign_assets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })

    // Reconstruct Campaign object
    return {
      id: campaign.id,
      input: {
        type: campaign.type,
        brief_text: campaign.brief_text,
        product_image_url: campaign.product_image_url,
        target_audience: campaign.target_audience,
        info_extra: campaign.info_extra,
        num_videos_initial: campaign.num_videos_initial,
        idioma: campaign.idioma,
      },
      research: research
        ? {
            pain_points: research.pain_points || [],
            benefits: research.benefits || [],
            objections: research.objections || [],
            promises: research.promises || [],
          }
        : undefined,
      angles: angles && angles.length > 0 ? { angles } : undefined,
      prompts: prompts && prompts.length > 0 ? prompts : undefined,
      variations:
        variations && variations.length > 0
          ? variations.map((v: any) => ({
              parent_prompt_id: v.parent_prompt_id,
              variation_id: v.variation_id,
              prompt_text: v.prompt_text,
              hypothesis: v.hypothesis,
              target_metric: v.target_metric,
            }))
          : undefined,
      images:
        assets && assets.length > 0
          ? assets
              .filter((a: any) => a.type === 'image')
              .map((a: any) => ({
                id: a.id,
                type: 'image' as const,
                url: a.url,
                prompt_id: a.prompt_id,
                metadata: a.metadata,
                createdAt: new Date(a.created_at),
              }))
          : undefined,
      videos:
        assets && assets.length > 0
          ? assets
              .filter((a: any) => a.type === 'video')
              .map((a: any) => ({
                id: a.id,
                type: 'video' as const,
                url: a.url,
                prompt_id: a.prompt_id,
                metadata: a.metadata,
                createdAt: new Date(a.created_at),
              }))
          : undefined,
      flows: flows
        ? flows.map((f: any) => ({
            step: f.step as CampaignOrchestrationFlow['step'],
            status: f.status as CampaignOrchestrationFlow['status'],
            input: f.input,
            output: f.output,
            error: f.error,
            startedAt: f.started_at ? new Date(f.started_at) : undefined,
            completedAt: f.completed_at ? new Date(f.completed_at) : undefined,
          }))
        : [],
      status: campaign.status,
      createdAt: new Date(campaign.created_at),
      updatedAt: new Date(campaign.updated_at),
    }
  } catch (error) {
    console.error('Error getting campaign:', error)
    throw error
  }
}

/**
 * List campaigns for a user with summary
 */
export async function listCampaigns(
  userId: string,
  limit = 20,
  offset = 0
): Promise<
  Array<{
    id: string
    type: string
    brief_text: string
    status: string
    createdAt: string
    summary?: {
      research?: { painPoints: number; benefits: number }
      angles?: { total: number }
      prompts?: { total: number }
      variations?: { total: number }
    }
  }>
> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select(
        `
        id,
        type,
        brief_text,
        status,
        created_at,
        campaign_research (pain_points, benefits),
        campaign_angles (id),
        campaign_prompts (id),
        campaign_variations (id)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return (
      data?.map((campaign: any) => ({
        id: campaign.id,
        type: campaign.type,
        brief_text: campaign.brief_text,
        status: campaign.status,
        createdAt: campaign.created_at,
        summary: {
          research:
            campaign.campaign_research && campaign.campaign_research.length > 0
              ? {
                  painPoints: campaign.campaign_research[0].pain_points
                    ?.length || 0,
                  benefits: campaign.campaign_research[0].benefits?.length || 0,
                }
              : undefined,
          angles: {
            total: campaign.campaign_angles?.length || 0,
          },
          prompts: {
            total: campaign.campaign_prompts?.length || 0,
          },
          variations: {
            total: campaign.campaign_variations?.length || 0,
          },
        },
      })) || []
    )
  } catch (error) {
    console.error('Error listing campaigns:', error)
    throw error
  }
}

/**
 * Count total campaigns for a user
 */
export async function countCampaigns(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('campaigns')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)

    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Error counting campaigns:', error)
    throw error
  }
}

/**
 * Delete a campaign and all related data
 */
export async function deleteCampaign(campaignId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting campaign:', error)
    throw error
  }
}

/**
 * Get campaigns by status
 */
export async function getCampaignsByStatus(
  userId: string,
  status: Campaign['status']
): Promise<Campaign[]> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id')
      .eq('user_id', userId)
      .eq('status', status)

    if (error) throw error

    const campaigns = await Promise.all(
      (data || []).map(async (item: any) => {
        const campaign = await getCampaign(item.id)
        return campaign!
      })
    )

    return campaigns.filter(Boolean)
  } catch (error) {
    console.error('Error getting campaigns by status:', error)
    throw error
  }
}

/**
 * List all in-progress campaigns for a user
 * Used to show live campaign execution in the UI
 */
export async function getActiveCampaigns(userId: string): Promise<
  Array<{
    id: string
    brief_text: string
    status: string
    createdAt: string
    updatedAt: string
    type: string
  }>
> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, brief_text, status, created_at, updated_at, type')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })

    if (error) throw error

    return (
      data?.map((campaign: any) => ({
        id: campaign.id,
        brief_text: campaign.brief_text,
        status: campaign.status,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
        type: campaign.type,
      })) || []
    )
  } catch (error) {
    console.error('Error getting active campaigns:', error)
    return []
  }
}

/**
 * Save incremental campaign state to DB
 * Called after each agent completes to persist progress
 */
export async function saveCampaignState(
  campaignId: string,
  state: {
    status: Campaign['status']
    updatedAt?: Date
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('campaigns')
      .update({
        status: state.status,
        updated_at: state.updatedAt?.toISOString() || new Date().toISOString(),
      })
      .eq('id', campaignId)

    if (error) {
      console.warn(`Could not save campaign state for ${campaignId}:`, error)
      // Don't throw - this is non-critical
    }
  } catch (error) {
    console.warn(`Could not save campaign state for ${campaignId}:`, error)
  }
}
