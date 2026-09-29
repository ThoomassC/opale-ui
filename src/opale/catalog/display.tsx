/* Les composants d'affichage de données du catalogue. */

import {
  useId,
  useMemo,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import Glass from '../components/glass/Glass';
import { IconGlyph, OPALE_ICONS, isOpaleIconName, type OpaleIconName } from '../components/icon';
import type { OpaleSize } from '../shared';
import { resolveLabels } from '../shared/labels';
import { useControllableState } from '../shared/use-controllable-state';
import { Surface } from './shells';
import type { NavItem } from './navigation';

export interface CardProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  elevation?: 0 | 1 | 2 | 3;
  liquidGlass?: boolean;
  /** La balise du titre, pour suivre la hiérarchie de la page. Défaut : `h3`. */
  titleAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function Card({
  title,
  titleAs: Title = 'h3',
  subtitle,
  actions,
  footer,
  elevation = 1,
  liquidGlass = false,
  className,
  children,
  ...props
}: CardProps) {
  const content = (
    <>
      {(title || subtitle || actions) && (
        <div className="opale-card__header">
          <div>
            {title && <Title className="opale-card__title">{title}</Title>}
            {subtitle && <p className="opale-card__subtitle">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="opale-card__body">{children}</div>
      {footer && <div className="opale-card__footer">{footer}</div>}
    </>
  );

  const classes = clsx(
    'opale-card',
    `opale-card--e${elevation}`,
    liquidGlass && 'opale-card--glass',
    className,
  );

  /* `elevation` GARDE SON SENS SOUS VERRE, ce qui n'était pas le cas avant :
     la carte tierce imposait sa propre ombre et sa propre typographie, si bien
     que le niveau demandé était perdu et que le texte passait de 16 px à 15.
     La carte d'Opale étant désormais le contenu du verre, elle garde ses
     classes, donc son élévation et son échelle. */
  if (liquidGlass) {
    return (
      <Glass
        className={classes}
        rootClassName={clsx('opale-card--glass-root', `opale-card--glass-root--e${elevation}`)}
        {...props}
      >
        {content}
      </Glass>
    );
  }

  return (
    <Surface className={classes} {...props}>
      {content}
    </Surface>
  );
}

export type CardGridProps = ComponentPropsWithRef<'div'>;

export function CardGrid({ className, children, ...props }: CardGridProps) {
  return (
    <div className={clsx('opale-card-grid', className)} {...props}>
      {children}
    </div>
  );
}

/** L'emphase de marque d'une pastille. */
export type BadgeTone = 'primary' | 'accent' | 'danger';

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  tone?: BadgeTone;
  /** Un point de notification : le texte est masqué à l'œil, lu à l'oreille. */
  dot?: boolean;
  liquidGlass?: boolean;
  children: ReactNode;
  className?: string;
}

export function Badge({
  tone = 'primary',
  dot = false,
  liquidGlass = false,
  children,
  className,
  ...rest
}: BadgeProps) {
  /* LE BADGE EST LE MÊME DES DEUX CÔTÉS. La pastille tierce forçait ses
     libellés en CAPITALES, imposait sa propre graisse et ignorait le ton
     d'Opale au profit de six variantes d'une autre palette : il fallait
     reprendre chacune de ces décisions à coups de `!important`. La pastille
     d'Opale étant désormais le contenu du verre, elle garde son ton, sa
     pilule et sa casse. */
  const classes = clsx(
    'opale-badge',
    tone !== 'primary' && `opale-badge--${tone}`,
    dot && 'opale-badge--dot',
    liquidGlass && 'opale-badge--glass',
    className,
  );

  /* LE POINT GARDE SON TEXTE. Un point seul ne dit rien à un lecteur d'écran :
     « 3 messages non lus » reste dans le nœud, masqué par découpage, et c'est
     ce qu'on entend là où l'on voit une pastille (WCAG 1.1.1). */
  const content = dot ? <span className="opale-visually-hidden">{children}</span> : children;

  if (liquidGlass) {
    return (
      <Glass {...rest} as="span" className={classes} rootClassName="opale-badge--glass-root">
        {content}
      </Glass>
    );
  }

  return (
    <span {...rest} className={classes}>
      {content}
    </span>
  );
}

/** Le niveau HTML d'un titre, qui fixe sa place dans le plan de la page. */
export type HeadingLevel = 1 | 2 | 3 | 4;

export interface HeadingProps extends ComponentPropsWithRef<'h2'> {
  level?: HeadingLevel;
  children: ReactNode;
  className?: string;
}

export function Heading({ level = 2, children, className, ...rest }: HeadingProps) {
  const Heading = `h${level}` as 'h1';
  return (
    <Heading {...rest} className={clsx('opale-heading', className)}>
      {children}
    </Heading>
  );
}

/** Le rôle typographique d'un texte. */
export type TextVariant = 'body' | 'label' | 'caption' | 'metric';

export interface TextProps extends ComponentPropsWithRef<'p'> {
  variant?: TextVariant;
  children: ReactNode;
  className?: string;
}

export function Text({ variant = 'body', children, className, ...rest }: TextProps) {
  return (
    <p {...rest} className={clsx('opale-text', `opale-text--${variant}`, className)}>
      {children}
    </p>
  );
}

export interface IconProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /**
   * Le nom d'une icône du jeu d'Opale — voir `ICON_NAMES` et la page « Icônes »
   * — ou n'importe quel nœud à rendre tel quel.
   *
   * LES DEUX FORMES COEXISTENT À DESSEIN. Le composant ne savait rendre qu'un
   * CARACTÈRE, et des appels existants passent « ✦ » ou « ⌘ » ; les casser
   * n'aurait rien apporté. Un nom connu dessine le tracé d'Opale, tout le
   * reste passe au travers inchangé.
   */
  name?: OpaleIconName | ReactNode;
  label?: string;
  className?: string;
}

export function Icon({ name = 'sparkle', label, className, ...rest }: IconProps) {
  /* Un nom passé par `aria-label` vaut `label` : il faut le rôle `img` pour
     qu'un `<span>` soit annoncé. */
  const named = Boolean(label ?? rest['aria-label']);
  return (
    <span
      aria-label={label}
      {...rest}
      className={clsx('opale-icon', className)}
      role={named ? 'img' : undefined}
    >
      {isOpaleIconName(name) ? <IconGlyph name={name} className="opale-icon__glyph" /> : name}
    </span>
  );
}

export interface DescriptionListProps extends Omit<ComponentPropsWithRef<'dl'>, 'children'> {
  items?: readonly { term: ReactNode; description: ReactNode }[];
}

export function DescriptionList({ items = [], className, ...rest }: DescriptionListProps) {
  return (
    <dl {...rest} className={clsx('opale-description-list', className)}>
      {/* `<div>` ET NON `<span>` : le modèle de contenu d'un `<dl>` n'admet
          que `<dt>`/`<dd>` ou un groupe `<div>`. Un `<span>` intercalé casse
          la relation terme/définition dans l'arbre d'accessibilité, ARIA
          exigeant que la liste POSSÈDE ses termes (WCAG 1.3.1). */}
      {items.map((item, index) => (
        <div key={index}>
          <dt>{item.term}</dt>
          <dd>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface BulletListProps extends Omit<ComponentPropsWithRef<'ul'>, 'children'> {
  items?: readonly ReactNode[];
}

export function BulletList({ items = [], className, ...rest }: BulletListProps) {
  return (
    <ul {...rest} className={clsx('opale-bullet-list', className)}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
/** Le pas de la note. Une étoile se remplit au quart, au demi, aux trois quarts. */
const RATING_STEP = 0.25;

/** Le barème par défaut, et le plafond au-delà duquel une rangée ne se lit plus. */
const RATING_DEFAULT_MAX = 5;
const RATING_MAX_STARS = 20;

/**
 * Ramène le barème à un entier utilisable.
 *
 * `max` TRAVERSAIT SANS CONTRÔLE, et il en faut autant que pour la note : il
 * sert de plafond au clamp, de compte à `Array.from({ length: max })` et de
 * second terme au nom accessible. Trois pannes mesurées, toutes atteignables
 * depuis une valeur calculée — `total / n` avec `n` à zéro, un barème lu dans
 * une API :
 *
 * - `NaN` faisait annoncer « NaN sur NaN » et rendait l'attribut invalide ;
 * - `4.5` faisait dessiner quatre étoiles pour un barème annoncé « 4.5 », avec
 *   un POINT là où la note met une virgule — le mélange même que
 *   `formatRating` existe pour éviter ;
 * - `Infinity` faisait boucler `Array.from` sur 2⁵³−1 : l'onglet gèle.
 */
function snapMax(max: number): number {
  if (!Number.isFinite(max)) return RATING_DEFAULT_MAX;

  return Math.min(Math.max(Math.round(max), 1), RATING_MAX_STARS);
}

/**
 * Ramène une note sur le pas du quart, puis dans l'intervalle `[0, max]`.
 *
 * L'ARRONDI EST FAIT ICI ET PAS AU RENDU, pour que le nom accessible et le
 * dessin disent la même chose. Annoncer « 3,7 sur 5 » en dessinant trois
 * étoiles et trois quarts, c'est deux notes différentes selon qu'on voit ou
 * qu'on écoute.
 */
function snapRating(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.min(Math.max(Math.round(value / RATING_STEP) * RATING_STEP, 0), max);
}

/** `3.75` → `« 3,75 »`. Le composant parle français, comme ses libellés. */
function formatRating(value: number): string {
  return String(Number(value.toFixed(2))).replace('.', ',');
}

/** Le tracé de l'étoile, emprunté au jeu d'icônes. Une seule silhouette dans le dépôt. */
const RATING_STAR = OPALE_ICONS.star[0];

/**
 * Où couper la largeur de l'étoile pour en peindre la fraction demandée.
 *
 * CE QU'ON LIT D'UNE ÉTOILE EST UNE AIRE, PAS UNE LARGEUR, et une étoile n'a
 * pas son encre répartie uniformément : ses pointes latérales sont fines, son
 * corps est au centre. Couper à 25 % de la largeur ne peint donc pas un quart
 * de l'étoile. Mesuré en rastérisant CE tracé-ci — remplissage et contour
 * compris — sur 480 px de côté, puis en comptant les pixels d'encre colonne
 * par colonne :
 *
 * | coupe en largeur | encre réellement peinte |
 * |---|---|
 * | 25 % | 14,1 % |
 * | 50 % | 50,6 % |
 * | 75 % | 86,8 % |
 *
 * Autrement dit 3,75 se lisait « quatre » et 1,25 se lisait « une » : le
 * dessin contredisait le nom accessible. La même mesure, inversée, donne les
 * coupes qui peignent un quart, une moitié et trois quarts d'encre — ce sont
 * les valeurs ci-dessous. Seul le demi tombait déjà juste, et c'est logique :
 * l'étoile est symétrique.
 *
 * LA TABLE EST INDEXÉE SUR LES CINQ ÉTATS DU PAS, qui sont les seuls que
 * `snapRating` laisse passer ; l'interpolation n'existe que pour qu'une valeur
 * intermédiaire ne tombe pas dans un trou. Toucher au tracé de l'étoile oblige
 * à reprendre cette mesure — le garde de `opale.test.tsx` le rappelle.
 */
const RATING_INK_CUTS = [0, 0.336, 0.5, 0.664, 1] as const;

function inkCut(fill: number): number {
  const position = fill * (RATING_INK_CUTS.length - 1);
  const bas = Math.floor(position);
  const haut = Math.min(bas + 1, RATING_INK_CUTS.length - 1);

  return RATING_INK_CUTS[bas] + (RATING_INK_CUTS[haut] - RATING_INK_CUTS[bas]) * (position - bas);
}

export interface RatingProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  value?: number;
  max?: number;
}

export function Rating({ value = 0, max = RATING_DEFAULT_MAX, className, ...rest }: RatingProps) {
  /* LE REMPLISSAGE EST FRACTIONNAIRE, ET C'EST TOUT LE COMPOSANT.

     Il comparait `index + 1 <= value` : une note de 3,75 dessinait donc
     exactement les mêmes trois étoiles que 3,0, et les trois quarts se
     perdaient en silence.

     L'ÉTOILE EST UN TRACÉ ET NON UN CARACTÈRE, pour deux raisons mesurées.

     1. LE QUART N'EXISTAIT PAS À L'ŒIL. La première correction rognait le
        glyphe « ★ » à un pourcentage de sa LARGEUR D'AVANCE, qui comprend les
        approches latérales. Compté sur les pixels d'encre : une coupe demandée
        à 25 % n'en peignait que **8,5 %**, et une coupe à 75 % en peignait
        **91,9 %**. Autrement dit 3,75 se lisait « quatre » et 1,25 se lisait
        « une » — le dessin contredisait le nom accessible, ce que tout le
        reste de ce composant cherche à éviter. Le dégradé ci-dessous coupe la
        BOÎTE D'ENCRE du tracé (`objectBoundingBox` est le repère par défaut
        d'un `linearGradient`), donc la fraction demandée est la fraction
        peinte.

     2. LE GLYPHE DÉPENDAIT DE LA POLICE INSTALLÉE. « ★ » n'a ni la même
        silhouette ni la même chasse d'une machine à l'autre, et manque
        purement et simplement sur certaines. Le tracé est celui du jeu
        d'Opale, donc le même partout.

     LE CONTOUR EST TOUJOURS PEINT, sur le même chemin que le remplissage :
     c'est lui qui donne la référence sans laquelle une fraction ne veut rien
     dire — on ne voit « un quart » que si l'on voit aussi le tout. */
  const bareme = snapMax(max);
  const note = snapRating(value, bareme);
  const gradientId = useId();

  return (
    /* `role="img"` EST OBLIGATOIRE ICI. Un `aria-label` posé sur un élément
       sans rôle — un `<span>` a le rôle `generic` — est ignoré par les API
       d'accessibilité, et les étoiles enfants sont toutes `aria-hidden` : la
       note ne s'annonçait donc PAS DU TOUT (WCAG 1.1.1). `Icon`, quelques
       lignes plus haut, prend déjà cette précaution. */
    <span
      aria-label={`${formatRating(note)} sur ${bareme}`}
      {...rest}
      className={clsx('opale-rating', className)}
      role="img"
      data-opale-rating={note}
    >
      {Array.from({ length: bareme }, (_, index) => {
        const fill = Math.min(Math.max(note - index, 0), 1);
        const stopAt = `${(inkCut(fill) * 100).toFixed(2)}%`;
        const id = `${gradientId}-${index}`;

        return (
          <svg
            className="opale-rating__star"
            data-opale-rating-fill={fill}
            key={index}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              {/* DEUX ARRÊTS AU MÊME DÉCALAGE font une coupe NETTE. Un dégradé
                  dont les arrêts s'écartent donnerait un fondu, c'est-à-dire
                  une fraction floue : on ne saurait plus dire où l'étoile
                  s'arrête, ce qui est exactement l'information à lire. */}
              <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
                <stop offset={stopAt} stopColor="currentColor" />
                <stop offset={stopAt} stopColor="currentColor" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path
              d={RATING_STAR}
              fill={`url(#${id})`}
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </span>
  );
}

export interface StatCardProps extends ComponentPropsWithRef<'div'> {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  liquidGlass?: boolean;
}

export function StatCard({
  label,
  value,
  delta,
  liquidGlass = false,
  className,
  ...rest
}: StatCardProps) {
  return (
    <Surface {...rest} className={clsx('opale-stat-card', className)} liquidGlass={liquidGlass}>
      <span className="opale-stat-card__label">{label}</span>
      <strong className="opale-stat-card__value">{value}</strong>
      {delta && <span className="opale-stat-card__delta">{delta}</span>}
    </Surface>
  );
}

export interface DonutProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  value?: number;
  label?: string;
  /** Ce que la valeur mesure, lu avant elle : « Tâches terminées : 72% ». */
  context?: string;
}

export function Donut({
  value = 60,
  label = `${value}%`,
  context,
  className,
  style,
  ...rest
}: DonutProps) {
  /* Le style de l'appelant d'abord, la variable qui dessine l'anneau ensuite. */
  return (
    <div
      aria-label={context ? `${context} : ${label}` : label}
      {...rest}
      className={clsx('opale-donut', className)}
      data-label={label}
      style={{ ...style, '--opale-donut-value': `${value}%` } as CSSProperties}
      role="img"
    />
  );
}

/* =============================================================================
   LA TABLE SE TRIE PAR SES EN-TÊTES.

   Elle promettait « tri, sélection et clavier » et rendait un `<table>`
   statique. Le tri existe désormais, colonne par colonne, sur déclaration :
   `sortable` sur la colonne, `sortValue` quand la cellule n'est pas du texte.

   LE CLAVIER, SANS `role="grid"`. L'en-tête triable porte un vrai `<button>` :
   Tab l'atteint, Entrée et Espace le déclenchent, sans une ligne de gestion
   de touches. Une grille à navigation par flèches aurait été plus lourde ET
   pire : elle remplace la table par un widget et coupe au lecteur d'écran ses
   raccourcis de lecture ligne à ligne, colonne à colonne. Le motif « table
   triable » de l'APG est précisément celui-ci.

   `aria-sort` N'EST POSÉ QUE SUR LA COLONNE TRIÉE, et la région de statut
   annonce le changement : les lecteurs d'écran ne relisent pas un
   `aria-sort` qui change sous le focus.

   L'ORDRE FRANÇAIS. `Intl.Collator('fr', { numeric: true })` : « avatar »
   avant « Bouton » avant « Écran » — la casse et l'accent ne décident pas —,
   et « item 2 » avant « item 10 ». Une cellule sans valeur triable (un nœud
   React sans `sortValue`) part en fin de liste dans les deux sens.
   ========================================================================== */
export type DataTableSortDirection = 'ascending' | 'descending';

export interface DataTableSort {
  key: string;
  direction: DataTableSortDirection;
}

export type DataTableRow = Record<string, ReactNode>;

export interface DataTableColumn {
  key: string;
  label: ReactNode;
  /** L'en-tête devient un bouton qui trie la colonne. */
  sortable?: boolean;
  /** Valeur de tri quand la cellule n'est pas du texte ou un nombre. */
  sortValue?: (row: DataTableRow) => string | number;
  /** Nom annoncé au tri quand `label` n'est pas du texte. */
  sortLabel?: string;
  /** Alignement de l'en-tête et des cellules ; utile pour les nombres. */
  align?: 'start' | 'center' | 'end';
}

/** Les tailles d'une table : `small` resserre les lignes. */
export type DataTableSize = Extract<OpaleSize, 'small' | 'medium'>;

/** Les textes d'une table. */
export interface DataTableLabels {
  /** Affiché et annoncé pendant le chargement. Défaut : « Chargement des données… ». */
  loading: string;
  /** Défaut : « Aucune donnée à afficher. ». */
  empty: string;
  /** Le compte sous la table. Défaut : « 1 ligne », « 3 lignes ». */
  rowCount: (count: number) => string;
  /** L'annonce d'un tri. Défaut : « Trié par Nom, ordre croissant ». */
  sorted: (column: string, direction: DataTableSortDirection) => string;
}

export interface DataTableProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  columns?: readonly DataTableColumn[];
  rows?: readonly DataTableRow[];
  /** Nom de la table, rendu en `<caption>`. */
  caption?: ReactNode;
  /** Présent, l'appelant tient le tri ; `null` : contrôlé sans tri. */
  sort?: DataTableSort | null;
  /** Le tri au montage quand `sort` est absent. */
  defaultSort?: DataTableSort;
  /** Appelée à chaque clic d'en-tête, avec le tri demandé. */
  onSortChange?: (sort: DataTableSort) => void;
  /** Stable identity when rows are inserted, removed or sorted. */
  rowKey?: (row: DataTableRow, index: number) => string | number;
  loading?: boolean;
  /** @deprecated Depuis 3.6 — utilisez `labels.empty`. */
  emptyMessage?: string;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<DataTableLabels>;
  /**
   * Langue(s) du tri alphabétique. Défaut `'fr'`. Seules les étiquettes prises en
   * charge sont gardées ; si aucune ne l'est, le tri se fait en `'fr'`.
   */
  locale?: string | readonly string[];
  liquidGlass?: boolean;
  /** L'espacement des lignes : `small` resserre sans changer la structure. Défaut : `medium`. */
  size?: DataTableSize;
  /** @deprecated Depuis 3.6 — utilisez `size` (`compact` → `small`). */
  density?: 'comfortable' | 'compact';
  /** Ajoute une alternance discrète aux lignes de données. */
  striped?: boolean;
  /** Affiche le nombre de lignes visibles sous la table. */
  showRowCount?: boolean;
}

const TABLE_COLLATOR_OPTIONS: Intl.CollatorOptions = { numeric: true, sensitivity: 'base' };

/**
 * Le collateur du tri, sur les seules langues que le moteur prend en charge.
 * Une étiquette mal formée ou inconnue est écartée ; sans aucune restante, `'fr'`.
 */
function createTableCollator(locales: readonly string[]): Intl.Collator {
  const supported: string[] = [];
  for (const locale of locales) {
    try {
      supported.push(...Intl.Collator.supportedLocalesOf(locale));
    } catch {
      /* Étiquette mal formée : écartée seule, les autres restent. */
    }
  }
  return new Intl.Collator(supported.length > 0 ? supported : ['fr'], TABLE_COLLATOR_OPTIONS);
}

const SORT_WORDING: Record<DataTableSortDirection, string> = {
  ascending: 'ordre croissant',
  descending: 'ordre décroissant',
};

const DEFAULT_DATA_TABLE_LABELS: DataTableLabels = {
  loading: 'Chargement des données…',
  empty: 'Aucune donnée à afficher.',
  rowCount: (count) => `${count} ${count === 1 ? 'ligne' : 'lignes'}`,
  sorted: (column, direction) => `Trié par ${column}, ${SORT_WORDING[direction]}`,
};

function sortNameOf(column: DataTableColumn): string {
  return column.sortLabel ?? (typeof column.label === 'string' ? column.label : column.key);
}

function sortKeyOf(row: DataTableRow, column: DataTableColumn): string | number | undefined {
  if (column.sortValue) return column.sortValue(row);
  const cell = row[column.key];
  return typeof cell === 'string' || typeof cell === 'number' ? cell : undefined;
}

/* UN ORDRE TOTAL, SINON `sort` N'A PAS DE RÉSULTAT DÉFINI. Comparer deux
   nombres en arithmétique et un nombre à un texte par le collateur formait des
   cycles — `1.5 < "1.10" < 1.25 < 1.5` — et l'ordre produit dépendait de
   l'ordre d'arrivée. Les nombres passent donc d'abord, entre eux, puis les
   textes, entre eux. */
function compareKeys(collator: Intl.Collator, a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'number') return -1;
  if (typeof b === 'number') return 1;
  return collator.compare(a, b);
}

export function DataTable({
  columns = [],
  rows = [],
  caption,
  sort: sortProp,
  defaultSort,
  onSortChange,
  rowKey,
  loading = false,
  emptyMessage,
  labels: labelsProp,
  locale = 'fr',
  liquidGlass = false,
  size,
  density,
  striped = false,
  showRowCount = false,
  className,
  ...rest
}: DataTableProps) {
  /* `size` gagne ; l'ancien `density` ne sert que s'il est seul. */
  const compact = (size ?? (density === 'compact' ? 'small' : 'medium')) === 'small';
  const [sort, setSort] = useControllableState<DataTableSort | null>(sortProp, defaultSort ?? null);
  /* L'ANNONCE DÉCRIT LE TRI RÉSOLU, PAS LE TRI DEMANDÉ. En mode contrôlé,
     l'appelant peut refuser un clic ou trier d'ailleurs : l'annonce se calcule
     donc au rendu depuis le tri effectif. Elle reste muette tant qu'aucun
     en-tête n'a été actionné, pour ne pas lire le tri initial au montage. */
  const [hasSorted, setHasSorted] = useState(false);
  /* `labels.empty` gagne ; l'ancien `emptyMessage` ne sert que s'il est seul. */
  const labels = resolveLabels(
    resolveLabels(DEFAULT_DATA_TABLE_LABELS, { empty: emptyMessage }),
    labelsProp,
  );
  /* Le collateur ne se recrée que si la langue change : la clé est une
     chaîne, donc une liste littérale recréée à chaque rendu ne compte pas. */
  const localeKey = typeof locale === 'string' ? locale : locale.join(',');
  const collator = useMemo(() => createTableCollator(localeKey.split(',')), [localeKey]);

  const sortedColumn = sort ? columns.find((column) => column.key === sort.key) : undefined;
  const announcement =
    hasSorted && sort && sortedColumn
      ? labels.sorted(sortNameOf(sortedColumn), sort.direction)
      : '';

  /* L'indice d'origine sert de clé : quand le tri déplace une ligne, React la
     déplace au lieu de la reconstruire. Il ne vaut que pour des `rows` stables
     — une ligne insérée en tête décale les indices, comme avant le tri. */
  const ordered = rows.map((row, index) => ({ row, index }));
  if (sort && sortedColumn) {
    const sign = sort.direction === 'ascending' ? 1 : -1;
    ordered.sort((left, right) => {
      const a = sortKeyOf(left.row, sortedColumn);
      const b = sortKeyOf(right.row, sortedColumn);
      if (a === undefined || b === undefined) {
        return a === b ? 0 : a === undefined ? 1 : -1;
      }
      return sign * compareKeys(collator, a, b);
    });
  }

  const toggle = (column: DataTableColumn) => {
    const direction: DataTableSortDirection =
      sort?.key === column.key && sort.direction === 'ascending' ? 'descending' : 'ascending';
    const next = { key: column.key, direction };
    setSort(next);
    setHasSorted(true);
    onSortChange?.(next);
  };

  return (
    <Surface
      {...rest}
      liquidGlass={liquidGlass}
      className={clsx('opale-panel', 'opale-table-panel', className)}
    >
      <div className="opale-table-scroll">
        <table
          className={clsx(
            'opale-table',
            compact && 'opale-table--compact',
            striped && 'opale-table--striped',
          )}
          aria-busy={loading || undefined}
        >
          {caption && <caption className="opale-table__caption">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key ? sort.direction : undefined;
                return (
                  <th key={column.key} scope="col" aria-sort={active} data-align={column.align}>
                    {column.sortable ? (
                      <button
                        type="button"
                        className="opale-table__sort"
                        data-sort={active}
                        onClick={() => toggle(column)}
                      >
                        {column.label}
                        <IconGlyph
                          name={
                            active === 'ascending'
                              ? 'chevron-up'
                              : active === 'descending'
                                ? 'chevron-down'
                                : 'sort'
                          }
                          className="opale-table__sort-icon"
                        />
                      </button>
                    ) : (
                      column.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={Math.max(1, columns.length)} className="opale-table__state-cell">
                  {/* Masqué aux outils : la région de statut l'annonce déjà. */}
                  <div className="opale-table__state" aria-hidden="true">
                    <span className="opale-spinner" />
                    <span>{labels.loading}</span>
                  </div>
                </td>
              </tr>
            ) : ordered.length === 0 ? (
              <tr>
                <td colSpan={Math.max(1, columns.length)} className="opale-table__state-cell">
                  <div className="opale-table__state">
                    <IconGlyph name="archive" className="opale-table__state-icon" />
                    <span>{labels.empty}</span>
                  </div>
                </td>
              </tr>
            ) : (
              ordered.map(({ row, index }) => (
                <tr key={rowKey?.(row, index) ?? index}>
                  {columns.map((column) => (
                    <td key={column.key} data-align={column.align}>
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showRowCount && !loading && (
        <div className="opale-table__footer">
          <span className="opale-table__count">{labels.rowCount(ordered.length)}</span>
        </div>
      )}
      <span className="opale-visually-hidden" role="status">
        {loading ? labels.loading : announcement}
      </span>
    </Surface>
  );
}

export interface LegalLinksProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  links?: readonly NavItem[];
}

export function LegalLinks({ links = [], className, ...rest }: LegalLinksProps) {
  return (
    <nav aria-label="Liens légaux" {...rest} className={clsx('opale-legal-links', className)}>
      {links.map((link) => (
        <a key={link.id} href={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
