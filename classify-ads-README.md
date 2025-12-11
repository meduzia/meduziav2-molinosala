# Workflow n8n: Classify Ads - Creative Classification

Workflow automatizado para clasificar creativamente anuncios de Meta Ads usando OpenAI GPT-4o-mini y guardar resultados en Supabase.

## 📋 Características

- ✅ Trigger Cron diario o HTTP manual
- ✅ Consulta ads de últimos 14 días desde Supabase
- ✅ Clasificación con OpenAI GPT-4o-mini
- ✅ Campos de clasificación: content_type, emotional_appeal, target_audience, callouts, creative_approach, cta_strength
- ✅ Guarda resultados en tabla `classifications`
- ✅ Evita duplicados (solo clasifica ads nuevos)

## 🚀 Instalación

### 1. Crear la tabla en Supabase

Ejecuta el SQL en Supabase SQL Editor:

```sql
-- Ver archivo: classifications-table.sql
```

O ejecuta el script directamente desde el archivo incluido.

### 2. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-classify-ads.json`
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
3. Usa para: Classify Ad

#### Supabase Postgres
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 5. Obtener Webhook URL (si usas HTTP trigger)

1. Activa el workflow
2. Copia la URL del webhook desde el nodo **HTTP Trigger**
3. Ejemplo: `https://tu-n8n.com/webhook/classify-ads`

## 📡 Uso del Webhook

### Request Format

```json
POST /webhook/classify-ads
Content-Type: application/json

{
  "force_reclassify": false  // Opcional: forzar reclasificación de todos los ads
}
```

### Parámetros (opcionales)

- **force_reclassify** (opcional): Si es `true`, reclasifica todos los ads incluso si ya tienen clasificación

### Response Format

```json
{
  "success": true,
  "message": "✅ Clasificación completada para 25 ads",
  "total_processed": 25,
  "total_inserted": 25,
  "date_range": "2024-01-01 to 2024-01-15",
  "processed_at": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Configuración del Workflow

### Cron Schedule

El workflow se ejecuta automáticamente cada 24 horas.

Para cambiar la frecuencia, edita el nodo **Cron Trigger**:
```json
{
  "rule": {
    "interval": [
      {
        "field": "hours",
        "hoursInterval": 24  // Cambiar a 12, 6, etc.
      }
    ]
  }
}
```

### Consulta de Ads

El nodo **Query Ads (Last 14 Days)** obtiene ads que:
- Tienen métricas en los últimos 14 días
- No tienen clasificación existente (evita duplicados)
- Limita a 100 ads por ejecución

**Query SQL:**
```sql
SELECT DISTINCT
  m.ad_id,
  a.ad_name,
  a.creative_url,
  a.permalink_url
FROM metrics_daily m
LEFT JOIN ads a ON m.ad_id = a.ad_id
WHERE m.date >= 'YYYY-MM-DD'
  AND m.date <= 'YYYY-MM-DD'
  AND m.ad_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM classifications c 
    WHERE c.ad_id = m.ad_id
  )
ORDER BY m.ad_id
LIMIT 100
```

### Clasificación con OpenAI

El nodo **OpenAI - Classify Ad** usa GPT-4o-mini con:
- **Temperature**: 0.3 (baja para respuestas consistentes)
- **Response Format**: JSON object
- **Prompt**: Instrucciones detalladas para clasificación creativa

### Campos de Clasificación

1. **content_type**: Tipo de contenido (image, video, carousel, etc.)
2. **emotional_appeal**: Atractivo emocional (fear, joy, trust, urgency, etc.)
3. **target_audience**: Audiencia objetivo (young_adults_18-24, professionals_25-34, etc.)
4. **callouts**: Array de elementos destacados (["50% off", "Free shipping", etc.])
5. **creative_approach**: Enfoque creativo (UGC, lifestyle, product_showcase, etc.)
6. **cta_strength**: Fuerza del CTA (strong, moderate, weak, none)

### Parseo de Respuesta

El nodo **Parse Classification** maneja diferentes formatos de respuesta de OpenAI:
- Respuestas en formato mensaje
- Respuestas en formato choices
- Respuestas directas JSON
- Valores por defecto si falla el parseo

### Guardado en Supabase

Los resultados se guardan en la tabla `classifications` con:
- Upsert por `ad_id` (evita duplicados)
- Metadata completa de la respuesta
- Timestamp de creación

## 📊 Estructura de Datos

### Tabla: `classifications`

```sql
CREATE TABLE classifications (
  id uuid PRIMARY KEY,
  ad_id text NOT NULL UNIQUE,
  ad_name text,
  creative_url text,
  permalink_url text,
  content_type text,
  emotional_appeal text,
  target_audience text,
  callouts jsonb DEFAULT '[]'::jsonb,
  creative_approach text,
  cta_strength text,
  classification_metadata jsonb DEFAULT '{}'::jsonb,
  model_used text DEFAULT 'gpt-4o-mini',
  confidence_score numeric(3,2),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

## 🧪 Testing

### Test Manual
1. Desactiva el **Cron Trigger**
2. Haz clic en **Execute Workflow**
3. Revisa los resultados en cada nodo:
   - Query Ads debe devolver lista de ads
   - OpenAI debe clasificar cada ad
   - Inserts deben completarse sin errores

### Test HTTP Trigger

```bash
curl -X POST https://tu-n8n.com/webhook/classify-ads \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Verificar Datos

```sql
-- Ver clasificaciones recientes
SELECT ad_id, ad_name, content_type, emotional_appeal, creative_approach, cta_strength
FROM classifications
ORDER BY created_at DESC
LIMIT 20;

-- Ver distribución de content_type
SELECT content_type, COUNT(*) as count
FROM classifications
WHERE content_type IS NOT NULL
GROUP BY content_type
ORDER BY count DESC;

-- Ver distribución de emotional_appeal
SELECT emotional_appeal, COUNT(*) as count
FROM classifications
WHERE emotional_appeal IS NOT NULL
GROUP BY emotional_appeal
ORDER BY count DESC;

-- Ver clasificaciones con métricas
SELECT * FROM v_classifications_with_metrics
ORDER BY created_at DESC
LIMIT 10;
```

## 🔍 Troubleshooting

### Error: "No data returned from Query Ads"
- Verifica que existan ads con métricas en los últimos 14 días
- Verifica que los ads tengan datos en la tabla `ads`
- Revisa que no todos los ads ya estén clasificados

### Error: "OpenAI API error"
- Verifica que `OPENAI_API_KEY` esté configurado
- Revisa que tengas créditos disponibles en OpenAI
- Verifica rate limits de OpenAI API

### Error: "JSON parse error"
- El workflow maneja diferentes formatos de respuesta
- Revisa los logs del nodo **Parse Classification**
- Los valores por defecto se usan si falla el parseo

### Error: "Duplicate key violation"
- El workflow usa upsert por `ad_id`
- Verifica que el índice único exista en la tabla
- Si necesitas reclasificar, elimina registros anteriores primero

### Clasificaciones incorrectas
- Ajusta el prompt en el nodo **OpenAI - Classify Ad**
- Cambia la temperatura si necesitas respuestas más creativas o consistentes
- Agrega más contexto al prompt (ej: datos de performance)

## 📝 Personalización

### Cambiar período de consulta

Edita el nodo **Prepare Dates**:
```javascript
fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14); // Cambiar a 7, 30, etc.
```

### Ajustar límite de ads

Edita el nodo **Query Ads**:
```sql
LIMIT 100  // Cambiar a 50, 200, etc.
```

### Personalizar prompt de clasificación

Edita el nodo **OpenAI - Classify Ad** y modifica el contenido del prompt según tus necesidades específicas.

### Agregar más campos de clasificación

1. Agrega campos a la tabla `classifications`
2. Actualiza el prompt para incluir nuevos campos
3. Actualiza el nodo **Parse Classification** para extraer nuevos campos

### Forzar reclasificación

Modifica el nodo **Query Ads** para eliminar la condición `NOT EXISTS`:
```sql
-- Eliminar esta línea para reclasificar todos:
-- AND NOT EXISTS (SELECT 1 FROM classifications c WHERE c.ad_id = m.ad_id)
```

## 🚨 Notas de Seguridad

- ⚠️ Protege tu `OPENAI_API_KEY`
- ✅ Usa variables de entorno para todos los secrets
- ✅ Monitorea costos de OpenAI API (pueden ser altos con muchos ads)
- ✅ Limita el número de ads procesados por ejecución

## 📚 Recursos

- [OpenAI API Docs](https://platform.openai.com/docs)
- [GPT-4o-mini Model](https://platform.openai.com/docs/models/gpt-4o-mini)
- [Supabase Postgres Docs](https://supabase.com/docs/guides/database)
- [n8n Docs](https://docs.n8n.io/)

## 📄 Archivos Incluidos

1. **n8n-workflow-classify-ads.json** - Workflow principal
2. **classifications-table.sql** - SQL para crear tabla
3. **classify-ads-README.md** - Esta documentación

## 💡 Tips

- Ejecuta el workflow manualmente primero para verificar configuración
- Monitorea los costos de OpenAI API (GPT-4o-mini es económico pero puede acumularse)
- Considera procesar en lotes más pequeños si tienes muchos ads
- Usa las vistas SQL incluidas para análisis rápido de clasificaciones
- Implementa alertas cuando se detecten patrones interesantes en las clasificaciones

## 🎯 Casos de Uso

- Análisis automático de creatividad de ads
- Identificación de patrones en contenido publicitario
- Segmentación de audiencias basada en clasificaciones
- Optimización de creativos basada en clasificaciones
- Benchmarking de enfoques creativos

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de OpenAI API

