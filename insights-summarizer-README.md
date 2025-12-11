# Workflow n8n: insights_summarizer

Workflow automatizado para analizar datos de performance de Meta Ads y generar insights accionables usando LLM.

## 📋 Características

- ✅ Trigger Cron cada 6 horas o HTTP manual
- ✅ Query a Supabase últimos 14 días agrupado por ad/ad_set/campaign
- ✅ LLM analiza y genera: winners, anomalías, oportunidades
- ✅ Detección de fatiga de CTR (>25% caída en 72h)
- ✅ Detección de CPA por encima del target
- ✅ Identificación de ángulos ganadores
- ✅ Insertar en tabla `insights` con evidence JSON
- ✅ Opcional: enviar resumen a Slack

## 🚀 Instalación

### 1. Crear la tabla insights en Supabase

Ejecuta el SQL en Supabase SQL Editor:

```sql
-- Ver archivo: insights-table.sql
```

O ejecuta el script directamente desde el archivo incluido.

### 2. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-insights-summarizer.json`
4. Activa el workflow

### 3. Configurar Variables de Entorno

En n8n, ve a **Settings** → **Variables** y agrega:

```env
# OpenAI para análisis LLM
OPENAI_API_KEY=sk-...

# Thresholds
CPA_TARGET=50
CTR_FATIGUE_THRESHOLD=25

# Slack (opcional)
SLACK_ENABLED=false
SLACK_CHANNEL=#insights

# Supabase (usar credenciales de conexión directa Postgres)
# Configurar en credenciales de n8n como Postgres connection
```

### 4. Configurar Credenciales

#### Supabase Postgres
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### OpenAI API
1. En el nodo **LLM Analyze**, configura:
   - Header: `Authorization: Bearer {{ $env.OPENAI_API_KEY }}`

#### Slack (Opcional)
1. Ve a [Slack Apps](https://api.slack.com/apps)
2. Crea una nueva app o usa una existente
3. Obtén el **Bot Token** (OAuth Token)
4. En n8n, crea credenciales **Slack API**
5. Configura `SLACK_ENABLED=true` para habilitar

### 5. Obtener Webhook URL (si usas HTTP trigger)

1. Activa el workflow
2. Copia la URL del webhook desde el nodo **HTTP Trigger**
3. Ejemplo: `https://tu-n8n.com/webhook/insights-summarizer`

## 🔧 Configuración del Workflow

### Cron Schedule

El workflow se ejecuta automáticamente cada 6 horas.

Para cambiar la frecuencia, edita el nodo **Cron Trigger**:
```json
{
  "rule": {
    "interval": [
      {
        "field": "hours",
        "hoursInterval": 6  // Cambiar a 12, 24, etc.
      }
    ]
  }
}
```

### Query a Supabase

El workflow consulta `ads_performance` de los últimos 14 días agrupando por:
- **ad**: Por `ad_id` individual
- **ad_set**: Por `campaign_name` (agrupado)
- **campaign**: Por `campaign_name` (agregado)

El query calcula:
- Totales: impressions, clicks, spend, conversions, revenue
- Promedios: CTR, CPA, ROAS
- Métricas de fatiga: CTR últimos 72h vs anteriores 72h

### LLM Analysis

El LLM analiza los datos y genera:

#### Winners
- Top performers por ROAS, CPA o CTR
- Identificados por nivel: ad, ad_set, campaign
- Incluye reasoning y métricas

#### Anomalies
- **CTR Fatigue**: Caída >25% en CTR en últimos 72h vs anteriores 72h
- **CPA Above Target**: CPA por encima del target configurado

#### Opportunities
- **Winning Angle**: Ángulos con mejor ROAS promedio
- **Underperforming Ad Set**: Ad sets con potencial de optimización

### Evidence JSON

Cada insight incluye un campo `evidence` con:
- Datos originales del ad/ad_set/campaign
- Métricas calculadas
- Contexto adicional para validación

### Slack Integration

Si `SLACK_ENABLED=true`, el workflow envía un resumen a Slack con:
- Contadores de winners, anomalies, opportunities
- Top 3 winners
- Critical anomalies
- Top opportunities

## 📊 Estructura de Datos

### Tabla: `insights`

```sql
CREATE TABLE insights (
  id uuid PRIMARY KEY,
  insight_type text NOT NULL,  -- 'winner', 'anomaly', 'opportunity'
  entity_type text,             -- 'ad', 'ad_set', 'campaign'
  entity_id text,
  entity_name text,
  metric text,
  value numeric(10,2),
  threshold numeric(10,2),
  change_percentage numeric(5,2),
  reasoning text,
  evidence jsonb,               -- JSON con datos de evidencia
  priority text,                 -- 'low', 'medium', 'high'
  anomaly_type text,             -- 'ctr_fatigue', 'cpa_above_target'
  opportunity_type text,         -- 'winning_angle', 'underperforming_ad_set'
  angle text,
  recommendation text,
  potential_impact text,
  generated_at timestamp,
  created_at timestamp,
  updated_at timestamp
);
```

## 🧪 Testing

### Test Manual
1. Desactiva el **Cron Trigger**
2. Haz clic en **Execute Workflow**
3. Revisa los resultados en cada nodo:
   - Query Supabase debe devolver datos
   - LLM debe generar insights estructurados
   - Insert debe completarse sin errores

### Test HTTP Trigger

```bash
curl -X POST https://tu-n8n.com/webhook/insights-summarizer \
  -H "Content-Type: application/json"
```

### Verificar Datos

```sql
-- Ver últimos insights generados
SELECT insight_type, entity_name, metric, value, priority, generated_at
FROM insights
ORDER BY generated_at DESC
LIMIT 20;

-- Ver winners recientes
SELECT entity_name, metric, value, reasoning
FROM insights
WHERE insight_type = 'winner'
ORDER BY generated_at DESC
LIMIT 10;

-- Ver anomalías críticas
SELECT entity_name, anomaly_type, metric, value, threshold, change_percentage
FROM insights
WHERE insight_type = 'anomaly'
  AND priority = 'high'
ORDER BY generated_at DESC;

-- Ver oportunidades de ángulos
SELECT angle, recommendation, potential_impact
FROM insights
WHERE insight_type = 'opportunity'
  AND opportunity_type = 'winning_angle'
ORDER BY generated_at DESC;
```

## 🔍 Troubleshooting

### Error: "No data returned from Supabase"
- Verifica que existan datos en `ads_performance` de los últimos 14 días
- Revisa la conexión a Supabase Postgres
- Verifica que el query SQL sea correcto

### Error: "LLM Analysis failed"
- Verifica que `OPENAI_API_KEY` esté configurado
- Revisa rate limits de OpenAI
- Verifica que el modelo esté disponible
- Los datos pueden ser muy grandes; considera limitar el tamaño del payload

### Error: "CTR Fatigue not detected"
- Verifica que existan datos de los últimos 72h
- Verifica que el cálculo de `ctr_last_72h` y `ctr_previous_72h` sea correcto
- Ajusta el threshold `CTR_FATIGUE_THRESHOLD` si es necesario

### Error: "Slack message failed"
- Verifica que `SLACK_ENABLED=true`
- Verifica credenciales de Slack API
- Verifica que el canal exista
- Revisa permisos del bot de Slack

### Insights no aparecen en Supabase
- Verifica credenciales de Postgres
- Revisa logs de ejecución en n8n
- Verifica que la tabla `insights` exista
- Comprueba permisos de inserción

## 📝 Personalización

### Cambiar período de análisis

Edita el nodo **Prepare Dates**:
```javascript
fromDate.setDate(fromDate.getDate() - 14);  // Cambiar a 7, 30, etc.
```

### Ajustar thresholds

Configura variables de entorno:
```env
CPA_TARGET=50          # Cambiar según tu objetivo
CTR_FATIGUE_THRESHOLD=25  # Cambiar según tu tolerancia
```

### Cambiar modelo LLM

Edita el nodo **LLM Analyze**:
```json
{
  "model": "gpt-4o-mini"  // Cambiar a "gpt-4", "gpt-3.5-turbo", etc.
}
```

### Personalizar prompt del LLM

Edita el nodo **LLM Analyze** y ajusta el contenido del prompt según tus necesidades.

### Agregar más tipos de insights

1. Actualiza el schema de la tabla `insights`
2. Modifica el prompt del LLM para incluir nuevos tipos
3. Actualiza el nodo **Prepare Insights** para manejar nuevos tipos

## 🚨 Notas de Seguridad

- ⚠️ Protege tu `OPENAI_API_KEY`
- ✅ Usa variables de entorno para todos los secrets
- ✅ Valida inputs antes de procesar
- ✅ Limita el tamaño de datos enviados al LLM
- ✅ Monitorea costos de OpenAI API

## 📚 Recursos

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Supabase Postgres Docs](https://supabase.com/docs/guides/database)
- [Slack API Docs](https://api.slack.com/)
- [n8n Docs](https://docs.n8n.io/)

## 📄 Archivos Incluidos

1. **n8n-workflow-insights-summarizer.json** - Workflow principal
2. **insights-table.sql** - SQL para crear tabla
3. **insights-summarizer-README.md** - Esta documentación

## 💡 Tips

- Ejecuta el workflow manualmente primero para verificar configuración
- Monitorea los costos de OpenAI API
- Considera agregar filtros adicionales en el query si tienes muchos datos
- Usa las vistas SQL incluidas para análisis rápido
- Implementa alertas cuando se detecten anomalías críticas

## 🎯 Casos de Uso

- Análisis automático periódico de performance
- Detección temprana de fatiga creativa
- Identificación de oportunidades de optimización
- Alertas proactivas de anomalías
- Reportes automatizados a equipos

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de cada servicio

