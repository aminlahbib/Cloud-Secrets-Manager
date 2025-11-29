-- =============================================================================
-- Teams Feature - Phase 1: Core Infrastructure
-- Create teams, team_memberships, and team_projects tables
-- =============================================================================

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Team memberships
CREATE TABLE team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('TEAM_OWNER', 'TEAM_ADMIN', 'TEAM_MEMBER')),
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- Team projects (many-to-many relationship)
CREATE TABLE team_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, project_id)
);

-- Indexes for performance
CREATE INDEX idx_teams_created_by ON teams(created_by);
CREATE INDEX idx_teams_is_active ON teams(is_active);
CREATE INDEX idx_team_memberships_team_id ON team_memberships(team_id);
CREATE INDEX idx_team_memberships_user_id ON team_memberships(user_id);
CREATE INDEX idx_team_projects_team_id ON team_projects(team_id);
CREATE INDEX idx_team_projects_project_id ON team_projects(project_id);

-- Comments
COMMENT ON TABLE teams IS 'Teams are collections of users that can collaborate on multiple projects';
COMMENT ON TABLE team_memberships IS 'Many-to-many relationship between teams and users with roles';
COMMENT ON TABLE team_projects IS 'Many-to-many relationship between teams and projects';

COMMENT ON COLUMN teams.name IS 'Team name (e.g., "Engineering Team", "DevOps")';
COMMENT ON COLUMN teams.description IS 'Optional team description';
COMMENT ON COLUMN teams.created_by IS 'User who created the team (becomes TEAM_OWNER)';
COMMENT ON COLUMN teams.is_active IS 'Soft delete flag for teams';

COMMENT ON COLUMN team_memberships.role IS 'Team role: TEAM_OWNER (full control), TEAM_ADMIN (manage members/projects), TEAM_MEMBER (view and work)';
COMMENT ON COLUMN team_projects.added_by IS 'User who added the project to the team';

