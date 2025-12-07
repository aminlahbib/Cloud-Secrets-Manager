# Infrastructure Documentation

> Engineering-grade documentation for Cloud Secrets Manager infrastructure

---

## Quick Navigation

| Document | Description |
|----------|-------------|
| [Overview](./01-OVERVIEW.md) | High-level infrastructure architecture |
| [CI/CD Pipeline](./02-CI-CD-PIPELINE.md) | Build and deployment automation |
| [Kubernetes Architecture](./03-KUBERNETES-ARCHITECTURE.md) | Cluster topology and workloads |
| [Terraform & IaC](./04-TERRAFORM-IAC.md) | Infrastructure as Code structure |
| [GCP Architecture](./05-GCP-ARCHITECTURE.md) | Google Cloud services and integration |
| [Monitoring & Observability](./06-MONITORING-OBSERVABILITY.md) | Metrics, logs, and alerting |
| [Security Architecture](./07-SECURITY-ARCHITECTURE.md) | Security posture and policies |
| [Deployment Workflow](./08-DEPLOYMENT-WORKFLOW.md) | Environment promotion strategy |
| [Directory Improvements](./09-DIRECTORY-IMPROVEMENTS.md) | Recommended structural changes |

---

## Target Audience

- **DevOps Engineers** onboarding to infrastructure operations
- **Backend Engineers** understanding deployment and runtime environments
- **Cloud Architects** reviewing system design decisions
- **SREs** managing production reliability

## Documentation Philosophy

- **High-level first**: Explain concepts before implementation details
- **Visual diagrams**: Mermaid diagrams for architecture and flows
- **No code dumps**: Reference files, don't duplicate them
- **Assumptions labeled**: Inferred details clearly marked

---

## Infrastructure Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Cloud Provider | Google Cloud Platform | Hosting and managed services |
| Container Orchestration | Google Kubernetes Engine | Workload management |
| Infrastructure as Code | Terraform | Resource provisioning |
| Package Management | Helm | Kubernetes deployments |
| CI/CD | Google Cloud Build | Automated pipelines |
| Secrets | GCP Secret Manager + ESO | Secrets synchronization |
| Observability | Prometheus, Grafana, Loki | Metrics and logging |

---

*Last Updated: December 2025*
