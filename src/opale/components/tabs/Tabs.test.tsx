import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
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

/* =============================================================================
   LE MOTIF ARIA, ÉPROUVÉ POINT PAR POINT.

   Les quatre cas ci-dessus éprouvent la PASTILLE, qui est ce que l'œil voit.
   Ceux qui suivent éprouvent ce que l'œil ne voit pas et qui fait pourtant la
   moitié du composant : l'arrêt de tabulation unique, les flèches, Début et
   Fin, les deux modes d'activation, l'axe vertical et le montage tardif. Ils
   ont été écrits AVEC la réécriture, parce que la version copiée n'en avait
   aucun — et deux d'entre eux étaient rouges contre elle : `activationMode`
   n'y changeait rien, et sans `defaultValue` c'est le DERNIER onglet qui se
   sélectionnait, pas le premier.
   ========================================================================== */

/** Les trois onglets de référence, dont le dernier est hors d'atteinte. */
const renderKeyboardTabs = (props?: Partial<ComponentProps<typeof Tabs>>) =>
  render(
    <Tabs defaultValue="etapes" {...props}>
      <Tabs.List>
        <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
        <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
        <Tabs.Trigger value="brouillon" disabled>
          Brouillon
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="etapes">Les étapes</Tabs.Content>
      <Tabs.Content value="carte">La carte</Tabs.Content>
      <Tabs.Content value="brouillon">Le brouillon</Tabs.Content>
    </Tabs>,
  );

const tabStops = () =>
  screen
    .getAllByRole('tab')
    .filter((tab) => tab.getAttribute('tabindex') === '0')
    .map((tab) => tab.textContent);

describe('Tabs — l’arrêt de tabulation', () => {
  it('n’en pose qu’UN pour tout le groupe, sur l’onglet actif', () => {
    renderKeyboardTabs();

    expect(tabStops()).toEqual(['Étapes']);
    expect(screen.getByRole('tab', { name: 'Carte' })).toHaveAttribute('tabindex', '-1');
  });

  it('le déplace avec la sélection', async () => {
    const user = userEvent.setup();
    renderKeyboardTabs();

    await user.click(screen.getByRole('tab', { name: 'Carte' }));

    expect(tabStops()).toEqual(['Carte']);
  });

  it('le donne au premier onglet atteignable quand la valeur contrôlée ne désigne rien', () => {
    /* Le cas est une faute d'appel — une valeur venue d'une URL, un onglet
       retiré depuis —, et il n'est pas anodin : sans arrêt, la tabulation
       saute le composant entier et le clavier n'y entre plus jamais. */
    render(
      <Tabs value="inconnu">
        <Tabs.List>
          <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
          <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="etapes">Les étapes</Tabs.Content>
      </Tabs>,
    );

    expect(tabStops()).toEqual(['Étapes']);
  });
});

describe('Tabs — les flèches', () => {
  it('déplacent le focus, enjambent l’onglet désactivé et bouclent', async () => {
    const user = userEvent.setup();
    renderKeyboardTabs();

    screen.getByRole('tab', { name: 'Étapes' }).focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Carte' })).toHaveFocus();

    /* « Brouillon » est `disabled` : il reste dans la liste et dans l'ordre
       visuel, mais il n'est pas atteignable, donc la flèche suivante boucle
       sur le premier au lieu de s'y arrêter. */
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Étapes' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Carte' })).toHaveFocus();
  });

  it('changent d’onglet en activation automatique', async () => {
    const user = userEvent.setup();
    renderKeyboardTabs();

    screen.getByRole('tab', { name: 'Étapes' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Carte' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('La carte')).toBeVisible();
  });

  it('servent Début et Fin', async () => {
    const user = userEvent.setup();
    renderKeyboardTabs({ defaultValue: 'carte' });

    screen.getByRole('tab', { name: 'Carte' }).focus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Étapes' })).toHaveFocus();

    /* Fin va au dernier ATTEIGNABLE, pas au dernier rendu : « Brouillon » est
       désactivé, donc la fin de la liste est « Carte ». */
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Carte' })).toHaveFocus();
  });

  it('laissent haut et bas à la page quand la liste est horizontale', async () => {
    const user = userEvent.setup();
    renderKeyboardTabs();

    const first = screen.getByRole('tab', { name: 'Étapes' });
    first.focus();

    await user.keyboard('{ArrowDown}');

    expect(first).toHaveFocus();
    expect(first).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Tabs — activationMode', () => {
  it('« manual » déplace le focus SANS changer d’onglet, et Entrée confirme', async () => {
    const user = userEvent.setup();
    renderKeyboardTabs({ activationMode: 'manual' });

    screen.getByRole('tab', { name: 'Étapes' }).focus();
    await user.keyboard('{ArrowRight}');

    const carte = screen.getByRole('tab', { name: 'Carte' });
    expect(carte).toHaveFocus();
    expect(carte).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tab', { name: 'Étapes' })).toHaveAttribute('aria-selected', 'true');

    /* L'arrêt de tabulation suit le FOCUS et non la sélection : qui revient
       par la tabulation doit retrouver l'onglet qu'il était en train de
       parcourir, pas celui qu'il avait laissé sélectionné. */
    expect(tabStops()).toEqual(['Carte']);

    await user.keyboard('{Enter}');
    expect(carte).toHaveAttribute('aria-selected', 'true');
  });

  it('« manual » se confirme aussi à l’Espace', async () => {
    const user = userEvent.setup();
    renderKeyboardTabs({ activationMode: 'manual' });

    screen.getByRole('tab', { name: 'Étapes' }).focus();
    await user.keyboard('{ArrowRight} ');

    expect(screen.getByRole('tab', { name: 'Carte' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Tabs — l’axe vertical', () => {
  const renderVertical = () =>
    render(
      <Tabs defaultValue="etapes" orientation="vertical">
        <Tabs.List>
          <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
          <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="etapes">Les étapes</Tabs.Content>
        <Tabs.Content value="carte">La carte</Tabs.Content>
      </Tabs>,
    );

  it('déplace au haut et au bas', async () => {
    const user = userEvent.setup();
    renderVertical();

    screen.getByRole('tab', { name: 'Étapes' }).focus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('tab', { name: 'Carte' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('tab', { name: 'Étapes' })).toHaveFocus();
  });

  it('laisse gauche et droite tranquilles', async () => {
    const user = userEvent.setup();
    renderVertical();

    const first = screen.getByRole('tab', { name: 'Étapes' });
    first.focus();

    await user.keyboard('{ArrowRight}');

    expect(first).toHaveFocus();
  });
});

describe('Tabs — l’appariement des identifiants', () => {
  it('relie chaque onglet à son panneau, dans les deux sens', () => {
    renderTabs();

    const tab = screen.getByRole('tab', { name: 'Étapes' });
    const panel = screen.getByRole('tabpanel');

    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    /* Un panneau sans élément focalisable serait sauté par la tabulation s'il
       n'était pas lui-même un arrêt. */
    expect(panel).toHaveAttribute('tabindex', '0');
  });
});

describe('Tabs — la sélection initiale', () => {
  it('prend le PREMIER onglet atteignable quand aucune valeur n’est donnée', () => {
    /* Ce test était rouge contre la version copiée, et c'est le défaut le plus
       coûteux qu'elle contenait : chaque déclencheur portait l'effet de
       sélection, les trois lisaient la même valeur périmée, et le dernier
       écrasait les deux autres — le composant s'ouvrait sur le dernier onglet
       en documentant qu'il ouvrait le premier. */
    renderKeyboardTabs({ defaultValue: undefined });

    expect(screen.getByRole('tab', { name: 'Étapes' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Les étapes')).toBeVisible();
  });

  it('enjambe un premier onglet désactivé', () => {
    render(
      <Tabs>
        <Tabs.List>
          <Tabs.Trigger value="brouillon" disabled>
            Brouillon
          </Tabs.Trigger>
          <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="brouillon">Le brouillon</Tabs.Content>
        <Tabs.Content value="carte">La carte</Tabs.Content>
      </Tabs>,
    );

    expect(screen.getByRole('tab', { name: 'Carte' })).toHaveAttribute('aria-selected', 'true');
  });

  it('prévient l’appelant de la valeur qu’elle retient', () => {
    const onValueChange = vi.fn();

    renderKeyboardTabs({ defaultValue: undefined, onValueChange });

    expect(onValueChange).toHaveBeenCalledWith('etapes');
  });

  it('ne choisit rien à la place d’un appelant qui tient la valeur', () => {
    const onValueChange = vi.fn();

    render(
      <Tabs value="" onValueChange={onValueChange}>
        <Tabs.List>
          <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="etapes">Les étapes</Tabs.Content>
      </Tabs>,
    );

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'Étapes' })).toHaveAttribute('aria-selected', 'false');
  });
});

describe('Tabs — le mode contrôlé', () => {
  it('remonte le choix sans rien décider lui-même', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Tabs value="etapes" onValueChange={onValueChange}>
        <Tabs.List>
          <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
          <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="etapes">Les étapes</Tabs.Content>
        <Tabs.Content value="carte">La carte</Tabs.Content>
      </Tabs>,
    );

    await user.click(screen.getByRole('tab', { name: 'Carte' }));

    expect(onValueChange).toHaveBeenCalledWith('carte');
    /* L'appelant n'a pas rendu la nouvelle valeur : l'onglet ne doit donc PAS
       s'être déplacé tout seul. */
    expect(screen.getByRole('tab', { name: 'Étapes' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Tabs — lazyMount', () => {
  const renderLazy = () =>
    render(
      <Tabs defaultValue="etapes">
        <Tabs.List>
          <Tabs.Trigger value="etapes">Étapes</Tabs.Trigger>
          <Tabs.Trigger value="carte">Carte</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="etapes">Les étapes</Tabs.Content>
        <Tabs.Content value="carte" lazyMount>
          La carte
        </Tabs.Content>
      </Tabs>,
    );

  it('n’existe pas dans le DOM avant sa première ouverture', () => {
    renderLazy();

    expect(screen.queryByText('La carte')).not.toBeInTheDocument();
  });

  it('reste monté une fois ouvert, au lieu d’être remonté à chaque visite', async () => {
    const user = userEvent.setup();
    renderLazy();

    await user.click(screen.getByRole('tab', { name: 'Carte' }));
    expect(screen.getByText('La carte')).toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Étapes' }));

    /* Il est caché, pas détruit : c'est la différence entre « monter tard » et
       « remonter toujours ». Le second perdait le défilement, le formulaire à
       moitié rempli et tout ce que le panneau avait chargé. */
    expect(screen.getByText('La carte')).toBeInTheDocument();
    expect(screen.getByText('La carte')).not.toBeVisible();
  });
});

describe('Tabs — les panneaux sans lazyMount', () => {
  it('les monte tous et cache les inactifs', () => {
    renderTabs();

    expect(screen.getByText('Étapes du parcours')).toBeVisible();
    expect(screen.getByText('Carte du parcours')).not.toBeVisible();
  });
});
