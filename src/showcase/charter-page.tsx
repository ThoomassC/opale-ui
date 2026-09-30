import { DocShell } from './doc-shell';
import { PAGES } from './pages';

/**
 * La vitrine de `@thomascaron/opale-ui` : marie le registre des pages à la
 * coquille. `main.tsx` importe `CharterPage`, d'où le nom.
 */
export function CharterPage() {
  return <DocShell pages={PAGES} />;
}
