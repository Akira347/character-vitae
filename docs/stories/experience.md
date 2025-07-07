## Gestion de l’expérience & progression

### 🧩 Expériences – Création d’une nouvelle expérience

**User Story :**  
En tant que candidat, je souhaite ajouter une expérience professionnelle afin de détailler mon parcours.

**Critères d’acceptation :**  
- Section “Expériences” → survol → “+” → modal :  
  - Date de début (obligatoire)  
  - Date de fin ou “En cours” (obligatoire)  
  - Métier (obligatoire)  
  - Lieu (obligatoire)  
  - Description (≥ 10 caractères, obligatoire)  
- Enregistrer → sauvegarde et rafraîchissement trié par date de début.

**Priorité :** Moyenne  
**Dépendances :** Création de fiche personnage  
**État :** À faire

---

### 🧩 XP – Ajout d’expérience à une compétence

**User Story :**  
En tant que candidat, je souhaite augmenter l’expérience d’une compétence afin de montrer ma progression.

**Critères d’acceptation :**  
- Pour chaque talent, j’ai un bouton “+XP” ; je le clique.  
- Un input `+10 XP` apparaît ; je valider →  
  - La barre de la compétence se remplit de 10% en < 0,5 s.  
  - Les données sont sauvegardées en base.

**Priorité :** Moyenne  
**Dépendances :** Renseignement des compétences techniques  
**État :** À faire

---

### 🧩 XP – Retrait d’expérience d’une compétence

**User Story :**  
En tant que candidat, je souhaite diminuer l’expérience d’une compétence afin d’ajuster ma progression.

**Critères d’acceptation :**  
- Pour chaque talent, bouton “–XP” ; je clique →  
  - La barre diminue de 10% en < 0,5 s (≥ 0%).  
  - Sauvegarde en base.

**Priorité :** Basse  
**Dépendances :** Ajout d’expérience  
**État :** À faire

---

### 🧩 Progression – Montée de niveau de compétence

**User Story :**  
En tant que candidat, je souhaite que ma compétence passe au niveau supérieur quand sa barre atteint 100% afin de refléter la progression.

**Critères d’acceptation :**  
- Quand XP ≥ 100% :  
  - Le niveau de compétence augmente de 1.  
  - La barre revient à 0% et se remplit pour le niveau suivant.  
- Animation visuelle “level up” (< 1 s) est jouée.

**Priorité :** Moyenne  
**Dépendances :** Ajout d’expérience  
**État :** À faire

---

### 🧩 Progression – Perte de niveau de compétence

**User Story :**  
En tant que candidat, je souhaite que ma compétence redescende d’un niveau quand je retire toute mon expérience afin d’ajuster la progression.

**Critères d’acceptation :**  
- Quand XP = 0% et que je clique “–XP” encore :  
  - Le niveau diminue de 1 (≥ 1).  
  - La barre se positionne à 90% du niveau précédent.  
- Animation “level down” (< 1 s).

**Priorité :** Basse  
**Dépendances :** Retrait d’expérience  
**État :** À faire