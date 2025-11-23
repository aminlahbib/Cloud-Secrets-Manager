# Cloud Secrets Manager - Documentation

Welcome to the Cloud Secrets Manager documentation. This directory contains all project documentation, organized for quick access and clarity.

**Last Updated:** November 23, 2025

---

## 🚀 Quick Start

**New to the project?** Start here:

1. **[Local Development Guide](./deployment/LOCAL_DEVELOPMENT_GUIDE.md)** ⭐ - Run the app locally with Docker Compose
2. **[Complete Deployment Guide](./deployment/COMPLETE_DEPLOYMENT_GUIDE.md)** - Deploy to GKE/Cloud SQL
3. **[Operations Guide](./deployment/OPERATIONS_GUIDE.md)** - Manage and troubleshoot deployments

**For Epic/Feature History:** See [Archive](./archive/README.md) for completed epic summaries and implementation guides.

---

## 📂 Documentation Structure

### 🎯 [`current/`](./current/) - Active & Reference Documentation
Current features, specifications, and reference material:

- **UI/UX Specification:** Frontend design and wireframes
- **Firebase Quick Reference:** Authentication commands and troubleshooting
- **Admin UI Considerations:** Security best practices for user management
- **GCP Services Overview:** All Google Cloud services in use
- **User Management Index:** Authentication and access control docs

[→ See current/ README](./current/README.md)

---

### 🚢 [`deployment/`](./deployment/) - Deployment & Operations
Everything needed to deploy and manage the application:

#### Production Deployment
- **[Complete Deployment Guide](./deployment/COMPLETE_DEPLOYMENT_GUIDE.md)** ⭐ - Main guide (GKE + Cloud SQL + ESO)
- **[Helm Deployment](./deployment/helm/HELM_DEPLOYMENT_GUIDE.md)** - Helm charts and configuration
- **[External Secrets Setup](./deployment/EXTERNAL_SECRETS_SETUP.md)** - Google Secret Manager integration
- **[Operations Guide](./deployment/OPERATIONS_GUIDE.md)** ⭐ - Day-to-day management

#### Infrastructure
- **[Terraform Guide](./deployment/terraform/TERRAFORM_GUIDE.md)** - Infrastructure as Code
- **[Terraform Operations](./deployment/terraform/TERRAFORM_OPERATIONS.md)** - Terraform workflows

#### CI/CD
- **[CI/CD Setup](./deployment/ci-cd/CI_CD_SETUP.md)** - GitHub Actions pipeline
- **[Branch Protection](./deployment/ci-cd/BRANCH_PROTECTION_SETUP.md)** - Git workflow
- **[CI/CD Quick Reference](./deployment/ci-cd/CI_CD_QUICK_REFERENCE.md)** - Common commands

**Note:** CI/CD pipeline is currently disabled for solo development workflow.

#### Monitoring & Observability
- **[Monitoring Setup](./deployment/monitoring/MONITORING_SETUP.md)** - Prometheus/Grafana/Tempo
- **[Runbooks](./deployment/monitoring/RUNBOOKS.md)** - Incident response procedures
- **[SLOs & Error Budgets](./deployment/monitoring/SLOS_AND_ERROR_BUDGETS.md)** - Reliability targets

#### Security & Operations
- **[Security Context Update](./deployment/kubernetes/SECURITY_CONTEXT_UPDATE.md)** - Pod security
- **[Backup & DR](./deployment/operations/BACKUP_AND_DR_PROCEDURES.md)** - Disaster recovery
- **[Verification Guide](./deployment/operations/VERIFICATION_GUIDE.md)** - Post-deployment checks

#### Local Development
- **[Local Development Guide](./deployment/LOCAL_DEVELOPMENT_GUIDE.md)** ⭐ - Docker Compose setup

[→ See deployment/ README](./deployment/README.md)

---

### ✅ [`archive/`](./archive/) - Completed Implementation Guides
Archived documentation for successfully completed work:

#### Epic Summaries (All ✅ Complete)
- **Epic 1:** CI/CD to GKE & Environments
- **Epic 2:** Observability & Reliability (Prometheus/Grafana/Tempo)
- **Epic 3:** Security & Compliance Hardening
- **Epic 4:** Testing, Resilience, and Performance
- **Epic 5:** Frontend & UX Design Specification

#### Firebase Integration (✅ Complete)
- Google Cloud Identity Platform integration
- Firebase Admin SDK setup
- Google OAuth implementation
- End-to-end testing results

#### Setup Guides
- Artifact Registry, GitHub Security, GCP Identity, and more

[→ See archive/ README](./archive/README.md)

---

### 🧪 [`features/`](./features/) - Feature Development & Testing
Active feature development and testing documentation:

- **[Testing Strategy](./features/TESTING_STRATEGY_UPDATE.md)** - Unit, integration, performance testing
- **[Testing Status](./features/TESTING_STATUS.md)** - Current test coverage and results
- **[Testing Checklist](./features/TESTING_CHECKLIST.md)** - QA checklist

---

### 🏗️ [`implementations/`](./implementations/) - Implementation Details
Deep-dive implementation documentation:

- **Enhanced RBAC Implementation** - Role-based access control
- **JWT Refresh Tokens** - Token refresh strategy
- **Business Logic Features** - Core business logic

---

### 📝 [`planning/`](./planning/) - Architecture & Planning
Planning documents and architecture decisions:

- Production deployment plans
- Archived planning notes
- Architecture decision records

---

### 📊 [`status/`](./status/) - Project Status
Project progress and status tracking:

- Current implementation status
- Feature completion tracking

---

### 📚 [`completed/`](./completed/) - Legacy Completed Docs
Historical completed documentation (pre-archive structure):

- Authentication approach comparison
- Dockerization guide
- Hybrid user registry architecture

**Note:** New completed docs go to `/archive/` instead.

---

## 🎯 Getting Started

### For Developers

1. **Start Locally:**
   - [Local Development Guide](./deployment/LOCAL_DEVELOPMENT_GUIDE.md) - Docker Compose setup
   - [Frontend UI Specification](./current/FRONTEND_UI_SPECIFICATION.md) - UI/UX design

2. **Understand the System:**
   - [GCP Services Overview](./current/GOOGLE_CLOUD_SERVICES.md) - Infrastructure
   - [Testing Strategy](./features/TESTING_STRATEGY_UPDATE.md) - Quality assurance

3. **Review Completed Work:**
   - [Archive](./archive/README.md) - Epics 1-5 implementation summaries
   - [Monitoring Setup](./deployment/monitoring/MONITORING_SETUP.md) - Observability

### For DevOps/Infrastructure

1. **Infrastructure:**
   - [Terraform Guide](./deployment/terraform/TERRAFORM_GUIDE.md) - IaC setup
   - [Complete Deployment Guide](./deployment/COMPLETE_DEPLOYMENT_GUIDE.md) - GKE deployment

2. **Operations:**
   - [Operations Guide](./deployment/OPERATIONS_GUIDE.md) - Day-to-day management
   - [Runbooks](./deployment/monitoring/RUNBOOKS.md) - Incident response
   - [Backup & DR](./deployment/operations/BACKUP_AND_DR_PROCEDURES.md) - Disaster recovery

3. **Monitoring:**
   - [Monitoring Setup](./deployment/monitoring/MONITORING_SETUP.md) - Prometheus/Grafana
   - [SLOs & Error Budgets](./deployment/monitoring/SLOS_AND_ERROR_BUDGETS.md) - Reliability

### For Project Managers

1. **Status & Progress:**
   - [Archive](./archive/README.md) - Completed epics (1-5)
   - [Status](./status/STATUS.md) - Current project state
   - [Features](./features/) - Active development

2. **Planning:**
   - [Planning](./planning/) - Architecture decisions
   - [Implementations](./implementations/) - Technical details

---

## 📋 Project Status Summary

| Component | Status | Documentation |
|-----------|--------|---------------|
| **Backend Services** | ✅ Operational | [Implementation Summaries](./archive/epics/) |
| **CI/CD Pipeline** | 🟡 Disabled (Solo Dev) | [CI/CD Setup](./deployment/ci-cd/) |
| **Monitoring** | ✅ Operational | [Monitoring Setup](./deployment/monitoring/) |
| **Security** | ✅ Enforced | [Security](./deployment/security/) |
| **Testing** | ✅ 80%+ Coverage | [Testing Strategy](./features/TESTING_STRATEGY_UPDATE.md) |
| **Firebase Auth** | ✅ Functional (Local) | [Archive: Firebase](./archive/firebase-integration/) |
| **Frontend UI** | 🚧 In Progress | [UI Specification](./current/FRONTEND_UI_SPECIFICATION.md) |

---

## 🔗 Key Resources

### Must-Read Documents
- **[Local Development Guide](./deployment/LOCAL_DEVELOPMENT_GUIDE.md)** ⭐ - Start here for local dev
- **[Complete Deployment Guide](./deployment/COMPLETE_DEPLOYMENT_GUIDE.md)** ⭐ - Production deployment
- **[Operations Guide](./deployment/OPERATIONS_GUIDE.md)** ⭐ - Day-to-day management
- **[Archive](./archive/README.md)** ⭐ - Completed epics and implementations

### Reference
- **[Firebase Quick Reference](./current/FIREBASE_QUICK_REFERENCE.md)** - Auth commands
- **[Runbooks](./deployment/monitoring/RUNBOOKS.md)** - Incident response
- **[Testing Checklist](./features/TESTING_CHECKLIST.md)** - QA checklist

---

## ✨ Recent Updates

**November 23, 2025:**
- ✅ **Firebase Integration Complete** - Google OAuth working end-to-end
- ✅ **Documentation Reorganization** - New `/archive/` structure for completed work
- ✅ **Epic 1-5 Archived** - All epic summaries moved to archive
- ✅ **Updated Documentation Indexes** - Clearer navigation and status

**Previous:**
- ✅ **Epic 5 UI/UX Design Complete** - Comprehensive wireframes and specifications
- ✅ **Epic 4 Testing Complete** - 80%+ backend coverage, k6 load tests, chaos experiments
- ✅ **Epic 3 Security Complete** - Network policies, JWT blacklisting, backup/DR
- ✅ **Epic 2 Observability Complete** - Prometheus/Grafana/Tempo operational
- ✅ **Epic 1 CI/CD Complete** - GitHub Actions pipeline (disabled for solo dev)

---

## 📝 Contributing

When adding new documentation:

1. **Active development docs** → `current/` or `features/`
2. **Deployment guides** → `deployment/`
3. **Completed implementation summaries** → `archive/epics/`
4. **Update relevant indexes** - This README and subdirectory READMEs
5. **Follow naming conventions** - UPPERCASE_WITH_UNDERSCORES.md

When completing an epic or major feature:
1. Write an implementation summary
2. Move to `/archive/epics/` or `/archive/guides/`
3. Update `/archive/README.md`
4. Keep quick references in `/current/` if needed

---

**Maintained By:** Development Team  
**Last Updated:** November 23, 2025
