# Cloud Secrets Manager - Engineering Wiki

> **Onboarding documentation for new engineers**

Welcome to the Cloud Secrets Manager engineering wiki. This documentation provides a high-level overview of the system architecture, workflows, infrastructure, and operational procedures.

---

## Quick Navigation

| Page | Description |
|------|-------------|
| [Overview](./01-OVERVIEW.md) | Project purpose, main features, and user journeys |
| [Features & Workflows](./02-FEATURES-AND-WORKFLOWS.md) | Business capabilities and key user flows |
| [Architecture](./03-ARCHITECTURE.md) | System design and service communication |
| [Data & Database](./04-DATA-AND-DATABASE.md) | Entities, relationships, and schema design |
| [Request Flows](./05-REQUEST-FLOWS.md) | Sequence diagrams for critical operations |
| [Infrastructure & Deployment](./06-INFRASTRUCTURE-AND-DEPLOYMENT.md) | CI/CD, Kubernetes, Terraform, and GCP |
| [Monitoring & Observability](./07-MONITORING-AND-OBSERVABILITY.md) | Logs, metrics, traces, and debugging |
| [Operations & Local Development](./08-OPERATIONS-AND-LOCAL-DEVELOPMENT.md) | Running locally and environment differences |

---

## What is Cloud Secrets Manager?

Cloud Secrets Manager is an enterprise-grade platform for securely storing, managing, and auditing sensitive credentials. It provides encrypted storage, role-based access control, version history, and comprehensive audit logging.

**Target Users:**
- Development teams managing API keys and credentials
- Security teams requiring audit compliance
- Platform teams needing centralized secrets management

---

## Key Technologies

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Java 21, Spring Boot 3.3.5, PostgreSQL 16 |
| **Authentication** | Firebase Authentication, JWT, TOTP 2FA |
| **Infrastructure** | GKE, Cloud SQL, Pub/Sub, Secret Manager |
| **IaC** | Terraform, Helm, Kubernetes manifests |
| **Observability** | Prometheus, Grafana, Loki, Promtail |

---

## Getting Started

1. **Read the [Overview](./01-OVERVIEW.md)** to understand what the system does
2. **Review the [Architecture](./03-ARCHITECTURE.md)** to understand how services interact
3. **Set up your [Local Environment](./08-OPERATIONS-AND-LOCAL-DEVELOPMENT.md)** to run the system
4. **Explore the [Request Flows](./05-REQUEST-FLOWS.md)** to trace how requests move through the system

---

*Last Updated: December 2025*
