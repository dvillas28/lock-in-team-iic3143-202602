#!/usr/bin/env bash
# Replica .github/workflows/sonarqube-manual.yml en local. Uso: sonar-local.sh <repo> <out_dir>
set -euo pipefail
REPO=$(realpath "$1"); OUT=$(realpath -m "$2"); mkdir -p "$OUT"
HERE=$(dirname "$(realpath "$0")")
export SONAR_HOST_URL=http://127.0.0.1:9000 SONAR_PROJECT_KEY=ci-project SONAR_IMAGE=sonarqube:26.10.0.133078-community
cleanup() { docker rm -f --volumes sonarqube-local sonar-pg-local >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup
# Disco del host sobre 90%: Elasticsearch no crea índices, así que sus datos van en memoria.
docker run -d --name sonarqube-local -p 127.0.0.1:9000:9000 --tmpfs /opt/sonarqube/data:rw,size=3g,uid=1000,gid=0,mode=0775 --ulimit nofile=131072:131072 --ulimit nproc=8192:8192 "$SONAR_IMAGE" >/dev/null
docker run -d --name sonar-pg-local -e POSTGRES_DB=academix_test -e POSTGRES_HOST_AUTH_METHOD=trust -p 127.0.0.1:55432:5432 postgres:17-alpine >/dev/null
for i in $(seq 1 30); do docker exec sonar-pg-local pg_isready -U postgres -d academix_test -q && break; sleep 1; done

cd "$REPO"
if [ -z "${SKIP_COVERAGE:-}" ]; then
rm -rf backend/coverage frontend/coverage
echo ">> backend coverage"
TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/academix_test \
TEST_RUNTIME_DATABASE_URL=postgresql://academix_runtime:ci_runtime@127.0.0.1:55432/academix_test \
  pnpm --dir backend test:coverage > "$OUT/../backend-coverage.log" 2>&1 || { tail -40 "$OUT/../backend-coverage.log"; exit 1; }
test -s backend/coverage/lcov.info
sed -i 's|^SF:src/|SF:backend/src/|' backend/coverage/lcov.info
echo ">> frontend coverage"
mkdir -p frontend/coverage
TSX_TSCONFIG_PATH=frontend/tsconfig.json frontend/node_modules/.bin/c8 --all --src frontend/src --reporter=text --reporter=lcov \
  --reports-dir=frontend/coverage node --import ./frontend/node_modules/tsx/dist/loader.mjs --test frontend/test/*.test.ts \
  > "$OUT/../frontend-coverage.log" 2>&1 || { tail -40 "$OUT/../frontend-coverage.log"; exit 1; }
test -s frontend/coverage/lcov.info
fi

echo ">> bootstrap"
SONAR_TOKEN=$(python3 "$HERE/sonar-api.py" bootstrap); export SONAR_TOKEN; test -n "$SONAR_TOKEN"
echo ">> scan"
docker run --rm --network host -v "$REPO:/usr/src" -w /usr/src sonarsource/sonar-scanner-cli:latest \
  -Dsonar.projectKey=ci-project -Dsonar.host.url=$SONAR_HOST_URL -Dsonar.token=$SONAR_TOKEN \
  -Dsonar.scanner.metadataFilePath=/usr/src/.sonar-report-task.txt > "$OUT/../scanner.log" 2>&1 || { tail -40 "$OUT/../scanner.log"; exit 1; }
echo ">> export"
SHA=$(git rev-parse HEAD) python3 "$HERE/sonar-api.py" export "$REPO/.sonar-report-task.txt" "$OUT"
rm -f "$REPO/.sonar-report-task.txt"; rm -rf "$REPO/.scannerwork"
docker logs sonarqube-local > "$OUT/server.log" 2>&1
