# Meta Ads API - Integración Directa (Sin n8n)

## 🎯 Resumen

Este documento te muestra cómo reemplazar completamente n8n con una integración directa a Meta Ads API. Es más simple, más barato y más rápido.

**Ventajas:**
- ✅ 0 dependencia de n8n
- ✅ Sin costo de n8n (ahorro $$$)
- ✅ Control total del flujo
- ✅ Más rápido (2-5 segundos vs 1-2 minutos con n8n)
- ✅ Fácil de debuggear
- ✅ Escalable

---

## 📋 Paso 1: Obtener Credenciales de Meta

### 1.1 Ir a Meta Business Manager
```
https://business.facebook.com
```

### 1.2 Crear una App (o usar existente)
1. Settings → Apps and Websites
2. Click "Create App"
3. Seleccionar "Business"
4. Rellenar datos
5. Agregar producto "Marketing API"

### 1.3 Obtener Access Token
1. Ir a Settings → Access Tokens
2. Click "Generate Token"
3. Seleccionar:
   - Permission: `ads_management`, `ads_read`
   - Duration: Long-lived (60 days)
4. Copiar el token

**⚠️ Guardar el token en `.env.local`:**
```
META_ACCESS_TOKEN=your_long_lived_token_here
```

### 1.4 Obtener Ad Account ID
1. En Business Manager: Settings → Ad Accounts
2. Copiar el ID (ej: `act_123456789`)

**⚠️ Guardar en `.env.local`:**
```
META_AD_ACCOUNT_ID=act_123456789
```

---

## 📊 Paso 2: Crear Tablas en Supabase

### 2.1 Copiar SQL
Abre `/meta-ads-schema.sql` en tu proyecto.

### 2.2 Ejecutar en Supabase
1. Ir a Supabase → SQL Editor
2. Nuevo Query
3. Copiar todo el contenido de `meta-ads-schema.sql`
4. Presionar "Run"

**Esto crea:**
- ✅ `ads_performance` - Datos de Meta
- ✅ `meta_sync_log` - Log de sincronizaciones
- ✅ `meta_campaigns_cache` - Cache de campañas
- ✅ `meta_adsets_cache` - Cache de ad sets
- ✅ Vista materializada `ads_performance_daily_summary`

---

## 🔄 Paso 3: Configurar Sincronización

### Opción A: Manual (Rápido - para testing)

**Una sola vez:**
```bash
curl -X POST http://localhost:3000/api/meta/sync?days=30 \
  -H "Content-Type: application/json"
```

**Día específico:**
```bash
curl -X POST http://localhost:3000/api/meta/sync?date=2024-01-15 \
  -H "Content-Type: application/json"
```

### Opción B: Automática cada hora

Crear un cron job con Vercel o tu proveedor:

**Si está en Vercel:**

1. Crear archivo `/api/cron/meta-sync.ts`:
```typescript
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // Verificar que es llamada desde Vercel
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Llamar endpoint de sincronización
  try {
    const response = await fetch(
      `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/meta/sync?days=1`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.INTERNAL_API_SECRET || '',
        },
      }
    )

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Meta sync completed',
      data,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}
```

2. En `vercel.json` agregar:
```json
{
  "crons": [
    {
      "path": "/api/cron/meta-sync",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Si está en otro servidor (Node.js):**

Usar `node-cron`:
```bash
npm install node-cron
```

Crear `/scripts/schedule-meta-sync.js`:
```javascript
const cron = require('node-cron')

// Ejecutar cada hora
cron.schedule('0 * * * *', async () => {
  console.log('Running Meta sync...')

  try {
    const response = await fetch('http://localhost:3000/api/meta/sync?days=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INTERNAL_API_SECRET,
      },
    })

    const data = await response.json()
    console.log('Sync completed:', data)
  } catch (error) {
    console.error('Sync error:', error)
  }
})

console.log('Meta sync scheduler started')
```

Luego en `package.json`:
```json
{
  "scripts": {
    "sync:meta": "node scripts/schedule-meta-sync.js"
  }
}
```

---

## 🎨 Paso 4: Conectar Dashboard

El dashboard ya está configurado para leer de `ads_performance`. Sólo necesitas que tengas datos.

**¿Qué sucede automáticamente:**
1. Dashboard llama `/api/kpis?from=2024-01-01&to=2024-01-31`
2. API busca en tabla `ads_performance`
3. Calcula métricas (spend, revenue, roas, cpa, etc.)
4. Retorna al dashboard
5. Dashboard renderiza gráficos

**Endpoints que ya funcionan:**
- GET `/api/kpis` - KPIs principales
- GET `/api/charts/performance` - Gráfico de performance
- GET `/api/charts/spend-revenue` - Spend vs Revenue
- GET `/api/charts/roas` - ROAS trend
- GET `/api/charts/cpa-evolution` - CPA evolution
- GET `/api/charts/destinations` - Por destino
- GET `/api/charts/formats` - Por formato

---

## 🧪 Paso 5: Testing

### 5.1 Verificar credenciales
```bash
curl -X GET http://localhost:3000/api/meta/sync?method=status
```

Respuesta esperada:
```json
{
  "status": "Meta Sync API is running",
  "required_env": [
    "META_AD_ACCOUNT_ID",
    "META_ACCESS_TOKEN"
  ]
}
```

### 5.2 Sincronizar datos
```bash
curl -X POST http://localhost:3000/api/meta/sync?days=7 \
  -H "Content-Type: application/json" \
  -d '{}'
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Successfully synced 150 rows",
  "rowsInserted": 150,
  "data": {
    "dateRange": { "days": 7 },
    "rowsProcessed": 150,
    "campaigns": 5,
    "adSets": 12,
    "ads": 45
  }
}
```

### 5.3 Ver datos en Supabase
```sql
SELECT * FROM ads_performance LIMIT 10;
```

### 5.4 Verificar en Dashboard
Ir a http://localhost:3000/pax/dashboard

Deberías ver:
- ✅ Métricas de spend, revenue, ROAS
- ✅ Gráficos de performance
- ✅ CPA evolution
- ✅ Otros datos de Meta

---

## 📈 Paso 6: Datos en Tiempo Real (Avanzado)

Si quieres sincronizar cada vez que haces cambios en Meta (en tiempo real):

Usar **Meta Webhooks**:

```typescript
// /api/meta/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const data = await request.json()

  // Meta envía cambios aquí
  // Puedes sincronizar específicamente ese ad

  console.log('Meta webhook:', data)

  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (token === process.env.META_WEBHOOK_TOKEN) {
    return NextResponse.json(Number(challenge))
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## 🛠️ Troubleshooting

### Error: "Missing Meta credentials"
**Solución:** Verificar `.env.local`:
```
META_AD_ACCOUNT_ID=act_xxxxx
META_ACCESS_TOKEN=your_token_here
```

### Error: "Meta API error: 400"
**Solución:** El token expiró. Generar nuevo en Meta Business Manager.

### Error: "No data synced"
**Solución:** La cuenta de Meta puede no tener anuncios recientes. Crear un anuncio prueba.

### Dashboard no muestra datos
**Solución:**
1. Verificar que `ads_performance` tiene datos: `SELECT COUNT(*) FROM ads_performance;`
2. Refrescar página del dashboard
3. Verificar fecha range del date picker

---

## 📊 Arquitectura

```
Meta Ads Insights API
        ↓
/api/meta/sync (POST)
        ↓
meta-ads-api.ts (funciones de sync)
        ↓
Supabase (ads_performance table)
        ↓
/api/kpis (GET)
        ↓
Dashboard UI (gráficos, tablas, etc.)
```

---

## 🚀 Próximos Pasos

### Corto plazo:
- [ ] Sincronizar histórico (últimos 90 días)
- [ ] Configurar cron job automático
- [ ] Verificar datos en dashboard

### Mediano plazo:
- [ ] Agregar creatives desde Meta (imágenes, videos)
- [ ] Integrar campaigns creadas en Retrofish con Meta
- [ ] Tracking de performance de cada creative

### Largo plazo:
- [ ] Machine learning para predecir performance
- [ ] Recomendaciones automáticas de optimización
- [ ] A/B testing automático

---

## 📝 Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/meta/sync` | POST | Sincronizar datos |
| `/api/meta/sync?days=7` | POST | Últimos N días |
| `/api/meta/sync?date=YYYY-MM-DD` | POST | Fecha específica |
| `/api/meta/sync?method=status` | GET | Estado del sistema |

---

## 💡 Tips

1. **Sincronizar primero con días pasados:**
   ```bash
   curl -X POST http://localhost:3000/api/meta/sync?days=90
   ```
   Esto trae los últimos 90 días de datos.

2. **Luego configurar sincronización diaria:**
   - Usa Vercel Cron, node-cron o similar
   - Ejecutar cada día a las 2 AM (cuando Meta Insights API está actualizado)

3. **Monitorear sincronizaciones:**
   ```sql
   SELECT * FROM meta_sync_log ORDER BY sync_timestamp DESC LIMIT 10;
   ```

4. **Debuggear errores:**
   - Revisar logs en `/api/meta/sync` llamadas
   - Revisar tabla `meta_sync_log` en Supabase

---

## ✅ Checklist Final

- [ ] Meta credentials obtenidas (Access Token + Ad Account ID)
- [ ] `.env.local` actualizado
- [ ] SQL schema ejecutado en Supabase
- [ ] Endpoint `/api/meta/sync` testeado
- [ ] Primeros datos sincronizados
- [ ] Dashboard mostrando datos
- [ ] Cron job configurado (opcional pero recomendado)
- [ ] n8n workflows deshabilitados (opcional)

---

¡Listo! Ahora tienes Meta Ads completamente integrado sin n8n. 🎉
