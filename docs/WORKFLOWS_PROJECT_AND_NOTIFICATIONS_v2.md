## Project & Notification Workflows – v2 (with Notification Service)

This document captures the **updated end-to-end workflows** for:
- Project lifecycle (create, invite, accept, membership changes)
- Secret expiration handling
- The **new `notification-service`** and Pub/Sub based notification pipeline.

All diagrams use **mermaid** so they can be rendered directly in GitHub / docs tools.

---

## 1. High-Level System View (with Notification Service)

```mermaid
flowchart LR
    subgraph Frontend
      UI[React App]
    end

    subgraph Backend
      SS[Secret Service]
      NS[Notification Service]
      AS[Audit Service]
    end

    subgraph Infra
      PUB[(Pub/Sub Topic\nnotifications-events)]
      SUB[(Subscription\nnotifications-events-sub)]
      DB[(PostgreSQL\nsecrets + notifications)]
      SENDGRID[SendGrid]
    end

    UI -->|REST /api/...| SS
    UI -->|REST /api/notifications| NS

    SS -->|Audit events| AS
    SS -->|Publish NotificationEvent| PUB
    PUB --> SUB --> NS
    NS -->|Persist Notification| DB
    NS -->|Send email| SENDGRID
```

---

## 2. Project Invitation Flow (v2 – Event-Driven Notifications)

### 2.1 Sequence Overview

```mermaid
sequenceDiagram
    participant U as Owner/Admin (UI)
    participant FE as Frontend
    participant SS as Secret Service
    participant PUB as Pub/Sub Topic
    participant NS as Notification Service
    participant DB as DB (users, notifications)
    participant EM as Email Provider

    U->>FE: Fill "Invite member" form (email, role)
    FE->>SS: POST /api/projects/{id}/members (invite)
    SS->>SS: Create ProjectInvitation / or direct membership
    SS->>PUB: Publish NotificationEvent(type=PROJECT_INVITATION, metadata: email, projectName, role, token, inviterName)
    PUB-->>NS: Deliver NotificationEvent
    NS->>DB: Lookup or create target user context
    NS->>DB: Insert notification row (notifications table)
    NS->>EM: Send invitation email (if enabled in preferences)
    EM-->>User: Invitation email with deep link
```

### 2.2 Updated Backend Responsibilities

- **Secret Service**
  - Owns core project + invitation logic.
  - Emits a `NotificationEvent` with:
    - `type = PROJECT_INVITATION`
    - `recipientUserIds` or target email
    - `metadata`: `projectName`, `inviterName`, `token`, `role`, `deepLink`.
- **Notification Service**
  - Subscribes to `notifications-events`.
  - Checks `users.notification_preferences` for invitation settings.
  - Persists an in-app notification.
  - Sends email (SendGrid) when allowed.

---

## 3. Membership Role Change Flow (with Notifications)

```mermaid
sequenceDiagram
    participant A as Admin/Owner (UI)
    participant FE as Frontend
    participant SS as Secret Service
    participant PUB as Pub/Sub Topic
    participant NS as Notification Service
    participant DB as DB
    participant EM as Email Provider

    A->>FE: Change member role (e.g. MEMBER -> ADMIN)
    FE->>SS: PUT /api/projects/{id}/members/{userId} (newRole)
    SS->>SS: Update membership in DB
    SS->>PUB: NotificationEvent(type=ROLE_CHANGED, recipientUserIds=[targetUserId], metadata: {projectName, oldRole, newRole})
    PUB-->>NS: Deliver NotificationEvent
    NS->>DB: Insert notification row for target user
    NS->>EM: Send role change email (if enabled)
```

**Result in UI**
- Top bar bell shows a new notification for the affected user.
- Dedicated `/notifications` page lists the event with a deep link to the project/members tab.

---

## 4. Secret Expiration Flow (Scheduler → Notifications)

```mermaid
sequenceDiagram
    participant CRON as SecretExpirationScheduler
    participant SS as Secret Service
    participant PUB as Pub/Sub Topic
    participant NS as Notification Service
    participant DB as DB
    participant EM as Email Provider

    CRON->>SS: Query secrets expiring soon
    SS->>SS: For each affected user/project, build NotificationEvent
    SS->>PUB: NotificationEvent(type=SECRET_EXPIRING_SOON, recipientUserIds=[ownerIds], metadata: {secretKey, projectName, expiresAt})
    PUB-->>NS: Deliver NotificationEvent(s)
    NS->>DB: Persist notifications per user
    NS->>EM: Send expiration reminder emails (if enabled)
```

**User Experience**
- In-app: Notification like _"Secret `DB_PASSWORD` in project `Backend Services` expires in 3 days"_ with a deep link to the secret.
- Email: Consolidated or per-secret reminders based on implementation.

---

## 5. In-App Notification Consumption Flow

```mermaid
sequenceDiagram
    participant U as Authenticated User
    participant FE as Frontend
    participant NS as Notification Service

    U->>FE: Open app (top bar)
    FE->>NS: GET /api/notifications?unreadOnly=false
    NS->>NS: Resolve userId from JWT
    NS->>FE: Return latest notifications (with readAt, metadata, deepLinks)
    FE->>U: Render bell badge + dropdown + /notifications page

    U->>FE: Click "Mark all as read"
    FE->>NS: POST /api/notifications/read-all
    NS->>NS: Update readAt for all unread notifications for user
    NS->>FE: 200 OK
    FE->>U: Update badge count to 0
```

**Key Points**
- No `userId` is passed from the frontend; the **JWT subject** is the source of truth.
- `useNotifications` hook handles:
  - Fetching via `GET /api/notifications`.
  - `markAsRead` and `markAllAsRead`.
  - Maintaining `unreadCount` for the bell badge.

---

## 6. Project Lifecycle Workflow (Updated with Notifications Touchpoints)

```mermaid
flowchart TD
    A[User creates Project] --> B[Owner assigns to Workflow]
    B --> C[Owner invites collaborators]
    C -->|User exists| D[Direct membership + NotificationEvent(PROJECT_INVITATION)]
    C -->|User not registered| E[Pending ProjectInvitation + NotificationEvent(PROJECT_INVITATION)]

    D --> F[Member joins project immediately]
    E --> G[User signs up via Firebase/Identity]
    G --> H[Secret Service auto-accepts valid invitations]
    H --> I[ProjectMembership created]

    I --> J[Members manage secrets]
    J --> K[Secret expiration scheduler runs daily]
    K --> L[NotificationEvent(SECRET_EXPIRING_SOON) published]

    I --> M[Owners/Admins update roles]
    M --> N[NotificationEvent(ROLE_CHANGED) published]
```

**Notification touchpoints in the project lifecycle**
- **On invite** → `PROJECT_INVITATION`
- **On signup with pending invite** → in-app + email context
- **On role change** → `ROLE_CHANGED`
- **On secret nearing expiry** → `SECRET_EXPIRING_SOON`

---

## 7. Notification-Service Internal Workflow

```mermaid
flowchart LR
    SUB[(Pub/Sub\nnotifications-events-sub)] --> RCV[NotificationEventMessageReceiver]
    RCV --> H[NotificationHandler]

    H -->|Check preferences| P{Enabled for event type?}
    P -- "No" --> SKIP[(Skip email\nbut may still persist)]
    P -- "Yes" --> S1[Persist Notification entity]
    S1 --> S2[Invoke EmailService\nper event type]
    S2 --> SEND[SendGrid Provider]

    H --> UDB[(users table\nnotification_preferences)]
    H --> NDB[(notifications table)]
```

**Responsibilities**
- `NotificationEventMessageReceiver`
  - Converts `PubsubMessage` → `NotificationEvent`.
  - Hands off to `NotificationHandler`.
- `NotificationHandler`
  - Applies **per-user preferences** for each event category.
  - Persists standardized `Notification` entity.
  - Calls `EmailService` to send the correct email template.

---

## 8. API Surface Summary (Notifications v2)

- **Secret Service (producer)**
  - Emits `NotificationEvent` only; **no direct email sending**.
- **Notification Service (consumer + API)**
  - **Events in** via Pub/Sub:
    - `PROJECT_INVITATION`
    - `TEAM_INVITATION` (future)
    - `ROLE_CHANGED`
    - `SECRET_EXPIRING_SOON`
    - `SECURITY_ALERT`
  - **REST out**:
    - `GET /api/notifications?unreadOnly={bool}`
    - `POST /api/notifications/{id}/read`
    - `POST /api/notifications/read-all`

---

## 9. Frontend Integration Summary

- `useNotifications(userId)` hook:
  - Uses `notificationsService.list(false)` and `mark(All)AsRead()`.
  - Manages `unreadCount` for the top-bar bell.
- `TopBar`:
  - Shows bell icon with badge.
  - Dropdown for latest notifications (click to mark read + deep link).
- `/notifications` page:
  - Full list of notifications with timestamps and filters.

This document should be used as the **canonical reference** for how project flows and the new notification-service work together end-to-end.


