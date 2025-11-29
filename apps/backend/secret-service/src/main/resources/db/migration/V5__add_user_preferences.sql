-- Add user preferences columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "secretExpiration": true, "projectInvitations": true, "securityAlerts": true}'::jsonb,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY';

-- Add index for preferences queries if needed
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone);

COMMENT ON COLUMN users.notification_preferences IS 'User notification preferences stored as JSON';
COMMENT ON COLUMN users.timezone IS 'User timezone preference (e.g., UTC, America/New_York)';
COMMENT ON COLUMN users.date_format IS 'User date format preference (e.g., MM/DD/YYYY, DD/MM/YYYY)';

