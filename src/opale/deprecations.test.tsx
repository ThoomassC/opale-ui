import { cleanup, render } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { resetDeprecationWarnings } from './deprecations';
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
} from './opale';

/* =============================================================================
   LES AVERTISSEMENTS DE DÉVELOPPEMENT QUI RESTENT.

   Les noms dépréciés de la 2.x ont été retirés en 4.0.0 : plus rien ne les
   signale dans la console, le compilateur les refuse. Restent le contrôle
   sans nom accessible, ici sur `Toggle`, et la promesse qu'une application
   écrite avec les noms actuels n'écrit RIEN dans la console.
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
