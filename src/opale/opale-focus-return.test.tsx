import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from './components/toast';
import { CookieBanner, Toast } from './opale';

/* =============================================================================
   FERMER UN MESSAGE NE JETTE PLUS LE FOCUS SUR <body> (ACC-10, WCAG 2.4.3).

   Relevé au clavier : focus sur la croix d'un toast, Entrée, et
   `document.activeElement` valait `<body>`. La tabulation suivante repartait du
   haut de la page. Le focus revient désormais à l'élément d'où il venait, s'il
   est encore dans le document — et seulement si le focus était DANS ce qu'on
   ferme : un message qui part pendant qu'on travaille ailleurs ne vole rien.
   ========================================================================== */

afterEach(cleanup);

function SingleToast() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Enregistrer
      </button>
      <button type="button">Ailleurs</button>
      <Toast message="Enregistré" open={open} onOpenChange={setOpen} />
    </>
  );
}

describe('Toast : la croix rend le focus', () => {
  it('rend le focus à l’élément d’où il venait', async () => {
    render(<SingleToast />);
    const trigger = screen.getByRole('button', { name: 'Enregistrer' });
    trigger.focus();
    fireEvent.click(trigger);

    const close = await screen.findByRole('button', { name: 'Fermer la notification' });
    act(() => close.focus());
    fireEvent.click(close);

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('ne déplace pas le focus quand il était ailleurs', async () => {
    render(<SingleToast />);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    const close = await screen.findByRole('button', { name: 'Fermer la notification' });
    const elsewhere = screen.getByRole('button', { name: 'Ailleurs' });
    elsewhere.focus();

    fireEvent.click(close);
    await act(async () => {
      await Promise.resolve();
    });

    expect(document.activeElement).toBe(elsewhere);
  });

  it('ne cherche pas un élément retiré du document', async () => {
    function Vanishing() {
      const [open, setOpen] = useState(true);
      const [origin, setOrigin] = useState(true);
      return (
        <>
          {origin && (
            <button type="button" onClick={() => setOrigin(false)}>
              Origine
            </button>
          )}
          <Toast
            message="Enregistré"
            open={open}
            onOpenChange={(next) => {
              setOrigin(false);
              setOpen(next);
            }}
          />
        </>
      );
    }
    render(<Vanishing />);
    screen.getByRole('button', { name: 'Origine' }).focus();
    const close = await screen.findByRole('button', { name: 'Fermer la notification' });
    close.focus();

    fireEvent.click(close);
    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.queryByRole('button', { name: 'Origine' })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(document.body);
  });
});

function ProviderTrigger() {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => showToast({ title: 'Enregistré', duration: Infinity, liquidGlass: false })}
    >
      Publier
    </button>
  );
}

describe('ToastProvider : la croix rend le focus', () => {
  it('rend le focus au déclencheur dès que la carte commence à partir', async () => {
    render(
      <ToastProvider enableLiquidAnimation={false}>
        <ProviderTrigger />
      </ToastProvider>,
    );
    const trigger = screen.getByRole('button', { name: 'Publier' });
    trigger.focus();
    fireEvent.click(trigger);

    const close = await screen.findByRole('button', { name: 'Fermer la notification' });
    act(() => close.focus());
    fireEvent.click(close);

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});

describe('CookieBanner : le choix rend le focus', () => {
  it('rend le focus à l’élément d’où il venait, avant que le bandeau ne devienne inerte', () => {
    vi.useFakeTimers();
    try {
      render(
        <>
          <a href="#contenu">Contenu</a>
          <CookieBanner storageKey={null} />
        </>,
      );
      const origin = screen.getByRole('link', { name: 'Contenu' });
      origin.focus();
      const accept = screen.getByRole('button', { name: 'Accepter' });
      accept.focus();

      fireEvent.click(accept);

      expect(document.activeElement).toBe(origin);
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(screen.queryByRole('button', { name: 'Accepter' })).not.toBeInTheDocument();
      expect(document.activeElement).toBe(origin);
    } finally {
      vi.useRealTimers();
    }
  });
});
