# Configuración de Sesiones Sin Límite de Tiempo

Esta guía explica cómo configurar el sistema para que las sesiones de usuario nunca expiren.

## 📋 Resumen

El Retrofish Dashboard ahora está configurado para mantener sesiones indefinidamente:

1. ✅ **Auto-refresh de tokens** - Los JWT se renuevan automáticamente antes de expirar
2. ✅ **Persistencia de sesión** - La sesión se guarda en localStorage del navegador
3. ✅ **Middleware de renovación** - En cada request se intenta refrescar el token

---

## 🔧 Configuración Actual

### 1. Cliente (app/lib/auth.ts)

```typescript
export const createBrowserClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options: {
      auth: {
        persistSession: true,      // ✅ Guarda sesión en localStorage
        autoRefreshToken: true,    // ✅ Renueva tokens automáticamente
        detectSessionInUrl: true,  // ✅ Detecta cambios en URLs
      },
    },
  })
}
```

**Qué hace:**
- `persistSession`: Mantiene la sesión entre recargas de página
- `autoRefreshToken`: Renueva el JWT antes de que expire (cada 1 hora por defecto)
- `detectSessionInUrl`: Sincroniza sesión entre pestañas

### 2. Middleware (middleware.ts)

```typescript
// Intentar refrescar el token si existe
if (session?.user) {
  try {
    await supabase.auth.refreshSession()
  } catch (err) {
    console.error('Error refreshing session:', err)
  }
}
```

**Qué hace:**
- En cada request, intenta refrescar el token
- Mantiene la sesión activa mientras el usuario navegue
- Si el refresh falla, el usuario se desconecta

---

## ⚙️ Configuración en Supabase Console

Para verdaderas sesiones sin límite, necesitas extender el tiempo de expiración del JWT en Supabase:

### Paso 1: Acceder a Authentication Settings

1. Ve a [Supabase Console](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Policies**

### Paso 2: Configurar JWT Expiration

1. Busca **JWT Expiration Time** (por defecto 3600 segundos = 1 hora)
2. Cambia a un valor más alto:
   - **7 días** = 604800 segundos (recomendado)
   - **30 días** = 2592000 segundos (máximo seguro)
   - **Máximo** = 2147483647 segundos (68 años, pero no recomendado)

### Paso 3: Habilitar Refresh Token Rotation

1. En el mismo panel, asegúrate de que **Refresh Token Rotation** esté habilitado
2. Esto permite renovar tokens automáticamente

**Resultado:**
- JWT válido por 7 días (o el tiempo que configures)
- Se renueva automáticamente cada vez que se usa
- Con renovación continua = sesión indefinida

---

## 🔍 Cómo Funciona

### Flujo de Sesión Indefinida

```
1. Usuario inicia sesión
   ↓
2. Supabase genera JWT válido por 7 días
   ↓
3. Cliente guarda token en localStorage (persistSession)
   ↓
4. Usuario navega la aplicación
   ↓
5. Middleware intenta refrescar token en cada request
   ↓
6. Token se renueva (nuevos 7 días)
   ↓
7. Loop continúa mientras el usuario navegue
   ↓
8. Si usuario se va 8+ días, sesión expira
   ↓
9. Usuario redirigido a /login

```

### Con Auto-Refresh Habilitado

```
Token Expiration: 7 días
Refresh Interval: Automático en cada request
Resultado: Sesión indefinida mientras el usuario esté activo

Si el usuario se va:
- 1 día: Sesión sigue válida
- 7 días: Token expira, pero puede haber sido refrescado
- 8+ días sin actividad: Sesión expira completamente
```

---

## 🔐 Niveles de Persistencia

### Nivel 1: Solo Client (Ya configurado)

```typescript
persistSession: true  // Sesión en localStorage
autoRefreshToken: true // Renovación automática
```

**Resultado:** Sesión dura hasta que el token expire (7 días sin actividad)

### Nivel 2: Con Middleware (Ya configurado)

```typescript
// En middleware.ts
await supabase.auth.refreshSession()
```

**Resultado:** Sesión se renueva en cada request, durando indefinidamente

### Nivel 3: Con Backend Refresh (Opcional)

```typescript
// En servidor
const { data, error } = await supabase.auth.refreshSession()
```

**Resultado:** Control total del refresh desde servidor

---

## 📱 Sincronización Entre Pestañas

Gracias a `detectSessionInUrl: true`:

- Si inicias sesión en una pestaña, las otras se actualizan automáticamente
- Si cierras sesión en una pestaña, las otras también
- Las pestañas permanecen sincronizadas

---

## ⏰ Tiempos de Expiración

| Configuración | Tiempo | Comportamiento |
|---|---|---|
| JWT Expiration | 3600s (1h) | Token renueva cada 1 hora |
| JWT Expiration | 604800s (7d) | Token renueva cada 7 días |
| autoRefreshToken | true | Renovación automática |
| persistSession | true | Guardado en localStorage |

**Con esta configuración:** Sesión es efectivamente indefinida mientras el usuario esté activo.

---

## 🧪 Probar Sesión Sin Límite

### Test 1: Recarga de Página

1. Inicia sesión
2. Recarga la página (F5)
3. **Esperado:** Sigues logueado (desde localStorage)

### Test 2: Cierre del Navegador

1. Inicia sesión
2. Cierra completamente el navegador
3. Reabre y ve a la app
4. **Esperado:** Sigues logueado (desde localStorage)

### Test 3: Cambio de Pestaña

1. Inicia sesión en una pestaña
2. Abre la app en otra pestaña
3. **Esperado:** Automáticamente logueado en ambas

### Test 4: Token Refresh

1. Abre DevTools → Application → LocalStorage
2. Busca `sb-*-auth-token`
3. Copia el token (la parte `.xxxxxxx.xxxxxxx`)
4. Navega por la app durante 30 minutos
5. Copia el token nuevamente
6. **Esperado:** El token cambió (fue refrescado)

---

## 🚨 Casos de Expiración

La sesión **SÍ expira** en estos casos:

1. **Sin actividad 7+ días** (si no hay refresh)
   - Solución: Usuario vuelve a iniciar sesión

2. **Usuario cierra sesión** manualmente
   - Esperado: Redirige a /login

3. **Token revocado** desde admin (Supabase Console)
   - Esperado: Usuario desconectado forzadamente

4. **Cambio de contraseña**
   - Esperado: Sesión antigua se invalida

5. **Logout por dispositivo no autorizado**
   - Si configuras MFA: Sesión se invalida

---

## 🔒 Seguridad

### Recomendaciones

1. ✅ **Usar HTTPS en producción** (obligatorio para Supabase)
2. ✅ **Token en httpOnly cookie** (mejor que localStorage)
3. ✅ **Auto-refresh cada 1 hora** (valor seguro)
4. ✅ **Logout automático si usuario inactivo 30+ días** (opcional)

### localStorage vs httpOnly Cookie

Actual: **localStorage** (tokens visibles en DevTools)
- ✅ Menos seguro (XSS puede acceder)
- ✅ Más fácil de implementar
- ✅ Funciona bien en SPAs

Para máxima seguridad: **httpOnly cookie**
- ✅ Más seguro (XSS NO puede acceder)
- ✅ Requiere configuración adicional
- ✅ Mejor para apps sensibles

---

## 🛠️ Configuración Avanzada (Opcional)

### Logout Automático Después de X Días Sin Actividad

```typescript
// En un hook personalizado
const useSessionTimeout = () => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Logout automático después de 30 días
      supabase.auth.signOut()
    }, 30 * 24 * 60 * 60 * 1000) // 30 días

    return () => clearTimeout(timeout)
  }, [])
}
```

### Renovación Manual de Token

```typescript
const supabase = createBrowserClient()

// Renovar token manualmente en cualquier momento
const { data, error } = await supabase.auth.refreshSession()

if (error) {
  // Token expiró, redirigir a login
  router.push('/login')
}
```

---

## 📊 Flujo Actual en Retrofish Dashboard

```
┌─────────────────────────────────────────┐
│ Login: Usuario inicia sesión            │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Auth.ts: Guarda token en localStorage   │
│ - persistSession: true                  │
│ - autoRefreshToken: true                │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Middleware: En cada request              │
│ - Intenta refrescar token               │
│ - Si falla, puede mantener sesión       │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Dashboard: Usuario navega               │
│ - Sesión renovada automáticamente       │
│ - Token siempre válido                  │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Si expira: Logout automático             │
│ - Redirige a /login                     │
│ - Usuario debe iniciar sesión de nuevo  │
└─────────────────────────────────────────┘
```

---

## 📝 Próximos Pasos

1. ✅ **Verificar configuración de cliente** (ya hecha)
2. ✅ **Verificar middleware** (ya hecho)
3. **Acceder a Supabase Console** y cambiar JWT Expiration a 7 días
4. **Probar sesión sin límite** con los tests arriba
5. **Opcional:** Implementar logout automático después de X días

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa si ciajo el navegador?
La sesión se guarda en localStorage. Al reabrirlo, se recupera automáticamente.

### ¿Qué pasa si paso 8 días sin usar la app?
Después de 7 días (o el tiempo configurado), el token expira. Debes volver a iniciar sesión.

### ¿Puedo configurar 365 días de expiración?
Técnicamente sí, pero no es recomendado por seguridad. Lo ideal es 7-30 días con renovación automática.

### ¿Y si el usuario pierde conexión a internet?
La sesión sigue válida (localStorage). Al recuperar conexión, el token se sincroniza automáticamente.

### ¿Es seguro guardar tokens en localStorage?
Es "seguro" si usas HTTPS. El riesgo es XSS attacks. Para máxima seguridad, usa httpOnly cookies.

---

¡Listo! Tu aplicación ahora tiene sesiones sin límite de tiempo. 🚀
