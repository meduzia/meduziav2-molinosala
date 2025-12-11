# Workflow n8n: Weekly Report - Summary

Workflow automatizado para generar y enviar reportes semanales con rankings de ads, briefs nuevos y KPIs principales vía Slack o Email.

## 📋 Características

- ✅ Trigger Cron los lunes a las 8 AM
- ✅ Consulta Top10 y Bottom10 de la última semana desde Supabase
- ✅ Consulta nuevos briefs creados en la última semana
- ✅ Calcula KPIs principales (impresiones, clicks, spend, CTR, ROAS, CPA)
- ✅ Formatea mensaje para Slack con formato Markdown
- ✅ Envía a Slack vía webhook o Email como alternativa
- ✅ Incluye links a dashboards y KPIs

## 🚀 Instalación

### 1. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-weekly-report.json`
4. Activa el workflow

### 2. Configurar Variables de Entorno

En n8n, ve a **Settings** → **Variables** y agrega:

```env
# Slack
SLACK_ENABLED=true
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Email (opcional, si prefieres email en lugar de Slack)
EMAIL_FROM=reports@retrofish.com
EMAIL_TO=team@retrofish.com

# Dashboard URLs
DASHBOARD_URL=https://dashboard.retrofish.com
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Supabase (usar credenciales de conexión directa Postgres)
# Configurar en credenciales de n8n como Postgres connection
```

### 3. Configurar Credenciales

#### Supabase Postgres
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### Slack Webhook (Recomendado)
1. Ve a [Slack Apps](https://api.slack.com/apps)
2. Crea una nueva app o usa una existente
3. Ve a **Incoming Webhooks** y activa webhooks
4. Crea un nuevo webhook y copia la URL
5. Configura `SLACK_WEBHOOK_URL` en variables de entorno

#### SMTP (Opcional, si prefieres Email)
1. En n8n, crea credenciales **SMTP**
2. Configura con tus credenciales de servidor de correo
3. El nodo **Send Email** está deshabilitado por defecto

### 4. Configurar Canal de Slack

1. Ve a tu canal de Slack donde quieres recibir los reportes
2. Crea un webhook para ese canal específico
3. Usa esa URL en `SLACK_WEBHOOK_URL`

## ⏰ Cron Schedule

El workflow se ejecuta automáticamente cada **lunes a las 8 AM**.

Para cambiar la hora o día, edita el nodo **Cron Trigger**:
```json
{
  "rule": {
    "interval": [
      {
        "field": "cronExpression",
        "expression": "0 8 * * 1"  // Lunes a las 8 AM
      }
    ]
  }
}
```

Ejemplos:
- `"0 9 * * 1"` - Lunes a las 9 AM
- `"0 8 * * 2"` - Martes a las 8 AM
- `"0 8 * * 0"` - Domingo a las 8 AM

## 📊 Consultas a Supabase

### Query Top 10
Obtiene los top 10 ads de la semana anterior desde `ad_rankings`:
```sql
SELECT 
  ar.ad_id,
  ar.ad_name,
  ar.headline,
  ar.ctr,
  ar.roas,
  ar.cpa,
  ar.impressions,
  ar.clicks,
  ar.spend,
  ar.ranking_position
FROM ad_rankings ar
WHERE ar.week_iso = 'YYYY-Www'
  AND ar.ranking_type = 'top10'
ORDER BY ar.ranking_position
LIMIT 10
```

### Query Bottom 10
Similar pero con `ranking_type = 'bottom10'`

### Query New Briefs
Obtiene briefs creados en la última semana:
```sql
SELECT 
  id,
  concept_name,
  creative_theme,
  core_message,
  status,
  created_at
FROM briefs
WHERE created_at >= 'YYYY-MM-DD'
  AND created_at <= 'YYYY-MM-DD'
ORDER BY created_at DESC
LIMIT 20
```

### Query KPIs
Calcula KPIs principales de la semana:
```sql
SELECT 
  COUNT(DISTINCT m.ad_id) as total_ads,
  SUM(m.impressions) as total_impressions,
  SUM(m.clicks) as total_clicks,
  SUM(m.spend) as total_spend,
  AVG(m.ctr) as avg_ctr,
  AVG(m.roas) as avg_roas,
  AVG(m.cpa) as avg_cpa
FROM metrics_daily m
WHERE m.date >= 'YYYY-MM-DD'
  AND m.date <= 'YYYY-MM-DD'
```

## 📨 Formato del Mensaje

El mensaje incluye:

### KPIs Principales
- Total Ads
- Impresiones totales
- Clicks totales
- Spend total
- CTR Promedio
- ROAS Promedio
- CPA Promedio

### Top 10 Ads
- Lista de ads con nombre, CTR, ROAS, Spend
- Promedios del grupo top10

### Bottom 10 Ads
- Lista de ads con nombre, CTR, ROAS, Spend
- Promedios del grupo bottom10

### Briefs Nuevos
- Lista de briefs creados en la semana
- Concepto, tema y status

### Links a Dashboards
- Dashboard Principal
- Rankings de Ads
- Briefs Creativos
- Analytics de la semana

## 🧪 Testing

### Test Manual
1. Desactiva el **Cron Trigger**
2. Haz clic en **Execute Workflow**
3. Revisa los resultados en cada nodo:
   - Queries deben devolver datos
   - Summary debe combinar correctamente
   - Slack message debe formatearse bien
   - Envío debe completarse sin errores

### Test con Slack Webhook

```bash
# Probar webhook directamente
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'
```

### Verificar Datos

```sql
-- Verificar rankings de última semana
SELECT week_iso, COUNT(*) 
FROM ad_rankings 
WHERE week_iso = '2024-W03'
GROUP BY week_iso;

-- Verificar briefs recientes
SELECT COUNT(*) 
FROM briefs 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Verificar KPIs de última semana
SELECT 
  SUM(impressions) as total_impressions,
  SUM(clicks) as total_clicks,
  AVG(ctr) as avg_ctr
FROM metrics_daily
WHERE date >= CURRENT_DATE - INTERVAL '7 days';
```

## 🔍 Troubleshooting

### Error: "No data returned from queries"
- Verifica que existan rankings en `ad_rankings` para la semana anterior
- Verifica que existan datos en `metrics_daily` para la semana anterior
- Ejecuta primero los workflows `ads_benchmark` y `classify_ads`

### Error: "Slack webhook failed"
- Verifica que `SLACK_WEBHOOK_URL` esté configurado correctamente
- Prueba el webhook directamente con curl
- Verifica que el webhook no haya expirado
- Revisa los logs de Slack para ver errores

### Error: "SMTP failed"
- Verifica credenciales SMTP
- Verifica que el servidor SMTP permita conexiones
- Revisa configuración de puertos y seguridad

### Mensaje vacío o incompleto
- Verifica que las queries devuelvan datos
- Revisa el formato del mensaje en **Format Slack Message**
- Verifica que `DASHBOARD_URL` esté configurado

### Semana incorrecta
- El workflow calcula automáticamente la semana anterior
- Verifica la función `getWeekISO` en **Prepare Dates**
- Ajusta el cálculo si es necesario

## 📝 Personalización

### Cambiar hora del cron

Edita el nodo **Cron Trigger** y ajusta la expresión cron.

### Personalizar mensaje

Edita el nodo **Format Slack Message** y modifica el formato del mensaje según tus necesidades.

### Agregar más KPIs

1. Agrega una nueva query en **Prepare Dates**
2. Incluye los datos en **Prepare Summary**
3. Formatea en **Format Slack Message**

### Cambiar formato de email

Edita el nodo **Send Email** y modifica el formato HTML del mensaje.

### Agregar más secciones

Puedes agregar:
- Patrones detectados (desde `patterns`)
- Clasificaciones nuevas (desde `classifications`)
- Anomalías detectadas (desde `insights`)
- Recomendaciones

### Usar Slack API en lugar de Webhook

Reemplaza el nodo **Send Slack Webhook** con el nodo **Slack** de n8n usando credenciales de Slack API.

## 🚨 Notas de Seguridad

- ⚠️ Protege tu `SLACK_WEBHOOK_URL`
- ✅ Usa variables de entorno para todos los secrets
- ✅ No compartas URLs de webhooks públicamente
- ✅ Rota webhooks periódicamente si es posible

## 📚 Recursos

- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Supabase Postgres Docs](https://supabase.com/docs/guides/database)
- [n8n Docs](https://docs.n8n.io/)
- [Cron Expression Guide](https://crontab.guru/)

## 📄 Archivos Incluidos

1. **n8n-workflow-weekly-report.json** - Workflow principal
2. **weekly-report-README.md** - Esta documentación

## 💡 Tips

- Ejecuta el workflow manualmente primero para verificar configuración
- Prueba el webhook de Slack antes de activar el cron
- Ajusta el formato del mensaje según las preferencias de tu equipo
- Considera agregar gráficos o visualizaciones si Slack lo permite
- Implementa alertas si el workflow falla

## 🎯 Casos de Uso

- Reportes semanales automáticos para el equipo
- Resumen ejecutivo de performance
- Tracking de briefs nuevos
- Monitoreo de rankings de ads
- KPIs consolidados

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de Slack Webhooks

## 🔗 Dependencias

Este workflow depende de:
- **ads_benchmark**: Para generar rankings semanales (top10/bottom10)
- **creative_brief_generator**: Para generar briefs (opcional)

Asegúrate de ejecutar estos workflows primero para tener datos completos.

## 📊 Ejemplo de Mensaje Slack

```
📊 *Reporte Semanal - 2024-W03*

📅 *Período:* 2024-01-08 a 2024-01-15

🎯 *KPIs Principales:*
• Total Ads: 150
• Impresiones: 1,250,000
• Clicks: 45,000
• Spend: $25,000
• CTR Promedio: 3.6%
• ROAS Promedio: 4.2
• CPA Promedio: $12.50

🏆 *Top 10 Ads (Mayor CTR):*
1. *Product Launch Campaign*
   CTR: 4.5% | ROAS: 5.2 | Spend: $2,500
...

📝 *Briefs Nuevos:*
• *Joyful Urban Lifestyle* (draft)
  Authentic moments of joy in everyday life
...

🔗 *Enlaces Rápidos:*
• Dashboard Principal
• Rankings de Ads
• Briefs Creativos
• Analytics Semana 2024-W03

_Generado el 2024-01-15_
```

