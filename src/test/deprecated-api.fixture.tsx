/* UN USAGE VOLONTAIREMENT DÉPRÉCIÉ OU RETIRÉ, pour prouver que
   `src/showcase/no-deprecated-api.structure.test.ts` le voit. Ce fichier n'est
   ni publié ni monté par la vitrine : il n'existe que pour ce garde.

   Le code ne garde que ce qui compile encore — les tailles héritées,
   dépréciées sans être retirées. Les noms retirés en 4.0.0 ne compilent plus :
   ils ne survivent que dans un extrait, du texte, et c'est là qu'on les
   cherche. */
import { Modal, Topbar } from '../opale';

export function DeprecatedUsage() {
  return (
    <>
      <Modal open size="sm" />
      <Topbar size="spacious" />
    </>
  );
}

export const DEPRECATED_SNIPPET = `import { OpaleUI, type FieldProps } from '@thomascaron/opale-ui';

const { showToast } = useToast();
showToast({ title: 'Publié', variant: 'default' });

<Opale.Background />
<Opale.ConfirmDialog open onCancel={() => setOpen(false)} />
<Opale.Modal open size="lg" onClose={close} />
<Opale.Pagination pageCount={3} page={2} />
<Sidebar activeItemId="home" />
<DataTable density="compact" emptyMessage="Rien." />`;
