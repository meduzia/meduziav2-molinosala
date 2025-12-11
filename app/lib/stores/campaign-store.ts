/**
 * Store de Campañas - Nueva Arquitectura
 *
 * Maneja el estado en memoria de las campañas durante el flujo
 * Campaña → Arquetipos → Ángulos → Prompts → Producción
 *
 * PERSISTENCIA: Guarda automáticamente en Supabase para que los datos
 * no se pierdan al reiniciar el servidor.
 *
 * Reference Images: Soporta imágenes de referencia en cascada
 * Arquetipo → Ángulo → Prompt
 */

import type {
  Campaign,
  CampaignState,
  Archetype,
  Angle,
  ContentPrompt,
  GeneratedContent,
  ResearchOutput,
  StrategicOpportunity,
  PositioningRoute,
  ReferenceImage,
} from '../types/campaign-types'

import {
  saveCampaignToDB,
  loadCampaignFromDB,
  loadAllCampaignsFromDB,
  deleteCampaignFromDB,
  saveOutputToDB,
} from './campaign-persistence'

// Declarar tipo para globalThis
declare global {
  // eslint-disable-next-line no-var
  var __campaignStore: Map<string, CampaignState> | undefined
  // eslint-disable-next-line no-var
  var __campaignStoreInitialized: boolean | undefined
}

// Store en memoria usando globalThis para persistir entre hot-reloads de Next.js
// También persiste en Supabase para persistencia entre reinicios
const campaignStore = globalThis.__campaignStore ?? new Map<string, CampaignState>()
globalThis.__campaignStore = campaignStore

// Flag para saber si ya cargamos de DB
let storeInitialized = globalThis.__campaignStoreInitialized ?? false

/**
 * Inicializa el store cargando campañas desde Supabase
 * Se llama automáticamente la primera vez que se accede al store
 */
export async function initializeStore(): Promise<void> {
  if (storeInitialized) return

  console.log('[Campaign Store] Inicializando desde Supabase...')

  try {
    const campaigns = await loadAllCampaignsFromDB()

    for (const state of campaigns) {
      if (state.campaign?.id) {
        campaignStore.set(state.campaign.id, state)
      }
    }

    storeInitialized = true
    globalThis.__campaignStoreInitialized = true
    console.log(`[Campaign Store] ${campaigns.length} campañas cargadas desde DB`)
  } catch (error) {
    console.error('[Campaign Store] Error inicializando:', error)
    storeInitialized = true // Marcar como inicializado para no reintentar
    globalThis.__campaignStoreInitialized = true
  }
}

/**
 * Helper para guardar en DB de forma asíncrona (no bloquea)
 */
function persistToDBAsync(state: CampaignState): void {
  saveCampaignToDB(state).catch(err => {
    console.error('[Campaign Store] Error persistiendo:', err)
  })
}

// ============================================
// CAMPAIGN CRUD
// ============================================

export function createCampaign(campaign: Campaign, referenceImages: ReferenceImage[] = []): CampaignState {
  const state: CampaignState = {
    campaign,
    referenceImages,
    archetypes: [],
    angles: [],
    prompts: [],
    outputs: [],
  }
  campaignStore.set(campaign.id, state)
  persistToDBAsync(state) // Guardar en DB
  return state
}

export function getCampaignState(campaignId: string): CampaignState | null {
  return campaignStore.get(campaignId) || null
}

/**
 * Obtiene el estado de una campaña, cargando de DB si no está en memoria
 */
export async function getCampaignStateAsync(campaignId: string): Promise<CampaignState | null> {
  // Primero buscar en memoria
  let state = campaignStore.get(campaignId)
  if (state) return state

  // Si no está en memoria, intentar cargar de DB
  console.log(`[Campaign Store] Campaña ${campaignId} no está en memoria, cargando de DB...`)
  state = await loadCampaignFromDB(campaignId)

  if (state) {
    // Guardar en memoria para accesos futuros
    campaignStore.set(campaignId, state)
    return state
  }

  return null
}

export function updateCampaign(campaignId: string, updates: Partial<Campaign>): CampaignState | null {
  const state = campaignStore.get(campaignId)
  if (!state) return null

  state.campaign = { ...state.campaign, ...updates, updatedAt: new Date().toISOString() }
  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return state
}

export function deleteCampaign(campaignId: string): boolean {
  const deleted = campaignStore.delete(campaignId)
  if (deleted) {
    deleteCampaignFromDB(campaignId).catch(err => {
      console.error('[Campaign Store] Error eliminando de DB:', err)
    })
  }
  return deleted
}

export function listCampaigns(): Campaign[] {
  const campaigns: Campaign[] = []
  campaignStore.forEach((state) => campaigns.push(state.campaign))
  return campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Lista todas las campañas, asegurándose de cargar de DB primero
 */
export async function listCampaignsAsync(): Promise<Campaign[]> {
  await initializeStore()
  return listCampaigns()
}

// ============================================
// RESEARCH & ARCHETYPES
// ============================================

export function setResearchAndArchetypes(
  campaignId: string,
  research: ResearchOutput,
  archetypes: Archetype[],
  opportunities: StrategicOpportunity[],
  positioningRoutes: PositioningRoute[]
): CampaignState | null {
  const state = campaignStore.get(campaignId)
  if (!state) return null

  state.research = research
  state.archetypes = archetypes
  state.opportunities = opportunities
  state.positioningRoutes = positioningRoutes
  state.campaign.status = 'archetypes_generated'
  state.campaign.updatedAt = new Date().toISOString()

  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return state
}

export function updateArchetypeSelection(campaignId: string, archetypeId: string, selected: boolean): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const archetype = state.archetypes.find((a) => a.id === archetypeId)
  if (!archetype) return false

  archetype.selected = selected
  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return true
}

export function getSelectedArchetypes(campaignId: string): Archetype[] {
  const state = campaignStore.get(campaignId)
  if (!state) return []
  return state.archetypes.filter((a) => a.selected)
}

// ============================================
// ANGLES
// ============================================

export function addAngles(campaignId: string, angles: Angle[]): CampaignState | null {
  const state = campaignStore.get(campaignId)
  if (!state) return null

  state.angles.push(...angles)
  state.campaign.status = 'angles_generated'
  state.campaign.updatedAt = new Date().toISOString()

  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return state
}

export function getAnglesByArchetype(campaignId: string, archetypeId: string): Angle[] {
  const state = campaignStore.get(campaignId)
  if (!state) return []
  return state.angles.filter((a) => a.archetypeId === archetypeId)
}

export function updateAngleConfig(
  campaignId: string,
  angleId: string,
  imagesRequested: number,
  videosRequested: number
): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const angle = state.angles.find((a) => a.id === angleId)
  if (!angle) return false

  angle.imagesRequested = imagesRequested
  angle.videosRequested = videosRequested
  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return true
}

// ============================================
// PROMPTS
// ============================================

export function addPrompts(campaignId: string, prompts: ContentPrompt[]): CampaignState | null {
  const state = campaignStore.get(campaignId)
  if (!state) return null

  state.prompts.push(...prompts)
  state.campaign.status = 'prompts_generated'
  state.campaign.updatedAt = new Date().toISOString()

  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return state
}

export function getPromptsByAngle(campaignId: string, angleId: string): ContentPrompt[] {
  const state = campaignStore.get(campaignId)
  if (!state) return []
  return state.prompts.filter((p) => p.angleId === angleId)
}

export function updatePromptSelection(campaignId: string, promptId: string, selected: boolean): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const prompt = state.prompts.find((p) => p.id === promptId)
  if (!prompt) return false

  prompt.selectedToProduce = selected
  prompt.updatedAt = new Date().toISOString()
  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return true
}

export function updatePromptStatus(
  campaignId: string,
  promptId: string,
  status: ContentPrompt['status'],
  externalJobId?: string,
  outputUrl?: string,
  errorMessage?: string
): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const prompt = state.prompts.find((p) => p.id === promptId)
  if (!prompt) return false

  prompt.status = status
  prompt.updatedAt = new Date().toISOString()
  if (externalJobId) prompt.externalJobId = externalJobId
  if (outputUrl) prompt.outputUrl = outputUrl
  if (errorMessage) prompt.errorMessage = errorMessage

  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return true
}

export function updatePromptText(
  campaignId: string,
  promptId: string,
  newText: string
): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const prompt = state.prompts.find((p) => p.id === promptId)
  if (!prompt) return false

  prompt.text = newText
  prompt.updatedAt = new Date().toISOString()

  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return true
}

export function getSelectedPrompts(campaignId: string): ContentPrompt[] {
  const state = campaignStore.get(campaignId)
  if (!state) return []
  return state.prompts.filter((p) => p.selectedToProduce)
}

// ============================================
// OUTPUTS / GENERATED CONTENT
// ============================================

export function addOutput(campaignId: string, output: GeneratedContent): CampaignState | null {
  const state = campaignStore.get(campaignId)
  if (!state) return null

  state.outputs.push(output)
  campaignStore.set(campaignId, state)

  // Guardar estado completo y output individual
  persistToDBAsync(state)
  saveOutputToDB(campaignId, output).catch(err => {
    console.error('[Campaign Store] Error guardando output:', err)
  })

  return state
}

export function getOutputs(campaignId: string): GeneratedContent[] {
  const state = campaignStore.get(campaignId)
  if (!state) return []
  return state.outputs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getOutputsByArchetype(campaignId: string, archetypeId: string): GeneratedContent[] {
  const state = campaignStore.get(campaignId)
  if (!state) return []
  return state.outputs.filter((o) => o.archetypeId === archetypeId)
}

export function getOutputsByAngle(campaignId: string, angleId: string): GeneratedContent[] {
  const state = campaignStore.get(campaignId)
  if (!state) return []
  return state.outputs.filter((o) => o.angleId === angleId)
}

// Aprobar contenido para el cliente (pasa a la Gallery)
export function approveOutputForClient(
  campaignId: string,
  outputId: string,
  approved: boolean
): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const output = state.outputs.find(o => o.id === outputId)
  if (!output) return false

  output.approvedForClient = approved
  output.approvedForClientAt = approved ? new Date().toISOString() : undefined

  campaignStore.set(campaignId, state)
  persistToDBAsync(state)
  return true
}

// Aprobar múltiples outputs a la vez
export function approveMultipleOutputsForClient(
  campaignId: string,
  outputIds: string[],
  approved: boolean
): number {
  const state = campaignStore.get(campaignId)
  if (!state) return 0

  let count = 0
  const timestamp = new Date().toISOString()

  for (const outputId of outputIds) {
    const output = state.outputs.find(o => o.id === outputId)
    if (output) {
      output.approvedForClient = approved
      output.approvedForClientAt = approved ? timestamp : undefined
      count++
    }
  }

  if (count > 0) {
    campaignStore.set(campaignId, state)
    persistToDBAsync(state)
  }

  return count
}

// Obtener solo outputs aprobados para el cliente
export function getClientApprovedOutputs(campaignId: string): GeneratedContent[] {
  const state = campaignStore.get(campaignId)
  if (!state) return []
  return state.outputs
    .filter((o) => o.approvedForClient === true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

// Actualizar la URL editada de un output (cuando se guarda desde el editor)
export function updateOutputEditedUrl(
  campaignId: string,
  outputId: string,
  editedUrl: string
): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const output = state.outputs.find(o => o.id === outputId)
  if (!output) return false

  output.editedUrl = editedUrl

  campaignStore.set(campaignId, state)
  persistToDBAsync(state)
  return true
}

// Actualizar la URL editada buscando por promptId
export function updateOutputEditedUrlByPromptId(
  campaignId: string,
  promptId: string,
  editedUrl: string
): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const output = state.outputs.find(o => o.promptId === promptId)
  if (!output) return false

  output.editedUrl = editedUrl

  campaignStore.set(campaignId, state)
  persistToDBAsync(state)
  return true
}

// Actualizar feedback del cliente (like/dislike en Gallery) - Async version
export async function updateClientFeedbackAsync(
  campaignId: string,
  outputId: string,
  feedback: 'approved' | 'rejected' | 'pending',
  comment?: string
): Promise<boolean> {
  // Cargar de DB si no está en memoria
  let state = campaignStore.get(campaignId)
  if (!state) {
    state = await loadCampaignFromDB(campaignId)
    if (state) {
      campaignStore.set(campaignId, state)
    }
  }
  if (!state) return false

  const output = state.outputs.find(o => o.id === outputId)
  if (!output) return false

  output.clientFeedback = feedback
  output.clientFeedbackComment = comment
  output.clientFeedbackAt = new Date().toISOString()

  campaignStore.set(campaignId, state)
  persistToDBAsync(state)
  return true
}

// Sync version for backwards compatibility
export function updateClientFeedback(
  campaignId: string,
  outputId: string,
  feedback: 'approved' | 'rejected' | 'pending',
  comment?: string
): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const output = state.outputs.find(o => o.id === outputId)
  if (!output) return false

  output.clientFeedback = feedback
  output.clientFeedbackComment = comment
  output.clientFeedbackAt = new Date().toISOString()

  campaignStore.set(campaignId, state)
  persistToDBAsync(state)
  return true
}

// Actualizar feedback de múltiples outputs - Async version
export async function updateMultipleClientFeedbackAsync(
  campaignId: string,
  feedbackUpdates: Array<{
    outputId: string
    feedback: 'approved' | 'rejected' | 'pending'
    comment?: string
  }>
): Promise<number> {
  // Cargar de DB si no está en memoria
  let state = campaignStore.get(campaignId)
  if (!state) {
    state = await loadCampaignFromDB(campaignId)
    if (state) {
      campaignStore.set(campaignId, state)
    }
  }
  if (!state) return 0

  let count = 0
  const timestamp = new Date().toISOString()

  for (const update of feedbackUpdates) {
    const output = state.outputs.find(o => o.id === update.outputId)
    if (output) {
      output.clientFeedback = update.feedback
      output.clientFeedbackComment = update.comment
      output.clientFeedbackAt = timestamp
      count++
    }
  }

  if (count > 0) {
    campaignStore.set(campaignId, state)
    persistToDBAsync(state)
  }

  return count
}

// Sync version for backwards compatibility
export function updateMultipleClientFeedback(
  campaignId: string,
  feedbackUpdates: Array<{
    outputId: string
    feedback: 'approved' | 'rejected' | 'pending'
    comment?: string
  }>
): number {
  const state = campaignStore.get(campaignId)
  if (!state) return 0

  let count = 0
  const timestamp = new Date().toISOString()

  for (const update of feedbackUpdates) {
    const output = state.outputs.find(o => o.id === update.outputId)
    if (output) {
      output.clientFeedback = update.feedback
      output.clientFeedbackComment = update.comment
      output.clientFeedbackAt = timestamp
      count++
    }
  }

  if (count > 0) {
    campaignStore.set(campaignId, state)
    persistToDBAsync(state)
  }

  return count
}

// ============================================
// STATS & HELPERS
// ============================================

export function getCampaignStats(campaignId: string) {
  const state = campaignStore.get(campaignId)
  if (!state) return null

  const approvedForClient = state.outputs.filter((o) => o.approvedForClient === true)

  return {
    totalArchetypes: state.archetypes.length,
    selectedArchetypes: state.archetypes.filter((a) => a.selected).length,
    totalAngles: state.angles.length,
    totalPrompts: state.prompts.length,
    selectedPrompts: state.prompts.filter((p) => p.selectedToProduce).length,
    promptsByStatus: {
      draft: state.prompts.filter((p) => p.status === 'draft').length,
      queued: state.prompts.filter((p) => p.status === 'queued').length,
      generating: state.prompts.filter((p) => p.status === 'generating').length,
      done: state.prompts.filter((p) => p.status === 'done').length,
      failed: state.prompts.filter((p) => p.status === 'failed').length,
    },
    totalOutputs: state.outputs.length,
    imageOutputs: state.outputs.filter((o) => o.type === 'image').length,
    videoOutputs: state.outputs.filter((o) => o.type === 'video').length,
    // Approved for client (visible in Gallery)
    approvedForClientCount: approvedForClient.length,
    approvedForClientImages: approvedForClient.filter((o) => o.type === 'image').length,
    approvedForClientVideos: approvedForClient.filter((o) => o.type === 'video').length,
  }
}

// ============================================
// REFERENCE IMAGES
// ============================================

export function getReferenceImages(campaignId: string): ReferenceImage[] {
  const state = campaignStore.get(campaignId)
  if (!state) return []
  return state.referenceImages
}

export function addReferenceImage(campaignId: string, image: ReferenceImage): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  state.referenceImages.push(image)
  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return true
}

export function removeReferenceImage(campaignId: string, imageId: string): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  state.referenceImages = state.referenceImages.filter(img => img.id !== imageId)
  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return true
}

// Assign reference image to archetype
export function setArchetypeReferenceImage(
  campaignId: string,
  archetypeId: string,
  referenceImageId: string | null
): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const archetype = state.archetypes.find(a => a.id === archetypeId)
  if (!archetype) return false

  archetype.referenceImageId = referenceImageId || undefined
  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return true
}

// Assign reference image to angle
export function setAngleReferenceImage(
  campaignId: string,
  angleId: string,
  referenceImageId: string | null
): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const angle = state.angles.find(a => a.id === angleId)
  if (!angle) return false

  angle.referenceImageId = referenceImageId || undefined
  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return true
}

// Assign reference image to prompt
export function setPromptReferenceImage(
  campaignId: string,
  promptId: string,
  referenceImageId: string | null
): boolean {
  const state = campaignStore.get(campaignId)
  if (!state) return false

  const prompt = state.prompts.find(p => p.id === promptId)
  if (!prompt) return false

  prompt.referenceImageId = referenceImageId || undefined
  prompt.updatedAt = new Date().toISOString()
  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
  return true
}

// Get effective reference image for a prompt (cascade: prompt → angle → archetype)
export function getEffectiveReferenceImage(
  campaignId: string,
  promptId: string
): ReferenceImage | null {
  const state = campaignStore.get(campaignId)
  if (!state) return null

  const prompt = state.prompts.find(p => p.id === promptId)
  if (!prompt) return null

  // Check prompt level first
  if (prompt.referenceImageId) {
    const img = state.referenceImages.find(i => i.id === prompt.referenceImageId)
    if (img) return img
  }

  // Check angle level
  const angle = state.angles.find(a => a.id === prompt.angleId)
  if (angle?.referenceImageId) {
    const img = state.referenceImages.find(i => i.id === angle.referenceImageId)
    if (img) return img
  }

  // Check archetype level
  const archetype = state.archetypes.find(a => a.id === prompt.archetypeId)
  if (archetype?.referenceImageId) {
    const img = state.referenceImages.find(i => i.id === archetype.referenceImageId)
    if (img) return img
  }

  return null
}

// ============================================
// FULL STATE EXPORT (for debugging/API)
// ============================================

export function getFullCampaignState(campaignId: string): CampaignState | null {
  return campaignStore.get(campaignId) || null
}

export function setCampaignState(campaignId: string, state: CampaignState): void {
  campaignStore.set(campaignId, state)
  persistToDBAsync(state) // Guardar en DB
}
