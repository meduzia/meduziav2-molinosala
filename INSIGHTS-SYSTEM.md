# 📊 Sistema de Insights Meta Ads + Dashboard

## Resumen del Sistema

Has construido un sistema completo que **reemplaza n8n** para integración de Meta Ads con análisis automáticos de insights.

### Componentes

1. **Meta Ads API Sync** - Sincroniza datos reales de Meta
2. **Database (Supabase)** - Almacena datos de anuncios
3. **Insights Agent** - Analiza datos y genera recomendaciones
4. **Dashboard UI** - Visualiza insights de forma hermosa

---

## 🚀 Cómo Usar

### 1. Sincronizar Datos de Meta

#### Opción A: Últimos 7 días
```bash
curl -X POST http://localhost:3000/api/meta/sync?days=7
```

#### Opción B: Últimos 30 días
```bash
curl -X POST http://localhost:3000/api/meta/sync?days=30
```

#### Opción C: Fecha específica
```bash
curl -X POST http://localhost:3000/api/meta/sync?date=2025-11-15
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Successfully synced X rows",
  "rowsInserted": 10,
  "data": {
    "campaigns": 2,
    "adSets": 3,
    "ads": 5
  }
}
```

---

### 2. Generar Insights

#### Opción A: Últimos 7 días (default)
```bash
curl -X POST http://localhost:3000/api/insights/analyze
```

#### Opción B: Rango personalizado
```bash
curl -X POST "http://localhost:3000/api/insights/analyze?from=2025-11-01&to=2025-11-15"
```

**Respuesta:** JSON con 4 tipos de insights:
- **creative_winners** - Top creativos por ROAS
- **budget_optimization** - Performance por campaña
- **alerts** - Creativos con bajo desempeño
- **summary** - KPIs consolidados

---

### 3. Ver Dashboard (UI)

Abre en navegador:
```
http://localhost:3000/insights/dashboard
```

El dashboard muestra automáticamente:
- 🏆 Top 5 Creativos Ganadores
- 💰 Performance por Campaña
- ⚠️ Creativos con Bajo Desempeño
- 📊 Resumen General de KPIs
- 💡 Recomendaciones accionables

---

## 📁 Archivos Creados

### Backend
- **`app/lib/insights-agent.ts`** - Lógica de análisis
- **`app/lib/meta-ads-api.ts`** - Integración Meta API
- **`app/api/meta/sync/route.ts`** - Endpoint de sincronización
- **`app/api/insights/analyze/route.ts`** - Endpoint de insights

### Frontend
- **`app/insights/dashboard/page.tsx`** - Dashboard UI

### Database
- **`meta-ads-schema.sql`** - Schema de Supabase (ya ejecutado)
- **`ads_performance`** table - Almacena datos de anuncios

### Configuración
- **`.env.local`**
  - `META_AD_ACCOUNT_ID` - Tu ID de cuenta Meta (act_XXXXXXXXX)
  - `META_ACCESS_TOKEN` - Token de acceso Meta

---

## 📊 Estructura de Datos

### Tabla: `ads_performance`

```sql
Campos principales:
- id: UUID único
- date: Fecha del dato
- campaign_id, campaign_name: Identificadores de campaña
- ad_set_id, ad_set_name: Identificadores de adset
- ad_id, ad_name: Identificadores de anuncio
- spend: Gasto en USD
- impressions: Impresiones
- clicks: Clics
- conversions: Conversiones
- revenue: Ingresos generados
- ctr: Click-through rate %
- cpc: Costo por clic
- cpm: Costo por mil impresiones
- cpa: Costo por adquisición
- roas: Return on ad spend (revenue/spend)
```

---

## 🔍 Tipos de Insights Generados

### 1. Creative Winners (Creativos Ganadores)
```
Muestra:
- Top 5 anuncios por ROAS
- Gasto total por anuncio
- Conversiones
- CPA promedio

Recomendaciones:
- Escalar presupuesto en los top 3
- Duplicar creativos ganadores en otras campañas
- Analizar elementos comunes
```

### 2. Budget Optimization (Optimización de Presupuesto)
```
Muestra:
- Performance de cada campaña
- Gasto total y ROAS
- Cantidad de anuncios

Recomendaciones:
- Aumentar presupuesto en campañas con alto ROAS
- Reducir gasto en campañas con bajo ROAS
```

### 3. Alerts (Alertas)
```
Muestra:
- Creativos con ROAS < 5 (bajo desempeño)
- CPA más alto
- Conversiones bajas

Recomendaciones:
- Pausar creativos con ROAS < 1.0
- Revisar copy y visuals
- Probar en otra audiencia
```

### 4. Summary (Resumen)
```
Muestra:
- Gasto total
- Ingresos totales
- ROAS promedio
- CPA promedio
- CTR promedio
- Impresiones y clics totales

Recomendaciones:
- Objetivos a alcanzar en próximos 30 días
- Reducción de CPA target
```

---

## ⚙️ Automatización (Opcional)

### Opción 1: Vercel Cron (Si está deployado)

En `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/meta/sync?days=1",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Sincroniza cada día a las 9 AM UTC.

### Opción 2: Node Cron (Local)

Crear `scripts/schedule-meta-sync.js`:
```javascript
const cron = require('node-cron');
const fetch = require('node-fetch');

// Ejecutar cada día a las 9 AM
cron.schedule('0 9 * * *', async () => {
  await fetch('http://localhost:3000/api/meta/sync?days=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  console.log('Meta sync ejecutado');
});
```

### Opción 3: GitHub Actions

En `.github/workflows/sync-meta.yml`:
```yaml
name: Sync Meta Ads
on:
  schedule:
    - cron: '0 9 * * *'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Meta Ads
        run: |
          curl -X POST "https://your-domain.com/api/meta/sync?days=1" \
            -H "Content-Type: application/json"
```

---

## 🐛 Troubleshooting

### "No new data to sync"
**Causa:** Meta aún no tiene datos en tu cuenta o hay delay en los datos.

**Solución:**
- Esperar 24-48 horas para que Meta registre datos
- Verificar que tienes anuncios activos en la campaña
- Verificar el token de Meta sea válido

### Dashboard no muestra datos
**Causa:** No hay datos en la tabla `ads_performance`

**Solución:**
```bash
# Ver si hay datos
curl -X POST http://localhost:3000/api/insights/analyze
```

Si devuelve `"No data available"`, necesitas:
1. Ejecutar `/api/meta/sync` para traer datos
2. O insertar datos de ejemplo en Supabase

### Token expirado
**Causa:** Token de Meta tiene expiración

**Solución:**
1. Ir a https://developers.facebook.com/apps/
2. Generar nuevo token
3. Actualizar en `.env.local`
4. Reiniciar servidor

---

## 📈 Flujo de Datos

```
Meta Ads API
    ↓
/api/meta/sync (sincroniza)
    ↓
ads_performance table (Supabase)
    ↓
/api/insights/analyze (analiza)
    ↓
Genera 4 tipos de insights
    ↓
/insights/dashboard (muestra UI)
```

---

## 🎯 Próximas Mejoras

1. **AI Avanzada (Claude)**
   - Agregar `ANTHROPIC_API_KEY` a `.env.local`
   - El sistema puede generar análisis más profundos

2. **Filtros en Dashboard**
   - Por período de tiempo
   - Por campaña específica
   - Por rango de ROAS

3. **Alertas en Tiempo Real**
   - Notifications si ROAS cae X%
   - Email alerts para creativos nuevos
   - Slack integration

4. **Historial de Insights**
   - Guardar insights en Supabase
   - Ver evolución de métricas en el tiempo
   - Comparar período a período

5. **Exportación de Reportes**
   - PDF con insights
   - CSV con datos de anuncios
   - Google Sheets integration

---

## 💡 Tips

- **Sincroniza regularmente** para tener datos actualizados
- **Revisa insights semanalmente** para optimizar campañas
- **Actúa sobre recomendaciones** (escala, pausa, test)
- **Monitorea ROAS** como métrica clave
- **Agrupa creativos similares** para análisis más precisos

---

## 🔗 URLs Rápidas

| Acción | URL |
|--------|-----|
| Sincronizar Meta | POST `/api/meta/sync?days=7` |
| Generar Insights | POST `/api/insights/analyze` |
| Ver Dashboard | GET `/insights/dashboard` |
| Status Meta Sync | GET `/api/meta/sync?method=status` |
| Status Insights | GET `/api/insights/analyze` |

---

**¡Sistema listo! 🚀 Ahora simplemente usa los endpoints para sincronizar datos y ver insights automáticamente.**
