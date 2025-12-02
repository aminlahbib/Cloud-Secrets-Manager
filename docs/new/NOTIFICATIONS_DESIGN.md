## Notifications & Email – Architecture Overview

This document describes the planned notifications system for Cloud Secrets Manager.

### Goals

- Provide a consistent model for **user notifications** across channels:
  - In-app toasts (already implemented)
  - In-app notification list / inbox
  - Email notifications
- Respect **per-user preferences** for categories such as secret expiration, invitations, and security alerts.
- Integrate cleanly with our existing **Google Cloud** stack (GKE, Firebase / Google Identity).

### Current State (Baseline)

- **Backend**
  - `users.notification_preferences` (JSONB) + `timezone` + `date_format` already exist (`V5__add_user_preferences.sql`).
  - `User` entity exposes `notificationPreferences`, `timezone`, `dateFormat`.
  - `PreferencesController` reads and updates notification preferences and time/date settings.
  - `EmailService` (SendGrid) can send:
    - Project invitation emails
    - Secret expiration warnings
    - Membership role change notifications
  - Secret expiration scheduler and invitation flows call `EmailService` directly.

- **Frontend**
  - `NotificationContext` provides in-app toast notifications.
  - `SettingsPage` exposes a **Notifications** section that lets users toggle:
    - `email`
    - `secretExpiration`
    - `projectInvitations`
    - `securityAlerts`
  - These preferences are sent to the backend via `preferencesService.updatePreferences`.

### Target Architecture

- Introduce a generic **`NotificationEvent`** model published by backend services.
- Use **Google Pub/Sub** (`notifications-events` topic) for decoupled event delivery.
- Add a dedicated **notification service** that:
  - Subscribes to `notifications-events`.
  - Looks up user notification preferences.
  - Persists in-app notifications to a `notifications` table.
  - Sends emails via `EmailService` when preferences allow.
- Expose a small HTTP API for the frontend to:
  - List notifications (`GET /api/notifications`)
  - Mark notifications as read.

### Phases

1. **Phase 1 – Baseline & Documentation (this branch)**
   - Confirm existing preferences model (done).
   - Document current state and target architecture (this file).

2. **Phase 2 – Event Model & Pub/Sub Publisher**
   - Define `NotificationType` and `NotificationEvent` DTOs.
   - Add Pub/Sub configuration in `secret-service`.
   - Publish events from invitation flows, role changes, and secret-expiration scheduler.

3. **Phase 3 – Notification Service**
   - Create a new Spring Boot service for consuming `NotificationEvent`s.
   - Implement user preference checks and in-app notification persistence.
   - Reuse/move `EmailService` into this service for outbound email.

4. **Phase 4 – In-App Inbox & APIs**
   - Add `notifications` table and HTTP endpoints to list and mark notifications as read.
   - Implement frontend notification dropdown + notifications page using React Query.

5. **Phase 5 – GCP Hardening**
   - Create Pub/Sub topics/subscriptions via IaC.
   - Wire service accounts and IAM roles for publisher/consumer.
   - Optionally move schedulers to Cloud Scheduler / CronJobs.

This phased approach lets us ship value incrementally while aligning with our existing Google Cloud footprint.


### Implementation Status (as of current branch)

- **Phase 1 – Baseline & Documentation**: completed.
- **Phase 2 – Event Model & Pub/Sub Publisher**: completed.
  - `NotificationType` / `NotificationEvent` DTOs created in `secret-service`.
  - Pub/Sub publisher configured; invitations, role changes, and secret-expiration flows all emit `NotificationEvent`s.
- **Phase 3 – Notification Service (backend)**: completed.
  - New `notification-service` module consumes events from the `notifications-events` topic.
  - User preferences are read from `users.notification_preferences` and enforced in `NotificationHandler`.
  - Notifications are persisted into the shared `notifications` table.
  - Centralized `EmailService` in `notification-service` sends:
    - Project invitation emails
    - Secret expiration warnings
    - Membership role-change emails
- **Phase 4 – In-App Inbox & APIs (backend only)**: partially completed.
  - `GET /api/notifications`, `POST /api/notifications/{id}/read`, and `POST /api/notifications/read-all` are implemented in `notification-service`.
  - Frontend notification dropdown / notifications page are still TODO.
- **Phase 5 – GCP Hardening**: not started yet.


