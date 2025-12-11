# Workflow n8n: creative_video_generate

Workflow automatizado para generar videos creativos usando IA, con storyboard generado por LLM y soporte para múltiples proveedores de video.

## 📋 Características

- ✅ HTTP Webhook trigger con validación de parámetros
- ✅ LLM para generar storyboard (hook/body/CTA, 9:16, ~15s)
- ✅ Motor de video configurable (Sora, Runway, Pika)
- ✅ QC (Quality Control) de duración y fps
- ✅ Reintento automático (1 intento) si falla generación o QC
- ✅ Polling asíncrono para verificar estado de generación
- ✅ Upload automático a Supabase Storage
- ✅ Registro en tabla `creatives` (type='video')
- ✅ Retorna `creative_id` generado

## 🚀 Instalación

### 1. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-creative-video-generate.json`
4. Activa el workflow

### 2. Configurar Variables de Entorno

En n8n, ve a **Settings** → **Variables** y agrega:

```env
# Brand Color
BRAND_PRIMARY_COLOR=#FF6B35

# LLM para Storyboard
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=sk-...

# Video Providers
VIDEO_PROVIDER=sora
OPENAI_API_KEY=sk-...  # Para Sora
RUNWAY_API_KEY=...     # Opcional, para Runway
RUNWAY_API_URL=https://api.runwayml.com/v1/image-to-video
PIKA_API_KEY=...       # Opcional, para Pika
PIKA_API_URL=https://api.pika.art/v1/videos

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 3. Configurar Credenciales

#### OpenAI (para LLM y Sora)
1. En n8n, crea credenciales **OpenAI API**
2. Configura con tu API key

#### Supabase Postgres
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### Supabase Storage Bucket
Asegúrate de que el bucket `retrofish-assets` exista:
1. Ve a Supabase Dashboard → Storage
2. Crea bucket `retrofish-assets` si no existe
3. Configura permisos públicos si es necesario

### 4. Obtener Webhook URL

1. Activa el workflow
2. Copia la URL del webhook desde el nodo **Webhook Trigger**
3. Ejemplo: `https://tu-n8n.com/webhook/creative-video-generate`

## 📡 Uso del Webhook

### Request Format

```json
POST /webhook/creative-video-generate
Content-Type: application/json

{
  "org_id": "org_123",
  "brief": "Video promocional para servicio de marketing digital",
  "base_angle": "beneficio",
  "destination": "instagram",
  "video_provider": "sora"
}
```

### Parámetros

- **org_id** (requerido): ID de la organización
- **brief** (requerido): Descripción del creative a generar
- **base_angle** (requerido): Ángulo creativo (ej: `oferta`, `beneficio`, `UGC`)
- **destination** (opcional): Destino de la campaña (ej: `facebook`, `instagram`)
- **video_provider** (opcional): Proveedor de video (`sora`, `runway`, `pika`). Default: `sora`

### Response Format

```json
{
  "success": true,
  "org_id": "org_123",
  "creative_ids": ["550e8400-e29b-41d4-a716-446655440000"],
  "count": 1,
  "generated_at": "2024-01-15T10:30:00.000Z",
  "video_provider": "sora"
}
```

## 🔧 Configuración del Workflow

### LLM Storyboard Generator

El nodo **LLM Storyboard Generator** crea un storyboard estructurado con:
- **Hook**: Escena de apertura (3-5 segundos)
- **Body**: Contenido principal (8-10 segundos)
- **CTA**: Escena de call-to-action (2-3 segundos)
- **Total duration**: ~15 segundos
- **Aspect ratio**: 9:16 (vertical)

El storyboard se genera usando OpenAI GPT-4o-mini (configurable).

### Proveedores de Video

El workflow soporta múltiples proveedores:

#### Sora (OpenAI) - Default
- Model: `sora-2-pro`
- Size: `720x1280` (9:16)
- API: `https://api.openai.com/v1/videos`

#### Runway (Opcional)
- API: `https://api.runwayml.com/v1/image-to-video`
- Requiere `RUNWAY_API_KEY`

#### Pika (Opcional)
- API: `https://api.pika.art/v1/videos`
- Requiere `PIKA_API_KEY`

**Agregar más proveedores**: Duplica los nodos de generación y configura según el proveedor.

### Polling y Status Check

El workflow usa polling para verificar el estado de la generación:
1. **Wait**: Espera 30 segundos
2. **Get Video Status**: Verifica estado
3. **Check Status**: Evalúa resultado
   - `completed` → Continúa a descarga
   - `in_progress` → Vuelve a Wait
   - `failed` → Intenta reintento

### QC (Quality Control)

El nodo **QC Video** verifica:
- **Duración**: Esperada ±2 segundos de tolerancia
- **FPS**: 24-30 fps (verificación pendiente)
- **Formato**: MP4

**Nota**: La implementación actual es básica. Para producción, considera:
- Integrar `ffprobe` para análisis real de video
- Usar un servicio externo de QC
- Verificar resolución, codec, bitrate

### Reintento

El workflow permite **1 reintento automático** si:
- La generación falla (`status: failed`)
- El QC falla (`qc_passed: false`)

El reintento vuelve al **Select Provider** y regenera el video.

### Supabase Storage

Los videos se suben a:
```
retrofish-assets/{org_id}/{YYYY-MM-DD}/video-{angle}-{timestamp}.mp4
```

Ejemplo:
```
retrofish-assets/org_123/2024-01-15/video-beneficio-103045.mp4
```

### Tabla `creatives`

Cada video se inserta en la tabla `creatives` con:
- `name`: Nombre construido automáticamente
- `file_url`: URL pública de Supabase Storage
- `file_type`: `'video'`
- `angle`: Ángulo base
- `destination`: Destination (si existe)
- `format`: `'video'`
- `status`: `'draft'`
- `status_history`: Historial inicial

## 🧪 Testing

### Test con cURL

```bash
curl -X POST https://tu-n8n.com/webhook/creative-video-generate \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "test_org",
    "brief": "Test video creative",
    "base_angle": "beneficio",
    "destination": "instagram",
    "video_provider": "sora"
  }'
```

### Verificar en Supabase

```sql
-- Ver videos generados recientemente
SELECT id, name, file_url, angle, destination, created_at
FROM creatives
WHERE file_type = 'video'
ORDER BY created_at DESC
LIMIT 10;

-- Ver videos por org_id
SELECT id, name, file_url, angle
FROM creatives
WHERE file_url LIKE '%org_123%' AND file_type = 'video'
ORDER BY created_at DESC;
```

## 🔍 Troubleshooting

### Error: "Campos requeridos faltantes"
- Verifica que `org_id`, `brief`, y `base_angle` estén presentes
- Revisa el formato JSON del webhook

### Error: "LLM Storyboard Generator failed"
- Verifica que `OPENAI_API_KEY` esté configurado
- Revisa que el modelo LLM esté disponible
- Verifica rate limits de OpenAI

### Error: "Video generation failed"
- Verifica credenciales del proveedor seleccionado
- Revisa que la API del proveedor esté disponible
- Verifica rate limits y quotas

### Error: "Polling timeout"
- El workflow puede tardar varios minutos en generar video
- Aumenta el tiempo de espera si es necesario
- Verifica que el proveedor esté funcionando

### Error: "QC failed"
- El video no cumple con los requisitos de calidad
- El workflow intentará 1 reintento automáticamente
- Si falla de nuevo, revisa los logs

### Error: "Máximo de reintentos alcanzado"
- El workflow ya intentó 1 reintento
- Revisa los logs para identificar el problema
- Considera ajustar los parámetros de generación

### Error: "Supabase Storage upload failed"
- Verifica que el bucket `retrofish-assets` exista
- Verifica permisos del Service Role Key
- Revisa que `SUPABASE_SERVICE_ROLE_KEY` esté configurado

## 📝 Personalización

### Cambiar modelo LLM

Edita el nodo **OpenAI Model**:
```json
{
  "model": "gpt-4o-mini"  // Cambiar a "gpt-4", "gpt-3.5-turbo", etc.
}
```

### Ajustar duración del video

Edita el nodo **LLM Storyboard Generator**:
```
- Video duration: approximately 15 seconds
```

Y ajusta el prompt del sistema para reflejar la nueva duración.

### Cambiar aspect ratio

Edita el nodo **LLM Storyboard Generator**:
```
- Aspect ratio: 9:16 (vertical, mobile-first)
```

Y ajusta el `size` en el nodo **Build Video Prompt** según el proveedor.

### Agregar más proveedores

1. Duplica los nodos de generación
2. Configura la API del nuevo proveedor
3. Agrega la lógica de polling específica
4. Actualiza el nodo **Select Provider**

### Implementar QC real

Reemplaza el nodo **QC Video** con:
- Un nodo que use `ffprobe` (vía script o servicio)
- Un servicio externo de análisis de video
- Verificación de metadata real del archivo

## 🚨 Notas de Seguridad

- ⚠️ Protege tus API keys (`OPENAI_API_KEY`, `RUNWAY_API_KEY`, etc.)
- ✅ Usa variables de entorno para todos los secrets
- ✅ Valida inputs del webhook antes de procesar
- ✅ Implementa rate limiting si es necesario
- ✅ Monitorea costos de las APIs de generación de video
- ✅ Considera agregar autenticación al webhook

## 📚 Recursos

- [OpenAI Sora API Docs](https://platform.openai.com/docs/guides/video)
- [Runway API Docs](https://docs.runwayml.com/)
- [Pika API Docs](https://docs.pika.art/)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [n8n Webhooks Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

## 📄 Archivos Incluidos

1. **n8n-workflow-creative-video-generate.json** - Workflow principal
2. **creative-video-generate-README.md** - Esta documentación

## 💡 Tips

- Ejecuta el workflow manualmente primero para verificar configuración
- Monitorea los costos de las APIs de generación de video (pueden ser altos)
- Los videos pueden tardar varios minutos en generarse
- Considera agregar un nodo de notificación (email/Slack) cuando se completen
- Implementa retry logic adicional si es necesario
- Considera agregar un nodo de preview antes de subir a storage

## 🎯 Casos de Uso

- Generación automática de videos creativos para campañas
- Creación de contenido para Instagram Reels y TikTok
- A/B testing de diferentes ángulos creativos en video
- Generación masiva de variaciones de creativos
- Integración con sistemas de gestión de campañas

## ⚙️ Flujo del Workflow

```
Webhook Trigger
    ↓
Validate Input
    ↓
LLM Storyboard Generator → [OpenAI Model + Storyboard Structure]
    ↓
Build Video Prompt
    ↓
Select Provider → [Sora / Runway / Pika]
    ↓
Generate Video
    ↓
Prepare Polling
    ↓
Wait (30s)
    ↓
Get Video Status
    ↓
Check Status → [completed / in_progress / failed]
    ├─ completed → Prepare Download
    ├─ in_progress → Wait (loop)
    └─ failed → Retry Generation (max 1)
    ↓
Download Video
    ↓
QC Video
    ↓
Check QC → [passed / failed]
    ├─ passed → Upload to Supabase Storage
    └─ failed → Retry Generation (max 1)
    ↓
Extract Storage URL
    ↓
Prepare Creative Data
    ↓
Insert Creative
    ↓
Collect Creative ID
    ↓
Return Response
```

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de cada proveedor

