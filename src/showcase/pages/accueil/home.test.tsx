import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { findPage, hrefFor } from '../../doc-model';
import { INSTALL_REF, INSTALL_REF_KIND } from '../../install-ref';
import { DocShell } from '../../doc-shell';
import { pageTitleFor } from '../../localization';
import { SHOWCASE_CATALOG } from '../../showcase-catalog';
import { UI_VERSION } from '../../version';
import { PAGES } from '..';
import { preloadPages } from '../lazy-page';
import { installCommands } from '../installation';
import { introductionPage } from '../introduction';
import { HOME_COPY, HOME_FAMILIES, RUNTIME_DEPENDENCIES } from './home-copy';
import { FAMILY_SLUGS } from './home-slides';

/* =============================================================================
   L'ACCUEIL DE LA 3.0 : CINQ BANDES, CONSTRUITES AVEC LES SEULS COMPOSANTS
   PUBLIÉS D'OPALE.

   Ce fichier tient ce que la maquette promet et que le rendu doit tenir : un
   seul `<h1>`, des bandes nommées par leur titre, des liens qui mènent à des
   pages servies, et des chiffres tirés du code plutôt qu'écrits à la main.
   ========================================================================== */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

beforeAll(() => preloadPages());

afterEach(() => {
  cleanup();
  localStorage.removeItem('tc-language');
});

const FR = HOME_COPY.FR;

/** Les bandes de la scène, dans l'ordre du document. */
function bands(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.opale-scroll-section'));
}

/** Le nom d'une bande : le texte du titre que vise son `aria-labelledby`. */
function bandName(band: HTMLElement): string {
  const id = band.getAttribute('aria-labelledby') ?? '';
  const heading = document.getElementById(id);
  return heading?.querySelector('[aria-hidden] + span')?.textContent ?? heading?.textContent ?? '';
}

describe('Accueil — la page', () => {
  it('est une page pleine largeur, titrée de son accroche', () => {
    expect(introductionPage.slug).toBe('');
    expect(introductionPage.fullBleed).toBe(true);
    expect(introductionPage.title).toBe(FR.hero.title);
  });

  it('rend un seul <h1>, le titre découpé de l’accroche, focalisable par le code', () => {
    render(<DocShell pages={PAGES} />);

    const level1 = screen.getAllByRole('heading', { level: 1 });
    expect(level1).toHaveLength(1);
    expect(level1[0]).toHaveAccessibleName(FR.hero.title);
    expect(level1[0]).toHaveClass('opale-split-heading');
    expect(level1[0]).toHaveAttribute('tabindex', '-1');
    expect(screen.queryByRole('navigation', { name: 'Sommaire' })).toBeNull();
  });

  it('nomme chaque bande par son titre de niveau 2, après l’accroche', () => {
    render(<DocShell pages={PAGES} />);

    const [hero, components] = bands();
    expect(hero).toHaveAttribute('data-ground', 'paper');
    expect(bandName(hero as HTMLElement)).toBe(FR.hero.title);
    expect(components).toHaveAttribute('data-ground', 'amber');
    expect(bandName(components as HTMLElement)).toBe(FR.components.title);
    expect(
      within(components as HTMLElement).getByRole('heading', { level: 2 }),
    ).toHaveAccessibleName(FR.components.title);
  });
});

describe('Accueil — l’accroche', () => {
  it('donne la version courante et deux actions rendues en liens-boutons', () => {
    render(<DocShell pages={PAGES} />);

    expect(screen.getByText(FR.hero.eyebrow(UI_VERSION))).toBeInTheDocument();
    const install = screen.getByRole('link', { name: FR.hero.install });
    const components = screen.getByRole('link', { name: FR.hero.components });
    expect(install).toHaveAttribute('href', hrefFor('installation'));
    expect(install).toHaveClass('opale-button', 'opale-button--primary');
    expect(components).toHaveAttribute('href', hrefFor('composants/opale-button'));
    expect(components).toHaveClass('opale-button', 'opale-button--secondary');
  });
});

describe('Accueil — le carrousel des composants', () => {
  it('compte les composants depuis le catalogue', () => {
    render(<DocShell pages={PAGES} />);

    expect(screen.getByText(FR.components.lede(SHOWCASE_CATALOG.length))).toBeInTheDocument();
  });

  it('rend une diapositive par famille, dans l’ordre, chacune titrée', () => {
    render(<DocShell pages={PAGES} />);

    const carousel = screen.getByRole('region', { name: FR.components.carousel });
    const slides = within(carousel).getAllByRole('group', { name: /sur/ });
    expect(slides).toHaveLength(HOME_FAMILIES.length);
    expect(
      slides.map((slide) => within(slide).getByRole('heading', { level: 3 }).textContent),
    ).toEqual(HOME_FAMILIES.map((id) => FR.components.families[id].name));
  });

  it('mène chaque famille à une page servie par le registre', () => {
    render(<DocShell pages={PAGES} />);

    for (const id of HOME_FAMILIES) {
      const link = screen.getByRole('link', { name: FR.components.families[id].link });
      expect(link).toHaveAttribute('href', hrefFor(FAMILY_SLUGS[id]));
      expect(
        findPage(PAGES, FAMILY_SLUGS[id]),
        `aucune page ne sert ${FAMILY_SLUGS[id]}`,
      ).toBeDefined();
    }
  });

  it('montre de vrais composants, dont le verre liquide dans un puits photographié', () => {
    render(<DocShell pages={PAGES} />);

    expect(screen.getByRole('textbox', { name: FR.components.demos.message })).toBeInTheDocument();
    expect(
      screen.getByRole('tablist', { name: FR.components.demos.tabsLabel }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: FR.components.demos.popoverTrigger }),
    ).toHaveAttribute('aria-haspopup', 'dialog');
    const wells = document.querySelectorAll('.tc-doc-landing-slide__glass');
    expect(wells.length).toBeGreaterThan(0);
    wells.forEach((well) => expect(well.querySelector('[data-opale-glass]')).not.toBeNull());
  });
});

describe('Accueil — les cinq bandes', () => {
  it('suit l’ordre et les fonds de la maquette, chaque bande nommée par son titre', () => {
    render(<DocShell pages={PAGES} />);

    expect(bands().map((band) => [band.dataset.ground, bandName(band)])).toEqual([
      ['paper', FR.hero.title],
      ['amber', FR.components.title],
      ['night', FR.qualities.title],
      ['paper', FR.pages.title],
      ['blue', FR.install.title],
    ]);
    /* Un seul h1 puis un h2 par bande : aucun niveau sauté. */
    const outline = screen
      .getAllByRole('heading')
      .filter((heading) => /^H[12]$/.test(heading.tagName))
      .map((heading) => heading.tagName);
    expect(outline).toEqual(['H1', 'H2', 'H2', 'H2', 'H2']);
  });
});

describe('Accueil — les qualités', () => {
  it('fait défiler un bandeau nommé, de texte seul', () => {
    render(<DocShell pages={PAGES} />);

    const marquee = screen.getByRole('region', { name: FR.qualities.marquee });
    for (const item of FR.qualities.marqueeItems(SHOWCASE_CATALOG.length)) {
      expect(within(marquee).getAllByText(item).length).toBeGreaterThan(0);
    }
    expect(
      marquee.querySelectorAll('.opale-marquee__copy a, .opale-marquee__copy button, input'),
    ).toHaveLength(0);
  });

  it('rend quatre preuves, titrées, sous le bandeau', () => {
    render(<DocShell pages={PAGES} />);

    const band = bands()[2] as HTMLElement;
    const proofs = within(band).getAllByRole('listitem');
    expect(
      proofs.map((proof) => within(proof).getByRole('heading', { level: 3 }).textContent),
    ).toEqual(FR.qualities.proofs(RUNTIME_DEPENDENCIES).map((proof) => proof.title));
  });

  it('cite les vraies dépendances d’exécution du paquet', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    expect([...RUNTIME_DEPENDENCIES]).toEqual(Object.keys(pkg.dependencies ?? {}));
  });
});

describe('Accueil — des pages entières', () => {
  it('montre un PageScaffold inerte, légendé, et un vrai lien vers sa page', () => {
    render(<DocShell pages={PAGES} />);

    const figure = screen.getByRole('figure', { name: FR.pages.caption });
    const preview = figure.querySelector('[inert]');
    expect(preview).not.toBeNull();
    expect(preview?.querySelector('.opale-page-scaffold, [class*="scaffold"]')).not.toBeNull();
    const link = screen.getByRole('link', { name: FR.pages.link });
    expect(link).toHaveAttribute('href', hrefFor('composants/page-scaffold'));
    expect(preview?.contains(link)).toBe(false);
  });
});

describe('Accueil — installer', () => {
  it('donne la commande de la release courante, à copier', async () => {
    render(<DocShell pages={PAGES} />);

    const commands = installCommands(INSTALL_REF, INSTALL_REF_KIND);
    const command = commands.archive ?? commands.git;
    const band = bands()[4] as HTMLElement;
    expect(within(band).getByText(command)).toBeInTheDocument();
    expect(command).toContain(INSTALL_REF);

    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    await userEvent.click(within(band).getByRole('button', { name: FR.install.copy }));
    expect(writeText).toHaveBeenCalledWith(command);
  });

  it('mène au guide d’installation et à la migration 3.0', () => {
    render(<DocShell pages={PAGES} />);

    const band = bands()[4] as HTMLElement;
    const guide = within(band).getByRole('link', { name: FR.install.guide });
    expect(guide).toHaveAttribute('href', hrefFor('installation'));
    expect(guide).toHaveClass('opale-button', 'opale-button--primary');
    expect(within(band).getByRole('link', { name: FR.install.migrate })).toHaveAttribute(
      'href',
      hrefFor('migrer-vers-3'),
    );
  });
});

describe('Accueil — en anglais', () => {
  it('traduit chaque bande, et le titre de l’onglet', () => {
    localStorage.setItem('tc-language', 'EN');
    render(<DocShell pages={PAGES} />);
    const EN = HOME_COPY.EN;

    expect(bands().map(bandName)).toEqual([
      EN.hero.title,
      EN.components.title,
      EN.qualities.title,
      EN.pages.title,
      EN.install.title,
    ]);
    expect(screen.getByRole('link', { name: EN.hero.install })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: EN.components.carouselLabels.next }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: EN.qualities.marquee })).toBeInTheDocument();
    /* Les rôles annoncés du carrousel suivent la langue, eux aussi. */
    expect(screen.getByRole('region', { name: EN.components.carousel })).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    );
    expect(document.title).toBe(`${EN.hero.title} — OpaleUI`);
    expect(document.querySelector('.tc-doc-language-notice')).toBeNull();
  });

  it('ne laisse aucun texte français dans les bandes', () => {
    localStorage.setItem('tc-language', 'EN');
    render(<DocShell pages={PAGES} />);

    const text = bands()
      .map((band) => band.textContent ?? '')
      .join(' ');
    for (const french of [FR.hero.lede, FR.components.title, FR.install.lede, FR.pages.caption]) {
      expect(text).not.toContain(french);
    }
  });
});

describe('Accueil — le titre de l’onglet', () => {
  it.each(['EN', 'ES'] as const)('reprend l’accroche traduite en %s', (language) => {
    expect(pageTitleFor(introductionPage, language)).toBe(HOME_COPY[language].hero.title);
  });
});
