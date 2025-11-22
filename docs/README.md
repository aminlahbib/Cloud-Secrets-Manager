# Cloud Secrets Manager - Documentation

Welcome to the Cloud Secrets Manager documentation. This directory contains all documentation for the project.

---

## Quick Start

**New to the project?** Start here:

1. **[Complete Deployment Guide](./deployment/COMPLETE_DEPLOYMENT_GUIDE.md)** - Step-by-step guide to deploy the application
2. **[Terraform Guide](./deployment/TERRAFORM_GUIDE.md)** - Infrastructure setup and management

---

## Documentation Structure

### [deployment/](./deployment/)
Complete guides for deploying and managing the Cloud Secrets Manager.

**Production Deployment:**
- **[Complete Deployment Guide](./deployment/COMPLETE_DEPLOYMENT_GUIDE.md)** ⭐ - Main production deployment guide (Cloud SQL, ESO)
- **[Helm Deployment Guide](./deployment/HELM_DEPLOYMENT_GUIDE.md)** - Deploy using Helm charts
- **[External Secrets Setup](./deployment/EXTERNAL_SECRETS_SETUP.md)** - Google Secret Manager integration
- **[Operations Guide](./deployment/OPERATIONS_GUIDE.md)** ⭐ - Live deployment management and commands
- **[Terraform Guide](./deployment/TERRAFORM_GUIDE.md)** - Infrastructure as Code
- **[Terraform Operations](./deployment/TERRAFORM_OPERATIONS.md)** - Terraform workflows
- **[Google Identity Deployment](./deployment/GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)** - Authentication setup

**Local Development:**
- **[Local Development Guide](./deployment/LOCAL_DEVELOPMENT_GUIDE.md)** ⭐ - Run locally with Docker Compose

**Reference:**
- **[Deployment Index](./deployment/DEPLOYMENT_INDEX.md)** - Complete deployment documentation index

### [current/](./current/)
Current feature documentation and guides.

- Google Cloud Services overview
- Identity Platform setup
- Artifact Registry configuration
- API documentation

### [completed/](./completed/)
Completed feature documentation (historical reference).

- Authentication approach comparison
- Dockerization guide
- Google Cloud Identity integration
- Hybrid user registry architecture
- Kubernetes/Helm guides

### [planning/](./planning/)
Planning documents and architecture decisions.

- Production deployment plans
- Archived planning notes

### [status/](./status/)
Project status and progress tracking.

- Current project status
- Feature implementation status

### [features/](./features/)
Feature-specific documentation.

- Testing setup and status
- Feature checklists

### [implementations/](./implementations/)
Implementation details for specific features.

- Enhanced RBAC implementation
- JWT refresh tokens

---

## Getting Started

### For Developers

1. **Local Development**: Start with [Local Development Guide](./deployment/LOCAL_DEVELOPMENT_GUIDE.md)
2. **Production Deployment**: Read the [Complete Deployment Guide](./deployment/COMPLETE_DEPLOYMENT_GUIDE.md)
3. **Infrastructure**: Review [Terraform Guide](./deployment/TERRAFORM_GUIDE.md)
4. **Project Status**: Check [Current Status](./status/STATUS.md) for project state

### For DevOps/Infrastructure

1. Start with [Terraform Guide](./deployment/TERRAFORM_GUIDE.md)
2. Review [Terraform Operations](./deployment/TERRAFORM_OPERATIONS.md)
3. Follow [Complete Deployment Guide](./deployment/COMPLETE_DEPLOYMENT_GUIDE.md) for application deployment
4. Use [Operations Guide](./deployment/OPERATIONS_GUIDE.md) for day-to-day management

### For Project Managers

1. Review [Current Status](./status/STATUS.md)
2. Check [Features](./features/) for implementation status
3. Review [Planning](./planning/) for architecture decisions

---

## Key Resources

- **Main Deployment Guide**: [Complete Deployment Guide](./deployment/COMPLETE_DEPLOYMENT_GUIDE.md)
- **Operations & Management**: [Operations Guide](./deployment/OPERATIONS_GUIDE.md)
- **Infrastructure**: [Terraform Guide](./deployment/TERRAFORM_GUIDE.md)
- **Project Status**: [Status](./status/STATUS.md)
- **Architecture**: [Planning](./planning/a-plus-production-plan.md)

---

## Contributing

When adding new documentation:

1. Place deployment guides in `deployment/`
2. Place feature docs in `features/` or `current/`
3. Update relevant index files
4. Follow existing documentation structure and format

---

**Last Updated:** November 22, 2025

---

## Recent Updates

- ✅ **Cloud SQL Migration Complete** - Migrated from local PostgreSQL to Google Cloud SQL
- ✅ **Local Development Guide** - New guide for Docker Compose local development
- ✅ **Documentation Cleanup** - Archived completed migration and setup docs
- ✅ Added **Operations Guide** with comprehensive management commands
- ✅ Enhanced **Deployment Guide** with Cloud SQL and External Secrets Operator
- ✅ Organized and archived historical planning documents
