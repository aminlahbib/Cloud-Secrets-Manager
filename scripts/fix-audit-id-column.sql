-- =============================================================================
-- Quick Fix: Drop and Recreate audit_logs table with UUID id
-- =============================================================================
-- Run this if you want to fix the issue immediately without waiting for V2 migration
-- Usage: psql -h localhost -U audit_user -d audit -f scripts/fix-audit-id-column.sql
-- =============================================================================

-- Drop the old table (this will delete all audit logs)
DROP TABLE IF EXISTS audit_logs CASCADE;

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
    ip_address VARCHAR(255),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_audit_project ON audit_logs(project_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

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

SELECT 'audit_logs table recreated with UUID id successfully!' AS status;

