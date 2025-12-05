#!/bin/bash

# Deploy Monitoring Resources for Loki & Promtail
# This script deploys ServiceMonitors and PrometheusRules for monitoring Loki and Promtail

set -e

echo "=========================================="
echo "Deploying Loki & Promtail Monitoring"
echo "=========================================="
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Check if logging namespace exists
if ! kubectl get namespace logging &> /dev/null; then
    echo "❌ Namespace 'logging' not found. Please deploy Loki first."
    exit 1
fi

# Check if Prometheus Operator is installed
if ! kubectl get crd servicemonitors.monitoring.coreos.com &> /dev/null; then
    echo "⚠️  WARNING: Prometheus Operator not detected (ServiceMonitor CRD not found)"
    echo ""
    echo "To install Prometheus Operator:"
    echo "  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts"
    echo "  helm repo update"
    echo "  helm install prometheus prometheus-community/kube-prometheus-stack \\"
    echo "    --namespace monitoring \\"
    echo "    --create-namespace \\"
    echo "    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📊 Deploying ServiceMonitors..."
echo ""

# Deploy Loki ServiceMonitor
echo "  → Deploying Loki ServiceMonitor..."
kubectl apply -f loki-servicemonitor.yaml
echo "    ✅ Loki ServiceMonitor deployed"

# Deploy Promtail ServiceMonitor
echo "  → Deploying Promtail ServiceMonitor..."
kubectl apply -f promtail-servicemonitor.yaml
echo "    ✅ Promtail ServiceMonitor deployed"

echo ""
echo "🚨 Deploying Alert Rules..."
echo ""

# Deploy Prometheus Rules
echo "  → Deploying Loki Alert Rules..."
kubectl apply -f loki-prometheus-rules.yaml
echo "    ✅ Loki Alert Rules deployed"

echo ""
echo "=========================================="
echo "✅ Monitoring Deployment Complete!"
echo "=========================================="
echo ""

# Verify deployment
echo "📋 Verification:"
echo ""

echo "ServiceMonitors:"
kubectl get servicemonitor -n logging
echo ""

echo "PrometheusRules:"
kubectl get prometheusrule -n logging
echo ""

echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Verify Prometheus is scraping targets:"
echo "   kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090"
echo "   Open: http://localhost:9090/targets"
echo ""
echo "2. Check alert rules are loaded:"
echo "   Open: http://localhost:9090/alerts"
echo ""
echo "3. View metrics in Prometheus:"
echo "   Query: up{job=\"loki\"}"
echo "   Query: rate(loki_distributor_lines_received_total[5m])"
echo ""
echo "4. Import Grafana dashboards:"
echo "   Dashboard ID 13639 - Loki Metrics"
echo "   Dashboard ID 15443 - Promtail Metrics"
echo ""
echo "📖 Documentation: docs/deployment/logging/PROMETHEUS_INTEGRATION.md"
echo ""
