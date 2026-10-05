import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Modal, PageScaffold, ToastProvider, useToast } from './components';
import { ConfirmDialog, SidePanel, Toast } from './opale';
import { byClass } from '../test/stable-class';

/* =============================================================================
   PLUSIEURS SURIMPRESSIONS À LA FOIS — ROB-01, ROB-05, ROB-08, THM-05.

   Chaque modale mémorisait l'inertie des frères et le `overflow` de `<body>` à
   SON ouverture, puis les restaurait à SA fermeture, sans rien partager. Deux
   surimpressions sœurs refermées dans le même gestionnaire, ou hors de l'ordre
   inverse de leur ouverture, restauraient l'état posé par l'autre : la page
   restait inerte et figée jusqu'au rechargement. Ces tests tiennent la pile
   commune qui remplace ce jeu de sauvegardes croisées.
   ========================================================================== */

afterEach(cleanup);

/** Les éléments inertes, du nœud jusqu'à la racine. */
const inertChain = (element: Element | null): Element[] => {
  const chain: Element[] = [];
  for (let node = element; node; node = node.parentElement) {
    if (node.hasAttribute('inert')) chain.push(node);
  }
  return chain;
};

const isInert = (element: Element | null) => inertChain(element).length > 0;

type Setter = Dispatch<SetStateAction<boolean>>;

describe('deux surimpressions sœurs', () => {
  const renderSiblings = () => {
    const api: { setA?: Setter; setB?: Setter } = {};

    function App() {
      const [a, setA] = useState(false);
      const [b, setB] = useState(false);
      api.setA = setA;
      api.setB = setB;
      return (
        <>
          <main id="page">
            <button type="button">Page</button>
          </main>
          <Modal open={a} title="A" onOpenChange={setA}>
            <button type="button">Dans A</button>
          </Modal>
          <Modal open={b} title="B" onOpenChange={setB}>
            <button type="button">Dans B</button>
          </Modal>
        </>
      );
    }

    render(<App />);
    return {
      page: () => document.getElementById('page'),
      setA: (value: boolean) => act(() => api.setA?.(value)),
      setB: (value: boolean) => act(() => api.setB?.(value)),
      closeBoth: () =>
        act(() => {
          api.setA?.(false);
          api.setB?.(false);
        }),
    };
  };

  it('rend la page à la fermeture simultanée des deux', () => {
    const { page, setA, setB, closeBoth } = renderSiblings();

    setA(true);
    setB(true);
    expect(isInert(page())).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    closeBoth();

    expect(screen.queryAllByRole('dialog')).toHaveLength(0);
    expect(inertChain(page())).toEqual([]);
    expect(document.querySelector('[inert], [aria-hidden="true"]:not(svg)')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('rend la page quand la première ouverte se ferme la première', () => {
    const { page, setA, setB } = renderSiblings();

    setA(true);
    setB(true);
    setA(false);

    /* B est encore ouverte : la page reste inerte, B reste vivante. */
    expect(isInert(page())).toBe(true);
    expect(isInert(screen.getByRole('dialog', { name: 'B' }))).toBe(false);
    expect(document.body.style.overflow).toBe('hidden');

    setB(false);

    expect(inertChain(page())).toEqual([]);
    expect(document.body.style.overflow).toBe('');
  });

  it('laisse vivante la seule surimpression du dessus, et rend celle du dessous à sa fermeture', () => {
    const { page, setA, setB } = renderSiblings();

    setA(true);
    setB(true);
    expect(isInert(screen.getByRole('dialog', { name: 'A', hidden: true }))).toBe(true);
    expect(isInert(screen.getByRole('dialog', { name: 'B' }))).toBe(false);

    setB(false);

    expect(isInert(screen.getByRole('dialog', { name: 'A' }))).toBe(false);
    expect(isInert(page())).toBe(true);

    setA(false);
    expect(inertChain(page())).toEqual([]);
  });

  it('rend la page quand un panneau et sa confirmation se ferment dans le même gestionnaire', () => {
    const api: { setP?: Setter; setC?: Setter } = {};

    function App() {
      const [panel, setPanel] = useState(false);
      const [confirm, setConfirm] = useState(false);
      api.setP = setPanel;
      api.setC = setConfirm;
      return (
        <>
          <main id="page">Page</main>
          <SidePanel open={panel} onOpenChange={setPanel} title="Filtres">
            Contenu
          </SidePanel>
          <ConfirmDialog
            open={confirm}
            onOpenChange={setConfirm}
            title="Supprimer ?"
            onConfirm={() => {
              setConfirm(false);
              setPanel(false);
            }}
          />
        </>
      );
    }

    render(<App />);
    act(() => api.setP?.(true));
    act(() => api.setC?.(true));

    fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));

    expect(screen.queryAllByRole('dialog')).toHaveLength(0);
    expect(inertChain(document.getElementById('page'))).toEqual([]);
    expect(document.body.style.overflow).toBe('');
  });

  it('rend la page quand l’arbre entier est démonté, surimpressions ouvertes', () => {
    const { setA, setB } = renderSiblings();
    setA(true);
    setB(true);

    cleanup();

    expect(document.querySelector('[inert]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('restitue les valeurs que l’hôte avait posées avant la première ouverture', () => {
    document.body.style.overflow = 'clip';
    const decor = document.createElement('div');
    decor.setAttribute('aria-hidden', 'true');
    document.body.append(decor);

    try {
      const { setA, setB, closeBoth } = renderSiblings();
      setA(true);
      setB(true);
      expect(decor).toHaveAttribute('inert');

      closeBoth();

      expect(document.body.style.overflow).toBe('clip');
      expect(decor).not.toHaveAttribute('inert');
      expect(decor).toHaveAttribute('aria-hidden', 'true');
    } finally {
      decor.remove();
      document.body.style.overflow = '';
    }
  });
});

describe('deux surimpressions imbriquées ouvertes dans le même rendu', () => {
  it('laisse la plus profonde vivante et focalisée', () => {
    render(
      <Modal open title="A" onOpenChange={() => {}}>
        <p>Contenu de A</p>
        <ConfirmDialog open title="B" onOpenChange={() => {}} onConfirm={() => {}} />
      </Modal>,
    );

    const inner = screen.getByRole('dialog', { name: 'B' });
    expect(isInert(inner)).toBe(false);
    expect(isInert(screen.getByRole('dialog', { name: 'A', hidden: true }))).toBe(true);
    expect(inner).toHaveFocus();
  });
});

describe('le verrou de défilement', () => {
  /* `clientWidth` vaut 0 sous jsdom. On le simule : `withBar` est la largeur
     tant que la page défile, `locked` celle une fois `overflow: hidden` posé. */
  const stubClientWidth = (withBar: number, locked: number) => {
    Object.defineProperty(document.documentElement, 'clientWidth', {
      configurable: true,
      get: () => (document.body.style.overflow === 'hidden' ? locked : withBar),
    });
  };
  const restoreClientWidth = () => {
    Reflect.deleteProperty(document.documentElement, 'clientWidth');
  };

  it('compense la barre de défilement que le verrou retire, et la rend ensuite', () => {
    /* Une page de 1009 px qui passe à 1024 : la barre de 15 px a disparu. */
    stubClientWidth(1009, 1024);
    try {
      const { rerender } = render(<Modal open title="A" onOpenChange={() => {}} />);
      expect(document.body.style.paddingInlineEnd).toBe('15px');

      rerender(<Modal open={false} title="A" onOpenChange={() => {}} />);
      expect(document.body.style.paddingInlineEnd).toBe('');
    } finally {
      restoreClientWidth();
    }
  });

  it('ne compense rien quand la barre reste là — `scrollbar-gutter: stable`, `overflow-y: scroll`', () => {
    /* La largeur ne change pas au verrou : l'hôte réserve la gouttière, ou
       fait défiler `<html>`. Ajouter un retrait décalerait la page de 15 px. */
    stubClientWidth(1009, 1009);
    try {
      render(<Modal open title="A" onOpenChange={() => {}} />);
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.paddingInlineEnd).toBe('');
    } finally {
      restoreClientWidth();
    }
  });

  it('ne pose aucune compensation quand la page n’a pas de barre', () => {
    stubClientWidth(1024, 1024);
    try {
      render(<Modal open title="A" onOpenChange={() => {}} />);
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.paddingInlineEnd).toBe('');
    } finally {
      restoreClientWidth();
    }
  });

  it('ne verrouille pas quand seule une surimpression sans verrou est ouverte', () => {
    render(<Modal open lockScroll={false} title="A" onOpenChange={() => {}} />);
    expect(document.body.style.overflow).toBe('');
  });
});

describe('le thème local du gabarit — THM-05', () => {
  it('pose le thème sombre du gabarit sur le conteneur de la modale', () => {
    render(
      <PageScaffold defaultTheme="dark" siteName="Sombre">
        <Modal open title="Dans le gabarit" onOpenChange={() => {}} />
      </PageScaffold>,
    );

    const container = byClass('opale-modal');
    expect(container.closest('[data-opale-page-theme]')).toBe(container);
    expect(container).toHaveAttribute('data-opale-page-theme', 'dark');
  });

  it('suit le gabarit quand il change de thème pendant l’ouverture', () => {
    const api: { setTheme?: Dispatch<SetStateAction<'light' | 'dark'>> } = {};

    function App() {
      const [theme, setTheme] = useState<'light' | 'dark'>('light');
      api.setTheme = setTheme;
      return (
        <PageScaffold theme={theme} siteName="Suivi">
          <Modal open title="Suiveuse" />
        </PageScaffold>
      );
    }

    render(<App />);
    const container = byClass('opale-modal');
    expect(container).toHaveAttribute('data-opale-page-theme', 'light');

    act(() => api.setTheme?.('dark'));

    expect(container).toHaveAttribute('data-opale-page-theme', 'dark');
  });

  it('ne rend rien à l’endroit où la modale est écrite, même dans un tableau', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      render(
        <PageScaffold defaultTheme="dark" siteName="Sombre">
          <table>
            <tbody>
              <tr>
                <td>Ligne</td>
              </tr>
              <Modal open title="Dans le tableau" onOpenChange={() => {}} />
            </tbody>
          </table>
        </PageScaffold>,
      );

      const tbody = document.querySelector('tbody');
      expect(tbody?.children).toHaveLength(1);
      expect(consoleError).not.toHaveBeenCalled();
      expect(byClass('opale-modal')).toHaveAttribute('data-opale-page-theme', 'dark');
    } finally {
      consoleError.mockRestore();
    }
  });

  it('ne prend pas le thème d’un gabarit dont elle n’est pas écrite dedans', () => {
    render(
      <>
        <PageScaffold defaultTheme="dark" siteName="Sombre" />
        <Modal open title="À côté" onOpenChange={() => {}} />
      </>,
    );
    expect(byClass('opale-modal')).not.toHaveAttribute('data-opale-page-theme');
  });

  it('ne pose rien hors de tout gabarit', () => {
    render(<Modal open title="Seule" onOpenChange={() => {}} />);
    expect(byClass('opale-modal')).not.toHaveAttribute('data-opale-page-theme');
  });

  it('pose le thème du gabarit sur le panneau latéral et la confirmation', () => {
    render(
      <PageScaffold defaultTheme="dark" siteName="Sombre">
        <SidePanel open title="Filtres" onOpenChange={() => {}} />
      </PageScaffold>,
    );
    expect(byClass('opale-modal')).toHaveAttribute('data-opale-page-theme', 'dark');
  });

  it('pose le thème du gabarit sur le message posé à l’écran', () => {
    render(
      <PageScaffold defaultTheme="dark" siteName="Sombre">
        <Toast message="Enregistré" />
      </PageScaffold>,
    );
    const card = screen.getByText('Enregistré').closest('.opale-toast');
    expect(card).toHaveAttribute('data-opale-page-theme', 'dark');
  });

  it('garde le thème du message quand il passe au verre pendant qu’il est ouvert', () => {
    const { rerender } = render(
      <PageScaffold defaultTheme="dark" siteName="Sombre">
        <Toast message="Enregistré" />
      </PageScaffold>,
    );

    rerender(
      <PageScaffold defaultTheme="dark" siteName="Sombre">
        <Toast message="Enregistré" liquidGlass />
      </PageScaffold>,
    );

    /* Le verre peint sa teinte sur l'enveloppe : c'est elle qui doit porter
       le thème, pas seulement le contenu. */
    const root = screen.getByText('Enregistré').closest('.opale-toast--glass-root');
    expect(root).toHaveAttribute('data-opale-page-theme', 'dark');
  });

  it('pose le thème du gabarit sur la file quand le fournisseur est dedans', () => {
    function Trigger() {
      const { showToast } = useToast();
      return (
        <button type="button" onClick={() => showToast({ title: 'Publié' })}>
          Publier
        </button>
      );
    }

    render(
      <PageScaffold defaultTheme="dark" siteName="Sombre">
        <ToastProvider>
          <Trigger />
        </ToastProvider>
      </PageScaffold>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

    expect(byClass('opale-toast-provider')).toHaveAttribute('data-opale-page-theme', 'dark');
  });

  it('suit la file quand le gabarit est remplacé, un toast persistant affiché', async () => {
    const api: { setDark?: Setter } = {};

    function Trigger() {
      const { showToast } = useToast();
      return (
        <button type="button" onClick={() => showToast({ title: 'Reste', duration: Infinity })}>
          Montrer
        </button>
      );
    }

    function App() {
      const [dark, setDark] = useState(true);
      api.setDark = setDark;
      return (
        <ToastProvider>
          <Trigger />
          {dark ? (
            <PageScaffold key="sombre" defaultTheme="dark" siteName="Sombre" />
          ) : (
            <PageScaffold key="clair" defaultTheme="light" siteName="Clair" />
          )}
        </ToastProvider>
      );
    }

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Montrer' }));
    expect(byClass('opale-toast-provider')).toHaveAttribute('data-opale-page-theme', 'dark');

    /* Une navigation client remplace la page : l'observateur rend la main en
       micro-tâche, que l'`act` asynchrone laisse passer. */
    await act(async () => api.setDark?.(false));

    expect(byClass('opale-toast-provider')).toHaveAttribute('data-opale-page-theme', 'light');
  });
});

describe('le focus entre deux surimpressions imbriquées ouvertes ensemble', () => {
  it('rend le focus à la modale parente, puis au déclencheur', () => {
    function App() {
      const [outer, setOuter] = useState(false);
      const [inner, setInner] = useState(false);
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setOuter(true);
              setInner(true);
            }}
          >
            Ouvrir
          </button>
          <Modal open={outer} title="Parente" onOpenChange={setOuter}>
            <ConfirmDialog open={inner} title="Enfant" onOpenChange={setInner} />
          </Modal>
        </>
      );
    }

    render(<App />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Enfant' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('dialog', { name: 'Enfant' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Parente' })).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryAllByRole('dialog')).toHaveLength(0);
    expect(trigger).toHaveFocus();
  });
});
