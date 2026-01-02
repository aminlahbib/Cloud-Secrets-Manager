-- Migration: Create notification service tables and indexes
-- This migration creates all necessary tables and indexes for the notification service

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL,
    read_at TIMESTAMP
);

-- Index for user notifications query (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON notifications(user_id, created_at DESC);

-- Composite index for batching queries (userId, type, readAt, createdAt)
CREATE INDEX IF NOT EXISTS idx_notifications_batching 
    ON notifications(user_id, type, read_at, created_at DESC) 
    WHERE read_at IS NULL;

-- Index for type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type 
    ON notifications(type);

-- Email deliveries table
CREATE TABLE IF NOT EXISTS email_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sendgrid_message_id VARCHAR(255),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for recipient email lookups
CREATE INDEX IF NOT EXISTS idx_email_deliveries_recipient 
    ON email_deliveries(recipient_email);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status 
    ON email_deliveries(status);

-- Composite index for cleanup queries (status, createdAt)
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status_created 
    ON email_deliveries(status, created_at);

-- Index for created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_email_deliveries_created 
    ON email_deliveries(created_at);

-- Notification analytics table
CREATE TABLE IF NOT EXISTS notification_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(50),
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for user analytics queries
CREATE INDEX IF NOT EXISTS idx_notification_analytics_user 
    ON notification_analytics(user_id);

-- Index for notification analytics queries
CREATE INDEX IF NOT EXISTS idx_notification_analytics_notification 
    ON notification_analytics(notification_id);

-- Composite index for analytics queries (userId, notificationId)
CREATE INDEX IF NOT EXISTS idx_notification_analytics_user_notification 
    ON notification_analytics(user_id, notification_id);

-- Index for created_at for time-based analytics
CREATE INDEX IF NOT EXISTS idx_notification_analytics_created 
    ON notification_analytics(created_at);

-- Users table (if not exists - shared with other services)
-- Note: This table may already exist from secret-service
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    notification_preferences JSONB
);

-- Index for email lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_email 
    ON users(email);

