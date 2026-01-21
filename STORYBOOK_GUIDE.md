# 📖 Guide de création Storybook

Ce guide vous explique comment créer et documenter vos composants avec Storybook dans ce projet.

## 🚀 Lancer Storybook

Pour visualiser vos composants en isolation :

```bash
npm run storybook
```

L'interface s'ouvrira sur [http://localhost:6006](http://localhost:6006).

## 📁 Structure des fichiers

- Les fichiers "stories" doivent se trouver dans le **même dossier** que le composant.
- Nommage : `MonComposant.stories.tsx`.

Exemple :
```
src/app/components/
  ├── Button.tsx          # Le composant
  └── Button.stories.tsx  # La documentation Storybook
```

## 📝 Modèle de base (Template)

Voici un modèle prêt à l'emploi. Copiez-le dans votre fichier `.stories.tsx` :

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import MonComposant from './MonComposant';

// 1. Configuration globale du composant
const meta = {
  title: 'Components/MonComposant', // Chemin dans la sidebar Storybook
  component: MonComposant,
  parameters: {
    layout: 'centered', // 'centered' ou 'fullscreen'
  },
  tags: ['autodocs'], // Génère la doc automatique
  argTypes: {
    // Définition des contrôles (optionnel)
    variant: { 
      control: 'select', 
      options: ['primary', 'secondary'] 
    },
  },
} satisfies Meta<typeof MonComposant>;

export default meta;
type Story = StoryObj<typeof meta>;

// 2. Création des variantes (Stories)

export const Default: Story = {
  args: {
    // Props par défaut
    label: 'Cliquez-moi',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Annuler',
    variant: 'secondary',
  },
};
```

## 🎨 Astuces

- **Args** : Ce sont les "props" passées à votre composant. Vous pouvez les modifier en temps réel dans l'interface Storybook.
- **Decorators** : Si votre composant a besoin d'un contexte (ex: ThemeProvider), vous pouvez l'ajouter dans `preview.ts` ou directement dans la story.

## 🔗 Exemple concret

Voir `src/app/components/Toast.stories.tsx` pour un exemple existant fonctionnel.
