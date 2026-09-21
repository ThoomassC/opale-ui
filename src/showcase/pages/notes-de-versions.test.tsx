import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RELEASES } from '../releases';
import { notesVersionsPage } from './notes-de-versions';

describe('Notes de versions — actions', () => {
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
