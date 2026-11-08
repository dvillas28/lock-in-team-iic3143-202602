#!/usr/bin/env bash
# Aprovisiona los buckets S3 privados de fotos de perfil de AcademiX (prod y test)
# y un usuario IAM de mínimo privilegio por bucket. Idempotente: se puede re-ejecutar.
# Guía, políticas y variables: docs/planning/perfiles/operacion-s3.md
#
# Uso:
#   AWS_PROFILE=<perfil-admin> scripts/provision-avatar-s3.sh [--suffix dvillasc] [--region us-east-1] [--yes]
#
# Requisitos: AWS CLI v2 y un perfil con permisos para S3 e IAM (no uses la cuenta root).
# Las access keys nuevas se guardan en ~/.config/academix/s3-<env>.env (permisos 600);
# nunca se imprimen en pantalla. Bórralas de ahí después de cargarlas en Render/gestor.
set -euo pipefail

SUFFIX="dvillasc"
REGION="us-east-1"
ASSUME_YES=false
SECRETS_DIR="${HOME}/.config/academix"
TAGS='Key=Project,Value=academix Key=Purpose,Value=profile-avatars'

while [[ $# -gt 0 ]]; do
  case "$1" in
    --suffix) SUFFIX="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --yes) ASSUME_YES=true; shift ;;
    -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
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
    --tagging "TagSet=[{Key=Project,Value=academix},{Key=Purpose,Value=profile-avatars},{Key=Environment,Value=${env}}]"

  if [[ "$env" == "test" ]]; then
    aws s3api put-bucket-lifecycle-configuration --bucket "$bucket" --lifecycle-configuration '{
      "Rules": [{
        "ID": "reset-test-avatars",
        "Status": "Enabled",
        "Filter": {"Prefix": ""},
        "Expiration": {"Days": 7},
        "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
      }]
    }'
    ok "Lifecycle: objetos expiran a los 7 días (solo test)"
  else
    aws s3api put-bucket-lifecycle-configuration --bucket "$bucket" --lifecycle-configuration '{
      "Rules": [{
        "ID": "abort-incomplete-uploads",
        "Status": "Enabled",
        "Filter": {"Prefix": ""},
        "AbortIncompleteMultipartUpload": {"DaysAfterInitiation": 1}
      }]
    }'
    ok "Lifecycle: solo limpia subidas incompletas (las fotos no expiran)"
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
    # Solo test: permite probar accounts:cleanup. El servidor HTTP de prod no lista.
    list_statement=$(cat <<JSON
,
    {
      "Sid": "ListAvatarPrefixForCleanup",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::${bucket}",
      "Condition": {"StringLike": {"s3:prefix": "avatars/*"}}
    }
JSON
)
  fi

  aws iam put-user-policy --user-name "$user" --policy-name academix-avatar-objects --policy-document "$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AvatarObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::${bucket}/avatars/*"
    }${list_statement}
  ]
}
JSON
)"
  if [[ "$env" == "test" ]]; then ok "Política: Get/Put/Delete en avatars/* + ListBucket del prefijo"
  else ok "Política: Get/Put/Delete en avatars/*"; fi

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
# AcademiX avatar storage (${env}). Creado $(date -u +%Y-%m-%dT%H:%M:%SZ). NO versionar.
AVATAR_STORAGE_DRIVER=s3
AWS_REGION=${REGION}
S3_AVATAR_BUCKET=${bucket}
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
    local key tmp attempt
    key="avatars/00000000-0000-4000-8000-000000000000/$(cat /proc/sys/kernel/random/uuid).webp"
    tmp=$(mktemp); trap 'rm -f "$tmp" "$tmp.out"' EXIT
    printf 'academix-smoke-test' >"$tmp"
    # Las keys nuevas pueden tardar unos segundos en propagarse.
    for attempt in $(seq 1 15); do
      if aws s3api put-object --bucket "$S3_AVATAR_BUCKET" --key "$key" --body "$tmp" \
           --server-side-encryption AES256 --if-none-match '*' >/dev/null 2>&1; then break; fi
      [[ "$attempt" == 15 ]] && { warn "PutObject sigue fallando tras 45 s; revisa la política."; exit 1; }
      sleep 3
    done
    ok "PutObject (con If-None-Match, como el backend)"
    aws s3api get-object --bucket "$S3_AVATAR_BUCKET" --key "$key" "$tmp.out" >/dev/null && ok "GetObject"
    aws s3api delete-object --bucket "$S3_AVATAR_BUCKET" --key "$key" >/dev/null && ok "DeleteObject"
    if aws s3api put-object --bucket "$S3_AVATAR_BUCKET" --key "fuera-de-prefijo.txt" --body "$tmp" >/dev/null 2>&1; then
      warn "¡Pudo escribir fuera de avatars/! Revisa la política."
    else ok "Escritura fuera de avatars/ rechazada"; fi
    if [[ "$env" == "prod" ]]; then
      if aws s3api list-objects-v2 --bucket "$S3_AVATAR_BUCKET" --prefix avatars/ >/dev/null 2>&1; then
        warn "¡prod puede listar el bucket! Revisa la política."
      else ok "ListBucket rechazado en prod"; fi
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
echo "  2. render.yaml declara AWS_REGION y S3_AVATAR_BUCKET: confirma que coincidan con"
echo "     ${REGION} y $(bucket_name prod); si usaste otro --suffix o región, actualízalo."
echo "  3. Entrega ${SECRETS_DIR}/s3-test.env al equipo de desarrollo por un canal seguro."
echo "  4. Cuando estén cargados, borra los .env de ${SECRETS_DIR}."
