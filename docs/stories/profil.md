## Gestion du profil / CV

### 🧩 Profil – Création de la fiche personnage

**User Story :**
En tant que candidat, je souhaite créer une nouvelle fiche personnage afin de présenter mon CV sous forme ludique.

**Critères d’acceptation :**
1. Je clique sur le bouton “Nouveau personnage” dans le dashboard.
2. Un modal s’ouvre avec :
  - Titre de la fiche (obligatoire)
  - Description courte (facultative)
  - Deux options radio ou boutons :
    - Page vierge
    - Modèle prédéfini (aperçu de 3 templates)
3. Je clique sur “Enregistrer” :
  - La fiche est créée et j’accède immédiatement à la vue d’édition `/characters/{id}`
  - Un bandeau de confirmation “Fiche créée avec succès” apparaît
  - Le type de fiche (vierge vs modèle) est mémorisé pour préconfigurer le canvas d’édition

**Priorité :** Haute
**Dépendances :** Auth
**État :** À faire

---

### 🧩 Identité – Création de la fiche d’identité

**User Story :**
En tant que candidat, je souhaite renseigner mon identité (nom, prénom, pseudonyme, métier, spécialité, niveau) afin de personnaliser ma fiche personnage.

**Critères d’acceptation :**
- Je survole la section “Identité”, un “+” apparaît.
- Je clique sur “+” : un formulaire s’ouvre avec les champs :
  - Nom (obligatoire)
  - Prénom (obligatoire)
  - Pseudonyme (optionnel)
  - Métier (obligatoire)
  - Spécialité (optionnel)
  - Niveau (obligatoire)
- Je clique sur “Enregistrer” :
  - Les données sont sauvegardées en base.
  - La section “Identité” met à jour l’affichage immédiatement.

**Priorité :** Moyenne
**Dépendances :** Création de la fiche personnage
**État :** À faire

---

### 🧩 Profil – Renseignement de la description (Lore)

**User Story :**
En tant que candidat, je souhaite ajouter une description “Lore” afin de détailler mon parcours de manière narrative.

**Critères d’acceptation :**
- Je survole la section “Lore”, un “+” apparaît.
- Je clique sur “+” : un éditeur texte s’ouvre (textarea).
- Je saisis minimum 20 caractères, puis “Enregistrer” :
  - Le texte apparaît avec mise en forme basique.
  - Un message “Description enregistrée” s’affiche.

**Priorité :** Moyenne
**Dépendances :** Création de la fiche personnage
**État :** À faire

---

### 🧩 Parcours – Renseignement des formations

**User Story :**
En tant que candidat, je souhaite ajouter mes formations afin de valoriser mes acquis.

**Critères d’acceptation :**
- Je survole la section “Formations”, un “+” apparaît.
- Je clique sur “+” : un formulaire s’ouvre avec :
  - Intitulé (obligatoire)
  - Établissement (obligatoire)
  - Année d’obtention (JJ/MM/AAAA, obligatoire)
- Je clique sur “Enregistrer” :
  - La formation s’ajoute à la liste, triée par année descendante.
  - Un message “Formation ajoutée” s’affiche.

**Priorité :** Moyenne
**Dépendances :** Création de la fiche personnage
**État :** À faire

---

### 🧩 Parcours – Renseignement des certifications (Hauts-faits)

**User Story :**
En tant que candidat, je souhaite ajouter mes certifications afin de prouver mes compétences.

**Critères d’acceptation :**
- Section “Hauts-faits” → “+” → formulaire :
  - Titre (obligatoire)
  - Organisme (optionnel)
  - Date d’obtention (JJ/MM/AAAA, obligatoire)
- Enregistrer → ajout et message de confirmation.

**Priorité :** Moyenne
**Dépendances :** Création de la fiche personnage
**État :** À faire

---

### 🧩 Compétences – Renseignement des soft-skills (Qualités)

**User Story :**
En tant que candidat, je souhaite ajouter mes qualités (soft-skills) afin de compléter mon profil.

**Critères d’acceptation :**
- Section “Qualités” → “+” → formulaire :
  - Qualité (liste déroulante ou saisie, obligatoire)
- Enregistrer → ajout avec icône, message…

**Priorité :** Basse
**Dépendances :** Création de la fiche personnage
**État :** À faire

---

### 🧩 Compétences – Renseignement des compétences techniques (Talents)

**User Story :**
En tant que candidat, je souhaite ajouter mes compétences techniques afin de détailler mon expertise.

**Critères d’acceptation :**
- Section “Talents” → “+” → formulaire :
  - Compétence (obligatoire)
  - Niveau initial (1-5, obligatoire)
- Enregistrer → barre de progression affichée à 0%, message…

**Priorité :** Haute
**Dépendances :** Création de la fiche personnage
**État :** À faire