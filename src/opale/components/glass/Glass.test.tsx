import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Glass from './Glass';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/* =============================================================================
   LE MATÉRIAU, TESTÉ POUR LUI-MÊME.

   Tous les rendus `liquidGlass` passent par `Glass`, mais aucun test ne le
   visait directement : le filtre partagé, son compteur de montages et l'onde
   n'étaient tenus que par ricochet — c'est-à-dire pas du tout pour les
   branches qu'aucun composant n'emprunte.
   ========================================================================== */

const FILTER_ID = 'opale-glass-displacement';

/** Les `<svg>` qui portent le filtre partagé, dans tout le document. */
const filterHosts = () =>
  [...document.querySelectorAll(`#${FILTER_ID}`)].map((filter) => filter.closest('svg'));

const envelopeOf = (container: HTMLElement) => container.querySelector('[data-opale-glass]');

/** L'onde : le seul `<span>` décoratif posé directement dans l'enveloppe. */
const rippleOf = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-opale-glass] > span[aria-hidden="true"]');

describe('Glass — le filtre partagé', () => {
  it('devrait poser un seul filtre, masqué, pour le premier verre monté', () => {
    render(<Glass>Un</Glass>);

    const hosts = filterHosts();
    expect(hosts).toHaveLength(1);
    expect(hosts[0]).toHaveAttribute('aria-hidden', 'true');
    expect(hosts[0]?.parentElement).toBe(document.body);
  });

  it('devrait garder un seul filtre quand plusieurs verres sont montés', () => {
    render(
      <>
        <Glass>Un</Glass>
        <Glass>Deux</Glass>
        <Glass>Trois</Glass>
      </>,
    );

    expect(filterHosts()).toHaveLength(1);
  });

  it('devrait garder le filtre tant qu’un verre reste, et le retirer avec le dernier', () => {
    const first = render(<Glass>Un</Glass>);
    const second = render(<Glass>Deux</Glass>);

    first.unmount();
    expect(filterHosts(), 'Un verre reste monté : son filtre doit rester.').toHaveLength(1);

    second.unmount();
    expect(filterHosts(), 'Plus aucun verre : le filtre doit partir.').toHaveLength(0);
  });

  it('devrait reposer le filtre quand un verre revient après le dernier démontage', () => {
    render(<Glass>Un</Glass>).unmount();
    expect(filterHosts()).toHaveLength(0);

    render(<Glass>De retour</Glass>);

    expect(filterHosts()).toHaveLength(1);
  });

  it('ne devrait pas doubler un filtre déjà présent dans le document', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.innerHTML = `<filter id="${FILTER_ID}"></filter>`;
    document.body.append(svg);

    try {
      render(<Glass>Un</Glass>);
      expect(filterHosts()).toHaveLength(1);
    } finally {
      svg.remove();
    }
  });
});

describe('Glass — les couches', () => {
  it('devrait nommer ses trois couches décoratives et son contenu', () => {
    const { container } = render(<Glass>Texte</Glass>);
    const envelope = envelopeOf(container);

    expect(
      [...(envelope?.querySelectorAll('[data-opale-glass-layer]') ?? [])].map((layer) =>
        layer.getAttribute('data-opale-glass-layer'),
      ),
    ).toEqual(['refraction', 'tint', 'specular', 'content']);
    for (const name of ['refraction', 'tint', 'specular']) {
      expect(envelope?.querySelector(`[data-opale-glass-layer='${name}']`)).toHaveAttribute(
        'aria-hidden',
        'true',
      );
    }
    expect(screen.getByText('Texte')).toHaveAttribute('data-opale-glass-layer', 'content');
  });

  it('devrait rendre le contenu dans la balise demandée, avec ses props et sa ref', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Glass as="button" ref={ref} type="button" className="interne" aria-label="Valider">
        OK
      </Glass>,
    );

    const button = screen.getByRole('button', { name: 'Valider' });
    expect(ref.current).toBe(button);
    expect(button).toHaveClass('interne');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('devrait poser la classe et le style de l’appelant sur l’enveloppe', () => {
    const { container } = render(
      <Glass rootClassName="coquille" rootStyle={{ width: '12rem' }}>
        x
      </Glass>,
    );

    expect(envelopeOf(container)).toHaveClass('coquille');
    expect(envelopeOf(container)).toHaveStyle({ width: '12rem' });
  });
});

describe('Glass — le rebond', () => {
  it.each<'button' | 'a' | 'summary'>(['button', 'a', 'summary'])(
    'devrait faire rebondir un <%s>',
    (tag) => {
      const { container } = render(<Glass as={tag}>x</Glass>);

      expect(envelopeOf(container)).toHaveAttribute('data-opale-glass-press', 'true');
    },
  );

  it.each<'div' | 'section' | 'span'>(['div', 'section', 'span'])(
    'devrait laisser un <%s> immobile',
    (tag) => {
      const { container } = render(<Glass as={tag}>x</Glass>);

      expect(envelopeOf(container)).not.toHaveAttribute('data-opale-glass-press');
    },
  );

  it('devrait suivre un réglage explicite dans les deux sens', () => {
    const forced = render(
      <Glass as="span" pressFeedback>
        x
      </Glass>,
    );
    expect(envelopeOf(forced.container)).toHaveAttribute('data-opale-glass-press', 'true');

    const refused = render(
      <Glass as="button" pressFeedback={false}>
        y
      </Glass>,
    );
    expect(envelopeOf(refused.container)).not.toHaveAttribute('data-opale-glass-press');
  });
});

describe('Glass — l’onde', () => {
  it('devrait faire naître l’onde au point cliqué, en pourcentage de la boîte', () => {
    const { container } = render(
      <Glass as="button" enableLiquidAnimation>
        Onde
      </Glass>,
    );
    /* jsdom ne met rien en page : la boîte est la seule mesure simulée. */
    const envelope = container.querySelector<HTMLElement>('[data-opale-glass]');
    if (!envelope) throw new Error('Le verre ne rend pas d’enveloppe.');
    vi.spyOn(envelope, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 50, 200, 100));

    fireEvent.click(screen.getByRole('button', { name: 'Onde' }), { clientX: 150, clientY: 75 });

    expect(rippleOf(container)).toHaveStyle({ left: '25%', top: '25%' });
  });

  it('devrait effacer l’onde une fois son animation finie', () => {
    vi.useFakeTimers();
    const { container } = render(
      <Glass as="button" enableLiquidAnimation>
        Onde
      </Glass>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Onde' }));
    expect(rippleOf(container)).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(rippleOf(container), 'L’onde dure 600 ms (--opale-motion-slower).').not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(rippleOf(container)).toBeNull();
  });

  it('ne devrait faire naître aucune onde sans l’animation demandée, mais transmettre le clic', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Glass as="button" onClick={onClick}>
        Calme
      </Glass>,
    );

    await user.click(screen.getByRole('button', { name: 'Calme' }));

    expect(rippleOf(container)).toBeNull();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('devrait transmettre le clic aussi quand l’onde est demandée', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Glass as="button" enableLiquidAnimation onClick={onClick}>
        Onde
      </Glass>,
    );

    await user.click(screen.getByRole('button', { name: 'Onde' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('devrait lancer l’onde depuis le centre au front montant de triggerAnimation', () => {
    const { container, rerender } = render(<Glass>x</Glass>);
    expect(rippleOf(container)).toBeNull();

    rerender(<Glass triggerAnimation>x</Glass>);

    expect(rippleOf(container)).toHaveStyle({ left: '50%', top: '50%' });
  });

  it('devrait relancer l’onde à chaque front montant, jamais sur le niveau ni la descente', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<Glass triggerAnimation={false}>x</Glass>);
    const settle = () =>
      act(() => {
        vi.advanceTimersByTime(600);
      });

    rerender(<Glass triggerAnimation>x</Glass>);
    expect(rippleOf(container), 'Le front montant lance l’onde.').not.toBeNull();
    settle();

    rerender(<Glass triggerAnimation>x</Glass>);
    expect(rippleOf(container), 'Le niveau haut ne relance rien.').toBeNull();

    rerender(<Glass triggerAnimation={false}>x</Glass>);
    expect(rippleOf(container), 'La descente ne lance rien.').toBeNull();

    rerender(<Glass triggerAnimation>x</Glass>);
    expect(rippleOf(container), 'Un nouveau front relance l’onde.').not.toBeNull();
  });

  it('devrait remonter l’onde à neuf quand un front suit le précédent avant sa fin', () => {
    const { container, rerender } = render(<Glass triggerAnimation={false}>x</Glass>);

    rerender(<Glass triggerAnimation>x</Glass>);
    const first = rippleOf(container);
    rerender(<Glass triggerAnimation={false}>x</Glass>);
    rerender(<Glass triggerAnimation>x</Glass>);

    expect(rippleOf(container)).not.toBeNull();
    expect(rippleOf(container), 'Même nœud : l’animation ne repartirait pas.').not.toBe(first);
  });

  it('ne devrait pas lancer d’onde quand triggerAnimation est vrai dès le montage', () => {
    const { container } = render(<Glass triggerAnimation>x</Glass>);

    expect(rippleOf(container)).toBeNull();
  });
});
