import { useEffect, useMemo, useState } from 'react';

import { ICON_GROUPS, ICON_KEYWORDS, ICON_NAMES, Opale } from '../../magic';
import type { DocPage } from '../doc-model';
import { Specimen } from '../section';
import { PageBody, UsageBlock } from './api';

/* =============================================================================
   LA PAGE « ICÔNES » MONTRE LE JEU, ELLE NE LE RACONTE PLUS.

   Elle était une page de GUIDE : trois conseils, un exemple d'une ligne, et
   pas une seule icône affichée. On y lisait `<Opale.Icon name="check" />`
   sans pouvoir savoir à quoi ressemblait `check`, ni quels autres noms
   existaient — la réponse, à l'époque, étant « aucun » : le composant rendait
   le caractère qu'on lui passait.

   LES CONSEILS RESTENT, EN TÊTE. Ils ne coûtent rien et disent quelque chose
   qu'une grille ne dit pas : quand une icône se suffit, et quand elle doit
   être accompagnée d'un nom accessible.

   LE FILTRE EST UN CHAMP, PAS UN ONGLET PAR FAMILLE. Avec plus de cent vingt
   dessins, ce qu'on cherche est « quelque chose comme une valise » : on tape
   trois lettres. Les familles restent visibles pour parcourir sans idée
   précise. Le champ NE VIDE PAS LA PAGE quand rien ne correspond — il le dit,
   parce qu'une grille vide se lit comme un défaut d'affichage.
   ========================================================================== */

const USAGE = `import { Opale } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// Décorative : le libellé voisin porte le sens, l'icône est masquée.
<Opale.Icon name="map-pin" />

// Porteuse de sens : elle reçoit un nom accessible.
<Opale.Icon name="alert-triangle" label="Attention" />

// La taille suit celle du texte.
<span style={{ fontSize: '2rem' }}>
  <Opale.Icon name="compass" />
</span>`;

const POINTS = [
  'Une icône décorative est masquée aux technologies d’assistance ; c’est le défaut.',
  'Une icône qui porte seule une information reçoit un `label` — il devient son nom accessible.',
  'Une action icon-only garde un nom accessible et une cible d’au moins 44 px.',
  'La couleur accompagne le sens sans être le seul signal d’état.',
];

/**
 * Le délai avant que le compte filtré ne soit annoncé.
 *
 * LA RÉGION LIVE PARLAIT À CHAQUE FRAPPE : taper « flèche » produisait six
 * annonces polies à la file, que le lecteur d'écran débite l'une après
 * l'autre. Ce qui intéresse, c'est le compte quand la frappe s'arrête. Le
 * texte AFFICHÉ, lui, suit immédiatement — c'est seulement ce qui est ANNONCÉ
 * qui attend.
 */
const ANNOUNCE_DELAY_MS = 400;

/** L'accent et la casse ne doivent pas faire échouer une recherche. */
function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const TOTAL = ICON_NAMES.length;

function IconGallery() {
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const needle = fold(query.trim());
    if (!needle) return ICON_GROUPS;

    /* LA RECHERCHE PORTE SUR LE NOM *ET* SUR LES MOTS FRANÇAIS. Les noms sont
       anglais — ce sont des identifiants de code —, mais le champ est lu par
       quelqu'un qui pense « valise ». Chercher sur les seuls noms rendait le
       champ inutile pour tout mot que la page elle-même proposait. */
    return ICON_GROUPS.map((group) => ({
      ...group,
      names: group.names.filter(
        (name) => fold(name).includes(needle) || fold(ICON_KEYWORDS[name]).includes(needle),
      ),
    })).filter((group) => group.names.length > 0);
  }, [query]);

  const total = groups.reduce((count, group) => count + group.names.length, 0);

  const [announced, setAnnounced] = useState(total);

  useEffect(() => {
    const timer = window.setTimeout(() => setAnnounced(total), ANNOUNCE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [total]);

  return (
    <>
      <div className="tc-doc-icon-filter">
        <Opale.Input
          label="Filtrer les icônes"
          type="search"
          placeholder="valise, carte, flèche, poubelle…"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        {/* LE COMPTE EST UNE RÉGION LIVE POLIE. Filtrer au clavier ne déplace
            pas le focus : sans annonce, un lecteur d'écran ne sait pas que la
            grille a changé sous lui (WCAG 4.1.3). La région est montée AVEC la
            page et non avec le résultat, sinon l'annonce se perd. */}
        <p className="tc-doc-icon-filter__count" role="status">
          {announced === 0
            ? 'Aucune icône ne correspond.'
            : `${announced} icône${announced > 1 ? 's' : ''} sur ${TOTAL}.`}
        </p>
      </div>

      {groups.map((group) => (
        <section className="tc-doc-icon-family" key={group.label}>
          <h3 className="tc-doc-icon-family__title">{group.label}</h3>
          <ul className="tc-doc-icon-grid">
            {group.names.map((name) => (
              <li className="tc-doc-icon-cell" key={name}>
                {/* LE DESSIN EST DÉCORATIF ICI, ET C'EST VOULU : son nom est
                    écrit juste en dessous, en toutes lettres. Lui donner en
                    plus un `label` ferait annoncer deux fois la même chose. */}
                <Opale.Icon name={name} />
                <code className="tc-doc-icon-cell__name">{name}</code>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export const iconesPage: DocPage = {
  slug: 'icones',
  label: 'Icônes',
  group: 'introduction',
  title: 'Icônes',
  lede: `Le jeu d’icônes d’Opale — ${TOTAL} tracés dessinés dans le dépôt, sans aucune librairie externe.`,
  render: () => (
    <PageBody>
      <Specimen title="À retenir">
        <p className="tc-doc-prose">
          Toutes les icônes partagent une grille de 24×24, un trait de 1,75 et des extrémités
          rondes. Elles sont des <strong>contours</strong> : elles prennent la couleur du texte par{' '}
          <code>currentColor</code> et grandissent avec son <code>font-size</code>. Utilisez une
          icône quand elle apporte une information ou une affordance immédiate ; les actions
          restent nommées pour les technologies d’assistance.
        </p>
        <ul className="tc-doc-checklist">
          {POINTS.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </Specimen>

      <Specimen title="Le jeu complet">
        <IconGallery />
      </Specimen>

      <Specimen title="Exemple">
        <UsageBlock label="Import et appels représentatifs d’Icon" code={USAGE} actions={false} />
      </Specimen>
    </PageBody>
  ),
};
