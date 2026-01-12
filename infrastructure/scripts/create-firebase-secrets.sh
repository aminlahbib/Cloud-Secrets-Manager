#!/bin/bash
# =============================================================================
# Create Firebase Secrets in GCP Secret Manager
# =============================================================================
# This script helps you create the missing Firebase secrets
# =============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-cloud-secrets-manager}"
ENV_FILE="${1:-docker/.env.local}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Read from .env.local
# =============================================================================
read_env_value() {
  local key=$1
  if [ -f "${ENV_FILE}" ]; then
    grep "^${key}=" "${ENV_FILE}" | cut -d'=' -f2- | sed 's/^"//;s/"$//'
  else
    echo ""
  fi
}

# =============================================================================
# Create Secret
# =============================================================================
create_secret() {
  local secret_name=$1
  local secret_value=$2
  local description=$3
  
  if [ -z "${secret_value}" ]; then
    log_error "${secret_name}: Value is empty. Please provide it."
    return 1
  fi
  
  if gcloud secrets describe "${secret_name}" --project=${PROJECT_ID} &>/dev/null; then
    log_warn "${secret_name} already exists. Updating..."
    echo -n "${secret_value}" | gcloud secrets versions add "${secret_name}" --data-file=- --project=${PROJECT_ID}
    log_info "✓ Updated ${secret_name}"
  else
    echo -n "${secret_value}" | gcloud secrets create "${secret_name}" \
      --data-file=- \
      --replication-policy="automatic" \
      --project=${PROJECT_ID}
    log_info "✓ Created ${secret_name}"
  fi
}

# =============================================================================
# Main
# =============================================================================
main() {
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}  Create Firebase Secrets in GCP${NC}"
  echo -e "${BLUE}================================================${NC}"
  echo ""
  
  # Try to read from .env.local
  FIREBASE_API_KEY=$(read_env_value "VITE_FIREBASE_API_KEY")
  FIREBASE_APP_ID=$(read_env_value "VITE_FIREBASE_APP_ID")
  FIREBASE_SENDER_ID=$(read_env_value "VITE_FIREBASE_MESSAGING_SENDER_ID")
  
  # If not found in .env.local, prompt user
  if [ -z "${FIREBASE_API_KEY}" ]; then
    echo "Firebase API Key not found in ${ENV_FILE}"
    echo "Get it from: Firebase Console > Project Settings > General > Your apps"
    read -p "Enter Firebase API Key: " FIREBASE_API_KEY
  fi
  
  if [ -z "${FIREBASE_APP_ID}" ]; then
    echo "Firebase App ID not found in ${ENV_FILE}"
    read -p "Enter Firebase App ID: " FIREBASE_APP_ID
  fi
  
  if [ -z "${FIREBASE_SENDER_ID}" ]; then
    echo "Firebase Messaging Sender ID not found in ${ENV_FILE}"
    read -p "Enter Firebase Messaging Sender ID: " FIREBASE_SENDER_ID
  fi
  
  echo ""
  log_info "Creating secrets in project: ${PROJECT_ID}"
  echo ""
  
  create_secret "csm-firebase-api-key" "${FIREBASE_API_KEY}" "Firebase API Key"
  create_secret "csm-firebase-app-id" "${FIREBASE_APP_ID}" "Firebase App ID"
  create_secret "csm-firebase-messaging-sender-id" "${FIREBASE_SENDER_ID}" "Firebase Messaging Sender ID"
  
  echo ""
  log_info "Firebase secrets created successfully!"
  echo ""
  log_info "Next: Run ./verify-setup.sh to confirm everything is ready"
}

main "$@"
