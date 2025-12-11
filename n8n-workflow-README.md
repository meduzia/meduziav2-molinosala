# Workflow n8n: Sincronización Meta Insights → Supabase

Este workflow de n8n sincroniza automáticamente los datos de Meta Insights (Facebook Ads) hacia Supabase.

## 📋 Características

- ✅ Sincronización automática cada hora
- ✅ Transformación de datos de Meta Insights al formato de Supabase
- ✅ Upsert inteligente (evita duplicados)
- ✅ Notificaciones opcionales vía Telegram
- ✅ Manejo de errores

## 🚀 Instalación

### 1. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona el archivo `n8n-workflow-meta-insights-supabase.json`

### 2. Configurar Variables de Entorno

En n8n, ve a **Settings** → **Variables** y agrega:

```env
# Meta/Facebook API
META_ACCOUNT_ID=tu_account_id_de_meta
META_APP_ID=tu_app_id_de_meta
META_APP_SECRET=tu_app_secret_de_meta
META_ACCESS_TOKEN=tu_access_token_de_meta

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu_service_role_key

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=tu_bot_token
TELEGRAM_CHAT_ID=tu_chat_id

# Revenue por conversión (opcional)
REVENUE_PER_CONVERSION=200
```

### 3. Obtener Credenciales de Meta

#### Paso 1: Crear App en Meta Developers
1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Crea una nueva app o usa una existente
3. Agrega el producto **Marketing API**
4. En **Settings** → **Basic**, copia:
   - **App ID**
   - **App Secret**

#### Paso 2: Obtener Access Token
1. Ve a **Tools** → **Graph API Explorer**
2. Selecciona tu app
3. Agrega los permisos:
   - `ads_read`
   - `ads_management`
   - `business_management`
4. Genera un **User Access Token** o **System User Token** (recomendado)
5. Para producción, crea un **Long-lived Token** o usa **App Access Token**

#### Paso 3: Obtener Account ID
1. Ve a [Meta Ads Manager](https://business.facebook.com/adsmanager)
2. El Account ID está en la URL: `https://business.facebook.com/adsmanager/manage/campaigns?act=ACCOUNT_ID`
3. O usa la API: `GET /me/adaccounts`

### 4. Configurar Credenciales en n8n

#### Meta OAuth2 (Workflow Principal)
1. En el nodo **Meta Insights API**, haz clic en **Credential**
2. Selecciona **Create New** → **OAuth2 API**
3. Configura:
   - **Name**: Meta OAuth2 API
   - **OAuth2 Type**: Facebook
   - **Client ID**: `{{ $env.META_APP_ID }}`
   - **Client Secret**: `{{ $env.META_APP_SECRET }}`
   - **Scope**: `ads_read,business_management`
4. Autoriza la conexión

#### Meta Access Token (Workflow Simple)
- Usa el workflow `n8n-workflow-meta-insights-supabase-simple.json`
- Configura el header Authorization con: `Bearer {{ $env.META_ACCESS_TOKEN }}`

#### Supabase
1. En el nodo **Supabase**, haz clic en **Credential**
2. Selecciona **Create New** → **Supabase API**
3. Configura:
   - **Host**: `{{ $env.SUPABASE_URL }}`
   - **Service Account Secret**: `{{ $env.SUPABASE_SERVICE_KEY }}`

**Alternativa con Postgres Directo (Workflow Simple)**:
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 5. Configurar Telegram (Opcional)

1. Crea un bot con [@BotFather](https://t.me/botfather)
2. Copia el token del bot
3. Obtén tu Chat ID:
   - Envía un mensaje a tu bot
   - Visita: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Busca el `chat.id` en la respuesta
4. Habilita los nodos de Telegram en el workflow

## 🔧 Configuración del Workflow

### Frecuencia de Sincronización

Para cambiar la frecuencia, edita el nodo **Schedule Trigger**:
- **Cada hora**: `{ "field": "hours", "hoursInterval": 1 }`
- **Cada 6 horas**: `{ "field": "hours", "hoursInterval": 6 }`
- **Diario**: `{ "field": "cronExpression", "expression": "0 0 * * *" }`

### Campos de Meta Insights

El workflow obtiene estos campos de Meta Insights:
- `ad_id`, `ad_name`, `campaign_name`
- `impressions`, `clicks`, `spend`
- `actions` (conversiones)
- `date_start`, `date_stop`

### Transformación de Datos

El nodo **Transform Data** realiza:
- Extracción de conversiones desde `actions`
- Cálculo de `revenue` (200 por conversión por defecto)
- Cálculo de `ctr`, `cpa`, `roas`
- Extracción de `destination`, `angle`, `format` desde nombres de ads

**Personalizar Revenue**: Edita el código del nodo y cambia:
```javascript
const revenuePerConversion = parseFloat(process.env.REVENUE_PER_CONVERSION || '200');
```

### Upsert en Supabase

El workflow principal usa `upsert` con conflicto en `(ad_id, date)` para evitar duplicados.

El workflow simple usa `INSERT ... ON CONFLICT DO NOTHING` con Postgres directo.

## 📊 Estructura de Datos

### Tabla: `ads_performance`

```sql
CREATE TABLE IF NOT EXISTS ads_performance (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ad_id text NOT NULL,
  ad_name text NOT NULL,
  campaign_name text,
  destination text,
  angle text,
  format text,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend numeric(10,2) DEFAULT 0,
  conversions integer DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  ctr numeric(5,2) DEFAULT 0,
  cpa numeric(10,2) DEFAULT 0,
  roas numeric(10,2) DEFAULT 0,
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Índice único para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS ads_performance_ad_id_date_idx 
ON ads_performance(ad_id, date);
```

## 🧪 Testing

### Test Manual
1. Desactiva el **Schedule Trigger**
2. Haz clic en **Execute Workflow**
3. Revisa los resultados en cada nodo

### Verificar Datos
```sql
-- Ver últimos registros
SELECT * FROM ads_performance 
ORDER BY date DESC, created_at DESC 
LIMIT 10;

-- Verificar duplicados
SELECT ad_id, date, COUNT(*) 
FROM ads_performance 
GROUP BY ad_id, date 
HAVING COUNT(*) > 1;

-- Verificar sincronización reciente
SELECT date, COUNT(*) as records, SUM(spend) as total_spend
FROM ads_performance
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
```

## 🔍 Troubleshooting

### Error: "Invalid OAuth access token"
- Verifica que el token tenga permisos `ads_read`
- Regenera el token si es necesario
- Usa un System User Token para producción
- **Solución**: Usa el workflow simple con Access Token directo

### Error: "Column does not exist"
- Verifica que la tabla `ads_performance` exista en Supabase
- Ejecuta el SQL de creación: `scripts/create-tables.sql`
- O ejecuta: `POST /api/setup/create-tables`

### Error: "Rate limit exceeded"
- Meta limita requests a 200 por hora por app
- Aumenta el intervalo de sincronización
- Implementa paginación para múltiples accounts
- Usa `time_increment: "1"` para obtener datos diarios

### Datos no aparecen
- Verifica que el `date_range` sea correcto
- Meta Insights puede tener delay de 1-2 horas
- Revisa logs del nodo **Transform Data**
- Verifica que el Account ID sea correcto

### Error: "duplicate key value violates unique constraint"
- El workflow está intentando insertar duplicados
- Verifica que el índice único `(ad_id, date)` exista
- Usa el workflow con `upsert` o `ON CONFLICT`

## 📝 Personalización

### Agregar más campos
Edita el nodo **Meta Insights API** → **Options** → **Fields**:
```
fields: "ad_id,ad_name,...,nuevo_campo"
```

### Filtrar por campaña
En **Meta Insights API** → **Options** → **Qs**:
```json
{
  "filtering": "[{\"field\":\"campaign.id\",\"operator\":\"IN\",\"value\":[\"campaign_id_1\",\"campaign_id_2\"]}]"
}
```

### Sincronizar múltiples accounts
Duplica el workflow y cambia `META_ACCOUNT_ID` en cada instancia.

### Paginación para muchos datos
Agrega un nodo después de **Meta Insights API** para manejar paginación:
```javascript
// En el código del nodo
let allData = [];
let nextUrl = $json.paging?.next;

while (nextUrl) {
  // Hacer request a nextUrl
  // Agregar datos a allData
  // Actualizar nextUrl
}
```

## 🚨 Notas de Seguridad

- ⚠️ **NUNCA** commits credenciales en Git
- ✅ Usa variables de entorno para todos los secrets
- ✅ Usa Service Role Key solo en backend (n8n)
- ✅ Rota tokens periódicamente
- ✅ Limita permisos de API al mínimo necesario
- ✅ Usa System User Tokens en producción (no User Tokens)

## 📚 Recursos

- [Meta Marketing API Docs](https://developers.facebook.com/docs/marketing-apis)
- [Meta Insights API Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group/insights)
- [Supabase Docs](https://supabase.com/docs)
- [n8n Docs](https://docs.n8n.io/)
- [Meta Access Token Guide](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)

## 📄 Archivos Incluidos

1. **n8n-workflow-meta-insights-supabase.json** - Workflow completo con OAuth2
2. **n8n-workflow-meta-insights-supabase-simple.json** - Workflow simplificado con Access Token directo
3. **n8n-workflow-README.md** - Esta documentación

## 💡 Tips

- Usa el workflow simple para empezar rápidamente
- Migra al workflow completo cuando necesites OAuth2 automático
- Configura alertas en Supabase para monitorear sincronizaciones
- Considera usar n8n Cloud para mejor confiabilidad
- Implementa retry logic para manejar errores temporales

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica las credenciales en cada nodo
3. Prueba los endpoints de Meta API manualmente
4. Consulta la documentación oficial de Meta

