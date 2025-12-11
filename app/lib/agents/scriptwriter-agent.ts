/**
 * Agente 3: Script Writer → Prompt de Video UGC
 *
 * De un ángulo + research + brief,
 * genera PROMPTS COMPLETOS listos para enviar a Sora/video generators
 * con estructura ultra-realista y parámetros técnicos
 */

import OpenAI from 'openai'
import { getOpenAIApiKey } from '../config/api-keys'
import type {
  CampaignInput,
  ResearchOutput,
  CreativeAngle,
  VideoPrompt,
  ScriptwriterOutput,
  AgentExecutionResult,
} from './types'

// Crear cliente de OpenAI - se inicializa lazy para capturar env vars en runtime
function getOpenAIClient() {
  const apiKey = getOpenAIApiKey()
  console.log(`[Scriptwriter Agent] OpenAI API Key presente: ${apiKey ? 'Sí' : 'NO'}`)

  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY no está configurada correctamente')
  }

  return new OpenAI({ apiKey })
}

// Demo data for when API credits are unavailable
function generateDemoScripts(angles: CreativeAngle[]): ScriptwriterOutput {
  return {
    prompts: angles.slice(0, 3).map((angle) => ({
      angle_id: angle.angle_id,
      angle_name: angle.angle_name,
      prompt_text: `Ultra-realistic vertical selfie video, filmed handheld with iPhone 15 Pro front camera, 9:16 format, HDR morning light.
Real handheld micro tremors, natural focus breathing, auto exposure adapting to light changes.
Cinematic but real look — human motion, photorealistic lighting, no artificial perfection.
Visible natural skin texture, realistic shadows, real reflections on face and product.

Scene:
${angle.suggested_creator}, wearing casual chic morning outfit.
Filmado en ${angle.context}, luz natural suave que entra por una ventana.
Sostiene el producto visible y frontal, sin deformaciones, tono relajado.

Lighting:
Soft golden light (warm 3200K), natural morning glow.
Reflejos reales en piel, HDR tone muy suave.
Sin luces de estudio, solo luz natural real.

Action:
Está grabando tipo selfie, relajado, como si hablara con una amiga íntima.
Hace expresiones naturales, muestra el producto de forma casual.
Gestos micro: levanta cejas, sonríe sincera, asiente.

Dialog:
> "Mira, hace años buscaba algo que realmente funcionara"
> "Este producto cambió completamente mi rutina"
> "En dos semanas ya veía diferencia, sin costo de dermatólogo"
> "Ahora es mi aliado número uno"

Hace una pausa natural, mira a cámara con expresión genuina:
> "Si buscas resultados reales sin gastar una fortuna, tienes que probarlo"

Sonríe leve y genuina, cierra el video con gesto tipo "créeme".

Camera:
iPhone 15 Pro front lens (26mm equivalent).
Medium close-up selfie, rule of thirds.
Depth of field natural: cara y producto en foco, fondo suave desenfocado.

Framing:
Cara ocupa 60% del frame, producto visible en mano inferior derecha.
Composición natural, no perfecta.

Timestamp:
Total video: 15-20 segundos.
Hook: primeros 2 segundos.

Audio:
Voz natural, femenina, tono conversacional, susurra ligeramente.
Música de fondo: ambient suave, bajo volumen (ocupar máximo 20% del audio).
SFX: ninguno, la naturalidad es clave.

Negative Prompt:
Sin filtros Instagram, sin efectos, sin emojis, sin texto onscreen.
Sin background blur artificial, sin studio lights.
Sin promoción agresiva, sin gritar.
No TikTok transitions, no jump cuts.
Sin producto distorsionado.`
    }))
  }
}

const SCRIPTWRITER_PROMPT_TEMPLATE = `Eres un guionista experto en UGC ads y un prompt engineer para modelos de video generativo.

Objetivo:
Crear PROMPTS COMPLETOS de video UGC ultra realista, listos para usar en Sora o similar.
El prompt debe describir:
- El influencer
- El ambiente
- Las acciones y gestos
- El diálogo exacto
- Los parámetros técnicos (camera, lighting, audio)
- NEGATIVE PROMPT

ENTRADA:
- BRIEF: {{brief_text}}
- TIPO: {{tipo}}
- RESEARCH: {{research_json}}
- ÁNGULOS A PROCESAR: {{angles_json}}
- IDIOMA: {{idioma}}
- DISPOSITIVO_BASE: iPhone 15 Pro

PLANTILLA ESTÁNDAR A USAR:

---

Ultra-realistic vertical selfie video, filmed handheld with iPhone 15 Pro front camera, 9:16 format, HDR [momento_del_dia].
Real handheld micro tremors, natural focus breathing, auto exposure adapting to light.
Cinematic but real look — human motion, photorealistic lighting, no artificial perfection.
Visible natural skin texture, realistic shadows, real reflections on [superficie_objeto].

Scene:
[descripcion_persona]
Ropa [ropa_persona], luz natural [origen_luz].
Filmado en [lugar_escena], ambiente real ([props] en fondo ligeramente desenfocado).
Sostiene [como_sostiene_objeto] **[nombre_pack_visible]** perfectamente visible y frontal, sin deformaciones.
[si_es_servicio_o_app]

Lighting:
Soft [tipo_luz] ([temperatura_color]), cálido natural.
Reflejos reales en [donde_refleja], HDR tono suave.
Sin luces de estudio, sin sombras duras.

Action:
Está grabando tipo selfie, relajado, tono natural, como si hablara con un amigo.
Hace [gestos_microacciones], muestra [objeto_o_app] todo el tiempo.

Dialog:
> [linea_1_hook]
> [linea_2_beneficio_principal]
> [linea_3_prueba_social_o_razon]
> [linea_4_refuerzo_beneficio]

Hace una pequeña pausa, [micro_gesto_final], mira a cámara con tono sincero:
> "[remate_emocional_o_racional]"

Sonríe leve / gesto genuino, cierra el video con [cierre_visual] y gesto tipo *"[cta_gesto]"*.

Camera:
iPhone 15 Pro front lens (26mm equivalent).
Medium close-up selfie, rule of thirds composition.
Depth of field natural: cara y [objeto_o_elemento_clave] en foco, fondo suave.
Slight autofocus movement entre rostro y [objeto_o_elemento_clave].
Movimiento real de mano, microtemblores controlados.

Composition:
[objeto_o_elemento_clave] visible la mayor parte del tiempo, frente a cámara, nítido.
Sin deformaciones, sin artefactos, sin warping.
Reflejos HDR naturales sobre [superficie_objeto].
Mano natural, grip realista (sin dedos deformes).
Cámara a la altura de los ojos, encuadre tipo selfie story.

Audio:
Grabado con micrófono del iPhone 15 Pro, compresión natural.
Voz [tipo_voz_y_acento], relajada, tono amistoso y creíble.
Ambiente real: [ruidos_ambiente_suaves].
Sin música ni efectos.

---

🧩 TECHNICAL PARAMETERS

\`\`\`yaml
object_tracking: "[objeto_tracking]"
object_visibility: 1.0
object_stability: 1.2
object_rigidity: 1.45
object_focus_priority: "[prioridad_focus]"
object_surface_detail: "high_fidelity_texture"
reflection_preservation: 1.0
text_legibility_boost: 1.4
texture_preservation: 1.0
pack_orientation: "front_facing"
hand_shape_constraint: "natural_human_grip_no_text_obstruction"
reference_image: "[nombre_reference_image]"
reference_weight: 0.97
focus_priority: ["[objeto]", "face"]
autofocus_shift: 0.15
exposure_fluctuation: 0.1
motion_model: "handheld_iPhone_selfie"
depth_of_field: "natural_face_object_sharp_background_soft"
render_style: "realistic_iPhone_story"
hand_motion_limit: 0.25
output: "4K HDR 30fps"
\`\`\`

NEGATIVE PROMPT
no CGI, no studio lighting, no tripod, no advertising pose,
no fake smiles, no distorted fingers, no blurry or warped [objeto],
no logo obstruction, no voiceover AI,
no animation, no overexposure, no commercial-style setup,
no perfect lighting, no glossy fake reflection.

---

TU TAREA:
Para cada ángulo en la lista, generar UN prompt completo siguiendo la estructura anterior.
Adapta:
- Persona protagonista según suggested_creator del ANGLE.
- Contexto de grabación según context.
- Dolor principal y beneficio central según RESEARCH.
- Usa tono y expresiones propias del público objetivo (español latinoamericano).
- El producto o servicio DEBE verse o entenderse claramente.
- El pack, logo o app no pueden deformarse ni taparse.

DIÁLOGO:
- Formato conversación natural, como si hablara con un amigo.
- Primer renglón: HOOK muy fuerte, directo al pain.
- 2–3 líneas siguientes: beneficio + explicación simple.
- 1 línea de prueba social o "razón para creer".
- Cierre con CTA natural ("probalo", "metete ahora", etc.).

IMPORTANTE:
- Escribe TODO el prompt en español.
- Mantén estilo ultra realista, nada de "spot de TV".
- No agregues explicaciones fuera del prompt; solo devuelve el prompt final.
- Cada prompt debe ser ÚNICO y distintivo.

DEVUELVE EXCLUSIVAMENTE JSON (sin markdown):

{
  "prompts": [
    {
      "angle_id": "angle_1",
      "prompt_text": "[PROMPT COMPLETO AQUÍ]"
    },
    ...
  ]
}

SOLO JSON, nada más.`

export async function executeScriptwriterAgent(
  campaignInput: CampaignInput,
  researchOutput: ResearchOutput,
  angles: CreativeAngle[]
): Promise<AgentExecutionResult> {
  const startTime = Date.now()

  try {
    const client = getOpenAIClient()
    const researchJson = JSON.stringify(researchOutput, null, 2)
    const anglesJson = JSON.stringify(angles, null, 2)

    const prompt = SCRIPTWRITER_PROMPT_TEMPLATE
      .replace('{{brief_text}}', campaignInput.brief_text)
      .replace('{{tipo}}', campaignInput.type)
      .replace('{{research_json}}', researchJson)
      .replace('{{angles_json}}', anglesJson)
      .replace('{{idioma}}', campaignInput.idioma || 'español')

    console.log('[Scriptwriter Agent] Llamando a OpenAI API...')

    const message = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 6000,
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

    const output: ScriptwriterOutput = JSON.parse(jsonMatch[0])

    // Validate output structure
    if (!output.prompts || !Array.isArray(output.prompts)) {
      throw new Error('Invalid scriptwriter output structure')
    }

    return {
      success: true,
      agentName: 'Scriptwriter Agent',
      step: 'scriptwriting',
      output,
      executedAt: new Date(),
      duration: Date.now() - startTime,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    console.error(`❌ [Scriptwriter Agent] Error: ${errorMessage}`)
    console.error(`❌ [Scriptwriter Agent] Stack:`, error)

    // Re-throw the error to propagate it - NO usar demo data
    throw new Error(`Scriptwriter Agent failed: ${errorMessage}`)
  }
}
