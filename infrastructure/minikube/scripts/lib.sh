#!/usr/bin/env bash
# Shared helpers for minikube setup scripts.
# Sourced, not executed.

set -euo pipefail

# Colors (disabled if not a TTY or NO_COLOR is set)
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  C_RESET='\033[0m'
  C_BOLD='\033[1m'
  C_BLUE='\033[34m'
  C_GREEN='\033[32m'
  C_YELLOW='\033[33m'
  C_RED='\033[31m'
else
  C_RESET='' C_BOLD='' C_BLUE='' C_GREEN='' C_YELLOW='' C_RED=''
fi

log::section() { printf "\n${C_BOLD}${C_BLUE}=== %s ===${C_RESET}\n" "$*"; }
log::info()    { printf "${C_BLUE}[INFO]${C_RESET}  %s\n" "$*"; }
log::ok()      { printf "${C_GREEN}[ OK ]${C_RESET}  %s\n" "$*"; }
log::warn()    { printf "${C_YELLOW}[WARN]${C_RESET}  %s\n" "$*"; }
log::err()     { printf "${C_RED}[FAIL]${C_RESET}  %s\n" "$*" >&2; }

require::cmd() {
  local missing=()
  for c in "$@"; do
    command -v "$c" >/dev/null 2>&1 || missing+=("$c")
  done
  if (( ${#missing[@]} > 0 )); then
    log::err "Missing required commands: ${missing[*]}"
    log::err "Install hint (macOS): brew install ${missing[*]}"
    exit 1
  fi
}

# Resolve repo root from script location (assumes script is in infrastructure/minikube/scripts/).
# Exports REPO_ROOT and MINIKUBE_DIR.
paths::resolve() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
  MINIKUBE_DIR="$(cd "${script_dir}/.." && pwd)"
  REPO_ROOT="$(cd "${MINIKUBE_DIR}/../.." && pwd)"
  export MINIKUBE_DIR REPO_ROOT
}

# Minikube profile/context
export MINIKUBE_PROFILE="${MINIKUBE_PROFILE:-minikube}"
KUBECTL=(kubectl --context="${MINIKUBE_PROFILE}")
export KUBECTL
