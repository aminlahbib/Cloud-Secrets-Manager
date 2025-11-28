-- =============================================================================
-- Manual Fix Script for Audit Database Schema
-- =============================================================================
-- Run this script directly on the audit database if Flyway migration doesn't run
-- Usage: psql -h localhost -U audit_user -d audit -f scripts/fix-audit-db-schema.sql
-- =============================================================================

-- Connect to audit database (run this manually: \c audit)

-- Check current schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

-- Step 1: Rename timestamp to created_at if exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'timestamp'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs RENAME COLUMN timestamp TO created_at;
        RAISE NOTICE 'Renamed timestamp column to created_at';
    END IF;
END $$;

-- Step 2: Ensure created_at column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'created_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        -- Update existing rows if any
        UPDATE audit_logs SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
        RAISE NOTICE 'Added created_at column';
    END IF;
END $$;

-- Step 3: Remove old columns if they exist
DO $$
BEGIN
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
END $$;

-- Step 4: Add new v3 columns if they don't exist
DO $$
BEGIN
    -- project_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'project_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN project_id UUID;
        RAISE NOTICE 'Added project_id column';
    END IF;
    
    -- user_id (nullable initially for migration)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column (nullable for migration)';
    END IF;
    
    -- resource_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'resource_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN resource_type VARCHAR(50) DEFAULT 'SECRET';
        -- Update existing rows
        UPDATE audit_logs SET resource_type = 'SECRET' WHERE resource_type IS NULL;
        -- Make NOT NULL
        ALTER TABLE audit_logs ALTER COLUMN resource_type SET NOT NULL;
        ALTER TABLE audit_logs ALTER COLUMN resource_type DROP DEFAULT;
        RAISE NOTICE 'Added resource_type column';
    END IF;
    
    -- resource_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'resource_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN resource_id VARCHAR(255);
        RAISE NOTICE 'Added resource_id column';
    END IF;
    
    -- resource_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'resource_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN resource_name VARCHAR(255);
        RAISE NOTICE 'Added resource_name column';
    END IF;
    
    -- old_value
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'old_value'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN old_value JSONB;
        RAISE NOTICE 'Added old_value column';
    END IF;
    
    -- new_value
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'new_value'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN new_value JSONB;
        RAISE NOTICE 'Added new_value column';
    END IF;
    
    -- metadata
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

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- Step 6: Verify schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

RAISE NOTICE 'Audit database schema migration completed successfully!';

