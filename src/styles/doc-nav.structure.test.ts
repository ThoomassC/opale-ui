import { describe, expect, it } from 'vitest';

import { ruleBody as findRule } from '../test/css-rules';
import docSource from './doc.css?raw';

/* =============================================================================
   LE RAIL DU SOMMAIRE, ÉPINGLÉ PAR CE QUI NE SE MESURE PAS EN JSDOM.

   `doc-nav.test.tsx` garde le COMPORTEMENT du sommaire. Ce fichier gardait
   aussi l'ancien pli du sommaire entier — un `<details>` `.tc-doc-nav__all`
   lu par `:has()` pour rendre la piste à la page. Plus aucun composant ne le
   rend : ses règles sont retirées de `doc.css` et
   `doc-dead-css.structure.test.ts` garde qu'elles ne reviennent pas. Reste ici
   ce que la feuille du rail fait encore et que jsdom ne peint pas.
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

const NAV = '.tc-doc-nav';

describe('le rail du sommaire — ce que jsdom ne voit pas', () => {
  it('devrait animer le coussin du rail en deux colonnes', () => {
    expect(ruleBody(NAV, LARGE) ?? '').toMatch(
      /transition:\s*padding-inline\s+var\(--motion-move\)/,
    );
  });
});
