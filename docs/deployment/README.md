# Deployment Documentation

This directory contains all deployment-related documentation for the Cloud Secrets Manager project.

---

## Quick Start

- **New to the project?** Start with the [Deployment Index](./DEPLOYMENT_INDEX.md)
- **Deploying to production?** See [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md)
- **Developing locally?** See [Local Development Guide](./LOCAL_DEVELOPMENT_GUIDE.md)

---

## Main Guides

### Production Deployment

1. **[Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md)** ⭐
   - End-to-end production deployment guide
   - Uses Cloud SQL and External Secrets Operator
   - Step-by-step instructions

2. **[Helm Deployment Guide](./HELM_DEPLOYMENT_GUIDE.md)**
   - Deploy using Helm charts
   - Configuration and management

3. **[Terraform Guide](./TERRAFORM_GUIDE.md)**
   - Infrastructure provisioning
   - GKE, Cloud SQL, IAM setup

4. **[External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md)**
   - Google Secret Manager integration
   - External Secrets Operator configuration

### Local Development

- **[Local Development Guide](./LOCAL_DEVELOPMENT_GUIDE.md)** ⭐
  - Docker Compose setup
  - Local PostgreSQL databases
  - Development workflow

### Operations

- **[Operations Guide](./OPERATIONS_GUIDE.md)**
  - Day-to-day management
  - Monitoring, scaling, updates
  - Troubleshooting

- **[Terraform Operations](./TERRAFORM_OPERATIONS.md)**
  - Common Terraform workflows
  - State management

### Configuration

- **[Google Identity Deployment Setup](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)**
  - Google Cloud Identity Platform integration
  - Authentication configuration

---

## Documentation Index

For a complete overview of all deployment documentation, see [DEPLOYMENT_INDEX.md](./DEPLOYMENT_INDEX.md).

---

## Archived Documentation

Completed or superseded documentation has been moved to the [archive](./archive/) directory:
- Migration status and completion docs
- Legacy setup guides

---

**Last Updated:** November 22, 2025
