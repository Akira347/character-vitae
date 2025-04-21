# 🧾 Changelog – Character Vitae

Ce fichier liste toutes les versions notables du projet **Character Vitae**, application SPA de CV interactif en mode RPG.

---

## [v0.1.0] - 2025-04-19

### 🔧 Initialisation technique

- Création du projet Symfony 7.2 avec `--webapp`
- Mise en place d’un environnement Docker :
  - PHP 8.3-FPM
  - Nginx
  - PostgreSQL 15
  - Mailpit (simulateur SMTP)
- Configuration de la base PostgreSQL via Docker
- Setup de Gitflow (`develop`, `main`, `feature/*`, `release/*`)
- Configuration de GitHub Actions (CI/CD) :
  - Lancement des tests PHP
  - Analyse statique (PHPStan)
  - Formatage (PHP-CS-Fixer)
- Configuration de `phpunit.xml.dist`, `.env.test`
- Ajout de PHPStan (niveau max) et de PHP-CS-Fixer (PSR-12)
- Setup de l'authentification avec JWT (`lexik/jwt-authentication-bundle`)
- Création des clés JWT et configuration de `security.yaml`
- Mise en place d’un `README.md` et d’une base de dossier `/docs`

---

## À venir

- [v1.0.0] – Première fonctionnalité utilisateur : affichage de la page "Personnage" (CV)
- [v1.x] – Formulaire de connexion, création de compte
- [v2.x] – Interface RPG complète avec inventaire, XP, et historique