/**
 * Agente 4: Variations from Top Performers
 *
 * Toma los mejores prompts + métricas y genera nuevas variantes
 * manteniendo estructura pero variando:
 * - Hook
 * - Contexto (pequeños cambios)
 * - Matices en el beneficio
 * - Microgestos/acciones
 */

import OpenAI from 'openai'
import { getOpenAIApiKey } from '../config/api-keys'
import type { VideoPrompt, PromptVariation, VariationsOutput, AgentExecutionResult } from './types'

function getOpenAIClient() {
  return new OpenAI({ apiKey: getOpenAIApiKey() })
}

const VARIATIONS_PROMPT_TEMPLATE = `Actúa como un optimizador creativo de anuncios UGC basado en performance.

Recibirás:
- Una lista de PROMPTS de video UGC que ya se usaron.
- Un PLAYBOOK con patrones ganadores extraído del análisis.

ENTRADA:
- TOP_PROMPTS: {{top_prompts_json}}
- PLAYBOOK: {{playbook_json}}
- NUM_VARIATIONS_PER_PROMPT: {{num_variations}}
- IDIOMA: español

TU TAREA:
Para cada prompt top, generar NUM_VARIATIONS_PER_PROMPT NUEVOS PROMPTS completos,
en el MISMO FORMATO que el original, pero con variaciones en:

- Hook (primeras 1–2 frases de diálogo)
- Pequeños cambios de contexto (habitación diferente, props distintos, momento del día)
  manteniendo realismo
- Matices en el beneficio principal (mismas ideas, diferente wording)
- Microgestos/acciones del creador (más gestos, diferentes expresiones)

NO PUEDES CAMBIAR:
- La promesa central que hace el anuncio
- El tipo de protagonista (si era "mamá joven", sigue siéndolo)
- El tono general (ej. cercano, honesto, divertido)
- El tipo de formato (selfie vertical, 9:16, handheld)

DEVUELVE SOLO JSON VÁLIDO (sin markdown, sin explicaciones):

{
  "variations": [
    {
      "parent_prompt_id": "angle_1",
      "variation_id": "angle_1_var_01",
      "prompt_text": "...prompt completo aquí...",
      "hypothesis": "Por qué podría performar mejor (1-2 frases)",
      "target_metric": "ctr"
    },
    {
      "parent_prompt_id": "angle_1",
      "variation_id": "angle_1_var_02",
      "prompt_text": "...prompt completo aquí...",
      "hypothesis": "Por qué podría performar mejor (1-2 frases)",
      "target_metric": "thumbstop"
    },
    ...
  ]
}

Reglas:
- Usa patrones del PLAYBOOK: hooks y CTAs que ya vimos que funcionan.
- Respeta cualquier "do_not_do" del PLAYBOOK y del NEGATIVE PROMPT original.
- Todo el contenido en español.
- Cada variación debe ser DISTINTA pero reconocible como del mismo concepto.
- SOLO DEVUELVE JSON.`

interface PlaybookData {
  hook_patterns?: string[]
  story_structures?: string[]
  cta_patterns?: string[]
  do_not_do?: string[]
  best_performers?: string[]
}

export async function executeVariationsAgent(
  topPrompts: VideoPrompt[],
  numVariationsPerPrompt: number = 3,
  playbook?: PlaybookData
): Promise<AgentExecutionResult> {
  const startTime = Date.now()

  try {
    if (topPrompts.length === 0) {
      throw new Error('No top prompts provided')
    }

    // Default playbook if not provided
    const defaultPlaybook: PlaybookData = {
      hook_patterns: [
        'Pregunta provocadora',
        'Confesión personal',
        'Shock/surprise',
        'Comparación antes/después',
        'Estadística sorprendente',
      ],
      story_structures: [
        'Problema → Solución → Resultado',
        'Situación relatable → Giro inesperado',
        'Desafío → Intento fallido → Éxito',
      ],
      cta_patterns: [
        'Probalo ahora mismo',
        'Metete a conocer',
        'No te lo pierdas',
        'Vos también podes',
        'Dale una oportunidad',
      ],
      do_not_do: [
        'No uses voz en off',
        'No hagas publicidad obvia',
        'No uses música dramática',
        'No seas demasiado comercial',
      ],
    }

    const finalPlaybook = playbook || defaultPlaybook
    const topPromptsJson = JSON.stringify(topPrompts, null, 2)
    const playbookJson = JSON.stringify(finalPlaybook, null, 2)

    const prompt = VARIATIONS_PROMPT_TEMPLATE
      .replace('{{top_prompts_json}}', topPromptsJson)
      .replace('{{playbook_json}}', playbookJson)
      .replace('{{num_variations}}', String(numVariationsPerPrompt))

    const message = await getOpenAIClient().chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseText = message.choices[0]?.message?.content || ''

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const output: VariationsOutput = JSON.parse(jsonMatch[0])

    // Validate output structure
    if (!output.variations || !Array.isArray(output.variations)) {
      throw new Error('Invalid variations output structure')
    }

    return {
      success: true,
      agentName: 'Variations Agent',
      step: 'variations',
      output,
      executedAt: new Date(),
      duration: Date.now() - startTime,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      agentName: 'Variations Agent',
      step: 'variations',
      error: errorMessage,
      executedAt: new Date(),
      duration: Date.now() - startTime,
    }
  }
}
