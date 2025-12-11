-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Retrofish Dashboard - Supabase
-- ==============================================

-- Habilitar RLS en las tablas principales
ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_performance ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- TABLA: creatives
-- ==============================================

-- Policy: Los usuarios pueden ver todos los creativos
CREATE POLICY "Anyone can view creatives"
  ON creatives
  FOR SELECT
  USING (true);

-- Policy: Los usuarios autenticados pueden crear creativos
CREATE POLICY "Authenticated users can create creatives"
  ON creatives
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Los usuarios pueden actualizar sus propios creativos
CREATE POLICY "Users can update their own creatives"
  ON creatives
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' IN ('admin', 'manager')
  ));

-- Policy: Solo admins pueden eliminar creativos
CREATE POLICY "Only admins can delete creatives"
  ON creatives
  FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- ==============================================
-- TABLA: ads_performance
-- ==============================================

-- Policy: Todos pueden ver datos de performance
CREATE POLICY "Anyone can view ads performance"
  ON ads_performance
  FOR SELECT
  USING (true);

-- Policy: Solo sistemas/admins pueden insertar datos de performance
CREATE POLICY "Only service role can insert ads performance"
  ON ads_performance
  FOR INSERT
  WITH CHECK (
    -- Permitir service role (n8n workflows)
    auth.jwt() ->> 'role' = 'service_role'
    OR
    -- O usuarios admin
    auth.uid() IN (
      SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Solo admins pueden actualizar datos de performance
CREATE POLICY "Only admins can update ads performance"
  ON ads_performance
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- Policy: Solo admins pueden eliminar datos de performance
CREATE POLICY "Only admins can delete ads performance"
  ON ads_performance
  FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- ==============================================
-- AGREGAR COLUMNA user_id A CREATIVES (si no existe)
-- ==============================================

-- Agregar columna user_id para tracking de propietario
ALTER TABLE creatives
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Crear índice para mejorar performance de queries con user_id
CREATE INDEX IF NOT EXISTS idx_creatives_user_id ON creatives(user_id);

-- ==============================================
-- FUNCIONES HELPER
-- ==============================================

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (auth.jwt() ->> 'role') = 'service_role'
    OR
    (
      SELECT raw_user_meta_data->>'role' = 'admin'
      FROM auth.users
      WHERE id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es manager o admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (auth.jwt() ->> 'role') = 'service_role'
    OR
    (
      SELECT raw_user_meta_data->>'role' IN ('admin', 'manager')
      FROM auth.users
      WHERE id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- CONFIGURACIÓN DE AUTH
-- ==============================================

-- Crear tabla de perfiles de usuario (opcional, para metadata adicional)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'analyst' CHECK (role IN ('admin', 'manager', 'analyst', 'creative')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'analyst'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil al registrar usuario
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ==============================================

-- Índices para ads_performance (si no existen)
CREATE INDEX IF NOT EXISTS idx_ads_performance_date ON ads_performance(date DESC);
CREATE INDEX IF NOT EXISTS idx_ads_performance_campaign ON ads_performance(campaign_name);
CREATE INDEX IF NOT EXISTS idx_ads_performance_destination ON ads_performance(destination);
CREATE INDEX IF NOT EXISTS idx_ads_performance_cpa ON ads_performance(cpa DESC);

-- Índices para creatives
CREATE INDEX IF NOT EXISTS idx_creatives_status ON creatives(status);
CREATE INDEX IF NOT EXISTS idx_creatives_created_at ON creatives(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creatives_campaign ON creatives(campaign);

-- ==============================================
-- COMENTARIOS
-- ==============================================

COMMENT ON POLICY "Anyone can view creatives" ON creatives IS
  'Permite a todos los usuarios ver creativos. Cambiar a auth.uid() IS NOT NULL si quieres requerir autenticación.';

COMMENT ON POLICY "Only service role can insert ads performance" ON ads_performance IS
  'Solo workflows de n8n (service role) y admins pueden insertar datos de performance.';

COMMENT ON FUNCTION is_admin() IS
  'Función helper para verificar si el usuario actual es administrador.';

-- ==============================================
-- VERIFICACIÓN
-- ==============================================

-- Para verificar que las políticas están activas, ejecuta:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('creatives', 'ads_performance');
