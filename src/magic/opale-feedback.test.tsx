import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Feedback } from './opale';

afterEach(cleanup);

describe('Feedback', () => {
  /* SANS TITRE, L'ENCART AFFICHAIT LE NOM DE LA PROP. `title ?? severity`
     écrivait « info », « warning » ou « error » — de l'anglais, en bas de
     casse, au milieu d'une interface française, et lu tel quel par un lecteur
     d'écran (WCAG 3.1.2). */
  it.each([
    ['success', 'Succès'],
    ['info', 'Information'],
    ['warning', 'Attention'],
    ['error', 'Erreur'],
  ] as const)('donne un titre français par défaut à la sévérité %s', (severity, title) => {
    render(<Feedback severity={severity}>Le message.</Feedback>);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.queryByText(severity)).not.toBeInTheDocument();
  });

  it('garde le titre de l’appelant quand il en donne un', () => {
    render(
      <Feedback severity="error" title="Paiement refusé">
        La carte a expiré.
      </Feedback>,
    );

    expect(screen.getByText('Paiement refusé')).toBeInTheDocument();
    expect(screen.queryByText('Erreur')).not.toBeInTheDocument();
  });
});
