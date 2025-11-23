# Current Documentation

This directory contains **active**, **current**, and **reference** documentation for the Cloud Secrets Manager project.

**Last Updated:** November 23, 2025

---

## 📚 What's In This Directory

This folder contains documentation for:
- ✅ **Completed & Operational Features** (reference guides)
- 🚧 **Active Development** (in-progress features)
- 📖 **Reference Material** (quick references, specifications)

For **archived/completed implementation guides**, see [`/docs/archive/`](../archive/README.md).

---

## 📂 Current Documentation Files

### 🔐 Authentication & User Management

#### **ADMIN_UI_SECURITY_CONSIDERATIONS.md**
- **Status:** ✅ Reference Document
- **Purpose:** Explains why admin UI for user management is not recommended
- **Topics:**
  - Security risks of frontend user management
  - Google Cloud Console vs custom UI
  - Best practices for user administration
  - Alternative approaches (CLI, backend APIs)

#### **USER_MANAGEMENT_DOCUMENTATION_INDEX.md**
- **Status:** ✅ Reference Index
- **Purpose:** Central hub for user management and authentication documentation
- **Links:** Admin UI considerations, Firebase integration, access control

#### **FIREBASE_QUICK_REFERENCE.md**
- **Status:** ✅ Quick Reference
- **Purpose:** Firebase/Google Identity Platform quick commands and troubleshooting
- **Topics:**
  - Common gcloud commands
  - Testing authentication locally
  - Firebase Console quick links
  - Debugging tips

**Note:** Detailed Firebase integration guides moved to [`/docs/archive/firebase-integration/`](../archive/firebase-integration/)

---

### 🎨 Frontend & UI

#### **FRONTEND_UI_SPECIFICATION.md**
- **Status:** ✅ Specification (Implementation In Progress)
- **Purpose:** Comprehensive UI/UX design specification
- **Topics:**
  - Wireframes for 6 core screens
  - MVP scope definition
  - Design philosophy and principles
  - Component architecture
  - Accessibility requirements
  - Technical stack details

**Next Step:** Implement the actual React components based on this specification.

---

### ☁️ Google Cloud Platform

#### **GOOGLE_CLOUD_SERVICES.md**
- **Status:** ✅ Reference Document
- **Purpose:** Overview of all GCP services used in the project
- **Services:**
  - Google Kubernetes Engine (GKE)
  - Cloud SQL (PostgreSQL)
  - Artifact Registry
  - Cloud KMS
  - Secret Manager
  - Identity Platform / Firebase Auth
  - Cloud Monitoring & Logging

---

## 🗂️ Related Documentation

### Deployment & Operations
See [`/docs/deployment/`](../deployment/README.md) for:
- CI/CD pipeline configuration
- Kubernetes and Helm deployment guides
- Monitoring and observability setup
- Security policies
- Backup and disaster recovery procedures

### Testing & Quality
See [`/docs/features/`](../features/) for:
- Testing strategy and status
- Test coverage reports
- Performance and load testing

### Archived Implementations
See [`/docs/archive/`](../archive/README.md) for:
- Epic 1-5 implementation summaries
- Completed Firebase integration guides
- Historical setup documentation

---

## 🚧 Active Development

### Epic 5: Frontend & UX Implementation (In Progress)

**Completed:**
- ✅ UI/UX specification and wireframes (`FRONTEND_UI_SPECIFICATION.md`)
- ✅ React + TypeScript project setup
- ✅ Authentication flow (Google OAuth + JWT)
- ✅ Login page with Google Sign-In
- ✅ Protected routing

**Next Steps:**
1. **Build Secrets Management UI**
   - Secret list with pagination/filtering
   - Secret detail view
   - Create/Edit secret forms (tabbed interface)
   - Delete confirmation dialogs
   - Share secret functionality

2. **Build Audit Logs UI**
   - Audit log list with filtering
   - Detail view with metadata
   - Real-time updates (optional)

3. **Build Admin UI** (Limited scope)
   - View users and their roles
   - Update user roles (admin only)
   - Basic permissions view

---

## 📝 Documentation Status Summary

| Document | Status | Purpose |
|----------|--------|---------|
| `ADMIN_UI_SECURITY_CONSIDERATIONS.md` | ✅ Reference | Security best practices |
| `USER_MANAGEMENT_DOCUMENTATION_INDEX.md` | ✅ Index | Documentation hub |
| `FIREBASE_QUICK_REFERENCE.md` | ✅ Reference | Quick commands |
| `FRONTEND_UI_SPECIFICATION.md` | ✅ Spec (Impl. pending) | UI/UX design |
| `GOOGLE_CLOUD_SERVICES.md` | ✅ Reference | GCP services overview |

---

## 🔗 Quick Links

### For Developers
- **Getting Started:** [`/docs/deployment/LOCAL_DEVELOPMENT_GUIDE.md`](../deployment/LOCAL_DEVELOPMENT_GUIDE.md)
- **Testing Guide:** [`/docs/features/TESTING_STRATEGY_UPDATE.md`](../features/TESTING_STRATEGY_UPDATE.md)
- **API Documentation:** Backend services expose Swagger/OpenAPI docs at `/swagger-ui`

### For Operations
- **Deployment:** [`/docs/deployment/COMPLETE_DEPLOYMENT_GUIDE.md`](../deployment/COMPLETE_DEPLOYMENT_GUIDE.md)
- **Monitoring:** [`/docs/deployment/monitoring/MONITORING_SETUP.md`](../deployment/monitoring/MONITORING_SETUP.md)
- **Runbooks:** [`/docs/deployment/monitoring/RUNBOOKS.md`](../deployment/monitoring/RUNBOOKS.md)

### For Audits/Compliance
- **Security:** [`/docs/deployment/security/`](../deployment/security/)
- **Backup & DR:** [`/docs/deployment/operations/BACKUP_AND_DR_PROCEDURES.md`](../deployment/operations/BACKUP_AND_DR_PROCEDURES.md)
- **Testing Evidence:** [`/docs/archive/epics/`](../archive/epics/)

---

## 📮 Contributing

When adding new documentation to `docs/current/`:

1. **Use descriptive filenames** in UPPERCASE with underscores
2. **Include a status header** (Reference / Guide / Specification / In Progress)
3. **Update this README** with a link and description
4. **Link from other relevant docs** for discoverability
5. **Archive completed implementation guides** to `/docs/archive/` when done

---

**Maintained By:** Development Team  
**Last Updated:** November 23, 2025
