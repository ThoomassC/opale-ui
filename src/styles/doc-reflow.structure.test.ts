import { describe, expect, it } from 'vitest';

import docV3 from './doc-v3.css?raw';

/* ============================================================================
   LA VITRINE SE REFLUE À 320 PX (WCAG 1.4.10).

   Mesuré au navigateur, à 320 px sur un chargement de téléphone : soixante-deux
   pages sur soixante-neuf défilaient à l'horizontale. jsdom ne calcule aucune
   mise en page, donc ce garde tient les RÈGLES qui ont supprimé chaque cause ;
   la mesure elle-même se refait au navigateur à chaque changement de scène.
   ========================================================================== */

const CSS = docV3.replace(/\/\*[\s\S]*?\*\//g, '');

const rule = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...CSS.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g'))]
    .map((match) => match[1])
    .join('\n');
};

describe('la vitrine à 320 px', () => {
  it('devrait donner à la page de composant une piste qui peut rétrécir', () => {
    // Piste implicite = largeur minimale du contenu = la plus longue ligne de code.
    expect(rule('.tc-doc-opale-page')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });

  it('devrait couper un code en ligne trop long pour sa phrase', () => {
    expect(rule('.tc-doc-column :not(pre) > code')).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('devrait borner les cellules de scène à leur conteneur', () => {
    expect(rule('.tc-doc-magicstage__cell')).toMatch(/max-inline-size:\s*100%/);
  });

  it('devrait laisser passer à la ligne le commutateur de matériau', () => {
    expect(rule('.tc-doc-opale-material-toggle')).toMatch(/flex-wrap:\s*wrap/);
  });

  it('devrait couper un titre d’un seul mot plus large que l’écran', () => {
    expect(rule('.tc-doc-page__title')).toMatch(/overflow-wrap:\s*anywhere/);
  });
});

/* Le rail permanent laissait 184 px au contenu : sous 30 rem il cède la place
   à un sommaire repliable, au-dessus de la page. */
describe('le rail cède sous 30 rem', () => {
  const narrow = (() => {
    const start = CSS.search(/@media \(max-width: 30rem\)\s*\{\s*\.tc-doc-body/);
    return start < 0 ? '' : CSS.slice(start, start + 4000);
  })();

  it('devrait passer la coquille en une seule colonne, rail replié compris', () => {
    expect(narrow).toMatch(
      /\.tc-doc-body\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/,
    );
  });

  it('devrait masquer le sommaire replié et montrer le bouton', () => {
    expect(narrow).toMatch(
      /\.tc-doc-nav\[data-menu='closed'\] \.tc-doc-nav__glass\s*\{[^}]*display:\s*none/,
    );
    expect(narrow).toMatch(/\.tc-doc-nav__menu\s*\{[^}]*display:\s*flex/);
  });

  it('devrait cacher le bouton au-dessus de 30 rem', () => {
    expect(rule('.tc-doc-nav__menu')).toMatch(/display:\s*none/);
  });
});
