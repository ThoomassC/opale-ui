import { describe, expect, it } from 'vitest';

import releaseSource from '../scripts/release.mjs?raw';
import manifest from '../package.json';

/* =============================================================================
   LE SCRIPT DE PUBLICATION REJOUE TOUTE LA SUITE AVANT DE POSER LE TAG.

   ROB-14 — il ne lançait que `build:lib` et `check:dist` : une archive pouvait
   partir d'un commit dont la CI était rouge, ou n'avait pas tourné. Ce garde
   lit le script tel qu'il est écrit : chaque vérification y est nommée, existe
   dans `package.json`, et passe AVANT l'emballage et le tag.
   ========================================================================== */

const REQUIRED = [
  'typecheck',
  'lint',
  'test',
  'build:lib',
  'check:dist',
  'check:size',
  'check:consumer',
] as const;

const listed = (name: string): readonly string[] => {
  const match = new RegExp(`const ${name} = \\[([^\\]]*)\\]`).exec(releaseSource);
  return match ? [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]) : [];
};

describe('scripts/release.mjs', () => {
  const beforeBuild = listed('CHECKS_BEFORE_BUILD');
  const onBuild = listed('CHECKS_ON_BUILD');

  it('devrait lancer chaque vérification de la CI', () => {
    expect([...beforeBuild, 'build:lib', ...onBuild].sort()).toEqual([...REQUIRED].sort());
  });

  it('ne devrait nommer que des scripts qui existent', () => {
    const scripts = Object.keys(manifest.scripts);
    expect([...beforeBuild, ...onBuild].filter((name) => !scripts.includes(name))).toEqual([]);
  });

  it('devrait tout vérifier avant d’emballer et de taguer', () => {
    const verified = releaseSource.indexOf('CHECKS_ON_BUILD) run(');
    expect(releaseSource.indexOf('CHECKS_BEFORE_BUILD) run(')).toBeGreaterThan(0);
    expect(verified).toBeGreaterThan(releaseSource.indexOf("run('npm', 'run', 'build:lib')"));
    expect(verified).toBeLessThan(releaseSource.indexOf('packStaged(root'));
    expect(verified).toBeLessThan(releaseSource.indexOf("git('tag', '-a'"));
  });
});
