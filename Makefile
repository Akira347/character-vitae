SHELL := /usr/bin/env bash

# Détermine la racine du Makefile (chemin absolu)
ROOT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

# Utilise une mini-fonction pour exécuter dans la racine
define in_root
	cd $(ROOT_DIR) && $(1)
endef

MAKE := make
FRONT_DIR := front

.PHONY: cs test stan fix ci front-lint front-build front-format-check fix-front fix-back front-dev

## Back end
test:
	@echo "▶️  Lancer PHPUnit (dans container app)"
	@$(call in_root,docker compose exec -e APP_ENV=test -e SYMFONY_DEPRECATIONS_HELPER=disabled app bash -lc "cd /srv/app && php bin/console cache:clear --env=test || true; php bin/console doctrine:database:drop --env=test --force --if-exists || true; php bin/console doctrine:database:create --env=test; php bin/console doctrine:migrations:migrate --env=test --no-interaction; ./vendor/bin/phpunit -c phpunit.xml")

cs:
	@echo "▶️  Lancer PHP CS Fixer"
	@$(call in_root,vendor/bin/php-cs-fixer fix --diff --dry-run --format=checkstyle)

stan:
	@echo "▶️  Lancer PHPStan"
	@$(call in_root,vendor/bin/phpstan analyse)

## Correction automatique
fix:
	@echo "🛠️  Correction automatique du code"
	@$(call in_root,$(MAKE) fix-back)
	@$(call in_root,$(MAKE) fix-front)

fix-back:
	@echo "🛠️  PHP-CS-Fixer (back)"
	@$(call in_root,vendor/bin/php-cs-fixer fix --diff --format=checkstyle)

## Front : prettier / lint / format-check / build (via container node)
# On monte $(ROOT_DIR)/front pour être sûr d'avoir un chemin absolu correct.
fix-front:
	@echo "🛠️  Prettier (front via docker node)"
	@$(call in_root,docker run --rm -v "$(ROOT_DIR)/front":/work -v node_modules_cache:/work/node_modules -w /work node:20 bash -lc "npm install -g npm@11.6.0 && npm ci --no-audit --no-fund && npm run format")

front-lint:
	@echo "▶️  ESLint front (via docker node)"
	@$(call in_root,docker run --rm -v "$(ROOT_DIR)/front":/work -v node_modules_cache:/work/node_modules -w /work node:20 bash -lc "npm install -g npm@11.6.0 && npm ci --no-audit --no-fund && npm run lint")

front-format-check:
	@echo "▶️  Prettier-check front (via docker node)"
	@$(call in_root,docker run --rm -v "$(ROOT_DIR)/front":/work -v node_modules_cache:/work/node_modules -w /work node:20 bash -lc "npm install -g npm@11.6.0 && npm ci --no-audit --no-fund && npm run format -- --check")

front-build:
	@echo "▶️  Build front (via docker node)"
	@$(call in_root,docker run --rm -v "$(ROOT_DIR)/front":/work -v node_modules_cache:/work/node_modules -w /work node:20 bash -lc "npm ci --no-audit --no-fund && npm run build")

## CI locale stricte (échoue dès qu’une étape échoue)
ci:
	@echo "🔍 Lancement de la CI locale"
	@echo "────────────────────────────────────────────"
	@$(call in_root,$(MAKE) fix)
	@echo "────────────────────────────────────────────"
	@$(call in_root,$(MAKE) test)
	@echo "────────────────────────────────────────────"
	@$(call in_root,$(MAKE) cs)
	@echo "────────────────────────────────────────────"
	@$(call in_root,$(MAKE) stan)
	@echo "────────────────────────────────────────────"
	@$(call in_root,$(MAKE) front-lint)
	@echo "────────────────────────────────────────────"
	@$(call in_root,$(MAKE) front-format-check)
	@echo "────────────────────────────────────────────"
	@$(call in_root,$(MAKE) front-build)
	@echo "✅ CI locale terminée avec succès"

## Front dev : lance Vite via container Node (pratique si pas de node local)
front-dev:
	@echo "▶️  Lancer le serveur de développement front (Vite) via container node"
	@$(call in_root,docker run --rm -it -p 5173:5173 -v "$(ROOT_DIR)/front":/work -v node_modules_cache:/work/node_modules -w /work node:20 bash -lc "npm ci --no-audit --no-fund && npm run dev -- --host 0.0.0.0")

front-dev-local:
	@echo "▶️  Lancer Vite localement (WSL) — npm dans WSL (recommandé)"
	@$(call in_root,cd front && npm ci && npm run dev -- --host 0.0.0.0)
