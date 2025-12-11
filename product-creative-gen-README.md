# Workflow n8n: Product to Creatives - Auto Generation

Workflow automatizado para generar creativos desde imágenes de productos usando análisis de visión, investigación profunda y generación de imágenes IA.

## 📋 Características

- ✅ HTTP Webhook trigger con validación de producto
- ✅ Análisis de imagen con OpenAI Vision
- ✅ Investigación profunda con Perplexity
- ✅ Generación de 8 ángulos creativos con OpenAI
- ✅ Generación de imágenes para cada ángulo con NanoBanana
- ✅ Upload automático a Supabase Storage
- ✅ Registro en tabla `creatives` con metadata completa
- ✅ Retorna array de `creative_ids` generados
- ✅ Opcional: notificación a Slack

## 🚀 Instalación

### 1. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-product-creative-gen.json`
4. Activa el workflow

### 2. Configurar Variables de Entorno

En n8n, ve a **Settings** → **Variables** y agrega:

```env
# OpenAI (para Vision Analysis y generación de ángulos/prompts)
OPENAI_API_KEY=sk-...

# Perplexity (para investigación profunda)
PERPLEXITY_API_KEY=...

# NanoBanana (para generación de imágenes)
NANO_BANANA_API_KEY=...
NANO_BANANA_API_URL=https://api.nanobanana.ai/v1/generate

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Slack (opcional)
SLACK_ENABLED=false
SLACK_CHANNEL_CREATIVES=#creatives
```

### 3. Configurar Credenciales

#### OpenAI API
1. En n8n, crea credenciales **OpenAI API**
2. Configura con tu API key
3. Usa para: Vision Analysis, Generate Angles, Image Prompt

#### Perplexity API
1. En n8n, crea credenciales **Perplexity API**
2. Configura con tu API key
3. Usa para: Deep Research

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

#### Slack (Opcional)
1. Ve a [Slack Apps](https://api.slack.com/apps)
2. Crea una nueva app o usa una existente
3. Obtén el **Bot Token** (OAuth Token)
4. En n8n, crea credenciales **Slack API**
5. Configura `SLACK_ENABLED=true` para habilitar

### 4. Obtener Webhook URL

1. Activa el workflow
2. Copia la URL del webhook desde el nodo **Webhook - Product Input**
3. Ejemplo: `https://tu-n8n.com/webhook/product-creative-gen`

## 📡 Uso del Webhook

### Request Format

```json
POST /webhook/product-creative-gen
Content-Type: application/json

{
  "image_url": "https://example.com/product-image.jpg",
  "product_title": "Camiseta Premium Algodón",
  "brand_context": "Marca de streetwear urbano",
  "additional_info": "Lanzamiento de temporada primavera",
  "org_id": "org_123",
  "destination": "instagram",
  "campaign": "Spring Launch 2024"
}
```

### Parámetros

- **image_url** (requerido): URL de la imagen del producto
- **product_title** (requerido): Título del producto
- **brand_context** (opcional): Contexto de marca
- **additional_info** (opcional): Información adicional
- **org_id** (opcional): ID de organización
- **destination** (opcional): Destino de campaña
- **campaign** (opcional): Nombre de campaña

### Response Format

```json
{
  "success": true,
  "message": "✅ Successfully generated 8 creative angles for Camiseta Premium Algodón",
  "product_title": "Camiseta Premium Algodón",
  "org_id": "org_123",
  "creative_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
    "..."
  ],
  "total_angles": 8,
  "generated_at": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Configuración del Workflow

### Flujo del Proceso

1. **Validate Input**: Valida campos requeridos
2. **OpenAI Vision**: Analiza imagen del producto
3. **Perplexity Research**: Investigación profunda del producto
4. **Generate 8 Angles**: Genera 8 ángulos creativos únicos
5. **Split into 8 Angles**: Divide en 8 ángulos individuales
6. **Loop Each Angle**: Itera sobre cada ángulo
7. **Generate Image Prompt**: Crea prompt para generación de imagen
8. **NanoBanana Generate**: Genera imagen con IA
9. **Download Image**: Descarga la imagen generada
10. **Upload to Supabase Storage**: Sube a Supabase Storage
11. **Insert Creative**: Registra en tabla `creatives`
12. **Success Summary**: Recopila todos los `creative_ids`
13. **Slack Notification**: Notifica (opcional)

### Supabase Storage

Las imágenes se suben a:
```
retrofish-assets/{org_id}/{Week_YYYY-MM-DD}/angle-{number}-{titular}.png
```

Ejemplo:
```
retrofish-assets/org_123/Week_2024-01-15/angle-1-Comfort_Meets_Style.png
```

### Tabla `creatives`

Cada imagen se inserta en la tabla `creatives` con:
- `name`: "{product_title} - Ángulo {number}: {titular}"
- `file_url`: URL pública de Supabase Storage
- `file_type`: `'image'`
- `angle`: Titular del ángulo
- `destination`: Destination (si existe)
- `format`: `'image'`
- `campaign`: Campaign (si existe)
- `status`: `'draft'`
- `status_history`: Historial inicial
- `notes`: Información del producto y beneficios

## 🧪 Testing

### Test con cURL

```bash
curl -X POST https://tu-n8n.com/webhook/product-creative-gen \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/product.jpg",
    "product_title": "Camiseta Premium",
    "org_id": "test_org",
    "destination": "instagram"
  }'
```

### Verificar Datos

```sql
-- Ver creativos generados recientemente
SELECT id, name, angle, file_url, campaign, created_at
FROM creatives
WHERE file_type = 'image'
ORDER BY created_at DESC
LIMIT 20;

-- Ver creativos por producto
SELECT id, name, angle, file_url
FROM creatives
WHERE notes LIKE '%Camiseta Premium%'
ORDER BY created_at DESC;
```

## 🔍 Troubleshooting

### Error: "Missing required fields"
- Verifica que `image_url` y `product_title` estén presentes
- Revisa el formato JSON del webhook

### Error: "OpenAI Vision Analysis failed"
- Verifica que `OPENAI_API_KEY` esté configurado
- Verifica que la URL de la imagen sea accesible
- Revisa rate limits de OpenAI

### Error: "Perplexity Research failed"
- Verifica que `PERPLEXITY_API_KEY` esté configurado
- Revisa que el modelo `sonar-pro` esté disponible
- Verifica rate limits de Perplexity

### Error: "NanoBanana Generation failed"
- Verifica que `NANO_BANANA_API_KEY` esté configurado
- Revisa que la API URL sea correcta
- Verifica rate limits de NanoBanana

### Error: "Supabase Storage upload failed"
- Verifica que el bucket `retrofish-assets` exista
- Verifica permisos del Service Role Key
- Revisa que `SUPABASE_SERVICE_ROLE_KEY` esté configurado

### Error: "Creative IDs not collected"
- El workflow recopila IDs de todas las iteraciones del loop
- Verifica que los inserts se completen correctamente
- Revisa logs de ejecución en n8n

## 📝 Personalización

### Cambiar número de ángulos

Edita el prompt en el nodo **OpenAI - Generate 8 Angles** y cambia:
```
generar 8 ángulos creativos
```

A:
```
generar X ángulos creativos
```

Y ajusta el parsing en **Split into 8 Angles**.

### Cambiar tamaño de imágenes

Edita el nodo **NanoBanana - Generate Image**:
```json
{
  "width": 1080,
  "height": 1080  // Cambiar según necesidad
}
```

### Personalizar estructura de storage

Edita el nodo **Upload to Supabase Storage** y ajusta la URL:
```
retrofish-assets/{org_id}/{week_folder}/angle-{number}-{titular}.png
```

### Agregar más metadata a creatives

Edita el nodo **Prepare Creative Data** y agrega campos adicionales a la inserción.

## 🚨 Notas de Seguridad

- ⚠️ Protege tus API keys (OpenAI, Perplexity, NanoBanana)
- ✅ Usa variables de entorno para todos los secrets
- ✅ Valida inputs del webhook antes de procesar
- ✅ Monitorea costos de las APIs (pueden ser altos)
- ✅ Limita el tamaño de imágenes procesadas

## 📚 Recursos

- [OpenAI Vision API Docs](https://platform.openai.com/docs/guides/vision)
- [Perplexity API Docs](https://docs.perplexity.ai/)
- [NanoBanana API Docs](https://docs.nanobanana.ai/)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [n8n Docs](https://docs.n8n.io/)

## 📄 Archivos Incluidos

1. **n8n-workflow-product-creative-gen.json** - Workflow principal
2. **product-creative-gen-README.md** - Esta documentación

## 💡 Tips

- Ejecuta el workflow manualmente primero para verificar configuración
- Monitorea los costos de las APIs (OpenAI, Perplexity, NanoBanana)
- El proceso completo puede tardar varios minutos (8 imágenes)
- Considera agregar validación de URLs de imágenes
- Implementa retry logic para manejar errores temporales

## 🎯 Casos de Uso

- Generación automática de creativos desde catálogo de productos
- Creación de múltiples variaciones creativas para A/B testing
- Producción masiva de contenido para campañas
- Integración con sistemas de gestión de productos
- Pipeline automatizado de creativos para Meta Ads

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de cada servicio

