# Google Identity Platform Deployment Setup Guide 

Complete step-by-step guide for setting up Google Identity Platform in Kubernetes and Helm deployments.

---

## Prerequisites

Before starting, ensure you have:
- Google Cloud Project with Identity Platform enabled
- Service Account JSON file downloaded
- Kubernetes cluster access (`kubectl` configured)
- Helm installed (for Helm deployment)

---

## Step 1: Locate Your Service Account JSON File

Your service account JSON file should be located at:
- **Local development**: `apps/backend/secret-service/src/main/resources/service-account.json`
- **For deployment**: You need to download it from Google Cloud Console

### If you don't have the service account file:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin**  **Service Accounts**
3. Find or create a service account for your project
4. Click on the service account  **Keys** tab
5. Click **Add Key**  **Create new key**  **JSON**
6. Download the JSON file

** Security Note**: Keep this file secure! Never commit it to Git.

---

## Step 2: Update Kubernetes Secrets

### Option A: Using kubectl (Recommended for Production)

This is the **secure way** - the JSON file never appears in your YAML files.

#### 2.1. Create the Service Account Secret

```bash
# Create the secret from your service account JSON file
kubectl create secret generic csm-google-service-account \
  --from-file=service-account.json=/path/to/your/service-account.json \
  --namespace=cloud-secrets-manager

# Or if you're using a specific namespace:
kubectl create secret generic csm-google-service-account \
  --from-file=service-account.json=/path/to/your/service-account.json \
  --namespace=your-namespace
```

**Example:**
```bash
kubectl create secret generic csm-google-service-account \
  --from-file=service-account.json=./apps/backend/secret-service/src/main/resources/service-account.json \
  --namespace=cloud-secrets-manager
```

#### 2.2. Update Other Secrets

Update `infrastructure/kubernetes/k8s/k8s-secrets.yaml` with your actual values:

```bash
# Edit the file
nano infrastructure/kubernetes/k8s/k8s-secrets.yaml
# or
code infrastructure/kubernetes/k8s/k8s-secrets.yaml
```

Update these values:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: csm-app-config
type: Opaque
stringData:
  JWT_SECRET: your-actual-jwt-secret-key-here  # Change this!
  AES_KEY: YourActual32ByteKeyForAES256Enc!@#  # Must be exactly 32 bytes
  GOOGLE_PROJECT_ID: your-actual-project-id    # e.g., "cloud-secrets-manager"
  GOOGLE_API_KEY: ""  # Optional, leave empty if not using
```

**Important:**
- `JWT_SECRET`: Use a strong, random secret (at least 32 characters)
- `AES_KEY`: Must be exactly 32 bytes (32 characters)
- `GOOGLE_PROJECT_ID`: Your actual Google Cloud project ID

#### 2.3. Apply the Secrets

```bash
# Apply all secrets into the dedicated namespace
kubectl apply -n cloud-secrets-manager -f infrastructure/kubernetes/k8s/k8s-secrets.yaml

# Verify the secrets were created
kubectl get secrets -n cloud-secrets-manager
```

You should see:
- `csm-app-config`
- `csm-db-secrets`
- `csm-google-service-account` (if created via kubectl)

---

### Option B: Embedding in k8s-secrets.yaml (For Development Only)

 **Warning**: Only use this for development/testing. Never commit real secrets to Git!

#### 2.1. Get Your Service Account JSON Content

```bash
# View the JSON file
cat apps/backend/secret-service/src/main/resources/service-account.json
```

#### 2.2. Update infrastructure/kubernetes/k8s/k8s-secrets.yaml

Replace the placeholder in `infrastructure/kubernetes/k8s/k8s-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: csm-google-service-account
type: Opaque
stringData:
  service-account.json: |
    {
      "type": "service_account",
      "project_id": "your-actual-project-id",
      "private_key_id": "your-actual-key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\nYourActualPrivateKey\n-----END PRIVATE KEY-----\n",
      "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
      "client_id": "your-client-id",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
    }
```

**Important**: 
- Replace all placeholder values with your actual service account data
- Keep the JSON structure intact
- The `private_key` should include `\n` for newlines

#### 2.3. Apply the Secrets

```bash
kubectl apply -f infrastructure/kubernetes/k8s/k8s-secrets.yaml
```

---

## Step 3: Update Helm Values

### 3.1. Edit values.yaml

```bash
# Edit the Helm values file
nano infrastructure/helm/cloud-secrets-manager/values.yaml
# or
code infrastructure/helm/cloud-secrets-manager/values.yaml
```

### 3.2. Update Google Identity Platform Configuration

Find the `googleIdentity` section and update:

```yaml
# Google Cloud Identity Platform Configuration
googleIdentity:
  enabled: true
  projectId: "your-actual-project-id"  # Change this!
  apiKey: ""  # Optional: Add your API key if needed
  serviceAccount:
    # Service account JSON should be provided as a Kubernetes secret
    # Create secret: kubectl create secret generic csm-google-service-account --from-file=service-account.json=/path/to/service-account.json
    secretName: "csm-google-service-account"
    key: "service-account.json"
  setupEnabled: false  # Keep false for production
```

**Update these values:**
- `projectId`: Your actual Google Cloud project ID (e.g., `"cloud-secrets-manager"`)
- `apiKey`: Your Google API key (optional, leave empty if not using)
- `setupEnabled`: Set to `false` for production, `true` only for initial setup

### 3.3. Update Other Values (Optional)

While you're in `values.yaml`, you might want to update:

```yaml
jwtSecret: "your-actual-jwt-secret-key-here"  # Change this!
aesKey: "YourActual32ByteKeyForAES256Enc!"    # Must be exactly 32 bytes

image:
  repositorySecretService: "europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service"
  repositoryAuditService: "europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/audit-service"
  tag: "latest"
  pullPolicy: IfNotPresent
```

---

## Step 4: Create Service Account Secret for Helm

If using Helm, create the service account secret the same way:

```bash
# Create the secret
kubectl create secret generic csm-google-service-account \
  --from-file=service-account.json=/path/to/your/service-account.json \
  --namespace=cloud-secrets-manager

# Verify
kubectl get secret csm-google-service-account -n cloud-secrets-manager
```

---

## Step 5: Deploy

### For Kubernetes (Direct):

```bash
# Apply all configurations
kubectl apply -f infrastructure/kubernetes/k8s/

# Verify deployments
kubectl get deployments
kubectl get pods
kubectl get services
```

### For Helm:

```bash
# Install/upgrade the Helm chart
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  --namespace=default \
  --create-namespace

# Or with custom values file
helm upgrade --install cloud-secrets-manager \
  ./infrastructure/helm/cloud-secrets-manager \
  -f infrastructure/helm/cloud-secrets-manager/values.yaml \
  --namespace=default \
  --create-namespace

# Verify
helm list
kubectl get pods
```

---

## Step 6: Verify Deployment

### 6.1. Check Pods

```bash
# Check if pods are running
kubectl get pods

# Check pod logs
kubectl logs -l app=secret-service
```

### 6.2. Check Environment Variables

```bash
# Get pod name
POD_NAME=$(kubectl get pods -l app=secret-service -o jsonpath='{.items[0].metadata.name}')

# Check environment variables
kubectl exec $POD_NAME -- env | grep GOOGLE

# You should see:
# GOOGLE_IDENTITY_ENABLED=true
# GOOGLE_PROJECT_ID=your-project-id
# GOOGLE_SERVICE_ACCOUNT_PATH=/app/service-account.json
```

### 6.3. Check Service Account File

```bash
# Verify service account file is mounted
kubectl exec $POD_NAME -- ls -la /app/service-account.json

# Check file content (first few lines)
kubectl exec $POD_NAME -- head -5 /app/service-account.json
```

### 6.4. Test Authentication

```bash
# Port forward to test locally
kubectl port-forward svc/secret-service 8080:8080

# In another terminal, test the health endpoint
curl http://localhost:8080/actuator/health

# Test authentication (you'll need a Google ID token)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}'
```

---

## Security Best Practices

### DO:
- Use `kubectl create secret` for production (Option A)
- Store secrets in Kubernetes Secrets, not in YAML files
- Use different secrets for different environments
- Rotate secrets regularly
- Set `SETUP_ENABLED=false` in production
- Use strong, random values for `JWT_SECRET` and `AES_KEY`

### DON'T:
- Commit service account JSON files to Git
- Commit real secrets to version control
- Use the same secrets across environments
- Leave `SETUP_ENABLED=true` in production
- Share service account keys publicly

---

## Troubleshooting

### Issue: Pod fails to start

**Check logs:**
```bash
kubectl logs -l app=secret-service
```

**Common causes:**
- Service account file not found  Check secret exists: `kubectl get secret csm-google-service-account -n cloud-secrets-manager`
- Invalid service account JSON  Verify JSON format
- Missing environment variables  Check deployment YAML

### Issue: Authentication fails

**Check:**
1. Service account has correct permissions in Google Cloud
2. Google Identity Platform API is enabled
3. Service account JSON is valid
4. Project ID matches your Google Cloud project

### Issue: Secret not found

**Create the secret:**
```bash
kubectl create secret generic csm-google-service-account \
  --from-file=service-account.json=/path/to/service-account.json \
  --namespace=cloud-secrets-manager
```

**Verify:**
```bash
kubectl get secret csm-google-service-account -n cloud-secrets-manager
kubectl describe secret csm-google-service-account -n cloud-secrets-manager
```

---

## Quick Reference

### Create Service Account Secret
```bash
kubectl create secret generic csm-google-service-account \
  --from-file=service-account.json=/path/to/service-account.json \
  --namespace=cloud-secrets-manager
```

### Update Kubernetes Secrets
```bash
kubectl apply -n cloud-secrets-manager -f infrastructure/kubernetes/k8s/k8s-secrets.yaml
```

### Deploy with Helm
```bash
helm upgrade --install cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager \
  --namespace cloud-secrets-manager --create-namespace
```

### Check Deployment
```bash
kubectl get pods -n cloud-secrets-manager
kubectl logs -l app.kubernetes.io/name=secret-service -n cloud-secrets-manager
```

---

## Next Steps

After deployment:
1. Verify all pods are running
2. Test authentication endpoint
3. Create your first admin user via setup endpoint
4. Disable setup endpoint (`SETUP_ENABLED=false`)
5. Test secret CRUD operations
6. Monitor logs for any errors

---

**Need Help?** Check the [Google Identity Setup Guide](../current/GOOGLE_IDENTITY_SETUP.md) for more details.

