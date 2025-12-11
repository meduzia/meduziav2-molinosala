-- Script de verificación y corrección para Meta Ads Sync
-- Ejecutar en Supabase SQL Editor si tienes problemas con la estructura

-- Verificar estructura actual de metrics_daily
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'metrics_daily'
ORDER BY ordinal_position;

-- Si la tabla existe pero falta la columna ad_id, agregarla:
-- ALTER TABLE metrics_daily ADD COLUMN IF NOT EXISTS ad_id text NOT NULL DEFAULT '';

-- Si necesitas recrear la tabla completamente (¡CUIDADO: elimina datos existentes!):
-- Ejecuta el script completo meta-ads-sync-tables.sql

-- Verificar que la columna ad_id existe después de la creación
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'metrics_daily' 
        AND column_name = 'ad_id'
    ) THEN
        RAISE EXCEPTION 'La columna ad_id no existe en metrics_daily. Ejecuta el script completo meta-ads-sync-tables.sql';
    ELSE
        RAISE NOTICE '✅ La columna ad_id existe correctamente en metrics_daily';
    END IF;
END $$;

