#!/bin/bash

###############################################################################
# Security Test Script
#
# Tests security hardening implementations:
# - Rate limiting
# - Network policies
# - Pod security
# - Token blacklisting
# - Security headers
#
# Usage: ./scripts/security-test.sh <environment>
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ENVIRONMENT=${1:-staging}

case $ENVIRONMENT in
  dev)
    BASE_URL="http://secrets-dev.yourdomain.com"
    ;;
  staging)
    BASE_URL="https://secrets-staging.yourdomain.com"
    ;;
  production)
    BASE_URL="https://secrets.yourdomain.com"
    ;;
  *)
    echo -e "${RED}Invalid environment${NC}"
    exit 1
    ;;
esac

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Security Tests - $ENVIRONMENT${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $2"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗${NC} $2"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Test 1: Rate Limiting
echo -e "${YELLOW}Test 1: Rate Limiting${NC}"
echo "Making 110 requests to trigger rate limit..."

rate_limit_triggered=0
for i in {1..110}; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/secrets/actuator/health" 2>/dev/null || echo "000")
  if [ "$response" == "429" ]; then
    rate_limit_triggered=1
    echo "Rate limit triggered at request $i"
    break
  fi
done

if [ $rate_limit_triggered -eq 1 ]; then
  print_result 0 "Rate limiting is working (429 received)"
else
  print_result 1 "Rate limiting not triggered after 110 requests"
fi

echo ""

# Test 2: Security Headers
echo -e "${YELLOW}Test 2: Security Headers${NC}"

headers=$(curl -sI "$BASE_URL/api/secrets/actuator/health")

check_header() {
  header=$1
  if echo "$headers" | grep -q "$header"; then
    print_result 0 "Header present: $header"
  else
    print_result 1 "Header missing: $header"
  fi
}

check_header "X-Content-Type-Options"
check_header "X-Frame-Options"
check_header "X-XSS-Protection"

echo ""

# Test 3: Pod Security (requires kubectl)
if command -v kubectl &> /dev/null; then
  echo -e "${YELLOW}Test 3: Pod Security Contexts${NC}"
  
  # Check if pods are running as non-root
  secret_pod=$(kubectl get pods -n cloud-secrets-manager -l app=secret-service -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
  
  if [ -n "$secret_pod" ]; then
    run_as_user=$(kubectl get pod "$secret_pod" -n cloud-secrets-manager -o jsonpath='{.spec.securityContext.runAsUser}' 2>/dev/null || echo "")
    
    if [ "$run_as_user" != "0" ] && [ -n "$run_as_user" ]; then
      print_result 0 "Pod running as non-root user (UID: $run_as_user)"
    else
      print_result 1 "Pod may be running as root"
    fi
    
    # Check read-only root filesystem
    read_only_fs=$(kubectl get pod "$secret_pod" -n cloud-secrets-manager -o jsonpath='{.spec.containers[0].securityContext.readOnlyRootFilesystem}' 2>/dev/null || echo "")
    
    if [ "$read_only_fs" == "true" ]; then
      print_result 0 "Read-only root filesystem enabled"
    else
      print_result 1 "Root filesystem is writable"
    fi
  else
    echo "  Skipped (kubectl not available or no pods found)"
  fi
  
  echo ""
  
  # Test 4: Network Policies
  echo -e "${YELLOW}Test 4: Network Policies${NC}"
  
  network_policies=$(kubectl get networkpolicies -n cloud-secrets-manager --no-headers 2>/dev/null | wc -l)
  
  if [ "$network_policies" -gt 0 ]; then
    print_result 0 "Network policies configured ($network_policies policies)"
  else
    print_result 1 "No network policies found"
  fi
  
  echo ""
fi

# Test 5: HTTPS/TLS
echo -e "${YELLOW}Test 5: TLS/HTTPS${NC}"

if [[ "$BASE_URL" == https://* ]]; then
  tls_version=$(curl -sI "$BASE_URL/api/secrets/actuator/health" --tlsv1.2 -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
  
  if [ "$tls_version" == "200" ]; then
    print_result 0 "TLS 1.2+ supported"
  else
    print_result 1 "TLS 1.2+ not working"
  fi
else
  echo "  Skipped (HTTP endpoint)"
fi

echo ""

# Test 6: Authentication Required
echo -e "${YELLOW}Test 6: Authentication Required${NC}"

unauth_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/secrets/v1/secrets" 2>/dev/null || echo "000")

if [ "$unauth_response" == "401" ] || [ "$unauth_response" == "403" ]; then
  print_result 0 "Authentication required (got $unauth_response)"
else
  print_result 1 "No authentication required (got $unauth_response)"
fi

echo ""

# Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Security Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}Some security tests FAILED!${NC}"
  exit 1
else
  echo -e "${GREEN}All security tests PASSED!${NC}"
  exit 0
fi

