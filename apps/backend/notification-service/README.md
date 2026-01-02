# Notification Service

The Notification Service is a Spring Boot microservice responsible for delivering notifications to users via multiple channels (email, in-app notifications via SSE).

## Features

- **Multi-channel Delivery**: Email (SendGrid) and in-app notifications (Server-Sent Events)
- **Event-Driven Architecture**: Consumes notification events from Google Cloud Pub/Sub
- **User Preferences**: Respects user notification preferences
- **Notification Batching**: Groups similar notifications to reduce spam
- **Analytics**: Tracks notification opens and clicks
- **Resilience**: Circuit breakers, retry logic, and error handling
- **Scalability**: Configurable thread pools, connection pooling, optimized queries

## Architecture

```
┌─────────────────┐
│  Secret Service │
│  (Publisher)    │
└────────┬────────┘
         │ Pub/Sub
         ▼
┌─────────────────────────┐
│  notifications-events   │
│      (Topic)            │
└────────┬────────────────┘
         │ Subscription
         ▼
┌─────────────────────────┐
│ Notification Service    │
│  - Pub/Sub Subscriber   │
│  - Email Service         │
│  - SSE Service           │
│  - Notification Handler  │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ SendGrid│ │  SSE   │
│  Email  │ │ Clients│
└────────┘ └────────┘
```

## API Endpoints

### Notifications

#### List Notifications
```
GET /api/notifications
```

**Query Parameters:**
- `unreadOnly` (boolean, default: false) - Filter unread notifications only
- `type` (string, optional) - Filter by notification type
- `startDate` (ISO datetime, optional) - Filter by start date
- `endDate` (ISO datetime, optional) - Filter by end date
- `page` (int, default: 0) - Page number
- `size` (int, default: 50, max: 100) - Page size

**Response:**
```json
{
  "content": [
    {
      "id": "uuid",
      "type": "SECRET_EXPIRING_SOON",
      "title": "Secret Expiration Warning",
      "body": "Your secret will expire soon",
      "metadata": {},
      "createdAt": "2024-01-01T00:00:00Z",
      "readAt": null
    }
  ],
  "totalElements": 100,
  "totalPages": 2,
  "number": 0,
  "size": 50
}
```

#### Mark Notification as Read
```
POST /api/notifications/{id}/read
```

**Response:** 204 No Content

#### Mark All as Read
```
POST /api/notifications/read-all
```

**Response:** 204 No Content

#### Stream Notifications (SSE)
```
GET /api/notifications/stream?token={jwt-token}
```

**Response:** Server-Sent Events stream

**Events:**
- `connected` - Connection established
- `notification` - New notification received

#### Send Test Notification
```
POST /api/notifications/test?type={notificationType}
```

**Query Parameters:**
- `type` (string, default: SECRET_EXPIRING_SOON) - Notification type

**Response:**
```json
{
  "id": "uuid",
  "type": "SECRET_EXPIRING_SOON",
  "title": "Test Notification",
  "body": "This is a test notification",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Analytics

#### Track Notification Open
```
POST /api/notifications/analytics/{notificationId}/open
```

**Response:** 204 No Content

#### Track Notification Action
```
POST /api/notifications/analytics/{notificationId}/action?action={actionName}
```

**Query Parameters:**
- `action` (string, required) - Action name (e.g., "view_project", "rotate_secret")

**Response:** 204 No Content

#### Get Analytics Summary
```
GET /api/notifications/analytics/summary
```

**Response:**
```json
{
  "totalOpens": 150,
  "totalClicks": 45
}
```

## Configuration

### Application Properties

See `application.yml` for full configuration options.

**Key Configuration:**
- `notifications.sse.timeout-ms` - SSE connection timeout (default: 1800000ms = 30 minutes)
- `notifications.batching.time-window-minutes` - Batching time window (default: 5 minutes)
- `notifications.pubsub.executor-thread-count` - Pub/Sub thread count (default: 4)
- `email.enabled` - Enable/disable email notifications
- `email.sendgrid.api-key` - SendGrid API key

### Environment Variables

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for required environment variables.

## Notification Types

- `SECRET_EXPIRING_SOON` - Secret expiration warning
- `PROJECT_INVITATION` - Project invitation
- `TEAM_INVITATION` - Team invitation
- `ROLE_CHANGED` - Role change notification
- `SECURITY_ALERT` - Security alert

## User Preferences

Users can control notification preferences via the `notification_preferences` JSONB field in the `users` table:

```json
{
  "email": true,
  "secretExpiration": true,
  "secretExpirationEmail": true,
  "secretExpirationInApp": true,
  "projectInvitations": true,
  "projectInvitationsEmail": true,
  "projectInvitationsInApp": true,
  "securityAlerts": true,
  "securityAlertsEmail": true,
  "securityAlertsInApp": true,
  "roleChangedEmail": true,
  "roleChangedInApp": true
}
```

## Error Handling

The service implements comprehensive error handling:

- **Circuit Breakers**: Protects against SendGrid API failures
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Dead Letter Queue**: Failed Pub/Sub messages can be routed to DLQ
- **Graceful Degradation**: Individual recipient failures don't block other recipients

## Monitoring

See [MONITORING_IMPLEMENTATION.md](MONITORING_IMPLEMENTATION.md) for monitoring setup.

**Key Metrics:**
- Notification delivery rates
- Email delivery success/failure rates
- SSE connection counts
- Processing latency
- Error rates by type

## Database Schema

See `src/main/resources/db/migration/V1__create_notification_tables.sql` for database schema.

**Tables:**
- `notifications` - In-app notifications
- `email_deliveries` - Email delivery tracking
- `notification_analytics` - Analytics data
- `users` - User data (shared with secret-service)

## Development

### Prerequisites

- Java 21
- Maven 3.8+
- PostgreSQL 16+
- Google Cloud SDK (for Pub/Sub)
- SendGrid account (for email)

### Running Locally

1. Start PostgreSQL and create database:
```bash
createdb secrets
```

2. Set environment variables:
```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/secrets
export SPRING_DATASOURCE_USERNAME=secret_user
export SPRING_DATASOURCE_PASSWORD=secret_pw
export GCP_PROJECT_ID=your-project-id
export SENDGRID_API_KEY=your-api-key
export JWT_SECRET=your-jwt-secret
```

3. Run the service:
```bash
mvn spring-boot:run
```

### Building

```bash
mvn clean package
```

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for deployment instructions.

## Troubleshooting

### Common Issues

**Issue: Notifications not being received**
- Check Pub/Sub subscription is active
- Verify user preferences allow notifications
- Check service logs for errors

**Issue: Emails not being sent**
- Verify SendGrid API key is configured
- Check circuit breaker status
- Review email delivery logs in database

**Issue: SSE connections dropping**
- Check SSE timeout configuration
- Verify network connectivity
- Review client-side reconnection logic

## Related Documentation

- [MONITORING_IMPLEMENTATION.md](MONITORING_IMPLEMENTATION.md) - Monitoring setup guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment and infrastructure guide

## License

See parent project LICENSE file.

