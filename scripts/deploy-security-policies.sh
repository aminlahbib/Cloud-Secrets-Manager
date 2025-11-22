#!/bin/bash
# Deploy Security Policies (Network Policies and Pod Security Standards)
# This script applies security hardening configurations to the cluster

set -euo pipefail

NAMESPACE="${NAMESPACE:-cloud-secrets-manager}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Deploying Security Policies ==="
echo "Namespace: ${NAMESPACE}"
echo ""

# Check if namespace exists
if ! kubectl get namespace "${NAMESPACE}" &>/dev/null; then
    echo "❌ Namespace ${NAMESPACE} does not exist. Creating it..."
    kubectl create namespace "${NAMESPACE}"
fi

# Apply Pod Security Standards
echo "1. Applying Pod Security Standards..."
kubectl apply -f "${PROJECT_ROOT}/infrastructure/kubernetes/k8s/pod-security-standards.yaml"
echo "✅ Pod Security Standards applied"

# Apply Network Policies
echo ""
echo "2. Applying Network Policies..."
kubectl apply -f "${PROJECT_ROOT}/infrastructure/kubernetes/k8s/network-policies.yaml"
echo "✅ Network Policies applied"

# Verify
echo ""
echo "=== Verification ==="
echo "Network Policies:"
kubectl get networkpolicies -n "${NAMESPACE}"

echo ""
echo "Namespace labels (Pod Security Standards):"
kubectl get namespace "${NAMESPACE}" -o jsonpath='{.metadata.labels}' | jq .

echo ""
echo "✅ Security policies deployed successfully!"
echo ""
echo "Note: Existing pods may need to be restarted to fully apply security policies."
echo "To restart pods:"
echo "  kubectl rollout restart deployment/secret-service -n ${NAMESPACE}"
echo "  kubectl rollout restart deployment/audit-service -n ${NAMESPACE}"

