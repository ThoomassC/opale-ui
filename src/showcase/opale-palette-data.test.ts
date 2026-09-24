import { describe, expect, it } from 'vitest';

import opaleSource from '../magic/opale.css?raw';
import { contrastRatio } from '../contract/color';
import { OPALE_PLATES, OPALE_TEXT_PAIRS } from './opale-palette-data';

/* =============================================================================
   LA PALETTE AFFICHÉE EST CELLE DE LA FEUILLE, ET RIEN NE LE GARANTISSAIT.

   `opale-palette-data.ts` écrit ses hexadécimaux EN DUR, et il le doit : une
   plaque documente un thème, elle ne peut pas suivre celui du lecteur. Mais un
   hexadécimal recopié à la main diverge tôt ou tard de la feuille sans que rien
   ne proteste — c'est arrivé une fois dans ce dépôt, `LIGHT_PLATE.ground`
   affichait `#deedf0` pendant que la feuille déclarait `#f2e9d6`.

   Ce fichier relit donc `opale.css` et compare, jeton par jeton et thème par
   thème. Une divergence est un rouge, pas un commentaire.

   DEUX RÉCIPROQUES, parce qu'une comparaison seule ne voit que ce qu'on lui
   montre :
     — toute valeur plaquée doit exister dans la feuille, au bon thème ;
     — tout jeton de COULEUR de la feuille doit être plaqué, ou nommé dans la
       liste d'exclusions avec sa raison. Sans cette seconde moitié, ajouter une
       couleur à la palette sans la documenter passerait inaperçu.
   ========================================================================== */

/** Le corps d'un bloc de `opale.css`, à accolades équilibrées. */
function blockBody(selector: string): string {
  const start = opaleSource.indexOf(`${selector} {`);

  if (start === -1) throw new Error(`Bloc « ${selector} » introuvable dans opale.css.`);

  const open = opaleSource.indexOf('{', start);
  let depth = 0;

  for (let index = open; index < opaleSource.length; index += 1) {
    if (opaleSource[index] === '{') depth += 1;
    if (opaleSource[index] === '}') {
      depth -= 1;
      if (depth === 0) return opaleSource.slice(open + 1, index);
    }
  }

  throw new Error(`Bloc « ${selector} » non refermé.`);
}

/** Les déclarations `--opale-*` d'un bloc, en minuscules. */
function declarations(body: string): Map<string, string> {
  const found = new Map<string, string>();

  for (const match of body.matchAll(/(--opale-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    found.set(match[1], match[2].trim().toLowerCase());
  }

  return found;
}

const LIGHT = declarations(blockBody(':root'));
const DARK = declarations(blockBody(":root[data-theme='dark']"));

/** Le thème sombre n'est qu'un DELTA : ce qu'il tait, il l'hérite du clair. */
function resolve(theme: 'light' | 'dark', token: string): string | undefined {
  if (theme === 'dark') return DARK.get(token) ?? LIGHT.get(token);
  return LIGHT.get(token);
}

/* Les jetons de couleur que les plaques ne montrent pas, et pourquoi. Une
   exclusion dont le jeton n'existe plus fait rougir le test : une exclusion
   périmée est un mensonge silencieux. */
const NOT_PLATED: Readonly<Record<string, string>> = {
  '--opale-focus':
    'anneau de focus — dans la vitrine, un graphite tiré de --opale-text : il n’a pas de teinte propre à montrer',
  '--opale-glass-surface':
    'lavis du matériau Liquid Glass — documenté par la page « Verre », qui montre la pile composée plutôt que la couche seule',
  '--opale-glass-border': 'liseré du matériau Liquid Glass — même raison',
  /* CES TROIS-LÀ NE DÉCRIVENT PAS LA MARQUE, MAIS LA LISIBILITÉ SUR UNE IMAGE.

     Une plaque de palette montre une couleur SUR UN SOL, et c'est ce qui la
     rend lisible : on voit la teinte et on la compare à ses voisines. Ces
     trois-ci n'ont de sens que posées sur une PHOTOGRAPHIE quelconque —
     l'encre du verre, son atténuation, et le voile qui garantit que la
     première se lise. Plaqués, on montrerait un carré blanc, un carré blanc
     un peu transparent et un carré bleu nuit : trois pastilles qui
     n'apprendraient rien.

     Ce qu'il faut savoir d'eux est CHIFFRÉ à leur déclaration dans
     `opale.css`, et c'est une mesure sur le cliché, pas une valeur de
     palette. */
  '--opale-glass-ink':
    'encre du matériau — blanche par construction, voir la mesure à sa déclaration',
  '--opale-glass-ink-muted': 'texte indicatif sous verre — même raison',
  '--opale-glass-scrim':
    'voile de lisibilité sous le matériau — un réglage de contraste, pas une couleur de marque',
};

describe('la palette Opale affichée par la page de fondation', () => {
  it.each(
    OPALE_PLATES.flatMap((plate) =>
      plate.groups.flatMap((group) =>
        group.swatches.map((swatch) => ({ theme: plate.theme, ...swatch })),
      ),
    ),
  )('$theme · $token vaut ce que déclare opale.css', ({ theme, token, hex }) => {
    expect(
      resolve(theme, token),
      `« ${token} » n’est pas déclaré dans opale.css pour le thème ${theme}.`,
    ).toBeDefined();
    expect(
      resolve(theme, token),
      `La plaque ${theme} affiche ${hex} pour « ${token} », la feuille déclare ` +
        `${resolve(theme, token)}. C’est la feuille qui a raison.`,
    ).toBe(hex.toLowerCase());
  });

  it('plaque tout jeton de couleur de la feuille, ou dit pourquoi il manque', () => {
    /* Les jetons de COULEUR seulement : la feuille porte aussi des rayons, des
       espacements, des ombres et des polices, qui ont leurs propres pages. */
    const colourTokens = [...LIGHT.keys()].filter((token) =>
      /^#|^rgb/.test(LIGHT.get(token) ?? ''),
    );
    const plated = new Set(
      OPALE_PLATES.flatMap((plate) =>
        plate.groups.flatMap((group) => group.swatches.map((swatch) => swatch.token)),
      ),
    );

    const missing = colourTokens.filter((token) => !plated.has(token) && !(token in NOT_PLATED));

    expect(
      missing,
      `Ces couleurs de opale.css ne sont ni plaquées ni exclues : ${missing.join(', ')}. ` +
        'Ajoutez-les à une plaque, ou inscrivez-les dans NOT_PLATED avec leur raison.',
    ).toEqual([]);

    const stale = Object.keys(NOT_PLATED).filter((token) => !LIGHT.has(token));

    expect(
      stale,
      `Ces exclusions visent des jetons qui n’existent plus : ${stale.join(', ')}.`,
    ).toEqual([]);
  });

  /* LES RATIOS SONT CALCULÉS, JAMAIS RECOPIÉS. `opale.css` n'en documente
     aucun ; un chiffre écrit à la main dans la page serait invérifiable. Ce
     garde mesure les paires qui portent vraiment du texte et exige le seuil AA
     du texte courant. */
  it.each(OPALE_TEXT_PAIRS)('$label tient le seuil AA de 4,5:1', ({ ink, ground }) => {
    expect(contrastRatio(ink, ground)).toBeGreaterThanOrEqual(4.5);
  });
});
