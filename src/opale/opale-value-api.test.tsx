import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CommandPalette,
  DataTable,
  MultiSelect,
  Navbar,
  Pagination,
  RatingInput,
  SegmentedControl,
  type DataTableSort,
} from './opale';

/* =============================================================================
   LE TRIPLET `value / defaultValue / onValueChange`.

   Chaque composant qui porte une valeur l'expose sous ces trois noms. Les
   anciens noms restent acceptés ; ces tests couvrent le nom canonique, et la
   règle quand l'appelant passe les deux : la valeur canonique gagne, les deux
   rappels partent, le canonique d'abord.
   ========================================================================== */

afterEach(cleanup);

const OPTIONS = [
  { value: 'jour', label: 'Jour' },
  { value: 'semaine', label: 'Semaine' },
  { value: 'mois', label: 'Mois' },
];

describe('SegmentedControl', () => {
  it('devrait presser l’option par défaut et la déplacer sans parent', () => {
    render(<SegmentedControl options={OPTIONS} defaultValue="semaine" />);

    expect(screen.getByRole('button', { name: 'Semaine' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Mois' }));

    expect(screen.getByRole('button', { name: 'Mois' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Semaine' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('devrait figer la sélection quand value est passée', () => {
    const onValueChange = vi.fn();
    render(<SegmentedControl options={OPTIONS} value="jour" onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mois' }));

    expect(onValueChange).toHaveBeenCalledWith('mois');
    expect(screen.getByRole('button', { name: 'Jour' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('devrait ne rien presser quand value ne désigne aucune option', () => {
    render(<SegmentedControl options={OPTIONS} value="" defaultValue="jour" />);

    fireEvent.click(screen.getByRole('button', { name: 'Mois' }));

    for (const button of screen.getAllByRole('button')) {
      expect(button).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('devrait appeler onValueChange puis l’onChange déprécié', () => {
    const calls: string[] = [];
    render(
      <SegmentedControl
        options={OPTIONS}
        defaultValue="jour"
        onValueChange={(value) => calls.push(`onValueChange:${value}`)}
        onChange={(value) => calls.push(`onChange:${value}`)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Jour' }));

    expect(calls).toEqual(['onValueChange:jour', 'onChange:jour']);
  });
});

describe('CommandPalette', () => {
  it('devrait laisser taper dans la recherche sans value', () => {
    const onValueChange = vi.fn();
    render(<CommandPalette open onValueChange={onValueChange} />);

    const search = screen.getByRole('searchbox', { name: 'Rechercher une commande' });
    fireEvent.change(search, { target: { value: 'ouvrir' } });

    expect(search).toHaveValue('ouvrir');
    expect(onValueChange).toHaveBeenCalledWith('ouvrir');
  });

  it('devrait partir de defaultValue', () => {
    render(<CommandPalette open defaultValue="thème" />);

    expect(screen.getByRole('searchbox', { name: 'Rechercher une commande' })).toHaveValue('thème');
  });

  it('devrait garder la valeur contrôlée et appeler les deux rappels, le canonique d’abord', () => {
    const calls: string[] = [];
    render(
      <CommandPalette
        open
        value="a"
        onValueChange={(value) => calls.push(`onValueChange:${value}`)}
        onChange={(value) => calls.push(`onChange:${value}`)}
      />,
    );

    const search = screen.getByRole('searchbox', { name: 'Rechercher une commande' });
    fireEvent.change(search, { target: { value: 'ab' } });

    expect(search).toHaveValue('a');
    expect(calls).toEqual(['onValueChange:ab', 'onChange:ab']);
  });
});

describe('Pagination', () => {
  const current = () =>
    screen.getAllByRole('button').find((button) => button.getAttribute('aria-current') === 'page');

  it('devrait partir de defaultValue et avancer sans parent', () => {
    const onValueChange = vi.fn();
    render(<Pagination pageCount={5} defaultValue={2} onValueChange={onValueChange} />);

    expect(current()).toHaveAccessibleName('Page 2');

    fireEvent.click(screen.getByRole('button', { name: 'Page suivante' }));

    expect(current()).toHaveAccessibleName('Page 3');
    expect(onValueChange).toHaveBeenCalledWith(3);
  });

  it('devrait lire page comme un alias de value', () => {
    render(<Pagination pageCount={5} page={4} />);

    expect(current()).toHaveAccessibleName('Page 4');
  });

  it('devrait faire gagner value sur page', () => {
    render(<Pagination pageCount={5} value={2} page={4} />);

    expect(current()).toHaveAccessibleName('Page 2');
  });

  it('devrait appeler onValueChange puis l’onChange déprécié', () => {
    const calls: string[] = [];
    render(
      <Pagination
        pageCount={5}
        value={1}
        onValueChange={(page) => calls.push(`onValueChange:${page}`)}
        onChange={(page) => calls.push(`onChange:${page}`)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Page 5' }));

    expect(calls).toEqual(['onValueChange:5', 'onChange:5']);
    expect(current()).toHaveAccessibleName('Page 1');
  });

  it('devrait commencer à la page 1 sans aucune valeur', () => {
    render(<Pagination pageCount={3} />);

    expect(current()).toHaveAccessibleName('Page 1');
  });
});

describe('RatingInput', () => {
  it('devrait appeler onValueChange puis l’onChange déprécié', () => {
    const calls: string[] = [];
    render(
      <RatingInput
        label="Note"
        onValueChange={(value) => calls.push(`onValueChange:${value}`)}
        onChange={(value) => calls.push(`onChange:${value}`)}
      />,
    );

    fireEvent.click(screen.getByRole('radio', { name: '4 sur 5' }));

    expect(calls).toEqual(['onValueChange:4', 'onChange:4']);
    expect(screen.getByRole('radio', { name: '4 sur 5' })).toBeChecked();
  });

  it('devrait garder la note contrôlée', () => {
    const onValueChange = vi.fn();
    render(<RatingInput label="Note" value={2} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('radio', { name: '5 sur 5' }));

    expect(onValueChange).toHaveBeenCalledWith(5);
    expect(screen.getByRole('radio', { name: '2 sur 5' })).toBeChecked();
  });
});

describe('MultiSelect', () => {
  const CITIES = [
    { value: 'paris', label: 'Paris' },
    { value: 'lyon', label: 'Lyon' },
    { value: 'lille', label: 'Lille' },
  ];

  it('devrait faire gagner value sur values', () => {
    render(<MultiSelect label="Villes" options={CITIES} value={['lyon']} values={['paris']} />);

    expect(screen.getByRole('option', { name: 'Lyon' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: 'Paris' })).toHaveAttribute('aria-selected', 'false');
  });

  it('devrait appeler onValueChange avec la sélection complète, puis l’onChange natif', () => {
    const calls: string[] = [];
    function Harness() {
      const [value, setValue] = useState<string[]>(['paris']);
      return (
        <MultiSelect
          label="Villes"
          options={CITIES}
          value={value}
          onValueChange={(next) => {
            calls.push(`onValueChange:${next.join(',')}`);
            setValue(next);
          }}
          onChange={(event) => calls.push(`onChange:${event.currentTarget.selectedOptions.length}`)}
        />
      );
    }
    render(<Harness />);

    fireEvent.click(screen.getByRole('option', { name: 'Lille' }));

    expect(calls).toEqual(['onValueChange:paris,lille', 'onChange:2']);
    expect(screen.getByRole('option', { name: 'Lille' })).toHaveAttribute('aria-selected', 'true');
  });

  it('devrait garder la sélection contrôlée quand le parent ne la change pas', () => {
    const onValueChange = vi.fn();
    render(
      <MultiSelect label="Villes" options={CITIES} value={[]} onValueChange={onValueChange} />,
    );

    fireEvent.click(screen.getByRole('option', { name: 'Paris' }));

    expect(onValueChange).toHaveBeenCalledWith(['paris']);
    expect(screen.getByRole('option', { name: 'Paris' })).toHaveAttribute('aria-selected', 'false');
  });

  it('devrait accepter encore une chaîne seule en defaultValue', () => {
    render(<MultiSelect label="Villes" options={CITIES} defaultValue="lyon" />);

    expect(screen.getByRole('option', { name: 'Lyon' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('DataTable', () => {
  const COLUMNS = [{ key: 'city', label: 'Ville', sortable: true }];
  const ROWS = [{ city: 'Lyon' }, { city: 'Amiens' }, { city: 'Nantes' }];
  const cities = () =>
    screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getByRole('cell').textContent);

  it('devrait suivre le tri contrôlé et non le clic', () => {
    const onSortChange = vi.fn();
    render(<DataTable columns={COLUMNS} rows={ROWS} sort={null} onSortChange={onSortChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ville' }));

    expect(onSortChange).toHaveBeenCalledWith({ key: 'city', direction: 'ascending' });
    expect(cities()).toEqual(['Lyon', 'Amiens', 'Nantes']);
    expect(screen.getByRole('columnheader')).not.toHaveAttribute('aria-sort');
  });

  it('devrait trier selon la prop sort', () => {
    render(
      <DataTable columns={COLUMNS} rows={ROWS} sort={{ key: 'city', direction: 'descending' }} />,
    );

    expect(cities()).toEqual(['Nantes', 'Lyon', 'Amiens']);
    expect(screen.getByRole('columnheader')).toHaveAttribute('aria-sort', 'descending');
  });

  it('devrait annoncer le tri résolu, et le suivre quand sort change', () => {
    function Harness() {
      const [sort, setSort] = useState<DataTableSort | null>(null);
      return (
        <>
          <DataTable columns={COLUMNS} rows={ROWS} sort={sort} onSortChange={() => undefined} />
          <button type="button" onClick={() => setSort({ key: 'city', direction: 'descending' })}>
            Trier ailleurs
          </button>
        </>
      );
    }
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Ville' }));

    /* L'appelant a refusé le tri demandé : rien n'est annoncé comme trié. */
    expect(screen.getByRole('status')).toHaveTextContent('');

    fireEvent.click(screen.getByRole('button', { name: 'Trier ailleurs' }));

    expect(screen.getByRole('status')).toHaveTextContent('Trié par Ville, ordre décroissant');
  });
});

describe('Navbar', () => {
  const ITEMS = [
    { id: 'accueil', label: 'Accueil' },
    { id: 'profil', label: 'Profil' },
    { id: 'aide', label: 'Aide', href: '/aide' },
  ];

  it('devrait partir de defaultValue et suivre le clic sans parent', () => {
    const onValueChange = vi.fn();
    render(<Navbar items={ITEMS} defaultValue="accueil" onValueChange={onValueChange} />);

    expect(screen.getByRole('button', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: 'Profil' }));

    expect(onValueChange).toHaveBeenCalledWith('profil');
    expect(screen.getByRole('button', { name: 'Profil' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Accueil' })).not.toHaveAttribute('aria-current');
  });

  it('devrait garder la valeur contrôlée', () => {
    render(<Navbar items={ITEMS} value="accueil" />);

    fireEvent.click(screen.getByRole('button', { name: 'Profil' }));

    expect(screen.getByRole('button', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page');
  });

  it('devrait honorer encore activeId et onSelect, après les noms canoniques', () => {
    const calls: string[] = [];
    render(
      <Navbar
        items={ITEMS}
        activeId="profil"
        onValueChange={(id) => calls.push(`onValueChange:${id}`)}
        onSelect={(id) => calls.push(`onSelect:${id}`)}
      />,
    );

    expect(screen.getByRole('button', { name: 'Profil' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: 'Accueil' }));

    expect(calls).toEqual(['onValueChange:accueil', 'onSelect:accueil']);
  });

  it('devrait faire gagner value sur activeId', () => {
    render(<Navbar items={ITEMS} value="accueil" activeId="profil" />);

    expect(screen.getByRole('button', { name: 'Accueil' })).toHaveAttribute('aria-current', 'page');
  });

  it('ne devrait pas appeler onValueChange depuis un lien', () => {
    const onValueChange = vi.fn();
    render(<Navbar items={ITEMS} onValueChange={onValueChange} />);

    const link = screen.getByRole('link', { name: 'Aide' });
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
