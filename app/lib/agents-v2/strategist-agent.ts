/**
 * AGENTE 1 - Estratega Senior + Research + Arquetipos
 *
 * Ejecuta research completo y genera arquetipos accionables
 */

import OpenAI from 'openai'
import { getOpenAIApiKey } from '../config/api-keys'
import type {
  Campaign,
  Archetype,
  ResearchOutput,
  StrategicOpportunity,
  PositioningRoute,
  ArchetypesGenerationResult,
} from '../types/campaign-types'

function getOpenAIClient() {
  const apiKey = getOpenAIApiKey()
  // Debug: mostrar primeros caracteres de la key para diagnóstico
  const keyPreview = apiKey ? `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 5)}` : 'NO KEY'
  console.log(`[Strategist Agent] OpenAI API Key: ${keyPreview}`)

  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY no está configurada correctamente')
  }

  return new OpenAI({ apiKey })
}

const STRATEGIST_SYSTEM_PROMPT = `Eres un estratega senior de marketing, investigador cultural y analista del comportamiento del consumidor.
Tu tarea es generar arquetipos accionables basados en un brief de campaña de cualquier producto o servicio.

Debes ejecutar SIEMPRE el siguiente proceso:

1) Research Exploratorio

Investiga:
- tendencias de categoría
- tensiones del shopper
- drivers de consumo
- competencia directa e indirecta
- rituales, momentos, usos, fricciones

Output:
Tabla "Panorama" con 5–8 hallazgos accionables, indicando:
- evidencia (fuente o hipótesis)
- implicancia para la marca

2) Deep Research (Pains/Gains/Jobs)

Genera:
- lista de pains
- lista de gains
- 6–10 Jobs to be Done con formato:
"Cuando [situación], quiero [tarea], para [resultado]."

Output:
Matriz Pains / Gains / Jobs / Implicancias.

3) Arquetipos (NO demográficos)

OBLIGATORIO: Debes crear EXACTAMENTE 15 arquetipos (ni más ni menos). Es crítico que generes exactamente 15 arquetipos distintos y diversos.

Crear los arquetipos basados en:
- motivaciones
- tensiones
- contexto
- pains/gains

Cada arquetipo debe incluir:
- nombre
- motivación principal
- pains clave
- gains esperados
- momento de consumo / uso
- trigger emocional o situacional
- barreras

4) Oportunidades

Generar 8–12 oportunidades agrupadas en:
- Producto / portfolio
- Formato & packaging
- Activaciones / comunicación

Formato:
Insight → Idea → Cómo se ve → Cómo se testea → KPI sugerido

5) Propuesta de Posicionamiento

Crear 2–3 rutas con:
- Promesa
- RTB (Reason to Believe)
- Tono
- Why believe
- Ventaja competitiva en PDV

CRITERIOS OBLIGATORIOS:
- No inventar datos sin fuente.
- Marcar hipótesis cuando corresponda.
- Todos los outputs deben estar en JSON legible.
- Cada idea debe conectarse explícitamente con pain/gain o arquetipo.

RESPONDE ÚNICAMENTE CON JSON VÁLIDO con esta estructura exacta:`

const JSON_STRUCTURE = `{
  "research": {
    "panorama": [
      {
        "finding": "hallazgo accionable",
        "evidence": "evidencia o hipótesis",
        "implication": "implicancia para la marca"
      }
    ],
    "pains": ["pain 1", "pain 2", ...],
    "gains": ["gain 1", "gain 2", ...],
    "jobs": [
      {
        "situation": "situación",
        "task": "tarea",
        "outcome": "resultado",
        "fullStatement": "Cuando [situación], quiero [tarea], para [resultado]."
      }
    ]
  },
  "archetypes": [
    {
      "name": "Nombre del Arquetipo",
      "summary": "Resumen breve",
      "mainMotivation": "Motivación principal",
      "painPoints": ["pain 1", "pain 2"],
      "desires": ["deseo 1", "deseo 2"],
      "consumptionMoment": "Momento de consumo/uso",
      "emotionalTrigger": "Trigger emocional",
      "barriers": ["barrera 1", "barrera 2"],
      "importanceRole": "Rol de importancia"
    }
  ],
  "opportunities": [
    {
      "category": "product|format|activation",
      "insight": "insight",
      "idea": "idea",
      "visualization": "cómo se ve",
      "testMethod": "cómo se testea",
      "suggestedKPI": "KPI sugerido"
    }
  ],
  "positioningRoutes": [
    {
      "promise": "promesa",
      "rtb": "reason to believe",
      "tone": "tono",
      "whyBelieve": "por qué creer",
      "competitiveAdvantage": "ventaja competitiva"
    }
  ]
}`

export async function executeStrategistAgent(campaign: Campaign): Promise<ArchetypesGenerationResult> {
  const startTime = Date.now()
  console.log(`[Strategist Agent] Iniciando para campaña: ${campaign.name}`)

  try {
    const client = getOpenAIClient()

    const userPrompt = `
BRIEF DE CAMPAÑA:
- Nombre: ${campaign.name}
- Descripción: ${campaign.description}
- Brief completo: ${campaign.brief}
- Objetivo: ${campaign.objective}
- Categoría: ${campaign.category}
- Plataformas: ${campaign.platforms.join(', ')}

Ejecuta el proceso completo de research y genera arquetipos accionables.
IMPORTANTE: Debes generar EXACTAMENTE 15 arquetipos distintos y diversos. Ni más ni menos, exactamente 15.
Responde SOLO con JSON válido siguiendo esta estructura:

${JSON_STRUCTURE}
`

    console.log('[Strategist Agent] Llamando a OpenAI API...')

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [
        { role: 'system', content: STRATEGIST_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const responseText = response.choices[0]?.message?.content || ''
    console.log(`[Strategist Agent] Respuesta recibida (${responseText.length} chars)`)

    // Extraer JSON de la respuesta
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No se encontró JSON válido en la respuesta')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validar estructura
    if (!parsed.research || !parsed.archetypes) {
      throw new Error('Estructura de respuesta inválida')
    }

    // Transformar a nuestros tipos
    const research: ResearchOutput = {
      panorama: parsed.research.panorama || [],
      pains: parsed.research.pains || [],
      gains: parsed.research.gains || [],
      jobs: parsed.research.jobs || [],
    }

    const archetypes: Archetype[] = (parsed.archetypes || []).map(
      (a: Record<string, unknown>, index: number) => ({
        id: `arch_${Date.now()}_${index}`,
        campaignId: campaign.id,
        name: a.name as string,
        summary: a.summary as string,
        mainMotivation: a.mainMotivation as string,
        painPoints: a.painPoints as string[],
        desires: a.desires as string[],
        consumptionMoment: a.consumptionMoment as string,
        emotionalTrigger: a.emotionalTrigger as string,
        barriers: a.barriers as string[],
        importanceRole: a.importanceRole as string,
        selected: false,
        createdAt: new Date().toISOString(),
      })
    )

    const opportunities: StrategicOpportunity[] = (parsed.opportunities || []).map(
      (o: Record<string, unknown>, index: number) => ({
        id: `opp_${Date.now()}_${index}`,
        category: o.category as 'product' | 'format' | 'activation',
        insight: o.insight as string,
        idea: o.idea as string,
        visualization: o.visualization as string,
        testMethod: o.testMethod as string,
        suggestedKPI: o.suggestedKPI as string,
      })
    )

    const positioningRoutes: PositioningRoute[] = (parsed.positioningRoutes || []).map(
      (p: Record<string, unknown>, index: number) => ({
        id: `pos_${Date.now()}_${index}`,
        promise: p.promise as string,
        rtb: p.rtb as string,
        tone: p.tone as string,
        whyBelieve: p.whyBelieve as string,
        competitiveAdvantage: p.competitiveAdvantage as string,
      })
    )

    const duration = Date.now() - startTime
    console.log(`[Strategist Agent] Completado en ${duration}ms - ${archetypes.length} arquetipos generados`)

    return {
      research,
      archetypes,
      opportunities,
      positioningRoutes,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Strategist Agent] Error: ${errorMessage}`)
    throw new Error(`Strategist Agent failed: ${errorMessage}`)
  }
}
