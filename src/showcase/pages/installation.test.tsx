import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { UI_VERSION } from '../version';
import { installationPage } from './installation';

afterEach(cleanup);

describe('la page Installation', () => {
  it('pointe vers le paquet Opale et le tag de la version affichée', () => {
    const { container } = render(<>{installationPage.render()}</>);

    expect(container.textContent).toContain(
      `npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v${UI_VERSION}"`,
    );
    expect(container.textContent).not.toContain('npm install opale');
  });
  it('montre ses deux commandes dès le premier rendu', () => {
    const { container } = render(<>{installationPage.render()}</>);
    const reveals = container.querySelectorAll('.tc-doc-codeexample__reveal');

    expect(reveals).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Masquer le code' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Afficher le code' })).not.toBeInTheDocument();

    for (const reveal of reveals) {
      expect(reveal).toHaveAttribute('data-open', 'true');
      expect(reveal).toHaveAttribute('aria-hidden', 'false');
    }
  });

  it('distingue les commandes shell des imports TypeScript', () => {
    const { container } = render(<>{installationPage.render()}</>);
    const languages = [...container.querySelectorAll<HTMLElement>('.tc-doc-code code')].map(
      (code) => code.dataset.language,
    );

    expect(languages).toEqual(['shell', 'tsx']);
  });
});
