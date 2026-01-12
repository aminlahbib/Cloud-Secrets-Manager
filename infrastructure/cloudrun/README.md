# Cloud Run Deployment

Deploy the Cloud Secrets Manager application to Google Cloud Run.

## Prerequisites

1. **Google Cloud SDK** installed and authenticated
2. **Docker** installed locally (for building images)
3. **GCP Project** with the following APIs enabled:
   - Cloud Run API
   - Cloud SQL Admin API
   - Secret Manager API
   - Artifact Registry API

## Quick Start

```bash
# Make script executable
chmod +x infrastructure/scripts/deploy-cloudrun.sh

# Deploy everything
./infrastructure/scripts/deploy-cloudrun.sh
```

## Deployment Options

```bash
# Full deployment (build + deploy)
./infrastructure/scripts/deploy-cloudrun.sh

# Skip image build (use existing images)
./infrastructure/scripts/deploy-cloudrun.sh --skip-build

# Redeploy frontend only (after backend URL changes)
./infrastructure/scripts/deploy-cloudrun.sh --frontend-only
```

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloud Run Services                       │
├─────────────────────────────────────────────────────────────┤
│  frontend-xxx.run.app          → React SPA (Nginx)          │
│  secret-service-xxx.run.app    → Main API (Spring Boot)     │
│  audit-service-xxx.run.app     → Audit Logging (Spring Boot)│
│  notification-service-xxx.run.app → Notifications (Spring)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     GCP Services                             │
├─────────────────────────────────────────────────────────────┤
│  Cloud SQL (PostgreSQL)  → Database                         │
│  Secret Manager          → Credentials & API Keys           │
│  Pub/Sub                 → Event messaging                  │
│  Artifact Registry       → Docker images                    │
└─────────────────────────────────────────────────────────────┘
```

## Service Configuration

### Secret Service
- Port: 8080
- Min instances: 0 (scales to zero)
- Max instances: 3
- Memory: 512Mi
- Timeout: 300s

### Audit Service
- Port: 8081
- Min instances: 0
- Max instances: 3
- Memory: 512Mi
- Timeout: 300s

### Notification Service
- Port: 8082
- Min instances: 1 (always on for SSE)
- Max instances: 3
- Memory: 512Mi
- Timeout: 3600s (1 hour for SSE connections)
- CPU throttling: disabled

### Frontend
- Port: 8080
- Min instances: 0
- Max instances: 5
- Memory: 256Mi
- Timeout: 60s

## Environment Variables

The frontend is built with these environment variables baked in:
- `VITE_SECRET_SERVICE_URL` - URL of secret-service
- `VITE_AUDIT_SERVICE_URL` - URL of audit-service
- `VITE_NOTIFICATION_SERVICE_URL` - URL of notification-service
- `VITE_FIREBASE_*` - Firebase configuration
- `VITE_AUDIT_API_KEY` - API key for audit service

## Post-Deployment Steps

1. **Add Firebase Authorized Domains**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Authentication → Settings → Authorized domains
   - Add your frontend Cloud Run domain (e.g., `frontend-xxx-ew.a.run.app`)

2. **Test the Application**
   - Open the frontend URL in your browser
   - Sign in with Google
   - Create a project and secret to verify everything works

3. **Scale Down GKE** (optional, to save costs)
   ```bash
   gcloud container clusters resize cloud-secrets-cluster-dev \
     --node-pool default-pool \
     --num-nodes 0 \
     --region europe-west10
   ```

## Troubleshooting

### View Logs
```bash
# View service logs
gcloud run logs read --service=secret-service --region=europe-west10

# Stream logs in real-time
gcloud run logs tail --service=secret-service --region=europe-west10
```

### Check Service Status
```bash
gcloud run services list --region=europe-west10
```

### Redeploy a Service
```bash
gcloud run deploy secret-service \
  --image=europe-west10-docker.pkg.dev/cloud-secrets-manager/docker-images/secret-service:cloudrun \
  --region=europe-west10
```

## Cost Estimation

| Resource | Estimated Monthly Cost |
|----------|----------------------|
| Cloud Run (low traffic) | $5-20 |
| Cloud SQL | $30 |
| Secret Manager | $1-2 |
| Artifact Registry | $1-5 |
| **Total** | **~$40-60/month** |

*Costs depend on actual usage. Cloud Run scales to zero when not in use.*
