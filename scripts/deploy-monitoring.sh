#!/bin/bash
# Deploy Monitoring Configuration (Prometheus ServiceMonitors and AlertingRules)
# This script applies monitoring configurations to the cluster

set -euo pipefail

NAMESPACE="${NAMESPACE:-cloud-secrets-manager}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Deploying Monitoring Configuration ==="
echo "Namespace: ${NAMESPACE}"
echo ""

# Check if namespace exists
if ! kubectl get namespace "${NAMESPACE}" &>/dev/null; then
    echo "❌ Namespace ${NAMESPACE} does not exist. Creating it..."
    kubectl create namespace "${NAMESPACE}"
fi

# Check if Prometheus Operator is installed
if ! kubectl get crd servicemonitors.monitoring.coreos.com &>/dev/null; then
    echo "⚠️  WARNING: Prometheus Operator CRD not found."
    echo "   ServiceMonitors require Prometheus Operator to be installed."
    echo "   Install it with:"
    echo "   kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Apply Prometheus configuration
echo "1. Applying Prometheus ServiceMonitors and AlertingRules..."
kubectl apply -f "${PROJECT_ROOT}/infrastructure/kubernetes/k8s/monitoring/prometheus-config.yaml"
echo "✅ Monitoring configuration applied"

# Verify
echo ""
echo "=== Verification ==="
echo "ServiceMonitors:"
kubectl get servicemonitors -n "${NAMESPACE}" || echo "No ServiceMonitors found (Prometheus Operator may not be installed)"

echo ""
echo "PrometheusRules:"
kubectl get prometheusrules -n "${NAMESPACE}" || echo "No PrometheusRules found (Prometheus Operator may not be installed)"

echo ""
echo "✅ Monitoring configuration deployed successfully!"
echo ""
echo "Next steps:"
echo "  1. Verify Prometheus is scraping metrics:"
echo "     kubectl port-forward -n monitoring svc/prometheus-k8s 9090:9090"
echo "     Then open http://localhost:9090 and query: up{namespace=\"${NAMESPACE}\"}"
echo ""
echo "  2. Access Grafana (if installed):"
echo "     kubectl port-forward -n monitoring svc/grafana 3000:3000"
echo "     Then open http://localhost:3000"

