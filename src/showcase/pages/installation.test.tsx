import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { INSTALL_REF } from '../install-ref';
import { installationPage } from './installation';

afterEach(cleanup);

describe('la page Installation', () => {
  it('pointe vers le paquet Opale et la référence réellement disponible', () => {
    const { container } = render(<>{installationPage.render()}</>);

    expect(container.textContent).toContain(
      `npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#${INSTALL_REF}"`,
    );
    expect(container.textContent).not.toContain('npm install opale');
  });
  it('montre ses trois extraits dès le premier rendu', () => {
    const { container } = render(<>{installationPage.render()}</>);
    const reveals = container.querySelectorAll('.tc-doc-codeexample__reveal');

    expect(reveals).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Masquer le code' })).toHaveLength(3);
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

    expect(languages).toEqual(['shell', 'tsx', 'tsx']);
    expect(container.textContent).toContain(
      'return <Opale.Button variant="primary">Continuer</Opale.Button>;',
    );
    expect(screen.getByText('En local')).toBeVisible();
  });
});
