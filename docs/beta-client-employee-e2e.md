# Beta Client + Employee

## Setup

Depuis la racine du monorepo:

```bash
pnpm install
pnpm --filter api prisma migrate deploy
pnpm --filter api run seed:beta
pnpm --filter api build
pnpm --filter api start:dev
```

Comptes de test:

- Client: `client.beta@ambya.com` / `password123`
- Employee: `employee.beta@ambya.com` / `password123`
- Pro démo: `pro.beta@ambya.com` / `password123`

## Données de démo incluses

Le seed `seed:beta` crée:

- un salon de démo `Ambya Beta Studio`
- 2 employés
- plusieurs services catégorisés `hair`, `face`, `body`, `nails`, `fitness`
- un profil client complet avec questionnaire et informations utiles
- moyens de paiement client `CARD` et `MOMO`
- fidélité client
- rendez-vous client dans plusieurs états
- un groupe de réservation multi-prestations
- un rendez-vous non assigné pour la prise en charge Employee
- un créneau bloqué employé
- des demandes de congés `PENDING` et `APPROVED`

## Scénario E2E manuel Client

1. Se connecter avec `client.beta@ambya.com`.
2. Vérifier la Home et la découverte du salon `Ambya Beta Studio`.
3. Ouvrir la fiche salon et contrôler:
   - galerie
   - services
   - avis
4. Ajouter une ou plusieurs prestations au panier.
5. Choisir un créneau disponible.
6. Tester les 3 modes de paiement:
   - `Carte`: réservation créée avec paiement beta interne réussi
   - `Mobile Money`: réservation créée avec paiement beta interne réussi
   - `Payer sur place`: réservation créée avec paiement en attente
7. Vérifier l’écran de succès:
   - pas de faux message de confirmation salon
   - statut de paiement cohérent
8. Aller dans `Mes rendez-vous`.
9. Ouvrir le détail du groupe créé.
10. Vérifier modification / annulation si le créneau le permet.

## Scénario E2E manuel Employee

1. Se connecter avec `employee.beta@ambya.com`.
2. Vérifier le dashboard:
   - métriques
   - rendez-vous du jour
   - blocage de créneau
3. Depuis `Mes rendez-vous`:
   - ouvrir un rendez-vous `PENDING`
   - confirmer la prise en charge
   - marquer `terminé`
   - marquer `payé`
4. Vérifier qu’un rendez-vous `COMPLETED` apparaît dans l’onglet `Terminés`.
5. Ouvrir le détail d’un rendez-vous coiffure et vérifier les insights:
   - identité client
   - allergies
   - commentaires
   - profil cheveux
6. Aller dans `Créneaux disponibles`.
7. Prendre en charge le rendez-vous non assigné.
8. Revenir dans `Mes rendez-vous` et vérifier qu’il apparaît dans l’agenda employé.
9. Depuis le dashboard, bloquer un créneau au nom d’une cliente walk-in.
10. Vérifier ce créneau bloqué dans l’agenda.
11. Aller dans `Demandes de congés`.
12. Vérifier l’historique existant puis créer une nouvelle demande.
13. Aller dans `Profil`, modifier prénom/nom/email/téléphone, puis vérifier la persistance.

## Résultat attendu

La beta est considérée valide si:

- les données remontent intégralement du backend
- aucune vue Employee principale n’utilise de mock local
- le parcours Client reste navigable sans assistance
- le parcours Employee permet réellement les actions métier prévues
- les statuts `PENDING`, `CONFIRMED`, `COMPLETED`, `paid/unpaid` évoluent correctement
