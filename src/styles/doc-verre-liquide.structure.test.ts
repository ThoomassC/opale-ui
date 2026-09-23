import { describe, expect, it } from 'vitest';

import docSheet from './doc.css?raw';
import glassSheet from '../magic/components/glass/style/Glass.module.css?raw';

/* =============================================================================
   LA SCÈNE DU MATÉRIAU : LE BOUTON DOIT GARDER SA TAILLE.

   CE QUI S'EST PASSÉ, ET POURQUOI RIEN NE L'A VU. Le bouton de la page « Le
   verre liquide » portait les classes du composant tiers — `btn medium` — qui
   lui donnaient son coussin et son échelle. Elles sont parties avec la
   librairie, et le `<Glass as="button">` qui l'a remplacé s'est retrouvé avec
   le `padding: 1px 6px` du navigateur : mesuré, **133 × 52 → 88 × 28**. Le
   pavé de verre était devenu une puce, et la scène se répartissant par
   `space-between`, la perte de largeur déplaçait la goutte du plan d'eau vers
   le ciel.

   LA CORRECTION POSÉE ENSUITE N'A PAS PRIS, et c'est le vrai piège de ce
   fichier. Une règle `.tc-doc-liquid-action-button { font: … }` a été écrite
   — et n'a jamais été appliquée : `Glass.module.css` déclare
   `.content:where(button) { font: inherit }`, `:where()` ne pèse rien dans la
   spécificité, les deux sélecteurs sont donc à égalité et c'est l'ordre des
   feuilles dans le paquet qui tranche. Il tranchait contre la nôtre.

   D'OÙ CES DEUX CAS. Le premier tient les dimensions, le second tient la
   RAISON pour laquelle elles s'appliquent — sans lui, quelqu'un « nettoiera »
   le sélecteur en le raccourcissant et le bouton rapetissera de nouveau, en
   silence. jsdom ne calcule aucune mise en page : seul le texte des deux
   feuilles peut porter ces gardes.
   ========================================================================== */

/** Le corps d'une règle, par son sélecteur exact, commentaires retirés. */
function rule(sheet: string, selector: string): string {
  const sans = sheet.replace(/\/\*[\s\S]*?\*\//g, '');
  const debut = sans.indexOf(`${selector} {`);
  expect(debut, `règle \`${selector}\` absente`).toBeGreaterThan(-1);

  return sans.slice(debut, sans.indexOf('}', debut));
}

describe('le bouton de la scène « verre liquide »', () => {
  const corps = rule(docSheet, "[data-opale-glass-layer='content'].tc-doc-liquid-action-button");

  it('devrait garder le coussin qui lui donnait ses 133 × 52', () => {
    expect(corps).toMatch(/padding:\s*0\.75rem 1\.5rem/);
  });

  it('devrait garder son échelle de 18 px sur 28, en gras', () => {
    expect(corps).toMatch(/font:\s*700 1\.125rem\/1\.75rem/);
  });

  it('devrait garder son encre claire, lisible sur le cliché voilé', () => {
    expect(corps).toMatch(/color:\s*var\(--tc-white\)/);
  });

  /* LE SÉLECTEUR DOIT PESER PLUS QU'UNE SIMPLE CLASSE. C'est la moitié
     invisible de la correction : la déclaration peut être parfaite et ne rien
     peindre. */
  it('devrait peser plus que la règle du matériau qu’il doit dépasser', () => {
    expect(
      glassSheet,
      'Le garde suppose que `Glass` impose encore `font: inherit` aux boutons ; ' +
        'si cette règle a disparu, ce test n’a plus d’objet et doit être relu.',
    ).toMatch(/\.content:where\(button[^)]*\)\s*\{[^}]*font:\s*inherit/);

    /* Une classe seule ferait jeu égal avec `.content:where(button)` — et
       l'ordre des feuilles dans le paquet trancherait, ce qu'aucune règle du
       dépôt ne fixe. L'attribut de couche ajoute le poids qui manquait. */
    expect(docSheet).toMatch(
      /\[data-opale-glass-layer='content']\.tc-doc-liquid-action-button\s*\{/,
    );
  });
});
