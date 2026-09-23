import { describe, expect, it } from 'vitest';

import docSheet from './doc.css?raw';
import glassSheet from '../magic/components/glass/style/Glass.module.css?raw';
import glassOpale from '../magic/opale.css?raw';

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

  it('devrait garder le coussin qui lui rend sa largeur', () => {
    expect(corps).toMatch(/padding:\s*0\.375rem 1\.5rem/);
  });

  it('devrait garder son échelle de 18 px sur 28, en gras', () => {
    expect(corps).toMatch(/font:\s*700 1\.125rem\/1\.75rem/);
  });

  it('devrait garder son encre claire, lisible sur le cliché voilé', () => {
    expect(corps).toMatch(/color:\s*var\(--tc-white\)/);
  });

  /* LA SILHOUETTE EST CELLE DE LA LIBRAIRIE, ET C'EST TOUT L'OBJET DE CETTE
     PAGE : elle documente le matériau, donc son bouton de démonstration doit
     être le bouton d'Opale. Mesuré sur `Opale.Button liquidGlass`, la
     silhouette tient à deux choses — le rayon de l'enveloppe et le découpage
     des quatre couches — et les deux se recopient ici. Un rectangle arrondi
     ordinaire, c'est ce qu'il était. */
  it('devrait prendre le rayon d’enveloppe du bouton d’Opale', () => {
    expect(rule(docSheet, '.tc-doc-liquid-action-button__root')).toMatch(
      /--opale-glass-radius:\s*0\.9375rem/,
    );
    expect(rule(glassOpale, '.opale-button--glass-root')).toMatch(
      /--opale-glass-radius:\s*0\.9375rem/,
    );
  });

  it('devrait découper ses couches au squircle, comme le bouton d’Opale', () => {
    expect(rule(docSheet, '.tc-doc-liquid-action-button__root > *')).toMatch(
      /clip-path:\s*var\(--opale-squircle-clip\)/,
    );
    expect(rule(glassOpale, '.opale-button--glass-root > *')).toMatch(
      /clip-path:\s*var\(--opale-squircle-clip\)/,
    );
  });

  /* LA HAUTEUR FAIT PARTIE DE LA FORME. Le coin du squircle est plafonné à
     `min(1.375rem, 50%)`, soit 22 px : à 44 px de haut ils valent la moitié
     exacte et le coin se referme en demi-cercle ; à 52 px ils n'en valent plus
     que 42 %, et la même règle dessine une forme moins ronde. */
  it('devrait tenir la hauteur à laquelle le coin se referme', () => {
    expect(corps).toMatch(/min-block-size:\s*var\(--target-min\)/);
  });

  /* LE RAYON EST REMIS À ZÉRO : la silhouette vient du découpage, et garder un
     rayon laisserait croire que les deux dessinent le même bord. */
  it('ne devrait plus dessiner de rayon sur son contenu', () => {
    expect(corps).toMatch(/border-radius:\s*0;/);
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

/* =============================================================================
   LA GOUTTE DU SQUIRCLE.

   Le bouton est `inline-block` avec `text-align: center` — ce qui centre du
   TEXTE. Son enfant est un `<svg>` en `display: block`, une boîte de bloc, que
   `text-align` ne déplace pas d'un pixel. Mesuré au navigateur : 28 px d'icône
   dans 44 px de bouton, marge gauche **−1 px** et marge droite **17 px**. La
   goutte était collée au bord, et même un pixel dehors, à cause d'un
   `translateX(-1px)` posé pour compenser autre chose.
   ========================================================================== */
describe('la goutte du squire-circle', () => {
  const corps = rule(docSheet, '.tc-doc-squire-circle__button');

  it('devrait centrer son contenu sur les deux axes', () => {
    expect(corps).toMatch(/display:\s*grid/);
    expect(corps).toMatch(/place-items:\s*center/);
  });

  /* LE DÉCALAGE MANUEL DOIT DISPARAÎTRE AVEC SA CAUSE. Laissé en place, il
     décentrerait maintenant d'un pixel dans l'autre sens. */
  it('ne devrait plus compenser à la main', () => {
    expect(rule(docSheet, '.tc-doc-squire-circle__app-icon')).not.toMatch(/transform:\s*translate/);
  });
});
