# Audit strict API - `apps/api`

Date de l audit : **03/05/2026**

Perimetre :
- uniquement `apps/api`
- aucun changement code applique pendant cet audit
- le mobile n est mentionne que lorsqu un contrat API impacte directement le frontend

Preuves principales :
- `cmd /c pnpm --filter api build`
- `cmd /c pnpm --filter api check:beta-scope`
- `cmd /c pnpm --filter api exec tsc --noEmit`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/tsconfig.build.json`
- `apps/api/tsconfig.beta-scope.json`
- `apps/api/src/**/*.controller.ts`
- `apps/api/src/**/*.module.ts`
- `apps/api/src/**/*.service.ts`
- `apps/api/prisma/schema.prisma`

## A. Resume executif

- Etat global API :
  - **backend compilable**, mais **structurellement incoherent** sur plusieurs axes critiques : duplication de routes Pro, duplication de guards/decorators auth/common, plusieurs sources de verite Prisma concurrentes, et couverture de validation Beta partielle.
- Niveau de maturite :
  - **Beta technique exploitable**, **pas encore backend propre et unifie**.
- Principaux risques :
  - duplication de routes Pro appointments
  - chevauchement direct sur `pro/salon-settings`
  - `tsconfig.beta-scope.json` qui ne couvre pas tout `apps/api`
  - double pile `auth/*` vs `common/*` pour les guards/decorators
  - modeles Prisma concurrents pour les conges et les horaires
  - couverture de tests faible hors auth/appointments/discovery/employee
- Build status :
  - `pnpm --filter api build` : **OK**
  - `pnpm --filter api check:beta-scope` : **OK**
  - `pnpm --filter api exec tsc --noEmit` : **KO outil/environnement**, pas une erreur TypeScript applicative prouvee
- Test status :
  - `test:beta-scope` : **6 suites / 22 tests verts**
  - pas de tests API e2e
  - pas de tests sur plusieurs modules exposes en production

## B. Erreurs TypeScript / build

### Resultat global

- `pnpm --filter api build` compile l API complete via `tsconfig.build.json`
- `pnpm --filter api check:beta-scope` compile un sous-ensemble du code et lance 6 suites Jest ciblees
- `pnpm --filter api exec tsc --noEmit` echoue avec un `EPERM` Windows sur `node_modules/typescript/bin/tsc`
- aucune erreur TypeScript source n a ete reproduite sur le build principal pendant cet audit

| Fichier | Erreur | Cause | Impact | Correction | Priorite |
|---|---|---|---|---|---|
| `apps/api/package.json` | `pnpm --filter api exec tsc --noEmit` KO | execution `pnpm exec tsc` casse sur `EPERM` Windows lors de l ouverture de `node_modules/typescript/bin/tsc` | empeche d utiliser le check TypeScript standard comme preuve fiable | aligner le script de verification sur `node ../../node_modules/typescript/bin/tsc ...` comme pour `build` | Haute |
| `apps/api/tsconfig.beta-scope.json` | pas d erreur de compilation, mais couverture partielle | le scope compile `auth`, `appointments`, `discovery`, `employee`, `me`, `common`, mais **pas** `admin`, `payments`, `payment-methods`, `salons`, `salon-settings`, `services`, `employees`, `clients`, `exports`, `expenses`, `loyalty`, `promotions` | le check Beta vert ne prouve pas la sante TypeScript de toute l API | soit renommer le scope de facon plus stricte, soit l elargir aux modules reellement exposes | Critique |
| `apps/api/package.json` | incoherence entre build/test scope | `test:beta-scope` inclut `src/admin/admin.service.spec.ts`, alors que `admin/**/*.ts` n est pas inclus dans `tsconfig.beta-scope.json` | faux sentiment de validation complete du module Admin | aligner la compilation scope avec les tests scope | Haute |
| `apps/api/tsconfig.json` | niveau de strictness partiel | `strictNullChecks` est actif, mais pas `strict`, pas de `noUnusedLocals`, `noImplicitAny` desactive | laisse passer de la dette TypeScript silencieuse | durcir progressivement la config apres nettoyage des warnings | Moyenne |

### Distinction demandee

#### Erreurs bloquantes Beta

- aucune erreur TypeScript bloquante n a ete reproduite sur `pnpm --filter api build`
- en revanche, le **perimetre de preuve** de `check:beta-scope` est insuffisant pour qualifier toute l API

#### Erreurs hors scope mais a corriger

- aucune erreur de build hors scope reproduite pendant cet audit
- la dette est surtout **structurelle** et **outillage**

#### Erreurs liees a des scripts obsoletes

- `pnpm --filter api exec tsc --noEmit` n est pas opposable en l etat
- les scripts `check:pro:*` restent presents dans `apps/api/package.json` alors que la logique Pro est deja partiellement dupliquee ailleurs

#### Erreurs liees a des dependances manquantes

- aucune dependance manquante reproduite pendant cet audit
- le precedent incident `bcrypt` n est plus present

## C. Doublons de routes

| Route | Fichiers concernes | Doublon / ambiguite | Risque | Recommandation | Priorite |
|---|---|---|---|---|---|
| `/api/appointments/pro/*` et `/api/pro/appointments/*` | `apps/api/src/appointments/appointments.controller.ts`, `apps/api/src/appointments/pro-appointments.controller.ts` | meme fonctionnalite exposee sous deux namespaces differents, meme service, memes actions `calendar`, `pending`, `history`, `history/export`, `confirm`, `reject` | maintenance fragile, divergence future des contrats, confusion frontend et docs | **fusionner** vers un seul namespace; a defaut garder un alias documente avec plan de deprecation | Critique |
| `/api/pro/salon-settings` | `apps/api/src/salon-settings/salon-settings.controller.ts`, `apps/api/src/salons/salon.controller.ts` | deux controllers sous le meme prefixe; `GET /pro/salon-settings` existe deja dans deux endroits conceptuellement concurrents | collision semantique, source de verite floue entre “settings” et “salon info” | **fusionner** ou **renommer** un des controllers; la situation actuelle ne doit pas rester telle quelle | Critique |
| `users` | `apps/api/src/users/users.controller.ts` | controller declare sans endpoint | bruit architectural, module expose mais sans contrat HTTP reel | **supprimer** le controller si inutile, ou **documenter** qu il est interne et retirer `@Controller` | Moyenne |
| `salons/:id` et `salons/:id/availability` sous `DiscoveryController` | `apps/api/src/discovery/discovery.controller.ts`, `apps/api/src/salons/*` | pas un doublon exact, mais le domaine Salon est coupe entre discovery public et `pro/salon-settings` prive | namespace backend peu lisible, domaine Salon eparpille | **garder mais documenter** puis rationaliser plus tard par domaine | Moyenne |
| `payments` vs `me/payment-methods` | `apps/api/src/payments/*`, `apps/api/src/payment-methods/*` | pas de doublon de route, mais deux domaines paiement relies sans facade claire | risque de contrats incomplets cote frontend et tests | **garder mais documenter** les responsabilites de chaque module | Moyenne |
| `employee leave` via `employee/leave-requests` vs modeles Prisma de conges multiples | `apps/api/src/employee/*`, `apps/api/prisma/schema.prisma` | pas de doublon HTTP, mais backend repose sur un modele `LeaveRequest` alors qu un autre modele `EmployeeLeaveRequest` existe en parallele | dette forte, comportement ambigu pour admin/reporting/availability | **garder temporairement mais documenter**, puis **fusionner** les modeles | Haute |

### Controllers exposes mais faibles / obsoletes

- `UsersController` : vide
- `ProAppointmentsController` : simple facade dupliquee du controller principal
- `SalonsController` : positionne sous `pro/salon-settings`, ce qui le rend trompeur

## D. Architecture NestJS

### Problemes

#### 1. Double pile auth/common

Le backend maintient deux implementations paralleles pour des briques transverses :

- `apps/api/src/auth/guards/jwt-auth.guard.ts`
- `apps/api/src/common/guards/jwt-auth.guard.ts`
- `apps/api/src/auth/guards/roles.guard.ts`
- `apps/api/src/common/guards/roles.guard.ts`
- `apps/api/src/auth/decorators/current-user.decorator.ts`
- `apps/api/src/common/decorators/current-user.decorator.ts`

Constat :
- certains controllers importent `auth/*`
- d autres importent `common/*`
- la meme notion de `CurrentUser` n est pas typee partout pareil

Impact :
- risque de divergence de comportement
- RBAC et typing non uniformes
- dette de maintenance immediate

#### 2. Injection Prisma incoherente

`PrismaModule` existe, mais plusieurs modules continuent de fournir `PrismaService` localement :

- `AuthModule`
- `EmployeeModule`
- `PaymentsModule`
- `PaymentMethodsModule`
- `DiscoveryModule`
- `MeModule`
- `ConfigModule`

alors que d autres importent bien `PrismaModule`.

Impact :
- pattern d injection incoherent
- comprehension globale degradee
- risque de duplication de responsabilite plus que bug runtime prouve

#### 3. Responsabilites mal decoupees

- `AppointmentsController` melange :
  - endpoints client
  - endpoints groupe
  - endpoints Pro
- `AppointmentsService` concentre trop de logique metier et plusieurs variantes de parcours
- `AdminService` est tres volumineux et centralise trop de logique d agregration, mapping et audit

Impact :
- service monolithique
- tests unitaires plus difficiles
- regressions plus probables

#### 4. Scope Beta technique incomplet

`tsconfig.beta-scope.json` ne couvre pas les modules suivants pourtant reels ou testes ailleurs :

- `admin`
- `payments`
- `payment-methods`
- `salons`
- `salon-settings`
- `employees`
- `services`
- `clients`
- `exports`
- `expenses`

Impact :
- build vert partiel
- perception trop optimiste de la sante backend

#### 5. DTOs et ValidationPipe utilises de facon inegale

Points corrects :
- `main.ts` active `ValidationPipe` avec `whitelist`, `forbidNonWhitelisted`, `transform`

Points faibles :
- plusieurs endpoints utilisent encore des primitives `@Query('...')` au lieu de DTO dedie
- `PaymentsController.cashRegister()` importe `GetCashRegisterQueryDto` mais ne l utilise pas

Impact :
- validation reelle inegale selon les routes
- pipe global utile mais sous-exploite

### Recommandations

- unifier la pile `auth/*` et supprimer les doublons `common/*` ou inversement
- imposer `PrismaModule` comme unique point d injection de `PrismaService`
- separer les controllers/services par sous-domaines plus nets
- realigner `beta-scope` avec le perimetre backend vraiment revendique
- basculer les endpoints critiques vers des DTOs partout

## E. Securite API

### Risques classes par criticite

#### Critical

- aucun risque `Critical` residuel etabli de facon certaine pendant cet audit

#### High

| Niveau | Fichier | Endpoint | Impact | Correction recommandee |
|---|---|---|---|---|
| High | `apps/api/src/appointments/appointments.controller.ts` + `apps/api/src/appointments/pro-appointments.controller.ts` | toutes les routes Pro appointments dupliquees | deux surfaces HTTP pour la meme logique sensible, plus de risques de derive et de regression d autorisation | supprimer le doublon et garder un seul namespace |
| High | `apps/api/src/salon-settings/salon-settings.controller.ts` + `apps/api/src/salons/salon.controller.ts` | `GET/PUT /api/pro/salon-settings*` | collision fonctionnelle sur un domaine sensible de configuration salon | fusionner ou renommer les routes et clarifier la source de verite |

#### Medium

| Niveau | Fichier | Endpoint | Impact | Correction recommandee |
|---|---|---|---|---|
| Medium | `apps/api/src/auth/auth.module.ts` | auth global | JWT long par defaut (`7d`) sans refresh token | ajouter refresh token ou documenter explicitement le compromis Beta |
| Medium | `apps/api/src/payment-methods/payment-methods.service.ts` | `GET /api/me/payment-methods` | le `findMany` sans `select` peut renvoyer `providerRef` / `providerData` inutilement | limiter la reponse a un DTO de lecture minimal |
| Medium | `apps/api/src/admin/admin.service.ts` | `GET /api/admin/users/:id`, `GET /api/admin/salons/:id`, `GET /api/admin/appointments/:id` | reponses potentiellement tres riches en donnees, difficile a minimiser/revoir | reduire les champs renvoyes a ceux strictement necessaires |
| Medium | `apps/api/src/audit/audit.interceptor.ts` | mutations hors `/admin` | logs d audit automatiques incluent `req.query` et `req.params` | minimiser les metadata journalisees, surtout si de futures routes ajoutent des donnees sensibles en query |
| Medium | `apps/api/src/audit/audit.interceptor.ts` + `apps/api/src/admin/admin.service.ts` | routes admin | l interceptor saute toutes les routes `/admin`; la couverture d audit depend alors de logs manuels non systematiques | definir une strategie d audit admin uniforme et verifiable |
| Medium | `apps/api/src/payments/payments.service.ts` | `PATCH /api/payments/intents/:id/status` | logique contradictoire: verification stricte `intent.userId === user.userId`, puis regles staff/admin; le contrat staff/admin semble donc casse ou trompeur | clarifier le role autorise reel et aligner le code sur ce contrat |
| Medium | `apps/api/src/payments/payments.controller.ts` | `GET /api/payments/cash-register` | DTO importe mais non utilise; validation query incomplete | utiliser `GetCashRegisterQueryDto` reellement |

#### Low

| Niveau | Fichier | Endpoint | Impact | Correction recommandee |
|---|---|---|---|---|
| Low | `apps/api/src/main.ts` | global | rate limiting en memoire simple sur `/api/auth`, non distribue | acceptable Beta, mais a renforcer si multi-instance |
| Low | `apps/api/src/salons/salon.service.ts`, `apps/api/src/payments/payments.service.ts` | plusieurs | messages moches / caracteres mal encodes | nettoyer pour clarte et support |

### Points de securite positifs

- `JWT_SECRET` obligatoire au demarrage
- extraction JWT uniquement via bearer token dans `jwt.strategy.ts`
- `AUTH_EXPOSE_OTP_DEBUG` necessaire pour exposer `otpDebugCode`
- CORS borne dans `main.ts`
- `ValidationPipe` global avec `whitelist` + `forbidNonWhitelisted`

## F. Prisma / DB

### Problemes de modele

#### 1. Deux modeles de conges concurrents

- `LeaveRequest`
- `EmployeeLeaveRequest`

Constat :
- `EmployeeService` utilise `LeaveRequest`
- `DiscoveryService` filtre les indisponibilites via `leaveRequest`
- `AdminService` compte `pendingLeaveRequests` sur `leaveRequest`
- mais `EmployeeLeaveRequest` et `EmployeeAbsence` existent aussi dans le schema

Risque :
- logique de conges eclatee
- reporting/admin incoherent a terme
- migrations plus difficiles

#### 2. Trois representations concurrentes des horaires

- `Salon.openingHoursJson`
- `SalonOpeningHour`
- `SalonSchedule`

Constat :
- `DiscoveryService` lit `openingHours`
- `SalonSettingsService` lit et reecrit `salonSchedules`
- `openingHoursJson` reste dans `Salon`

Risque :
- disponibilites fausses selon la route utilisee
- double maintenance des horaires

#### 3. Categories salon stockees au mauvais endroit

- `Salon.categories` existe deja
- `SalonSettingsService` lit/ecrit les categories dans `socialLinks.categories`

Risque :
- concurrence de source de verite
- lecture front differente selon les endpoints

#### 4. Strategie de suppression incoherente

- `Service` : soft delete via `deletedAt`
- `Expense` : soft delete via `deletedAt`
- `PaymentMethod` : desactivation via `isActive`
- `LeaveRequest` : hard delete dans `EmployeeService.cancelLeaveRequest`

Risque :
- historique heterogene
- auditabilite faible

#### 5. Audit logs partiellement alimentes

- `AuditLog` existe
- `AuditInterceptor` alimente automatiquement les mutations hors admin
- les routes admin reposent surtout sur des appels manuels dans `AdminService`

Risque :
- journaux incomplets selon le module

### Recommandations

- choisir un seul modele de conges
- choisir une seule representation des horaires
- utiliser `Salon.categories` comme source de verite ou supprimer la copie dans `socialLinks`
- standardiser la strategie de suppression
- formaliser la couverture d audit log par domaine

## G. Etat par module

### Auth

- Routes :
  - `/api/auth/register`
  - `/api/auth/register-owner`
  - `/api/auth/login`
  - `/api/auth/me`
  - `/api/auth/verify-otp`
  - `/api/auth/resend-otp`
- Securite :
  - bonne base sur JWT secret, bearer token only, OTP debug flag
  - pas de refresh token
- DTO :
  - globalement corrects
- Tests :
  - spec existante et utile
- Problemes :
  - session Beta perfectible
  - encodage degrade dans certains messages

### Appointments

- Routes :
  - client, groupes, et Pro dans `AppointmentsController`
  - doublon Pro complet dans `ProAppointmentsController`
- Creation simple :
  - backend reel
- Creation panier :
  - backend reel via `from-cart`
- Multi-service / multi-employe :
  - logique presente
- Statuts / conflits :
  - structure presente
- Routes Pro dupliquees :
  - oui, **probleme majeur**
- Tests :
  - spec presente, mais ne couvre pas toute la surface HTTP Pro
- Problemes :
  - duplication de namespace
  - controller/service trop larges

### Employee

- Routes :
  - dashboard, schedule-items, detail/action, available-slots, blocked-slots, leave-requests, profile
- RBAC :
  - globalement mieux structure que d autres modules
- Conges :
  - implementation active basee sur `LeaveRequest`
- Tests :
  - spec correcte, y compris sur des cas conges
- Problemes :
  - dependance a un modele Prisma concurrent
  - aucune preuve e2e API large

### Admin

- Routes :
  - dashboard KPI, admins, users, salons, appointments, audit-logs
- RBAC :
  - controller protege avec `JwtAuthGuard`, `RolesGuard`, `@Roles(ADMIN)`
- Tests :
  - spec existante mais tres faible; elle ne teste pas les endpoints admin ni les autorisations
- Problemes :
  - service massif
  - reponses potentiellement trop riches
  - audit admin partiellement manuel

### Discovery

- Routes :
  - `discover/home`
  - `discover/search`
  - `salons/:id`
  - `salons/:id/availability`
- Securite :
  - public, coherent par design
- Probleme :
  - lit `openingHours` tandis que `salon-settings` ecrit `salonSchedules`
  - categorie/horaires/social links encore editorialises

### Salons

- Routes :
  - exposees sous `pro/salon-settings`, pas sous `pro/salons`
- Probleme :
  - mauvais namespace
  - overlap direct avec `SalonSettingsController`
  - use `common/*` alors que d autres modules utilisent `auth/*`

### Payments

- Routes :
  - `GET /api/payments/intents`
  - `POST /api/payments/intents`
  - `PATCH /api/payments/intents/:id/status`
  - `GET /api/payments/cash-register`
- Donnees sensibles :
  - `providerData` possible en update
- Cohherence Beta :
  - module present, mais tests absents et contrat staff/admin flou
- Problemes :
  - validation query incomplete
  - logique d autorisation contradictoire dans `updateStatus`

### Payment Methods

- Routes :
  - `GET /api/me/payment-methods`
  - `POST /api/me/payment-methods`
  - `PATCH /api/me/payment-methods/:id/set-default`
  - `DELETE /api/me/payment-methods/:id`
- Donnees sensibles :
  - `list()` renvoie potentiellement trop de champs
- Cohherence Beta :
  - service simple, mais non teste

## H. Tests API a ajouter

### Tests existants

- `src/auth/auth.service.spec.ts`
- `src/appointments/appointments.service.spec.ts`
- `src/discovery/discovery.service.spec.ts`
- `src/employee/employee.service.spec.ts`
- `src/admin/admin.service.spec.ts`
- `src/app.controller.spec.ts`

### Faiblesses

- pas de tests HTTP Nest end-to-end
- pas de tests sur `payments`
- pas de tests sur `payment-methods`
- pas de tests sur `salons`
- pas de tests sur `salon-settings`
- pas de tests sur `employees`
- pas de tests sur `services`
- pas de tests sur `clients`
- pas de tests sur `audit`
- test admin trop faible pour un module critique

### Liste claire a ajouter pour rendre l API opposable

1. Tests HTTP `appointments` sur un seul namespace Pro retenu
2. Tests RBAC `admin`:
   - acces refuse hors admin
   - acces permis admin
3. Tests `payments.updateStatus`:
   - client
   - employee
   - professional
   - admin
   - transitions invalides
4. Tests `payment-methods.list` pour verifier qu aucun champ sensible inutile n est renvoye
5. Tests `salon-settings` / `salons` pour figer le contrat retenu et supprimer l ambiguite
6. Tests `employee leave` pour figer le modele reellement utilise
7. Tests `discovery availability` pour verifier l usage correct de la source de verite horaires/conges
8. Tests d audit sur au moins :
   - une mutation non-admin
   - une mutation admin
9. Test de compilation ou smoke test qui couvre tous les modules API exposes

## I. Plan d action priorise

### Lot 1. Erreurs TypeScript / build

- Objectif :
  - rendre la validation TypeScript backend univoque et opposable
- Fichiers concernes :
  - `apps/api/package.json`
  - `apps/api/tsconfig.beta-scope.json`
  - `apps/api/tsconfig.json`
- Actions :
  - corriger le check `pnpm exec tsc --noEmit`
  - aligner `beta-scope` avec le perimetre backend reellement revendique
  - clarifier la difference entre build complet et build scope
- Criteres de succes :
  - `build`
  - `check:beta-scope`
  - `tsc --noEmit`
  passent tous avec une signification claire
- Commandes de validation :
  - `pnpm --filter api build`
  - `pnpm --filter api check:beta-scope`
  - `pnpm --filter api exec tsc --noEmit`

### Lot 2. Doublons de routes

- Objectif :
  - eliminer les namespaces concurrents
- Fichiers concernes :
  - `apps/api/src/appointments/appointments.controller.ts`
  - `apps/api/src/appointments/pro-appointments.controller.ts`
  - `apps/api/src/salon-settings/salon-settings.controller.ts`
  - `apps/api/src/salons/salon.controller.ts`
  - `apps/api/src/users/users.controller.ts`
- Actions :
  - fusionner ou deprecier les routes Pro appointments
  - fusionner ou renommer `pro/salon-settings`
  - supprimer les controllers vides
- Criteres de succes :
  - un seul namespace par domaine
  - aucune route semantiquement dupliquee
- Commandes de validation :
  - `pnpm --filter api build`
  - grep routes controllers
  - tests HTTP cibles

### Lot 3. Securite API

- Objectif :
  - fermer les ambiguities RBAC et les fuites de contrat
- Fichiers concernes :
  - `apps/api/src/auth/*`
  - `apps/api/src/payments/*`
  - `apps/api/src/payment-methods/*`
  - `apps/api/src/admin/*`
  - `apps/api/src/audit/*`
- Actions :
  - clarifier `payments.updateStatus`
  - reduire les payloads sensibles
  - uniformiser la strategie d audit admin
  - documenter ou traiter le refresh token
- Criteres de succes :
  - contrats d autorisation simples et testables
  - pas de champs sensibles inutiles en sortie
- Commandes de validation :
  - `pnpm --filter api test -- --runInBand`
  - tests RBAC cibles

### Lot 4. Prisma / coherence donnees

- Objectif :
  - restaurer une seule source de verite par concept metier
- Fichiers concernes :
  - `apps/api/prisma/schema.prisma`
  - `apps/api/src/employee/*`
  - `apps/api/src/discovery/*`
  - `apps/api/src/salon-settings/*`
  - `apps/api/src/salons/*`
- Actions :
  - choisir le modele unique de conges
  - choisir le modele unique d horaires
  - sortir les categories de `socialLinks`
- Criteres de succes :
  - plus de modeles concurrents pour le meme besoin
  - availability et salon settings lisent/ecrivent la meme source
- Commandes de validation :
  - `pnpm --filter api build`
  - tests discovery/employee/salon-settings

### Lot 5. Tests API

- Objectif :
  - rendre l API defendable, pas seulement compilable
- Fichiers concernes :
  - `apps/api/src/**/*.spec.ts`
  - eventuels tests e2e API
- Actions :
  - ajouter des tests sur admin, payments, payment-methods, salon-settings, audit
  - introduire quelques tests HTTP de contrat
- Criteres de succes :
  - les routes critiques ont une preuve automatisable
- Commandes de validation :
  - `pnpm --filter api test -- --runInBand`
  - `pnpm --filter api check:beta-scope`

### Lot 6. Nettoyage architecture

- Objectif :
  - reduire la dette transversale qui fabrique les regressions
- Fichiers concernes :
  - `apps/api/src/auth/*`
  - `apps/api/src/common/*`
  - `apps/api/src/*/*.module.ts`
  - `apps/api/src/appointments/*`
  - `apps/api/src/admin/*`
- Actions :
  - unifier `auth/*` vs `common/*`
  - imposer `PrismaModule`
  - decouper les services trop monolithiques
- Criteres de succes :
  - conventions uniques
  - modules lisibles
  - providers coherents
- Commandes de validation :
  - `pnpm --filter api build`
  - `pnpm --filter api exec tsc --noEmit`
  - tests modules critiques

## Conclusion

Le backend `apps/api` n est pas en echec de build, mais il est encore loin d etre “propre” au sens architecturel et contractuel.

Ce qui est factuellement bon :
- la build complete passe
- le scope Beta actuel passe
- les protections de base JWT/CORS/OTP ont ete serieusement durcies

Ce qui empeche encore de considerer l API comme pleinement opposeable :
- des routes critiques dupliquees
- des modules et decorators/guards concurrents
- un scope de validation TypeScript partiel
- des modeles Prisma concurrents pour les memes concepts
- une couverture de tests insuffisante sur plusieurs domaines exposes

En l etat, l API est **utilisable**, mais **pas suffisamment rationalisee** pour etre consideree comme saine sans reserve.
