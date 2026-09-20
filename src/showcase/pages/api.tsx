import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { CanopButton } from '../../magic';

/* =============================================================================
   LES TROIS BRIQUES QUE TOUTE PAGE DE COMPOSANT RÉEMPLOIE.

   Un site de doc dit trois choses de chaque composant : ce qu'il rend (les
   spécimens, `Specimen`), comment on l'appelle (`UsageBlock`) et ce qu'il
   accepte (`PropsTable`). Les deux dernières sont ici pour que les seize pages
   les servent dans la MÊME forme — seize tableaux écrits à la main
   divergeraient à la troisième page.

   Aucune classe nouvelle : tout est habillé par des règles qui existent déjà
   dans `doc.css`. Le titre réemploie `tc-doc-specimen__title` parce que c'est
   exactement le niveau visuel voulu — un `<h2>` sous le `<h1>` de la page.
   ========================================================================== */

/** Le conteneur d'un corps de page : pile verticale, écart de la charte. */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className="tc-doc-section__body">{children}</div>;
}

export interface PropRow {
  /** Le nom exact de la prop, tel qu'il est écrit dans le type. */
  readonly name: string;
  /** Le type, recopié du source — jamais reformulé. */
  readonly type: string;
  /** Requise : la colonne « Défaut » l'annonce alors en toutes lettres. */
  readonly required?: boolean;
  /** La valeur par défaut, si le composant en pose une. */
  readonly defaultValue?: string;
  readonly description: ReactNode;
}

export interface PropsTableProps {
  /** Préfixe des identifiants — le slug du composant suffit. */
  readonly id: string;
  /** Titre du bloc. Par défaut « L'interface ». */
  readonly title?: string;
  /** Une ligne d'introduction, quand la signature demande une explication. */
  readonly note?: ReactNode;
  readonly rows: readonly PropRow[];
}

/**
 * Le tableau des props.
 *
 * `tabIndex={0}` + `role="group"` sur l'enveloppe : le tableau défile
 * horizontalement sur écran étroit, et un conteneur à défilement doit être
 * atteignable au clavier (WCAG 2.1.1). C'est la même recette que les tableaux
 * de la page palette, et la règle `jsx-a11y` ne modélise pas ce cas.
 *
 * UN SEUL NOM ACCESSIBLE, ET IL EST SUR LE TABLEAU. La première écriture en
 * posait quatre à la file — un `<section aria-labelledby>` (donc un point de
 * repère « région : L'interface », identique sur dix-neuf pages), le `<h2>`,
 * le groupe défilant et la table — si bien qu'atteindre le tableau de props
 * faisait entendre « L'interface » quatre fois. L'enveloppe est donc un
 * `<div>` sans nom : le `<h2>` structure déjà le bloc et apparaît, lui, dans
 * le plan de titres. Le conteneur défilant garde une étiquette parce qu'un
 * arrêt de tabulation muet n'a pas de sens, mais elle dit ce qu'il EST plutôt
 * que de redire le titre.
 */
export function PropsTable({ id, title = 'L’interface', note, rows }: PropsTableProps) {
  const titleId = `${id}-api-title`;

  return (
    /* PAS DE `tc-doc-specimen` ICI, ET C'EST UN CHOIX DE REGISTRE. La carte du
       spécimen posait un liseré `--border-subtle` arrondi autour d'un
       `tc-doc-tablewrap` qui porte déjà le même : deux cadres concentriques de
       la même couleur à 24 px l'un de l'autre, sur vingt-deux pages. Et surtout
       l'API se déguisait en démonstration, alors qu'elle est d'un autre
       registre : le tableau EST son propre cadre. Les deux classes de titre et
       de note restent, elles ne portent que de la typographie. */
    <div className="tc-doc-props">
      <h2 className="tc-doc-specimen__title" id={titleId}>
        {title}
      </h2>
      {note ? <p className="tc-doc-specimen__note">{note}</p> : null}
      <div
        className="tc-doc-tablewrap"
        tabIndex={0}
        role="group"
        aria-label="Tableau, défilement horizontal"
      >
        <table className="tc-doc-table" aria-labelledby={titleId}>
          <thead>
            <tr>
              <th scope="col">Prop</th>
              <th scope="col">Type</th>
              <th scope="col">Défaut</th>
              <th scope="col">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  <code>{row.name}</code>
                </th>
                <td>
                  <code>{row.type}</code>
                </td>
                <td>
                  {row.required ? (
                    'requise'
                  ) : row.defaultValue ? (
                    <code>{row.defaultValue}</code>
                  ) : (
                    /* Un tiret cadratin, et il est ANNONCÉ : une cellule vide
                       laisse le lecteur d'écran passer sans rien dire, ce qui
                       ne distingue pas « aucun défaut » d'un oubli.

                       DEUX ÉLÉMENTS ET NON UN `aria-label`, parce qu'un `<span>`
                       nu porte le rôle `generic`, dont `aria-label` est une
                       propriété PROHIBÉE par l'ARIA : le nom pouvait être
                       calculé puis ignoré, et les soixante et une cellules
                       concernées se lisaient « tiret cadratin » ou rien.

                       « aucun » et pas « aucun défaut » : l'en-tête de colonne
                       « Défaut » est déjà annoncé avec chaque cellule. */
                    <>
                      <span className="tc-visually-hidden">aucun</span>
                      <span aria-hidden="true">—</span>
                    </>
                  )}
                </td>
                <td>{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface UsageBlockProps {
  /** Ce que le bloc montre, pour le nom accessible du conteneur défilant. */
  readonly label: string;
  readonly code: string;
  /** Les commandes d'installation sont du shell ; les autres exemples sont du TSX. */
  readonly language?: 'shell' | 'tsx';
  /** Les pages didactiques peuvent montrer immédiatement une commande essentielle. */
  readonly defaultOpen?: boolean;
  /**
   * Retire la barre de commandes et pose le code ouvert, définitivement.
   *
   * Les pages de prise en main ne montrent qu'UN exemple, court, qui EST le
   * propos de la page — le replier n'économise rien et demande un clic pour
   * lire ce qu'on est venu lire. Là où un catalogue de quatre-vingts
   * spécimens a besoin que son code s'efface, un guide a besoin qu'il se
   * voie.
   */
  readonly actions?: boolean;
}

type CopyState = 'idle' | 'copied' | 'error';
type CodeLanguage = NonNullable<UsageBlockProps['language']>;
type CodeTokenKind =
  | 'plain'
  | 'comment'
  | 'string'
  | 'tag'
  | 'keyword'
  | 'number'
  | 'attribute'
  | 'punctuation'
  | 'command'
  | 'flag';

interface CodeToken {
  readonly kind: CodeTokenKind;
  readonly value: string;
}

const TSX_TOKEN_PATTERN =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.:-]*)|(\b(?:as|async|await|const|default|export|false|from|function|import|interface|let|null|return|true|type|undefined)\b)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z][\w:-]*(?=\s*=))|([{}[\]();,.=<>/:+*-]+)/g;
const TSX_TOKEN_KINDS: readonly CodeTokenKind[] = [
  'comment',
  'string',
  'tag',
  'keyword',
  'number',
  'attribute',
  'punctuation',
];

const SHELL_TOKEN_PATTERN =
  /(#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:bun|git|npm|npx|pnpm|yarn)\b)|(\b(?:add|exec|i|install|run)\b)|(--?[A-Za-z][\w-]*)|(@?[A-Za-z0-9][\w./:@#-]*)/g;
const SHELL_TOKEN_KINDS: readonly CodeTokenKind[] = [
  'comment',
  'string',
  'command',
  'keyword',
  'flag',
  'string',
];

function tokenizeCode(code: string, language: CodeLanguage): readonly CodeToken[] {
  const pattern = language === 'shell' ? SHELL_TOKEN_PATTERN : TSX_TOKEN_PATTERN;
  const kinds = language === 'shell' ? SHELL_TOKEN_KINDS : TSX_TOKEN_KINDS;
  const tokens: CodeToken[] = [];
  let cursor = 0;

  pattern.lastIndex = 0;

  for (const match of code.matchAll(pattern)) {
    const index = match.index ?? 0;

    if (index > cursor) tokens.push({ kind: 'plain', value: code.slice(cursor, index) });

    const groupIndex = match.slice(1).findIndex((group) => group !== undefined);
    tokens.push({ kind: kinds[groupIndex] ?? 'plain', value: match[0] });
    cursor = index + match[0].length;
  }

  if (cursor < code.length) tokens.push({ kind: 'plain', value: code.slice(cursor) });

  return tokens;
}

function CodeSnippet({ code, language }: { code: string; language: CodeLanguage }) {
  return (
    <code data-language={language}>
      {tokenizeCode(code, language).map((token, index) => (
        <span
          className={
            token.kind === 'plain' ? undefined : `tc-doc-token tc-doc-token--${token.kind}`
          }
          key={`${index}-${token.kind}`}
        >
          {token.value}
        </span>
      ))}
    </code>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="tc-doc-codeaction__icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 12s3.25-5.25 9-5.25S21 12 21 12s-3.25 5.25-9 5.25S3 12 3 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.35" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {open ? (
        <path
          className="tc-doc-codeaction__icon-slash"
          d="m5 5 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

function CopyIcon({ copied }: { copied: boolean }) {
  return (
    <svg
      className="tc-doc-codeaction__icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      {copied ? (
        <path
          className="tc-doc-codeaction__icon-check"
          d="m5 12.5 4.25 4.25L19 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <>
          <rect
            x="8"
            y="8"
            width="11"
            height="11"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

/**
 * Un exemple de code repliable, copiable et atteignable au clavier.
 *
 * Le panneau reste monté pendant le repli afin que la transition CSS puisse
 * s'achever. `aria-hidden` et `tabIndex=-1` le retirent toutefois du parcours
 * tant qu'il n'est pas affiché.
 */
export function UsageBlock({
  label,
  code,
  language = 'tsx',
  defaultOpen = false,
  actions = true,
}: UsageBlockProps) {
  /* SANS BARRE DE COMMANDES, LE PANNEAU EST OUVERT ET LE RESTE : le seul
     appelant de `setOpen` est le bouton de repli, qui n'est alors pas rendu.
     L'état existe encore pour que le reste du composant — `data-open`,
     `aria-hidden`, `tabIndex` — n'ait pas à connaître les deux cas. */
  const [open, setOpen] = useState(actions ? defaultOpen : true);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const resetTimer = useRef<number | undefined>(undefined);
  const panelId = `${useId()}-code`;

  useEffect(
    () => () => {
      if (resetTimer.current !== undefined) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  async function copyCode(): Promise<void> {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API indisponible');
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }

    if (resetTimer.current !== undefined) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 1800);
  }

  const copyLabel =
    copyState === 'copied' ? 'Copié !' : copyState === 'error' ? 'Réessayer' : 'Copier';

  return (
    <div className="tc-doc-codeexample">
      {actions ? (
        <div
          className="tc-doc-codeexample__actions"
          role="group"
          aria-label={`Actions pour ${label}`}
        >
          <CanopButton
            className="tc-doc-codeaction"
            variant="tonal"
            size="small"
            aria-controls={panelId}
            aria-expanded={open}
            startIcon={<EyeIcon open={open} />}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? 'Masquer le code' : 'Afficher le code'}
          </CanopButton>
          <CanopButton
            className="tc-doc-codeaction"
            variant="tonal"
            size="small"
            startIcon={<CopyIcon copied={copyState === 'copied'} />}
            onClick={() => void copyCode()}
          >
            {copyLabel}
          </CanopButton>
        </div>
      ) : null}

      <div
        className="tc-doc-codeexample__reveal"
        data-open={open ? 'true' : 'false'}
        aria-hidden={!open}
      >
        <div className="tc-doc-codeexample__reveal-inner">
          <pre
            id={panelId}
            className="tc-doc-code"
            tabIndex={open ? 0 : -1}
            role="group"
            aria-label={`${label}, défilement horizontal`}
          >
            <CodeSnippet code={code} language={language} />
          </pre>
        </div>
      </div>

      {/* La région live annonce le résultat d'une copie : sans le bouton, elle
          n'aurait jamais rien à dire et resterait un nœud vide dans l'arbre. */}
      {actions ? (
        <span className="tc-visually-hidden" role="status" aria-live="polite">
          {copyState === 'copied'
            ? 'Code copié dans le presse-papier.'
            : copyState === 'error'
              ? 'La copie a échoué.'
              : ''}
        </span>
      ) : null}
    </div>
  );
}
