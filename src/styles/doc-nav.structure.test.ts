import { describe, expect, it } from 'vitest';

import { ruleBody as findRule } from '../test/css-rules';
import docSource from './doc.css?raw';

/* =============================================================================
   LE PLI DU SOMMAIRE, ÉPINGLÉ PAR CE QUI NE SE MESURE PAS EN JSDOM.

   `doc-nav.test.tsx` garde le COMPORTEMENT : le pli est ouvert au départ, il
   contient les quatre groupes, il laisse la version dehors, il survit à une
   navigation. Tout ça se rend en jsdom.

   Ce qui ne s'y rend pas, c'est le seul intérêt visuel du pli : RENDRE LA
   LARGEUR À LA PAGE ET DÉPLACER LA FLÈCHE. La piste de grille passe de 288 px à
   un rail de 76 px, tandis que les éléments du sommaire et la version
   disparaissent ; jsdom ne peint pas, donc ce garde vérifie la piste compacte
   et la règle qui masque la note de version.

   MESURÉ AU NAVIGATEUR, à 1280 px : piste 288,0 → 76,0 px, contenu 992,0 →
   1204,0 px, 26 liens visibles → 0. La transition CSS anime cette différence
   et la commande passe du haut droit au haut gauche.

   Ce garde ne remplace pas un harnais navigateur — il rend impossible de
   retirer en silence les deux déclarations qui font tout le travail.
   ========================================================================== */

/**
 * Le corps d'une règle, avec son at-rule exigée.
 *
 * LE LECTEUR EST PARTAGÉ ET IL A ÉTÉ RÉÉCRIT. La version locale de ce fichier
 * découpait la feuille avec `/([^{}]+)\{([^}]*)\}/g`, et cette expression est
 * fausse : `[^}]*` n'exclut pas `{`, donc la première correspondance d'un bloc
 * `@media` avalait le prélude de l'at-rule ET sa première règle. Les deux
 * sélecteurs gardés ici étaient lus correctement PAR CHANCE — l'accolade
 * fermante de l'at-rule décalait les correspondances suivantes de la bonne
 * quantité. Échanger l'ordre de deux règles dans le bloc, CSS strictement
 * équivalente, faisait rougir ce fichier sans qu'un octet de comportement ait
 * changé.
 *
 * `src/test/css-rules.ts` balaie à accolades équilibrées et rend le CONTEXTE de
 * chaque règle. C'est ce qui permet à `LARGE` d'exister ci-dessous.
 */
const LARGE = '@media (min-width: 60rem)';

function ruleBody(selector: string, within?: string): string | null {
  return findRule(docSource, selector, within === undefined ? {} : { within });
}

const TRACK = '.tc-doc-body:has(.tc-doc-nav__all:not([open]))';
const NOTE = '.tc-doc-nav:has(.tc-doc-nav__all:not([open])) .tc-doc-nav__versionnote';
const ROOT = ".tc-doc-nav:has(.tc-doc-nav__all:not([open])) > [data-opale-glass]";
const NAV = '.tc-doc-nav';
const TITLE = '.tc-doc-nav__alltitle';

describe('le pli du sommaire — ce que jsdom ne voit pas', () => {
  it('devrait réduire la piste de gauche quand le sommaire est replié', () => {
    /* `:has()` ET NON UN ATTRIBUT POSÉ PAR REACT : le pli est un `<details>`
       natif sans état React, donc c'est la feuille qui lit l'état de
       l'élément. Cette règle réduit la piste pendant que les règles de
       visibilité masquent le contenu. */
    expect(
      ruleBody(TRACK, LARGE),
      `aucune règle ne cible « ${TRACK} » DANS « ${LARGE} » : le sommaire se replie sans ` +
        'rendre sa piste au contenu.',
    ).not.toBeNull();

    /* LES DEUX PISTES, ET NON LA PREMIÈRE SEULE. La seconde piste reprend la
       largeur libérée par le rail compact. */
    expect(
      ruleBody(TRACK, LARGE) ?? '',
      `${TRACK} ne redéclare pas la piste compacte et sa piste de contenu : la page ` +
        'doit récupérer la largeur du sommaire plié.',
    ).toMatch(
      /grid-template-columns:\s*calc\(\s*var\(--target-min\)\s*\+\s*\(\s*2\s*\*\s*var\(--space-4\)\s*\)\s*\)\s+minmax\(\s*0\s*,\s*1fr\s*\)/,
    );

    expect(ruleBody(ROOT, LARGE) ?? '', `${ROOT} doit conserver le remplissage du rail.`).toMatch(
      /inline-size:\s*100%/,
    );
  });

  it('devrait effacer la note de version, qui sinon épingle la colonne', () => {
    /* La piste compacte ne doit pas être épinglée par la version. Le numéro de
       version reste dans le DOM, mais la note est masquée avec le sommaire. */
    expect(
      ruleBody(NOTE, LARGE),
      `aucune règle ne cible « ${NOTE} » DANS « ${LARGE} » : la note de version reste visible ` +
        'sous un sommaire replié et élargit inutilement le rail.',
    ).not.toBeNull();

    expect(ruleBody(NOTE, LARGE) ?? '', `${NOTE} ne déclare pas « display: none ».`).toMatch(
      /display:\s*none/,
    );
  });

  it('devrait garder les deux règles DANS le bloc 60 rem, et non au global', () => {
    /* LE DÉFAUT QUE `within` REND VISIBLE, ET QU'AUCUN GARDE NE POUVAIT VOIR.
       Sorties de leur `@media`, les deux règles s'appliquent aussi en une
       colonne : mesuré à 375 × 700, replier le sommaire passe alors la page en
       DEUX colonnes de 139,5 et 235,5 px, la colonne de contenu remontant à
       côté de la nav, et efface la note de version. Le pli d'un téléphone
       casserait la page.

       Le test s'écrit à l'envers de l'habitude : ce qui doit être NUL, c'est la
       règle SANS contexte. */
    for (const selector of [TRACK, NOTE]) {
      const global = findRule(docSource, selector);
      const large = findRule(docSource, selector, { within: LARGE });

      expect(large, `« ${selector} » n'existe pas dans « ${LARGE} ».`).not.toBeNull();

      expect(
        global,
        `« ${selector} » existe HORS du bloc ${LARGE} : le pli s'appliquerait en une colonne, ` +
          'où mesuré il passe la page en deux colonnes de 139,5 et 235,5 px sur un téléphone.',
      ).toBe(large);
    }
  });

  it('devrait garder la flèche en `display: block`, contre le défaut WebKit', () => {
    /* RISQUE SUPPOSÉ ET NON MESURÉ, et c'est écrit comme tel dans `doc.css` :
       WebKit a un défaut ancien où un `<summary>` dont le `display` quitte
       `list-item` peut perdre son dépliage — le `<details>` ne s'ouvre plus du
       tout. Je n'ai pas de Safari ici pour le constater. Le prix de l'éviter
       est nul, le prix de se tromper est un sommaire définitivement replié
       dans un moteur sur trois. Ce test épingle donc le contournement, pas le
       défaut. */
    expect(ruleBody(TITLE) ?? '', `${TITLE} ne déclare pas « display: block ».`).toMatch(
      /display:\s*block/,
    );
  });

  it('devrait retirer les DEUX marqueurs natifs du `<summary>`', () => {
    /* `list-style: none` couvre les moteurs qui rendent le marqueur comme une
       puce de `list-item` ; `::-webkit-details-marker` couvre WebKit, qui le
       rend par un pseudo-élément propre. Il en faut deux, et l'oubli du second
       laisse un triangle À CÔTÉ du chevron dessiné par la feuille. */
    expect(ruleBody(TITLE) ?? '', `${TITLE} ne déclare pas « list-style: none ».`).toMatch(
      /list-style:\s*none/,
    );

    expect(
      ruleBody(`${TITLE}::-webkit-details-marker`),
      `aucune règle ne cible « ${TITLE}::-webkit-details-marker » : WebKit affiche alors son ` +
        'triangle à côté du chevron de la feuille.',
    ).not.toBeNull();
  });

  it('devrait indiquer l’état par une flèche horizontale', () => {
    /* Le sommaire est latéral : fermé, la flèche pointe vers la droite pour
       inviter à l’ouvrir ; ouvert, elle pointe vers la gauche pour inviter à
       le replier. L’état reste porté par `[open]`, c’est-à-dire par l’élément
       natif qui porte réellement le pliage. */
    expect(ruleBody(`${TITLE}::before`) ?? '').toMatch(/content:\s*'\\203a'/);
    expect(
      ruleBody(`.tc-doc-nav__all[open] > ${TITLE}::before`) ?? '',
      'la flèche ouverte doit pointer horizontalement vers la gauche.',
    ).toMatch(/content:\s*'\\2039'/);
  });

  it('devrait déplacer la flèche en haut selon l’état, avec une transition', () => {
    const navBody = ruleBody(NAV, LARGE) ?? '';
    const titleBody = ruleBody(TITLE, LARGE) ?? '';
    const collapsedTitle =
      ruleBody('.tc-doc-nav:has(.tc-doc-nav__all:not([open])) .tc-doc-nav__alltitle', LARGE) ?? '';

    expect(navBody).toMatch(/transition:\s*padding-inline\s+var\(--motion-move\)/);
    expect(titleBody).toMatch(/position:\s*absolute/);
    expect(titleBody).toMatch(/inset-block-start:\s*var\(--space-2\)/);
    expect(titleBody).toMatch(
      /inset-inline-start:\s*calc\(100%\s*-\s*var\(--target-min\)\s*-\s*var\(--space-2\)\)/,
    );
    expect(collapsedTitle).toMatch(/inset-inline-start:\s*0/);
    expect(collapsedTitle).toMatch(/inset-block-start:\s*0/);
  });
});
