# Beta Offline Consultation Guide

## Objectif

Ce document precise :

- ce qui est reellement consultable hors ligne sur la Beta
- ce qui est volontairement bloque sans connexion
- comment rejouer une recette offline fiable

Le perimetre concerne les flows `Client`, `Employee` et, de facon limitee, certaines surfaces `Admin`.

## Principe

Le mode offline Beta n'est **pas** un mode offline-first.

Ce qui est garanti :

- consultation des donnees deja synchronisees
- message clair quand l'application est hors ligne
- blocage propre des mutations

Ce qui n'est pas garanti :

- creation ou edition offline avec synchro differee
- cache complet de toutes les surfaces
- experience Admin offline riche

## Commandes de verification

Depuis la racine du repo :

```bash
pnpm check:full
pnpm check:mobile
```

## Ecrans consultables hors ligne

### Client

Si l'ecran a deja ete charge en ligne, l'utilisateur peut relire :

- la liste de ses rendez-vous
- le detail d'un groupe de rendez-vous deja consulte
- certaines donnees de profil deja synchronisees
- certaines donnees de fidelite deja synchronisees
- certaines surfaces de decouverte / salon deja ouvertes

### Employee

Si l'ecran a deja ete charge en ligne, l'utilisateur peut relire :

- le dashboard employee
- l'agenda
- le detail d'un rendez-vous deja consulte
- le profil employee
- la liste des demandes de conges

### Admin

L'offline n'est pas un objectif produit fort pour Admin sur cette Beta.

Par prudence produit :

- on ne promet pas une experience offline Admin complete
- les mutations Admin doivent rester bloquees proprement hors ligne

## Actions bloquees hors ligne

### Client

- creer une reservation
- modifier ou annuler un rendez-vous
- publier un avis
- modifier le profil ou certaines preferences
- modifier les moyens de paiement

### Employee

- confirmer, terminer, encaisser ou annuler un rendez-vous
- prendre un creneau disponible
- creer un creneau bloque
- creer, modifier ou supprimer une demande de conges
- modifier le profil

### Admin

- creation ou modification d'un admin
- edition d'un user, d'un salon ou d'un rendez-vous

## Resultat UX attendu

Quand l'application passe hors ligne :

- un bandeau d'information apparait
- les donnees deja synchronisees restent lisibles
- aucune mutation ne doit donner un faux succes
- un message clair doit indiquer qu'une connexion est necessaire

## Recette offline

### Preparation

1. Lancer l'API.
2. Lancer le mobile.
3. Se connecter avec un compte de test valide.
4. Ouvrir une premiere fois les ecrans a mettre en cache.

### Recette Client

1. Ouvrir `Mes rendez-vous`.
2. Ouvrir le detail d'un rendez-vous.
3. Ouvrir le profil.
4. Ouvrir une fiche salon.
5. Couper le reseau du simulateur ou du telephone.
6. Revenir sur ces ecrans.

Resultat attendu :

- le bandeau hors ligne s'affiche
- les donnees deja chargees reparaissent
- aucun loader infini
- aucun crash

### Recette Employee

1. Ouvrir le dashboard employee.
2. Ouvrir l'agenda.
3. Ouvrir le detail d'un rendez-vous.
4. Ouvrir le profil.
5. Ouvrir les conges.
6. Couper le reseau.
7. Revenir sur ces ecrans.

Resultat attendu :

- les ecrans deja synchronises restent consultables
- les actions d'ecriture sont bloquees proprement

### Verification explicite du blocage

Une fois hors ligne :

- tenter une reservation Client
- tenter une annulation Client
- tenter une mutation Employee sur un rendez-vous
- tenter une creation ou edition de conge
- tenter une mutation Admin

Resultat attendu :

- aucune fausse impression de succes
- message explicite indiquant qu'une connexion est requise

## Fichiers techniques utiles

- `apps/mobile/src/offline/cache.ts`
- `apps/mobile/src/offline/guard.ts`
- `apps/mobile/src/offline/probe.ts`
- `apps/mobile/src/offline/store.ts`
- `apps/mobile/src/api/useOfflineCachedQuery.ts`
- `apps/mobile/src/providers/OfflineProvider.tsx`

## Limites assumees

- les donnees offline sont relues seulement si elles ont deja ete chargees
- le cache local doit rester minimal sur les donnees sensibles
- l'offline Admin n'est pas un argument de vente principal pour cette Beta
