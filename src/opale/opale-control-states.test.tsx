import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Autocomplete, Button, Checkbox, DataTable, Slider } from './opale';

/* =============================================================================
   LES ÉTATS DES CONTRÔLES QUE L'AUDIT 2.9.3 A TROUVÉS MUETS OU FUYANTS.

   Chargement d'un bouton (ACC-09), case indéterminée (DX-12), valeur d'un
   curseur libre (DX-27), options en double d'une saisie assistée (ROB-10) et
   zone de défilement d'une table (ACC-13). Chaque bloc décrit le comportement
   attendu, pas la façon de l'obtenir.
   ========================================================================== */

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Button — chargement', () => {
  it('reste focalisable : aria-disabled et aria-busy au lieu de disabled', () => {
    render(<Button loading>Enregistrer</Button>);
    const button = screen.getByRole('button', { name: /Enregistrer/ });

    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('garde le focus quand le chargement commence sous le focus', () => {
    const { rerender } = render(<Button>Enregistrer</Button>);
    const button = screen.getByRole('button', { name: 'Enregistrer' });
    button.focus();

    rerender(<Button loading>Enregistrer</Button>);

    expect(button).toHaveFocus();
    expect(button).not.toBeDisabled();
  });

  /* LE NOM NE CHANGE PAS PENDANT LE CHARGEMENT. Une première version de la
     2.9.3 ajoutait « Chargement en cours » au nom : `getByRole('button',
     { name: 'Enregistrer' })` ne trouvait plus rien chez les intégrateurs.
     L'attente est une DESCRIPTION, et `aria-busy` la signale. */
  it('garde son nom et décrit le chargement, texte remplaçable', () => {
    const { rerender } = render(<Button loading>Enregistrer</Button>);
    const button = screen.getByRole('button', { name: 'Enregistrer' });
    expect(button).toHaveAccessibleDescription('Chargement en cours');
    expect(button).toHaveAttribute('aria-busy', 'true');

    rerender(
      <Button loading labels={{ loading: 'Loading' }}>
        Save
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAccessibleDescription('Loading');

    rerender(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAccessibleDescription('');
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-describedby');
  });

  it('fusionne la description du chargement avec celle de l’appelant', () => {
    render(
      <>
        <span id="hint">Enregistre le brouillon</span>
        <Button loading aria-describedby="hint">
          Enregistrer
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toHaveAccessibleDescription(
      'Enregistre le brouillon Chargement en cours',
    );
  });

  it('ne laisse pas le clic remonter au parent pendant le chargement', async () => {
    const user = userEvent.setup();
    const onParentClick = vi.fn();
    const onParentKeyDown = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- écoute de test
      <div onClick={onParentClick} onKeyDown={onParentKeyDown}>
        <Button loading>Enregistrer</Button>
      </div>,
    );
    const button = screen.getByRole('button', { name: 'Enregistrer' });

    await user.click(button);
    button.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onParentClick).not.toHaveBeenCalled();
    expect(onParentKeyDown).not.toHaveBeenCalled();
  });

  it('laisse passer au parent les touches qui n’activent pas le bouton', async () => {
    const user = userEvent.setup();
    const onParentKeyDown = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- écoute de test
      <div onKeyDown={onParentKeyDown}>
        <Button loading>Enregistrer</Button>
      </div>,
    );
    screen.getByRole('button', { name: 'Enregistrer' }).focus();
    await user.keyboard('{Escape}');
    expect(onParentKeyDown).toHaveBeenCalledTimes(1);
  });

  it('n’appelle aucun gestionnaire d’appui de l’appelant pendant le chargement', async () => {
    const user = userEvent.setup();
    const handlers = {
      onPointerDown: vi.fn(),
      onPointerUp: vi.fn(),
      onMouseDown: vi.fn(),
      onMouseUp: vi.fn(),
      onClickCapture: vi.fn(),
      onKeyDown: vi.fn(),
      onKeyUp: vi.fn(),
    };
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const { rerender } = render(
      <Button loading {...handlers} onFocus={onFocus} onBlur={onBlur}>
        Enregistrer
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Enregistrer' });

    await user.click(button);
    await user.keyboard('{Enter}');
    await user.tab();

    for (const [name, handler] of Object.entries(handlers)) {
      expect(handler, name).not.toHaveBeenCalled();
    }
    /* Le focus, lui, est vécu : c'est ce qui distingue le chargement de `disabled`. */
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();

    rerender(
      <Button {...handlers} onFocus={onFocus} onBlur={onBlur}>
        Enregistrer
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(handlers.onMouseDown).toHaveBeenCalledTimes(1);
    expect(handlers.onClickCapture).toHaveBeenCalledTimes(1);
  });

  it('garde le focus quand son propre clic lance le chargement', async () => {
    const user = userEvent.setup();
    function Save() {
      const [loading, setLoading] = useState(false);
      return (
        <Button loading={loading} onClick={() => setLoading(true)}>
          Enregistrer
        </Button>
      );
    }
    render(<Save />);
    const button = screen.getByRole('button', { name: 'Enregistrer' });

    await user.click(button);

    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveFocus();
  });

  it('n’appelle pas onClick pendant le chargement', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <Button loading onClick={onClick}>
        Enregistrer
      </Button>,
    );

    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();

    rerender(<Button onClick={onClick}>Enregistrer</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ne soumet pas le formulaire pendant le chargement, ni au clic ni à Entrée', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(
      <form
        onSubmit={(event) => {
          onSubmit(event.nativeEvent as SubmitEvent);
        }}
      >
        <input aria-label="Nom" />
        <Button type="submit" loading>
          Envoyer
        </Button>
      </form>,
    );

    await user.click(screen.getByRole('button'));
    await user.type(screen.getByRole('textbox', { name: 'Nom' }), 'Ada{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('se comporte de même sous verre', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button liquidGlass loading onClick={onClick}>
        Enregistrer
      </Button>,
    );
    const button = screen.getByRole('button', { name: /Enregistrer/ });

    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('reste réellement désactivé quand disabled est aussi passé', () => {
    render(
      <Button loading disabled>
        Enregistrer
      </Button>,
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('laisse aria-busy et aria-disabled à l’appelant hors chargement', () => {
    render(<Button aria-disabled="true">Indisponible</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toHaveAttribute('aria-busy');
  });
});

describe('Checkbox — état indéterminé', () => {
  it('pose la propriété native indeterminate, et la retire', () => {
    const { rerender } = render(<Checkbox label="Tout sélectionner" indeterminate />);
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Tout sélectionner' });
    expect(box.indeterminate).toBe(true);

    rerender(<Checkbox label="Tout sélectionner" indeterminate={false} />);
    expect(box.indeterminate).toBe(false);
  });

  it('rétablit l’état après un clic tant que la prop le demande', () => {
    const { rerender } = render(<Checkbox label="Tout" indeterminate onChange={() => {}} />);
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Tout' });

    fireEvent.click(box);
    rerender(<Checkbox label="Tout" indeterminate onChange={() => {}} />);

    expect(box.indeterminate).toBe(true);
  });

  it('transmet toujours la ref de l’appelant au natif', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox label="Case" ref={ref} indeterminate />);
    expect(ref.current).toBe(screen.getByRole('checkbox', { name: 'Case' }));
    expect(ref.current?.indeterminate).toBe(true);
  });

  /* 2.9.2 n'avait pas la prop : la ref était LE moyen de poser l'état mixte.
     Un rendu sans la prop ne doit donc pas y toucher. */
  it('laisse intact l’état posé par la ref quand la prop est absente', () => {
    const ref = createRef<HTMLInputElement>();
    function Parent() {
      const [count, setCount] = useState(0);
      return (
        <>
          <Checkbox label="Tout" ref={ref} />
          <button type="button" onClick={() => setCount(count + 1)}>
            Rendu {count}
          </button>
        </>
      );
    }
    render(<Parent />);
    if (ref.current) ref.current.indeterminate = true;

    fireEvent.click(screen.getByRole('button', { name: 'Rendu 0' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rendu 1' }));

    expect(ref.current?.indeterminate).toBe(true);
  });

  it('efface l’état mixte quand la prop passe de true à absente', () => {
    const { rerender } = render(<Checkbox label="Tout" indeterminate />);
    const box = screen.getByRole<HTMLInputElement>('checkbox', { name: 'Tout' });
    expect(box.indeterminate).toBe(true);

    rerender(<Checkbox label="Tout" />);
    expect(box.indeterminate).toBe(false);
  });

  it('ne pose pas indeterminate comme attribut HTML', () => {
    render(<Checkbox label="Case" indeterminate />);
    expect(screen.getByRole('checkbox')).not.toHaveAttribute('indeterminate');
  });
});

describe('Slider — valeur affichée d’un curseur libre', () => {
  it('affiche la valeur de départ, puis suit le glissement', () => {
    render(<Slider label="Volume" defaultValue={40} />);
    const slider = screen.getByRole('slider', { name: 'Volume' });
    const header = slider.closest('.opale-field')?.querySelector('.opale-card__header');

    expect(header).toHaveTextContent('Volume40');

    fireEvent.change(slider, { target: { value: '70' } });
    expect(header).toHaveTextContent('Volume70');
  });

  it('suit une valeur posée par une ref, sans événement', () => {
    const ref = createRef<HTMLInputElement>();
    const { rerender } = render(<Slider label="Volume" ref={ref} />);
    const header = ref.current?.closest('.opale-field')?.querySelector('.opale-card__header');

    act(() => {
      if (ref.current) ref.current.value = '12';
    });
    rerender(<Slider label="Volume" ref={ref} />);

    expect(header).toHaveTextContent('Volume12');
  });

  it('garde la valeur contrôlée et le libellé fourni', () => {
    const { rerender } = render(<Slider label="Volume" value={30} onChange={() => {}} />);
    expect(screen.getByText('30')).toBeInTheDocument();

    rerender(<Slider label="Volume" defaultValue={30} valueLabel="Trente" />);
    expect(screen.getByText('Trente')).toBeInTheDocument();
  });
});

describe('Autocomplete — options en double', () => {
  it('ne rend chaque suggestion qu’une fois, sans clé React en double', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <Autocomplete label="Ville" options={['Paris', 'Lyon', 'Paris']} />,
    );

    const values = [...container.querySelectorAll('datalist option')].map((option) =>
      option.getAttribute('value'),
    );
    expect(values).toEqual(['Paris', 'Lyon']);
    expect(error.mock.calls.flat().map(String).join(' ')).not.toMatch(/same key/);
  });
});

describe('DataTable — zone de défilement horizontale', () => {
  const columns = [
    { key: 'name', label: 'Nom' },
    { key: 'role', label: 'Rôle' },
  ];
  const rows = [{ name: 'Ada', role: 'Autrice' }];

  function mockOverflow(overflowing: boolean) {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.classList.contains('opale-table-scroll') && overflowing ? 900 : 200;
    });
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 200);
  }

  it('devient une région nommée et atteignable au clavier quand elle déborde', () => {
    mockOverflow(true);
    const { container } = render(<DataTable caption="Équipe" columns={columns} rows={rows} />);
    const scroller = container.querySelector('.opale-table-scroll');
    const caption = container.querySelector('caption');

    expect(scroller).toHaveAttribute('tabindex', '0');
    expect(scroller).toHaveAttribute('role', 'region');
    expect(caption?.id).toBeTruthy();
    expect(scroller).toHaveAttribute('aria-labelledby', caption?.id);
    expect(screen.getByRole('region', { name: 'Équipe' })).toBe(scroller);
  });

  it('prend un nom par défaut, remplaçable, sans légende', () => {
    mockOverflow(true);
    const { rerender } = render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByRole('region', { name: 'Tableau défilant' })).toBeInTheDocument();

    rerender(<DataTable columns={columns} rows={rows} labels={{ scrollRegion: 'Scrollable' }} />);
    expect(screen.getByRole('region', { name: 'Scrollable' })).toBeInTheDocument();
  });

  it('reste un simple conteneur tant qu’elle ne déborde pas', () => {
    mockOverflow(false);
    const { container } = render(<DataTable caption="Équipe" columns={columns} rows={rows} />);
    const scroller = container.querySelector('.opale-table-scroll');

    expect(scroller).not.toHaveAttribute('tabindex');
    expect(scroller).not.toHaveAttribute('role');
    expect(scroller).not.toHaveAttribute('aria-labelledby');
  });
});
