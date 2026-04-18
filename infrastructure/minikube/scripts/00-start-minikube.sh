#!/usr/bin/env bash
# Stage 0: start minikube, enable required addons, create namespaces.
# Idempotent: safe to re-run.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"
paths::resolve

CPUS="${CPUS:-4}"
# MEMORY auto-detected below from Docker Desktop allocation. Override with MEMORY=6144.
MEMORY="${MEMORY:-}"
DRIVER="${DRIVER:-docker}"
# K8S_VERSION: unset by default so we don't force a downgrade on an existing
# profile. Set explicitly (e.g. K8S_VERSION=v1.30.0) if you need a specific one.
K8S_VERSION="${K8S_VERSION:-}"

# Pick a minikube memory value that fits in Docker Desktop's allocation.
# Leaves 512MB headroom and caps at 8192MB (enough for the full stack).
memory::auto_detect() {
  [[ -n "${MEMORY}" ]] && return 0  # explicit override wins
  local docker_mem_bytes docker_mem_mb target
  if ! docker_mem_bytes=$(docker info --format '{{.MemTotal}}' 2>/dev/null); then
    MEMORY="6144"
    return 0
  fi
  docker_mem_mb=$(( docker_mem_bytes / 1024 / 1024 ))
  target=$(( docker_mem_mb - 512 ))
  (( target > 8192 )) && target=8192
  (( target < 3072 )) && target=3072
  MEMORY="${target}"

  if (( docker_mem_mb < 4096 )); then
    log::warn "Docker Desktop has only ${docker_mem_mb}MB. Full stack (app + monitoring) may OOM."
    log::warn "Bump Docker Desktop -> Settings -> Resources -> Memory to 6GB+ for best results."
  elif (( docker_mem_mb < 6144 )); then
    log::warn "Docker Desktop has ${docker_mem_mb}MB. Monitoring stack may be tight."
    log::warn "Recommend bumping Docker Desktop memory to 6GB+ before running 04-deploy-monitoring.sh."
  fi
}

log::section "Prerequisites"
require::cmd minikube kubectl helm docker
log::ok "minikube $(minikube version --short 2>/dev/null | head -1)"
log::ok "kubectl $(kubectl version --client -o json 2>/dev/null | grep -oE '"gitVersion": "[^"]+"' | head -1 | cut -d'"' -f4)"
log::ok "helm $(helm version --short 2>/dev/null)"

log::section "Starting minikube profile '${MINIKUBE_PROFILE}'"
memory::auto_detect
log::info "cpus=${CPUS} memory=${MEMORY}MB driver=${DRIVER}"
if minikube -p "${MINIKUBE_PROFILE}" status --format '{{.Host}}' 2>/dev/null | grep -q Running; then
  log::info "Already running — skipping start."
else
  START_ARGS=(-p "${MINIKUBE_PROFILE}" --cpus="${CPUS}" --memory="${MEMORY}" --driver="${DRIVER}")
  if [[ -n "${K8S_VERSION}" ]]; then
    START_ARGS+=(--kubernetes-version="${K8S_VERSION}")
    log::info "Pinning Kubernetes to ${K8S_VERSION}"
  else
    log::info "Using minikube's default Kubernetes version (override with K8S_VERSION=vX.Y.Z)"
  fi
  minikube start "${START_ARGS[@]}"
fi

log::section "Enabling addons"
# minikube addons enable is idempotent; calling it unconditionally is both
# simpler and more reliable than parsing addons list output.
for addon in storage-provisioner default-storageclass ingress metrics-server; do
  minikube -p "${MINIKUBE_PROFILE}" addons enable "${addon}" 2>&1 | tail -3 || true
done

log::section "Waiting for ingress-nginx controller"
# The ingress addon creates its own namespace asynchronously. Wait for it first.
for _ in $(seq 1 30); do
  "${KUBECTL[@]}" get namespace ingress-nginx >/dev/null 2>&1 && break
  sleep 2
done
if ! "${KUBECTL[@]}" get namespace ingress-nginx >/dev/null 2>&1; then
  log::err "ns/ingress-nginx never appeared — ingress addon failed to enable"
  exit 1
fi
# Wait for the controller Deployment to exist, then for its rollout.
for _ in $(seq 1 30); do
  "${KUBECTL[@]}" -n ingress-nginx get deploy ingress-nginx-controller >/dev/null 2>&1 && break
  sleep 2
done
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
