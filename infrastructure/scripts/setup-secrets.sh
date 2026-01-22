#!/bin/bash
# =============================================================================
# Cloud Secrets Manager - Secret Setup Script
# =============================================================================
# This script helps you generate and create all required secrets for deployment
# =============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-cloud-secrets-manager}"
REGION="${GCP_REGION:-europe-west10}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# =============================================================================
# Step 1: Generate Local Secrets
# =============================================================================
generate_local_secrets() {
  log_step "Generating local secrets..."
  
  JWT_SECRET=$(openssl rand -hex 32)
  ENCRYPTION_KEY=$(openssl rand -base64 24 | head -c 32)
  AUDIT_API_KEY=$(openssl rand -hex 32)
  
  log_info "Generated secrets:"
  echo "  JWT_SECRET: ${JWT_SECRET:0:20}..."
  echo "  ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:10}..."
  echo "  AUDIT_API_KEY: ${AUDIT_API_KEY:0:20}..."
  
  # Save to temporary file
  cat > /tmp/csm-secrets.txt <<EOF
# Generated on $(date)
JWT_SECRET=${JWT_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
AUDIT_API_KEY=${AUDIT_API_KEY}
EOF
  
  log_info "Secrets saved to /tmp/csm-secrets.txt (keep this safe!)"
  echo ""
  
  # Export for use in this script
  export JWT_SECRET ENCRYPTION_KEY AUDIT_API_KEY
}

# =============================================================================
# Step 2: Create GCP Secrets
# =============================================================================
create_gcp_secrets() {
  log_step "Creating GCP secrets in Secret Manager..."
  
  # Check if project is set
  if ! gcloud config get-value project &>/dev/null; then
    log_warn "GCP project not set. Setting to ${PROJECT_ID}..."
    gcloud config set project ${PROJECT_ID}
  fi
  
  # Create JWT secret
  if gcloud secrets describe csm-jwt-secret --project=${PROJECT_ID} &>/dev/null; then
    log_warn "csm-jwt-secret already exists. Updating..."
    echo -n "${JWT_SECRET}" | gcloud secrets versions add csm-jwt-secret --data-file=- --project=${PROJECT_ID}
  else
    echo -n "${JWT_SECRET}" | gcloud secrets create csm-jwt-secret --data-file=- --replication-policy="automatic" --project=${PROJECT_ID}
    log_info "✓ Created csm-jwt-secret"
  fi
  
  # Create AES key
  if gcloud secrets describe csm-aes-key --project=${PROJECT_ID} &>/dev/null; then
    log_warn "csm-aes-key already exists. Updating..."
    echo -n "${ENCRYPTION_KEY}" | gcloud secrets versions add csm-aes-key --data-file=- --project=${PROJECT_ID}
  else
    echo -n "${ENCRYPTION_KEY}" | gcloud secrets create csm-aes-key --data-file=- --replication-policy="automatic" --project=${PROJECT_ID}
    log_info "✓ Created csm-aes-key"
  fi
  
  # Create Audit API key
  if gcloud secrets describe csm-audit-api-key --project=${PROJECT_ID} &>/dev/null; then
    log_warn "csm-audit-api-key already exists. Updating..."
    echo -n "${AUDIT_API_KEY}" | gcloud secrets versions add csm-audit-api-key --data-file=- --project=${PROJECT_ID}
  else
    echo -n "${AUDIT_API_KEY}" | gcloud secrets create csm-audit-api-key --data-file=- --replication-policy="automatic" --project=${PROJECT_ID}
    log_info "✓ Created csm-audit-api-key"
  fi
  
  echo ""
  log_warn "⚠️  You still need to create these Firebase secrets manually:"
  echo "  - csm-firebase-api-key"
  echo "  - csm-firebase-app-id"
  echo "  - csm-firebase-messaging-sender-id"
  echo "  - csm-firebase-admin-key (JSON file)"
  echo ""
  echo "Get these from Firebase Console > Project Settings"
}

# =============================================================================
# Step 3: Grant Service Account Permissions
# =============================================================================
grant_permissions() {
  log_step "Granting Secret Manager permissions to service accounts..."
  
  SERVICE_ACCOUNTS=(
    "secret-service-dev@${PROJECT_ID}.iam.gserviceaccount.com"
    "audit-service-dev@${PROJECT_ID}.iam.gserviceaccount.com"
    "notification-service-dev@${PROJECT_ID}.iam.gserviceaccount.com"
  )
  
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
  
  for sa in "${SERVICE_ACCOUNTS[@]}"; do
    log_info "Granting permissions to ${sa}..."
    for secret in "${SECRETS[@]}"; do
      if gcloud secrets describe "${secret}" --project=${PROJECT_ID} &>/dev/null; then
        gcloud secrets add-iam-policy-binding "${secret}" \
          --member="serviceAccount:${sa}" \
          --role="roles/secretmanager.secretAccessor" \
          --project=${PROJECT_ID} &>/dev/null || true
      fi
    done
  done
  
  log_info "✓ Permissions granted"
}

# =============================================================================
# Main
# =============================================================================
main() {
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}  Cloud Secrets Manager - Secret Setup${NC}"
  echo -e "${BLUE}================================================${NC}"
  echo ""
  
  # Check prerequisites
  if ! command -v gcloud &> /dev/null; then
    log_error "gcloud CLI not found. Please install it first."
    exit 1
  fi
  
  if ! command -v openssl &> /dev/null; then
    log_error "openssl not found. Please install it first."
    exit 1
  fi
  
  # Generate secrets
  generate_local_secrets
  
  # Ask user what to do
  echo "What would you like to do?"
  echo "  1) Create GCP secrets (requires gcloud authentication)"
  echo "  2) Grant service account permissions"
  echo "  3) Both (recommended)"
  echo "  4) Skip (just show generated secrets)"
  read -p "Choice [1-4]: " choice
  
  case $choice in
    1|3)
      create_gcp_secrets
      if [ "$choice" = "3" ]; then
        grant_permissions
      fi
      ;;
    2)
      grant_permissions
      ;;
    4)
      log_info "Skipping GCP operations. Secrets are in /tmp/csm-secrets.txt"
      ;;
    *)
      log_error "Invalid choice"
      exit 1
      ;;
  esac
  
  echo ""
  log_info "Setup complete! Next steps:"
  echo "  1. Copy secrets from /tmp/csm-secrets.txt to docker/.env.local"
  echo "  2. Add Firebase configuration to docker/.env.local"
  echo "  3. Create Firebase secrets in GCP (see warnings above)"
  echo ""
}

main "$@"
