-- Migration: Add expiration fields to secrets table
-- Description: Adds expiresAt and expired columns to support secret expiration/TTL management
-- Date: 2024-01-XX

-- Add expiresAt column (nullable, allows secrets without expiration)
ALTER TABLE secrets 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL;

-- Add expired column (defaults to false for existing secrets)
ALTER TABLE secrets 
ADD COLUMN IF NOT EXISTS expired BOOLEAN NOT NULL DEFAULT false;

-- Create index on expiresAt for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_secrets_expires_at ON secrets(expires_at) WHERE expires_at IS NOT NULL;

-- Create index on expired flag for quick filtering
CREATE INDEX IF NOT EXISTS idx_secrets_expired ON secrets(expired) WHERE expired = true;

-- Update existing secrets to have expired = false if NULL (safety check)
UPDATE secrets 
SET expired = false 
WHERE expired IS NULL;

-- Add comment to columns for documentation
COMMENT ON COLUMN secrets.expires_at IS 'Timestamp when the secret expires. NULL means the secret never expires.';
COMMENT ON COLUMN secrets.expired IS 'Flag indicating if the secret has been marked as expired. Used for quick filtering.';

