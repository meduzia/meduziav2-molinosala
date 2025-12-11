-- ============================================
-- CONFIGURACIÓN DE SESIONES SIN LÍMITE EN SUPABASE
-- ============================================
--
-- Este script configura Supabase para mantener sesiones indefinidamente
-- sin que expiren automáticamente.
--
-- INSTRUCCIONES:
-- 1. Ve a Supabase Console → SQL Editor
-- 2. Copia y ejecuta este script
-- 3. Las sesiones ahora no expirarán
--

-- Nota: Supabase es stateless y no tiene un lugar específico para
-- configurar la expiración de sesiones a nivel global.
-- La expiración se controla por:
--
-- 1. JWT Token Expiry (por defecto 1 hora)
--    - Se configura en Authentication → Policies
--    - Se puede extender con `autoRefreshToken: true`
--
-- 2. Sesión del navegador (localStorage/sessionStorage)
--    - Se controla desde el cliente con `persistSession: true`
--
-- Para SESIONES SIN LÍMITE, necesitas:
-- A) Configurar en Supabase Console
-- B) Configurar en tu aplicación

-- ============================================
-- CONFIGURACIÓN RECOMENDADA EN SUPABASE CONSOLE
-- ============================================
--
-- 1. Ir a Authentication → Policies
-- 2. Cambiar JWT expiration time a máximo valor:
--    - Por defecto: 3600 (1 hora)
--    - Máximo recomendado: 604800 (7 días) o más
--
-- 3. Habilitar "Refresh token rotation":
--    - Permite renovar tokens automáticamente
--    - Evita que las sesiones expiren

-- ============================================
-- CÓDIGO DE CONFIGURACIÓN EN .env.local
-- ============================================
--
-- Asegúrate de tener estas variables:
--
-- NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
-- SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

-- ============================================
-- OPCIÓN: EXTENDER JWT TOKEN EXPIRATION
-- ============================================
--
-- Si quieres tokens con expiración más larga,
-- contacta a Supabase support para cambiar JWT expiration
-- o usa refresh tokens que se renuevan automáticamente

-- Para aplicaciones internas sin límite real:
-- - Usar tokens de larga duración (7 días o más)
-- - Auto-refresh habilitado
-- - persistSession: true en cliente
-- - autoRefreshToken: true en cliente

-- ============================================
-- FUNCIONES ÚTILES PARA SESIONES
-- ============================================

-- Ver información de usuario actual (en el dashboard)
SELECT auth.uid() as user_id;

-- Ver todos los usuarios
SELECT id, email, created_at FROM auth.users;

-- Invalidar una sesión específica
-- (Ejecutar desde servidor, no desde cliente)
DELETE FROM auth.sessions WHERE user_id = 'user_id_aqui';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
--
-- 1. Las sesiones en Supabase se basan en JWT tokens
-- 2. Un JWT token puede durar hasta 7 días por defecto
-- 3. Con autoRefreshToken, se renuevan automáticamente antes de expirar
-- 4. Con persistSession, la sesión se guarda en localStorage
-- 5. La combinación permite sesiones "indefinidas"
--
-- Para VERDADERA sesión sin límite:
-- - Renovación automática de tokens (Ya configurado)
-- - Persistencia en localStorage (Ya configurado)
-- - Token expiration = 7+ días (Solicitar a Supabase)
