# Workflow n8n: Creative Brief Generator

Workflow automatizado para generar briefs creativos completos usando OpenAI GPT-4o-mini basado en patrones identificados, información del producto y aprendizajes históricos.

## 📋 Características

- ✅ HTTP Trigger para generación bajo demanda
- ✅ Inputs: patterns_json, product_page_summary, historical_learnings
- ✅ Generación con OpenAI GPT-4o-mini
- ✅ Output JSON con: concept_name, creative_theme, core_message, hook_variations, visual_treatment, ctas, performance_predictions
- ✅ Guarda resultados en tabla `briefs`

## 🚀 Instalación

### 1. Crear la tabla en Supabase

Ejecuta el SQL en Supabase SQL Editor:

```sql
-- Ver archivo: briefs-table.sql
```

O ejecuta el script directamente desde el archivo incluido.

### 2. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-creative-brief-generator.json`
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
3. Usa para: Generate Brief

#### Supabase Postgres
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 5. Obtener Webhook URL

1. Activa el workflow
2. Copia la URL del webhook desde el nodo **HTTP Trigger**
3. Ejemplo: `https://tu-n8n.com/webhook/creative-brief-generator`

## 📡 Uso del Webhook

### Request Format

```json
POST /webhook/creative-brief-generator
Content-Type: application/json

{
  "patterns_json": {
    "recurring_patterns_top": {
      "content_types": ["video", "carousel"],
      "emotional_appeals": ["joy", "trust"],
      "creative_approaches": ["UGC", "lifestyle"],
      "summary": "Los ads de alto rendimiento usan video con UGC..."
    },
    "recurring_patterns_bottom": {
      "content_types": ["single_image"],
      "emotional_appeals": ["fear"],
      "summary": "Los ads de bajo rendimiento usan imágenes estáticas..."
    },
    "hypothesized_drivers": {
      "key_differentiators": ["UGC vs product showcase", "Video vs static"],
      "recommendations": ["Usar más UGC", "Implementar CTAs fuertes"]
    }
  },
  "product_page_summary": "Producto premium de moda urbana dirigido a jóvenes adultos 18-34. Características: diseño moderno, materiales sostenibles, precio accesible. Valor principal: estilo y sostenibilidad.",
  "historical_learnings": "Las campañas anteriores muestran que el contenido UGC genera 3x más engagement. Los CTAs con urgencia ('Limited time') aumentan conversiones en 25%. El contenido video tiene mejor ROAS que imágenes estáticas."
}
```

### Parámetros

- **patterns_json** (opcional): JSON con patrones identificados desde `pattern_detection`
- **product_page_summary** (opcional): Resumen de la página del producto
- **historical_learnings** (opcional): Aprendizajes históricos de campañas anteriores

**Nota**: Al menos `patterns_json` o `product_page_summary` debe estar presente.

### Response Format

```json
{
  "success": true,
  "message": "✅ Brief creativo generado exitosamente: Joyful Urban Lifestyle",
  "brief_id": "550e8400-e29b-41d4-a716-446655440000",
  "concept_name": "Joyful Urban Lifestyle",
  "creative_theme": "Authentic moments of joy in everyday life",
  "core_message": "Descubre estilo urbano sostenible que refleja tu personalidad única. Cada pieza está diseñada para jóvenes que valoran la autenticidad y el impacto positivo.",
  "hook_variations": [
    {
      "hook": "Estilo que refleja quién eres",
      "rationale": "Aprovecha el deseo de autenticidad y expresión personal"
    },
    {
      "hook": "Moda sostenible que marca la diferencia",
      "rationale": "Resuena con valores de sostenibilidad del target"
    },
    {
      "hook": "Diseño moderno, precio accesible",
      "rationale": "Combina aspiracional con accesibilidad"
    }
  ],
  "visual_treatment": {
    "content_type": "video",
    "style": "Authentic UGC",
    "color_palette": ["#2C3E50", "#E74C3C", "#F39C12"],
    "composition": "Videos cortos de 15-30 segundos mostrando personas reales usando el producto en entornos urbanos naturales",
    "mood": "Joyful, authentic, aspirational",
    "key_elements": ["Diversidad de modelos", "Entornos urbanos reales", "Momentos espontáneos"]
  },
  "ctas": [
    {
      "cta_text": "Descubre tu estilo",
      "strength": "strong",
      "rationale": "Invita a explorar sin presión, alineado con valores de autenticidad"
    },
    {
      "cta_text": "Shop now - Limited time",
      "strength": "strong",
      "rationale": "Urgencia comprobada que aumenta conversiones según aprendizajes históricos"
    }
  ],
  "performance_predictions": {
    "expected_ctr_range": "2.5-4.0%",
    "expected_roas_range": "3.5-5.0",
    "confidence_level": "high",
    "key_success_factors": [
      "UGC auténtico genera mayor engagement",
      "Video format tiene mejor performance",
      "CTAs con urgencia aumentan conversiones"
    ],
    "potential_risks": [
      "Competencia alta en espacio de moda sostenible",
      "Necesidad de producción de video de calidad"
    ],
    "optimization_recommendations": [
      "Testear múltiples hooks en primeros días",
      "Monitorear CTR y ajustar según performance",
      "Iterar en CTAs basado en datos de conversión"
    ]
  },
  "status": "draft",
  "generated_at": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Configuración del Workflow

### Validación de Inputs

El nodo **Validate Input** valida que:
- Al menos `patterns_json` o `product_page_summary` esté presente
- `patterns_json` sea un JSON válido (si se proporciona como string)

### Generación con OpenAI

El nodo **OpenAI - Generate Brief** usa GPT-4o-mini con:
- **Temperature**: 0.7 (balance entre creatividad y consistencia)
- **Response Format**: JSON object
- **Prompt**: Instrucciones detalladas para generar brief completo

### Estructura del Brief Generado

1. **concept_name**: Nombre del concepto creativo
2. **creative_theme**: Tema creativo principal
3. **core_message**: Mensaje central (2-3 frases)
4. **hook_variations**: Array de hooks con rationales
5. **visual_treatment**: Objeto con tipo de contenido, estilo, paleta de colores, composición, mood, elementos clave
6. **ctas**: Array de CTAs con fuerza y rationale
7. **performance_predictions**: Objeto con rangos esperados, nivel de confianza, factores de éxito, riesgos, recomendaciones

### Guardado en Supabase

Los resultados se guardan en la tabla `briefs` con:
- Todos los campos del brief
- Inputs originales (`patterns_json`, `product_page_summary`, `historical_learnings`)
- Status inicial: `'draft'`
- Metadata completa

## 📊 Estructura de Datos

### Tabla: `briefs`

```sql
CREATE TABLE briefs (
  id uuid PRIMARY KEY,
  concept_name text NOT NULL,
  creative_theme text NOT NULL,
  core_message text NOT NULL,
  hook_variations jsonb DEFAULT '[]'::jsonb,
  visual_treatment jsonb DEFAULT '{}'::jsonb,
  ctas jsonb DEFAULT '[]'::jsonb,
  performance_predictions jsonb DEFAULT '{}'::jsonb,
  patterns_json jsonb DEFAULT '{}'::jsonb,
  product_page_summary text,
  historical_learnings text,
  model_used text DEFAULT 'gpt-4o-mini',
  brief_metadata jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'in_production', 'completed')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);
```

## 🧪 Testing

### Test Manual
1. Haz clic en **Execute Workflow**
2. Proporciona inputs de prueba
3. Revisa los resultados en cada nodo:
   - Validate Input debe validar correctamente
   - OpenAI debe generar brief completo
   - Insert debe completarse sin errores

### Test HTTP Trigger

```bash
curl -X POST https://tu-n8n.com/webhook/creative-brief-generator \
  -H "Content-Type: application/json" \
  -d '{
    "patterns_json": {
      "recurring_patterns_top": {
        "summary": "Los ads de alto rendimiento usan video con UGC"
      },
      "hypothesized_drivers": {
        "recommendations": ["Usar más UGC"]
      }
    },
    "product_page_summary": "Producto premium de moda urbana",
    "historical_learnings": "El contenido UGC genera 3x más engagement"
  }'
```

### Verificar Datos

```sql
-- Ver briefs recientes
SELECT 
  id,
  concept_name,
  creative_theme,
  core_message,
  status,
  created_at
FROM briefs
ORDER BY created_at DESC
LIMIT 10;

-- Ver hook variations de un brief
SELECT 
  concept_name,
  hook_variations
FROM briefs
WHERE id = 'uuid-del-brief';

-- Ver visual treatment
SELECT 
  concept_name,
  visual_treatment->>'content_type' as content_type,
  visual_treatment->>'style' as style,
  visual_treatment->'color_palette' as color_palette
FROM briefs
WHERE status = 'approved';

-- Ver performance predictions
SELECT 
  concept_name,
  performance_predictions->>'expected_ctr_range' as ctr_range,
  performance_predictions->>'expected_roas_range' as roas_range,
  performance_predictions->>'confidence_level' as confidence
FROM briefs
ORDER BY created_at DESC;
```

## 🔍 Troubleshooting

### Error: "Al menos patterns_json o product_page_summary debe estar presente"
- Proporciona al menos uno de estos campos en el request
- Verifica que el JSON esté bien formateado

### Error: "patterns_json debe ser un JSON válido"
- Si envías `patterns_json` como string, asegúrate de que sea JSON válido
- O envía `patterns_json` como objeto JSON directamente

### Error: "OpenAI API error"
- Verifica que `OPENAI_API_KEY` esté configurado
- Revisa que tengas créditos disponibles en OpenAI
- Verifica rate limits de OpenAI API

### Error: "La respuesta de OpenAI no contiene los campos requeridos"
- El prompt está diseñado para devolver campos específicos
- Revisa los logs del nodo **OpenAI - Generate Brief**
- Considera ajustar el prompt si es necesario

### Briefs genéricos o poco específicos
- Proporciona más contexto en `product_page_summary`
- Incluye `historical_learnings` más detallados
- Asegúrate de que `patterns_json` tenga información útil

## 📝 Personalización

### Ajustar temperatura del modelo

Edita el nodo **OpenAI - Generate Brief**:
```json
{
  "temperature": 0.7  // Cambiar a 0.5 para más consistencia, 0.9 para más creatividad
}
```

### Personalizar prompt

Edita el nodo **OpenAI - Generate Brief** y modifica el contenido del prompt según tus necesidades específicas.

### Agregar más campos al brief

1. Agrega campos a la tabla `briefs`
2. Actualiza el prompt para incluir nuevos campos
3. Actualiza el nodo **Parse Brief** para extraer nuevos campos

### Integrar con patterns de Supabase

Puedes agregar un nodo antes de **Validate Input** que obtenga `patterns_json` desde la tabla `patterns`:

```sql
SELECT 
  recurring_patterns_top,
  recurring_patterns_bottom,
  hypothesized_drivers
FROM patterns
WHERE week_iso = 'YYYY-Www'
ORDER BY created_at DESC
LIMIT 1
```

## 🚨 Notas de Seguridad

- ⚠️ Protege tu `OPENAI_API_KEY`
- ✅ Usa variables de entorno para todos los secrets
- ✅ Valida inputs del webhook antes de procesar
- ✅ Monitorea costos de OpenAI API

## 📚 Recursos

- [OpenAI API Docs](https://platform.openai.com/docs)
- [GPT-4o-mini Model](https://platform.openai.com/docs/models/gpt-4o-mini)
- [Supabase Postgres Docs](https://supabase.com/docs/guides/database)
- [n8n Docs](https://docs.n8n.io/)

## 📄 Archivos Incluidos

1. **n8n-workflow-creative-brief-generator.json** - Workflow principal
2. **briefs-table.sql** - SQL para crear tabla
3. **creative-brief-generator-README.md** - Esta documentación

## 💡 Tips

- Proporciona tanto `patterns_json` como `product_page_summary` para mejores resultados
- Incluye `historical_learnings` específicos para briefs más informados
- Usa briefs generados como punto de partida y refínalos según necesidad
- Compara briefs generados con diferentes inputs para ver variaciones
- Implementa un flujo de aprobación para briefs antes de usarlos

## 🎯 Casos de Uso

- Generación rápida de briefs creativos
- Briefs basados en datos y patrones identificados
- Escalamiento de creación de briefs
- Consistencia en briefs creativos
- Optimización basada en aprendizajes históricos

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de OpenAI API

## 🔗 Integración con Otros Workflows

Este workflow puede integrarse con:
- **pattern_detection**: Para obtener `patterns_json` automáticamente
- **creative_image_generate**: Para generar creativos basados en briefs
- **creative_video_generate**: Para generar videos basados en briefs

Puedes crear workflows que combinen estos flujos para automatizar completamente la generación de creativos.

