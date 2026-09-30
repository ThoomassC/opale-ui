import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useState, type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import Modal from '../modal/Modal';
import { PageScaffold } from '../page-scaffold/PageScaffold';
import Popover, { PopoverContent, PopoverTrigger, type PopoverProps } from './Popover';

/* =============================================================================
   LE POPOVER, MESURÉ CONTRE LE MOTIF « DIALOG » NON MODAL DE L'APG : un
   déclencheur qui annonce ce qu'il ouvre, un panneau qui prend le focus, qui
   se ferme à Échap et à l'appui au dehors, et qui rend le focus au
   déclencheur. `modal` y ajoute le piège de focus et l'inertie du reste.
   ========================================================================== */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const renderPopover = (props: Partial<PopoverProps> = {}) =>
  render(
    <>
      <button type="button">Avant</button>
      <Popover {...props}>
        <PopoverTrigger>Filtres</PopoverTrigger>
        <PopoverContent>
          <label>
            Ville <input />
          </label>
          <button type="button">Appliquer</button>
        </PopoverContent>
      </Popover>
      <button type="button">Après</button>
    </>,
  );

const flushMicrotasks = () => act(async () => {});

describe('Popover', () => {
  it('annonce ce qu’il ouvre et reste fermé par défaut', () => {
    renderPopover();
    const trigger = screen.getByRole('button', { name: 'Filtres' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('s’ouvre au clic, relie les deux bouts et prend le focus', async () => {
    const user = userEvent.setup();
    renderPopover();
    const trigger = screen.getByRole('button', { name: 'Filtres' });

    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Filtres' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);
    expect(dialog).not.toHaveAttribute('aria-modal');
    expect(screen.getByRole('textbox', { name: 'Ville' })).toHaveFocus();
  });

  it('se referme au second clic sur le déclencheur', async () => {
    const user = userEvent.setup();
    renderPopover();
    const trigger = screen.getByRole('button', { name: 'Filtres' });
    await user.click(trigger);
    await user.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('se ferme à Échap et rend le focus au déclencheur', async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole('button', { name: 'Filtres' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtres' })).toHaveFocus();
  });

  it('laisse Échap à l’appelant qui l’a consommé', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Filtres</PopoverTrigger>
        <PopoverContent onKeyDown={(event) => event.preventDefault()}>Panneau</PopoverContent>
      </Popover>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('se ferme à l’appui au dehors sans voler le focus', async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole('button', { name: 'Filtres' }));
    await user.click(screen.getByRole('button', { name: 'Après' }));
    await flushMicrotasks();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Après' })).toHaveFocus();
  });

  it('ne se ferme pas à l’appui dans son panneau', async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole('button', { name: 'Filtres' }));
    await user.click(screen.getByRole('button', { name: 'Appliquer' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ne ferme pas le parent à l’appui dans un popover imbriqué', async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger>Parent</PopoverTrigger>
        <PopoverContent aria-label="Parent">
          <Popover>
            <PopoverTrigger>Enfant</PopoverTrigger>
            <PopoverContent aria-label="Enfant">
              <button type="button">Dedans</button>
            </PopoverContent>
          </Popover>
        </PopoverContent>
      </Popover>,
    );
    await user.click(screen.getByRole('button', { name: 'Parent' }));
    await user.click(screen.getByRole('button', { name: 'Enfant' }));
    await user.click(screen.getByRole('button', { name: 'Dedans' }));
    expect(screen.getByRole('dialog', { name: 'Parent' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Enfant' })).toBeInTheDocument();

    /* Échap ferme d'abord l'enfant, puis le parent. */
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Enfant' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Parent' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enfant' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Parent' })).toHaveFocus();
  });

  it('non modal, se ferme quand la tabulation en sort', async () => {
    const user = userEvent.setup();
    renderPopover();
    await user.click(screen.getByRole('button', { name: 'Filtres' }));
    await user.tab();
    expect(screen.getByRole('button', { name: 'Appliquer' })).toHaveFocus();
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filtres' })).toHaveFocus();
  });

  it('modal, piège la tabulation, rend le reste inerte et le rend au départ', async () => {
    const user = userEvent.setup();
    renderPopover({ modal: true });
    const trigger = screen.getByRole('button', { name: 'Filtres' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Filtres' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(trigger.closest('[inert]')).not.toBeNull();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Appliquer' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Ville' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Appliquer' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger.closest('[inert]')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('se laisse contrôler et prévient onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Popover
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        >
          <PopoverTrigger>Filtres</PopoverTrigger>
          <PopoverContent>Panneau</PopoverContent>
        </Popover>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Filtres' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('s’ouvre avec defaultOpen', () => {
    renderPopover({ defaultOpen: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('transmet ref, classes et attributs aux deux parties', () => {
    const triggerRef = vi.fn();
    const contentRef = vi.fn();
    render(
      <Popover defaultOpen>
        <PopoverTrigger ref={triggerRef} className="t" data-probe="t">
          Filtres
        </PopoverTrigger>
        <PopoverContent ref={contentRef} className="c" data-probe="c" placement="top">
          Panneau
        </PopoverContent>
      </Popover>,
    );
    const trigger = screen.getByRole('button');
    const dialog = screen.getByRole('dialog');
    expect(trigger).toHaveClass('opale-popover__trigger', 't');
    expect(trigger).toHaveAttribute('data-probe', 't');
    expect(dialog).toHaveClass('opale-popover__panel', 'c');
    expect(dialog).toHaveAttribute('data-probe', 'c');
    expect(dialog.closest('.opale-popover')).toHaveAttribute('data-side');
    expect(triggerRef).toHaveBeenCalledWith(trigger);
    expect(contentRef).toHaveBeenCalledWith(dialog);
  });

  it('se rend en verre liquide sur demande', () => {
    render(
      <Popover defaultOpen>
        <PopoverTrigger>Filtres</PopoverTrigger>
        <PopoverContent liquidGlass>Panneau</PopoverContent>
      </Popover>,
    );
    expect(screen.getByRole('dialog').closest('[data-opale-glass]')).not.toBeNull();
  });

  it('suit le thème du gabarit dans son portail', () => {
    render(
      <PageScaffold siteName="t" defaultTheme="dark">
        <Popover defaultOpen>
          <PopoverTrigger>Filtres</PopoverTrigger>
          <PopoverContent>Panneau</PopoverContent>
        </Popover>
      </PageScaffold>,
    );
    expect(screen.getByRole('dialog').closest('.opale-popover')).toHaveAttribute(
      'data-opale-page-theme',
      'dark',
    );
  });

  it('dans une modale, se rend dans sa couche et Échap ne ferme que lui', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal open title="Réglages" onOpenChange={onOpenChange}>
        <Popover>
          <PopoverTrigger>Filtres</PopoverTrigger>
          <PopoverContent>
            <button type="button">Appliquer</button>
          </PopoverContent>
        </Popover>
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: 'Filtres' }));
    const dialog = screen.getByRole('dialog', { name: 'Filtres' });
    expect(dialog.closest('[inert]')).toBeNull();
    expect(dialog.closest('.opale-modal')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Appliquer' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Filtres' })).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Filtres' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('refuse une partie rendue hors de Popover', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<PopoverTrigger>Seul</PopoverTrigger>)).toThrow(/à l’intérieur de Popover/);
    error.mockRestore();
  });
});

function renderOnServer(element: ReactElement): string {
  vi.stubGlobal('window', undefined);
  vi.stubGlobal('document', undefined);
  try {
    return renderToString(element);
  } finally {
    vi.unstubAllGlobals();
  }
}

describe('Popover, rendu serveur', () => {
  it('s’hydrate ouvert sous StrictMode sans écart ni erreur', async () => {
    const fixture = () => (
      <Popover defaultOpen>
        <PopoverTrigger>Filtres</PopoverTrigger>
        <PopoverContent>Panneau</PopoverContent>
      </Popover>
    );
    const host = document.createElement('div');
    host.innerHTML = renderOnServer(fixture());
    document.body.append(host);

    const errors: string[] = [];
    const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(' '));
    });
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(host, <StrictMode>{fixture()}</StrictMode>, {
          onRecoverableError: (error) => errors.push(String(error)),
        });
      });
    } finally {
      consoleError.mockRestore();
    }

    expect(errors).toEqual([]);
    expect(screen.getByRole('dialog')).toHaveTextContent('Panneau');
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    act(() => root?.unmount());
    host.remove();
  });
});
