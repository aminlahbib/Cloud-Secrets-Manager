#!/usr/bin/env bash
# Stage 3: deploy Postgres + Helm release to ns/csm.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"
paths::resolve

require::cmd kubectl helm

RELEASE_NAME="${RELEASE_NAME:-csm}"
NAMESPACE="csm"
CHART_DIR="${REPO_ROOT}/infrastructure/helm/cloud-secrets-manager"
VALUES_FILE="${MINIKUBE_DIR}/values-minikube.yaml"

log::section "Pre-flight checks"
for secret in postgres-root db-secrets app-secrets; do
  if ! "${KUBECTL[@]}" -n "${NAMESPACE}" get secret "${secret}" >/dev/null 2>&1; then
    log::err "Missing secret/${secret}. Run ./02-bootstrap-secrets.sh first."
    exit 1
  fi
done
log::ok "All required secrets present"

log::section "Deploying Postgres StatefulSet"
"${KUBECTL[@]}" apply -f "${MINIKUBE_DIR}/manifests/postgres.yaml"
"${KUBECTL[@]}" -n "${NAMESPACE}" rollout status statefulset/postgres --timeout=180s
log::ok "Postgres ready"

log::section "Helm upgrade --install ${RELEASE_NAME}"
helm upgrade --install "${RELEASE_NAME}" "${CHART_DIR}" \
  --kube-context="${MINIKUBE_PROFILE}" \
  --namespace "${NAMESPACE}" \
  -f "${VALUES_FILE}" \
  --wait --timeout 5m

log::section "Rollout status"
for deploy in secret-service audit-service notification-service frontend; do
  "${KUBECTL[@]}" -n "${NAMESPACE}" rollout status "deploy/${deploy}" --timeout=120s
done

log::section "Cluster snapshot"
"${KUBECTL[@]}" -n "${NAMESPACE}" get pods,svc,ingress -o wide

MINIKUBE_IP=$(minikube -p "${MINIKUBE_PROFILE}" ip 2>/dev/null || echo "<minikube-ip>")

cat <<EOF

${C_BOLD}App is up.${C_RESET}

  Frontend:        http://csm.local              (or http://${MINIKUBE_IP})
  Secret API:      http://csm.local/api
  Audit API:       http://csm.local/api/audit
  Notification API: http://csm.local/api/notifications

${C_BOLD}/etc/hosts${C_RESET} entry required:
  ${MINIKUBE_IP} csm.local grafana.local prometheus.local alertmanager.local

Next: ./04-deploy-monitoring.sh
EOF
