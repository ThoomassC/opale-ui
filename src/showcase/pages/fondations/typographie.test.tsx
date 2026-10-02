import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import TypographieContent from './typographie';
import { typographiePage } from './typographie.page';

afterEach(cleanup);

/* LA PAGE MONTRE LA TYPOGRAPHIE DE LA 3.0, celle de la planche de DA : les
   trois voix, l'échelle d'affiche de l'accueil et l'échelle `--opale-text-*`
   des composants. Les anciens jetons `--text-*`, voués au retrait, n'y
   figurent plus. */
describe('la page Typographie', () => {
  it('présente les trois voix, l’échelle de la planche et celle des composants', () => {
    render(<TypographieContent />);

    for (const title of ['Trois voix', 'L’échelle de la planche', 'L’échelle des composants']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
    for (const token of [
      '--opale-font-title',
      '--opale-font-body',
      '--opale-font-mono',
      '--opale-text-xs',
      '--opale-text-2xl',
    ]) {
      expect(screen.getAllByText(token).length).toBeGreaterThan(0);
    }
  });

  it('ne cite plus les anciens jetons --text-* ni l’échantillon « Teal & cuivre »', () => {
    const { container } = render(<TypographieContent />);

    expect(container.textContent).not.toMatch(/--text-(xs|sm|base|md|lg|xl|display)/);
    expect(container.textContent).not.toContain('Teal');
  });

  it('annonce la nouvelle typographie dans son chapô', () => {
    render(<>{typographiePage.lede}</>);
    expect(screen.getByText(/Bricolage Grotesque/)).toHaveTextContent('Hack');
  });
});
