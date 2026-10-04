import { act, StrictMode, useState, type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Opale, useOpaleTheme, useSvgMapViewport } from './index';

/* =============================================================================
   RENDU SERVEUR PUIS HYDRATATION, POUR CHAQUE COMPOSANT DU NAMESPACE — ROB-12.

   La suite ne rendait jamais un composant côté serveur pour l'hydrater
   ensuite. C'est pourtant ainsi que l'App Router de Next.js monte tout : le
   HTML vient du serveur, React le reprend au client, et le moindre écart —
   un portail résolu pendant le rendu, un `typeof document` qui tranche
   autrement — fait jeter et recréer le sous-arbre entier. `ToastProvider`,
   posé à la racine, jetait ainsi TOUTE l'application, sans un toast affiché.

   LE RENDU SERVEUR SE FAIT SANS DOM. `window` et `document` sont retirés le
   temps de `renderToString`, exactement comme sous Node : chaque garde
   `typeof document` tranche comme sur un vrai serveur. Ils sont rendus avant
   l'hydratation, qui se fait sous `StrictMode` — donc avec les effets joués,
   défaits et rejoués — et qui ne doit produire ni erreur récupérable ni
   `console.error`.

   LA LISTE EST CELLE DU NAMESPACE `Opale`, et un test vérifie qu'il n'y manque
   personne : un composant ajouté sans cas ici fait échouer la suite plutôt
   que de passer à côté.
   ========================================================================== */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const noop = () => {};
const nav = [
  { id: 'a', label: 'A', href: '#a' },
  { id: 'b', label: 'B', href: '#b' },
];
const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];
const regions = [
  { id: 'r1', path: 'M0 0 L10 0 L10 10 Z', name: 'R1' },
  { id: 'r2', path: 'M10 10 L20 10 L20 20 Z', name: 'R2' },
];

function SvgMapWithControls() {
  const viewport = useSvgMapViewport('0 0 20 20');
  return (
    <>
      <Opale.SvgMap viewBox="0 0 20 20" regions={regions} viewport={viewport} />
      <Opale.SvgMapControls viewport={viewport} />
    </>
  );
}

/* Le thème mémorisé que ni le serveur ni l'hydratation ne doivent lire. */
function ThemeProbe() {
  const { theme, resolvedTheme } = useOpaleTheme({ storageKey: 'ssr-theme' });
  return (
    <p data-choice={theme} data-resolved={resolvedTheme}>
      {resolvedTheme}
    </p>
  );
}

/* Les surimpressions sont rendues OUVERTES : c'est le cas qui cassait. */
const COMPONENT_FIXTURES: Record<keyof typeof Opale, () => ReactElement> = {
  Autocomplete: () => <Opale.Autocomplete label="Ville" options={['Lyon', 'Nantes']} />,
  BackgroundSurface: () => <Opale.BackgroundSurface>x</Opale.BackgroundSurface>,
  Badge: () => <Opale.Badge>b</Opale.Badge>,
  Breadcrumb: () => <Opale.Breadcrumb items={nav} />,
  BulletList: () => <Opale.BulletList items={['a', 'b']} />,
  Button: () => <Opale.Button>ok</Opale.Button>,
  Card: () => <Opale.Card>c</Opale.Card>,
  CardGrid: () => (
    <Opale.CardGrid>
      <Opale.Card>c</Opale.Card>
    </Opale.CardGrid>
  ),
  Checkbox: () => <Opale.Checkbox label="c" />,
  Clipboard: () => <Opale.Clipboard value="abc" />,
  CommandPalette: () => (
    <Opale.CommandPalette open items={[{ id: 'x', label: 'X' }]} onOpenChange={noop} />
  ),
  ConfirmDialog: () => <Opale.ConfirmDialog open title="t" onConfirm={noop} onOpenChange={noop} />,
  CookieBanner: () => <Opale.CookieBanner />,
  DataTable: () => (
    <Opale.DataTable
      columns={[{ key: 'n', label: 'N', sortable: true }]}
      rows={[{ n: 'b' }, { n: 'a' }]}
    />
  ),
  DescriptionList: () => <Opale.DescriptionList items={[{ term: 'a', description: 'b' }]} />,
  Divider: () => <Opale.Divider />,
  Donut: () => <Opale.Donut value={40} label="d" />,
  Dropzone: () => <Opale.Dropzone />,
  EmptyState: () => <Opale.EmptyState title="e" />,
  Feedback: () => <Opale.Feedback>f</Opale.Feedback>,
  FileCard: () => <Opale.FileCard name="a.pdf" />,
  Form: () => <Opale.Form>x</Opale.Form>,
  Heading: () => <Opale.Heading>h</Opale.Heading>,
  Icon: () => <Opale.Icon name="search" />,
  IconActionButton: () => <Opale.IconActionButton label="i" icon="search" />,
  InlineInput: () => <Opale.InlineInput aria-label="x" />,
  Input: () => <Opale.Input label="n" />,
  Layout: () => <Opale.Layout>x</Opale.Layout>,
  LegalLinks: () => <Opale.LegalLinks />,
  Lightbox: () => <Opale.Lightbox alt="a" src="/x.png" open onOpenChange={noop} />,
  Link: () => <Opale.Link href="#">l</Opale.Link>,
  Menu: () => <Opale.Menu label="m" items={nav} />,
  Modal: () => (
    <Opale.Modal open title="t" onOpenChange={noop}>
      m
    </Opale.Modal>
  ),
  MultiSelect: () => <Opale.MultiSelect label="m" options={options} />,
  Navbar: () => <Opale.Navbar items={nav} />,
  PageScaffold: () => <Opale.PageScaffold siteName="t">x</Opale.PageScaffold>,
  Pagination: () => <Opale.Pagination pageCount={5} />,
  Pressable: () => <Opale.Pressable>p</Opale.Pressable>,
  ProgressBar: () => <Opale.ProgressBar value={30} label="p" />,
  Rating: () => <Opale.Rating value={3} />,
  RatingInput: () => <Opale.RatingInput label="r" />,
  SearchBar: () => <Opale.SearchBar />,
  SegmentedControl: () => <Opale.SegmentedControl options={options} aria-label="s" />,
  Select: () => <Opale.Select label="s" options={options} />,
  SelectionBar: () => <Opale.SelectionBar selectedCount={2} />,
  SidePanel: () => (
    <Opale.SidePanel open title="s" onOpenChange={noop}>
      x
    </Opale.SidePanel>
  ),
  Sidebar: () => (
    <Opale.Sidebar>
      <Opale.Sidebar.Header>
        <Opale.Sidebar.Toggle />
      </Opale.Sidebar.Header>
      <Opale.Sidebar.Items aria-label="n">
        <Opale.Sidebar.Item itemId="a">A</Opale.Sidebar.Item>
      </Opale.Sidebar.Items>
    </Opale.Sidebar>
  ),
  SiteNav: () => <Opale.SiteNav items={[{ id: 'a', label: 'A', href: '#' }]} />,
  Skeleton: () => <Opale.Skeleton />,
  Slider: () => <Opale.Slider label="s" />,
  Spinner: () => <Opale.Spinner />,
  Stack: () => <Opale.Stack>x</Opale.Stack>,
  StatCard: () => <Opale.StatCard label="l" value="1" />,
  SvgMap: () => <Opale.SvgMap viewBox="0 0 20 20" regions={regions} selectable />,
  SvgMapControls: () => <SvgMapWithControls />,
  Tabs: () => (
    <Opale.Tabs defaultValue="a">
      <Opale.Tabs.List>
        <Opale.Tabs.Trigger value="a">A</Opale.Tabs.Trigger>
        <Opale.Tabs.Trigger value="b">B</Opale.Tabs.Trigger>
      </Opale.Tabs.List>
      <Opale.Tabs.Content value="a">a</Opale.Tabs.Content>
      <Opale.Tabs.Content value="b">b</Opale.Tabs.Content>
    </Opale.Tabs>
  ),
  Text: () => <Opale.Text>t</Opale.Text>,
  Toast: () => <Opale.Toast message="m" />,
  ToastProvider: () => (
    <Opale.ToastProvider>
      <main>
        <p>contenu serveur</p>
      </main>
    </Opale.ToastProvider>
  ),
  Toggle: () => <Opale.Toggle label="t" />,
  Topbar: () => (
    <Opale.Topbar>
      <Opale.Topbar.Brand>b</Opale.Topbar.Brand>
      <Opale.Topbar.Actions>a</Opale.Topbar.Actions>
    </Opale.Topbar>
  ),
};

/* Les matières et les assemblages qui passent par d'autres chemins de rendu. */
const SCENARIOS: Record<string, () => ReactElement> = {
  'Button en verre': () => <Opale.Button liquidGlass>ok</Opale.Button>,
  'Card en verre': () => <Opale.Card liquidGlass>c</Opale.Card>,
  'Input en verre': () => <Opale.Input label="n" liquidGlass />,
  'Toggle en verre': () => <Opale.Toggle label="t" liquidGlass />,
  'ToastProvider à la racine, modale ouverte dedans': () => (
    <Opale.ToastProvider>
      <main>
        <Opale.Modal open title="Dans le fournisseur" onOpenChange={noop}>
          m
        </Opale.Modal>
      </main>
    </Opale.ToastProvider>
  ),
  'deux surimpressions sœurs ouvertes': () => (
    <Opale.ToastProvider>
      <main>page</main>
      <Opale.SidePanel open title="Filtres" onOpenChange={noop}>
        x
      </Opale.SidePanel>
      <Opale.ConfirmDialog open title="Supprimer ?" onOpenChange={noop} onConfirm={noop} />
    </Opale.ToastProvider>
  ),
  'deux surimpressions imbriquées ouvertes': () => (
    <Opale.Modal open title="A" onOpenChange={noop}>
      <Opale.ConfirmDialog open title="B" onOpenChange={noop} onConfirm={noop} />
    </Opale.Modal>
  ),
  'modale ouverte écrite dans un tableau': () => (
    <table>
      <tbody>
        <tr>
          <td>Ligne</td>
        </tr>
        <Opale.Modal open title="Dans le tableau" onOpenChange={noop} />
      </tbody>
    </table>
  ),
  'gabarit en thème système': () => (
    <Opale.PageScaffold siteName="t" defaultTheme="system">
      x
    </Opale.PageScaffold>
  ),
  'gabarit au thème mémorisé': () => (
    <Opale.PageScaffold siteName="t" themeStorageKey="ssr-theme">
      <Opale.Toast message="m" />
    </Opale.PageScaffold>
  ),
  'useOpaleTheme mémorisé': () => <ThemeProbe />,
  'modale ouverte dans un gabarit sombre': () => (
    <Opale.PageScaffold siteName="t" defaultTheme="dark">
      <Opale.Modal open title="Sombre" onOpenChange={noop}>
        m
      </Opale.Modal>
    </Opale.PageScaffold>
  ),
};

/** Rend comme sous Node : ni `window` ni `document`. */
function renderOnServer(element: ReactElement): string {
  vi.stubGlobal('window', undefined);
  vi.stubGlobal('document', undefined);
  try {
    return renderToString(element);
  } finally {
    vi.unstubAllGlobals();
  }
}

interface Hydrated {
  readonly errors: string[];
  readonly host: HTMLElement;
  readonly root: Root;
}

async function serverRenderThenHydrate(
  fixture: () => ReactElement,
  beforeHydrate?: (host: HTMLElement) => void,
): Promise<Hydrated> {
  const html = renderOnServer(fixture());
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  beforeHydrate?.(host);

  const errors: string[] = [];
  const consoleError = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    errors.push(args.map(String).join(' '));
  });

  let root: Root | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(host, <StrictMode>{fixture()}</StrictMode>, {
        onRecoverableError: (error) => {
          errors.push(
            `erreur récupérable : ${error instanceof Error ? error.message : String(error)}`,
          );
        },
      });
    });
  } finally {
    consoleError.mockRestore();
  }
  if (!root) throw new Error('hydrateRoot n’a rendu aucune racine');
  return { errors, host, root };
}

const mounted: Hydrated[] = [];

afterEach(async () => {
  for (const { root, host } of mounted.splice(0)) {
    await act(async () => root.unmount());
    host.remove();
  }
});

describe('rendu serveur puis hydratation, sous StrictMode', () => {
  it('couvre chaque composant du namespace Opale', () => {
    expect(Object.keys(COMPONENT_FIXTURES).sort()).toEqual(Object.keys(Opale).sort());
  });

  it.each(Object.entries({ ...COMPONENT_FIXTURES, ...SCENARIOS }))(
    '%s s’hydrate sans écart',
    async (_name, fixture) => {
      const hydrated = await serverRenderThenHydrate(fixture);
      mounted.push(hydrated);
      expect(hydrated.errors).toEqual([]);
    },
  );

  it('garde le HTML serveur sous ToastProvider au lieu de le recréer', async () => {
    let serverParagraph: Element | null = null;
    const hydrated = await serverRenderThenHydrate(COMPONENT_FIXTURES.ToastProvider, (host) => {
      serverParagraph = host.querySelector('main p');
    });
    mounted.push(hydrated);

    /* Le nœud rendu par le serveur est repris, pas jeté puis recréé. */
    expect(serverParagraph).not.toBeNull();
    expect(hydrated.host.querySelector('main p')).toBe(serverParagraph);
    expect(document.querySelector('[data-testid="toast-portal"]')).not.toBeNull();
  });

  it('applique le thème mémorisé du gabarit une fois l’hydratation faite', async () => {
    const hydrated = await serverRenderThenHydrate(SCENARIOS['gabarit au thème mémorisé'], () =>
      localStorage.setItem('ssr-theme', 'dark'),
    );
    mounted.push(hydrated);

    expect(hydrated.errors).toEqual([]);
    expect(hydrated.host.querySelector('.opale-page-scaffold')).toHaveAttribute(
      'data-opale-page-theme',
      'dark',
    );
  });

  it('ouvre la modale rendue ouverte, une fois l’hydratation faite', async () => {
    const hydrated = await serverRenderThenHydrate(COMPONENT_FIXTURES.Modal);
    mounted.push(hydrated);

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('rend la page intacte après le démontage de deux surimpressions hydratées', async () => {
    const hydrated = await serverRenderThenHydrate(SCENARIOS['deux surimpressions sœurs ouvertes']);
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2);

    await act(async () => hydrated.root.unmount());
    hydrated.host.remove();

    expect(document.querySelector('[inert]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('rend la page quand deux surimpressions hydratées se ferment ensemble', async () => {
    function App() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <main id="page">page</main>
          <Opale.SidePanel open={open} title="Filtres" onOpenChange={setOpen} />
          <Opale.ConfirmDialog
            open={open}
            title="Supprimer ?"
            onOpenChange={setOpen}
            onConfirm={() => setOpen(false)}
          />
        </>
      );
    }

    const hydrated = await serverRenderThenHydrate(() => <App />);
    mounted.push(hydrated);
    expect(hydrated.errors).toEqual([]);

    const confirm = [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Confirmer',
    );
    expect(confirm).toBeDefined();
    await act(async () => confirm?.click());
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);

    expect(document.querySelector('[inert]')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });
});
