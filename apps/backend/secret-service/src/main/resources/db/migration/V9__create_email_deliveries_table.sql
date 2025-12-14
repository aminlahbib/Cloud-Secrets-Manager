-- Table to track email delivery status
CREATE TABLE IF NOT EXISTS email_deliveries (
    id UUID PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sendgrid_message_id VARCHAR(255),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_recipient
    ON email_deliveries(recipient_email);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_status
    ON email_deliveries(status);

CREATE INDEX IF NOT EXISTS idx_email_deliveries_created
    ON email_deliveries(created_at DESC);
