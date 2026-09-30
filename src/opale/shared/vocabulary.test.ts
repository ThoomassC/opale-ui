import { describe, expect, it } from 'vitest';

import { normalizeSize } from './vocabulary';

describe('normalizeSize', () => {
  it.each([
    ['sm', 'small'],
    ['md', 'medium'],
    ['lg', 'large'],
    ['compact', 'small'],
    ['comfortable', 'medium'],
    ['spacious', 'large'],
  ] as const)('devrait ramener l’ancienne taille %s sur %s', (legacy, canonical) => {
    expect(normalizeSize(legacy, 'medium')).toBe(canonical);
  });

  it('devrait rendre la valeur de repli quand la taille est omise', () => {
    expect(normalizeSize(undefined, 'large')).toBe('large');
  });

  it.each(['small', 'medium', 'large'] as const)(
    'devrait laisser la taille canonique %s inchangée',
    (size) => {
      expect(normalizeSize(size, 'medium')).toBe(size);
    },
  );
});
