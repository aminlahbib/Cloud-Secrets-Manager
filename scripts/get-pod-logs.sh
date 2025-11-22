#!/bin/bash
# Get Pod Logs Script
# Helps debug pod issues by fetching logs from all containers

set -e

NAMESPACE="${1:-cloud-secrets-manager}"
APP="${2:-}"

if [ -z "$APP" ]; then
    echo "Usage: $0 [namespace] [app-name]"
    echo "Example: $0 cloud-secrets-manager secret-service"
    echo "Example: $0 cloud-secrets-manager audit-service"
    exit 1
fi

echo "=== Getting logs for $APP in namespace $NAMESPACE ==="
echo ""

# Get all pods for the app
PODS=$(kubectl get pods -n $NAMESPACE -l app=$APP -o jsonpath='{.items[*].metadata.name}')

if [ -z "$PODS" ]; then
    echo "No pods found for app=$APP"
    exit 1
fi

for pod in $PODS; do
    echo "=========================================="
    echo "Pod: $pod"
    echo "=========================================="
    
    # Get pod status
    echo "Status:"
    kubectl get pod $pod -n $NAMESPACE -o wide
    echo ""
    
    # Get pod describe
    echo "--- Pod Description ---"
    kubectl describe pod $pod -n $NAMESPACE | tail -50
    echo ""
    
    # Get logs from all containers
    CONTAINERS=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.spec.containers[*].name}')
    
    for container in $CONTAINERS; do
        echo "--- Logs for container: $container (previous instance) ---"
        kubectl logs $pod -n $NAMESPACE -c $container --previous --tail=100 2>&1 || echo "No previous logs (first run or container not restarted)"
        echo ""
        echo "--- Logs for container: $container (current instance) ---"
        kubectl logs $pod -n $NAMESPACE -c $container --tail=100 2>&1 || echo "Could not get current logs"
        echo ""
    done
    
    # Get events for this pod
    echo "--- Events for pod ---"
    kubectl get events -n $NAMESPACE --field-selector involvedObject.name=$pod --sort-by='.lastTimestamp' | tail -20
    echo ""
done

echo "=== Done ==="

