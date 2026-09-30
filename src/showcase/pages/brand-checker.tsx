import { useId, useState } from 'react';
import type { CSSProperties } from 'react';

import { checkBrand } from '../../contract/brand';
import type { BrandContrastCheck, BrandReport, BrandTheme } from '../../contract/brand';
import { Opale } from '../../opale';
import { DocHeading } from '../section';
import { UsageBlock } from './api';
import { BRAND_DEFAULTS, BRAND_FIELDS } from './personnaliser-data';
import type { BrandField } from './personnaliser-data';
import { useSettledValue } from './use-settled-value';

/* L'essai de marque de la page « Personnaliser » : des couleurs choisies au
   sélecteur, le rapport de `checkBrand` en direct, et un aperçu des boutons
   sous cette marque. Aucun calcul ici : tout vient du contrat publié. */

const THEMES: readonly { readonly value: BrandTheme; readonly label: string }[] = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
];

const ROLE_LABEL = {
  primary: 'Primaire',
  secondary: 'Secondaire',
  danger: 'Danger',
  accent: 'Accent',
} as const;

function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2).replace('.', ',')}:1`;
}

function formatMinimum(minimum: number): string {
  return `${String(minimum).replace('.', ',')}:1`;
}

interface MeasureRow {
  readonly key: string;
  readonly check: BrandContrastCheck;
}

function measureRows(report: BrandReport): readonly MeasureRow[] {
  return [
    ...report.roles.flatMap((role) => [
      { key: `${role.role}-ink`, check: role.ink },
      ...role.onSurface.map((check, index) => ({ key: `${role.role}-surface-${index}`, check })),
    ]),
    ...report.focus.map((check, index) => ({ key: `focus-${index}`, check })),
  ];
}

/** Les encres à poser, en CSS prêt à recopier, ou `null` si aucune ne change. */
function inkOverrides(report: BrandReport): string | null {
  const lines = report.roles
    .filter((role) => role.suggestedInk.changed && role.suggestedInk.pass)
    .map((role) => `  ${role.suggestedInk.token}: ${role.suggestedInk.value};`);
  if (lines.length === 0) return null;
  const selector = report.theme === 'dark' ? ":root[data-theme='dark']" : ':root';
  return `${selector} {\n${lines.join('\n')}\n}`;
}

export function BrandChecker() {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const [theme, setTheme] = useState<BrandTheme>('light');
  /* Une marque par thème : passer au sombre ne perd pas ce qu'on a choisi en clair. */
  const [colors, setColors] = useState(BRAND_DEFAULTS);

  const current = colors[theme];
  const report = checkBrand(
    {
      primary: current.primary,
      secondary: current.secondary,
      danger: current.danger,
      accent: current.accent,
      ...(theme === 'dark' ? { primaryOnSurface: current.primaryOnSurface } : {}),
    },
    { theme },
  );
  const rows = measureRows(report);
  const failed = rows.filter((row) => !row.check.pass).length;
  const overrides = inkOverrides(report);
  const announced = useSettledValue(failed);

  const setColor = (field: BrandField, value: string) =>
    setColors((previous) => ({ ...previous, [theme]: { ...previous[theme], [field]: value } }));

  const inks = Object.fromEntries(
    report.roles
      .filter((role) => role.suggestedInk.pass)
      .map((role) => [role.suggestedInk.token, role.suggestedInk.value]),
  );

  const brand = {
    '--opale-primary': current.primary,
    '--opale-secondary-dark': current.secondary,
    '--opale-danger': current.danger,
    '--opale-accent': current.accent,
    ...(theme === 'dark' ? { '--opale-primary-light': current.primaryOnSurface } : {}),
  };

  return (
    <section className="tc-doc-specimen" aria-labelledby={titleId}>
      <DocHeading className="tc-doc-specimen__title" id={titleId}>
        Tester une couleur
      </DocHeading>
      <p className="tc-doc-specimen__note">
        Choisissez une couleur : <code>checkBrand</code> mesure chaque paire contre les encres et
        les surfaces d’Opale, et propose l’encre qui tient.
      </p>

      <div className="tc-doc-specimen__stage">
        <fieldset className="opale-field">
          <legend className="opale-field__label">Thème mesuré</legend>
          <Opale.Stack direction="row" wrap>
            {THEMES.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name={`${baseId}-theme`}
                  value={option.value}
                  checked={theme === option.value}
                  onChange={() => setTheme(option.value)}
                />{' '}
                {option.label}
              </label>
            ))}
          </Opale.Stack>
        </fieldset>

        <Opale.Stack direction="row" wrap>
          {BRAND_FIELDS.filter((entry) => !entry.darkOnly || theme === 'dark').map((entry) => {
            const inputId = `${baseId}-${entry.field}`;
            return (
              <div className="opale-field" key={entry.field}>
                <label className="opale-field__label" htmlFor={inputId}>
                  {entry.label}
                </label>
                <span>
                  <input
                    id={inputId}
                    type="color"
                    value={current[entry.field]}
                    onChange={(event) => setColor(entry.field, event.currentTarget.value)}
                  />{' '}
                  <code>{current[entry.field]}</code>
                </span>
              </div>
            );
          })}
        </Opale.Stack>

        <p role="status">
          {announced === 0
            ? 'Toutes les paires tiennent leur seuil.'
            : `${announced} paire${announced > 1 ? 's' : ''} sous le seuil.`}
        </p>

        <div
          className="tc-doc-tablewrap"
          tabIndex={0}
          role="group"
          aria-label="Tableau, défilement horizontal"
        >
          <table className="tc-doc-table">
            <caption className="tc-visually-hidden">Les mesures de la marque</caption>
            <thead>
              <tr>
                <th scope="col">Paire</th>
                <th scope="col">Ratio</th>
                <th scope="col">Seuil</th>
                <th scope="col">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, check }) => (
                <tr key={key}>
                  <th scope="row">{check.label}</th>
                  <td>{formatRatio(check.ratio)}</td>
                  <td>{formatMinimum(check.minimum)}</td>
                  <td>{check.pass ? 'tient' : <strong>sous le seuil</strong>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {overrides === null ? (
          <p className="tc-doc-prose">
            Les encres par défaut tiennent sur chaque remplissage : rien à poser.
          </p>
        ) : (
          <>
            <p className="tc-doc-prose">
              Posez ces encres avec la marque ; chacune ne change que son rôle.
            </p>
            <UsageBlock label="Les encres à poser" code={overrides} actions={false} />
          </>
        )}

        {report.roles.some((role) => !role.suggestedInk.pass) ? (
          <p className="tc-doc-prose">
            <strong>
              {report.roles
                .filter((role) => !role.suggestedInk.pass)
                .map((role) => ROLE_LABEL[role.role])
                .join(', ')}
            </strong>{' '}
            : aucune encre du thème ne tient 4,5:1. Foncez ou éclaircissez ce remplissage.
          </p>
        ) : null}

        {/* L'aperçu a son thème (le gabarit extérieur) et sa marque (la portée
            intérieure) : un élément qui porte `data-opale-page-theme` est exclu
            du bloc de `data-opale-scope`, d'où deux niveaux. La marque essayée
            ne fuit pas sur la page. */}
        <div
          className="opale-root"
          data-opale-page-theme={theme}
          style={{
            marginBlockStart: 'var(--opale-space-md)',
            padding: 'var(--opale-space-md)',
            borderRadius: 'var(--opale-radius-md)',
          }}
        >
          <div
            data-opale-brand="derive"
            data-opale-scope=""
            style={{ ...brand, ...inks } as CSSProperties}
          >
            <Opale.Stack direction="row" wrap>
              <Opale.Button variant="primary">Primaire</Opale.Button>
              <Opale.Button variant="secondary">Secondaire</Opale.Button>
              <Opale.Button variant="danger">Supprimer</Opale.Button>
              <Opale.Button variant="accent">Accent</Opale.Button>
              <Opale.Button variant="tonal">Tonal</Opale.Button>
            </Opale.Stack>
          </div>
        </div>
      </div>
    </section>
  );
}
