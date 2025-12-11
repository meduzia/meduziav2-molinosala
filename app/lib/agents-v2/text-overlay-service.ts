/**
 * TEXT OVERLAY SERVICE v2
 *
 * Sistema avanzado de overlays para Meta Ads de PAX Assistance
 * Soporta múltiples layouts basados en referencias de producción real.
 *
 * Layouts disponibles:
 * - gradient-bottom: Gradiente violeta en parte inferior con textos
 * - solid-band: Banda sólida violeta en parte inferior
 * - floating-text: Textos flotantes con sombra sobre la imagen
 * - testimonial: Layout para testimonios con estrellas
 * - bullet-points: Lista de beneficios con viñetas
 * - minimal: Solo headline grande centrado
 */

import sharp from 'sharp'
import type { TextOverlay } from '../types/campaign-types'

// Tipos de layout disponibles
export type OverlayLayout =
  | 'gradient-bottom'
  | 'solid-band'
  | 'floating-text'
  | 'testimonial'
  | 'bullet-points'
  | 'minimal'

export interface OverlayConfig {
  textOverlay: TextOverlay
  textPosition: 'top' | 'center' | 'bottom'
  layout?: OverlayLayout
  showLogo?: boolean
  format?: '1:1' | '4:5' | '9:16'
}

// Colores PAX oficiales
const PAX_COLORS = {
  violet: '#440099',
  violetDark: '#2D0066',
  magenta: '#E71FB2',
  cyan: '#4FB3DE',
  pink: '#F9C7EB',
  lime: '#C4F909',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#666666',
}

// Logo PAX en SVG (simplificado)
const PAX_LOGO_SVG = `
<g id="pax-logo">
  <rect x="0" y="0" width="120" height="40" rx="4" fill="${PAX_COLORS.violet}"/>
  <text x="60" y="28" font-family="Arial Black, sans-serif" font-size="24" font-weight="900" fill="${PAX_COLORS.white}" text-anchor="middle">PAX</text>
</g>
`

/**
 * Escapa caracteres especiales para SVG
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Genera estrellas para testimonios
 */
function generateStars(count: number, x: number, y: number, size: number): string {
  const stars: string[] = []
  const spacing = size * 1.2

  for (let i = 0; i < count; i++) {
    const starX = x + i * spacing
    stars.push(`
      <text x="${starX}" y="${y}" font-size="${size}" fill="${PAX_COLORS.lime}">★</text>
    `)
  }

  return stars.join('')
}

/**
 * Layout: Gradiente violeta en parte inferior
 */
function generateGradientBottomLayout(
  width: number,
  height: number,
  config: OverlayConfig
): string {
  const { textOverlay, showLogo } = config
  const { headline, subheadline, cta, badge } = textOverlay

  const gradientHeight = height * 0.45
  const gradientY = height - gradientHeight
  const centerX = width / 2
  const padding = width * 0.06

  // Tamaños de fuente
  const headlineSize = Math.round(width * 0.11)
  const subheadlineSize = Math.round(width * 0.042)
  const ctaSize = Math.round(width * 0.038)
  const badgeSize = Math.round(width * 0.032)

  const elements: string[] = []

  // Definir gradiente
  elements.push(`
    <defs>
      <linearGradient id="violetGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${PAX_COLORS.violet};stop-opacity:0" />
        <stop offset="30%" style="stop-color:${PAX_COLORS.violet};stop-opacity:0.85" />
        <stop offset="100%" style="stop-color:${PAX_COLORS.violetDark};stop-opacity:0.95" />
      </linearGradient>
    </defs>
    <rect x="0" y="${gradientY}" width="${width}" height="${gradientHeight}" fill="url(#violetGradient)" />
  `)

  let currentY = gradientY + gradientHeight * 0.35

  // Badge
  if (badge) {
    const badgeWidth = badge.length * badgeSize * 0.65 + 30
    const badgeHeight = badgeSize + 16
    elements.push(`
      <rect x="${centerX - badgeWidth / 2}" y="${currentY - badgeHeight / 2}"
            width="${badgeWidth}" height="${badgeHeight}" rx="4" fill="${PAX_COLORS.lime}" />
      <text x="${centerX}" y="${currentY + badgeSize * 0.35}"
            font-family="Arial Black, sans-serif" font-size="${badgeSize}"
            font-weight="bold" fill="${PAX_COLORS.black}" text-anchor="middle">
        ${escapeXml(badge)}
      </text>
    `)
    currentY += badgeSize + 25
  }

  // Headline
  if (headline) {
    elements.push(`
      <text x="${centerX}" y="${currentY}"
            font-family="Arial Black, Impact, sans-serif" font-size="${headlineSize}"
            font-weight="900" fill="${PAX_COLORS.white}" text-anchor="middle">
        ${escapeXml(headline)}
      </text>
    `)
    currentY += headlineSize * 0.9
  }

  // Subheadline
  if (subheadline) {
    elements.push(`
      <text x="${centerX}" y="${currentY}"
            font-family="Arial, Helvetica, sans-serif" font-size="${subheadlineSize}"
            font-weight="600" fill="${PAX_COLORS.white}" text-anchor="middle">
        ${escapeXml(subheadline)}
      </text>
    `)
    currentY += subheadlineSize + 20
  }

  // CTA
  if (cta) {
    const ctaWidth = cta.length * ctaSize * 0.55 + 50
    const ctaHeight = ctaSize + 24
    elements.push(`
      <rect x="${centerX - ctaWidth / 2}" y="${currentY - ctaHeight / 2}"
            width="${ctaWidth}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="${PAX_COLORS.magenta}" />
      <text x="${centerX}" y="${currentY + ctaSize * 0.35}"
            font-family="Arial, sans-serif" font-size="${ctaSize}"
            font-weight="bold" fill="${PAX_COLORS.white}" text-anchor="middle">
        ${escapeXml(cta)}
      </text>
    `)
  }

  // Logo PAX (esquina superior)
  if (showLogo) {
    const logoScale = width * 0.001
    elements.push(`
      <g transform="translate(${padding}, ${padding}) scale(${logoScale})">
        ${PAX_LOGO_SVG}
      </g>
    `)
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${elements.join('\n')}
  </svg>`
}

/**
 * Layout: Banda sólida violeta
 */
function generateSolidBandLayout(
  width: number,
  height: number,
  config: OverlayConfig
): string {
  const { textOverlay, showLogo } = config
  const { headline, subheadline, cta } = textOverlay

  const bandHeight = height * 0.35
  const bandY = height - bandHeight
  const centerX = width / 2
  const padding = width * 0.06

  const headlineSize = Math.round(width * 0.1)
  const subheadlineSize = Math.round(width * 0.04)
  const ctaSize = Math.round(width * 0.035)

  const elements: string[] = []

  // Banda sólida
  elements.push(`
    <rect x="0" y="${bandY}" width="${width}" height="${bandHeight}" fill="${PAX_COLORS.violet}" />
  `)

  let currentY = bandY + bandHeight * 0.3

  // Headline
  if (headline) {
    elements.push(`
      <text x="${centerX}" y="${currentY}"
            font-family="Arial Black, sans-serif" font-size="${headlineSize}"
            font-weight="900" fill="${PAX_COLORS.white}" text-anchor="middle">
        ${escapeXml(headline)}
      </text>
    `)
    currentY += headlineSize * 0.85
  }

  // Subheadline
  if (subheadline) {
    elements.push(`
      <text x="${centerX}" y="${currentY}"
            font-family="Arial, sans-serif" font-size="${subheadlineSize}"
            fill="${PAX_COLORS.lime}" text-anchor="middle">
        ${escapeXml(subheadline)}
      </text>
    `)
    currentY += subheadlineSize + 15
  }

  // CTA
  if (cta) {
    const ctaWidth = cta.length * ctaSize * 0.55 + 45
    const ctaHeight = ctaSize + 20
    elements.push(`
      <rect x="${centerX - ctaWidth / 2}" y="${currentY - ctaHeight / 2}"
            width="${ctaWidth}" height="${ctaHeight}" rx="${ctaHeight / 2}" fill="${PAX_COLORS.magenta}" />
      <text x="${centerX}" y="${currentY + ctaSize * 0.35}"
            font-family="Arial, sans-serif" font-size="${ctaSize}"
            font-weight="bold" fill="${PAX_COLORS.white}" text-anchor="middle">
        ${escapeXml(cta)}
      </text>
    `)
  }

  // Logo
  if (showLogo) {
    const logoScale = width * 0.001
    elements.push(`
      <g transform="translate(${padding}, ${padding}) scale(${logoScale})">
        ${PAX_LOGO_SVG}
      </g>
    `)
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${elements.join('\n')}
  </svg>`
}

/**
 * Layout: Textos flotantes con sombra
 */
function generateFloatingTextLayout(
  width: number,
  height: number,
  config: OverlayConfig
): string {
  const { textOverlay, textPosition, showLogo } = config
  const { headline, subheadline, cta, badge } = textOverlay

  const centerX = width / 2
  const padding = width * 0.06

  const headlineSize = Math.round(width * 0.12)
  const subheadlineSize = Math.round(width * 0.045)
  const ctaSize = Math.round(width * 0.04)
  const badgeSize = Math.round(width * 0.035)

  let baseY: number
  switch (textPosition) {
    case 'top':
      baseY = height * 0.18
      break
    case 'center':
      baseY = height * 0.45
      break
    case 'bottom':
    default:
      baseY = height * 0.72
      break
  }

  const elements: string[] = []

  // Filtro de sombra
  elements.push(`
    <defs>
      <filter id="textShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="black" flood-opacity="0.5"/>
      </filter>
    </defs>
  `)

  let currentY = baseY

  // Badge
  if (badge) {
    const badgeWidth = badge.length * badgeSize * 0.7 + 35
    const badgeHeight = badgeSize + 18
    elements.push(`
      <rect x="${centerX - badgeWidth / 2}" y="${currentY - badgeHeight / 2}"
            width="${badgeWidth}" height="${badgeHeight}" rx="6" fill="${PAX_COLORS.lime}"
            filter="url(#textShadow)" />
      <text x="${centerX}" y="${currentY + badgeSize * 0.35}"
            font-family="Arial Black, sans-serif" font-size="${badgeSize}"
            font-weight="bold" fill="${PAX_COLORS.black}" text-anchor="middle">
        ${escapeXml(badge)}
      </text>
    `)
    currentY += badgeSize + 30
  }

  // Headline con outline
  if (headline) {
    elements.push(`
      <text x="${centerX}" y="${currentY}"
            font-family="Impact, Arial Black, sans-serif" font-size="${headlineSize}"
            font-weight="bold" fill="${PAX_COLORS.black}" text-anchor="middle"
            stroke="${PAX_COLORS.black}" stroke-width="10" stroke-linejoin="round"
            filter="url(#textShadow)">
        ${escapeXml(headline)}
      </text>
      <text x="${centerX}" y="${currentY}"
            font-family="Impact, Arial Black, sans-serif" font-size="${headlineSize}"
            font-weight="bold" fill="${PAX_COLORS.white}" text-anchor="middle">
        ${escapeXml(headline)}
      </text>
    `)
    currentY += headlineSize * 0.85
  }

  // Subheadline
  if (subheadline) {
    elements.push(`
      <text x="${centerX}" y="${currentY}"
            font-family="Arial, sans-serif" font-size="${subheadlineSize}"
            font-weight="600" fill="${PAX_COLORS.black}" text-anchor="middle"
            stroke="${PAX_COLORS.black}" stroke-width="5" stroke-linejoin="round"
            filter="url(#textShadow)">
        ${escapeXml(subheadline)}
      </text>
      <text x="${centerX}" y="${currentY}"
            font-family="Arial, sans-serif" font-size="${subheadlineSize}"
            font-weight="600" fill="${PAX_COLORS.white}" text-anchor="middle">
        ${escapeXml(subheadline)}
      </text>
    `)
    currentY += subheadlineSize + 25
  }

  // CTA
  if (cta) {
    const ctaWidth = cta.length * ctaSize * 0.58 + 55
    const ctaHeight = ctaSize + 28
    elements.push(`
      <rect x="${centerX - ctaWidth / 2}" y="${currentY - ctaHeight / 2}"
            width="${ctaWidth}" height="${ctaHeight}" rx="${ctaHeight / 2}"
            fill="${PAX_COLORS.magenta}" filter="url(#textShadow)" />
      <text x="${centerX}" y="${currentY + ctaSize * 0.35}"
            font-family="Arial, sans-serif" font-size="${ctaSize}"
            font-weight="bold" fill="${PAX_COLORS.white}" text-anchor="middle">
        ${escapeXml(cta)}
      </text>
    `)
  }

  // Logo
  if (showLogo) {
    const logoScale = width * 0.001
    elements.push(`
      <g transform="translate(${padding}, ${padding}) scale(${logoScale})" filter="url(#textShadow)">
        ${PAX_LOGO_SVG}
      </g>
    `)
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${elements.join('\n')}
  </svg>`
}

/**
 * Layout: Testimonios con estrellas
 */
function generateTestimonialLayout(
  width: number,
  height: number,
  config: OverlayConfig
): string {
  const { textOverlay, showLogo } = config
  const { headline, subheadline, cta } = textOverlay

  const bandHeight = height * 0.4
  const bandY = height - bandHeight
  const centerX = width / 2
  const padding = width * 0.06

  const quoteSize = Math.round(width * 0.038)
  const authorSize = Math.round(width * 0.03)
  const starSize = Math.round(width * 0.045)

  const elements: string[] = []

  // Banda con gradiente
  elements.push(`
    <defs>
      <linearGradient id="testimonialGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${PAX_COLORS.violet};stop-opacity:0.9" />
        <stop offset="100%" style="stop-color:${PAX_COLORS.violetDark};stop-opacity:0.95" />
      </linearGradient>
    </defs>
    <rect x="0" y="${bandY}" width="${width}" height="${bandHeight}" fill="url(#testimonialGradient)" />
  `)

  let currentY = bandY + bandHeight * 0.2

  // Estrellas
  const starsWidth = 5 * starSize * 1.2
  elements.push(generateStars(5, centerX - starsWidth / 2, currentY, starSize))
  currentY += starSize + 25

  // Quote (headline como testimonio)
  if (headline) {
    // Comillas de apertura
    elements.push(`
      <text x="${padding + 20}" y="${currentY}"
            font-family="Georgia, serif" font-size="${quoteSize * 2}"
            fill="${PAX_COLORS.lime}" opacity="0.8">"</text>
    `)

    // Texto del testimonio (puede tener múltiples líneas)
    const words = headline.split(' ')
    const maxCharsPerLine = Math.floor(width / (quoteSize * 0.5))
    let line = ''
    const lines: string[] = []

    words.forEach((word) => {
      if ((line + word).length > maxCharsPerLine) {
        lines.push(line.trim())
        line = word + ' '
      } else {
        line += word + ' '
      }
    })
    if (line.trim()) lines.push(line.trim())

    lines.forEach((lineText, i) => {
      elements.push(`
        <text x="${centerX}" y="${currentY + i * (quoteSize + 8)}"
              font-family="Georgia, serif" font-size="${quoteSize}"
              font-style="italic" fill="${PAX_COLORS.white}" text-anchor="middle">
          ${escapeXml(lineText)}
        </text>
      `)
    })
    currentY += lines.length * (quoteSize + 8) + 15
  }

  // Author (subheadline)
  if (subheadline) {
    elements.push(`
      <text x="${centerX}" y="${currentY}"
            font-family="Arial, sans-serif" font-size="${authorSize}"
            fill="${PAX_COLORS.cyan}" text-anchor="middle">
        — ${escapeXml(subheadline)}
      </text>
    `)
  }

  // Logo
  if (showLogo) {
    const logoScale = width * 0.001
    elements.push(`
      <g transform="translate(${padding}, ${padding}) scale(${logoScale})">
        ${PAX_LOGO_SVG}
      </g>
    `)
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${elements.join('\n')}
  </svg>`
}

/**
 * Layout: Bullet points / Lista de beneficios
 */
function generateBulletPointsLayout(
  width: number,
  height: number,
  config: OverlayConfig
): string {
  const { textOverlay, showLogo } = config
  const { headline, subheadline } = textOverlay

  const bandHeight = height * 0.45
  const bandY = height - bandHeight
  const padding = width * 0.08

  const titleSize = Math.round(width * 0.055)
  const bulletSize = Math.round(width * 0.035)
  const checkSize = Math.round(width * 0.04)

  const elements: string[] = []

  // Banda violeta
  elements.push(`
    <rect x="0" y="${bandY}" width="${width}" height="${bandHeight}" fill="${PAX_COLORS.violet}" />
  `)

  let currentY = bandY + bandHeight * 0.15

  // Título
  if (headline) {
    elements.push(`
      <text x="${padding}" y="${currentY}"
            font-family="Arial Black, sans-serif" font-size="${titleSize}"
            font-weight="900" fill="${PAX_COLORS.white}">
        ${escapeXml(headline)}
      </text>
    `)
    currentY += titleSize + 20
  }

  // Bullets (subheadline separado por |)
  if (subheadline) {
    const bullets = subheadline.split('|').map((b) => b.trim())
    bullets.forEach((bullet) => {
      // Checkmark
      elements.push(`
        <text x="${padding}" y="${currentY}"
              font-size="${checkSize}" fill="${PAX_COLORS.lime}">✓</text>
        <text x="${padding + checkSize + 10}" y="${currentY}"
              font-family="Arial, sans-serif" font-size="${bulletSize}"
              fill="${PAX_COLORS.white}">
          ${escapeXml(bullet)}
        </text>
      `)
      currentY += bulletSize + 15
    })
  }

  // Logo
  if (showLogo) {
    const logoScale = width * 0.001
    elements.push(`
      <g transform="translate(${padding}, ${padding}) scale(${logoScale})">
        ${PAX_LOGO_SVG}
      </g>
    `)
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${elements.join('\n')}
  </svg>`
}

/**
 * Layout: Minimal - Solo headline grande
 */
function generateMinimalLayout(
  width: number,
  height: number,
  config: OverlayConfig
): string {
  const { textOverlay, textPosition, showLogo } = config
  const { headline, cta } = textOverlay

  const centerX = width / 2
  const padding = width * 0.06

  const headlineSize = Math.round(width * 0.14)
  const ctaSize = Math.round(width * 0.04)

  let baseY: number
  switch (textPosition) {
    case 'top':
      baseY = height * 0.25
      break
    case 'center':
      baseY = height * 0.5
      break
    case 'bottom':
    default:
      baseY = height * 0.75
      break
  }

  const elements: string[] = []

  // Filtro de sombra fuerte
  elements.push(`
    <defs>
      <filter id="strongShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="black" flood-opacity="0.7"/>
      </filter>
    </defs>
  `)

  let currentY = baseY

  // Headline grande
  if (headline) {
    elements.push(`
      <text x="${centerX}" y="${currentY}"
            font-family="Impact, Arial Black, sans-serif" font-size="${headlineSize}"
            font-weight="900" fill="${PAX_COLORS.black}" text-anchor="middle"
            stroke="${PAX_COLORS.black}" stroke-width="12" stroke-linejoin="round"
            filter="url(#strongShadow)">
        ${escapeXml(headline)}
      </text>
      <text x="${centerX}" y="${currentY}"
            font-family="Impact, Arial Black, sans-serif" font-size="${headlineSize}"
            font-weight="900" fill="${PAX_COLORS.white}" text-anchor="middle">
        ${escapeXml(headline)}
      </text>
    `)
    currentY += headlineSize * 0.8
  }

  // CTA pequeño
  if (cta) {
    const ctaWidth = cta.length * ctaSize * 0.55 + 50
    const ctaHeight = ctaSize + 24
    elements.push(`
      <rect x="${centerX - ctaWidth / 2}" y="${currentY}"
            width="${ctaWidth}" height="${ctaHeight}" rx="${ctaHeight / 2}"
            fill="${PAX_COLORS.magenta}" filter="url(#strongShadow)" />
      <text x="${centerX}" y="${currentY + ctaHeight / 2 + ctaSize * 0.35}"
            font-family="Arial, sans-serif" font-size="${ctaSize}"
            font-weight="bold" fill="${PAX_COLORS.white}" text-anchor="middle">
        ${escapeXml(cta)}
      </text>
    `)
  }

  // Logo
  if (showLogo) {
    const logoScale = width * 0.001
    elements.push(`
      <g transform="translate(${padding}, ${padding}) scale(${logoScale})" filter="url(#strongShadow)">
        ${PAX_LOGO_SVG}
      </g>
    `)
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${elements.join('\n')}
  </svg>`
}

/**
 * Selecciona el layout apropiado y genera el SVG
 */
function generateTextOverlaySvg(
  width: number,
  height: number,
  config: OverlayConfig
): string {
  const layout = config.layout || 'floating-text'

  console.log(`[Text Overlay] Usando layout: ${layout}`)

  switch (layout) {
    case 'gradient-bottom':
      return generateGradientBottomLayout(width, height, config)
    case 'solid-band':
      return generateSolidBandLayout(width, height, config)
    case 'testimonial':
      return generateTestimonialLayout(width, height, config)
    case 'bullet-points':
      return generateBulletPointsLayout(width, height, config)
    case 'minimal':
      return generateMinimalLayout(width, height, config)
    case 'floating-text':
    default:
      return generateFloatingTextLayout(width, height, config)
  }
}

/**
 * Aplica overlay de texto a una imagen
 */
export async function applyTextOverlay(
  imageBuffer: Buffer,
  config: OverlayConfig
): Promise<Buffer> {
  try {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 1080
    const height = metadata.height || 1920

    console.log(`[Text Overlay] Aplicando overlay a imagen ${width}x${height}`)
    console.log(`[Text Overlay] Layout: ${config.layout || 'floating-text'}`)
    console.log(`[Text Overlay] ShowLogo: ${config.showLogo}`)
    console.log(`[Text Overlay] Config:`, JSON.stringify(config.textOverlay))

    const svgOverlay = generateTextOverlaySvg(width, height, config)

    const result = await sharp(imageBuffer)
      .composite([
        {
          input: Buffer.from(svgOverlay),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer()

    console.log(`[Text Overlay] Overlay aplicado exitosamente`)
    return result
  } catch (error) {
    console.error(`[Text Overlay] Error:`, error)
    return imageBuffer
  }
}

/**
 * Descarga una imagen desde URL y aplica overlay
 */
export async function applyTextOverlayToUrl(
  imageUrl: string,
  config: OverlayConfig
): Promise<Buffer> {
  try {
    console.log(`[Text Overlay] Descargando imagen: ${imageUrl}`)

    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const imageBuffer = Buffer.from(arrayBuffer)

    return applyTextOverlay(imageBuffer, config)
  } catch (error) {
    console.error(`[Text Overlay] Error descargando imagen:`, error)
    throw error
  }
}

/**
 * Procesa una imagen completada y guarda con overlay
 */
export async function processCompletedImage(
  imageUrl: string,
  textOverlay: TextOverlay | undefined,
  textPosition: 'top' | 'center' | 'bottom' = 'center',
  layout?: OverlayLayout,
  showLogo?: boolean
): Promise<{ buffer: Buffer; hasOverlay: boolean }> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  let imageBuffer = Buffer.from(arrayBuffer)
  let hasOverlay = false

  if (textOverlay && (textOverlay.headline || textOverlay.subheadline || textOverlay.cta)) {
    console.log(`[Text Overlay] Aplicando textos:`, textOverlay)

    imageBuffer = await applyTextOverlay(imageBuffer, {
      textOverlay,
      textPosition,
      layout,
      showLogo,
    })
    hasOverlay = true
  }

  return { buffer: imageBuffer, hasOverlay }
}

/**
 * Sugiere un layout basado en el contenido
 */
export function suggestLayout(textOverlay: TextOverlay): OverlayLayout {
  const { headline, subheadline } = textOverlay

  // Si tiene múltiples items separados por |, usar bullet-points
  if (subheadline && subheadline.includes('|')) {
    return 'bullet-points'
  }

  // Si parece un testimonio (tiene comillas o es largo)
  if (headline && (headline.includes('"') || headline.length > 60)) {
    return 'testimonial'
  }

  // Si es solo un headline corto (oferta), usar minimal
  if (headline && !subheadline && headline.length < 20) {
    return 'minimal'
  }

  // Por defecto, gradient-bottom es el más versátil
  return 'gradient-bottom'
}
