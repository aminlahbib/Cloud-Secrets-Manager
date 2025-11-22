-- Manual Migration Script: Add expiration and sharing support
-- Run this script manually if you're not using Flyway/Liquibase
-- Database: secrets
-- Date: 2024-01-XX

BEGIN;

-- ============================================
-- 1. Add expiration fields to secrets table
-- ============================================

-- Add expiresAt column (nullable, allows secrets without expiration)
ALTER TABLE secrets 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL;

-- Add expired column (defaults to false for existing secrets)
ALTER TABLE secrets 
ADD COLUMN IF NOT EXISTS expired BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_secrets_expires_at ON secrets(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_secrets_expired ON secrets(expired) WHERE expired = true;

-- Update existing secrets to have expired = false if NULL (safety check)
UPDATE secrets 
SET expired = false 
WHERE expired IS NULL;

-- Add comments to columns for documentation
COMMENT ON COLUMN secrets.expires_at IS 'Timestamp when the secret expires. NULL means the secret never expires.';
COMMENT ON COLUMN secrets.expired IS 'Flag indicating if the secret has been marked as expired. Used for quick filtering.';

-- ============================================
-- 2. Create shared_secrets table
-- ============================================

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

COMMIT;

-- Verification queries (run these to verify the migration)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'secrets' AND column_name IN ('expires_at', 'expired');
--
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'shared_secrets';

