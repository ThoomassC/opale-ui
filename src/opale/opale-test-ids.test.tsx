import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Modal, ToastProvider, useToast } from './components';

/* =============================================================================
   OPALE NE POSE AUCUN `data-testid`.

   `Modal` et `ToastProvider` posaient `modal-container`, `modal-overlay`,
   `toast` et `toast-portal` : des crochets de test de la librairie, livrés
   dans le DOM des applications. La 4.0.0 les a retirés ; un test vise un rôle
   ARIA ou une classe stable `opale-*` (`opale-modal`, `opale-modal__backdrop`,
   `opale-toast-provider`, `opale-toast-provider__card`).
   ========================================================================== */

afterEach(cleanup);

function Launch() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast({ title: 'Publié', duration: Infinity })}>
      Publier
    </button>
  );
}

describe('les attributs de test', () => {
  it('ne sont posés ni par une modale ouverte ni par un toast affiché', () => {
    render(
      <ToastProvider>
        <Launch />
        <Modal open title="Réglages" onOpenChange={() => undefined}>
          Corps
        </Modal>
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Publier', hidden: true }));

    expect(screen.getByRole('dialog', { name: 'Réglages' })).toBeInTheDocument();
    expect(screen.getByText('Publié')).toBeInTheDocument();
    expect(document.querySelector('.opale-modal')).not.toBeNull();
    expect(document.querySelector('.opale-toast-provider__card')).not.toBeNull();
    expect(document.querySelector('[data-testid]')).toBeNull();
  });
});
