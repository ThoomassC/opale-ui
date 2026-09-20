import type { DocPage } from '../doc-model';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';

interface GuidePageOptions {
  readonly slug: string;
  readonly label: string;
  readonly title: string;
  readonly lede: string;
  readonly overview: string;
  readonly code: string;
  readonly points: readonly string[];
}

function guidePage(options: GuidePageOptions): DocPage {
  return {
    slug: options.slug,
    label: options.label,
    group: 'introduction',
    title: options.title,
    lede: options.lede,
    render: () => (
      <PageBody>
        <Specimen title="À retenir">
          <p className="tc-doc-prose">{options.overview}</p>
          <ul className="tc-doc-checklist">
            {options.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </Specimen>
        <Specimen title="Exemple">
          <UsageBlock label="Point de départ" code={options.code} />
        </Specimen>
      </PageBody>
    ),
  };
}

/** Page de prise en main conservée pour reprendre le plan exact de la référence. */
export const utilisationPage = guidePage({
  slug: 'utilisation',
  label: 'Utilisation',
  title: 'Utilisation',
  lede: 'Composez une page Opale en partant des primitives et des composants dont vous avez besoin.',
  overview:
    'Chaque composant peut être utilisé indépendamment. Les exemples de la documentation restent interactifs afin de comparer les états et les variantes directement dans la page.',
  code: "import { Opale } from '@thomascaron/opale-ui';",
  points: [
    'Commencez par une primitive de mise en page, puis ajoutez les composants métier.',
    'Conservez les libellés visibles et les états de focus dans chaque composition.',
    'Activez Liquid Glass localement sur le composant à comparer.',
  ],
});

export const themingPage = guidePage({
  slug: 'theming',
  label: 'Theming',
  title: 'Theming',
  lede: 'Le thème clair, le thème sombre et le matériau Liquid Glass partagent les mêmes composants.',
  overview:
    'Le thème global règle la lumière de l’interface. Le matériau Liquid Glass reste un choix local : il se déclenche composant par composant dans les spécimens de la vitrine.',
  code: '<Opale.Card liquidGlass title="Surface locale" />',
  points: [
    'Le soleil et la lune changent uniquement le thème global de la documentation.',
    'Le mode Liquid Glass ne modifie pas les autres composants de la page.',
    'Les tokens de couleur restent la source de vérité des deux thèmes.',
  ],
});

export const iconesPage = guidePage({
  slug: 'icones',
  label: 'Icônes',
  title: 'Icônes',
  lede: 'Les icônes renforcent la compréhension sans remplacer un libellé ni une action explicite.',
  overview:
    'Utilisez une icône quand elle apporte une information ou une affordance immédiate. Les actions restent nommées pour les technologies d’assistance.',
  code: '<Opale.Icon name="check" aria-label="Validé" />',
  points: [
    'Une icône décorative est masquée aux technologies d’assistance.',
    'Une action icon-only reçoit un nom accessible et une cible confortable.',
    'La couleur accompagne le sens sans être le seul signal d’état.',
  ],
});
