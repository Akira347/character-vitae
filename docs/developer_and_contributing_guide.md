# Developer & Contributing Guide

Un guide global pour les développeurs et contributeurs du projet **Character Vitae**.

---

## 1. Vue d'ensemble du projet

- **Nom** : Character Vitae
- **Objectif** : SPA de CV interactif gamifié (RPG style)
- **Stack** : Symfony 7.2, PHP 8.3, React (front ultérieur), Docker, PostgreSQL, GitHub Actions, etc.

---

## 2. Prérequis

Avant de commencer, installez les outils suivants :

- **Git** (version contrôlée)
- **Git Bash** (sous Windows) + [Make via MSYS2](/docs/setup-windows.md)
- **Docker** & **Docker Compose**
- **Composer**
- **VS Code** (ou éditeur de votre choix)
- **PHPUnit, PHPStan, PHP-CS-Fixer** (via Composer)

---

## 3. Installation & configuration locale

1. **Cloner le repo** :
   ```bash
   git clone git@github.com:Akira347/character-vitae.git
   cd character-vitae
   ```

2. **Initialiser les dépendances PHP** :
   ```bash
   composer install
   ```

3. **Lancer l’environnement Docker** :
   ```bash
   docker-compose up -d --build
   ```

4. **Configurer les variables d’environnement** :
   - Copier `.env` en `.env.local` et ajuster si besoin
   - Vérifier `DATABASE_URL`, `JWT_PASSPHRASE`, etc.

5. **Vérifier l’accès** :
   - Symfony : http://localhost:8000
   - Mailpit : http://localhost:8025

---

## 4. Arborescence du projet

```
character-vitae/
├── .github/workflows/ci.yml
├── config/
├── docker/
├── docs/
│   ├── changelog.md
│   ├── setup-windows.md
│   └── developer_and_contributing_guide.md
├── public/
├── src/
├── tests/
├── .php-cs-fixer.dist.php
├── Makefile
├── composer.json
└── README.md
```

---

## 5. Commandes fréquentes (Makefile)

| Commande    | Description                              |
| ----------- | ---------------------------------------- |
| `make cs`   | Vérifier le style (PHP-CS-Fixer dry-run) |
| `make fix`  | Appliquer les corrections de style       |
| `make stan` | Lancer PHPStan                           |
| `make test` | Lancer PHPUnit                           |

> Note : sous Windows, lancez ces commandes dans **Git Bash**.

---

## 6. Workflow CI/CD

- **Workflow GitHub Actions** déclenché sur `push`/`pull_request` vers `develop` et `main`.
- Étapes :
  1. Checkout du code
  2. Setup PHP
  3. Install Composer
  4. Tests PHPUnit
  5. Analyse statique PHPStan
  6. Vérification style PHP-CS-Fixer

---

## 7. Standards de code

- **PSR-12** + **règles Symfony** (`@Symfony` preset)
- Importations ordonnées et sans inutiles
- PHPDoc selon PSR-5
- Respect des conventions de nommage et de structure de classes (PSR-4)

---

## 8. Contribuer au projet

### 8.1 Branching Model (Gitflow)

- Branche `develop` : travail en cours
- Branche `main` : production stable
- Créer une feature :
  ```bash
  git flow feature start nom-de-la-feature
  ```
- Finir une feature :
  ```bash
  git flow feature finish nom-de-la-feature
  ```

### 8.2 Workflow Pull Request

1. Pousse ta branche de feature sur le remote :
   ```bash
   git push origin feature/nom-de-la-feature
   ```
2. Ouvre une **Pull Request** contre `develop`
3. Affecte des reviewers
4. Assure-toi que **CI passe ✅** et que tu as ajouté des tests si nécessaire
5. Merge en **squash & merge** ou **rebase & merge**

### 8.3 Conventions de commit

- Utilise un style clair :
  ```
  type(scope): description courte
  ```
  - Ex : `feat(auth): add JWT login endpoint`
  - Types : `feat`, `fix`, `chore`, `docs`, `refactor`, etc.

- Inclue un corps de message si besoin pour expliquer le _pourquoi_

---

## 9. Gestion des issues

- Crée une **issue** pour chaque bug ou chaque nouvelle fonctionnalité
- Suis les templates d’issue (bug report ou feature request)
- Lien la PR correspondante

---

## 10. Releases & Changelog

- Les releases sont taguées avec [semver](https://semver.org/) (`v0.1.0`, `v1.0.0`, ...)
- Le fichier `CHANGELOG.md` référence chaque version avec ses principales modifications

---

**Merci de contribuer !** Toute contribution est la bienvenue, n’hésitez pas à proposer des améliorations ou à signaler des problèmes.