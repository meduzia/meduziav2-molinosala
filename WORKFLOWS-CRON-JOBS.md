# Configuración de Cron Jobs para Workflows n8n

Este documento explica cómo configurar automatizaciones para ejecutar los workflows de n8n automáticamente.

## 📋 Resumen

Los workflows se ejecutan automáticamente según estos horarios:

- **Meta Ads Sync**: Cada 6 horas → `GET /api/workflows/sync`
- **Classify Ads**: Cada 24 horas → Desde n8n (cron)
- **Insights Summarizer**: Cada 6 horas → `GET /api/workflows/insights`
- **Pattern Detection**: Cada 7 días → Desde n8n (cron)
- **Ads Benchmark**: Cada 7 días → Desde n8n (cron)

---

## 🔧 Opción 1: Vercel Crons (Recomendado para Vercel)

Si deploys en **Vercel**, puedes usar Vercel Crons (gratis incluido).

### Configuración

Crea el archivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/workflows/sync",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/workflows/insights",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/workflows/all",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

**Explicación:**
- `0 */6 * * *` = Cada 6 horas (00:00, 06:00, 12:00, 18:00)
- `0 0 * * 0` = Domingos a las 00:00 (semanal)

### Deploy

```bash
git add vercel.json
git commit -m "Add workflow crons"
git push
```

Los crons se ejecutarán automáticamente en Vercel.

---

## 🔧 Opción 2: EasyCron.com (Servicio Gratuito)

Si NO usas Vercel, usa **EasyCron** (gratuito).

### Paso 1: Registrarse

1. Ve a [EasyCron.com](https://www.easycron.com)
2. Regístrate gratis
3. Confirma tu email

### Paso 2: Crear Cron Jobs

Para cada workflow, crea un cron job:

#### Cron 1: Meta Ads Sync (Cada 6 horas)

- **URL**: `https://tu-app.com/api/workflows/sync`
- **Método**: GET
- **Horario**: `0 */6 * * *` (cada 6 horas)
- **Headers**:
  ```
  x-api-key: tu_workflow_api_key
  ```
- **Notificaciones**: Email si falla

#### Cron 2: Insights (Cada 6 horas)

- **URL**: `https://tu-app.com/api/workflows/insights`
- **Método**: GET
- **Horario**: `0 2,8,14,20 * * *` (00:00, 06:00, 12:00, 18:00 UTC)
- **Headers**:
  ```
  x-api-key: tu_workflow_api_key
  ```

#### Cron 3: Todos los Workflows (Semanal)

- **URL**: `https://tu-app.com/api/workflows/all?action=run`
- **Método**: GET
- **Horario**: `0 0 * * 0` (Domingos 00:00)
- **Headers**:
  ```
  x-api-key: tu_workflow_api_key
  ```

---

## 🔧 Opción 3: Railway Cron Jobs

Si usas **Railway**, puedes configurar cron jobs.

### Configuración

En tu `railway.json`:

```json
{
  "services": {
    "api": {
      "start": "npm run start",
      "builder": "nixpacks"
    }
  },
  "cronJobs": [
    {
      "name": "meta-ads-sync",
      "command": "curl -X GET https://tu-app.railway.app/api/workflows/sync -H 'x-api-key: $WORKFLOW_API_KEY'",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

---

## 🔧 Opción 4: n8n Crons Nativos (Mejor práctica)

**Lo IDEAL es dejar que n8n ejecute los crons nativamente.**

Cada workflow de n8n tiene su propio cron integrado:

1. **meta-ads-sync**: Configurado con `Cron` trigger cada 6 horas
2. **classify-ads**: Configurado con `Cron` trigger diariamente
3. **insights-summarizer**: Configurado con `Cron` trigger cada 6 horas
4. **pattern-detection**: Configurado con `Cron` trigger cada lunes
5. **ads-benchmark**: Configurado con `Cron` trigger cada lunes

**Ventajas:**
- ✅ Sin depender de tu app (más confiable)
- ✅ Ejecuta aunque tu app esté down
- ✅ Mejor manejo de errores
- ✅ Logs integrados en n8n

**Cómo configurar en n8n:**

1. Abre cada workflow en n8n
2. Busca el nodo `Cron`
3. Configura según el intervalo deseado
4. Activa el workflow (`Activate` button)

---

## 🔐 Seguridad: API Key

### Configurar API Key

Agrega a `.env.local`:

```env
WORKFLOW_API_KEY=tu_llave_secreta_muy_larga_aqui
```

En producción:

```bash
# Railway
railway env add WORKFLOW_API_KEY "tu_llave_secreta"

# Vercel
vercel env add WORKFLOW_API_KEY
# Ingresar: tu_llave_secreta

# EasyCron
# Agregar header x-api-key: tu_llave_secreta en cada cron
```

### Generar API Key Segura

```bash
# En terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y úsalo como `WORKFLOW_API_KEY`.

---

## 📊 Tabla de Cronogramas

| Workflow | Frecuencia | Endpoint | Comando CRON |
|----------|-----------|----------|-------------|
| Meta Ads Sync | 6 horas | `/api/workflows/sync` | `0 */6 * * *` |
| Classify Ads | 24 horas | n8n nativo | `0 0 * * *` |
| Insights | 6 horas | `/api/workflows/insights` | `0 */6 * * *` |
| Pattern Detection | Semanal (lunes) | n8n nativo | `0 0 * * 1` |
| Ads Benchmark | Semanal (lunes) | n8n nativo | `0 0 * * 1` |

---

## 🧪 Probar Cron Manualmente

### Opción 1: desde terminal

```bash
# Sincronizar Meta Ads
curl -X GET "https://tu-app.com/api/workflows/sync" \
  -H "x-api-key: tu_workflow_api_key"

# Generar insights
curl -X GET "https://tu-app.com/api/workflows/insights" \
  -H "x-api-key: tu_workflow_api_key"

# Ejecutar todos
curl -X GET "https://tu-app.com/api/workflows/all?action=run" \
  -H "x-api-key: tu_workflow_api_key"
```

### Opción 2: desde navegador

```
https://tu-app.com/api/workflows/sync?__cron_secret=tu_workflow_api_key
```

Nota: Requiere pasar API key en query parameter (menos seguro, solo para testing).

### Opción 3: Ver estado

```bash
curl -X GET "https://tu-app.com/api/workflows/all?action=status" \
  -H "x-api-key: tu_workflow_api_key"
```

Respuesta:

```json
{
  "success": true,
  "action": "status",
  "workflows": [
    {
      "key": "metaAdsSync",
      "name": "Meta Ads Sync",
      "interval": 21600000,
      "lastRun": "2024-01-15T12:00:00Z",
      "nextRun": "2024-01-15T18:00:00Z",
      "timeUntilNextRun": 21600000,
      "isReady": false
    }
  ]
}
```

---

## 🔍 Monitoreo

### Ver logs de cron jobs

#### Vercel
```bash
vercel logs --follow
```

#### Railway
```bash
railway logs
```

#### EasyCron
Dashboard → Mis Crons → Ver logs

---

## 🚨 Troubleshooting

### Error 401: Unauthorized

**Problema**: API key inválida o falta

**Solución**:
```bash
# Verificar que WORKFLOW_API_KEY esté configurado
echo $WORKFLOW_API_KEY

# En Vercel
vercel env list

# En Railway
railway env list
```

### Error 500: Workflow Execution Failed

**Problema**: El workflow de n8n falló

**Solución**:
1. Verificar que n8n está arriba
2. Ver logs en n8n dashboard
3. Verificar credenciales (Meta, Supabase, OpenAI)
4. Revisar network en /api/n8n/execute

### Cron no ejecuta

**Problema**: El cron job no se ejecuta

**Verificar:**
1. ✅ El cron job está creado en EasyCron/Vercel/Railway
2. ✅ La URL es correcta (https, no http)
3. ✅ La API key es válida
4. ✅ El servidor está activo (`curl https://tu-app.com` debe responder)

---

## 📈 Monitoreo Avanzado

### Crear endpoint de status global

```bash
curl "https://tu-app.com/api/workflows/all?action=status" \
  -H "x-api-key: tu_workflow_api_key"
```

Este endpoint devuelve el estado de todos los workflows:
- Última ejecución
- Próxima ejecución
- Tiempo hasta la próxima ejecución
- Si está listo para ejecutar

### Alertas

Puedes configurar alertas en EasyCron:
- Email si el cron falla
- Slack notification
- Webhook a servicio de alertas

---

## 🔄 Flujo de Ejecución

```
1. Cron job trigger (Vercel, EasyCron, Railway, etc.)
   ↓
2. GET /api/workflows/sync (o insights, all)
   ↓
3. Verificar API key
   ↓
4. Ejecutar workflow desde lib/workflows.ts
   ↓
5. Llamar a n8n webhook desde lib/n8n-client.ts
   ↓
6. n8n procesa el workflow
   ↓
7. Datos se sincronizan a Supabase
   ↓
8. Dashboard lee los datos automáticamente
   ↓
9. Usuarios ven datos en tiempo real (casi)
```

---

## 📝 Checklist de Configuración

- [ ] Elegir plataforma de cron (Vercel / EasyCron / Railway / n8n)
- [ ] Configurar `WORKFLOW_API_KEY` en variables de entorno
- [ ] Crear cron jobs para cada workflow
- [ ] Verificar que n8n está configurado correctamente
- [ ] Probar workflows manualmente
- [ ] Verificar logs de ejecución
- [ ] Configurar alertas de fallos
- [ ] Documentar en tu equipo

---

## 🎯 Próximos Pasos

1. **Elegir opción de cron job** (recomendado: Vercel si usas Vercel, sino EasyCron)
2. **Configurar WORKFLOW_API_KEY**
3. **Crear cron jobs**
4. **Probar manualmente**
5. **Verificar logs después de 6 horas**
6. **Ajustar horarios según necesidad**

---

¡Listo! Ahora tus workflows se ejecutarán automáticamente sin intervención manual. 🚀
