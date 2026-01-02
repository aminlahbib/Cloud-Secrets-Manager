-- Migration: Add data retention policy support
-- This migration adds comments and prepares for data retention policies

-- Add comments to tables for documentation
COMMENT ON TABLE notifications IS 'In-app notifications for users. Consider archiving notifications older than 90 days.';
COMMENT ON TABLE email_deliveries IS 'Email delivery tracking. Consider archiving records older than 180 days.';
COMMENT ON TABLE notification_analytics IS 'Analytics data for notifications. Consider archiving records older than 365 days.';

-- Add index for efficient cleanup queries on notifications (created_at for old notifications)
-- This index already exists from V1, but adding comment for clarity
COMMENT ON INDEX idx_notifications_user_created IS 'Index for user notification queries and potential cleanup by date';

-- Note: Actual data retention/cleanup should be implemented as a scheduled job
-- Example cleanup query (to be run periodically):
-- DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days' AND read_at IS NOT NULL;
-- DELETE FROM email_deliveries WHERE created_at < NOW() - INTERVAL '180 days' AND status IN ('SENT', 'DELIVERED', 'FAILED');
-- DELETE FROM notification_analytics WHERE created_at < NOW() - INTERVAL '365 days';

