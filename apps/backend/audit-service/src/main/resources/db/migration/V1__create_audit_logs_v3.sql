-- =============================================================================
-- Audit Service Database Migration - V3 Schema
-- =============================================================================
-- This migration creates/updates the audit_logs table to v3 schema
-- =============================================================================

-- Check if table exists and needs migration
DO $$
DECLARE
    v_has_old_schema BOOLEAN := FALSE;
    v_has_bigint_id BOOLEAN := FALSE;
    v_row_count INTEGER := 0;
BEGIN
    -- Check if table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'audit_logs' 
        AND table_schema = 'public'
    ) THEN
        -- Check if id column is BIGINT (old schema)
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'audit_logs' 
            AND column_name = 'id'
            AND data_type = 'bigint'
            AND table_schema = 'public'
        ) INTO v_has_bigint_id;
        
        -- Check if has old columns (timestamp, username, secret_key)
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'audit_logs' 
            AND column_name IN ('timestamp', 'username', 'secret_key')
            AND table_schema = 'public'
        ) INTO v_has_old_schema;
        
        -- Get row count
        SELECT COUNT(*) INTO v_row_count FROM audit_logs;
        
        -- If table has old schema (BIGINT id), we need to recreate it
        IF v_has_bigint_id THEN
            RAISE NOTICE 'Detected old schema with BIGINT id. Recreating table...';
            
            -- Drop the old table (data will be lost, but this is expected for migration)
            -- In production, you might want to backup first
            DROP TABLE IF EXISTS audit_logs CASCADE;
            RAISE NOTICE 'Dropped old audit_logs table';
        END IF;
    END IF;
    
    -- Create table with v3 schema (if it doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'audit_logs' 
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID,
            user_id UUID NOT NULL,
            action VARCHAR(50) NOT NULL,
            resource_type VARCHAR(50) NOT NULL,
            resource_id VARCHAR(255),
            resource_name VARCHAR(255),
            old_value JSONB,
            new_value JSONB,
            metadata JSONB,
            ip_address VARCHAR(255),
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created audit_logs table with v3 schema';
    END IF;
END $$;
    
-- Ensure all required columns exist (for tables that were just created or partially migrated)
DO $$
BEGIN
    -- Rename timestamp to created_at if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'timestamp'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs RENAME COLUMN timestamp TO created_at;
        RAISE NOTICE 'Renamed timestamp column to created_at';
    END IF;
    
    -- Ensure created_at column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    -- Remove old columns if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'username'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs DROP COLUMN username;
        RAISE NOTICE 'Dropped username column';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'secret_key'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs DROP COLUMN secret_key;
        RAISE NOTICE 'Dropped secret_key column';
    END IF;
    
    -- Add new columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'project_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN project_id UUID;
        RAISE NOTICE 'Added project_id column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column (nullable for migration)';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'resource_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN resource_type VARCHAR(50) DEFAULT 'SECRET';
        UPDATE audit_logs SET resource_type = 'SECRET' WHERE resource_type IS NULL;
        ALTER TABLE audit_logs ALTER COLUMN resource_type SET NOT NULL;
        ALTER TABLE audit_logs ALTER COLUMN resource_type DROP DEFAULT;
        RAISE NOTICE 'Added resource_type column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'resource_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN resource_id VARCHAR(255);
        RAISE NOTICE 'Added resource_id column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'resource_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN resource_name VARCHAR(255);
        RAISE NOTICE 'Added resource_name column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'old_value'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN old_value JSONB;
        RAISE NOTICE 'Added old_value column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'new_value'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN new_value JSONB;
        RAISE NOTICE 'Added new_value column';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'metadata'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN metadata JSONB;
        RAISE NOTICE 'Added metadata column';
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- Add comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all actions (v3 schema)';
COMMENT ON COLUMN audit_logs.project_id IS 'Project context for the audit event (nullable for platform-level events)';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource (SECRET, PROJECT, MEMBER, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'Identifier of the resource';
COMMENT ON COLUMN audit_logs.resource_name IS 'Human-readable name for display';
COMMENT ON COLUMN audit_logs.old_value IS 'Previous state (for updates)';
COMMENT ON COLUMN audit_logs.new_value IS 'New state (for creates/updates)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context and metadata';

