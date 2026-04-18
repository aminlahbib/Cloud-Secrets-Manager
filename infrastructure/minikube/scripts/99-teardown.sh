#!/usr/bin/env bash
# Teardown the minikube setup. Safe to run multiple times.
#
# Default: uninstall Helm releases, delete ns/csm, ns/monitoring, ns/tracing.
# --nuke : also `minikube delete` the profile.
# --keep-secrets: keep the generated .secrets.env cache file.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"
paths::resolve

NUKE=false
KEEP_SECRETS=false
for arg in "$@"; do
  case "$arg" in
    --nuke)          NUKE=true ;;
    --keep-secrets)  KEEP_SECRETS=true ;;
    -h|--help)
      cat <<EOF
Usage: $0 [--nuke] [--keep-secrets]

  --nuke            Also run 'minikube delete -p ${MINIKUBE_PROFILE}' (destroys the VM).
  --keep-secrets    Keep infrastructure/minikube/.secrets.env for reuse.
EOF
      exit 0 ;;
  esac
done

if ! minikube -p "${MINIKUBE_PROFILE}" status --format '{{.Host}}' 2>/dev/null | grep -q Running; then
  log::warn "minikube profile '${MINIKUBE_PROFILE}' is not running"
  if [[ "${NUKE}" == true ]]; then
    log::section "minikube delete"
    minikube delete -p "${MINIKUBE_PROFILE}" || true
  fi
  exit 0
fi

log::section "Uninstalling Helm releases"
helm uninstall csm        --kube-context="${MINIKUBE_PROFILE}" -n csm        2>/dev/null || true
helm uninstall prometheus --kube-context="${MINIKUBE_PROFILE}" -n monitoring 2>/dev/null || true
helm uninstall loki       --kube-context="${MINIKUBE_PROFILE}" -n monitoring 2>/dev/null || true

log::section "Deleting namespaces"
"${KUBECTL[@]}" delete namespace csm monitoring tracing --ignore-not-found --wait=false

if [[ "${KEEP_SECRETS}" == false && -f "${MINIKUBE_DIR}/.secrets.env" ]]; then
  log::info "Removing cached secrets file"
  rm -f "${MINIKUBE_DIR}/.secrets.env"
fi

if [[ "${NUKE}" == true ]]; then
  log::section "minikube delete (--nuke)"
  minikube delete -p "${MINIKUBE_PROFILE}"
  log::ok "minikube VM destroyed"
else
  log::ok "Cluster still running. Re-run ./03-deploy-app.sh to redeploy, or pass --nuke to delete the VM."
fi
