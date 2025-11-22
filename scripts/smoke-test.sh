#!/bin/bash

###############################################################################
# Smoke Test Script
# 
# This script performs basic smoke tests against the deployed application
# to verify that critical endpoints are responding correctly.
#
# Usage: ./scripts/smoke-test.sh <environment>
#   environment: dev, staging, or production
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
TIMEOUT=30
MAX_RETRIES=5
RETRY_DELAY=10

# Environment-specific configurations
case $ENVIRONMENT in
  dev)
    BASE_URL="http://secrets-dev.yourdomain.com"
    NAMESPACE="cloud-secrets-manager"
    ;;
  staging)
    BASE_URL="https://secrets-staging.yourdomain.com"
    NAMESPACE="cloud-secrets-manager"
    ;;
  production)
    BASE_URL="https://secrets.yourdomain.com"
    NAMESPACE="cloud-secrets-manager"
    ;;
  *)
    echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'${NC}"
    echo "Usage: $0 <dev|staging|production>"
    exit 1
    ;;
esac

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Running Smoke Tests for: $ENVIRONMENT${NC}"
echo -e "${YELLOW}Base URL: $BASE_URL${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Function to print test result
print_result() {
  local test_name=$1
  local status=$2
  local message=$3
  
  if [ "$status" == "PASS" ]; then
    echo -e "${GREEN}✓${NC} $test_name: ${GREEN}PASS${NC}"
  elif [ "$status" == "SKIP" ]; then
    echo -e "${YELLOW}⊘${NC} $test_name: ${YELLOW}SKIP${NC} - $message"
  else
    echo -e "${RED}✗${NC} $test_name: ${RED}FAIL${NC} - $message"
  fi
}

# Function to test HTTP endpoint with retries
test_endpoint() {
  local name=$1
  local url=$2
  local expected_status=$3
  local retry_count=0
  
  while [ $retry_count -lt $MAX_RETRIES ]; do
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    
    if [ "$response" == "$expected_status" ]; then
      print_result "$name" "PASS"
      return 0
    fi
    
    retry_count=$((retry_count + 1))
    if [ $retry_count -lt $MAX_RETRIES ]; then
      echo -e "${YELLOW}  Retry $retry_count/$MAX_RETRIES for $name (got $response, expected $expected_status)${NC}"
      sleep $RETRY_DELAY
    fi
  done
  
  print_result "$name" "FAIL" "Expected status $expected_status, got $response"
  return 1
}

# Function to test Kubernetes resources
test_k8s_resources() {
  echo -e "${YELLOW}Checking Kubernetes resources...${NC}"
  
  # Check if kubectl is available
  if ! command -v kubectl &> /dev/null; then
    print_result "Kubectl availability" "SKIP" "kubectl not available"
    return
  fi
  
  # Check deployments
  secret_service_ready=$(kubectl get deployment secret-service -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
  secret_service_desired=$(kubectl get deployment secret-service -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
  
  if [ "$secret_service_ready" == "$secret_service_desired" ] && [ "$secret_service_ready" != "0" ]; then
    print_result "Secret Service Deployment" "PASS"
  else
    print_result "Secret Service Deployment" "FAIL" "Ready: $secret_service_ready, Desired: $secret_service_desired"
  fi
  
  audit_service_ready=$(kubectl get deployment audit-service -n $NAMESPACE -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
  audit_service_desired=$(kubectl get deployment audit-service -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
  
  if [ "$audit_service_ready" == "$audit_service_desired" ] && [ "$audit_service_ready" != "0" ]; then
    print_result "Audit Service Deployment" "PASS"
  else
    print_result "Audit Service Deployment" "FAIL" "Ready: $audit_service_ready, Desired: $audit_service_desired"
  fi
  
  echo ""
}

# Track overall test status
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Test Kubernetes resources (if kubectl is available)
test_k8s_resources

# Test 1: Secret Service Health Check
echo -e "${YELLOW}Testing Secret Service endpoints...${NC}"
if test_endpoint "Secret Service Health" "${BASE_URL}/api/secrets/actuator/health" "200"; then
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 2: Audit Service Health Check
echo -e "${YELLOW}Testing Audit Service endpoints...${NC}"
if test_endpoint "Audit Service Health" "${BASE_URL}/api/audit/actuator/health" "200"; then
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 3: Secret Service API - Unauthorized access (should return 401 or 403)
# This tests that authentication is enforced
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "${BASE_URL}/api/secrets/v1/secrets" 2>/dev/null || echo "000")
if [ "$response" == "401" ] || [ "$response" == "403" ]; then
  print_result "Secret Service Authentication" "PASS"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  print_result "Secret Service Authentication" "FAIL" "Expected 401/403, got $response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 4: Audit Service API - Unauthorized access
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "${BASE_URL}/api/audit/v1/events" 2>/dev/null || echo "000")
if [ "$response" == "401" ] || [ "$response" == "403" ]; then
  print_result "Audit Service Authentication" "PASS"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  print_result "Audit Service Authentication" "FAIL" "Expected 401/403, got $response"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 5: Check response times
echo ""
echo -e "${YELLOW}Testing response times...${NC}"
response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "${BASE_URL}/api/secrets/actuator/health" 2>/dev/null || echo "999")
response_time_ms=$(echo "$response_time * 1000" | bc)
if (( $(echo "$response_time < 2.0" | bc -l) )); then
  print_result "Secret Service Response Time" "PASS"
  echo "  Response time: ${response_time_ms} ms"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  print_result "Secret Service Response Time" "FAIL" "Response time too slow: ${response_time_ms} ms"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Summary
echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Smoke Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}Skipped: $TESTS_SKIPPED${NC}"
echo ""

if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}Smoke tests FAILED!${NC}"
  exit 1
else
  echo -e "${GREEN}All smoke tests PASSED!${NC}"
  exit 0
fi

