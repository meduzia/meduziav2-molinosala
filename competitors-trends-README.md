# Workflow n8n: competitors_trends_pull

Workflow automatizado para extraer y clasificar anuncios de competidores desde Meta Ads Library y tendencias de mercado desde feeds RSS/APIs.

## 📋 Características

- ✅ Ejecución diaria automática (cron: 6:00 AM)
- ✅ Scraping de Meta Ads Library con búsquedas por marcas/keywords
- ✅ Extracción de tendencias desde feeds RSS y APIs
- ✅ Clasificación automática de ángulos con LLM (OpenAI GPT-4o-mini)
- ✅ Inserción en Supabase: `competitors_ads` y `market_trends`
- ✅ Manejo de duplicados y errores

## 🚀 Instalación

### 1. Crear las tablas en Supabase

Ejecuta el SQL en Supabase SQL Editor:

```sql
-- Ver archivo: competitors-trends-tables.sql
```

O ejecuta el script directamente desde el archivo incluido.

### 2. Importar el workflow en n8n

1. Abre tu instancia de n8n
2. Ve a **Workflows** → **Import from File**
3. Selecciona `n8n-workflow-competitors-trends-pull.json`

### 3. Configurar Variables de Entorno

En n8n, ve a **Settings** → **Variables** y agrega:

```env
# Meta Ads Library - Búsquedas
COMPETITOR_BRAND_1=nombre_marca_competidor_1
COMPETITOR_KEYWORD_1=keyword_1
COMPETITOR_KEYWORD_2=keyword_2

# Feeds RSS/APIs de Tendencias
RSS_FEED_URL_1=https://feeds.feedburner.com/oreilly/radar
RSS_FEED_URL_2=https://rss.cnn.com/rss/edition.rss
TREND_KEYWORD=marketing+digital

# OpenAI para clasificación de ángulos
OPENAI_API_KEY=sk-...

# Supabase (usar credenciales de conexión directa Postgres)
# Configurar en credenciales de n8n como Postgres connection
```

### 4. Configurar Credenciales

#### Supabase Postgres
1. Ve a Supabase Dashboard → Settings → Database
2. Copia la **Connection String** (modo `direct connection`)
3. En n8n, crea credenciales **Postgres**
4. Usa el formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### OpenAI API
1. En el nodo **LLM Classify Angles**, configura:
   - Header: `Authorization: Bearer {{ $env.OPENAI_API_KEY }}`

## 🔧 Configuración del Workflow

### Cron Schedule

El workflow se ejecuta diariamente a las 6:00 AM UTC.

Para cambiar el horario, edita el nodo **Cron Trigger**:
```json
{
  "rule": {
    "cronExpression": "0 6 * * *"  // 6:00 AM UTC diario
  }
}
```

Ejemplos:
- `0 9 * * *` - 9:00 AM UTC
- `0 */6 * * *` - Cada 6 horas
- `0 0 * * 1` - Cada lunes a medianoche

### Meta Ads Library

El workflow realiza búsquedas en Meta Ads Library usando:
- **Brand 1**: Búsqueda por nombre de marca
- **Keyword 1**: Primera keyword de búsqueda
- **Keyword 2**: Segunda keyword de búsqueda

**Personalizar búsquedas**: Edita las variables de entorno o los nodos HTTP Request.

**Nota**: Meta Ads Library puede tener rate limits. Considera agregar delays entre requests si es necesario.

### Feeds RSS/APIs

El workflow extrae tendencias desde:
1. **RSS Feed 1**: Feed de tendencias (configurable)
2. **RSS Feed 2**: Feed de noticias (configurable)
3. **GitHub Trends API**: Repositorios relacionados con keywords

**Agregar más feeds**: Duplica los nodos RSS Feed y configura nuevas URLs.

### Clasificación de Ángulos con LLM

El workflow usa OpenAI GPT-4o-mini para clasificar cada anuncio en tags de ángulos:

**Tags disponibles**:
- `oferta`, `beneficio`, `UGC`, `prueba_social`, `emocional`, `humor`
- `urgencia`, `escasez`, `autoridad`, `comparación`, `storytelling`
- `testimonial`, `antes_despues`, `problemas_soluciones`, `educacional`
- `entretenimiento`, `deportes_extremos`, `COVID`, `salud`
- `tecnologia`, `innovacion`, `sostenibilidad`, `comunidad`
- `exclusividad`, `personalizacion`, `garantia`, `descuento`
- `gratis`, `trial`, `demo`

**Personalizar tags**: Edita el prompt en el nodo **LLM Classify Angles**.

## 📊 Estructura de Datos

### Tabla: `competitors_ads`

```sql
CREATE TABLE competitors_ads (
  id uuid PRIMARY KEY,
  ad_id text NOT NULL,
  advertiser_name text NOT NULL,
  ad_creative_body text,
  ad_creative_bodies jsonb,
  ad_snapshot_url text,
  page_id text,
  ad_delivery_start_time timestamp,
  ad_delivery_stop_time timestamp,
  impressions_lower_bound integer,
  impressions_upper_bound integer,
  spend_lower_bound numeric(10,2),
  spend_upper_bound numeric(10,2),
  currency text,
  regions jsonb,
  publisher_platforms jsonb,
  ad_format text,
  media_type text,
  angle_tags jsonb,           -- Array de tags: ["oferta", "beneficio"]
  primary_angle text,          -- Tag principal
  angle_confidence numeric(3,2), -- 0.00 a 1.00
  angle_reasoning text,        -- Explicación del LLM
  search_query text,
  scraped_at timestamp,
  created_at timestamp,
  updated_at timestamp
);
```

### Tabla: `market_trends`

```sql
CREATE TABLE market_trends (
  id uuid PRIMARY KEY,
  source text NOT NULL,        -- 'rss', 'github', 'api'
  source_url text,
  title text NOT NULL,
  description text,
  link text UNIQUE,
  published_at timestamp,
  author text,
  category text,
  content text,
  scraped_at timestamp,
  created_at timestamp,
  updated_at timestamp
);
```

## 🧪 Testing

### Test Manual
1. Desactiva el **Cron Trigger**
2. Haz clic en **Execute Workflow**
3. Revisa los resultados en cada nodo:
   - Meta Ads Library debe devolver JSON con ads
   - RSS Feeds deben parsearse correctamente
   - LLM debe clasificar con tags
   - Inserts deben completarse sin errores

### Verificar Datos

```sql
-- Ver últimos anuncios de competidores
SELECT advertiser_name, primary_angle, angle_tags, scraped_at
FROM competitors_ads
ORDER BY scraped_at DESC
LIMIT 10;

-- Ver tendencias por fuente
SELECT source, COUNT(*) as count, MAX(scraped_at) as last_scraped
FROM market_trends
GROUP BY source;

-- Ver distribución de ángulos
SELECT primary_angle, COUNT(*) as count
FROM competitors_ads
WHERE primary_angle IS NOT NULL
GROUP BY primary_angle
ORDER BY count DESC;

-- Ver tendencias recientes
SELECT source, title, published_at, link
FROM market_trends
WHERE scraped_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY published_at DESC
LIMIT 20;
```

## 🔍 Troubleshooting

### Error: "Meta Ads Library no devuelve datos"
- Meta Ads Library puede bloquear requests automatizados
- Agrega headers más realistas (User-Agent)
- Considera usar un servicio de proxy/scraping
- Verifica que las URLs de búsqueda sean correctas

### Error: "RSS Feed parsing failed"
- Algunos feeds RSS tienen formatos no estándar
- Revisa el formato del feed en el nodo Transform Trends Data
- Agrega manejo de errores para feeds específicos

### Error: "OpenAI API rate limit"
- Reduce la frecuencia de ejecución
- Implementa batching de requests
- Usa un modelo más económico (gpt-4o-mini es recomendado)
- Agrega delays entre requests

### Error: "Duplicate key violation"
- El workflow usa `skipOnConflict` para evitar duplicados
- Verifica que los índices únicos existan en Supabase
- Los duplicados se basan en `(ad_id, date)` para ads y `link` para trends

### Datos no aparecen en Supabase
- Verifica credenciales de Postgres
- Revisa logs de ejecución en n8n
- Verifica que las tablas existan
- Comprueba permisos de inserción

## 📝 Personalización

### Agregar más búsquedas en Meta Ads Library

1. Duplica los nodos **Meta Ads Library**
2. Configura nuevas URLs con diferentes keywords
3. Conecta todos al nodo **Transform Ads Library Data**

### Cambiar modelo de LLM

Edita el nodo **LLM Classify Angles**:
```json
{
  "model": "gpt-4o-mini"  // Cambiar a "gpt-4", "gpt-3.5-turbo", etc.
}
```

### Agregar más feeds de tendencias

1. Duplica nodos **RSS Feed**
2. Configura nuevas URLs
3. Conecta todos al nodo **Transform Trends Data**

### Personalizar tags de ángulos

Edita el prompt en **LLM Classify Angles**:
```
Tags disponibles: oferta, beneficio, ..., tu_nuevo_tag
```

### Filtrar por región en Meta Ads Library

Agrega parámetro `country` en la URL:
```
&country=ES  // España
&country=MX  // México
&country=US  // Estados Unidos
```

## 🚨 Notas de Seguridad

- ⚠️ Meta Ads Library puede tener términos de servicio que limiten scraping automatizado
- ✅ Usa rate limiting y delays entre requests
- ✅ Considera usar servicios oficiales de Meta API cuando sea posible
- ✅ Rota User-Agents si es necesario
- ✅ Protege tus API keys de OpenAI
- ✅ Limita acceso a las credenciales de Supabase

## 📚 Recursos

- [Meta Ads Library](https://www.facebook.com/ads/library/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [RSS 2.0 Specification](https://cyber.harvard.edu/rss/rss.html)
- [GitHub Search API](https://docs.github.com/en/rest/search)
- [Supabase Postgres Docs](https://supabase.com/docs/guides/database)

## 📄 Archivos Incluidos

1. **n8n-workflow-competitors-trends-pull.json** - Workflow principal
2. **competitors-trends-tables.sql** - SQL para crear tablas
3. **competitors-trends-README.md** - Esta documentación

## 💡 Tips

- Ejecuta el workflow manualmente primero para verificar que funcione
- Monitorea los costos de OpenAI API (GPT-4o-mini es económico)
- Considera agregar alertas/notificaciones cuando se detecten nuevos competidores
- Usa las vistas SQL incluidas para análisis rápido
- Implementa cleanup de datos antiguos periódicamente

## 🎯 Casos de Uso

- Monitoreo de competencia en Meta Ads
- Análisis de tendencias del mercado
- Identificación de nuevos ángulos creativos
- Benchmarking de estrategias publicitarias
- Detección temprana de nuevas campañas

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de ejecución en n8n
2. Verifica que todas las credenciales estén configuradas
3. Prueba cada nodo individualmente
4. Consulta la documentación oficial de cada servicio

