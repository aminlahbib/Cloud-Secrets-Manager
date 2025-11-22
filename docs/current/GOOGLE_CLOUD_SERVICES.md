# Google Cloud Services - Complete Guide 

This guide explains Google Cloud services simply, shows how to use them, and provides step-by-step deployment instructions for your Cloud Secrets Manager project.

---

## **Cloud SQL (PostgreSQL)**

### **What is it? (Like you're 10)**

Imagine you have a **magic filing cabinet** that:
- Lives in the cloud (not on your computer)
- Never gets lost or broken
- Can be accessed from anywhere
- Automatically makes backup copies
- Grows bigger when you need more space

**Cloud SQL = Your database in Google's cloud**

### **What you're using now:**
- **Production**: Cloud SQL (PostgreSQL in Google Cloud) ✅
- **Development**: Local PostgreSQL via Docker Compose (for local dev)

### **How Cloud SQL helps you:**
 **No more local database setup** - Google manages it  
 **Automatic backups** - Never lose your data  
 **Scales automatically** - Handles more users/data  
 **High availability** - Works even if your computer breaks  
 **Security** - Google handles security updates  

### **When to use it:**
- **Production**: Cloud SQL (currently deployed) ✅
- **Local Development**: Local PostgreSQL via Docker Compose
- **Benefit**: One less thing to manage in production!

---

## **Cloud Storage**

### **What is it? (Like you're 10)**

Imagine a **giant toy box in the sky** where you can:
- Put any file (pictures, videos, documents)
- Get it back from anywhere
- Share it with friends
- It never gets full (well, almost never!)

**Cloud Storage = Google's file storage service**

### **What you could store:**
- Service account JSON files (securely)
- Backup files
- Log files
- Configuration files
- Docker images

### **How it helps your project:**
 **Store service account files** - Instead of keeping them on your computer  
 **Backup your secrets database** - Automatic backups  
 **Store audit logs** - Long-term storage  
 **Share files between services** - If you have multiple servers  

### **When to use it:**
- **Now**: Not needed (you're using local files)
- **Later**: Use for production backups and file storage
- **Benefit**: Reliable file storage that scales

---

## **Monitoring (Grafana)**

### **What is it? (Like you're 10)**

Imagine a **magic dashboard** that shows you:
- How many people are using your app (like a counter)
- If something is broken (red lights)
- How fast things are working (speedometer)
- What happened yesterday (history chart)

**Monitoring = Watching your app to make sure it's healthy**

### **What you can monitor:**
- How many API requests per minute
- How fast your app responds
- If your database is working
- If there are any errors
- How many secrets are stored

### **How it helps your project:**
 **Know if something breaks** - Get alerts immediately  
 **See how many users** - Track usage  
 **Find slow parts** - Optimize performance  
 **Track errors** - Fix bugs faster  

### **When to use it:**
- **Now**: Basic monitoring with Spring Boot Actuator (you have this!)
- **Later**: Add Grafana for beautiful dashboards
- **Benefit**: Always know what's happening with your app

---

## **Docker**

### **What is it? (Like you're 10)**

Imagine a **magic box** that contains:
- Your app
- Everything it needs to run
- All the settings
- It works the same way on any computer!

**Docker = Packaging your app so it runs anywhere**

### **What you're using now:**
- Docker Compose (you have `docker-compose.yml`)
- Dockerfiles for building images
- Running services in containers

### **How it helps:**
 **Works on any computer** - Same app, different machines  
 **Easy to share** - Give someone a Docker image  
 **Isolated** - Apps don't interfere with each other  
 **Easy to deploy** - Push to cloud, it just works  

### **You're already using it!**
- Your `docker-compose.yml` runs PostgreSQL, your app, etc.
- This is perfect for development and testing

---

## **Kubernetes (K8s)**

### **What is it? (Like you're 10)**

Imagine you have **many toy boxes (Docker containers)** and you need:
- Someone to organize them
- Make sure they're all working
- Add more when needed
- Fix broken ones automatically
- Share them across many computers

**Kubernetes = The manager that organizes your Docker containers**

### **What you're using now:**
- Kubernetes manifests (you have K8s config files)
- Helm charts (you have Helm setup)
- But probably not running on Google Cloud yet

### **How it helps:**
 **Run many copies** - Handle lots of users  
 **Auto-healing** - Fixes broken containers  
 **Auto-scaling** - Adds more when busy  
 **Load balancing** - Spreads work evenly  

### **When to use it:**
- **Now**: You have the config files ready!
- **Later**: Deploy to Google Kubernetes Engine (GKE)
- **Benefit**: Professional, scalable deployment

---

## **Helm**

### **What is it? (Like you're 10)**

Imagine you have a **recipe book** that tells you:
- How to set up your app
- What settings to use
- How to connect everything together
- You can use the same recipe many times!

**Helm = Package manager for Kubernetes (like a recipe book)**

### **What you're using now:**
- Helm charts (you have Helm templates)
- Can deploy your app with one command

### **How it helps:**
 **Easy deployment** - One command to deploy everything  
 **Reusable** - Use same setup for dev/staging/prod  
 **Version control** - Track changes to your deployment  
 **Easy updates** - Update with one command  

### **You're already using it!**
- Your Helm charts are ready to deploy
- Just need to connect to Google Kubernetes Engine

---

## **How These Work Together**

### **Your Project - Local Development:**
```
Your Computer
 Docker Compose
    PostgreSQL (local database)
    Your App (secret-service)
    Audit Service
 Files on your computer
```

### **Your Project - Production (Current):**
```
Google Cloud
 Cloud SQL (PostgreSQL in cloud) ✅
 Kubernetes (GKE) ✅
    Your App (running in containers) ✅
    Auto-scaling, load balancing ✅
 External Secrets Operator ✅
 Google Secret Manager ✅
```

### **Future Enhancements:**
```
 Cloud Storage (backups, files)
 Monitoring (Grafana dashboards)
 Ingress (external access)
```

---

## **What Should You Do Now?**

### ** Currently Using (Production):**
- **Cloud SQL** ✅ - PostgreSQL in Google Cloud (deployed)
- **Google Kubernetes Engine (GKE)** ✅ - Running your applications
- **External Secrets Operator** ✅ - Managing secrets from Google Secret Manager
- **Helm Charts** ✅ - Deploying and managing applications

### ** Keep Using (Local Development):**
- **Docker Compose** - Perfect for local development
- **Local PostgreSQL** - Fast and easy for testing
- **Your local setup** - It works great for development!

### ** Consider Adding (Future Enhancements):**
1. **Cloud Storage** - For backups and files
   - Store service account files securely
   - Backup your database
   - Store audit logs long-term

2. **Monitoring (Grafana)** - To watch your app
   - Beautiful dashboards
   - Alerts when something breaks
   - Track usage and performance

3. **Ingress** - For external access
   - Expose services to the internet
   - SSL/TLS certificates
   - Load balancing

---

## **Simple Comparison**

| Service | What It's Like | When to Use |
|---------|---------------|-------------|
| **Cloud SQL** | Magic filing cabinet in the sky | Production (replace local DB) |
| **Cloud Storage** | Giant toy box in the cloud | Store files, backups |
| **Monitoring** | Magic dashboard showing everything | Always (know what's happening) |
| **Docker** | Magic box with your app |  Already using! |
| **Kubernetes** | Manager for many boxes | Production (when you need scale) |
| **Helm** | Recipe book for deployment |  Already using! |

---

## **Current Status**

### **Phase 1: Development** ✅
- Docker Compose for local development
- Local PostgreSQL for testing
- Works great for development

### **Phase 2: Production** ✅ **COMPLETE**
- Deployed to Google Kubernetes Engine (GKE) ✅
- Using Cloud SQL for database ✅
- External Secrets Operator managing secrets ✅
- Helm charts deployed ✅

### **Phase 3: Enhancements** (Future)
- Add monitoring with Grafana
- Use Cloud Storage for backups
- Configure Ingress for external access
- Set up CI/CD pipeline

---

## **Quick Links**

- **Cloud SQL**: https://console.cloud.google.com/sql
- **Cloud Storage**: https://console.cloud.google.com/storage
- **Kubernetes Engine**: https://console.cloud.google.com/kubernetes
- **Monitoring**: https://console.cloud.google.com/monitoring

---

## **Summary**

**You're already doing great!** You have:
- Docker setup
- Kubernetes configs
- Helm charts

**For now:** Keep developing locally with Docker Compose.

**Later:** When you're ready for production, Google Cloud services will make your life easier:
- Cloud SQL = Better database
- Kubernetes = Professional deployment
- Monitoring = Know what's happening
- Cloud Storage = Reliable file storage

**Think of it like:** You're building a toy car. Right now you're testing it in your room (local). Later, you'll race it on a professional track (Google Cloud) with all the fancy equipment (monitoring, backups, etc.)!

---

## **Deployment Guide: Using Google Cloud Services**

This section provides step-by-step instructions for deploying your Cloud Secrets Manager to Google Cloud Platform using Cloud SQL, GKE, Cloud Storage, and Monitoring.

---

## **Prerequisites**

Before you start, make sure you have:

- Google Cloud account with billing enabled
- Google Cloud project created (`cloud-secrets-manager`)
- `gcloud` CLI installed and configured
- `kubectl` installed
- `helm` installed
- Docker installed (for building images)

---

## **Step 1: Set Up Cloud SQL (PostgreSQL)**

### **1.1 Create Cloud SQL Instance**

**Via Google Cloud Console:**

1. Go to: **https://console.cloud.google.com/sql**
2. Click **"Create Instance"**
3. Select **"PostgreSQL"**
4. Choose **"Enterprise Plus"** or **"Enterprise"** edition
5. Fill in:
   - **Instance ID**: `secrets-db`
   - **Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you (e.g., `us-central1`)
   - **Database version**: PostgreSQL 16
   - **Machine type**: `db-f1-micro` (for testing) or `db-n1-standard-1` (for production)
6. Click **"Create"**
7. Wait 5-10 minutes for instance to be created

**Via gcloud CLI:**
```bash
gcloud sql instances create secrets-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_STRONG_PASSWORD
```

### **1.2 Create Databases**

1. Go to your Cloud SQL instance
2. Click **"Databases"** tab
3. Click **"Create Database"**
4. Create two databases:
   - `secrets` (for secret-service)
   - `audit` (for audit-service)

**Via gcloud CLI:**
```bash
gcloud sql databases create secrets --instance=secrets-db
gcloud sql databases create audit --instance=secrets-db
```

### **1.3 Create Database Users**

1. Go to **"Users"** tab in Cloud SQL instance
2. Click **"Add User Account"**
3. Create users:
   - `secret_user` with password
   - `audit_user` with password

**Via gcloud CLI:**
```bash
gcloud sql users create secret_user \
  --instance=secrets-db \
  --password=SECRET_USER_PASSWORD

gcloud sql users create audit_user \
  --instance=secrets-db \
  --password=AUDIT_USER_PASSWORD
```

### **1.4 Get Connection Name**

1. Go to your Cloud SQL instance
2. Copy the **"Connection name"** (looks like: `cloud-secrets-manager:us-central1:secrets-db`)
3. Save it - you'll need it for Kubernetes!

---

## **Step 2: Set Up Google Kubernetes Engine (GKE)**

### **2.1 Enable Required APIs**

```bash
gcloud services enable container.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

### **2.2 Create GKE Cluster**

**Via Google Cloud Console:**

1. Go to: **https://console.cloud.google.com/kubernetes**
2. Click **"Create Cluster"**
3. Choose **"GKE Standard"**
4. Fill in:
   - **Name**: `secrets-manager-cluster`
   - **Location type**: Zonal (or Regional for high availability)
   - **Zone/Region**: Same as Cloud SQL (e.g., `us-central1-a`)
   - **Machine type**: `e2-medium` (2 vCPU, 4 GB RAM)
   - **Number of nodes**: 3 (for production, 1 for testing)
5. Click **"Create"**
6. Wait 5-10 minutes

**Via gcloud CLI:**
```bash
gcloud container clusters create secrets-manager-cluster \
  --zone=us-central1-a \
  --num-nodes=3 \
  --machine-type=e2-medium \
  --enable-autorepair \
  --enable-autoupgrade
```

### **2.3 Connect to Cluster**

```bash
gcloud container clusters get-credentials secrets-manager-cluster \
  --zone=us-central1-a
```

Verify connection:
```bash
kubectl get nodes
```

You should see your cluster nodes!

---

## **Step 3: Configure Cloud SQL Proxy**

### **3.1 Enable Cloud SQL Admin API**

```bash
gcloud services enable sqladmin.googleapis.com
```

### **3.2 Create Service Account for Cloud SQL**

```bash
gcloud iam service-accounts create cloud-sql-proxy \
  --display-name="Cloud SQL Proxy Service Account"

gcloud projects add-iam-policy-binding cloud-secrets-manager \
  --member="serviceAccount:cloud-sql-proxy@cloud-secrets-manager.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### **3.3 Create Kubernetes Secret for Service Account**

1. Download service account key:
```bash
gcloud iam service-accounts keys create cloud-sql-proxy-key.json \
  --iam-account=cloud-sql-proxy@cloud-secrets-manager.iam.gserviceaccount.com
```

2. Create Kubernetes secret:
```bash
kubectl create secret generic cloud-sql-proxy-credentials \
  --from-file=credentials.json=cloud-sql-proxy-key.json
```

---

## **Step 4: Build and Push Docker Images**

### **4.1 Configure Docker for Google Container Registry**

```bash
gcloud auth configure-docker
```

### **4.2 Build Docker Images**

```bash
# Build secret-service
cd secret-service
docker build -t gcr.io/cloud-secrets-manager/secret-service:latest .

# Build audit-service
cd ../audit-service
docker build -t gcr.io/cloud-secrets-manager/audit-service:latest .
```

### **4.3 Push to Google Container Registry**

```bash
# Push secret-service
docker push gcr.io/cloud-secrets-manager/secret-service:latest

# Push audit-service
docker push gcr.io/cloud-secrets-manager/audit-service:latest
```

---

## **Step 5: Update Kubernetes Configurations**

### **5.1 Update Deployment Files**

You need to update your Kubernetes deployments to:
- Use Cloud SQL instead of local PostgreSQL
- Use Cloud SQL Proxy sidecar
- Update image references to GCR

**Example: Update `infrastructure/kubernetes/k8s/secret-service-deployment.yaml`:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: secret-service
spec:
  replicas: 2
  template:
    spec:
      containers:
      # Your app container
      - name: secret-service
        image: gcr.io/cloud-secrets-manager/secret-service:latest
        env:
        - name: SPRING_DATASOURCE_URL
          value: "jdbc:postgresql://127.0.0.1:5432/secrets"
        - name: SPRING_DATASOURCE_USERNAME
          value: "secret_user"
        - name: SPRING_DATASOURCE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: secret-db-password
        # ... other env vars
        
      # Cloud SQL Proxy sidecar
      - name: cloud-sql-proxy
        image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.0.0
        args:
        - "--address=0.0.0.0"
        - "--port=5432"
        - "cloud-secrets-manager:us-central1:secrets-db"
        securityContext:
          runAsNonRoot: true
        volumeMounts:
        - name: cloud-sql-proxy-credentials
          mountPath: /secrets/cloudsql
          readOnly: true
      volumes:
      - name: cloud-sql-proxy-credentials
        secret:
          secretName: cloud-sql-proxy-credentials
```

### **5.2 Create Kubernetes Secrets**

```bash
# Create secret for database passwords
kubectl create secret generic db-secrets \
  --from-literal=secret-db-password=YOUR_SECRET_DB_PASSWORD \
  --from-literal=audit-db-password=YOUR_AUDIT_DB_PASSWORD

# Create secret for JWT and encryption keys
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=YOUR_JWT_SECRET \
  --from-literal=encryption-key=YOUR_ENCRYPTION_KEY

# Create secret for Google Identity Platform
kubectl create secret generic google-identity \
  --from-file=service-account.json=path/to/service-account.json
```

---

## **Step 6: Deploy with Helm**

### **6.1 Update Helm Values**

Edit `infrastructure/helm/cloud-secrets-manager/values.yaml`:

```yaml
image:
  repositorySecretService: "gcr.io/cloud-secrets-manager/secret-service"
  repositoryAuditService: "gcr.io/cloud-secrets-manager/audit-service"
  tag: "latest"

# Use Cloud SQL instead of local PostgreSQL
postgres:
  enabled: false  # Disable local PostgreSQL

cloudSql:
  enabled: true
  instance: "cloud-secrets-manager:us-central1:secrets-db"
  secretsDb:
    name: "secrets"
    user: "secret_user"
  auditDb:
    name: "audit"
    user: "audit_user"
```

### **6.2 Deploy with Helm**

```bash
# Install the Helm chart
helm install secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  --namespace secrets-manager \
  --create-namespace

# Or upgrade if already installed
helm upgrade secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  --namespace secrets-manager
```

### **6.3 Verify Deployment**

```bash
# Check pods
kubectl get pods -n secrets-manager

# Check services
kubectl get svc -n secrets-manager

# Check logs
kubectl logs -f deployment/secret-service -n secrets-manager
```

---

## **Step 7: Set Up Cloud Storage**

### **7.1 Create Storage Bucket**

**Via Google Cloud Console:**

1. Go to: **https://console.cloud.google.com/storage**
2. Click **"Create Bucket"**
3. Fill in:
   - **Name**: `cloud-secrets-manager-backups` (must be globally unique)
   - **Location type**: Region
   - **Region**: Same as your Cloud SQL instance
   - **Storage class**: Standard
   - **Access control**: Uniform
4. Click **"Create"**

**Via gcloud CLI:**
```bash
gsutil mb -l us-central1 gs://cloud-secrets-manager-backups
```

### **7.2 Use Cloud Storage for Backups**

You can use Cloud Storage to:
- Store database backups
- Store service account files
- Store audit logs

**Example: Backup Cloud SQL to Cloud Storage**

```bash
# Create a backup
gcloud sql backups create \
  --instance=secrets-db \
  --description="Daily backup"

# Export database to Cloud Storage
gcloud sql export sql secrets-db \
  gs://cloud-secrets-manager-backups/backup-$(date +%Y%m%d).sql \
  --database=secrets
```

---

## **Step 8: Set Up Monitoring**

### **8.1 Enable Monitoring API**

```bash
gcloud services enable monitoring.googleapis.com
```

### **8.2 View Metrics in Console**

1. Go to: **https://console.cloud.google.com/monitoring**
2. You'll see:
   - **Metrics Explorer** - Create custom charts
   - **Dashboards** - Create dashboards
   - **Alerting** - Set up alerts

### **8.3 Create Custom Dashboard**

1. Go to **Monitoring**  **Dashboards**
2. Click **"Create Dashboard"**
3. Add charts for:
   - API request rate
   - Response times
   - Error rates
   - Database connections
   - Memory/CPU usage

### **8.4 Set Up Alerts**

1. Go to **Monitoring**  **Alerting**
2. Click **"Create Policy"**
3. Create alerts for:
   - High error rate
   - Slow response times
   - Database connection failures
   - High memory usage

---

## **Step 9: Configure Ingress (External Access)**

### **9.1 Set Up Ingress Controller**

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

### **9.2 Create Ingress Resource**

Update `infrastructure/kubernetes/k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: secrets-manager-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - secrets.yourdomain.com
    secretName: secrets-manager-tls
  rules:
  - host: secrets.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: secret-service
            port:
              number: 8080
```

### **9.3 Apply Ingress**

```bash
kubectl apply -f infrastructure/kubernetes/k8s/ingress.yaml -n secrets-manager
```

---

## **Step 10: Verify Everything Works**

### **10.1 Check Pods**

```bash
kubectl get pods -n secrets-manager
```

All pods should be `Running`.

### **10.2 Check Services**

```bash
kubectl get svc -n secrets-manager
```

### **10.3 Test API**

```bash
# Get external IP
kubectl get ingress -n secrets-manager

# Test health endpoint
curl http://YOUR_EXTERNAL_IP/actuator/health
```

### **10.4 Check Logs**

```bash
# Secret service logs
kubectl logs -f deployment/secret-service -n secrets-manager

# Audit service logs
kubectl logs -f deployment/audit-service -n secrets-manager
```

---

## **Step 11: Set Up Continuous Deployment (Optional)**

### **11.1 Create Cloud Build Configuration**

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build secret-service
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/secret-service:$SHORT_SHA', './secret-service']
  
  # Build audit-service
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/audit-service:$SHORT_SHA', './audit-service']
  
  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/secret-service:$SHORT_SHA']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/audit-service:$SHORT_SHA']
  
  # Deploy to GKE
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - 'run'
      - '--filename=./k8s'
      - '--location=us-central1-a'
      - '--cluster=secrets-manager-cluster'
```

### **11.2 Trigger on Git Push**

1. Go to **Cloud Build**  **Triggers**
2. Click **"Create Trigger"**
3. Connect your GitHub repository
4. Set trigger to run on push to `main` branch
5. Select `cloudbuild.yaml` as config file

---

## **Deployment Checklist**

Use this checklist to ensure everything is set up:

- [ ] Cloud SQL instance created
- [ ] Databases created (`secrets`, `audit`)
- [ ] Database users created
- [ ] GKE cluster created
- [ ] Connected to cluster with `kubectl`
- [ ] Cloud SQL Proxy service account created
- [ ] Docker images built and pushed to GCR
- [ ] Kubernetes secrets created
- [ ] Helm chart updated with Cloud SQL config
- [ ] Deployed with Helm
- [ ] Pods are running
- [ ] Services are accessible
- [ ] Ingress configured (if needed)
- [ ] Monitoring dashboard created
- [ ] Alerts configured
- [ ] Cloud Storage bucket created
- [ ] Backup strategy configured

---

## **Troubleshooting**

### **Issue: Pods not starting**

```bash
# Check pod status
kubectl describe pod <pod-name> -n secrets-manager

# Check logs
kubectl logs <pod-name> -n secrets-manager
```

### **Issue: Can't connect to Cloud SQL**

1. Verify Cloud SQL Proxy is running:
```bash
kubectl logs <pod-name> -c cloud-sql-proxy -n secrets-manager
```

2. Check service account permissions:
```bash
gcloud projects get-iam-policy cloud-secrets-manager
```

### **Issue: Images not found**

1. Verify images are pushed:
```bash
gcloud container images list --repository=gcr.io/cloud-secrets-manager
```

2. Check image pull secrets:
```bash
kubectl get secrets -n secrets-manager
```

---

## **Cost Estimation**

### **Development/Testing:**
- Cloud SQL (db-f1-micro): ~$7/month
- GKE (3 nodes, e2-medium): ~$50/month
- Cloud Storage: ~$0.02/GB/month
- **Total: ~$60/month**

### **Production:**
- Cloud SQL (db-n1-standard-1): ~$50/month
- GKE (3 nodes, e2-standard-2): ~$150/month
- Cloud Storage: ~$0.02/GB/month
- **Total: ~$200/month**

**Note:** Google Cloud offers free tier credits for new accounts!

---

## **Next Steps After Deployment**

1. Set up monitoring dashboards
2. Configure alerts
3. Set up automated backups
4. Configure SSL/TLS certificates
5. Set up CI/CD pipeline
6. Configure auto-scaling
7. Set up disaster recovery

---

## **Useful Commands**

```bash
# View all resources
kubectl get all -n secrets-manager

# Scale deployment
kubectl scale deployment secret-service --replicas=3 -n secrets-manager

# Update deployment
kubectl set image deployment/secret-service \
  secret-service=gcr.io/cloud-secrets-manager/secret-service:new-tag \
  -n secrets-manager

# View logs
kubectl logs -f deployment/secret-service -n secrets-manager

# Execute command in pod
kubectl exec -it <pod-name> -n secrets-manager -- /bin/bash

# Port forward for local testing
kubectl port-forward svc/secret-service 8080:8080 -n secrets-manager
```

---

**Last Updated:** November 21, 2025

