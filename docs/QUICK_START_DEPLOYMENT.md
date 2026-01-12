# Quick Start: Deployment Setup

**5-minute setup guide for deploying Cloud Secrets Manager**

---

## 🚀 Quick Setup (Automated)

```bash
# 1. Run the setup script
cd infrastructure/scripts
./setup-secrets.sh

# 2. Follow the prompts to create GCP secrets

# 3. Set up local environment
cd ../../docker
cp env.example .env.local
# Edit .env.local with your Firebase config

# 4. Deploy!
cd ../../infrastructure/scripts
./deploy-cloudrun.sh
```

---

## 📋 Manual Setup (If Script Fails)

### 1. Generate Secrets

```bash
# Save these values!
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -base64 24 | head -c 32)
AUDIT_API_KEY=$(openssl rand -hex 32)

echo "JWT_SECRET=${JWT_SECRET}"
echo "ENCRYPTION_KEY=${ENCRYPTION_KEY}"
echo "AUDIT_API_KEY=${AUDIT_API_KEY}"
```

### 2. Create GCP Secrets

```bash
gcloud config set project cloud-secrets-manager

# Core secrets
echo -n "${JWT_SECRET}" | gcloud secrets create csm-jwt-secret --data-file=- --replication-policy="automatic"
echo -n "${ENCRYPTION_KEY}" | gcloud secrets create csm-aes-key --data-file=- --replication-policy="automatic"
echo -n "${AUDIT_API_KEY}" | gcloud secrets create csm-audit-api-key --data-file=- --replication-policy="automatic"

# Firebase secrets (get from Firebase Console)
echo -n "YOUR_API_KEY" | gcloud secrets create csm-firebase-api-key --data-file=- --replication-policy="automatic"
echo -n "YOUR_APP_ID" | gcloud secrets create csm-firebase-app-id --data-file=- --replication-policy="automatic"
echo -n "YOUR_SENDER_ID" | gcloud secrets create csm-firebase-messaging-sender-id --data-file=- --replication-policy="automatic"
gcloud secrets create csm-firebase-admin-key --data-file=infrastructure/gcp/keys/firebase-admin-key.json --replication-policy="automatic"
```

### 3. Grant Permissions

```bash
PROJECT="cloud-secrets-manager"
SECRETS=("csm-jwt-secret" "csm-aes-key" "csm-audit-api-key" "csm-firebase-admin-key" "csm-firebase-api-key" "csm-firebase-app-id" "csm-firebase-messaging-sender-id")
SERVICES=("secret-service-dev" "audit-service-dev" "notification-service-dev")

for service in "${SERVICES[@]}"; do
  for secret in "${SECRETS[@]}"; do
    gcloud secrets add-iam-policy-binding "${secret}" \
      --member="serviceAccount:${service}@${PROJECT}.iam.gserviceaccount.com" \
      --role="roles/secretmanager.secretAccessor" || true
  done
done
```

### 4. Create `.env.local`

```bash
cd docker
cp env.example .env.local
# Edit .env.local and add:
# - JWT_SECRET (from step 1)
# - ENCRYPTION_KEY (from step 1)
# - Firebase config (from Firebase Console)
```

---

## ✅ Verification

```bash
# Check secrets exist
gcloud secrets list | grep csm-

# Test local setup
cd docker && docker compose up -d
curl http://localhost:8080/actuator/health

# Deploy to Cloud Run
cd ../../infrastructure/scripts && ./deploy-cloudrun.sh
```

---

## 🔗 Where to Get Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `cloud-secrets-manager`
3. Click ⚙️ **Project Settings**
4. Scroll to **Your apps** section
5. Copy values from the config object

---

## 📚 Full Documentation

- [Deployment Setup Guide](./DEPLOYMENT_SETUP_GUIDE.md) - Detailed step-by-step
- [Deployment Operations Guide](./DEPLOYMENT_OPERATIONS_GUIDE.md) - Day-to-day operations
- [Security & Performance Fixes](./SECURITY_PERFORMANCE_FIXES.md) - What was fixed
