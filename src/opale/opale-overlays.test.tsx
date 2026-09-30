import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CommandPalette, ConfirmDialog, CookieBanner, Lightbox, SidePanel, Toast } from './opale';
import { expectOnlyDeprecationWarnings } from '../test/deprecation-warnings';

/* Ce fichier croise l'ancienne API : ses avertissements sont attendus. */
expectOnlyDeprecationWarnings();

/* =============================================================================
   OUVRIR ET FERMER : `open` + `onOpenChange`.

   Chaque surimpression se ferme par `onOpenChange(false)`. Les anciens rappels
   (`onClose`, `onCancel`) restent appelés, après le canonique. Les suites
   existantes, écrites avec eux, prouvent que les alias marchent encore.
   ========================================================================== */

afterEach(cleanup);

const escape = () => fireEvent.keyDown(window, { key: 'Escape' });
const overlay = () => screen.getByTestId('modal-overlay');

describe('ConfirmDialog', () => {
  const renderDialog = () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open title="Supprimer ?" onOpenChange={onOpenChange} onConfirm={onConfirm}>
        Cette action est irréversible.
      </ConfirmDialog>,
    );
    return { onOpenChange, onConfirm };
  };

  it('devrait envoyer onOpenChange(false) sur Annuler', () => {
    const { onOpenChange } = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('devrait envoyer onOpenChange(false) sur Échap', () => {
    const { onOpenChange } = renderDialog();

    escape();

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('devrait envoyer onOpenChange(false) sur le voile', () => {
    const { onOpenChange } = renderDialog();

    fireEvent.click(overlay());

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('devrait envoyer onOpenChange(false) sur la croix', () => {
    const { onOpenChange } = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('ne devrait jamais envoyer onOpenChange sur Confirmer', () => {
    const { onOpenChange, onConfirm } = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('devrait appeler onOpenChange puis l’onCancel déprécié', () => {
    const calls: string[] = [];
    render(
      <ConfirmDialog
        open
        onOpenChange={(open) => calls.push(`onOpenChange:${open}`)}
        onCancel={() => calls.push('onCancel')}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    escape();

    expect(calls).toEqual(['onOpenChange:false', 'onCancel', 'onOpenChange:false', 'onCancel']);
  });
});

describe('SidePanel', () => {
  it('devrait fermer par la croix et Échap avec onOpenChange seul', () => {
    const onOpenChange = vi.fn();
    render(<SidePanel open onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    escape();

    expect(onOpenChange.mock.calls).toEqual([[false], [false]]);
  });

  it('devrait appeler onOpenChange puis l’onClose déprécié', () => {
    const calls: string[] = [];
    render(
      <SidePanel
        open
        onOpenChange={(open) => calls.push(`onOpenChange:${open}`)}
        onClose={() => calls.push('onClose')}
      />,
    );

    fireEvent.click(overlay());

    expect(calls).toEqual(['onOpenChange:false', 'onClose']);
  });
});

describe('Lightbox', () => {
  it('devrait fermer par le bouton du pied et par la croix avec onOpenChange seul', () => {
    const onOpenChange = vi.fn();
    render(<Lightbox open src="/photo.jpg" alt="Le port" onOpenChange={onOpenChange} />);

    for (const button of screen.getAllByRole('button', { name: 'Fermer' })) {
      fireEvent.click(button);
    }

    expect(onOpenChange.mock.calls).toEqual([[false], [false]]);
  });

  it('devrait appeler onOpenChange puis l’onClose déprécié', () => {
    const calls: string[] = [];
    render(
      <Lightbox
        open
        src="/photo.jpg"
        alt="Le port"
        onOpenChange={(open) => calls.push(`onOpenChange:${open}`)}
        onClose={() => calls.push('onClose')}
      />,
    );

    escape();

    expect(calls).toEqual(['onOpenChange:false', 'onClose']);
  });
});

describe('CommandPalette', () => {
  it('devrait rendre le bouton Fermer du pied avec onOpenChange seul', () => {
    const onOpenChange = vi.fn();
    render(<CommandPalette open onOpenChange={onOpenChange} />);

    const buttons = screen.getAllByRole('button', { name: 'Fermer' });
    expect(buttons).toHaveLength(2);

    fireEvent.click(buttons[1]);
    escape();

    expect(onOpenChange.mock.calls).toEqual([[false], [false]]);
  });

  it('devrait appeler onOpenChange puis l’onClose déprécié', () => {
    const calls: string[] = [];
    render(
      <CommandPalette
        open
        onOpenChange={(open) => calls.push(`onOpenChange:${open}`)}
        onClose={() => calls.push('onClose')}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Fermer' })[1]);

    expect(calls).toEqual(['onOpenChange:false', 'onClose']);
  });
});

describe('Toast', () => {
  it('devrait rendre la croix avec onOpenChange seul', () => {
    const onOpenChange = vi.fn();
    render(<Toast message="Enregistré" onOpenChange={onOpenChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));

    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('devrait appeler onOpenChange puis l’onClose déprécié', () => {
    const calls: string[] = [];
    render(
      <Toast
        message="Enregistré"
        onOpenChange={(open) => calls.push(`onOpenChange:${open}`)}
        onClose={() => calls.push('onClose')}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));

    expect(calls).toEqual(['onOpenChange:false', 'onClose']);
  });
});

describe('CookieBanner', () => {
  it.each(['Accepter', 'Refuser'])(
    'devrait envoyer onOpenChange(false) sur %s, sans jamais true',
    (action) => {
      const onOpenChange = vi.fn();
      render(<CookieBanner storageKey={null} onOpenChange={onOpenChange} />);

      fireEvent.click(screen.getByRole('button', { name: action }));

      expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    },
  );

  it('devrait appeler onOpenChange avant onAccept', () => {
    const calls: string[] = [];
    render(
      <CookieBanner
        storageKey={null}
        onOpenChange={(open) => calls.push(`onOpenChange:${open}`)}
        onAccept={() => calls.push('onAccept')}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    expect(calls).toEqual(['onOpenChange:false', 'onAccept']);
  });

  it('ne devrait pas appeler onOpenChange au montage', () => {
    const onOpenChange = vi.fn();
    render(<CookieBanner storageKey={null} onOpenChange={onOpenChange} />);

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('Surimpressions empilées', () => {
  it('ne ferme que la modale du dessus sur Échap', () => {
    const onPanel = vi.fn();
    const onConfirm = vi.fn();
    render(
      <SidePanel open title="Détails" onOpenChange={onPanel}>
        <ConfirmDialog open title="Supprimer ?" onOpenChange={onConfirm} />
      </SidePanel>,
    );

    escape();

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(false);
    expect(onPanel).not.toHaveBeenCalled();
  });

  it('rend Échap à la modale du dessous quand celle du dessus se ferme', () => {
    const onPanel = vi.fn();
    const { rerender } = render(
      <SidePanel open title="Détails" onOpenChange={onPanel}>
        <ConfirmDialog open title="Supprimer ?" onOpenChange={() => {}} />
      </SidePanel>,
    );

    rerender(
      <SidePanel open title="Détails" onOpenChange={onPanel}>
        <ConfirmDialog open={false} title="Supprimer ?" onOpenChange={() => {}} />
      </SidePanel>,
    );
    escape();

    expect(onPanel).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('donne Échap à la dernière ouverte entre deux modales sœurs', () => {
    const onFirst = vi.fn();
    const onSecond = vi.fn();
    const { rerender } = render(
      <>
        <SidePanel open title="Premier" onOpenChange={onFirst} />
        <ConfirmDialog open={false} title="Second" onOpenChange={onSecond} />
      </>,
    );
    rerender(
      <>
        <SidePanel open title="Premier" onOpenChange={onFirst} />
        <ConfirmDialog open title="Second" onOpenChange={onSecond} />
      </>,
    );

    escape();

    expect(onSecond).toHaveBeenCalledExactlyOnceWith(false);
    expect(onFirst).not.toHaveBeenCalled();
  });
});
