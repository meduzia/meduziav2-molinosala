# Workflow n8n: Meta Ads Sync - Full Data

Workflow automatizado para sincronizar datos completos de Meta Ads desde Graph API hacia Supabase.

## 📋 Características

- ✅ Trigger Cron cada 6 horas o HTTP manual
- ✅ Llamadas a Meta Graph API `/ads` y `/insights`
- ✅ Campos completos: ad_id, ad_name, adset_id, campaign_id, impressions, clicks, spend, ctr, cpc, cpa, roas, creative_url, permalink_url, created_time, updated_time
- ✅ Procesamiento en lotes (SplitInBatches) para manejar grandes volúmenes
- ✅ Upsert inteligente en tablas `ads` y `metrics_daily`
- ✅ Normalización de fechas a UTC
- ✅ Cálculo automático de `week_iso` (ISO 8601)

## 🚀 Instalación

### 1. Crear las tablas en Supabase

Ejecuta el SQL en Supabase SQL Editor:

```sql
-- Ver archivo: meta-ads-sync-tables.sql
```

O ejecuta el script directamente desde el archivo incluido.

### 2. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-meta-ads-sync.json`
4. Activa el workflow

### 3. Configurar Variables de Entorno

En n8n, ve a **Settings** → **Variables** y agrega:

```env
# Meta Graph API
META_ACCOUNT_ID=tu_account_id_de_meta
META_ACCESS_TOKEN=tu_access_token_de_meta

# Revenue por conversión (para calcular ROAS)
REVENUE_PER_CONVERSION=200

# Supabase (usar credenciales de conexión directa Postgres)
# Configurar en credenciales de n8n como Postgres connection
```

### 4. Configurar Credenciales

#### Supabase Postgres
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 5. Obtener Credenciales de Meta

#### Access Token
1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Crea una nueva app o usa una existente
3. Agrega el producto **Marketing API**
4. Obtén un **User Access Token** o **System User Token**
5. Para producción, crea un **Long-lived Token**

#### Account ID
1. Ve a [Meta Ads Manager](https://business.facebook.com/adsmanager)
2. El Account ID está en la URL: `https://business.facebook.com/adsmanager/manage/campaigns?act=ACCOUNT_ID`

### 6. Obtener Webhook URL (si usas HTTP trigger)

1. Activa el workflow
2. Copia la URL del webhook desde el nodo **HTTP Trigger**
3. Ejemplo: `https://tu-n8n.com/webhook/meta-ads-sync`

## 📡 Uso del Webhook

### Request Format

```json
POST /webhook/meta-ads-sync
Content-Type: application/json

{
  "from_date": "2024-01-08",
  "to_date": "2024-01-15"
}
```

### Parámetros (opcionales)

- **from_date** (opcional): Fecha inicio (YYYY-MM-DD). Default: 7 días atrás
- **to_date** (opcional): Fecha fin (YYYY-MM-DD). Default: hoy

### Response Format

```json
{
  "success": true,
  "message": "✅ Sync completed successfully",
  "account_id": "act_123456789",
  "period": "2024-01-08 to 2024-01-15",
  "total_ads": 150,
  "total_metrics_records": 1050,
  "synced_at": "2024-01-15T10:30:00.000Z"
}
```

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

### Meta Graph API Calls

#### GET /ads
Obtiene información de los anuncios:
- `id`, `name`, `adset_id`, `campaign_id`
- `creative{thumbnail_url}`, `permalink_url`
- `created_time`, `updated_time`

#### GET /insights
Obtiene métricas de performance:
- `impressions`, `clicks`, `spend`
- `ctr`, `cpc`, `cpa`
- `actions` (conversiones)

### Procesamiento en Lotes

El workflow usa **SplitInBatches** con tamaño de lote de 50 ads por defecto.

**Ajustar tamaño de lote**: Edita el nodo **Split Ads Batch**:
```json
{
  "batchSize": 50  // Cambiar según necesidad
}
```

### Transformación de Datos

El nodo **Transform Data** realiza:
- Normalización de fechas a UTC
- Cálculo de `week_iso` (ISO 8601 format: YYYY-Www)
- Extracción de conversiones desde `actions`
- Cálculo de `cpa` y `roas`

### Upsert Logic

- **Tabla `ads`**: Upsert por `ad_id` (único)
- **Tabla `metrics_daily`**: Upsert por `(ad_id, date)` (único)

El workflow usa `INSERT ... ON CONFLICT DO UPDATE` para actualizar registros existentes.

### Week ISO Calculation

El cálculo de `week_iso` sigue el estándar ISO 8601:
- Formato: `YYYY-Www` (ej: `2024-W03`)
- La semana ISO empieza el lunes
- La primera semana del año es la que contiene el 4 de enero

## 📊 Estructura de Datos

### Tabla: `ads`

```sql
CREATE TABLE ads (
  id uuid PRIMARY KEY,
  ad_id text NOT NULL UNIQUE,
  ad_name text NOT NULL,
  adset_id text,
  campaign_id text,
  creative_url text,
  permalink_url text,
  created_time timestamp with time zone,
  updated_time timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);
```

### Tabla: `metrics_daily`

```sql
CREATE TABLE metrics_daily (
  id uuid PRIMARY KEY,
  ad_id text NOT NULL,
  date date NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend numeric(10,2) DEFAULT 0,
  ctr numeric(5,2) DEFAULT 0,
  cpc numeric(10,2) DEFAULT 0,
  cpa numeric(10,2) DEFAULT 0,
  roas numeric(10,2) DEFAULT 0,
  week_iso text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Índice único para upsert
CREATE UNIQUE INDEX metrics_daily_ad_id_date_unique 
ON metrics_daily(ad_id, date);
```

## 🧪 Testing

### Test Manual
1. Desactiva el **Cron Trigger**
2. Haz clic en **Execute Workflow**
3. Revisa los resultados en cada nodo:
   - Get Ads debe devolver lista de ads
   - Get Insights debe devolver métricas
   - Upserts deben completarse sin errores

### Test HTTP Trigger

```bash
curl -X POST https://tu-n8n.com/webhook/meta-ads-sync \
  -H "Content-Type: application/json" \
  -d '{
    "from_date": "2024-01-08",
    "to_date": "2024-01-15"
  }'
```

### Verificar Datos

```sql
-- Ver ads sincronizados
SELECT ad_id, ad_name, adset_id, campaign_id, created_time, updated_time
FROM ads
ORDER BY updated_time DESC
LIMIT 20;

-- Ver métricas diarias
SELECT ad_id, date, impressions, clicks, spend, ctr, cpc, cpa, roas, week_iso
FROM metrics_daily
ORDER BY date DESC, ad_id
LIMIT 20;

-- Ver métricas por semana
SELECT week_iso, COUNT(*) as records, SUM(impressions) as total_impressions, SUM(spend) as total_spend
FROM metrics_daily
WHERE week_iso IS NOT NULL
GROUP BY week_iso
ORDER BY week_iso DESC;

-- Verificar duplicados (no debería haber)
SELECT ad_id, date, COUNT(*) 
FROM metrics_daily 
GROUP BY ad_id, date 
HAVING COUNT(*) > 1;
```

## 🔍 Troubleshooting

### Error: "META_ACCOUNT_ID y META_ACCESS_TOKEN deben estar configurados"
- Verifica que las variables de entorno estén configuradas
- Revisa que los valores sean correctos

### Error: "Invalid OAuth access token"
- Verifica que el token tenga permisos `ads_read`
- Regenera el token si es necesario
- Verifica que el token no haya expirado

### Error: "Rate limit exceeded"
- Meta limita requests a 200 por hora por app
- El workflow procesa en lotes para evitar rate limits
- Considera aumentar el tamaño del lote o reducir frecuencia

### Error: "No data returned from Meta API"
- Verifica que existan ads activos en el account
- Revisa que el rango de fechas sea correcto
- Verifica permisos del Access Token

### Error: "Duplicate key violation"
- El workflow usa upsert, pero verifica que los índices únicos existan
- Verifica que `ad_id` sea único en `ads`
- Verifica que `(ad_id, date)` sea único en `metrics_daily`

### Week ISO incorrecto
- El cálculo sigue ISO 8601
- Verifica que las fechas estén normalizadas a UTC
- Revisa la función `getWeekISO` en el código

## 📝 Personalización

### Cambiar período por defecto

Edita el nodo **Prepare Params**:
```javascript
fromDate.setDate(fromDate.getDate() - 7); // Cambiar a 14, 30, etc.
```

### Ajustar tamaño de lote

Edita el nodo **Split Ads Batch**:
```json
{
  "batchSize": 50  // Cambiar según necesidad
}
```

### Cambiar revenue por conversión

Configura variable de entorno:
```env
REVENUE_PER_CONVERSION=200  // Cambiar según tu modelo
```

### Agregar más campos de Meta API

Edita los nodos **Get Ads** y **Get Insights** y agrega campos adicionales en `fields`.

### Implementar paginación completa

Para manejar paginación completa de Meta API, agrega un loop después de **Get Ads** que procese `paging.next` hasta completar todos los ads.

## 🚨 Notas de Seguridad

- ⚠️ Protege tu `META_ACCESS_TOKEN`
- ✅ Usa variables de entorno para todos los secrets
- ✅ Rota tokens periódicamente
- ✅ Usa System User Tokens en producción (no User Tokens)
- ✅ Limita permisos de API al mínimo necesario

## 📚 Recursos

- [Meta Marketing API Docs](https://developers.facebook.com/docs/marketing-apis)
- [Meta Insights API Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group/insights)
- [ISO 8601 Week Date](https://en.wikipedia.org/wiki/ISO_8601#Week_dates)
- [Supabase Postgres Docs](https://supabase.com/docs/guides/database)

## 📄 Archivos Incluidos

1. **n8n-workflow-meta-ads-sync.json** - Workflow principal
2. **meta-ads-sync-tables.sql** - SQL para crear tablas
3. **meta-ads-sync-README.md** - Esta documentación

## 💡 Tips

- Ejecuta el workflow manualmente primero para verificar configuración
- Monitorea los rate limits de Meta API
- Considera ajustar el tamaño del lote según tu volumen de ads
- Usa las vistas SQL incluidas para análisis rápido
- Implementa alertas cuando se detecten errores de sincronización

## 🎯 Casos de Uso

- Sincronización periódica de datos de Meta Ads
- Migración de datos históricos
- Actualización de métricas en tiempo real
- Integración con dashboards y reportes
- Análisis de performance por semana (week_iso)

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de Meta Marketing API

