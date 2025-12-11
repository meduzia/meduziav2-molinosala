# ✅ Checklist de Revisión del Proyecto

## 📋 Configuración Inicial

### Variables de Entorno
- [ ] Archivo `.env.local` creado
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] `AWS_REGION` configurada
- [ ] `AWS_ACCESS_KEY_ID` configurada
- [ ] `AWS_SECRET_ACCESS_KEY` configurada
- [ ] `AWS_S3_BUCKET_NAME` configurada
- [ ] `OPENAI_API_KEY` configurada
- [ ] Todas las variables están escritas correctamente (sin espacios extra)

### Base de Datos Supabase
- [ ] Proyecto creado en Supabase
- [ ] Tablas creadas (`ads_performance`, `creatives`)
- [ ] Índices creados correctamente
- [ ] Conexión a Supabase funciona
- [ ] Se pueden hacer queries desde Supabase SQL Editor

### AWS S3
- [ ] Bucket creado en S3
- [ ] Permisos de bucket configurados (público para lectura)
- [ ] Usuario IAM creado con permisos de S3
- [ ] Access Keys generadas
- [ ] Upload de prueba funciona

### OpenAI
- [ ] Cuenta creada en OpenAI
- [ ] API Key generada
- [ ] Créditos disponibles en la cuenta
- [ ] API responde correctamente

## 🚀 Ejecución del Proyecto

### Instalación
- [ ] `npm install` ejecutado sin errores
- [ ] Todas las dependencias instaladas
- [ ] No hay conflictos de versiones

### Desarrollo
- [ ] `npm run dev` ejecuta correctamente
- [ ] Servidor inicia en http://localhost:3000
- [ ] No hay errores en consola del servidor
- [ ] No hay errores en consola del navegador

### Build
- [ ] `npm run build` ejecuta sin errores
- [ ] Build genera archivos correctamente
- [ ] No hay warnings críticos

## 🎨 Frontend

### Dashboard Principal (`/pax/dashboard`)
- [ ] Página carga correctamente
- [ ] Header se muestra con logo y navegación
- [ ] Selector de fechas funciona
- [ ] Tarjetas de KPIs muestran datos (Spend, CPA, Conversions, CTR)
- [ ] Tendencias se muestran correctamente (flechas ↑↓)
- [ ] Gráficos se renderizan sin errores
- [ ] Tabla de anuncios muestra datos
- [ ] Alertas se muestran cuando hay CPA alto
- [ ] Recomendaciones de IA se generan
- [ ] Predicciones se muestran
- [ ] Ángulos ganadores se muestran

### Gestión de Creativos (`/creatives`)
- [ ] Página carga correctamente
- [ ] Grid de creativos se muestra
- [ ] Tabs funcionan (All, AI Generated, Approved/Live)
- [ ] Filtros funcionan (Week, Campaign)
- [ ] Modal de upload se abre
- [ ] Upload de archivo funciona
- [ ] Archivo se sube a S3 correctamente
- [ ] Nuevo creativo aparece en la lista
- [ ] Cambio de estado funciona (Draft → Review → Approved → Live)
- [ ] Historial de estados se guarda
- [ ] Selección múltiple funciona
- [ ] Acciones en lote funcionan
- [ ] Eliminación funciona
- [ ] Métricas de performance se muestran para creativos live

### Scrapers (`/scrapers`)
- [ ] Página carga correctamente
- [ ] Cards de información se muestran
- [ ] Filtros por categoría funcionan
- [ ] Búsqueda funciona
- [ ] Ordenamiento por fecha funciona

### Chat Agent
- [ ] Botón flotante aparece
- [ ] Panel se abre al hacer clic
- [ ] Envío de mensajes funciona
- [ ] Respuestas se muestran correctamente
- [ ] Markdown se renderiza bien
- [ ] Búsqueda en scrapers funciona

## 🔌 Backend APIs

### Endpoints de KPIs
- [ ] `GET /api/kpis?from=...&to=...` funciona
- [ ] Devuelve datos correctos
- [ ] Calcula tendencias correctamente
- [ ] Maneja errores correctamente
- [ ] Fallback a datos mock funciona si Supabase falla

### Endpoints de Creativos
- [ ] `GET /api/creatives` funciona
- [ ] `POST /api/creatives` funciona (sube archivo)
- [ ] `PATCH /api/creatives` funciona
- [ ] `PATCH /api/creatives/[id]/status` funciona
- [ ] `POST /api/creatives/bulk-update` funciona
- [ ] `POST /api/creatives/bulk-delete` funciona
- [ ] `GET /api/creatives/metrics` funciona
- [ ] Filtros funcionan (source, status)

### Endpoints de Insights
- [ ] `GET /api/insights/generate?from=...&to=...` funciona
- [ ] Genera insights con OpenAI
- [ ] Cache funciona (mismo request devuelve cached)
- [ ] Fallback a insights estáticos funciona si OpenAI falla

### Endpoints de Gráficos
- [ ] `GET /api/charts/spend-revenue` funciona
- [ ] `GET /api/charts/cpa-evolution` funciona
- [ ] `GET /api/charts/destinations` funciona
- [ ] `GET /api/charts/formats` funciona
- [ ] `GET /api/charts/roas` funciona
- [ ] `GET /api/charts/performance` funciona
- [ ] Todos devuelven datos en formato correcto

### Endpoints de Alertas
- [ ] `GET /api/alerts?from=...&to=...` funciona
- [ ] Detecta anuncios con CPA > $150
- [ ] Devuelve lista correcta

### Endpoints de Otros
- [ ] `GET /api/angles` funciona
- [ ] `GET /api/predictions` funciona
- [ ] `GET /api/top` funciona
- [ ] `POST /api/setup/create-tables` funciona

## 🗄️ Base de Datos

### Tabla `ads_performance`
- [ ] Tabla existe
- [ ] Tiene todos los campos necesarios
- [ ] Índices creados (`date`, `destination`)
- [ ] Datos se insertan correctamente
- [ ] Consultas son eficientes
- [ ] Datos se sincronizan desde Meta Ads

### Tabla `creatives`
- [ ] Tabla existe
- [ ] Tiene todos los campos necesarios
- [ ] Índices creados (`status`, `created_at`)
- [ ] Campo `status_history` es JSONB y funciona
- [ ] Datos se insertan correctamente
- [ ] Datos se actualizan correctamente

## 🤖 Integraciones

### Supabase
- [ ] Cliente se inicializa correctamente
- [ ] Queries funcionan
- [ ] Manejo de errores funciona
- [ ] Fallback funciona cuando no está configurado

### AWS S3
- [ ] Cliente se inicializa correctamente
- [ ] Upload funciona
- [ ] URLs se generan correctamente
- [ ] Archivos son accesibles públicamente
- [ ] Manejo de errores funciona

### OpenAI
- [ ] Cliente se inicializa correctamente
- [ ] Generación de insights funciona
- [ ] Respuestas están en formato correcto
- [ ] Manejo de errores funciona
- [ ] Fallback funciona cuando no está configurado

### n8n Workflows
- [ ] Workflow de Meta Ads Sync importado
- [ ] Variables de entorno configuradas en n8n
- [ ] Credenciales de Meta configuradas
- [ ] Workflow activado y ejecutándose
- [ ] Datos se sincronizan cada hora
- [ ] Notificaciones funcionan (si están configuradas)

## 🎯 Funcionalidades Específicas

### Filtros de Fecha
- [ ] Selector de fechas funciona
- [ ] Presets funcionan (7 días, 30 días, etc.)
- [ ] Rango personalizado funciona
- [ ] Todos los componentes se actualizan al cambiar fecha

### Alertas
- [ ] Alertas se detectan correctamente (CPA > $150)
- [ ] Badge en header muestra cantidad correcta
- [ ] Sección de alertas muestra lista completa
- [ ] Colores indican severidad (rojo/amarillo/verde)

### Recomendaciones de IA
- [ ] Se generan automáticamente
- [ ] Prioridades se muestran correctamente (high/medium/low)
- [ ] Iconos se muestran
- [ ] Acciones sugeridas son relevantes

### Predicciones
- [ ] Proyección de gasto a 30 días se calcula
- [ ] Porcentaje de budget usado se muestra
- [ ] Proyección de CPA se muestra

### Gestión de Estados de Creativos
- [ ] Flujo Draft → Review → Approved → Live funciona
- [ ] Botón "Solicitar Cambios" funciona
- [ ] Historial se guarda correctamente
- [ ] Notificaciones se muestran al cambiar estado

### Acciones en Lote
- [ ] Selección múltiple funciona (checkbox)
- [ ] Select All funciona
- [ ] Change Status masivo funciona
- [ ] Delete masivo funciona
- [ ] Validaciones funcionan (no permitir Live en estados mixtos)

## 🐛 Debugging y Errores

### Consola del Navegador
- [ ] No hay errores en consola
- [ ] No hay warnings críticos
- [ ] Requests a APIs funcionan correctamente
- [ ] Errores se muestran claramente al usuario

### Consola del Servidor
- [ ] No hay errores en startup
- [ ] No hay errores en runtime
- [ ] Logs son útiles para debugging
- [ ] Errores se loggean correctamente

### Manejo de Errores
- [ ] Errores de API se manejan correctamente
- [ ] Mensajes de error son claros para usuarios
- [ ] Fallbacks funcionan cuando servicios fallan
- [ ] Estados de carga se muestran correctamente

## 📱 Responsive Design

- [ ] Dashboard funciona en móvil
- [ ] Dashboard funciona en tablet
- [ ] Dashboard funciona en desktop
- [ ] Componentes se adaptan correctamente
- [ ] Tablas son scrollables en móvil
- [ ] Gráficos se renderizan correctamente en todas las pantallas

## ⚡ Performance

- [ ] Página carga rápido (< 3 segundos)
- [ ] Gráficos se renderizan sin lag
- [ ] Tablas grandes no bloquean la UI
- [ ] Imágenes se optimizan correctamente
- [ ] Cache funciona correctamente

## 🔒 Seguridad

- [ ] Variables de entorno no están en Git
- [ ] `.env.local` está en `.gitignore`
- [ ] API keys no se exponen al frontend (excepto las públicas)
- [ ] Validación de inputs funciona
- [ ] Upload de archivos valida tipos

## 📚 Documentación

- [ ] README principal existe
- [ ] Documentación de workflows existe
- [ ] Comentarios en código son útiles
- [ ] Variables de entorno están documentadas
- [ ] Setup está documentado

## ✅ Checklist Final

- [ ] Todo funciona en desarrollo
- [ ] Build funciona sin errores
- [ ] Todas las integraciones funcionan
- [ ] No hay bugs críticos
- [ ] Documentación está completa
- [ ] El proyecto está listo para presentar

---

## Notas

- Marca cada ítem cuando lo completes
- Si encuentras problemas, documenta qué falló y cómo lo solucionaste
- Revisa este checklist antes de cada demo o deploy importante

