# Email Notifications - Setup Guide

## Status
✅ **Implemented** - Code complete in `feature/email-notifications` branch  
⏸️ **Pending** - Requires SendGrid API key to activate

## Quick Setup

### 1. Get SendGrid API Key
- Sign up at [sendgrid.com](https://sendgrid.com) (free: 100 emails/day)
- Settings → API Keys → Create API Key
- Copy the key (shown only once)

### 2. Set Environment Variable
```bash
export SENDGRID_API_KEY="SG.your-api-key-here"
```

### 3. Test
```bash
cd apps/backend/secret-service
./mvnw spring-boot:run

# Create a project invitation via UI
# Check recipient's email
```

## Features
- **Invitations**: Email with accept link (7-day expiry)
- **Expiration Warnings**: Daily check at 9 AM for secrets expiring in 7 days
- **Membership Changes**: Role change notifications

## Configuration
```yaml
# application.yml
email:
  enabled: ${EMAIL_ENABLED:true}
  sendgrid:
    api-key: ${SENDGRID_API_KEY:}
  from:
    address: ${EMAIL_FROM_ADDRESS:noreply@cloudsecrets.com}
    name: ${EMAIL_FROM_NAME:Cloud Secrets Manager}

app:
  base-url: ${APP_BASE_URL:http://localhost:5173}
```

## Disable Emails
```bash
export EMAIL_ENABLED=false
```

## Files
- `EmailService.java` - SendGrid integration
- `InvitationService.java` - Sends invitation emails
- `SecretExpirationScheduler.java` - Daily expiration warnings

## Next Steps
1. Get SendGrid API key
2. Set `SENDGRID_API_KEY` environment variable
3. Test invitation flow
4. Merge to main when ready
