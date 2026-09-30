import { describe, expect, it } from 'vitest';

import { loadPublicApi } from '../test/public-api';

/* =============================================================================
   CHAQUE PROP PUBLIQUE DIT CE QU'ELLE FAIT (DX-20).

   Ce que l'éditeur d'un consommateur affiche au survol d'une prop, c'est sa
   JSDoc : son rôle, sa valeur par défaut, ses contraintes. Une prop sans
   commentaire n'offre que son type, et renvoie au code source.

   Sont mesurées les props propres à Opale de chaque `*Props` exporté par
   l'entrée racine : les attributs hérités du DOM ou de `@types/react` sont
   documentés ailleurs et ne comptent pas. Le seuil ne descend pas : une prop
   ajoutée sans JSDoc le fait rougir.
   ========================================================================== */

/* La couverture atteinte en 3.10.0 : toutes les props propres (665 sur 665,
   contre 397 avant la passe DX-20). Le seuil ne se baisse pas pour faire
   passer une prop nouvelle : on la documente. */
const MIN_COVERAGE = 1;

interface Undocumented {
  readonly type: string;
  readonly prop: string;
}

function measure() {
  const api = loadPublicApi();
  const types = api.exportNames.filter((name) => name.endsWith('Props'));
  let total = 0;
  const undocumented: Undocumented[] = [];
  for (const type of types) {
    for (const prop of api.propDocsOfType(type) ?? []) {
      if (!prop.own) continue;
      total += 1;
      if (!prop.documented) undocumented.push({ type, prop: prop.name });
    }
  }
  return { types, total, undocumented };
}

describe('la JSDoc des props publiques', () => {
  const { types, total, undocumented } = measure();
  const coverage = total === 0 ? 0 : (total - undocumented.length) / total;

  it('mesure bien la surface', () => {
    expect(types).toContain('ButtonProps');
    expect(types).toContain('PageScaffoldProps');
    expect(total).toBeGreaterThan(300);
  });

  it(`documente au moins ${MIN_COVERAGE * 100} % des props propres`, () => {
    const report = undocumented.map(({ type, prop }) => `${type}.${prop}`);
    const measured = `${total - undocumented.length}/${total} (${(coverage * 100).toFixed(1)} %)`;
    expect(
      coverage >= MIN_COVERAGE,
      `JSDoc des props publiques : ${measured}. Sans JSDoc (${report.length}) :\n${report.join('\n')}`,
    ).toBe(true);
  });
});
