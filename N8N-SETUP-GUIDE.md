# Guía de Configuración: n8n + Retrofish Dashboard

Esta guía te ayudará a conectar todos los workflows de n8n con el Retrofish Dashboard.

## 📋 Índice

1. [Instalación de n8n](#instalación-de-n8n)
2. [Variables de Entorno](#variables-de-entorno)
3. [Importar Workflows](#importar-workflows)
4. [Configurar Credenciales](#configurar-credenciales)
5. [Conectar con Dashboard](#conectar-con-dashboard)
6. [Verificar Conexión](#verificar-conexión)

---

## 🚀 Instalación de n8n

### Opción 1: n8n Cloud (Recomendado)
1. Ir a [cloud.n8n.io](https://cloud.n8n.io)
2. Crear cuenta y workspace
3. Copiar la URL del workspace (ej: `https://tuworkspace.n8n.cloud`)

### Opción 2: Docker (Self-Hosted)
```bash
docker run -it --rm \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Accesible en http://localhost:5678
```

### Opción 3: npm (Self-Hosted)
```bash
npm install -g n8n
n8n start
```

---

## 🔐 Variables de Entorno

Agrega estas variables a `.env.local` en el proyecto Retrofish:

```env
# ============================================
# N8N Configuration
# ============================================
N8N_BASE_URL=https://tuworkspace.n8n.cloud
# O para localhost: N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=tu_api_key_aqui

# ============================================
# META ADS API
# ============================================
META_APP_ID=1234567890123456
META_APP_SECRET=abc123def456ghi789jkl012mno345pqr678
META_ACCESS_TOKEN=EAABsbCS1iHgBO7ZC...
META_ACCOUNT_ID=act_123456789

# ============================================
# SUPABASE
# ============================================
SUPABASE_URL=https://tuproyecto.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:password@host:5432/postgres

# ============================================
# OPENAI (Para análisis con IA)
# ============================================
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# Opcional: Slack & Telegram
# ============================================
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_ENABLED=true
SLACK_CHANNEL=#analytics

TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### Cómo obtener cada variable:

#### META_APP_ID & META_APP_SECRET
1. Ir a [Meta App Center](https://developers.facebook.com/apps)
2. Crear una nueva app o usar una existente
3. Ir a Settings → Basic
4. Copiar App ID y App Secret

#### META_ACCESS_TOKEN
1. En App Center, ir a Tools → Access Token Tool
2. Generar un User Access Token con permisos:
   - `ads_read`
   - `ads_management`
   - `read_insights`

#### META_ACCOUNT_ID
1. Ir a [Meta Ads Manager](https://business.facebook.com/adsmanager)
2. Copiar el ID de tu cuenta de anuncios (empieza con "act_")

#### N8N_API_KEY
1. En n8n, ir a Settings → Users & Security
2. Personal Access Tokens → Create Token

#### OPENAI_API_KEY
1. Ir a [OpenAI API Keys](https://platform.openai.com/account/api-keys)
2. Crear una nueva clave
3. Asegúrate de tener crédito disponible

#### Credenciales de Supabase
1. En [Supabase Console](https://app.supabase.com)
2. Project Settings → Database
3. Copiar Connection String

---

## 📥 Importar Workflows

### En n8n Cloud:

1. **Ir a Workflows** → **+ New**
2. **Import from file**
3. Seleccionar cada archivo `n8n-workflow-*.json` del proyecto

### Archivos a importar (en orden):

```
1. n8n-workflow-meta-ads-sync.json
   └─ Sincroniza datos de Meta Ads

2. n8n-workflow-meta-insights-supabase.json
   └─ Sincroniza insights (OAuth)

3. n8n-workflow-meta-insights-supabase-simple.json
   └─ Sincroniza insights (Access Token)

4. n8n-workflow-insights-summarizer.json
   └─ Genera insights con IA

5. n8n-workflow-pattern-detection.json
   └─ Detecta patrones de anuncios

6. n8n-workflow-classify-ads.json
   └─ Clasifica creativos

7. n8n-workflow-ads-benchmark.json
   └─ Calcula rankings semanales

8. n8n-workflow-creative-brief-generator.json
   └─ Genera briefs creativos

9. n8n-workflow-creative-image-generate.json
   └─ Genera imágenes con IA

10. n8n-workflow-creative-video-generate.json
    └─ Genera videos con IA

11. n8n-workflow-quick-wins-agent.json
    └─ Agente de consultas SQL

12. n8n-workflow-competitors-trends-pull.json
    └─ Recopila datos de competencia

13. n8n-workflow-weekly-report.json
    └─ Genera reportes semanales

14. n8n-workflow-product-creative-gen.json
    └─ Genera creativos basados en producto
```

---

## 🔑 Configurar Credenciales en n8n

Después de importar cada workflow, necesitas configurar las credenciales:

### 1. Meta OAuth2 / Access Token

En cada workflow que use Meta:
1. **Editar workflow**
2. Encontrar nodo "Meta Ads"
3. **Authenticate** → Seleccionar autenticación
4. Ingresar credenciales

Opciones:
- **OAuth2**: Más seguro, pero requiere usuario interactivo
- **Access Token**: Más simple para automatización

### 2. Supabase Postgres

En cada workflow que use Supabase:
1. Encontrar nodo "Supabase Postgres"
2. **Create Credential**
3. Ingresar:
   - **Host**: `tuproyecto.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: Tu contraseña
   - **SSL**: `require`

Alternativa con Connection String:
```
postgresql://postgres:password@host:5432/postgres?sslmode=require
```

### 3. OpenAI

En workflows con IA (insights-summarizer, pattern-detection, etc.):
1. Encontrar nodo "OpenAI"
2. **Create Credential**
3. Ingresar tu API Key

### 4. Slack (Opcional)

Para notificaciones:
1. Encontrar nodo "Slack"
2. **Create Credential**
3. Seleccionar workspace y autorizar

---

## 🔗 Conectar con Dashboard

Una vez configurado n8n, los workflows se conectan automáticamente a través de:

**Archivo**: `app/lib/n8n-client.ts`

Las credenciales se usan en:
- `N8N_BASE_URL`: URL de tu instancia n8n
- `N8N_API_KEY`: API Key de n8n

### Activar Workflows

1. En cada workflow, hacer click en **Activate**
2. El workflow ahora estará disponible para ejecutarse

### Ver Webhook URLs

Cada workflow automáticamente obtiene una URL:
```
https://tuworkspace.n8n.cloud/webhook/meta-ads-sync
https://tuworkspace.n8n.cloud/webhook/insights-summarizer
etc.
```

El Dashboard usa estas URLs automáticamente.

---

## ✅ Verificar Conexión

### En el Dashboard:

1. Ir a **Workflows** → Nueva página en el sidebar
2. Ver estado de n8n (verde = conectado, rojo = desconectado)
3. Probar ejecutando un workflow manual

### En la Terminal:

```bash
curl -X GET "http://localhost:3000/api/n8n/workflows?action=health"

# Respuesta esperada:
# {
#   "healthy": true,
#   "n8nUrl": "https://tuworkspace.n8n.cloud"
# }
```

### Ejecutar Workflow Manualmente:

```bash
curl -X POST "http://localhost:3000/api/n8n/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "metaAdsSync",
    "payload": {
      "from": "2024-01-08",
      "to": "2024-01-15"
    }
  }'
```

---

## 📊 Workflows y su Propósito

### Sincronización (Cron)
- **meta-ads-sync**: Sincroniza datos cada 6 horas
- **meta-insights-supabase**: Sincroniza insights cada hora

### Análisis (Cron)
- **insights-summarizer**: Genera insights cada 6 horas
- **pattern-detection**: Detecta patrones cada lunes
- **classify-ads**: Clasifica anuncios diariamente
- **ads-benchmark**: Rankings semanales cada lunes

### Manuales/On-Demand
- **quick-wins-agent**: Ejecutado desde dashboard
- **creative-brief-generator**: Generación de briefs bajo demanda
- **creative-image-generate**: Generar imágenes
- **creative-video-generate**: Generar videos

### Reportes
- **weekly-report**: Reportes semanales
- **competitors-trends-pull**: Tendencias de mercado

---

## 🐛 Troubleshooting

### "n8n No Disponible"

**Problema**: El dashboard no puede conectar con n8n

**Soluciones**:
1. Verificar que `N8N_BASE_URL` es correcto
2. Verificar que `N8N_API_KEY` es válido
3. Verificar firewall/CORS si está en diferente dominio
4. En n8n Settings → Variables, agregar variables de entorno

### "Error de Autenticación Meta"

**Problema**: Workflows fallan con error de Meta API

**Soluciones**:
1. Verificar que `META_ACCESS_TOKEN` es válido (no expirado)
2. Generar nuevo token en Meta App Center
3. Verificar permisos: `ads_read`, `ads_management`

### "Error de Base de Datos"

**Problema**: No puede conectar con Supabase

**Soluciones**:
1. Verificar `DATABASE_URL` es correcto
2. Verificar que la dirección IP está en whitelist de Supabase
3. Verificar contraseña
4. En n8n, probar conexión antes de guardar

---

## 🎯 Flujo de Sincronización Completo

```
1. Meta Ads API
   ↓
2. meta-ads-sync (Cron cada 6h)
   ├─ Descarga datos de anuncios
   ├─ Descarga métricas y insights
   └─ Guarda en Supabase

3. Datos en Supabase
   ↓
4. Análisis con IA (múltiples workflows):
   ├─ insights-summarizer (cada 6h) → insights, recomendaciones
   ├─ pattern-detection (semanal) → patrones ganadores/perdedores
   ├─ classify-ads (diariamente) → clasificación de creativos
   └─ ads-benchmark (semanal) → rankings top10/bottom10

5. Dashboard lee datos
   ├─ Muestra gráficos en tiempo real
   ├─ Muestra alertas y recomendaciones
   └─ Permite ejecutar workflows manualmente
```

---

## 📝 Próximos Pasos

1. ✅ Instalar n8n (cloud o self-hosted)
2. ✅ Agregar variables de entorno
3. ✅ Importar los 14 workflows
4. ✅ Configurar credenciales
5. ✅ Activar workflows
6. ✅ Probar conexión desde dashboard
7. ✅ Ir a http://localhost:3000/workflows
8. ✅ Ejecutar workflows manualmente
9. ✅ Ver datos en Dashboard
10. ✅ Configurar notificaciones (Slack/Telegram)

---

¿Problemas? Revisa los logs de n8n:
- Cloud: Settings → Logs
- Self-hosted: Terminal o logs en Docker

¡Happy automating! 🚀
