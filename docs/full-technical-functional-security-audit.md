# Audit complet Ambya - technique, fonctionnel, securite

Date de l audit : **03/05/2026**

## Portee et methode

Cet audit recoupe :

- le planning visible dans la capture
- l etat reel du repo
- les validations rejouees
- les contrats backend/frontend reels

Contraintes appliquees :

- pas de credit automatique aux statuts `Done / In Progress / To Do`
- pas de credit a l intention
- si un flow existe mais n est pas reellement prouve, il reste **partiel**
- pas de developpement dans ce document

## Preuves principales utilisees

### Commandes executees

- `cmd /c pnpm check:full`
- `cmd /c pnpm --filter api build`
- `cmd /c pnpm --filter api test -- --runInBand`

### Resultats observes

- `pnpm check:full` : **OK**
  - `pnpm --filter api check:beta-scope` : **OK**
  - `pnpm --filter mobile typecheck` : **OK**
  - Jest backend scope Beta : **12 suites / 38 tests verts**
- `pnpm --filter api build` : **OK**
- `pnpm --filter api test -- --runInBand` : **OK**

### Ce que cela prouve

- le monorepo est de nouveau validable depuis la racine
- l API compile en build complet
- le mobile typecheck passe
- la couche API critique dispose d une vraie base de tests rejouables

### Ce que cela ne prouve pas

- aucun e2e mobile bout en bout
- aucune preuve multi-device
- aucune recette manuelle exhaustive Client / Employee / Admin / Pro
- aucune garantie que les flows UI “presentes” sont toutes propres en execution reelle

---

# 1. Audit par rapport au planning

## Semaine 1

### Setup Monorepo
- Statut planning : `Done`
- Etat reel : workspace proprement exploitable, scripts root coherents, checks centraux rejouables
- Completion estimee : **98%**
- Preuves code :
  - `pnpm-workspace.yaml`
  - `package.json`
  - `apps/api/package.json`
  - `apps/mobile/package.json`
- API/backend : package `api` isole et buildable
- Frontend/mobile : package `mobile` isole et typecheckable
- Testabilite : `pnpm check:full` **OK**
- Risques : pipeline repo encore simple, pas de CI visible dans le repo
- Recommandations : garder les scripts racine comme source officielle de validation

### Setup Expo + NativeWind
- Statut planning : `Done`
- Etat reel : structure Expo Router en place, app mobile lanceable structurellement, typage vert
- Completion estimee : **96%**
- Preuves code :
  - `apps/mobile/app/_layout.tsx`
  - `apps/mobile/package.json`
  - `apps/mobile/app/(tabs)/*`
  - `apps/mobile/app/(professional)/*`
- API/backend : non applicable
- Frontend/mobile : architecture bien presente, mais ecrans denses et inegaux
- Testabilite : `pnpm --filter mobile typecheck` via `check:full` **OK**
- Risques : pas de recette device, pas de preuve navigation reelle sur tous les ecrans
- Recommandations : valider les parcours coeur sur appareil et nettoyer les ecrans encore fragiles

### Setup NestJS + Prisma
- Statut planning : `Done`
- Etat reel : backend modulaire en NestJS, Prisma bien integre, build API complet revenu au vert
- Completion estimee : **95%**
- Preuves code :
  - `apps/api/src/main.ts`
  - `apps/api/src/app.module.ts`
  - `apps/api/prisma/schema.prisma`
  - `apps/api/tsconfig.build.json`
- API/backend : socle solide, mais architecture encore heterogene selon modules
- Frontend/mobile : non applicable
- Testabilite :
  - `pnpm --filter api build` **OK**
  - `pnpm --filter api check:beta-scope` **OK**
- Risques : certains modules Pro continuent de reposer sur des conventions moins propres que le coeur Client/Employee/Admin
- Recommandations : poursuivre le durcissement RBAC et la rationalisation des modules Pro

### Schema base de donnees initial
- Statut planning : `Done`
- Etat reel : schema riche et exploitable, mais plusieurs concepts ont encore des modeles concurrents
- Completion estimee : **90%**
- Preuves code :
  - `apps/api/prisma/schema.prisma`
- API/backend :
  - modeles coeur bien presents : `User`, `Salon`, `Service`, `Appointment`, `PaymentIntent`, `PaymentMethod`, `LoyaltyAccount`, `LeaveRequest`, `AuditLog`
  - dette residuelle :
    - `LeaveRequest` vs `EmployeeLeaveRequest`
    - `SalonOpeningHour` vs `SalonSchedule` vs `openingHoursJson`
- Frontend/mobile : types encore majoritairement manuels
- Testabilite : compatible avec la suite actuelle, pas avec une lecture “une seule source de verite partout”
- Risques : ambiguite de modelisation sur conges et horaires
- Recommandations : documenter explicitement les sources actives Beta et deprecier le reste

## Semaine 2

### Auth Login/Register
- Statut planning : `Done`
- Etat reel : login/register client et owner/pro reels, OTP reel, securite sensiblement meilleure qu avant
- Completion estimee : **90%**
- Preuves code :
  - `apps/api/src/auth/auth.controller.ts`
  - `apps/api/src/auth/auth.service.ts`
  - `apps/mobile/src/api/auth.ts`
  - `apps/mobile/src/api/pro-registration.ts`
- API/backend :
  - `/api/auth/register`
  - `/api/auth/register-owner`
  - `/api/auth/login`
  - `/api/auth/verify-otp`
  - `/api/auth/resend-otp`
- Frontend/mobile : branchement reel sur auth et pro registration
- Testabilite : `src/auth/auth.service.spec.ts` et `src/auth/guards/roles.guard.spec.ts` verts
- Risques :
  - pas de refresh token
  - reset password non implemente
  - quelques messages encore mal encodes
- Recommandations : prioriser reset password reel et politique de session plus robuste

### Flow Client - Liste RDV
- Statut planning : `Done`
- Etat reel : flow techniquement coherent, API et cache offline branches, mais preuve surtout indirecte
- Completion estimee : **88%**
- Preuves code :
  - `apps/api/src/appointments/appointments.controller.ts`
  - `apps/mobile/src/api/appointments.ts`
  - `apps/mobile/app/(tabs)/appointments.tsx`
- API/backend : `GET /api/appointments` reel
- Frontend/mobile : hook React Query + offline cache
- Testabilite : typecheck et tests backend OK, pas de smoke test mobile documente
- Risques : perception de “flow valide” plus forte que la preuve manuelle disponible
- Recommandations : rejouer login client -> liste -> detail -> annulation

### Creation RDV
- Statut planning : `Done`
- Etat reel : backend de reservation reel, creation simple et panier presentes, multi-service / multi-employe implementes
- Completion estimee : **89%**
- Preuves code :
  - `apps/api/src/appointments/appointments.service.ts`
  - `apps/api/src/discovery/discovery.service.ts`
  - `apps/mobile/app/(screens)/schedule.tsx`
  - `apps/mobile/app/(screens)/payment.tsx`
- API/backend :
  - `POST /api/appointments`
  - `POST /api/appointments/from-cart`
  - `GET /api/salons/:id/availability`
- Frontend/mobile : branchement reel
- Testabilite : `src/appointments/appointments.service.spec.ts` verte
- Risques : pas de recette e2e mobile documentee sur panier et confirmation
- Recommandations : valider un panier simple et un panier multi-service avec affichage final

### UI Design system Figma v1
- Statut planning : `Done`
- Etat reel : socle design system present, reutilisable, mais finition inegale
- Completion estimee : **84%**
- Preuves code :
  - `apps/mobile/src/components/*`
  - `apps/mobile/src/theme/*`
- API/backend : non applicable
- Frontend/mobile : base reelle, pas un simple skeleton
- Testabilite : evaluation manuelle seulement
- Risques : encodage degrade, surfaces Pro/Admin moins soignees
- Recommandations : nettoyer textes et standardiser les composants les plus exposes

### UI ecrans cles Client v1
- Statut planning : `Done`
- Etat reel : home, recherche, salon, profil, loyalty, appointments presentes
- Completion estimee : **85%**
- Preuves code :
  - `apps/mobile/app/(tabs)/*`
  - `apps/mobile/app/(screens)/search.tsx`
  - `apps/mobile/app/(screens)/salon.tsx`
  - `apps/mobile/src/api/me.ts`
- API/backend : discovery, me, appointments et loyalty reels
- Frontend/mobile : parcours visible et branche
- Testabilite : pas de preuve bout en bout sur appareil
- Risques : certains etats error/empty restent peu prouves
- Recommandations : recette fonctionnelle Client complete avant de considerer la ligne “fermee”

## Semaine 3

### UI ecrans cles Pro & Employee v1
- Statut planning : `Done`
- Etat reel :
  - Employee : flow reel, structurellement present
  - Pro : present mais partiel, plus large et moins prouve
- Completion estimee : **84%**
- Preuves code :
  - `apps/mobile/app/(employee)/*`
  - `apps/mobile/app/(professional)/*`
  - `apps/mobile/src/api/employee.ts`
  - `apps/mobile/src/api/pro-appointments.ts`
- API/backend :
  - Employee : reel
  - Pro : reel, mais inegal selon ecrans
- Frontend/mobile : beaucoup d ecrans Pro existent, mais certains restent plus proches d un backoffice Beta que d un produit fini
- Testabilite : typecheck mobile vert, pas de recette e2e Pro/Employee exhaustive
- Risques : confusion possible entre “present dans le code” et “solide produit”
- Recommandations : considerer Employee plus avance que Pro dans la communication produit

### UI Polissage Beta
- Statut planning : `Done`
- Etat reel : il y a un vrai travail de polish, mais le produit reste visiblement non finalise sur plusieurs surfaces
- Completion estimee : **78%**
- Preuves code :
  - `apps/mobile/app/(professional)/*`
  - `apps/mobile/app/(admin)/*`
  - `apps/mobile/app/(employee)/leave.tsx`
- API/backend : non applicable
- Frontend/mobile : ecarts notables de finition et d encodage
- Testabilite : evaluation visuelle uniquement
- Risques : sensation de Beta plus “prototype” sur certaines zones Pro/Admin
- Recommandations : traiter l encodage, la densite visuelle et les textes techniques exposes

### Validation RDV Pro/Employe
- Statut planning : `Done`
- Etat reel : mieux qu avant, avec namespace Pro clarifie et suite de tests renforcee
- Completion estimee : **88%**
- Preuves code :
  - `apps/api/src/appointments/pro-appointments.controller.ts`
  - `apps/api/src/appointments/appointments.controller.ts`
  - `apps/api/src/employee/employee.controller.ts`
  - `apps/mobile/src/api/appointments.ts`
  - `apps/mobile/src/api/pro-appointments.ts`
- API/backend :
  - Pro conserve un namespace unique : `/api/pro/appointments/*`
  - Employee reel
- Frontend/mobile :
  - export mobile direct Pro volontairement bloque
  - historique Pro reel
- Testabilite :
  - `src/appointments/pro-appointments.controller.spec.ts`
  - `src/employee/employee.service.spec.ts`
- Risques :
  - export Pro mobile absent en direct
  - flow Pro toujours peu prouve en usage reel
- Recommandations : documenter clairement la limite export et rejouer le flow Pro critique

### Offline Consultation
- Statut planning : `Done`
- Etat reel : vraie couche offline, utilisable pour consultation, pas pour validation de maturite haute
- Completion estimee : **80%**
- Preuves code :
  - `apps/mobile/src/providers/OfflineProvider.tsx`
  - `apps/mobile/src/api/useOfflineCachedQuery.ts`
  - `apps/mobile/src/offline/cache.ts`
  - `apps/mobile/src/offline/guard.ts`
- API/backend : non applicable
- Frontend/mobile : cache reel, gardes online pour certaines mutations
- Testabilite : pas de test offline automatique
- Risques : cache AsyncStorage en clair, couverture offline partielle
- Recommandations : documenter les flows offline-safe et minimiser les payloads sensibles caches

## Semaine 4

### Build Expo Staging
- Statut planning : `To Do`
- Etat reel : `app.json` present, mais pas de pipeline staging visible, pas de `eas.json`
- Completion estimee : **20%**
- Preuves code :
  - `apps/mobile/app.json`
- API/backend : non applicable
- Frontend/mobile : configuration Expo de base presente
- Testabilite : aucune commande staging visible
- Risques : impossible de presenter ce point comme fait
- Recommandations : definir pipeline staging explicite avant de communiquer dessus

### Gestion Employes
- Statut planning : `In Progress`
- Etat reel : backend et ecrans existent, mais le flow est seulement partiellement solide
- Completion estimee : **68%**
- Preuves code :
  - `apps/api/src/employees/*`
  - `apps/mobile/src/api/employees.ts`
  - `apps/mobile/app/(professional)/EmployeeManagement.tsx`
  - `apps/mobile/app/(auth)/employee-activate.tsx`
- API/backend :
  - CRUD employees reel
  - absence / retour actif reels
- Frontend/mobile :
  - gestion employes reelle
  - mais activation employee et “invitation” non branchees a un backend reel
  - la modal “demandes de rendez-vous employes” est purement locale/mockee
- Testabilite : pas de tests cibles ni de recette employee activation
- Risques : faux positif produit si on le presente comme complet
- Recommandations : separer clairement ce qui est reel de ce qui est mocke

### Demande Conges
- Statut planning : `Done`
- Etat reel : backend et UI reels, plus credibles qu avant
- Completion estimee : **90%**
- Preuves code :
  - `apps/api/src/employee/employee.controller.ts`
  - `apps/api/src/employee/employee.service.ts`
  - `apps/mobile/src/api/employee.ts`
  - `apps/mobile/app/(employee)/leave.tsx`
- API/backend : CRUD utile sur `leave-requests`
- Frontend/mobile : loading / empty / error / offline guard presents
- Testabilite : `src/employee/employee.service.spec.ts` couvre ce domaine
- Risques : pas de recette manuelle consignée complete
- Recommandations : rejouer creation -> modification -> annulation en environnement de test

### Email Reset Password
- Statut planning : `To Do`
- Etat reel : ecrans presents, backend absent
- Completion estimee : **20%**
- Preuves code :
  - `apps/mobile/app/(screens)/forgot-password.tsx`
  - `apps/mobile/app/(screens)/reset-password-sent.tsx`
- API/backend : aucun endpoint reset password reel
- Frontend/mobile : ecrans relies a une simulation locale
- Testabilite : non testable fonctionnellement
- Risques : faux sentiment de feature disponible
- Recommandations : ne pas presenter cette feature comme supportee

### Preparation MFA
- Statut planning : `To Do`
- Etat reel : OTP existe pour verification owner/pro, mais pas de MFA generalise
- Completion estimee : **15%**
- Preuves code :
  - `apps/api/src/auth/auth.service.ts`
  - `apps/api/src/auth/auth.controller.ts`
- API/backend : OTP de verification, pas de second facteur global de session
- Frontend/mobile : ecran OTP present dans le flow Pro signup
- Testabilite : partielle sur OTP, nulle sur MFA reel
- Risques : ne pas confondre OTP onboarding et MFA produit
- Recommandations : documenter clairement que le MFA n est pas pret

### UI Final polish
- Statut planning : `To Do`
- Etat reel : trop tot pour le considerer fait
- Completion estimee : **45%**
- Preuves code :
  - plusieurs surfaces Client/Employee/Admin/Pro presentes
- API/backend : non applicable
- Frontend/mobile : beaucoup de matiere existe, mais pas de finition finale
- Testabilite : visuelle uniquement
- Risques : encodage et ecrans encore tres techniques
- Recommandations : garder ce lot comme vrai chantier de finition, pas comme detail

### Tests Multi-device
- Statut planning : `To Do`
- Etat reel : aucune preuve dans le repo
- Completion estimee : **5%**
- Preuves code : aucune opposable
- API/backend : non applicable
- Frontend/mobile : aucune recette multi-device consignée
- Testabilite : absente
- Risques : regressions tablette / petits ecrans / differents devices
- Recommandations : ne rien revendiquer ici sans campagne explicite

### Optimisation & Corrections
- Statut planning : `To Do`
- Etat reel : plusieurs corrections utiles ont deja ete faites, mais pas un lot systematique d optimisation finale
- Completion estimee : **55%**
- Preuves code :
  - build API verte
  - API Pro rationalisee
  - tests backend renforces
- API/backend : ameliorations reelles
- Frontend/mobile : encore des ecrans lourds et des conventions mixtes
- Testabilite : partielle
- Risques : dette encore visible
- Recommandations : traiter ce lot apres les blocants produit et securite

### Build Production
- Statut planning : `To Do`
- Etat reel : configuration app de base presente, pipeline prod absent
- Completion estimee : **25%**
- Preuves code :
  - `apps/mobile/app.json`
  - `apps/api/package.json`
- API/backend : build API OK
- Frontend/mobile : app Expo configuree, pas de chaine prod prouvee
- Testabilite : aucune commande prod opposable
- Risques : impossible de parler de readiness production
- Recommandations : distinguer clairement Beta technique et readiness release

---

# 2. Audit API / Frontend / coherence fonctionnelle

## 1. APIs coherentes et bien utilisees

- `auth`
  - mobile : `apps/mobile/src/api/auth.ts`, `apps/mobile/src/api/pro-registration.ts`
  - backend : `apps/api/src/auth/*`
- `appointments` client
  - mobile : `apps/mobile/src/api/appointments.ts`
  - backend : `apps/api/src/appointments/appointments.controller.ts`
- `pro appointments`
  - mobile : `apps/mobile/src/api/pro-appointments.ts`
  - backend : `apps/api/src/appointments/pro-appointments.controller.ts`
  - le doublon historique a ete retire
- `employee`
  - mobile : `apps/mobile/src/api/employee.ts`
  - backend : `apps/api/src/employee/*`
- `me/profile/loyalty`
  - mobile : `apps/mobile/src/api/me.ts`
  - backend : `apps/api/src/me/*`
- `payment methods`
  - mobile : `apps/mobile/src/api/paymentMethods.ts`
  - backend : `apps/api/src/payment-methods/*`

## 2. APIs presentes mais mal utilisees ou fragiles

- conventions de path encore mixtes dans le mobile
  - certains fichiers utilisent `"/route"`
  - d autres `"/api/route"`
  - certains contournent le client partage avec `fetch`
- `apps/mobile/src/api/salon-settings.ts`
  - utilise un fetch maison au lieu du client partage
- `apps/mobile/src/api/paymentMethods.ts`
  - hardcode `"/api/me/payment-methods"` au lieu d une convention uniforme
- `apps/mobile/src/api/employees.ts`
  - meme remarque
- `apps/mobile/src/api/pro-appointments.ts`
  - convention encore differente, fonctionnelle mais peu elegante

## 3. APIs presentes mais non utilisees ou partiellement utilisees

- `UsersModule`
  - plus de controller HTTP, reste un service interne minimal
- plusieurs modules Pro exposes ne semblent pas avoir de preuve de couverture mobile complete
  - `accounting-reports`
  - `exports`
  - `promotions`
  - `loyalty` Pro

## 4. APIs manquantes cote backend

- forgot/reset password reel
- MFA generalise
- notifications backend structurees
- pipeline de download securise de remplacement pour certains exports mobiles

## 5. Ecrans frontend qui utilisent encore des donnees mockees ou fallback

- `apps/mobile/app/(screens)/forgot-password.tsx`
  - TODO API explicite
- `apps/mobile/app/(auth)/employee-activate.tsx`
  - flow purement local
- `apps/mobile/app/(professional)/EmployeeManagement.tsx`
  - demandes de rendez-vous employees hardcodees localement
- `apps/api/src/discovery/discovery.service.ts`
  - editorialisation/fallback geographiques et presentationnels

## 6. Risques de bugs fonctionnels restants

- incoherence de conventions d appels API mobile
- ecrans visibles sans backend reel sur reset password / employee activation
- plusieurs zones Pro/Admin plus riches en code qu en preuve de recette
- reponses backend parfois tres riches alors que le mobile ne type pas finement les payloads

---

# 3. Audit fonctionnel complet

## Flow Client

- Etat global : **coherent en code, encore insuffisamment prouve en execution**
- % completion : **86%**
- Parcours testables :
  - inscription / login
  - home / recherche / fiche salon
  - selection services / panier / choix creneau
  - reservation simple et multi-service
  - liste RDV / detail
  - profil / fidelite
  - offline consultation de donnees deja chargees
- Parcours non totalement testables :
  - reset password
  - preuve mobile complete login -> reservation -> confirmation -> annulation
- Bugs / risques :
  - discovery encore partiellement editorialisee
  - pas d e2e mobile
  - etats UI encore peu prouves
- Priorites de correction :
  1. rejouer un parcours Client complet
  2. fermer le faux flow reset password
  3. tester les etats error/empty

## Flow Employee

- Etat global : **structure solide, validation encore surtout indirecte**
- % completion : **85%**
- Parcours testables :
  - login
  - dashboard
  - agenda / details
  - confirmation / completion / paiement
  - blocage creneau
  - conges
  - profil
  - offline consultation
- Parcours non totalement testables :
  - verification manuelle complete sur appareil
- Bugs / risques :
  - pas de preuve e2e mobile
  - quelques messages / labels encore imperfects
- Priorites de correction :
  1. recette employee complete
  2. tests d integration sur les actions RDV

## Flow Admin

- Etat global : **backend avance, frontend probablement fonctionnel mais peu prouve**
- % completion : **82%**
- Parcours testables :
  - login admin
  - dashboard KPI
  - users / salons / appointments / logs / admins
- Parcours non totalement testables :
  - support historique complet rejoue manuellement
- Bugs / risques :
  - responses encore riches
  - pas de tests HTTP RBAC reel
- Priorites de correction :
  1. renforcer la preuve d autorisation
  2. rejouer les parcours de support essentiels

## Flow Pro

- Etat global : **present, plus coherent qu avant, mais toujours partiel produit**
- % completion : **66%**
- Ce qui existe :
  - dashboard
  - agenda
  - booking history
  - services
  - salon settings
  - employees management
  - expenses / exports / loyalty / promotions / cash register
- Ce qui est casse / partiel :
  - export mobile direct historique bloque volontairement
  - employee activation non reelle
  - reset password absent
  - plusieurs ecrans semblent plus complets qu ils ne sont
- Ce qui est hors scope :
  - stabilisation produit complete du backoffice Pro
- Ce qui pourrait bloquer plus tard :
  - RBAC Pro encore trop permissif sur certains modules
  - heterogeneite des clients API mobile Pro

---

# 4. Audit securite complet

## Risques securite

### High

- **RBAC Pro insuffisant sur certains modules sensibles**
  - Description : plusieurs services Pro se contentent de verifier `salonId` dans le token ou le lien salon, sans imposer explicitement le role attendu
  - Fichiers :
    - `apps/api/src/employees/employees.service.ts`
    - `apps/api/src/clients/clients.service.ts`
    - `apps/api/src/exports/exports.service.ts`
  - Impact :
    - un employee authentifie avec `salonId` peut potentiellement acceder a des actions de gestion Pro au sein de son salon
    - exposition de donnees clients, equipe ou exports
  - Recommandation concrete :
    - exiger explicitement `PROFESSIONAL` / `SALON_MANAGER` / `ADMIN` selon le module
    - ajouter tests RBAC cibles
  - Priorite : **immediate**

- **Dashboard Pro accessible plus largement que son nom ne le laisse penser**
  - Description : `DashboardService` autorise aussi le role `EMPLOYEE`
  - Fichiers :
    - `apps/api/src/dashboard/dashboard.controller.ts`
    - `apps/api/src/dashboard/dashboard.service.ts`
  - Impact :
    - exposition possible de KPIs salon non destines au role employee
  - Recommandation concrete :
    - clarifier le contrat ou limiter le role
  - Priorite : **haute**

### Medium

- **Pas de refresh token**
  - Fichiers :
    - `apps/api/src/auth/auth.module.ts`
    - `apps/mobile/src/api/client.ts`
  - Impact : session longue, revocation fine absente
  - Recommandation : ajouter refresh token ou documenter explicitement le compromis Beta

- **Cache offline non chiffre**
  - Fichiers :
    - `apps/mobile/src/offline/cache.ts`
  - Impact : donnees en clair dans AsyncStorage
  - Recommandation : minimiser les payloads et evaluer un stockage plus securise

- **Reset password absent mais ecrans visibles**
  - Fichiers :
    - `apps/mobile/app/(screens)/forgot-password.tsx`
  - Impact : faux parcours securite / support
  - Recommandation : masquer ou brancher reellement

- **Reponses admin encore riches**
  - Fichiers :
    - `apps/api/src/admin/admin.service.ts`
  - Impact : surface de fuite de donnees plus large que necessaire
  - Recommandation : minimiser encore les payloads detail

- **Rate limiting basique et en memoire**
  - Fichiers :
    - `apps/api/src/main.ts`
  - Impact : faible robustesse multi-instance
  - Recommandation : garder pour Beta, renforcer avant scale

### Low

- **Encodage degrade dans plusieurs messages**
  - Impact : image produit, lisibilite
  - Recommandation : corriger avant exposition large

## Points de securite positifs

- `JWT_SECRET` obligatoire
- token uniquement en bearer header
- `AUTH_EXPOSE_OTP_DEBUG` necessaire pour exposer l OTP debug
- CORS borne
- `ValidationPipe` global avec `whitelist`, `forbidNonWhitelisted`, `transform`
- routes admin protegees par `JwtAuthGuard + RolesGuard + @Roles(ADMIN)`

---

# 5. Audit qualite technique

## Points positifs

- build API complet vert
- suite de tests backend utile et renforcee
- typecheck mobile vert
- client API mobile partage present
- rationalisation des routes Pro appointments
- `pro/salon-settings` clarifie

## Dette technique observee

- conventions d appels API mobiles encore heterogenes
- gros services backend encore volumineux :
  - `AppointmentsService`
  - `AdminService`
  - `EmployeeService`
- modeles Prisma concurrents pour les conges et horaires
- code encore partiellement obsolete ou transitoire :
  - `UsersModule` minimal
  - ecrans faux flows
- naming et encodage encore inegaux

## Tests

- valides actuellement :
  - `auth`
  - `roles guard`
  - `appointments`
  - `pro appointments`
  - `discovery`
  - `employee`
  - `payment-methods`
  - `payments`
  - `salon-settings`
  - `admin`
  - `audit`
  - `app controller`
- manques :
  - e2e mobile
  - tests HTTP end-to-end Nest
  - tests RBAC Pro sensibles
  - tests offline automatiques

---

# 6. Audit UX/UI haut niveau

## Points positifs

- identite AMBYA visible
- design system reel
- parcours Client/Employee globalement plus lisibles que precedemment
- nombreux ecrans reels plutot que du simple placeholder

## Problemes observes

- encodage degrade sur plusieurs ecrans
- surfaces Pro/Admin parfois trop denses et techniques
- certains ecrans donnent une fausse impression de completude :
  - forgot password
  - employee activation
  - employee management “demandes de rendez-vous”
- navigation et conventions encore inegales selon les surfaces Pro

---

# 7. Audit tests et validation

## Scripts existants

- racine :
  - `pnpm check:backend`
  - `pnpm check:mobile`
  - `pnpm check:quick`
  - `pnpm check:full`
  - `pnpm check:repo`
- API :
  - `build`
  - `build:beta-scope`
  - `test`
  - `test:beta-scope`
  - `check:beta-scope`
- mobile :
  - `typecheck`

## Commandes executees

### `cmd /c pnpm check:full`
- Resultat : **OK**
- Ce que ca prouve :
  - build beta backend + tests backend scope + typecheck mobile passent
- Ce que ca ne prouve pas :
  - aucun e2e
  - aucune recette appareil

### `cmd /c pnpm --filter api build`
- Resultat : **OK**
- Ce que ca prouve :
  - l API compile en build complet
- Ce que ca ne prouve pas :
  - la qualite fonctionnelle de tous les endpoints

### `cmd /c pnpm --filter api test -- --runInBand`
- Resultat : **OK**
  - `12 suites / 38 tests`
- Ce que ca prouve :
  - plusieurs modules critiques API ont une couverture utile
- Ce que ca ne prouve pas :
  - aucun contrat HTTP e2e complet
  - aucune preuve mobile bout en bout

## Tests critiques a ajouter

1. tests RBAC Pro sur `clients`, `employees`, `exports`, `dashboard`
2. tests HTTP Nest pour auth / appointments / employee / admin
3. tests d integration offline mobile
4. smoke tests de flows Client et Employee
5. validation manuelle documentee des parcours coeur

---

# 8. Synthese

## A. Resume executif

- Etat global du projet :
  - **nettement plus sain qu avant**
  - **backend et contrats critiques beaucoup plus credibles**
  - **mais plusieurs surfaces produit restent seulement partielles ou peu prouvees**
- Niveau de maturite :
  - **Beta technique credible**
  - **pas encore produit integralement opposeable**
- Risques principaux :
  - RBAC Pro insuffisant sur certains modules
  - pas de refresh token
  - cache offline non chiffre
  - faux flows visibles cote mobile
  - absence d e2e mobile
- Estimation Beta reelle :
  - **88-91% sur le scope S1-S4**
- Estimation planning reelle :
  - **83-86% sur l ensemble du planning affiche**

## B. Tableau de completion

| Fonctionnalite | Statut planning | Statut reel | Completion | Criticite | Commentaire |
|---|---|---:|---:|---|---|
| Setup Monorepo | Done | Solide | 98% | Medium | Scripts root coherents, checks rejouables |
| Setup Expo + NativeWind | Done | Solide | 96% | Medium | Structure saine, peu de preuve device |
| Setup NestJS + Prisma | Done | Solide | 95% | Medium | Build API complet vert |
| Schema base de donnees initial | Done | Solide mais avec dette | 90% | Medium | Conge / horaires encore dupliques |
| Auth Login/Register | Done | Fortement ameliore | 90% | High | OTP reel, pas de refresh token |
| Flow Client - Liste RDV | Done | Coherent | 88% | High | Peu de preuve manuelle |
| Creation RDV | Done | Solide | 89% | High | Multi-service reel, e2e absent |
| UI Design system Figma v1 | Done | Partiel premium | 84% | Medium | Base bonne, finition inegale |
| UI ecrans cles Client v1 | Done | Avance | 85% | High | Parcours presents, peu prouves |
| UI ecrans cles Pro & Employee v1 | Done | Partiel | 84% | Medium | Employee plus mur que Pro |
| UI Polissage Beta | Done | Partiel | 78% | Medium | Encodage / densite / finition |
| Validation RDV Pro/Employe | Done | Ameliore | 88% | Medium | Namespace Pro clarifie |
| Offline Consultation | Done | Utile mais non verrouille | 80% | Medium | Cache clair, tests absents |
| Build Expo Staging | To Do | Faible | 20% | Medium | Pas de pipeline staging visible |
| Gestion Employes | In Progress | Partiel reel | 68% | High | CRUD reel, activation/invitations non reelles |
| Demande Conges | Done | Solide | 90% | Medium | Backend/UI reels, peu de recette manuelle |
| Email Reset Password | To Do | Ecrans seuls | 20% | High | Backend absent |
| Preparation MFA | To Do | Quasi absent | 15% | Medium | OTP onboarding != MFA |
| UI Final polish | To Do | Loin d etre fini | 45% | Medium | Finition finale non atteinte |
| Tests Multi-device | To Do | Non prouve | 5% | High | Aucune preuve |
| Optimisation & Corrections | To Do | Partiellement engage | 55% | Medium | Plusieurs corrections deja faites |
| Build Production | To Do | Partiel | 25% | High | Pas de pipeline prod opposable |

## C. Ecarts majeurs planning vs realite

1. Le backend est aujourd hui **plus propre que l ancien audit ne le disait** :
   - build API complete verte
   - doublons critiques Pro appointments supprimes
   - `pro/salon-settings` clarifie
   - tests backend renforces
2. Le produit reste **moins complet que le planning ne le suggere** sur :
   - reset password
   - MFA
   - gestion employees complete
   - multi-device
   - build staging/prod
3. Plusieurs surfaces UI sont **presentes mais pas pleinement opposeables**.

## D. Problemes critiques

1. RBAC Pro insuffisant sur `clients`, `employees`, `exports`, et possiblement `dashboard`
2. Pas d e2e mobile sur les parcours coeur
3. Reset password absent alors que les ecrans existent
4. Gestion employees sur-vendue si on inclut activation/invitation comme “fait”

## E. Problemes importants

1. Pas de refresh token
2. Cache offline non chiffre
3. Faux flows visibles dans le mobile
4. Conventions API mobile encore heterogenes
5. Modeles Prisma encore concurrents pour conges et horaires

## F. Problemes secondaires / polish

1. Encodage corrompu residuel
2. Surfaces Pro/Admin encore tres techniques
3. Quelques modules/services encore trop gros

## G. Risques securite

### High
- RBAC Pro insuffisant sur modules sensibles
- dashboard Pro potentiellement trop accessible

### Medium
- pas de refresh token
- cache offline non chiffre
- reponses admin encore riches
- rate limiting simple
- reset password absent

### Low
- encodage / messages

## H. Plan d action recommande

### Lot 1 : blocants critiques
- Objectif : fermer les faux positifs les plus dangereux
- Modules :
  - `apps/api/src/employees/*`
  - `apps/api/src/clients/*`
  - `apps/api/src/exports/*`
  - `apps/api/src/dashboard/*`
  - `apps/mobile/app/(screens)/forgot-password.tsx`
  - `apps/mobile/app/(auth)/employee-activate.tsx`
- Priorite : immediate
- Impact : securite et credibilite produit
- Estimation effort : **1 a 3 jours**

### Lot 2 : securite / donnees
- Objectif : durcir sessions, offline et exposition de donnees
- Modules :
  - `apps/api/src/auth/*`
  - `apps/mobile/src/offline/*`
  - `apps/api/src/admin/*`
- Priorite : haute
- Impact : confiance release
- Estimation effort : **1 a 3 jours**

### Lot 3 : coherence API/frontend
- Objectif : uniformiser les contrats et les clients API mobile
- Modules :
  - `apps/mobile/src/api/*`
  - `apps/api/src/me/*`
  - `apps/api/src/payment-methods/*`
  - `apps/api/src/salon-settings/*`
- Priorite : haute
- Impact : maintenabilite et reduction des regressions
- Estimation effort : **1 a 2 jours**

### Lot 4 : UX/UI
- Objectif : supprimer les signaux visuels de non-finition
- Modules :
  - surfaces Client / Employee / Pro / Admin les plus exposees
- Priorite : moyenne
- Impact : perception cliente
- Estimation effort : **1 a 3 jours**

### Lot 5 : tests / robustesse
- Objectif : transformer la coherence code en preuve opposable
- Modules :
  - tests HTTP Nest
  - tests RBAC Pro
  - offline
  - smoke tests fonctionnels
- Priorite : haute
- Impact : confiance livraison
- Estimation effort : **2 a 4 jours**

### Lot 6 : polish final
- Objectif : fermer la dette residuelle et preparer staging/prod
- Modules :
  - pipeline Expo
  - build release
  - finitions UI
  - nettoyage modeles Prisma concurrents
- Priorite : ulterieure
- Impact : readiness release
- Estimation effort : **2 a 5 jours**

---

## Conclusion

Ambya a objectivement progresse.

Le projet n est plus dans l etat “structurellement casse” de l ancien audit :

- la build API complete passe
- la validation root passe
- le mobile typecheck passe
- plusieurs risques API historiques ont ete reduits

En revanche, il reste encore des ecarts importants entre :

- ce qui est **present dans le code**
- ce qui est **reellement testable**
- ce qui est **suffisamment securise pour etre revendique sans reserve**

La bonne lecture aujourd hui est donc :

- **Beta technique credible**
- **produit encore partiellement prouve**
- **priorite immediate sur RBAC, faux flows visibles, et preuve fonctionnelle reelle**
