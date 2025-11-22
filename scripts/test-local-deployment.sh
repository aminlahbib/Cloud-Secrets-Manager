#!/bin/bash
# Local Deployment Testing Script
# This script helps test the deployment locally before pushing to CI/CD

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="cloud-secrets-manager"
PROJECT_ID="cloud-secrets-manager"
REGION="europe-west10"
CLUSTER="cloud-secrets-cluster-dev"

echo -e "${GREEN}=== Local Deployment Testing ===${NC}"
echo ""

# Step 1: Verify kubectl is configured
echo -e "${YELLOW}Step 1: Verifying kubectl configuration...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: kubectl is not configured or cluster is not accessible${NC}"
    echo "Run: gcloud container clusters get-credentials $CLUSTER --region $REGION --project $PROJECT_ID"
    exit 1
fi
echo -e "${GREEN}✓ kubectl is configured${NC}"
echo ""

# Step 2: Check namespace exists
echo -e "${YELLOW}Step 2: Checking namespace...${NC}"
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo -e "${YELLOW}Namespace $NAMESPACE does not exist, creating...${NC}"
    kubectl create namespace $NAMESPACE
fi
echo -e "${GREEN}✓ Namespace exists${NC}"
echo ""

# Step 3: Check ExternalSecrets
echo -e "${YELLOW}Step 3: Checking ExternalSecrets...${NC}"
EXTERNAL_SECRETS=$(kubectl get externalsecrets -n $NAMESPACE 2>/dev/null | wc -l)
if [ "$EXTERNAL_SECRETS" -lt 2 ]; then
    echo -e "${RED}Warning: ExternalSecrets may not be configured${NC}"
    echo "Run: kubectl get externalsecrets -n $NAMESPACE"
else
    echo -e "${GREEN}✓ ExternalSecrets found${NC}"
    kubectl get externalsecrets -n $NAMESPACE
fi
echo ""

# Step 4: Check required secrets exist
echo -e "${YELLOW}Step 4: Checking required secrets...${NC}"
REQUIRED_SECRETS=("csm-db-secrets" "csm-app-config" "csm-google-service-account")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! kubectl get secret $secret -n $NAMESPACE &> /dev/null; then
        MISSING_SECRETS+=("$secret")
        echo -e "${RED}✗ Secret $secret is missing${NC}"
    else
        echo -e "${GREEN}✓ Secret $secret exists${NC}"
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo -e "${RED}Error: Missing required secrets: ${MISSING_SECRETS[*]}${NC}"
    echo "Ensure ExternalSecrets have synced or create secrets manually"
    exit 1
fi
echo ""

# Step 5: Check Artifact Registry secret
echo -e "${YELLOW}Step 5: Checking Artifact Registry image pull secret...${NC}"
if ! kubectl get secret artifact-registry-secret -n $NAMESPACE &> /dev/null; then
    echo -e "${YELLOW}Creating Artifact Registry secret...${NC}"
    ACCESS_TOKEN=$(gcloud auth print-access-token)
    kubectl create secret docker-registry artifact-registry-secret \
        --docker-server=${REGION}-docker.pkg.dev \
        --docker-username=oauth2accesstoken \
        --docker-password="${ACCESS_TOKEN}" \
        --docker-email=$(gcloud config get-value account) \
        --namespace=$NAMESPACE \
        --dry-run=client -o yaml | kubectl apply -f -
    echo -e "${GREEN}✓ Artifact Registry secret created${NC}"
else
    echo -e "${GREEN}✓ Artifact Registry secret exists${NC}"
fi
echo ""

# Step 6: Check service accounts
echo -e "${YELLOW}Step 6: Checking Kubernetes service accounts...${NC}"
REQUIRED_SAS=("secret-service" "audit-service")
for sa in "${REQUIRED_SAS[@]}"; do
    if kubectl get serviceaccount $sa -n $NAMESPACE &> /dev/null; then
        echo -e "${GREEN}✓ Service account $sa exists${NC}"
    else
        echo -e "${RED}✗ Service account $sa is missing${NC}"
        echo "This should be created by Terraform/Helm"
    fi
done
echo ""

# Step 7: Check current pod status
echo -e "${YELLOW}Step 7: Checking current pod status...${NC}"
PODS=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
if [ -z "$PODS" ]; then
    echo -e "${YELLOW}No pods found in namespace${NC}"
else
    echo "Current pods:"
    kubectl get pods -n $NAMESPACE
    echo ""
    
    # Check for CrashLoopBackOff
    CRASHING=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[?(@.status.containerStatuses[*].state.waiting.reason=="CrashLoopBackOff")].metadata.name}' 2>/dev/null || echo "")
    if [ -n "$CRASHING" ]; then
        echo -e "${RED}Warning: Found pods in CrashLoopBackOff: $CRASHING${NC}"
        echo ""
        echo -e "${YELLOW}Checking logs for crashing pods...${NC}"
        for pod in $CRASHING; do
            echo ""
            echo -e "${YELLOW}=== Logs for $pod ===${NC}"
            kubectl logs $pod -n $NAMESPACE --tail=50 --all-containers=true 2>&1 | head -100 || echo "Could not retrieve logs"
        done
    fi
fi
echo ""

# Step 8: Test Helm deployment (dry-run)
echo -e "${YELLOW}Step 8: Testing Helm chart (dry-run)...${NC}"
if [ -d "infrastructure/helm/cloud-secrets-manager" ]; then
    helm upgrade --install cloud-secrets-manager \
        ./infrastructure/helm/cloud-secrets-manager \
        --namespace $NAMESPACE \
        --dry-run \
        --debug > /tmp/helm-dry-run.log 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Helm chart validation passed${NC}"
    else
        echo -e "${RED}✗ Helm chart validation failed${NC}"
        echo "Check /tmp/helm-dry-run.log for details"
        exit 1
    fi
else
    echo -e "${YELLOW}Helm chart directory not found, skipping${NC}"
fi
echo ""

# Step 9: Summary
echo -e "${GREEN}=== Testing Summary ===${NC}"
echo "All prerequisites checked. You can now:"
echo "1. Deploy with Helm: helm upgrade --install cloud-secrets-manager ./infrastructure/helm/cloud-secrets-manager -n $NAMESPACE"
echo "2. Monitor pods: kubectl get pods -n $NAMESPACE -w"
echo "3. Check logs: kubectl logs -l app=secret-service -n $NAMESPACE -c secret-service"
echo ""

