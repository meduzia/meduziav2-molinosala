# Análisis de Costos - Campañas UGC

## Resumen Ejecutivo

El sistema de generación de campañas UGC utiliza **OpenAI GPT-3.5-turbo** para la generación de contenido. Los costos varían según qué agentes se ejecuten.

**Precios base (a 2025-11-16):**
- Input: $0.0005 por 1K tokens
- Output: $0.0015 por 1K tokens

---

## Costos por Agente

### 1. Research Agent (Pain Points Analyzer)
- **Modelo:** GPT-3.5-turbo
- **Función:** Analiza el brief y extrae puntos de dolor, beneficios, objeciones y promesas
- **Tokens estimados:** 800 input + 1,200 output = 2,000 totales
- **Costo:** $0.0029
- **Ejecutado por defecto:** ✅ SÍ

### 2. Angles Agent (Creative Concepts)
- **Modelo:** GPT-3.5-turbo
- **Función:** Genera 20 ángulos creativos para UGC basados en la research
- **Tokens estimados:** 2,000 input + 2,800 output = 4,800 totales
- **Costo:** $0.0045
- **Ejecutado por defecto:** ✅ SÍ
- **Dependencia:** Requiere Research

### 3. Scriptwriting Agent (Video Prompts)
- **Modelo:** GPT-3.5-turbo
- **Función:** Convierte ángulos en prompts detallados para generar videos
- **Tokens estimados:** 3,500 input + 4,500 output = 8,000 totales
- **Costo:** $0.0090
- **Ejecutado por defecto:** ❌ NO
- **Dependencia:** Requiere Angles

### 4. Image Generation Agent (Image Prompts)
- **Modelo:** GPT-3.5-turbo
- **Función:** Genera prompts optimizados para generadores de imágenes AI
- **Tokens estimados:** 3,500 input + 4,500 output = 8,000 totales
- **Costo:** $0.0090
- **Ejecutado por defecto:** ❌ NO
- **Dependencia:** Requiere Angles

### 5. Variations Agent (A/B Testing)
- **Modelo:** GPT-3.5-turbo
- **Función:** Genera variaciones de videos para pruebas A/B
- **Tokens estimados:** 5,000 input + 6,000 output = 11,000 totales
- **Costo:** $0.0155
- **Ejecutado por defecto:** ❌ NO
- **Dependencia:** Requiere Scriptwriting

---

## Opciones de Ejecución y Costos

### Opción 1: Mínima (Research + Angles)
```
✓ Research Agent       = $0.0029
✓ Angles Agent         = $0.0045
─────────────────────────────
TOTAL:                 = $0.0074
```
**Uso:** Cuando solo necesitas análisis y conceptos creativos.

### Opción 2: Estándar (Research + Angles + Image Generation)
```
✓ Research Agent       = $0.0029
✓ Angles Agent         = $0.0045
✓ Image Generation     = $0.0090
─────────────────────────────
TOTAL:                 = $0.0164
```
**Uso:** Para generar contenido de imagen con IA (recomendado por defecto).

### Opción 3: Videos (Research + Angles + Scriptwriting)
```
✓ Research Agent       = $0.0029
✓ Angles Agent         = $0.0045
✓ Scriptwriting        = $0.0090
─────────────────────────────
TOTAL:                 = $0.0164
```
**Uso:** Para generar scripts de video con prompts detallados.

### Opción 4: Premium (Research + Angles + Scriptwriting + Image Generation)
```
✓ Research Agent       = $0.0029
✓ Angles Agent         = $0.0045
✓ Scriptwriting        = $0.0090
✓ Image Generation     = $0.0090
─────────────────────────────
TOTAL:                 = $0.0254
```
**Uso:** Contenido completo: scripts de video + prompts de imagen.

### Opción 5: Completa (Todos los agentes)
```
✓ Research Agent       = $0.0029
✓ Angles Agent         = $0.0045
✓ Scriptwriting        = $0.0090
✓ Image Generation     = $0.0090
✓ Variations Agent     = $0.0155
─────────────────────────────
TOTAL:                 = $0.0409
```
**Uso:** A/B testing completo con múltiples variaciones.

---

## Desglose de Tokens

### Por Agente
| Agente | Input | Output | Total |
|--------|-------|--------|-------|
| Research | 800 | 1,200 | 2,000 |
| Angles | 2,000 | 2,800 | 4,800 |
| Scriptwriting | 3,500 | 4,500 | 8,000 |
| Image Generation | 3,500 | 4,500 | 8,000 |
| Variations | 5,000 | 6,000 | 11,000 |

### Por Opción
| Opción | Input Tokens | Output Tokens | Total |
|--------|--------------|---------------|-------|
| Mínima | 2,800 | 4,000 | 6,800 |
| Estándar | 6,300 | 8,500 | 14,800 |
| Videos | 6,300 | 8,500 | 14,800 |
| Premium | 9,800 | 13,000 | 22,800 |
| Completa | 14,800 | 19,000 | 33,800 |

---

## Proyecciones de Presupuesto

### Campaña individual
| Opción | Costo por Campaña |
|--------|------------------|
| Mínima | $0.0074 |
| Estándar | $0.0164 |
| Videos | $0.0164 |
| Premium | $0.0254 |
| Completa | $0.0409 |

### 100 campañas
| Opción | Costo Total |
|--------|-------------|
| Mínima | $0.74 |
| Estándar | $1.64 |
| Videos | $1.64 |
| Premium | $2.54 |
| Completa | $4.09 |

### 1,000 campañas
| Opción | Costo Total |
|--------|-------------|
| Mínima | $7.40 |
| Estándar | $16.40 |
| Videos | $16.40 |
| Premium | $25.40 |
| Completa | $40.90 |

---

## Recomendaciones

### Para optimizar costos:

1. **Usa la opción "Estándar"** (Research + Angles + Image Generation) como configuración por defecto
   - Costo: $0.0164 por campaña
   - Genera 20 ángulos + prompts para imágenes
   - Perfecta para la mayoría de casos

2. **Desactiva Image Generation** si no la necesitas
   - Ahorra $0.0090 por campaña
   - Costo: $0.0074

3. **Activa Scriptwriting solo cuando necesites videos**
   - Costo adicional: $0.0090
   - Desactiva Image Generation para usar solo Scriptwriting si no necesitas imágenes

4. **Usa Variations solo para campañas de alto rendimiento**
   - Costo adicional: $0.0155
   - Perfecto para A/B testing después de elegir los mejores ángulos

### Presupuesto recomendado por volumen:

- **Startup/Prueba:** $1-5/mes (100-500 campañas estándar)
- **PME:** $10-50/mes (1,000-3,000 campañas estándar)
- **Agencia:** $100-500/mes (10,000-30,000 campañas)
- **Escala:** $500+/mes (30,000+ campañas)

---

## Panel de Control de Costos

El sistema incluye:

✅ **Estimador de costos en tiempo real**
- En la página de creación de campaña
- Se actualiza al cambiar opciones de ejecución
- Muestra desglose por agente y total

✅ **Endpoint de API de costos**
- `GET /api/campaigns/cost-estimate`
- Parámetros: `research`, `angles`, `scriptwriting`, `imageGeneration`, `variations`
- Respuesta: desglose completo de tokens y costos

✅ **Respuesta en creación de campaña**
- Cada campaña retorna `estimatedCost` con desglose completo
- Permite rastrear costos históricos

---

## Notas Importantes

1. **Estimaciones:** Los costos mostrados son *estimaciones* basadas en prompts y respuestas típicas. Los costos reales pueden variar ±10% según:
   - Longitud del brief
   - Tokens necesarios para JSON parsing
   - Errores y reintentos

2. **Actualización de precios:** Si OpenAI cambia sus precios, actualiza los valores en `app/lib/cost-calculator.ts`

3. **Almacenamiento en BD:** Se registran costos estimados pero no costos reales de OpenAI (requeriría tracking detallado)

4. **Moneda:** Los costos están en USD ($)

---

Última actualización: 2025-11-16
