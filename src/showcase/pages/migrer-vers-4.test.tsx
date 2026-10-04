import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { REMOVED_EXPORTS, REMOVED_PROPS } from '../../opale/deprecations';
import { findPage, navSectionsForPages } from '../doc-model';
import { searchPages } from '../search-model';
import { PAGES } from '.';
import { migrationPage } from './migrer-vers-4';

afterEach(cleanup);

const renderPage = () => render(<>{migrationPage.render()}</>);

describe('la page « Migrer vers la 4.0 »', () => {
  it('liste chaque prop retirée, une ligne par couple', () => {
    renderPage();
    const table = screen.getByRole('table', { name: 'Les props retirées' });

    /* Une ligne d'en-tête, puis une par entrée : la page ne choisit rien. */
    expect(within(table).getAllByRole('row')).toHaveLength(REMOVED_PROPS.length + 1);

    const modal = within(table).getAllByRole('row', { name: /^Modal onClose/ })[0];
    expect(modal).toHaveTextContent('onOpenChange');
    expect(modal).toHaveTextContent('2.6');

    const density = within(table).getByRole('row', { name: /^DataTable density/ });
    expect(density).toHaveTextContent('size — compact → small');
  });

  it('liste les exports retirés, remplaçant absent annoncé', () => {
    renderPage();
    const table = screen.getByRole('table', { name: 'Les exports retirés' });

    expect(within(table).getAllByRole('row')).toHaveLength(REMOVED_EXPORTS.length + 1);
    expect(within(table).getByRole('row', { name: /^Opale\.Background/ })).toHaveTextContent(
      'BackgroundSurface',
    );
    expect(within(table).getByRole('row', { name: /^ToastTone/ })).toHaveTextContent('OpaleTone');
  });

  it('parle au passé de ce que la 4.0 a retiré et changé, sans avertissement console', () => {
    const { container } = renderPage();

    expect(container).toHaveTextContent('ce que la 4.0 a retiré');
    expect(screen.getByRole('heading', { name: 'Ce que la 4.0 a changé aussi' })).toBeVisible();
    expect(container).toHaveTextContent('role="switch"');
    expect(container).toHaveTextContent('role="checkbox"');
    expect(container).toHaveTextContent('data-testid');
    expect(container).toHaveTextContent('SiteNav exige items');
    expect(container).toHaveTextContent('^19');
    expect(container).not.toHaveTextContent('[Opale]');
    expect(container).not.toHaveTextContent('sera retiré');
    expect(screen.queryByRole('heading', { name: 'Voir les avertissements' })).toBeNull();
  });

  it('répond encore à son ancienne adresse, celle de « Migrer vers la 3.0 »', () => {
    expect(findPage(PAGES, 'migrer-vers-3')).toBe(migrationPage);
  });

  it('est rangée dans « Prise en main » et trouvée par la recherche', () => {
    expect(findPage(PAGES, 'migrer-vers-4')).toBe(migrationPage);
    const gettingStarted = navSectionsForPages(PAGES).find(({ id }) => id === 'prise-en-main');
    expect(gettingStarted?.entries.map(({ page }) => page.slug)).toContain('migrer-vers-4');
    const first = (query: string) => searchPages(PAGES, query).suggestions[0]?.page.slug;
    expect(first('migrer')).toBe('migrer-vers-4');
    expect(first('déprécié')).toBe('migrer-vers-4');
    expect(searchPages(PAGES, '4.0').suggestions.map(({ page }) => page.slug)).toContain(
      'migrer-vers-4',
    );
  });
});
