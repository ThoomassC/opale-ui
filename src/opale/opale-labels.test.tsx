import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type {
  CommandPaletteLabels,
  ConfirmDialogLabels,
  CookieBannerLabels,
  DataTableLabels,
  DropzoneLabels,
  LightboxLabels,
  ModalLabels,
  PaginationLabels,
  SidePanelLabels,
  SidebarLabels,
  SvgMapControlsLabels,
  SvgMapLabels,
  ToastLabels,
} from '.';
import { Modal } from './components/modal';
import { Sidebar } from './components/sidebar';
import { useSvgMapViewport } from './components/svg-map';
import { ToastProvider, useToast } from './components/toast';
import {
  CommandPalette,
  ConfirmDialog,
  CookieBanner,
  DataTable,
  Dropzone,
  Lightbox,
  Pagination,
  SidePanel,
  SvgMap,
  SvgMapControls,
  Toast,
  type DataTableColumn,
  type SvgMapRegion,
} from './opale';

afterEach(cleanup);

const noop = () => undefined;

const REGIONS: readonly SvgMapRegion[] = [{ id: 'a', path: 'M0 0 H100 V100 H0 Z', name: 'Alpha' }];

const NAME_COLUMN: readonly DataTableColumn[] = [{ key: 'name', label: 'Nom', sortable: true }];

function fileInputOf(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('champ fichier absent');
  return input;
}

function drop(container: HTMLElement, files: readonly File[]) {
  fireEvent.change(fileInputOf(container), { target: { files } });
}

function textOf(container: HTMLElement, selector: string): string {
  return container.querySelector(selector)?.textContent ?? '';
}

function Controls({ labels }: { readonly labels?: Partial<SvgMapControlsLabels> }) {
  const viewport = useSvgMapViewport('0 0 100 100');
  return <SvgMapControls viewport={viewport} labels={labels} />;
}

function Trigger() {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast({ title: 'Publié', duration: Infinity })}>
      Publier
    </button>
  );
}

function namesOfRows(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('tbody td')).map((cell) => cell.textContent ?? '');
}

/* (a) SANS `labels`, RIEN NE BOUGE. Les chaînes sont écrites en dur : elles
   sont le contrat d'aujourd'hui, pas une copie des défauts du code. */
describe('libellés par défaut, identiques à ceux d’avant', () => {
  it('Modal', () => {
    render(<Modal open onOpenChange={noop} title="Titre" />);
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });

  it('ConfirmDialog', () => {
    render(<ConfirmDialog open onOpenChange={noop} />);
    expect(screen.getByRole('dialog', { name: 'Confirmer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });

  it('SidePanel', () => {
    render(<SidePanel open onOpenChange={noop} />);
    expect(screen.getByRole('dialog', { name: 'Panneau' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });

  it('CommandPalette', () => {
    render(<CommandPalette open onOpenChange={noop} />);
    expect(screen.getByRole('dialog', { name: 'Palette de commandes' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Rechercher une commande' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Fermer' })).toHaveLength(2);
  });

  it('Lightbox', () => {
    render(<Lightbox open src="/image.png" alt="Une image" onOpenChange={noop} />);
    expect(screen.getByRole('dialog', { name: 'Aperçu' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Fermer' })).toHaveLength(2);
  });

  it('CookieBanner', () => {
    render(<CookieBanner storageKey={null} />);
    const region = screen.getByRole('region', { name: 'Consentement aux cookies' });
    expect(within(region).getByText('Cookies')).toBeInTheDocument();
    expect(
      within(region).getByText('Nous utilisons des cookies pour améliorer votre expérience.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refuser' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accepter' })).toBeInTheDocument();
  });

  it('Dropzone', () => {
    const { container, rerender } = render(<Dropzone maxFiles={1} />);
    expect(screen.getByText('Ajoutez vos fichiers')).toBeInTheDocument();
    expect(screen.getByText('Sélectionner des fichiers')).toBeInTheDocument();

    drop(container, [new File(['a'], 'a.txt'), new File(['b'], 'b.txt')]);
    expect(screen.getByRole('alert')).toHaveTextContent('Sélectionnez au maximum 1 fichier.');

    rerender(<Dropzone maxFiles={3} />);
    drop(
      container,
      [1, 2, 3, 4].map((n) => new File(['x'], `${n}.txt`)),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Sélectionnez au maximum 3 fichiers.');

    rerender(<Dropzone maxSizeBytes={1} />);
    drop(container, [new File(['trop long'], 'a.txt')]);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Un fichier dépasse la taille maximale de 1 octets.',
    );

    rerender(<Dropzone accept=".pdf" />);
    drop(container, [new File(['a'], 'a.txt', { type: 'text/plain' })]);
    expect(screen.getByRole('alert')).toHaveTextContent('Le type d’un fichier n’est pas accepté.');

    rerender(<Dropzone disabled />);
    expect(screen.getByText('Sélection désactivée')).toBeInTheDocument();
  });

  it('Pagination', () => {
    render(<Pagination pageCount={3} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page précédente' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page suivante' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
  });

  it('Sidebar', () => {
    render(
      <Sidebar collapsible>
        <Sidebar.Items />
        <Sidebar.Toggle />
      </Sidebar>,
    );
    expect(screen.getByRole('navigation', { name: 'Navigation latérale' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Replier le rail' }));
    expect(screen.getByRole('button', { name: 'Déplier le rail' })).toBeInTheDocument();
  });

  it('DataTable', () => {
    const { container, rerender } = render(<DataTable columns={NAME_COLUMN} />);
    expect(screen.getByText('Aucune donnée à afficher.')).toBeInTheDocument();

    rerender(<DataTable columns={NAME_COLUMN} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des données…');

    rerender(<DataTable columns={NAME_COLUMN} rows={[{ name: 'Zoé' }]} showRowCount />);
    expect(textOf(container, '.opale-table__count')).toBe('1 ligne');

    rerender(
      <DataTable columns={NAME_COLUMN} rows={[{ name: 'Zoé' }, { name: 'Åsa' }]} showRowCount />,
    );
    expect(textOf(container, '.opale-table__count')).toBe('2 lignes');

    fireEvent.click(screen.getByRole('button', { name: 'Nom' }));
    expect(screen.getByRole('status')).toHaveTextContent('Trié par Nom, ordre croissant');
    fireEvent.click(screen.getByRole('button', { name: 'Nom' }));
    expect(screen.getByRole('status')).toHaveTextContent('Trié par Nom, ordre décroissant');
  });

  it('SvgMap et ses commandes', () => {
    const { container, rerender } = render(<SvgMap viewBox="0 0 100 100" regions={REGIONS} />);
    expect(screen.getByRole('img', { name: 'Carte' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoomer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dézoomer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vue d’ensemble' })).toBeInTheDocument();
    expect(textOf(container, '.opale-svg-map__hint')).toBe('Ctrl ou ⌘ + molette pour zoomer');
    expect(screen.getByRole('img')).toHaveAccessibleDescription(
      'Flèches pour déplacer la vue, plus et moins pour zoomer, zéro pour revenir à la vue d’ensemble.',
    );

    rerender(<SvgMap viewBox="0 0 100 100" regions={REGIONS} selectable />);
    expect(screen.getByRole('group', { name: 'Carte' })).toHaveAccessibleDescription(
      'Flèches pour aller à la région voisine, Entrée pour choisir, Maj et flèches pour déplacer la vue, plus et moins pour zoomer, zéro pour revenir à la vue d’ensemble.',
    );
  });

  it('SvgMapControls seul', () => {
    render(<Controls />);
    expect(screen.getByRole('group', { name: 'Zoom' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoomer' })).toBeInTheDocument();
  });

  it('Toast et ToastProvider', () => {
    render(
      <ToastProvider>
        <Toast message="Enregistré" onOpenChange={noop} />
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));
    expect(screen.getAllByRole('button', { name: 'Fermer la notification' })).toHaveLength(2);
  });
});

/* (b) et (c) UN LIBELLÉ REMPLACÉ NE CHANGE QUE LUI, et `undefined` garde le défaut. */
describe('remplacement partiel', () => {
  it('Modal : `close` remplacé, puis `undefined` qui garde le défaut', () => {
    const labels: Partial<ModalLabels> = { close: 'Close' };
    const { rerender } = render(<Modal open onOpenChange={noop} title="T" labels={labels} />);
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();

    rerender(<Modal open onOpenChange={noop} title="T" labels={{ close: undefined }} />);
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });

  it('ConfirmDialog : seul Annuler change', () => {
    const labels: Partial<ConfirmDialogLabels> = { cancel: 'Cancel' };
    render(<ConfirmDialog open onOpenChange={noop} labels={labels} />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Confirmer' })).toBeInTheDocument();
  });

  it('ConfirmDialog : `title` gagne sur `labels.title`', () => {
    const { rerender } = render(
      <ConfirmDialog open onOpenChange={noop} labels={{ title: 'Confirm', confirm: 'OK' }} />,
    );
    expect(screen.getByRole('dialog', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();

    rerender(
      <ConfirmDialog open onOpenChange={noop} title="Supprimer ?" labels={{ title: 'Confirm' }} />,
    );
    expect(screen.getByRole('dialog', { name: 'Supprimer ?' })).toBeInTheDocument();
  });

  it('SidePanel : croix et titre par défaut', () => {
    const labels: Partial<SidePanelLabels> = { close: 'Close', title: 'Panel' };
    render(<SidePanel open onOpenChange={noop} labels={labels} />);
    expect(screen.getByRole('dialog', { name: 'Panel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('CommandPalette : titre, recherche et fermeture', () => {
    const labels: Partial<CommandPaletteLabels> = { title: 'Commands', search: 'Search' };
    render(<CommandPalette open onOpenChange={noop} labels={labels} />);
    expect(screen.getByRole('dialog', { name: 'Commands' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Fermer' })).toHaveLength(2);
  });

  it('Lightbox : `dialog` et `close`', () => {
    const labels: Partial<LightboxLabels> = { dialog: 'Preview', close: 'Close' };
    render(<Lightbox open src="/i.png" alt="Image" onOpenChange={noop} labels={labels} />);
    expect(screen.getByRole('dialog', { name: 'Preview' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2);
  });

  it('CookieBanner : seul Accepter change', () => {
    const labels: Partial<CookieBannerLabels> = { accept: 'Accept' };
    render(<CookieBanner storageKey={null} labels={labels} />);
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refuser' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Consentement aux cookies' })).toBeInTheDocument();
  });

  it('CookieBanner : région, titre et message', () => {
    render(
      <CookieBanner
        storageKey={null}
        labels={{ region: 'Cookie consent', title: 'Cookie', message: 'We use cookies.' }}
      />,
    );
    const region = screen.getByRole('region', { name: 'Cookie consent' });
    expect(within(region).getByText('Cookie')).toBeInTheDocument();
    expect(within(region).getByText('We use cookies.')).toBeInTheDocument();
  });

  it('Dropzone : invite et action, les enfants gagnent', () => {
    const labels: Partial<DropzoneLabels> = { prompt: 'Add files', select: 'Browse' };
    const { rerender } = render(<Dropzone labels={labels} />);
    expect(screen.getByText('Add files')).toBeInTheDocument();
    expect(screen.getByText('Browse')).toBeInTheDocument();

    rerender(<Dropzone labels={labels}>Vos pièces</Dropzone>);
    expect(screen.getByText('Vos pièces')).toBeInTheDocument();
  });

  it('Pagination : seul Page suivante change', () => {
    const labels: Partial<PaginationLabels> = { next: 'Next' };
    render(<Pagination pageCount={3} labels={labels} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page précédente' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('DataTable : seul le message vide change', () => {
    const labels: Partial<DataTableLabels> = { empty: 'No data.' };
    const { rerender } = render(<DataTable columns={NAME_COLUMN} labels={labels} />);
    expect(screen.getByText('No data.')).toBeInTheDocument();

    rerender(<DataTable columns={NAME_COLUMN} labels={labels} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des données…');
  });

  it('SvgMap : les commandes intégrées reçoivent leurs libellés', () => {
    const labels: Partial<SvgMapLabels> = {
      zoomIn: 'Zoom in',
      wheelHint: 'Ctrl + wheel',
      instructions: 'Arrows to pan.',
      map: 'Map',
    };
    const { container } = render(
      <SvgMap viewBox="0 0 100 100" regions={REGIONS} labels={labels} />,
    );
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dézoomer' })).toBeInTheDocument();
    expect(textOf(container, '.opale-svg-map__hint')).toBe('Ctrl + wheel');
    expect(screen.getByRole('img', { name: 'Map' })).toHaveAccessibleDescription('Arrows to pan.');
  });

  it('SvgMap : `label` gagne sur `labels.map`, et la consigne sélectionnable se remplace', () => {
    render(
      <SvgMap
        viewBox="0 0 100 100"
        regions={REGIONS}
        selectable
        label="France"
        labels={{ map: 'Map', instructionsSelectable: 'Arrows to move.' }}
      />,
    );
    expect(screen.getByRole('group', { name: 'France' })).toHaveAccessibleDescription(
      'Arrows to move.',
    );
  });

  it('SvgMapControls seul', () => {
    render(<Controls labels={{ group: 'Zoom controls', reset: 'Reset' }} />);
    expect(screen.getByRole('group', { name: 'Zoom controls' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zoomer' })).toBeInTheDocument();
  });

  it('Toast et ToastProvider', () => {
    const labels: Partial<ToastLabels> = { close: 'Dismiss' };
    render(
      <ToastProvider labels={labels}>
        <Toast message="Enregistré" onOpenChange={noop} labels={{ close: 'Close' }} />
        <Trigger />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Publier' }));
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});

/* (d) LES LIBELLÉS-FONCTIONS REÇOIVENT LEURS PARAMÈTRES. */
describe('libellés-fonctions', () => {
  it('Pagination : page(3)', () => {
    render(
      <Pagination pageCount={5} defaultValue={3} labels={{ page: (page) => `Go to ${page}` }} />,
    );
    expect(screen.getByRole('button', { name: 'Go to 3' })).toHaveAttribute('aria-current', 'page');
  });

  it('DataTable : rowCount(1) et sorted(Nom, descending)', () => {
    const { container } = render(
      <DataTable
        columns={NAME_COLUMN}
        rows={[{ name: 'Zoé' }]}
        showRowCount
        labels={{
          rowCount: (count) => `${count} row`,
          sorted: (column, direction) => `Sorted by ${column}, ${direction}`,
        }}
      />,
    );
    expect(textOf(container, '.opale-table__count')).toBe('1 row');

    fireEvent.click(screen.getByRole('button', { name: 'Nom' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nom' }));
    expect(screen.getByRole('status')).toHaveTextContent('Sorted by Nom, descending');
  });

  it('Dropzone : tooManyFiles(2) et fileTooLarge(1024)', () => {
    const labels: Partial<DropzoneLabels> = {
      tooManyFiles: (max) => `At most ${max} files.`,
      fileTooLarge: (bytes) => `Larger than ${bytes} bytes.`,
      typeRejected: 'Type rejected.',
    };
    const { container, rerender } = render(<Dropzone maxFiles={2} labels={labels} />);
    drop(
      container,
      [1, 2, 3].map((n) => new File(['x'], `${n}.txt`)),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('At most 2 files.');

    rerender(<Dropzone maxSizeBytes={1024} labels={labels} />);
    drop(container, [new File(['x'.repeat(2048)], 'big.txt')]);
    expect(screen.getByRole('alert')).toHaveTextContent('Larger than 1024 bytes.');

    rerender(<Dropzone accept=".pdf" labels={labels} />);
    drop(container, [new File(['a'], 'a.txt', { type: 'text/plain' })]);
    expect(screen.getByRole('alert')).toHaveTextContent('Type rejected.');
  });
});

/* (e) `aria-label` PASSÉ EN REST GAGNE, puis la prop de nom, puis `labels`. */
describe('priorité des noms accessibles', () => {
  it('Lightbox : `aria-label` gagne sur `labels.dialog`', () => {
    render(
      <Lightbox
        open
        src="/i.png"
        alt="Image"
        onOpenChange={noop}
        aria-label="Photo du chantier"
        labels={{ dialog: 'Preview' }}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Photo du chantier' })).toBeInTheDocument();
  });

  it('Pagination : `aria-label` > `label` > `labels.navigation`', () => {
    const { rerender } = render(<Pagination pageCount={2} labels={{ navigation: 'Pages' }} />);
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();

    rerender(<Pagination pageCount={2} label="Résultats" labels={{ navigation: 'Pages' }} />);
    expect(screen.getByRole('navigation', { name: 'Résultats' })).toBeInTheDocument();

    rerender(
      <Pagination
        pageCount={2}
        aria-label="Articles"
        label="Résultats"
        labels={{ navigation: 'Pages' }}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Articles' })).toBeInTheDocument();
  });

  it('CookieBanner : `aria-label` gagne sur `labels.region`', () => {
    render(
      <CookieBanner storageKey={null} aria-label="Vie privée" labels={{ region: 'Cookies' }} />,
    );
    expect(screen.getByRole('region', { name: 'Vie privée' })).toBeInTheDocument();
  });

  it('SvgMapControls : `aria-label` gagne sur `labels.group`', () => {
    function Named() {
      const viewport = useSvgMapViewport('0 0 100 100');
      return (
        <SvgMapControls
          viewport={viewport}
          aria-label="Loupe"
          labels={{ group: 'Zoom controls' }}
        />
      );
    }
    render(<Named />);
    expect(screen.getByRole('group', { name: 'Loupe' })).toBeInTheDocument();
  });
});

/* (f) LE RAIL TRANSMET SES LIBELLÉS PAR LE CONTEXTE. */
describe('Sidebar', () => {
  it('fait parvenir `expand` et `collapse` à `Sidebar.Toggle`', () => {
    const labels: Partial<SidebarLabels> = { expand: 'Expand', collapse: 'Collapse' };
    render(
      <Sidebar collapsible labels={labels}>
        <Sidebar.Toggle />
      </Sidebar>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument();
  });

  it('nomme `Sidebar.Items` par `labels.items`, et son `aria-label` gagne encore', () => {
    const { rerender } = render(
      <Sidebar labels={{ items: 'Side navigation' }}>
        <Sidebar.Items />
      </Sidebar>,
    );
    expect(screen.getByRole('navigation', { name: 'Side navigation' })).toBeInTheDocument();

    rerender(
      <Sidebar labels={{ items: 'Side navigation' }}>
        <Sidebar.Items aria-label="Projets" />
      </Sidebar>,
    );
    expect(screen.getByRole('navigation', { name: 'Projets' })).toBeInTheDocument();
  });

  it('garde les défauts français pour les clés omises', () => {
    render(
      <Sidebar collapsible labels={{ items: 'Side navigation' }}>
        <Sidebar.Toggle />
      </Sidebar>,
    );
    expect(screen.getByRole('button', { name: 'Replier le rail' })).toBeInTheDocument();
  });
});

/* (g) LA LANGUE DU TRI. */
describe('DataTable locale', () => {
  const rows = [{ name: 'Zoé' }, { name: 'Åsa' }, { name: 'Ärla' }];

  function sortedNames(locale?: string | readonly string[]) {
    const { container, unmount } = render(
      <DataTable
        columns={NAME_COLUMN}
        rows={rows}
        defaultSort={{ key: 'name', direction: 'ascending' }}
        locale={locale}
      />,
    );
    const names = namesOfRows(container);
    unmount();
    return names;
  }

  /* En français, les accents ne départagent pas : « arla » précède « asa ».
     En suédois, Å et Ä sont des lettres après Z. */
  it('trie en français par défaut', () => {
    expect(sortedNames()).toEqual(['Ärla', 'Åsa', 'Zoé']);
    expect(sortedNames('fr')).toEqual(['Ärla', 'Åsa', 'Zoé']);
  });

  it('trie en suédois avec `locale="sv"` ou une liste', () => {
    expect(sortedNames('sv')).toEqual(['Zoé', 'Åsa', 'Ärla']);
    expect(sortedNames(['sv', 'fr'])).toEqual(['Zoé', 'Åsa', 'Ärla']);
  });

  it('retombe sur le français sans lever sur une étiquette invalide', () => {
    expect(() => sortedNames('xx-invalid!!')).not.toThrow();
    expect(sortedNames('xx-invalid!!')).toEqual(['Ärla', 'Åsa', 'Zoé']);
  });
});

/* (h) L'ANCIEN `emptyMessage` RESTE HONORÉ, ET `labels.empty` GAGNE. */
describe('DataTable emptyMessage', () => {
  it('affiche encore `emptyMessage` seul', () => {
    render(<DataTable columns={NAME_COLUMN} emptyMessage="Rien ici." />);
    expect(screen.getByText('Rien ici.')).toBeInTheDocument();
  });

  it('laisse gagner `labels.empty`', () => {
    render(
      <DataTable columns={NAME_COLUMN} emptyMessage="Rien ici." labels={{ empty: 'Vide.' }} />,
    );
    expect(screen.getByText('Vide.')).toBeInTheDocument();
    expect(screen.queryByText('Rien ici.')).not.toBeInTheDocument();
  });
});
