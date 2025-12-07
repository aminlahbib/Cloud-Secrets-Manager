# Cloud Secrets Manager - Technology Learning Path

> **Master the technologies powering this enterprise secrets management platform**

```mermaid
graph LR
    subgraph Fundamentals
        K8S[Kubernetes]
        HELM[Helm]
        TF[Terraform]
        FB[Firebase]
    end
    
    subgraph Advanced
        GKE[GKE]
        MON[Monitoring]
        LOG[Logging]
        SEC[Security]
        COST[Cost Mgmt]
    end
    
    K8S --> GKE
    HELM --> GKE
    TF --> GKE
    FB --> SEC
    GKE --> MON
    GKE --> LOG
    MON --> COST
    
    style K8S fill:#326CE5,color:#fff
    style HELM fill:#0F1689,color:#fff
    style TF fill:#7B42BC,color:#fff
    style FB fill:#FFCA28,color:#000
    style GKE fill:#4285F4,color:#fff
    style MON fill:#E6522C,color:#fff
    style LOG fill:#F2A900,color:#000
    style SEC fill:#00BFA5,color:#fff
    style COST fill:#34A853,color:#fff
```

---

## 📚 Learning Path Overview

### Phase 1: Fundamentals (Week 1-2)

| # | Tutorial | Time | Description |
|---|----------|------|-------------|
| 01 | [Kubernetes 101](./01-KUBERNETES-101.md) | 3h | Container orchestration basics |
| 02 | [Helm 101](./02-HELM-101.md) | 2h | Kubernetes package management |
| 03 | [Terraform 101](./03-TERRAFORM-101.md) | 3h | Infrastructure as Code |
| 04 | [Firebase 101](./04-FIREBASE-FUNDAMENTALS.md) | 2h | Authentication & Identity |

### Phase 2: Advanced (Week 3-4)

| # | Tutorial | Time | Description |
|---|----------|------|-------------|
| 05 | [GKE 101](./05-GKE-101.md) | 3h | Google Kubernetes Engine |
| 06 | [Prometheus & Grafana 101](./06-PROMETHEUS-GRAFANA-101.md) | 3h | Monitoring & Metrics |
| 07 | [Loki & Promtail 101](./07-LOKI-PROMTAIL-101.md) | 2h | Centralized Logging |
| 08 | [Security & Secrets 101](./08-SECURITY-SECRETS-101.md) | 2h | Security Best Practices |
| 09 | [Cost Management 101](./09-COST-MANAGEMENT-101.md) | 1h | Cloud Cost Optimization |

### Quick Reference

| Doc | Purpose |
|-----|---------|
| [Quick Reference Card](./QUICK-REFERENCE.md) | Commands cheat sheet |
| [Architecture Spec](./Architecture_Specification_v3.md) | System design |

---

## 🏗️ Cloud Secrets Manager Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        WEB[React Frontend<br/>Port 5173]
    end
    
    subgraph Auth["Authentication"]
        FB_AUTH[Firebase Auth]
        FB_ADMIN[Firebase Admin SDK]
    end
    
    subgraph Services["Microservices - GKE"]
        SECRET[Secret Service<br/>Port 8080]
        AUDIT[Audit Service<br/>Port 8081]
        NOTIF[Notification Service<br/>Port 8082]
    end
    
    subgraph Data["Data Layer"]
        CSQL[(Cloud SQL<br/>PostgreSQL)]
        GSM[Google Secret Manager]
        PUBSUB[Pub/Sub]
    end
    
    subgraph Observability["Observability"]
        PROM[Prometheus]
        GRAF[Grafana]
        LOKI[Loki]
    end
    
    WEB -->|Google OAuth| FB_AUTH
    FB_AUTH -->|ID Token| WEB
    WEB -->|Bearer Token| SECRET
    
    SECRET -->|Verify Token| FB_ADMIN
    SECRET --> CSQL
    SECRET --> GSM
    SECRET -->|Events| PUBSUB
    SECRET --> AUDIT
    
    PUBSUB --> NOTIF
    NOTIF --> CSQL
    AUDIT --> CSQL
    
    SECRET -.->|Metrics| PROM
    AUDIT -.->|Metrics| PROM
    PROM --> GRAF
    
    SECRET -.->|Logs| LOKI
    AUDIT -.->|Logs| LOKI
    LOKI --> GRAF
    
    style WEB fill:#61DAFB,color:#000
    style FB_AUTH fill:#FFCA28,color:#000
    style SECRET fill:#6DB33F,color:#fff
    style AUDIT fill:#6DB33F,color:#fff
    style NOTIF fill:#6DB33F,color:#fff
    style CSQL fill:#336791,color:#fff
    style PROM fill:#E6522C,color:#fff
    style GRAF fill:#F46800,color:#fff
    style LOKI fill:#F2A900,color:#000
```

---

## 🛠️ Technology Stack

### Infrastructure as Code

```mermaid
flowchart LR
    subgraph IaC["Infrastructure as Code"]
        TF[Terraform]
        HELM[Helm Charts]
        K8S_YAML[K8s Manifests]
    end
    
    subgraph GCP["Google Cloud Platform"]
        GKE_C[GKE Cluster]
        CSQL_I[Cloud SQL]
        AR[Artifact Registry]
        GSM_I[Secret Manager]
        PS[Pub/Sub]
    end
    
    TF -->|Creates| GKE_C
    TF -->|Creates| CSQL_I
    TF -->|Creates| AR
    TF -->|Creates| GSM_I
    TF -->|Creates| PS
    
    HELM -->|Deploys to| GKE_C
    K8S_YAML -->|Applies to| GKE_C
    
    style TF fill:#7B42BC,color:#fff
    style HELM fill:#0F1689,color:#fff
    style GKE_C fill:#4285F4,color:#fff
```

### Project Structure

```
Cloud-Secrets-Manager/
├── apps/
│   ├── backend/
│   │   ├── secret-service/      # Core API (Java/Spring Boot)
│   │   ├── audit-service/       # Audit logging
│   │   └── notification-service/ # Notifications
│   └── frontend/                # React/TypeScript SPA
│
├── infrastructure/
│   ├── terraform/               # IaC modules
│   │   ├── modules/
│   │   │   ├── gke-cluster/
│   │   │   ├── postgresql/
│   │   │   ├── iam/
│   │   │   └── artifact-registry/
│   │   └── environments/
│   │       └── dev/
│   │
│   ├── helm/                    # Kubernetes deployments
│   │   └── cloud-secrets-manager/
│   │       ├── Chart.yaml
│   │       ├── values.yaml
│   │       ├── values-staging.yaml
│   │       └── values-production.yaml
│   │
│   ├── kubernetes/              # Raw K8s manifests
│   └── monitoring/              # Prometheus/Grafana configs
│
├── docker/                      # Local development
│   ├── docker-compose.yml
│   └── .env.example
│
└── docs/
    └── 101/                     # 👈 You are here!
```

---

## 🚀 Quick Start Commands

### Local Development

```bash
# Start all services locally
cd docker
docker compose up --build

# Access services
# Frontend: http://localhost:5173
# Backend:  http://localhost:8080
# Swagger:  http://localhost:8080/swagger-ui.html
```

### Kubernetes (Local)

```bash
# Start local K8s (Docker Desktop or minikube)
kubectl cluster-info

# Deploy with Helm
cd infrastructure/helm/cloud-secrets-manager
helm install csm . --namespace csm --create-namespace

# Check status
kubectl get pods -n csm
```

### Terraform (GCP)

```bash
# Initialize and deploy
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply
```

---

## 📊 Learning Objectives

After completing this learning path, you will be able to:

### Fundamentals
- [ ] Deploy containerized applications to Kubernetes
- [ ] Create and manage Helm charts
- [ ] Write Terraform modules for GCP resources
- [ ] Implement Firebase authentication

### Advanced
- [ ] Configure GKE clusters with Workload Identity
- [ ] Set up Prometheus monitoring with alerting
- [ ] Implement centralized logging with Loki
- [ ] Apply security best practices (Pod Security, Network Policies)
- [ ] Optimize cloud costs and set up budgets

---

## 🔗 Related Documentation

| Document | Description |
|----------|-------------|
| [Deployment Guide](../deployment/) | Production deployment steps |
| [Operations Runbook](../05_OPERATIONS_AND_RUNBOOK.md) | Day-to-day operations |
| [Security Guide](../security/) | Security hardening |
| [API Documentation](http://localhost:8080/swagger-ui.html) | OpenAPI/Swagger |

---

## 💡 Tips for Success

1. **Start Local** - Use Docker Compose before Kubernetes
2. **Read the Errors** - Error messages tell you exactly what's wrong
3. **Use `kubectl describe`** - Essential for debugging K8s issues
4. **Check Logs** - `kubectl logs` and `docker logs` are your friends
5. **Don't Skip Exercises** - Hands-on practice is crucial
6. **Break Things** - The best way to learn is by fixing mistakes

---

## 📝 Progress Tracker

```
[ ] Phase 1: Fundamentals
    [ ] Kubernetes 101 - Complete all exercises
    [ ] Helm 101 - Create custom chart
    [ ] Terraform 101 - Deploy to GCP
    [ ] Firebase 101 - Implement auth flow

[ ] Phase 2: Advanced
    [ ] GKE 101 - Create cluster with Workload Identity
    [ ] Monitoring 101 - Set up Prometheus + Grafana
    [ ] Logging 101 - Configure Loki + Promtail
    [ ] Security 101 - Apply Pod Security Standards
    [ ] Cost 101 - Set up budget alerts
```

---

**Ready to start?** Begin with [Kubernetes 101](./01-KUBERNETES-101.md) →

---

*Last Updated: December 7, 2025*
