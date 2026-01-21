# 💬 Chat PWA - M1 TP Front

L'application sera accessible sur [https://tom.mauboussin.angers.mds-project.fr/](https://tom.mauboussin.angers.mds-project.fr/).

## 🚀 Fonctionnalités

- **💬 Chat Temps Réel** : Communication instantanée via Websockets (Socket.io).
- **🏠 Gestion de Salles** : Création et validation de salles de discussion uniques.
- **👤 Profil Utilisateur** : Choix de pseudo et avatar (upload ou caméra).
- **📱 PWA (Progressive Web App)** : Installable sur mobile/desktop, fonctionne hors-ligne.
- **📍 Partage de Position** : Envoi de la géolocalisation actuelle.
- **📸 Partage de Photos** : Prise de photo directe ou upload depuis la galerie.
- **🔋 Indicateurs** : (Optionnel) Niveau de batterie affiché.
- **🔔 Notifications** : Notifications push locales pour les nouveaux messages.

## 🛠 Stack Technique

- **Frontend Framework** : [Next.js 15](https://nextjs.org/) (App Router & Turbopack)
- **Langage** : [TypeScript](https://www.typescriptlang.org/)
- **Styling** : [Tailwind CSS v4](https://tailwindcss.com/)
- **Temps Réel** : [Socket.io Client](https://socket.io/)
- **Tests** : [Vitest](https://vitest.dev/) (Unitaire/Composant) & [Playwright](https://playwright.dev/) (E2E)
- **Documentation UI** : [Storybook](https://storybook.js.org/)

## 📦 Installation & Démarrage

1. **Cloner le projet**
   ```bash
   git clone https://github.com/TomMbn/M1-TP-Front.git
   cd m1-tp-front
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

## 🧪 Tests & Qualité

Ce projet met un point d'honneur à la qualité du code. Pour plus de détails, consultez le [Guide des Tests](./TESTING_GUIDE.md).

| Commande | Action |
|----------|--------|
| `npm run test` | Lance les tests unitaires et composants (Vitest) |
| `npx playwright test` | Lance les tests de bout en bout (E2E) |
| `npm run storybook` | Lance la documentation des composants |

## 📚 Documentation

Des guides détaillés sont disponibles à la racine du projet :

- [📘 STORYBOOK_GUIDE.md](./STORYBOOK_GUIDE.md) : Comment créer et documenter des composants.
- [🧪 TESTING_GUIDE.md](./TESTING_GUIDE.md) : Stratégie de test complète.
- [🎨 RENDERING_STRATEGIES.md](./RENDERING_STRATEGIES.md) : Choix d'architecture (SSR/CSR).

## 👥 Auteur

Tom Mauboussin - M1 DFS
