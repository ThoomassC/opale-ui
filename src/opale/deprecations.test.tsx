import { cleanup, render } from '@testing-library/react';
import { useEffect, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import {
  DEPRECATED_PROPS,
  deprecationMessage,
  resetDeprecationWarnings,
  warnDeprecated,
  type DeprecatedComponent,
} from './deprecations';
import {
  Modal,
  SearchBar,
  Sidebar,
  SiteNav,
  Tabs,
  ToastProvider,
  Topbar,
  useToast,
} from './components';
import {
  CommandPalette,
  ConfirmDialog,
  DataTable,
  Feedback,
  FileCard,
  Lightbox,
  MultiSelect,
  Navbar,
  Pagination,
  RatingInput,
  SegmentedControl,
  SidePanel,
  Toast,
  Toggle,
  type DataTableProps,
  type FileCardProps,
  type LightboxProps,
} from './opale';

/* =============================================================================
   L'AVERTISSEMENT DE DÉVELOPPEMENT DES NOMS DÉPRÉCIÉS.

   Une fois par composant + prop, en développement seulement, et jamais pour
   qui n'emploie que les nouveaux noms. La dernière partie rend CHAQUE entrée
   de la table sur son composant : une prop listée mais pas branchée rougit
   ici, en la nommant.
   ========================================================================== */

let warn: MockInstance<typeof console.warn>;

beforeEach(() => {
  resetDeprecationWarnings();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  warn.mockRestore();
  vi.unstubAllEnvs();
});

const messages = () => warn.mock.calls.map(([message]) => String(message));

describe('warnDeprecated', () => {
  it('écrit le message en français, avec la version et le remplaçant', () => {
    warnDeprecated('Lightbox', 'onClose');

    expect(messages()).toEqual([
      '[Opale] Lightbox : `onClose` est déprécié depuis 2.6 et sera retiré en 3.0.0 — utilisez `onOpenChange`.',
    ]);
  });

  it('précise la correspondance des valeurs quand il y en a une', () => {
    warnDeprecated('DataTable', 'density');

    expect(messages()).toEqual([
      '[Opale] DataTable : `density` est déprécié depuis 2.6 et sera retiré en 3.0.0 — utilisez `size` (`compact` → `small`).',
    ]);
  });

  it('n’avertit qu’une fois par composant et par prop', () => {
    warnDeprecated('Lightbox', 'onClose');
    warnDeprecated('Lightbox', 'onClose');
    warnDeprecated('DataTable', 'density');

    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('se tait en production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    warnDeprecated('Lightbox', 'onClose');
    render(<Lightbox src="a.png" alt="A" onClose={() => undefined} />);

    expect(warn).not.toHaveBeenCalled();
  });

  it('ne consomme pas l’avertissement en production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    warnDeprecated('Lightbox', 'onClose');
    vi.unstubAllEnvs();

    warnDeprecated('Lightbox', 'onClose');

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('avertit une seule fois pour une liste de composants rendus', () => {
    render(
      <>
        <Lightbox src="a.png" alt="A" onClose={() => undefined} />
        <Lightbox src="b.png" alt="B" onClose={() => undefined} />
        <Lightbox src="c.png" alt="C" onClose={() => undefined} />
      </>,
    );

    expect(messages()).toEqual([
      '[Opale] Lightbox : `onClose` est déprécié depuis 2.6 et sera retiré en 3.0.0 — utilisez `onOpenChange`.',
    ]);
  });
});

describe('les nouveaux noms', () => {
  it('ne déclenchent aucun avertissement', () => {
    function FireToast() {
      const { showToast } = useToast();
      useEffect(() => {
        showToast({ title: 'Publié', tone: 'success' });
      }, [showToast]);
      return null;
    }

    render(
      <ToastProvider>
        <Modal open onOpenChange={() => undefined} enableLiquidAnimation={false} title="Titre" />
        <Tabs defaultValue="a" liquidGlass />
        <Sidebar value="a" onValueChange={() => undefined} onCollapsedChange={() => undefined} />
        <Topbar liquidGlass />
        <SearchBar aria-label="Rechercher" enableLiquidAnimation={false} />
        <SiteNav items={[{ id: 'a', href: '/', label: 'Accueil' }]} value="a" />
        <DataTable size="small" labels={{ empty: 'Rien.' }} />
        <Feedback tone="warning">Attention</Feedback>
        <Toast message="Enregistré" onOpenChange={() => undefined} />
        <ConfirmDialog onOpenChange={() => undefined} />
        <Pagination pageCount={3} value={1} onValueChange={() => undefined} />
        <RatingInput label="Note" onValueChange={() => undefined} />
        <MultiSelect label="Choix" options={[{ value: 'a', label: 'A' }]} value={['a']} />
        <SegmentedControl options={[{ value: 'a', label: 'A' }]} onValueChange={() => undefined} />
        <Navbar items={[{ id: 'a', label: 'A' }]} value="a" onValueChange={() => undefined} />
        <SidePanel onOpenChange={() => undefined} />
        <CommandPalette onValueChange={() => undefined} onOpenChange={() => undefined} />
        <Lightbox src="a.png" alt="A" onOpenChange={() => undefined} />
        <FileCard name="a.pdf" fileSize="2 Mo" />
        <Toggle label="Wi-Fi" />
        <FireToast />
      </ToastProvider>,
    );

    expect(messages()).toEqual([]);
  });
});

/* ---- Chaque entrée de la table, rendue sur son composant. */

type Props = Record<string, unknown>;

const RENDERERS: Record<DeprecatedComponent, (props: Props) => ReactElement> = {
  DataTable: (p) => <DataTable {...(p as Partial<DataTableProps>)} />,
  FileCard: (p) => <FileCard name="a.pdf" {...(p as Partial<FileCardProps>)} />,
  Lightbox: (p) => <Lightbox src="a.png" alt="A" {...(p as Partial<LightboxProps>)} />,
};

/** Une valeur plausible pour chaque ancien nom : seule sa présence compte. */
const SAMPLES: Readonly<Record<string, unknown>> = {
  onClose: () => undefined,
  onCancel: () => undefined,
  onChange: () => undefined,
  onSelect: () => undefined,
  onToggle: () => undefined,
  onSelectItem: () => undefined,
  triggerAnimation: false,
  pressFeedback: false,
  enableLiquidAnimation: false,
  enableClickAnimation: false,
  as: 'section',
  activeItemId: 'a',
  defaultActiveItemId: 'a',
  activeItem: 'a',
  activeId: 'a',
  variant: 'success',
  emptyMessage: 'Rien.',
  density: 'compact',
  severity: 'warning',
  values: ['a'],
  page: 1,
  size: '2 Mo',
};

describe('chaque prop dépréciée de la table', () => {
  it.each(DEPRECATED_PROPS.map((entry) => [`${entry.component}.${entry.prop}`, entry] as const))(
    '%s avertit quand elle est fournie',
    (_, entry) => {
      expect(SAMPLES, `aucune valeur d’essai pour \`${entry.prop}\``).toHaveProperty(entry.prop);

      render(RENDERERS[entry.component]({ [entry.prop]: SAMPLES[entry.prop] }));

      expect(messages()).toContain(deprecationMessage(entry));
    },
  );
});

describe('Toggle sans nom accessible', () => {
  it('avertit quand rien ne le nomme', () => {
    render(<Toggle />);

    expect(messages()).toEqual([
      '[Opale] Toggle : l’interrupteur n’a pas de nom accessible — donnez-lui `label`, `aria-label` ou `aria-labelledby`.',
    ]);
  });

  it('se tait avec `label`, `aria-label`, `aria-labelledby` ou un `<label for>` externe', () => {
    render(
      <>
        <Toggle label="Wi-Fi" />
        <Toggle aria-label="Bluetooth" />
        <span id="toggle-name">Mode avion</span>
        <Toggle aria-labelledby="toggle-name" />
        <label htmlFor="toggle-external">Localisation</label>
        <Toggle id="toggle-external" />
      </>,
    );

    expect(messages()).toEqual([]);
  });

  it('se tait en production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    render(<Toggle />);

    expect(warn).not.toHaveBeenCalled();
  });
});
