# API Remediation Summary

Date : **03/05/2026**

Perimetre :
- `apps/api`
- mise a jour mobile uniquement sur le contrat API Pro impacte

## 1. Routes supprimees / gardees / depréciees

### Namespace Pro appointments retenu

Namespace conserve :
- `/api/pro/appointments/*`

Namespace retire comme source active :
- `/api/appointments/pro/*`

Decision appliquee :
- les routes Pro ont ete retirees de `AppointmentsController`
- `ProAppointmentsController` devient l unique controller HTTP Pro pour :
  - `GET /api/pro/appointments/calendar`
  - `GET /api/pro/appointments/pending`
  - `GET /api/pro/appointments/history`
  - `GET /api/pro/appointments/history/export`
  - `PATCH /api/pro/appointments/:id/confirm`
  - `PATCH /api/pro/appointments/:id/reject`

Impact frontend :
- le mobile a ete aligne pour utiliser `/pro/appointments/history`

### Salon settings retenu

Route conservee :
- `GET /api/pro/salon-settings`
- `PUT /api/pro/salon-settings`

Route ambigue retiree indirectement :
- le vieux controller `salons` expose sous `pro/salon-settings` a ete supprime

Decision appliquee :
- `SalonSettingsController` est l unique controller responsable du contrat Pro salon settings
- le vieux `SalonsController` et son module ont ete retires

### UsersController vide

Action appliquee :
- `UsersController` a ete supprime
- `UsersModule` ne publie plus de controller HTTP vide

## 2. Namespace Pro retenu

Choix final :
- **un seul namespace Pro officiel** pour les rendez-vous Pro : `/api/pro/appointments/*`

Raison :
- suppression du doublon critique
- une seule source de verite HTTP
- plus de divergence silencieuse possible entre deux controllers

## 3. Strategie salon-settings retenue

Controller unique :
- `SalonSettingsController`

Responsabilite retenue :
- infos salon visibles/editees depuis l ecran Pro settings
- categories salon
- modes de paiement salon
- regles de depot
- horaires salon

Decision :
- plus de controller concurrent sur `pro/salon-settings`

## 4. Strategie conges retenue

Source de verite Beta retenue :
- `LeaveRequest`

Constat :
- `EmployeeService`
- `DiscoveryService`
- `AdminService`
reposaient deja sur `LeaveRequest`

Decision appliquee :
- aucun changement cassant de schema n a ete fait
- `EmployeeLeaveRequest` reste present dans Prisma mais est a considerer **deprecated pour le scope Beta actuel**

Limite restante :
- la duplication de modele existe encore dans le schema Prisma
- elle est maintenant documentee et le flow actif Beta est explicite

## 5. Strategie horaires retenue

Source de verite retenue :
- `SalonOpeningHour`

Decision appliquee :
- `SalonSettingsService` lit et ecrit les horaires via `openingHours`
- `DiscoveryService` a ete corrige pour interpreter correctement `SalonOpeningHour`
- `AdminService` a ete corrige pour normaliser correctement ce meme format

Ce qui n est plus source active pour la Beta :
- `SalonSchedule`
- `Salon.openingHoursJson`

Limite restante :
- ces structures existent encore au schema, mais elles ne pilotent plus le flow retenu

## 6. Strategie categories retenue

Source de verite retenue :
- `Salon.categories`

Decision appliquee :
- `SalonSettingsService` ne lit plus ni n ecrit `socialLinks.categories`
- les categories passent par le champ natif `Salon.categories`

## 7. Strategie audit logs retenue

Strategie active :
- mutations **non-admin** :
  - log automatique via `AuditInterceptor`
  - metadata reduites pour ne pas journaliser inutilement `query`/`params`
- mutations **admin** :
  - log manuel metier via `AdminService` et `AuditService.logCrudMutation`
  - pas de double log automatique sur `/admin`

Preuve ajoutee :
- test sur `AuditInterceptor` pour mutation non-admin
- test sur `AdminService` pour mutation admin journalisee

## 8. Securite fermee / renforcee

Points corriges :
- plus de doublon critique de routes Pro appointments
- plus de chevauchement de controllers sur `pro/salon-settings`
- plus de pile parallele `common/*` pour les guards/decorators utilises
- `PaymentMethodsService.list()` ne selectionne plus les champs sensibles inutiles
- `PaymentsController.cashRegister()` utilise maintenant le DTO `GetCashRegisterQueryDto`
- `PaymentsService.updateStatus()` a une regle d autorisation clarifiee :
  - `CLIENT` : peut seulement annuler son propre payment intent
  - `PROFESSIONAL` / `SALON_MANAGER` : peut agir sur les intents de son salon
  - `EMPLOYEE` : peut agir seulement s il appartient au salon cible
  - `ADMIN` : autorise globalement
- les reponses admin detaillees ont ete reduites sur certains champs client sensibles
- l audit automatique ne pousse plus `query` et `params` entiers dans les metadata

## 9. Commandes de validation

Commandes validees :

```bash
pnpm --filter api build
pnpm --filter api check:beta-scope
pnpm --filter api test -- --runInBand
pnpm --filter api exec tsc --noEmit
```

Resultats :
- `pnpm --filter api build` : **OK**
- `pnpm --filter api check:beta-scope` : **OK**
- `pnpm --filter api test -- --runInBand` : **OK**
- `pnpm --filter api exec tsc --noEmit` : **OK**

Note environnement :
- pendant l audit precedent, `tsc --noEmit` avait echoue en contexte sandbox Windows
- la verification finale a bien pu etre rejouee et est verte

## 10. Tests ajoutes / renforces

Tests ajoutes :
- `src/auth/guards/roles.guard.spec.ts`
- `src/appointments/pro-appointments.controller.spec.ts`
- `src/payment-methods/payment-methods.service.spec.ts`
- `src/payments/payments.service.spec.ts`
- `src/salon-settings/salon-settings.service.spec.ts`
- `src/audit/audit.interceptor.spec.ts`

Tests renforces :
- `src/discovery/discovery.service.spec.ts`
- `src/admin/admin.service.spec.ts`

Etat final des suites actuellement rejouees :
- **12 suites**
- **38 tests**
- **verts**

## 11. Limites restantes

- `EmployeeLeaveRequest` reste dans le schema Prisma et devra etre nettoye plus tard
- `SalonSchedule` et `openingHoursJson` restent presents au schema et devront etre retires ou migres proprement plus tard
- `PaymentsService` garde encore de la logique dense et meriterait un decoupage ulterieur
- `AdminService` reste volumineux meme apres reduction de surface sensible

## 12. Resume final

L API est maintenant :
- buildable
- testable
- plus coherente
- plus sure
- sans doublon critique de routes Pro
- avec une source de verite claire pour le flow Pro settings et availability
- avec des validations rejouables et documentees
