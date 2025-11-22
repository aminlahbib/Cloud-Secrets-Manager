-- Migration: Create shared_secrets table
-- Description: Creates table to track which secrets are shared with which users
-- Date: 2024-01-XX

-- Create shared_secrets table
CREATE TABLE IF NOT EXISTS shared_secrets (
    id BIGSERIAL PRIMARY KEY,
    secret_key VARCHAR(255) NOT NULL,
    shared_with VARCHAR(255) NOT NULL,
    shared_by VARCHAR(255) NOT NULL,
    permission VARCHAR(50),
    shared_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_secret_shared_with UNIQUE (secret_key, shared_with)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_shared_secrets_secret_key ON shared_secrets(secret_key);
CREATE INDEX IF NOT EXISTS idx_shared_secrets_shared_with ON shared_secrets(shared_with);
CREATE INDEX IF NOT EXISTS idx_shared_secrets_secret_shared_with ON shared_secrets(secret_key, shared_with);

-- Add comments for documentation
COMMENT ON TABLE shared_secrets IS 'Tracks which secrets are shared with which users and their permission levels';
COMMENT ON COLUMN shared_secrets.secret_key IS 'The key of the secret being shared';
COMMENT ON COLUMN shared_secrets.shared_with IS 'Username or email of the user the secret is shared with';
COMMENT ON COLUMN shared_secrets.shared_by IS 'Username of the user who shared the secret';
COMMENT ON COLUMN shared_secrets.permission IS 'Permission level (READ, WRITE, etc.) for the shared secret';
COMMENT ON COLUMN shared_secrets.shared_at IS 'Timestamp when the secret was shared';

