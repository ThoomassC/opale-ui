import { describe, expect, it } from 'vitest';

import { pathBounds } from '../../../../magic/components/svg-map/path-bounds';
import { CORSE, FRANCE_DEPARTMENTS, FRANCE_VIEWBOX, ILE_DE_FRANCE } from './france-departments';

describe('les départements de la démonstration', () => {
  it('lit les 96 départements métropolitains', () => {
    expect(FRANCE_VIEWBOX).toBe('0 0 613 585');
    expect(FRANCE_DEPARTMENTS).toHaveLength(96);
    expect(new Set(FRANCE_DEPARTMENTS.map((d) => d.id)).size).toBe(96);
  });

  /* Chaque tracé doit se borner DANS le dessin : une boîte hors cadre dirait
     que la lecture des commandes relatives a dérivé. */
  it('borne chaque tracé à l’intérieur de la vue d’ensemble', () => {
    for (const department of FRANCE_DEPARTMENTS) {
      const box = pathBounds(department.path);
      expect(box.minX, department.id).toBeGreaterThanOrEqual(-1);
      expect(box.minY, department.id).toBeGreaterThanOrEqual(-1);
      expect(box.maxX, department.id).toBeLessThanOrEqual(614);
      expect(box.maxY, department.id).toBeLessThanOrEqual(586);
      expect(box.maxX - box.minX, department.id).toBeGreaterThan(0);
    }
  });

  it('connaît les ensembles cadrés par la page', () => {
    const ids = new Set(FRANCE_DEPARTMENTS.map((d) => d.id));
    for (const id of [...ILE_DE_FRANCE, ...CORSE]) expect(ids.has(id), id).toBe(true);
  });
});
