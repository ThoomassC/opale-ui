import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useState, type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import Modal from '../modal/Modal';
import DropdownMenu, {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  type DropdownMenuProps,
} from './DropdownMenu';

/* =============================================================================
   LE MENU DÉROULANT, MESURÉ CONTRE LE MOTIF « MENU BUTTON » DE L'APG : un
   bouton qui annonce un menu, des éléments parcourus aux flèches, à Début et
   Fin et par la première lettre, activés à Entrée et Espace, et Échap qui
   referme en rendant le focus au bouton.
   ========================================================================== */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const renderMenu = (props: Partial<DropdownMenuProps> = {}) =>
  render(
    <>
      <DropdownMenu {...props}>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem value="edit">Modifier</DropdownMenuItem>
          <DropdownMenuItem value="duplicate">Dupliquer</DropdownMenuItem>
          <DropdownMenuItem value="archive" disabled>
            Archiver
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem value="delete">Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button type="button">Après</button>
    </>,
  );

const item = (name: string) => screen.getByRole('menuitem', { name });

describe('DropdownMenu', () => {
  it('annonce un menu et reste fermé par défaut', () => {
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('s’ouvre au clic et donne le focus au premier élément', async () => {
    const user = userEvent.setup();
    renderMenu();
    const trigger = screen.getByRole('button', { name: 'Actions' });
    await user.click(trigger);

    const menu = screen.getByRole('menu', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
    expect(item('Modifier')).toHaveFocus();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it.each([
    ['{Enter}', 'Modifier'],
    [' ', 'Modifier'],
    ['{ArrowDown}', 'Modifier'],
    ['{ArrowUp}', 'Supprimer'],
  ])('s’ouvre au clavier avec %s sur %s', async (keys, focused) => {
    const user = userEvent.setup();
    renderMenu();
    act(() => screen.getByRole('button', { name: 'Actions' }).focus());
    await user.keyboard(keys);
    expect(item(focused)).toHaveFocus();
  });

  it('parcourt aux flèches en bouclant, et à Début et Fin', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));

    await user.keyboard('{ArrowDown}');
    expect(item('Dupliquer')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    /* Désactivé, il reste atteignable : l'APG le veut lisible. */
    expect(item('Archiver')).toHaveFocus();
    expect(item('Archiver')).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(item('Modifier')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(item('Supprimer')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(item('Modifier')).toHaveFocus();
    await user.keyboard('{End}');
    expect(item('Supprimer')).toHaveFocus();
  });

  it('va au premier élément qui commence par la lettre tapée', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard('s');
    expect(item('Supprimer')).toHaveFocus();
    await user.keyboard('d');
    /* Le tampon « sd » ne correspond à rien : le focus ne bouge pas. */
    expect(item('Supprimer')).toHaveFocus();
  });

  it('cherche par préfixe et repart après l’élément courant', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard('du');
    expect(item('Dupliquer')).toHaveFocus();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    await user.keyboard('m');
    expect(item('Modifier')).toHaveFocus();
    vi.useRealTimers();
  });

  it('passe au suivant de même initiale à chaque lettre répétée', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Édition</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Copier</DropdownMenuItem>
          <DropdownMenuItem>Couper</DropdownMenuItem>
          <DropdownMenuItem textValue="Coller">
            <strong>Coller</strong> ici
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'Édition' }));
    expect(item('Copier')).toHaveFocus();
    await user.keyboard('c');
    expect(item('Couper')).toHaveFocus();
    await user.keyboard('c');
    expect(item('Coller ici')).toHaveFocus();
    await user.keyboard('c');
    expect(item('Copier')).toHaveFocus();
  });

  it('active à Entrée, prévient onSelect, ferme et rend le focus', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu({ onSelect });
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith('duplicate');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus();
  });

  it('active à Espace et au clic', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu({ onSelect });
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenLastCalledWith('edit');

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(item('Supprimer'));
    expect(onSelect).toHaveBeenLastCalledWith('delete');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('n’active pas un élément désactivé', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu({ onSelect });
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    await user.click(item('Archiver'));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('se ferme à Échap et rend le focus au bouton', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus();
  });

  it('se ferme à Tab', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.tab();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('se ferme à l’appui au dehors', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('button', { name: 'Après' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('donne le focus à l’élément survolé', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.hover(item('Supprimer'));
    expect(item('Supprimer')).toHaveFocus();
  });

  it('coche et décoche sans se fermer, et nomme ses groupes', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const onValueChange = vi.fn();
    const onSelect = vi.fn();
    render(
      <DropdownMenu onSelect={onSelect}>
        <DropdownMenuTrigger>Affichage</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup label="Colonnes">
            <DropdownMenuCheckboxItem
              value="status"
              defaultChecked
              onCheckedChange={onCheckedChange}
            >
              Statut
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuRadioGroup label="Tri" defaultValue="name" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="name">Nom</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'Affichage' }));

    expect(screen.getByRole('group', { name: 'Colonnes' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tri' })).toBeInTheDocument();

    const status = screen.getByRole('menuitemcheckbox', { name: 'Statut' });
    expect(status).toHaveAttribute('aria-checked', 'true');
    expect(status).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(status).toHaveAttribute('aria-checked', 'false');
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(onSelect).toHaveBeenCalledWith('status');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    const date = screen.getByRole('menuitemradio', { name: 'Date' });
    expect(screen.getByRole('menuitemradio', { name: 'Nom' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.click(date);
    expect(date).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'Nom' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(onValueChange).toHaveBeenCalledWith('date');
    expect(onSelect).toHaveBeenLastCalledWith('date');
  });

  it('appelle le onSelect d’un élément et peut rester ouvert', async () => {
    const user = userEvent.setup();
    const onItemSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={onItemSelect} closeOnSelect={false}>
            Rafraîchir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard('{Enter}');
    expect(onItemSelect).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('se laisse contrôler', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <DropdownMenu
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        >
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Modifier</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(item('Modifier')).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('transmet ref, classes et attributs aux parties', () => {
    const contentRef = vi.fn();
    const itemRef = vi.fn();
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger className="t">Actions</DropdownMenuTrigger>
        <DropdownMenuContent ref={contentRef} className="c" data-probe="c">
          <DropdownMenuItem ref={itemRef} className="i">
            Modifier
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const menu = screen.getByRole('menu');
    expect(screen.getByRole('button')).toHaveClass('opale-dropdown-menu__trigger', 't');
    expect(menu).toHaveClass('opale-dropdown-menu__content', 'c');
    expect(menu).toHaveAttribute('data-probe', 'c');
    expect(menu.closest('.opale-dropdown-menu')).toHaveAttribute('data-side');
    expect(item('Modifier')).toHaveClass('opale-dropdown-menu__item', 'i');
    expect(contentRef).toHaveBeenCalledWith(menu);
    expect(itemRef).toHaveBeenCalledWith(item('Modifier'));
  });

  it('se rend en verre liquide sur demande', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent liquidGlass>
          <DropdownMenuItem>Modifier</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.getByRole('menu').closest('[data-opale-glass]')).not.toBeNull();
  });

  it('dans une modale, Échap ferme le menu seul', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal open title="Réglages" onOpenChange={onOpenChange}>
        <DropdownMenu>
          <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Modifier</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Modal>,
    );
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu').closest('[inert]')).toBeNull();
    expect(item('Modifier')).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('refuse un élément rendu hors du menu', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<DropdownMenuItem>Seul</DropdownMenuItem>)).toThrow(
      /à l’intérieur de DropdownMenu/,
    );
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

describe('DropdownMenu, rendu serveur', () => {
  it('s’hydrate ouvert sous StrictMode sans écart ni erreur', async () => {
    const fixture = () => (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Modifier</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Supprimer</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    act(() => root?.unmount());
    host.remove();
  });
});
