import postcss, { type AtRule, type Rule } from 'postcss';
import { describe, expect, it } from 'vitest';

import source from './style/Glass.module.css?raw';

/* =============================================================================
   LE DÉPLACEMENT SE COUPE LÀ OÙ IL COÛTE LE PLUS OU SERT LE MOINS.

   Chaque verre empile un `backdrop-filter` et un filtre SVG — bruit fractal
   puis déplacement — recalculés à chaque peinture. Le déplacement est retiré
   pour qui demande moins de transparence ou moins de mouvement, sur les
   petits écrans et sous un pointeur grossier. Le flou et la teinte restent :
   la matière se lit toujours comme du verre.
   ========================================================================== */

const root = postcss.parse(source);

const CONDITIONS = [
  '(prefers-reduced-transparency: reduce)',
  '(prefers-reduced-motion: reduce)',
  '(max-width: 37.499rem)',
  '(pointer: coarse)',
];

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

function refractionRulesUnder(condition: string): Rule[] {
  const rules: Rule[] = [];
  root.walkAtRules('media', (media: AtRule) => {
    const queries = media.params.split(',').map(normalize);
    if (!queries.includes(condition)) return;
    media.walkRules((rule) => {
      if (rule.selectors.includes('.refraction')) rules.push(rule);
    });
  });
  return rules;
}

const declarationsOf = (rules: readonly Rule[]) =>
  new Map(
    rules.flatMap((rule) => {
      const entries: Array<[string, string]> = [];
      rule.walkDecls((decl) => {
        entries.push([decl.prop, decl.value]);
      });
      return entries;
    }),
  );

describe('le déplacement du verre', () => {
  it('est posé sur la réfraction hors de toute préférence', () => {
    const base: Rule[] = [];
    root.walkRules('.refraction', (rule) => {
      if (rule.parent?.type === 'root') base.push(rule);
    });
    const declarations = declarationsOf(base);
    expect(declarations.get('filter')).toBe("url('#opale-glass-displacement')");
    expect(declarations.get('backdrop-filter')).toMatch(/blur\(/);
  });

  it.each(CONDITIONS)('se coupe sous %s', (condition) => {
    const declarations = declarationsOf(refractionRulesUnder(condition));
    expect(declarations.get('filter')).toBe('none');
  });

  it.each(CONDITIONS)('garde le flou et la teinte sous %s', (condition) => {
    const declarations = declarationsOf(refractionRulesUnder(condition));
    expect(declarations.has('backdrop-filter')).toBe(false);
    expect(declarations.has('-webkit-backdrop-filter')).toBe(false);

    const tint: string[] = [];
    root.walkAtRules('media', (media) => {
      if (!media.params.split(',').map(normalize).includes(condition)) return;
      media.walkRules((rule) => {
        if (rule.selectors.includes('.tint')) tint.push(rule.selector);
      });
    });
    expect(tint).toEqual([]);
  });
});
