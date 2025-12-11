/**
 * Agente 1: Research / Pain Points Analyzer
 *
 * Analiza el brief del producto/servicio y extrae:
 * - Puntos de dolor específicos
 * - Beneficios deseados
 * - Objeciones típicas
 * - Promesas fuertes
 */

import OpenAI from 'openai'
import { getOpenAIApiKey } from '../config/api-keys'
import type { CampaignInput, ResearchOutput, AgentExecutionResult } from './types'

// Crear cliente de OpenAI - se inicializa lazy para capturar env vars en runtime
function getOpenAIClient() {
  const apiKey = getOpenAIApiKey()
  console.log(`[Research Agent] OpenAI API Key presente: ${apiKey ? 'Sí (' + apiKey.substring(0, 10) + '...)' : 'NO'}`)

  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY no está configurada correctamente')
  }

  return new OpenAI({ apiKey })
}

// Demo data for when API credits are unavailable
function generateDemoResearch(input: CampaignInput): ResearchOutput {
  const isBeauty = input.brief_text.toLowerCase().includes('crema') || input.brief_text.toLowerCase().includes('belleza')
  const isHealth = input.brief_text.toLowerCase().includes('salud') || input.brief_text.toLowerCase().includes('vitamina')

  if (isBeauty) {
    return {
      pain_points: [
        { id: 'pain_1', description: 'Arrugas y líneas de expresión notorias' },
        { id: 'pain_2', description: 'Piel seca y deshidratada' },
        { id: 'pain_3', description: 'Falta de luminosidad y brillo natural' },
        { id: 'pain_4', description: 'Manchas y envejecimiento prematuro' },
        { id: 'pain_5', description: 'Productos caros que no funcionan' },
        { id: 'pain_6', description: 'Sensibilidad e irritación' },
        { id: 'pain_7', description: 'Pérdida de elasticidad y firmeza' },
        { id: 'pain_8', description: 'Acné y problemas de textura' },
        { id: 'pain_9', description: 'Flacidez por edad' },
        { id: 'pain_10', description: 'Falta de hidratación profunda' }
      ],
      benefits: [
        { id: 'benefit_1', description: 'Piel visiblemente más firme y elástica' },
        { id: 'benefit_2', description: 'Hidratación profunda y duradera' },
        { id: 'benefit_3', description: 'Reducción visible de arrugas en 2 semanas' },
        { id: 'benefit_4', description: 'Luminosidad radiante y natural' },
        { id: 'benefit_5', description: 'Piel suave al tacto' },
        { id: 'benefit_6', description: 'Menor sensibilidad' },
        { id: 'benefit_7', description: 'Textura uniforme' },
        { id: 'benefit_8', description: 'Absorción rápida sin residuo' },
        { id: 'benefit_9', description: 'Apto para pieles sensibles' },
        { id: 'benefit_10', description: 'Precio accesible para resultados premium' }
      ],
      objections: [
        { id: 'obj_1', description: '¿Cuánto tiempo tarda en ver resultados?' },
        { id: 'obj_2', description: '¿Es seguro para mi tipo de piel?' },
        { id: 'obj_3', description: '¿No es muy caro?' },
        { id: 'obj_4', description: '¿Tengo que usarlo todos los días?' },
        { id: 'obj_5', description: '¿Dejará mi piel pegajosa?' }
      ],
      promises: [
        { id: 'promise_1', description: 'Piel 10 años más joven en 30 días' },
        { id: 'promise_2', description: 'Hidratación de 48 horas' },
        { id: 'promise_3', description: 'Adiós a las arrugas visibles' },
        { id: 'promise_4', description: 'Brillo natural garantizado' },
        { id: 'promise_5', description: 'Seguro para todo tipo de piel' }
      ]
    }
  }

  return {
    pain_points: [
      { id: 'pain_1', description: 'Falta de energía durante el día' },
      { id: 'pain_2', description: 'Debilidad del sistema inmunológico' },
      { id: 'pain_3', description: 'Fatiga crónica' },
      { id: 'pain_4', description: 'Deficiencias nutricionales' },
      { id: 'pain_5', description: 'Bajo rendimiento físico' },
      { id: 'pain_6', description: 'Recuperación lenta después del ejercicio' },
      { id: 'pain_7', description: 'Concentración baja' },
      { id: 'pain_8', description: 'Sueño de mala calidad' },
      { id: 'pain_9', description: 'Falta de vitalidad' },
      { id: 'pain_10', description: 'Envejecimiento acelerado' }
    ],
    benefits: [
      { id: 'benefit_1', description: 'Energía sostenida todo el día' },
      { id: 'benefit_2', description: 'Sistema inmunológico fortalecido' },
      { id: 'benefit_3', description: 'Recuperación más rápida' },
      { id: 'benefit_4', description: 'Mejor rendimiento físico' },
      { id: 'benefit_5', description: 'Concentración mejorada' },
      { id: 'benefit_6', description: 'Sueño reparador' },
      { id: 'benefit_7', description: 'Vitalidad rejuvenecida' },
      { id: 'benefit_8', description: 'Nutrición completa' },
      { id: 'benefit_9', description: 'Acción antienvejecimiento' },
      { id: 'benefit_10', description: 'Bienestar integral' }
    ],
    objections: [
      { id: 'obj_1', description: '¿Todos los suplementos funcionan igual?' },
      { id: 'obj_2', description: '¿Tiene efectos secundarios?' },
      { id: 'obj_3', description: '¿Es natural?' },
      { id: 'obj_4', description: '¿Cuánto tiempo tarda en hacer efecto?' },
      { id: 'obj_5', description: '¿Puedo tomarlo con otros medicamentos?' }
    ],
    promises: [
      { id: 'promise_1', description: 'Más energía garantizada o devolvemos tu dinero' },
      { id: 'promise_2', description: 'Resultados visibles en 14 días' },
      { id: 'promise_3', description: '100% natural sin químicos' },
      { id: 'promise_4', description: 'Compatible con cualquier medicamento' },
      { id: 'promise_5', description: 'Transformación de tu vitalidad' }
    ]
  }
}

const RESEARCH_PROMPT_TEMPLATE = `Actúa como un estratega de growth y paid media para e-commerce y servicios especializado en UGC.

Te voy a dar un BRIEF en español con información sobre un producto o servicio, más datos del público objetivo.

TU TAREA:
1. Inferir y listar PUNTOS DE DOLOR específicos.
2. Listar BENEFICIOS deseados y resultados concretos.
3. Listar OBJECIONES típicas que tendría el cliente.
4. Proponer PROMESAS fuertes para anuncios UGC.

ENTRADA:
- BRIEF: {{brief_text}}
- TIPO: {{tipo}}
- INFO EXTRA: {{info_extra}}
- PÚBLICO OBJETIVO: {{target_audience}}

DEVUELVE EXCLUSIVAMENTE JSON VÁLIDO con esta estructura (sin markdown, sin explicaciones):

{
  "pain_points": [
    {"id": "pain_1", "description": "..."},
    {"id": "pain_2", "description": "..."},
    ...
  ],
  "benefits": [
    {"id": "benefit_1", "description": "..."},
    {"id": "benefit_2", "description": "..."},
    ...
  ],
  "objections": [
    {"id": "obj_1", "description": "..."},
    {"id": "obj_2", "description": "..."},
    ...
  ],
  "promises": [
    {"id": "promise_1", "description": "..."},
    {"id": "promise_2", "description": "..."},
    ...
  ]
}

Reglas:
- Sé muy específico, evita vaguedades.
- Usa lenguaje coloquial del público objetivo.
- Todo en español.
- Genera al menos 10 puntos de dolor, 10 beneficios, 5 objeciones y 5 promesas.
- SOLO DEVUELVE JSON, nada más.`

export async function executeResearchAgent(
  input: CampaignInput
): Promise<AgentExecutionResult> {
  const startTime = Date.now()

  try {
    const client = getOpenAIClient()

    const prompt = RESEARCH_PROMPT_TEMPLATE
      .replace('{{brief_text}}', input.brief_text)
      .replace('{{tipo}}', input.type)
      .replace('{{info_extra}}', input.info_extra || 'N/A')
      .replace('{{target_audience}}', input.target_audience || 'Público general')

    console.log('[Research Agent] Llamando a OpenAI API...')

    const message = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract the text response
    const responseText = message.choices[0]?.message?.content || ''

    // Parse JSON response
    let output: ResearchOutput

    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    output = JSON.parse(jsonMatch[0])

    // Validate output structure
    if (
      !output.pain_points ||
      !output.benefits ||
      !output.objections ||
      !output.promises
    ) {
      throw new Error('Invalid research output structure')
    }

    return {
      success: true,
      agentName: 'Research Agent',
      step: 'research',
      output,
      executedAt: new Date(),
      duration: Date.now() - startTime,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error(`❌ [Research Agent] Error: ${errorMessage}`)
    console.error(`❌ [Research Agent] Stack:`, error)

    // Re-throw the error to propagate it - NO usar demo data
    throw new Error(`Research Agent failed: ${errorMessage}`)
  }
}
