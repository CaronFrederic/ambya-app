# Guide de validation Beta S1-S4

## Objectif

Ce guide sert de preuve rejouable pour le scope `S1-S4 retenu`.

Il documente :

- les commandes a lancer
- les checks attendus
- les scenarios manuels a rejouer
- ce qui est valide
- ce qui reste volontairement hors scope

## Perimetre valide

### Semaine 1

- Setup Monorepo
- Setup Expo + NativeWind
- Setup NestJS + Prisma
- Schema base de donnees initial

### Semaine 2

- Auth Login/Register
- Flow Client - Liste RDV
- Creation RDV
- UI Design system Figma v1
- UI ecrans cles Client v1

### Semaine 3

- UI ecrans cles Pro & Employee v1
- UI Polissage Beta
- Validation RDV Pro/Employe
- Offline Consultation

### Semaine 4

- Demande Conges

## Hors scope explicite

- Build Expo Staging
- Gestion Employes comme chantier fonctionnel autonome
- Email Reset Password
- Preparation MFA
- UI Final polish global
- Tests Multi-device
- Build Production
- Flow Pro complet

Important :

- le flow Pro ne doit pas regresser
- il peut etre touche uniquement pour typecheck, securite, API partagee ou stabilite globale

## Commandes de validation

Toutes les commandes se lancent depuis la racine :

`c:\Users\Caron\Desktop\LAN Consulting\ambya`

### Validation Beta de reference

```bash
pnpm check:full
```

Resultat attendu :

- succes complet
- backend scope Beta valide
- mobile typecheck valide

### Validation backend scope Beta

```bash
pnpm --filter api check:beta-scope
```

Resultat attendu :

- succes complet
- suites auth, appointments, discovery, employee, admin et app controller vertes

### Typecheck mobile

```bash
pnpm --filter mobile typecheck
```

Resultat attendu :

- zero erreur TypeScript

### Build API complet

```bash
pnpm --filter api build
```

Resultat attendu :

- succes complet

## Comptes de test

Utiliser des comptes de test semes localement ou fournis par l'equipe.

Le minimum a prevoir pour la recette :

- 1 compte Client
- 1 compte Employee
- 1 compte Admin
- 1 salon avec services et disponibilites
- 1 rendez-vous simple existant
- 1 groupe de rendez-vous multi-service existant si possible

## Scenario Client

### Auth

1. Ouvrir l'application.
2. Se connecter avec le compte Client.
3. Verifier que la session s'ouvre sans erreur bloquante.

Resultat attendu :

- login reussi
- ecran principal accessible

### Home / recherche / fiche salon

1. Ouvrir la home.
2. Lancer une recherche.
3. Ouvrir une fiche salon.

Resultat attendu :

- chargement correct
- pas de JSON brut
- etats loading / empty / error lisibles si necessaire

### Reservation simple

1. Choisir un service.
2. Choisir un creneau futur valide.
3. Confirmer la reservation.

Resultat attendu :

- reservation creee
- confirmation visible
- le rendez-vous apparait ensuite dans la liste

### Reservation multi-service / multi-employe

1. Constituer un panier multi-service si le compte de test le permet.
2. Valider un parcours multi-service.
3. Verifier l'assignation employee si applicable.

Resultat attendu :

- groupe de rendez-vous cree
- detail groupe consultable

### Blocage du passe

1. Tenter de reserver un creneau passe.

Resultat attendu :

- action refusee proprement
- message utilisateur comprensible

### Liste et detail RDV

1. Ouvrir `Mes rendez-vous`.
2. Ouvrir le detail d'un rendez-vous ou d'un groupe.

Resultat attendu :

- liste chargee
- detail consultable
- pas de loader infini

### Profil / fidelite

1. Ouvrir le profil.
2. Ouvrir la fidelite si surface disponible.

Resultat attendu :

- donnees reelles visibles
- pas de crash

## Scenario Admin

### Login et dashboard

1. Se connecter avec le compte Admin.
2. Ouvrir le dashboard.

Resultat attendu :

- login reussi
- KPI visibles

### Navigation support

1. Ouvrir la liste des users ou clients.
2. Ouvrir un detail user.
3. Revenir a la liste.
4. Ouvrir un salon.
5. Ouvrir un detail rendez-vous.
6. Ouvrir les audit logs si disponibles.

Resultat attendu :

- navigation complete sans impasse
- pas de JSON brut
- ecrans lisibles

### Editions utiles

1. Modifier une donnee autorisee sur un user, salon ou rendez-vous.
2. Verifier le retour a l'ecran precedent et le rafraichissement des donnees.

Resultat attendu :

- mutation reussie
- UI mise a jour
- erreur claire si refus

### RBAC Admin

1. Verifier qu'un Admin accede bien aux surfaces Admin.
2. Verifier qu'un compte non Admin n'y accede pas.

Resultat attendu :

- acces autorise seulement au bon role

## Scenario Employee

### Login et dashboard

1. Se connecter avec le compte Employee.
2. Ouvrir le dashboard.

Resultat attendu :

- login reussi
- dashboard charge

### Agenda / detail / actions

1. Ouvrir l'agenda.
2. Ouvrir le detail d'un rendez-vous.
3. Tester les actions disponibles selon l'etat :
   - confirmer
   - terminer
   - encaisser
   - annuler

Resultat attendu :

- mutation prise en compte
- donnees rafraichies
- pas de regression suite aux changements API/securite

### Creneaux

1. Ouvrir les creneaux disponibles ou l'ecran equivalent.
2. Verifier qu'un employee peut prendre un creneau autorise.

Resultat attendu :

- action correcte
- respect du role employee

### Conges

1. Ouvrir la liste des conges.
2. Creer une demande.
3. Modifier une demande encore `PENDING`.
4. Supprimer une demande autorisee.

Resultat attendu :

- CRUD fonctionnel
- loading / empty / error lisibles

### Profil

1. Ouvrir le profil employee.
2. Modifier une donnee autorisee.

Resultat attendu :

- mutation reussie
- donnees mises a jour

## Scenario Offline

Suivre en complement :

- [Guide offline Beta](beta-offline-and-test-guide.md)

Points minimums a verifier :

1. Client peut relire des donnees deja synchronisees.
2. Employee peut relire dashboard / agenda / detail / profil / conges deja synchronises.
3. Les mutations sont bloquees proprement hors ligne.
4. Admin n'affiche pas de faux succes hors ligne.

## Definition de termine

Le scope `S1-S4 retenu` est considere opposable si :

1. `pnpm check:full` passe.
2. `pnpm --filter api build` passe.
3. Les scenarios Client sont rejoues et valides.
4. Les scenarios Admin sont rejoues et valides.
5. Les scenarios Employee sont rejoues et valides.
6. La recette offline est rejouee et validee.
7. Aucun blocage majeur ou faux positif ne subsiste sur le perimetre.
