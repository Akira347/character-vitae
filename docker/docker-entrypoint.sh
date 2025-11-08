#!/usr/bin/env bash
set -euo pipefail

mkdir -p config/jwt

# If secret is base64-encoded, decode; otherwise use raw text.
write_key() {
  local envname="$1"
  local dest="$2"
  if [ -z "${!envname:-}" ]; then
    return 0
  fi

  # Detect if looks like base64 (no newlines and only base64 charset) - heuristic
  if printf '%s' "${!envname}" | grep -Eq '^[A-Za-z0-9+/=]{100,}$'; then
    printf '%s' "${!envname}" | base64 -d > "$dest"
  else
    printf '%s\n' "${!envname}" > "$dest"
  fi

  # permissions
  if [[ "$dest" =~ private ]]; then
    chmod 600 "$dest"
  else
    chmod 644 "$dest"
  fi
}

write_key "JWT_PRIVATE_KEY" "config/jwt/private.pem"
write_key "JWT_PUBLIC_KEY"  "config/jwt/public.pem"

# ensure APP_SECRET exists (optional fallback)
if [ -z "${APP_SECRET:-}" ]; then
  echo "Warning: APP_SECRET not set (should be set as a secret)"
fi

# Only run console commands if bin/console exists and vendor is present
if [ -x "./bin/console" ] && [ -d "./vendor" ]; then
  # wait a bit (optional) for environment to be fully ready
  echo "Running runtime Symfony maintenance tasks..."

  # ensure directories exist and are writable by www-data
  mkdir -p var/cache var/log var/sessions
  chown -R www-data:www-data var vendor public || true
  chmod -R 775 var || true

  # cache clear & warmup (ignore failure to avoid breaking the container)
  php bin/console cache:clear --no-warmup --no-interaction --env=prod || true
  php bin/console cache:warmup --env=prod || true

  # If the www-data user exists, warmup cache as www-data; otherwise do it as root.
  if id www-data >/dev/null 2>&1; then
    # run cache warmup as www-data so generated files are owned by www-data
    runuser -u www-data -- php bin/console cache:warmup --env=prod --no-interaction || true
  else
    php bin/console cache:warmup --env=prod --no-interaction || true
  fi

  # Ensure ownership/permissions are correct (entrypoint runs as root)
  chown -R www-data:www-data var
  find var -type d -exec chmod 2775 {} \;
  find var -type f -exec chmod 664 {} \;

  set -e
  mkdir -p /srv/app/var/cache /srv/app/var/log
  chown -R www-data:www-data /srv/app/var
  chmod -R u+rwX /srv/app/var
  chmod 1777 /tmp
  # warmup as root then chown (ou run as www-data if possible)
  php /srv/app/bin/console cache:clear --env=prod --no-warmup || true
  php /srv/app/bin/console cache:warmup --env=prod || true
  chown -R www-data:www-data /srv/app/var

  # Optionally run doctrine migrations if you want automatic migrations (careful)
  # if [ -n "${DATABASE_URL:-}" ]; then
  #   php bin/console doctrine:migrations:migrate --no-interaction || true
  # fi
fi

exec "$@"
