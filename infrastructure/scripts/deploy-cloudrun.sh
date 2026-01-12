#!/bin/bash
# =============================================================================
# Cloud Run Deployment Script
# =============================================================================
# Deploys all Cloud Secrets Manager services to Google Cloud Run
# Usage: ./deploy-cloudrun.sh [--skip-build] [--frontend-only]
# =============================================================================

set -euo pipefail

# Configuration
PROJECT_ID="cloud-secrets-manager"
REGION="europe-west10"
CLOUD_SQL_INSTANCE="secrets-manager-db-dev-3631da18"
CLOUD_SQL_CONNECTION="${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}"
IMAGE_REGISTRY="europe-west10-docker.pkg.dev/${PROJECT_ID}/docker-images"
IMAGE_TAG="cloudrun"

# Firebase configuration - loaded from Secret Manager
# These secrets must exist in GCP Secret Manager before running this script
# Create them with: gcloud secrets create <secret-name> --data-file=- <<< "value"
load_secrets() {
  log_info "Loading secrets from Secret Manager..."
  
  FIREBASE_API_KEY=$(gcloud secrets versions access latest --secret=csm-firebase-api-key --project=${PROJECT_ID} 2>/dev/null) || \
    log_error "Missing secret: csm-firebase-api-key. Create it with: gcloud secrets create csm-firebase-api-key --data-file=- <<< 'your-api-key'"
  
  FIREBASE_AUTH_DOMAIN="${PROJECT_ID}.firebaseapp.com"
  FIREBASE_PROJECT_ID="${PROJECT_ID}"
  FIREBASE_STORAGE_BUCKET="${PROJECT_ID}.firebasestorage.app"
  
  FIREBASE_MESSAGING_SENDER_ID=$(gcloud secrets versions access latest --secret=csm-firebase-messaging-sender-id --project=${PROJECT_ID} 2>/dev/null) || \
    log_error "Missing secret: csm-firebase-messaging-sender-id"
  
  FIREBASE_APP_ID=$(gcloud secrets versions access latest --secret=csm-firebase-app-id --project=${PROJECT_ID} 2>/dev/null) || \
    log_error "Missing secret: csm-firebase-app-id"
  
  AUDIT_API_KEY=$(gcloud secrets versions access latest --secret=csm-audit-api-key --project=${PROJECT_ID} 2>/dev/null) || \
    log_error "Missing secret: csm-audit-api-key"
  
  log_info "Secrets loaded successfully"
}

# Parse arguments
SKIP_BUILD=false
FRONTEND_ONLY=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-build) SKIP_BUILD=true; shift ;;
    --frontend-only) FRONTEND_ONLY=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# =============================================================================
# Step 1: Build Docker Images
# =============================================================================
build_images() {
  if [ "$SKIP_BUILD" = true ]; then
    log_info "Skipping image build (--skip-build)"
    return
  fi

  log_info "Building Docker images..."
  
  cd "$(dirname "$0")/../.."
  
  if [ "$FRONTEND_ONLY" = false ]; then
    # Build backend services
    log_info "Building secret-service..."
    docker build -t ${IMAGE_REGISTRY}/secret-service:${IMAGE_TAG} \
      -f apps/backend/secret-service/Dockerfile .
    
    log_info "Building audit-service..."
    docker build -t ${IMAGE_REGISTRY}/audit-service:${IMAGE_TAG} \
      -f apps/backend/audit-service/Dockerfile .
    
    log_info "Building notification-service..."
    docker build -t ${IMAGE_REGISTRY}/notification-service:${IMAGE_TAG} \
      -f apps/backend/notification-service/Dockerfile .
  fi
  
  # Frontend will be built after we get backend URLs
  log_info "Backend images built successfully"
}

# =============================================================================
# Step 2: Push Backend Images
# =============================================================================
push_backend_images() {
  if [ "$SKIP_BUILD" = true ] || [ "$FRONTEND_ONLY" = true ]; then
    return
  fi

  log_info "Pushing backend images to Artifact Registry..."
  
  docker push ${IMAGE_REGISTRY}/secret-service:${IMAGE_TAG}
  docker push ${IMAGE_REGISTRY}/audit-service:${IMAGE_TAG}
  docker push ${IMAGE_REGISTRY}/notification-service:${IMAGE_TAG}
  
  log_info "Backend images pushed successfully"
}

# =============================================================================
# Step 3: Deploy Backend Services to Cloud Run
# =============================================================================
deploy_backend_services() {
  if [ "$FRONTEND_ONLY" = true ]; then
    log_info "Skipping backend deployment (--frontend-only)"
    return
  fi

  log_info "Deploying backend services to Cloud Run..."
  
  # Deploy Secret Service
  log_info "Deploying secret-service..."
  gcloud run deploy secret-service \
    --image=${IMAGE_REGISTRY}/secret-service:${IMAGE_TAG} \
    --region=${REGION} \
    --platform=managed \
    --allow-unauthenticated \
    --add-cloudsql-instances=${CLOUD_SQL_CONNECTION} \
    --service-account=secret-service-dev@${PROJECT_ID}.iam.gserviceaccount.com \
    --set-env-vars="SPRING_PROFILES_ACTIVE=prod,cloudrun" \
    --set-env-vars="SPRING_DATASOURCE_URL=jdbc:postgresql:///secrets?cloudSqlInstance=${CLOUD_SQL_CONNECTION}&socketFactory=com.google.cloud.sql.postgres.SocketFactory" \
    --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID}" \
    --set-env-vars="SPRING_JPA_HIBERNATE_DDL_AUTO=update" \
    --set-secrets="SPRING_DATASOURCE_USERNAME=secrets-manager-db-dev-secrets-user:latest" \
    --set-secrets="SPRING_DATASOURCE_PASSWORD=secrets-manager-db-dev-secrets-password:latest" \
    --set-secrets="JWT_SECRET=csm-jwt-secret:latest" \
    --set-secrets="AES_KEY=csm-aes-key:latest" \
    --set-secrets="/secrets/firebase/firebase-admin-key.json=csm-firebase-admin-key:latest" \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --timeout=300 \
    --concurrency=80 \
    --project=${PROJECT_ID}

  # Deploy Audit Service
  log_info "Deploying audit-service..."
  gcloud run deploy audit-service \
    --image=${IMAGE_REGISTRY}/audit-service:${IMAGE_TAG} \
    --region=${REGION} \
    --platform=managed \
    --allow-unauthenticated \
    --add-cloudsql-instances=${CLOUD_SQL_CONNECTION} \
    --service-account=audit-service-dev@${PROJECT_ID}.iam.gserviceaccount.com \
    --set-env-vars="SPRING_PROFILES_ACTIVE=prod,cloudrun" \
    --set-env-vars="SPRING_DATASOURCE_URL=jdbc:postgresql:///audit?cloudSqlInstance=${CLOUD_SQL_CONNECTION}&socketFactory=com.google.cloud.sql.postgres.SocketFactory" \
    --set-env-vars="SPRING_JPA_HIBERNATE_DDL_AUTO=update" \
    --set-secrets="SPRING_DATASOURCE_USERNAME=secrets-manager-db-dev-audit-user:latest" \
    --set-secrets="SPRING_DATASOURCE_PASSWORD=secrets-manager-db-dev-audit-password:latest" \
    --set-secrets="AUDIT_SERVICE_API_KEY=csm-audit-api-key:latest" \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=3 \
    --timeout=300 \
    --concurrency=80 \
    --port=8081 \
    --project=${PROJECT_ID}

  # Deploy Notification Service
  log_info "Deploying notification-service..."
  gcloud run deploy notification-service \
    --image=${IMAGE_REGISTRY}/notification-service:${IMAGE_TAG} \
    --region=${REGION} \
    --platform=managed \
    --allow-unauthenticated \
    --add-cloudsql-instances=${CLOUD_SQL_CONNECTION} \
    --service-account=notification-service-dev@${PROJECT_ID}.iam.gserviceaccount.com \
    --set-env-vars="SPRING_PROFILES_ACTIVE=prod,cloudrun" \
    --set-env-vars="SPRING_DATASOURCE_URL=jdbc:postgresql:///secrets?cloudSqlInstance=${CLOUD_SQL_CONNECTION}&socketFactory=com.google.cloud.sql.postgres.SocketFactory" \
    --set-env-vars="GCP_PROJECT_ID=${PROJECT_ID}" \
    --set-env-vars="PUBSUB_SUBSCRIPTION=notifications-events-sub" \
    --set-env-vars="EMAIL_ENABLED=false" \
    --set-env-vars="SPRING_JPA_HIBERNATE_DDL_AUTO=update" \
    --set-secrets="SPRING_DATASOURCE_USERNAME=secrets-manager-db-dev-secrets-user:latest" \
    --set-secrets="SPRING_DATASOURCE_PASSWORD=secrets-manager-db-dev-secrets-password:latest" \
    --set-secrets="JWT_SECRET=csm-jwt-secret:latest" \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=1 \
    --max-instances=3 \
    --timeout=3600 \
    --concurrency=100 \
    --no-cpu-throttling \
    --port=8082 \
    --project=${PROJECT_ID}

  log_info "Backend services deployed successfully"
}

# =============================================================================
# Step 4: Get Backend Service URLs
# =============================================================================
get_service_urls() {
  log_info "Retrieving service URLs..."
  
  SECRET_SERVICE_URL=$(gcloud run services describe secret-service \
    --region=${REGION} --project=${PROJECT_ID} \
    --format='value(status.url)' 2>/dev/null || echo "")
  
  AUDIT_SERVICE_URL=$(gcloud run services describe audit-service \
    --region=${REGION} --project=${PROJECT_ID} \
    --format='value(status.url)' 2>/dev/null || echo "")
  
  NOTIFICATION_SERVICE_URL=$(gcloud run services describe notification-service \
    --region=${REGION} --project=${PROJECT_ID} \
    --format='value(status.url)' 2>/dev/null || echo "")

  if [ -z "$SECRET_SERVICE_URL" ]; then
    log_error "Failed to get secret-service URL. Deploy backend first."
  fi

  log_info "Service URLs:"
  echo "  secret-service:       ${SECRET_SERVICE_URL}"
  echo "  audit-service:        ${AUDIT_SERVICE_URL}"
  echo "  notification-service: ${NOTIFICATION_SERVICE_URL}"
}

# =============================================================================
# Step 5: Build and Deploy Frontend
# =============================================================================
deploy_frontend() {
  log_info "Building frontend with backend URLs..."
  
  cd "$(dirname "$0")/../.."
  
  # Build frontend with all service URLs
  docker build -t ${IMAGE_REGISTRY}/frontend:${IMAGE_TAG} \
    --build-arg VITE_SECRET_SERVICE_URL="${SECRET_SERVICE_URL}" \
    --build-arg VITE_AUDIT_SERVICE_URL="${AUDIT_SERVICE_URL}" \
    --build-arg VITE_NOTIFICATION_SERVICE_URL="${NOTIFICATION_SERVICE_URL}" \
    --build-arg VITE_FIREBASE_API_KEY="${FIREBASE_API_KEY}" \
    --build-arg VITE_FIREBASE_AUTH_DOMAIN="${FIREBASE_AUTH_DOMAIN}" \
    --build-arg VITE_FIREBASE_PROJECT_ID="${FIREBASE_PROJECT_ID}" \
    --build-arg VITE_FIREBASE_STORAGE_BUCKET="${FIREBASE_STORAGE_BUCKET}" \
    --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="${FIREBASE_MESSAGING_SENDER_ID}" \
    --build-arg VITE_FIREBASE_APP_ID="${FIREBASE_APP_ID}" \
    --build-arg VITE_AUDIT_API_KEY="${AUDIT_API_KEY}" \
    -f apps/frontend/Dockerfile \
    apps/frontend

  log_info "Pushing frontend image..."
  docker push ${IMAGE_REGISTRY}/frontend:${IMAGE_TAG}

  log_info "Deploying frontend to Cloud Run..."
  gcloud run deploy frontend \
    --image=${IMAGE_REGISTRY}/frontend:${IMAGE_TAG} \
    --region=${REGION} \
    --platform=managed \
    --allow-unauthenticated \
    --memory=256Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=5 \
    --timeout=60 \
    --concurrency=100 \
    --port=8080 \
    --project=${PROJECT_ID}

  log_info "Frontend deployed successfully"
}

# =============================================================================
# Step 6: Print Summary
# =============================================================================
print_summary() {
  FRONTEND_URL=$(gcloud run services describe frontend \
    --region=${REGION} --project=${PROJECT_ID} \
    --format='value(status.url)' 2>/dev/null || echo "Not deployed")

  echo ""
  echo "=============================================="
  echo "       CLOUD RUN DEPLOYMENT COMPLETE"
  echo "=============================================="
  echo ""
  echo "Service URLs:"
  echo "  Frontend:             ${FRONTEND_URL}"
  echo "  Secret Service:       ${SECRET_SERVICE_URL}"
  echo "  Audit Service:        ${AUDIT_SERVICE_URL}"
  echo "  Notification Service: ${NOTIFICATION_SERVICE_URL}"
  echo ""
  echo "Next Steps:"
  echo "  1. Add these domains to Firebase Authorized domains:"
  echo "     - ${FRONTEND_URL#https://}"
  echo ""
  echo "  2. Test the application at:"
  echo "     ${FRONTEND_URL}"
  echo ""
  echo "  3. Scale down GKE to save costs:"
  echo "     gcloud container clusters resize cloud-secrets-cluster-dev \\"
  echo "       --node-pool default-pool --num-nodes 0 --region ${REGION}"
  echo ""
  echo "=============================================="
}

# =============================================================================
# Main Execution
# =============================================================================
main() {
  log_info "Starting Cloud Run deployment..."
  
  # Authenticate with GCP
  gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
  
  # Load secrets from Secret Manager (required for frontend build)
  load_secrets
  
  build_images
  push_backend_images
  deploy_backend_services
  get_service_urls
  deploy_frontend
  print_summary
  
  log_info "Deployment complete!"
}

main "$@"
