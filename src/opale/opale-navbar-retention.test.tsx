import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { Menu, Navbar } from './opale';

/* =============================================================================
   NAVBAR NE RETIENT PAS LE CLIC SANS VALEUR DE DÉPART (DX-13), ET LE DIT.

   Le comportement ne change pas en 3.x : sans `value` ni `defaultValue`, une
   entrée cliquée ne devient pas courante. Un avertissement de développement
   le signale, une fois par chargement — et seulement après le clic, relu une
   tâche plus tard : un parent qui tient la valeur et part de `undefined` la
   pose en réponse au clic, et ne doit pas être accusé. Même règle que
   `SegmentedControl`. Fichier isolé : l'avertissement ne part qu'une fois par
   module chargé, donc le cas qui le déclenche vient en dernier.
   ========================================================================== */

let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
  vi.useFakeTimers();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  warn.mockRestore();
});

const retentionWarnings = () =>
  warn.mock.calls.map((args) => String(args[0])).filter((message) => message.includes('Navbar'));

const flush = () => act(() => vi.runOnlyPendingTimers());

const ITEMS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
];

describe('Navbar — avertissement de rétention', () => {
  it('ne devrait rien dire au rendu, avant tout clic', () => {
    render(<Navbar items={ITEMS} />);
    flush();
    expect(retentionWarnings()).toEqual([]);
  });

  it('ne devrait rien dire avec defaultValue ou value', () => {
    render(<Navbar items={ITEMS} defaultValue="a" aria-label="Non contrôlée" />);
    render(<Navbar items={ITEMS} value="a" aria-label="Contrôlée" />);

    fireEvent.click(screen.getAllByRole('button', { name: 'B' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'B' })[1]);
    flush();

    expect(retentionWarnings()).toEqual([]);
  });

  it('ne devrait rien dire à un parent qui pose la valeur en réponse au clic', () => {
    function Parent() {
      const [value, setValue] = useState<string | undefined>();
      return <Navbar items={ITEMS} value={value} onValueChange={setValue} />;
    }
    render(<Parent />);

    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    flush();

    expect(retentionWarnings()).toEqual([]);
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-current', 'page');
  });

  it('ne devrait rien dire depuis un Menu, dont les entrées ne se retiennent pas', () => {
    render(<Menu open items={ITEMS} />);

    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    flush();

    expect(retentionWarnings()).toEqual([]);
  });

  it('ne devrait rien dire si la barre est démontée avant la vérification', () => {
    const { unmount } = render(<Navbar items={ITEMS} />);

    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    unmount();
    flush();

    expect(retentionWarnings()).toEqual([]);
  });

  it('devrait avertir une seule fois quand le clic reste perdu', () => {
    render(<Navbar items={ITEMS} />);

    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(retentionWarnings(), 'La vérification attend une tâche.').toEqual([]);
    flush();
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    flush();

    expect(retentionWarnings()).toHaveLength(1);
    expect(retentionWarnings()[0]).toMatch(/^\[Opale\] Navbar : .*`defaultValue`/);
    expect(screen.getByRole('button', { name: 'B' })).not.toHaveAttribute('aria-current');
  });
});
