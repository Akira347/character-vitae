#!/usr/bin/env bash
set -euo pipefail

# make dirs
mkdir -p /srv/app/var/cache /srv/app/var/log /srv/app/var/sessions /srv/app/config/jwt
chmod 1777 /tmp || true

# ensure ownership and perms
chown -R www-data:www-data /srv/app || true
chmod -R u+rwX /srv/app/var || true
find /srv/app/var -type d -exec chmod 2775 {} \; || true
find /srv/app/var -type f -exec chmod 664 {} \; || true

# write jwt keys if present (keeps your logic)
write_key() {
  local envname="$1"
  local dest="$2"
  if [ -z "${!envname:-}" ]; then
    return 0
  fi
  if printf '%s' "${!envname}" | grep -Eq '^[A-Za-z0-9+/=]{100,}$'; then
    printf '%s' "${!envname}" | base64 -d > "$dest"
  else
    printf '%s\n' "${!envname}" > "$dest"
  fi
  if [[ "$dest" =~ private ]]; then
    chmod 600 "$dest"
  else
    chmod 644 "$dest"
  fi
}
write_key "JWT_PRIVATE_KEY" "/srv/app/config/jwt/private.pem"
write_key "JWT_PUBLIC_KEY"  "/srv/app/config/jwt/public.pem"

# If Symfony exists, clear & warmup cache - warmup is optional via SKIP_CACHE_WARMUP
if [ -x "/srv/app/bin/console" ] && [ -d "/srv/app/vendor" ]; then
  echo "Running Symfony cache clear & maybe warmup..."
  php /srv/app/bin/console cache:clear --no-warmup --env=prod --no-interaction || true

  if [ "${SKIP_CACHE_WARMUP:-0}" = "1" ]; then
    echo "SKIP_CACHE_WARMUP=1 -> skipping cache:warmup (useful in local tests)"
  else
    # try warmup but don't fail container if DB unreachable
    php /srv/app/bin/console cache:warmup --env=prod --no-interaction || {
      echo "Warning: cache:warmup failed, continuing container start"
    }
  fi

  chown -R www-data:www-data /srv/app/var || true
  find /srv/app/var -type d -exec chmod 2775 {} \; || true
  find /srv/app/var -type f -exec chmod 664 {} \; || true
fi

# finally exec CMD
exec "$@"
