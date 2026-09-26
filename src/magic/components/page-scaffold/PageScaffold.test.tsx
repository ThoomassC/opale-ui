import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Opale } from '../../opale';
import { PageScaffold } from './PageScaffold';

describe('PageScaffold', () => {
  it('est le même composant depuis l’export nommé et le namespace Opale', () => {
    expect(Opale.PageScaffold).toBe(PageScaffold);
  });

  it('fournit une page complète et des repères accessibles par défaut', () => {
    const { container } = render(
      <PageScaffold copyrightYear={2026}>Contenu personnalisé</PageScaffold>,
    );

    const header = screen.getByRole('banner');
    const main = screen.getByRole('main');
    const footer = screen.getByRole('contentinfo');

    expect(within(header).getByRole('link', { name: 'Accueil — Mon site' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(within(header).getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
    expect(
      within(header).getByRole('button', { name: 'Changer le thème clair ou sombre' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(within(header).getByRole('combobox', { name: 'Langue de la page' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(container.querySelector('form')).toHaveAttribute('action', '/search');
    expect(container.querySelector('form')).toHaveAttribute('method', 'get');
    const search = within(header).getByRole('searchbox', { name: 'Rechercher sur le site' });
    expect(search).toHaveAttribute('name', 'q');
    expect(search).toHaveAttribute('autocomplete', 'off');
    expect(search).toHaveAttribute('autocorrect', 'off');
    expect(search).toHaveAttribute('spellcheck', 'false');
    expect(within(main).getByRole('heading', { level: 1, name: 'Mon site' })).toBeVisible();
    expect(main).toHaveTextContent('Contenu personnalisé');
    expect(within(footer).getByText('© 2026 Mon site. Tous droits réservés.')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Aller au contenu' })).not.toBeInTheDocument();
  });

  it('transmet les réglages et soumet la recherche sans navigation quand un callback est fourni', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onNavigate = vi.fn((_link, event: React.MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    );
    const navigation = [
      { id: 'start', label: 'Départ', href: '/depart' },
      { id: 'work', label: 'Projets', href: '/projets' },
    ];

    const { container } = render(
      <PageScaffold
        siteName="Atelier"
        brandLabel="Aller à Atelier"
        logo={
          <svg data-testid="logo-personnalise" viewBox="0 0 8 8">
            <circle cx="4" cy="4" r="3" />
          </svg>
        }
        introEyebrow="Notre sélection"
        titleAs="h2"
        footerNavigationLabel="Liens utiles"
        copyrightText="Licence privée."
        homeHref="/depart"
        navigation={navigation}
        activeId="work"
        onNavigate={onNavigate}
        onSearch={onSearch}
        searchAction="/chercher"
        searchName="terme"
        searchProps={{ placeholder: 'Trouver un projet' }}
        pageTitle="Nos projets"
        copyrightOwner="Studio Atelier"
        copyrightYear={2025}
        footerLinks={[{ id: 'contact', href: '/contact', label: 'Contact' }]}
      >
        La sélection
      </PageScaffold>,
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Nos projets' })).toBeVisible();
    expect(screen.getByText('Notre sélection')).toBeVisible();
    expect(screen.getByTestId('logo-personnalise')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Aller à Atelier' })).toHaveAttribute(
      'href',
      '/depart',
    );
    expect(screen.getByRole('link', { name: 'Projets' })).toHaveAttribute('aria-current', 'page');
    expect(
      within(screen.getByRole('navigation', { name: 'Liens utiles' })).getByRole('link', {
        name: 'Contact',
      }),
    ).toHaveAttribute('href', '/contact');
    expect(screen.getByText('© 2025 Studio Atelier. Licence privée.')).toBeVisible();

    const form = container.querySelector('form');
    expect(form).toHaveAttribute('action', '/chercher');
    const search = screen.getByRole('searchbox', { name: 'Rechercher sur le site' });
    expect(search).toHaveAttribute('name', 'terme');
    await user.type(search, 'Opale{Enter}');
    expect(onSearch).toHaveBeenCalledWith('Opale', expect.anything());

    await user.click(screen.getByRole('link', { name: 'Projets' }));
    expect(onNavigate).toHaveBeenCalledWith(navigation[1], expect.anything());
  });

  it('propose une liste bleue pilotable au clavier et ouvre la suggestion choisie', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const suggestion = { id: 'projects', label: 'Projets', href: '/projets', group: 'Navigation' };
    render(<PageScaffold searchSuggestions={[suggestion]} onSearchSuggestionSelect={onSelect} />);

    const search = screen.getByRole('combobox', { name: 'Rechercher sur le site' });
    await user.type(search, 'pro');
    const list = screen.getByRole('listbox', { name: 'Suggestions de recherche' });
    const option = within(list).getByRole('option', { name: 'Projets — Navigation' });
    expect(search).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{ArrowDown}');
    expect(option).toHaveAttribute('aria-selected', 'true');
    expect(search).toHaveAttribute('aria-activedescendant', option.id);
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(suggestion);
    expect(search).toHaveValue('');
    expect(list).not.toBeVisible();
  });

  it('écarte la complétion native et ferme les suggestions au clic extérieur', async () => {
    const user = userEvent.setup();
    render(
      <PageScaffold searchSuggestions={[{ id: 'projects', label: 'Projets', href: '/projets' }]} />,
    );
    const search = screen.getByRole('combobox', { name: 'Rechercher sur le site' });
    expect(search).toHaveAttribute('autocomplete', 'off');
    expect(search).toHaveAttribute('autocorrect', 'off');
    expect(search).toHaveAttribute('spellcheck', 'false');
    await user.type(search, 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('Aucun résultat');
    await user.clear(search);
    await user.type(search, 'pro');
    expect(screen.getByRole('listbox', { name: 'Suggestions de recherche' })).toBeVisible();
    await user.click(screen.getByRole('heading', { name: 'Mon site' }));
    expect(search).toHaveAttribute('aria-expanded', 'false');
  });

  it('conserve les onglets et menus personnalisés par les emplacements du gabarit', () => {
    const { container } = render(
      <PageScaffold
        slots={{
          navigation: <a href="/sur-mesure">Sur mesure</a>,
          mobileNavigation: <a href="/mobile">Mobile personnalisé</a>,
        }}
      />,
    );
    const desktop = within(screen.getByRole('banner')).getByRole('navigation', {
      name: 'Navigation principale',
    });
    const mobile = container.querySelector('nav[aria-label="Navigation principale — mobile"]');

    expect(within(desktop).getByRole('link', { name: 'Sur mesure' })).toHaveAttribute(
      'href',
      '/sur-mesure',
    );
    expect(within(desktop).queryByRole('link', { name: 'Accueil' })).not.toBeInTheDocument();
    expect(mobile).toHaveTextContent('Mobile personnalisé');
    expect(mobile).not.toHaveTextContent('Accueil');
  });

  it('ouvre le menu mobile, le ferme par Échap ou par une destination et restaure le focus', async () => {
    const { container } = render(
      <PageScaffold onNavigate={(_link, event) => event.preventDefault()} />,
    );

    const button = container.querySelector<HTMLButtonElement>('button[aria-controls]');
    expect(button).not.toBeNull();
    if (!button) throw new Error('Bouton de menu absent');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const menu = document.getElementById(button.getAttribute('aria-controls') ?? '');
    expect(menu).not.toBeNull();
    if (!menu) throw new Error('Menu mobile absent');
    expect(menu).not.toHaveAttribute('hidden');

    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();

    fireEvent.click(button);
    fireEvent.click(within(menu).getByText('Accueil'));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('change localement de thème et traduit les libellés par défaut', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    const onLanguageChange = vi.fn();
    const { container } = render(
      <PageScaffold onThemeChange={onThemeChange} onLanguageChange={onLanguageChange} />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('data-opale-page-theme', 'light');
    await user.click(screen.getByRole('button', { name: 'Changer le thème clair ou sombre' }));
    expect(root).toHaveAttribute('data-opale-page-theme', 'dark');
    expect(onThemeChange).toHaveBeenCalledWith('dark');
    expect(document.documentElement).not.toHaveAttribute('data-opale-page-theme');

    await user.click(screen.getByRole('combobox', { name: 'Langue de la page' }));
    await user.click(
      within(screen.getByRole('listbox', { name: 'Langue de la page' })).getByRole('option', {
        name: 'English',
      }),
    );
    expect(root).toHaveAttribute('lang', 'en');
    expect(onLanguageChange).toHaveBeenCalledWith('en');
    expect(screen.getByRole('link', { name: 'Home — Mon site' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search this site' })).toBeInTheDocument();
    expect(screen.getByText('All rights reserved.', { exact: false })).toBeInTheDocument();
  });

  it('aligne les contrôles sur le header et ferme la liste de langues au clic extérieur', async () => {
    const user = userEvent.setup();
    const { container } = render(<PageScaffold />);
    const header = screen.getByRole('banner');
    const search = within(header).getByRole('searchbox');
    const navigation = within(header).getByRole('navigation');
    const menu = header.querySelector<HTMLButtonElement>('button[aria-expanded][aria-controls]');
    const theme = within(header).getByRole('button', { name: 'Changer le thème clair ou sombre' });
    const language = within(header).getByRole('combobox', { name: 'Langue de la page' });

    if (!menu) throw new Error('Bouton de menu absent');
    expect(
      search.compareDocumentPosition(navigation) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(menu.compareDocumentPosition(theme) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(theme.compareDocumentPosition(language) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(language);
    expect(language).toHaveAttribute('aria-expanded', 'true');
    expect(within(header).getByRole('listbox', { name: 'Langue de la page' })).toBeVisible();
    fireEvent.pointerDown(screen.getByRole('heading', { name: 'Mon site' }));
    expect(language).toHaveAttribute('aria-expanded', 'false');
    expect(container.firstElementChild).toHaveAttribute('lang', 'fr');
  });

  it('garde les valeurs contrôlées tant que le parent ne les modifie pas', async () => {
    const user = userEvent.setup();
    const onThemeChange = vi.fn();
    const onLanguageChange = vi.fn();
    const { container } = render(
      <PageScaffold
        theme="dark"
        language="es"
        onThemeChange={onThemeChange}
        onLanguageChange={onLanguageChange}
      />,
    );
    expect(container.firstElementChild).toHaveAttribute('data-opale-page-theme', 'dark');
    await user.click(screen.getByRole('button', { name: 'Cambiar entre tema claro y oscuro' }));
    await user.click(screen.getByRole('combobox', { name: 'Idioma de la página' }));
    await user.click(
      within(screen.getByRole('listbox', { name: 'Idioma de la página' })).getByRole('option', {
        name: 'Français',
      }),
    );
    expect(onThemeChange).toHaveBeenCalledWith('light');
    expect(onLanguageChange).toHaveBeenCalledWith('fr');
    expect(container.firstElementChild).toHaveAttribute('data-opale-page-theme', 'dark');
    expect(container.firstElementChild).toHaveAttribute('lang', 'es');
  });

  it('ferme le menu mobile après un clic hors du bouton et du panneau', () => {
    const { container } = render(<PageScaffold />);
    const button = container.querySelector<HTMLButtonElement>('button[aria-controls]');
    if (!button) throw new Error('Bouton de menu absent');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const menu = document.getElementById(button.getAttribute('aria-controls') ?? '');
    if (!menu) throw new Error('Menu mobile absent');
    fireEvent.pointerDown(menu);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.pointerDown(screen.getByRole('heading', { name: 'Mon site' }));
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('laisse retirer ou remplacer chaque région sans perdre le conteneur principal', () => {
    render(
      <PageScaffold
        mainAs="div"
        titleAs="h3"
        showNavigation={false}
        showSearch={false}
        slots={{ header: null, intro: <h3>Introduction libre</h3>, footer: null }}
      >
        Contenu libre
      </PageScaffold>,
    );

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Introduction libre' })).toBeVisible();
    expect(screen.getByText('Contenu libre')).toBeVisible();
  });
});
