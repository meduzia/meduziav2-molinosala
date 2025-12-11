/**
 * Servicio de Persistencia de Campañas
 *
 * Guarda y carga campañas desde Supabase para que persistan
 * entre reinicios del servidor.
 */

import { createClient, isSupabaseConfigured } from '../supabase'
import type { CampaignState, Campaign, GeneratedContent } from '../types/campaign-types'

const TABLE_NAME = 'studio_campaigns'
const OUTPUTS_TABLE = 'studio_outputs'

interface DBCampaign {
  id: string
  name: string
  brief: string
  core_message: string | null
  status: string
  state: CampaignState
  created_at: string
  updated_at: string
  user_id: string | null
}

/**
 * Guarda una campaña en Supabase
 */
export async function saveCampaignToDB(state: CampaignState): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.log('[Persistence] Supabase no configurado, usando solo memoria')
    return false
  }

  try {
    const supabase = createClient()
    const { campaign } = state

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({
        id: campaign.id,
        name: campaign.name,
        brief: campaign.brief,
        core_message: campaign.coreMessage || null,
        status: campaign.status,
        state: state, // Guardamos el estado completo como JSON
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (error) {
      console.error('[Persistence] Error guardando campaña:', error.message)
      return false
    }

    console.log(`[Persistence] Campaña ${campaign.id} guardada en DB`)
    return true
  } catch (error) {
    console.error('[Persistence] Error:', error)
    return false
  }
}

/**
 * Carga una campaña desde Supabase
 */
export async function loadCampaignFromDB(campaignId: string): Promise<CampaignState | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('state')
      .eq('id', campaignId)
      .single()

    if (error) {
      if (error.code !== 'PGRST116') { // Not found
        console.error('[Persistence] Error cargando campaña:', error.message)
      }
      return null
    }

    if (data?.state) {
      console.log(`[Persistence] Campaña ${campaignId} cargada desde DB`)
      return data.state as CampaignState
    }

    return null
  } catch (error) {
    console.error('[Persistence] Error:', error)
    return null
  }
}

/**
 * Carga todas las campañas desde Supabase
 */
export async function loadAllCampaignsFromDB(): Promise<CampaignState[]> {
  if (!isSupabaseConfigured()) {
    console.log('[Persistence] Supabase no configurado')
    return []
  }

  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('state')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Persistence] Error listando campañas:', error.message)
      return []
    }

    const campaigns = (data || [])
      .map(row => row.state as CampaignState)
      .filter(state => state && state.campaign)

    console.log(`[Persistence] ${campaigns.length} campañas cargadas desde DB`)
    return campaigns
  } catch (error) {
    console.error('[Persistence] Error:', error)
    return []
  }
}

/**
 * Elimina una campaña de Supabase
 */
export async function deleteCampaignFromDB(campaignId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const supabase = createClient()

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', campaignId)

    if (error) {
      console.error('[Persistence] Error eliminando campaña:', error.message)
      return false
    }

    console.log(`[Persistence] Campaña ${campaignId} eliminada de DB`)
    return true
  } catch (error) {
    console.error('[Persistence] Error:', error)
    return false
  }
}

/**
 * Guarda un output generado
 */
export async function saveOutputToDB(
  campaignId: string,
  output: GeneratedContent
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const supabase = createClient()

    const { error } = await supabase
      .from(OUTPUTS_TABLE)
      .upsert({
        id: output.id,
        campaign_id: campaignId,
        prompt_id: output.promptId,
        angle_id: output.angleId,
        archetype_id: output.archetypeId,
        type: output.type,
        url: output.url,
        thumbnail_url: output.thumbnailUrl || null,
        prompt_text: output.promptText || null,
        metadata: output.metadata || {},
        created_at: output.createdAt,
      }, {
        onConflict: 'id'
      })

    if (error) {
      console.error('[Persistence] Error guardando output:', error.message)
      return false
    }

    return true
  } catch (error) {
    console.error('[Persistence] Error:', error)
    return false
  }
}

/**
 * Verifica si la tabla existe (para saber si hay que crearla)
 */
export async function checkTablesExist(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false
  }

  try {
    const supabase = createClient()

    const { error } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .limit(1)

    if (error && error.code === '42P01') {
      // Table doesn't exist
      console.log('[Persistence] Tabla studio_campaigns no existe. Ejecutar scripts/create-studio-tables.sql')
      return false
    }

    return !error
  } catch {
    return false
  }
}
