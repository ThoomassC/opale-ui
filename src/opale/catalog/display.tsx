/* Les composants d'affichage de données du catalogue. */

import {
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import Glass from '../components/glass/Glass';
import { IconGlyph, isOpaleIconName, type OpaleIconName } from '../components/icon';
import {
  GLYPH_ARCHIVE,
  GLYPH_CHEVRON_DOWN,
  GLYPH_CHEVRON_UP,
  GLYPH_SORT,
  GLYPH_STAR,
} from '../components/icon/glyphs';
import { IconPaths } from '../components/icon/IconPaths';
import type { OpaleSize, OpaleTone } from '../shared';
import { warnDeprecatedProps, warnImplicitDefault } from '../deprecations';
import { resolveLabels } from '../shared/labels';
import { navigateOnClick, type NavigateHandler } from '../shared/navigate';
import { useControllableState } from '../shared/use-controllable-state';
import { Checkbox } from './forms';
import { Surface } from './shells';
import type { NavItem } from './navigation';

export interface CardProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Le titre de la carte, rendu dans la balise `titleAs`. */
  title?: ReactNode;
  /** La ligne sous le titre. */
  subtitle?: ReactNode;
  /** Des actions posées à droite de l'en-tête, des `Button` le plus souvent. */
  actions?: ReactNode;
  /** Le pied de la carte. Absent, la zone n'est pas rendue. */
  footer?: ReactNode;
  /** Le niveau d'ombre, de `0` (à plat) à `3`. Défaut : `1`. Gardé sous verre. */
  elevation?: 0 | 1 | 2 | 3;
  /** Rend la carte dans le matériau « verre liquide ». Défaut : `false`. */
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

/**
 * Le ton d'une pastille : une emphase de marque (`primary`, `accent`,
 * `danger`) ou un ton d'`OpaleTone` — `success`, `warning`, `info`,
 * `neutral`, `error` — pour un statut. `error` est rendu comme `danger`.
 */
export type BadgeTone = 'primary' | 'accent' | 'danger' | OpaleTone;

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  /** Défaut : `primary`. */
  tone?: BadgeTone;
  /** La taille de la pastille. Défaut : `medium`. */
  size?: OpaleSize;
  /** Un point de notification : le texte est masqué à l'œil, lu à l'oreille. */
  dot?: boolean;
  /** Rend la pastille dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /** Le texte de la pastille ; avec `dot`, lu sans être affiché. */
  children: ReactNode;
  /** Une classe ajoutée à côté de `.opale-badge`. */
  className?: string;
}

export function Badge({
  tone = 'primary',
  size = 'medium',
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
  /* `error` ET `danger` SONT LE MÊME ROUGE. Le premier vient d'`OpaleTone`,
     le second de l'emphase de marque d'avant la 2.10 : une seule classe. */
  const toneClass = tone === 'error' ? 'danger' : tone;
  const classes = clsx(
    'opale-badge',
    toneClass !== 'primary' && `opale-badge--${toneClass}`,
    size !== 'medium' && `opale-badge--${size}`,
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

/**
 * Le niveau HTML d'un titre, qui fixe sa place dans le plan de la page. Les
 * niveaux 5 et 6 prennent les deux plus petits pas de l'échelle typographique.
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingProps extends ComponentPropsWithRef<'h2'> {
  /** Le niveau HTML du titre, de `1` à `6`. Défaut : `2`. */
  level?: HeadingLevel;
  /** Le texte du titre. */
  children: ReactNode;
  /** Une classe ajoutée à côté de `.opale-heading`. */
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

/** Les balises qu'un texte peut rendre. */
export type TextElement = 'p' | 'span' | 'div' | 'label';

export interface TextProps extends ComponentPropsWithRef<'p'> {
  /** Le rôle typographique. Défaut : `body`. */
  variant?: TextVariant;
  /**
   * La balise rendue. Défaut : `p`. `span` pour un texte en ligne, `label`
   * pour nommer un champ (avec `htmlFor`). `ref` reste typée
   * `HTMLParagraphElement` pour ne casser aucun appel existant ; avec `as`,
   * elle reçoit l'élément effectivement rendu.
   */
  as?: TextElement;
  /** Avec `as="label"` : l'`id` du champ nommé. */
  htmlFor?: string;
  /** Le contenu du texte. */
  children: ReactNode;
  /** Une classe ajoutée à côté de `.opale-text`. */
  className?: string;
}

export function Text({
  variant = 'body',
  as = 'p',
  htmlFor,
  children,
  className,
  ...rest
}: TextProps) {
  /* Les attributs d'un `<p>` valent pour les quatre balises ; `htmlFor` n'a
     de sens que sur `<label>`, où React le traduit en `for`. */
  const Tag = as as 'p';
  const labelProps = as === 'label' && htmlFor !== undefined ? { htmlFor } : {};
  return (
    <Tag
      {...rest}
      {...labelProps}
      className={clsx('opale-text', `opale-text--${variant}`, className)}
    >
      {children}
    </Tag>
  );
}

export interface IconProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /**
   * Le nom d'une icône du jeu d'Opale — voir `ICON_NAMES` et la page « Icônes »
   * — ou n'importe quel nœud à rendre tel quel.
   *
   * DÉFAUT SURPRENANT : absent, l'icône dessine `sparkle`, une étincelle de
   * démonstration, et un avertissement de développement le signale. Passez
   * toujours `name` ; ce défaut disparaîtra en 3.0.0.
   *
   * LES DEUX FORMES COEXISTENT À DESSEIN. Le composant ne savait rendre qu'un
   * CARACTÈRE, et des appels existants passent « ✦ » ou « ⌘ » ; les casser
   * n'aurait rien apporté. Un nom connu dessine le tracé d'Opale, tout le
   * reste passe au travers inchangé.
   */
  name?: OpaleIconName | ReactNode;
  /** Le nom de l'icône, qui la rend `role="img"`. Absent, l'icône reste décorative. */
  label?: string;
  /** Une classe ajoutée à côté de `.opale-icon`. */
  className?: string;
}

export function Icon({ name, label, className, ...rest }: IconProps) {
  if (name === undefined) warnImplicitDefault('Icon');
  const glyph = name === undefined ? 'sparkle' : name;
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
      {isOpaleIconName(glyph) ? <IconGlyph name={glyph} className="opale-icon__glyph" /> : glyph}
    </span>
  );
}

/** Un couple terme / définition de `DescriptionList`. */
export interface DescriptionListItem {
  term: ReactNode;
  description: ReactNode;
}

export interface DescriptionListProps extends Omit<ComponentPropsWithRef<'dl'>, 'children'> {
  /** Les couples terme / définition, dans l'ordre de lecture. Défaut : aucun. */
  items?: readonly DescriptionListItem[];
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
  /** Les éléments de la liste, un `<li>` chacun. Défaut : aucun. */
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
const RATING_STAR = GLYPH_STAR[0];

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

/** Les textes de `Rating`. */
export interface RatingLabels {
  /**
   * Le nom de la note, calculé sur la note arrondie au quart et le barème
   * ramené à un entier. Défaut : « 3,75 sur 5 », virgule décimale comprise.
   */
  value: (value: number, max: number) => string;
}

const DEFAULT_RATING_LABELS: RatingLabels = {
  value: (value, max) => `${formatRating(value)} sur ${max}`,
};

export interface RatingProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** La note, arrondie au quart d'étoile et bornée à `[0, max]`. Défaut : `0`. */
  value?: number;
  /** Le barème, en étoiles : un entier de 1 à 20. Défaut : `5`. */
  max?: number;
  /** Pose la note sur le matériau « verre liquide ». Originale par défaut. */
  liquidGlass?: boolean;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<RatingLabels>;
}

export function Rating({
  value = 0,
  max = RATING_DEFAULT_MAX,
  liquidGlass = false,
  labels: labelsProp,
  className,
  ...rest
}: RatingProps) {
  const labels = resolveLabels(DEFAULT_RATING_LABELS, labelsProp);
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
  const Shell = liquidGlass ? Glass : 'span';
  const shellProps = liquidGlass
    ? ({ as: 'span', rootClassName: 'opale-rating--glass-root' } as const)
    : {};

  return (
    /* `role="img"` EST OBLIGATOIRE ICI. Un `aria-label` posé sur un élément
       sans rôle — un `<span>` a le rôle `generic` — est ignoré par les API
       d'accessibilité, et les étoiles enfants sont toutes `aria-hidden` : la
       note ne s'annonçait donc PAS DU TOUT (WCAG 1.1.1). `Icon`, quelques
       lignes plus haut, prend déjà cette précaution. */
    <Shell
      aria-label={labels.value(note, bareme)}
      {...rest}
      {...shellProps}
      className={clsx('opale-rating', liquidGlass && 'opale-rating--glass', className)}
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
    </Shell>
  );
}

export interface StatCardProps extends ComponentPropsWithRef<'div'> {
  /** Ce que mesure l'indicateur, au-dessus de la valeur. */
  label: ReactNode;
  /** La valeur mise en avant, déjà formatée. */
  value: ReactNode;
  /** L'évolution, sous la valeur : « +12 % sur un mois ». Absente, la ligne n'est pas rendue. */
  delta?: ReactNode;
  /** Rend la carte dans le matériau « verre liquide ». Défaut : `false`. */
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
  /**
   * Le pourcentage dessiné. DÉFAUT SURPRENANT : absent, l'anneau affiche
   * 60 %, une valeur de démonstration, et un avertissement de développement le
   * signale. Passez toujours `value` ; ce défaut disparaîtra en 3.0.0.
   */
  value?: number;
  /** Le texte affiché au centre et lu comme nom. Défaut : la valeur suivie de `%`. */
  label?: string;
  /** Ce que la valeur mesure, lu avant elle : « Tâches terminées : 72% ». */
  context?: string;
}

export function Donut({
  value: valueProp,
  label: labelProp,
  context,
  className,
  style,
  ...rest
}: DonutProps) {
  if (valueProp === undefined) warnImplicitDefault('Donut');
  const value = valueProp ?? 60;
  const label = labelProp ?? `${value}%`;
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

/** La ligne par défaut : un enregistrement de nœuds, lu colonne par colonne. */
export type DataTableRow = Record<string, ReactNode>;

/** L'identifiant d'une ligne, tel que la sélection le rend. */
export type DataTableRowId = string | number;

/**
 * Une colonne. `T` est le type des lignes : par défaut `DataTableRow`, pour
 * que les tables d'avant la 2.10 compilent à l'identique.
 */
export interface DataTableColumn<T = DataTableRow> {
  key: string;
  label: ReactNode;
  /**
   * Rend la cellule depuis la ligne et son indice d'origine. Absent, la
   * cellule affiche `row[key]` — seulement si c'est un nœud React : un `Date`
   * ou un objet n'est pas rendu, passez alors `cell`.
   */
  cell?: (row: T, index: number) => ReactNode;
  /** L'en-tête devient un bouton qui trie la colonne. */
  sortable?: boolean;
  /**
   * Valeur de tri, lue sur la donnée et non sur la cellule rendue. Absente,
   * le tri lit `row[key]` quand c'est un texte ou un nombre.
   */
  sortValue?: (row: T) => string | number;
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
  /**
   * Le nom de la case d'en-tête, avec `selectable`. Défaut : « Sélectionner
   * toutes les lignes ». Facultatif, comme `scrollRegion`, pour ne pas casser
   * les objets `DataTableLabels` déjà écrits.
   */
  selectAll?: string;
  /**
   * Le début du nom de la case d'une ligne, suivi du contenu de sa première
   * cellule : « Sélectionner Brun ». Défaut : « Sélectionner ».
   */
  selectRow?: string;
  /** L'annonce d'un tri. Défaut : « Trié par Nom, ordre croissant ». */
  sorted: (column: string, direction: DataTableSortDirection) => string;
  /**
   * Le nom de la zone de défilement quand la table déborde et n'a pas de
   * `caption` (sinon, c'est la légende qui la nomme). Défaut : « Tableau défilant ».
   * Facultatif pour ne pas casser les objets `DataTableLabels` déjà écrits.
   */
  scrollRegion?: string;
}

/**
 * Les props de `DataTable`. `T` est le type des lignes, déduit de `rows` et
 * `columns` ; sans paramètre, c'est `DataTableRow`, comme avant la 2.10.
 */
export interface DataTableProps<T = DataTableRow> extends Omit<
  ComponentPropsWithRef<'div'>,
  'children'
> {
  /** Les colonnes, dans l'ordre d'affichage. Défaut : aucune. */
  columns?: readonly DataTableColumn<T>[];
  /** Les lignes de données, dans l'ordre d'origine ; le tri ne les modifie pas. Défaut : aucune. */
  rows?: readonly T[];
  /** Nom de la table, rendu en `<caption>`. */
  caption?: ReactNode;
  /** Présent, l'appelant tient le tri ; `null` : contrôlé sans tri. */
  sort?: DataTableSort | null;
  /** Le tri au montage quand `sort` est absent. */
  defaultSort?: DataTableSort;
  /** Appelée à chaque clic d'en-tête, avec le tri demandé. */
  onSortChange?: (sort: DataTableSort) => void;
  /** Une identité stable des lignes, qui survit à l'insertion, au retrait et au tri. */
  rowKey?: (row: T, index: number) => string | number;
  /**
   * L'identifiant d'une ligne : sa clé React ET ce que la sélection rend.
   * Gagne sur `rowKey`. Absent, la sélection retombe sur `rowKey`, puis sur
   * l'indice d'origine — stable au tri, pas à l'insertion.
   */
  getRowId?: (row: T, index: number) => DataTableRowId;
  /** Ajoute une colonne de cases pour sélectionner des lignes. */
  selectable?: boolean;
  /** Présent, l'appelant tient la sélection. */
  selectedIds?: readonly DataTableRowId[];
  /** La sélection au montage quand `selectedIds` est absent. */
  defaultSelectedIds?: readonly DataTableRowId[];
  /** Appelée à chaque case cochée ou décochée, avec la sélection demandée. */
  onSelectedIdsChange?: (ids: DataTableRowId[]) => void;
  /**
   * Remplace le corps par `labels.loading`, annoncé, et marque la table `aria-busy`. Défaut :
   * `false`.
   */
  loading?: boolean;
  /** @deprecated Depuis 2.6 — utilisez `labels.empty`. */
  emptyMessage?: string;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<DataTableLabels>;
  /**
   * Langue(s) du tri alphabétique. Défaut `'fr'`. Seules les étiquettes prises en
   * charge sont gardées ; si aucune ne l'est, le tri se fait en `'fr'`.
   */
  locale?: string | readonly string[];
  /** Rend la table dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /** L'espacement des lignes : `small` resserre sans changer la structure. Défaut : `medium`. */
  size?: DataTableSize;
  /** @deprecated Depuis 2.6 — utilisez `size` (`compact` → `small`). */
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
  scrollRegion: 'Tableau défilant',
  selectAll: 'Sélectionner toutes les lignes',
  selectRow: 'Sélectionner',
};

const NO_SELECTION: readonly DataTableRowId[] = [];

/**
 * Ce qu'une cellule sans `cell` peut rendre sans faire échouer React.
 *
 * EN 2.9, TOUT `ReactNode` S'AFFICHAIT : un portail, un itérable, une promesse
 * (React 19). On les laisse donc passer tels quels. Seul l'objet ordinaire —
 * une `Date`, un enregistrement imbriqué, qu'une ligne générique peut porter
 * depuis la 2.10 — ferait lever React (« Objects are not valid as a React
 * child ») : celui-là ne s'affiche pas. Donnez `cell` pour le mettre en forme.
 */
function renderableCell(value: unknown): ReactNode {
  if (value === null || value === undefined || typeof value === 'boolean') return null;
  if (typeof value !== 'object') {
    return typeof value === 'function' || typeof value === 'symbol' ? null : (value as ReactNode);
  }
  if (
    isValidElement(value) ||
    '$$typeof' in value ||
    Symbol.iterator in value ||
    typeof (value as { then?: unknown }).then === 'function'
  ) {
    return value as ReactNode;
  }
  return null;
}

/** La valeur brute `row[key]`, quel que soit le type de la ligne. */
function fieldOf(row: unknown, key: string): unknown {
  return typeof row === 'object' && row !== null
    ? (row as Record<string, unknown>)[key]
    : undefined;
}

/* =============================================================================
   LA ZONE DE DÉFILEMENT DEVIENT ATTEIGNABLE QUAND ELLE DÉBORDE, ET SEULEMENT
   ALORS (ACC-13).

   À 360 px, la table défilait dans sa boîte sans qu'aucun élément ne puisse
   recevoir le focus quand aucune colonne n'est triable : les colonnes de
   droite étaient hors de portée du clavier (WCAG 2.1.1). Chromium rend ces
   zones focalisables d'office, Safari non.

   UN ARRÊT DE TABULATION QUI NE FAIT RIEN EST UN BRUIT : sans débordement, la
   zone reste un simple `<div>`. Le débordement se MESURE — c'est l'écran qui
   le décide, pas les données —, d'où l'observateur de taille, qui suit aussi
   bien la fenêtre que l'arrivée de nouvelles lignes. Au rendu serveur, la zone
   part sans débordement : l'hydratation ne diverge pas, la mesure suit.
   ========================================================================== */
function useHorizontalOverflow<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const measure = () => setOverflowing(node.scrollWidth > node.clientWidth + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => observer.disconnect();
  }, []);

  return [ref, overflowing] as const;
}

function sortNameOf<T>(column: DataTableColumn<T>): string {
  return column.sortLabel ?? (typeof column.label === 'string' ? column.label : column.key);
}

function sortKeyOf<T>(row: T, column: DataTableColumn<T>): string | number | undefined {
  if (column.sortValue) return column.sortValue(row);
  const cell = fieldOf(row, column.key);
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

export function DataTable<T = DataTableRow>({
  columns = [],
  rows = [],
  caption,
  sort: sortProp,
  defaultSort,
  onSortChange,
  rowKey,
  getRowId,
  selectable = false,
  selectedIds: selectedIdsProp,
  defaultSelectedIds,
  onSelectedIdsChange,
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
}: DataTableProps<T>) {
  warnDeprecatedProps('DataTable', { emptyMessage, density });
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
  const captionId = useId();
  const [scrollRef, overflowing] = useHorizontalOverflow<HTMLDivElement>();
  const scrollRegionProps = overflowing
    ? ({
        role: 'region',
        tabIndex: 0,
        'aria-labelledby': caption ? captionId : undefined,
        'aria-label': caption
          ? undefined
          : (labels.scrollRegion ?? DEFAULT_DATA_TABLE_LABELS.scrollRegion),
      } as const)
    : {};

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

  /* LA SÉLECTION EST UNE LISTE D'IDENTIFIANTS, PAS D'INDICES À L'ÉCRAN : le
     tri déplace les lignes, la sélection les suit. L'ordre rendu est celui
     des choix, la case d'en-tête ajoutant les lignes manquantes dans l'ordre
     d'origine. */
  const [selectedIds, setSelectedIds] = useControllableState<readonly DataTableRowId[]>(
    selectedIdsProp,
    defaultSelectedIds ?? NO_SELECTION,
  );
  const idOf = (row: T, index: number): DataTableRowId =>
    getRowId?.(row, index) ?? rowKey?.(row, index) ?? index;
  const selected = new Set(selectedIds);
  const rowIds = rows.map((row, index) => idOf(row, index));
  const selectedCount = rowIds.filter((id) => selected.has(id)).length;
  const allSelected = rowIds.length > 0 && selectedCount === rowIds.length;
  const selectionId = useId();
  const changeSelection = (next: DataTableRowId[]) => {
    setSelectedIds(next);
    onSelectedIdsChange?.(next);
  };
  const toggleRow = (id: DataTableRowId) =>
    changeSelection(
      selected.has(id) ? selectedIds.filter((current) => current !== id) : [...selectedIds, id],
    );
  const toggleAll = () => {
    const visible = new Set(rowIds);
    changeSelection(
      allSelected
        ? selectedIds.filter((id) => !visible.has(id))
        : [...selectedIds, ...rowIds.filter((id) => !selected.has(id))],
    );
  };
  const columnCount = Math.max(1, columns.length + (selectable ? 1 : 0));

  const toggle = (column: DataTableColumn<T>) => {
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
      <div ref={scrollRef} className="opale-table-scroll" {...scrollRegionProps}>
        <table
          className={clsx(
            'opale-table',
            compact && 'opale-table--compact',
            striped && 'opale-table--striped',
          )}
          aria-busy={loading || undefined}
        >
          {caption && (
            <caption id={captionId} className="opale-table__caption">
              {caption}
            </caption>
          )}
          <thead>
            <tr>
              {selectable && (
                <th scope="col" className="opale-table__select">
                  <Checkbox
                    aria-label={labels.selectAll ?? DEFAULT_DATA_TABLE_LABELS.selectAll}
                    checked={allSelected}
                    indeterminate={selectedCount > 0 && !allSelected}
                    disabled={loading || rowIds.length === 0}
                    onChange={toggleAll}
                  />
                </th>
              )}
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
                        <IconPaths
                          paths={
                            active === 'ascending'
                              ? GLYPH_CHEVRON_UP
                              : active === 'descending'
                                ? GLYPH_CHEVRON_DOWN
                                : GLYPH_SORT
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
                <td colSpan={columnCount} className="opale-table__state-cell">
                  {/* Masqué aux outils : la région de statut l'annonce déjà. */}
                  <div className="opale-table__state" aria-hidden="true">
                    <span className="opale-spinner" />
                    <span>{labels.loading}</span>
                  </div>
                </td>
              </tr>
            ) : ordered.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="opale-table__state-cell">
                  <div className="opale-table__state">
                    <IconPaths paths={GLYPH_ARCHIVE} className="opale-table__state-icon" />
                    <span>{labels.empty}</span>
                  </div>
                </td>
              </tr>
            ) : (
              ordered.map(({ row, index }) => {
                const id = rowIds[index];
                const isSelected = selectable && selected.has(id);
                /* LE NOM DE LA CASE SE LIT DANS LA LIGNE : « Sélectionner »,
                   puis la première cellule. Cent cases nommées « Sélectionner
                   la ligne » ne se distinguent pas dans la liste des champs
                   d'un lecteur d'écran (WCAG 2.4.6). */
                const firstCellId = `${selectionId}-cell-${index}`;
                return (
                  <tr key={id} data-selected={isSelected ? 'true' : undefined}>
                    {selectable && (
                      <td className="opale-table__select">
                        <Checkbox
                          aria-labelledby={
                            columns.length > 0
                              ? `${selectionId}-row ${firstCellId}`
                              : `${selectionId}-row`
                          }
                          checked={isSelected}
                          onChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((column, position) => (
                      <td
                        key={column.key}
                        id={selectable && position === 0 ? firstCellId : undefined}
                        data-align={column.align}
                      >
                        {column.cell
                          ? column.cell(row, index)
                          : renderableCell(fieldOf(row, column.key))}
                      </td>
                    ))}
                  </tr>
                );
              })
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
      {selectable && (
        <span id={`${selectionId}-row`} hidden>
          {labels.selectRow ?? DEFAULT_DATA_TABLE_LABELS.selectRow}
        </span>
      )}
    </Surface>
  );
}

/** Les textes de `LegalLinks`. */
export interface LegalLinksLabels {
  /** Le nom du repère, quand `aria-label` n'est pas passé. Défaut : « Liens légaux ». */
  navigation: string;
}

const DEFAULT_LEGAL_LINKS_LABELS: LegalLinksLabels = { navigation: 'Liens légaux' };

export interface LegalLinksProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  /** Les liens légaux, dans l'ordre d'affichage. Défaut : aucun. */
  links?: readonly NavItem[];
  /**
   * Le crochet du routeur de l'application, même contrat que
   * `Navbar.onNavigate` : sur un clic gauche simple, la navigation native est
   * annulée puis le crochet appelé avec le lien et l'événement. Ctrl, Cmd,
   * Maj, Alt, le clic du milieu et un `target` vers un autre onglet restent
   * au navigateur.
   */
  onNavigate?: NavigateHandler<NavItem>;
  /** Remplace les textes français par défaut, clé par clé. `aria-label` gagne sur `labels.navigation`. */
  labels?: Partial<LegalLinksLabels>;
}

export function LegalLinks({
  links = [],
  onNavigate,
  labels: labelsProp,
  className,
  ...rest
}: LegalLinksProps) {
  const labels = resolveLabels(DEFAULT_LEGAL_LINKS_LABELS, labelsProp);
  return (
    <nav aria-label={labels.navigation} {...rest} className={clsx('opale-legal-links', className)}>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.href}
          onClick={(event) => navigateOnClick(link, event, onNavigate)}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
