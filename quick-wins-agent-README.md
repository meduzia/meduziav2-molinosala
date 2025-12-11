# Workflow n8n: Quick Wins Agent - SQL Query

Workflow automatizado que convierte preguntas en lenguaje natural a consultas SQL, las ejecuta en Supabase y devuelve resultados con respuestas naturales. Conectable a Slack o dashboard.

## 📋 Características

- ✅ HTTP Trigger para consultas bajo demanda
- ✅ Input: texto de usuario en lenguaje natural (ej: "Top ads últimos 7 días")
- ✅ Generación de SQL con OpenAI GPT-4o-mini
- ✅ Validación de seguridad (solo SELECT, sin operaciones peligrosas)
- ✅ Ejecución en Supabase Postgres
- ✅ Respuesta natural generada con LLM
- ✅ Devuelve tabla completa y respuesta natural
- ✅ Opcional: envía respuesta a Slack si se proporciona channel

## 🚀 Instalación

### 1. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-quick-wins-agent.json`
4. Activa el workflow

### 2. Configurar Variables de Entorno

En n8n, ve a **Settings** → **Variables** y agrega:

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Slack (opcional, solo si quieres enviar a Slack)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Supabase (usar credenciales de conexión directa Postgres)
# Configurar en credenciales de n8n como Postgres connection
```

### 3. Configurar Credenciales

#### OpenAI API
1. En n8n, crea credenciales **OpenAI API**
2. Configura con tu API key
3. Usa para: Generate SQL y Natural Response

#### Supabase Postgres
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### Slack Webhook (Opcional)
1. Ve a [Slack Apps](https://api.slack.com/apps)
2. Crea una nueva app o usa una existente
3. Ve a **Incoming Webhooks** y activa webhooks
4. Crea un nuevo webhook y copia la URL
5. Configura `SLACK_WEBHOOK_URL` en variables de entorno

### 4. Obtener Webhook URL

1. Activa el workflow
2. Copia la URL del webhook desde el nodo **HTTP Trigger**
3. Ejemplo: `https://tu-n8n.com/webhook/quick-wins-agent`

## 📡 Uso del Webhook

### Request Format

```json
POST /webhook/quick-wins-agent
Content-Type: application/json

{
  "query": "Top ads últimos 7 días",
  "user_id": "user_123",
  "channel": "#analytics"  // Opcional: para enviar respuesta a Slack
}
```

### Parámetros

- **query** (requerido): Pregunta en lenguaje natural
- **user_id** (opcional): ID del usuario que hace la consulta
- **channel** (opcional): Canal de Slack donde enviar respuesta

### Response Format

```json
{
  "success": true,
  "query": "Top ads últimos 7 días",
  "sql_query": "SELECT ad_id, ad_name, SUM(impressions) as total_impressions, SUM(clicks) as total_clicks, AVG(ctr) as avg_ctr FROM metrics_daily WHERE date >= CURRENT_DATE - INTERVAL '7 days' GROUP BY ad_id, ad_name ORDER BY total_impressions DESC LIMIT 100",
  "natural_response": "En los últimos 7 días, los top ads por impresiones son: 'Product Launch Campaign' con 125,000 impresiones y CTR promedio de 3.2%, seguido de 'Spring Sale' con 98,000 impresiones y CTR de 2.8%...",
  "results": [
    {
      "ad_id": "ad_123",
      "ad_name": "Product Launch Campaign",
      "total_impressions": 125000,
      "total_clicks": 4000,
      "avg_ctr": 3.2
    }
    // ... más resultados
  ],
  "total_rows": 25,
  "columns": ["ad_id", "ad_name", "total_impressions", "total_clicks", "avg_ctr"],
  "executed_at": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Ejemplos de Consultas

### Consultas Soportadas

El agente puede responder preguntas como:

- "Top ads últimos 7 días"
- "¿Cuáles son los ads con mejor ROAS esta semana?"
- "Muestra los briefs aprobados"
- "Ads con CTR mayor a 3%"
- "Resumen de métricas de la semana pasada"
- "¿Qué clasificaciones tienen los ads del top 10?"
- "Patrones detectados en la última semana"
- "Briefs creados en los últimos 3 días"
- "Comparar CTR promedio entre top10 y bottom10"

### Tablas Disponibles

El agente conoce estas tablas:

- **ads**: Información de anuncios
- **metrics_daily**: Métricas diarias por ad
- **ad_rankings**: Rankings semanales (top10/bottom10)
- **classifications**: Clasificaciones creativas de ads
- **briefs**: Briefs creativos generados
- **patterns**: Patrones detectados en análisis

## 🔒 Seguridad

### Validaciones Implementadas

1. **Solo SELECT**: Solo permite consultas SELECT, bloquea DROP, DELETE, UPDATE, INSERT, etc.
2. **Límite automático**: Si no hay LIMIT, agrega automáticamente LIMIT 100
3. **Validación de SQL**: Verifica que el SQL generado sea válido antes de ejecutar
4. **Sanitización**: Limpia el SQL de markdown y explicaciones adicionales

### Operaciones Bloqueadas

- `DROP`, `DELETE`, `UPDATE`, `INSERT`, `TRUNCATE`
- `ALTER`, `CREATE`, `EXEC`, `EXECUTE`
- Cualquier operación que modifique datos

## 🧪 Testing

### Test con cURL

```bash
curl -X POST https://tu-n8n.com/webhook/quick-wins-agent \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Top ads últimos 7 días",
    "user_id": "test_user"
  }'
```

### Test desde Dashboard

```javascript
// Ejemplo de integración en dashboard
const response = await fetch('https://tu-n8n.com/webhook/quick-wins-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Top ads últimos 7 días',
    user_id: currentUser.id
  })
});

const data = await response.json();
console.log(data.natural_response);
console.table(data.results);
```

### Test desde Slack

Configura un Slash Command en Slack que llame al webhook:

```json
{
  "query": "{{trigger_word}} {{text}}",
  "channel": "{{channel}}",
  "user_id": "{{user_id}}"
}
```

## 🔍 Troubleshooting

### Error: "Por favor proporciona una pregunta o consulta"
- Verifica que el campo `query` esté presente en el request
- Asegúrate de que el texto no esté vacío

### Error: "Operación no permitida"
- El agente solo permite consultas SELECT
- Verifica que la pregunta no solicite modificar datos
- Reformula la pregunta para ser una consulta de lectura

### Error: "SQL inválido generado"
- El LLM puede generar SQL incorrecto ocasionalmente
- Reformula la pregunta de manera más específica
- Ejemplo: "Top 10 ads por impresiones en los últimos 7 días" en lugar de "Top ads"

### Error: "No se encontraron resultados"
- Verifica que existan datos en las tablas consultadas
- Ajusta el rango de fechas o filtros en la pregunta
- Verifica que los nombres de tablas y columnas sean correctos

### SQL generado incorrecto
- Proporciona más contexto en la pregunta
- Especifica la tabla si es necesario (ej: "Top ads desde metrics_daily")
- Usa términos específicos del esquema (ad_id, ad_name, etc.)

## 📝 Personalización

### Agregar más tablas al esquema

Edita el nodo **OpenAI - Generate SQL** y agrega información sobre nuevas tablas en el prompt del sistema.

### Ajustar límite de resultados

Edita el nodo **Parse SQL** y cambia el límite por defecto:
```javascript
sqlQuery = sqlQuery + ' LIMIT 100';  // Cambiar a 50, 200, etc.
```

### Personalizar respuesta natural

Edita el nodo **OpenAI - Natural Response** y ajusta el prompt según tus necesidades de formato.

### Agregar más validaciones

Edita el nodo **Parse SQL** y agrega validaciones adicionales según tus necesidades de seguridad.

### Integrar con más servicios

Puedes agregar nodos para:
- Enviar a Discord
- Guardar historial de consultas
- Enviar notificaciones
- Integrar con otros dashboards

## 🚨 Notas de Seguridad

- ⚠️ Protege tu `OPENAI_API_KEY`
- ✅ Usa variables de entorno para todos los secrets
- ✅ Revisa el SQL generado antes de ejecutar en producción
- ✅ Considera agregar rate limiting para evitar abuso
- ✅ Monitorea consultas ejecutadas para detectar patrones sospechosos
- ✅ Considera agregar autenticación al webhook

## 📚 Recursos

- [OpenAI API Docs](https://platform.openai.com/docs)
- [GPT-4o-mini Model](https://platform.openai.com/docs/models/gpt-4o-mini)
- [Supabase Postgres Docs](https://supabase.com/docs/guides/database)
- [n8n Docs](https://docs.n8n.io/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)

## 📄 Archivos Incluidos

1. **n8n-workflow-quick-wins-agent.json** - Workflow principal
2. **quick-wins-agent-README.md** - Esta documentación

## 💡 Tips

- Prueba con preguntas simples primero
- Sé específico en tus preguntas para mejores resultados
- El agente funciona mejor con preguntas directas
- Puedes hacer múltiples preguntas en una sesión
- Usa términos del dominio (ads, metrics, briefs) para mejores resultados

## 🎯 Casos de Uso

- Consultas rápidas desde Slack
- Integración en dashboard para queries naturales
- Análisis ad-hoc sin escribir SQL
- Demos y presentaciones
- Onboarding de usuarios no técnicos

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de OpenAI API

## 🔗 Integración con Dashboard

### Ejemplo React/Next.js

```typescript
// components/QuickWinsAgent.tsx
import { useState } from 'react';

export function QuickWinsAgent() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/quick-wins-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Pregunta: Top ads últimos 7 días"
      />
      <button onClick={handleQuery} disabled={loading}>
        {loading ? 'Consultando...' : 'Consultar'}
      </button>
      
      {result && (
        <div>
          <p>{result.natural_response}</p>
          <table>
            {/* Renderizar tabla de resultados */}
          </table>
        </div>
      )}
    </div>
  );
}
```

## 🔗 Integración con Slack

### Slash Command

1. Ve a [Slack Apps](https://api.slack.com/apps)
2. Crea un Slash Command (ej: `/query`)
3. Configura la URL del webhook de n8n
4. Formato: `{"query": "{{text}}", "channel": "{{channel}}", "user_id": "{{user_id}}"}`

El agente responderá directamente en el canal de Slack.

