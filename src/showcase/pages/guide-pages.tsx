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
        {/* LE CODE EST OUVERT ET SANS COMMANDES SUR LES TROIS GUIDES.

            Ces pages ne montrent qu'UNE ligne, et cette ligne EST le propos de
            la page : la replier derrière « Afficher le code » demandait un clic
            pour lire ce qu'on était venu lire. La barre disparaît avec le
            repli — un bouton « Masquer » n'a plus d'objet quand rien ne peut
            être masqué, et « Copier » part avec lui : trois mots se
            sélectionnent à la souris. Le catalogue, lui, garde les deux : chez
            lui les exemples sont longs, nombreux, et rarement ce qu'on vient
            chercher. */}
        <Specimen title="Exemple">
          <UsageBlock label="Point de départ" code={options.code} actions={false} />
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

/* « THEMING » ÉTAIT LE SEUL ANGLICISME DES LIBELLÉS DE NAVIGATION, et il ne
   disait pas grand-chose : le mot désigne en anglais le fait de décliner une
   interface en plusieurs thèmes. Le libellé français dit la même chose sans
   demander de traduction — « Thèmes ». LE SLUG NE BOUGE PAS : `#/theming` est
   déjà dans des signets et dans les tables de traduction, et le renommer
   casserait ces adresses pour un gain nul, l'adresse n'étant pas lue. */
export const themingPage = guidePage({
  slug: 'theming',
  label: 'Thèmes',
  title: 'Thèmes',
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
