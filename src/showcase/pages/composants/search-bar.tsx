import { SearchBar } from '../../../magic';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MaterialSwitch } from './material-switch';
import { MagicPreamble } from './stage';

const USAGE = `import { SearchBar } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

<SearchBar placeholder="Un voyage, un lieu, un pays…" />`;

const PROPS: readonly PropRow[] = [
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: 'Taille du texte dans la barre.',
  },
  {
    name: 'enableClickAnimation',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Active la déformation liquide au clic.',
  },
  {
    name: '…ComponentPropsWithoutRef<"input">',
    type: 'union (sans size)',
    description: 'Les attributs et événements natifs de l’input.',
  },
];

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `search-bar.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function SearchBarContent() {
  return (
    <PageBody>
      <MagicPreamble />
      <UsageBlock label="Import et appel de SearchBar" code={USAGE} />

      <Specimen title="Barre de recherche">
        <MaterialSwitch name="SearchBar">
          {(liquidGlass) => (
            <div style={{ width: '100%', maxWidth: '36rem' }}>
              <SearchBar
                liquidGlass={liquidGlass}
                placeholder="Un voyage, un lieu, un pays…"
                aria-label="Rechercher"
              />
            </div>
          )}
        </MaterialSwitch>
      </Specimen>

      <PropsTable id="magic-search-bar" rows={PROPS} />
    </PageBody>
  );
}
