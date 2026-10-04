import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Feedback } from './opale';
import { expectOnlyDeprecationWarnings } from '../test/deprecation-warnings';

/* Ce fichier croise l'ancienne API : ses avertissements sont attendus. */
expectOnlyDeprecationWarnings();

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
  ] as const)('donne un titre français par défaut au ton %s', (tone, title) => {
    render(<Feedback tone={tone}>Le message.</Feedback>);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.queryByText(tone)).not.toBeInTheDocument();
  });

  it('garde le titre de l’appelant quand il en donne un', () => {
    render(
      <Feedback tone="error" title="Paiement refusé">
        La carte a expiré.
      </Feedback>,
    );

    expect(screen.getByText('Paiement refusé')).toBeInTheDocument();
    expect(screen.queryByText('Erreur')).not.toBeInTheDocument();
  });
});

describe('Feedback — tone', () => {
  it('devrait porter le ton passé par tone', () => {
    render(<Feedback tone="error">Le paiement a échoué.</Feedback>);

    expect(screen.getByRole('alert')).toHaveClass('opale-feedback--error');
    expect(screen.getByText('Erreur')).toBeInTheDocument();
  });

  it('devrait garder info par défaut', () => {
    render(<Feedback>Pour information.</Feedback>);

    expect(screen.getByRole('status')).toHaveClass('opale-feedback--info');
  });
});
