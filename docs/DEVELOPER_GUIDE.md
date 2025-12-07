## Cloud Secrets Manager – Developer Guide

> Practical guide for running, deploying, and observing CSM as a developer.

---

### 0. 10‑second cheat sheet

- **Docker Compose (local only)**
  - Start: `cd docker && docker compose up --build`
  - Stop (keep data): `cd docker && docker compose down`
  - Stop + wipe volumes: `cd docker && docker compose down -v`

- **Local Kubernetes (Docker Desktop)**
  - Deploy app: `helm upgrade --install csm ./infrastructure/helm/cloud-secrets-manager -n csm --create-namespace -f infrastructure/helm/cloud-secrets-manager/values-local.yaml`
  - Check pods: `kubectl get pods -n csm`
  - Remove app only: `helm uninstall csm -n csm`

- **Monitoring stack (Prometheus/Grafana/Loki)**
  - Deploy: `./infrastructure/monitoring/deploy-monitoring.sh`
  - Access Grafana: `kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80`
  - Remove monitoring: 
    - `helm uninstall loki -n monitoring`
    - `helm uninstall prometheus -n monitoring`

- **Cluster hard reset (local only)**
  - Docker Desktop → **Settings → Kubernetes → Reset Kubernetes cluster** (wipes everything).

---

### 1. Who this is for

- **Backend / Full‑stack engineers** implementing features or fixing bugs.
- **DevOps / SREs** working on deployment, clusters, and observability.
- **New contributors** who need a mental model of how things run end‑to‑end.

**Assumption:** You have Docker, Docker Desktop (with Kubernetes), `kubectl`, `helm`, `terraform`, `java`, and `node` installed, and access to the GCP project for non‑local work.

---

## 2. High‑level architecture (dev view)

- **Services**
  - `secret-service` (Spring Boot): core secrets CRUD + encryption.
  - `audit-service` (Spring Boot): audit trail and compliance events.
  - `notification-service` (Spring Boot): async notifications (Pub/Sub).
  - `frontend` (React): UI for managing secrets.
- **Datastores**
  - Local: PostgreSQL in Docker/Kubernetes.
  - Cloud: Cloud SQL for PostgreSQL (dev/staging/prod).
- **Infra**
  - Local: Docker Compose or Docker Desktop Kubernetes.
  - Cloud: GKE + Cloud SQL + Secret Manager, provisioned via Terraform.
  - Deployments: Helm chart `infrastructure/helm/cloud-secrets-manager/`.
  - Observability: Prometheus, Grafana, Loki in `monitoring` namespace.

For a deeper architecture view, see `docs/infrastructure/01-OVERVIEW.md` and `docs/wiki/03-ARCHITECTURE.md`.

---

## 3. Local development

### 3.1 Backend + DB via Docker Compose

Best for **feature work** and quick iteration without Kubernetes.

- **Start stack:**
  - From project root:
    - `cd docker`
    - `docker compose up --build`
- **What you get:**
  - PostgreSQL
  - All backend services
  - (Optionally) frontend
- **Stop stack:**
  - `docker compose down`

Use this mode when you are mostly changing business logic and don’t need to validate Helm/Kubernetes behaviour.

### 3.2 Local Kubernetes (Docker Desktop cluster)

Best for **integration testing** of:
- Helm templates
- Probes, resources, network policies
- Monitoring stack (Prometheus/Grafana/Loki)

**Typical workflow:**

1. **Ensure Docker Desktop Kubernetes is running.**
2. **Build local images** (from repo root):
   - `docker build -t csm/secret-service:local -f apps/backend/secret-service/Dockerfile .`
   - `docker build -t csm/audit-service:local -f apps/backend/audit-service/Dockerfile .`
   - `docker build -t csm/notification-service:local -f apps/backend/notification-service/Dockerfile .`
3. **Deploy to local cluster with Helm:**
   - `helm upgrade --install csm ./infrastructure/helm/cloud-secrets-manager \`
   - `  -n csm --create-namespace \`
   - `  -f infrastructure/helm/cloud-secrets-manager/values-local.yaml`
4. **Check pods:**
   - `kubectl get pods -n csm`
5. **Deploy monitoring (Prometheus/Grafana/Loki):**
   - `./infrastructure/monitoring/deploy-monitoring.sh`

Details and options are in `infrastructure/monitoring/DEPLOYMENT_GUIDE.md`.

### 3.3 Stopping / cleaning up (local)

**Docker Compose:**
- Stop and remove containers (keeps volumes by default):
  - `cd docker`
  - `docker compose down`
- Full clean (containers + networks + named volumes):
  - `docker compose down -v`

**Local Kubernetes (app only):**
- Remove the CSM release but keep cluster + monitoring:
  - `helm uninstall csm -n csm`
  - Optionally delete namespace: `kubectl delete namespace csm`

**Local Kubernetes (monitoring):**
- Explicitly tear down monitoring stack (if deployed via script):
  - Uninstall Loki + Promtail:
    - `helm uninstall loki -n monitoring`
  - Uninstall Prometheus + Grafana:
    - `helm uninstall prometheus -n monitoring`
  - Optionally delete namespace (if nothing else is in it):
    - `kubectl delete namespace monitoring`

**Full local cluster reset (Docker Desktop):**
- Use this only if the cluster is broken or you want a clean slate:
  - Docker Desktop → **Settings → Kubernetes → Reset Kubernetes cluster**.
  - This deletes **all** namespaces, workloads, and persistent volumes.

For cloud environments (GKE, Cloud SQL, etc.), **do not destroy** resources casually—use Terraform with review/approval (see below).

---

## 4. Working with clusters, namespaces, pods, deployments

### 4.1 Contexts and namespaces

- **Local cluster:** `docker-desktop` context.
- **Key namespaces (local & cloud):**
  - `csm` – application services (secret/audit/notification).
  - `csm-databases` – local PostgreSQL when using `values-local.yaml`.
  - `monitoring` – Prometheus, Grafana, Loki, Alertmanager.
  - `kube-system` – Kubernetes system components.

Common commands:
- Current context: `kubectl config current-context`
- List namespaces: `kubectl get namespaces`
- Switch namespace (per command): `kubectl -n csm get pods`

### 4.2 Pods & deployments (day‑to‑day operations)

**List workloads:**
- Pods in app namespace: `kubectl get pods -n csm`
- Deployments: `kubectl get deploy -n csm`

**Inspect a pod:**
- Describe (events, probes, restarts):
  - `kubectl describe pod <pod-name> -n csm`
- Logs:
  - `kubectl logs <pod-name> -n csm`
  - `kubectl logs -f deployment/secret-service -n csm`

**Operate a deployment:**
- Scale:
  - `kubectl scale deployment secret-service --replicas=3 -n csm`
- Restart (e.g., after config change):
  - `kubectl rollout restart deployment/secret-service -n csm`
- Rollout status:
  - `kubectl rollout status deployment/secret-service -n csm`

**Debug via port‑forward:**
- Secret service:
  - `kubectl port-forward -n csm svc/secret-service 8080:8080`
- Grafana (monitoring):
  - `kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80`

---

## 5. Deployments (local & GCP)

### 5.1 Helm chart structure

- Chart: `infrastructure/helm/cloud-secrets-manager/`
- Important files:
  - `values-local.yaml` – local Kubernetes (Docker Desktop) config.
  - `values.yaml` / `values-staging.yaml` / `values-production.yaml` – cloud envs.
  - `templates/*-deployment.yaml` – service deployments.
  - `templates/databases.yaml` – local PostgreSQL (for local K8s).

You normally **do not edit templates** unless changing infrastructure behaviour; use values files to override configuration.

### 5.2 Local Helm deployments

Already covered in **3.2**, but the key command:

- `helm upgrade --install csm ./infrastructure/helm/cloud-secrets-manager -n csm --create-namespace -f infrastructure/helm/cloud-secrets-manager/values-local.yaml`

Use this after rebuilding local Docker images.

### 5.3 GCP dev/staging/prod deployments

**Infra via Terraform** (run by DevOps / SRE):

- Dev environment:
  - `cd infrastructure/terraform/environments/dev`
  - `cp terraform.tfvars.example terraform.tfvars` (set `project_id`, `region`, etc.)
  - `terraform init`
  - `terraform plan`
  - `terraform apply`

- Staging / production are similar (see `environments/staging` and future `production`).

**Application via Cloud Build + Helm**:

- Cloud Build config in `infrastructure/ci-cd/`:
  - `cloudbuild.yaml` + `cloudbuild-*.yaml`.
- Typical flow:
  1. Developer merges to `develop` / `main`.
  2. Cloud Build builds images, scans them, pushes to Artifact Registry.
  3. Cloud Build uses Helm to deploy to the GKE cluster (dev/stage/prod) with env‑specific values.

More detail is in `docs/infrastructure/02-CI-CD-PIPELINE.md` and `docs/infrastructure/08-DEPLOYMENT-WORKFLOW.md`.

### 5.4 Cloud (GKE) shutdown / cost‑control strategy

For **cloud environments**, prefer **scaling down** over destroying infrastructure:

- **Scale application to zero replicas** (keeps cluster + DB):
  - `kubectl scale deployment secret-service --replicas=0 -n csm`
  - `kubectl scale deployment audit-service --replicas=0 -n csm`
  - `kubectl scale deployment notification-service --replicas=0 -n csm`

- **Reduce cluster cost** (requires Terraform change):
  - Lower `node_count`, `min_node_count`, `max_node_count` in the relevant `terraform/environments/*/main.tf` and re‑`terraform apply`.

- **Temporarily stop non‑critical workloads** (e.g., staging monitoring) by scaling deployments to 0 instead of destroying them.

- **Full teardown (last resort, non‑prod only):**
  - From the appropriate environment directory (e.g. `infrastructure/terraform/environments/dev`):
    - `terraform destroy`
  - This will delete GKE, Cloud SQL, Pub/Sub, IAM bindings, etc. Only do this when you are sure nothing else depends on that environment.

Avoid deleting cloud resources manually in the GCP Console—always go through Terraform so the state stays consistent.

---

## 6. Monitoring & Grafana (developer view)

### 6.1 Stack components

- **Prometheus** – scrapes metrics from Spring Boot services (`/actuator/prometheus`).
- **Grafana** – dashboards for application and cluster metrics.
- **Loki + Promtail** – logs from pods, searchable in Grafana.
- **Alertmanager** – alerts on SLO/SLA breaches (mainly prod).

All run in the `monitoring` namespace.

### 6.2 Accessing Grafana locally

1. Ensure monitoring stack is deployed (see `infrastructure/monitoring/DEPLOYMENT_GUIDE.md`).
2. Port‑forward Grafana:
   - `kubectl port-forward -n monitoring svc/prometheus-grafana 3001:80`
3. Open: `http://localhost:3001`
4. Login: `admin` / `admin` (then change password).

### 6.3 CSM overview dashboard

- A custom **Cloud Secrets Manager** dashboard is defined in:
  - `infrastructure/monitoring/grafana/csm-dashboard.json`
  - Setup guide: `infrastructure/monitoring/GRAFANA_DASHBOARD_SETUP.md`
- Panels include:
  - Request rate, error rate, latency (p50, p95, p99).
  - JVM heap usage, threads, GC pauses.
  - DB connection pool usage.
  - Service and pod health.

To use it locally, import the JSON into Grafana ("+" → "Import" → upload file → choose Prometheus datasource).

### 6.4 Verifying metrics are scraped

- Ensure **ServiceMonitors** exist in `monitoring` namespace:
  - `kubectl get servicemonitors -n monitoring | grep -E "secret|audit"`
- Ensure pods have the right labels (`app=secret-service`, `app=audit-service`).
- In Prometheus UI (`http://localhost:9090` via port‑forward), query:
  - `http_server_requests_seconds_count{job="secret-service"}`
  - `http_server_requests_seconds_count{job="audit-service"}`

For a full observability deep dive, see `docs/infrastructure/06-MONITORING-OBSERVABILITY.md`.

---

## 7. Common developer workflows

### 7.1 Change backend logic and test locally

1. Run services with Docker Compose or local K8s.
2. Make code change in the relevant service (`apps/backend/*`).
3. Run unit tests (e.g., `mvn test` in the service). 
4. Rebuild image if using K8s:
   - `docker build -t csm/secret-service:local -f apps/backend/secret-service/Dockerfile .`
5. Redeploy Helm release if needed:
   - `helm upgrade csm ./infrastructure/helm/cloud-secrets-manager -n csm -f infrastructure/helm/cloud-secrets-manager/values-local.yaml`
6. Hit the API or UI and validate behaviour.

### 7.2 Add a new environment variable / configuration

1. Decide **where** it lives:
   - Runtime only → Helm `values-*.yaml`.
   - Secret / credential → GCP Secret Manager + External Secrets (cloud) or K8s Secret (local).
2. Update:
   - Local K8s: update `secret-config.yaml` / values-local and re‑`helm upgrade`.
   - Cloud: add to Secret Manager, update ExternalSecret or app config.
3. Restart deployment:
   - `kubectl rollout restart deployment/secret-service -n csm`.

### 7.3 Add a new metric to a service

1. Use Micrometer in the Spring Boot service to define a counter/gauge/timer.
2. Expose via `/actuator/prometheus` (already enabled).
3. Verify in Prometheus UI.
4. Add a panel to the CSM Grafana dashboard and export updated JSON into `infrastructure/monitoring/grafana/csm-dashboard.json`.

---

## 8. Troubleshooting checklist

### 8.1 Cluster / API issues

- `kubectl cluster-info` fails or times out:
  - Restart Docker Desktop (for local).
  - Verify kubeconfig context (`kubectl config get-contexts`).

### 8.2 Pods in CrashLoopBackOff

1. `kubectl describe pod <pod> -n csm` – look at events (probes, OOM, image pull).
2. `kubectl logs <pod> -n csm` – check stack traces.
3. Common causes:
   - DB not reachable (Cloud SQL proxy or local PG).
   - Missing env vars or secrets.
   - Wrong profile (spring profile vs env expectations).

### 8.3 No data in Grafana panels

1. Check Prometheus targets:
   - `kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090`
   - Visit `/targets` and confirm `secret-service` and `audit-service` jobs are **up**.
2. Verify ServiceMonitors and pod labels.
3. Confirm `/actuator/prometheus` responds from within the cluster.

### 8.4 Can’t reach services from browser

1. For local K8s, use `kubectl port-forward` rather than Ingress.
2. For cloud, verify:
   - Ingress rules, DNS, TLS certs.
   - Network policies not blocking traffic.

---

## 9. Where to go next

- **Infrastructure details:** `docs/infrastructure/*.md`
- **Monitoring deep dive:** `docs/101/06-PROMETHEUS-GRAFANA-101.md`
- **Workflows / runbooks:** `docs/wiki/workflows/*`

This guide is intentionally high‑level. Treat it as your starting map; for any specific area (Terraform, Helm, CI/CD, monitoring, security), jump into the corresponding `docs/infrastructure/` page for more depth.
