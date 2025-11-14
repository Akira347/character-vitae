FROM php:8.3-fpm

# Installe les extensions nécessaires pour Symfony + PostgreSQL
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    curl \
  && docker-php-ext-install pdo pdo_pgsql mbstring xml \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN set -eux; \
  groupadd -g 1000 www-data || true; \
  useradd -u 1000 -g 1000 -M -r -s /usr/sbin/nologin www-data || true;

# Copie le www.conf personnalisé pour PHP-FPM
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf

# Installe Composer (pré-copié depuis l'image composer)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /srv/app
