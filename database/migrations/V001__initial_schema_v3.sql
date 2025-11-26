-- =============================================================================
-- Cloud Secrets Manager - Initial Schema (Architecture v3)
-- =============================================================================
-- This migration creates the complete database schema for the new
-- Resource-Scoped RBAC architecture.
--
-- Key concepts:
--   - Users: Firebase-authenticated users
--   - Workflows: Personal organization containers (per-user)
--   - Projects: Collaborative containers for secrets
--   - Secrets: Encrypted key-value pairs within projects
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
-- Users are authenticated via Firebase. This table stores additional metadata
-- and links to our internal ID system.
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    platform_role VARCHAR(20) DEFAULT 'USER' 
        CHECK (platform_role IN ('USER', 'PLATFORM_ADMIN')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_platform_role ON users(platform_role);

-- =============================================================================
-- WORKFLOWS TABLE
-- =============================================================================
-- Workflows are personal organization containers. Each user has their own
-- workflows to organize projects. Workflows are NOT shared.
-- =============================================================================
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),  -- Optional icon identifier
    color VARCHAR(7),  -- Optional hex color code
    is_default BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_workflows_user_name UNIQUE(user_id, name)
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_display_order ON workflows(user_id, display_order);

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================
-- Projects are the core collaboration unit. Multiple users can access
-- the same project with different roles.
-- =============================================================================
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete support
    is_archived BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id),
    scheduled_permanent_delete_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_is_archived ON projects(is_archived);
CREATE INDEX idx_projects_deleted_at ON projects(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- WORKFLOW_PROJECTS TABLE (Junction)
-- =============================================================================
-- Maps projects to workflows. A project can appear in multiple users'
-- workflows (each user organizes it their own way).
-- =============================================================================
CREATE TABLE workflow_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_workflow_projects UNIQUE(workflow_id, project_id)
);

CREATE INDEX idx_workflow_projects_workflow ON workflow_projects(workflow_id);
CREATE INDEX idx_workflow_projects_project ON workflow_projects(project_id);

-- =============================================================================
-- PROJECT_MEMBERSHIPS TABLE
-- =============================================================================
-- Defines who has access to a project and their role.
-- Roles: OWNER, ADMIN, MEMBER, VIEWER
-- =============================================================================
CREATE TABLE project_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL 
        CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_project_memberships UNIQUE(project_id, user_id)
);

CREATE INDEX idx_memberships_project ON project_memberships(project_id);
CREATE INDEX idx_memberships_user ON project_memberships(user_id);
CREATE INDEX idx_memberships_role ON project_memberships(project_id, role);

-- =============================================================================
-- PROJECT_INVITATIONS TABLE
-- =============================================================================
-- Pending invitations for users who don't exist in the system yet.
-- When they sign up, invitations are auto-accepted.
-- =============================================================================
CREATE TABLE project_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL 
        CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    invited_by UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    message TEXT,  -- Optional invitation message
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED', 'DECLINED')),
    
    CONSTRAINT uq_project_invitations UNIQUE(project_id, email, status)
);

CREATE INDEX idx_invitations_email ON project_invitations(email);
CREATE INDEX idx_invitations_token ON project_invitations(token);
CREATE INDEX idx_invitations_project ON project_invitations(project_id);
CREATE INDEX idx_invitations_status ON project_invitations(status) WHERE status = 'PENDING';

-- =============================================================================
-- SECRETS TABLE
-- =============================================================================
-- Encrypted secrets belonging to a project.
-- Secret keys are unique within a project (not globally).
-- =============================================================================
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
    rotation_interval_days INTEGER,  -- Auto-rotation interval (optional)
    
    CONSTRAINT uq_secrets_project_key UNIQUE(project_id, secret_key)
);

CREATE INDEX idx_secrets_project ON secrets(project_id);
CREATE INDEX idx_secrets_key ON secrets(secret_key);
CREATE INDEX idx_secrets_expires ON secrets(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_secrets_created_by ON secrets(created_by);

-- =============================================================================
-- SECRET_VERSIONS TABLE
-- =============================================================================
-- Version history for secrets. Each update creates a new version.
-- =============================================================================
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

-- =============================================================================
-- AUDIT_LOGS TABLE
-- =============================================================================
-- Comprehensive audit trail for all actions.
-- =============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),  -- Human-readable name for display
    old_value JSONB,  -- Previous state (for updates)
    new_value JSONB,  -- New state (for creates/updates)
    metadata JSONB,   -- Additional context
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_project ON audit_logs(project_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);

-- Partition audit logs by month for better performance (optional, for production)
-- CREATE INDEX idx_audit_created_at_month ON audit_logs(date_trunc('month', created_at));

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_secrets_updated_at
    BEFORE UPDATE ON secrets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS (Documentation)
-- =============================================================================
COMMENT ON TABLE users IS 'Firebase-authenticated users with platform metadata';
COMMENT ON TABLE workflows IS 'Personal organization containers for projects (per-user)';
COMMENT ON TABLE projects IS 'Collaborative containers for secrets';
COMMENT ON TABLE workflow_projects IS 'Maps projects to user workflows for organization';
COMMENT ON TABLE project_memberships IS 'User access and roles within projects';
COMMENT ON TABLE project_invitations IS 'Pending invitations for new users';
COMMENT ON TABLE secrets IS 'Encrypted key-value secrets within projects';
COMMENT ON TABLE secret_versions IS 'Version history for secrets';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all actions';

COMMENT ON COLUMN project_memberships.role IS 'OWNER: full control, ADMIN: manage secrets/members, MEMBER: CRUD secrets, VIEWER: read-only';
COMMENT ON COLUMN projects.scheduled_permanent_delete_at IS 'When archived project will be permanently deleted (30 days after archive)';

