import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { hrefFor } from './doc-model';
import { DocFooter } from './doc-footer';
import { copyFor } from './localization';
import { UI_VERSION } from './version';

afterEach(cleanup);

describe('DocFooter', () => {
  it('devrait rendre le pied de page comme repère, avec la version et la licence', () => {
    render(<DocFooter copy={copyFor('FR')} />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(UI_VERSION);
    expect(footer).toHaveTextContent('MIT');
  });

  it('devrait mener à l’accueil, à l’installation et aux notes de versions', () => {
    render(<DocFooter copy={copyFor('FR')} />);

    const nav = screen.getByRole('navigation', { name: 'Pied de page' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      hrefFor(''),
      hrefFor('installation'),
      hrefFor('notes-de-versions'),
    ]);
  });

  it('devrait se traduire avec l’interface', () => {
    render(<DocFooter copy={copyFor('EN')} />);

    const nav = screen.getByRole('navigation', { name: 'Footer' });
    expect(within(nav).getByRole('link', { name: 'Release notes' })).toBeInTheDocument();
  });
});
