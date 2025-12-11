# Workflow n8n: Ads Benchmark - Weekly Rankings

Workflow automatizado para calcular rankings semanales de ads basados en CTR, ROAS y CPA, y guardar snapshots en Supabase.

## 📋 Características

- ✅ Trigger Cron semanal (lunes a las 00:00) o HTTP manual
- ✅ Consulta datos desde `metrics_daily` de Supabase
- ✅ Calcula métricas agregadas: CTR promedio, ROAS promedio, CPA promedio
- ✅ Ordena por CTR descendente
- ✅ Genera arrays JSON con top10 y bottom10
- ✅ Incluye: ad_id, creative_url, copy, headline, métricas completas
- ✅ Guarda snapshot semanal en tabla `ad_rankings`

## 🚀 Instalación

### 1. Crear la tabla en Supabase

Ejecuta el SQL en Supabase SQL Editor:

```sql
-- Ver archivo: ad-rankings-table.sql
```

O ejecuta el script directamente desde el archivo incluido.

### 2. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-ads-benchmark.json`
4. Activa el workflow

### 3. Configurar Credenciales

#### Supabase Postgres
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 4. Obtener Webhook URL (si usas HTTP trigger)

1. Activa el workflow
2. Copia la URL del webhook desde el nodo **HTTP Trigger**
3. Ejemplo: `https://tu-n8n.com/webhook/ads-benchmark`

## 📡 Uso del Webhook

### Request Format

```json
POST /webhook/ads-benchmark
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
  "message": "✅ Rankings calculados y guardados para 2024-W03",
  "week_iso": "2024-W03",
  "snapshot_date": "2024-01-15",
  "top10": [
    {
      "ad_id": "ad_123456",
      "ad_name": "Product Launch - Special Offer",
      "creative_url": "https://example.com/image.jpg",
      "permalink_url": "https://example.com/ad",
      "headline": "Product Launch",
      "copy": "Special Offer",
      "ctr": 3.45,
      "roas": 4.2,
      "cpa": 12.50,
      "impressions": 50000,
      "clicks": 1725,
      "spend": 2500.00,
      "days_active": 7,
      "ranking_position": 1
    }
    // ... más ads hasta 10
  ],
  "bottom10": [
    {
      "ad_id": "ad_789012",
      "ad_name": "Test Ad - Low Performance",
      "creative_url": "https://example.com/image2.jpg",
      "headline": "Test Ad",
      "copy": "Low Performance",
      "ctr": 0.25,
      "roas": 0.8,
      "cpa": 125.00,
      "impressions": 1000,
      "clicks": 2,
      "spend": 100.00,
      "days_active": 3,
      "ranking_position": 1
    }
    // ... más ads hasta 10
  ],
  "total_ads": 150,
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

### Consulta de Métricas

El nodo **Query Metrics Daily** agrega métricas por semana:

```sql
SELECT 
  m.ad_id,
  a.ad_name,
  a.creative_url,
  a.permalink_url,
  AVG(m.ctr) as avg_ctr,
  AVG(m.roas) as avg_roas,
  AVG(m.cpa) as avg_cpa,
  SUM(m.impressions) as total_impressions,
  SUM(m.clicks) as total_clicks,
  SUM(m.spend) as total_spend,
  COUNT(DISTINCT m.date) as days_active
FROM metrics_daily m
LEFT JOIN ads a ON m.ad_id = a.ad_id
WHERE m.week_iso = 'YYYY-Www'
  AND m.impressions > 0
GROUP BY m.ad_id, a.ad_name, a.creative_url, a.permalink_url
HAVING SUM(m.impressions) >= 1000  -- Mínimo 1000 impresiones
ORDER BY AVG(m.ctr) DESC
```

**Filtros aplicados:**
- `impressions > 0`: Solo ads con impresiones
- `SUM(impressions) >= 1000`: Mínimo 1000 impresiones totales en la semana

### Enriquecimiento de Copy/Headline

El nodo **Enrich with Copy/Headline** extrae headline y copy desde `ad_name`:

- **Headline**: Primera parte antes de ` - ` o primeros 30 caracteres
- **Copy**: Resto después de ` - ` o desde el carácter 30

**Nota**: Si necesitas obtener headline y copy desde Meta API, puedes agregar un nodo HTTP Request después de **Query Metrics Daily** para obtener datos adicionales de cada ad.

### Cálculo de Rankings

El nodo **Calculate Rankings**:
1. Ordena todos los ads por CTR descendente
2. Toma los primeros 10 para `top10`
3. Toma los últimos 10 para `bottom10` (invertidos)

### Guardado de Snapshots

Los rankings se guardan en la tabla `ad_rankings` con:
- `week_iso`: Semana ISO analizada
- `snapshot_date`: Fecha del snapshot
- `ranking_type`: `'top10'` o `'bottom10'`
- `ranking_position`: Posición en el ranking (1-10)
- Todas las métricas y metadata

## 📊 Estructura de Datos

### Tabla: `ad_rankings`

```sql
CREATE TABLE ad_rankings (
  id uuid PRIMARY KEY,
  week_iso text NOT NULL,
  snapshot_date date NOT NULL,
  ranking_type text NOT NULL CHECK (ranking_type IN ('top10', 'bottom10')),
  ad_id text NOT NULL,
  ad_name text,
  creative_url text,
  permalink_url text,
  headline text,
  copy text,
  ctr numeric(5,2),
  roas numeric(10,2),
  cpa numeric(10,2),
  impressions integer,
  clicks integer,
  spend numeric(10,2),
  conversions integer,
  ranking_position integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índice único para evitar duplicados
CREATE UNIQUE INDEX ad_rankings_unique_snapshot 
ON ad_rankings(week_iso, ranking_type, ranking_position);
```

## 🧪 Testing

### Test Manual
1. Desactiva el **Cron Trigger**
2. Haz clic en **Execute Workflow**
3. Revisa los resultados en cada nodo:
   - Query Metrics Daily debe devolver ads con métricas
   - Calculate Rankings debe generar top10 y bottom10
   - Inserts deben completarse sin errores

### Test HTTP Trigger

```bash
curl -X POST https://tu-n8n.com/webhook/ads-benchmark \
  -H "Content-Type: application/json" \
  -d '{
    "week_iso": "2024-W03"
  }'
```

### Verificar Datos

```sql
-- Ver últimos rankings
SELECT week_iso, ranking_type, ad_id, ad_name, ctr, roas, cpa, ranking_position
FROM ad_rankings
ORDER BY week_iso DESC, ranking_type, ranking_position
LIMIT 20;

-- Ver top10 de la semana actual
SELECT * FROM ad_rankings
WHERE ranking_type = 'top10'
  AND week_iso = '2024-W03'
ORDER BY ranking_position;

-- Ver comparación top10 vs bottom10
SELECT 
  week_iso,
  ranking_type,
  AVG(ctr) as avg_ctr,
  AVG(roas) as avg_roas,
  AVG(cpa) as avg_cpa
FROM ad_rankings
WHERE week_iso = '2024-W03'
GROUP BY week_iso, ranking_type;
```

## 🔍 Troubleshooting

### Error: "No data returned from Query Metrics Daily"
- Verifica que existan datos en `metrics_daily` para la semana especificada
- Verifica que los ads tengan `week_iso` correctamente calculado
- Revisa el filtro de mínimo de impresiones (1000 por defecto)

### Error: "Column headline does not exist"
- El workflow extrae headline y copy desde `ad_name`
- Si necesitas campos adicionales, modifica el nodo **Enrich with Copy/Headline**
- O agrega un nodo para obtener datos desde Meta API

### Error: "Duplicate key violation"
- El workflow usa upsert implícito con índice único
- Verifica que no exista ya un snapshot para la misma semana y ranking_type
- Si necesitas sobrescribir, elimina registros anteriores primero

### Top10/Bottom10 vacíos
- Verifica que haya al menos 10 ads en la consulta
- Ajusta el filtro de mínimo de impresiones si es muy restrictivo
- Revisa que la semana ISO sea correcta

## 📝 Personalización

### Cambiar mínimo de impresiones

Edita el nodo **Query Metrics Daily**:
```sql
HAVING SUM(m.impressions) >= 1000  -- Cambiar a 500, 2000, etc.
```

### Agregar más métricas

Edita el nodo **Calculate Rankings** y agrega campos adicionales al objeto de retorno.

### Obtener headline/copy desde Meta API

Agrega un nodo HTTP Request después de **Query Metrics Daily** para obtener datos adicionales de cada ad desde Meta Graph API.

### Cambiar ordenamiento

Edita el nodo **Calculate Rankings** y cambia el criterio de ordenamiento:
```javascript
// Ordenar por ROAS en lugar de CTR
const sorted = items.sort((a, b) => {
  const roasA = parseFloat(a.json.avg_roas || 0);
  const roasB = parseFloat(b.json.avg_roas || 0);
  return roasB - roasA;
});
```

## 🚨 Notas de Seguridad

- ⚠️ Protege tus credenciales de Supabase
- ✅ Usa variables de entorno para conexiones sensibles
- ✅ Valida inputs del webhook antes de procesar

## 📚 Recursos

- [ISO 8601 Week Date](https://en.wikipedia.org/wiki/ISO_8601#Week_dates)
- [Supabase Postgres Docs](https://supabase.com/docs/guides/database)
- [n8n Docs](https://docs.n8n.io/)

## 📄 Archivos Incluidos

1. **n8n-workflow-ads-benchmark.json** - Workflow principal
2. **ad-rankings-table.sql** - SQL para crear tabla
3. **ads-benchmark-README.md** - Esta documentación

## 💡 Tips

- Ejecuta el workflow manualmente primero para verificar configuración
- Usa las vistas SQL incluidas para análisis rápido de rankings
- Compara rankings entre semanas para identificar tendencias
- Implementa alertas cuando ads bajen del top10 o suban del bottom10

## 🎯 Casos de Uso

- Análisis semanal de performance de ads
- Identificación de ads ganadores y perdedores
- Benchmarking de CTR, ROAS y CPA
- Tendencias históricas de rankings
- Insights para optimización de campañas

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de Supabase

