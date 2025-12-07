#!/bin/bash
# =============================================================================
# Cloud Secrets Manager - Monitoring Stack Deployment
# =============================================================================
# This script deploys Prometheus, Grafana, and Loki to a Kubernetes cluster
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Cloud Secrets Manager - Monitoring Deployment ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl not found. Please install kubectl.${NC}"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    echo -e "${RED}Error: helm not found. Please install Helm 3.${NC}"
    exit 1
fi

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster.${NC}"
    echo -e "${YELLOW}Please ensure your cluster is running:${NC}"
    echo "  - Docker Desktop: Enable Kubernetes in settings"
    echo "  - minikube: Run 'minikube start'"
    echo "  - kind: Run 'kind create cluster'"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HELM_DIR="${SCRIPT_DIR}/../helm"

# Add Helm repositories
echo -e "${YELLOW}Adding Helm repositories...${NC}"
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo add grafana https://grafana.github.io/helm-charts 2>/dev/null || true
helm repo update
echo -e "${GREEN}✓ Helm repositories updated${NC}"
echo ""

# Create monitoring namespace
echo -e "${YELLOW}Creating monitoring namespace...${NC}"
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Monitoring namespace ready${NC}"
echo ""

# Deploy kube-prometheus-stack
echo -e "${YELLOW}Deploying Prometheus + Grafana (kube-prometheus-stack)...${NC}"
echo -e "${BLUE}This may take a few minutes...${NC}"

helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.adminPassword=admin \
  --set grafana.persistence.enabled=false \
  --set prometheus.prometheusSpec.retention=7d \
  --set prometheus.prometheusSpec.resources.requests.memory=256Mi \
  --set prometheus.prometheusSpec.resources.requests.cpu=100m \
  --set prometheus.prometheusSpec.resources.limits.memory=512Mi \
  --set prometheus.prometheusSpec.resources.limits.cpu=500m \
  --set alertmanager.enabled=true \
  --set alertmanager.alertmanagerSpec.resources.requests.memory=64Mi \
  --set alertmanager.alertmanagerSpec.resources.requests.cpu=50m \
  --wait \
  --timeout 10m

echo -e "${GREEN}✓ Prometheus + Grafana deployed${NC}"
echo ""

# Deploy Loki Stack
echo -e "${YELLOW}Deploying Loki + Promtail...${NC}"

if [ -f "${HELM_DIR}/loki-stack-values.yaml" ]; then
  helm upgrade --install loki grafana/loki-stack \
    --namespace monitoring \
    -f "${HELM_DIR}/loki-stack-values.yaml" \
    --wait \
    --timeout 5m
else
  # Use default values if custom values file doesn't exist
  helm upgrade --install loki grafana/loki-stack \
    --namespace monitoring \
    --set loki.persistence.enabled=false \
    --set promtail.enabled=true \
    --set grafana.enabled=false \
    --wait \
    --timeout 5m
fi

echo -e "${GREEN}✓ Loki + Promtail deployed${NC}"
echo ""

# Apply custom alert rules
echo -e "${YELLOW}Applying alert rules...${NC}"
if [ -d "${SCRIPT_DIR}/alerts" ]; then
  kubectl apply -f "${SCRIPT_DIR}/alerts/" -n monitoring 2>/dev/null || true
  echo -e "${GREEN}✓ Alert rules applied${NC}"
else
  echo -e "${YELLOW}⚠ No alerts directory found, skipping${NC}"
fi
echo ""

# Apply ServiceMonitors
echo -e "${YELLOW}Applying ServiceMonitors...${NC}"
if [ -d "${SCRIPT_DIR}/servicemonitors" ]; then
  kubectl apply -f "${SCRIPT_DIR}/servicemonitors/" -n monitoring 2>/dev/null || true
  echo -e "${GREEN}✓ ServiceMonitors applied${NC}"
else
  echo -e "${YELLOW}⚠ No servicemonitors directory found, skipping${NC}"
fi
echo ""

# Wait for pods to be ready
echo -e "${YELLOW}Waiting for all pods to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=prometheus -n monitoring --timeout=300s 2>/dev/null || true
kubectl wait --for=condition=ready pod -l app=loki -n monitoring --timeout=120s 2>/dev/null || true

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Monitoring Stack Deployed Successfully! 🎉    ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Access Grafana:${NC}"
echo "  kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
echo "  Open: http://localhost:3000"
echo "  Login: admin / admin"
echo ""
echo -e "${BLUE}Access Prometheus:${NC}"
echo "  kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
echo "  Open: http://localhost:9090"
echo ""
echo -e "${BLUE}Check pods:${NC}"
echo "  kubectl get pods -n monitoring"
echo ""

# Show pod status
echo -e "${YELLOW}Current pod status:${NC}"
kubectl get pods -n monitoring --no-headers | head -10
