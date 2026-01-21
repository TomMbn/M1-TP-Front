# 🧪 Guide des Tests

Ce projet utilise deux types de tests pour assurer la qualité du code :
1. **Vitest** : Pour les tests unitaires et les tests de composants.
2. **Playwright** : Pour les tests de bout en bout (E2E).

---

## 1. Tests Unitaires & Composants (Vitest)

Nous utilisons **Vitest** avec **React Testing Library**. C'est idéal pour tester la logique pure (utils) et le rendu isolé des composants.

### 🚀 Lancer les tests

```bash
# Lancer tous les tests en mode watch
npm run test

# Lancer un fichier spécifique
npx vitest src/app/components/Toast.test.tsx
```

### 📁 Structure

Les fichiers de test doivent se trouver à côté du fichier testé ou dans le même dossier, avec l'extension `.test.tsx` (ou `.test.ts`).

```
src/app/components/
  ├── Toast.tsx
  └── Toast.test.tsx
```

### 📝 Exemple de test composant

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MonComposant from './MonComposant';

describe('MonComposant', () => {
  it('s\'affiche correctement', () => {
    render(<MonComposant label="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

## 2. Tests End-to-End (Playwright)

Nous utilisons **Playwright** pour simuler un utilisateur réel naviguant sur l'application. Ces tests vérifient que les pages s'affichent correctement et que les parcours utilisateurs (ex: créer un profil, rejoindre une salle) fonctionnent.

### 🚀 Lancer les tests E2E

⚠️ **Important** : Le serveur de développement doit être lancé (`npm run dev`) ou Playwright le lancera automatiquement selon la configuration.

```bash
# Lancer les tests en mode headless (sans fenêtre)
npx playwright test

# Lancer avec l'interface graphique (pratique pour débugger)
npx playwright test --ui

# Voir le rapport HTML de la dernière exécution
npx playwright show-report
```

### 📁 Structure

Les tests E2E sont situés dans le dossier `tests/` à la racine.

```
tests/
  ├── example.spec.ts    # Test basique
  └── user-flow.spec.ts  # Parcours utilisateur complet
```

### 📝 Exemple de test E2E

```ts
import { test, expect } from '@playwright/test';

test('titre de la page d\'accueil', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Chat PWA/);
});
```

---

## 3. Couverture des Tests

Voici le détail de ce qui est actuellement testé dans le projet.

### ✅ Unitaires & Composants (Vitest)

Ces tests valident le fonctionnement technique et comportemental des briques de l'application.

| Fichier Test | Ce qui est testé |
|--------------|------------------|
| **`src/utils/helpers.test.ts`** | **Logique métier** : Vérifie que le formatage des noms de salle fonctionne (troncature, caractères spéciaux, décodage URI). |
| **`src/app/components/Toast.test.tsx`** | **Composant UI** : <br>1. S'affiche correctement quand `show=true`. <br>2. Ne s'affiche pas quand `show=false`. <br>3. Disparait automatiquement après 2.5s (timer). |
| **`src/app/components/ChatMessageImage.test.tsx`** | **Composant UI** : <br>1. Affiche immédiatement les images Base64. <br>2. Récupère (fetch) les images via l'API et les affiche. <br>3. Affiche un message d'erreur ("Image indisponible") si le chargement échoue. |

### 🌍 End-to-End (Playwright)

Ces tests valident les parcours utilisateurs critiques pour s'assurer que l'application est utilisable.

| Scénario (`tests/`) | Ce qui est testé |
|---------------------|------------------|
| **`example.spec.ts`** | **Smoke Test** : Vérifie simplement que la page d'accueil se charge avec le bon titre ("Chat PWA"). |
| **`user-flow.spec.ts`** | **Parcours Complet** : <br>1. **Nouvel utilisateur** : Arrive sur l'accueil, clique sur "Créer mon profil". <br>2. **Création Profil** : Remplit le formulaire (pseudo) et valide. <br>3. **Persistance** : Vérifie que le profil est sauvegardé (localStorage) et redirigé vers l'accueil. <br>4. **Création Salle** : Clique sur "Créer une salle", remplit le prompt, et accède à la salle. <br>5. **Navigation** : Vérifie que l'URL change correctement (`/room/MyNewRoom`). |

---

## 💡 Résumé des commandes

| Type | Commande | Description |
|------|----------|-------------|
| **Unit/Comp** | `npm run test` | Lance Vitest en mode watch |
| **Storybook** | `npm run storybook` | Lance l'interface de documentation composants |
| **E2E** | `npx playwright test` | Lance les tests E2E Playwright |
