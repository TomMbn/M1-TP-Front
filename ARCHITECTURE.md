# Documentation Structurelle du Projet

## 1. Vue d'ensemble
Ce projet est une **Progressive Web App (PWA)** de chat en temps réel construite avec **Next.js (App Router)**. L'architecture repose sur une approche hybride combinant une coquille statique générée par le serveur (Server Components pour le layout) et une interactivité riche gérée côté client (Client Components) via `Socket.io`.

## 2. Architecture Globale
L'application suit une architecture modulaire basée sur le **Next.js App Router**.

```mermaid
graph TD
    User[Utilisateur] -->|Requête HTTP| CDN[Vercel Edge / CDN]
    CDN -->|HTML Statique / JS| Client[Navigateur Client]
    
    subgraph "Next.js Server"
        Layout[Layout Server Component]
        Meta[Metadonnées SEO]
    end
    
    subgraph "Client Side (Browser)"
        Page[Page Component (CSR)]
        SocketCtx[ChatSocketContext]
        State[React State]
    end
    
    subgraph "External Services"
        API[API Backend (Node/Socket.io)]
        SocketSrv[Socket Server]
    end
    
    Client --> Layout
    Client --> Page
    Page -->|useContext| SocketCtx
    SocketCtx <-->|WebSocket| SocketSrv
    Page -->|Fetch REST| API
```

## 3. Arborescence du Projet
La structure des dossiers suit les conventions du **App Router** de Next.js, favorisant la colocation des fichiers et la séparation des responsabilités.

```
src/
├── app/                        # Cœur de l'application (Routes)
│   ├── components/             # Composants UI partagés (Boutons, Cards...)
│   ├── context/                # Contextes React (ex: SocketProvider)
│   ├── types/                  # Définitions TypeScript partagées
│   ├── layout.tsx              # Layout racine (Server Component)
│   ├── page.tsx                # Page d'accueil (Client Component)
│   ├── globals.css             # Styles globaux (Tailwind)
│   ├── room/
│   │   └── [id]/               # Route dynamique pour une salle de chat
│   │       └── page.tsx        # Logique de la salle (Chat, Caméra, Géoloc)
│   ├── gallery/                # Page de galerie des médias
│   │   └── page.tsx
│   ├── create-profile/         # Page de création de profil
│   │   └── page.tsx
│   ├── conversations/          # (Similaire à room, structure alternative)
│   └── manifest.ts             # Génération du manifest PWA
```

## 4. Séparation des Responsabilités

### 4.1. Couche Serveur (`src/app/layout.tsx`)
- **Responsabilité** : Fournir la structure HTML de base, les polices, les métadonnées SEO et les wrappers globaux.
- **Type** : Server Component.
- **Rôle** : Point d'entrée statique, assure un First Contentful Paint (FCP) rapide.

### 4.2. Couche Client (`src/app/**/page.tsx`)
- **Responsabilité** : Gérer l'interactivité utilisateur, les états locaux (`useState`) et les effets de bord (`useEffect`).
- **Type** : Client Component (`"use client"`).
- **Rôle** : Contient toute la logique métier dynamique (Chat, accès caméra, géolocalisation).

### 4.3. Gestion de l'État et des Données (`src/context`)
- **Fichier** : `ChatSocketProvider.tsx`
- **Responsabilité** : Singleton gérant la connexion WebSocket persistante.
- **Avantage** : Évite la reconnexion à chaque changement de page (SPA navigation).

### 4.4. Composants UI (`src/components` vs `src/app/components`)
- Les composants présents dans `src/app/components` sont spécifiques aux pages de l'application.
- Ils sont purement présentatifs (Dumb Components) et reçoivent leurs données via Props, garantissant leur réutilisabilité.

## 5. Flux de Données (Data Flow)

**Exemple : Envoi d'un message**
1. **User Action** : L'utilisateur tape un message et clique sur "Envoyer".
2. **Page Component** :
   - Met à jour l'état local (UI Optimiste).
   - Appelle `chat.sendMessage()` via le Context.
3. **Socket Context** : Émet l'événement `chat-msg` au serveur Socket.io.
4. **Serveur** : Reçoit, valide et diffuse le message aux autres clients de la room.
5. **Réception** :
   - Les autres clients reçoivent l'événement via le Context.
   - Le Context met à jour l'état ou notifie les composants abonnés.

---
*Ce document sert de référence pour la maintenance et l'évolution de l'architecture du projet.*
