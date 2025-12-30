-- Migration: Add onboarding_completed column to users table
-- Purpose: Track whether users have completed the onboarding process
-- Date: 2025-12-30

-- Add onboarding_completed column with default value of false
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing users to have onboarding_completed = true (they've already been using the system)
-- This assumes existing users have already completed onboarding
UPDATE users 
SET onboarding_completed = TRUE 
WHERE onboarding_completed = FALSE;

-- Add comment to column for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Indicates whether the user has completed the initial onboarding process';

