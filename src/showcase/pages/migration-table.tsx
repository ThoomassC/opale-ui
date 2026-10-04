import type { ReactNode } from 'react';

import { DocHeading } from '../section';

/* Le tableau de la page « Migrer vers la 4.0 », à part pour que la page n'exporte
   que des données (`react-refresh/only-export-components`). */

/** Un texte de la table, ses `accents graves` rendus en `<code>`. */
function inlineCode(text: string): ReactNode {
  return text
    .split(/(`[^`]+`)/)
    .filter(Boolean)
    .map((part, index) =>
      part.startsWith('`') && part.endsWith('`') ? (
        <code key={index}>{part.slice(1, -1)}</code>
      ) : (
        part
      ),
    );
}

/** Le tiret d'une cellule sans valeur, annoncé « aucun ». Même motif que `PropsTable`. */
const NONE = (
  <>
    <span className="tc-visually-hidden">aucun</span>
    <span aria-hidden="true">—</span>
  </>
);

export interface MigrationRow {
  readonly key: string;
  readonly cells: readonly [ReactNode, ReactNode, ReactNode, ReactNode];
}

interface MigrationTableProps {
  readonly id: string;
  readonly title: string;
  readonly note: ReactNode;
  readonly columns: readonly [string, string, string, string];
  readonly rows: readonly MigrationRow[];
}

/* Le cadre de `PropsTable` : titre qui nomme le tableau, zone défilante
   atteignable au clavier, première colonne en en-tête de ligne. */
export function MigrationTable({ id, title, note, columns, rows }: MigrationTableProps) {
  const titleId = `${id}-title`;
  return (
    <div className="tc-doc-props">
      <DocHeading className="tc-doc-specimen__title" id={titleId}>
        {title}
      </DocHeading>
      <p className="tc-doc-specimen__note">{note}</p>
      <div
        className="tc-doc-tablewrap"
        tabIndex={0}
        role="group"
        aria-label="Tableau, défilement horizontal"
      >
        <table className="tc-doc-table" aria-labelledby={titleId}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, cells: [first, ...rest] }) => (
              <tr key={key}>
                <th scope="row">{first}</th>
                {rest.map((cell, index) => (
                  <td key={index}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Le remplaçant d'un ancien nom, et sa précision quand elle existe. */
export function ReplacementCell({
  replacement,
  note,
}: {
  readonly replacement: string | null;
  readonly note: string | undefined;
}) {
  if (!replacement && !note) return NONE;
  return (
    <>
      {replacement ? <code>{replacement}</code> : null}
      {replacement && note ? ' — ' : null}
      {note ? inlineCode(note) : null}
    </>
  );
}
