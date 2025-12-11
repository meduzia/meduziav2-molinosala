/**
 * Configuración centralizada de API Keys
 *
 * INSTRUCCIONES:
 * 1. Copia este archivo y renómbralo a 'api-keys.ts'
 * 2. Reemplaza los valores de ejemplo con tus API keys reales
 * 3. El archivo api-keys.ts está en .gitignore para proteger tus keys
 */

// OpenAI API Key - Obtén la tuya en https://platform.openai.com/api-keys
const OPENAI_API_KEY_FALLBACK = 'sk-proj-YOUR_OPENAI_API_KEY_HERE'

// KIE API Key - Para generación de imágenes
const KIE_API_KEY_FALLBACK = 'YOUR_KIE_API_KEY_HERE'

// IMGBB API Key - Obtén la tuya en https://api.imgbb.com/
const IMGBB_API_KEY_FALLBACK = 'YOUR_IMGBB_API_KEY_HERE'

/**
 * Obtiene la API key de OpenAI
 * Primero intenta usar la variable de entorno, si no existe usa el fallback
 */
export function getOpenAIApiKey(): string {
  const envKey = process.env.OPENAI_API_KEY

  // Si la key del env parece válida (empieza con sk-), úsala
  if (envKey && envKey.startsWith('sk-') && envKey.length > 20) {
    return envKey
  }

  // Si no, usa el fallback
  console.log('[Config] Usando OpenAI API Key de fallback')
  return OPENAI_API_KEY_FALLBACK
}

/**
 * Obtiene la API key de KIE
 */
export function getKIEApiKey(): string {
  return process.env.KIE_API_KEY || KIE_API_KEY_FALLBACK
}

/**
 * Obtiene la API key de IMGBB
 */
export function getIMGBBApiKey(): string {
  return process.env.IMGBB_API_KEY || IMGBB_API_KEY_FALLBACK
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
