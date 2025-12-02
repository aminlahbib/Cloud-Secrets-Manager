# Quick Reference Guide

## 🚀 Common Commands Cheat Sheet

### Kubernetes

```bash
# Cluster info
kubectl cluster-info
kubectl get nodes

# Deployments
kubectl get deployments
kubectl create deployment NAME --image=IMAGE
kubectl scale deployment NAME --replicas=3
kubectl rollout status deployment/NAME
kubectl rollout undo deployment/NAME

# Pods
kubectl get pods
kubectl describe pod NAME
kubectl logs POD_NAME
kubectl logs -f POD_NAME
kubectl exec -it POD_NAME -- /bin/sh
kubectl delete pod NAME

# Services
kubectl get services
kubectl expose deployment NAME --type=LoadBalancer --port=80
kubectl port-forward service/NAME 8080:80

# Namespaces
kubectl get namespaces
kubectl create namespace NAME
kubectl config set-context --current --namespace=NAME

# Apply YAML
kubectl apply -f file.yaml
kubectl delete -f file.yaml
```

### Helm

```bash
# Repositories
helm repo add NAME URL
helm repo update
helm repo list

# Install/Upgrade
helm install RELEASE_NAME CHART
helm upgrade RELEASE_NAME CHART
helm upgrade RELEASE_NAME CHART --set key=value
helm upgrade RELEASE_NAME CHART -f values.yaml

# Manage releases
helm list
helm status RELEASE_NAME
helm history RELEASE_NAME
helm rollback RELEASE_NAME [REVISION]
helm uninstall RELEASE_NAME

# Create chart
helm create CHART_NAME
helm lint CHART_NAME
helm package CHART_NAME
helm install RELEASE_NAME ./CHART_NAME --dry-run --debug
```

### Terraform

```bash
# Initialize
terraform init
terraform init -upgrade

# Plan & Apply
terraform plan
terraform plan -out=tfplan
terraform apply
terraform apply -auto-approve
terraform apply tfplan

# State
terraform show
terraform state list
terraform state show RESOURCE
terraform state rm RESOURCE
terraform import RESOURCE ID

# Workspaces
terraform workspace list
terraform workspace new NAME
terraform workspace select NAME

# Format & Validate
terraform fmt
terraform validate

# Destroy
terraform destroy
terraform destroy -target=RESOURCE
```

### GKE (Google Kubernetes Engine)

```bash
# Clusters
gcloud container clusters list
gcloud container clusters create NAME --region=REGION
gcloud container clusters describe NAME --region=REGION
gcloud container clusters delete NAME --region=REGION
gcloud container clusters get-credentials NAME --region=REGION

# Node pools
gcloud container node-pools list --cluster=NAME --region=REGION
gcloud container node-pools create POOL_NAME --cluster=NAME --region=REGION
gcloud container node-pools delete POOL_NAME --cluster=NAME --region=REGION

# Update cluster
gcloud container clusters update NAME --region=REGION
gcloud container clusters update NAME --enable-autoscaling --min-nodes=1 --max-nodes=5 --region=REGION
```

### Docker

```bash
# Images
docker build -t IMAGE_NAME .
docker images
docker rmi IMAGE_NAME
docker push IMAGE_NAME

# Containers
docker run IMAGE_NAME
docker run -d -p 8080:80 IMAGE_NAME
docker ps
docker ps -a
docker stop CONTAINER
docker rm CONTAINER
docker logs CONTAINER
docker exec -it CONTAINER /bin/sh

# Compose
docker-compose up
docker-compose up -d
docker-compose down
docker-compose ps
docker-compose logs
```

### Prometheus & Grafana

```bash
# Prometheus (if in K8s)
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Grafana (if in K8s)
kubectl port-forward -n monitoring svc/grafana 3000:80

# Access
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin or admin/prom-operator)
```

### Firebase

```bash
# Install CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init

# Deploy
firebase deploy

# Functions
firebase functions:shell
firebase functions:log
```

---

## 📝 Common YAML Templates

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Kubernetes Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  type: LoadBalancer
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
```

### Kubernetes Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
spec:
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 80
```

### Helm Chart Values

```yaml
replicaCount: 3

image:
  repository: my-app
  tag: "latest"
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80

ingress:
  enabled: true
  hosts:
    - host: myapp.example.com
      paths:
        - /
```

### Terraform Resource

```hcl
resource "google_compute_instance" "vm" {
  name         = "my-vm"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }
}
```

---

## 🔍 Troubleshooting Quick Fixes

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod POD_NAME

# Check logs
kubectl logs POD_NAME

# Common issues:
# - Image pull error → Check image name/tag
# - CrashLoopBackOff → Check application logs
# - Pending → Check node resources
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints SERVICE_NAME

# Test from inside cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://SERVICE_NAME:PORT
```

### Terraform Apply Fails

```bash
# Check state
terraform state list

# Refresh state
terraform refresh

# Import existing resource
terraform import RESOURCE ID

# Remove from state (doesn't delete)
terraform state rm RESOURCE
```

### GKE Cluster Issues

```bash
# Get cluster credentials
gcloud container clusters get-credentials CLUSTER_NAME --region=REGION

# Check node status
kubectl get nodes
kubectl describe node NODE_NAME

# Check cluster events
gcloud container clusters describe CLUSTER_NAME --region=REGION
```

---

## 📚 Learning Path Summary

1. **Kubernetes** → Understand containers and orchestration
2. **Helm** → Package and manage Kubernetes apps
3. **Terraform** → Define infrastructure as code
4. **GKE** → Deploy Kubernetes in the cloud
5. **Monitoring** → Observe your applications
6. **Firebase** → Add authentication

---

## 🎯 Next Steps After Learning

1. **Set up local Kubernetes** (minikube/kind/Docker Desktop)
2. **Deploy a simple app** locally
3. **Create a Helm chart** for your app
4. **Use Terraform** to create GKE cluster
5. **Deploy to GKE** using Helm
6. **Add monitoring** with Prometheus/Grafana
7. **Add authentication** with Firebase

---

## 💡 Pro Tips

- **Start local**: Learn locally before going to cloud
- **Read errors**: Error messages are your best friend
- **Use dry-run**: Test before applying (`--dry-run`, `terraform plan`)
- **Version control**: Commit your configs to git
- **Document**: Comment your code and configs
- **Experiment**: Break things intentionally to learn

---

**Happy Learning!** 🚀

