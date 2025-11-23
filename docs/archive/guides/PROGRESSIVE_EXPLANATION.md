# Cloud Secrets Manager - Progressive Deep Dive 

This document explains the project in layers, starting from the highest level and going deeper bit by bit.

---

## **CURRENT: External Secrets & User Registry**

**This project uses:**
1. **External Secrets Operator (ESO)** for Kubernetes secret management - **IMPLEMENTED**
2. **Google Cloud Identity Platform** for user registry - **IMPLEMENTED**

### External Secrets Operator (ESO)

- **Current State**: Secrets are stored in **Google Secret Manager** and synced to Kubernetes via ESO.
- **Previous State**: Sealed Secrets (encrypted files in Git).
- **Status**: Fully implemented and active.

**Why ESO?**
- **Centralized Management**: All secrets are managed in Google Cloud Console.
- **Security**: No encrypted secrets in Git repositories.
- **Rotation**: Easier to rotate secrets in GCP than re-encrypting files.
- **Access Control**: Fine-grained IAM permissions via Workload Identity.

**Implementation Details:**
- **ClusterSecretStore**: `gcp-secret-manager` (cluster-wide).
- **ExternalSecrets**: 
    - `csm-db-secrets` (Database credentials)
    - `csm-app-config` (JWT & AES keys)
    - `csm-google-service-account` (GCP Service Account JSON)
- **See**: `docs/deployment/EXTERNAL_SECRETS_SETUP.md` for setup instructions.

### User Registry (Google Cloud Identity Platform)

- **Current State**: Google Cloud Identity Platform - **ACTIVE**
- **Status**: Fully implemented.

**Why Google Cloud Identity Platform?**
- No local user database needed.
- Built-in MFA, social login, password reset.
- Enterprise-grade security.

---

## **LEVEL 1: The Big Picture (What & Why)**

### What is This Project?
A **Cloud Secrets Manager** is like a digital bank vault for passwords, API keys, and other sensitive information that applications need to run.

### The Core Problem
Modern applications need secrets to function:
- Database passwords
- API keys for third-party services
- Encryption keys
- Access tokens

**The challenge:** Where do you store these safely?

### The Solution
This project provides:
1. **Secure Storage** - Secrets are encrypted before being saved.
2. **Access Control** - Only authorized people can see secrets.
3. **Audit Trail** - Every access is logged.
4. **Centralized Management** - One place to manage all secrets.
5. **User Registry** - Google Cloud Identity Platform.
6. **Secret Sync** - Automatic sync from Google Secret Manager to K8s (ESO).
