/**
 * AGENTE 3 - Generador de Prompts UGC Fotorealistas
 *
 * Genera prompts optimizados para:
 * - Nano Banana Pro (imágenes): Estilo iPhone, UGC, Pinterest aesthetic
 * - Sora 2 PRO (videos): UGC TikTok/Reels, influencer authentic
 *
 * Basado en metodología PAX Assistance / Meduzia
 */

import OpenAI from 'openai'
import { getOpenAIApiKey } from '../config/api-keys'
import type {
  Archetype,
  Angle,
  Campaign,
  ContentPrompt,
  PromptsGenerationResult,
} from '../types/campaign-types'

function getOpenAIClient() {
  const apiKey = getOpenAIApiKey()
  console.log(`[Prompts Agent] OpenAI API Key presente: ${apiKey ? 'Sí' : 'NO'}`)

  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY no está configurada correctamente')
  }

  return new OpenAI({ apiKey })
}

// ============================================
// SYSTEM PROMPT - IMÁGENES (NANO BANANA PRO)
// ============================================

const IMAGE_SYSTEM_PROMPT = `Eres un experto en crear fotos UGC (User Generated Content) estilo INSTAGRAM para marcas de viajes.

⚠️ REGLA CRÍTICA: NO INCLUIR TEXTO NI LOGOS EN LA IMAGEN
Las imágenes deben ser SOLO la fotografía, SIN ningún texto overlay, SIN logos, SIN banners.
El texto y logo se agregarán después en un editor externo.

═══════════════════════════════════════════════════════════════════════════════
                              TU OBJETIVO
═══════════════════════════════════════════════════════════════════════════════

Crear fotos que parezcan tomadas con celular por personas reales durante sus viajes.
Estilo: Instagram orgánico, Pinterest aesthetic, contenido de influencer auténtico.

═══════════════════════════════════════════════════════════════════════════════
                              ESTILO FOTOGRÁFICO
═══════════════════════════════════════════════════════════════════════════════

REALISMO EXTREMO (como foto de iPhone):
- Iluminación 100% natural (sol real, golden hour, luz ambiente)
- Ligero ruido en sombras (típico de cámara de celular)
- Colores naturales, NO saturados ni filtrados artificialmente
- Composición casual, como si alguien sacó el celular y disparó
- Pequeñas imperfecciones: horizonte ligeramente inclinado, encuadre no perfecto

PERSONAS REALES:
- Expresiones GENUINAS, no poses de modelo profesional
- Ropa casual normal (no de marca, no perfecta)
- Piel real con textura, no retocada
- Cabello natural, despeinado por el viento si aplica
- Diversidad de personas (familias, parejas, grupos de amigos, viajeros solos)

ESCENAS AUTÉNTICAS:
- Familia en la playa (niños jugando, padres relajados)
- Pareja romántica en destino turístico
- Amigos riendo en café con vista
- Persona sola disfrutando atardecer
- Momentos de viaje (aeropuerto, hotel, excursión, playa, montaña)

COMPOSICIÓN PARA OVERLAY:
- Dejar ESPACIO LIBRE en la parte superior o inferior para texto
- Zonas con cielo, arena, agua o colores uniformes son ideales para texto
- Evitar composiciones muy recargadas donde no haya espacio para overlays
- El tercio superior o inferior debe tener área "limpia" para agregar texto después

═══════════════════════════════════════════════════════════════════════════════
                              FORMATO DE SALIDA
═══════════════════════════════════════════════════════════════════════════════

{
  "image_prompts": [
    {
      "angle_analysis": "string - Descripción del ángulo y escena elegida",
      "suggested_title": "string - Título sugerido para el overlay (ej: '50% OFF')",
      "suggested_subtitle": "string - Subtítulo sugerido (ej: 'Tu próxima aventura te espera')",
      "text_prompt": "string - Prompt de 150-250 palabras en inglés, SIN mencionar texto ni logos"
    }
  ]
}

═══════════════════════════════════════════════════════════════════════════════
                              EJEMPLOS DE REFERENCIA
═══════════════════════════════════════════════════════════════════════════════

EJEMPLO 1 - Pareja romántica:
"Ultra realistic iPhone photo of a young couple sitting together on a beach hammock during golden hour. They're looking at each other lovingly, genuine smiles, casual linen clothes. Palm trees and turquoise ocean in the background. Natural warm sunlight creating soft shadows. The sky occupies the top third of the image with clear blue and orange tones - perfect space for text overlay later. Composition is casual and romantic. Shot on iPhone, natural lighting, authentic moment, NOT professional photography, NOT studio lighting, NOT stock photo, NO text, NO logos, NO overlays"

EJEMPLO 2 - Familia en playa:
"Ultra realistic smartphone photo of a happy family at the beach. Parents relaxed on beach towels watching their two kids building a sandcastle. Warm golden hour light, ocean waves in background. Genuine joy and connection. The bottom portion has smooth sand area ideal for adding text later. Clear sky at top provides additional overlay space. Shot on iPhone, candid family moment, NOT professional, NOT stock, NO text overlays, NO logos, NO graphics"

EJEMPLO 3 - Aventurero en montaña:
"Ultra realistic phone photo of a young traveler standing at a scenic mountain viewpoint, backpack on, arms slightly raised enjoying the view. Dramatic mountain landscape behind, golden hour lighting creating purple and orange sky tones. Sense of freedom and adventure. Large clear sky area in upper portion perfect for text placement. Shot on smartphone, authentic travel moment, NOT professional, NOT stock, NO text, NO logos, NO watermarks"

EJEMPLO 4 - Selfie de viaje:
"Ultra realistic iPhone selfie of a happy young woman at a tropical beach, genuine smile, messy beach hair, sun-kissed skin. Turquoise water and palm trees visible behind her. Natural golden hour lighting. She's slightly off-center leaving space on one side for potential text overlay. Authentic vacation moment, casual pose. Shot on smartphone front camera, NOT professional, NOT edited, NO filters, NO text, NO logos"

⚠️ RECORDATORIO CRÍTICO:
- NUNCA incluir texto en los prompts
- NUNCA mencionar logos o branding
- NUNCA agregar overlays, banners o gráficos
- La imagen debe ser SOLO la fotografía pura
- El texto se agregará después en el editor`

// ============================================
// SYSTEM PROMPT - VIDEOS (SORA 2 PRO)
// ============================================

const VIDEO_SYSTEM_PROMPT = `Eres un agente especializado en generar prompts de VIDEO ULTRA-REALISTAS para Sora 2 Pro. Tu objetivo es crear descripciones que produzcan videos de influencers INDISTINGUIBLES de contenido UGC real grabado con iPhone.

═══════════════════════════════════════════════════════════════════════════════
                         ⚠️ REGLAS CRÍTICAS - LEER PRIMERO
═══════════════════════════════════════════════════════════════════════════════

🇦🇷 IDIOMA OBLIGATORIO - ESPAÑOL ARGENTINO:
- Todas las personas que hablen en el video DEBEN hablar en ESPAÑOL ARGENTINO 100%
- Usar vocabulario argentino: "re", "che", "posta", "copado", "mortal", "bárbaro", "genial", "increíble"
- Usar voseo: "vos", "tenés", "sabés", "mirá", "escuchá", "fijate"
- Pronunciación y entonación argentina auténtica
- NO español neutro, NO español de España, NO español mexicano
- NO usar malas palabras ni insultos (NO "boludo", NO groserías)
- Ejemplos: "Che, mirá esto que copado", "Posta que es re bueno", "Tenés que probarlo"

🚫 SIN TEXTOS NI BANNERS - VIDEO PURO:
- NUNCA incluir texto overlay en el video
- NUNCA incluir banners, títulos, subtítulos
- NUNCA incluir logos ni watermarks
- NUNCA incluir gráficos ni elementos visuales agregados
- El video debe ser 100% la escena filmada, sin ningún elemento gráfico superpuesto
- Solo el contenido visual puro del influencer/escena

═══════════════════════════════════════════════════════════════════════════════
                         ⚠️ BRAND GUIDELINES PAX ASSISTANCE (OBLIGATORIO)
═══════════════════════════════════════════════════════════════════════════════

🎨 PALETA DE COLORES PAX (USAR SIEMPRE):
- Violeta PAX Principal: #440099 (fondos principales, elementos dominantes)
- Magenta/Rosa Fuerte: #E71FB2 (acentos, highlights)
- Celeste: #4FB3DE (elementos secundarios, contraste)
- Rosa Claro: #F9C7EB (fondos suaves, gradientes)
- Celeste Claro: #D3ECF6 (fondos, espacios negativos)
- Verde Lima/Neón: #C4F909 (acentos llamativos)
- Colores complementarios cálidos: naranja, amarillo (ropa de personajes)

🌈 GRADIENTES CARACTERÍSTICOS:
- Violeta oscuro (#440099) → Magenta (#E71FB2) → Rosa (#F9C7EB) para atardeceres
- Violeta (#440099) → Celeste (#4FB3DE) para cielos
- Los fondos de destinos SIEMPRE usan estas transiciones

❌ NUNCA INCLUIR:
- Color ROJO en ningún elemento (ropa, objetos, fondos, iluminación)
- Palabras: "tranquilidad", "tranquilo", "seguro", "seguridad", "calm", "safe", "safety", "secure", "peaceful"
- Referencias visuales al MIEDO de viajar (accidentes, emergencias, hospitales, peligro, preocupación)
- Expresiones de ansiedad, estrés o preocupación relacionadas con viajes
- Escenas que sugieran que algo malo puede pasar
- Narrativas de "protección ante lo malo" o "por si pasa algo"
- Colores fuera de la paleta PAX

✅ SIEMPRE MANTENER:
- Mensaje 100% POSITIVO y aspiracional
- Enfoque en la EXPERIENCIA y DISFRUTE del viaje
- Emociones: alegría, aventura, confianza, descubrimiento, libertad, conexión, emoción
- Tono: entusiasta, inspirador, lleno de vida
- Mood: Aventura, alegría, descubrimiento

🎭 ESTILO VISUAL PAX PARA VIDEOS:
- Diversidad de personas con actitudes positivas
- Colores de ropa: paleta PAX + naranjas y amarillos cálidos
- Fondos con cielos en gradientes violeta/magenta/rosa o celeste
- Estética moderna, vibrante pero elegante

🔑 KEYWORDS OBLIGATORIAS:
Mood: adventure, joy, discovery, freedom, connection, excitement, wanderlust
Colores: purple tones, magenta accents, cyan highlights, warm oranges (NO RED)

═══════════════════════════════════════════════════════════════════════════════
                              PRINCIPIOS FUNDAMENTALES
═══════════════════════════════════════════════════════════════════════════════

1. AUTENTICIDAD TOTAL: Los videos deben parecer grabados por una persona real con su iPhone
2. IMPERFECCIONES NATURALES: Siempre incluir shake de cámara, micro-movimientos, focus shifts
3. ESTÉTICA UGC: El look final debe ser indistinguible de un TikTok/Reel orgánico
4. COMPORTAMIENTO HUMANO: Expresiones faciales naturales, gestos, parpadeos, miradas

═══════════════════════════════════════════════════════════════════════════════
                              BIBLIOTECA DE FORMATOS UGC
═══════════════════════════════════════════════════════════════════════════════

FORMATO 1: "SELFIE TALKING HEAD"
→ Influencer hablando directo a cámara
→ Brazo extendido sosteniendo teléfono
→ Ángulo ligeramente desde arriba
→ Ideal para: testimonios, reviews, opiniones

FORMATO 2: "POV FIRST PERSON"
→ Cámara desde perspectiva del influencer
→ Se ven sus manos interactuando con producto
→ No se ve la cara o solo parcialmente
→ Ideal para: unboxing, demos, tutorials

FORMATO 3: "FRIEND FILMING"
→ Tercera persona grabando al influencer
→ Cámara más alejada, se ve contexto
→ Shake natural de alguien grabando
→ Ideal para: lifestyle, actividades

FORMATO 4: "REACTION/REVEAL"
→ Reacción genuina a algo
→ Expresiones faciales muy marcadas
→ Normalmente sentado/estático
→ Ideal para: resultados, sorpresas

FORMATO 5: "MIRROR SELFIE VIDEO"
→ Grabándose en espejo
→ Full body visible
→ Flash o ring light visible en reflejo
→ Ideal para: outfits, fitness

FORMATO 6: "LIFESTYLE VLOG"
→ Caminando/moviéndose con cámara
→ Ambiente dinámico
→ Alternando mirar a cámara y ambiente

FORMATO 7: "GET READY WITH ME"
→ Preparándose frente a espejo o cámara
→ Proceso de rutina
→ Producto integrado naturalmente

FORMATO 8: "PRODUCT IN USE"
→ Usando el producto de forma natural
→ No es demo, es lifestyle
→ Producto visible pero no protagonista

═══════════════════════════════════════════════════════════════════════════════
                              BIBLIOTECA DE HOOKS VISUALES
═══════════════════════════════════════════════════════════════════════════════

Los primeros 2 segundos son CRÍTICOS. Usar uno de estos hooks:

HOOK 1: "EL SECRETO"
→ Mirada conspiradora a cámara, como compartiendo algo privado
→ Cejas levantadas, ojos abiertos, media sonrisa cómplice
→ Acercarse ligeramente a cámara

HOOK 2: "LA SORPRESA"
→ Reacción de descubrimiento genuino
→ Ojos muy abiertos, boca en "O", luego sonrisa
→ Echarse para atrás levemente, luego volver

HOOK 3: "EL SCROLL STOP"
→ Hacer algo inesperado o llamativo
→ Expresión intensa, directa
→ Gesto abrupto que capta atención

HOOK 4: "LA PREGUNTA"
→ Cara de "te voy a contar algo importante"
→ Ceja levantada, labios apretados pensativos
→ Ladear cabeza cuestionando

HOOK 5: "EL PRODUCT REVEAL"
→ Mostrar producto de forma dramática pero casual
→ Orgullo sutil, emoción contenida
→ Traer producto al frame desde abajo

═══════════════════════════════════════════════════════════════════════════════
                              MICRO-EXPRESIONES OBLIGATORIAS
═══════════════════════════════════════════════════════════════════════════════

OJOS:
- Parpadeos naturales (cada 3-4 segundos)
- Miradas breves fuera de cámara
- Focus shift (ojos ajustando foco)
- Brillo natural en ojos por luz

BOCA:
- Labios humedeciéndose ocasionalmente
- Media sonrisa asimétrica (más real)
- Morderse labio inferior (pensando)
- Boca ligeramente abierta entre frases

CARA:
- Micro-movimientos de cejas al enfatizar
- Arrugas naturales al sonreír
- Piel con textura visible
- Movimientos involuntarios sutiles

CUERPO:
- Respiración visible (hombros subiendo)
- Pequeños acomodamientos de postura
- Manos tocando pelo/cara ocasionalmente

═══════════════════════════════════════════════════════════════════════════════
                              MOVIMIENTO DE CÁMARA REALISTA
═══════════════════════════════════════════════════════════════════════════════

SELFIE HANDHELD:
- Shake sutil constante (respiración de quien sostiene)
- Drift lento en una dirección
- Micro-ajustes de ángulo
- Ligero temblor al mover brazo

POV CAMINANDO:
- Bounce rítmico con pasos
- Shake más pronunciado
- Horizonte no perfectamente nivelado

SENTADO FILMANDO:
- Shake mínimo pero presente
- Micro-drifts
- Ajustes ocasionales de encuadre

═══════════════════════════════════════════════════════════════════════════════
                              NEGACIONES OBLIGATORIAS
═══════════════════════════════════════════════════════════════════════════════

SIEMPRE incluir al final:
"NOT professional video production, NOT studio lighting, NOT cinema camera quality, NOT perfect composition, NOT color graded professionally, NOT commercial advertisement, NOT stock footage, NOT perfectly stable footage, NOT scripted performance, NOT perfect hair and makeup, NOT theatrical acting, NOT slow motion, NOT drone footage, NO text overlays, NO banners, NO titles, NO subtitles, NO logos, NO watermarks, NO graphics, NO visual elements added to video. Person speaks in Argentinian Spanish with authentic accent and vocabulary (voseo, che, posta, copado, re, mirá, tenés, bárbaro, mortal). NO bad words or insults."

═══════════════════════════════════════════════════════════════════════════════
                              FORMATO DE SALIDA
═══════════════════════════════════════════════════════════════════════════════

Responde SOLO con JSON válido. Para cada prompt de video:

{
  "video_prompts": [
    {
      "creative_angle": "string - concepto creativo",
      "format": "selfie_talking | pov_first_person | friend_filming | reaction | mirror | lifestyle_vlog | grwm | product_in_use",
      "hook_type": "secret | surprise | scroll_stop | question | product_reveal",
      "duration_seconds": 10,
      "energy_level": "low | medium | high | explosive",
      "emotional_arc": "string - cómo evoluciona la emoción",
      "camera": {
        "shot_type": "selfie_handheld | pov | third_person | static",
        "stability": "handheld_shaky | handheld_stable | tripod",
        "movement": "static | subtle_drift | following | dynamic"
      },
      "lighting": {
        "source": "natural_window | golden_hour | ring_light | mixed",
        "quality": "soft | hard | mixed"
      },
      "micro_expressions": ["string - expresiones específicas a incluir"],
      "timeline": {
        "seconds_0_2": "string - hook inicial",
        "seconds_2_5": "string - desarrollo",
        "seconds_5_8": "string - climax/reveal",
        "seconds_8_10": "string - cierre"
      },
      "text_prompt": "string - El prompt final de 200-300 palabras listo para Sora 2 Pro"
    }
  ]
}`

// ============================================
// GENERACIÓN DE PROMPTS
// ============================================

export interface PromptGenerationInput {
  angle: Angle
  archetype: Archetype
  campaign: Campaign
  numImages: number
  numVideos: number
}

export async function executePromptsAgent(
  input: PromptGenerationInput
): Promise<PromptsGenerationResult> {
  const { angle, archetype, campaign, numImages, numVideos } = input
  const startTime = Date.now()
  console.log(`[Prompts Agent] Generando ${numImages} prompts de imagen y ${numVideos} de video`)

  const imagePrompts: ContentPrompt[] = []
  const videoPrompts: ContentPrompt[] = []

  try {
    const client = getOpenAIClient()
    const now = new Date().toISOString()

    // Contexto común para ambos tipos
    const coreMessageSection = campaign.coreMessage
      ? `\n⭐ MENSAJE PRINCIPAL DE LA CAMPAÑA:
"${campaign.coreMessage}"
Esta es la IDEA CENTRAL que se quiere comunicar. Cada ángulo debe expresarla a su manera, adaptándola según su enfoque específico.\n`
      : ''

    const contextPrompt = `
CONTEXTO DE LA CAMPAÑA:
- Nombre: ${campaign.name}
- Brief: ${campaign.brief}
- Objetivo: ${campaign.objective}
- Categoría: ${campaign.category}
- Plataformas: ${campaign.platforms.join(', ')}
${coreMessageSection}
ARQUETIPO TARGET:
- Nombre: ${archetype.name}
- Motivación principal: ${archetype.mainMotivation}
- Puntos de dolor: ${archetype.painPoints.join(', ')}
- Deseos: ${archetype.desires.join(', ')}
- Trigger emocional: ${archetype.emotionalTrigger}

ÁNGULO CREATIVO:
- Título: ${angle.title}
- Descripción: ${angle.description}
- Objetivo estratégico: ${angle.strategicGoal}
- Estructura VSL: ${angle.vslStructure}
- Sugerencia de video: ${angle.videoSuggestion}
- Triggers emocionales: ${angle.emotionalTriggers.join(', ')}
`

    // ============================================
    // GENERAR PROMPTS DE IMAGEN
    // ============================================
    if (numImages > 0) {
      console.log(`[Prompts Agent] Generando ${numImages} prompts de imagen...`)

      const coreMessageInstruction = campaign.coreMessage
        ? `\n⭐ MENSAJE PRINCIPAL DE LA CAMPAÑA (para sugerir títulos):
"${campaign.coreMessage}"

Usa este mensaje como GUÍA para sugerir títulos creativos para el overlay.
Crea VARIACIONES diferentes: solo descuento, solo cuotas, combinación, etc.\n`
        : ''

      const imageUserPrompt = `${contextPrompt}

TAREA: Genera ${numImages} fotos UGC (SIN TEXTO) para usar como base de anuncios.
${coreMessageInstruction}

⚠️ REGLA CRÍTICA: Las imágenes NO deben tener texto, logos ni overlays.
El texto se agregará después en un editor externo.

PROCESO:

1. ANALIZA EL ÁNGULO CREATIVO:
   - Lee el título y descripción del ángulo
   - Identifica el enfoque (¿aventura? ¿familia? ¿destino? ¿precio?)

2. CREA LA ESCENA UGC:
   - Foto realista estilo iPhone, SIN TEXTO
   - Coherente con el ángulo
   - Dejar ESPACIO LIBRE (cielo, arena, agua) para agregar texto después
   - Composición que permita overlays en la parte superior o inferior

3. SUGIERE TEXTOS PARA EL EDITOR:
   - suggested_title: Título corto (2-5 palabras) como "50% OFF", "12 Cuotas"
   - suggested_subtitle: Frase del ángulo como "Tu próxima aventura te espera"

IMPORTANTE:
- El prompt de imagen (text_prompt) NO debe mencionar texto, logos ni overlays
- Solo describe la FOTOGRAFÍA pura
- Cada imagen debe ser DIFERENTE y única

Responde con JSON válido.`

      const imageResponse = await client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4000,
        temperature: 0.85,
        messages: [
          { role: 'system', content: IMAGE_SYSTEM_PROMPT },
          { role: 'user', content: imageUserPrompt },
        ],
      })

      const imageResponseText = imageResponse.choices[0]?.message?.content || ''
      console.log(`[Prompts Agent] Respuesta imágenes recibida (${imageResponseText.length} chars)`)

      const imageJsonMatch = imageResponseText.match(/\{[\s\S]*\}/)
      if (imageJsonMatch) {
        const parsed = JSON.parse(imageJsonMatch[0])
        const prompts = parsed.image_prompts || []

        interface ImagePromptResponse {
          text_prompt: string
          suggested_title?: string
          suggested_subtitle?: string
          angle_analysis?: string
        }

        prompts.forEach((p: ImagePromptResponse, index: number) => {
          imagePrompts.push({
            id: `prompt_img_${angle.id}_${Date.now()}_${index}`,
            angleId: angle.id,
            archetypeId: archetype.id,
            campaignId: campaign.id,
            type: 'image' as const,
            text: p.text_prompt,
            suggestedTitle: p.suggested_title || campaign.coreMessage || 'OFERTA ESPECIAL',
            suggestedSubtitle: p.suggested_subtitle || angle.title || 'Tu próxima aventura te espera',
            selectedToProduce: false,
            status: 'draft' as const,
            createdAt: now,
            updatedAt: now,
          })
        })
      }
    }

    // ============================================
    // GENERAR PROMPTS DE VIDEO
    // ============================================
    if (numVideos > 0) {
      console.log(`[Prompts Agent] Generando ${numVideos} prompts de video...`)

      const videoUserPrompt = `${contextPrompt}

TAREA: Genera ${numVideos} prompts de video UGC estilo TikTok/Reels.

Cada prompt debe:
1. Ser ÚNICO y diferente de los demás (variar formato, hook, energía)
2. Tener un HOOK potente en los primeros 2 segundos
3. Incluir timeline segundo a segundo
4. Especificar micro-expresiones y movimiento de cámara
5. Conectar con el arquetipo target emocionalmente
6. Terminar con negaciones anti-profesionales

IMPORTANTE:
- Duración recomendada: 10 segundos
- El campo "text_prompt" debe ser el prompt FINAL listo para Sora 2 Pro, de 200-300 palabras, en INGLÉS.
- Incluir comportamiento humano realista (parpadeos, gestos, respiración)

Responde SOLO con JSON válido.`

      const videoResponse = await client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4000,
        temperature: 0.85,
        messages: [
          { role: 'system', content: VIDEO_SYSTEM_PROMPT },
          { role: 'user', content: videoUserPrompt },
        ],
      })

      const videoResponseText = videoResponse.choices[0]?.message?.content || ''
      console.log(`[Prompts Agent] Respuesta videos recibida (${videoResponseText.length} chars)`)

      const videoJsonMatch = videoResponseText.match(/\{[\s\S]*\}/)
      if (videoJsonMatch) {
        const parsed = JSON.parse(videoJsonMatch[0])
        const prompts = parsed.video_prompts || []

        prompts.forEach((p: { text_prompt: string }, index: number) => {
          videoPrompts.push({
            id: `prompt_vid_${angle.id}_${Date.now()}_${index}`,
            angleId: angle.id,
            archetypeId: archetype.id,
            campaignId: campaign.id,
            type: 'video' as const,
            text: p.text_prompt,
            selectedToProduce: false,
            status: 'draft' as const,
            createdAt: now,
            updatedAt: now,
          })
        })
      }
    }

    const duration = Date.now() - startTime
    console.log(
      `[Prompts Agent] Completado en ${duration}ms - ${imagePrompts.length} imágenes, ${videoPrompts.length} videos`
    )

    return {
      imagePrompts,
      videoPrompts,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`[Prompts Agent] Error: ${errorMessage}`)
    throw new Error(`Prompts Agent failed: ${errorMessage}`)
  }
}

/**
 * Genera prompts para múltiples ángulos
 */
export async function executePromptsAgentBatch(
  angles: Angle[],
  archetypesMap: Map<string, Archetype>,
  campaign: Campaign
): Promise<ContentPrompt[]> {
  console.log(`[Prompts Agent] Generando prompts para ${angles.length} ángulos`)

  const allPrompts: ContentPrompt[] = []

  for (const angle of angles) {
    if (angle.imagesRequested === 0 && angle.videosRequested === 0) {
      console.log(`[Prompts Agent] Saltando ángulo ${angle.title} - sin contenido solicitado`)
      continue
    }

    const archetype = archetypesMap.get(angle.archetypeId)
    if (!archetype) {
      console.warn(`[Prompts Agent] Arquetipo no encontrado para ángulo: ${angle.id}`)
      continue
    }

    const result = await executePromptsAgent({
      angle,
      archetype,
      campaign,
      numImages: angle.imagesRequested,
      numVideos: angle.videosRequested,
    })

    allPrompts.push(...result.imagePrompts, ...result.videoPrompts)
  }

  console.log(`[Prompts Agent] Total de prompts generados: ${allPrompts.length}`)
  return allPrompts
}
