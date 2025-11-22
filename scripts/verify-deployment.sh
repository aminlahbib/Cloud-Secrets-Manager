#!/bin/bash
# Comprehensive Deployment Verification Script
# This script verifies all aspects of the Cloud Secrets Manager deployment

set -uo pipefail  # Remove -e to allow script to continue on errors

NAMESPACE="${NAMESPACE:-cloud-secrets-manager}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Start verification
echo "=========================================="
echo "  Cloud Secrets Manager Deployment"
echo "  Verification Script"
echo "=========================================="
echo ""
echo "Namespace: ${NAMESPACE}"
echo "Timestamp: $(date)"
echo ""

# 1. Prerequisites Check
print_header "1. Prerequisites Check"

if check_command kubectl; then
    print_success "kubectl is installed"
    KUBECTL_VERSION=$(kubectl version --client --short 2>/dev/null | cut -d' ' -f3 2>/dev/null || echo "")
    if [ -n "${KUBECTL_VERSION}" ]; then
        echo "   Version: ${KUBECTL_VERSION}"
    fi
else
    print_error "kubectl is not installed"
    exit 1
fi

if check_command helm; then
    print_success "helm is installed"
    HELM_VERSION=$(helm version --short 2>/dev/null || echo "")
    if [ -n "${HELM_VERSION}" ]; then
        echo "   Version: ${HELM_VERSION}"
    fi
else
    print_warning "helm is not installed (optional)"
fi

# Check cluster connection
if kubectl cluster-info &>/dev/null; then
    print_success "Connected to Kubernetes cluster"
    CLUSTER=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}' 2>/dev/null || echo "unknown")
    echo "   Cluster: ${CLUSTER}"
else
    print_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

# Check for jq (optional but helpful)
if check_command jq; then
    HAS_JQ=true
else
    HAS_JQ=false
    print_warning "jq not installed - some checks will be simplified"
fi

# 2. Namespace Check
print_header "2. Namespace Verification"

if kubectl get namespace "${NAMESPACE}" &>/dev/null; then
    print_success "Namespace '${NAMESPACE}' exists"
    
    # Check Pod Security Standards
    PSS_ENFORCE=$(kubectl get namespace "${NAMESPACE}" -o jsonpath='{.metadata.labels.pod-security\.kubernetes\.io/enforce}' 2>/dev/null || echo "")
    if [ -n "${PSS_ENFORCE}" ]; then
        print_success "Pod Security Standards enforced: ${PSS_ENFORCE}"
    else
        print_warning "Pod Security Standards not configured"
    fi
else
    print_error "Namespace '${NAMESPACE}' does not exist"
    exit 1
fi

# 3. Helm Release Check
print_header "3. Helm Release Verification"

if check_command helm; then
    if helm list -n "${NAMESPACE}" | grep -q "cloud-secrets-manager"; then
        print_success "Helm release 'cloud-secrets-manager' is deployed"
        RELEASE_STATUS=$(helm status cloud-secrets-manager -n "${NAMESPACE}" -o json 2>/dev/null | jq -r '.info.status' || echo "unknown")
        echo "   Status: ${RELEASE_STATUS}"
    else
        print_warning "Helm release 'cloud-secrets-manager' not found"
    fi
fi

# 4. Pod Status Check
print_header "4. Pod Status Verification"

POD_LIST=$(kubectl get pods -n "${NAMESPACE}" --no-headers 2>/dev/null || echo "")
POD_COUNT=$(echo "${POD_LIST}" | grep -v '^$' | wc -l || echo "0")

if [ "${POD_COUNT}" -gt 0 ]; then
    print_success "Found ${POD_COUNT} pod(s) in namespace"
    
    # Check each pod
    echo "${POD_LIST}" | while read -r line; do
        if [ -z "${line}" ]; then
            continue
        fi
        POD_NAME=$(echo "${line}" | awk '{print $1}')
        POD_STATUS=$(echo "${line}" | awk '{print $3}')
        READY=$(echo "${line}" | awk '{print $2}')
        
        if [ "${POD_STATUS}" = "Running" ] && [[ "${READY}" =~ ^[0-9]+/[0-9]+$ ]] && [[ "${READY}" =~ ^[0-9]+/[0-9]+$ ]]; then
            print_success "Pod '${POD_NAME}': ${POD_STATUS} (${READY} ready)"
        elif [ "${POD_STATUS}" = "Running" ]; then
            print_warning "Pod '${POD_NAME}': ${POD_STATUS} but not all containers ready (${READY})"
        else
            print_error "Pod '${POD_NAME}': ${POD_STATUS}"
        fi
    done
else
    print_error "No pods found in namespace"
fi

# 5. Security Context Verification
print_header "5. Pod Security Compliance Check"

POD_NAMES=$(kubectl get pods -n "${NAMESPACE}" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
if [ -z "${POD_NAMES}" ]; then
    print_warning "No pods found to check"
else
    for pod_name in ${POD_NAMES}; do
        if [ -z "${pod_name}" ]; then
            continue
        fi
        
        # Check pod-level security context
        POD_RUN_AS_NON_ROOT=$(kubectl get pod "${pod_name}" -n "${NAMESPACE}" -o jsonpath='{.spec.securityContext.runAsNonRoot}' 2>/dev/null || echo "false")
        POD_SECCOMP=$(kubectl get pod "${pod_name}" -n "${NAMESPACE}" -o jsonpath='{.spec.securityContext.seccompProfile.type}' 2>/dev/null || echo "none")
        
        # Check container-level security contexts
        CONTAINERS=$(kubectl get pod "${pod_name}" -n "${NAMESPACE}" -o jsonpath='{.spec.containers[*].name}' 2>/dev/null || echo "")
        COMPLIANT=true
        ISSUES=()
        
        for container_name in ${CONTAINERS}; do
            if [ -z "${container_name}" ]; then
                continue
            fi
            
            RUN_AS_NON_ROOT=$(kubectl get pod "${pod_name}" -n "${NAMESPACE}" -o jsonpath="{.spec.containers[?(@.name==\"${container_name}\")].securityContext.runAsNonRoot}" 2>/dev/null || echo "false")
            ALLOW_PRIV_ESC=$(kubectl get pod "${pod_name}" -n "${NAMESPACE}" -o jsonpath="{.spec.containers[?(@.name==\"${container_name}\")].securityContext.allowPrivilegeEscalation}" 2>/dev/null || echo "true")
            CAPS_DROP=$(kubectl get pod "${pod_name}" -n "${NAMESPACE}" -o jsonpath="{.spec.containers[?(@.name==\"${container_name}\")].securityContext.capabilities.drop[0]}" 2>/dev/null || echo "")
            SECCOMP=$(kubectl get pod "${pod_name}" -n "${NAMESPACE}" -o jsonpath="{.spec.containers[?(@.name==\"${container_name}\")].securityContext.seccompProfile.type}" 2>/dev/null || echo "none")
            
            if [ "${RUN_AS_NON_ROOT}" != "true" ]; then
                COMPLIANT=false
                ISSUES+=("${container_name}: runAsNonRoot=${RUN_AS_NON_ROOT}")
            fi
            if [ "${ALLOW_PRIV_ESC}" != "false" ]; then
                COMPLIANT=false
                ISSUES+=("${container_name}: allowPrivilegeEscalation=${ALLOW_PRIV_ESC}")
            fi
            if [ "${CAPS_DROP}" != "ALL" ]; then
                COMPLIANT=false
                ISSUES+=("${container_name}: capabilities.drop missing ALL")
            fi
            if [ "${SECCOMP}" != "RuntimeDefault" ]; then
                COMPLIANT=false
                ISSUES+=("${container_name}: seccompProfile=${SECCOMP}")
            fi
        done
        
        if [ "${COMPLIANT}" = "true" ]; then
            print_success "Pod '${pod_name}': Security context compliant"
        else
            print_warning "Pod '${pod_name}': Security context issues found"
            for issue in "${ISSUES[@]}"; do
                echo "   - ${issue}"
            done
        fi
    done
fi

# 6. Network Policies Check
print_header "6. Network Policies Verification"

NP_COUNT=$(kubectl get networkpolicies -n "${NAMESPACE}" --no-headers 2>/dev/null | wc -l || echo "0")
if [ "${NP_COUNT}" -gt 0 ]; then
    print_success "Found ${NP_COUNT} network policy/policies"
    kubectl get networkpolicies -n "${NAMESPACE}" --no-headers 2>/dev/null | while read -r line; do
        NP_NAME=$(echo "${line}" | awk '{print $1}')
        echo "   - ${NP_NAME}"
    done
else
    print_warning "No network policies found"
fi

# 7. Services Check
print_header "7. Services Verification"

SVC_COUNT=$(kubectl get services -n "${NAMESPACE}" --no-headers 2>/dev/null | wc -l || echo "0")
if [ "${SVC_COUNT}" -gt 0 ]; then
    print_success "Found ${SVC_COUNT} service(s)"
    kubectl get services -n "${NAMESPACE}" --no-headers 2>/dev/null | while read -r line; do
        SVC_NAME=$(echo "${line}" | awk '{print $1}')
        SVC_TYPE=$(echo "${line}" | awk '{print $2}')
        echo "   - ${SVC_NAME} (${SVC_TYPE})"
    done
else
    print_error "No services found"
fi

# 8. Secrets Check
print_header "8. Secrets Verification"

REQUIRED_SECRETS=("csm-db-secrets" "csm-app-config")
for secret in "${REQUIRED_SECRETS[@]}"; do
    if kubectl get secret "${secret}" -n "${NAMESPACE}" &>/dev/null; then
        print_success "Secret '${secret}' exists"
    else
        print_error "Required secret '${secret}' not found"
    fi
done

# 9. External Secrets Check
print_header "9. External Secrets Operator Check"

if kubectl get crd externalsecrets.external-secrets.io &>/dev/null; then
    print_success "External Secrets Operator CRD exists"
    
    ES_COUNT=$(kubectl get externalsecrets -n "${NAMESPACE}" --no-headers 2>/dev/null | wc -l || echo "0")
    if [ "${ES_COUNT}" -gt 0 ]; then
        print_success "Found ${ES_COUNT} ExternalSecret resource(s)"
    else
        print_warning "No ExternalSecret resources found"
    fi
else
    print_warning "External Secrets Operator not installed"
fi

# 10. Monitoring Check
print_header "10. Monitoring Configuration Check"

if kubectl get crd servicemonitors.monitoring.coreos.com &>/dev/null; then
    print_success "Prometheus Operator CRDs exist"
    
    SM_COUNT=$(kubectl get servicemonitors -n "${NAMESPACE}" --no-headers 2>/dev/null | wc -l || echo "0")
    if [ "${SM_COUNT}" -gt 0 ]; then
        print_success "Found ${SM_COUNT} ServiceMonitor(s)"
    else
        print_warning "No ServiceMonitors found"
    fi
    
    PR_COUNT=$(kubectl get prometheusrules -n "${NAMESPACE}" --no-headers 2>/dev/null | wc -l || echo "0")
    if [ "${PR_COUNT}" -gt 0 ]; then
        print_success "Found ${PR_COUNT} PrometheusRule(s)"
    else
        print_warning "No PrometheusRules found"
    fi
else
    print_warning "Prometheus Operator not installed"
fi

# 11. Application Health Check
print_header "11. Application Health Check"

SECRET_SVC_POD=$(kubectl get pods -n "${NAMESPACE}" -l app=secret-service -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "${SECRET_SVC_POD}" ]; then
    # Check if pod is ready
    READY=$(kubectl get pod "${SECRET_SVC_POD}" -n "${NAMESPACE}" -o jsonpath='{.status.containerStatuses[?(@.name=="secret-service")].ready}' 2>/dev/null || echo "false")
    if [ "${READY}" = "true" ]; then
        # Try to check health endpoint via port-forward (non-blocking)
        print_success "Secret Service pod is ready: ${SECRET_SVC_POD}"
        echo "   To test health endpoint, run:"
        echo "   kubectl port-forward -n ${NAMESPACE} svc/secret-service 8080:8080"
        echo "   curl http://localhost:8080/actuator/health"
    else
        print_warning "Secret Service pod not ready: ${SECRET_SVC_POD}"
    fi
else
    print_error "Secret Service pod not found"
fi

AUDIT_SVC_POD=$(kubectl get pods -n "${NAMESPACE}" -l app=audit-service -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "${AUDIT_SVC_POD}" ]; then
    READY=$(kubectl get pod "${AUDIT_SVC_POD}" -n "${NAMESPACE}" -o jsonpath='{.status.containerStatuses[?(@.name=="audit-service")].ready}' 2>/dev/null || echo "false")
    if [ "${READY}" = "true" ]; then
        print_success "Audit Service pod is ready: ${AUDIT_SVC_POD}"
    else
        print_warning "Audit Service pod not ready: ${AUDIT_SVC_POD}"
    fi
else
    print_error "Audit Service pod not found"
fi

# 12. Cloud SQL Proxy Check
print_header "12. Cloud SQL Proxy Verification"

ALL_PODS=$(kubectl get pods -n "${NAMESPACE}" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
CLOUD_SQL_FOUND=false

for pod_name in ${ALL_PODS}; do
    if [ -z "${pod_name}" ]; then
        continue
    fi
    # Check if pod has cloud-sql-proxy container
    HAS_PROXY=$(kubectl get pod "${pod_name}" -n "${NAMESPACE}" -o jsonpath='{.spec.containers[?(@.name=="cloud-sql-proxy")].name}' 2>/dev/null || echo "")
    if [ -n "${HAS_PROXY}" ]; then
        CLOUD_SQL_FOUND=true
        READY=$(kubectl get pod "${pod_name}" -n "${NAMESPACE}" -o jsonpath='{.status.containerStatuses[?(@.name=="cloud-sql-proxy")].ready}' 2>/dev/null || echo "false")
        if [ "${READY}" = "true" ]; then
            print_success "Cloud SQL Proxy running in pod: ${pod_name}"
        else
            print_warning "Cloud SQL Proxy not ready in pod: ${pod_name}"
        fi
    fi
done

if [ "${CLOUD_SQL_FOUND}" = "false" ]; then
    print_warning "No Cloud SQL Proxy containers found"
fi

# 13. Ingress Check
print_header "13. Ingress Verification"

INGRESS_COUNT=$(kubectl get ingress -n "${NAMESPACE}" --no-headers 2>/dev/null | wc -l || echo "0")
if [ "${INGRESS_COUNT}" -gt 0 ]; then
    print_success "Found ${INGRESS_COUNT} ingress resource(s)"
    kubectl get ingress -n "${NAMESPACE}" --no-headers 2>/dev/null | while read -r line; do
        ING_NAME=$(echo "${line}" | awk '{print $1}')
        ING_HOST=$(echo "${line}" | awk '{print $3}')
        echo "   - ${ING_NAME} (${ING_HOST})"
    done
    
    # Check for rate limiting annotations
    RATE_LIMIT_FOUND=false
    for ing_name in $(kubectl get ingress -n "${NAMESPACE}" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null); do
        RATE_LIMIT=$(kubectl get ingress "${ing_name}" -n "${NAMESPACE}" -o jsonpath='{.metadata.annotations.nginx\.ingress\.kubernetes\.io/limit-rps}' 2>/dev/null || echo "")
        if [ -n "${RATE_LIMIT}" ] && [ "${RATE_LIMIT}" != "<no value>" ]; then
            print_success "Rate limiting configured in '${ing_name}': ${RATE_LIMIT} req/sec"
            RATE_LIMIT_FOUND=true
            break
        fi
    done
    
    if [ "${RATE_LIMIT_FOUND}" = "false" ]; then
        print_warning "Rate limiting not configured in ingress (check Helm values.yaml)"
    fi
else
    print_warning "No ingress resources found"
fi

# 14. Workload Identity Verification
print_header "14. Workload Identity Verification"

SECRET_SA=$(kubectl get serviceaccount secret-service -n "${NAMESPACE}" -o jsonpath='{.metadata.annotations.iam\.gke\.io/gcp-service-account}' 2>/dev/null || echo "")
if [ -n "${SECRET_SA}" ]; then
    print_success "Secret Service Workload Identity configured: ${SECRET_SA}"
else
    print_warning "Secret Service Workload Identity not configured"
fi

AUDIT_SA=$(kubectl get serviceaccount audit-service -n "${NAMESPACE}" -o jsonpath='{.metadata.annotations.iam\.gke\.io/gcp-service-account}' 2>/dev/null || echo "")
if [ -n "${AUDIT_SA}" ]; then
    print_success "Audit Service Workload Identity configured: ${AUDIT_SA}"
else
    print_warning "Audit Service Workload Identity not configured"
fi

# 15. Rolling Update Status
print_header "15. Rolling Update Status"

OLD_PODS=$(kubectl get pods -n "${NAMESPACE}" -l app=secret-service --no-headers 2>/dev/null | wc -l || echo "0")
if [ "${OLD_PODS}" -gt 1 ]; then
    print_warning "Multiple secret-service pods detected (rolling update in progress)"
    echo "   This is normal during deployments. Old pods will be terminated once new ones are ready."
fi

OLD_AUDIT_PODS=$(kubectl get pods -n "${NAMESPACE}" -l app=audit-service --no-headers 2>/dev/null | wc -l || echo "0")
if [ "${OLD_AUDIT_PODS}" -gt 1 ]; then
    print_warning "Multiple audit-service pods detected (rolling update in progress)"
    echo "   This is normal during deployments. Old pods will be terminated once new ones are ready."
fi

# Summary
print_header "Verification Summary"

echo "✅ Passed:  ${PASSED}"
echo "❌ Failed:  ${FAILED}"
echo "⚠️  Warnings: ${WARNINGS}"
echo ""

# Additional recommendations
if [ "${FAILED}" -eq 0 ] && [ "${WARNINGS}" -gt 0 ]; then
    echo ""
    echo -e "${BLUE}📋 Recommendations:${NC}"
    
    # Check if pods are in rolling update
    OLD_PODS=$(kubectl get pods -n "${NAMESPACE}" -l app=secret-service --no-headers 2>/dev/null | wc -l || echo "0")
    if [ "${OLD_PODS}" -gt 1 ]; then
        echo "   - Wait for rolling update to complete: kubectl get pods -n ${NAMESPACE} -w"
    fi
    
    # Check security compliance
    NON_COMPLIANT=$(kubectl get pods -n "${NAMESPACE}" -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.securityContext.runAsNonRoot}{"\n"}{end}' 2>/dev/null | grep -v "true" | wc -l || echo "0")
    if [ "${NON_COMPLIANT}" -gt 0 ]; then
        echo "   - Some pods may not be fully security compliant. Check security contexts."
    fi
    
    echo ""
fi

if [ "${FAILED}" -eq 0 ]; then
    if [ "${WARNINGS}" -eq 0 ]; then
        echo -e "${GREEN}🎉 All checks passed! Deployment looks healthy.${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Deployment is functional but has some warnings.${NC}"
        echo ""
        echo "Next steps:"
        echo "  - Monitor pod status: kubectl get pods -n ${NAMESPACE} -w"
        echo "  - Check logs if issues persist: kubectl logs -n ${NAMESPACE} -l app=secret-service"
        echo "  - Review security contexts: kubectl describe pod <pod-name> -n ${NAMESPACE}"
        exit 0
    fi
else
    echo -e "${RED}❌ Some checks failed. Please review the errors above.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  - Check pod logs: kubectl logs -n ${NAMESPACE} <pod-name>"
    echo "  - Check pod events: kubectl describe pod <pod-name> -n ${NAMESPACE}"
    echo "  - Review deployment guide: docs/deployment/COMPLETE_DEPLOYMENT_GUIDE.md"
    exit 1
fi

