#!/usr/bin/env bash
set -euo pipefail

# ---- utils -----------------------------------------------------------------
write_key() {
  local envname="$1"
  local dest="$2"
  if [ -z "${!envname:-}" ]; then
    return 0
  fi
  if printf '%s' "${!envname}" | grep -Eq '^[A-Za-z0-9+/=[:space:]]{100,}$'; then
    # base64-style content -> decode
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

# ---- create dirs & perms --------------------------------------------------
mkdir -p /srv/app/var/cache /srv/app/var/log /srv/app/var/sessions /srv/app/config/jwt
chmod 1777 /tmp || true

# ensure ownership and perms (may be overridden by Dockerfile user)
chown -R www-data:www-data /srv/app || true
chmod -R u+rwX /srv/app/var || true
find /srv/app/var -type d -exec chmod 2775 {} \; || true
find /srv/app/var -type f -exec chmod 664 {} \; || true

# ---- JWT keys --------------------------------------------------------------
write_key "JWT_PRIVATE_KEY" "/srv/app/config/jwt/private.pem"
write_key "JWT_PUBLIC_KEY" "/srv/app/config/jwt/public.pem"

# if keys exist in mounted repo, ensure perms
if [ -f /srv/app/config/jwt/private.pem ]; then
  chown www-data:www-data /srv/app/config/jwt/private.pem || true
  chmod 600 /srv/app/config/jwt/private.pem || true
fi
if [ -f /srv/app/config/jwt/public.pem ]; then
  chown www-data:www-data /srv/app/config/jwt/public.pem || true
  chmod 644 /srv/app/config/jwt/public.pem || true
fi

# ---- Build MAILER_DSN from SMTP_* if provided (Render secrets) -------------
# Priority: if MAILER_DSN already set externally, keep it.
if [ -z "${MAILER_DSN:-}" ] ; then
  if [ -n "${SMTP_HOST:-}" ] && [ -n "${SMTP_PORT:-}" ]; then
    # encode user and password safely with PHP urlencode
    PHP_URL_ENC_USER=''
    PHP_URL_ENC_PASS=''
    if [ -n "${SMTP_USER:-}" ]; then
      PHP_URL_ENC_USER=$(php -r 'echo rawurlencode(getenv("SMTP_USER") ?: "");')
    fi
    if [ -n "${SMTP_PASSWORD:-}" ]; then
      PHP_URL_ENC_PASS=$(php -r 'echo rawurlencode(getenv("SMTP_PASSWORD") ?: "");')
    fi

    # choose scheme: smtps for port 465, smtp otherwise
    if [ "${SMTP_PORT}" = "465" ]; then
      SCHEME="smtps"
    else
      SCHEME="smtp"
    fi

    # construct userinfo only if user provided
    if [ -n "$PHP_URL_ENC_USER" ]; then
      if [ -n "$PHP_URL_ENC_PASS" ]; then
        USERINFO="${PHP_URL_ENC_USER}:${PHP_URL_ENC_PASS}@"
      else
        USERINFO="${PHP_URL_ENC_USER}@"
      fi
    else
      USERINFO=""
    fi

    MAILER_DSN="${SCHEME}://${USERINFO}${SMTP_HOST}:${SMTP_PORT}"
    # optional extra params (auth_mode / encryption) if you want to force:
    # ex: MAILER_DSN="${MAILER_DSN}?encryption=ssl&auth_mode=login"
    export MAILER_DSN
    echo "MAILER_DSN constructed from SMTP_* (hidden) and exported."
  fi
else
  echo "MAILER_DSN already set externally, keeping it."
fi

# ---- Symfony cache warmup (optional) --------------------------------------
if [ -x "/srv/app/bin/console" ] && [ -d "/srv/app/vendor" ]; then
  echo "Running Symfony cache clear & maybe warmup..."
  php /srv/app/bin/console cache:clear --no-warmup --env=prod --no-interaction || true

  if [ "${SKIP_CACHE_WARMUP:-0}" = "1" ]; then
    echo "SKIP_CACHE_WARMUP=1 -> skipping cache:warmup"
  else
    php /srv/app/bin/console cache:warmup --env=prod --no-interaction || {
      echo "Warning: cache:warmup failed, continuing container start"
    }
  fi

  chown -R www-data:www-data /srv/app/var || true
  find /srv/app/var -type d -exec chmod 2775 {} \; || true
  find /srv/app/var -type f -exec chmod 664 {} \; || true
fi

# ---- finally exec CMD passed by Dockerfile / docker-compose --------------
exec "$@"
