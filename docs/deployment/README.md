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

2. **[Helm Deployment Guide](./helm/HELM_DEPLOYMENT_GUIDE.md)**
   - Deploy using Helm charts
   - Configuration and management

3. **[Terraform Guide](./terraform/TERRAFORM_GUIDE.md)**
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

- **[Terraform Operations](./terraform/TERRAFORM_OPERATIONS.md)**
  - Common Terraform workflows
  - State management

- **[CI/CD Pipeline Status](./ci-cd/CI_CD_PIPELINE_STATUS.md)**
  - Current pipeline implementation
  - Enhancement recommendations
  - GCP integration guide

### Configuration

- **[Google Identity Deployment Setup](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)**
  - Google Cloud Identity Platform integration
  - Authentication configuration

---

## Documentation Index

For a complete overview of all deployment documentation, see [DEPLOYMENT_INDEX.md](./DEPLOYMENT_INDEX.md).

---

## Documentation Organization

Documentation is organized by technology for easier navigation:

### Technology-Specific Guides

- **[Terraform](./terraform/)** - Infrastructure as Code
  - [Terraform Guide](./terraform/TERRAFORM_GUIDE.md) - Complete infrastructure setup
  - [Terraform Operations](./terraform/TERRAFORM_OPERATIONS.md) - Day-to-day operations

- **[Kubernetes](./kubernetes/)** - Container Orchestration
  - [Debugging CrashLoopBackOff](./kubernetes/DEBUGGING_CRASHLOOPBACKOFF.md) - Troubleshooting guide
  - [Kubernetes Alerts Analysis](./kubernetes/KUBERNETES_ALERTS_ANALYSIS.md) - Alert analysis
  - [Security Context Update](./kubernetes/SECURITY_CONTEXT_UPDATE.md) - Pod security configuration
  - [Monitoring Verification](./kubernetes/MONITORING_VERIFICATION.md) - Prometheus monitoring verification

- **[Helm](./helm/)** - Package Management
  - [Helm Deployment Guide](./helm/HELM_DEPLOYMENT_GUIDE.md) - Helm chart deployment

- **[CI/CD](./ci-cd/)** - Continuous Integration/Deployment
  - [CI/CD Setup Guide](./ci-cd/CI_CD_SETUP.md) - Pipeline setup
  - [CI/CD Pipeline Status](./ci-cd/CI_CD_PIPELINE_STATUS.md) - Current status

- **[Operations](./operations/)** - Day-2 Operations
  - [Backup Verification](./operations/BACKUP_VERIFICATION.md) - Backup and restore procedures
  - [Verification Guide](./operations/VERIFICATION_GUIDE.md) - Deployment verification

---

## Archived Documentation

Completed or superseded documentation has been moved to the [archive](./archive/) directory:
- Migration status and completion docs
- Legacy setup guides
- Implementation summaries
- Historical status documents

---

**Last Updated:** November 22, 2025
