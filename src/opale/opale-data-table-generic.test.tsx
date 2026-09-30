import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DataTable, type DataTableColumn, type DataTableRowId } from './opale';

/* =============================================================================
   LA TABLE PREND DES DONNÉES MÉTIER (DX-07).

   Les lignes étaient des `Record<string, ReactNode>` : un `Date` ou un montant
   devait être converti en nœud avant d'entrer, et `sortValue` recevait ces
   nœuds au lieu de la donnée. La table est désormais générique : `cell` rend
   la cellule depuis la ligne typée, `sortValue` trie sur la donnée, et une
   sélection de lignes optionnelle s'appuie sur la case d'Opale.
   ========================================================================== */

afterEach(cleanup);

interface Invoice {
  id: string;
  client: string;
  amount: number;
  issuedAt: Date;
}

const INVOICES: readonly Invoice[] = [
  { id: 'f-1', client: 'Brun', amount: 1200, issuedAt: new Date('2026-03-01') },
  { id: 'f-2', client: 'Arnaud', amount: 80, issuedAt: new Date('2026-01-15') },
  { id: 'f-3', client: 'Colin', amount: 450, issuedAt: new Date('2026-02-10') },
];

const COLUMNS: readonly DataTableColumn<Invoice>[] = [
  { key: 'client', label: 'Client', sortable: true, cell: (row) => row.client },
  {
    key: 'amount',
    label: 'Montant',
    sortable: true,
    sortValue: (row) => row.amount,
    cell: (row) => `${row.amount} €`,
  },
  {
    key: 'issuedAt',
    label: 'Émise le',
    sortable: true,
    sortValue: (row) => row.issuedAt.getTime(),
    cell: (row) => row.issuedAt.toISOString().slice(0, 10),
  },
];

const bodyRows = () => within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row');
const firstCells = () =>
  bodyRows().map((row) => within(row).getAllByRole('cell')[0]?.textContent ?? '');

describe('DataTable générique', () => {
  it('rend chaque cellule par `cell`, depuis la ligne typée', () => {
    render(<DataTable rows={INVOICES} columns={COLUMNS} getRowId={(row) => row.id} />);

    expect(screen.getByRole('cell', { name: '1200 €' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '2026-01-15' })).toBeInTheDocument();
  });

  it('passe l’indice d’origine à `cell`', () => {
    const cell = vi.fn((row: Invoice, index: number) => `${index}:${row.id}`);
    render(<DataTable rows={INVOICES} columns={[{ key: 'id', label: 'Id', cell }]} />);

    expect(firstCells()).toEqual(['0:f-1', '1:f-2', '2:f-3']);
  });

  it('trie sur la donnée par `sortValue`, pas sur le nœud rendu', () => {
    render(<DataTable rows={INVOICES} columns={COLUMNS} />);

    fireEvent.click(screen.getByRole('button', { name: /Émise le/ }));
    expect(firstCells()).toEqual(['Arnaud', 'Colin', 'Brun']);

    fireEvent.click(screen.getByRole('button', { name: /Montant/ }));
    expect(firstCells()).toEqual(['Arnaud', 'Colin', 'Brun']);
    fireEvent.click(screen.getByRole('button', { name: /Montant/ }));
    expect(firstCells()).toEqual(['Brun', 'Colin', 'Arnaud']);
  });

  it('ne plante pas sur une valeur qui n’est pas un nœud React sans `cell`', () => {
    render(
      <DataTable
        rows={INVOICES}
        columns={[
          { key: 'client', label: 'Client' },
          { key: 'issuedAt', label: 'Date' },
        ]}
      />,
    );

    expect(firstCells()).toEqual(['Brun', 'Arnaud', 'Colin']);
    expect(within(bodyRows()[0]).getAllByRole('cell')[1]).toBeEmptyDOMElement();
  });

  it('garde les lignes `Record` d’avant, sans paramètre de type', () => {
    render(
      <DataTable
        columns={[{ key: 'name', label: 'Nom', sortable: true }]}
        rows={[{ name: 'Bouton' }, { name: <strong>Avatar</strong> }]}
      />,
    );

    expect(firstCells()).toEqual(['Bouton', 'Avatar']);
  });
});

describe('DataTable — sélection de lignes', () => {
  it('n’ajoute aucune colonne sans `selectable`', () => {
    render(<DataTable rows={INVOICES} columns={COLUMNS} />);

    expect(screen.queryAllByRole('checkbox')).toEqual([]);
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
  });

  it('nomme la case d’en-tête et chaque case de ligne', () => {
    render(<DataTable rows={INVOICES} columns={COLUMNS} getRowId={(row) => row.id} selectable />);

    expect(
      screen.getByRole('checkbox', { name: 'Sélectionner toutes les lignes' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Sélectionner Brun' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Sélectionner Arnaud' })).toBeInTheDocument();
  });

  it('sélectionne une ligne et rend les identifiants', () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <DataTable
        rows={INVOICES}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        selectable
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner Arnaud' }));

    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['f-2']);
    expect(screen.getByRole('checkbox', { name: 'Sélectionner Arnaud' })).toBeChecked();
    expect(bodyRows()[1]).toHaveAttribute('data-selected', 'true');
  });

  it('passe la case d’en-tête à l’état mixte quand une partie est cochée', () => {
    render(
      <DataTable
        rows={INVOICES}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        selectable
        defaultSelectedIds={['f-1']}
      />,
    );
    const all = screen.getByRole<HTMLInputElement>('checkbox', {
      name: 'Sélectionner toutes les lignes',
    });

    expect(all.indeterminate).toBe(true);
    expect(all).not.toBeChecked();
  });

  it('coche tout, puis décoche tout, depuis l’en-tête', () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <DataTable
        rows={INVOICES}
        columns={COLUMNS}
        getRowId={(row) => row.id}
        selectable
        defaultSelectedIds={['f-3']}
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );
    const all = screen.getByRole<HTMLInputElement>('checkbox', {
      name: 'Sélectionner toutes les lignes',
    });

    fireEvent.click(all);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(['f-3', 'f-1', 'f-2']);
    expect(all).toBeChecked();
    expect(all.indeterminate).toBe(false);

    fireEvent.click(all);
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([]);
  });

  it('suit `selectedIds` en mode contrôlé', () => {
    function Controlled() {
      const [ids, setIds] = useState<readonly DataTableRowId[]>([]);
      return (
        <>
          <output>{ids.join(',')}</output>
          <DataTable
            rows={INVOICES}
            columns={COLUMNS}
            getRowId={(row) => row.id}
            selectable
            selectedIds={ids}
            onSelectedIdsChange={(next) => setIds(next.filter((id) => id !== 'f-2'))}
          />
        </>
      );
    }
    render(<Controlled />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner toutes les lignes' }));

    expect(document.querySelector('output')).toHaveTextContent('f-1,f-3');
    expect(screen.getByRole('checkbox', { name: 'Sélectionner Arnaud' })).not.toBeChecked();
  });

  it('retombe sur l’indice d’origine sans `getRowId`, stable au tri', () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <DataTable
        rows={INVOICES}
        columns={COLUMNS}
        selectable
        onSelectedIdsChange={onSelectedIdsChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Client/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sélectionner Arnaud' }));

    expect(onSelectedIdsChange).toHaveBeenLastCalledWith([1]);
  });

  it('étend la cellule d’état à la colonne de sélection', () => {
    render(<DataTable rows={[]} columns={COLUMNS} selectable />);

    expect(screen.getByRole('cell')).toHaveAttribute('colspan', '4');
    expect(screen.getByRole('checkbox', { name: 'Sélectionner toutes les lignes' })).toBeDisabled();
  });

  it('prend ses textes dans `labels`', () => {
    render(
      <DataTable
        rows={INVOICES}
        columns={COLUMNS}
        selectable
        labels={{ selectAll: 'Select all rows', selectRow: 'Select' }}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Brun' })).toBeInTheDocument();
  });
});

/* EN 3.9, UNE CELLULE RENDAIT TOUT `ReactNode`. Un portail ou un itérable qui
   n'est pas un tableau doivent donc toujours s'afficher sans `cell`. */
describe('DataTable — les ReactNode de la 3.9 restent affichés', () => {
  it('devrait rendre un portail et un itérable dans une cellule', () => {
    const host = document.createElement('div');
    document.body.append(host);
    render(
      <DataTable
        caption="Compat"
        columns={[
          { key: 'portal', label: 'Portail' },
          { key: 'set', label: 'Itérable' },
        ]}
        rows={[{ portal: createPortal(<b>dans le portail</b>, host), set: new Set(['a', 'b']) }]}
      />,
    );
    expect(host).toHaveTextContent('dans le portail');
    expect(screen.getByRole('table')).toHaveTextContent('ab');
    host.remove();
  });
});
