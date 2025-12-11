# ✅ Checklist de Activación - Retrofish Dashboard

## 🎯 Pasos para Activar Todas las Mejoras

### Fase 1: Configuración Básica (10 minutos)

- [ ] **1.1 Variables de Entorno**
  ```bash
  cp .env.example .env.local
  # Editar .env.local y agregar:
  # - NEXT_PUBLIC_SUPABASE_URL
  # - NEXT_PUBLIC_SUPABASE_ANON_KEY
  # - SUPABASE_SERVICE_ROLE_KEY
  ```

- [ ] **1.2 Instalar Dependencias**
  ```bash
  npm install
  ```

- [ ] **1.3 Verificar Build**
  ```bash
  npm run build
  ```

### Fase 2: Base de Datos (5 minutos)

- [ ] **2.1 Ejecutar Políticas RLS**
  ```bash
  # En Supabase Dashboard → SQL Editor
  # Copiar y ejecutar: supabase-rls-policies.sql
  ```

- [ ] **2.2 Verificar Tablas**
  ```sql
  -- Verificar que existan:
  SELECT * FROM creatives LIMIT 1;
  SELECT * FROM ads_performance LIMIT 1;
  SELECT * FROM user_profiles LIMIT 1;
  ```

### Fase 3: Autenticación (3 minutos)

- [ ] **3.1 Habilitar Auth en Supabase**
  ```
  Supabase → Authentication → Providers
  ✅ Email (habilitado por defecto)
  ✅ Google (opcional, requiere OAuth setup)
  ```

- [ ] **3.2 Crear Usuario de Prueba**
  ```
  Supabase → Authentication → Users → Invite
  Email: tu@email.com
  ```

- [ ] **3.3 Probar Login**
  ```bash
  npm run dev
  # Ir a: http://localhost:3000/login
  ```

### Fase 4: Testing (2 minutos)

- [ ] **4.1 Ejecutar Tests**
  ```bash
  npm run test
  ```

- [ ] **4.2 Ver Coverage**
  ```bash
  npm run test:coverage
  ```

### Fase 5: UI/UX (5 minutos)

- [ ] **5.1 Agregar Theme Toggle**
  ```tsx
  // En tu navbar principal
  import { ThemeToggle } from '@/components/theme-toggle'
  
  <ThemeToggle />
  ```

- [ ] **5.2 Verificar Skeletons**
  ```bash
  # Ir a http://localhost:3000/pax/dashboard
  # Recargar y ver skeletons
  ```

- [ ] **5.3 Probar Error Pages**
  ```
  http://localhost:3000/pagina-inexistente → 404
  http://localhost:3000/error-test → Error boundary
  ```

### Fase 6: React Query (Opcional, 10 minutos)

- [ ] **6.1 Migrar un Componente**
  ```tsx
  // Ejemplo: Dashboard principal
  // Antes:
  const [kpis, setKpis] = useState()
  useEffect(() => { fetch(...) }, [])
  
  // Después:
  import { useKPIs } from '@/app/hooks/use-kpis'
  const { data: kpis, isLoading } = useKPIs({ from, to })
  ```

- [ ] **6.2 Ver DevTools**
  ```bash
  npm run dev
  # Abrir http://localhost:3000
  # Verificar React Query DevTools (esquina inferior derecha)
  ```

### Fase 7: CI/CD (5 minutos)

- [ ] **7.1 Configurar GitHub Secrets**
  ```
  GitHub → Settings → Secrets → Actions
  
  Agregar:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - VERCEL_TOKEN (opcional)
  - VERCEL_ORG_ID (opcional)
  - VERCEL_PROJECT_ID (opcional)
  ```

- [ ] **7.2 Push a GitHub**
  ```bash
  git add .
  git commit -m "feat: implement all improvements"
  git push origin main
  ```

- [ ] **7.3 Verificar Actions**
  ```
  GitHub → Actions → Ver workflow ejecutándose
  ```

### Fase 8: Opcional - Sentry (5 minutos)

- [ ] **8.1 Instalar Sentry** (Opcional)
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard@latest -i nextjs
  ```

- [ ] **8.2 Agregar DSN**
  ```bash
  # En .env.local
  NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
  ```

### Fase 9: Verificación Final (3 minutos)

- [ ] **9.1 Tests Pasan**
  ```bash
  npm run test
  ```

- [ ] **9.2 Build Exitoso**
  ```bash
  npm run build
  ```

- [ ] **9.3 Servidor Funciona**
  ```bash
  npm run dev
  # Verificar: http://localhost:3000
  ```

- [ ] **9.4 Funcionalidades Principales**
  - [ ] Login funciona
  - [ ] Dashboard carga
  - [ ] Dark mode funciona
  - [ ] Skeletons se ven
  - [ ] Creativos se pueden crear
  - [ ] Métricas se muestran

---

## 🎊 ¡Listo!

Si todos los checks están marcados, todas las mejoras están activas.

## 📊 Estado de Funcionalidades

| Funcionalidad | Estado | Requerido |
|--------------|--------|-----------|
| Validación Env | ✅ | Sí |
| Autenticación | ✅ | Sí |
| RLS | ✅ | Sí |
| React Query | ✅ | No (gradual) |
| Testing | ✅ | No |
| Error Boundaries | ✅ | Sí |
| Sentry | ⚠️ Preparado | No |
| Skeletons | ✅ | Sí |
| Dark Mode | ✅ | Sí |
| CI/CD | ✅ | No |

## 🚨 Troubleshooting Rápido

### "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Build fails"
```bash
# Ver errores TypeScript
npx tsc --noEmit

# Ver TYPESCRIPT-FIXES.md para soluciones
```

### "Tests fail"
```bash
# Verificar que existe .env.local con variables mínimas
cp .env.example .env.local
```

### "Login no funciona"
```bash
# Verificar en Supabase:
# 1. Authentication → Settings → Site URL debe ser http://localhost:3000
# 2. Authentication → URL Configuration → Redirect URLs
#    Agregar: http://localhost:3000/auth/callback
```

### "RLS bloquea queries"
```bash
# Verificar en Supabase SQL Editor:
SELECT * FROM pg_policies WHERE schemaname = 'public';

# Si no hay políticas, ejecutar supabase-rls-policies.sql
```

---

## 📝 Notas Finales

- **Todas las mejoras son opcionales** excepto la configuración básica
- **Puedes activarlas gradualmente** según tus necesidades
- **La app funciona sin todas las mejoras** activadas
- **Documentación completa** en `MEJORAS-IMPLEMENTADAS.md`

---

**¿Necesitas ayuda?** Ver:
- `QUICK-START-MEJORAS.md` - Guía rápida
- `MEJORAS-IMPLEMENTADAS.md` - Documentación completa
- `TYPESCRIPT-FIXES.md` - Solución de errores

**Estado:** ✅ Todas las mejoras implementadas y listas para usar
