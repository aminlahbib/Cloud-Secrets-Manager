# Deployment Setup Guide

**Step-by-step guide to prepare your environment for deployment**

---

## Prerequisites

- [ ] Google Cloud SDK installed and authenticated
- [ ] Firebase project created
- [ ] Docker and Docker Compose installed (for local testing)

---

## Step 1: Generate and Create Secrets

### Option A: Automated Script (Recommended)

```bash
cd infrastructure/scripts
./setup-secrets.sh
```

This script will:
1. Generate secure random secrets (JWT, AES key, Audit API key)
2. Create them in GCP Secret Manager
3. Grant permissions to service accounts

### Option B: Manual Setup

#### 1.1 Generate Secrets Locally

```bash
# JWT Secret (min 32 chars)
JWT_SECRET=$(openssl rand -hex 32)
echo "JWT_SECRET=${JWT_SECRET}"

# AES Encryption Key (exactly 32 chars)
ENCRYPTION_KEY=$(openssl rand -base64 24 | head -c 32)
echo "ENCRYPTION_KEY=${ENCRYPTION_KEY}"

# Audit API Key
AUDIT_API_KEY=$(openssl rand -hex 32)
echo "AUDIT_API_KEY=${AUDIT_API_KEY}"
```

**Save these values!** You'll need them for `.env.local` and GCP Secret Manager.

#### 1.2 Create GCP Secrets

```bash
# Set your project
gcloud config set project cloud-secrets-manager

# Create secrets
echo -n "${JWT_SECRET}" | gcloud secrets create csm-jwt-secret --data-file=- --replication-policy="automatic"
echo -n "${ENCRYPTION_KEY}" | gcloud secrets create csm-aes-key --data-file=- --replication-policy="automatic"
echo -n "${AUDIT_API_KEY}" | gcloud secrets create csm-audit-api-key --data-file=- --replication-policy="automatic"
```

#### 1.3 Create Firebase Secrets

Get these from **Firebase Console > Project Settings > General**:

```bash
# Firebase API Key
echo -n "YOUR_FIREBASE_API_KEY" | gcloud secrets create csm-firebase-api-key --data-file=- --replication-policy="automatic"

# Firebase App ID
echo -n "YOUR_FIREBASE_APP_ID" | gcloud secrets create csm-firebase-app-id --data-file=- --replication-policy="automatic"

# Firebase Messaging Sender ID
echo -n "YOUR_MESSAGING_SENDER_ID" | gcloud secrets create csm-firebase-messaging-sender-id --data-file=- --replication-policy="automatic"

# Firebase Admin Key (JSON file)
gcloud secrets create csm-firebase-admin-key \
  --data-file=infrastructure/gcp/keys/firebase-admin-key.json \
  --replication-policy="automatic"
```

#### 1.4 Grant Service Account Permissions

```bash
PROJECT_ID="cloud-secrets-manager"

# List of secrets
SECRETS=(
  "csm-jwt-secret"
  "csm-aes-key"
  "csm-audit-api-key"
  "csm-firebase-admin-key"
  "csm-firebase-api-key"
  "csm-firebase-app-id"
  "csm-firebase-messaging-sender-id"
  "csm-sendgrid-api-key"
)

# Service accounts
SERVICE_ACCOUNTS=(
  "secret-service-dev@${PROJECT_ID}.iam.gserviceaccount.com"
  "audit-service-dev@${PROJECT_ID}.iam.gserviceaccount.com"
  "notification-service-dev@${PROJECT_ID}.iam.gserviceaccount.com"
)

# Grant permissions
for sa in "${SERVICE_ACCOUNTS[@]}"; do
  for secret in "${SECRETS[@]}"; do
    gcloud secrets add-iam-policy-binding "${secret}" \
      --member="serviceAccount:${sa}" \
      --role="roles/secretmanager.secretAccessor" \
      --project=${PROJECT_ID} || echo "Secret ${secret} not found, skipping..."
  done
done
```

---

## Step 2: Set Up Local Development Environment

### 2.1 Create `.env.local` File

```bash
cd docker
cp env.example .env.local
```

### 2.2 Fill in Required Values

Edit `docker/.env.local` and add:

```bash
# REQUIRED - Generated secrets
JWT_SECRET=<paste from Step 1.1>
ENCRYPTION_KEY=<paste from Step 1.1>

# REQUIRED - Firebase Configuration
# Get from Firebase Console > Project Settings > General
GOOGLE_PROJECT_ID=cloud-secrets-manager
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_AUTH_DOMAIN=cloud-secrets-manager.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=cloud-secrets-manager
VITE_FIREBASE_STORAGE_BUCKET=cloud-secrets-manager.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>

# OPTIONAL - For Pub/Sub (local dev can skip)
GCP_PROJECT_ID=cloud-secrets-manager
```

### 2.3 Verify Firebase Service Account Key

Ensure `infrastructure/gcp/keys/firebase-admin-key.json` exists:

1. Go to **Firebase Console > Project Settings > Service Accounts**
2. Click **Generate new private key**
3. Save as `infrastructure/gcp/keys/firebase-admin-key.json`

---

## Step 3: Test Local Setup

### 3.1 Start Services

```bash
cd docker
docker compose up --build
```

### 3.2 Verify Services

```bash
# Check all services are healthy
curl http://localhost:8080/actuator/health  # Secret Service
curl http://localhost:8081/actuator/health  # Audit Service
curl http://localhost:8082/actuator/health  # Notification Service

# Open frontend
open http://localhost:3000
```

### 3.3 Test Authentication

1. Open http://localhost:3000
2. Try Google Sign-In
3. Verify you can create a project and add secrets

---

## Step 4: Verify Cloud Run Setup

### 4.1 Check Service Accounts Exist

```bash
gcloud iam service-accounts list --project=cloud-secrets-manager | grep -E "secret-service|audit-service|notification-service"
```

If missing, they should be created by Terraform. Check:
```bash
cd infrastructure/terraform/environments/dev
terraform apply
```

### 4.2 Verify Secrets Exist

```bash
gcloud secrets list --project=cloud-secrets-manager | grep csm-
```

You should see:
- ✅ csm-jwt-secret
- ✅ csm-aes-key
- ✅ csm-audit-api-key
- ✅ csm-firebase-api-key
- ✅ csm-firebase-app-id
- ✅ csm-firebase-messaging-sender-id
- ✅ csm-firebase-admin-key

### 4.3 Test Secret Access

```bash
# Test that service account can access secrets
gcloud secrets versions access latest --secret=csm-jwt-secret \
  --project=cloud-secrets-manager
```

---

## Step 5: Deploy to Cloud Run

Once all secrets are in place:

```bash
cd infrastructure/scripts
./deploy-cloudrun.sh
```

The script will:
1. Load secrets from Secret Manager
2. Build Docker images
3. Deploy to Cloud Run
4. Configure environment variables and secrets

---

## Troubleshooting

### Issue: "Missing secret: csm-xxx"

**Solution:** Create the missing secret:
```bash
echo -n "value" | gcloud secrets create csm-xxx --data-file=- --replication-policy="automatic"
```

### Issue: "Permission denied on secret"

**Solution:** Grant Secret Manager access:
```bash
gcloud secrets add-iam-policy-binding csm-xxx \
  --member="serviceAccount:service-name-dev@cloud-secrets-manager.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Issue: Services fail to start with empty secrets

**Solution:** This is expected! The security fix removed default values. Ensure:
1. All secrets are created in GCP Secret Manager
2. Service accounts have `secretmanager.secretAccessor` role
3. Secrets are correctly referenced in deployment script

### Issue: Firebase authentication fails

**Solution:**
1. Verify Firebase authorized domains include your Cloud Run URL
2. Check `csm-firebase-admin-key` secret contains valid JSON
3. Verify `GOOGLE_PROJECT_ID` matches Firebase project ID

---

## Checklist

Before deploying to production:

- [ ] All secrets created in GCP Secret Manager
- [ ] Service accounts have Secret Manager permissions
- [ ] Local `.env.local` configured and tested
- [ ] Firebase service account key downloaded
- [ ] Firebase authorized domains configured
- [ ] Local Docker Compose stack runs successfully
- [ ] Can authenticate via Firebase
- [ ] Can create projects and secrets
- [ ] Cloud Run deployment script updated with correct project ID

---

## Next Steps

After completing this setup:

1. **Deploy to Cloud Run**: `./infrastructure/scripts/deploy-cloudrun.sh`
2. **Add Cloud Run URL to Firebase**: Authorized domains in Firebase Console
3. **Test Production Deployment**: Verify all services are healthy
4. **Monitor**: Check Cloud Run logs and metrics

See [Deployment Operations Guide](./DEPLOYMENT_OPERATIONS_GUIDE.md) for ongoing operations.
