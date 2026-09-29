import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, type ToastDefinition, type ToastProviderProps } from './ToastProvider';
import { useToast } from './toast-context';
import toastClasses from './style/Toast.module.css';
import { expectOnlyDeprecationWarnings } from '../../../test/deprecation-warnings';

/* Ce fichier croise l'ancienne API : ses avertissements sont attendus. */
expectOnlyDeprecationWarnings();

/* =============================================================================
   CE QUE CETTE SUITE TIENT, ET POURQUOI ELLE N'EXISTAIT PAS.

   La file n'avait AUCUN test. C'est le composant le plus mécanique de la
   librairie — une liste, six coins, deux minuteries par carte, un portail — et
   c'est exactement le genre de code où une régression ne se voit pas : un
   toast qui ne part plus, un portail qui survit au démontage, une minuterie
   qui repart de zéro. Rien de tout cela ne casse un rendu.

   LES MINUTERIES SONT FAUSSES, PAS ATTENDUES. Une suite qui attend quatre
   secondes pour vérifier une auto-fermeture est une suite qu'on finit par
   désactiver. `vi.useFakeTimers` remplace aussi `Date.now`, ce dont dépend le
   calcul du reste à courir : les deux doivent avancer ensemble, sans quoi le
   test de la pause mesurerait n'importe quoi.
   ========================================================================== */

/** Un déclencheur, obligatoirement hors du fournisseur qu'il consomme. */
function Trigger({ label, toast }: { readonly label: string; readonly toast: ToastDefinition }) {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(toast)}>
      {label}
    </button>
  );
}

function ClearAll() {
  const { clearToasts } = useToast();
  return (
    <button type="button" onClick={() => clearToasts()}>
      Tout fermer
    </button>
  );
}

const renderWithProvider = (ui: React.ReactNode, props?: Partial<ToastProviderProps>) =>
  render(<ToastProvider {...props}>{ui}</ToastProvider>);

/** Avance les minuteries dans un `act`, sans quoi React proteste. */
const advance = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('jette quand useToast est appelé hors du fournisseur', () => {
    /* React journalise l'erreur de rendu en plus de la propager ; on la fait
       taire pour que la sortie de la suite reste lisible. */
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Trigger label="x" toast={{ title: 'x' }} />)).toThrow(
      'useToast must be used within ToastProvider',
    );

    spy.mockRestore();
  });

  it('empile un toast et rend son titre et sa description', () => {
    renderWithProvider(
      <Trigger
        label="Publier"
        toast={{ title: 'Étape publiée', description: 'Kyoto, 3 jours.' }}
      />,
    );

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

    expect(screen.getByText('Étape publiée')).toBeInTheDocument();
    expect(screen.getByText('Kyoto, 3 jours.')).toBeInTheDocument();
  });

  it('empile plusieurs toasts dans la même file', () => {
    renderWithProvider(
      <>
        <Trigger label="Un" toast={{ title: 'Un' }} />
        <Trigger label="Deux" toast={{ title: 'Deux' }} />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Un' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deux' }));

    expect(screen.getAllByTestId('toast')).toHaveLength(2);
  });

  it('se ferme tout seul au bout de la durée, animation de sortie comprise', async () => {
    renderWithProvider(<Trigger label="Publier" toast={{ title: 'Étape publiée' }} />, {
      duration: 4000,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    /* La minuterie échoit : la carte passe en sortie mais reste montée le
       temps de l'animation — c'est ce que documente la vitrine. */
    await advance(4000);
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    await advance(220);
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('ne ferme jamais un toast de durée infinie', async () => {
    renderWithProvider(<Trigger label="Publier" toast={{ title: 'Reste là' }} />, {
      duration: Infinity,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

    await advance(60_000);

    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('se ferme à la croix, et prévient onClose une seule fois', async () => {
    const onClose = vi.fn();
    renderWithProvider(<Trigger label="Publier" toast={{ title: 'Étape publiée', onClose }} />, {
      duration: Infinity,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));

    expect(onClose).toHaveBeenCalledTimes(1);

    await advance(220);

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('vide toute la file avec clearToasts', async () => {
    renderWithProvider(
      <>
        <Trigger label="Un" toast={{ title: 'Un' }} />
        <Trigger label="Deux" toast={{ title: 'Deux', position: 'bottom-left' }} />
        <ClearAll />
      </>,
      { duration: Infinity },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Un' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deux' }));
    expect(screen.getAllByTestId('toast')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Tout fermer' }));
    await advance(240);

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  /* ---------------------------------------------------------------------- */

  it('met la minuterie en pause au survol et reprend là où elle s’est arrêtée — WCAG 2.2.1', async () => {
    renderWithProvider(<Trigger label="Publier" toast={{ title: 'Étape publiée' }} />, {
      duration: 4000,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));
    const card = screen.getByTestId('toast');

    /* Trois secondes s'écoulent, puis le pointeur entre. */
    await advance(3000);
    fireEvent.pointerEnter(card);

    /* Une minute de survol ne doit RIEN fermer. C'est tout l'objet du critère :
       le message attend qu'on ait fini de le lire. */
    await advance(60_000);
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    /* À la sortie du pointeur, il reste la seconde qui n'avait pas été
       consommée — pas les quatre du départ. */
    fireEvent.pointerLeave(card);
    await advance(900);
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    /* Les deux avances sont SÉPARÉES à dessein : la minuterie de retrait n'est
       armée que par l'effet qui suit le rendu de la phase de sortie, donc elle
       n'existe pas encore pendant l'avance qui déclenche cette sortie. Les
       fusionner ferait échouer le test pour une raison qui n'a rien à voir
       avec le composant. */
    await advance(100);
    await advance(220);
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('met la minuterie en pause quand le focus entre dans la carte', async () => {
    renderWithProvider(<Trigger label="Publier" toast={{ title: 'Étape publiée' }} />, {
      duration: 4000,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

    /* `focus()` déclenche `onFocus`, donc un `setState` : hors `act`, React le
       signale comme une mise à jour non encadrée. */
    act(() => {
      screen.getByRole('button', { name: 'Fermer la notification' }).focus();
    });

    await advance(60_000);

    /* Sans cette pause, la croix s'évanouissait sous le doigt de qui venait
       tout juste de l'atteindre au clavier. */
    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('monte les régions live AVANT le premier toast, et au bon niveau de politesse', () => {
    renderWithProvider(
      <>
        <Trigger label="Info" toast={{ title: 'Carte régénérée', variant: 'info' }} />
        <Trigger label="Erreur" toast={{ title: 'Publication refusée', variant: 'error' }} />
      </>,
      { duration: Infinity },
    );

    /* SIX COINS, DEUX RÉGIONS CHACUN, ET ELLES EXISTENT DÉJÀ : c'est la
       condition pour qu'une insertion soit annoncée. Une région née avec son
       contenu peut n'être annoncée par personne. */
    const polite = screen.getAllByRole('status');
    const assertive = screen.getAllByRole('alert');
    expect(polite).toHaveLength(6);
    expect(assertive).toHaveLength(6);

    /* `role="status"` implique `aria-atomic="true"` : sans la remise à faux,
       toute la pile serait relue à chaque arrivée. */
    expect(polite[0]).toHaveAttribute('aria-atomic', 'false');
    expect(polite[0]).toHaveAttribute('aria-live', 'polite');
    expect(assertive[0]).toHaveAttribute('aria-live', 'assertive');

    fireEvent.click(screen.getByRole('button', { name: 'Info' }));
    fireEvent.click(screen.getByRole('button', { name: 'Erreur' }));

    const politeWithContent = polite.find((region) =>
      region.contains(screen.getByText('Carte régénérée')),
    );
    const assertiveWithContent = assertive.find((region) =>
      region.contains(screen.getByText('Publication refusée')),
    );

    expect(politeWithContent, 'une information doit atterrir dans la région polie').toBeDefined();
    expect(assertiveWithContent, 'une erreur doit atterrir dans la région assertive').toBeDefined();
  });

  it('démonte proprement son portail', () => {
    const { unmount } = renderWithProvider(
      <Trigger label="Publier" toast={{ title: 'Étape publiée' }} />,
      { duration: Infinity },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));
    expect(document.body.querySelector('[data-testid="toast-portal"]')).not.toBeNull();

    unmount();

    /* Un portail est monté HORS de l'arbre React de l'appelant : si le
       fournisseur ne le nettoie pas, il reste dans `document.body` après le
       démontage et s'accumule d'un montage à l'autre. C'est la fuite classique
       du motif, et elle ne se voit jamais à l'écran. */
    expect(document.body.querySelector('[data-testid="toast-portal"]')).toBeNull();
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('range chaque toast dans la pile de sa position', () => {
    renderWithProvider(
      <>
        <Trigger label="Un" toast={{ title: 'En haut', position: 'top-right' }} />
        <Trigger label="Deux" toast={{ title: 'En bas', position: 'bottom-left' }} />
      </>,
      { duration: Infinity },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Un' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deux' }));

    const stackOf = (text: string) =>
      screen.getByText(text).closest('[data-testid="toast"]')!.parentElement!.parentElement;

    expect(stackOf('En haut')).not.toBe(stackOf('En bas'));
  });

  it('remplace au lieu d’empiler quand le même id est réutilisé', () => {
    renderWithProvider(
      <>
        <Trigger label="Un" toast={{ id: 'sauvegarde', title: 'Enregistrement…' }} />
        <Trigger label="Deux" toast={{ id: 'sauvegarde', title: 'Enregistré' }} />
      </>,
      { duration: Infinity },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Un' }));
    fireEvent.click(screen.getByRole('button', { name: 'Deux' }));

    expect(screen.getAllByTestId('toast')).toHaveLength(1);
    expect(screen.getByText('Enregistré')).toBeInTheDocument();
    expect(screen.queryByText('Enregistrement…')).not.toBeInTheDocument();
  });

  it('rend l’identifiant du toast à l’appelant', () => {
    let returned: string | undefined;

    function Capture() {
      const { showToast } = useToast();
      return (
        <button
          type="button"
          onClick={() => {
            returned = showToast({ title: 'Étape publiée' });
          }}
        >
          Publier
        </button>
      );
    }

    renderWithProvider(<Capture />, { duration: Infinity });
    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));

    expect(returned).toBeTypeOf('string');
    expect(returned).not.toHaveLength(0);
  });
});

/* =============================================================================
   `tone`, LE VOCABULAIRE PARTAGÉ. `variant` reste accepté ; `'default'` y vaut
   `'neutral'`. Les cas ci-dessus, écrits avec `variant`, prouvent l'alias.
   ========================================================================== */

describe('ToastProvider — tone', () => {
  const surfaceOf = (title: string) => {
    const card = screen
      .getAllByTestId('toast')
      .find((element) => element.contains(screen.getByText(title)));
    return card?.firstElementChild;
  };

  it('devrait porter le ton passé par tone, et l’annoncer au bon niveau', () => {
    renderWithProvider(
      <Trigger label="Erreur" toast={{ title: 'Publication refusée', tone: 'error' }} />,
      { duration: Infinity },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Erreur' }));

    expect(surfaceOf('Publication refusée')).toHaveClass(toastClasses.error);
    const region = screen
      .getAllByRole('alert')
      .find((element) => element.contains(screen.getByText('Publication refusée')));
    expect(region).toBeDefined();
  });

  it('devrait traiter variant "default" comme tone "neutral"', () => {
    renderWithProvider(
      <>
        <Trigger label="Ancien" toast={{ title: 'Toast ancien', variant: 'default' }} />
        <Trigger label="Neutre" toast={{ title: 'Toast neutre', tone: 'neutral' }} />
        <Trigger label="Rien" toast={{ title: 'Toast sans ton' }} />
      </>,
      { duration: Infinity },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ancien' }));
    fireEvent.click(screen.getByRole('button', { name: 'Neutre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rien' }));

    expect(surfaceOf('Toast ancien')).toHaveClass(toastClasses.default);
    expect(surfaceOf('Toast neutre')?.className).toBe(surfaceOf('Toast ancien')?.className);
    expect(surfaceOf('Toast sans ton')?.className).toBe(surfaceOf('Toast ancien')?.className);
  });

  it('devrait faire gagner tone sur variant', () => {
    renderWithProvider(
      <Trigger label="Mixte" toast={{ title: 'Toast mixte', tone: 'success', variant: 'error' }} />,
      { duration: Infinity },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Mixte' }));

    expect(surfaceOf('Toast mixte')).toHaveClass(toastClasses.success);
    expect(surfaceOf('Toast mixte')).not.toHaveClass(toastClasses.error);
  });
});

describe('ToastProvider — la croix', () => {
  it('dessine la croix du jeu d’icônes, comme la modale, au lieu du caractère ×', () => {
    renderWithProvider(<Trigger label="Publier" toast={{ title: 'Publié' }} />, {
      duration: Infinity,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));
    const close = screen.getByRole('button', { name: 'Fermer la notification' });

    expect(close).toHaveTextContent('');
    expect(close.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(close.querySelector('svg')).toHaveClass(toastClasses.closeGlyph);
  });
});

describe('ToastProvider — durée des messages urgents', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['error', { tone: 'error' }],
    ['warning', { tone: 'warning' }],
    ['variant error', { variant: 'error' }],
  ] as const)('ne ferme pas seul un toast %s sans durée explicite', async (_, tone) => {
    renderWithProvider(<Trigger label="Lancer" toast={{ title: 'Échec', ...tone }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Lancer' }));
    await advance(60_000);
    await advance(1000);

    expect(screen.getByText('Échec')).toBeInTheDocument();
  });

  it('ferme toujours seul un toast de succès après la durée par défaut', async () => {
    renderWithProvider(<Trigger label="Lancer" toast={{ title: 'Publié', tone: 'success' }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Lancer' }));
    await advance(4000);
    await advance(300);

    expect(screen.queryByText('Publié')).not.toBeInTheDocument();
  });

  it('laisse une durée explicite gagner sur une erreur', async () => {
    renderWithProvider(
      <>
        <Trigger label="Toast" toast={{ title: 'Échec bref', tone: 'error', duration: 1000 }} />
        <Trigger label="Fournisseur" toast={{ title: 'Échec du fournisseur', tone: 'error' }} />
      </>,
      { duration: 2000 },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toast' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fournisseur' }));
    await advance(1000);
    await advance(300);
    expect(screen.queryByText('Échec bref')).not.toBeInTheDocument();
    expect(screen.getByText('Échec du fournisseur')).toBeInTheDocument();

    await advance(1000);
    await advance(300);
    expect(screen.queryByText('Échec du fournisseur')).not.toBeInTheDocument();
  });
});
