# Deployment Documentation Index

This directory contains deployment guides for the Cloud Secrets Manager.

---

## Main Deployment Guides

### [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md) ⭐ **START HERE**
**Status:** Active  
**Description:** Comprehensive step-by-step guide for deploying the Cloud Secrets Manager to GKE after Terraform infrastructure is provisioned.

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

### [Terraform Guide](./TERRAFORM_GUIDE.md)
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

### [Terraform Operations](./TERRAFORM_OPERATIONS.md)
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

### [Secrets Manager Setup](./secrets-manager-setup.md)
**Status:** Active  
**Description:** General setup guide for the secrets manager.

**Key Topics:**
- Basic configuration
- Initial setup steps

**Use this guide for:** Initial project setup and configuration.

---

## Quick Links

- [Main Documentation](../README.md)
- [Current Status](../status/STATUS.md)
- [Project Overview](../README.md)

---

## Deployment Workflow

```
1. Infrastructure Setup (Terraform)
   └─> [Terraform Guide](./TERRAFORM_GUIDE.md)
   
2. Application Deployment (Kubernetes)
   └─> [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md)
   
3. Identity & Authentication
   └─> [Google Identity Deployment Setup](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)
```

---

**Last Updated:** November 22, 2025
