/**
 * AGENTE 2 - Maestro de Ángulos (VSL / Direct Response)
 *
 * Genera ángulos creativos de alta conversión para cada arquetipo
 */

import OpenAI from 'openai'
import { getOpenAIApiKey } from '../config/api-keys'
import type { Archetype, Angle, Campaign } from '../types/campaign-types'

function getOpenAIClient() {
  const apiKey = getOpenAIApiKey()
  console.log(`[Angles Agent] OpenAI API Key presente: ${apiKey ? 'Sí' : 'NO'}`)

  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY no está configurada correctamente')
  }

  return new OpenAI({ apiKey })
}

const ANGLES_SYSTEM_PROMPT = `You are a world-class advertising copywriter specializing in high-performing VSL creative angles.
When provided with an arquetipo + insights, generate 5 powerful creative angles.

Each angle must include:
- AngleHeadline: Un título gancho poderoso
- ConceptSummary: Resumen del concepto creativo
- VSLStructure: Estructura sugerida para VSL
- VideoSuggestion: Sugerencia de contenido de video
- EmotionalTriggers: Lista de triggers emocionales a usar
- CognitiveBiasesLeveraged: Sesgos cognitivos que aprovecha
- DirectResponseTechniques: Técnicas de respuesta directa

Output in JSON only, no explanation. Todo el contenido debe estar en español.`

const JSON_STRUCTURE = `{
  "angles": [
    {
      "title": "Título del ángulo",
      "description": "Descripción estratégica del ángulo",
      "strategicGoal": "Objetivo estratégico",
      "vslStructure": "Hook → Problem → Agitate → Solution → CTA",
      "videoSuggestion": "Descripción del tipo de video sugerido",
      "emotionalTriggers": ["trigger 1", "trigger 2"],
      "cognitiveBiases": ["sesgo 1", "sesgo 2"],
      "directResponseTechniques": ["técnica 1", "técnica 2"]
    }
  ]
}`

export interface AnglesGenerationResult {
  angles: Angle[]
  archetypeId: string
}

export async function executeAnglesAgent(
  archetype: Archetype,
  campaign: Campaign
): Promise<AnglesGenerationResult> {
  const startTime = Date.now()
  console.log(`[Angles Agent] Generando ángulos para arquetipo: ${archetype.name}`)

  try {
    const client = getOpenAIClient()

    const userPrompt = `
CAMPAÑA:
- Nombre: ${campaign.name}
- Brief: ${campaign.brief}
- Objetivo: ${campaign.objective}
- Categoría: ${campaign.category}

ARQUETIPO A TRABAJAR:
- Nombre: ${archetype.name}
- Resumen: ${archetype.summary}
- Motivación principal: ${archetype.mainMotivation}
- Puntos de dolor: ${archetype.painPoints.join(', ')}
- Deseos: ${archetype.desires.join(', ')}
- Momento de consumo: ${archetype.consumptionMoment}
- Trigger emocional: ${archetype.emotionalTrigger}
- Barreras: ${archetype.barriers.join(', ')}

Genera 5 ángulos creativos de alta conversión para este arquetipo.
Responde SOLO con JSON válido siguiendo esta estructura:

${JSON_STRUCTURE}
`

    console.log('[Angles Agent] Llamando a OpenAI API...')

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4000,
      temperature: 0.8,
      messages: [
        { role: 'system', content: ANGLES_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const responseText = response.choices[0]?.message?.content || ''
    console.log(`[Angles Agent] Respuesta recibida (${responseText.length} chars)`)

    // Extraer JSON de la respuesta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No se encontró JSON válido en la respuesta')
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.angles || !Array.isArray(parsed.angles)) {
      throw new Error('Estructura de respuesta inválida - no se encontró array de angles')
    }

    // Transformar a nuestros tipos
    const angles: Angle[] = parsed.angles.map(
      (a: Record<string, unknown>, index: number) => ({
        id: `angle_${archetype.id}_${Date.now()}_${index}`,
        archetypeId: archetype.id,
        campaignId: campaign.id,
        title: a.title as string,
        description: a.description as string,
        strategicGoal: a.strategicGoal as string,
        vslStructure: a.vslStructure as string,
        videoSuggestion: a.videoSuggestion as string,
        emotionalTriggers: a.emotionalTriggers as string[],
        cognitiveBiases: a.cognitiveBiases as string[],
        directResponseTechniques: a.directResponseTechniques as string[],
        imagesRequested: 0,
        videosRequested: 0,
        createdAt: new Date().toISOString(),
      })
    )

    const duration = Date.now() - startTime
    console.log(`[Angles Agent] Completado en ${duration}ms - ${angles.length} ángulos generados`)

    return {
      angles,
      archetypeId: archetype.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Angles Agent] Error: ${errorMessage}`)
    throw new Error(`Angles Agent failed: ${errorMessage}`)
  }
}

/**
 * Genera ángulos para múltiples arquetipos en paralelo
 */
export async function executeAnglesAgentBatch(
  archetypes: Archetype[],
  campaign: Campaign
): Promise<Angle[]> {
  console.log(`[Angles Agent] Generando ángulos para ${archetypes.length} arquetipos`)

  const results = await Promise.all(
    archetypes.map((archetype) => executeAnglesAgent(archetype, campaign))
  )

  const allAngles = results.flatMap((r) => r.angles)
  console.log(`[Angles Agent] Total de ángulos generados: ${allAngles.length}`)

  return allAngles
}
