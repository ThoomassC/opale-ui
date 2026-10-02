import { useState } from 'react';

import { Opale } from '../../opale';
import { normalize } from '../search-model';
import { DocHeading } from '../section';
import { INTERNAL_COUNT, PUBLIC_GROUPS, TOKEN_ROWS } from './personnaliser-data';
import type { TokenRow } from './personnaliser-data';
import { useSettledValue } from './use-settled-value';

/* La table filtrable des jetons publics de la page « Personnaliser ». Les
   lignes viennent du manifeste, les valeurs de la feuille. */

const ALL_GROUPS = 'tous';

const TITLE_ID = 'personnaliser-jetons-title';

/** Une valeur qui se peint : un aplat hexadécimal ou `rgb()`. */
const PAINTABLE = /^(?:#[0-9a-f]{3,8}|rgba?\([^)]*\))$/i;

/** Le tiret d'une cellule sans valeur propre, annoncé en clair. */
const SAME_AS_LIGHT = (
  <>
    <span className="tc-visually-hidden">identique au clair</span>
    <span aria-hidden="true">—</span>
  </>
);

function TokenValue({ value }: { readonly value: string }) {
  return (
    <>
      {PAINTABLE.test(value) ? (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            inlineSize: '0.875em',
            blockSize: '0.875em',
            marginInlineEnd: '0.375em',
            verticalAlign: '-0.125em',
            borderRadius: '0.25em',
            background: value,
            boxShadow: 'inset 0 0 0 1px var(--opale-divider)',
          }}
        />
      ) : null}
      <code>{value}</code>
    </>
  );
}

function matches(row: TokenRow, needle: string, group: string): boolean {
  if (group !== ALL_GROUPS && row.group !== group) return false;
  if (!needle) return true;
  return [row.name, row.role, row.groupLabel].some((text) => normalize(text).includes(needle));
}

export function TokenTable() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>(ALL_GROUPS);

  const needle = normalize(query.trim());
  const rows = TOKEN_ROWS.filter((row) => matches(row, needle, group));
  const announced = useSettledValue(rows.length);

  const reset = () => {
    setQuery('');
    setGroup(ALL_GROUPS);
  };

  return (
    <div className="tc-doc-props">
      <DocHeading className="tc-doc-specimen__title" id={TITLE_ID}>
        Les jetons publics
      </DocHeading>
      <p className="tc-doc-specimen__note">
        Stables en 2.x et faits pour être surchargés. Les {INTERNAL_COUNT} autres jetons de la
        feuille sont internes : des dérivés ou des réglages de mécanique, qui peuvent changer de
        formule d’une version à l’autre.
      </p>

      <div className="tc-doc-icon-filter">
        <div className="opale-field">
          <label className="opale-field__label" htmlFor="personnaliser-jetons-filtre">
            Filtrer les jetons
          </label>
          <Opale.SearchBar
            id="personnaliser-jetons-filtre"
            placeholder="primaire, rayon, focus…"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </div>
        <Opale.Select
          label="Groupe"
          value={group}
          onChange={(event) => setGroup(event.currentTarget.value)}
          options={[
            { value: ALL_GROUPS, label: 'Tous les groupes' },
            ...PUBLIC_GROUPS.map((entry) => ({ value: entry.id, label: entry.label })),
          ]}
        />
        {/* Région live polie, montée avec la page : filtrer ne déplace pas le
            focus (WCAG 4.1.3). */}
        <p className="tc-doc-icon-filter__count" role="status">
          {announced === 0
            ? 'Aucun jeton ne correspond.'
            : `${announced} jeton${announced > 1 ? 's' : ''} sur ${TOKEN_ROWS.length}.`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="tc-doc-prose">
          <p>Aucun jeton public ne correspond à ce filtre.</p>
          <Opale.Button variant="secondary" size="small" onClick={reset}>
            Effacer le filtre
          </Opale.Button>
        </div>
      ) : (
        <div
          className="tc-doc-tablewrap"
          tabIndex={0}
          role="group"
          aria-label="Tableau, défilement horizontal"
        >
          <table className="tc-doc-table" aria-labelledby={TITLE_ID}>
            <thead>
              <tr>
                <th scope="col">Jeton</th>
                <th scope="col">Groupe</th>
                <th scope="col">Rôle</th>
                <th scope="col">Clair</th>
                <th scope="col">Sombre</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <th scope="row">
                    {/* Un nom de jeton se recopie d'un bloc : il ne se coupe pas. */}
                    <code style={{ whiteSpace: 'nowrap' }}>{row.name}</code>
                  </th>
                  <td>{row.groupLabel}</td>
                  <td>{row.role}</td>
                  <td>
                    <TokenValue value={row.light} />
                  </td>
                  <td>{row.dark === null ? SAME_AS_LIGHT : <TokenValue value={row.dark} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
