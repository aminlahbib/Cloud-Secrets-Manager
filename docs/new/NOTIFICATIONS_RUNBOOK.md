## Notifications & Email Runbook

### 1. Environment prerequisites

- **Core secrets / config**
  - `JWT_SECRET` shared between `secret-service` and `notification-service`.
  - `SENDGRID_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`.
  - `APP_BASE_URL` pointing at the frontend (used in email links).
- **Database & secrets**
  - Cloud SQL instances already provisioned via Terraform.
  - App credentials and DB passwords managed via External Secrets Operator.

---

### 2. GCP APIs & Terraform (per environment)

In `infrastructure/terraform/environments/<env>/main.tf`:

- `google_project_service.required_apis` must include:
  - `compute.googleapis.com`
  - `container.googleapis.com`
  - `artifactregistry.googleapis.com`
  - `sqladmin.googleapis.com`
  - `secretmanager.googleapis.com`
  - `iam.googleapis.com`
  - `billingbudgets.googleapis.com`
  - `pubsub.googleapis.com`

#### Pub/Sub resources

- **Topic**

```hcl
resource "google_pubsub_topic" "notifications_events" {
  name    = "notifications-events"
  project = var.project_id
}
```

- **Subscription**

```hcl
resource "google_pubsub_subscription" "notifications_events_sub" {
  name    = "notifications-events-sub"
  topic   = google_pubsub_topic.notifications_events.name
  project = var.project_id

  ack_deadline_seconds       = 30
  message_retention_duration = "604800s" # 7 days
}
```

#### IAM service accounts

Under `module "iam"`:

- `secret-service-<env>` service account:

```hcl
roles = [
  "roles/cloudsql.client",
  "roles/secretmanager.secretAccessor",
  "roles/artifactregistry.reader",
  "roles/cloudsql.instanceUser",
  "roles/pubsub.publisher",
]
```

- `notification-service-<env>` service account:

```hcl
"notification-service-dev" = {
  display_name = "Notification Service (Dev)"
  description  = "Service account for Notification Service in dev environment"
  roles = [
    "roles/cloudsql.client",
    "roles/artifactregistry.reader",
    "roles/pubsub.subscriber",
    "roles/cloudsql.instanceUser",
  ]
}
```

#### Workload Identity bindings

Add to `workload_identity_bindings`:

```hcl
"notification-service" = {
  gcp_service_account = "notification-service-dev@${var.project_id}.iam.gserviceaccount.com"
  namespace           = "cloud-secrets-manager"
  k8s_service_account = "notification-service"
}
```

Then:

```bash
terraform -chdir=infrastructure/terraform/environments/<env> fmt
terraform -chdir=infrastructure/terraform/environments/<env> validate
terraform -chdir=infrastructure/terraform/environments/<env> apply
```

Repeat for `staging` / `production` when those envs are defined.

---

### 3. Helm / Kubernetes configuration

#### ServiceAccounts template

File: `infrastructure/helm/cloud-secrets-manager/templates/serviceaccount.yaml`

- Must define:
  - `secret-service`
  - `audit-service`
  - `notification-service`

#### Values (per environment)

Dev `values.yaml`:

```yaml
notificationServiceAccount:
  create: true
  annotations:
    iam.gke.io/gcp-service-account: "notification-service-dev@cloud-secrets-manager.iam.gserviceaccount.com"
```

Staging / production `values-*.yaml`:

```yaml
notificationServiceAccount:
  create: true
  annotations:
    iam.gke.io/gcp-service-account: "notification-service-staging@cloud-secrets-manager.iam.gserviceaccount.com"
    # or notification-service-prod@...
```

#### Deploy / upgrade

```bash
# Dev
helm upgrade --install cloud-secrets-manager infrastructure/helm/cloud-secrets-manager \
  -f infrastructure/helm/cloud-secrets-manager/values.yaml

# Staging
helm upgrade --install cloud-secrets-manager infrastructure/helm/cloud-secrets-manager \
  -f infrastructure/helm/cloud-secrets-manager/values-staging.yaml

# Production
helm upgrade --install cloud-secrets-manager infrastructure/helm/cloud-secrets-manager \
  -f infrastructure/helm/cloud-secrets-manager/values-production.yaml
```

---

### 4. Backend services responsibilities

- **secret-service**
  - Emits `NotificationEvent`s (no direct email).
  - Requires:
    - Pub/Sub publisher IAM via `secret-service-<env>` SA + Workload Identity.
    - `GCP_PROJECT_ID`, `JWT_SECRET`, DB connection envs.

- **notification-service**
  - Subscribes to `notifications-events` via `notifications-events-sub`.
  - Uses:
    - `security.jwt.secret` (`JWT_SECRET`) to derive user identity for `/api/notifications`.
    - `email.*` and `app.base-url` for SendGrid emails.
    - Same Postgres instance as `secret-service` (access to `users` and `notifications` tables).
  - Enforces user preferences from `users.notification_preferences`.
  - Sends emails for:
    - Project invitations
    - Secret expiration warnings
    - Membership role changes

---

### 5. Frontend wiring (summary)

- Env: `VITE_API_BASE_URL` → points at the API gateway/ingress.
- Hooks/services:
  - `useNotifications(user?.id)`:
    - `GET /api/notifications?unreadOnly=true|false`
    - `POST /api/notifications/{id}/read`
    - `POST /api/notifications/read-all`
  - Top bar bell shows unread badge and dropdown list; `/notifications` page lists notifications and supports "mark all as read".

---

### 6. End‑to‑end verification checklist

1. **Deploy updated images** for:
   - `secret-service`
   - `notification-service`
   - frontend.

2. **Smoke test**
   - Log in.
   - Verify:
     - Bell shows 0 unread.
     - `/notifications` shows empty state without errors.

3. **Project invitation**
   - From the UI, invite a new email to a project.
   - Verify:
     - Invitation email arrives at the invitee address.
     - Inviter sees a new notification in the bell and `/notifications`.

4. **Role change**
   - Change a member’s role on a project.
   - Verify:
     - The member receives a role‑change email.
     - A notification appears for the member in the app.

5. **Secret expiration**
   - Create a secret with an expiration a few minutes in the future (in dev).
   - Manually trigger the expiration job (or wait for the scheduled run).
   - Verify:
     - Owner receives a secret‑expiration email.
     - A corresponding notification appears in the app.

6. **Failure modes to watch**
   - Missing Pub/Sub permissions → check IAM roles and Workload Identity annotations.
   - No emails → confirm `SENDGRID_API_KEY` and `EMAIL_ENABLED` in `notification-service`.
   - No notifications in UI → verify `/api/notifications` returns data and JWT is attached from the frontend.



This runbook describes how to provision, deploy, and verify the notifications and email system for Cloud Secrets Manager across environments.

---

### 1. Environment Prerequisites

- **Core secrets / configuration**
  - `JWT_SECRET` – shared between `secret-service` and `notification-service` (`security.jwt.secret`).
  - `SENDGRID_API_KEY` – API key for SendGrid.
  - `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` – default sender.
  - `APP_BASE_URL` – base URL for deep links in emails.
- **Database**
  - Cloud SQL instances for `secrets` and `audit` databases are already managed via the `postgresql` Terraform module.
  - `notification-service` reuses the `secrets` database and `notifications` table (`V8__create_notifications_table.sql`).

---

### 2. Terraform – Pub/Sub & IAM (per environment)

Terraform configs live under `infrastructure/terraform/environments/<env>`.

#### 2.1 Enable required APIs

Ensure `pubsub.googleapis.com` is included in `google_project_service.required_apis`:

```hcl
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "billingbudgets.googleapis.com",
    "pubsub.googleapis.com",
  ])

  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}
```

#### 2.2 Pub/Sub topic & subscription

In `environments/<env>/main.tf`:

```hcl
resource "google_pubsub_topic" "notifications_events" {
  name    = "notifications-events"
  project = var.project_id

  depends_on = [google_project_service.required_apis]
}

resource "google_pubsub_subscription" "notifications_events_sub" {
  name  = "notifications-events-sub"
  topic = google_pubsub_topic.notifications_events.name

  project = var.project_id

  ack_deadline_seconds       = 30
  message_retention_duration = "604800s" # 7 days

  depends_on = [google_pubsub_topic.notifications_events]
}
```

#### 2.3 Service accounts & roles

Using the existing `iam` module in `environments/<env>/main.tf`:

```hcl
module "iam" {
  source = "../../modules/iam"

  project_id  = var.project_id
  environment = local.environment

  service_accounts = {
    "secret-service-<env>" = {
      display_name = "Secret Service (<env>)"
      description  = "Service account for Secret Service in <env> environment"
      roles = [
        "roles/cloudsql.client",
        "roles/secretmanager.secretAccessor",
        "roles/artifactregistry.reader",
        "roles/cloudsql.instanceUser",
        "roles/pubsub.publisher",
      ]
    }
    "notification-service-<env>" = {
      display_name = "Notification Service (<env>)"
      description  = "Service account for Notification Service in <env> environment"
      roles = [
        "roles/cloudsql.client",
        "roles/artifactregistry.reader",
        "roles/pubsub.subscriber",
        "roles/cloudsql.instanceUser",
      ]
    }
    # ... other service accounts ...
  }

  workload_identity_bindings = {
    "secret-service" = {
      gcp_service_account = "secret-service-<env>@${var.project_id}.iam.gserviceaccount.com"
      namespace           = "cloud-secrets-manager"
      k8s_service_account = "secret-service"
    }
    "notification-service" = {
      gcp_service_account = "notification-service-<env>@${var.project_id}.iam.gserviceaccount.com"
      namespace           = "cloud-secrets-manager"
      k8s_service_account = "notification-service"
    }
    # ... other bindings ...
  }
}
```

> Replace `<env>` with `dev`, `staging`, `prod` as appropriate.

#### 2.4 Apply Terraform

For each environment:

```bash
terraform -chdir=infrastructure/terraform/environments/<env> fmt
terraform -chdir=infrastructure/terraform/environments/<env> validate
terraform -chdir=infrastructure/terraform/environments/<env> apply
```

---

### 3. Helm / Kubernetes – Workload Identity for notification-service

Helm chart path: `infrastructure/helm/cloud-secrets-manager`.

#### 3.1 ServiceAccounts template

`templates/serviceaccount.yaml` defines:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: notification-service
  labels:
    app: notification-service
  annotations:
    {{- if .Values.notificationServiceAccount.annotations }}
    {{- toYaml .Values.notificationServiceAccount.annotations | nindent 4 }}
    {{- end }}
```

#### 3.2 Values per environment

- **Dev** – `values.yaml`:

```yaml
notificationServiceAccount:
  create: true
  annotations:
    iam.gke.io/gcp-service-account: "notification-service-dev@cloud-secrets-manager.iam.gserviceaccount.com"
```

- **Staging** – `values-staging.yaml`:

```yaml
notificationServiceAccount:
  create: true
  annotations:
    iam.gke.io/gcp-service-account: "notification-service-staging@cloud-secrets-manager.iam.gserviceaccount.com"
```

- **Production** – `values-production.yaml`:

```yaml
notificationServiceAccount:
  create: true
  annotations:
    iam.gke.io/gcp-service-account: "notification-service-prod@cloud-secrets-manager.iam.gserviceaccount.com"
```

#### 3.3 Deploy / upgrade Helm release

```bash
# Dev
helm upgrade --install cloud-secrets-manager infrastructure/helm/cloud-secrets-manager \
  -f infrastructure/helm/cloud-secrets-manager/values.yaml

# Staging
helm upgrade --install cloud-secrets-manager infrastructure/helm/cloud-secrets-manager \
  -f infrastructure/helm/cloud-secrets-manager/values-staging.yaml

# Production
helm upgrade --install cloud-secrets-manager infrastructure/helm/cloud-secrets-manager \
  -f infrastructure/helm/cloud-secrets-manager/values-production.yaml
```

---

### 4. Backend Service Expectations

- **secret-service**
  - Emits `NotificationEvent`s only (no direct email).
  - Needs:
    - Pub/Sub publisher IAM (via `notification-service-<env>` SA and Workload Identity).
    - `GCP_PROJECT_ID`, `JWT_SECRET`, `SENDGRID_*` *not* required anymore (email moved out).

- **notification-service**
  - Subscribes to `notifications-events` and:
    - Enforces user preferences from `users.notification_preferences`.
    - Persists notifications to the `notifications` table.
    - Sends emails for invitations, secret expiration warnings, and role changes via SendGrid.
  - Needs:
    - `SPRING_DATASOURCE_*` for PostgreSQL.
    - `JWT_SECRET`, `SENDGRID_API_KEY`, `EMAIL_FROM_*`, `APP_BASE_URL`.

---

### 5. Frontend Integration Summary

- Uses `VITE_API_BASE_URL` to call the backend.
- Notifications:
  - `GET /api/notifications?unreadOnly={true|false}`
  - `POST /api/notifications/{id}/read`
  - `POST /api/notifications/read-all`
  - Auth derived purely from JWT (no `userId` parameter).
- UI:
  - Top bar bell with unread badge and dropdown.
  - `/notifications` page listing notifications with “Mark all as read”.
  - Deep-link navigation via `metadata.deepLink` when present.

---

### 6. End-to-End Verification Checklist

After deploying all components:

1. **Health checks**
   - Confirm `secret-service` and `notification-service` pods are running and healthy.
   - Hit `/actuator/health` for both services.

2. **In-app notifications**
   - Log in to the app.
   - Confirm bell shows 0 unread; `/notifications` page shows empty state.

3. **Project invitation flow**
   - From the UI, invite a new email to a project.
   - Verify:
     - A `PROJECT_INVITATION` event appears in the `notifications-events` topic (via GCP console if desired).
     - The invitee receives an email.
     - Inviter (and/or invitee, depending on preferences) sees a new notification in the bell and `/notifications`.

4. **Role change flow**
   - Change a member’s role in a project.
   - Verify:
     - Member receives a role-change email.
     - Member sees an in-app notification.

5. **Secret expiration flow**
   - Create a secret with a near-future expiration.
   - Run the expiration scheduler (either wait for cron or trigger manually if available).
   - Verify:
     - Owner receives an expiration warning email.
     - Owner sees a corresponding notification.

6. **Preferences check**
   - Toggle notification preferences in Settings (`email`, `secretExpiration`, `projectInvitations`, `securityAlerts`).
   - Repeat tests to confirm disabled categories do **not** generate emails/notifications for that user.

This runbook should provide enough detail for engineers and operators to provision, deploy, and validate the notifications system across environments without needing to rediscover implementation details.


