Oui — dans tes parcours, il y a **quelques points “sensibles”** qui peuvent te créer des frictions **RGPD** et/ou **App Store Review**. Expo ne change rien : **les règles Apple s’appliquent pareil** (Expo produit juste une app native empaquetée différemment).

## 1) Points du parcours qui peuvent poser problème côté Apple (App Store)

### A) **Paiement “accès / réactivation” via Stripe dans l’app**

C’est **le plus gros risque de rejet**.

* Apple distingue :

  * **Biens/services consommés en dehors de l’app** → paiements externes OK (carte/Apple Pay/Stripe) ([Apple Developer][1])
  * **Services “person-to-person” en temps réel** (ex : coaching live 1:1) → paiements externes possibles ([Apple Developer][1])
  * Mais **tout achat “digital” consommé dans l’app** (contenu, fonctionnalités, boosts, etc.) → **doit** passer par l’In-App Purchase ([Apple Developer][1])

👉 **Dans ton parcours** : “acheter/réactiver l’accès” peut être interprété comme **accès à du contenu/une fonctionnalité dans l’app** → donc IAP obligatoire.

✅ Mitigations (au choix) :

* **Positionner clairement le produit comme un service hors app** (cours/présentiel/sessions physiques), et l’app est un **compagnon** (planning, docs, messages).
* Ou **ne pas vendre dans l’app** : achat sur site web, et l’app sert uniquement après achat (attention aux règles sur “call to action”/encouragement à payer ailleurs, Apple encadre ça) ([Apple Developer][1])
* Ou **implémenter StoreKit/IAP** pour tout ce qui est “accès digital dans l’app”.

---

### B) **Suppression de compte**

Si tu as création de compte, Apple exige que l’utilisateur puisse **initier la suppression de compte dans l’app** (flow simple, accessible) ([Apple Developer][2])

👉 Dans ton parcours : “profil / paramètres” doit inclure **Supprimer mon compte** (et expliquer ce qui est supprimé vs conservé légalement).

---

### C) **Messagerie (contenu généré par l’utilisateur)**

Dès que tes utilisateurs peuvent poster/envoyer du texte, Apple peut considérer ça comme **User-Generated Content** et demander :

* **filtrage / modération**,
* **signalement**,
* **blocage**,
* **infos de contact publiées** ([Apple Developer][1])

👉 Dans ton parcours : “Messages” doit idéalement inclure au minimum :

* “Signaler” une conversation / message
* “Bloquer” (au moins côté admin : bloquer un compte abusif)
* une page “Contact” / support
* des règles d’utilisation (anti-harcèlement)

---

### D) **Transparence / politique de confidentialité**

Apple impose :

* lien vers la **politique de confidentialité** dans App Store Connect + **dans l’app**, facile à trouver ([Apple Developer][1])

👉 Dans ton parcours : “Paramètres” doit avoir “Confidentialité”, “Données”, “Contact”.

---

### E) **Privacy Manifest / SDK**

Apple a ajouté des exigences autour des **privacy manifests** (et raisons d’usage de certaines APIs) + SDK tiers ([Apple Developer][3])
👉 Expo + Sentry + autres libs : il faut vérifier que ton build iOS est conforme (sinon blocage à la soumission).

---

## 2) Points du parcours qui peuvent poser problème côté RGPD

### A) **Upload de documents (identité, justificatifs…)**

C’est **très sensible** : tu collectes et stockes des pièces pouvant servir à l’usurpation.

* Tu dois appliquer **minimisation + sécurité + privacy by design** (CNIL insiste particulièrement sur apps mobiles) ([CNIL][4])
* Tu dois définir des **durées de conservation** (et supprimer/anonymiser quand plus nécessaire) ([CNIL][5])

✅ Mitigations :

* stocker en **bucket privé**, URLs signées courtes, accès strict “need-to-know”
* chiffrement, journalisation (audit), procédures internes
* règle claire : “doc supprimé X jours après validation / fin de relation”

---

### B) **Droits des personnes (accès, export, suppression)**

RGPD : l’utilisateur doit pouvoir exercer ses droits. CNIL recommande même une **page dédiée dans l’app** pour ça ([CNIL][4])
👉 Dans ton parcours : ajouter “Mes données” (export) + “Supprimer mon compte” + “Contacter DPO/support”.

---

### C) **Push notifications**

Les tokens push = données personnelles. Et le contenu affiché peut fuiter des infos à l’écran verrouillé.
CNIL recommande de **limiter les données affichées dans les notifications** ([CNIL][4])

✅ Mitigation simple :

* push “Nouveau message” (sans contenu)
* réglage opt-in / opt-out + préférences

---

### D) **Messagerie**

Les messages peuvent contenir des données perso voire sensibles (au sens RGPD, selon le contenu).
✅ Mitigations :

* politique de conservation (ex : 12 mois glissants)
* suppression à la clôture du dossier (sauf obligation)
* contrôles d’accès stricts (RLS) + audit

---

### E) **Sous-traitants & transferts hors UE**

Supabase, Stripe, Expo Push, Sentry… = sous-traitants potentiels. Tu dois :

* documenter qui traite quoi,
* encadrer contractuellement,
* gérer les transferts hors UE si applicable (CNIL rappelle l’enjeu sur mobiles/SDK) ([CNIL][4])

---

## 3) En pratique : les 5 “must have” à ajouter au parcours pour être clean

1. **Écran “Confidentialité & Données”** (policy + finalités + durées + sous-traitants)
2. **Gestion des consentements** (marketing séparé, push séparé)
3. **Export des données** + **suppression de compte** dans l’app (Apple + RGPD) ([Apple Developer][2])
4. **Messagerie** : signaler / bloquer + contact support ([Apple Developer][1])
5. Clarifier **paiement** : service hors app vs contenu digital (sinon risque IAP) ([Apple Developer][1])

---

Si tu me confirmes **ce que vend exactement le paiement** (accès à contenu e-learning dans l’app ? ou uniquement des séances/formation “réelle” hors app ?), je te dis **très précisément** si Apple va exiger l’IAP et comment reformuler le parcours pour minimiser le risque de rejet.

[1]: https://developer.apple.com/app-store/review/guidelines/ "App Review Guidelines - Apple Developer"
[2]: https://developer.apple.com/support/offering-account-deletion-in-your-app/ "Offering account deletion in your app - Support - Apple Developer"
[3]: https://developer.apple.com/news/?id=r1henawx "Privacy updates for App Store submissions - Latest News - Apple Developer"
[4]: https://www.cnil.fr/sites/cnil/files/2025-04/recommandation-applications-mobiles-modifiee.pdf "Recommandation relative aux applications mobiles - modifiée"
[5]: https://www.cnil.fr/fr/passer-laction/les-durees-de-conservation-des-donnees?utm_source=chatgpt.com "Les durées de conservation des données | CNIL"
