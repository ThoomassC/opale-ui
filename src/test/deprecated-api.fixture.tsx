/* UN USAGE VOLONTAIREMENT DÉPRÉCIÉ, pour prouver que
   `src/showcase/no-deprecated-api.structure.test.ts` le voit. Ce fichier n'est
   ni publié ni monté par la vitrine : il n'existe que pour ce garde. */
import {
  ConfirmDialog,
  DataTable,
  Modal,
  Opale,
  OpaleUI,
  Sidebar,
  Topbar,
  useToast,
} from '../opale';

export function DeprecatedUsage() {
  const { showToast } = useToast();
  return (
    <>
      <OpaleUI.Button onClick={() => showToast({ title: 'Publié', variant: 'default' })}>
        Publier
      </OpaleUI.Button>
      <Opale.Background />
      <ConfirmDialog open onCancel={() => undefined} />
      <Sidebar activeItemId="home" />
      <DataTable density="compact" emptyMessage="Rien." />
      <Modal open size="sm" />
      <Topbar size="spacious" />
    </>
  );
}

export const DEPRECATED_SNIPPET = `import { OpaleUI } from '@thomascaron/opale-ui';

<Opale.ConfirmDialog open onCancel={() => setOpen(false)} />
<Opale.Modal open size="lg" onClose={close} />
<Opale.Pagination pageCount={3} page={2} />`;
