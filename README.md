## Présentation du projet
   **Nom** : Character Vitae
   **Objectif** : SPA de CV interactif gamifié (RPG style)
   **Stack** : Symfony 7.2, PHP 8.3, React (front ultérieur), Docker, PostgreSQL, GitHub Actions, etc.

## Intégration Continue

[![CI](https://github.com/Akira347/character-vitae/actions/workflows/ci.yml/badge.svg)](https://github.com/Akira347/character-vitae/actions)

---

## 🚀 Prérequis & Installation

1. **Cloner le dépôt**
   ```bash
   git clone git@github.com:Akira347/character-vitae.git
   cd character-vitae

2. **Installer les dépendances PHP**
   composer install

3. **Lancer l’environnement Docker***
   docker-compose up -d --build

4. **(Windows) Installer make**
   Voir [docs/setup-windows.md](docs/setup-windows.md)
   Lance ensuite tes commandes make dans Git Bash.

5. **Vérifier**
    - Symfony : http://localhost:8000
    - Mailpit : http://localhost:8025

---

## 🛠️ Commandes utiles (Makefile)

Ce projet contient un `Makefile` pour simplifier les commandes de développement les plus courantes.

| Commande    | Action réalisée                                        |
| ----------- | ------------------------------------------------------ |
| `make cs`   | Lancer PHP-CS-Fixer en mode vérification (`--dry-run`) |
| `make fix`  | Appliquer automatiquement les corrections de style     |
| `make stan` | Lancer l'analyse statique avec PHPStan                 |
| `make test` | Lancer les tests unitaires avec PHPUnit                |

👉 Cela évite d’avoir à retenir les longues commandes Composer/Docker.

📄 [Guide d’installation Windows pour make](docs/setup-windows.md)

---

## Documentation

- 📄 [Guide développeurs & contributeurs](docs/developer_and_contributing_guide.md)
- 📄 [Changelog](CHANGELOG.md)
- 📄 [User Stories (template)](docs/user-story-template.md)
- 📂 [Stories par fonctionnalité](docs/stories/)
- 📄 [Setup Windows pour Make](docs/setup-windows.md)