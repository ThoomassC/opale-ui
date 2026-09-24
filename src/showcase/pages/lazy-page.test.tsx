import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PageBoundary } from '../page-boundary';
import { lazyPage, preloadPages } from './lazy-page';

/* `lazyPage` — une page chargée à la demande se rend comme une page ordinaire
   une fois là, et ne perd pas son état au rendu suivant. */
describe('lazyPage', () => {
  it('devrait montrer un emplacement d’attente, puis la page', async () => {
    let resolve: (component: () => React.ReactNode) => void = () => {};
    const render_ = lazyPage(
      () =>
        new Promise<() => React.ReactNode>((done) => {
          resolve = done;
        }),
    );
    /* `await act` ET NON `render` nu : React 19 ne relance pas un composant qui
       a suspendu dans un `act` non attendu — il le signale, et la page ne
       reviendrait jamais dans le test, alors qu'elle revient au navigateur. */
    await act(async () => {
      render(<>{render_()}</>);
    });
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();

    await act(async () => resolve(() => <p>Contenu</p>));

    expect(screen.getByText('Contenu')).toBeInTheDocument();
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
  });

  it('devrait se rendre sans attente une fois préchargée, et transmettre ses props', async () => {
    const page = lazyPage(
      async () =>
        ({ name }: { name: string }) => <p>Bonjour {name}</p>,
      {
        name: 'Opale',
      },
    );
    await preloadPages();

    render(<>{page()}</>);

    expect(screen.getByText('Bonjour Opale')).toBeInTheDocument();
  });

  /* LE PIÈGE D'UNE PREMIÈRE VERSION : rendre `<Lazy />` puis la page nue
     changeait d'arbre au rendu suivant, et la page perdait son état. */
  it('ne devrait pas remonter la page quand le parent se rend de nouveau', async () => {
    function Counter() {
      const [count, setCount] = useState(0);
      return (
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          {count}
        </button>
      );
    }
    const page = lazyPage(async () => Counter);
    let rerender: () => void = () => {};
    function Shell() {
      const [, setTick] = useState(0);
      rerender = () => setTick((tick) => tick + 1);
      return <>{page()}</>;
    }
    await act(async () => {
      render(<Shell />);
    });
    const button = await screen.findByRole('button');
    await act(async () => button.click());
    expect(button).toHaveTextContent('1');

    await act(async () => rerender());

    expect(screen.getByRole('button'), 'Même nœud, même état.').toHaveTextContent('1');
  });

  it('devrait réessayer après un échec de chargement', async () => {
    const loader = vi
      .fn<() => Promise<() => React.ReactNode>>()
      .mockRejectedValueOnce(new Error('morceau introuvable'))
      .mockResolvedValue(() => <p>Revenue</p>);
    lazyPage(loader);

    await expect(preloadPages()).rejects.toThrow('morceau introuvable');
    await preloadPages();

    expect(loader).toHaveBeenCalledTimes(2);
  });

  /* UN MORCEAU INTROUVABLE BOUCLAIT SANS FIN. La promesse rejetée était oubliée
     avant que React la voie : chaque nouvelle tentative de rendu relançait un
     chargement — 69 requêtes en 1,5 s sur un loader lent — et l'erreur
     n'atteignait jamais `PageBoundary`. C'est le cas d'un déploiement qui a
     changé l'empreinte d'un morceau. */
  it('devrait remettre l’échec à PageBoundary, en un seul essai', async () => {
    const loader = vi.fn(
      () =>
        new Promise<() => React.ReactNode>((_, reject) => {
          setTimeout(() => reject(new Error('morceau introuvable')), 20);
        }),
    );
    const page = lazyPage(loader);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      render(<PageBoundary resetKey="a">{page()}</PageBoundary>);
    });
    await act(async () => {
      await new Promise((done) => setTimeout(done, 200));
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(loader, 'Un essai par navigation, pas une boucle.').toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
