-- =============================================================================
-- Migration: Update secrets table to v3 schema
-- =============================================================================
-- This migration updates the secrets table from the old schema to v3.
-- The old schema had:
--   - id as bigint (auto-increment)
--   - created_by as varchar (email)
--   - No project_id column
--
-- The v3 schema has:
--   - id as UUID
--   - project_id UUID (required)
--   - created_by as UUID (references users.id)
-- =============================================================================

-- Backup old secrets (if any exist)
CREATE TABLE IF NOT EXISTS secrets_backup AS SELECT * FROM secrets;

-- Drop dependent objects first
DROP TABLE IF EXISTS secret_versions CASCADE;

-- Drop the old secrets table
DROP TABLE IF EXISTS secrets CASCADE;

-- Recreate secrets table with v3 schema
CREATE TABLE secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    secret_key VARCHAR(255) NOT NULL,
    encrypted_value TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_rotated_at TIMESTAMP WITH TIME ZONE,
    rotation_interval_days INTEGER,
    
    CONSTRAINT uq_secrets_project_key UNIQUE(project_id, secret_key)
);

-- Create indexes
CREATE INDEX idx_secrets_project ON secrets(project_id);
CREATE INDEX idx_secrets_key ON secrets(secret_key);
CREATE INDEX idx_secrets_expires ON secrets(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_secrets_created_by ON secrets(created_by);

-- Recreate secret_versions table
CREATE TABLE secret_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_id UUID NOT NULL REFERENCES secrets(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    encrypted_value TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    change_note TEXT,
    
    CONSTRAINT uq_secret_versions UNIQUE(secret_id, version_number)
);

CREATE INDEX idx_versions_secret ON secret_versions(secret_id);
CREATE INDEX idx_versions_number ON secret_versions(secret_id, version_number DESC);

-- Note: Old secret data is not migrated automatically because:
-- 1. We need to assign secrets to projects (which didn't exist before)
-- 2. created_by needs to be converted from email to UUID
-- If you need to migrate old data, do it manually after creating appropriate projects

