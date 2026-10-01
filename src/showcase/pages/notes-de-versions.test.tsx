import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RELEASES } from '../releases';
import { notesVersionsPage } from './notes-de-versions';

describe('Notes de versions — actions', () => {
  it('rend les groupes de lecture et les exemples de migration de la 2.2.0', () => {
    render(notesVersionsPage.render());

    expect(screen.getByRole('heading', { name: 'Compatibilité et migration' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Composants et interactions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Documentation et qualité' })).toBeInTheDocument();

    expect(screen.getByText('Guide de migration depuis la 2.1.1')).toBeVisible();
    expect(screen.getByText('<Card liquidGlass>Contenu</Card>')).toBeVisible();
    expect(screen.getByText('<IconActionButton icon="share" label="Partager" />')).toBeVisible();
    expect(
      screen.getByText('<Lightbox src="/visuel.png" alt="Aperçu du composant" open />'),
    ).toBeVisible();
    /* Trois étapes pour la 2.2.0, une pour la 2.5.0 et la refonte de SvgMap,
       deux, facultatives, pour les nouveaux noms de la 2.6.0. */
    expect(screen.getAllByRole('button', { name: 'Copier le code après' })).toHaveLength(6);
    expect(screen.getByText('Guide de migration depuis la 2.4.0')).toBeVisible();
    fireEvent.click(screen.getByText('Correspondance des 28 exports retirés'));
    expect(screen.getByRole('columnheader', { name: 'Export 2.1.1' })).toBeVisible();
    expect(screen.getByRole('rowheader', { name: /AddButton/ })).toBeVisible();
    expect(screen.getByText('En local · version courante')).toBeVisible();
    expect(screen.getByRole('link', { name: 'IconActionButton' })).toHaveAttribute(
      'href',
      '#/composants/opale-icon-action-button',
    );
  });

  it('utilise les variantes Button de la vitrine pour chaque version', () => {
    render(notesVersionsPage.render());

    const applicationLinks = screen.getAllByRole('link', {
      name: /Ouvrir l’application en version/,
    });
    const sourceLinks = screen.getAllByRole('link', { name: /Voir le code/ });

    expect(applicationLinks).toHaveLength(RELEASES.length);
    expect(sourceLinks).toHaveLength(RELEASES.length);
    expect(screen.getByRole('link', { name: 'Voir le code de la recette' })).toHaveAttribute(
      'href',
      RELEASES[0].sourceHref,
    );

    for (const link of applicationLinks) {
      expect(link).toHaveClass('opale-button', 'opale-button--primary');
    }

    for (const link of sourceLinks) {
      expect(link).toHaveClass('opale-button', 'opale-button--tonal');
      expect(link).not.toHaveClass('tc-doc-link');
    }
  });

  /* RESP-10 : les blocs « Avant » et « Après » défilent à l'horizontale sur
     écran étroit ; un conteneur défilant doit être atteignable au clavier
     (WCAG 2.1.1), comme les blocs d'usage et les tableaux de props. */
  it('rend chaque bloc de migration atteignable au clavier', () => {
    const { container } = render(notesVersionsPage.render());
    const blocks = [...container.querySelectorAll('.tc-doc-release__migration-code pre')];

    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(block).toHaveAttribute('tabindex', '0');
      expect(block).toHaveAttribute('role', 'group');
      expect(block.getAttribute('aria-label')).toMatch(/défilement horizontal$/);
    }
  });
});
