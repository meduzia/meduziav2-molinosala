# 📊 Retrofish Dashboard - Guía Rápida

## 🚀 Inicio Rápido (5 minutos)

### 1. Clonar y Instalar
```bash
git clone [URL_DEL_REPO]
cd retrofish-dashboard
npm install
```

### 2. Configurar Variables
Crea `.env.local` con estas variables mínimas:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_key_aqui
```

### 3. Crear Tablas
Ejecuta en Supabase SQL Editor: `scripts/create-tables.sql`

### 4. Ejecutar
```bash
npm run dev
```

Abre: http://localhost:3000

---

## 📖 Documentación Completa

- **[PROYECTO-COMPLETO.md](./PROYECTO-COMPLETO.md)** - Documentación completa del proyecto
- **[VARIABLES-ENTORNO.md](./VARIABLES-ENTORNO.md)** - Guía de configuración de variables
- **[CHECKLIST-REVISION.md](./CHECKLIST-REVISION.md)** - Checklist de revisión

---

## 🎯 ¿Qué hace este proyecto?

Dashboard profesional para analizar y gestionar campañas de Meta Ads con:
- ✅ Métricas en tiempo real (Spend, CPA, ROAS, CTR)
- ✅ Gestión de creativos con workflow de aprobación
- ✅ Recomendaciones generadas con IA
- ✅ Alertas automáticas de performance
- ✅ Sincronización automática de datos cada hora
- ✅ Análisis de competencia y tendencias

---

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Base de Datos:** Supabase (PostgreSQL)
- **Almacenamiento:** AWS S3
- **IA:** OpenAI GPT-4o-mini
- **Automatización:** n8n

---

## 📁 Estructura Principal

```
app/
├── api/              # Endpoints del backend
├── components/       # Componentes React
├── pax/dashboard/   # Dashboard principal
├── creatives/       # Gestión de creativos
└── lib/             # Utilidades y clientes
```

---

## 🔑 Variables de Entorno Esenciales

Mínimas para funcionar:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Opcionales (para funcionalidades completas):
- `AWS_*` (para uploads de creativos)
- `OPENAI_API_KEY` (para insights con IA)
- Variables de Meta Ads (para n8n workflows)

Ver [VARIABLES-ENTORNO.md](./VARIABLES-ENTORNO.md) para detalles completos.

---

## 📍 Rutas Principales

- `/pax/dashboard` - Dashboard principal
- `/creatives` - Gestión de creativos
- `/scrapers` - Información de scrapers

---

## 🧪 Probar Endpoints

```bash
# Métricas
curl http://localhost:3000/api/kpis?from=2024-01-01&to=2024-01-31

# Creativos
curl http://localhost:3000/api/creatives

# Insights
curl http://localhost:3000/api/insights/generate?from=2024-01-01&to=2024-01-31
```

---

## ✅ Checklist Mínimo

- [ ] Variables de entorno configuradas
- [ ] Tablas creadas en Supabase
- [ ] `npm run dev` ejecuta sin errores
- [ ] Dashboard carga en http://localhost:3000
- [ ] APIs responden correctamente

Ver [CHECKLIST-REVISION.md](./CHECKLIST-REVISION.md) para checklist completo.

---

## 🆘 Problemas Comunes

### "No se muestran datos"
1. Verifica que las tablas existan en Supabase
2. Verifica que el workflow de n8n esté activo
3. Revisa las variables de entorno

### "Error al subir creativo"
1. Verifica configuración de AWS S3
2. Verifica permisos del bucket
3. Revisa las credenciales de AWS

### "Insights no se generan"
1. Verifica que `OPENAI_API_KEY` esté configurada
2. Verifica que tengas créditos en OpenAI
3. Revisa logs del servidor

---

## 📞 Soporte

Para más información, consulta:
- [PROYECTO-COMPLETO.md](./PROYECTO-COMPLETO.md) - Documentación completa
- Logs de la aplicación en consola
- Documentación de cada servicio (Supabase, AWS, OpenAI)

---

**Última actualización:** Enero 2025

