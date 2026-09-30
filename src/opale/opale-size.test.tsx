import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { DataTable } from './opale';
import { expectOnlyDeprecationWarnings } from '../test/deprecation-warnings';

/* Ce fichier croise l'ancienne API : ses avertissements sont attendus. */
expectOnlyDeprecationWarnings();

/* =============================================================================
   L'ÉCHELLE `small | medium | large` SUR DATATABLE. `density` reste acceptée :
   `compact` y vaut `small`, `comfortable` y vaut `medium`.
   ========================================================================== */

afterEach(cleanup);

const COLUMNS = [{ key: 'city', label: 'Ville' }];
const ROWS = [{ city: 'Lyon' }];

describe('DataTable — size', () => {
  it('devrait resserrer la table avec size="small" comme avec density="compact"', () => {
    const { unmount } = render(<DataTable columns={COLUMNS} rows={ROWS} size="small" />);
    const canonical = screen.getByRole('table').className;
    unmount();

    render(<DataTable columns={COLUMNS} rows={ROWS} density="compact" />);

    expect(screen.getByRole('table')).toHaveClass('opale-table--compact');
    expect(screen.getByRole('table').className).toBe(canonical);
  });

  it('devrait faire gagner size sur density', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} size="medium" density="compact" />);

    expect(screen.getByRole('table')).not.toHaveClass('opale-table--compact');
  });

  it('devrait garder medium par défaut', () => {
    render(<DataTable columns={COLUMNS} rows={ROWS} />);

    expect(screen.getByRole('table')).not.toHaveClass('opale-table--compact');
  });
});
