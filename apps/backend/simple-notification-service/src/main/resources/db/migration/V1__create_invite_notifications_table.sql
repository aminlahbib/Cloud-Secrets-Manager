-- Migration: Create invite_notifications table
-- Simple table for storing invitation notifications only

CREATE TABLE IF NOT EXISTS invite_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Nullable for invitations to non-existing users
    type VARCHAR(20) NOT NULL CHECK (type IN ('PROJECT_INVITATION', 'TEAM_INVITATION')),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    inviter_email VARCHAR(255),
    inviter_name VARCHAR(255),
    message TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for user notifications query (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_invite_notifications_user 
    ON invite_notifications(user_id, created_at DESC);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_invite_notifications_unread 
    ON invite_notifications(user_id, read_at) 
    WHERE read_at IS NULL;

-- Index for project lookups
CREATE INDEX IF NOT EXISTS idx_invite_notifications_project 
    ON invite_notifications(project_id) 
    WHERE project_id IS NOT NULL;

-- Index for team lookups
CREATE INDEX IF NOT EXISTS idx_invite_notifications_team 
    ON invite_notifications(team_id) 
    WHERE team_id IS NOT NULL;

