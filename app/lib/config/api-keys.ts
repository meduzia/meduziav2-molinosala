/**
 * Configuración centralizada de API Keys
 *
 * Este archivo obtiene las API keys de variables de entorno.
 * Configura las variables en .env.local (local) o en Vercel (producción).
 */

/**
 * Obtiene la API key de OpenAI
 */
export function getOpenAIApiKey(): string {
  const envKey = process.env.OPENAI_API_KEY
  if (!envKey) {
    console.warn('[Config] OPENAI_API_KEY no configurada')
    return ''
  }
  return envKey
}

/**
 * Obtiene la API key de KIE
 */
export function getKIEApiKey(): string {
  return process.env.KIE_API_KEY || ''
}

/**
 * Obtiene la API key de IMGBB
 */
export function getIMGBBApiKey(): string {
  return process.env.IMGBB_API_KEY || ''
}

/**
 * Obtiene la API key de Anthropic (Claude)
 */
export function getAnthropicApiKey(): string {
  return process.env.ANTHROPIC_API_KEY || ''
}

/**
 * Verifica si las API keys están configuradas correctamente
 */
export function validateApiKeys(): { openai: boolean; kie: boolean; imgbb: boolean } {
  const openaiKey = getOpenAIApiKey()
  const kieKey = getKIEApiKey()
  const imgbbKey = getIMGBBApiKey()

  return {
    openai: openaiKey.startsWith('sk-') && openaiKey.length > 20,
    kie: kieKey.length > 10,
    imgbb: imgbbKey.length > 10
  }
}
