/**
 * Cost Calculator para Campañas UGC
 *
 * Calcula el costo de generar cada campaña usando OpenAI API
 * Basado en los tokens utilizados por cada agente
 *
 * Precios OpenAI GPT-3.5-turbo (al 2025-11-16):
 * - Input: $0.0005 por 1K tokens
 * - Output: $0.0015 por 1K tokens
 */

// Precios por 1K tokens
const OPENAI_PRICING = {
  'gpt-3.5-turbo': {
    input: 0.0005, // $ por 1K input tokens
    output: 0.0015, // $ por 1K output tokens
  },
}

interface AgentCost {
  name: string
  model: string
  max_tokens: number
  estimatedInputTokens: number
  estimatedOutputTokens: number
}

interface CampaignCostBreakdown {
  research: {
    name: string
    inputCost: number
    outputCost: number
    totalCost: number
    tokens: { input: number; output: number }
  }
  angles: {
    name: string
    inputCost: number
    outputCost: number
    totalCost: number
    tokens: { input: number; output: number }
  }
  scriptwriting: {
    name: string
    inputCost: number
    outputCost: number
    totalCost: number
    tokens: { input: number; output: number }
    enabled: boolean
  }
  imageGeneration: {
    name: string
    inputCost: number
    outputCost: number
    totalCost: number
    tokens: { input: number; output: number }
    enabled: boolean
  }
  variations: {
    name: string
    inputCost: number
    outputCost: number
    totalCost: number
    tokens: { input: number; output: number }
    enabled: boolean
  }
  summary: {
    totalInputCost: number
    totalOutputCost: number
    totalCost: number
    totalTokens: { input: number; output: number }
  }
}

/**
 * Estimaciones de tokens por agente basadas en análisis
 */
const AGENT_TOKEN_ESTIMATES = {
  research: {
    name: 'Research Agent (Pain Points Analyzer)',
    model: 'gpt-3.5-turbo',
    max_tokens: 1500,
    estimatedInputTokens: 800, // Prompt + brief text
    estimatedOutputTokens: 1200, // JSON response con 10 pain points, 10 benefits, 5 objections, 5 promises
  },
  angles: {
    name: 'Angles Agent (Creative Concepts)',
    model: 'gpt-3.5-turbo',
    max_tokens: 3500,
    estimatedInputTokens: 2000, // Prompt + research output + brief
    estimatedOutputTokens: 2800, // 20 ángulos creativos con detalles
  },
  scriptwriting: {
    name: 'Scriptwriter Agent (Video Prompts)',
    model: 'gpt-3.5-turbo',
    max_tokens: 6000,
    estimatedInputTokens: 3500, // Prompt + angles + research
    estimatedOutputTokens: 4500, // Prompts de video detallados para cada ángulo
  },
  imageGeneration: {
    name: 'Image Generator Agent (Image Prompts)',
    model: 'gpt-3.5-turbo',
    max_tokens: 6000,
    estimatedInputTokens: 3500, // Prompt + angles + research
    estimatedOutputTokens: 4500, // Prompts de imagen detallados
  },
  variations: {
    name: 'Variations Agent (Video Variations)',
    model: 'gpt-3.5-turbo',
    max_tokens: 8000,
    estimatedInputTokens: 5000, // Prompt + video prompts + variations config
    estimatedOutputTokens: 6000, // Múltiples variaciones de videos
  },
}

function calculateAgentCost(
  agent: AgentCost,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const pricing = OPENAI_PRICING[agent.model as keyof typeof OPENAI_PRICING]

  if (!pricing) {
    throw new Error(`Unknown model: ${agent.model}`)
  }

  // Calcular costos
  const inputCost = (inputTokens / 1000) * pricing.input
  const outputCost = (outputTokens / 1000) * pricing.output
  const totalCost = inputCost + outputCost

  return {
    inputCost: parseFloat(inputCost.toFixed(6)),
    outputCost: parseFloat(outputCost.toFixed(6)),
    totalCost: parseFloat(totalCost.toFixed(6)),
  }
}

export interface CampaignCostOptions {
  executeResearch?: boolean
  executeAngles?: boolean
  executeScriptwriting?: boolean
  executeImageGeneration?: boolean
  executeVariations?: boolean
}

/**
 * Calcula el costo estimado de una campaña
 */
export function calculateCampaignCost(options: CampaignCostOptions = {}): CampaignCostBreakdown {
  const {
    executeResearch = true,
    executeAngles = true,
    executeScriptwriting = false,
    executeImageGeneration = true,
    executeVariations = false,
  } = options

  const breakdown: CampaignCostBreakdown = {
    research: {
      name: AGENT_TOKEN_ESTIMATES.research.name,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      tokens: { input: 0, output: 0 },
    },
    angles: {
      name: AGENT_TOKEN_ESTIMATES.angles.name,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      tokens: { input: 0, output: 0 },
    },
    scriptwriting: {
      name: AGENT_TOKEN_ESTIMATES.scriptwriting.name,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      tokens: { input: 0, output: 0 },
      enabled: executeScriptwriting,
    },
    imageGeneration: {
      name: AGENT_TOKEN_ESTIMATES.imageGeneration.name,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      tokens: { input: 0, output: 0 },
      enabled: executeImageGeneration,
    },
    variations: {
      name: AGENT_TOKEN_ESTIMATES.variations.name,
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      tokens: { input: 0, output: 0 },
      enabled: executeVariations,
    },
    summary: {
      totalInputCost: 0,
      totalOutputCost: 0,
      totalCost: 0,
      totalTokens: { input: 0, output: 0 },
    },
  }

  // Calcular Research (siempre ejecutado)
  if (executeResearch) {
    const researchCost = calculateAgentCost(
      AGENT_TOKEN_ESTIMATES.research,
      AGENT_TOKEN_ESTIMATES.research.estimatedInputTokens,
      AGENT_TOKEN_ESTIMATES.research.estimatedOutputTokens
    )
    breakdown.research.inputCost = researchCost.inputCost
    breakdown.research.outputCost = researchCost.outputCost
    breakdown.research.totalCost = researchCost.totalCost
    breakdown.research.tokens.input = AGENT_TOKEN_ESTIMATES.research.estimatedInputTokens
    breakdown.research.tokens.output = AGENT_TOKEN_ESTIMATES.research.estimatedOutputTokens
  }

  // Calcular Angles (siempre ejecutado si research se ejecutó)
  if (executeAngles && executeResearch) {
    const anglesCost = calculateAgentCost(
      AGENT_TOKEN_ESTIMATES.angles,
      AGENT_TOKEN_ESTIMATES.angles.estimatedInputTokens,
      AGENT_TOKEN_ESTIMATES.angles.estimatedOutputTokens
    )
    breakdown.angles.inputCost = anglesCost.inputCost
    breakdown.angles.outputCost = anglesCost.outputCost
    breakdown.angles.totalCost = anglesCost.totalCost
    breakdown.angles.tokens.input = AGENT_TOKEN_ESTIMATES.angles.estimatedInputTokens
    breakdown.angles.tokens.output = AGENT_TOKEN_ESTIMATES.angles.estimatedOutputTokens
  }

  // Calcular Scriptwriting (opcional)
  if (executeScriptwriting && executeAngles) {
    const scriptwritingCost = calculateAgentCost(
      AGENT_TOKEN_ESTIMATES.scriptwriting,
      AGENT_TOKEN_ESTIMATES.scriptwriting.estimatedInputTokens,
      AGENT_TOKEN_ESTIMATES.scriptwriting.estimatedOutputTokens
    )
    breakdown.scriptwriting.inputCost = scriptwritingCost.inputCost
    breakdown.scriptwriting.outputCost = scriptwritingCost.outputCost
    breakdown.scriptwriting.totalCost = scriptwritingCost.totalCost
    breakdown.scriptwriting.tokens.input = AGENT_TOKEN_ESTIMATES.scriptwriting.estimatedInputTokens
    breakdown.scriptwriting.tokens.output = AGENT_TOKEN_ESTIMATES.scriptwriting.estimatedOutputTokens
  }

  // Calcular Image Generation (opcional)
  if (executeImageGeneration && executeAngles) {
    const imageGenerationCost = calculateAgentCost(
      AGENT_TOKEN_ESTIMATES.imageGeneration,
      AGENT_TOKEN_ESTIMATES.imageGeneration.estimatedInputTokens,
      AGENT_TOKEN_ESTIMATES.imageGeneration.estimatedOutputTokens
    )
    breakdown.imageGeneration.inputCost = imageGenerationCost.inputCost
    breakdown.imageGeneration.outputCost = imageGenerationCost.outputCost
    breakdown.imageGeneration.totalCost = imageGenerationCost.totalCost
    breakdown.imageGeneration.tokens.input =
      AGENT_TOKEN_ESTIMATES.imageGeneration.estimatedInputTokens
    breakdown.imageGeneration.tokens.output =
      AGENT_TOKEN_ESTIMATES.imageGeneration.estimatedOutputTokens
  }

  // Calcular Variations (opcional)
  if (executeVariations && executeScriptwriting) {
    const variationsCost = calculateAgentCost(
      AGENT_TOKEN_ESTIMATES.variations,
      AGENT_TOKEN_ESTIMATES.variations.estimatedInputTokens,
      AGENT_TOKEN_ESTIMATES.variations.estimatedOutputTokens
    )
    breakdown.variations.inputCost = variationsCost.inputCost
    breakdown.variations.outputCost = variationsCost.outputCost
    breakdown.variations.totalCost = variationsCost.totalCost
    breakdown.variations.tokens.input = AGENT_TOKEN_ESTIMATES.variations.estimatedInputTokens
    breakdown.variations.tokens.output = AGENT_TOKEN_ESTIMATES.variations.estimatedOutputTokens
  }

  // Calcular totales
  const totalInputTokens =
    breakdown.research.tokens.input +
    breakdown.angles.tokens.input +
    breakdown.scriptwriting.tokens.input +
    breakdown.imageGeneration.tokens.input +
    breakdown.variations.tokens.input

  const totalOutputTokens =
    breakdown.research.tokens.output +
    breakdown.angles.tokens.output +
    breakdown.scriptwriting.tokens.output +
    breakdown.imageGeneration.tokens.output +
    breakdown.variations.tokens.output

  breakdown.summary.totalInputCost =
    breakdown.research.inputCost +
    breakdown.angles.inputCost +
    breakdown.scriptwriting.inputCost +
    breakdown.imageGeneration.inputCost +
    breakdown.variations.inputCost

  breakdown.summary.totalOutputCost =
    breakdown.research.outputCost +
    breakdown.angles.outputCost +
    breakdown.scriptwriting.outputCost +
    breakdown.imageGeneration.outputCost +
    breakdown.variations.outputCost

  breakdown.summary.totalCost = parseFloat(
    (breakdown.summary.totalInputCost + breakdown.summary.totalOutputCost).toFixed(6)
  )

  breakdown.summary.totalTokens.input = totalInputTokens
  breakdown.summary.totalTokens.output = totalOutputTokens

  return breakdown
}

/**
 * Retorna un string formateado con el desglose de costos
 */
export function formatCostBreakdown(breakdown: CampaignCostBreakdown): string {
  const lines: string[] = [
    '┌─────────────────────────────────────────────────────────────┐',
    '│          DESGLOSE DE COSTOS POR CAMPAÑA UGC               │',
    '├─────────────────────────────────────────────────────────────┤',
  ]

  // Agents individuales
  const agents = [
    { key: 'research', breakdown: breakdown.research },
    { key: 'angles', breakdown: breakdown.angles },
    { key: 'scriptwriting', breakdown: breakdown.scriptwriting },
    { key: 'imageGeneration', breakdown: breakdown.imageGeneration },
    { key: 'variations', breakdown: breakdown.variations },
  ]

  for (const agent of agents) {
    const agentData = agent.breakdown
    const status = agentData.enabled !== false ? '✓' : ' '

    if (agentData.totalCost > 0 || agent.key === 'research' || agent.key === 'angles') {
      lines.push(
        `│ [${status}] ${agentData.name.padEnd(50)} │`
      )
      lines.push(
        `│     Tokens: ${agentData.tokens.input}/${agentData.tokens.output} (in/out)`.padEnd(60) + '│'
      )
      lines.push(
        `│     Input: $${agentData.inputCost.toFixed(4).padEnd(6)} | Output: $${agentData.outputCost
          .toFixed(4)
          .padEnd(6)} | Total: $${agentData.totalCost.toFixed(4)}`.padEnd(60) + '│'
      )
      lines.push('│' + ' '.repeat(59) + '│')
    }
  }

  // Resumen total
  lines.push('├─────────────────────────────────────────────────────────────┤')
  lines.push(
    `│ TOTAL TOKENS:      ${breakdown.summary.totalTokens.input}/${breakdown.summary.totalTokens.output} (input/output)`.padEnd(
      60
    ) + '│'
  )
  lines.push(
    `│ TOTAL INPUT:       $${breakdown.summary.totalInputCost.toFixed(4)}`.padEnd(60) + '│'
  )
  lines.push(
    `│ TOTAL OUTPUT:      $${breakdown.summary.totalOutputCost.toFixed(4)}`.padEnd(60) + '│'
  )
  lines.push('├─────────────────────────────────────────────────────────────┤')
  lines.push(
    `│ 💰 COSTO TOTAL:    $${breakdown.summary.totalCost.toFixed(4)}`.padEnd(60) + '│'
  )
  lines.push('└─────────────────────────────────────────────────────────────┘')

  return lines.join('\n')
}

/**
 * Retorna los costos en formato para API response
 */
export function getCostSummary(breakdown: CampaignCostBreakdown) {
  return {
    agents: {
      research: breakdown.research.totalCost,
      angles: breakdown.angles.totalCost,
      scriptwriting: breakdown.scriptwriting.totalCost,
      imageGeneration: breakdown.imageGeneration.totalCost,
      variations: breakdown.variations.totalCost,
    },
    summary: {
      inputTokens: breakdown.summary.totalTokens.input,
      outputTokens: breakdown.summary.totalTokens.output,
      totalTokens: breakdown.summary.totalTokens.input + breakdown.summary.totalTokens.output,
      inputCost: breakdown.summary.totalInputCost,
      outputCost: breakdown.summary.totalOutputCost,
      totalCost: breakdown.summary.totalCost,
    },
  }
}
