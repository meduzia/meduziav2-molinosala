# 📊 Retrofish Dashboard - Documentación Completa del Proyecto

## 📋 Tabla de Contenidos

1. [¿Qué es este proyecto?](#qué-es-este-proyecto)
2. [¿Qué herramientas se usaron?](#qué-herramientas-se-usaron)
3. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
4. [Configuración Inicial](#configuración-inicial)
5. [Estructura del Código](#estructura-del-código)
6. [Base de Datos](#base-de-datos)
7. [APIs y Endpoints](#apis-y-endpoints)
8. [Componentes Frontend](#componentes-frontend)
9. [Workflows n8n](#workflows-n8n)
10. [Cómo Ejecutar el Proyecto](#cómo-ejecutar-el-proyecto)
11. [Checklist de Revisión](#checklist-de-revisión)
12. [Próximos Pasos](#próximos-pasos)

---

## ¿Qué es este proyecto?

**Retrofish Dashboard** es una aplicación web profesional para analizar y gestionar campañas de publicidad en Meta Ads (Facebook/Instagram Ads). 

### ¿Qué hace exactamente?

1. **Muestra métricas de publicidad** en tiempo real (cuánto gastas, cuántas conversiones tienes, etc.)
2. **Gestiona creativos** (imágenes y videos de anuncios) con un sistema de aprobación
3. **Genera recomendaciones** usando Inteligencia Artificial
4. **Detecta problemas** automáticamente (como anuncios con costos muy altos)
5. **Sincroniza datos** automáticamente desde Meta Ads cada hora
6. **Analiza la competencia** y tendencias del mercado

### ¿Para quién es?

- Para agencias de marketing digital (como Retrofish Digital)
- Para equipos que gestionan muchas campañas de publicidad
- Para analistas que necesitan ver métricas y tomar decisiones rápidas

---

## ¿Qué herramientas se usaron?

### 🎨 Frontend (Lo que ve el usuario)

| Herramienta | Versión | ¿Para qué sirve? |
|------------|---------|------------------|
| **Next.js** | 16.0.1 | Framework de React para crear la aplicación web |
| **React** | 19.2.0 | Biblioteca para construir la interfaz de usuario |
| **TypeScript** | 5.x | Lenguaje de programación (JavaScript con tipos) |
| **Tailwind CSS** | 4.x | Framework CSS para estilos |
| **shadcn/ui** | - | Componentes de UI pre-hechos (botones, tablas, etc.) |
| **Recharts** | 3.3.0 | Librería para crear gráficos |

### 🔧 Backend (Lo que hace funcionar la aplicación)

| Herramienta | Versión | ¿Para qué sirve? |
|------------|---------|------------------|
| **Next.js API Routes** | 16.0.1 | Crea los endpoints del servidor (APIs) |
| **Supabase** | - | Base de datos PostgreSQL en la nube |
| **Prisma** | 6.18.0 | ORM para trabajar con la base de datos (alternativo) |
| **AWS S3** | - | Almacenamiento en la nube para imágenes/videos |
| **OpenAI API** | 6.8.0 | Inteligencia Artificial para generar insights |

### 🗄️ Base de Datos

| Herramienta | ¿Para qué sirve? |
|------------|------------------|
| **Supabase (PostgreSQL)** | Base de datos principal donde se guardan todos los datos |
| **Prisma** | Herramienta alternativa para gestionar la base de datos (configurada pero poco usada) |

### 🤖 Automatización

| Herramienta | ¿Para qué sirve? |
|------------|------------------|
| **n8n** | Plataforma de automatización para sincronizar datos de Meta Ads cada hora |

### 📦 Otras Herramientas

| Herramienta | ¿Para qué sirve? |
|------------|------------------|
| **Node.js** | Entorno de ejecución de JavaScript |
| **npm** | Gestor de paquetes para instalar dependencias |
| **Git** | Control de versiones del código |

---

## Arquitectura del Proyecto

### Flujo de Datos

```
Meta Ads API (Facebook/Instagram)
        ↓
    n8n Workflows (sincronización cada hora)
        ↓
    Supabase (Base de Datos PostgreSQL)
        ↓
    Next.js API Routes (Backend)
        ↓
    React Components (Frontend)
        ↓
    Usuario ve el Dashboard
```

### Estructura de Carpetas

```
retrofish-dashboard/
│
├── app/                          # Código principal de Next.js
│   ├── api/                      # Endpoints del backend (APIs)
│   │   ├── kpis/                 # API para métricas principales
│   │   ├── creatives/            # API para gestionar creativos
│   │   ├── insights/             # API para generar insights con IA
│   │   ├── charts/               # APIs para gráficos
│   │   └── ...
│   │
│   ├── components/               # Componentes reutilizables de React
│   │   ├── dashboard/           # Componentes del dashboard
│   │   ├── ui/                   # Componentes de UI (botones, tablas, etc.)
│   │   └── ChatAgent.tsx         # Chat con asistente virtual
│   │
│   ├── lib/                      # Librerías y utilidades
│   │   ├── supabase.ts           # Cliente de Supabase
│   │   ├── s3.ts                 # Upload a AWS S3
│   │   ├── ai-agent.ts           # Lógica del chat con IA
│   │   └── utils.ts              # Funciones auxiliares
│   │
│   ├── pax/dashboard/            # Página principal del dashboard
│   ├── creatives/                # Página de gestión de creativos
│   └── scrapers/                 # Página de información de scrapers
│
├── prisma/                       # Configuración de Prisma
│   └── schema.prisma             # Esquema de la base de datos
│
├── public/                       # Archivos estáticos (imágenes, etc.)
│   └── uploads/                  # Archivos subidos localmente
│
├── scripts/                      # Scripts de utilidad
│   └── create-tables.ts          # Script para crear tablas
│
├── n8n-workflow-*.json          # Workflows de n8n (automatización)
├── *.sql                         # Scripts SQL para crear tablas
├── *.md                          # Documentación de workflows
│
├── package.json                  # Dependencias del proyecto
├── tsconfig.json                 # Configuración de TypeScript
└── next.config.ts                # Configuración de Next.js
```

---

## Configuración Inicial

### Paso 1: Clonar el Repositorio

```bash
git clone [URL_DEL_REPOSITORIO]
cd retrofish-dashboard
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

Esto instalará todas las librerías necesarias que están en `package.json`.

### Paso 3: Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con estas variables:

```env
# Base de Datos Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Base de Datos Prisma (opcional)
DATABASE_URL=postgresql://usuario:password@host:5432/database

# AWS S3 (Para subir creativos)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_S3_BUCKET_NAME=tu-bucket-name

# OpenAI (Para generar insights)
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**¿Dónde conseguir estas variables?**

1. **Supabase:**
   - Ve a https://supabase.com
   - Crea un proyecto
   - Ve a Settings → API
   - Copia la URL y las keys

2. **AWS S3:**
   - Ve a AWS Console
   - Crea un bucket en S3
   - Crea un usuario IAM con permisos de S3
   - Genera las access keys

3. **OpenAI:**
   - Ve a https://platform.openai.com
   - Crea una cuenta
   - Genera una API key en API Keys

### Paso 4: Crear Tablas en Supabase

Ejecuta el script SQL en Supabase SQL Editor:

```bash
# El archivo está en: scripts/create-tables.sql
# O puedes usar el endpoint: POST /api/setup/create-tables
```

O ejecuta directamente:

```bash
npm run setup:db
# (si existe el script)
```

### Paso 5: Configurar n8n Workflows

1. Instala n8n (localmente o en la nube)
2. Importa los workflows desde los archivos `n8n-workflow-*.json`
3. Configura las variables de entorno en n8n
4. Activa el workflow de sincronización de Meta Ads

---

## Estructura del Código

### 1. Frontend - Páginas Principales

#### `/pax/dashboard` - Dashboard Principal

**Archivo:** `app/pax/dashboard/page.tsx`

**¿Qué hace?**
- Muestra todas las métricas principales
- Renderiza gráficos y tablas
- Gestiona el filtro de fechas
- Muestra alertas y recomendaciones

**Componentes que usa:**
- `MetricCard` - Tarjetas con métricas (Spend, CPA, etc.)
- `PerformanceChart` - Gráfico de performance
- `ROASChart` - Gráfico de ROAS
- `AdsTable` - Tabla de anuncios
- `AIRecommendations` - Recomendaciones de IA
- `ActiveAlerts` - Alertas activas
- `WinningAngles` - Ángulos ganadores
- `SpendingPredictions` - Predicciones de gasto

#### `/creatives` - Gestión de Creativos

**Archivo:** `app/creatives/page.tsx`

**¿Qué hace?**
- Muestra todos los creativos (imágenes/videos)
- Permite cambiar estados (draft → review → approved → live)
- Permite subir nuevos creativos
- Muestra métricas de performance para creativos activos
- Permite acciones en lote (seleccionar múltiples, cambiar estado masivo)

**Flujo de estados:**
```
Draft → Review → Approved → Live
         ↓
    (Solicitar Cambios)
```

#### `/scrapers` - Información de Scrapers

**Archivo:** `app/scrapers/page.tsx`

**¿Qué hace?**
- Muestra información recopilada por scrapers
- Permite filtrar por categoría (noticias, competencia, tendencias)
- Permite buscar información específica

### 2. Backend - APIs

#### `/api/kpis` - Métricas Principales

**Archivo:** `app/api/kpis/route.ts`

**¿Qué hace?**
- Calcula métricas agregadas (spend, CPA, conversions, CTR, ROAS)
- Compara con período anterior para calcular tendencias
- Devuelve datos en formato JSON

**Ejemplo de respuesta:**
```json
{
  "spend": 2350.50,
  "cpa": 8.25,
  "conversions": 285,
  "ctr": 3.03,
  "spendTrend": 12.5,
  "cpaTrend": -5.2
}
```

#### `/api/creatives` - Gestión de Creativos

**Archivo:** `app/api/creatives/route.ts`

**Métodos:**
- `GET` - Obtener lista de creativos (con filtros)
- `POST` - Crear nuevo creativo (sube a S3 y guarda en DB)
- `PATCH` - Actualizar estado de un creativo

**Endpoints relacionados:**
- `POST /api/creatives/bulk-update` - Actualizar múltiples creativos
- `POST /api/creatives/bulk-delete` - Eliminar múltiples creativos
- `PATCH /api/creatives/[id]/status` - Cambiar estado con historial

#### `/api/insights/generate` - Generar Insights con IA

**Archivo:** `app/api/insights/generate/route.ts`

**¿Qué hace?**
1. Recopila todos los datos del dashboard
2. Calcula métricas y tendencias
3. Envía datos a OpenAI GPT-4o-mini
4. Genera insights accionables en español
5. Cachea resultados por 1 hora

**Ejemplo de respuesta:**
```json
{
  "insights": [
    {
      "type": "performance_alert",
      "priority": "high",
      "icon": "⚠️",
      "title": "CPA elevado detectado",
      "description": "Revisa los anuncios con CPA superior a $150",
      "action": "Revisar segmentación de audiencias"
    }
  ]
}
```

### 3. Librerías y Utilidades

#### `lib/supabase.ts` - Cliente de Supabase

**¿Qué hace?**
- Crea el cliente de Supabase
- Verifica si Supabase está configurado
- Maneja errores si no está configurado

#### `lib/s3.ts` - Upload a AWS S3

**¿Qué hace?**
- Sube archivos (imágenes/videos) a S3
- Genera URLs públicas
- Maneja errores si S3 no está configurado

#### `lib/ai-agent.ts` - Chat con IA

**¿Qué hace?**
- Procesa preguntas del usuario
- Busca información en datos de scrapers
- Responde preguntas sobre métricas y gráficos
- Devuelve respuestas formateadas en Markdown

---

## Base de Datos

### Tablas Principales

#### 1. `ads_performance` - Métricas de Anuncios

**¿Qué guarda?**
Métricas diarias de cada anuncio de Meta Ads.

**Campos importantes:**
```sql
- id: UUID único
- ad_id: ID del anuncio en Meta
- ad_name: Nombre del anuncio
- campaign_name: Nombre de la campaña
- destination: Destino (landing page)
- angle: Ángulo creativo
- format: Formato (image/video)
- impressions: Impresiones
- clicks: Clics
- spend: Gasto
- conversions: Conversiones
- revenue: Ingresos
- ctr: Click-through rate
- cpa: Costo por adquisición
- roas: Return on ad spend
- date: Fecha del registro
```

**¿Cómo se llena?**
- Automáticamente cada hora por el workflow de n8n
- Sincroniza desde Meta Ads API

#### 2. `creatives` - Gestión de Creativos

**¿Qué guarda?**
Información de los creativos (imágenes/videos) que se suben al sistema.

**Campos importantes:**
```sql
- id: UUID único
- name: Nombre del creativo
- file_url: URL del archivo en S3
- file_type: Tipo (image/video)
- angle: Ángulo creativo
- destination: Destino
- format: Formato
- campaign: Campaña asociada
- status: Estado (draft/review/approved/live)
- notes: Notas
- status_history: Historial de cambios (JSONB)
- created_at: Fecha de creación
- updated_at: Última actualización
```

**Estados posibles:**
- `draft` - Borrador (recién subido)
- `review` - En revisión
- `approved` - Aprobado (listo para publicar)
- `live` - En vivo (publicado)

#### 3. Otras Tablas (usadas por workflows)

- `competitors_ads` - Anuncios de competencia
- `market_trends` - Tendencias de mercado
- `insights` - Insights generados
- `classifications` - Clasificaciones de anuncios
- `briefs` - Briefs creativos
- `patterns` - Patrones detectados

### ¿Cómo crear las tablas?

**Opción 1: Desde Supabase SQL Editor**
1. Ve a tu proyecto en Supabase
2. Abre SQL Editor
3. Copia y pega el contenido de `scripts/create-tables.sql`
4. Ejecuta el script

**Opción 2: Desde la API**
```bash
POST /api/setup/create-tables
```

**Opción 3: Desde la línea de comandos**
```bash
# Si tienes scripts configurados
npm run setup:db
```

---

## APIs y Endpoints

### Endpoints Principales

#### Dashboard
- `GET /api/kpis?from=2024-01-01&to=2024-01-31` - Obtener métricas
- `GET /api/alerts?from=...&to=...` - Obtener alertas
- `GET /api/insights/generate?from=...&to=...` - Generar insights
- `GET /api/predictions?from=...&to=...` - Obtener predicciones
- `GET /api/angles?from=...&to=...` - Obtener ángulos ganadores

#### Gráficos
- `GET /api/charts/spend-revenue?from=...&to=...` - Datos para gráfico Spend vs Revenue
- `GET /api/charts/cpa-evolution?from=...&to=...` - Evolución del CPA
- `GET /api/charts/destinations?from=...&to=...` - Performance por destino
- `GET /api/charts/formats?from=...&to=...` - Performance por formato
- `GET /api/charts/roas?from=...&to=...` - Evolución ROAS
- `GET /api/charts/performance?from=...&to=...` - Performance general

#### Creativos
- `GET /api/creatives` - Listar creativos
- `POST /api/creatives` - Crear nuevo creativo
- `PATCH /api/creatives` - Actualizar creativo
- `PATCH /api/creatives/[id]/status` - Cambiar estado
- `POST /api/creatives/bulk-update` - Actualizar múltiples
- `POST /api/creatives/bulk-delete` - Eliminar múltiples
- `GET /api/creatives/metrics` - Métricas de creativos
- `GET /api/creatives/summary` - Resumen de creativos

#### Setup
- `POST /api/setup/create-tables` - Crear tablas en Supabase

### ¿Cómo probar los endpoints?

**Opción 1: Desde el navegador**
```
http://localhost:3000/api/kpis?from=2024-01-01&to=2024-01-31
```

**Opción 2: Con curl**
```bash
curl http://localhost:3000/api/kpis?from=2024-01-01&to=2024-01-31
```

**Opción 3: Con Postman o Insomnia**
- Importa la colección de endpoints
- Configura las variables de entorno
- Prueba cada endpoint

---

## Componentes Frontend

### Componentes del Dashboard

#### `MetricCard` - Tarjeta de Métrica

**Ubicación:** `app/components/dashboard/MetricCard.tsx`

**¿Qué hace?**
- Muestra una métrica (Spend, CPA, etc.)
- Muestra tendencia (↑↓) comparada con período anterior
- Cambia de color según el valor (rojo/amarillo/verde)

**Props:**
```typescript
{
  title: string;           // "Ad Spend"
  value: number;           // 2350.50
  format: "currency" | "percentage" | "number";
  trend?: number;          // 12.5 (porcentaje)
  lowerIsBetter?: boolean; // true para CPA
  alertStatus?: "high" | "warning" | "healthy";
}
```

#### `PerformanceChart` - Gráfico de Performance

**Ubicación:** `app/components/dashboard/PerformanceChart.tsx`

**¿Qué hace?**
- Muestra gráfico de líneas con métricas en el tiempo
- Permite ver evolución de múltiples métricas
- Usa Recharts para renderizar

#### `AIRecommendations` - Recomendaciones de IA

**Ubicación:** `app/components/dashboard/AIRecommendations.tsx`

**¿Qué hace?**
- Llama a `/api/insights/generate`
- Muestra insights generados por OpenAI
- Formatea con iconos y colores según prioridad

#### `ActiveAlerts` - Alertas Activas

**Ubicación:** `app/components/dashboard/ActiveAlerts.tsx`

**¿Qué hace?**
- Detecta anuncios con CPA > $150
- Muestra lista de alertas con detalles
- Permite acciones rápidas

### Componentes de Creativos

#### `UploadCreativeModal` - Modal de Subida

**Ubicación:** `app/components/creatives/UploadCreativeModal.tsx`

**¿Qué hace?**
- Modal para subir nuevo creativo
- Formulario con campos (nombre, ángulo, destino, campaña)
- Upload de archivo (imagen o video)
- Sube a S3 y guarda en base de datos

### Componentes Globales

#### `ChatAgent` - Chat con Asistente

**Ubicación:** `app/components/ChatAgent.tsx`

**¿Qué hace?**
- Botón flotante en esquina inferior derecha
- Panel de chat expandible
- Integrado con `lib/ai-agent.ts`
- Responde preguntas sobre el dashboard

---

## Workflows n8n

### ¿Qué es n8n?

n8n es una plataforma de automatización que permite conectar diferentes servicios y automatizar tareas.

### Workflows Principales

#### 1. Meta Ads Sync (`n8n-workflow-meta-ads-sync.json`)

**¿Qué hace?**
- Sincroniza datos de Meta Ads API cada hora
- Guarda métricas en Supabase
- Transforma datos al formato correcto
- Evita duplicados

**Configuración necesaria:**
- Credenciales de Meta (App ID, App Secret, Access Token)
- Credenciales de Supabase
- Account ID de Meta Ads

#### 2. Quick Wins Agent (`n8n-workflow-quick-wins-agent.json`)

**¿Qué hace?**
- Analiza datos de anuncios
- Identifica oportunidades rápidas de optimización
- Genera recomendaciones accionables

#### 3. Competitors Trends Pull (`n8n-workflow-competitors-trends-pull.json`)

**¿Qué hace?**
- Scrapea anuncios de competencia
- Analiza tendencias del mercado
- Guarda información en base de datos

#### 4. Creative Brief Generator (`n8n-workflow-creative-brief-generator.json`)

**¿Qué hace?**
- Genera briefs creativos usando IA
- Analiza performance de creativos existentes
- Sugiere nuevos ángulos creativos

#### 5. Otros Workflows

- `classify-ads` - Clasifica anuncios automáticamente
- `creative-image-generate` - Genera imágenes con IA
- `creative-video-generate` - Genera videos con IA
- `insights-summarizer` - Resume insights automáticamente
- `pattern-detection` - Detecta patrones en anuncios
- `weekly-report` - Genera reportes semanales
- `ads-benchmark` - Benchmarking de anuncios

### ¿Cómo configurar n8n?

1. **Instalar n8n:**
   ```bash
   npm install -g n8n
   n8n start
   ```

2. **Importar workflows:**
   - Abre n8n en http://localhost:5678
   - Ve a Workflows → Import from File
   - Selecciona el archivo JSON del workflow

3. **Configurar credenciales:**
   - Ve a Settings → Variables
   - Agrega todas las variables de entorno necesarias
   - Configura las credenciales de cada servicio

4. **Activar workflows:**
   - Haz clic en "Active" para activar el workflow
   - Configura el schedule (cada hora, diario, etc.)

---

## Cómo Ejecutar el Proyecto

### Desarrollo Local

#### Paso 1: Instalar Dependencias

```bash
npm install
```

#### Paso 2: Configurar Variables de Entorno

Crea `.env.local` con todas las variables necesarias (ver sección de Configuración).

#### Paso 3: Crear Tablas en Supabase

Ejecuta el script SQL en Supabase o usa el endpoint `/api/setup/create-tables`.

#### Paso 4: Ejecutar el Servidor de Desarrollo

```bash
npm run dev
```

Esto iniciará el servidor en http://localhost:3000

#### Paso 5: Abrir en el Navegador

```
http://localhost:3000
```

El dashboard debería redirigir automáticamente a `/pax/dashboard`.

### Producción

#### Paso 1: Construir la Aplicación

```bash
npm run build
```

#### Paso 2: Ejecutar en Producción

```bash
npm start
```

O despliega en Vercel/Netlify:

```bash
vercel deploy
```

---

## Checklist de Revisión

### ✅ Configuración Inicial

- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Supabase configurado y conectado
- [ ] Tablas creadas en Supabase
- [ ] AWS S3 configurado (para uploads)
- [ ] OpenAI API key configurada
- [ ] n8n workflows importados y configurados

### ✅ Funcionalidades del Dashboard

- [ ] Dashboard principal carga correctamente
- [ ] Métricas (KPIs) se muestran correctamente
- [ ] Gráficos se renderizan sin errores
- [ ] Filtro de fechas funciona
- [ ] Alertas se muestran cuando hay CPA alto
- [ ] Recomendaciones de IA se generan
- [ ] Predicciones se muestran correctamente
- [ ] Tabla de anuncios muestra datos

### ✅ Gestión de Creativos

- [ ] Página de creativos carga correctamente
- [ ] Se pueden subir nuevos creativos
- [ ] Upload a S3 funciona
- [ ] Cambio de estados funciona (draft → review → approved → live)
- [ ] Historial de estados se guarda
- [ ] Acciones en lote funcionan
- [ ] Métricas de performance se muestran para creativos live

### ✅ APIs

- [ ] Endpoint `/api/kpis` funciona
- [ ] Endpoint `/api/creatives` funciona
- [ ] Endpoint `/api/insights/generate` funciona
- [ ] Endpoints de gráficos funcionan
- [ ] Manejo de errores funciona correctamente
- [ ] Fallbacks funcionan cuando servicios fallan

### ✅ Base de Datos

- [ ] Tabla `ads_performance` existe y tiene datos
- [ ] Tabla `creatives` existe y funciona
- [ ] Consultas son eficientes
- [ ] Índices están creados

### ✅ Integraciones

- [ ] n8n sincroniza datos de Meta Ads correctamente
- [ ] OpenAI genera insights correctamente
- [ ] S3 almacena archivos correctamente
- [ ] Supabase responde correctamente

### ✅ UI/UX

- [ ] Diseño responsive (funciona en móvil)
- [ ] Animaciones y transiciones funcionan
- [ ] Mensajes de error son claros
- [ ] Estados de carga se muestran
- [ ] Chat agent funciona correctamente

---

## Próximos Pasos

### Prioridad Alta (Hacer Primero)

1. **Configurar todas las variables de entorno**
   - Verificar que todos los servicios estén conectados
   - Probar cada integración individualmente

2. **Probar todos los endpoints**
   - Usar Postman o curl para probar cada API
   - Verificar que los datos se devuelven correctamente

3. **Documentar setup del proyecto**
   - Crear guía paso a paso para nuevos desarrolladores
   - Documentar todas las variables de entorno necesarias

4. **Arreglar bugs críticos**
   - Revisar errores en consola del navegador
   - Revisar logs del servidor
   - Arreglar cualquier problema que impida usar la aplicación

### Prioridad Media (Siguiente)

1. **Implementar autenticación**
   - Agregar sistema de usuarios
   - Proteger rutas y APIs
   - Implementar roles y permisos

2. **Mejorar manejo de errores**
   - Agregar logging consistente
   - Mejorar mensajes de error para usuarios
   - Implementar retry logic para APIs externas

3. **Optimizar queries de base de datos**
   - Revisar consultas lentas
   - Agregar índices faltantes
   - Optimizar agregaciones

### Prioridad Baja (Mejoras Futuras)

1. **Testing automatizado**
   - Unit tests con Jest/Vitest
   - Integration tests para APIs
   - E2E tests con Playwright

2. **CI/CD**
   - GitHub Actions para tests
   - Deploy automático a Vercel
   - Previews de PRs

3. **Features avanzadas**
   - Dashboards personalizables
   - Comparaciones A/B
   - Automatización avanzada

---

## Archivos Clave para Revisar

### Frontend

- `app/pax/dashboard/page.tsx` - Dashboard principal
- `app/creatives/page.tsx` - Gestión de creativos
- `app/scrapers/page.tsx` - Información de scrapers
- `app/components/ChatAgent.tsx` - Chat con asistente

### Backend

- `app/api/kpis/route.ts` - API de métricas
- `app/api/creatives/route.ts` - API de creativos
- `app/api/insights/generate/route.ts` - Generación de insights
- `app/api/alerts/route.ts` - API de alertas

### Configuración

- `app/lib/supabase.ts` - Cliente de Supabase
- `app/lib/s3.ts` - Upload a S3
- `app/lib/ai-agent.ts` - Lógica del chat
- `package.json` - Dependencias del proyecto
- `.env.local` - Variables de entorno (crear este archivo)

### Base de Datos

- `scripts/create-tables.sql` - Script para crear tablas
- `prisma/schema.prisma` - Esquema de Prisma

---

## Preguntas Frecuentes

### ¿Cómo cambio el rango de fechas?

Usa el selector de fechas en la parte superior del dashboard. Tiene presets como "Últimos 7 días" o puedes seleccionar un rango personalizado.

### ¿Cómo subo un creativo?

1. Ve a la página `/creatives`
2. Haz clic en "Upload New Creative"
3. Completa el formulario y sube el archivo
4. El archivo se subirá a S3 y se guardará en la base de datos

### ¿Cómo funcionan las alertas?

Las alertas se generan automáticamente cuando un anuncio tiene CPA > $150. Se muestran en la sección "Active Alerts" del dashboard.

### ¿Cómo se generan los insights?

Los insights se generan usando OpenAI GPT-4o-mini. El sistema analiza todos los datos del dashboard y genera recomendaciones accionables.

### ¿Cómo sincronizo datos de Meta Ads?

Los datos se sincronizan automáticamente cada hora mediante el workflow de n8n. Configura el workflow con tus credenciales de Meta.

### ¿Qué hago si no veo datos?

1. Verifica que las tablas estén creadas en Supabase
2. Verifica que el workflow de n8n esté activo y funcionando
3. Verifica que las credenciales de Meta estén correctas
4. Revisa los logs de n8n para ver si hay errores

---

## Contacto y Soporte

Para dudas o problemas:
- Revisa los logs de la aplicación
- Revisa los logs de n8n
- Verifica la documentación de cada servicio (Supabase, AWS, OpenAI)
- Consulta la documentación de Next.js si hay problemas técnicos

---

**Última actualización:** Enero 2025

**Versión del proyecto:** 0.1.0

