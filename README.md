# 🐟 Retrofish Dashboard

Dashboard profesional de análisis y gestión de campañas de Meta Ads para Retrofish Digital.

## 📚 Documentación

Este proyecto incluye documentación completa para facilitar el onboarding y la revisión:

- **[📖 PROYECTO-COMPLETO.md](./PROYECTO-COMPLETO.md)** - Documentación completa del proyecto (arquitectura, componentes, APIs, base de datos, workflows)
- **[⚡ GUIA-RAPIDA.md](./GUIA-RAPIDA.md)** - Guía rápida de inicio (5 minutos)
- **[🔑 VARIABLES-ENTORNO.md](./VARIABLES-ENTORNO.md)** - Guía detallada de configuración de variables de entorno
- **[✅ CHECKLIST-REVISION.md](./CHECKLIST-REVISION.md)** - Checklist completo para revisar el proyecto

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto. Ver [VARIABLES-ENTORNO.md](./VARIABLES-ENTORNO.md) para detalles.

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_key_aqui
```

### 3. Crear tablas en Supabase

Ejecuta el script SQL en Supabase SQL Editor o usa el endpoint:

```bash
# Opción 1: Copiar contenido de scripts/create-tables.sql a Supabase SQL Editor
# Opción 2: POST /api/setup/create-tables
```

### 4. Ejecutar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🎯 Características Principales

- ✅ **Dashboard de métricas** - Análisis en tiempo real de KPIs (Spend, CPA, ROAS, CTR)
- ✅ **Gestión de creativos** - Sistema completo de aprobación y workflow
- ✅ **Recomendaciones con IA** - Insights generados automáticamente con OpenAI
- ✅ **Alertas automáticas** - Detección de anuncios con CPA elevado
- ✅ **Sincronización automática** - Datos de Meta Ads sincronizados cada hora vía n8n
- ✅ **Análisis de competencia** - Scrapers de información de mercado

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Base de Datos:** Supabase (PostgreSQL)
- **Almacenamiento:** AWS S3
- **IA:** OpenAI GPT-4o-mini
- **Automatización:** n8n workflows

## 📁 Estructura del Proyecto

```
retrofish-dashboard/
├── app/                    # Código principal de Next.js
│   ├── api/               # Endpoints del backend
│   ├── components/        # Componentes React
│   ├── pax/dashboard/     # Dashboard principal
│   ├── creatives/         # Gestión de creativos
│   └── lib/               # Utilidades y clientes
├── prisma/                # Configuración de Prisma
├── scripts/               # Scripts de utilidad
├── n8n-workflow-*.json   # Workflows de n8n
└── *.sql                  # Scripts SQL
```

## 📍 Rutas Principales

- `/pax/dashboard` - Dashboard principal con métricas y gráficos
- `/creatives` - Gestión de creativos (upload, estados, métricas)
- `/scrapers` - Información recopilada por scrapers

## 🔌 APIs Principales

- `GET /api/kpis` - Métricas principales
- `GET /api/creatives` - Lista de creativos
- `POST /api/creatives` - Crear nuevo creativo
- `GET /api/insights/generate` - Generar insights con IA
- `GET /api/alerts` - Obtener alertas activas

Ver [PROYECTO-COMPLETO.md](./PROYECTO-COMPLETO.md) para documentación completa de APIs.

## 🗄️ Base de Datos

### Tablas principales

- `ads_performance` - Métricas diarias de anuncios
- `creatives` - Gestión de creativos con workflow de estados

Ver scripts SQL en `scripts/create-tables.sql` o ejecutar `POST /api/setup/create-tables`.

## 🤖 Workflows n8n

El proyecto incluye varios workflows de n8n para automatización:

- `meta-ads-sync` - Sincronización de datos de Meta Ads
- `quick-wins-agent` - Identificación de oportunidades
- `competitors-trends-pull` - Análisis de competencia
- Y más...

Ver `n8n-workflow-README.md` para documentación de workflows.

## 🧪 Testing

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Ejecutar producción
npm start
```

## 📝 Checklist de Revisión

Antes de hacer deploy o presentar el proyecto, revisa:

- [ ] Variables de entorno configuradas
- [ ] Tablas creadas en Supabase
- [ ] APIs funcionan correctamente
- [ ] Dashboard carga y muestra datos
- [ ] Upload de creativos funciona

Ver [CHECKLIST-REVISION.md](./CHECKLIST-REVISION.md) para checklist completo.

## 🆘 Problemas Comunes

### No se muestran datos
- Verifica que las tablas existan en Supabase
- Verifica que el workflow de n8n esté activo
- Revisa las variables de entorno

### Error al subir creativo
- Verifica configuración de AWS S3
- Verifica permisos del bucket
- Revisa las credenciales de AWS

### Insights no se generan
- Verifica que `OPENAI_API_KEY` esté configurada
- Verifica créditos en OpenAI
- Revisa logs del servidor

## 📖 Documentación Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [n8n Documentation](https://docs.n8n.io)

## 📄 Licencia

Este proyecto es propiedad de Retrofish Digital.

---

**¿Necesitas ayuda?** Consulta la [documentación completa](./PROYECTO-COMPLETO.md) o revisa los logs de la aplicación.
