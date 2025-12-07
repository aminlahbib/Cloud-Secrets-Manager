# Cloud Secrets Manager - Quick Reference Card

> **Essential commands for daily operations**

---

## 🐳 Docker (Local Development)

```bash
# Start all services
cd docker && docker compose up --build

# Start in background
docker compose up -d

# View logs
docker compose logs -f secret-service
docker compose logs -f --tail=100

# Stop all services
docker compose down

# Clean restart (remove volumes)
docker compose down -v && docker compose up --build

# Access services
# Frontend:  http://localhost:5173
# Backend:   http://localhost:8080
# Swagger:   http://localhost:8080/swagger-ui.html
# Postgres:  localhost:5432
```

---

## ☸️ Kubernetes

### Cluster Operations

```bash
# Check cluster
kubectl cluster-info
kubectl get nodes

# Switch context
kubectl config get-contexts
kubectl config use-context docker-desktop

# Switch namespace
kubectl config set-context --current --namespace=csm
```

### Pod Operations

```bash
# List pods
kubectl get pods -n csm
kubectl get pods -n csm -o wide
kubectl get pods -n csm -w  # Watch

# Describe pod
kubectl describe pod <pod-name> -n csm

# Pod logs
kubectl logs <pod-name> -n csm
kubectl logs <pod-name> -n csm -f         # Follow
kubectl logs <pod-name> -n csm --previous # Previous crash

# Execute in pod
kubectl exec -it <pod-name> -n csm -- /bin/sh
kubectl exec -it <pod-name> -n csm -- curl localhost:8080/actuator/health

# Port forward
kubectl port-forward svc/secret-service 8080:8080 -n csm
kubectl port-forward pod/<pod-name> 8080:8080 -n csm
```

### Deployments

```bash
# List deployments
kubectl get deployments -n csm

# Scale
kubectl scale deployment secret-service --replicas=3 -n csm

# Rollout status
kubectl rollout status deployment/secret-service -n csm

# Rollout history
kubectl rollout history deployment/secret-service -n csm

# Rollback
kubectl rollout undo deployment/secret-service -n csm
kubectl rollout undo deployment/secret-service --to-revision=2 -n csm

# Restart deployment
kubectl rollout restart deployment/secret-service -n csm
```

### Services & Ingress

```bash
# List services
kubectl get svc -n csm
kubectl get ingress -n csm

# Describe service
kubectl describe svc secret-service -n csm

# Get endpoints
kubectl get endpoints -n csm
```

### Secrets & ConfigMaps

```bash
# List secrets
kubectl get secrets -n csm
kubectl get configmaps -n csm

# View secret (base64 encoded)
kubectl get secret csm-secrets -n csm -o yaml

# Decode secret
kubectl get secret csm-secrets -n csm -o jsonpath='{.data.DB_PASSWORD}' | base64 -d

# Create secret
kubectl create secret generic my-secret --from-literal=key=value -n csm
```

### Debugging

```bash
# Events
kubectl get events -n csm --sort-by='.lastTimestamp'

# Resource usage
kubectl top pods -n csm
kubectl top nodes

# Describe node
kubectl describe node <node-name>

# Run debug pod
kubectl run debug --rm -it --image=busybox -n csm -- /bin/sh
```

---

## ⎈ Helm

```bash
# List releases
helm list -n csm
helm list --all-namespaces

# Install
helm install csm ./infrastructure/helm/cloud-secrets-manager -n csm --create-namespace

# Install with values file
helm install csm . -n csm -f values-production.yaml

# Upgrade
helm upgrade csm . -n csm
helm upgrade csm . -n csm --set secretService.replicas=3

# Rollback
helm rollback csm -n csm
helm rollback csm 1 -n csm  # To revision 1

# Uninstall
helm uninstall csm -n csm

# Show values
helm get values csm -n csm
helm show values ./chart

# Template (dry run)
helm template csm . -n csm --debug
```

---

## 🏗️ Terraform

```bash
# Navigate to environment
cd infrastructure/terraform/environments/dev

# Initialize
terraform init

# Format
terraform fmt -recursive

# Validate
terraform validate

# Plan
terraform plan
terraform plan -out=tfplan

# Apply
terraform apply
terraform apply tfplan
terraform apply -auto-approve

# Destroy
terraform destroy

# State operations
terraform state list
terraform state show google_container_cluster.primary
terraform state rm <resource>

# Output
terraform output
terraform output cluster_endpoint
```

---

## ☁️ Google Cloud (gcloud)

### Authentication

```bash
# Login
gcloud auth login
gcloud auth application-default login

# Set project
gcloud config set project cloud-secrets-manager

# List projects
gcloud projects list
```

### GKE

```bash
# List clusters
gcloud container clusters list

# Get credentials
gcloud container clusters get-credentials csm-cluster \
  --region us-central1 \
  --project cloud-secrets-manager

# Describe cluster
gcloud container clusters describe csm-cluster --region us-central1
```

### Cloud SQL

```bash
# List instances
gcloud sql instances list

# Connect
gcloud sql connect csm-db --user=postgres

# Stop (dev only)
gcloud sql instances patch csm-db --activation-policy=NEVER

# Start
gcloud sql instances patch csm-db --activation-policy=ALWAYS
```

### Secret Manager

```bash
# List secrets
gcloud secrets list

# Create secret
gcloud secrets create my-secret --replication-policy="automatic"

# Add version
echo -n "secret-value" | gcloud secrets versions add my-secret --data-file=-

# Access secret
gcloud secrets versions access latest --secret=my-secret
```

### Artifact Registry

```bash
# List repositories
gcloud artifacts repositories list --location=us-central1

# Configure Docker
gcloud auth configure-docker us-central1-docker.pkg.dev

# List images
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/PROJECT/REPO
```

---

## 🔥 Firebase

### CLI Commands

```bash
# Login
firebase login

# Initialize project
firebase init

# Deploy rules
firebase deploy --only firestore:rules

# List projects
firebase projects:list

# Use project
firebase use cloud-secrets-manager
```

### Token Operations (JavaScript)

```javascript
// Get current user
const user = auth.currentUser;

// Get ID token
const token = await user.getIdToken();

// Force refresh token
const freshToken = await user.getIdToken(true);

// Get claims
const result = await user.getIdTokenResult();
console.log(result.claims);

// Sign out
await signOut(auth);
```

---

## 📊 Monitoring

### Prometheus

```bash
# Port forward
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# Common queries
rate(http_server_requests_seconds_count[5m])
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))
```

### Grafana

```bash
# Port forward
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Login: admin / prom-operator
```

### Loki

```bash
# Port forward
kubectl port-forward -n monitoring svc/loki 3100:3100

# Query logs
{namespace="csm", app="secret-service"} |= "error"
```

---

## 🔧 Troubleshooting

### Pod Issues

```bash
# Pod stuck in Pending
kubectl describe pod <pod> -n csm | grep -A 10 Events

# Pod CrashLoopBackOff
kubectl logs <pod> -n csm --previous

# ImagePullBackOff
kubectl describe pod <pod> -n csm | grep -A 5 "Image"
```

### Networking Issues

```bash
# Test DNS
kubectl run test --rm -it --image=busybox -- nslookup secret-service.csm

# Test connectivity
kubectl run test --rm -it --image=busybox -- wget -O- http://secret-service:8080/actuator/health
```

### External Secrets

```bash
# Check status
kubectl get externalsecrets -n csm
kubectl describe externalsecret csm-secrets -n csm

# Check operator logs
kubectl logs -n external-secrets -l app.kubernetes.io/name=external-secrets
```

---

## 📁 Project Paths

| Path | Purpose |
|------|---------|
| `apps/backend/secret-service/` | Main Spring Boot API |
| `apps/frontend/` | React SPA |
| `docker/` | Local development |
| `infrastructure/terraform/` | IaC modules |
| `infrastructure/helm/` | Helm charts |
| `infrastructure/kubernetes/k8s/` | Raw manifests |
| `infrastructure/monitoring/` | Prometheus configs |
| `docs/101/` | Tutorials (you are here) |

---

## 🔗 Useful URLs

| Service | Local | Production |
|---------|-------|------------|
| Frontend | http://localhost:5173 | https://csm.example.com |
| Backend API | http://localhost:8080 | https://api.csm.example.com |
| Swagger | http://localhost:8080/swagger-ui.html | - |
| Grafana | http://localhost:3000 | - |
| Prometheus | http://localhost:9090 | - |

---

*Last Updated: December 7, 2025*
