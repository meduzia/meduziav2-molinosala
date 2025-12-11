/**
 * N8N Backend Integration Client
 *
 * Este servicio conecta con los workflows de n8n que funcionan como backend.
 * Los workflows se ejecutan automáticamente según sus schedules:
 * - meta-ads-sync: cada 6 horas
 * - insights-summarizer: cada 6 horas
 * - pattern-detection: cada lunes
 * - classify-ads: diariamente
 * - ads-benchmark: cada lunes
 * - meta-insights-supabase: cada hora
 * - quick-wins-agent: bajo demanda desde Dashboard
 *
 * Este cliente solo proporciona funciones para:
 * 1. Sincronizar datos bajo demanda
 * 2. Generar insights cuando se necesite
 * 3. Consultar el agente de preguntas
 */

interface N8nWorkflowConfig {
  name: string
  description: string
  webhookUrl: string
  triggerType: 'manual' | 'schedule' | 'webhook'
  lastRun?: Date
  status: 'idle' | 'running' | 'success' | 'error'
}

interface WorkflowExecutionResult {
  success: boolean
  workflowName: string
  message?: string
  data?: any
  error?: string
  executedAt: Date
}

// Configuración de workflows n8n
// Estos URLs deben ser configurados con la instancia de n8n real
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678'
const N8N_WEBHOOK_PREFIX = `${N8N_BASE_URL}/webhook`

export const N8N_WORKFLOWS = {
  // Sincronización de datos Meta Ads
  metaAdsSync: {
    name: 'Meta Ads Sync',
    description: 'Sincroniza todos los datos de Meta Ads a Supabase',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/meta-ads-sync`,
    triggerType: 'schedule' as const,
  },

  // Análisis e Insights
  insightsSummarizer: {
    name: 'Insights Summarizer',
    description: 'Genera insights accionables con IA basados en performance',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/insights-summarizer`,
    triggerType: 'schedule' as const,
  },

  patternDetection: {
    name: 'Pattern Detection',
    description: 'Detecta patrones en anuncios de alto y bajo rendimiento',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/pattern-detection`,
    triggerType: 'schedule' as const,
  },

  quickWinsAgent: {
    name: 'Quick Wins Agent',
    description: 'Convierte preguntas en lenguaje natural a SQL y respuestas',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/quick-wins-agent`,
    triggerType: 'webhook' as const,
  },

  // Clasificación y Ranking
  classifyAds: {
    name: 'Classify Ads',
    description: 'Clasifica creativamente los anuncios (contenido, appeal, CTA)',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/classify-ads`,
    triggerType: 'schedule' as const,
  },

  adsBenchmark: {
    name: 'Ads Benchmark',
    description: 'Calcula rankings semanales de top10 y bottom10 ads',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/ads-benchmark`,
    triggerType: 'schedule' as const,
  },

  // Generación de Creativos
  creativeBriefGenerator: {
    name: 'Creative Brief Generator',
    description: 'Genera briefs creativos completos basados en patrones',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/creative-brief-generator`,
    triggerType: 'webhook' as const,
  },

  creativeImageGenerate: {
    name: 'Creative Image Generate',
    description: 'Genera imágenes creativas basadas en briefs usando IA',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/creative-image-generate`,
    triggerType: 'webhook' as const,
  },

  creativeVideoGenerate: {
    name: 'Creative Video Generate',
    description: 'Genera videos creativos basados en briefs',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/creative-video-generate`,
    triggerType: 'webhook' as const,
  },

  productCreativeGen: {
    name: 'Product Creative Gen',
    description: 'Genera creativos basados en datos del producto',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/product-creative-gen`,
    triggerType: 'webhook' as const,
  },

  // Competencia y Reportes
  competitorsTrendsPull: {
    name: 'Competitors Trends Pull',
    description: 'Recopila información de competencia y tendencias',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/competitors-trends-pull`,
    triggerType: 'schedule' as const,
  },

  weeklyReport: {
    name: 'Weekly Report',
    description: 'Genera reportes semanales consolidados',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/weekly-report`,
    triggerType: 'schedule' as const,
  },

  // Meta Insights Sync
  metaInsightsSyncOAuth: {
    name: 'Meta Insights Sync (OAuth)',
    description: 'Sincroniza Meta Insights a Supabase con OAuth2',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/meta-insights-supabase`,
    triggerType: 'schedule' as const,
  },

  metaInsightsSyncToken: {
    name: 'Meta Insights Sync (Token)',
    description: 'Sincroniza Meta Insights a Supabase con Access Token',
    webhookUrl: `${N8N_WEBHOOK_PREFIX}/meta-insights-supabase-simple`,
    triggerType: 'schedule' as const,
  },
}

/**
 * Ejecutar un workflow n8n específico
 */
export async function executeWorkflow(
  workflowKey: keyof typeof N8N_WORKFLOWS,
  payload?: any
): Promise<WorkflowExecutionResult> {
  try {
    const workflow = N8N_WORKFLOWS[workflowKey]

    const response = await fetch(workflow.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'retrofish-dashboard',
        ...payload,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      workflowName: workflow.name,
      message: `Workflow ejecutado exitosamente`,
      data,
      executedAt: new Date(),
    }
  } catch (error) {
    console.error(`Error ejecutando workflow ${workflowKey}:`, error)

    return {
      success: false,
      workflowName: N8N_WORKFLOWS[workflowKey].name,
      error: error instanceof Error ? error.message : 'Error desconocido',
      executedAt: new Date(),
    }
  }
}

/**
 * Sincronizar datos de Meta Ads
 */
export async function syncMetaAds(params?: {
  from?: string
  to?: string
}) {
  return executeWorkflow('metaAdsSync', {
    ...params,
    dateRange: {
      from: params?.from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: params?.to || new Date().toISOString().split('T')[0],
    },
  })
}

/**
 * Generar insights con IA
 */
export async function generateInsights(params?: {
  from?: string
  to?: string
  force?: boolean
}) {
  return executeWorkflow('insightsSummarizer', {
    ...params,
    dateRange: {
      from: params?.from || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: params?.to || new Date().toISOString().split('T')[0],
    },
  })
}

/**
 * Detectar patrones en anuncios
 */
export async function detectPatterns(params?: {
  minAds?: number
  topN?: number
}) {
  return executeWorkflow('patternDetection', {
    minAds: params?.minAds || 10,
    topN: params?.topN || 10,
  })
}

/**
 * Clasificar anuncios
 */
export async function classifyAds(params?: {
  forceReclassify?: boolean
}) {
  return executeWorkflow('classifyAds', {
    forceReclassify: params?.forceReclassify || false,
  })
}

/**
 * Ejecutar benchmark semanal
 */
export async function runAdsBenchmark(params?: {
  weekIso?: string
}) {
  return executeWorkflow('adsBenchmark', {
    weekIso: params?.weekIso,
  })
}

/**
 * Generar brief creativo
 */
export async function generateCreativeBrief(params: {
  patterns?: any
  productSummary?: string
  learnings?: string
}) {
  return executeWorkflow('creativeBriefGenerator', params)
}

/**
 * Generar imagen con IA
 */
export async function generateCreativeImage(params: {
  briefId: string
  specifications?: any
}) {
  return executeWorkflow('creativeImageGenerate', params)
}

/**
 * Generar video con IA
 */
export async function generateCreativeVideo(params: {
  briefId: string
  specifications?: any
}) {
  return executeWorkflow('creativeVideoGenerate', params)
}

/**
 * Preguntar al agente Quick Wins
 */
export async function askQuickWinsAgent(query: string, userId?: string) {
  return executeWorkflow('quickWinsAgent', {
    query,
    userId,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Obtener todos los workflows disponibles
 */
export function getAvailableWorkflows() {
  return Object.entries(N8N_WORKFLOWS).map(([key, config]) => ({
    key,
    ...config,
  }))
}

/**
 * Obtener workflows por tipo de trigger
 */
export function getWorkflowsByTrigger(triggerType: 'manual' | 'schedule' | 'webhook') {
  return getAvailableWorkflows().filter(w => w.triggerType === triggerType)
}

/**
 * Validar que n8n esté disponible
 */
export async function checkN8nHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${N8N_BASE_URL}/api/v1/credentials`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY || '',
      },
    })
    return response.ok
  } catch {
    return false
  }
}
