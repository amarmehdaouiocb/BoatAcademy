Oui — voici **tous les parcours utilisateurs** (MVP) en version **simplifiée + vulgarisée**, par type d’utilisateur.

---

## 1) Parcours Stagiaire (app mobile `student-mobile`)

### A. Première connexion / création de compte

1. Le stagiaire ouvre l’app
2. Il **crée un compte** (email + mot de passe) ou se connecte
3. Il **choisit son centre / site** (si plusieurs)
4. Il arrive sur l’écran d’accueil

✅ Résultat : l’app sait “dans quelle école” il est rattaché.

---

### B. Vérification “est-ce que j’ai accès ?”

1. L’app vérifie automatiquement si le stagiaire a un **accès actif** (abonnement/droit d’accès)
2. S’il est **actif** → il peut utiliser l’app
3. S’il est **expiré** → écran “Accès expiré” + bouton “Réactiver / Acheter”

✅ Résultat : l’accès est contrôlé automatiquement.

---

### C. Dépôt des documents (upload)

1. Le stagiaire va dans “**Documents**”
2. Il voit une liste de documents (carte d’identité, photo, etc.) avec un statut :

   * Manquant / En attente / Validé / Refusé
3. Il **upload** un fichier (photo/PDF)
4. Le statut passe à **“En attente”**
5. Si refus : il voit la **raison** et peut renvoyer

✅ Résultat : il peut envoyer tous ses documents sans passer au bureau.

---

### D. Remplir / renseigner le numéro OEDIPP (obligatoire pour la pratique)

1. Le stagiaire va dans “Profil”
2. Il renseigne son **numéro OEDIPP**
3. L’app enregistre

✅ Résultat : l’école peut l’autoriser sur les séances “pratique”.

---

### E. Voir ses sessions (planning)

1. Il va dans “**Sessions**”
2. Il voit ses sessions théorie et pratique
3. Il peut filtrer par date, type
4. Si pratique et OEDIPP manquant : message “OEDIPP requis”

✅ Résultat : il sait où et quand venir.

---

### F. Messagerie (avec l’école)

1. Il va dans “**Messages**”
2. Il envoie un message (“J’ai un souci”, “Je suis en retard”, etc.)
3. L’école répond
4. Il reçoit :

   * une notif dans l’app
   * et une **push** si activée

✅ Résultat : communication simple, centralisée.

---

### G. Centres d’examen (infos pratiques)

1. Il consulte “Centres d’examen”
2. Il cherche par ville / code postal
3. Il voit adresse, téléphone, notes

✅ Résultat : il sait où passer l’examen.

---

## 2) Parcours Admin / Manager (web `admin-web`)

### A. Connexion et tableau de bord

1. L’admin se connecte (web)
2. Il arrive sur un **dashboard** (infos clés : dossiers incomplets, docs en attente, prochaines sessions)

✅ Résultat : vue immédiate sur ce qui bloque.

---

### B. Gestion des stagiaires

1. Il ouvre la liste “Stagiaires”
2. Il cherche / filtre
3. Il ouvre une fiche stagiaire (profil + OEDIPP + accès + documents)

✅ Résultat : une fiche unique “source de vérité”.

---

### C. Validation des documents

1. Il va dans “Documents à valider”
2. Il ouvre un document
3. Il clique :

   * ✅ “Valider”
   * ❌ ou “Refuser” + raison
4. Le stagiaire voit le statut et reçoit une notif

✅ Résultat : traitement rapide, traçable.

---

### D. Création des sessions (planning école)

1. Il va dans “Sessions”
2. Il crée une session :

   * type (théorie/pratique)
   * date/heure
   * capacité
   * lieu
3. La session apparaît dans les listes

✅ Résultat : l’école construit son planning.

---

### E. Assigner un stagiaire à une session

1. Dans une session, l’admin clique “Assigner un stagiaire”
2. Il sélectionne le stagiaire
3. Le système vérifie automatiquement :

   * capacité restante
   * si “pratique” → **OEDIPP obligatoire**
4. Si ok → assignation enregistrée + audit + notif stagiaire

✅ Résultat : impossible de dépasser la capacité ou d’ajouter un stagiaire non éligible en pratique.

---

### F. Messagerie côté école

1. L’admin ouvre “Messages”
2. Il voit les conversations par stagiaire
3. Il répond
4. Le stagiaire reçoit notif + push

✅ Résultat : une “boîte de réception” centrale.

---

### G. Produits / paiements (accès, réactivation)

1. L’admin configure les “Produits” (ex : permis / réactivation)
2. Les stagiaires peuvent payer via Stripe
3. Quand paiement OK :

   * une commande passe à “paid”
   * un **entitlement** (droit d’accès) est créé avec date d’expiration

✅ Résultat : l’accès est automatisé (pas de gestion manuelle).

---

### H. Audit (traçabilité)

1. L’admin va dans “Audit”
2. Il voit l’historique : qui a validé quoi, assigné qui, etc.

✅ Résultat : responsabilité + conformité + debugging facile.

---

## 3) Parcours “Admin mobile” (si tu l’ajoutes plus tard)

C’est la même logique que le web, mais “terrain” :

* valider vite des documents
* checker planning
* répondre messages
* gérer une urgence

---

## 4) Parcours système (automatiques, invisibles)

### A. Paiement → accès

1. Stagiaire paye sur Stripe
2. Stripe appelle le webhook
3. Le système crée l’accès jusqu’à une date
4. Le stagiaire retrouve l’accès dans l’app

### B. Push notifications

1. L’app demande l’autorisation
2. Le token est stocké
3. Lors d’un événement (message, etc.) → push envoyée

---

Si tu veux, je peux te le refaire sous forme de **diagrammes “étapes”** (genre mini flowcharts) ou te sortir les parcours “Happy path” + “cas d’erreur” (OEDIPP manquant, accès expiré, doc refusé, session full, etc.).
