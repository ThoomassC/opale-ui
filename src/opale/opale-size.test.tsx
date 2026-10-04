import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DataTable } from './opale';

/* =============================================================================
   L'ÉCHELLE `small | medium | large` SUR DATATABLE. L'ancien `density` a été
   retiré en 4.0.0.
   ========================================================================== */

afterEach(cleanup);

const COLUMNS = [{ key: 'city', label: 'Ville' }];
const ROWS = [{ city: 'Lyon' }];

describe('DataTable — size', () => {
  it('devrait resserrer la table avec size="small"', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} size="small" />);

    expect(screen.getByRole('table')).toHaveClass('opale-table--compact');
  });

  it('ne devrait pas la resserrer avec size="medium"', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} size="medium" />);

    expect(screen.getByRole('table')).not.toHaveClass('opale-table--compact');
  });

  it('devrait garder medium par défaut', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByRole('table')).not.toHaveClass('opale-table--compact');
  });
});
