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
    expect(container.querySelector('form')).toHaveAttribute('action', '/search');
    expect(container.querySelector('form')).toHaveAttribute('method', 'get');
    expect(
      within(header).getByRole('searchbox', { name: 'Rechercher sur le site' }),
    ).toHaveAttribute('name', 'q');
    expect(within(main).getByRole('heading', { level: 1, name: 'Mon site' })).toBeVisible();
    expect(main).toHaveTextContent('Contenu personnalisé');
    expect(within(footer).getByText('© 2026 Mon site. Tous droits réservés.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Aller au contenu' })).toHaveAttribute(
      'href',
      `#${main.id}`,
    );
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
