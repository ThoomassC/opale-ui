import { describe, expect, it } from 'vitest';

import { OPALE_CATALOG } from './index';

/* Les familles du catalogue publié sont une donnée de l'API 3.x : un
   consommateur de `OPALE_CATALOG` peut regrouper par `category`. La vitrine
   traduit à l'affichage (`opale-components.tsx`), jamais dans la donnée. */
describe('les familles du catalogue publié', () => {
  it('gardent leurs valeurs de la 3.5', () => {
    expect([...new Set(OPALE_CATALOG.map((entry) => entry.category))].sort()).toEqual(
      [
        'Affichage de données',
        'Boutons spécialisés',
        'Feedback',
        'Inputs',
        'Mise en page',
        'Modules',
        'Navigation',
      ].sort(),
    );
  });
});
