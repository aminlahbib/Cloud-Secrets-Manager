#!/bin/bash
# Setup script for Kubernetes secrets
# 
# DEPRECATED: This script creates static Kubernetes secrets.
# For production deployments, use External Secrets Operator (ESO) instead.
# ESO automatically syncs secrets from Google Secret Manager.
# See: docs/deployment/EXTERNAL_SECRETS_SETUP.md
#
# This script is kept for local development or legacy deployments only.

set -e

echo "🔐 Kubernetes Secrets Setup Script (DEPRECATED - Use ESO for production)"
echo "========================================================================="
echo ""
echo "⚠️  WARNING: This script creates static secrets."
echo "   For production, use External Secrets Operator instead."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
    echo "Please install kubectl first: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

echo -e "${GREEN}✅ kubectl found${NC}"
echo ""

# Check if service account file exists
SERVICE_ACCOUNT_FILE="apps/backend/secret-service/src/main/resources/service-account.json"
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo -e "${RED}❌ Service account file not found at: $SERVICE_ACCOUNT_FILE${NC}"
    echo "Please download your service account JSON from Google Cloud Console"
    exit 1
fi

echo -e "${GREEN}✅ Service account file found${NC}"

# Extract project ID
PROJECT_ID=$(cat "$SERVICE_ACCOUNT_FILE" | grep -o '"project_id"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
echo "   Project ID: $PROJECT_ID"
echo ""

# Get namespace (default to dedicated namespace)
read -p "Enter Kubernetes namespace (default: cloud-secrets-manager): " NAMESPACE
NAMESPACE=${NAMESPACE:-cloud-secrets-manager}

echo ""
echo "📋 Step 1: Creating csm-google-service-account secret..."
echo "---------------------------------------------------"

# Check if secret already exists
if kubectl get secret csm-google-service-account -n "$NAMESPACE" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Secret 'csm-google-service-account' already exists${NC}"
    read -p "Do you want to delete and recreate it? (y/N): " RECREATE
    if [[ $RECREATE =~ ^[Yy]$ ]]; then
        kubectl delete secret csm-google-service-account -n "$NAMESPACE"
        echo "Deleted existing secret"
    else
        echo "Skipping secret creation"
        SKIP_SECRET=true
    fi
fi

if [ "$SKIP_SECRET" != "true" ]; then
    kubectl create secret generic csm-google-service-account \
        --from-file=service-account.json="$SERVICE_ACCOUNT_FILE" \
        --namespace="$NAMESPACE"
    
    echo -e "${GREEN}✅ Created csm-google-service-account secret${NC}"
fi

echo ""
echo "📋 Step 2: Updating csm-app-config secret..."
echo "--------------------------------------------------"

# Generate secure random secrets
echo "Generating secure secrets..."
JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
AES_KEY=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-32)

echo ""
echo "Generated secrets:"
echo "  JWT_SECRET: ${JWT_SECRET:0:10}... (hidden)"
echo "  AES_KEY: ${AES_KEY:0:10}... (hidden)"
echo ""

read -p "Use generated secrets? (Y/n): " USE_GENERATED
USE_GENERATED=${USE_GENERATED:-Y}

if [[ ! $USE_GENERATED =~ ^[Yy]$ ]]; then
    read -p "Enter JWT_SECRET (32+ characters): " JWT_SECRET
    read -p "Enter AES_KEY (exactly 32 characters): " AES_KEY
    
    if [ ${#AES_KEY} -ne 32 ]; then
        echo -e "${RED}❌ AES_KEY must be exactly 32 characters${NC}"
        exit 1
    fi
fi

# Check if secret already exists
if kubectl get secret csm-app-config -n "$NAMESPACE" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Secret 'csm-app-config' already exists${NC}"
    read -p "Do you want to update it? (y/N): " UPDATE
    if [[ ! $UPDATE =~ ^[Yy]$ ]]; then
        echo "Skipping secret update"
        SKIP_CONFIG=true
    fi
fi

if [ "$SKIP_CONFIG" != "true" ]; then
    # Delete existing secret if updating
    if kubectl get secret csm-app-config -n "$NAMESPACE" &> /dev/null; then
        kubectl delete secret csm-app-config -n "$NAMESPACE"
    fi
    
    # Create secret
    kubectl create secret generic csm-app-config \
        --from-literal=JWT_SECRET="$JWT_SECRET" \
        --from-literal=AES_KEY="$AES_KEY" \
        --from-literal=GOOGLE_PROJECT_ID="$PROJECT_ID" \
        --from-literal=GOOGLE_API_KEY="" \
        --namespace="$NAMESPACE"
    
    echo -e "${GREEN}✅ Created/updated csm-app-config secret${NC}"
fi

echo ""
echo "📋 Step 3: Verifying secrets..."
echo "--------------------------------"

echo "Checking secrets in namespace: $NAMESPACE"
kubectl get secrets -n "$NAMESPACE" | grep -E "csm-google-service-account|csm-app-config|csm-db-secrets" || echo "Some secrets not found"

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Apply database secrets: kubectl apply -n $NAMESPACE -f infrastructure/kubernetes/k8s/k8s-secrets.yaml"
echo "  2. Deploy services: kubectl apply -n $NAMESPACE -f infrastructure/kubernetes/k8s/"
echo "  3. Or use Helm: helm upgrade --install cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager"
echo ""

