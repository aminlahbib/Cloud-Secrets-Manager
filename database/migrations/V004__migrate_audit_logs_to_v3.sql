-- =============================================================================
-- MIGRATION: Audit Logs to v3 Schema
-- =============================================================================
-- This migration transforms the audit_logs table from v2 to v3 schema
-- 
-- Changes:
-- 1. Change id from BIGSERIAL to UUID
-- 2. Add project_id column (nullable UUID)
-- 3. Replace username (VARCHAR) with user_id (UUID)
-- 4. Replace secretKey (VARCHAR) with resource_type + resource_id
-- 5. Add resource_name, old_value, new_value, metadata (JSONB)
-- 6. Rename timestamp to created_at
-- 7. Update indexes
-- =============================================================================

-- Step 1: Create new table with v3 schema
CREATE TABLE IF NOT EXISTS audit_logs_v3 (
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
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create indexes on new table
CREATE INDEX idx_audit_v3_project ON audit_logs_v3(project_id);
CREATE INDEX idx_audit_v3_user ON audit_logs_v3(user_id);
CREATE INDEX idx_audit_v3_action ON audit_logs_v3(action);
CREATE INDEX idx_audit_v3_resource ON audit_logs_v3(resource_type, resource_id);
CREATE INDEX idx_audit_v3_created_at ON audit_logs_v3(created_at DESC);

-- Step 3: Migrate existing data (if any exists)
-- Note: This assumes we can map username to user_id via a users table
-- If no users table exists in audit DB, we'll need to handle this differently
DO $$
DECLARE
    v_user_id UUID;
    v_project_id UUID;
BEGIN
    -- Check if old table exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
        -- Try to migrate existing data
        -- For username -> user_id mapping, we'll need to query the users table
        -- If users table doesn't exist in audit DB, we'll set user_id to a default or skip migration
        
        -- Check if we can access users from secrets database
        -- For now, we'll create a mapping approach
        
        -- Insert migrated records
        INSERT INTO audit_logs_v3 (
            project_id,
            user_id,
            action,
            resource_type,
            resource_id,
            resource_name,
            ip_address,
            user_agent,
            created_at,
            metadata
        )
        SELECT 
            NULL as project_id,  -- Old data doesn't have project context
            gen_random_uuid() as user_id,  -- Generate UUID for legacy data (will need manual mapping)
            action,
            'SECRET' as resource_type,  -- Assume all old entries are SECRET operations
            secret_key as resource_id,
            secret_key as resource_name,
            ip_address::INET,
            user_agent,
            timestamp as created_at,
            jsonb_build_object(
                'legacy_username', username,
                'migrated_from_v2', true
            ) as metadata
        FROM audit_logs
        WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs');
        
        RAISE NOTICE 'Migrated % records from audit_logs to audit_logs_v3', (SELECT COUNT(*) FROM audit_logs_v3);
    ELSE
        RAISE NOTICE 'No existing audit_logs table found, skipping data migration';
    END IF;
END $$;

-- Step 4: Drop old table and rename new table
DO $$
BEGIN
    -- Drop old table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = 'public') THEN
        DROP TABLE audit_logs CASCADE;
        RAISE NOTICE 'Dropped old audit_logs table';
    END IF;
    
    -- Rename new table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs_v3' AND table_schema = 'public') THEN
        ALTER TABLE audit_logs_v3 RENAME TO audit_logs;
        RAISE NOTICE 'Renamed audit_logs_v3 to audit_logs';
    END IF;
END $$;

-- Step 5: Recreate indexes with correct names (if table was renamed)
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);

-- Step 6: Add comments
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all actions (v3 schema)';
COMMENT ON COLUMN audit_logs.project_id IS 'Project context for the audit event (nullable for platform-level events)';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource (SECRET, PROJECT, MEMBER, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'Identifier of the resource';
COMMENT ON COLUMN audit_logs.resource_name IS 'Human-readable name for display';
COMMENT ON COLUMN audit_logs.old_value IS 'Previous state (for updates)';
COMMENT ON COLUMN audit_logs.new_value IS 'New state (for creates/updates)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context and metadata';

-- =============================================================================
-- NOTES:
-- =============================================================================
-- 1. This migration assumes the audit database is separate from secrets database
-- 2. If users table exists in audit DB, update the migration to properly map username -> user_id
-- 3. Legacy data will have NULL project_id - this is expected for v2 data
-- 4. Legacy data will have generated UUIDs for user_id - manual mapping may be needed
-- 5. All legacy entries are marked as resource_type='SECRET' and have metadata.migrated_from_v2=true
-- =============================================================================

