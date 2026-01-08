# Spécifications fonctionnelles – Application Boat

# Academy

## 0. Contexte et vision

Boat Academy est un bateau-école souhaitant proposer une application complète permettant : - La
vente et la gestion des permis bateau - L’accompagnement administratif des stagiaires - La planification
des formations théoriques et pratiques - La communication entre stagiaires, moniteurs et gestionnaires

- À terme, la formation continue et la location de bateaux

L’application est pensée comme une **plateforme évolutive** , avec un **MVP robuste** , puis des extensions
progressives.

## 1. Gestion multi-site (multi-villes / franchises)

### 1.1 Principe général

L’application doit supporter une **gestion multi-site** , permettant d’exploiter plusieurs centres Boat
Academy (villes différentes, franchises, antennes).

Chaque site correspond à : - Une ville ou zone géographique - Un ou plusieurs lieux de formation - Une
flotte de bateaux dédiée - Des moniteurs rattachés

### 1.2 Sélection du site par le stagiaire

```
Lors de l’inscription, le stagiaire choisit son site principal
Possibilité de changer de site (selon règles définies par le gestionnaire)
Les contenus, plannings et disponibilités sont filtrés par site
```
### 1.3 Rattachement des données

Les éléments suivants sont rattachés à un site : - Stagiaires - Moniteurs - Sessions de formation -
Bateaux en location - Centres d’examen associés

### 1.4 Droits et visibilité

```
Un gestionnaire peut être limité à un seul site ou à plusieurs
Un administrateur global peut gérer l’ensemble des sites
```
#### •

#### •

#### •

#### •

#### •


## 2. Types d’utilisateurs et rôles

### 2.1 Administrateur / Gestionnaire

### 1.1 Administrateur / Gestionnaire

```
Gestion globale de la plateforme
Gestion des stagiaires, moniteurs et contenus
Gestion des ventes, plannings, pénalités et locations
```
### 1.2 Stagiaire (Élève)

```
Souscription à un permis
Gestion de son dossier administratif
Inscription aux formations
Accès aux contenus pédagogiques
Communication avec l’école
```
### 1.3 Moniteur

```
Consultation de son planning
Accès aux informations des stagiaires inscrits à ses sessions
Remontée d’informations au gestionnaire
```
## 2. Fonctionnalité – Souscription à un permis

### 2.1 Achat depuis l’application

```
Le stagiaire peut souscrire à un permis (côtier, fluvial, autre)
Paiement en ligne sécurisé
Génération automatique du statut "stagiaire actif"
```
### 2.2 Activation des accès

```
L’accès à l’espace stagiaire est limité dans le temps (durée définie par l’école)
Affichage de la date d’expiration
```
### 2.3 Réouverture des accès

```
Si les accès expirent, le stagiaire peut payer pour les réactiver
Historique des paiements consultable
```
## 3. Fonctionnalité – Dossier administratif stagiaire

### 3.1 Téléchargement des documents requis

```
Liste des documents obligatoires affichée (pièce d’identité, photo, certificat médical, etc.)
Téléchargement possible depuis l’espace stagiaire
```
#### • • • • • • • • • • • • • • • • • • • •


### 3.2 Transmission des documents à l’école

```
Upload sécurisé des documents
Statut par document :
Manquant
En attente de validation
Validé / Refusé
```
### 3.3 Numéro OEDIPP

```
Le gestionnaire peut renseigner le numéro OEDIPP du stagiaire
Le stagiaire peut consulter son numéro depuis son espace
Blocage de certaines actions tant que le numéro n’est pas renseigné
```
## 4. Fonctionnalité – Centre d’examen

```
Le stagiaire peut rechercher le centre d’examen le plus proche de son domicile
Recherche par ville ou code postal
Affichage des informations pratiques du centre
```
## 5. Fonctionnalité – Inscriptions aux formations

### 5.1 Types de sessions

```
Formation théorique en salle
Formation pratique en mer
```
### 5.2 Règles d’inscription

```
Inscription à la pratique impossible tant que :
Le numéro OEDIPP n’est pas créé
Gestion des pénalités :
Non-présentation
Annulation moins de 24h avant
```
### 5.3 Gestion par le gestionnaire

```
Placement manuel des stagiaires sur des créneaux
Vue planning globale
```
## 6. Fonctionnalité – Planning moniteur

```
Consultation des sessions assignées
Liste des stagiaires par session
Accès aux informations essentielles des stagiaires
```
#### • • • • • • • • • • • • • • • • • • • • • • •


## 7. Fonctionnalité – Espace apprenant externe

```
Le stagiaire peut créer un lien vers un espace apprenant externe
Lien accessible depuis son profil
```
## 8. Fonctionnalité – Contenus pédagogiques

### 8.1 Supports de formation

```
Vidéos pédagogiques
Présentations (PDF, diaporamas)
```
### 8.2 Accès aux contenus

```
Accès pendant la période de validité
Accès possible après obtention du permis pour les contenus post-formation
```
## 9. Fonctionnalité – Formation post-permis

```
Vente de cours de perfectionnement :
Mise à l’eau
Écluses
Accostage
Autres thématiques
Inscription et paiement via l’application
```
## 10. Fonctionnalité – Location de bateaux

### 10.1 Location initiale

```
Mise en location d’un ou plusieurs bateaux
Réservation par créneau
Conditions d’accès définies par l’école
```
### 10.2 Évolutivité

```
Possibilité d’ajouter de nouveaux bateaux ultérieurement
```
## 11. Fonctionnalité – Messagerie

```
Messagerie intégrée stagiaire ↔ gestionnaire
Historique des échanges
Notifications lors de nouveaux messages
```
#### • • • • • • • • • • • • • • • • • • •


## 12. Contraintes et règles générales

```
Architecture compatible multi-site dès le MVP
Isolation logique des données entre sites
Gestion des droits par rôle ET par site
Sécurité des données (RGPD)
Traçabilité des actions importantes
Application évolutive (ajout de nouveaux sites sans refonte)
```
## 13. Évolutivité et franchise

```
Possibilité d’ajouter un nouveau site sans développement spécifique
Paramétrage par site :
Offres de permis
Tarifs
Règles spécifiques (pénalités, durée d’accès)
Vision long terme orientée réseau / franchise
```
👉 Document prêt pour un **déploiement multi-villes ou en franchise**.

```
Gestion des droits selon le rôle utilisateur
Sécurité des données (RGPD)
Traçabilité des actions importantes
Application évolutive (ajout de modules ultérieurs)
```
👉 Document prêt à être utilisé comme **base de cahier des charges fonctionnel**.

#### • • • • • • • • • • • • • • • •


