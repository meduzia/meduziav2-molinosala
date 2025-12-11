/**
 * Agente 4: Image Generator → Prompts para Generación de Imágenes
 *
 * De ángulos + research + brief,
 * genera PROMPTS COMPLETOS listos para Nano Banana u otros image generators
 * optimizados para publicidad UGC y contenido visual de redes sociales
 */

import OpenAI from 'openai'
import { getOpenAIApiKey } from '../config/api-keys'
import type {
  CampaignInput,
  ResearchOutput,
  CreativeAngle,
  ImagePrompt,
  ImageGeneratorOutput,
  AgentExecutionResult,
} from './types'

// Crear cliente de OpenAI - se inicializa lazy para capturar env vars en runtime
function getOpenAIClient() {
  const apiKey = getOpenAIApiKey()
  console.log(`[Image Generator Agent] OpenAI API Key presente: ${apiKey ? 'Sí' : 'NO'}`)

  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY no está configurada correctamente')
  }

  return new OpenAI({ apiKey })
}

// Demo data for when API credits are unavailable
function generateDemoImagePrompts(angles: CreativeAngle[]): ImageGeneratorOutput {
  return {
    prompts: angles.slice(0, 3).map((angle) => ({
      angle_id: angle.angle_id,
      angle_name: angle.angle_name,
      style: 'UGC Product Photography - Modern & Authentic',
      prompt_text: `Professional product photography for social media, bright and inviting.

Style:
Modern minimalist aesthetic with warm, natural lighting.
Clean composition with strong product focus.
Lifestyle context showing product in use with real people.
Vibrant colors with excellent contrast, optimized for mobile scrolling.
No studio-like perfection, raw and authentic feel.

Scene:
Hands of ${angle.suggested_creator} holding/using the product prominently in center frame.
Setting: ${angle.context} with natural light.
Product is crystal clear, well-lit, no shadows obscuring details.
Soft, blurred background with complementary colors.

Product Detail:
${angle.big_idea}: Product is the hero of the image.
All text, branding, and packaging fully visible and readable.
Product surface shows realistic reflections and texture.
No distortion or warping of the product shape.

Lighting:
Soft golden hour light or bright natural daylight.
No harsh shadows, even illumination across the product.
Slight rim lighting to separate product from background.
Warm color temperature (3500K-5500K).

Composition:
Rule of thirds: product in primary focus area.
Hands positioned naturally, not awkward or strained.
Real human skin and gesture (no artificial poses).
Background elements suggest lifestyle without distracting.

Technical:
Ultra sharp focus on product details.
High dynamic range, vibrant colors.
Professional Instagram/TikTok ready (square or vertical ratio).
Optimized for mobile screens: high contrast, readable text.
No watermarks or artificial overlays.

Mood:
Aspirational but relatable.
Inviting and trustworthy.
Modern and fresh.
Authentic and genuine.

Negative:
No studio backdrop, no white/gray void backgrounds.
No overly edited or filtered look.
No artificial smiles or forced expressions.
No blurry product, no text obscuration.
No cheesy or dated styling.
No CGI or artificial elements.
No excessive blur or depth of field that hides product.`,
    })),
  }
}

const IMAGE_GENERATOR_PROMPT_TEMPLATE = `Eres un experto en fotografía UGC para publicidad digital y un prompt engineer para generadores de imágenes (Nano Banana, Midjourney, etc.).

Objetivo:
Crear PROMPTS COMPLETOS de imágenes optimizadas para UGC ads y contenido social.
El prompt debe describir:
- El estilo visual y aesthetic
- La composición y encuadre
- La iluminación y atmósfera
- El producto/servicio y cómo se presenta
- Los parámetros técnicos
- El mood y contexto emocional

ENTRADA:
- BRIEF: {{brief_text}}
- TIPO: {{tipo}}
- RESEARCH: {{research_json}}
- ÁNGULOS A PROCESAR: {{angles_json}}
- IDIOMA: {{idioma}}
- NUM_IMAGES: {{num_images}}

PLANTILLA ESTÁNDAR A USAR:

---

Professional product photography for social media, bright and inviting.

Style:
Modern [estilo_aesthetic] aesthetic with [tipo_luz], [tipo_iluminacion_general].
[descripcion_composicion_general]
Vibrant colors with excellent contrast, optimized for mobile scrolling.
[nivel_autenticidad]: [descripcion_autenticidad].

Scene:
Hands of [persona_descripcion] holding/using the product prominently in center frame.
Setting: [contexto_ubicacion] with [tipo_luz_ambiente].
Product is crystal clear, well-lit, [detalles_producto_visibles].
[descripcion_background].

Product Detail:
[ángulo_big_idea]: Product is the hero of the image.
All text, branding, and packaging fully visible and readable.
[detalles_superficie_producto].
No distortion or warping of the product shape.

Lighting:
[tipo_luz_principal] light or [alternativa_luz].
[descripcion_sombras].
[descripcion_rim_lighting].
[temperatura_color] color temperature.

Composition:
Rule of thirds: product in primary focus area.
[posicion_manos_descripcion].
[descripcion_gesto].
[descripcion_background_complementario].

Technical:
Ultra sharp focus on product details.
High dynamic range, vibrant colors.
Professional [plataforma_social]-ready (square or vertical ratio).
Optimized for mobile screens: high contrast, readable text.
No watermarks or artificial overlays.

Mood:
[mood_1].
[mood_2].
[mood_3].
Authentic and genuine.

Negative:
No studio backdrop, no white/gray void backgrounds.
No overly edited or filtered look.
No artificial smiles or forced expressions.
No blurry product, no text obscuration.
No cheesy or dated styling.
No CGI or artificial elements.
No excessive blur or depth of field that hides product.

---

TU TAREA:
Para cada ángulo, generar UN prompt completo siguiendo la estructura anterior.
Adapta:
- Persona protagonista según suggested_creator del ÁNGULO.
- Contexto de ubicación según context.
- Dolor principal y beneficio central según RESEARCH.
- Estilo visual apropiado para el producto/servicio.
- El producto o servicio DEBE verse claramente y ser el protagonista.
- Usa tonos y contextos propios del público objetivo (español latinoamericano).

CANTIDAD:
- Generar prompts para {{num_images}} imágenes diferentes (adaptando poses, ángulos, contextos).
- Si num_images > num_ángulos: crear variaciones del mismo ángulo.
- Mantén variedad: diferentes poses, contextos, ángulos de producto.

IMPORTANTE:
- Escribe TODO el prompt en español.
- Enfoque en autenticidad y realismo, no en perfección artística.
- Optimizado para Nano Banana, Midjourney y similares.
- Cada prompt debe ser ÚNICO y distintivo.
- No agregues explicaciones fuera del prompt; solo devuelve los prompts finales.

DEVUELVE EXCLUSIVAMENTE JSON (sin markdown):

{
  "prompts": [
    {
      "angle_id": "angle_1",
      "angle_name": "Nombre del ángulo",
      "prompt_text": "[PROMPT COMPLETO AQUÍ]"
    },
    ...
  ]
}

SOLO JSON, nada más.`

export async function executeImageGeneratorAgent(
  campaignInput: CampaignInput,
  researchOutput: ResearchOutput,
  angles: CreativeAngle[]
): Promise<AgentExecutionResult> {
  const startTime = Date.now()

  try {
    const client = getOpenAIClient()
    const researchJson = JSON.stringify(researchOutput, null, 2)
    const anglesJson = JSON.stringify(angles, null, 2)

    const prompt = IMAGE_GENERATOR_PROMPT_TEMPLATE
      .replace('{{brief_text}}', campaignInput.brief_text)
      .replace('{{tipo}}', campaignInput.type)
      .replace('{{research_json}}', researchJson)
      .replace('{{angles_json}}', anglesJson)
      .replace('{{idioma}}', campaignInput.idioma || 'español')
      .replace('{{num_images}}', String(campaignInput.num_images || 5))

    console.log('[Image Generator Agent] Llamando a OpenAI API...')

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

    const output: ImageGeneratorOutput = JSON.parse(jsonMatch[0])

    // Validate output structure
    if (!output.prompts || !Array.isArray(output.prompts)) {
      throw new Error('Invalid image generator output structure')
    }

    return {
      success: true,
      agentName: 'Image Generator Agent',
      step: 'image_generation',
      output,
      executedAt: new Date(),
      duration: Date.now() - startTime,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error(`❌ [Image Generator Agent] Error: ${errorMessage}`)
    console.error(`❌ [Image Generator Agent] Stack:`, error)

    // Re-throw the error to propagate it - NO usar demo data
    throw new Error(`Image Generator Agent failed: ${errorMessage}`)
  }
}
