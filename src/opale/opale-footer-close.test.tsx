import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommandPalette, Lightbox } from './opale';

/* =============================================================================
   `footerClose={false}` : LA CROIX SEULE.

   Par défaut, Lightbox et CommandPalette rendent deux « Fermer » : la croix
   d'en-tête et le bouton du pied. L'option retire celui du pied ; le nom de la
   croix et la gestion du focus (focus initial, piège, restitution) ne changent
   pas.
   ========================================================================== */

afterEach(cleanup);

const closeButtons = () => screen.getAllByRole('button', { name: 'Fermer' });

describe('Lightbox — footerClose', () => {
  it('devrait garder les deux « Fermer » par défaut', () => {
    render(<Lightbox open src="/photo.jpg" alt="Le port" onOpenChange={() => undefined} />);

    expect(closeButtons()).toHaveLength(2);
  });

  it('devrait ne rendre que la croix avec footerClose={false}, et fermer par elle', () => {
    const onOpenChange = vi.fn();
    render(
      <Lightbox
        open
        src="/photo.jpg"
        alt="Le port"
        onOpenChange={onOpenChange}
        footerClose={false}
      />,
    );

    const [cross] = closeButtons();
    expect(closeButtons()).toHaveLength(1);
    expect(cross).toHaveClass('opale-modal__close');
    expect(document.querySelector('.opale-modal__footer')).toBeNull();

    fireEvent.click(cross);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('devrait garder focus initial, piège et restitution avec footerClose={false}', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Ouvrir
          </button>
          <Lightbox
            open={open}
            onOpenChange={setOpen}
            src="/photo.jpg"
            alt="Le port"
            footerClose={false}
          />
        </>
      );
    };
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Aperçu' });
    expect(dialog).toHaveFocus();

    const [cross] = closeButtons();
    cross.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(cross).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(cross).toHaveFocus();

    await user.click(cross);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});

describe('CommandPalette — footerClose', () => {
  it('devrait garder les deux « Fermer » par défaut', () => {
    render(<CommandPalette open onOpenChange={() => undefined} />);

    expect(closeButtons()).toHaveLength(2);
  });

  it('devrait ne rendre que la croix avec footerClose={false}, et fermer par elle', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open onOpenChange={onOpenChange} footerClose={false} />);

    const [cross] = closeButtons();
    expect(closeButtons()).toHaveLength(1);
    expect(cross).toHaveClass('opale-modal__close');
    expect(document.querySelector('.opale-modal__footer')).toBeNull();

    fireEvent.click(cross);
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('devrait garder focus initial, piège et restitution avec footerClose={false}', async () => {
    const user = userEvent.setup();
    const Harness = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Ouvrir
          </button>
          <CommandPalette open={open} onOpenChange={setOpen} footerClose={false} />
        </>
      );
    };
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Palette de commandes' });
    const search = screen.getByRole('searchbox', { name: 'Rechercher une commande' });
    await waitFor(() => expect(search).toHaveFocus());

    const [cross] = closeButtons();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(cross).toHaveFocus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(search).toHaveFocus();

    await user.click(cross);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
