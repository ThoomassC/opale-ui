import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FIRST_ARCHIVE_VERSION,
  INSTALL_REF,
  INSTALL_REF_KIND,
  releaseArchiveUrl,
} from '../install-ref';
import { installCommands, installationPage } from './installation';

afterEach(() => {
  cleanup();
  vi.doUnmock('../install-ref');
  vi.resetModules();
});

/** Une commande shell par l'archive quand la release en porte une. */
const shellBlocks = releaseArchiveUrl(INSTALL_REF, INSTALL_REF_KIND) ? 2 : 1;

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

    expect(reveals).toHaveLength(4 + shellBlocks);
    expect(screen.getAllByRole('button', { name: 'Masquer le code' })).toHaveLength(
      4 + shellBlocks,
    );
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

    expect(languages).toEqual([
      ...Array.from({ length: shellBlocks }, () => 'shell'),
      'tsx',
      'tsx',
      'tsx',
      'tsx',
    ]);
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

  /* DOCS-01 — LA PAGE PROMETTAIT QUE TOUT S'IMPORTE TEL QUEL DEPUIS UN SERVER
     COMPONENT. C'est faux pour la notation à point : une référence client ne
     se lit pas par un point, `<Tabs.List>` y lève une erreur. L'exemple doit
     montrer les parties nommées côté serveur, le namespace côté client, et
     où poser le ToastProvider. */
  it('montre la frontière client de Next.js telle qu’elle est', () => {
    const { container } = render(<>{installationPage.render()}</>);
    const text = container.textContent ?? '';

    expect(text).not.toMatch(/s’importent tels quels, même depuis un Server Component/);
    expect(text).toContain('<TabsList');
    expect(text).toContain('<ToastProvider>{children}</ToastProvider>');
    expect(text).toMatch(/Cannot access Tabs\.List on the server/);
    expect(text).toMatch(/Opale\.\*/);
    expect(text).toContain("'use client';");
    expect(text).toContain('ICON_NAMES');
  });

  it('ne conseille plus onlyBuiltDependencies, qui ne suffit pas à pnpm 10', () => {
    const { container } = render(<>{installationPage.render()}</>);
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/autorisez-le dans onlyBuiltDependencies/);
    expect(text).toMatch(/pnpm 10/);
  });

  /* LIV-05 — L'ARCHIVE CONSTRUITE D'ABORD, LE TAG GIT EN SECOURS. Par le tag,
     npm compile le paquet chez le consommateur : chaîne de build requise,
     `--ignore-scripts` livre un paquet vide, pnpm 10 bloque le script. */
  it('propose l’archive de release à partir de la version qui en porte une', () => {
    expect(FIRST_ARCHIVE_VERSION).toBe('3.9.0');
    expect(installCommands('v3.9.0', 'tag')).toEqual({
      archive:
        'npm i https://github.com/ThoomassC/opale-ui/releases/download/v3.9.0/thomascaron-opale-ui-3.9.0.tgz',
      git: 'npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v3.9.0"',
    });
    expect(installCommands('v3.10.0', 'tag').archive).toContain(
      '/v3.10.0/thomascaron-opale-ui-3.10.0.tgz',
    );
  });

  it('ne montre pas d’archive pour un tag qui n’en porte pas, ni pour une branche', () => {
    expect(installCommands('v3.8.0', 'tag').archive).toBeNull();
    expect(installCommands('recette', 'branch').archive).toBeNull();
    expect(installCommands('v3.8.0', 'tag').git).toBe(
      'npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v3.8.0"',
    );
  });

  it('affiche seulement la commande Git tant que la release n’a pas d’archive', async () => {
    vi.doMock('../install-ref', async (original) => ({
      ...(await original<typeof import('../install-ref')>()),
      INSTALL_REF: 'v3.8.0',
      INSTALL_REF_KIND: 'tag',
    }));
    const { installationPage: page } = await import('./installation');
    const { container } = render(<>{page.render()}</>);
    const text = container.textContent ?? '';

    expect(text).toContain('npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v3.8.0"');
    expect(text).not.toContain('releases/download');
    expect(container.querySelectorAll('[data-language="shell"]')).toHaveLength(1);
  });

  it('affiche l’archive en premier et le tag Git en alternative dès qu’elle existe', async () => {
    vi.doMock('../install-ref', async (original) => ({
      ...(await original<typeof import('../install-ref')>()),
      INSTALL_REF: 'v3.9.0',
      INSTALL_REF_KIND: 'tag',
    }));
    const { installationPage: page } = await import('./installation');
    const { container } = render(<>{page.render()}</>);
    const text = container.textContent ?? '';
    const archive =
      'npm i https://github.com/ThoomassC/opale-ui/releases/download/v3.9.0/thomascaron-opale-ui-3.9.0.tgz';
    const git = 'npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v3.9.0"';

    expect(container.querySelectorAll('[data-language="shell"]')).toHaveLength(2);
    expect(text).toContain(archive);
    expect(text).toContain(git);
    expect(text.indexOf(archive)).toBeLessThan(text.indexOf(git));
    expect(text).toMatch(/pnpm/);
    expect(text).toMatch(/chaîne de build/);
  });
});
