# Documentation Index 

Central hub for every document that ships with Cloud Secrets Manager.

---

## Documentation Structure

### Getting Started
- **[README.md](../README.md)** - Main project overview & quick start
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Wiki-style deep dive
- **[NEXT_STEPS.md](NEXT_STEPS.md)** - Current roadmap & priorities

### Active Guides (`current/`)
- **[GOOGLE_IDENTITY_SETUP.md](current/GOOGLE_IDENTITY_SETUP.md)** - Enable Google Cloud Identity Platform
- **[GOOGLE_CLOUD_SERVICES.md](current/GOOGLE_CLOUD_SERVICES.md)** - Explain + navigate all required GCP services
- **[ARTIFACT_REGISTRY_SETUP.md](current/ARTIFACT_REGISTRY_SETUP.md)** - Build + push images to Artifact Registry
- **[GITHUB_SECURITY_TAB.md](current/GITHUB_SECURITY_TAB.md)** - How we handle GitHub security alerts
- **[GET_ID_TOKEN.md](current/GET_ID_TOKEN.md)** - Obtain Google ID tokens for testing
- **[google-cloud-identity-quick-reference.md](current/google-cloud-identity-quick-reference.md)** - Quick reference guide
- **[PROGRESSIVE_EXPLANATION.md](current/PROGRESSIVE_EXPLANATION.md)** - 15-level explanation from kid-friendly to expert

> Need a quick summary of the current folder? See [current/README.md](current/README.md).

### Feature Implementations (`implementations/`)
- **[JWT_REFRESH_TOKENS.md](implementations/JWT_REFRESH_TOKENS.md)** - Refresh token architecture + rollout
- **[ENHANCED_RBAC_IMPLEMENTATION.md](implementations/ENHANCED_RBAC_IMPLEMENTATION.md)** - Fine-grained permission model

### Testing & Quality (`features/`)
- **[TESTING_STATUS.md](features/TESTING_STATUS.md)** - Current test coverage & pass rates
- **[TESTING_SETUP_SUMMARY.md](features/TESTING_SETUP_SUMMARY.md)** - Testing infrastructure
- **[TESTING_CHECKLIST.md](features/TESTING_CHECKLIST.md)** - Manual + automated checklist

### Deployment (`deployment/`)
- **[DEPLOYMENT_INDEX.md](deployment/DEPLOYMENT_INDEX.md)** - Entry point for all deployment paths
- **[GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md](deployment/GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)** - Kubernetes + Helm with Google Identity
- **[secrets-manager-setup.md](deployment/secrets-manager-setup.md)** - Production setup (environments, secrets, automation)
- Historical deployment guides now live under `completed/` for reference.

### Status & Planning
- **[STATUS.md](status/STATUS.md)** - Current delivery status
- **[a-plus-production-plan.md](planning/a-plus-production-plan.md)** - Production readiness checklist

### Completed / Archived (`completed/`)
- **[dockerization-guide.md](completed/dockerization-guide.md)** - Legacy Docker-only workflow
- **[kubernetes-helm-guide.md](completed/kubernetes-helm-guide.md)** - Legacy Helm guide (superseded by Deployment Index)
- **[AUTHENTICATION_APPROACH_COMPARISON.md](completed/AUTHENTICATION_APPROACH_COMPARISON.md)** - Decision record
- **[HYBRID_USER_REGISTRY_ARCHITECTURE.md](completed/HYBRID_USER_REGISTRY_ARCHITECTURE.md)** - Archived design reference
- **[google-cloud-identity-integration-guide.md](completed/google-cloud-identity-integration-guide.md)** - Final report for legacy integration

---

## Quick Navigation

| Goal | Start Here |
| --- | --- |
| Spin up everything locally | [README.md](../README.md)  Quick Start |
| Understand architecture | [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) |
| Configure Google Identity Platform | [GOOGLE_IDENTITY_SETUP.md](current/GOOGLE_IDENTITY_SETUP.md) |
| Deploy (Docker/K8s/Helm) | [DEPLOYMENT_INDEX.md](deployment/DEPLOYMENT_INDEX.md) |
| Fix or check tests | [TESTING_STATUS.md](features/TESTING_STATUS.md) |
| See what's next | [NEXT_STEPS.md](NEXT_STEPS.md) |

---

## Documentation Standards

- Markdown with consistent heading hierarchy
- Numbered steps for procedures
- Callouts for **Important**,  Warnings, and  Validation steps
- Troubleshooting & verification sections in every guide
- Status indicators:  Active   In Progress   Reference

---

**Last Updated:** 2025-11-21
