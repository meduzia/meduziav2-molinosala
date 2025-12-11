/**
 * NUEVA ARQUITECTURA - Tipos del Sistema de Campañas
 *
 * Flujo: Campaña → Arquetipos → Ángulos → Prompts → Producción
 *
 * Reference Images: Imágenes que se pueden asignar a arquetipos, ángulos o prompts
 * para usarse como referencia en la generación de contenido.
 * Herencia: Arquetipo → Ángulo → Prompt (cascada)
 */

// ============================================
// REFERENCE IMAGES
// ============================================
export interface ReferenceImage {
  id: string
  campaignId: string
  filename: string
  url: string // URL local o blob URL
  thumbnailUrl?: string
  width?: number
  height?: number
  size?: number // bytes
  uploadedAt: string
}

// ============================================
// CAMPAÑA
// ============================================
export interface Campaign {
  id: string
  name: string
  description: string
  brief: string
  coreMessage?: string // Mensaje principal que queremos comunicar en las imágenes
  objective: string
  category: string
  platforms: string[]
  referenceImages: ReferenceImage[] // Imágenes de referencia cargadas
  createdAt: string
  updatedAt: string
  status: 'draft' | 'archetypes_generated' | 'angles_generated' | 'prompts_generated' | 'producing' | 'completed'
}

export interface CreateCampaignInput {
  name: string
  brief: string
  coreMessage?: string // Mensaje principal que queremos comunicar en las imágenes
  referenceImages?: ReferenceImage[] // Imágenes subidas en el formulario
}

// ============================================
// ARQUETIPOS
// ============================================
export interface Archetype {
  id: string
  campaignId: string
  name: string
  summary: string
  mainMotivation: string
  painPoints: string[]
  desires: string[]
  consumptionMoment: string
  emotionalTrigger: string
  barriers: string[]
  importanceRole: string
  selected: boolean
  referenceImageId?: string // Imagen de referencia asignada a este arquetipo
  createdAt: string
}

export interface ResearchOutput {
  panorama: PanoramaItem[]
  pains: string[]
  gains: string[]
  jobs: JobToBeDone[]
}

export interface PanoramaItem {
  finding: string
  evidence: string
  implication: string
}

export interface JobToBeDone {
  situation: string
  task: string
  outcome: string
  fullStatement: string
}

export interface StrategicOpportunity {
  id: string
  category: 'product' | 'format' | 'activation'
  insight: string
  idea: string
  visualization: string
  testMethod: string
  suggestedKPI: string
}

export interface PositioningRoute {
  id: string
  promise: string
  rtb: string // Reason to Believe
  tone: string
  whyBelieve: string
  competitiveAdvantage: string
}

export interface ArchetypesGenerationResult {
  research: ResearchOutput
  archetypes: Archetype[]
  opportunities: StrategicOpportunity[]
  positioningRoutes: PositioningRoute[]
}

// ============================================
// ÁNGULOS
// ============================================
export interface Angle {
  id: string
  archetypeId: string
  campaignId: string
  title: string
  description: string
  strategicGoal: string
  vslStructure: string
  videoSuggestion: string
  emotionalTriggers: string[]
  cognitiveBiases: string[]
  directResponseTechniques: string[]
  imagesRequested: number
  videosRequested: number
  referenceImageId?: string // Imagen de referencia asignada a este ángulo (override del arquetipo)
  createdAt: string
}

export interface AngleGenerationInput {
  archetypeId: string
  archetype: Archetype
  campaignBrief: string
}

// ============================================
// PROMPTS DE CONTENIDO
// ============================================
export type ContentType = 'image' | 'video'

export type PromptStatus = 'draft' | 'queued' | 'generating' | 'done' | 'failed'

export interface TextOverlay {
  headline?: string
  subheadline?: string
  cta?: string
  badge?: string
}

export type OverlayLayout =
  | 'gradient-bottom'
  | 'solid-band'
  | 'floating-text'
  | 'testimonial'
  | 'bullet-points'
  | 'minimal'

export interface ContentPrompt {
  id: string
  angleId: string
  archetypeId: string
  campaignId: string
  type: ContentType
  text: string
  selectedToProduce: boolean
  status: PromptStatus
  externalJobId?: string
  outputUrl?: string
  errorMessage?: string
  referenceImageId?: string // Imagen de referencia asignada a este prompt (override del ángulo/arquetipo)
  textOverlay?: TextOverlay // Textos para superponer sobre la imagen generada
  textPosition?: 'top' | 'center' | 'bottom' // Posición sugerida del texto
  overlayLayout?: OverlayLayout // Layout del overlay (gradient-bottom, solid-band, etc.)
  showLogo?: boolean // Mostrar logo PAX en el overlay
  adType?: string // Tipo de anuncio (oferta, destino, beneficio, etc.)
  suggestedTitle?: string // Título sugerido para el editor de overlays
  suggestedSubtitle?: string // Subtítulo sugerido para el editor de overlays
  createdAt: string
  updatedAt: string
}

export interface PromptGenerationInput {
  angleId: string
  angle: Angle
  archetype: Archetype
  campaignBrief: string
  numImages: number
  numVideos: number
}

export interface PromptsGenerationResult {
  imagePrompts: ContentPrompt[]
  videoPrompts: ContentPrompt[]
}

// ============================================
// OUTPUTS / CONTENIDO GENERADO
// ============================================
export interface GeneratedContent {
  id: string
  promptId: string
  angleId: string
  archetypeId: string
  campaignId: string
  type: ContentType
  url: string
  editedUrl?: string // URL de la imagen editada con textos/overlays
  thumbnailUrl?: string
  metadata: ContentMetadata
  createdAt: string
  // Aprobación interna (Studio) -> pasa a Gallery del cliente
  approvedForClient?: boolean
  approvedForClientAt?: string
  // Feedback del cliente en Gallery
  clientFeedback?: 'approved' | 'rejected' | 'pending'
  clientFeedbackComment?: string
  clientFeedbackAt?: string
}

export interface ContentMetadata {
  provider: 'nano_banana' | 'sora_pro'
  jobId: string
  costTime?: number
  credits?: number
  width?: number
  height?: number
  duration?: number // para videos
}

// ============================================
// ESTADO DE LA APP (para el store/cache)
// ============================================
export interface CampaignState {
  campaign: Campaign
  referenceImages: ReferenceImage[] // Imágenes de referencia disponibles
  research?: ResearchOutput
  archetypes: Archetype[]
  opportunities?: StrategicOpportunity[]
  positioningRoutes?: PositioningRoute[]
  angles: Angle[]
  prompts: ContentPrompt[]
  outputs: GeneratedContent[]
}

// ============================================
// RESPUESTAS DE API
// ============================================
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  pageSize: number
}
