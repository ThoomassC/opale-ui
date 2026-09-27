import { describe, expect, it } from 'vitest';

import { compareVersions, highestTag, releaseBlocker } from '../../scripts/release-guard.mjs';

/* LE TAG FANTÔME, ET LA GARDE QUI L'AURAIT ARRÊTÉ.

   Le 24/09, un tag v4.0.0 a été posé sur un code antérieur à la 3.2.0, puis la
   ligne est redescendue en 3.x. Pour semver, v4.0.0 restait la version la plus
   récente : « le dernier tag » ou une borne ^4 installaient un code plus
   ancien. Le script de publication ne vérifiait que l'existence du tag exact. */
describe('la garde de publication', () => {
  it('compare des versions au sens semver, pas au sens alphabétique', () => {
    expect(compareVersions('3.10.0', '3.9.9')).toBeGreaterThan(0);
    expect(compareVersions('3.5.0', '4.0.0')).toBeLessThan(0);
    expect(compareVersions('3.5.0', '3.5.0')).toBe(0);
  });

  it('trouve le plus haut tag de version et ignore les autres', () => {
    expect(highestTag(['v0.2.0', 'v3.2.0', 'v3.10.0', 'latest', 'v3.9.1'])).toBe('3.10.0');
    expect(highestTag(['latest'])).toBeNull();
  });

  it('refuse une version qui n’est pas au-dessus du plus haut tag', () => {
    expect(releaseBlocker('3.5.1', ['v3.2.0', 'v4.0.0'])).toMatch(/4\.0\.0/);
    expect(releaseBlocker('3.2.0', ['v3.2.0'])).toMatch(/existe déjà/);
    expect(releaseBlocker('3.5.1', ['v3.2.0', 'v3.5.0'])).toBeNull();
  });
});
