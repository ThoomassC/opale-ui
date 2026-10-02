import { describe, expect, it } from 'vitest';

import { declaration, declarations } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';
import siteNavSource from '../opale/components/site-nav/site-nav.module.css?raw';

/* ============================================================================
   CE QUE L'AUDIT 2.9.3 A CORRIGÉ DANS LA FEUILLE, ET QUI NE DOIT PAS REVENIR.

   ACC-11. La région focalisée d'une carte et la région sélectionnée portaient
   le même trait bleu de 2,5 et 3 px : tabuler sur la région déjà choisie ne
   changeait aucun pixel. Les deux états parlent désormais deux langues
   différentes — le focus trace un CONTOUR en tirets, détaché par son halo ; la
   sélection change L'INTÉRIEUR de la région, sous un trait plein.

   ACC-14. Les liens du fil d'Ariane mesuraient 17 px de haut, à 13 px du
   séparateur (WCAG 2.5.8). Ils atteignent 24 px sans que le texte bouge : la
   hauteur minimale agrandit la boîte, pas la police ni l'interlignage.

   `opale-state-cues.contract.test.ts` garde le minimum de ces deux points ; ce
   fichier garde ce qui fait la DIFFÉRENCE entre les états et l'intégrité du
   texte.
   ========================================================================== */

describe('ACC-11 — une région focalisée ne ressemble pas à une région sélectionnée', () => {
  const focus = declarations(opaleSource, '.opale-svg-map__focus');
  const focusHalo = declarations(opaleSource, '.opale-svg-map__focus-halo');
  const selected = declarations(opaleSource, '.opale-svg-map__selected');

  it('le focus est un contour en tirets, sans remplissage', () => {
    expect(focus.get('fill')).toBe('none');
    expect(focus.get('stroke')).toBe('var(--opale-focus)');
    expect(focus.get('stroke-dasharray')).toMatch(/^\d+(\.\d+)? \d+(\.\d+)?$/);
  });

  it('le focus est détaché de la région par un halo plus large que lui', () => {
    expect(focusHalo.get('fill')).toBe('none');
    expect(focusHalo.get('stroke')).toBe('var(--opale-surface)');
    expect(focusHalo.has('stroke-dasharray')).toBe(false);
    expect(Number(focusHalo.get('stroke-width'))).toBeGreaterThan(
      Number(focus.get('stroke-width')),
    );
  });

  it('la sélection remplit la région et la cerne d’un trait plein', () => {
    expect(selected.get('fill')).toMatch(
      /^color-mix\(in srgb, var\(--opale-svg-map-selected\) \d+%, transparent\)$/,
    );
    expect(selected.get('stroke')).toBe('var(--opale-svg-map-selected)');
    expect(selected.has('stroke-dasharray')).toBe(false);
  });

  it('sous verre, la sélection reste pleine et le focus reste en tirets', () => {
    expect(
      declaration(
        opaleSource,
        '.opale-svg-map--glass .opale-svg-map__selected',
        'stroke-dasharray',
      ),
    ).toBe(undefined);
    expect(
      declaration(opaleSource, '.opale-svg-map--glass .opale-svg-map__focus', 'stroke-dasharray'),
    ).toBe(undefined);
  });

  it('le calque des états ne capte pas le pointeur, remplissage compris', () => {
    expect(declaration(opaleSource, '.opale-svg-map__states path', 'pointer-events')).toBe('none');
  });
});

describe('ACC-14 — une cible de 24 px qui ne déplace pas le texte', () => {
  it.each(['.opale-breadcrumb a', '.opale-legal-links a'])(
    '%s centre son texte dans la hauteur gagnée',
    (selector) => {
      const link = declarations(opaleSource, selector);
      expect(link.get('display')).toBe('inline-flex');
      expect(link.get('align-items')).toBe('center');
      expect(link.get('min-block-size')).toBe('1.5rem');
    },
  );

  it.each(['.opale-breadcrumb a', '.opale-legal-links a'])(
    '%s ne touche ni à la police, ni à l’interlignage, ni aux marges',
    (selector) => {
      const link = declarations(opaleSource, selector);
      for (const property of [
        'font-size',
        'line-height',
        'padding',
        'padding-block',
        'margin',
        'margin-block',
      ]) {
        expect(link.has(property), `${selector} { ${property} }`).toBe(false);
      }
    },
  );

  it('garde le soulignement du maillon, qui est sa marque non chromatique', () => {
    const link = declarations(opaleSource, '.opale-breadcrumb a');
    expect(link.get('text-decoration')).toBe('underline');
  });

  it('aligne les maillons et les séparateurs sur leur centre', () => {
    expect(declaration(opaleSource, '.opale-breadcrumb ol', 'align-items')).toBe('center');
  });
});

/* LES FLÈCHES DE DÉPLACEMENT DE LA CARTE (WCAG 2.5.7). Chaque flèche est
   posée dans le sens où elle déplace la vue ; sous verre, la classe de zone
   est sur le contenu du bouton et non sur l'enveloppe qui est l'élément de
   grille — la règle doit donc aussi reconnaître l'enveloppe. */
describe('les flèches de déplacement d’une carte', () => {
  const NARROW = '@media (max-width: 30rem)';

  it('forment une croix dans une grille à trois lignes', () => {
    const pan = declarations(opaleSource, '.opale-svg-map-controls__pan');
    expect(pan.get('display')).toBe('grid');
    expect(pan.get('grid-template-areas')?.replace(/\s+/g, ' ')).toBe(
      "'. up .' 'left . right' '. down .'",
    );
    expect(pan.get('gap')).toBe('var(--opale-space-2xs)');
    expect(pan.get('margin-block-start')).toBe('var(--opale-space-2xs)');
  });

  it('gardent la croix physique de droite à gauche', () => {
    expect(declaration(opaleSource, '.opale-svg-map-controls__pan', 'direction')).toBe('ltr');
  });

  it.each(['up', 'left', 'right', 'down'])(
    'posent la flèche %s dans sa zone, sous verre compris',
    (area) => {
      for (const selector of [
        `.opale-svg-map-controls__pan-${area}`,
        `.opale-svg-map-controls__pan > :has(> .opale-svg-map-controls__pan-${area})`,
      ]) {
        expect(declaration(opaleSource, selector, 'grid-area'), selector).toBe(area);
      }
    },
  );

  it('sur un écran étroit, alignent la rangée en haut et la laissent passer à la ligne', () => {
    const controls = declarations(opaleSource, '.opale-svg-map__controls', { within: NARROW });
    expect(controls.get('flex-direction')).toBe('row');
    expect(controls.get('flex-wrap')).toBe('wrap');
    expect(controls.get('align-items')).toBe('flex-start');
    expect(controls.get('min-inline-size')).toBe('0');
    expect(
      declaration(
        opaleSource,
        '.opale-svg-map__controls .opale-svg-map-controls__pan',
        'margin-block-start',
        { within: NARROW },
      ),
    ).toBe('0');
  });
});

/* ============================================================================
   ACC-06 — LA BARRE DU SITE TIENT DANS 320 PX SANS FEUILLE DE RESET.

   Mesuré sous Chromium chez un consommateur qui n'importe que `opale.css` :
   à 320 px, le lien faisait 123 px dans un `<li>` de 101 px, la liste 328 px
   et l'intérieur 344 px — la page défilait de 6 à 38 px, « CONTACT » rogné.
   `minmax(0, 1fr)` et `overflow-wrap: anywhere` n'y pouvaient rien : la
   cause est `box-sizing: content-box`, le défaut du navigateur, sous lequel
   `inline-size: 100%` s'ajoute au rembourrage et à la bordure. La vitrine ne
   le montrait pas, parce que `tokens.css` pose `border-box` partout. Les
   boîtes de la barre le déclarent donc elles-mêmes : avec le reset, rien ne
   change ; sans, la barre rejoint le rendu de référence.
   ========================================================================== */
describe('ACC-06 — la barre du site ne déborde pas de son conteneur', () => {
  it.each(['.bar', '.brandZone', '.inner', '.list', '.link'])(
    '%s mesure sa largeur bordure comprise',
    (selector) => {
      expect(declaration(siteNavSource, selector, 'box-sizing')).toBe('border-box');
    },
  );

  it('laisse l’intérieur, la liste et ses entrées rétrécir sous leur contenu', () => {
    expect(declaration(siteNavSource, '.inner', 'min-inline-size')).toBe('0');
    expect(declaration(siteNavSource, '.list > li', 'min-inline-size')).toBe('0');
    expect(declaration(siteNavSource, '.list', 'grid-template-columns')).toBe(
      'repeat(4, minmax(0, 1fr))',
    );
  });
});

/* RETOURS DE GRAND ORAL STUDIO (audit a11y du SidePanel, 02/10/2026).

   1. Le natif d'une case ou d'un interrupteur est en `position: absolute` :
      sans rangée positionnée, il se plaçait par rapport au premier ancêtre
      positionné — la coquille du dialogue —, hors du corps qui défile. Le
      navigateur faisait alors défiler vers lui, et le focus restait hors de la
      vue (WCAG 2.4.11).
   2. La piste du Toggle rétrécissait dans sa rangée flex : à 320 px, avec un
      long libellé et le texte agrandi, elle passait de 65 à 40 px, et la
      pastille en sortait une fois activée. */
describe('les rangées de case et d’interrupteur', () => {
  it('positionnent leur natif dans la rangée', () => {
    expect(declaration(opaleSource, '.opale-toggle-row', 'position')).toBe('relative');
    expect(declaration(opaleSource, '.opale-checkbox-row', 'position')).toBe('relative');
  });

  it('ne laissent ni la piste ni la case rétrécir', () => {
    expect(declaration(opaleSource, '.opale-toggle-track', 'flex-shrink')).toBe('0');
    expect(declaration(opaleSource, '.opale-checkbox-mark', 'flex-shrink')).toBe('0');
  });
});

/* 4. Le SegmentedControl passe à la ligne à 320 px : un rayon « pilule »
      (999 rem) devient une ellipse sur deux lignes, et la pastille en
      déborde. `--opale-radius-md` vaut la moitié d'une ligne : pilule sur une
      ligne, rectangle arrondi sur deux. */
describe('le SegmentedControl qui passe à la ligne', () => {
  it('garde une piste arrondie, pas une ellipse', () => {
    expect(declaration(opaleSource, '.opale-segmented', 'border-radius')).toBe(
      'var(--opale-radius-md)',
    );
  });
});

/* LE BOUTON GARDE UN BORD EN CONTRASTES FORCÉS. Son aplat est peint par un
   pseudo-élément découpé en squircle ; le mode le ramène à `Canvas`, la
   couleur de la page, et le bouton n'était plus qu'un mot (WCAG 1.4.11).
   Un filet système, arrondi comme la forme, le redessine — dans ce mode
   seulement. */
describe('le bouton en contrastes forcés', () => {
  it('trace un filet ButtonText arrondi comme sa forme', () => {
    const forced = { within: '@media (forced-colors: active)' };
    expect(declaration(opaleSource, '.opale-button', 'border', forced)).toBe(
      '1px solid ButtonText',
    );
    expect(declaration(opaleSource, '.opale-button', 'border-radius', forced)).toBe(
      'calc(var(--opale-squircle-radius) * 0.68)',
    );
  });
});
