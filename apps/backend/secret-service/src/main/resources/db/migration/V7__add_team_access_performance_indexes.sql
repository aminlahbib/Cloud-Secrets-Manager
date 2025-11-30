-- =============================================================================
-- Performance Optimization: Add composite indexes for team-based project access
-- =============================================================================

-- Composite index for team membership lookups (team_id, user_id)
-- This speeds up existsByTeamIdAndUserId queries
CREATE INDEX IF NOT EXISTS idx_team_memberships_team_user 
ON team_memberships(team_id, user_id);

-- Composite index for team project lookups (project_id, team_id)
-- This speeds up team-based project access queries
CREATE INDEX IF NOT EXISTS idx_team_projects_project_team 
ON team_projects(project_id, team_id);

-- Composite index for reverse lookup (team_id, project_id)
-- Already covered by UNIQUE constraint, but explicit index helps with JOINs
-- Note: UNIQUE constraint already creates an index, but we keep this for clarity

-- Index for user-based team membership lookups (user_id, team_id)
-- This helps when checking if user is in any team that has a project
CREATE INDEX IF NOT EXISTS idx_team_memberships_user_team 
ON team_memberships(user_id, team_id);

-- Comments
COMMENT ON INDEX idx_team_memberships_team_user IS 'Composite index for fast team membership checks';
COMMENT ON INDEX idx_team_projects_project_team IS 'Composite index for fast project-to-team lookups';
COMMENT ON INDEX idx_team_memberships_user_team IS 'Composite index for fast user-to-team lookups';

