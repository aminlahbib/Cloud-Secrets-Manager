#!/bin/bash

###############################################################################
# Synthetic Load Test Script
#
# This script generates synthetic load against the Cloud Secrets Manager
# services to validate metrics collection, alerting, and SLO measurements.
#
# Usage: ./scripts/synthetic-load-test.sh <environment> [duration] [concurrency]
#   environment: dev, staging, or production
#   duration: test duration in seconds (default: 300)
#   concurrency: number of concurrent users (default: 10)
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
DURATION=${2:-300}  # 5 minutes default
CONCURRENCY=${3:-10}

# Environment-specific URLs
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
    echo -e "${RED}Error: Invalid environment '$ENVIRONMENT'${NC}"
    echo "Usage: $0 <dev|staging|production> [duration] [concurrency]"
    exit 1
    ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Synthetic Load Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Base URL: ${YELLOW}$BASE_URL${NC}"
echo -e "Duration: ${YELLOW}${DURATION}s${NC}"
echo -e "Concurrency: ${YELLOW}$CONCURRENCY${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if required tools are installed
command -v curl >/dev/null 2>&1 || { echo -e "${RED}Error: curl is required but not installed${NC}"; exit 1; }
command -v ab >/dev/null 2>&1 && HAS_AB=true || HAS_AB=false
command -v hey >/dev/null 2>&1 && HAS_HEY=true || HAS_HEY=false

if [ "$HAS_AB" = false ] && [ "$HAS_HEY" = false ]; then
    echo -e "${YELLOW}Warning: Neither 'ab' (Apache Bench) nor 'hey' is installed${NC}"
    echo -e "${YELLOW}Install one for better load testing:${NC}"
    echo -e "  ab: sudo apt-get install apache2-utils (Linux) or brew install ab (Mac)"
    echo -e "  hey: go install github.com/rakyll/hey@latest"
    echo ""
    echo -e "${YELLOW}Falling back to basic curl-based load testing${NC}"
    echo ""
fi

# Test authentication (get token)
echo -e "${BLUE}Step 1: Testing authentication...${NC}"
# Note: Adjust this based on your actual authentication mechanism
AUTH_TOKEN="test-token"  # Replace with actual token acquisition

# Function to make requests
make_request() {
    local endpoint=$1
    local method=${2:-GET}
    local status
    
    status=$(curl -s -o /dev/null -w "%{http_code}" \
        -X "$method" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        --max-time 30 \
        "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    
    echo "$status"
}

# Test endpoints
echo -e "${BLUE}Step 2: Testing endpoint availability...${NC}"

endpoints=(
    "/api/secrets/actuator/health"
    "/api/audit/actuator/health"
    "/api/secrets/actuator/prometheus"
    "/api/audit/actuator/prometheus"
)

for endpoint in "${endpoints[@]}"; do
    status=$(make_request "$endpoint")
    if [ "$status" == "200" ]; then
        echo -e "  ${GREEN}✓${NC} $endpoint: OK ($status)"
    else
        echo -e "  ${RED}✗${NC} $endpoint: FAILED ($status)"
    fi
done

echo ""
echo -e "${BLUE}Step 3: Running load test...${NC}"
echo ""

# Function to run load test with Apache Bench
run_load_test_ab() {
    local endpoint=$1
    local requests=$2
    local concurrency=$3
    
    echo -e "${YELLOW}Testing: $endpoint${NC}"
    ab -n "$requests" -c "$concurrency" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -q \
        "$BASE_URL$endpoint" 2>&1 | grep -E "Requests per second|Time per request|Percentage"
    echo ""
}

# Function to run load test with hey
run_load_test_hey() {
    local endpoint=$1
    local duration=$2
    local concurrency=$3
    
    echo -e "${YELLOW}Testing: $endpoint${NC}"
    hey -z "${duration}s" -c "$concurrency" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL$endpoint" 2>&1 | grep -E "Requests/sec|Latency distribution|Status code"
    echo ""
}

# Function to run basic load test with curl
run_load_test_curl() {
    local endpoint=$1
    local duration=$2
    local concurrency=$3
    
    echo -e "${YELLOW}Testing: $endpoint (basic curl test)${NC}"
    
    local end_time=$((SECONDS + duration))
    local request_count=0
    local success_count=0
    local error_count=0
    local total_time=0
    
    while [ $SECONDS -lt $end_time ]; do
        start=$(date +%s%N)
        status=$(make_request "$endpoint")
        end=$(date +%s%N)
        
        request_count=$((request_count + 1))
        duration_ms=$(((end - start) / 1000000))
        total_time=$((total_time + duration_ms))
        
        if [ "$status" == "200" ]; then
            success_count=$((success_count + 1))
        else
            error_count=$((error_count + 1))
        fi
        
        # Print progress every 10 requests
        if [ $((request_count % 10)) -eq 0 ]; then
            echo -ne "\r  Requests: $request_count | Success: $success_count | Errors: $error_count"
        fi
        
        # Small delay to prevent overwhelming
        sleep 0.1
    done
    
    echo ""
    avg_latency=$((total_time / request_count))
    success_rate=$((success_count * 100 / request_count))
    
    echo "  Total Requests: $request_count"
    echo "  Successful: $success_count (${success_rate}%)"
    echo "  Errors: $error_count"
    echo "  Avg Latency: ${avg_latency}ms"
    echo ""
}

# Run load tests
test_endpoints=(
    "/api/secrets/actuator/health"
    "/api/audit/actuator/health"
)

for endpoint in "${test_endpoints[@]}"; do
    if [ "$HAS_HEY" = true ]; then
        run_load_test_hey "$endpoint" "$DURATION" "$CONCURRENCY"
    elif [ "$HAS_AB" = true ]; then
        # Calculate total requests for ab
        requests=$((DURATION * CONCURRENCY))
        run_load_test_ab "$endpoint" "$requests" "$CONCURRENCY"
    else
        # Use basic curl test (reduced duration for basic test)
        test_duration=$((DURATION / 3))
        run_load_test_curl "$endpoint" "$test_duration" "$CONCURRENCY"
    fi
done

echo ""
echo -e "${BLUE}Step 4: Verify metrics collection...${NC}"
echo ""

# Check that Prometheus metrics are being collected
echo "Checking Prometheus metrics..."
metrics=$(curl -s "$BASE_URL/api/secrets/actuator/prometheus" | grep -E "http_server_requests|jvm_memory|hikaricp" | wc -l)
if [ "$metrics" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} Prometheus metrics are being exposed ($metrics metrics found)"
else
    echo -e "  ${RED}✗${NC} No Prometheus metrics found"
fi

echo ""
echo -e "${BLUE}Step 5: Check for alerts...${NC}"
echo ""

echo "Check Grafana dashboards to verify:"
echo "  1. Request rate increased during test"
echo "  2. Latency metrics are being recorded"
echo "  3. No alerts fired (unless testing alert thresholds)"
echo "  4. SLO compliance maintained"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Load test completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo "Next steps:"
echo "  1. Open Grafana: http://grafana.yourdomain.com"
echo "  2. View 'Cloud Secrets Manager - Overview & SLOs' dashboard"
echo "  3. Verify metrics show the test traffic"
echo "  4. Check that no alerts were triggered"
echo "  5. Review latency and error rate SLOs"
echo ""

echo "Prometheus queries to run:"
echo "  # Request rate:"
echo "  rate(http_server_requests_seconds_count[1m])"
echo ""
echo "  # Error rate:"
echo "  rate(http_server_requests_seconds_count{status=~\"5..\"}[1m])"
echo ""
echo "  # P95 latency:"
echo "  histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))"
echo ""

exit 0

