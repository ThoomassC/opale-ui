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
  it('montre ses cinq extraits dès le premier rendu', () => {
    const { container } = render(<>{installationPage.render()}</>);
    const reveals = container.querySelectorAll('.tc-doc-codeexample__reveal');

    expect(reveals).toHaveLength(5);
    expect(screen.getAllByRole('button', { name: 'Masquer le code' })).toHaveLength(5);
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

    expect(languages).toEqual(['shell', 'tsx', 'tsx', 'tsx', 'tsx']);
    expect(container.textContent).toContain('return <Button variant="primary">Continuer</Button>;');
    expect(screen.getByText('En local')).toBeVisible();
  });

  /* LE PARCOURS SUFFIT À MONTER UNE VRAIE APPLICATION. La page ne donnait que
     la commande et deux imports : ni les prérequis, ni les polices, ni le
     thème, ni la frontière client de Next.js, ni le fait que le paquet se
     compile à l'installation. */
  it('dit tout ce qu’il faut pour une application de production', () => {
    const { container } = render(<>{installationPage.render()}</>);
    const text = container.textContent ?? '';

    expect(text).toMatch(/React 19/);
    expect(text).toMatch(/Node 20\.19/);
    /* Une seule feuille à importer : elle relie ses polices, livrées en fichiers. */
    expect(text).not.toContain("import '@thomascaron/opale-ui/fonts.css';");
    expect(text).toMatch(/fonts\.css/);
    expect(text).toContain("import '@thomascaron/opale-ui/opale.css';");
    expect(text).toContain('data-theme');
    expect(text).toMatch(/App Router/);
    expect(text).toMatch(/--ignore-scripts/);
    expect(screen.getByRole('heading', { name: /1\. Prérequis/ })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /5\. Afficher un premier composant/ }),
    ).toBeInTheDocument();
  });
});
