import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DataTable, Dropzone, FileCard, Pagination, RatingInput, Skeleton } from './opale';

afterEach(cleanup);

describe('composants de parcours', () => {
  it('Pagination borne les actions et annonce la page courante', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={1} pageCount={8} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Page précédente' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: 'Page suivante' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('RatingInput permet un choix nommé au clavier', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RatingInput label="Qualité" defaultValue={2} onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Qualité' });
    const target = within(group).getByRole('radio', { name: '4 sur 5' });
    await user.click(target);
    expect(target).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('Skeleton reste décoratif dans une région de statut', () => {
    render(
      <div role="status" aria-label="Chargement">
        <Skeleton />
      </div>,
    );
    expect(screen.getByRole('status', { name: 'Chargement' })).toContainElement(
      document.querySelector('.opale-skeleton'),
    );
    expect(document.querySelector('.opale-skeleton')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('états opérationnels', () => {
  it('DataTable affiche chargement, vide et lignes stables', () => {
    const columns = [
      { key: 'name', label: 'Nom' },
      { key: 'note', label: 'Note' },
    ];
    const rowA = { name: 'A', note: <input aria-label="Note A" defaultValue="A" /> };
    const { rerender } = render(
      <DataTable columns={columns} rows={[rowA]} rowKey={(row) => String(row.name)} />,
    );
    const inputA = screen.getByRole('textbox', { name: 'Note A' });
    fireEvent.change(inputA, { target: { value: 'modifié' } });
    rerender(
      <DataTable
        columns={columns}
        rows={[{ name: 'X', note: 'nouveau' }, rowA]}
        rowKey={(row) => String(row.name)}
      />,
    );
    expect(screen.getByRole('textbox', { name: 'Note A' })).toBe(inputA);
    expect(inputA).toHaveValue('modifié');
    rerender(<DataTable columns={columns} rows={[]} />);
    expect(screen.getByText('Aucune donnée à afficher.')).toBeInTheDocument();
    rerender(<DataTable columns={columns} rows={[]} loading />);
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des données');
  });

  it('Dropzone rejette les fichiers invalides et accepte les fichiers valides', () => {
    const onFiles = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <Dropzone
        accept="image/*"
        maxFiles={1}
        maxSizeBytes={100}
        onFiles={onFiles}
        onError={onError}
      />,
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(['pdf'], 'brief.pdf', { type: 'application/pdf' })] },
    });
    expect(onFiles).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('type');
    fireEvent.change(input, {
      target: { files: [new File(['ok'], 'visuel.png', { type: 'image/png' })] },
    });
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });

  it('FileCard devient une action uniquement quand onClick est fourni', () => {
    const { rerender } = render(<FileCard name="plan.pdf" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    rerender(<FileCard name="plan.pdf" selected />);
    expect(screen.getByText('Sélectionné')).toBeInTheDocument();
    rerender(<FileCard name="plan.pdf" selected onClick={() => undefined} />);
    expect(screen.getByRole('button', { name: 'plan.pdf' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});
