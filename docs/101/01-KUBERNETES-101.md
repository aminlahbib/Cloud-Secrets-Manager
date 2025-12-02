# Kubernetes 101: From Zero to Production

## Table of Contents
1. [What is Kubernetes?](#what-is-kubernetes)
2. [Local vs Cloud Kubernetes](#local-vs-cloud-kubernetes)
3. [Core Concepts](#core-concepts)
4. [Setting Up Local Kubernetes](#setting-up-local-kubernetes)
5. [Your First Deployment](#your-first-deployment)
6. [Hands-on Exercises](#hands-on-exercises)
7. [Moving to Cloud (GKE)](#moving-to-cloud-gke)
8. [Troubleshooting](#troubleshooting)

---

## What is Kubernetes?

**Kubernetes (K8s)** is an open-source container orchestration platform that automates:
- **Deployment**: Rolling out new versions of your apps
- **Scaling**: Adding/removing instances based on demand
- **Management**: Keeping your apps running and healthy
- **Networking**: Connecting services together
- **Storage**: Managing persistent data

### Why Kubernetes?

**Without Kubernetes:**
```
You: "I need to run 3 instances of my app"
You: *Manually starts 3 Docker containers*
You: "One crashed, let me restart it"
You: "I need to update the app, let me stop all 3, update, restart"
You: "Traffic increased, I need more instances"
You: *Manually starts 3 more containers*
```

**With Kubernetes:**
```
You: "I want 3 instances running"
Kubernetes: "Done. I'll keep them running."
You: "One crashed"
Kubernetes: "I already restarted it."
You: "Update to version 2.0"
Kubernetes: "Rolling update complete, zero downtime."
You: "Scale to 6 instances"
Kubernetes: "Done. Traffic distributed automatically."
```

---

## Local vs Cloud Kubernetes

### Local Kubernetes

**Options:**
1. **minikube** - Single-node cluster, great for learning
2. **kind** (Kubernetes in Docker) - Lightweight, fast
3. **Docker Desktop** - Built-in Kubernetes (easiest on Mac/Windows)
4. **k3s/k3d** - Lightweight, production-like

**When to use:**
- ✅ Learning and experimentation
- ✅ Development and testing
- ✅ No cloud costs
- ✅ Fast iteration
- ✅ Offline development

**Limitations:**
- ❌ Not production-ready
- ❌ Limited resources (your machine's RAM/CPU)
- ❌ No high availability
- ❌ No cloud integrations (load balancers, managed databases)

### Cloud Kubernetes (GKE, EKS, AKS)

**Google Kubernetes Engine (GKE):**
- ✅ Production-ready
- ✅ Auto-scaling
- ✅ Managed control plane
- ✅ Cloud integrations (Cloud SQL, Secret Manager, etc.)
- ✅ High availability
- ✅ Load balancers
- ✅ Persistent storage

**When to use:**
- ✅ Production deployments
- ✅ High availability requirements
- ✅ Need cloud services integration
- ✅ Auto-scaling based on traffic
- ✅ Multi-region deployments

**Costs:**
- Control plane: ~$70/month (always running)
- Nodes: Pay per VM instance
- Storage: Pay per GB

---

## Core Concepts

### 1. Cluster
A **cluster** is a set of machines (nodes) running Kubernetes.

```
┌─────────────────────────────────────┐
│         Kubernetes Cluster          │
│                                     │
│  ┌──────────┐      ┌──────────┐    │
│  │  Master  │      │  Master  │    │
│  │ (Control │      │ (Control │    │
│  │  Plane)  │      │  Plane)  │    │
│  └──────────┘      └──────────┘    │
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │ Node │  │ Node │  │ Node │     │
│  │  1   │  │  2   │  │  3   │     │
│  └──────┘  └──────┘  └──────┘     │
└─────────────────────────────────────┘
```

### 2. Node
A **node** is a machine (VM or physical) that runs your containers.

- **Master/Control Plane**: Manages the cluster
- **Worker Nodes**: Run your applications

### 3. Pod
A **pod** is the smallest deployable unit. It contains one or more containers.

```yaml
Pod
├── Container 1 (your app)
├── Container 2 (sidecar, e.g., logging)
└── Shared storage & network
```

**Key points:**
- Pods are ephemeral (can be created/destroyed)
- Each pod gets its own IP address
- Containers in a pod share storage and network

### 4. Deployment
A **Deployment** manages a set of identical pods.

```yaml
Deployment: "my-app"
├── Pod 1 (my-app)
├── Pod 2 (my-app)
└── Pod 3 (my-app)
```

**Features:**
- Maintains desired number of replicas
- Rolling updates (zero downtime)
- Rollback capability
- Self-healing (restarts failed pods)

### 5. Service
A **Service** provides a stable network endpoint for pods.

```
Service: "my-app-service"
    ↓
    ├── Pod 1 (IP: 10.0.1.5)
    ├── Pod 2 (IP: 10.0.1.6)
    └── Pod 3 (IP: 10.0.1.7)
```

**Types:**
- **ClusterIP**: Internal access only
- **NodePort**: Expose on each node's IP
- **LoadBalancer**: Cloud load balancer (GKE)
- **Ingress**: HTTP/HTTPS routing

### 6. Namespace
A **namespace** is a virtual cluster within a cluster.

```
Cluster
├── default (namespace)
├── kube-system (namespace)
├── production (namespace)
└── development (namespace)
```

**Use cases:**
- Separate environments (dev, staging, prod)
- Team isolation
- Resource quotas

---

## Setting Up Local Kubernetes

### Option 1: Docker Desktop (Easiest - Recommended for Mac/Windows)

1. **Install Docker Desktop**
   ```bash
   # Download from: https://www.docker.com/products/docker-desktop
   ```

2. **Enable Kubernetes**
   - Open Docker Desktop
   - Go to Settings → Kubernetes
   - Check "Enable Kubernetes"
   - Click "Apply & Restart"

3. **Verify Installation**
   ```bash
   kubectl version --client
   kubectl cluster-info
   kubectl get nodes
   ```

### Option 2: minikube (Cross-platform)

1. **Install minikube**
   ```bash
   # macOS
   brew install minikube
   
   # Linux
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   ```

2. **Start minikube**
   ```bash
   minikube start
   minikube status
   ```

3. **Verify**
   ```bash
   kubectl get nodes
   ```

### Option 3: kind (Kubernetes in Docker)

1. **Install kind**
   ```bash
   # macOS
   brew install kind
   
   # Linux
   curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
   chmod +x ./kind
   sudo mv ./kind /usr/local/bin/kind
   ```

2. **Create cluster**
   ```bash
   kind create cluster --name learning
   kubectl cluster-info --context kind-learning
   ```

### Install kubectl (Kubernetes CLI)

```bash
# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Verify
kubectl version --client
```

---

## Your First Deployment

Let's deploy a simple web application!

### Step 1: Create a Deployment

Create `hello-kubernetes.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-kubernetes
  labels:
    app: hello-kubernetes
spec:
  replicas: 3  # Run 3 instances
  selector:
    matchLabels:
      app: hello-kubernetes
  template:
    metadata:
      labels:
        app: hello-kubernetes
    spec:
      containers:
      - name: hello
        image: paulbouwer/hello-kubernetes:1.10
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
```

### Step 2: Apply the Deployment

```bash
kubectl apply -f hello-kubernetes.yaml
```

### Step 3: Check Status

```bash
# See deployments
kubectl get deployments

# See pods
kubectl get pods

# See pod details
kubectl describe pod <pod-name>

# See pod logs
kubectl logs <pod-name>
```

### Step 4: Create a Service

Create `hello-service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: hello-kubernetes-service
spec:
  type: NodePort  # Expose on node IP
  selector:
    app: hello-kubernetes
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080  # Access on <node-ip>:30080
```

Apply it:
```bash
kubectl apply -f hello-service.yaml
kubectl get services
```

### Step 5: Access Your App

**Docker Desktop:**
```bash
# Get service URL
kubectl get service hello-kubernetes-service
# Access at: http://localhost:30080
```

**minikube:**
```bash
minikube service hello-kubernetes-service
```

**kind:**
```bash
# Port forward
kubectl port-forward service/hello-kubernetes-service 8080:80
# Access at: http://localhost:8080
```

---

## Hands-on Exercises

### Exercise 1: Scale Your Deployment

```bash
# Scale to 5 replicas
kubectl scale deployment hello-kubernetes --replicas=5

# Watch pods being created
kubectl get pods -w

# Scale back down
kubectl scale deployment hello-kubernetes --replicas=2
```

### Exercise 2: Update Your App

```bash
# Update the image
kubectl set image deployment/hello-kubernetes \
  hello=paulbouwer/hello-kubernetes:1.11

# Watch the rolling update
kubectl rollout status deployment/hello-kubernetes

# Check rollout history
kubectl rollout history deployment/hello-kubernetes

# Rollback if needed
kubectl rollout undo deployment/hello-kubernetes
```

### Exercise 3: Debug a Pod

```bash
# Get pod status
kubectl get pods

# Describe pod (see events, status)
kubectl describe pod <pod-name>

# View logs
kubectl logs <pod-name>

# Follow logs
kubectl logs -f <pod-name>

# Execute command in pod
kubectl exec -it <pod-name> -- /bin/sh
```

### Exercise 4: Create a Namespace

```bash
# Create namespace
kubectl create namespace development

# Deploy to namespace
kubectl apply -f hello-kubernetes.yaml -n development

# List pods in namespace
kubectl get pods -n development

# Switch default namespace
kubectl config set-context --current --namespace=development
```

### Exercise 5: Resource Limits

Update your deployment to include resource limits:

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "500m"
```

Apply and test:
```bash
kubectl apply -f hello-kubernetes.yaml
kubectl top pods  # See resource usage
```

---

## Moving to Cloud (GKE)

Once you're comfortable with local Kubernetes, you're ready for GKE!

### Key Differences

| Feature | Local | GKE |
|---------|-------|-----|
| Control Plane | On your machine | Managed by Google |
| Nodes | Your machine | GCP VMs |
| Load Balancer | NodePort/Port-forward | Cloud Load Balancer |
| Storage | Local volumes | Persistent Disks |
| Networking | Basic | VPC, Cloud NAT, etc. |
| Cost | Free | ~$70/month + nodes |

### GKE-Specific Features

1. **Node Pools**: Groups of nodes with same configuration
2. **Autoscaling**: Automatically add/remove nodes
3. **Workload Identity**: Secure access to GCP services
4. **Ingress**: Google Cloud Load Balancer integration
5. **Persistent Disks**: Managed storage

### Migration Checklist

- [ ] Understand local Kubernetes concepts
- [ ] Can deploy and manage apps locally
- [ ] Understand Services and Deployments
- [ ] Can debug pod issues
- [ ] Ready to learn GKE-specific features

**Next:** See [GKE 101](./04-GKE-101.md) for cloud deployment!

---

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods

# Describe pod for events
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Common issues:
# - Image pull errors → Check image name/tag
# - Resource limits → Check node resources
# - CrashLoopBackOff → Check application logs
```

### Service Not Accessible

```bash
# Check service
kubectl get svc

# Check endpoints (pods behind service)
kubectl get endpoints

# Test service from inside cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -O- http://hello-kubernetes-service:80
```

### Resource Issues

```bash
# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods

# Describe node
kubectl describe node <node-name>
```

### Common Commands Cheat Sheet

```bash
# Get resources
kubectl get pods,svc,deployments

# Describe resource
kubectl describe <resource> <name>

# View logs
kubectl logs <pod-name> -f

# Execute command
kubectl exec -it <pod-name> -- <command>

# Port forward
kubectl port-forward <pod-name> <local-port>:<pod-port>

# Delete resource
kubectl delete <resource> <name>

# Apply YAML
kubectl apply -f <file.yaml>

# Edit resource
kubectl edit <resource> <name>
```

---

## Next Steps

1. ✅ Complete all exercises above
2. ✅ Deploy a multi-container application
3. ✅ Set up ConfigMaps and Secrets
4. ✅ Learn about Ingress
5. ✅ Move to [Helm 101](./02-HELM-101.md)

---

## Additional Resources

- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [Kubernetes Tutorials](https://kubernetes.io/docs/tutorials/)
- [Play with Kubernetes](https://labs.play-with-k8s.com/) - Free online playground
- [Kubernetes by Example](http://kubernetesbyexample.com/)

---

**Congratulations!** You now understand Kubernetes fundamentals. Time to learn [Helm](./02-HELM-101.md) to manage complex deployments!

