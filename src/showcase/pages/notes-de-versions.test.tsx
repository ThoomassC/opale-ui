import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RELEASES } from '../releases';
import { notesVersionsPage } from './notes-de-versions';

describe('Notes de versions — actions', () => {
  it('rend les groupes de lecture et les exemples de migration de la 3.2.0', () => {
    render(notesVersionsPage.render());

    expect(screen.getByRole('heading', { name: 'Compatibilité et migration' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Composants et interactions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Documentation et qualité' })).toBeInTheDocument();

    expect(screen.getByText('Guide de migration depuis la 3.1.1')).toBeVisible();
    expect(screen.getByText('<Opale.Card liquidGlass>Contenu</Opale.Card>')).toBeVisible();
    expect(
      screen.getByText('<Opale.IconActionButton icon="share" label="Partager" />'),
    ).toBeVisible();
    expect(
      screen.getByText('<Opale.Lightbox src="/visuel.png" alt="Aperçu du composant" open />'),
    ).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Copier le code après' })).toHaveLength(3);
    fireEvent.click(screen.getByText('Correspondance des 28 exports retirés'));
    expect(screen.getByRole('columnheader', { name: 'Export 3.1.1' })).toBeVisible();
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

    for (const link of applicationLinks) {
      expect(link).toHaveClass('opale-button', 'opale-button--primary');
    }

    for (const link of sourceLinks) {
      expect(link).toHaveClass('opale-button', 'opale-button--tonal');
      expect(link).not.toHaveClass('tc-doc-link');
    }
  });
});
