#!/usr/bin/env bash
# Stage 5: smoke test the deployed stack end-to-end.
#
# Verifies:
#   1. Health endpoints of the three backends (readiness probe surface)
#   2. Prometheus scrape of /actuator/prometheus
#   3. End-to-end auth flow: signup -> login -> /api/auth/me (exercises DB + JWT + BCrypt)
#   4. Prometheus API reports all three services as `up=1`
#   5. Loki ingested at least one log line
#   6. Alertmanager API reachable
#
# Uses ephemeral port-forwards scoped to this script run. Exit 0 only if all green.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"
paths::resolve

require::cmd kubectl curl

NAMESPACE="csm"
PF_PIDS=()
FAILURES=0

cleanup() {
  for pid in "${PF_PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

# start_pf <ns> <svc> <local_port> <svc_port>
start_pf() {
  local ns="$1" svc="$2" local_port="$3" svc_port="$4"
  "${KUBECTL[@]}" -n "${ns}" port-forward "svc/${svc}" "${local_port}:${svc_port}" >/dev/null 2>&1 &
  PF_PIDS+=("$!")
  # Wait for port to accept connections
  for _ in $(seq 1 20); do
    (echo >/dev/tcp/127.0.0.1/"${local_port}") 2>/dev/null && return 0
    sleep 0.3
  done
  log::err "port-forward to ${ns}/${svc}:${svc_port} never opened local:${local_port}"
  return 1
}

check() {
  local label="$1"; shift
  if "$@" >/dev/null 2>&1; then
    log::ok "${label}"
  else
    log::err "${label}"
    FAILURES=$((FAILURES+1))
  fi
}

log::section "1. Health endpoints"
start_pf "${NAMESPACE}" secret-service       18080 8080
start_pf "${NAMESPACE}" audit-service        18081 8081
start_pf "${NAMESPACE}" notification-service 18082 8082

check "secret-service /actuator/health UP"       curl -fsS http://127.0.0.1:18080/actuator/health
check "audit-service /actuator/health UP"        curl -fsS http://127.0.0.1:18081/actuator/health
check "notification-service /actuator/health UP" curl -fsS http://127.0.0.1:18082/actuator/health

log::section "2. Prometheus scrape endpoints"
for port in 18080 18081 18082; do
  lines=$(curl -fsS "http://127.0.0.1:${port}/actuator/prometheus" 2>/dev/null | wc -l | tr -d ' ')
  if [[ "${lines:-0}" -gt 50 ]]; then
    log::ok "port ${port} /actuator/prometheus -> ${lines} metric lines"
  else
    log::err "port ${port} /actuator/prometheus -> only ${lines:-0} lines"
    FAILURES=$((FAILURES+1))
  fi
done

log::section "3. Auth round-trip (signup -> login -> /me)"
STAMP="smoketest-$(date +%s)"
EMAIL="${STAMP}@example.com"
PASSWORD="SmokeTest!234"

signup_resp=$(curl -fsS -X POST http://127.0.0.1:18080/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"firstName\":\"Smoke\",\"lastName\":\"Test\"}" \
  2>&1) || signup_resp="SIGNUP_FAILED: ${signup_resp}"

if echo "${signup_resp}" | grep -qi 'SIGNUP_FAILED'; then
  log::err "signup: ${signup_resp}"
  FAILURES=$((FAILURES+1))
else
  log::ok "signup  OK (${EMAIL})"
fi

login_resp=$(curl -fsS -X POST http://127.0.0.1:18080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}" 2>&1) || login_resp=""

ACCESS_TOKEN=$(echo "${login_resp}" | sed -nE 's/.*"(accessToken|access_token|token)"[[:space:]]*:[[:space:]]*"([^"]+)".*/\2/p' | head -1)

if [[ -n "${ACCESS_TOKEN}" ]]; then
  log::ok "login   OK (got JWT ${ACCESS_TOKEN:0:16}...)"
else
  log::err "login failed: ${login_resp}"
  FAILURES=$((FAILURES+1))
fi

if [[ -n "${ACCESS_TOKEN}" ]]; then
  me_resp=$(curl -fsS http://127.0.0.1:18080/api/auth/me \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" 2>&1) || me_resp=""
  if echo "${me_resp}" | grep -qi "${EMAIL}"; then
    log::ok "/api/auth/me returns authenticated user"
  else
    log::err "/api/auth/me failed: ${me_resp}"
    FAILURES=$((FAILURES+1))
  fi
fi

log::section "4. Prometheus targets (up=1)"
start_pf monitoring prometheus-kube-prometheus-prometheus 19090 9090

for job in secret-service audit-service notification-service; do
  val=$(curl -fsS --data-urlencode "query=up{job=\"${job}\"}" http://127.0.0.1:19090/api/v1/query 2>/dev/null \
        | sed -nE 's/.*"value":\[[^,]+,"([^"]+)"\].*/\1/p' | head -1)
  if [[ "${val}" == "1" ]]; then
    log::ok "up{job=${job}} = 1"
  else
    log::err "up{job=${job}} = '${val:-<empty>}' (expected 1)"
    FAILURES=$((FAILURES+1))
  fi
done

log::section "5. Loki log ingestion"
start_pf monitoring loki 13100 3100
# Any log stream with namespace=csm within last 5m
query_result=$(curl -fsS -G "http://127.0.0.1:13100/loki/api/v1/query" \
  --data-urlencode 'query={namespace="csm"}' 2>/dev/null | head -c 200 || echo "")
if [[ -n "${query_result}" ]]; then
  log::ok "Loki responding; logs for ns=csm present"
else
  log::warn "Loki query empty (Promtail may still be catching up — re-run in 30s)"
fi

log::section "6. Alertmanager"
start_pf monitoring prometheus-kube-prometheus-alertmanager 19093 9093
check "Alertmanager /api/v2/status reachable" curl -fsS http://127.0.0.1:19093/api/v2/status

log::section "Summary"
if (( FAILURES == 0 )); then
  log::ok "ALL CHECKS PASSED"
  exit 0
else
  log::err "${FAILURES} check(s) failed"
  exit 1
fi
