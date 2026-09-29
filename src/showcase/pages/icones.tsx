import { ICON_NAMES } from '../../opale';
import type { DocPage } from '../doc-model';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';
import { IconGallery } from './icon-gallery';

/* =============================================================================
   LA PAGE « ICÔNES » MONTRE LE JEU, ELLE NE LE RACONTE PLUS.

   Elle était une page de GUIDE : trois conseils, un exemple d'une ligne, et
   pas une seule icône affichée. On y lisait `<Opale.Icon name="check" />`
   sans pouvoir savoir à quoi ressemblait `check`, ni quels autres noms
   existaient — la réponse, à l'époque, étant « aucun » : le composant rendait
   le caractère qu'on lui passait.

   LES CONSEILS RESTENT APRÈS LA GALERIE. Ils disent quand une icône se suffit
   et quand elle doit être accompagnée d'un nom accessible ; la recherche et
   les tracés sont visibles dès l'arrivée sur la page.

   LE FILTRE EST UN CHAMP, PAS UN ONGLET PAR FAMILLE. Avec plus de cent vingt
   dessins, ce qu'on cherche est « quelque chose comme une valise » : on tape
   trois lettres. Les familles restent visibles pour parcourir sans idée
   précise. Le champ NE VIDE PAS LA PAGE quand rien ne correspond — il le dit,
   parce qu'une grille vide se lit comme un défaut d'affichage.
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
