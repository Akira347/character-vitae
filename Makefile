SHELL := /usr/bin/env bash
MAKE := make
FRONT_DIR := front

.PHONY: cs test stan fix ci front-lint front-build front-format-check fix-front fix-back

## Back end
test:
	@echo "▶️  Lancer PHPUnit"
	@APP_ENV=test php bin/phpunit --colors=never

cs:
	@echo "▶️  Lancer PHP CS Fixer"
	@vendor/bin/php-cs-fixer fix --diff --dry-run --format=checkstyle

stan:
	@echo "▶️  Lancer PHPStan"
	@vendor/bin/phpstan analyse

## Correction automatique
fix:
	@echo "🛠️  Correction automatique du code"
	@$(MAKE) fix-back
	@$(MAKE) fix-front

fix-back:
	@echo "🛠️  PHP-CS-Fixer (back)"
	@vendor/bin/php-cs-fixer fix --diff --format=checkstyle

fix-front:
	@echo "🛠️  Prettier (front)"
	@npm --prefix $(FRONT_DIR) run format

## Front : lint / format-check / build
front-lint:
	@echo "▶️  ESLint front"
	@npm --prefix $(FRONT_DIR) run lint

front-format-check:
	@echo "▶️  Prettier-check front"
	@npm --prefix $(FRONT_DIR) run format-check

front-build:
	@echo "▶️  Build front"
	@npm --prefix $(FRONT_DIR) run build

## CI locale stricte (échoue dès qu’une étape échoue)
ci:
	@echo "🔍 Lancement de la CI locale"
	@echo "────────────────────────────────────────────"
	@$(MAKE) fix
	@echo "────────────────────────────────────────────"
	@$(MAKE) test
	@echo "────────────────────────────────────────────"
	@$(MAKE) cs
	@echo "────────────────────────────────────────────"
	@$(MAKE) stan
	@echo "────────────────────────────────────────────"
	@$(MAKE) front-lint
	@echo "────────────────────────────────────────────"
	@$(MAKE) front-format-check
	@echo "────────────────────────────────────────────"
	@$(MAKE) front-build
	@echo "✅ CI locale terminée avec succès"
