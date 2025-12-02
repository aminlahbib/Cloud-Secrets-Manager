## Cloud Secrets Manager – Features & Current State

> Snapshot of what the product does today, feature status, and known gaps.

This condenses the large project reports (`COMPREHENSIVE_PROJECT_REPORT`, `PROJECT_ANALYSIS_REPORT`, `COMPREHENSIVE_FEATURE_ANALYSIS`, notifications/2FA docs) into a single, maintained view.

---

### 1. Feature Overview (High-Level)

- **Secrets Management**
  - Projects as logical containers.
  - Encrypted secrets with versioning and rotation.
  - Secret expiration + scheduler‑driven alerts.
- **Collaboration**
  - Teams and project memberships.
  - Invitations and role management.
  - Ownership transfer.
- **Audit & Analytics**
  - Immutable audit logs for all important actions.
  - Project‑level analytics.
  - Frontend analytics dashboard.
- **Notifications**
  - Email and in‑app notifications based on events.
  - Per‑user preferences for categories.
- **Security**
  - Firebase/Google Identity + local JWT.
  - Optional TOTP-based 2FA with recovery codes.
  - AES‑GCM encryption for secret values.
  - Rate limiting and token blacklist.

---

### 2. Feature-by-Feature Status

Status legend:

- **✅ Complete** – production-ready.
- **🟡 Beta** – implemented, minor polish/edge cases remaining.
- **🧪 Experimental** – behind flags or limited use.
- **📅 Planned** – not implemented yet.

#### 2.1 Authentication & Authorization – ✅ Complete

- Dual auth support:
  - Google Identity / Firebase as primary.
  - Local JWT stack with refresh tokens as fallback.
- Token storage with “keep me signed in” persistence options.
- Resource‑scoped RBAC:
  - Platform roles: `USER`, `PLATFORM_ADMIN`.
  - Project roles: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`.
- Cross‑tab auth synchronization and token refresh logic.

Notes:

- Local JWT path is largely hidden behind Firebase in production; still maintained for flexibility.

#### 2.2 Two-Factor Authentication (2FA) – 🟡 Beta

- TOTP‑based 2FA with:
  - Setup (QR code, manual secret, otpauth URL).
  - Confirmation, recovery codes, disable flow.
  - Intermediate token for login verification.
- Backend:
  - 2FA fields in `users` table (`two_factor_enabled`, `two_factor_type`, secrets, recovery codes, timestamps).
  - Rate limits on verification and recovery code usage.
  - Audit events for enable/disable/verify.
- Frontend:
  - Settings → Security tab:
    - Enable/disable 2FA.
    - Recovery codes modal.
  - Login flow:
    - 2FA verification step for both email/password and Google sign‑in.

Remaining polish:

- Hardening rate limit feedback messages.
- Optional enforcement policies (e.g. require 2FA for admins).

#### 2.3 Projects & Workflows – ✅ Complete

- Projects:
  - CRUD + archive/restore.
  - Search, sort, filter.
  - Per‑project stats (secrets, members).
- Workflows:
  - User‑scoped workflows.
  - Assign projects to workflows.
  - Move projects between workflows.
  - Visual grouping on the home dashboard and lists.

#### 2.4 Teams & Collaboration – ✅ Complete

- Teams:
  - Team creation & management.
  - Team membership roles.
- Project membership:
  - Invite users by email, accept/decline invitations.
  - Role updates and ownership transfer.
- Audit logs for collaboration actions.

#### 2.5 Secret Management – ✅ Complete

- Create/read/update/delete secrets within a project.
- AES‑GCM encryption of values at rest.
- Automatic versioning; per‑version metadata (creator, timestamp, notes).
- Secret rotation and version rollback.
- Bulk operations (selection + delete).
- Import/export in JSON format.
- Expiration:
  - `expires_at` field and scheduler.
  - Notification + email for expiring secrets.

#### 2.6 Notifications – ✅ Complete (Core), 🟡 Beta (future events)

- Event types implemented:
  - `PROJECT_INVITATION`, `TEAM_INVITATION`, `SECRET_EXPIRING_SOON`, `ROLE_CHANGED`, `SECURITY_ALERT` (extensible).
- Backend:
  - Event model and Pub/Sub integration.
  - Notification service with preferences and email templates.
  - Shared `notifications` table for in‑app history.
- Frontend:
  - Top bar bell icon with unread badge + dropdown.
  - `/notifications` page with filter + mark‑all‑as‑read.

Remaining ideas:

- More event coverage (e.g. suspicious login, 2FA changes to other channels).
- Optional real‑time updates via websockets or SSE.

#### 2.7 Audit Logging & Analytics – ✅ Complete

- All major actions emit audit events.
- Audit-service:
  - Stores logs in `audit_logs`.
  - Query + analytics endpoints.
- Frontend:
  - Audit logs page with filters, date ranges, project scoping.
  - Analytics views (charts, distribution, activity graphs).

#### 2.8 Frontend UX & Design System – ✅ Complete

- Mature design:
  - Reduced glassmorphism, more solid surfaces.
  - Consistent typography and spacing.
  - Dark mode support with persistence.
- UI patterns:
  - Multi-step slider wizard for creation flows.
  - Reusable cards, tables, empty states, modals, toasts.
- Performance:
  - Debounced search, memoized components, query caching.

---

### 3. Known Issues & Limitations

From the comprehensive reports and performance analysis:

- **Redis auto-config pitfalls**
  - Previous versions accidentally pulled in Redis auto‑config causing repeated connection attempts and high CPU.
  - Fix: Explicitly disabled Redis auto‑config in services that don’t use it.
- **Pub/Sub configuration fragility**
  - Missing `GCP_PROJECT_ID` or Pub/Sub roles can cause startup issues in dev.
  - Fix: Conditional configuration and improved logging; but env mis‑config still a common source of errors.
- **Docker build complexity**
  - Multi‑module Maven builds inside Docker are sensitive to parent POM and module paths.
  - Fix: Parent POM install step and explicit module paths in Dockerfiles.
- **Schema evolution**
  - Flyway manages DB migrations; rollbacks are intentionally not supported.
  - Must ensure production migrations are tested in dev/staging first.

Operational limitations:

- Single-region GCP deployment by default (no active‑active multi‑region).
- No built‑in secret sync to external platforms (e.g. AWS/GCP secret managers) yet.

---

### 4. Short-Term Roadmap (Concrete Next Steps)

Based on the project analysis and feature feedback:

- **Auth & 2FA**
  - Optional enforcement policies per role/tenant.
  - Self‑service reset flows (admin‑driven).
- **Notifications**
  - Extend to cover more security‑relevant events.
  - Optional daily/weekly summary digests.
- **Observability**
  - Tighten alert thresholds (Prometheus rules).
  - Expand Tempo traces around authentication and 2FA.
- **Developer Experience**
  - Simplified local setup script (wrapping Docker + env).
  - Add more Postman / k6 scenarios for regression testing.

This document replaces the older large reports as the **authoritative feature/state summary**. For deeper operational detail, see `05_OPERATIONS_AND_RUNBOOK.md`. For architecture, see `01_ARCHITECTURE_AND_DEPLOYMENT.md`.
