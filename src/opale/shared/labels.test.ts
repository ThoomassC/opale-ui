import { describe, expect, it } from 'vitest';

import { resolveLabels } from './labels';

interface SampleLabels {
  close: string;
  count: (count: number) => string;
}

const DEFAULTS: SampleLabels = {
  close: 'Fermer',
  count: (count) => `${count} éléments`,
};

describe('resolveLabels', () => {
  it('devrait rendre les défauts quand aucun remplacement n’est donné', () => {
    expect(resolveLabels(DEFAULTS, undefined)).toEqual(DEFAULTS);
  });

  it('devrait remplacer une seule clé et garder les autres', () => {
    const labels = resolveLabels(DEFAULTS, { close: 'Close' });

    expect(labels.close).toBe('Close');
    expect(labels.count).toBe(DEFAULTS.count);
  });

  it('devrait garder le défaut d’une clé passée à undefined', () => {
    expect(resolveLabels(DEFAULTS, { close: undefined }).close).toBe('Fermer');
  });

  it('devrait accepter un libellé-fonction de remplacement', () => {
    const labels = resolveLabels(DEFAULTS, { count: (count) => `${count} items` });

    expect(labels.count(2)).toBe('2 items');
  });

  it('ne devrait jamais modifier l’objet des défauts', () => {
    resolveLabels(DEFAULTS, { close: 'Close' });

    expect(DEFAULTS.close).toBe('Fermer');
  });
});
