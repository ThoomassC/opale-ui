import { SearchBar } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MagicPreamble, MagicStage } from './stage';

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

export const searchBarPage: DocPage = {
  slug: 'composants/search-bar',
  label: 'SearchBar',
  group: 'composants',
  title: 'SearchBar',
  lede: 'Une barre de recherche liquid glass autonome, extraite de SiteNav.',
  render: () => (
    <PageBody>
      <MagicPreamble />
      <UsageBlock label="Import et appel de SearchBar" code={USAGE} />

      <Specimen title="Barre de recherche">
        <MagicStage>
          <div style={{ width: '100%', maxWidth: '36rem' }}>
            <SearchBar placeholder="Un voyage, un lieu, un pays…" aria-label="Rechercher" />
          </div>
        </MagicStage>
      </Specimen>

      <PropsTable id="magic-search-bar" rows={PROPS} />
    </PageBody>
  ),
};
