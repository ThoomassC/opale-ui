import type { DocPage } from '../../doc-model';
import { OPALE_PLATES } from '../../opale-palette-data';
import { PLATES, SEMANTIC_ROWS } from '../../palette-data';
import { PageBody } from '../api';
import { PalettePlate } from './palette-plate';

export const palettePage: DocPage = {
  slug: 'palette',
  label: 'La palette',
  group: 'fondations',
  title: 'La palette',
  lede: (
    <>
      D’abord la palette qui peint ce site, ensuite celle que publie le paquet. Les plaques sont
      rendues avec leurs hexadécimaux littéraux et ne suivent donc pas le thème de la page. Les
      jetons translucides affichent leur valeur <code>rgba()</code> déclarée puis l’aplat qu’elle
      donne sur son support — c’est cet aplat que la pastille peint.
    </>
  ),
  render: () => (
    <PageBody>
      {/* LES TROIS LOIS PARLAIENT DE TEAL ET DE CUIVRE, la marque de la 2.x, alors
          que le site est peint en saphir depuis la V3. Une page de palette qui
          nomme une couleur que l'écran ne montre pas est pire qu'une page
          absente : on y vient pour savoir quoi écrire. */}
      <ul className="tc-doc-laws">
        <li className="tc-doc-laws__item tc-doc-laws__item--teal">
          <strong>Le saphir est l’encre des actions.</strong> Boutons, liens, onglet courant, entrée
          active du sommaire.
        </li>
        <li className="tc-doc-laws__item tc-doc-laws__item--copper">
          <strong>L’olive et l’ambre accompagnent.</strong> Ils décorent et signalent, ils ne
          portent jamais l’action principale.
        </li>
        <li className="tc-doc-laws__item tc-doc-laws__item--neutral">
          <strong>Les neutres sont crème, jamais gris</strong> : le sol, les trois surfaces et les
          filets partagent la même teinte chaude.
        </li>
      </ul>

      {/* CE QUE LE SITE REND, EN PREMIER. Les plaques `--canop-*` viennent avant
          celles de `roles.css` parce que c'est cette palette-là que le lecteur a
          sous les yeux pendant qu'il lit la page. */}
      <div className="tc-doc-plates">
        {OPALE_PLATES.map((plate) => (
          <PalettePlate plate={plate} key={plate.id} />
        ))}
      </div>

      {/* CE QUE LE PAQUET PUBLIE, ENSUITE — ET CE N'EST PAS UN VESTIGE.
          `tokens.css` est déclaré dans `exports`, donc ces rôles sont exactement
          ce qu'installe un consommateur ; 172 tests les tiennent contre la
          feuille. Les retirer aurait supprimé une information vraie, simplement
          moins urgente que la précédente. */}
      <div className="tc-doc-plates">
        {PLATES.map((plate) => (
          <PalettePlate plate={plate} key={plate.id} />
        ))}
      </div>

      <article className="tc-doc-plate tc-doc-plate--themed">
        <header className="tc-doc-plate__head">
          <h2 className="tc-doc-plate__title" id="plate-semantic-title">
            Les trois encres sémantiques
          </h2>
          <p className="tc-doc-plate__ground">
            mesurées deux fois : sur le sol de la page et sur la carte
          </p>
        </header>
        <p className="tc-doc-plate__groupnote">
          Elles ne signifient jamais seules : chaque emploi porte un mot et un glyphe.
        </p>

        {/* `tabIndex` + `role="group"` : le tableau porte une largeur plancher
            de 704 px, donc il défile horizontalement dès 320 px. Une zone qui
            défile et que rien ne rend focusable est inatteignable au clavier
            sur Safari — quatre colonnes sur sept y étaient perdues. La liste
            blanche par défaut de la règle `jsx-a11y/no-noninteractive-tabindex`
            ne connaît que `tabpanel` ; `eslint.config.js` y a depuis ajouté
            `group`, qui est le rôle correct pour une telle zone. */}
        <div
          className="tc-doc-tablewrap"
          tabIndex={0}
          role="group"
          aria-label="Tableau des encres sémantiques, défilement horizontal"
        >
          <table className="tc-doc-table" aria-labelledby="plate-semantic-title">
            <thead>
              <tr>
                <th scope="col">Aperçu</th>
                <th scope="col">Thème</th>
                <th scope="col">Jeton</th>
                <th scope="col">Hex</th>
                <th scope="col">Sur le sol</th>
                <th scope="col">Sur la carte</th>
                <th scope="col">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {SEMANTIC_ROWS.map((row) => (
                <tr key={`${row.theme}${row.token}`}>
                  <td>
                    <span
                      className="tc-doc-inkchip"
                      style={{
                        background: row.plateGround,
                        color: row.hex,
                        borderColor: row.plateInk,
                      }}
                    >
                      <span aria-hidden="true">{row.glyph}</span>
                      <span aria-hidden="true">Aa</span>
                    </span>
                  </td>
                  <td>{row.theme}</td>
                  <th scope="row">
                    <code>{row.token}</code>
                  </th>
                  <td>
                    <span className="tc-doc-mono">{row.hex}</span>
                  </td>
                  <td>
                    <span className="tc-doc-mono">{row.onGround}</span>
                  </td>
                  <td>
                    <span className="tc-doc-mono">{row.onCard}</span>
                  </td>
                  <td>{row.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </PageBody>
  ),
};
