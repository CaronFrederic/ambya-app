# Ambya

Ambya est un monorepo `pnpm` qui regroupe :

- `apps/mobile` : application Expo / React Native
- `apps/api` : API NestJS / Prisma
- `packages/shared` : code partage quand necessaire

Ce README decrit l'etat **reellement supporte** pour la Beta sur le scope `S1-S4 retenu`.

## Architecture

```text
ambya/
|- apps/
|  |- api/
|  `- mobile/
|- packages/
|  `- shared/
|- docs/
|- pnpm-workspace.yaml
`- package.json
```

## Prerequis

- Node.js 18+
- pnpm 10+
- Expo Go ou un emulateur mobile
- une base PostgreSQL accessible par Prisma
- ngrok ou tunnel equivalent si test mobile sur appareil physique

## Installation

Depuis la racine du repo :

```bash
pnpm install
```

## Lancer l'API

Depuis la racine :

```bash
pnpm --filter api start:dev
```

Par defaut, l'API ecoute sur :

```text
http://localhost:3001
```

Le prefixe global NestJS est :

```text
/api
```

Exemple :

```text
http://localhost:3001/api/health
```

## Exposer l'API pour le mobile

Si tu testes sur un appareil physique, expose le port de l'API :

```bash
ngrok http 3001
```

Puis configure le mobile avec l'URL du tunnel **sans** suffixe `/api` :

```text
EXPO_PUBLIC_API_URL=https://xxxx.ngrok-free.app
```

Important :

- le client mobile ajoute lui-meme le prefixe `/api`
- il ne faut pas mettre `https://xxxx.ngrok-free.app/api` dans `.env`

## Lancer le mobile

Depuis la racine :

```bash
pnpm --filter mobile expo start --tunnel
```

Ou depuis `apps/mobile` :

```bash
pnpm expo start --tunnel
```

## Commandes de validation

### Validation Beta de reference

```bash
pnpm check:full
```

Cette commande valide le scope Beta `S1-S4 retenu` :

- typecheck backend scope Beta
- tests backend scope Beta
- typecheck mobile

### Checks detailles

```bash
pnpm check:backend
pnpm check:mobile
pnpm check:quick
pnpm check:beta
pnpm check:repo
```

Semantique actuelle :

- `check:backend` : validation backend scope Beta
- `check:mobile` : typecheck mobile
- `check:quick` : typecheck backend scope Beta + typecheck mobile
- `check:full` : validation Beta complete
- `check:beta` : alias de `check:full`
- `check:repo` : build TypeScript complet de `apps/api`

### Commandes equivalentes utiles

```bash
cmd /c pnpm --filter api check:beta-scope
cmd /c pnpm --filter api test:beta-scope
cmd /c pnpm --filter api build
cmd /c pnpm exec tsc -p apps\mobile\tsconfig.json --noEmit
```

## Documentation utile

- [Guide de validation Beta S1-S4](docs/beta-s1-s4-validation-guide.md)
- [Guide offline Beta](docs/beta-offline-and-test-guide.md)
- [Audit complet S1-S4](docs/full-technical-functional-security-audit.md)

## Hors scope explicite

Ce repo contient aussi de la dette et des zones non traitees par la validation Beta courante :

- flow Pro complet
- build Expo staging
- reset password
- MFA complet
- build production
- tests multi-device

Ces sujets ne doivent pas etre inferes comme valides simplement parce que `pnpm check:full` est vert.
