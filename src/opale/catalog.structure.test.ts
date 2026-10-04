import { describe, expect, it } from 'vitest';

import { CATALOG } from './catalog';

/* Les familles du catalogue de la vitrine gardent les valeurs de l'API 2.x,
   quand il était publié sous le nom `OPALE_CATALOG`. La vitrine traduit à
   l'affichage (`opale-components.tsx`), jamais dans la donnée. */
describe('les familles du catalogue publié', () => {
  it('gardent leurs valeurs de la 2.5', () => {
    expect([...new Set(CATALOG.map((entry) => entry.category))].sort()).toEqual(
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
