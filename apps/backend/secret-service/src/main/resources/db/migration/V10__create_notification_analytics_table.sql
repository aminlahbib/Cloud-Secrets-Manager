-- Table to track notification analytics (opens, clicks, etc.)
CREATE TABLE IF NOT EXISTS notification_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(50),
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_notification_analytics_notification
        FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_analytics_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_analytics_user
    ON notification_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_analytics_notification
    ON notification_analytics(notification_id);

CREATE INDEX IF NOT EXISTS idx_notification_analytics_created
    ON notification_analytics(created_at DESC);
