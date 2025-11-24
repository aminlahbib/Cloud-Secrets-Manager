# Deployment Documentation Index

Use this index to jump straight to the deployment doc that fits your workflow.

---

## Primary scenarios

| Scenario | Docs | Notes |
| --- | --- | --- |
| Production go-live | [Quick Deployment Guide](./QUICK_DEPLOYMENT_GUIDE.md), [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md) | Quick checklist + deep dive |
| Provisioning infra | [Terraform Guide](./terraform/TERRAFORM_GUIDE.md), [Terraform Operations](./terraform/TERRAFORM_OPERATIONS.md) | Stand up and maintain GCP resources |
| Secrets & identity | [External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md), [Google Identity Deployment Setup](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md) | GSM, ESO, Firebase/GIP |
| Local development | [Local Development Guide](./LOCAL_DEVELOPMENT_GUIDE.md) | Docker Compose workflow |
| Day-2 operations | [Operations Guide](./OPERATIONS_GUIDE.md), [Monitoring Setup](./monitoring/MONITORING_SETUP.md) | Runbooks, scaling, observability |
| Automation / CI | [CI/CD Setup Guide](./ci-cd/CI_CD_SETUP.md), [CI/CD Pipeline Status](./ci-cd/CI_CD_PIPELINE_STATUS.md) | Configure or assess pipelines |
| Helm-focused rollout | [Helm Deployment Guide](./helm/HELM_DEPLOYMENT_GUIDE.md) | Values, upgrades, rollback steps |

---

## Guide directory

### [Quick Deployment Guide](./QUICK_DEPLOYMENT_GUIDE.md) ⭐ START HERE FOR PROD
- Single-page checklist covering prerequisites, Terraform apply, artifact build/push, Helm install, and verification.
- Links directly into detailed docs for any step that needs more context.

### [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md)
- Comprehensive, step-by-step instructions for deploying to GKE after infrastructure exists.
- Includes Docker image build/push, Kubernetes manifests, database connectivity, troubleshooting, and rollback.

### [Terraform Guide](./terraform/TERRAFORM_GUIDE.md)
- Explains module layout, backend state, environment structure, and how to provision GKE/Cloud SQL/Artifact Registry/IAM.

### [Terraform Operations](./terraform/TERRAFORM_OPERATIONS.md)
- Common day-to-day workflows (init, plan, apply, import, state repair, destroy) with command snippets.

### [External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md)
- How to create secrets in Google Secret Manager, wire External Secrets Operator, and map values into Kubernetes.

### [Google Identity Deployment Setup](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)
- Detailed instructions for enabling Google Cloud Identity Platform, creating service accounts, and injecting configuration into Helm/Kubernetes.

### [Helm Deployment Guide](./helm/HELM_DEPLOYMENT_GUIDE.md)
- Helm chart structure, key values, deployment/upgrade/rollback commands, and release hygiene.

### [Local Development Guide](./LOCAL_DEVELOPMENT_GUIDE.md)
- Docker Compose topology, local Postgres setup, per-service environment variables, and developer workflows.

### [Operations Guide](./OPERATIONS_GUIDE.md)
- Monitoring, scaling, log access, rolling updates, database procedures, backup/restore, and security operations.

### [Monitoring Setup](./monitoring/MONITORING_SETUP.md)
- Installing ServiceMonitors, Grafana dashboards, alert rules, and tracing stack. Pair with the runbooks and SLO docs in the same folder.

### [CI/CD Setup Guide](./ci-cd/CI_CD_SETUP.md)
- GitHub Actions configuration, required GCP service accounts/secrets, workflow layout, deployment verification, and troubleshooting.

### [CI/CD Pipeline Status](./ci-cd/CI_CD_PIPELINE_STATUS.md)
- Current maturity snapshot plus recommended enhancements for releases, rollbacks, and testing gates.

---

## Deployment workflow overview

```
1. Provision infrastructure
   -> Terraform Guide / Terraform Operations

2. Configure secrets & identity
   -> External Secrets Setup / Google Identity Deployment Setup

3. Deploy application workloads
   -> Quick Deployment Guide (summary)
   -> Complete Deployment Guide or Helm Deployment Guide (details)

4. Enable monitoring & operations
   -> Monitoring Setup / Operations Guide

5. (Optional) Automate the pipeline
   -> CI/CD Setup Guide / CI/CD Pipeline Status
```

---

## Supporting directories

- **Terraform** – [`terraform/`](./terraform/)  
- **Kubernetes** – [`kubernetes/`](./kubernetes/)  
- **Helm** – [`helm/`](./helm/)  
- **CI/CD** – [`ci-cd/`](./ci-cd/)  
- **Operations** – [`operations/`](./operations/)  
- **Monitoring** – [`monitoring/`](./monitoring/)  
- **Security** – [`../security/`](../security/)  
- **Archive** – [`archive/`](./archive/) for historical docs

---

**Last Updated:** November 24, 2025
