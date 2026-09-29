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
   - le bloc `prefers-reduced-motion` ramène tout à 0,01 ms.
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
const CURVE = /cubic-bezier\(|steps\(|(?<![\w-])(ease|ease-in|ease-out|ease-in-out|linear)(?![\w-])/;

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

  it('n’écrit de courbe `cubic-bezier` qu’à la racine', () => {
    for (const [file, raw] of Object.entries(sheets)) {
      postcss.parse(stripComments(raw)).walkDecls((decl) => {
        if (inRootTokens(decl)) return;
        expect(decl.value, `${file} · ${decl.prop}`).not.toMatch(/cubic-bezier\(/);
      });
    }
  });
});
