### 🧩 Édition – Ajout d’une section

**User Story :**
En tant que candidat, je souhaite pouvoir ajouter une nouvelle section à ma fiche personnage afin de structurer mon CV à la carte.

**Critères d’acceptation :**
1. Sur la page d’édition (`/characters/{id}`), un bouton **« + Ajouter une section »** est visible en haut du canvas.
2. En cliquant sur ce bouton :
   - Un **sélecteur de sections** (modal ou dropdown) apparaît, listant les sections disponibles : Identité, Lore, Expériences, Talents, Contact, etc.
   - Chaque option affiche un titre et une icône indicative.
3. Je sélectionne une section (ex. **Expériences**) :
   - Le composant correspondant est **inséré** dans le canvas, dans une zone encadrée.
   - Un toast **« Section ajoutée »** apparaît brièvement.
4. La section ajoutée est **sauvegardée** et visible après rechargement de la page.

**Priorité :** Haute
**Dépendances :** Création de la fiche personnage
**État :** À faire

---

### 🧩 Édition – Déplacement d’une section

**User Story :**
En tant que candidat, je souhaite pouvoir réorganiser l’ordre des sections de ma fiche personnage en les déplaçant par glisser-déposer afin d’ajuster la présentation de mon CV.

**Critères d’acceptation :**
1. Sur la page d’édition, chaque section dispose d’une **poignée de déplacement** (icône “☰” ou zone drag) visible au survol.
2. Je clique et **glisse** la section vers une nouvelle position :
   - Une **zone de dépôt** signalée visuellement indique où la section sera placée.
   - Le déplacement est animé pour guider ma manipulation.
3. En relâchant la section, l’ordre est mis à jour dans l’interface.
4. Le nouvel ordre est **sauvegardé** et persiste après rechargement de la page.

**Priorité :** Moyenne
**Dépendances :** Ajout de section
**État :** À faire