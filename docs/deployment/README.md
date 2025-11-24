# Deployment documentation hub

All artifacts required to deploy, operate, and evolve Cloud Secrets Manager live here.

---

## Quick navigation

| Need | Start here | Why |
| --- | --- | --- |
| ✅ Production go-live | [Quick Deployment Guide](./QUICK_DEPLOYMENT_GUIDE.md) | Tight checklist that links to deep dives |
| 🧱 End-to-end detail | [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md) | Terraform → GKE → verification |
| ☁️ Infrastructure only | [Terraform Guide](./terraform/TERRAFORM_GUIDE.md) | Provision and manage GCP resources |
| 🔐 Secrets & identity | [External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md) + [Google Identity Deployment Setup](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md) | Configure GSM/ESO/auth |
| 🧪 Local dev/test | [Local Development Guide](./LOCAL_DEVELOPMENT_GUIDE.md) | Docker Compose workflow |
| 📈 Operations & SRE | [Operations Guide](./OPERATIONS_GUIDE.md) | Day-2 ops, monitoring, scaling |
| 🤖 Automation | [CI/CD Setup Guide](./ci-cd/CI_CD_SETUP.md) | GitHub Actions ↔︎ GCP pipeline |
| 🛡️ Security scanning | [Security README](../security/README.md) | Trivy usage + security policies |

Need the full catalog? Jump to the [Deployment Index](./DEPLOYMENT_INDEX.md).

---

## Deployment flows

### Production (GKE + Cloud SQL)
1. **Provision infra:** [Terraform Guide](./terraform/TERRAFORM_GUIDE.md)
2. **Bootstrap secrets:** [External Secrets Setup](./EXTERNAL_SECRETS_SETUP.md)
3. **Configure identity:** [Google Identity Deployment Setup](./GOOGLE_IDENTITY_DEPLOYMENT_SETUP.md)
4. **Deploy services:** Use the [Quick Deployment Guide](./QUICK_DEPLOYMENT_GUIDE.md) or the detailed [Complete Deployment Guide](./COMPLETE_DEPLOYMENT_GUIDE.md)
5. **Operate & verify:** [Operations Guide](./OPERATIONS_GUIDE.md) + [Monitoring Setup](./monitoring/MONITORING_SETUP.md)

### Local development
1. Follow the [Local Development Guide](./LOCAL_DEVELOPMENT_GUIDE.md)
2. Spin up Docker Compose, local Postgres, and mock secrets for fast iteration

### CI/CD automation
1. Configure GitHub ↔︎ GCP credentials via [CI/CD Setup Guide](./ci-cd/CI_CD_SETUP.md)
2. Review current automation posture in [CI/CD Pipeline Status](./ci-cd/CI_CD_PIPELINE_STATUS.md)

---

## Technology directories

- **[`terraform/`](./terraform/)** – IaC blueprints for GKE, Cloud SQL, networking, Artifact Registry
- **[`kubernetes/`](./kubernetes/)** – Runtime troubleshooting, security context updates, alert analysis
- **[`helm/`](./helm/)** – Chart deployment guide and value references
- **[`ci-cd/`](./ci-cd/)** – Pipeline setup, secret management, and status docs
- **[`operations/`](./operations/)** – Backup verification, rollout verification, and incident procedures
- **[`monitoring/`](./monitoring/)** – Monitoring setup, SLOs, dashboards, and runbooks
- **[`../security/`](../security/)** – Security hardening that deployment engineers reference frequently

Completed or superseded docs live under [`archive/`](./archive/); keep referencing the live docs unless you need history.

---

**Last Updated:** November 24, 2025
