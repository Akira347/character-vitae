#!/usr/bin/env bash
set -euo pipefail

# 1) Make dirs and set sane perms
mkdir -p /srv/app/var/cache /srv/app/var/log /srv/app/var/sessions /srv/app/config/jwt
chmod 1777 /tmp || true

# Ensure app dirs exist and are writable by www-data (we're root in entrypoint)
chown -R www-data:www-data /srv/app || true
chmod -R u+rwX /srv/app/var || true
find /srv/app/var -type d -exec chmod 2775 {} \; || true
find /srv/app/var -type f -exec chmod 664 {} \; || true

# 2) Write jwt keys if present (keep your existing logic, simplified)
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

# 3) If console exists, clear & warmup cache then chown
if [ -x "/srv/app/bin/console" ] && [ -d "/srv/app/vendor" ]; then
  echo "Running Symfony cache clear & warmup (as root then chown)..."

  # clear then warmup (ignore failures so container still starts)
  php /srv/app/bin/console cache:clear --no-warmup --env=prod --no-interaction || true
  php /srv/app/bin/console cache:warmup --env=prod --no-interaction || true

  # Force ownership to www-data for everything under var
  chown -R www-data:www-data /srv/app/var || true
  find /srv/app/var -type d -exec chmod 2775 {} \; || true
  find /srv/app/var -type f -exec chmod 664 {} \; || true
fi

# 4) Finally exec the CMD (php-fpm + nginx)
exec "$@"
