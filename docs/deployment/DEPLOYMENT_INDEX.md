# Deployment Documentation Index 

This directory contains deployment guides for the Cloud Secrets Manager.

## Current Deployment Guides

### [Artifact Registry Setup](./../current/ARTIFACT_REGISTRY_SETUP.md)
**Status:**  Active  
**Description:** Complete guide for setting up Google Artifact Registry, building and pushing Docker images, and configuring Kubernetes to pull from Artifact Registry.

**Key Topics:**
- Enabling Artifact Registry API
- Creating repositories
- Docker authentication
- Building and pushing images
- Kubernetes configuration
- Common fixes and troubleshooting
- Verification checklist (`gcloud artifacts docker images list ...`)

### [Google Identity Platform Deployment](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)
**Status:**  Active  
**Description:** Guide for deploying with Google Cloud Identity Platform in Kubernetes and Helm.

**Key Topics:**
- Service account setup
- Kubernetes secrets configuration
- Helm chart configuration
- Environment variables
- Security best practices

### [Secrets Manager Setup](./secrets-manager-setup.md)
**Status:**  Active  
**Description:** General setup guide for the secrets manager.

## Completed Guides (Moved to `/docs/completed/`)

- `kubernetes-helm-guide.md` - Basic Kubernetes/Helm guide (superseded by Artifact Registry guide)
- `dockerization-guide.md` - Basic Docker guide (superseded by Artifact Registry guide)

## Quick Links

- [Main Documentation](../README.md)
- [Current Status](../status/STATUS.md)
- [Project Overview](../PROJECT_OVERVIEW.md)

---

**Last Updated:** November 21, 2025 (Artifact Registry + Identity guides refreshed)
