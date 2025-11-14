#!/usr/bin/env bash
set -euo pipefail

# default port
: "${PORT:=8000}"

write_key() {
  local envname="$1"
  local dest="$2"
  if [ -z "${!envname:-}" ]; then
    return 0
  fi
  if printf '%s' "${!envname}" | grep -Eq '^[A-Za-z0-9+/=[:space:]]{100,}$'; then
    printf '%s' "${!envname}" | tr -d '\r' | base64 -d > "$dest"
  else
    printf '%s\n' "${!envname}" > "$dest"
  fi
  if [[ "$dest" =~ private ]]; then
    chmod 600 "$dest"
  else
    chmod 644 "$dest"
  fi
}

mkdir -p /srv/app/var/cache /srv/app/var/log /srv/app/config/jwt
write_key "JWT_PRIVATE_KEY" "/srv/app/config/jwt/private.pem"
write_key "JWT_PUBLIC_KEY" "/srv/app/config/jwt/public.pem"

# set perms
chown -R www-data:www-data /srv/app || true
chmod -R u+rwX /srv/app/var || true

# envsubst nginx conf in case PORT changed
envsubst '${PORT}' < /etc/nginx/sites-available/default > /etc/nginx/sites-available/default.tmp
mv /etc/nginx/sites-available/default.tmp /etc/nginx/sites-available/default

# clear/warmup cache for prod (best effort)
if [ -x /srv/app/bin/console ]; then
  php /srv/app/bin/console cache:clear --no-warmup --env=prod --no-interaction || true
  php /srv/app/bin/console cache:warmup --env=prod --no-interaction || true
  chown -R www-data:www-data /srv/app/var || true
fi

# Start php-fpm
php-fpm -D

# Start nginx in foreground (Render expects the container to keep running)
nginx -g 'daemon off;'
