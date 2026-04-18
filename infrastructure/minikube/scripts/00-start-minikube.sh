#!/usr/bin/env bash
# Stage 0: start minikube, enable required addons, create namespaces.
# Idempotent: safe to re-run.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"
paths::resolve

CPUS="${CPUS:-4}"
MEMORY="${MEMORY:-8192}"
DRIVER="${DRIVER:-docker}"
K8S_VERSION="${K8S_VERSION:-v1.30.0}"

log::section "Prerequisites"
require::cmd minikube kubectl helm docker
log::ok "minikube $(minikube version --short 2>/dev/null | head -1)"
log::ok "kubectl $(kubectl version --client -o json 2>/dev/null | grep -oE '"gitVersion": "[^"]+"' | head -1 | cut -d'"' -f4)"
log::ok "helm $(helm version --short 2>/dev/null)"

log::section "Starting minikube profile '${MINIKUBE_PROFILE}'"
if minikube -p "${MINIKUBE_PROFILE}" status --format '{{.Host}}' 2>/dev/null | grep -q Running; then
  log::info "Already running — skipping start."
else
  minikube start \
    -p "${MINIKUBE_PROFILE}" \
    --cpus="${CPUS}" \
    --memory="${MEMORY}" \
    --driver="${DRIVER}" \
    --kubernetes-version="${K8S_VERSION}"
fi

log::section "Enabling addons"
for addon in storage-provisioner default-storageclass ingress metrics-server; do
  if minikube -p "${MINIKUBE_PROFILE}" addons list -o json 2>/dev/null | grep -q "\"${addon}\".*\"enabled\""; then
    log::info "${addon}: already enabled"
  else
    minikube -p "${MINIKUBE_PROFILE}" addons enable "${addon}"
    log::ok "${addon}: enabled"
  fi
done

log::section "Waiting for ingress-nginx controller"
"${KUBECTL[@]}" -n ingress-nginx rollout status deploy/ingress-nginx-controller --timeout=180s

log::section "Creating namespaces"
"${KUBECTL[@]}" apply -f "${MINIKUBE_DIR}/manifests/namespaces.yaml"

log::section "Cluster summary"
"${KUBECTL[@]}" get nodes
MINIKUBE_IP=$(minikube -p "${MINIKUBE_PROFILE}" ip)
log::ok "Minikube IP: ${MINIKUBE_IP}"

cat <<EOF

${C_BOLD}Next:${C_RESET}
  1. Add to /etc/hosts (needs sudo):
       echo '${MINIKUBE_IP} csm.local grafana.local prometheus.local alertmanager.local' | sudo tee -a /etc/hosts
  2. Build and load images:
       ./01-build-images.sh
EOF
