import { ICON_NAMES } from '../../opale';
import type { DocPage } from '../doc-model';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';
import { IconGallery } from './icon-gallery';

/* =============================================================================
   La page « Icônes » montre le jeu complet, filtrable par un champ (nom
   anglais ou mots français), puis les conseils d'usage. Sans résultat, le
   champ le dit au lieu de vider la page.
   ========================================================================== */

const USAGE = `import { Icon } from '@thomascaron/opale-ui';

// Décorative : le libellé voisin porte le sens, l'icône est masquée.
<Icon name="map-pin" />

// Porteuse de sens : elle reçoit un nom accessible.
<Icon name="alert-triangle" label="Attention" />

// La taille suit celle du texte.
<span style={{ fontSize: '2rem' }}>
  <Icon name="compass" />
</span>`;

const POINTS = [
  'Une icône décorative est masquée aux technologies d’assistance ; c’est le défaut.',
  'Une icône qui porte seule une information reçoit un `label` — il devient son nom accessible.',
  'Une action icon-only garde un nom accessible et une cible d’au moins 44 px.',
  'La couleur accompagne le sens sans être le seul signal d’état.',
];

const TOTAL = ICON_NAMES.length;

export const iconesPage: DocPage = {
  slug: 'icones',
  label: 'Icônes',
  group: 'introduction',
  title: 'Icônes',
  lede: `Le jeu d’icônes d’Opale — ${TOTAL} tracés dessinés dans le dépôt, sans aucune librairie externe.`,
  render: () => (
    <PageBody>
      <Specimen title="Le jeu complet">
        <IconGallery />
      </Specimen>

      <Specimen title="À retenir">
        <p className="tc-doc-prose">
          Toutes les icônes partagent une grille de 24×24, un trait de 1,75 et des extrémités
          rondes. Elles sont des <strong>contours</strong> : elles prennent la couleur du texte par{' '}
          <code>currentColor</code> et grandissent avec son <code>font-size</code>. Utilisez une
          icône quand elle apporte une information ou une affordance immédiate ; les actions restent
          nommées pour les technologies d’assistance.
        </p>
        <ul className="tc-doc-checklist">
          {POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </Specimen>

      <Specimen title="Exemple">
        <UsageBlock label="Import et appels représentatifs d’Icon" code={USAGE} actions={false} />
      </Specimen>
    </PageBody>
  ),
};
