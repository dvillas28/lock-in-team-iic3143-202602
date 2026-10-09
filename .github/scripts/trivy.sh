#!/usr/bin/env bash
# Runs Trivy from its official image, pinned by digest so a retagged image cannot change what CI runs.
# Mounts the repo at /src (the working directory), the Docker socket for image scans and the DB cache.
set -euo pipefail

# aquasec/trivy:0.75.0
image="aquasec/trivy@sha256:af6acf9a6b85dfe389a1941505c0ce9efef52a4719635e1a962f022a3d855daa"
cache="$HOME/.cache/trivy"
mkdir -p "$cache"

exec docker run --rm \
  -v "$(git rev-parse --show-toplevel):/src" -w /src \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$cache:/root/.cache/trivy" \
  "$image" "$@"
