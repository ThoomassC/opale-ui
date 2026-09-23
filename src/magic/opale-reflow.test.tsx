import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import opaleSheet from './opale.css?raw';
import { DataTable } from './opale';

/* ============================================================================
   LES COMPOSANTS SE REFLUENT À 320 PX (WCAG 1.4.10).

   Mesuré au navigateur sur la vitrine : deux composants imposaient une largeur
   minimale plus grande qu'un téléphone, et donc un défilement horizontal de
   toute la page qui les accueille. jsdom ne calcule aucune mise en page : on
   vérifie la structure et la feuille, la mesure se refait au navigateur.
   ========================================================================== */

const SHEET = opaleSheet.replace(/\/\*[\s\S]*?\*\//g, '');

afterEach(cleanup);

describe('CardGrid — la colonne ne dépasse pas son conteneur', () => {
  /* `minmax(15rem, 1fr)` impose 240 px à chaque colonne : dans un conteneur
     plus étroit, la grille déborde au lieu de se réduire. */
  it('devrait borner le minimum de colonne à la largeur disponible', () => {
    expect(SHEET).toMatch(
      /\.opale-card-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(15rem,\s*100%\),\s*1fr\)\)/,
    );
  });
});

describe('DataTable — la table défile dans sa boîte', () => {
  /* Une table de données a le droit de défiler en deux dimensions — WCAG
     l'exempte du reflow —, mais dans SA boîte : elle poussait la page entière. */
  it('devrait envelopper la table dans un conteneur qui défile', () => {
    const { container } = render(
      <DataTable columns={[{ key: 'a', label: 'A' }]} rows={[{ a: '1' }]} />,
    );
    expect(container.querySelector('.opale-table-scroll > table.opale-table')).not.toBeNull();
    expect(SHEET).toMatch(/\.opale-table-scroll\s*\{[^}]*overflow-x:\s*auto/);
  });
});
