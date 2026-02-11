# Ambya App

Ambya est une application mobile de mise en relation entre particuliers et salons de beauté.

Ce repository contient un **monorepo pnpm** structuré avec :

- 📱 `apps/mobile` → Application mobile (Expo + React Native)
- 🧠 `apps/api` → Backend API (NestJS)
- 📦 `packages/shared` → Types et schémas partagés

---

## 🏗️ Architecture

ambya/
│
├── apps/
│ ├── mobile/ # Expo mobile app
│ └── api/ # NestJS backend
│
├── packages/
│ └── shared/ # Shared types & schemas
│
├── pnpm-workspace.yaml
└── package.json

---

## 🚀 Prérequis

- Node.js ≥ 18
- pnpm ≥ 8
- Expo Go (pour tester sur mobile)
- ngrok (pour exposer l’API à distance)

---

## 📦 Installation

Depuis la racine du projet :

```bash
pnpm install

## ▶️ Lancer le backend (API)
cd apps/api
pnpm start:dev

## API disponible sur :

http://localhost:3000

## Health check :

http://localhost:3000/health

## 🌍 Exposer l’API en tunnel (test mobile à distance)

Lancer ngrok :

ngrok http 3000


Copier l’URL générée :

https://xxxx.ngrok-free.app

## 📱 Configurer l’application mobile

Créer un fichier :

apps/mobile/.env


Ajouter :

EXPO_PUBLIC_API_URL=https://xxxx.ngrok-free.app


(Remplacer par l’URL ngrok)

## 📱 Lancer l’application mobile
cd apps/mobile
pnpm expo start --tunnel


Scanner le QR code avec Expo Go.

##🧪 Vérification

Sur l’écran principal mobile :

 - L’application doit afficher :

 - API: ok

Cela confirme que la communication mobile ↔ API fonctionne.

##🔧 Scripts utiles
pnpm install
pnpm dev
pnpm build

## Bonnes pratiques

 - Toujours utiliser expo install pour les dépendances natives.

 - Ne jamais commiter le fichier .env.

 - L’URL ngrok change à chaque redémarrage en version gratuite.

## 🛠️ Stack technique
### Mobile

 - Expo SDK 54

 - React Native

 - Expo Router

 - React Query

### Backend

 - NestJS

 - TypeScript

### Monorepo

 - pnpm workspaces