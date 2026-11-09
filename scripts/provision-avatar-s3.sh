#!/usr/bin/env bash
# Aprovisiona los buckets S3 privados de AcademiX (prod y test) para fotos de perfil
# (avatars/) y archivos académicos (academic/materials/), con un usuario IAM de mínimo
# privilegio por bucket. Idempotente: se puede re-ejecutar para aplicar cambios.
#
# Uso:
#   AWS_PROFILE=<perfil-admin> scripts/provision-avatar-s3.sh [--suffix dvillasc] [--region us-east-1] [--yes]
# Guías: docs/planning/perfiles/operacion-s3.md y docs/planning/academic-files/s3.md
#
# Requisitos: AWS CLI v2 y un perfil con permisos para S3 e IAM (no uses la cuenta root).
# Las access keys nuevas se guardan en ~/.config/academix/s3-<env>.env (permisos 600);
# nunca se imprimen en pantalla. Bórralas de ahí después de cargarlas en Render/gestor.
set -euo pipefail

SUFFIX="dvillasc"
REGION="us-east-1"
ASSUME_YES=false
SECRETS_DIR="${HOME}/.config/academix"
TAGS='Key=Project,Value=academix Key=Purpose,Value=private-files'
# Prefijos que el backend usa hoy. academic/submissions/ queda fuera hasta que exista código que lo use.
AVATAR_PREFIX="avatars/"
ACADEMIC_PREFIX="academic/materials/"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --suffix) SUFFIX="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --yes) ASSUME_YES=true; shift ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Argumento desconocido: $1" >&2; exit 2 ;;
  esac
done

export AWS_DEFAULT_REGION="$REGION" AWS_PAGER=""
log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
ok()   { printf '    \033[1;32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[1;33m!\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mError:\033[0m %s\n' "$*" >&2; exit 1; }

command -v aws >/dev/null || die "No se encontró la AWS CLI."
IDENTITY=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null) \
  || die "Credenciales AWS inválidas. Configura un perfil (aws configure / aws sso login) y usa AWS_PROFILE."
[[ "$IDENTITY" == *":root" ]] && die "Estás usando la cuenta root. Usa un usuario o rol administrador."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

ENVS=(prod test)
bucket_name() { echo "academix-avatars-$1-${SUFFIX}"; }
user_name()   { echo "academix-backend-$1"; }

echo
echo "Cuenta:   ${ACCOUNT_ID}"
echo "Identidad: ${IDENTITY}"
echo "Región:   ${REGION}"
for env in "${ENVS[@]}"; do
  echo "  [$env] bucket s3://$(bucket_name "$env")  usuario IAM $(user_name "$env")"
done
echo "Secretos: ${SECRETS_DIR}/s3-<env>.env"
if ! $ASSUME_YES; then
  read -r -p "¿Continuar? [s/N] " answer
  [[ "$answer" =~ ^[sSyY]$ ]] || { echo "Cancelado."; exit 0; }
fi

ensure_bucket() {
  local env="$1" bucket; bucket=$(bucket_name "$env")
  log "Bucket s3://${bucket}"
  local head_err
  if head_err=$(aws s3api head-bucket --bucket "$bucket" --expected-bucket-owner "$ACCOUNT_ID" 2>&1); then
    ok "ya existe en esta cuenta"
  elif [[ "$head_err" == *"403"* || "$head_err" == *"Forbidden"* ]]; then
    die "El nombre ${bucket} pertenece a otra cuenta. Usa otro --suffix."
  else
    if [[ "$REGION" == "us-east-1" ]]; then
      aws s3api create-bucket --bucket "$bucket" --object-ownership BucketOwnerEnforced >/dev/null
    else
      aws s3api create-bucket --bucket "$bucket" --object-ownership BucketOwnerEnforced \
        --create-bucket-configuration "LocationConstraint=${REGION}" >/dev/null
    fi
    aws s3api wait bucket-exists --bucket "$bucket"
    ok "creado"
  fi

  aws s3api put-public-access-block --bucket "$bucket" --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
  ok "Block Public Access: las 4 opciones activas"

  aws s3api put-bucket-ownership-controls --bucket "$bucket" \
    --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'
  ok "ACLs deshabilitadas (BucketOwnerEnforced)"

  aws s3api put-bucket-encryption --bucket "$bucket" --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
  ok "Cifrado por defecto SSE-S3"

  aws s3api put-bucket-policy --bucket "$bucket" --policy "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DenyInsecureTransport",
    "Effect": "Deny",
    "Principal": "*",
    "Action": "s3:*",
    "Resource": ["arn:aws:s3:::${bucket}", "arn:aws:s3:::${bucket}/*"],
    "Condition": {"Bool": {"aws:SecureTransport": "false"}}
  }]
}
JSON
)"
  ok "Política: rechaza conexiones sin TLS"

  # shellcheck disable=SC2086
  aws s3api put-bucket-tagging --bucket "$bucket" \
    --tagging "TagSet=[{Key=Project,Value=academix},{Key=Purpose,Value=private-files},{Key=Environment,Value=${env}}]"

  if [[ "$env" == "test" ]]; then
    # La expiración se limita a avatars/: los archivos académicos tienen referencias en la DB
    # y su limpieza es academic:cleanup (docs/planning/academic-files/s3.md).
    aws s3api put-bucket-lifecycle-configuration --bucket "$bucket" --lifecycle-configuration "{
      \"Rules\": [{
        \"ID\": \"reset-test-avatars\",
        \"Status\": \"Enabled\",
        \"Filter\": {\"Prefix\": \"${AVATAR_PREFIX}\"},
        \"Expiration\": {\"Days\": 7}
      }, {
        \"ID\": \"abort-incomplete-uploads\",
        \"Status\": \"Enabled\",
        \"Filter\": {\"Prefix\": \"\"},
        \"AbortIncompleteMultipartUpload\": {\"DaysAfterInitiation\": 1}
      }]
    }"
    ok "Lifecycle: ${AVATAR_PREFIX} expira a los 7 días; ${ACADEMIC_PREFIX} no expira (solo test)"
  else
    aws s3api put-bucket-lifecycle-configuration --bucket "$bucket" --lifecycle-configuration '{
      "Rules": [{
        "ID": "abort-incomplete-uploads",
        "Status": "Enabled",
        "Filter": {"Prefix": ""},
        "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
      }]
    }'
    ok "Lifecycle: solo limpia subidas incompletas (los objetos no expiran)"
  fi
}

ensure_user() {
  local env="$1" bucket user; bucket=$(bucket_name "$env"); user=$(user_name "$env")
  log "Usuario IAM ${user}"
  if aws iam get-user --user-name "$user" >/dev/null 2>&1; then
    ok "ya existe"
  else
    # shellcheck disable=SC2086
    aws iam create-user --user-name "$user" --tags $TAGS "Key=Environment,Value=${env}" >/dev/null
    ok "creado (sin acceso a consola)"
  fi

  local list_statement=""
  if [[ "$env" == "test" ]]; then
    # Solo test: permite probar accounts:cleanup y academic:cleanup. El servidor HTTP de prod no lista.
    list_statement=$(cat <<JSON
,
    {
      "Sid": "ListPrefixesForCleanup",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::${bucket}",
      "Condition": {"StringLike": {"s3:prefix": ["${AVATAR_PREFIX}*", "${ACADEMIC_PREFIX}*"]}}
    }
JSON
)
  fi

  # Declaraciones separadas por prefijo, como piden ambas guías.
  aws iam put-user-policy --user-name "$user" --policy-name academix-storage-objects --policy-document "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AvatarObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::${bucket}/${AVATAR_PREFIX}*"
    },
    {
      "Sid": "AcademicMaterials",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::${bucket}/${ACADEMIC_PREFIX}*"
    }${list_statement}
  ]
}
JSON
)"
  # Política inline de la versión anterior del script (solo avatars/); se retira tras aplicar la nueva.
  if aws iam get-user-policy --user-name "$user" --policy-name academix-avatar-objects >/dev/null 2>&1; then
    aws iam delete-user-policy --user-name "$user" --policy-name academix-avatar-objects
    ok "Política anterior academix-avatar-objects reemplazada"
  fi
  if [[ "$env" == "test" ]]; then ok "Política: Get/Put/Delete en ${AVATAR_PREFIX}* y ${ACADEMIC_PREFIX}* + ListBucket de ambos"
  else ok "Política: Get/Put/Delete en ${AVATAR_PREFIX}* y ${ACADEMIC_PREFIX}*"; fi

  local key_count secrets_file="${SECRETS_DIR}/s3-${env}.env"
  key_count=$(aws iam list-access-keys --user-name "$user" --query 'length(AccessKeyMetadata)' --output text)
  if [[ "$key_count" != "0" ]]; then
    warn "ya tiene ${key_count} access key(s); no se crea otra."
    [[ -f "$secrets_file" ]] || warn "No existe ${secrets_file}. Si perdiste el secreto, borra la key en IAM y re-ejecuta."
    return
  fi

  mkdir -p "$SECRETS_DIR"; chmod 700 "$SECRETS_DIR"
  local key_json key_id key_secret
  key_json=$(aws iam create-access-key --user-name "$user" \
    --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text)
  read -r key_id key_secret <<<"$key_json"
  (
    umask 077
    cat >"$secrets_file" <<ENV
# AcademiX private storage (${env}). Creado $(date -u +%Y-%m-%dT%H:%M:%SZ). NO versionar.
AVATAR_STORAGE_DRIVER=s3
ACADEMIC_STORAGE_DRIVER=s3
AWS_REGION=${REGION}
S3_AVATAR_BUCKET=${bucket}
S3_ACADEMIC_BUCKET=${bucket}
AWS_ACCESS_KEY_ID=${key_id}
AWS_SECRET_ACCESS_KEY=${key_secret}
ENV
  )
  ok "Access key creada y guardada en ${secrets_file}"
}

smoke_test() {
  local env="$1" secrets_file="${SECRETS_DIR}/s3-${env}.env"
  log "Prueba con las credenciales de ${env}"
  [[ -f "$secrets_file" ]] || { warn "sin ${secrets_file}; se omite la prueba."; return; }
  (
    set -a; # shellcheck disable=SC1090
    source "$secrets_file"; set +a
    unset AWS_PROFILE AWS_SESSION_TOKEN
    # Los .env creados por la versión anterior no traen S3_ACADEMIC_BUCKET: es el mismo bucket.
    local bucket="${S3_AVATAR_BUCKET}" tmp zero="00000000-0000-4000-8000-000000000000"
    uuid() { cat /proc/sys/kernel/random/uuid; }
    tmp=$(mktemp); trap 'rm -f "$tmp" "$tmp.out"' EXIT
    printf 'academix-smoke-test' >"$tmp"

    # Sube, lee y borra como el backend (SSE-S3 + If-None-Match). Reintenta por propagación de IAM.
    roundtrip() {
      local label="$1" key="$2" attempt
      for attempt in $(seq 1 15); do
        if aws s3api put-object --bucket "$bucket" --key "$key" --body "$tmp" \
             --server-side-encryption AES256 --if-none-match '*' >/dev/null 2>&1; then break; fi
        [[ "$attempt" == 15 ]] && { warn "${label}: PutObject sigue fallando tras 45 s; revisa la política."; exit 1; }
        sleep 3
      done
      aws s3api get-object --bucket "$bucket" --key "$key" "$tmp.out" >/dev/null
      aws s3api delete-object --bucket "$bucket" --key "$key" >/dev/null
      ok "${label}: PutObject, GetObject y DeleteObject"
    }
    denied_put() {
      local label="$1" key="$2"
      if aws s3api put-object --bucket "$bucket" --key "$key" --body "$tmp" \
           --server-side-encryption AES256 >/dev/null 2>&1; then
        aws s3api delete-object --bucket "$bucket" --key "$key" >/dev/null 2>&1 || true
        warn "¡Pudo escribir en ${label}! Revisa la política."
      else ok "Escritura en ${label} rechazada"; fi
    }

    roundtrip "${AVATAR_PREFIX}" "${AVATAR_PREFIX}${zero}/$(uuid).webp"
    roundtrip "${ACADEMIC_PREFIX}" "${ACADEMIC_PREFIX}${zero}/${zero}/$(uuid)"
    denied_put "la raíz del bucket" "fuera-de-prefijo.txt"
    denied_put "academic/submissions/ (aún no habilitado)" "academic/submissions/${zero}/${zero}/$(uuid)"
    if [[ "$env" == "prod" ]]; then
      if aws s3api list-objects-v2 --bucket "$bucket" --prefix "${ACADEMIC_PREFIX}" >/dev/null 2>&1; then
        warn "¡prod puede listar el bucket! Revisa la política."
      else ok "ListBucket rechazado en prod"; fi
    else
      aws s3api list-objects-v2 --bucket "$bucket" --prefix "${ACADEMIC_PREFIX}" --max-items 1 >/dev/null \
        && ok "ListBucket de ${ACADEMIC_PREFIX} permitido en test (academic:cleanup)"
    fi
  )
}

for env in "${ENVS[@]}"; do ensure_bucket "$env"; done
for env in "${ENVS[@]}"; do ensure_user "$env"; done
for env in "${ENVS[@]}"; do smoke_test "$env"; done

echo
log "Listo. Próximos pasos:"
echo "  1. Render (academix-backend → Environment, 'Save only'): copia AWS_ACCESS_KEY_ID y"
echo "     AWS_SECRET_ACCESS_KEY desde ${SECRETS_DIR}/s3-prod.env."
echo "  2. render.yaml declara AWS_REGION, S3_AVATAR_BUCKET y S3_ACADEMIC_BUCKET: confirma que"
echo "     coincidan con ${REGION} y $(bucket_name prod); si usaste otro --suffix o región, actualízalo."
echo "     Re-ejecutar el script actualiza políticas sin crear keys nuevas: Render no cambia."
echo "  3. Entrega ${SECRETS_DIR}/s3-test.env al equipo de desarrollo por un canal seguro."
echo "  4. Cuando estén cargados, borra los .env de ${SECRETS_DIR}."
