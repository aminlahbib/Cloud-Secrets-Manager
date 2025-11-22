# Deployment Documentation Index

This directory contains deployment guides for the Cloud Secrets Manager.

---

## Main Deployment Guides

### [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md) ⭐ **START HERE**
**Status:** Active  
**Description:** Comprehensive step-by-step guide for deploying the Cloud Secrets Manager to GKE after Terraform infrastructure is provisioned. Uses Cloud SQL and External Secrets Operator.

### [Local Development Guide](./LOCAL_DEVELOPMENT_GUIDE.md) ⭐ **FOR LOCAL DEV**
**Status:** Active  
**Description:** Guide for running the application locally using Docker Compose for development and testing.

**Key Topics:**
- Docker Compose setup
- Local PostgreSQL databases
- Development workflow
- Testing and debugging
- Differences from production

**Use this guide for:** Local development, testing, and debugging without needing GCP resources.

**Key Topics:**
- Prerequisites and authentication
- Step-by-step deployment process
- Docker image building and pushing
- Kubernetes configuration
- Database connectivity setup
- Startup and shutdown procedures
- Complete deployment workflow
- Troubleshooting guide
- Quick reference commands

**Use this guide for:** Complete end-to-end deployment from infrastructure to running applications.

---

### [Operations Guide](./OPERATIONS_GUIDE.md) ⭐ **FOR LIVE DEPLOYMENTS**
**Status:** Active  
**Description:** Complete guide for managing and operating the Cloud Secrets Manager deployment on GKE.

**Key Topics:**
- Monitoring and health checks
- Scaling operations (horizontal and vertical)
- Update and rollout management
- Log management
- Resource management
- Database operations
- Troubleshooting commands
- Backup and recovery
- Security operations

**Use this guide for:** Day-to-day operations, monitoring, scaling, updates, and troubleshooting of live deployments.

---

### [Terraform Guide](./terraform/TERRAFORM_GUIDE.md)
**Status:** Active  
**Description:** Complete guide to managing Cloud Secrets Manager infrastructure with Terraform.

**Key Topics:**
- Infrastructure overview
- Terraform module structure
- Deploying infrastructure
- Managing state
- Importing existing resources
- Daily operations

**Use this guide for:** Setting up and managing GCP infrastructure (GKE, Cloud SQL, Artifact Registry, IAM).

---

### [Terraform Operations](./terraform/TERRAFORM_OPERATIONS.md)
**Status:** Active  
**Description:** Common Terraform operations and workflows.

**Key Topics:**
- Initializing Terraform
- Planning changes
- Applying infrastructure
- Destroying resources
- State management

**Use this guide for:** Day-to-day Terraform operations and workflows.

---

### [Google Identity Deployment Setup](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)
**Status:** Active  
**Description:** Guide for deploying with Google Cloud Identity Platform in Kubernetes and Helm.

**Key Topics:**
- Service account setup
- Kubernetes secrets configuration
- Helm chart configuration
- Environment variables
- Security best practices

**Use this guide for:** Configuring Google Identity Platform authentication.

---

### [External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md)
**Status:** Active  
**Description:** Guide for setting up External Secrets Operator with Google Secret Manager.

**Key Topics:**
- Creating secrets in Google Secret Manager
- External Secrets Operator configuration
- Secret synchronization
- Troubleshooting

**Use this guide for:** Setting up secret management with ESO and Google Secret Manager.

### [Helm Deployment Guide](./helm/HELM_DEPLOYMENT_GUIDE.md)
**Status:** Active  
**Description:** Guide for deploying the application using Helm charts.

**Key Topics:**
- Helm chart structure
- Configuration values
- Deployment commands
- Upgrading deployments

**Use this guide for:** Deploying and managing the application with Helm.

### [CI/CD Pipeline Status](./ci-cd/CI_CD_PIPELINE_STATUS.md)
**Status:** Active  
**Description:** Current CI/CD pipeline status and enhancement recommendations.

**Key Topics:**
- Current pipeline implementation
- Gaps and missing features
- Recommendations for GCP integration
- Automated deployment setup

**Use this guide for:** Understanding CI/CD status and planning enhancements.

### [CI/CD Setup Guide](./ci-cd/CI_CD_SETUP.md) ⭐ **FOR CI/CD SETUP**
**Status:** Active  
**Description:** Complete guide for setting up and using the CI/CD pipeline with Google Cloud integration.

**Key Topics:**
- GitHub secrets configuration
- GCP service account setup
- Pipeline workflow explanation
- Troubleshooting
- Deployment verification

**Use this guide for:** Setting up automated CI/CD with GCP deployment.

---

## Quick Links

- [Main Documentation](../README.md)
- [Current Status](../status/STATUS.md)
- [Project Overview](../README.md)

---

## Deployment Workflow

### Production Deployment
```
1. Infrastructure Setup (Terraform)
   └─> [Terraform Guide](./terraform/TERRAFORM_GUIDE.md)
   
2. Secrets Setup
   └─> [External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md)
   
3. Application Deployment
   └─> [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md)
   └─> OR [Helm Deployment Guide](./helm/HELM_DEPLOYMENT_GUIDE.md)
   
4. Identity & Authentication
   └─> [Google Identity Deployment Setup](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)
```

### Local Development
```
1. Local Setup
   └─> [Local Development Guide](./LOCAL_DEVELOPMENT_GUIDE.md)
```

---

## Documentation Organization

Documentation is organized by technology:

- **Terraform** - Infrastructure provisioning guides in [`terraform/`](./terraform/)
- **Kubernetes** - Container orchestration guides in [`kubernetes/`](./kubernetes/)
- **Helm** - Package management guides in [`helm/`](./helm/)
- **CI/CD** - Pipeline guides in [`ci-cd/`](./ci-cd/)
- **Operations** - Day-2 operations guides in [`operations/`](./operations/)

---

**Last Updated:** November 22, 2025
