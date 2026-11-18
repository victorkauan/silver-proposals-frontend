#!/usr/bin/env bash
# Runs the Playwright suite in the official image, inside the API container's network namespace,
# so that "localhost:8000" is the Compose API and the app is served from "localhost:5173" as in CI.
set -euo pipefail

api_container="${E2E_API_CONTAINER:-silver-proposals-api-1}"
image="mcr.microsoft.com/playwright:v1.65.1-noble"

if ! docker inspect -f '{{.State.Running}}' "$api_container" 2>/dev/null | grep -q true; then
  echo "The API container '$api_container' is not running. Start the backend with Docker Compose first." >&2
  exit 1
fi

docker run --rm \
  --network "container:$api_container" \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -e CI="${CI:-}" \
  -v "$PWD":/work \
  -w /work \
  "$image" \
  npx playwright test "$@"
