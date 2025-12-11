# Quick Start - Sistema de Agentes UGC

## 🚀 Inicio Rápido (5 minutos)

### 1. Configuración Inicial

Agrega estas variables a `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...  # Obtén en https://console.anthropic.com
NANO_BANANA_API_KEY=key-...   # Imágenes (opcional)
SORA_API_KEY=sk-...           # Videos (opcional)
SORA_API_ENDPOINT=https://api.openai.com/v1/videos/generations
```

### 2. Inicia el Servidor

```bash
npm run dev
```

Accede a http://localhost:3000

### 3. Crea tu Primera Campaña

**Opción A: Desde el navegador**
1. Dirígete a http://localhost:3000/campaigns/create
2. Completa el formulario
3. Haz clic en "Crear Campaña"

**Opción B: Desde cURL**

```bash
curl -X POST http://localhost:3000/api/campaigns/create \
  -H "Content-Type: application/json" \
  -d '{
    "type": "producto",
    "brief_text": "Crema anti-arrugas con colágeno marino. Reduce líneas en 14 días.",
    "target_audience": "Mujeres 35-55 años",
    "num_videos_initial": 50,
    "idioma": "español",
    "executeOptions": {
      "executeResearch": true,
      "executeAngles": true,
      "executeScriptwriting": true,
      "executeVariations": false
    }
  }'
```

### 4. Ve los Resultados

- **Lista de campañas:** http://localhost:3000/campaigns
- **Detalles:** http://localhost:3000/campaigns/[id]

---

## 📋 ¿Qué sucede cuando creas una campaña?

```
Tu Brief
   ↓
1. RESEARCH AGENT (~3s)
   - Analiza el brief
   - Extrae 10+ puntos de dolor
   - Extrae 10+ beneficios
   - Genera 5 promesas
   ↓
2. ANGLES AGENT (~5s)
   - Crea 20+ conceptos creativos
   - Define tipos de creadores
   - Sugiere contextos de grabación
   ↓
3. SCRIPTWRITER AGENT (~10s)
   - Convierte cada ángulo en un prompt de video
   - Incluye Scene, Lighting, Action, Dialog
   - Parámetros técnicos para Sora
   ↓
4. VARIATIONS AGENT (opcional, ~15s)
   - Genera 2-3 variaciones por prompt
   - Para A/B testing
   ↓
✅ DONE: 20+ prompts listos para generar videos
```

Total: ~30 segundos para 20+ conceptos completos

---

## 🎯 Casos de Uso

### Caso 1: Solo analizar el producto
```json
{
  "type": "producto",
  "brief_text": "Mi producto...",
  "executeOptions": {
    "executeResearch": true,
    "executeAngles": false
  }
}
```
→ Obtiene pains, benefits, objections

### Caso 2: Generar conceptos creativos
```json
{
  "type": "producto",
  "brief_text": "Mi producto...",
  "executeOptions": {
    "executeResearch": true,
    "executeAngles": true,
    "executeScriptwriting": false
  }
}
```
→ Obtiene 20+ ángulos creativos con detalles

### Caso 3: Prompts listos para video (RECOMENDADO)
```json
{
  "type": "producto",
  "brief_text": "Mi producto...",
  "executeOptions": {
    "executeResearch": true,
    "executeAngles": true,
    "executeScriptwriting": true,
    "executeVariations": false
  }
}
```
→ 20+ prompts ultra-realistas para Sora

### Caso 4: A/B Testing completo
```json
{
  "type": "producto",
  "brief_text": "Mi producto...",
  "executeOptions": {
    "executeResearch": true,
    "executeAngles": true,
    "executeScriptwriting": true,
    "executeVariations": true,
    "numVariationsPerPrompt": 3
  }
}
```
→ 20 prompts × 3 variaciones = 60 variaciones para testear

---

## 📊 Estructura de Datos de Salida

```typescript
Campaign {
  id: string
  status: 'completed' | 'in_progress' | 'failed'

  research: {
    pain_points: [{ id, description }]      // 10+
    benefits: [{ id, description }]         // 10+
    objections: [{ id, description }]       // 5
    promises: [{ id, description }]         // 5
  }

  angles: {
    angles: [{
      angle_id: string
      angle_name: string
      big_idea: string
      hook_type: string
      pain_point_target: string
      key_benefit_target: string
      suggested_creator: string
      context: string
    }]  // 20+
  }

  prompts: [{
    angle_id: string
    prompt_text: string  // Ultra-realista para Sora
  }]  // 1 por ángulo

  variations: [{
    parent_prompt_id: string
    variation_id: string
    prompt_text: string
    hypothesis: string
    target_metric: 'ctr' | 'thumbstop' | 'roas' | 'conversion'
  }]  // Opcional
}
```

---

## 🔗 Rutas Disponibles

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/campaigns/create` | GET | Formulario de crear campaña |
| `/api/campaigns/create` | POST | API para crear campaña |
| `/campaigns` | GET | Listar todas las campañas |
| `/campaigns/[id]` | GET | Ver detalles de campaña |

---

## 💾 Guardando Resultados

La dashboard te permite:

- **Copiar prompts**: Click en el icono copy
- **Descargar JSON**: Botón "Descargar" en la página de detalles
- **Ver research**: Tab "Research" con todos los puntos de dolor
- **Exportar todo**: El JSON contiene toda la información

---

## 🐛 Troubleshooting

### Error: "ANTHROPIC_API_KEY no configurada"
→ Verifica `.env.local` tiene la key correcta

### Error: "No JSON found in response"
→ Los agentes pueden fallar ocasionalmente. Intenta nuevamente.

### ¿Dónde están mis campañas guardadas?
→ **TODO**: Necesita integración con Supabase. Por ahora están en memoria.

### ¿Puedo generar videos?
→ Sí, pero necesita SORA_API_KEY. Ve al endpoint POST `/api/campaigns/[id]/generate-videos`

---

## 🚀 Flujo de Trabajo Recomendado

1. **Crea campaña** con todos los agentes activados
2. **Espera 30 segundos** a que se completen
3. **Revisa research** para entender al público
4. **Revisa ángulos** y elige los 3-5 mejores
5. **Copia los prompts** de esos ángulos
6. **Envía a Sora** para generar videos
7. **Publica los mejores** en TikTok/Reels

---

¿Preguntas? Ver [AGENTS-IMPLEMENTATION.md](AGENTS-IMPLEMENTATION.md) para documentación completa.
