# Beta Client + Employee + Admin

## Setup

Depuis la racine du monorepo :

```bash
pnpm install
pnpm --filter api prisma migrate deploy
pnpm --filter api run seed:beta
pnpm --filter api build
pnpm --filter api start:dev
```

## Comptes de test

- Client : `client.beta@ambya.com` / `password123`
- Employee : `employee.beta@ambya.com` / `password123`
- Admin : `admin.beta@ambya.com` / `password123`
- Pro demo : `pro.beta@ambya.com` / `password123`

## Donnees de demo incluses

Le seed `seed:beta` cree :

- un salon principal `Ambya Beta Studio`
- plusieurs salons additionnels avec adresses et coordonnees realistes
- des employees avec specialites reelles
- des services categorises `hair`, `barber`, `face`, `body`, `nails`, `fitness`
- un profil client complet avec questionnaire et fidelite
- des moyens de paiement client `CARD` et `MOMO`
- des rendez-vous client dans plusieurs etats
- un rendez-vous non assigne pour la prise en charge Employee
- un creneau bloque employee
- des demandes de conges `PENDING` et `APPROVED`
- des comptes Admin avec audit logs exploitables

## Scenario E2E manuel Client

1. Se connecter avec `client.beta@ambya.com`.
2. Verifier la home :
   - recherche
   - selections du moment
   - mode `Pres`
   - carte interactive
3. Ouvrir une fiche salon et verifier :
   - description
   - services
   - equipe avec specialites
   - avis reels ou absence d avis clairement affichee
4. Ajouter une ou plusieurs prestations au panier.
5. Choisir un creneau disponible.
6. Verifier qu un employe explicite ne peut etre choisi que s il couvre tout le panier.
7. Tester les parcours de paiement beta :
   - carte
   - mobile money
   - payer sur place
8. Verifier l ecran de succes :
   - pas de faux message de confirmation salon
   - statut de paiement coherent
9. Aller dans `Mes rendez-vous`.
10. Ouvrir le detail du groupe cree.
11. Verifier modification / annulation si le creneau le permet.
12. Aller dans `Profil` et verifier la persistance des informations et preferences.

## Scenario E2E manuel Employee

1. Se connecter avec `employee.beta@ambya.com`.
2. Verifier le dashboard :
   - metriques
   - rendez-vous du jour
   - blocage de creneau
3. Depuis `Mes rendez-vous` :
   - ouvrir un rendez-vous `PENDING`
   - confirmer la prise en charge
   - marquer `termine`
   - marquer `paye`
4. Verifier qu un rendez-vous `COMPLETED` apparait dans l onglet `Termines`.
5. Ouvrir le detail d un rendez-vous coiffure ou bien-etre et verifier les insights metier.
6. Aller dans `Creneaux disponibles`.
7. Verifier que seuls les rendez-vous compatibles avec les specialites de l employee sont listes.
8. Prendre en charge un rendez-vous non assigne compatible.
9. Revenir dans `Mes rendez-vous` et verifier sa presence dans l agenda.
10. Depuis le dashboard, bloquer un creneau au nom d une cliente walk-in.
11. Verifier ce creneau bloque dans l agenda.
12. Aller dans `Demandes de conges`.
13. Verifier l historique existant puis creer, modifier ou annuler une demande `PENDING`.
14. Aller dans `Profil`, modifier les informations et verifier la persistance.

## Scenario E2E manuel Admin

1. Se connecter avec `admin.beta@ambya.com`.
2. Verifier le dashboard :
   - KPI overview
   - KPI rendez-vous
   - KPI paiements
   - fidelite
   - acces rapides
3. Ouvrir `Utilisateurs`, puis une fiche client :
   - profil complet
   - questionnaire lisible
   - moyens de paiement
   - transactions recentes
   - rendez-vous recents
4. Modifier la fiche client puis verifier la persistance.
5. Ouvrir une fiche employee :
   - specialites
   - statut compte / profil
   - rendez-vous recents
6. Modifier la fiche employee puis verifier la persistance.
7. Ouvrir `Rendez-vous`, puis une fiche rendez-vous :
   - details client
   - paiements
   - historique recent
   - correction guidee
8. Ouvrir `Audit logs` :
   - filtrer par action
   - filtrer par entite
   - filtrer par utilisateur
   - verifier la lisibilite des changements
9. Ouvrir `Admins` et verifier :
   - liste
   - detail
   - creation / modification selon les droits
10. Tester la deconnexion.

## Resultat attendu

La beta est consideree valide si :

- les donnees remontent integralement du backend
- aucune vue Employee principale n utilise de mock local
- le parcours Client reste navigable sans assistance
- le parcours Employee permet reellement les actions metier prevues
- le parcours Admin permet la consultation, la correction et la tracabilite support
- les contraintes de specialite sont respectees dans la reservation et la prise en charge
- les statuts `PENDING`, `CONFIRMED`, `COMPLETED`, `paid/unpaid` evoluent correctement
