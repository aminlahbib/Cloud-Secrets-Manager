# Google Artifact Registry Setup Guide 

**Simple, step-by-step guide for first-time users**

---

## What is Google Artifact Registry?

Think of Artifact Registry like a **secure warehouse** for your Docker images:

- **Docker Hub** = Public warehouse (anyone can see public images)
- **Artifact Registry** = Private warehouse in Google Cloud (only you can access)

**Why use it?**
- Secure and private
- Works perfectly with Google Cloud services
- Fast when deploying to Google Kubernetes Engine
- Part of your Google Cloud project

---

## What We'll Do (Overview)

1. **Enable Artifact Registry API** (tell Google Cloud you want to use it)
2. **Create a Repository** (like creating a folder for your images)
3. **Set up Authentication** (so your computer can push/pull images)
4. **Build and Push Images** (put your Docker images in the warehouse)
5. **Update Helm Configuration** (tell Kubernetes where to find images)
6. **Deploy** (Kubernetes pulls images from Artifact Registry)

---

## Prerequisites

Before we start, make sure you have:

- Google Cloud account
- Google Cloud project created (we'll use `cloud-secrets-manager`)
- Docker installed and running
- Basic understanding of what Docker images are

---

## Step 1: Enable Artifact Registry API

**What we're doing:** Telling Google Cloud that you want to use Artifact Registry.

### Via Google Cloud Console (Web Interface) - EASIEST

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Make sure you're in the correct project (top bar, select `cloud-secrets-manager`)
3. Go to **"APIs & Services"**  **"Library"**
4. Search for **"Artifact Registry API"**
5. Click on it
6. Click **"Enable"** button
7. Wait for it to enable (takes 10-30 seconds)

**Direct link:** https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com

### Via Command Line (if gcloud is installed)

```bash
gcloud services enable artifactregistry.googleapis.com
```

---

## Step 2: Create a Repository

**What we're doing:** Creating a "folder" where your Docker images will be stored.

### Via Google Cloud Console (Web Interface) - EASIEST

1. Go to [Artifact Registry](https://console.cloud.google.com/artifacts)
2. Click **"Create Repository"** button
3. Fill in the form:
   - **Name:** `docker-images` (or any name you like)
   - **Format:** Select **"Docker"**
   - **Mode:** Select **"Standard"** (recommended)
   - **Region:** Choose a region close to you (e.g., `us-central1`, `europe-west1`)
     - **Tip:** Remember this region - you'll need it later!
   - **Description:** (optional) "Docker images for Cloud Secrets Manager"
4. Click **"Create"**
5. Wait for repository creation (takes a few seconds)

**What you'll see:** A repository URL like:
```
us-central1-docker.pkg.dev/cloud-secrets-manager/docker-images
```

**Save this URL!** You'll need it later.

### Via Command Line (if gcloud is installed)

```bash
# Replace REGION with your chosen region (e.g., us-central1)
gcloud artifacts repositories create docker-images \
    --repository-format=docker \
    --location=REGION \
    --description="Docker images for Cloud Secrets Manager"
```

---

## Step 3: Set Up Authentication

**What we're doing:** Giving your computer permission to push/pull images from Artifact Registry.

### Option A: Using Application Default Credentials (Easiest for Local Development)

This uses your Google account credentials.

1. Install Google Cloud SDK (if not already installed):
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. Authenticate:
   ```bash
   gcloud auth login
   ```
   - This opens your browser
   - Log in with your Google account
   - Grant permissions

3. Set your project:
   ```bash
   gcloud config set project cloud-secrets-manager
   ```

4. Configure Docker to use gcloud for authentication:
   ```bash
   gcloud auth configure-docker REGION-docker.pkg.dev
   ```
   - Replace `REGION` with your repository region (e.g., `us-central1`)
   - Example: `gcloud auth configure-docker us-central1-docker.pkg.dev`

**What this does:** Tells Docker to use your Google account when pushing/pulling images.

### Option B: Using Service Account (For Production/CI/CD)

This is more secure for production environments.

1. Create a service account:
   ```bash
   gcloud iam service-accounts create artifact-registry-sa \
       --display-name="Artifact Registry Service Account"
   ```

2. Grant permissions:
   ```bash
   gcloud artifacts repositories add-iam-policy-binding docker-images \
       --location=REGION \
       --member="serviceAccount:artifact-registry-sa@cloud-secrets-manager.iam.gserviceaccount.com" \
       --role="roles/artifactregistry.writer"
   ```

3. Create and download key:
   ```bash
   gcloud iam service-accounts keys create ~/artifact-registry-key.json \
       --iam-account=artifact-registry-sa@cloud-secrets-manager.iam.gserviceaccount.com
   ```

4. Authenticate Docker:
   ```bash
   cat ~/artifact-registry-key.json | docker login -u _json_key --password-stdin REGION-docker.pkg.dev
   ```

---

## Step 4: Build and Push Docker Images

**What we're doing:** Building your Docker images and uploading them to Artifact Registry.

### Build the Images

```bash
# Navigate to project root
cd "/Users/amine/Developer/CSM-Project/Cloud Secrets Manager"

# Build secret-service
docker build -t secret-service:latest ./apps/backend/secret-service

# Build audit-service
docker build -t audit-service:latest ./apps/backend/audit-service
```

### Tag Images for Artifact Registry

**Format:** `REGION-docker.pkg.dev/PROJECT-ID/REPOSITORY-NAME/IMAGE-NAME:TAG`

**Example:**
```bash
# Current configuration (europe-west10)
REGION="europe-west10"
PROJECT_ID="cloud-secrets-manager"
REPOSITORY="docker-images"

# Tag secret-service
docker tag secret-service:latest \
    ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/secret-service:latest

# Tag audit-service
docker tag audit-service:latest \
    ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/audit-service:latest
```

### Push Images to Artifact Registry

```bash
# Push secret-service
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/secret-service:latest

# Push audit-service
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/audit-service:latest
```

**What you'll see:** Progress bars showing upload progress. This may take a few minutes.

**Verify:** Go to [Artifact Registry](https://console.cloud.google.com/artifacts) and you should see your images!

---

## Step 5: Update Helm Configuration

**What we're doing:** Telling Helm/Kubernetes where to find your Docker images.

### Update `infrastructure/helm/cloud-secrets-manager/values.yaml`

Change the image repository paths:

```yaml
image:
  repositorySecretService: "REGION-docker.pkg.dev/PROJECT-ID/REPOSITORY/secret-service"
  repositoryAuditService: "REGION-docker.pkg.dev/PROJECT-ID/REPOSITORY/audit-service"
  tag: "latest"
  pullPolicy: IfNotPresent
```

**Example (Current Configuration):**
```yaml
image:
  repositorySecretService: "europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service"
  repositoryAuditService: "europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service"
  tag: "latest"
  pullPolicy: IfNotPresent
```

---

## Step 6: Configure Kubernetes to Pull from Artifact Registry

**What we're doing:** Giving Kubernetes permission to pull images from Artifact Registry.

### Option A: Using Workload Identity (GKE - Recommended)

If you're using Google Kubernetes Engine, use Workload Identity.

### Option B: Using Service Account Key (Local/Docker Desktop)

1. Create a service account with read permissions:
   ```bash
   gcloud iam service-accounts create k8s-image-puller \
       --display-name="Kubernetes Image Puller"
   
   gcloud artifacts repositories add-iam-policy-binding docker-images \
       --location=REGION \
       --member="serviceAccount:k8s-image-puller@cloud-secrets-manager.iam.gserviceaccount.com" \
       --role="roles/artifactregistry.reader"
   ```

2. Create and download key:
   ```bash
   gcloud iam service-accounts keys create ~/k8s-image-puller-key.json \
       --iam-account=k8s-image-puller@cloud-secrets-manager.iam.gserviceaccount.com
   ```

3. Create Kubernetes secret:
   ```bash
   kubectl create secret docker-registry artifact-registry-secret \
       --docker-server=REGION-docker.pkg.dev \
       --docker-username=_json_key \
       --docker-password="$(cat ~/k8s-image-puller-key.json)" \
       --docker-email=k8s-image-puller@cloud-secrets-manager.iam.gserviceaccount.com \
       --namespace=secrets-manager
   ```

4. Update Helm values to use the secret:
   ```yaml
   imagePullSecrets:
     - name: artifact-registry-secret
   ```

---

## Step 7: Deploy with Helm

**What we're doing:** Deploying your application to Kubernetes, which will pull images from Artifact Registry.

```bash
helm upgrade --install cloud-secrets-manager \
    ./infrastructure/helm/cloud-secrets-manager \
    --namespace=secrets-manager \
    --create-namespace
```

**Verify deployment:**
```bash
kubectl get pods --namespace=secrets-manager
```

You should see your pods running!

---

## Success!

If everything worked, you should have:
- Images stored in Artifact Registry
- Kubernetes pulling images from Artifact Registry
- Your application running in Kubernetes

---

## Completed Setup (Current Configuration)

**Repository Details:**
- **Region:** `europe-west10`
- **Project:** `cloud-secrets-manager`
- **Repository:** `docker-images`
- **Full URL:** `europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images`

**Images Deployed:**
- `secret-service:latest`
- `audit-service:latest`

**Kubernetes Configuration:**
- **Namespace:** `secrets-manager`
- **Service Account:** `k8s-image-puller@cloud-secrets-manager.iam.gserviceaccount.com`
- **Image Pull Secret:** `artifact-registry-secret`

---

## Common Configuration Fixes

### Fix 1: Health Check Endpoints

If health checks fail, ensure `SecurityConfig.java` allows actuator endpoints:

```java
.requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
```

The `/**` is important to allow `/liveness` and `/readiness` sub-paths.

### Fix 2: AES Encryption Key

The AES key must be exactly 32 bytes (32 hex characters). Generate it with:

```bash
openssl rand -hex 16  # Generates exactly 32 hex characters
```

### Fix 3: Database Schema

For fresh deployments, set `SPRING_JPA_HIBERNATE_DDL_AUTO=update` in Helm values to allow automatic schema creation.

### Fix 4: Google Service Account Secret

Ensure the `google-service-account` secret exists:

```bash
kubectl create secret generic google-service-account \
    --from-file=service-account.json=apps/backend/secret-service/src/main/resources/service-account.json \
    --namespace=secrets-manager
```

---

## Troubleshooting

### "Permission denied" when pushing images
- Make sure you ran `gcloud auth configure-docker REGION-docker.pkg.dev`
- Try: `gcloud auth login` again

### "ImagePullBackOff" in Kubernetes
- Check that the image path in Helm values is correct
- Verify Kubernetes has permission to pull (service account secret)
- Check: `kubectl describe pod POD-NAME --namespace=secrets-manager`

### "Repository not found"
- Double-check the repository name and region
- Make sure you're in the correct Google Cloud project

---

## Additional Resources

- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [Docker Authentication](https://cloud.google.com/artifact-registry/docs/docker/authentication)
- [Kubernetes Image Pull Secrets](https://kubernetes.io/docs/concepts/containers/images/#specifying-imagepullsecrets-on-a-pod)

---

## Quick Reference

**Repository URL Format:**
```
REGION-docker.pkg.dev/PROJECT-ID/REPOSITORY-NAME/IMAGE-NAME:TAG
```

**Common Commands:**
```bash
# List repositories
gcloud artifacts repositories list

# List images in a repository
gcloud artifacts docker images list REGION-docker.pkg.dev/PROJECT-ID/REPOSITORY-NAME

# Delete an image
gcloud artifacts docker images delete REGION-docker.pkg.dev/PROJECT-ID/REPOSITORY-NAME/IMAGE-NAME:TAG
```

---

**Need help?** Check the troubleshooting section or review the steps above!

