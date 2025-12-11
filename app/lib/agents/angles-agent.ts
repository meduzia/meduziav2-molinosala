/**
 * Agente 2: Creative Angles / Concepts Generator
 *
 * Con los puntos de dolor, beneficios y objeciones,
 * genera estructuras de anuncios UGC completas con:
 * - Ángulos creativos
 * - Hook types
 * - Tipos de creadores sugeridos
 * - Contextos de grabación
 */

import OpenAI from 'openai'
import { getOpenAIApiKey } from '../config/api-keys'
import type { CampaignInput, ResearchOutput, AnglesOutput, AgentExecutionResult } from './types'

// Crear cliente de OpenAI - se inicializa lazy para capturar env vars en runtime
function getOpenAIClient() {
  const apiKey = getOpenAIApiKey()
  console.log(`[Angles Agent] OpenAI API Key presente: ${apiKey ? 'Sí' : 'NO'}`)

  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY no está configurada correctamente')
  }

  return new OpenAI({ apiKey })
}

// Demo data for when API credits are unavailable
function generateDemoAngles(): AnglesOutput {
  return {
    angles: [
      {
        angle_id: 'angle_1',
        angle_name: 'Confesión matutina',
        big_idea: 'Revela el secreto matutino que cambió todo',
        hook_type: 'confesión',
        pain_point_target: 'pain_1',
        key_benefit_target: 'benefit_1',
        suggested_creator: 'mujer 28-35, estilo casual-elegante, relajada',
        context: 'baño con espejo, luz natural matutina'
      },
      {
        angle_id: 'angle_2',
        angle_name: 'Before & After rápido',
        big_idea: '15 segundos para transformación visible',
        hook_type: 'before/after',
        pain_point_target: 'pain_2',
        key_benefit_target: 'benefit_2',
        suggested_creator: 'mujer 25-40, natural, sin filtros',
        context: 'cara de frente, antes y después closeup'
      },
      {
        angle_id: 'angle_3',
        angle_name: 'Pregunta poderosa',
        big_idea: '¿Sabías que podía hacer esto?',
        hook_type: 'pregunta',
        pain_point_target: 'pain_3',
        key_benefit_target: 'benefit_3',
        suggested_creator: 'influencer micro, tono conversacional',
        context: 'primer plano, mirada a cámara'
      },
      {
        angle_id: 'angle_4',
        angle_name: 'Shock comparativo',
        big_idea: 'Esto cuesta 10x menos pero funciona igual',
        hook_type: 'comparación',
        pain_point_target: 'pain_5',
        key_benefit_target: 'benefit_10',
        suggested_creator: 'mujer 30-45, profesional, tono confianza',
        context: 'mostrando dos productos lado a lado'
      },
      {
        angle_id: 'angle_5',
        angle_name: 'Historia personal',
        big_idea: 'De frustrada a transformada en 21 días',
        hook_type: 'historia personal',
        pain_point_target: 'pain_4',
        key_benefit_target: 'benefit_4',
        suggested_creator: 'mamá 35-50, relatable, tono sincero',
        context: 'casa, ambiente natural, luz cálida'
      },
      {
        angle_id: 'angle_6',
        angle_name: 'Demostración rápida',
        big_idea: 'Mira cómo absorbe en segundos',
        hook_type: 'demostración',
        pain_point_target: 'pain_2',
        key_benefit_target: 'benefit_5',
        suggested_creator: 'mujer 25-35, clara, minimalista',
        context: 'primer plano de mano/piel, luz blanca'
      },
      {
        angle_id: 'angle_7',
        angle_name: 'Confesión de dermatólogo',
        big_idea: 'Ni mi dermatólogo me lo puede creer',
        hook_type: 'testimonio experto',
        pain_point_target: 'pain_6',
        key_benefit_target: 'benefit_2',
        suggested_creator: 'profesional médico o esteticien',
        context: 'consultorio estética, con productos'
      },
      {
        angle_id: 'angle_8',
        angle_name: 'Multitarea beauty',
        big_idea: 'Un producto que hace 5 cosas al mismo tiempo',
        hook_type: 'benefit stacking',
        pain_point_target: 'pain_1',
        key_benefit_target: 'benefit_3',
        suggested_creator: 'mujer joven 22-32, energética',
        context: 'montaje rápido de diferentes aplicaciones'
      },
      {
        angle_id: 'angle_9',
        angle_name: 'Contraste de edades',
        big_idea: 'A los 45 se ve mejor que a los 25',
        hook_type: 'shock de edad',
        pain_point_target: 'pain_9',
        key_benefit_target: 'benefit_1',
        suggested_creator: 'mujer 40-50, bien cuidada, espejo generacional',
        context: 'plano largo mostrando rostro completo'
      },
      {
        angle_id: 'angle_10',
        angle_name: 'Reacción genuina',
        big_idea: 'Sin guión, reacción real de usuario',
        hook_type: 'reacción sorpresa',
        pain_point_target: 'pain_3',
        key_benefit_target: 'benefit_4',
        suggested_creator: 'mujer común, no influencer, natural',
        context: 'baño o tocador, luz natural'
      },
      {
        angle_id: 'angle_11',
        angle_name: 'Duelo de texturas',
        big_idea: 'Toca y siente la diferencia inmediata',
        hook_type: 'demostración sensorial',
        pain_point_target: 'pain_7',
        key_benefit_target: 'benefit_5',
        suggested_creator: 'mujer 28-38, minimalista aesthetic',
        context: 'manos closeup con producto'
      },
      {
        angle_id: 'angle_12',
        angle_name: 'Secreto de celebridad',
        big_idea: 'Las famosas usan esto en secreto',
        hook_type: 'FOMO /secreto',
        pain_point_target: 'pain_5',
        key_benefit_target: 'benefit_1',
        suggested_creator: 'microinfluencer con estilo glam',
        context: 'espejo de baño estilo Hollywood'
      },
      {
        angle_id: 'angle_13',
        angle_name: 'Objeción absuelta',
        big_idea: '¿Pegajoso? Mira, absorbe en 3 segundos',
        hook_type: 'anticipar objeción',
        pain_point_target: 'pain_8',
        key_benefit_target: 'benefit_8',
        suggested_creator: 'mujer clara, didáctica',
        context: 'closeup demostrando absorción'
      },
      {
        angle_id: 'angle_14',
        angle_name: 'Ritual vespertino',
        big_idea: 'Mi rutina nocturna que me devuelve 10 años',
        hook_type: 'routine',
        pain_point_target: 'pain_1',
        key_benefit_target: 'benefit_2',
        suggested_creator: 'mujer 35-45, minimalista wellness',
        context: 'dormitorio noche, luz tenue cálida'
      },
      {
        angle_id: 'angle_15',
        angle_name: 'Trigger de miedo',
        big_idea: 'A los 30 empecé a notar esto... hasta que...',
        hook_type: 'problema-solución',
        pain_point_target: 'pain_4',
        key_benefit_target: 'benefit_6',
        suggested_creator: 'mujer 30-40, honesta, relatable',
        context: 'espejo, expresiones variadas'
      }
    ]
  }
}

const ANGLES_PROMPT_TEMPLATE = `Eres un creativo especializado en anuncios UGC para TikTok, Reels y Shorts.

Recibes:
- Producto/servicio y público objetivo desde el BRIEF.
- Research de pains, beneficios, objeciones y promesas.

DATOS:
- BRIEF: {{brief_text}}
- TIPO: {{tipo}}
- RESEARCH_JSON: {{research_json}}

TU TAREA:
Generar una lista de conceptos creativos/ángulos de anuncio UGC.

Para cada ángulo define:
- angle_id (ej: "angle_1", "angle_2")
- angle_name (2–4 palabras, descriptivo)
- big_idea (1 frase que capture la idea)
- hook_type (pregunta, shock, confesión, before/after, comparación, historia personal, etc.)
- pain_point_target (id del pain_point que aborda, ej: "pain_1")
- key_benefit_target (id del benefit que resalta, ej: "benefit_1")
- suggested_creator (descripción: "hombre 30-35, oficinista", "madre primeriza", "freelancer marketer", etc.)
- context (escenario real donde se graba: casa, oficina, gimnasio, terraza, auto, etc.)

DEVUELVE SOLO JSON VÁLIDO (sin markdown, sin explicaciones):

{
  "angles": [
    {
      "angle_id": "angle_1",
      "angle_name": "Confesión de oficina",
      "big_idea": "Revela cómo resolvió el problema mientras trabajaba",
      "hook_type": "confesión",
      "pain_point_target": "pain_2",
      "key_benefit_target": "benefit_1",
      "suggested_creator": "hombre 30-35, oficinista, tono relajado",
      "context": "escritorio de oficina con laptop, luz natural de ventana"
    },
    ...
  ]
}

Reglas:
- Ángulos pensados para performance, no para branding lindo.
- Pensar como media buyer: qué rompe el scroll y habla directo al dolor.
- Genera al menos 20 ángulos distintos.
- Todo en español.
- SOLO DEVUELVE JSON.`

export async function executeAnglesAgent(
  campaignInput: CampaignInput,
  researchOutput: ResearchOutput
): Promise<AgentExecutionResult> {
  const startTime = Date.now()

  try {
    const client = getOpenAIClient()
    const researchJson = JSON.stringify(researchOutput)

    const prompt = ANGLES_PROMPT_TEMPLATE
      .replace('{{brief_text}}', campaignInput.brief_text)
      .replace('{{tipo}}', campaignInput.type)
      .replace('{{research_json}}', researchJson)

    console.log('[Angles Agent] Llamando a OpenAI API...')

    const message = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 3500,
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

    const output: AnglesOutput = JSON.parse(jsonMatch[0])

    // Validate output structure
    if (!output.angles || !Array.isArray(output.angles)) {
      throw new Error('Invalid angles output structure')
    }

    return {
      success: true,
      agentName: 'Angles Agent',
      step: 'angles',
      output,
      executedAt: new Date(),
      duration: Date.now() - startTime,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error(`❌ [Angles Agent] Error: ${errorMessage}`)
    console.error(`❌ [Angles Agent] Stack:`, error)

    // Re-throw the error to propagate it - NO usar demo data
    throw new Error(`Angles Agent failed: ${errorMessage}`)
  }
}
