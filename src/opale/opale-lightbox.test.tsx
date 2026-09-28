import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { declaration } from '../test/css-rules';
import modalStyles from './components/modal/style/Modal.module.css?raw';
import { Lightbox } from './opale';

afterEach(cleanup);

describe('Lightbox', () => {
  /* LE BOUTON DE PIED EST UN BOUTON D'OPALE PLEIN, PAS UN FANTÔME. La variante
     `ghost` dessine son contour par un masque découpé en squircle ; autour
     d'un libellé court, il ne restait que deux crochets de part et d'autre de
     « Fermer ». `tonal` est le bouton secondaire du système — celui des
     actions « Afficher le code » de la vitrine. */
  it('ferme par un Button tonal, et non par la variante fantôme', () => {
    render(<Lightbox open src="/image.png" alt="Une image" onClose={() => undefined} />);

    const footerButton = screen
      .getAllByRole('button', { name: 'Fermer' })
      .find((button) => button.classList.contains('opale-button'));

    expect(footerButton).toBeDefined();
    expect(footerButton).toHaveClass('opale-button--tonal');
    expect(footerButton).not.toHaveClass('opale-button--ghost');
  });

  /* LA CROIX SE RANGE À DROITE MÊME SEULE. L'en-tête répartit ses enfants en
     `space-between` : avec un titre, la croix va au bout ; sans titre — une
     visionneuse —, elle est le seul enfant et tombait à gauche. */
  it('pousse la croix à droite quand l’en-tête n’a pas de titre', () => {
    expect(declaration(modalStyles, '.close', 'margin')).toBe('-0.55rem -0.65rem -0.55rem auto');
  });
});
