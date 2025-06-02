.PHONY: cs test stan fix

cs:
	vendor/bin/php-cs-fixer fix --diff --dry-run --format=checkstyle

fix:
	vendor/bin/php-cs-fixer fix

stan:
	vendor/bin/phpstan analyse

test:
	php bin/phpunit