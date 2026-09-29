import { useEffect, useMemo, useState } from 'react';

import { ICON_GROUPS, ICON_KEYWORDS, ICON_NAMES, Opale } from '../../opale';

/* La galerie filtrable de la page « Icônes ». */

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

export function IconGallery() {
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
        <div className="opale-field">
          <label className="opale-field__label" htmlFor="tc-doc-icon-search">
            Filtrer les icônes
          </label>
          <Opale.SearchBar
            id="tc-doc-icon-search"
            placeholder="valise, carte, flèche, poubelle…"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </div>
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
