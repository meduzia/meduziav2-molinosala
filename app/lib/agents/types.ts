/**
 * Types y interfaces para el sistema de agentes UGC
 */

// ============= INPUT TYPES =============

export interface CampaignInput {
  id?: string
  type: 'producto' | 'servicio'
  brief_text: string
  product_image_url?: string
  target_audience?: string
  info_extra?: string
  num_videos_initial: number
  num_images?: number
  idioma: string
  createdAt?: Date
}

// ============= RESEARCH AGENT OUTPUT =============

export interface PainPoint {
  id: string
  description: string
}

export interface Benefit {
  id: string
  description: string
}

export interface Objection {
  id: string
  description: string
}

export interface Promise {
  id: string
  description: string
}

export interface ResearchOutput {
  pain_points: PainPoint[]
  benefits: Benefit[]
  objections: Objection[]
  promises: Promise[]
}

// ============= ANGLES AGENT OUTPUT =============

export interface CreativeAngle {
  angle_id: string
  angle_name: string
  big_idea: string
  hook_type: string
  pain_point_target: string
  key_benefit_target: string
  suggested_creator: string
  context: string
}

export interface AnglesOutput {
  angles: CreativeAngle[]
}

// ============= SCRIPTWRITER AGENT OUTPUT =============

export interface VideoPrompt {
  id?: string
  angle_id: string
  prompt_text: string
  technical_parameters?: Record<string, any>
  negative_prompt?: string
}

export interface ScriptwriterOutput {
  prompts: VideoPrompt[]
}

// ============= IMAGE GENERATOR AGENT OUTPUT =============

export interface ImagePrompt {
  id?: string
  angle_id: string
  angle_name: string
  prompt_text: string
  style?: string
  technical_parameters?: Record<string, any>
}

export interface ImageGeneratorOutput {
  prompts: ImagePrompt[]
}

// ============= VARIATIONS AGENT OUTPUT =============

export interface PromptVariation {
  parent_prompt_id: string
  variation_id: string
  prompt_text: string
  hypothesis: string
  target_metric: 'ctr' | 'thumbstop' | 'roas' | 'conversion'
}

export interface VariationsOutput {
  variations: PromptVariation[]
}

// ============= CAMPAIGN ORCHESTRATION =============

export interface CampaignOrchestrationFlow {
  step: 'research' | 'angles' | 'scriptwriting' | 'variations' | 'image_generation' | 'video_generation'
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: any
  output?: any
  error?: string
  startedAt?: Date
  completedAt?: Date
}

export interface Campaign {
  id: string
  input: CampaignInput
  research?: ResearchOutput
  angles?: AnglesOutput
  prompts?: VideoPrompt[]
  image_prompts?: ImagePrompt[]
  variations?: PromptVariation[]
  images?: GeneratedAsset[]
  videos?: GeneratedAsset[]
  flows: CampaignOrchestrationFlow[]
  status: 'draft' | 'in_progress' | 'completed' | 'failed' | 'paused' | 'archived'
  createdAt: Date
  updatedAt: Date
  pausedAt?: Date
  deletedAt?: Date
}

export interface GeneratedAsset {
  id: string
  type: 'image' | 'video'
  url: string
  prompt_id?: string
  variation_id?: string
  metadata?: Record<string, any>
  createdAt: Date
  // KIE Image Generation specific fields
  kieTaskId?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
}

// ============= AGENT EXECUTION RESULT =============

export interface AgentExecutionResult {
  success: boolean
  agentName: string
  step: CampaignOrchestrationFlow['step']
  output?: any
  error?: string
  executedAt: Date
  duration: number
}
