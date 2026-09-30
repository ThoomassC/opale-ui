import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { resetDeprecationWarnings } from './deprecations';
import {
  Badge,
  Clipboard,
  ConfirmDialog,
  DescriptionList,
  Donut,
  Feedback,
  FileCard,
  Icon,
  Rating,
  RatingInput,
  Spinner,
  type BadgeTone,
  type DescriptionListItem,
  type FeedbackTone,
} from './opale';

/* =============================================================================
   LE VOCABULAIRE COMMUN, LES TAILLES ET LES TEXTES DE LA 3.10.

   DX-10 : `Badge` parle enfin `OpaleTone` (succès, avertissement, info,
   neutre), et `Feedback` accepte `neutral`. DX-11 : `size` sur `Spinner` et
   `Badge` ; `FileCard.fileSize` remplace `size`. DX-09 : les textes figés de
   `Clipboard`, `Rating`, `RatingInput` et `FileCard` passent par `labels`.
   DX-17 : `ConfirmDialog` dit le danger et attend son action. DX-21 : les
   défauts surprenants d'`Icon` et de `Donut` se signalent en développement.
   ========================================================================== */

let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
  resetDeprecationWarnings();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  warn.mockRestore();
  vi.useRealTimers();
});

const messages = () => warn.mock.calls.map(([message]) => String(message));

describe('Badge — les tons d’Opale', () => {
  it.each(['success', 'warning', 'info', 'neutral'] as const satisfies readonly BadgeTone[])(
    'pose la classe du ton %s',
    (tone) => {
      render(<Badge tone={tone}>Payé</Badge>);

      expect(screen.getByText('Payé')).toHaveClass('opale-badge', `opale-badge--${tone}`);
    },
  );

  it('garde le primaire sans classe de ton', () => {
    render(<Badge>Nouveau</Badge>);

    expect(screen.getByText('Nouveau').className).toBe('opale-badge');
  });

  it.each(['small', 'large'] as const)('prend la taille %s', (size) => {
    render(<Badge size={size}>Nouveau</Badge>);

    expect(screen.getByText('Nouveau')).toHaveClass(`opale-badge--${size}`);
  });

  it('ne pose aucune classe pour la taille moyenne', () => {
    render(<Badge size="medium">Nouveau</Badge>);

    expect(screen.getByText('Nouveau').className).toBe('opale-badge');
  });
});

describe('Feedback — le ton neutre', () => {
  it('accepte `neutral`, en statut poli, avec un titre français', () => {
    const tone: FeedbackTone = 'neutral';
    render(<Feedback tone={tone}>Rien à signaler.</Feedback>);
    const region = screen.getByRole('status');

    expect(region).toHaveClass('opale-feedback--neutral');
    expect(region).toHaveTextContent('Remarque');
  });
});

describe('Spinner — la taille', () => {
  it('garde son balisage par défaut', () => {
    render(<Spinner />);
    const witness = screen.getByRole('status').querySelector('.opale-spinner');

    expect(witness?.className).toBe('opale-spinner');
  });

  it.each(['small', 'large'] as const)('prend la taille %s sur le témoin', (size) => {
    render(<Spinner size={size} />);

    expect(screen.getByRole('status').querySelector('.opale-spinner')).toHaveClass(
      `opale-spinner--${size}`,
    );
  });
});

describe('FileCard — `fileSize`', () => {
  it('affiche le poids passé par `fileSize`, sans avertir', () => {
    render(<FileCard name="rapport.pdf" fileSize="2 Mo" />);

    expect(screen.getByText('2 Mo')).toBeInTheDocument();
    expect(messages()).toEqual([]);
  });

  it('garde `size`, déprécié, avec un avertissement', () => {
    render(<FileCard name="rapport.pdf" size="2 Mo" />);

    expect(screen.getByText('2 Mo')).toBeInTheDocument();
    expect(messages()).toEqual([
      '[Opale] FileCard : `size` est déprécié depuis 3.10 et sera retiré en 4.0.0 — utilisez `fileSize`.',
    ]);
  });

  it('préfère `fileSize` quand les deux sont passés', () => {
    render(<FileCard name="rapport.pdf" fileSize="3 Mo" size="2 Mo" />);

    expect(screen.getByText('3 Mo')).toBeInTheDocument();
    expect(screen.queryByText('2 Mo')).toBeNull();
  });

  it('prend le texte de sélection dans `labels`', () => {
    render(<FileCard name="rapport.pdf" selected labels={{ selected: 'Selected' }} />);

    expect(screen.getByText('Selected')).toHaveClass('opale-visually-hidden');
  });
});

describe('Clipboard — `labels`', () => {
  it('garde ses textes français par défaut', () => {
    render(<Clipboard value="abc" />);

    expect(screen.getByRole('button', { name: 'Copier' })).toBeInTheDocument();
  });

  it('prend le bouton, la réussite et l’échec dans `labels`', async () => {
    const writeText = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(
      <Clipboard
        value="abc"
        labels={{
          copy: 'Copy',
          copied: 'Copied',
          copiedStatus: 'Copied to clipboard',
          failed: 'Copy failed',
        }}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Copied to clipboard');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copied' }));
    });
    expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Copy failed');

    Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('laisse `children` l’emporter sur `labels.copy`', () => {
    render(
      <Clipboard value="abc" labels={{ copy: 'Copy' }}>
        Copier le lien
      </Clipboard>,
    );

    expect(screen.getByRole('button', { name: 'Copier le lien' })).toBeInTheDocument();
  });
});

describe('Rating et RatingInput — `labels`', () => {
  it('garde « 3,75 sur 5 » par défaut', () => {
    render(<Rating value={3.75} />);

    expect(screen.getByRole('img', { name: '3,75 sur 5' })).toBeInTheDocument();
  });

  it('prend le nom de la note dans `labels.value`', () => {
    render(<Rating value={3.75} labels={{ value: (value, max) => `${value} out of ${max}` }} />);

    expect(screen.getByRole('img', { name: '3.75 out of 5' })).toBeInTheDocument();
  });

  it('nomme chaque étoile de RatingInput par `labels.option`', () => {
    render(
      <RatingInput
        label="Rating"
        max={3}
        labels={{ option: (value, max) => `${value} of ${max} stars` }}
      />,
    );

    expect(screen.getByRole('radio', { name: '2 of 3 stars' })).toBeInTheDocument();
  });

  it('garde « 2 sur 5 » par défaut sur RatingInput', () => {
    render(<RatingInput label="Note" />);

    expect(screen.getByRole('radio', { name: '2 sur 5' })).toBeInTheDocument();
  });
});

describe('DescriptionList — le type d’un élément', () => {
  it('accepte un tableau typé `DescriptionListItem`', () => {
    const items: readonly DescriptionListItem[] = [{ term: 'Statut', description: 'Payé' }];
    render(<DescriptionList items={items} />);

    expect(screen.getByRole('term')).toHaveTextContent('Statut');
  });
});

describe('Icon et Donut — les défauts surprenants', () => {
  it('avertit une fois quand Icon est rendue sans `name`', () => {
    render(
      <>
        <Icon />
        <Icon />
      </>,
    );

    expect(messages()).toEqual([
      '[Opale] Icon : aucun `name` n’est passé — l’icône `sparkle` est dessinée par défaut. Passez `name` : ce défaut disparaîtra en 4.0.0.',
    ]);
  });

  it('se tait quand Icon reçoit un nom', () => {
    render(<Icon name="search" />);

    expect(messages()).toEqual([]);
  });

  it('avertit quand Donut est rendu sans `value`', () => {
    render(<Donut />);

    expect(messages()).toEqual([
      '[Opale] Donut : aucune `value` n’est passée — l’anneau affiche 60 % par défaut. Passez `value` : ce défaut disparaîtra en 4.0.0.',
    ]);
  });

  it('se tait quand Donut reçoit une valeur, même zéro', () => {
    render(<Donut value={0} />);

    expect(messages()).toEqual([]);
  });

  it('se tait en production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(
      <>
        <Icon />
        <Donut />
      </>,
    );
    vi.unstubAllEnvs();

    expect(warn).not.toHaveBeenCalled();
  });
});

describe('ConfirmDialog — le ton et l’attente', () => {
  it('garde un bouton primaire par défaut', () => {
    render(<ConfirmDialog open onOpenChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Confirmer' })).toHaveClass('opale-button--primary');
  });

  it('passe le bouton de confirmation en danger avec `tone="danger"`', () => {
    render(<ConfirmDialog open tone="danger" onOpenChange={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Confirmer' })).toHaveClass('opale-button--danger');
  });

  it('bloque les deux boutons avec `loading`', () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    render(<ConfirmDialog open loading onConfirm={onConfirm} onOpenChange={onOpenChange} />);
    const confirm = screen.getByRole('button', { name: 'Confirmer' });

    expect(confirm).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled();

    fireEvent.click(confirm);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('attend la promesse de `onConfirm`, sans double appel', async () => {
    let resolve: () => void = () => undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    const onOpenChange = vi.fn();
    render(<ConfirmDialog open onConfirm={onConfirm} onOpenChange={onOpenChange} />);
    const confirm = screen.getByRole('button', { name: 'Confirmer' });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveAttribute('aria-busy', 'true');
    /* Annuler reste possible pendant la promesse, comme en 3.9 : seul
       `loading`, posé exprès par l'appelant, verrouille la fermeture. */
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeEnabled();

    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);

    await act(async () => {
      resolve();
    });

    expect(confirm).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeEnabled();
  });

  it('reste disponible quand `onConfirm` ne rend rien', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog open onConfirm={onConfirm} onOpenChange={() => undefined} />);
    const confirm = screen.getByRole('button', { name: 'Confirmer' });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(confirm).not.toHaveAttribute('aria-busy');
  });
});
