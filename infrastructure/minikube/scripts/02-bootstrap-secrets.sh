#!/usr/bin/env bash
# Stage 2: bootstrap Kubernetes secrets the Helm chart and Postgres init script expect.
#
# Creates 3 Secrets in ns/csm:
#   - postgres-root : Postgres superuser password (used by the StatefulSet)
#   - db-secrets    : secrets-user/password and audit-user/password
#   - app-secrets   : jwt-secret, aes-key (exactly 32 chars for AES-256), audit-api-key
#
# Passwords are generated once and cached in infrastructure/minikube/.secrets.env
# so re-runs are idempotent (re-applies identical values). Delete that file to
# force regeneration.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "${SCRIPT_DIR}/lib.sh"
paths::resolve

require::cmd kubectl openssl

SECRETS_ENV="${MINIKUBE_DIR}/.secrets.env"
NAMESPACE="csm"

log::section "Generating or loading secrets from ${SECRETS_ENV}"
if [[ -f "${SECRETS_ENV}" ]]; then
  log::info "Reusing cached secrets (delete ${SECRETS_ENV} to regenerate)"
  # shellcheck disable=SC1090
  source "${SECRETS_ENV}"
else
  POSTGRES_ROOT_PASSWORD="$(openssl rand -hex 16)"
  SECRETS_USER="secret_user"
  SECRETS_PASSWORD="$(openssl rand -hex 16)"
  AUDIT_USER="audit_user"
  AUDIT_PASSWORD="$(openssl rand -hex 16)"
  JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
  # AES-256: must be exactly 32 chars for AesEncryptionService (key length check).
  AES_KEY="$(openssl rand -hex 16)"
  AUDIT_API_KEY="$(openssl rand -hex 16)"

  umask 077
  cat >"${SECRETS_ENV}" <<EOF
# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ). Do NOT commit.
POSTGRES_ROOT_PASSWORD='${POSTGRES_ROOT_PASSWORD}'
SECRETS_USER='${SECRETS_USER}'
SECRETS_PASSWORD='${SECRETS_PASSWORD}'
AUDIT_USER='${AUDIT_USER}'
AUDIT_PASSWORD='${AUDIT_PASSWORD}'
JWT_SECRET='${JWT_SECRET}'
AES_KEY='${AES_KEY}'
AUDIT_API_KEY='${AUDIT_API_KEY}'
EOF
  log::ok "Cached new secrets to ${SECRETS_ENV} (mode 0600)"
fi

# Sanity check: AES-256 key MUST be exactly 32 bytes
if [[ ${#AES_KEY} -ne 32 ]]; then
  log::err "AES_KEY length is ${#AES_KEY}, expected 32. AesEncryptionService will reject this."
  exit 1
fi

log::section "Applying secrets to ns/${NAMESPACE}"

apply_secret() {
  local name="$1"; shift
  "${KUBECTL[@]}" -n "${NAMESPACE}" create secret generic "${name}" "$@" \
    --dry-run=client -o yaml | "${KUBECTL[@]}" apply -f -
  log::ok "secret/${name}"
}

apply_secret postgres-root \
  --from-literal=password="${POSTGRES_ROOT_PASSWORD}"

apply_secret db-secrets \
  --from-literal=secrets-user="${SECRETS_USER}" \
  --from-literal=secrets-password="${SECRETS_PASSWORD}" \
  --from-literal=audit-user="${AUDIT_USER}" \
  --from-literal=audit-password="${AUDIT_PASSWORD}"

apply_secret app-secrets \
  --from-literal=jwt-secret="${JWT_SECRET}" \
  --from-literal=aes-key="${AES_KEY}" \
  --from-literal=audit-api-key="${AUDIT_API_KEY}"

log::section "Result"
"${KUBECTL[@]}" -n "${NAMESPACE}" get secrets postgres-root db-secrets app-secrets

log::ok "Secrets ready. Next: ./03-deploy-app.sh"
