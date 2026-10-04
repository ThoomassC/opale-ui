import postcss, { AtRule, Rule, type Container, type Declaration, type Document } from 'postcss';
import { describe, expect, it } from 'vitest';

import { declarations, stripComments } from '../test/css-rules';
import motionSource from '../opale/motion.scss?raw';
import opaleSource from '../opale/opale.css?raw';

/* ============================================================================
   UNE SEULE ÉCHELLE DE MOUVEMENT.

   Toute durée de transition ou d'animation vient de `--opale-motion-*`, toute
   courbe de `--opale-ease*`. Deux exceptions, et elles sont de nature :
   - une boucle (`infinite`) a une PÉRIODE, pas une durée — la rotation d'un
     indicateur de chargement, le reflet d'un squelette ;
   - le bloc `prefers-reduced-motion` ramène les animations à 0,01 ms. Les
     transitions, elles, n'y perdent que leurs propriétés de mouvement : la
     couleur et l'opacité gardent leur durée écrite.
   ========================================================================== */

const modules = import.meta.glob<string>('../opale/components/**/*.{css,scss}', {
  query: '?raw',
  import: 'default',
  eager: true,
});

const sheets: Record<string, string> = {
  'opale.css': opaleSource,
  'motion.scss': motionSource,
  ...modules,
};

const MOTION_PROPS = new Set([
  'transition',
  'transition-duration',
  'transition-timing-function',
  'animation',
  'animation-duration',
  'animation-timing-function',
]);
const TIME = /(?<![\w-])\d*\.?\d+m?s\b/;
const CURVE =
  /cubic-bezier\(|steps\(|(?<![\w-])(ease|ease-in|ease-out|ease-in-out|linear)(?![\w-])/;

/** Vrai si la déclaration vit dans un bloc `prefers-reduced-motion`. */
function inReducedMotion(decl: Declaration): boolean {
  let node: Container | Document | undefined = decl.parent;
  while (node) {
    if (node instanceof AtRule && /prefers-reduced-motion/.test(node.params)) return true;
    node = node.parent;
  }
  return false;
}

/** Vrai si la déclaration est portée par une règle de jetons racine. */
function inRootTokens(decl: Declaration): boolean {
  return decl.parent instanceof Rule && decl.parent.selector.includes(':root');
}

describe('l’échelle de mouvement', () => {
  it('déclare durées et courbes à la racine', () => {
    const root = declarations(opaleSource, ':root');
    expect(root.get('--opale-motion-instant')).toBe('90ms');
    expect(root.get('--opale-motion-fast')).toBe('140ms');
    expect(root.get('--opale-motion')).toBe('220ms');
    expect(root.get('--opale-motion-slow')).toBe('300ms');
    expect(root.get('--opale-motion-slower')).toBe('600ms');
    expect(root.get('--opale-ease')).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
    expect(root.get('--opale-ease-out')).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
    expect(root.get('--opale-ease-spring')).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
  });

  for (const [file, raw] of Object.entries(sheets)) {
    const name = file.replace('../opale/components/', '');
    it(`${name} prend durées et courbes dans l’échelle`, () => {
      const offenders: string[] = [];
      postcss.parse(stripComments(raw)).walkDecls((decl) => {
        if (inRootTokens(decl) || inReducedMotion(decl)) return;
        const motionProp = MOTION_PROPS.has(decl.prop);
        const motionToken = decl.prop.startsWith('--') && /motion|ease|duration/.test(decl.prop);
        if (!motionProp && !motionToken) return;
        if (decl.prop.startsWith('animation') && /\binfinite\b/.test(decl.value)) return;
        if (TIME.test(decl.value) || CURVE.test(decl.value)) {
          offenders.push(`${decl.prop}: ${decl.value}`);
        }
      });
      expect(offenders).toEqual([]);
    });
  }

  /* MOINS DE MOUVEMENT, PAS MOINS DE RETOUR. Une transition ramenée à
     0,01 ms éteignait aussi le fondu de couleur qui confirme un survol ; le
     filet restreint donc la liste des propriétés et laisse la durée en place.
     Aucune propriété de déplacement, de taille ou d'ombre n'y figure. */
  it('ne coupe sous mouvement réduit que les transitions de mouvement', () => {
    const MOVEMENT =
      /\b(transform|translate|scale|rotate|box-shadow|width|height|inset|top|left|all)\b/;
    for (const file of ['opale.css', 'motion.scss'] as const) {
      postcss.parse(stripComments(sheets[file] ?? '')).walkDecls((decl) => {
        if (!inReducedMotion(decl)) return;
        if (decl.prop === 'transition-duration' || decl.prop === 'transition') {
          expect(decl.value, `${file} · ${decl.prop}`).not.toMatch(/(?<![\w.-])0?\.01ms\b/);
        }
      });
    }
    const filet = declarations(opaleSource, ":where([class^='opale-'], [class*=' opale-'])", {
      within: '@media (prefers-reduced-motion: reduce)',
    });
    const property = filet.get('transition-property') ?? '';
    expect(property).toBe(
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, opacity !important',
    );
    expect(property).not.toMatch(MOVEMENT);
  });

  it('n’écrit de courbe `cubic-bezier` qu’à la racine', () => {
    for (const [file, raw] of Object.entries(sheets)) {
      postcss.parse(stripComments(raw)).walkDecls((decl) => {
        if (inRootTokens(decl)) return;
        expect(decl.value, `${file} · ${decl.prop}`).not.toMatch(/cubic-bezier\(/);
      });
    }
  });
});
