## Cloud Secrets Manager – Operations & Runbook

> Practical guide for running, debugging, and maintaining the system across environments.

This consolidates the various runbooks (notifications, deployment, technical docs) into a single operational reference.

---

### 1. Day-to-Day Operations

#### 1.1 Local Development (Docker Compose)

From `docker/`:

```bash
cd docker
cp env.example .env   # edit if needed
docker compose up --build
```

Services:

- `csm-db` – PostgreSQL (5432).
- `csm-backend` – secret-service (8080).
- `csm-audit` – audit-service (8081).
- `csm-notification` – notification-service (8082).
- `csm-frontend` – React app (3000).

Useful commands:

```bash
docker compose ps
docker compose logs backend
docker compose restart backend
docker compose down -v   # resets dev DB (use with care)
```

#### 1.2 GKE / Helm

Deploy or update:

```bash
helm upgrade --install cloud-secrets-manager infrastructure/helm/cloud-secrets-manager \
  -f infrastructure/helm/cloud-secrets-manager/values.yaml           # dev
  # or values-staging.yaml / values-production.yaml
```

Check status:

```bash
kubectl get pods -n cloud-secrets-manager
kubectl logs deployment/secret-service -n cloud-secrets-manager
kubectl logs deployment/notification-service -n cloud-secrets-manager
```

Health checks:

- Secret-service: `/actuator/health` (port 8080).
- Audit-service: `/actuator/health` (port 8081).
- Notification-service: `/actuator/health` (port 8082).

---

### 2. Incident Response & Debugging

#### 2.1 General Triage Checklist

1. **Is the cluster healthy?**
   - `kubectl get nodes,pods -A`.
2. **Are pods restarting or CrashLooping?**
   - `kubectl describe pod ...` and `kubectl logs ...`.
3. **Database connectivity**
   - Check Cloud SQL instance health.
   - Verify `SPRING_DATASOURCE_URL`/credentials.
4. **Configuration / secrets**
   - Confirm External Secrets synced needed values (JWT, ENCRYPTION_KEY, SendGrid, etc.).
5. **Look at metrics & logs**
   - Prometheus/Grafana dashboards.
   - Application logs in GKE / `docker compose logs`.

#### 2.2 “2FA Login Broken”

Symptoms:

- Users stuck on login or see repeated 500/401 during `/api/auth/2fa/totp/verify-login`.
- UI loops between login and 2FA or shows ambiguous errors.

Steps:

1. **Backend logs**
   - Check `secret-service` logs around `/api/auth/login` and `/api/auth/2fa/totp/verify-login`.
   - Look for:
     - `Invalid or expired intermediate token`.
     - `Invalid code`.
2. **Database schema**
   - Ensure V9 migration was applied:
     ```sql
     \d users
     -- should list two_factor_* columns
     ```
3. **Frontend behaviour**
   - Verify network tab:
     - `/api/auth/login` returns `requiresTwoFactor=true` + `intermediateToken`.
     - `/api/auth/2fa/totp/verify-login` returns:
       - `200` on success.
       - `401` with `{"error":"Invalid code"}` (handled inline by UI).
4. **Rate limiting**
   - Repeated failures may hit `429 Too Many Requests`.
   - Wait for window to reset or increase limits in `application.yml` (dev only).

#### 2.3 “Notifications Not Sending”

Symptoms:

- No notification bell count / `/notifications` page empty.
- No emails for invitations, role changes, or secret expirations.

Checklist (based on `NOTIFICATIONS_RUNBOOK`):

1. **Pub/Sub**
   - Verify `notifications-events` topic and `notifications-events-sub` subscription exist (Terraform).
   - Check IAM roles:
     - `secret-service-<env>` has `roles/pubsub.publisher`.
     - `notification-service-<env>` has `roles/pubsub.subscriber`.
2. **Notification-service health**
   - Pod is running and `/actuator/health` is `UP`.
   - Logs show subscription starting; no repeated authentication or DB errors.
3. **JWT / DB**
   - `JWT_SECRET` shared between secret-service and notification-service.
   - Notification-service can reach the same `users` + `notifications` tables.
4. **Preferences**
   - User has **not** disabled email/notification category in Settings.
5. **End-to-end tests**
   - Send project invitation, change role, create expiring secret and run scheduler.
   - Verify:
     - In‑app notifications appear.
     - Emails are delivered when `EMAIL_ENABLED=true` and SendGrid is configured.

#### 2.4 “High CPU / Memory Usage”

Known historical causes (already mitigated, but useful for regression):

- Redis auto‑configuration in services that don’t use Redis (notification-service).
- Excessively frequent health checks.
- JVM memory not constrained by container limits.

Actions:

1. Confirm Redis auto‑config remains disabled where not needed.
2. Check Docker/Helm resource requests/limits.
3. Inspect JVM metrics dashboards (heap usage, GC pauses).

---

### 3. Maintenance Tasks

#### 3.1 Database Migrations

- Migrations are managed by **Flyway**.
- On service startup, new migrations under `db/migration` are applied automatically.

Operational tips:

- Always apply migrations in **dev** first, then staging, then production.
- Avoid manual schema modifications; instead, add a new migration.
- To re‑apply from scratch in dev:
  - `docker compose down -v`
  - `docker compose up --build`

#### 3.2 Secrets & Keys Rotation

- Rotate:
  - `JWT_SECRET`
  - `ENCRYPTION_KEY`
  - DB passwords
  - SendGrid API keys

Recommended process:

1. Create new values in Secret Manager.
2. Update External Secrets configuration or Helm values to reference new versions.
3. Restart the affected pods in a rolling fashion.

#### 3.3 Scaling Services

- All deployments define resource requests/limits.
- Scale horizontally via:

```bash
kubectl scale deployment/secret-service --replicas=3 -n cloud-secrets-manager
kubectl scale deployment/notification-service --replicas=3 -n cloud-secrets-manager
```

Use HPA (Horizontal Pod Autoscaler) for automatic scaling based on CPU/memory or custom metrics.

---

### 4. Playbooks (Quick Recipes)

#### 4.1 Login / Auth Issues

1. Check frontend console and network:
   - Are `/api/auth/login` and `/api/auth/me` returning 200?
2. Check JWT expiry:
   - If `401` + `Your session has expired`, confirm refresh token flow.
3. Validate Firebase / Google Identity config:
   - API key, project ID, auth domain env vars.

#### 4.2 Notifications Not Sending (Summary)

See section **2.3**; high‑level steps:

- Confirm Pub/Sub topic + subscription.
- Validate IAM + Workload Identity.
- Check notification-service logs.
- Confirm preferences + env vars.

#### 4.3 2FA Broken (Summary)

See section **2.2**; high‑level steps:

- Confirm DB migration V9.
- Inspect `/api/auth/login` + `/api/auth/2fa/...` responses.
- Check rate limiting and error messages.

---

This runbook should be the first stop for anyone operating or debugging Cloud Secrets Manager. For architecture context, see `01_ARCHITECTURE_AND_DEPLOYMENT.md`; for flows and APIs, see `02_SYSTEM_FLOWS_AND_APIS.md`.
