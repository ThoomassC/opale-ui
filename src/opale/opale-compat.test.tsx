import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  createRef,
  useState,
  type ComponentRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SidebarContextValue } from './components/sidebar';
import {
  Autocomplete,
  Button,
  Clipboard,
  CommandPalette,
  ConfirmDialog,
  DataTable,
  IconActionButton,
  InlineInput,
  Input,
  Lightbox,
  Navbar,
  Pressable,
  SegmentedControl,
  SidePanel,
  Toast,
  type ButtonProps,
  type InputProps,
  type NavbarProps,
  type PressableProps,
  type SegmentedControlProps,
} from './opale';
import { expectOnlyDeprecationWarnings } from '../test/deprecation-warnings';

/* Ce fichier croise l'ancienne API : ses avertissements sont attendus. */
expectOnlyDeprecationWarnings();

/* =============================================================================
   CE QU'UNE APPLICATION ÉCRITE POUR 3.5 VOIT ENCORE.

   Une ligne par comportement de 3.5 que 3.6 garde : sans `defaultValue`, pas de
   mémoire ; `forwardRef` et `displayName` sur Button, Pressable et Input ; les
   anciens rappels reçoivent les mêmes arguments ; une langue de tri inconnue
   retombe sur le français.
   ========================================================================== */

afterEach(cleanup);

const OPTIONS = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
];

const pressed = () =>
  screen
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-pressed') === 'true')
    .map((button) => button.textContent);

describe('SegmentedControl, sans defaultValue', () => {
  it('ne devrait rien presser au clic, et seulement prévenir l’appelant', () => {
    const onChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'B' }));

    expect(pressed()).toEqual([]);
    expect(onChange).toHaveBeenCalledExactlyOnceWith('b');
  });

  it('ne devrait rien presser quand la valeur contrôlée redevient undefined', () => {
    function Harness() {
      const [value, setValue] = useState<string | undefined>();
      return (
        <>
          <SegmentedControl options={OPTIONS} value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue(undefined)}>
            Effacer
          </button>
        </>
      );
    }
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    fireEvent.click(screen.getByRole('button', { name: 'C' }));
    expect(pressed()).toEqual(['C']);

    fireEvent.click(screen.getByRole('button', { name: 'Effacer' }));

    expect(pressed()).toEqual([]);
  });

  it('devrait garder un type de value pas plus large qu’en 3.5', () => {
    const noNull: null extends SegmentedControlProps['value'] ? false : true = true;
    const noNullDefault: null extends SegmentedControlProps['defaultValue'] ? false : true = true;

    expect([noNull, noNullDefault]).toEqual([true, true]);
  });
});

describe('Navbar, sans defaultValue', () => {
  const ITEMS = [
    { id: 'x', label: 'X' },
    { id: 'y', label: 'Y' },
    { id: 'z', label: 'Z' },
  ];
  const current = () =>
    screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-current') === 'page')
      .map((button) => button.textContent);

  it('ne devrait marquer aucune entrée courante au clic', () => {
    const onSelect = vi.fn();
    render(<Navbar items={ITEMS} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Y' }));

    expect(current()).toEqual([]);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('y');
  });

  it.each(['activeId', 'value'] as const)(
    'ne devrait marquer aucune entrée quand %s redevient undefined',
    (prop) => {
      function Harness() {
        const [id, setId] = useState<string | undefined>();
        const controlled: Pick<NavbarProps, 'activeId' | 'value'> = { [prop]: id };
        return (
          <>
            <Navbar items={ITEMS} {...controlled} onSelect={setId} />
            <button type="button" onClick={() => setId(undefined)}>
              Effacer
            </button>
          </>
        );
      }
      render(<Harness />);

      fireEvent.click(screen.getByRole('button', { name: 'Y' }));
      fireEvent.click(screen.getByRole('button', { name: 'Z' }));
      expect(current()).toEqual(['Z']);

      fireEvent.click(screen.getByRole('button', { name: 'Effacer' }));

      expect(current()).toEqual([]);
    },
  );

  it('devrait refuser null comme valeur', () => {
    const noNull: null extends NavbarProps['value'] ? false : true = true;

    expect(noNull).toBe(true);
  });
});

/* LE CONTRAT DE TYPE DE 3.5, VÉRIFIÉ PAR `tsc`. */
const buttonComponent: ForwardRefExoticComponent<
  Omit<ButtonProps, 'ref'> & RefAttributes<HTMLButtonElement>
> = Button;
const pressableComponent: ForwardRefExoticComponent<
  Omit<PressableProps, 'ref'> & RefAttributes<HTMLButtonElement>
> = Pressable;
const inputComponent: ForwardRefExoticComponent<
  Omit<InputProps, 'ref'> & RefAttributes<HTMLInputElement>
> = Input;
const buttonRef: ComponentRef<typeof Button> | null = null;
const pressableRef: ComponentRef<typeof Pressable> | null = null;
const inputRef: ComponentRef<typeof Input> | null = null;

describe('Button, Pressable et Input', () => {
  it.each([
    ['Button', buttonComponent],
    ['Pressable', pressableComponent],
    ['Input', inputComponent],
  ] as const)('devrait exposer %s comme un forwardRef nommé', (name, component) => {
    expect(component.displayName).toBe(name);
    expect(component.$$typeof).toBe(Symbol.for('react.forward_ref'));
    expect([buttonRef, pressableRef, inputRef]).toEqual([null, null, null]);
  });

  it('devrait transmettre la ref jusqu’aux composants qui les enveloppent', () => {
    const icon = createRef<HTMLButtonElement>();
    const clipboard = createRef<HTMLButtonElement>();
    const inline = createRef<HTMLInputElement>();
    const autocomplete = createRef<HTMLInputElement>();
    render(
      <>
        <IconActionButton ref={icon} label="Plus" />
        <Clipboard ref={clipboard} value="texte" />
        <InlineInput ref={inline} label="Nom" defaultValue="a" />
        <Autocomplete ref={autocomplete} label="Ville" options={['Lyon']} />
      </>,
    );

    expect(icon.current).toBe(screen.getByRole('button', { name: 'Plus' }));
    expect(clipboard.current?.tagName).toBe('BUTTON');
    expect(inline.current).toBe(screen.getByRole('textbox', { name: 'Nom' }));
    expect(autocomplete.current).toBe(screen.getByRole('combobox', { name: 'Ville' }));
  });
});

/* LES ANCIENS RAPPELS REÇOIVENT CE QU'ILS RECEVAIENT EN 3.5 : l'événement du
   clic quand le bouton les appelait directement, rien quand la modale ferme. */
const escape = () => fireEvent.keyDown(window, { key: 'Escape' });
const arities = (mock: ReturnType<typeof vi.fn>) => mock.mock.calls.map((call) => call.length);
const isClick = (value: unknown) =>
  value instanceof Object && 'type' in value && value.type === 'click';

describe('les anciens rappels de fermeture', () => {
  it('devrait passer l’événement à onCancel depuis Annuler, et rien depuis la croix ou Échap', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open onCancel={onCancel}>
        Corps
      </ConfirmDialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    escape();

    expect(arities(onCancel)).toEqual([1, 0, 0]);
    expect(isClick(onCancel.mock.calls[0][0])).toBe(true);
  });

  it('devrait passer l’événement au onClose de Toast', () => {
    const onClose = vi.fn();
    render(<Toast message="Enregistré" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));

    expect(arities(onClose)).toEqual([1]);
    expect(isClick(onClose.mock.calls[0][0])).toBe(true);
  });

  it('devrait passer l’événement au onClose de Lightbox depuis Fermer, et rien depuis Échap', () => {
    const onClose = vi.fn();
    render(<Lightbox open src="/a.png" alt="Une image" onClose={onClose} />);

    const buttons = screen.getAllByRole('button', { name: 'Fermer' });
    fireEvent.click(buttons[buttons.length - 1]);
    escape();

    expect(arities(onClose)).toEqual([1, 0]);
    expect(isClick(onClose.mock.calls[0][0])).toBe(true);
  });

  it('devrait passer l’événement au onClose de CommandPalette depuis Fermer, et rien depuis Échap', () => {
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} />);

    const buttons = screen.getAllByRole('button', { name: 'Fermer' });
    fireEvent.click(buttons[buttons.length - 1]);
    escape();

    expect(arities(onClose)).toEqual([1, 0]);
    expect(isClick(onClose.mock.calls[0][0])).toBe(true);
  });

  it('devrait appeler le onClose de SidePanel sans argument', () => {
    const onClose = vi.fn();
    render(<SidePanel open onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    escape();

    expect(arities(onClose)).toEqual([0, 0]);
  });
});

describe('DataTable, langue de tri', () => {
  const COLUMNS = [{ key: 'name', label: 'Nom', sortable: true }];
  const ROWS = [{ name: 'Zoé' }, { name: 'Åsa' }, { name: 'Ärla' }];
  const sorted = (locale: string | readonly string[]) => {
    const { container, unmount } = render(
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        defaultSort={{ key: 'name', direction: 'ascending' }}
        locale={locale}
      />,
    );
    const names = Array.from(container.querySelectorAll('tbody td'), (cell) => cell.textContent);
    unmount();
    return names;
  };

  it('devrait garder les langues valides d’une liste qui contient une étiquette mal formée', () => {
    expect(sorted(['sv', 'bad tag'])).toEqual(['Zoé', 'Åsa', 'Ärla']);
    expect(sorted(['bad tag', 'sv'])).toEqual(['Zoé', 'Åsa', 'Ärla']);
  });

  it('devrait trier en français une langue inconnue', () => {
    const collator = vi.spyOn(Intl, 'Collator');
    sorted('zz');
    sorted('xx-YY');
    sorted(['en', 'bad tag']);

    expect(collator.mock.calls.map(([locales]) => locales)).toEqual([['fr'], ['fr'], ['en']]);
    collator.mockRestore();
  });
});

/* `labels` EST FACULTATIF DANS LE CONTEXTE : une valeur écrite pour 3.5 compile. */
const legacyContext: SidebarContextValue = {
  size: 'medium',
  collapsed: false,
  collapsible: false,
  toggleCollapsed() {},
  handleItemSelect() {},
  sidebarId: 'rail',
};

describe('SidebarContextValue', () => {
  it('devrait accepter une valeur sans labels', () => {
    expect(legacyContext.labels).toBeUndefined();
  });
});
