#!/bin/bash
# =============================================================================
# Cloud Secrets Manager - Setup Verification Script
# =============================================================================
# Verifies that all required secrets and configurations are in place
# =============================================================================

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-cloud-secrets-manager}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_step() { echo -e "${BLUE}→${NC} $1"; }

ERRORS=0
WARNINGS=0

# =============================================================================
# Check GCP Secrets
# =============================================================================
check_gcp_secrets() {
  log_step "Checking GCP Secret Manager..."
  
  REQUIRED_SECRETS=(
    "csm-jwt-secret"
    "csm-aes-key"
    "csm-audit-api-key"
    "csm-firebase-api-key"
    "csm-firebase-app-id"
    "csm-firebase-messaging-sender-id"
    "csm-firebase-admin-key"
  )
  
  OPTIONAL_SECRETS=(
    "csm-sendgrid-api-key"
  )
  
  for secret in "${REQUIRED_SECRETS[@]}"; do
    if gcloud secrets describe "${secret}" --project=${PROJECT_ID} &>/dev/null; then
      log_info "Secret exists: ${secret}"
    else
      log_error "Missing required secret: ${secret}"
      ((ERRORS++))
    fi
  done
  
  for secret in "${OPTIONAL_SECRETS[@]}"; do
    if gcloud secrets describe "${secret}" --project=${PROJECT_ID} &>/dev/null; then
      log_info "Optional secret exists: ${secret}"
    else
      log_warn "Optional secret missing: ${secret} (email notifications will be disabled)"
      ((WARNINGS++))
    fi
  done
}

# =============================================================================
# Check Service Account Permissions
# =============================================================================
check_permissions() {
  log_step "Checking service account permissions..."
  
  SERVICE_ACCOUNTS=(
    "secret-service-dev@${PROJECT_ID}.iam.gserviceaccount.com"
    "audit-service-dev@${PROJECT_ID}.iam.gserviceaccount.com"
    "notification-service-dev@${PROJECT_ID}.iam.gserviceaccount.com"
  )
  
  for sa in "${SERVICE_ACCOUNTS[@]}"; do
    if gcloud iam service-accounts describe "${sa}" --project=${PROJECT_ID} &>/dev/null; then
      log_info "Service account exists: ${sa}"
    else
      log_error "Service account missing: ${sa}"
      ((ERRORS++))
    fi
  done
}

# =============================================================================
# Check Local Environment File
# =============================================================================
check_local_env() {
  log_step "Checking local .env.local file..."
  
  ENV_FILE="docker/.env.local"
  
  if [ ! -f "${ENV_FILE}" ]; then
    log_error ".env.local not found at ${ENV_FILE}"
    log_info "Create it with: cp docker/env.example docker/.env.local"
    ((ERRORS++))
    return
  fi
  
  log_info ".env.local file exists"
  
  # Check required variables (without showing values)
  REQUIRED_VARS=(
    "JWT_SECRET"
    "ENCRYPTION_KEY"
    "VITE_FIREBASE_API_KEY"
    "VITE_FIREBASE_PROJECT_ID"
  )
  
  for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" "${ENV_FILE}" && ! grep -q "^${var}=$" "${ENV_FILE}" && ! grep -q "^${var}=\s*$" "${ENV_FILE}"; then
      log_info "${var} is set"
    else
      log_error "${var} is missing or empty in .env.local"
      ((ERRORS++))
    fi
  done
}

# =============================================================================
# Check Firebase Admin Key File
# =============================================================================
check_firebase_key() {
  log_step "Checking Firebase admin key file..."
  
  KEY_FILE="infrastructure/gcp/keys/firebase-admin-key.json"
  
  if [ ! -f "${KEY_FILE}" ]; then
    log_error "Firebase admin key not found at ${KEY_FILE}"
    log_info "Download from Firebase Console > Project Settings > Service Accounts"
    ((ERRORS++))
    return
  fi
  
  # Validate it's valid JSON
  if jq empty "${KEY_FILE}" 2>/dev/null; then
    log_info "Firebase admin key file is valid JSON"
  else
    log_error "Firebase admin key file is not valid JSON"
    ((ERRORS++))
  fi
}

# =============================================================================
# Check Docker Setup
# =============================================================================
check_docker() {
  log_step "Checking Docker setup..."
  
  if command -v docker &> /dev/null; then
    log_info "Docker is installed"
  else
    log_error "Docker is not installed"
    ((ERRORS++))
  fi
  
  if command -v docker-compose &> /dev/null || docker compose version &>/dev/null; then
    log_info "Docker Compose is available"
  else
    log_error "Docker Compose is not available"
    ((ERRORS++))
  fi
}

# =============================================================================
# Check GCP CLI
# =============================================================================
check_gcp_cli() {
  log_step "Checking GCP CLI..."
  
  if command -v gcloud &> /dev/null; then
    log_info "gcloud CLI is installed"
    
    if gcloud config get-value project &>/dev/null; then
      CURRENT_PROJECT=$(gcloud config get-value project)
      log_info "Current GCP project: ${CURRENT_PROJECT}"
      if [ "${CURRENT_PROJECT}" != "${PROJECT_ID}" ]; then
        log_warn "Project mismatch. Expected: ${PROJECT_ID}, Current: ${CURRENT_PROJECT}"
        log_info "Set with: gcloud config set project ${PROJECT_ID}"
        ((WARNINGS++))
      fi
    else
      log_error "No GCP project configured"
      log_info "Set with: gcloud config set project ${PROJECT_ID}"
      ((ERRORS++))
    fi
  else
    log_error "gcloud CLI is not installed"
    ((ERRORS++))
  fi
}

# =============================================================================
# Check Cloud Run Resources (if deployed)
# =============================================================================
check_cloudrun_resources() {
  log_step "Checking Cloud Run resource configuration..."
  
  REGION="${GCP_REGION:-europe-west10}"
  SERVICES=("secret-service" "audit-service" "notification-service" "frontend")
  
  DEPLOYED=0
  OPTIMIZED=0
  
  for service in "${SERVICES[@]}"; do
    if gcloud run services describe "${service}" --region=${REGION} --project=${PROJECT_ID} &>/dev/null; then
      DEPLOYED=$((DEPLOYED + 1))
      
      MEMORY=$(gcloud run services describe "${service}" \
        --region=${REGION} --project=${PROJECT_ID} \
        --format='value(spec.template.spec.containers[0].resources.limits.memory)' 2>/dev/null || echo "")
      MIN_INSTANCES=$(gcloud run services describe "${service}" \
        --region=${REGION} --project=${PROJECT_ID} \
        --format='value(spec.template.metadata.annotations.autoscaling\.knative\.dev/minScale)' 2>/dev/null || echo "0")
      
      # Check if optimized
      case "${service}" in
        "secret-service")
          if [ "${MEMORY}" = "512Mi" ] && [ "${MIN_INSTANCES}" = "1" ]; then
            log_info "${service}: ${MEMORY}, min=${MIN_INSTANCES} (optimized)"
            OPTIMIZED=$((OPTIMIZED + 1))
          else
            log_warn "${service}: ${MEMORY}, min=${MIN_INSTANCES} (not optimized)"
          fi
          ;;
        "audit-service"|"notification-service")
          if [ "${MEMORY}" = "512Mi" ] && [ "${MIN_INSTANCES}" = "0" ]; then
            log_info "${service}: ${MEMORY}, min=${MIN_INSTANCES} (optimized)"
            OPTIMIZED=$((OPTIMIZED + 1))
          else
            log_warn "${service}: ${MEMORY}, min=${MIN_INSTANCES} (not optimized)"
          fi
          ;;
        "frontend")
          if [ "${MEMORY}" = "256Mi" ] && [ "${MIN_INSTANCES}" = "0" ]; then
            log_info "${service}: ${MEMORY}, min=${MIN_INSTANCES} (optimized)"
            OPTIMIZED=$((OPTIMIZED + 1))
          else
            log_warn "${service}: ${MEMORY}, min=${MIN_INSTANCES} (not optimized)"
          fi
          ;;
      esac
    fi
  done
  
  if [ "${DEPLOYED}" -eq 0 ]; then
    log_warn "No Cloud Run services deployed yet"
  elif [ "${OPTIMIZED}" -eq "${DEPLOYED}" ]; then
    log_info "All deployed services are optimized"
  else
    log_warn "${OPTIMIZED}/${DEPLOYED} services are optimized"
  fi
}

# =============================================================================
# Estimate Costs
# =============================================================================
estimate_costs() {
  log_step "Estimating monthly costs..."
  
  REGION="${GCP_REGION:-europe-west10}"
  
  # Check if services are deployed
  if gcloud run services describe secret-service --region=${REGION} --project=${PROJECT_ID} &>/dev/null; then
    log_info "Cloud Run services deployed"
    log_info "  Estimated: \$5-15/month (with optimized resources)"
  else
    log_info "Cloud Run services not deployed yet"
  fi
  
  # Check Cloud SQL
  if gcloud sql instances describe secrets-manager-db-dev-3631da18 --project=${PROJECT_ID} &>/dev/null 2>&1; then
    log_info "Cloud SQL instance exists"
    log_info "  Estimated: \$30/month"
  else
    log_warn "Cloud SQL instance not found"
  fi
  
  log_info "Total estimated: ~\$15-25/month (optimized) or ~\$40-60/month (if Cloud SQL running)"
  log_info "Use ./infrastructure/scripts/shutdown.sh to reduce costs to ~\$10-15/month"
}

# =============================================================================
# Main
# =============================================================================
main() {
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}  Cloud Secrets Manager - Setup Verification${NC}"
  echo -e "${BLUE}================================================${NC}"
  echo ""
  
  check_gcp_cli
  echo ""
  
  check_docker
  echo ""
  
  check_local_env
  echo ""
  
  check_firebase_key
  echo ""
  
  if [ "${ERRORS}" -eq 0 ]; then
    check_gcp_secrets
    echo ""
    check_permissions
    echo ""
    check_cloudrun_resources
    echo ""
    estimate_costs
  else
    log_warn "Skipping GCP checks due to previous errors"
  fi
  
  echo ""
  echo -e "${BLUE}================================================${NC}"
  echo -e "${BLUE}  Summary${NC}"
  echo -e "${BLUE}================================================${NC}"
  
  if [ "${ERRORS}" -eq 0 ] && [ "${WARNINGS}" -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to deploy.${NC}"
    exit 0
  elif [ "${ERRORS}" -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS} warning(s) - deployment may work but some features disabled${NC}"
    exit 0
  else
    echo -e "${RED}✗ ${ERRORS} error(s) found - please fix before deploying${NC}"
    exit 1
  fi
}

main "$@"
