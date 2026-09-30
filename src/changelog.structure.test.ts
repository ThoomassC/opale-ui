import { describe, expect, it } from 'vitest';

import { renderChangelog } from '../scripts/changelog.mjs';
import changelog from '../CHANGELOG.md?raw';
import manifest from '../package.json';
import { RELEASES } from './showcase/releases';

/* =============================================================================
   LE CHANGELOG EST LES NOTES DE LA VITRINE, RÉGÉNÉRÉES.

   DOCS-03 — l'archive n'avait aucun journal des versions : qui installe le
   paquet devait ouvrir la vitrine pour savoir ce qui avait changé.
   `CHANGELOG.md` est écrit par `npm run changelog` depuis
   `src/showcase/releases.ts`, la seule source ; ce garde le régénère et
   rougit dès qu'une note change sans lui.
   ========================================================================== */

describe('CHANGELOG.md', () => {
  it('est à jour des notes de src/showcase/releases.ts (npm run changelog)', () => {
    expect(changelog).toBe(renderChangelog(RELEASES));
  });

  it('part avec l’archive', () => {
    expect(manifest.files).toContain('CHANGELOG.md');
  });

  it('va de la plus récente à la plus ancienne', () => {
    const positions = RELEASES.map((release) => changelog.indexOf(`\n## ${release.version} `));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('nomme chaque version, et signale les ruptures', () => {
    for (const release of RELEASES) {
      expect(changelog).toContain(`## ${release.version} — ${release.dateLabel}`);
    }
    const breaking = RELEASES.filter((release) => release.breaking).length;
    expect(changelog.match(/^\*\*Rupture\.\*\*/gm)?.length ?? 0).toBe(breaking);
  });
});
