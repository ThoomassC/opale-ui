import { act, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  CarouselDemo,
  MarqueeDemo,
  RevealDemo,
  ScrollSectionDemo,
  SplitHeadingDemo,
} from './catalog-preview-additions';

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

/* La démo du bandeau passe ses garanties en enfants directs : chacune est lue
   une seule fois, la copie de la boucle étant masquée et inerte. */
describe('la démo du bandeau', () => {
  it('rend ses cinq garanties une fois pour les techniques d’assistance', () => {
    render(<MarqueeDemo />);
    const band = screen.getByRole('region', { name: 'Ce qu’Opale garantit' });
    const copies = band.querySelectorAll('.opale-marquee__copy');
    expect(copies).toHaveLength(2);
    const [shown, clone] = Array.from(copies);
    expect(clone).toHaveAttribute('aria-hidden', 'true');
    expect(clone).toHaveAttribute('inert');
    const items = Array.from(shown!.children);
    expect(items.map((item) => item.textContent)).toEqual([
      'WCAG 2.2 AA',
      'React 19',
      'Rendu serveur',
      'Verre liquide',
      'Aucune dépendance',
    ]);
    for (const item of items) {
      expect(within(band).getAllByText(item.textContent ?? '')).toHaveLength(2);
      expect(item.closest('[aria-hidden]')).toBeNull();
    }
    /* jsdom n'évalue pas `@media` : le bouton reste sous la règle de repos. */
    expect(band.querySelector('button')).toHaveTextContent('Mettre en pause');
  });
});

/* La démo du titre découpé : deux titres lus d'un seul tenant, et « Rejouer »
   qui remonte le premier — un nouveau nœud, donc une nouvelle montée. */
describe('la démo du titre découpé', () => {
  it('rend deux titres nommés par leur phrase, et remonte le premier à « Rejouer »', () => {
    render(<SplitHeadingDemo />);
    const first = screen.getByRole('heading', { level: 3, name: 'Un titre qui prend son temps.' });
    expect(
      screen.getByRole('heading', { level: 3, name: 'Celui-ci part quand on le voit.' }),
    ).toHaveClass('opale-split-heading', 'tc-doc-split-demo__below');
    expect(first.querySelectorAll('.opale-split-heading__word')).toHaveLength(6);
    act(() => screen.getByRole('button', { name: 'Rejouer' }).click());
    const replayed = screen.getByRole('heading', {
      level: 3,
      name: 'Un titre qui prend son temps.',
    });
    expect(replayed).not.toBe(first);
  });
});

/* La démo des fonds au défilement : une scène, quatre régions nommées par
   leur titre, chacune avec son fond, une bande courte qui la ferme, et
   l'étiquette collante hors section, qui suit le fond actif. jsdom n'a pas
   de mise en page : la scène reste sur le fond de sa première section. */
describe('la démo des fonds au défilement', () => {
  it('rend quatre régions nommées dans une scène au fond de la première', () => {
    const { container } = render(<ScrollSectionDemo />);
    const stage = container.querySelector('.opale-scroll-stage');
    expect(stage).toHaveAttribute('data-ground', 'paper');
    const regions = ['Papier', 'Ambre', 'Nuit', 'Bleu'].map((name) =>
      screen.getByRole('region', { name }),
    );
    expect(regions.map((region) => region.getAttribute('data-ground'))).toEqual([
      'paper',
      'amber',
      'night',
      'blue',
    ]);
    /* La bande courte qui ferme la scène. */
    expect(screen.getByRole('region', { name: 'Fin de la scène' })).toHaveAttribute(
      'data-ground',
      'amber',
    );
    for (const region of regions) {
      expect(within(region).getAllByRole('button')).toHaveLength(2);
    }
    /* Le bleu inverse le primaire : une case cochée et un interrupteur actif
       y sont posés pour que le navigateur mesure leur contraste. */
    expect(within(regions[3]).getByRole('checkbox')).toBeChecked();
    expect(within(regions[3]).getByRole('switch')).toBeChecked();
    /* Le nom affiché suit `data-ground` par la feuille ; le compte vient de
       `onGroundChange`, qui ne part pas au montage. */
    const label = screen.getByText(/^Fond actif :/);
    expect(label.querySelector('[data-name="paper"]')).toHaveTextContent('Papier');
    expect(label).toHaveTextContent('0 changement');
    expect(label.closest('.opale-scroll-section')).toBeNull();
    expect(label.parentElement).toBe(stage);
  });
});
