import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { checkBrand } from '../../contract/brand';
import { publicTokens } from '../../opale/tokens-manifest';
import { findPage, navSectionsForPages } from '../doc-model';
import { pageLabelFor } from '../localization';
import { searchPages } from '../search-model';
import { PAGES } from '.';
import { preloadPages } from './lazy-page';
import { EXAMPLE_BRAND } from './personnaliser-data';
import { personnaliserPage } from './personnaliser.page';

beforeAll(() => preloadPages());
afterEach(cleanup);

const renderPage = () => render(<>{personnaliserPage.render()}</>);

const tokenTable = () => screen.getByRole('table', { name: 'Les jetons publics' });

describe('la page « Personnaliser »', () => {
  it('est rangée dans « Prise en main », juste après « Thèmes »', () => {
    expect(findPage(PAGES, 'personnaliser')).toBe(personnaliserPage);
    const gettingStarted = navSectionsForPages(PAGES).find(({ id }) => id === 'prise-en-main');
    const slugs = gettingStarted?.entries.map(({ page }) => page.slug) ?? [];
    expect(slugs.indexOf('personnaliser')).toBe(slugs.indexOf('theming') + 1);
  });

  it('est trouvée par la recherche', () => {
    const slugs = (query: string) =>
      searchPages(PAGES, query).suggestions.map(({ page }) => page.slug);
    expect(slugs('personnaliser')[0]).toBe('personnaliser');
    expect(slugs('marque')).toContain('personnaliser');
    expect(slugs('checkBrand')).toContain('personnaliser');
    expect(slugs('jetons')).toContain('personnaliser');
  });

  it('a un libellé anglais et espagnol', () => {
    expect(pageLabelFor(personnaliserPage, 'EN')).toBe('Customizing');
    expect(pageLabelFor(personnaliserPage, 'ES')).toBe('Personalizar');
  });

  it('montre les quatre façons de poser une marque', () => {
    const { container } = renderPage();

    expect(container).toHaveTextContent('--opale-on-primary');
    expect(container).toHaveTextContent('data-opale-brand="derive"');
    expect(container).toHaveTextContent('data-opale-scope');
    expect(container).toHaveTextContent(":root[data-theme='dark']");
    expect(container).toHaveTextContent('opale-root');
    expect(container).toHaveTextContent("from '@thomascaron/opale-ui/contract'");
  });
});

describe('la marque d’exemple', () => {
  it('tient ses contrastes en clair et en sombre, telle que la page la publie', () => {
    expect(checkBrand(EXAMPLE_BRAND.light).failures).toEqual([]);
    expect(checkBrand(EXAMPLE_BRAND.dark, { theme: 'dark' }).failures).toEqual([]);
  });
});

describe('la table des jetons publics', () => {
  it('liste chaque jeton public du manifeste, une ligne chacun', () => {
    renderPage();
    expect(within(tokenTable()).getAllByRole('row')).toHaveLength(publicTokens().length + 1);
  });

  it('donne les valeurs claire et sombre lues dans opale.css', () => {
    renderPage();
    const primary = within(tokenTable()).getByRole('row', { name: /^--opale-primary\b(?!-)/ });
    expect(primary).toHaveTextContent('#315c9e');
    expect(primary).toHaveTextContent('#5d87cb');
  });

  it('filtre par nom ou par rôle, sans tenir compte des accents', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Filtrer les jetons'), {
      target: { value: 'RAYON' },
    });
    const rows = within(tokenTable()).getAllByRole('row').slice(1);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row).toHaveTextContent(/radius|rayon/i);
  });

  it('filtre par groupe', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Groupe'), { target: { value: 'z-index' } });
    const rows = within(tokenTable()).getAllByRole('row').slice(1);
    expect(rows.map((row) => row.querySelector('th')?.textContent)).toEqual([
      '--opale-z-sticky',
      '--opale-z-popover',
      '--opale-z-overlay',
      '--opale-z-modal',
      '--opale-z-toast',
    ]);
  });

  it('dit quand rien ne correspond, et propose d’effacer le filtre', () => {
    renderPage();
    const field = screen.getByLabelText('Filtrer les jetons');
    fireEvent.change(field, { target: { value: 'introuvable' } });

    expect(screen.queryByRole('table', { name: 'Les jetons publics' })).toBeNull();
    expect(screen.getByText('Aucun jeton public ne correspond à ce filtre.')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Effacer le filtre' }));
    expect(within(tokenTable()).getAllByRole('row')).toHaveLength(publicTokens().length + 1);
    expect(field).toHaveValue('');
  });
});

describe('l’essai de marque', () => {
  it('passe avec le saphir d’Opale', () => {
    renderPage();
    const checker = screen.getByRole('region', { name: 'Tester une couleur' });
    expect(within(checker).getByLabelText('Primaire')).toHaveValue('#315c9e');
    expect(checker).toHaveTextContent('6,38:1');
    expect(checker).not.toHaveTextContent('--opale-on-primary: #14100b');
  });

  it('mesure le vert de l’audit et propose l’encre à poser', () => {
    renderPage();
    const checker = screen.getByRole('region', { name: 'Tester une couleur' });
    fireEvent.change(within(checker).getByLabelText('Primaire'), {
      target: { value: '#16a34a' },
    });

    expect(checker).toHaveTextContent('3,16:1');
    expect(checker).toHaveTextContent('--opale-on-primary: #14100b');
  });

  it('mesure le thème sombre à la demande', () => {
    renderPage();
    const checker = screen.getByRole('region', { name: 'Tester une couleur' });
    fireEvent.click(within(checker).getByRole('radio', { name: 'Sombre' }));
    expect(within(checker).getByLabelText('Primaire')).toHaveValue('#5d87cb');
  });
});
