-- =============================================================================
-- Fix IP Address Column Type (INET -> VARCHAR)
-- =============================================================================
-- This migration fixes the ip_address column type to match the entity
-- =============================================================================

DO $$
BEGIN
    -- Check if ip_address column is INET type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'ip_address'
        AND data_type = 'inet'
        AND table_schema = 'public'
    ) THEN
        -- Convert INET to VARCHAR(255)
        -- First, convert existing values to text
        ALTER TABLE audit_logs ALTER COLUMN ip_address TYPE VARCHAR(255) USING ip_address::text;
        RAISE NOTICE 'Converted ip_address column from INET to VARCHAR(255)';
    ELSE
        RAISE NOTICE 'ip_address column is already VARCHAR or does not exist. No action needed.';
    END IF;
END $$;

