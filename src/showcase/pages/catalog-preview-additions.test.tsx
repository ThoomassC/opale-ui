import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CarouselDemo, RevealDemo } from './catalog-preview-additions';

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

/* La démo de l'apparition rend ses cartes visibles : jsdom n'a pas de mise en
   page, aucune n'est sous la vue, aucune n'est donc en attente. Chaque carte
   est un `<li>` enfant direct de la liste. */
describe('la démo de l’apparition', () => {
  it('rend ses neuf cartes visibles, en enfants directs de la liste', () => {
    render(<RevealDemo />);
    const list = screen.getByRole('list', { name: 'Les qualités d’Opale' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(9);
    for (const item of items) {
      expect(item.parentElement).toBe(list);
      expect(item).toHaveClass('opale-reveal');
      expect(item).not.toHaveAttribute('data-reveal', 'pending');
    }
    expect(document.querySelector('[data-reveal="pending"]')).toBeNull();
  });
});
