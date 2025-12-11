/**
 * Workflow Automation Service
 *
 * Servicio para ejecutar workflows n8n automáticamente desde Next.js
 * Sincroniza datos de Meta Ads, genera insights y ejecuta análisis
 */

import { executeWorkflow, syncMetaAds, generateInsights, detectPatterns, classifyAds, runAdsBenchmark } from './n8n-client'

interface WorkflowSchedule {
  name: string
  interval: number // en milisegundos
  lastRun?: Date
  nextRun?: Date
}

// Programación de workflows
const WORKFLOW_SCHEDULES: Record<string, WorkflowSchedule> = {
  metaAdsSync: {
    name: 'Meta Ads Sync',
    interval: 6 * 60 * 60 * 1000, // 6 horas
  },
  insightsSummarizer: {
    name: 'Insights Summarizer',
    interval: 6 * 60 * 60 * 1000, // 6 horas
  },
  patternDetection: {
    name: 'Pattern Detection',
    interval: 7 * 24 * 60 * 60 * 1000, // 7 días (lunes)
  },
  classifyAds: {
    name: 'Classify Ads',
    interval: 24 * 60 * 60 * 1000, // 24 horas (diario)
  },
  adsBenchmark: {
    name: 'Ads Benchmark',
    interval: 7 * 24 * 60 * 60 * 1000, // 7 días (semanal)
  },
}

/**
 * Ejecutar sincronización de Meta Ads bajo demanda
 */
export async function syncMetaAdsNow(params?: {
  from?: string
  to?: string
}) {
  console.log('[Workflows] Ejecutando Meta Ads Sync...')

  try {
    const result = await syncMetaAds(params)

    if (result.success) {
      console.log('[Workflows] Meta Ads Sync completado exitosamente')
    } else {
      console.error('[Workflows] Error en Meta Ads Sync:', result.error)
    }

    return result
  } catch (error) {
    console.error('[Workflows] Error ejecutando Meta Ads Sync:', error)
    return {
      success: false,
      workflowName: 'Meta Ads Sync',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Generar insights automáticamente
 */
export async function generateInsightsNow(params?: {
  from?: string
  to?: string
  force?: boolean
}) {
  console.log('[Workflows] Ejecutando Insights Summarizer...')

  try {
    const result = await generateInsights(params)

    if (result.success) {
      console.log('[Workflows] Insights Summarizer completado exitosamente')
    } else {
      console.error('[Workflows] Error en Insights Summarizer:', result.error)
    }

    return result
  } catch (error) {
    console.error('[Workflows] Error ejecutando Insights Summarizer:', error)
    return {
      success: false,
      workflowName: 'Insights Summarizer',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Detectar patrones en anuncios
 */
export async function detectPatternsNow() {
  console.log('[Workflows] Ejecutando Pattern Detection...')

  try {
    const result = await detectPatterns()

    if (result.success) {
      console.log('[Workflows] Pattern Detection completado exitosamente')
    } else {
      console.error('[Workflows] Error en Pattern Detection:', result.error)
    }

    return result
  } catch (error) {
    console.error('[Workflows] Error ejecutando Pattern Detection:', error)
    return {
      success: false,
      workflowName: 'Pattern Detection',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Clasificar anuncios
 */
export async function classifyAdsNow() {
  console.log('[Workflows] Ejecutando Classify Ads...')

  try {
    const result = await classifyAds()

    if (result.success) {
      console.log('[Workflows] Classify Ads completado exitosamente')
    } else {
      console.error('[Workflows] Error en Classify Ads:', result.error)
    }

    return result
  } catch (error) {
    console.error('[Workflows] Error ejecutando Classify Ads:', error)
    return {
      success: false,
      workflowName: 'Classify Ads',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Ejecutar benchmark de anuncios
 */
export async function runBenchmarkNow() {
  console.log('[Workflows] Ejecutando Ads Benchmark...')

  try {
    const result = await runAdsBenchmark()

    if (result.success) {
      console.log('[Workflows] Ads Benchmark completado exitosamente')
    } else {
      console.error('[Workflows] Error en Ads Benchmark:', result.error)
    }

    return result
  } catch (error) {
    console.error('[Workflows] Error ejecutando Ads Benchmark:', error)
    return {
      success: false,
      workflowName: 'Ads Benchmark',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Ejecutar todos los workflows automáticamente
 * Se llamará desde un cron job externo (Vercel Crons, Railway, etc.)
 */
export async function runAllWorkflows() {
  console.log('[Workflows] Iniciando ejecución de todos los workflows...')

  const results = {
    metaAdsSync: await syncMetaAdsNow(),
    classifyAds: await classifyAdsNow(),
    insightsSummarizer: await generateInsightsNow(),
    patternDetection: await detectPatternsNow(),
    adsBenchmark: await runBenchmarkNow(),
  }

  console.log('[Workflows] Ejecución de todos los workflows completada')

  return results
}

/**
 * Ejecutar workflows según su horario
 * Esta función debería ser llamada periódicamente por un servicio cron externo
 */
export async function runScheduledWorkflows() {
  const now = new Date()
  console.log(`[Workflows] Verificando workflows programados a las ${now.toISOString()}`)

  const results: Record<string, any> = {}

  // Verificar cada workflow y ejecutar si es necesario
  for (const [key, schedule] of Object.entries(WORKFLOW_SCHEDULES)) {
    const lastRun = schedule.lastRun || new Date(0)
    const timeSinceLastRun = now.getTime() - lastRun.getTime()

    if (timeSinceLastRun >= schedule.interval) {
      console.log(`[Workflows] Ejecutando ${schedule.name}...`)

      switch (key) {
        case 'metaAdsSync':
          results[key] = await syncMetaAdsNow()
          break
        case 'insightsSummarizer':
          results[key] = await generateInsightsNow()
          break
        case 'patternDetection':
          results[key] = await detectPatternsNow()
          break
        case 'classifyAds':
          results[key] = await classifyAdsNow()
          break
        case 'adsBenchmark':
          results[key] = await runBenchmarkNow()
          break
      }

      schedule.lastRun = now
    }
  }

  return results
}

/**
 * Obtener estado de los workflows programados
 */
export function getWorkflowStatus() {
  const now = new Date()

  return Object.entries(WORKFLOW_SCHEDULES).map(([key, schedule]) => {
    const lastRun = schedule.lastRun || new Date(0)
    const nextRun = new Date(lastRun.getTime() + schedule.interval)
    const timeUntilNext = nextRun.getTime() - now.getTime()

    return {
      key,
      name: schedule.name,
      interval: schedule.interval,
      lastRun: lastRun.toISOString(),
      nextRun: nextRun.toISOString(),
      timeUntilNextRun: Math.max(0, timeUntilNext),
      isReady: timeUntilNext <= 0,
    }
  })
}
