# 🪟 Configuration de l'environnement Windows

Ce guide décrit les étapes nécessaires pour que les commandes `make` fonctionnent correctement sur Windows, notamment pour les développeurs utilisant **Git Bash** dans un projet Symfony/PHP.

---

## 📦 Installer `make` via MSYS2

### 1. Télécharger et installer MSYS2

- Rendez-vous sur : [https://www.msys2.org](https://www.msys2.org)
- Cliquez sur **Download Installer**
- Téléchargez et installez le fichier `msys2-x86_64-xxxx.exe`
- Laissez les options par défaut (installation dans `C:\msys64` recommandée)

### 2. Mise à jour initiale de MSYS2

- Lancez **MSYS2 MSYS** depuis le menu Démarrer
- Tapez :
  ```bash
  pacman -Syu

⚠️ Fermez et relancez MSYS2 si demandé, puis retapez la commande pour finaliser la mise à jour.

Une fois la mise à jour terminée, installez make :
- Tapez :
  ```bash
    pacman -S make

Facultatif : installez aussi des outils utiles avec :
    pacman -S git vim tar unzip

#### 3. Ajouter MSYS2 au PATH système (recommandé)

Pour exécuter make depuis Git Bash ou VS Code, ajoutez le chemin suivant à vos variables d’environnement Windows : C:\msys64\usr\bin

Étapes :
    Ouvrir Panneau de configuration > Système > Paramètres système avancés > Variables d’environnement
    Modifier la variable Path dans Variables système
    Ajouter C:\msys64\usr\bin
    Redémarrer votre session Windows

### 4. Tester

Dans Git Bash, tapez : make --version

Vous devriez voir :
    GNU Make 4.x
    Built for x86_64-pc-msys

### 5. Utilisation

Une fois installé, vous pouvez utiliser les raccourcis définis dans le Makefile à la racine du projet comme :
    make cs     # Vérifie le style de code
    make fix    # Applique les corrections
    make test   # Lance les tests
    make stan   # Lance PHPStan