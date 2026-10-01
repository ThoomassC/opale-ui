import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { findPage, hrefFor } from '../../doc-model';
import { DocShell } from '../../doc-shell';
import { SHOWCASE_CATALOG } from '../../showcase-catalog';
import { UI_VERSION } from '../../version';
import { PAGES } from '..';
import { preloadPages } from '../lazy-page';
import { introductionPage } from '../introduction';
import { HOME_COPY, HOME_FAMILIES } from './home-copy';
import { FAMILY_SLUGS } from './home-slides';

/* =============================================================================
   L'ACCUEIL DE LA 3.0 : CINQ BANDES, CONSTRUITES AVEC LES SEULS COMPOSANTS
   PUBLIÉS D'OPALE.

   Ce fichier tient ce que la maquette promet et que le rendu doit tenir : un
   seul `<h1>`, des bandes nommées par leur titre, des liens qui mènent à des
   pages servies, et des chiffres tirés du code plutôt qu'écrits à la main.
   ========================================================================== */

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
