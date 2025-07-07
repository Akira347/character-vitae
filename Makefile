.PHONY: cs test stan fix

cs:
	vendor/bin/php-cs-fixer fix --diff --dry-run --format=checkstyle

fix:
	vendor/bin/php-cs-fixer fix

stan:
	vendor/bin/phpstan analyse

test:
	APP_ENV=test php bin/phpunit --colors=never

ci:
	@echo "🔍 Lancement de la CI locale"
	@echo "────────────────────────────────────────────"
	- make test || echo "❌ Tests échoués"
	@echo "────────────────────────────────────────────"
	- make cs || echo "❌ Violations de style"
	@echo "────────────────────────────────────────────"
	- make stan || echo "❌ Erreurs détectées par PHPStan"
	@echo "✅ CI terminée (voir les erreurs ci-dessus si présentes)"
