import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PageScaffold, type PageScaffoldSearchSuggestion } from './PageScaffold';

afterEach(cleanup);

/* =============================================================================
   CHAQUE RÉGION SE RETIRE, SE REMPLACE OU SE RÈGLE — ET LA RECHERCHE SE PILOTE.

   Le fichier principal couvre la page par défaut et les parcours complets. Ce
   fichier tient ce qu'il laissait de côté : les valeurs VIDES qui retirent un
   morceau (`null` n'est pas `undefined`), les listes vides, les emplacements
   qui remplacent une zone entière, et le clavier de la recherche hors du
   chemin nominal.

   Les liens de ce fichier visent des ancres (`#…`) : jsdom ne sait pas
   naviguer vers un autre document, il sait suivre une ancre.
   ========================================================================== */

/* Le bouton du menu mobile est masqué par la feuille sur grand écran, et
   Testing Library ne le retrouve pas par rôle et nom, même avec
   `hidden: true` — comme le fichier principal, on l'atteint donc par ce qu'il
   pilote. Le combobox de langue porte aussi `aria-controls`, d'où `:not([role])`. */
function menuButton(): HTMLButtonElement {
  const button = screen
    .getByRole('banner')
    .querySelector<HTMLButtonElement>('button[aria-controls]:not([role])');
  if (!button) throw new Error('Bouton de menu absent');
  return button;
}

const ANCHORS = [
  { id: 'a', href: '#a', label: 'Ancre A' },
  { id: 'b', href: '#b', label: 'Ancre B' },
];

describe('PageScaffold — les textes qu’on retire', () => {
  it('devrait retirer le surtitre, la description et les mentions passés à null', () => {
    render(
      <PageScaffold
        introEyebrow={null}
        pageDescription={null}
        footerDescription={null}
        copyrightText={null}
        copyrightYear={2030}
      />,
    );

    expect(screen.queryByText('Bienvenue')).not.toBeInTheDocument();
    expect(screen.queryByText(/Découvrez nos contenus/)).not.toBeInTheDocument();
    expect(screen.queryByText('Une expérience construite avec Opale.')).not.toBeInTheDocument();
    expect(within(screen.getByRole('contentinfo')).getByText('© 2030 Mon site')).toBeVisible();
  });

  it('devrait écrire le surtitre, la description et le pied fournis', () => {
    render(
      <PageScaffold
        pageDescription="Tout sur l’atelier."
        footerDescription="Fait main."
        copyrightYear={2030}
      />,
    );

    expect(screen.getByText('Tout sur l’atelier.')).toBeVisible();
    expect(screen.getByText('Fait main.')).toBeVisible();
  });

  it('devrait retirer tout le copyright sur demande', () => {
    render(<PageScaffold showCopyright={false} />);

    expect(within(screen.getByRole('contentinfo')).queryByText(/©/)).not.toBeInTheDocument();
  });

  it('devrait lire l’année du copyright sur l’horloge quand on ne la donne pas', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2031-06-15T12:00:00Z'));
    try {
      render(<PageScaffold />);

      expect(within(screen.getByRole('contentinfo')).getByText(/© 2031 Mon site/)).toBeVisible();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('PageScaffold — la marque', () => {
  it('devrait dessiner la marque par défaut, décorative', () => {
    const brand = render(<PageScaffold />).getByRole('link', { name: 'Accueil — Mon site' });

    const mark = brand.querySelector('[aria-hidden="true"]');
    expect(mark?.childElementCount, 'Le monogramme compte neuf pastilles.').toBe(9);
  });

  it('devrait retirer tout pictogramme quand le logo vaut null', () => {
    const brand = render(<PageScaffold logo={null} />).getByRole('link', {
      name: 'Accueil — Mon site',
    });

    expect(brand.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(brand).toHaveTextContent('Mon site');
  });

  it('devrait céder toute la marque à l’emplacement fourni', () => {
    render(<PageScaffold slots={{ brand: <a href="#maison">Maison</a> }} />);

    expect(screen.getByRole('link', { name: 'Maison' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Accueil — Mon site' })).not.toBeInTheDocument();
  });
});

describe('PageScaffold — les navigations', () => {
  it('devrait retirer navigations et bouton de menu quand la liste est vide', () => {
    render(<PageScaffold navigation={[]} />);

    const header = screen.getByRole('banner');
    expect(within(header).queryByRole('navigation')).not.toBeInTheDocument();
    expect(header.querySelector('button[aria-controls]:not([role])')).toBeNull();
    expect(document.querySelector('nav[aria-label$="mobile"]')).toBeNull();
  });

  it('devrait retirer la navigation du pied quand ses liens sont vides', () => {
    render(<PageScaffold footerLinks={[]} />);

    expect(
      within(screen.getByRole('contentinfo')).queryByRole('navigation'),
    ).not.toBeInTheDocument();
  });

  it('devrait transmettre la cible et la relation des liens de pied', () => {
    render(
      <PageScaffold
        footerLinks={[
          { id: 'x', href: 'https://example.test', label: 'Externe', target: '_blank', rel: 'me' },
        ]}
      />,
    );

    const external = screen.getByRole('link', { name: 'Externe' });
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'me');
  });

  it('devrait nommer les deux navigations d’après le libellé fourni', () => {
    render(<PageScaffold navigation={ANCHORS} navigationLabel="Sections" />);

    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
    expect(
      document.querySelector('nav[aria-label="Sections — mobile"]'),
      'La navigation mobile, masquée, reprend le libellé.',
    ).not.toBeNull();
  });

  it('devrait refermer le menu mobile et rendre le focus quand on suit une destination sans routeur', async () => {
    const user = userEvent.setup();
    render(<PageScaffold navigation={ANCHORS} mobileMenuLabel="Ouvrir le menu" />);
    const button = menuButton();
    expect(button).toHaveAttribute('aria-label', 'Ouvrir le menu');

    await user.click(button);
    const menu = screen.getByRole('navigation', { name: 'Navigation principale — mobile' });
    await user.click(within(menu).getByRole('link', { name: 'Ancre B' }));

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('devrait refermer le menu mobile au second clic sur son bouton', async () => {
    const user = userEvent.setup();
    render(<PageScaffold navigation={ANCHORS} />);
    const button = menuButton();

    await user.click(button);
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('devrait garder le menu mobile ouvert pour une autre touche qu’Échap', async () => {
    const user = userEvent.setup();
    render(<PageScaffold navigation={ANCHORS} />);
    const button = menuButton();

    await user.click(button);
    await user.keyboard('a');

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('ne devrait plus écouter le document une fois le menu refermé', () => {
    render(<PageScaffold navigation={ANCHORS} />);
    const button = menuButton();
    const removed = vi.spyOn(document, 'removeEventListener');

    fireEvent.click(button);
    fireEvent.click(button);

    expect(removed.mock.calls.map(([type]) => type)).toEqual(
      expect.arrayContaining(['keydown', 'pointerdown']),
    );
    removed.mockRestore();
  });
});

describe('PageScaffold — les actions du header', () => {
  it('devrait ne garder que la langue quand le thème est retiré', () => {
    render(<PageScaffold showThemeToggle={false} />);

    expect(
      screen.queryByRole('button', { name: 'Changer le thème clair ou sombre' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Langue de la page' })).toBeInTheDocument();
  });

  it('devrait ne garder que le thème quand la langue est retirée, avec son libellé', () => {
    render(<PageScaffold showLanguageSelector={false} themeToggleLabel="Nuit" />);

    expect(screen.getByRole('button', { name: 'Nuit' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Langue de la page' })).not.toBeInTheDocument();
  });

  it('devrait retirer toute la zone quand les deux sont retirés', () => {
    render(<PageScaffold showThemeToggle={false} showLanguageSelector={false} />);

    expect(within(screen.getByRole('banner')).queryByRole('combobox')).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('banner')).queryByRole('button', { pressed: false }),
    ).not.toBeInTheDocument();
  });

  it('devrait céder la zone à l’emplacement fourni, ou la retirer pour null', () => {
    const { unmount } = render(
      <PageScaffold slots={{ actions: <button type="button">Connexion</button> }} />,
    );
    expect(screen.getByRole('button', { name: 'Connexion' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Langue de la page' })).not.toBeInTheDocument();
    unmount();

    render(<PageScaffold slots={{ actions: null }} />);
    expect(screen.queryByRole('combobox', { name: 'Langue de la page' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Changer le thème clair ou sombre' }),
    ).not.toBeInTheDocument();
  });

  it('devrait nommer le sélecteur de langue d’après le libellé fourni', () => {
    render(<PageScaffold languageSelectorLabel="Langue du site" />);

    expect(screen.getByRole('combobox', { name: 'Langue du site' })).toBeInTheDocument();
  });

  it('devrait repasser au clair depuis le sombre en mode autonome', async () => {
    const user = userEvent.setup();
    const { container } = render(<PageScaffold defaultTheme="dark" defaultLanguage="en" />);
    const toggle = screen.getByRole('button', { name: 'Switch between light and dark theme' });

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);

    expect(container.firstElementChild).toHaveAttribute('data-opale-page-theme', 'light');
  });
});

describe('PageScaffold — le conteneur et ses réglages', () => {
  it('devrait poser l’identifiant de contenu et les classes de l’appelant', () => {
    render(
      <PageScaffold
        mainId="contenu"
        className="page"
        classNames={{
          main: 'principal',
          intro: 'accroche',
          footer: 'pied',
          brand: 'marque',
          navigation: 'onglets',
        }}
      />,
    );

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'contenu');
    expect(main).toHaveAttribute('tabindex', '-1');
    expect(main).toHaveClass('principal');
    expect(main.closest('.page')).not.toBeNull();
    expect(screen.getByRole('contentinfo')).toHaveClass('pied');
    expect(screen.getByRole('link', { name: 'Accueil — Mon site' })).toHaveClass('marque');
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toHaveClass(
      'onglets',
    );
    expect(screen.getByRole('heading', { level: 1 }).parentElement).toHaveClass('accroche');
  });

  it('devrait insérer les emplacements autour du contenu, dans l’ordre', () => {
    render(
      <PageScaffold
        slots={{
          beforeContent: <p>Avant</p>,
          afterContent: <p>Après</p>,
          footerExtra: <p>En plus</p>,
        }}
      >
        <p>Pendant</p>
      </PageScaffold>,
    );

    expect(
      [...screen.getByRole('main').querySelectorAll(':scope > p')].map((node) => node.textContent),
    ).toEqual(['Avant', 'Pendant', 'Après']);
    expect(within(screen.getByRole('contentinfo')).getByText('En plus')).toBeVisible();
  });

  it('devrait céder la recherche à l’emplacement fourni, ou la retirer pour null', () => {
    const { unmount } = render(
      <PageScaffold slots={{ search: <input aria-label="Recherche maison" /> }} />,
    );
    expect(screen.getByRole('textbox', { name: 'Recherche maison' })).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    unmount();

    render(<PageScaffold slots={{ search: null }} />);
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});

describe('PageScaffold — la recherche à suggestions', () => {
  const SUGGESTIONS: readonly PageScaffoldSearchSuggestion[] = [
    { id: 'ecole', label: 'École', href: '#ecole', group: 'Lieux' },
    { id: 'eclair', label: 'Éclair', href: '#eclair' },
    { id: 'ecluse', label: 'Écluse', href: '#ecluse', group: 'Lieux' },
  ];

  const searchbox = () => screen.getByRole('combobox', { name: 'Rechercher sur le site' });
  const options = () => screen.queryAllByRole('option');

  it('devrait trouver sans tenir compte des accents ni de la casse', async () => {
    const user = userEvent.setup();
    render(<PageScaffold searchSuggestions={SUGGESTIONS} />);

    await user.type(searchbox(), 'ECL');

    expect(options().map((option) => option.getAttribute('aria-label'))).toEqual([
      'Éclair',
      'Écluse — Lieux',
    ]);
  });

  it('devrait chercher aussi dans le groupe d’une suggestion', async () => {
    const user = userEvent.setup();
    render(<PageScaffold searchSuggestions={SUGGESTIONS} />);

    await user.type(searchbox(), 'lieux');

    expect(options()).toHaveLength(2);
  });

  it('ne devrait jamais proposer plus de huit suggestions', async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 12 }, (_, index) => ({
      id: `p${index}`,
      label: `Page ${index}`,
      href: `#p${index}`,
    }));
    render(<PageScaffold searchSuggestions={many} />);

    await user.type(searchbox(), 'page');

    expect(options()).toHaveLength(8);
  });

  it('devrait remonter de la première suggestion à la dernière avec Flèche haut', async () => {
    const user = userEvent.setup();
    render(<PageScaffold searchSuggestions={SUGGESTIONS} />);

    await user.type(searchbox(), 'ec');
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: 'Écluse — Lieux' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: 'Éclair' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(
      screen.getByRole('option', { name: 'École — Lieux' }),
      'Flèche bas boucle.',
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('ne devrait rien désigner aux flèches quand rien ne correspond', async () => {
    const user = userEvent.setup();
    render(<PageScaffold searchSuggestions={SUGGESTIONS} />);

    await user.type(searchbox(), 'zzz');
    await user.keyboard('{ArrowDown}');

    expect(searchbox()).not.toHaveAttribute('aria-activedescendant');
    expect(screen.getByRole('status')).toHaveTextContent('Aucun résultat');
  });

  it('devrait fermer la liste avec Échap sans effacer la saisie', async () => {
    const user = userEvent.setup();
    render(<PageScaffold searchSuggestions={SUGGESTIONS} />);

    await user.type(searchbox(), 'ec');
    await user.keyboard('{Escape}');

    expect(searchbox()).toHaveAttribute('aria-expanded', 'false');
    expect(searchbox()).toHaveValue('ec');
  });

  it('devrait laisser Échap au reste de la page quand la liste est déjà fermée', () => {
    render(<PageScaffold searchSuggestions={SUGGESTIONS} />);

    expect(fireEvent.keyDown(searchbox(), { key: 'Escape' })).toBe(true);
  });

  it('devrait soumettre la saisie avec Entrée quand aucune suggestion n’est désignée', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onSelect = vi.fn();
    render(
      <PageScaffold
        searchSuggestions={SUGGESTIONS}
        onSearchSuggestionSelect={onSelect}
        onSearch={onSearch}
      />,
    );

    await user.type(searchbox(), 'ec{Enter}');

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSearch).toHaveBeenCalledWith('ec', expect.anything());
    expect(searchbox()).toHaveAttribute('aria-expanded', 'false');
  });

  it('devrait choisir la suggestion cliquée et désigner celle qu’on survole', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PageScaffold searchSuggestions={SUGGESTIONS} onSearchSuggestionSelect={onSelect} />);

    await user.type(searchbox(), 'ec');
    await user.hover(screen.getByRole('option', { name: 'Éclair' }));
    expect(screen.getByRole('option', { name: 'Éclair' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('option', { name: 'Écluse — Lieux' }));
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(SUGGESTIONS[2]);
    expect(searchbox()).toHaveValue('');
  });

  it('devrait laisser le gestionnaire clavier de l’appelant passer en premier', async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn((event: React.KeyboardEvent<HTMLInputElement>) =>
      event.preventDefault(),
    );
    render(<PageScaffold searchSuggestions={SUGGESTIONS} searchProps={{ onKeyDown }} />);

    await user.type(searchbox(), 'ec');
    await user.keyboard('{ArrowDown}');

    expect(onKeyDown).toHaveBeenCalled();
    expect(searchbox(), 'L’appelant a pris la touche.').not.toHaveAttribute(
      'aria-activedescendant',
    );
  });

  it('devrait prévenir l’appelant de la saisie et du focus', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onFocus = vi.fn();
    render(<PageScaffold searchSuggestions={SUGGESTIONS} searchProps={{ onChange, onFocus }} />);

    await user.type(searchbox(), 'e');

    expect(onFocus).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledOnce();
  });

  it('devrait filtrer sur la valeur contrôlée de l’appelant', () => {
    render(
      <PageScaffold
        searchSuggestions={SUGGESTIONS}
        searchProps={{ value: 'écl', onChange: () => undefined }}
      />,
    );

    fireEvent.focus(searchbox());

    expect(searchbox()).toHaveValue('écl');
    expect(options()).toHaveLength(2);
  });

  it('devrait partir de la valeur initiale fournie', () => {
    render(<PageScaffold searchSuggestions={SUGGESTIONS} searchProps={{ defaultValue: 'éco' }} />);

    expect(searchbox()).toHaveValue('éco');
  });

  it('devrait nommer la liste et l’absence de résultat d’après les libellés fournis', async () => {
    const user = userEvent.setup();
    render(
      <PageScaffold
        searchSuggestions={SUGGESTIONS}
        searchSuggestionsLabel="Pistes"
        searchNoResultsLabel="Rien"
      />,
    );

    await user.type(searchbox(), 'ec');
    expect(screen.getByRole('listbox', { name: 'Pistes' })).toBeVisible();

    await user.type(searchbox(), 'zz');
    expect(screen.getByRole('status')).toHaveTextContent('Rien');
  });

  it('devrait soumettre sous le nom de champ que l’appelant impose', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<PageScaffold onSearch={onSearch} searchProps={{ name: 'mot' }} />);

    const search = screen.getByRole('searchbox', { name: 'Rechercher sur le site' });
    expect(search).toHaveAttribute('name', 'mot');
    await user.type(search, 'opale{Enter}');

    expect(onSearch).toHaveBeenCalledWith('opale', expect.anything());
  });

  it('devrait fermer la liste quand le focus quitte la recherche', async () => {
    const user = userEvent.setup();
    render(<PageScaffold searchSuggestions={SUGGESTIONS} />);

    await user.type(searchbox(), 'ec');
    await user.tab();

    expect(searchbox()).toHaveAttribute('aria-expanded', 'false');
  });
});
