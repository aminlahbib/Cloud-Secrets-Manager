#!/usr/bin/env bash
# Stage 4: deploy Prometheus + Grafana + Alertmanager + Loki + Promtail + Tempo
# into the minikube cluster, then wire in ServiceMonitors, PrometheusRules, and
# the CSM Grafana dashboards.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"
paths::resolve

require::cmd kubectl helm

GRAFANA_PASSWORD="${GRAFANA_ADMIN_PASSWORD:-admin}"
MONITORING_DIR="${REPO_ROOT}/infrastructure/monitoring"
MINIKUBE_MONITORING_DIR="${MINIKUBE_DIR}/monitoring"

log::section "Helm repos"
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts >/dev/null 2>&1 || true
helm repo add grafana https://grafana.github.io/helm-charts >/dev/null 2>&1 || true
helm repo update >/dev/null

log::section "Installing kube-prometheus-stack (ns: monitoring)"
# serviceMonitorSelectorNilUsesHelmValues=false -> Prometheus picks up ServiceMonitors
# from any namespace regardless of the 'release' label (critical for our custom SMs).
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --kube-context="${MINIKUBE_PROFILE}" \
  --namespace monitoring \
  --create-namespace \
  --set grafana.adminPassword="${GRAFANA_PASSWORD}" \
  --set grafana.persistence.enabled=false \
  --set grafana.service.type=NodePort \
  --set grafana.sidecar.dashboards.enabled=true \
  --set grafana.sidecar.dashboards.label=grafana_dashboard \
  --set prometheus.prometheusSpec.retention=24h \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.podMonitorSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.ruleSelectorNilUsesHelmValues=false \
  --set prometheus.prometheusSpec.resources.requests.memory=256Mi \
  --set prometheus.prometheusSpec.resources.limits.memory=1Gi \
  --set alertmanager.enabled=true \
  --set alertmanager.alertmanagerSpec.resources.requests.memory=64Mi \
  --wait --timeout 10m

log::section "Installing loki-stack (ns: monitoring)"
helm upgrade --install loki grafana/loki-stack \
  --kube-context="${MINIKUBE_PROFILE}" \
  --namespace monitoring \
  --set loki.persistence.enabled=false \
  --set promtail.enabled=true \
  --set grafana.enabled=false \
  --wait --timeout 5m

log::section "Deploying Grafana Tempo (ns: tracing)"
"${KUBECTL[@]}" apply -f "${MONITORING_DIR}/tracing/tempo-deployment.yaml"
"${KUBECTL[@]}" -n tracing rollout status deploy/tempo --timeout=180s

log::section "Applying minikube ServiceMonitors"
"${KUBECTL[@]}" apply -f "${MINIKUBE_MONITORING_DIR}/servicemonitors.yaml"

log::section "Applying PrometheusRule alerts"
"${KUBECTL[@]}" apply -f "${MONITORING_DIR}/alerts/prometheus-rules.yaml"

log::section "Applying Grafana dashboard ConfigMaps"
for cm in "${MONITORING_DIR}"/grafana/*.yaml; do
  # Move dashboards into the monitoring ns and add the sidecar label.
  "${KUBECTL[@]}" apply -n monitoring -f "${cm}"
  cm_name=$(grep -m1 '^  name:' "${cm}" | awk '{print $2}')
  if [[ -n "${cm_name}" ]]; then
    "${KUBECTL[@]}" -n monitoring label configmap "${cm_name}" grafana_dashboard=1 --overwrite >/dev/null
  fi
done

log::section "Waiting for targets"
"${KUBECTL[@]}" -n monitoring rollout status deploy/prometheus-grafana --timeout=180s
"${KUBECTL[@]}" -n monitoring rollout status statefulset/prometheus-prometheus-kube-prometheus-prometheus --timeout=180s || true

log::section "Access URLs"
GRAFANA_PORT=$("${KUBECTL[@]}" -n monitoring get svc prometheus-grafana -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "")
MINIKUBE_IP=$(minikube -p "${MINIKUBE_PROFILE}" ip 2>/dev/null || echo "<minikube-ip>")

cat <<EOF

${C_BOLD}Monitoring up.${C_RESET}

  Grafana      http://${MINIKUBE_IP}:${GRAFANA_PORT:-<nodeport>}   login: admin / ${GRAFANA_PASSWORD}
  Prometheus   kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
  Alertmanager kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-alertmanager 9093:9093
  Tempo        kubectl port-forward -n tracing   svc/tempo 3200:3200

Next: ./05-smoke-test.sh
EOF
