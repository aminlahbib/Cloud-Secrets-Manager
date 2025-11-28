-- =============================================================================
-- Fix Audit Logs ID Column Type (BIGINT -> UUID)
-- =============================================================================
-- This migration fixes the id column type if it's still BIGINT
-- =============================================================================

DO $$
DECLARE
    v_has_bigint_id BOOLEAN := FALSE;
BEGIN
    -- Check if id column is BIGINT (old schema)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' 
        AND column_name = 'id'
        AND data_type = 'bigint'
        AND table_schema = 'public'
    ) INTO v_has_bigint_id;
    
    -- If table has BIGINT id, we need to recreate it
    IF v_has_bigint_id THEN
        RAISE NOTICE 'Detected BIGINT id column. Recreating table with UUID id...';
        
        -- Drop the old table (data will be lost, but this is expected for migration)
        -- In production, you might want to backup first
        DROP TABLE IF EXISTS audit_logs CASCADE;
        RAISE NOTICE 'Dropped old audit_logs table with BIGINT id';
        
        -- Create new table with UUID id
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
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created audit_logs table with UUID id';
        
        -- Create indexes
        CREATE INDEX idx_audit_project ON audit_logs(project_id);
        CREATE INDEX idx_audit_user ON audit_logs(user_id);
        CREATE INDEX idx_audit_action ON audit_logs(action);
        CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
        CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
        
        RAISE NOTICE 'Created indexes on audit_logs table';
    ELSE
        RAISE NOTICE 'ID column is already UUID or table does not exist. No action needed.';
    END IF;
END $$;

