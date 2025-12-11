-- Script alternativo: Solo agregar columna si falta (sin perder datos)
-- Usa este script si ya tienes datos en metrics_daily

-- Verificar si la columna ad_id existe
DO $$
BEGIN
    -- Si la tabla existe pero no tiene la columna ad_id
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'metrics_daily'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metrics_daily' 
        AND column_name = 'ad_id'
    ) THEN
        -- Agregar la columna ad_id
        ALTER TABLE metrics_daily 
        ADD COLUMN ad_id text;
        
        -- Si hay datos existentes, necesitarás actualizar ad_id manualmente
        -- o hacerlo desde el workflow n8n
        
        RAISE NOTICE '✅ Columna ad_id agregada a metrics_daily';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'metrics_daily' 
        AND column_name = 'ad_id'
    ) THEN
        RAISE NOTICE '✅ La columna ad_id ya existe en metrics_daily';
    ELSE
        RAISE NOTICE 'ℹ️ La tabla metrics_daily no existe. Ejecuta el script completo meta-ads-sync-tables.sql';
    END IF;
END $$;

-- Verificar estructura completa de metrics_daily
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'metrics_daily'
ORDER BY ordinal_position;

