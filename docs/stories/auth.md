## Authentification

### 🧩 Auth – Inscription

**User Story :**
En tant que visiteur, je souhaite créer un compte avec mon email et un mot de passe afin d’accéder aux fonctionnalités personnalisées de l’application.

**Critères d’acceptation :**
1. **Sur la page d'accueil** (visiteur non authentifié) :
   - Le bouton “Inscription” est toujours visible en haut à droite.
   - En cliquant dessus, un modal s’ouvre.
2. **Sur la fiche d'un candidat** (visiteur non authentifié) :
   - Je survole l’icône “Plume”, l’option “Inscription” apparaît.
   - Je clique sur “Inscription” et le même modal s’ouvre.
3. Dans le modal d'inscription :
   - Email (obligatoire, format email valide)
   - Mot de passe (obligatoire, 8+ caractères)
   - Confirmation du mot de passe (doit correspondre)
   - Je clique sur “Envoyer” :
     - Un email de confirmation est envoyé en moins de 1 minute.
     - Un message “Vérifiez votre boîte mail pour confirmer votre compte.” s’affiche.

**Priorité :** Haute
**Dépendances :** Aucune
**État :** À faire

---

### 🧩 Auth – Connexion

**User Story :**
En tant que candidat, je souhaite m’authentifier avec mon email et mon mot de passe afin d’accéder à mon espace personnel.

**Critères d’acceptation :**
1. **Sur la home** (visiteur non authentifié) :
   - Le bouton “Connexion” est toujours visible en haut à droite (à la place de la Plume).
   - En cliquant dessus, un modal s’ouvre…
2. **Sur la fiche publique** (visiteur non authentifié) :
   - Je survole l’icône “Plume”, l’option “Connexion” apparaît.
   - Je clique sur “Connexion” et le même modal s’ouvre.
3. Dans le modal de connexion :
   - Email (obligatoire) et Mot de passe (obligatoire) sont présents.
   - Je clique sur “Valider” :
     - Si la combinaison est correcte, je suis redirigé vers `/dashboard` en < 2 s.
     - Sinon, un message “Email ou mot de passe incorrect” s’affiche.

**Priorité :** Haute
**Dépendances :** Inscription
**État :** À faire

---

### 🧩 Auth – Déconnexion

**User Story :**
En tant que candidat, je souhaite me déconnecter afin de sécuriser mon compte après utilisation.

**Critères d’acceptation :**
- Je survole l’icône “Plume”, l’option “Déconnexion” apparaît.
- Je clique sur “Déconnexion” :
  - Mon token est supprimé du navigateur.
  - Je suis redirigé vers la page d’accueil en < 1 s.
  - Le bouton “Connexion” réapparaît.

**Priorité :** Haute
**Dépendances :** Connexion
**État :** À faire