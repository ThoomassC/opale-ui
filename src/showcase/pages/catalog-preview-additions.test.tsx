import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CarouselDemo } from './catalog-preview-additions';

/* La démo du carrousel passe ses diapositives en enfants directs : enveloppées
   dans un composant, elles se comptaient comme une seule, et la piste n'offrait
   plus qu'une position, flèches désactivées. */
describe('la démo du carrousel', () => {
  it('numérote les six diapositives de chaque carrousel', () => {
    render(<CarouselDemo />);
    for (const name of ['Composants d’Opale', 'Composants d’Opale, en lecture automatique']) {
      const region = screen.getByRole('region', { name });
      const labels = within(region)
        .getAllByRole('group')
        .map((group) => group.getAttribute('aria-label'))
        .filter((label) => label?.endsWith('sur 6'));
      expect(labels).toEqual(['1 sur 6', '2 sur 6', '3 sur 6', '4 sur 6', '5 sur 6', '6 sur 6']);
    }
  });
});
