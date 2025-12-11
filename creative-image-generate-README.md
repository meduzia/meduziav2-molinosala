# Workflow n8n: creative_image_generate

Workflow automatizado para generar imágenes creativas usando IA (Nano Banana) y almacenarlas en Supabase.

## 📋 Características

- ✅ HTTP Webhook trigger con validación de parámetros
- ✅ Prompt Builder que respeta brand color (`BRAND_PRIMARY_COLOR`)
- ✅ Integración con Nano Banana API para generación de imágenes
- ✅ Overlay de branding opcional (configurable)
- ✅ Upload automático a Supabase Storage (`retrofish-assets/...`)
- ✅ Inserción en tabla `creatives` con metadata
- ✅ Retorna array de `creative_ids` generados

## 🚀 Instalación

### 1. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-creative-image-generate.json`
4. Activa el workflow

### 2. Configurar Variables de Entorno

En n8n, ve a **Settings** → **Variables** y agrega:

```env
# Brand Color
BRAND_PRIMARY_COLOR=#FF6B35

# Nano Banana API
NANO_BANANA_API_URL=https://api.nanobanana.ai/v1/images/generate
NANO_BANANA_API_KEY=tu_api_key_aqui
NANO_BANANA_MODEL=flux

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Branding Overlay (opcional)
ENABLE_BRANDING_OVERLAY=false
```

### 3. Configurar Credenciales

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
3. Ejemplo: `https://tu-n8n.com/webhook/creative-image-generate`

## 📡 Uso del Webhook

### Request Format

```json
POST /webhook/creative-image-generate
Content-Type: application/json

{
  "org_id": "org_123",
  "brief": "Imagen promocional para servicio de marketing digital",
  "base_angle": "beneficio",
  "destination": "facebook",
  "count": 2
}
```

### Parámetros

- **org_id** (requerido): ID de la organización
- **brief** (requerido): Descripción del creative a generar
- **base_angle** (requerido): Ángulo creativo (ej: `oferta`, `beneficio`, `UGC`)
- **destination** (opcional): Destino de la campaña (ej: `facebook`, `instagram`)
- **count** (opcional): Número de imágenes a generar (1-10, default: 1)

### Response Format

```json
{
  "success": true,
  "org_id": "org_123",
  "creative_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001"
  ],
  "count": 2,
  "generated_at": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Configuración del Workflow

### Prompt Builder

El nodo **Prompt Builder** construye el prompt incluyendo:
- Brief del creative
- Ángulo base
- Destination (si existe)
- Brand color (`BRAND_PRIMARY_COLOR`)
- Guidelines para redes sociales

**Personalizar prompt**: Edita el nodo **Prompt Builder** y ajusta el template.

### Nano Banana API

El workflow usa Nano Banana para generar imágenes. Configura:
- **Model**: `flux` (default) o otro modelo disponible
- **Dimensions**: 1024x1024 (default)
- **Steps**: 30 (default)
- **Guidance Scale**: 7.5 (default)

**Personalizar parámetros**: Edita el nodo **Nano Banana Generate**.

### Branding Overlay

El overlay de branding es opcional. Para habilitarlo:
1. Configura `ENABLE_BRANDING_OVERLAY=true`
2. El nodo **Add Branding Overlay** procesará las imágenes

**Nota**: La implementación actual es básica. Para producción, considera:
- Usar Sharp o Canvas para procesar imágenes
- Agregar logo, marca de agua, o elementos de branding
- Integrar con servicios como Cloudinary o Imgix

### Supabase Storage

Las imágenes se suben a:
```
retrofish-assets/{org_id}/{YYYY-MM-DD}/{index}-{angle}-{timestamp}.png
```

Ejemplo:
```
retrofish-assets/org_123/2024-01-15/1-beneficio-103045.png
```

### Tabla `creatives`

Cada imagen se inserta en la tabla `creatives` con:
- `name`: Nombre construido automáticamente
- `file_url`: URL pública de Supabase Storage
- `file_type`: `'image'`
- `angle`: Ángulo base
- `destination`: Destination (si existe)
- `format`: `'image'`
- `status`: `'draft'`
- `status_history`: Historial inicial

## 🧪 Testing

### Test con cURL

```bash
curl -X POST https://tu-n8n.com/webhook/creative-image-generate \
  -H "Content-Type: application/json" \
  -d '{
    "org_id": "test_org",
    "brief": "Test creative",
    "base_angle": "beneficio",
    "destination": "facebook",
    "count": 1
  }'
```

### Verificar en Supabase

```sql
-- Ver creativos generados recientemente
SELECT id, name, file_url, angle, destination, created_at
FROM creatives
WHERE file_type = 'image'
ORDER BY created_at DESC
LIMIT 10;

-- Ver creativos por org_id
SELECT id, name, file_url, angle
FROM creatives
WHERE file_url LIKE '%org_123%'
ORDER BY created_at DESC;
```

## 🔍 Troubleshooting

### Error: "Campos requeridos faltantes"
- Verifica que `org_id`, `brief`, y `base_angle` estén presentes en el request
- Revisa el formato JSON del webhook

### Error: "Nano Banana API error"
- Verifica que `NANO_BANANA_API_KEY` esté configurado
- Revisa que la API URL sea correcta
- Verifica que el modelo esté disponible
- Revisa rate limits de Nano Banana

### Error: "Supabase Storage upload failed"
- Verifica que el bucket `retrofish-assets` exista
- Verifica permisos del Service Role Key
- Revisa que `SUPABASE_SERVICE_ROLE_KEY` esté configurado
- Verifica el formato de la URL de Supabase

### Error: "Duplicate key violation"
- El workflow no maneja duplicados explícitamente
- Considera agregar lógica de deduplicación si es necesario

### Imágenes no se generan
- Verifica logs del nodo **Nano Banana Generate**
- Revisa que el prompt sea válido
- Verifica que la API de Nano Banana esté funcionando

### URLs de imágenes no accesibles
- Verifica permisos públicos del bucket en Supabase
- Asegúrate de que las URLs se construyan correctamente
- Revisa la configuración de CORS en Supabase Storage

## 📝 Personalización

### Agregar más parámetros al prompt

Edita el nodo **Prompt Builder** y agrega variables adicionales:

```javascript
value: "=...{{ $json.nuevo_parametro }}..."
```

### Cambiar modelo de generación

Edita el nodo **Nano Banana Generate**:
```json
{
  "model": "otro-modelo"
}
```

### Personalizar formato de imágenes

Edita el nodo **Nano Banana Generate**:
```json
{
  "width": 1080,
  "height": 1080
}
```

### Agregar más metadata a creatives

Edita el nodo **Prepare Creative Data** y agrega campos adicionales a la inserción.

### Implementar overlay de branding real

Reemplaza el nodo **Add Branding Overlay** con:
- Un nodo que use Sharp para procesar imágenes
- Un servicio externo como Cloudinary
- Un script personalizado que agregue elementos de branding

## 🚨 Notas de Seguridad

- ⚠️ Protege tu `NANO_BANANA_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Usa variables de entorno para todos los secrets
- ✅ Valida inputs del webhook antes de procesar
- ✅ Limita `count` para evitar abuso
- ✅ Considera agregar autenticación al webhook
- ✅ Implementa rate limiting si es necesario

## 📚 Recursos

- [Nano Banana API Docs](https://docs.nanobanana.ai/) - Documentación de la API
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Postgres Docs](https://supabase.com/docs/guides/database)
- [n8n Webhooks Docs](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

## 📄 Archivos Incluidos

1. **n8n-workflow-creative-image-generate.json** - Workflow principal
2. **creative-image-generate-README.md** - Esta documentación

## 💡 Tips

- Ejecuta el workflow manualmente primero para verificar configuración
- Monitorea los costos de Nano Banana API
- Considera agregar un nodo de notificación (email/Slack) cuando se completen generaciones
- Implementa retry logic para manejar errores temporales de API
- Considera agregar un nodo de validación de imágenes antes de subir

## 🎯 Casos de Uso

- Generación automática de creativos para campañas
- A/B testing de diferentes ángulos creativos
- Generación masiva de variaciones de creativos
- Integración con sistemas de gestión de campañas
- Pipeline de creativos para Meta Ads

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de Nano Banana y Supabase

