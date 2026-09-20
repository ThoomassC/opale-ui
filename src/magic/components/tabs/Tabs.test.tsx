import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Tabs from './Tabs';

/**
 * jsdom n'a pas de mise en page : tout rectangle y vaut 0. C'est exactement la
 * situation d'une première peinture dans un vrai navigateur, ce qui rend le
 * défaut le plus coûteux de ce composant testable ici — un indicateur placé
 * sur des zéros partirait du coin haut-gauche en glissant, à chaque montage.
 * Les rectangles ne sont donc doublés que là où un test veut du mouvement.
 */
const rect = (left: number, width: number): DOMRect =>
  ({
    bottom: 32,
    height: 32,
    left,
    right: left + width,
    top: 0,
    width,
    x: left,
    y: 0,
    toJSON: () => ({}),
  }) as DOMRect;

const renderTabs = () =>
  render(
    <Tabs defaultValue="etapes">
      <Tabs.List>
        <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
        <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="etapes">Étapes du parcours</Tabs.Content>
      <Tabs.Content value="carte">Carte du parcours</Tabs.Content>
    </Tabs>,
  );

const indicatorOf = (container: HTMLElement) =>
  container.querySelector('[class*="tabsIndicator"]') as HTMLSpanElement;

describe('Tabs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('n’expose pas l’indicateur à l’arbre d’accessibilité', () => {
    const { container } = renderTabs();

    expect(indicatorOf(container)).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByRole('tab', { name: 'Étapes' })).toHaveAttribute('aria-selected', 'true');
  });

  it('ne place rien tant que la mise en page n’a pas de largeur', () => {
    const { container } = renderTabs();
    const indicator = indicatorOf(container);

    expect(indicator.style.transform).toBe('');
    /* Sans placement, pas de transition armée : c'est CE couple qui empêche le
       glissement depuis le coin au premier calcul réel. */
    expect(indicator.dataset.animated).toBeUndefined();
  });

  it('se pose sous l’onglet actif, puis le suit quand la sélection change', () => {
    const { container } = renderTabs();
    const list = screen.getByRole('tablist');
    const [first, second] = screen.getAllByRole('tab');

    vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(rect(0, 200));
    vi.spyOn(first, 'getBoundingClientRect').mockReturnValue(rect(8, 80));
    vi.spyOn(second, 'getBoundingClientRect').mockReturnValue(rect(96, 64));

    /* Un redimensionnement suffit à redemander une mesure sans changer la
       sélection : c'est le chemin qu'emprunteront une police qui finit de
       charger ou une fenêtre qu'on étire. */
    fireEvent(window, new Event('resize'));

    const indicator = indicatorOf(container);
    expect(indicator.style.transform).toBe('translate3d(8px, 0px, 0)');
    expect(indicator.style.width).toBe('80px');
    expect(indicator.style.opacity).toBe('1');
    expect(indicator.dataset.animated).toBe('true');

    fireEvent.click(second);

    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(indicator.style.transform).toBe('translate3d(96px, 0px, 0)');
    expect(indicator.style.width).toBe('64px');
  });

  it('suit l’axe vertical sans code dédié à l’orientation', () => {
    const { container } = render(
      <Tabs defaultValue="etapes" orientation="vertical">
        <Tabs.List>
          <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
          <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="etapes">Étapes du parcours</Tabs.Content>
      </Tabs>,
    );
    const list = screen.getByRole('tablist');
    const [, second] = screen.getAllByRole('tab');

    const stacked = (top: number): DOMRect =>
      ({ ...rect(0, 160), bottom: top + 32, top, y: top, toJSON: () => ({}) }) as DOMRect;

    vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(stacked(0));
    vi.spyOn(second, 'getBoundingClientRect').mockReturnValue(stacked(40));

    fireEvent.click(second);

    expect(list).toHaveAttribute('aria-orientation', 'vertical');
    expect(indicatorOf(container).style.transform).toBe('translate3d(0px, 40px, 0)');
  });
});
