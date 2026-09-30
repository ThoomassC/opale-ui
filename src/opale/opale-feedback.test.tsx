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

describe('Feedback — tone', () => {
  it('devrait porter le ton passé par tone', () => {
    render(<Feedback tone="error">Le paiement a échoué.</Feedback>);

    expect(screen.getByRole('alert')).toHaveClass('opale-feedback--error');
    expect(screen.getByText('Erreur')).toBeInTheDocument();
  });

  it('devrait faire gagner tone sur severity', () => {
    render(
      <Feedback tone="success" severity="error">
        Enregistré.
      </Feedback>,
    );

    expect(screen.getByRole('status')).toHaveClass('opale-feedback--success');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('devrait garder info par défaut', () => {
    render(<Feedback>Pour information.</Feedback>);

    expect(screen.getByRole('status')).toHaveClass('opale-feedback--info');
  });
});
