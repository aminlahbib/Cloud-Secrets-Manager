#!/usr/bin/env bash
# Stage 1: build all four app images and load them into the minikube cluster.
# Use --skip-build to only reload already-built images.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"
paths::resolve

SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    -h|--help)
      cat <<EOF
Usage: $0 [--skip-build]

Env overrides:
  IMAGE_TAG          (default: minikube)
  FRONTEND_API_BASE  (default: http://csm.local) — baked into Vite build
EOF
      exit 0 ;;
  esac
done

IMAGE_TAG="${IMAGE_TAG:-minikube}"
FRONTEND_API_BASE="${FRONTEND_API_BASE:-http://csm.local}"

require::cmd docker minikube

if ! minikube -p "${MINIKUBE_PROFILE}" status --format '{{.Host}}' 2>/dev/null | grep -q Running; then
  log::err "minikube profile '${MINIKUBE_PROFILE}' is not running. Run ./00-start-minikube.sh first."
  exit 1
fi

# service_name : dockerfile (relative to REPO_ROOT) : build_context (relative to REPO_ROOT)
declare -a SERVICES=(
  "secret-service:apps/backend/secret-service/Dockerfile:."
  "audit-service:apps/backend/audit-service/Dockerfile:."
  "notification-service:apps/backend/notification-service/Dockerfile:."
  "frontend:apps/frontend/Dockerfile:apps/frontend"
)

cd "${REPO_ROOT}"

for entry in "${SERVICES[@]}"; do
  IFS=':' read -r name dockerfile context <<<"$entry"
  image="${name}:${IMAGE_TAG}"

  log::section "Building ${image}"
  if [[ "${SKIP_BUILD}" == true ]]; then
    log::info "skip-build: reusing existing image"
  else
    if [[ "${name}" == "frontend" ]]; then
      docker build \
        --build-arg "VITE_API_BASE_URL=${FRONTEND_API_BASE}" \
        --build-arg "VITE_SECRET_SERVICE_URL=${FRONTEND_API_BASE}" \
        --build-arg "VITE_AUDIT_SERVICE_URL=${FRONTEND_API_BASE}" \
        --build-arg "VITE_NOTIFICATION_SERVICE_URL=${FRONTEND_API_BASE}" \
        -t "${image}" \
        -f "${dockerfile}" \
        "${context}"
    else
      docker build -t "${image}" -f "${dockerfile}" "${context}"
    fi
    log::ok "built ${image}"
  fi

  log::section "Loading ${image} into minikube"
  minikube -p "${MINIKUBE_PROFILE}" image load "${image}" --overwrite=true
  log::ok "loaded ${image}"
done

log::section "Images in cluster"
minikube -p "${MINIKUBE_PROFILE}" image ls | grep -E "(secret-service|audit-service|notification-service|frontend):${IMAGE_TAG}" || true

log::ok "All images ready. Next: ./02-bootstrap-secrets.sh"
