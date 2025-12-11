# Workflow n8n: Pattern Detection - Ad Analysis

Workflow automatizado para detectar patrones en anuncios de alto y bajo rendimiento usando OpenAI GPT-4o-mini y guardar análisis en Supabase.

## 📋 Características

- ✅ Trigger Cron semanal (lunes 00:00) o HTTP manual
- ✅ Obtiene top10 y bottom10 de rankings semanales
- ✅ Obtiene clasificaciones de ads desde tabla `classifications`
- ✅ Análisis con OpenAI GPT-4o-mini usando prompt estructurado
- ✅ Devuelve JSON con: recurring_patterns_top, recurring_patterns_bottom, hypothesized_drivers
- ✅ Guarda resultados en tabla `patterns`

## 🚀 Instalación

### 1. Crear la tabla en Supabase

Ejecuta el SQL en Supabase SQL Editor:

```sql
-- Ver archivo: patterns-table.sql
```

O ejecuta el script directamente desde el archivo incluido.

### 2. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-pattern-detection.json`
4. Activa el workflow

### 3. Configurar Variables de Entorno

En n8n, ve a **Settings** → **Variables** y agrega:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase (usar credenciales de conexión directa Postgres)
# Configurar en credenciales de n8n como Postgres connection
```

### 4. Configurar Credenciales

#### OpenAI API
1. En n8n, crea credenciales **OpenAI API**
2. Configura con tu API key
3. Usa para: Analyze Patterns

#### Supabase Postgres
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 5. Obtener Webhook URL (si usas HTTP trigger)

1. Activa el workflow
2. Copia la URL del webhook desde el nodo **HTTP Trigger**
3. Ejemplo: `https://tu-n8n.com/webhook/pattern-detection`

## 📡 Uso del Webhook

### Request Format

```json
POST /webhook/pattern-detection
Content-Type: application/json

{
  "week_iso": "2024-W03"  // Opcional, si no se envía usa semana actual
}
```

### Parámetros (opcionales)

- **week_iso** (opcional): Semana ISO a analizar (formato: `YYYY-Www`). Default: semana actual

### Response Format

```json
{
  "success": true,
  "message": "✅ Análisis de patrones completado para 2024-W03",
  "week_iso": "2024-W03",
  "analysis_date": "2024-01-15",
  "recurring_patterns_top": {
    "content_types": ["video", "carousel"],
    "emotional_appeals": ["joy", "trust"],
    "creative_approaches": ["UGC", "lifestyle"],
    "cta_strengths": ["strong"],
    "target_audiences": ["young_adults_18-24"],
    "common_callouts": ["50% off", "Limited time"],
    "summary": "Los ads de alto rendimiento tienden a usar video con UGC..."
  },
  "recurring_patterns_bottom": {
    "content_types": ["single_image"],
    "emotional_appeals": ["fear"],
    "creative_approaches": ["product_showcase"],
    "cta_strengths": ["weak"],
    "target_audiences": ["general"],
    "common_callouts": [],
    "summary": "Los ads de bajo rendimiento generalmente usan imágenes estáticas..."
  },
  "hypothesized_drivers": {
    "key_differentiators": [
      "UGC vs product showcase",
      "Video vs static image",
      "Strong CTA vs weak CTA"
    ],
    "recommendations": [
      "Usar más contenido UGC",
      "Implementar CTAs más fuertes",
      "Evitar miedo como atractivo emocional"
    ],
    "success_factors": [
      "Video content",
      "UGC approach",
      "Joy/trust emotional appeal"
    ],
    "failure_factors": [
      "Static images",
      "Fear-based messaging",
      "Weak CTAs"
    ],
    "insights": "El análisis muestra que el contenido video con UGC y CTAs fuertes..."
  },
  "generated_at": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Configuración del Workflow

### Cron Schedule

El workflow se ejecuta automáticamente cada lunes a las 00:00.

Para cambiar la frecuencia, edita el nodo **Cron Trigger**:
```json
{
  "rule": {
    "interval": [
      {
        "field": "cronExpression",
        "expression": "0 0 * * 1"  // Lunes a las 00:00
      }
    ]
  }
}
```

### Consulta de Rankings

El workflow obtiene datos de dos fuentes:

#### Query Top 10
```sql
SELECT 
  ar.ad_id,
  ar.ad_name,
  ar.creative_url,
  ar.headline,
  ar.copy,
  ar.ctr,
  ar.roas,
  ar.cpa,
  c.content_type,
  c.emotional_appeal,
  c.target_audience,
  c.callouts,
  c.creative_approach,
  c.cta_strength
FROM ad_rankings ar
LEFT JOIN classifications c ON ar.ad_id = c.ad_id
WHERE ar.week_iso = 'YYYY-Www'
  AND ar.ranking_type = 'top10'
ORDER BY ar.ranking_position
LIMIT 10
```

#### Query Bottom 10
Similar pero con `ranking_type = 'bottom10'`

### Prompt de Análisis

El workflow usa el prompt "Analiza dos grupos de anuncios..." que solicita:

1. **recurring_patterns_top**: Patrones comunes en TOP 10
   - Tipos de contenido más frecuentes
   - Atractivos emocionales que funcionan
   - Enfoques creativos exitosos
   - Fortalezas de CTA
   - Audiencias objetivo
   - Elementos destacados (callouts) recurrentes

2. **recurring_patterns_bottom**: Patrones comunes en BOTTOM 10
   - Tipos de contenido menos efectivos
   - Atractivos emocionales que no funcionan
   - Enfoques creativos problemáticos
   - Debilidades de CTA
   - Audiencias objetivo
   - Elementos destacados recurrentes

3. **hypothesized_drivers**: Factores hipotéticos que explican la diferencia
   - Factores clave que diferencian top de bottom
   - Recomendaciones para mejorar ads de bajo rendimiento
   - Insights sobre qué funciona y qué no
   - Correlaciones entre métricas y clasificaciones

### Guardado en Supabase

Los resultados se guardan en la tabla `patterns` con:
- `week_iso`: Semana analizada
- `analysis_date`: Fecha del análisis
- `recurring_patterns_top`: JSONB con patrones del top10
- `recurring_patterns_bottom`: JSONB con patrones del bottom10
- `hypothesized_drivers`: JSONB con factores hipotéticos
- `top10_ads`: JSONB con datos completos del top10
- `bottom10_ads`: JSONB con datos completos del bottom10
- `model_used`: Modelo usado (gpt-4o-mini)
- `analysis_metadata`: Metadata adicional

## 📊 Estructura de Datos

### Tabla: `patterns`

```sql
CREATE TABLE patterns (
  id uuid PRIMARY KEY,
  week_iso text,
  analysis_date date NOT NULL DEFAULT CURRENT_DATE,
  recurring_patterns_top jsonb DEFAULT '{}'::jsonb,
  recurring_patterns_bottom jsonb DEFAULT '{}'::jsonb,
  hypothesized_drivers jsonb DEFAULT '{}'::jsonb,
  top10_ads jsonb DEFAULT '[]'::jsonb,
  bottom10_ads jsonb DEFAULT '[]'::jsonb,
  model_used text DEFAULT 'gpt-4o-mini',
  analysis_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

## 🧪 Testing

### Test Manual
1. Desactiva el **Cron Trigger**
2. Haz clic en **Execute Workflow**
3. Revisa los resultados en cada nodo:
   - Query Top 10 debe devolver 10 ads con clasificaciones
   - Query Bottom 10 debe devolver 10 ads con clasificaciones
   - OpenAI debe analizar y devolver patrones
   - Insert debe completarse sin errores

### Test HTTP Trigger

```bash
curl -X POST https://tu-n8n.com/webhook/pattern-detection \
  -H "Content-Type: application/json" \
  -d '{
    "week_iso": "2024-W03"
  }'
```

### Verificar Datos

```sql
-- Ver últimos análisis de patrones
SELECT week_iso, analysis_date, created_at
FROM patterns
ORDER BY analysis_date DESC, created_at DESC
LIMIT 10;

-- Ver patrones de una semana específica
SELECT 
  week_iso,
  recurring_patterns_top->>'summary' as top_summary,
  recurring_patterns_bottom->>'summary' as bottom_summary,
  hypothesized_drivers->>'insights' as insights
FROM patterns
WHERE week_iso = '2024-W03';

-- Ver factores clave identificados
SELECT 
  week_iso,
  jsonb_array_elements_text(hypothesized_drivers->'key_differentiators') as differentiator
FROM patterns
WHERE week_iso = '2024-W03';

-- Ver recomendaciones
SELECT 
  week_iso,
  jsonb_array_elements_text(hypothesized_drivers->'recommendations') as recommendation
FROM patterns
WHERE week_iso = '2024-W03';
```

## 🔍 Troubleshooting

### Error: "No data returned from Query Top 10"
- Verifica que existan rankings en `ad_rankings` para la semana especificada
- Verifica que los ads tengan clasificaciones en `classifications`
- Ejecuta primero el workflow `ads_benchmark` para generar rankings
- Ejecuta primero el workflow `classify_ads` para generar clasificaciones

### Error: "OpenAI API error"
- Verifica que `OPENAI_API_KEY` esté configurado
- Revisa que tengas créditos disponibles en OpenAI
- Verifica rate limits de OpenAI API
- El prompt puede ser largo con muchos ads, verifica límites de tokens

### Error: "JSON parse error"
- El workflow maneja diferentes formatos de respuesta
- Revisa los logs del nodo **Parse Patterns**
- Los valores por defecto se usan si falla el parseo

### Error: "No classifications found"
- Los ads deben tener clasificaciones en la tabla `classifications`
- Ejecuta primero el workflow `classify_ads` para clasificar los ads
- El LEFT JOIN permite que funcione sin clasificaciones, pero el análisis será menos preciso

### Análisis insuficiente
- Asegúrate de que top10 y bottom10 tengan datos completos
- Verifica que las clasificaciones estén completas
- Considera ajustar el prompt para obtener más detalles

## 📝 Personalización

### Cambiar semana analizada

Edita el nodo **Prepare Week ISO** o pasa `week_iso` en el webhook request.

### Personalizar prompt de análisis

Edita el nodo **OpenAI - Analyze Patterns** y modifica el contenido del prompt según tus necesidades específicas.

### Agregar más campos al análisis

1. Agrega campos a la tabla `patterns`
2. Actualiza el prompt para incluir nuevos campos
3. Actualiza el nodo **Parse Patterns** para extraer nuevos campos

### Cambiar temperatura del modelo

Edita el nodo **OpenAI - Analyze Patterns**:
```json
{
  "temperature": 0.5  // Cambiar a 0.3 para más consistencia, 0.7 para más creatividad
}
```

### Analizar diferentes períodos

Modifica las queries para obtener rankings de diferentes semanas o períodos.

## 🚨 Notas de Seguridad

- ⚠️ Protege tu `OPENAI_API_KEY`
- ✅ Usa variables de entorno para todos los secrets
- ✅ Monitorea costos de OpenAI API (pueden ser altos con análisis complejos)
- ✅ El prompt puede ser largo con muchos ads, considera límites de tokens

## 📚 Recursos

- [OpenAI API Docs](https://platform.openai.com/docs)
- [GPT-4o-mini Model](https://platform.openai.com/docs/models/gpt-4o-mini)
- [Supabase Postgres Docs](https://supabase.com/docs/guides/database)
- [n8n Docs](https://docs.n8n.io/)

## 📄 Archivos Incluidos

1. **n8n-workflow-pattern-detection.json** - Workflow principal
2. **patterns-table.sql** - SQL para crear tabla
3. **pattern-detection-README.md** - Esta documentación

## 💡 Tips

- Ejecuta primero `ads_benchmark` y `classify_ads` para tener datos completos
- Ejecuta el workflow manualmente primero para verificar configuración
- Monitorea los costos de OpenAI API (pueden ser altos con análisis complejos)
- Usa las vistas SQL incluidas para análisis rápido de patrones
- Compara patrones entre semanas para identificar tendencias
- Implementa alertas cuando se detecten patrones interesantes

## 🎯 Casos de Uso

- Análisis semanal de patrones en ads
- Identificación de factores de éxito y fracaso
- Generación de recomendaciones para optimización
- Benchmarking de enfoques creativos
- Insights para estrategia de contenido

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de OpenAI API

## 🔗 Dependencias

Este workflow depende de:
- **ads_benchmark**: Para generar rankings semanales (top10/bottom10)
- **classify_ads**: Para clasificar creativamente los ads

Asegúrate de ejecutar estos workflows primero para tener datos completos.

