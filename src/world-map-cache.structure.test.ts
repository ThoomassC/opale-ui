import { describe, expect, it } from 'vitest';

import vercel from '../vercel.json';

/* =============================================================================
   LE CACHE DES DONNÉES DE LA CARTE DU MONDE.

   Les fichiers de `public/world-map/v1/` sont immuables pour un an : un
   navigateur ne les redemande jamais. L'INDEX NE L'EST PAS : c'est lui qui
   dit quelles tuiles existent, et le marquer immuable figeait pour un an
   l'index d'une régénération ancienne. Il se revalide.
   ========================================================================== */

const headerFor = (path: string) => {
  let value: string | undefined;
  /* Comme Vercel : toutes les règles qui correspondent s'appliquent, la
     dernière l'emporte pour un même en-tête. */
  for (const rule of vercel.headers) {
    const pattern = new RegExp(
      `^${rule.source.replace('(.*)', '.*').replaceAll('.json', '\\.json')}$`,
    );
    if (!pattern.test(path)) continue;
    for (const header of rule.headers) if (header.key === 'Cache-Control') value = header.value;
  }
  return value;
};

describe('le cache des données de WorldMap', () => {
  it('garde les niveaux et les tuiles immuables', () => {
    expect(headerFor('/world-map/v1/110m.json')).toContain('immutable');
    expect(headerFor('/world-map/v1/10m/18_4.json')).toContain('immutable');
  });

  it('revalide l’index', () => {
    const index = headerFor('/world-map/v1/index.json') ?? '';
    expect(index).not.toContain('immutable');
    expect(index).toContain('must-revalidate');
  });
});
