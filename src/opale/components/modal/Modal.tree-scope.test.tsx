import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import Modal from './Modal';

/* =============================================================================
   LE PIÈGE DE FOCUS DANS UNE RACINE FANTÔME (ROB-09).

   Le piège comparait `document.activeElement` aux bords du dialogue. Dans une
   racine fantôme, cette valeur est l'HÔTE, jamais le bouton focalisé : aucun
   bord n'était reconnu, et `Tab` sur le dernier bouton sortait du dialogue.
   L'élément actif se lit désormais dans la portée d'arbre du panneau.
   ========================================================================== */

afterEach(() => {
  document.body.replaceChildren();
});

function shadowPortal() {
  const host = document.createElement('div');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const portal = document.createElement('div');
  shadow.append(portal);
  return { shadow, portal };
}

describe('Modal — le piège de focus dans une racine fantôme', () => {
  it('devrait boucler du dernier au premier, et du premier au dernier', () => {
    const { shadow, portal } = shadowPortal();
    render(
      <Modal
        open
        onOpenChange={() => {}}
        title="Dialogue"
        portalContainer={portal}
        footer={<button type="button">OK</button>}
      >
        <p>Corps</p>
      </Modal>,
    );

    const dialog = shadow.querySelector<HTMLElement>('[role="dialog"]');
    const buttons = shadow.querySelectorAll<HTMLButtonElement>('[role="dialog"] button');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (!dialog || !first || !last || first === last) throw new Error('dialogue incomplet');

    last.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(shadow.activeElement).toBe(first);

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(shadow.activeElement).toBe(last);
  });
});
