# Beta Offline Consultation & Validation Guide

## Objectif

Ce document explique :

- comment lancer les verifications automatiques de la Beta
- quels ecrans sont consultables hors ligne
- comment reproduire et valider le mode hors ligne

Le perimetre couvre la Beta `Client + Employee + Admin`.

## 1. Commandes de validation

Toutes les commandes ci-dessous se lancent depuis la racine du repo :

`c:\Users\Caron\Desktop\LAN Consulting\ambya`

### Commande de reference Beta

La commande de validation complete a utiliser en closing Beta est :

```bash
pnpm check:full
```

Elle a ete revalidee en execution normale et couvre :

- build backend
- tests backend
- typecheck mobile

### Commandes detaillees

Si tu veux isoler un probleme, les commandes suivantes restent disponibles :

```bash
pnpm check:backend
pnpm check:mobile
pnpm check:quick
pnpm check:beta
pnpm test:backend
```

### Commandes directes equivalentes

Les commandes detaillees ci-dessous restent utiles pour le diagnostic fin :

```bash
cmd /c pnpm --filter api build
cmd /c pnpm --filter api exec jest --runInBand
cmd /c pnpm exec tsc -p apps\mobile\tsconfig.json --noEmit
```

### Check rapide

```bash
pnpm check:quick
```

Verifie :

- le build backend
- le typecheck mobile

Usage recommande :

- avant une demo
- avant un commit
- pour un controle rapide

### Check backend complet

```bash
pnpm check:backend
```

Verifie :

- le build API Nest
- les tests Jest backend

Couverture utile actuelle :

- auth
- appointments
- discovery
- employee
- admin

### Check mobile

```bash
pnpm check:mobile
```

Verifie :

- le typecheck TypeScript du projet mobile Expo

### Validation complete Beta

```bash
pnpm check:full
```

Alias equivalent :

```bash
pnpm check:beta
```

Verifie :

- backend build
- backend tests
- mobile typecheck

## 2. Interpretation des resultats

### Succes

La validation est consideree comme correcte si `pnpm check:full` se termine sans erreur.

En diagnostic detaille, on peut aussi verifier :

- `pnpm check:backend`
- `pnpm check:mobile`
- `pnpm test:backend`

### Echec

Un echec signifie generalement :

- erreur de compilation backend
- regression TypeScript mobile
- regression sur une regle metier backend testee

Dans ce cas :

1. lire la premiere erreur utile
2. relancer la commande concernee (`check:backend` ou `check:mobile`)
3. corriger le probleme
4. relancer ensuite `pnpm check:full`

## 3. Offline Consultation : perimetre Beta

## Principe

Le mode hors ligne Beta est un mode de **consultation des donnees deja synchronisees**.

Ce qui est garanti :

- reaffichage local des donnees deja chargees sur les ecrans critiques
- message clair quand l application est hors ligne
- blocage propre des actions d ecriture sur les parcours critiques

Ce qui n est pas cherche pour cette Beta :

- mutation offline-first
- synchronisation differée
- Admin full offline

## Ecrans consultables hors ligne

### Client

Les donnees suivantes sont relues depuis le cache local si elles ont deja ete ouvertes avec reseau :

- liste des rendez-vous
- detail d un groupe de rendez-vous deja consulte
- profil client (`summary`)
- fidelite client
- fiche salon deja ouverte
- home / recherche deja chargees

### Employee

Les donnees suivantes sont relues depuis le cache local si elles ont deja ete ouvertes avec reseau :

- dashboard employee
- agenda / liste de rendez-vous employee
- detail d un rendez-vous deja consulte
- profil employee

### Admin

Le mode offline n est pas prioritaire pour Admin sur cette Beta.

Justification :

- faible valeur d usage offline
- risque plus fort de donner une impression trompeuse sur des donnees support qui doivent rester fraiches
- priorite metier plus forte sur Client et Employee

## Actions volontairement bloquees hors ligne

Les actions d ecriture critiques sont bloquees proprement hors ligne, avec un message clair :

### Client

- finaliser une reservation
- payer une reservation beta
- modifier un rendez-vous
- annuler un rendez-vous
- publier un avis
- modifier le profil / notifications
- creer un rendez-vous depuis les ecrans secondaires
- assigner / desassigner un employe depuis l ecran de support
- modifier les moyens de paiement

### Employee

- bloquer un creneau
- prendre en charge un creneau
- confirmer / terminer / encaisser / annuler un rendez-vous
- creer / modifier / annuler une demande de conges
- mettre a jour le profil employee

## Signal UX

Quand l application detecte un contexte hors ligne, un bandeau apparait :

`Mode hors ligne : consultation des donnees deja synchronisees uniquement.`

## 4. Comment tester l offline consultation

### Preparation

1. lancer l API et l application mobile
2. se connecter avec un compte de test
3. ouvrir une premiere fois les ecrans a mettre en cache

### Parcours Client a verifier

1. ouvrir `Mes rendez-vous`
2. ouvrir le detail d un rendez-vous
3. ouvrir `Mon profil`
4. ouvrir une fiche salon
5. couper le reseau du simulateur / telephone
6. revenir sur ces ecrans

Resultat attendu :

- le bandeau hors ligne s affiche
- les donnees deja chargees reapparaissent
- aucun loader infini
- aucun crash

### Parcours Employee a verifier

1. ouvrir le dashboard employee
2. ouvrir `Mes rendez-vous`
3. ouvrir le detail d un rendez-vous
4. ouvrir `Mon profil`
5. couper le reseau
6. revenir sur ces ecrans

Resultat attendu :

- le bandeau hors ligne s affiche
- les donnees deja synchronisees restent consultables
- les actions de mutation deviennent indisponibles ou bloquees proprement

### Verification du blocage des ecritures

Une fois hors ligne :

#### Client

- tenter une reservation
- tenter une modification / annulation
- tenter un avis
- tenter une edition de profil

#### Employee

- tenter un blocage de creneau
- tenter une prise en charge
- tenter une confirmation / completion / paiement
- tenter une demande de conges

Resultat attendu :

- aucune fausse impression de succes
- un message clair indique que l action demande une connexion

## 5. Fichiers et architecture

### Offline Consultation

- `apps/mobile/src/offline/store.ts`
- `apps/mobile/src/offline/cache.ts`
- `apps/mobile/src/offline/probe.ts`
- `apps/mobile/src/offline/guard.ts`
- `apps/mobile/src/api/useOfflineCachedQuery.ts`
- `apps/mobile/src/providers/OfflineProvider.tsx`
- `apps/mobile/src/components/OfflineBanner.tsx`

### Hooks branches sur le cache local

- `apps/mobile/src/api/appointments.ts`
- `apps/mobile/src/api/me.ts`
- `apps/mobile/src/api/discovery.ts`
- `apps/mobile/src/api/employee.ts`

### Ecrans de mutation proteges hors ligne

- `apps/mobile/app/(screens)/payment.tsx`
- `apps/mobile/app/(screens)/card-payment-details.tsx`
- `apps/mobile/app/(screens)/appointment-details.tsx`
- `apps/mobile/app/(screens)/leave-review.tsx`
- `apps/mobile/app/(screens)/edit-section.tsx`
- `apps/mobile/app/(screens)/assign-employee.tsx`
- `apps/mobile/app/(screens)/create-appointment.tsx`
- `apps/mobile/app/(screens)/profile/notifications.tsx`
- `apps/mobile/app/(screens)/profile/payment-methods.tsx`
- `apps/mobile/app/(employee)/dashboard.tsx`
- `apps/mobile/app/(employee)/availability.tsx`
- `apps/mobile/app/(employee)/appointment-detail.tsx`
- `apps/mobile/app/(employee)/leave.tsx`
- `apps/mobile/app/(employee)/profile.tsx`
- `apps/mobile/app/(admin)/admins.tsx`
- `apps/mobile/app/(admin)/admin-detail.tsx`
- `apps/mobile/app/(admin)/appointment-detail.tsx`
- `apps/mobile/app/(admin)/client-detail.tsx`
- `apps/mobile/app/(admin)/employee-detail.tsx`
- `apps/mobile/app/(admin)/salon-detail.tsx`
- `apps/mobile/app/(admin)/user-detail.tsx`

## 6. Limites connues

- le mode offline ne couvre pas un vrai offline-first
- les donnees ne sont consultables hors ligne que si elles ont deja ete chargees au moins une fois
- Admin n est pas un perimetre offline prioritaire pour cette Beta
- les images distantes de fiches salon peuvent ne pas se charger hors ligne meme si les metadonnees textuelles sont en cache

## 7. Recommandation de validation finale

Avant une recette cliente :

1. lancer `pnpm check:full`
2. rejouer au moins un parcours offline Client
3. rejouer au moins un parcours offline Employee
4. verifier qu une action d ecriture hors ligne est bien bloquee avec un message propre
5. verifier qu une mutation Admin affiche aussi un blocage clair sans connexion
