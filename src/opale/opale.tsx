import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type CSSProperties,
  type DragEvent,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEventHandler,
  type ReactNode,
  type Ref,
  type RefCallback,
} from 'react';
import { createPortal } from 'react-dom';

import Glass from './components/glass/Glass';
import SearchBar from './components/search-bar/SearchBar';
import { PageScaffold } from './components/page-scaffold';
import { IconGlyph, OPALE_ICONS, isOpaleIconName, type OpaleIconName } from './components/icon';
/* `Modal` PORTE LE MOTIF DIALOGUE, ET QUATRE COMPOSANTS D'ICI EN VIVAIENT SANS.

   `ConfirmDialog`, `SidePanel`, `CommandPalette` et `Lightbox` peignaient
   chacun leur propre voile et leur propre boîte. Aucun n'avait de piège de
   focus, de fermeture par Échap, de restitution du focus au déclencheur ni de
   verrou de défilement — et `ConfirmDialog` annonçait pourtant
   `aria-modal="true"`, ce qui est un mensonge coûteux : le lecteur d'écran
   croit l'arrière-plan neutralisé quand la tabulation y circule encore. Sur
   une confirmation de suppression, on pouvait actionner les boutons DERRIÈRE
   la demande de confirmation.

   `Modal` fait tout cela, et il est déjà testé pour. Les quatre deviennent
   donc ce qu'ils auraient toujours dû être : des PRÉRÉGLAGES. */
import { Modal, type ModalLabels } from './components/modal';
import { Sidebar } from './components/sidebar';
import { SiteNav } from './components/site-nav';
import { Tabs } from './components/tabs';
import { ToastProvider } from './components/toast';
import { Topbar } from './components/topbar';
import {
  useSvgMapViewport,
  type SvgMapWheel,
  type UseSvgMapViewportResult,
} from './components/svg-map';
import { pathBounds, type Bounds } from './components/svg-map/path-bounds';
import { useSvgMapGestures } from './components/svg-map/useSvgMapGestures';
import { parseViewBox as parseSvgViewBox } from './components/svg-map/viewport';
import toastMotion from './components/toast/style/Toast.module.css';
import type { ToastLabels } from './components/toast';
import { CATALOG, type ShowcaseCatalogEntry } from './catalog';
import { Pagination, RatingInput, Skeleton } from './opale-extras';
import type { OpalePlacement, OpaleSize, OpaleTone } from './shared';
import { resolveLabels } from './shared/labels';
import { mergeRefs } from './shared/merge-refs';
import { useControllableState, useOptionalState } from './shared/use-controllable-state';
import { useScrollPadding } from './shared/use-scroll-padding';
export { Pagination, RatingInput, Skeleton } from './opale-extras';
export type {
  PaginationLabels,
  PaginationProps,
  RatingInputProps,
  SkeletonProps,
} from './opale-extras';

/* =============================================================================
   LE VERRE EST LA PEAU, LE CONTRÔLE NATIF RESTE LE MOTEUR.

   C'est la règle qui gouverne les sept fusions de ce fichier, et elle mérite
   d'être posée une fois plutôt que réexpliquée sept.

   UN SEUL COMPOSANT PAR NOM, ET `liquidGlass` CHOISIT SA MATIÈRE.

   Le paquet publiait deux `Button`, deux `Input`, deux `Card`… : les siens, et
   ceux d'une librairie tierce dont le code était copié dans le dépôt. La prop
   `liquidGlass` ne posait qu'une classe — un lavis CSS qui imitait le verre
   sans l'être.

   ELLE REND DÉSORMAIS LE VRAI MATÉRIAU, ET CE MATÉRIAU EST LE NÔTRE.
   `Glass` (`./components/glass/Glass`) est écrit par Opale : trois couches —
   réfraction, lavis, filet spéculaire — et un contenu. Il ne reste aucune
   ligne de code tiers derrière cette prop.

   CE QUE CELA A SIMPLIFIÉ, ET C'EST LE VRAI GAIN. Une version précédente
   rendait le composant TIERS comme peau, par-dessus le contrôle d'Opale. Il
   fallait alors lui reprendre de force sa géométrie, sa typographie et ses
   couleurs, à coups de `!important`, parce que son module CSS était injecté
   après notre feuille. Chacun de ces rattrapages a coûté un défaut vu à
   l'écran : un bouton de 125 px au lieu de 100, une carte qui perdait 37 px,
   un texte indicatif blanc sur blanc, un interrupteur VERT au milieu d'une
   interface bleue, un badge qui passait ses libellés en capitales.

   Tout cela vient de disparaître, et pour une raison simple : le verre
   enveloppe désormais LE BALISAGE D'OPALE. `<Glass as="button"
   className="opale-button opale-button--primary">` est le bouton d'Opale — ses
   classes, sa silhouette, sa taille, son encre — posé sur nos trois couches.
   Il n'y a plus deux géométries à réconcilier, donc plus rien à forcer.

   LE CONTRÔLE NATIF RESTE LE MOTEUR, et cela n'a pas changé : là où un
   composant porte un état — case, interrupteur, curseur, sélecteur —, c'est
   l'élément natif qui garde le focus, le clavier, le nom de formulaire et son
   `ChangeEvent`. Le verre ne fait que l'habiller.
   ========================================================================== */

/** Le rôle visuel d'un bouton. */
export type ButtonVariant =
  'primary' | 'secondary' | 'accent' | 'danger' | 'tonal' | 'ghost' | 'text';

/** Un choix proposé par une liste : sa valeur de formulaire et son libellé. */
export interface SelectOption {
  value: string;
  label: ReactNode;
}

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ');

/**
 * La coquille d'un champ : du verre quand on le demande, un simple `<span>`
 * sinon.
 *
 * Les cinq champs à état — saisie, sélection, curseur, case, interrupteur —
 * ont exactement le même besoin : remplacer LA BOÎTE par du verre sans toucher
 * à ce qu'elle contient. L'écrire cinq fois aurait fait diverger cinq copies à
 * la première correction ; c'est d'ailleurs ce qui était en train d'arriver.
 *
 * LE CONTENU EST IDENTIQUE DANS LES DEUX BRANCHES, et c'est la propriété qui
 * compte : le contrôle natif, son `id`, son `name`, son `ref` et son
 * `ChangeEvent` ne dépendent pas de la matière choisie.
 */
function FieldShell({
  liquidGlass,
  className,
  rootClassName,
  pressFeedback,
  children,
}: {
  liquidGlass: boolean;
  className?: string;
  rootClassName?: string;
  /**
   * Le rebond d'appui. `Glass` le déduit de la balise rendue, et cette
   * coquille est toujours un `<span>` : la déduction dit donc « surface » pour
   * la case à cocher comme pour le champ de saisie. C'est juste pour le champ
   * — on ne presse pas un champ, on y écrit — et faux pour la case, qu'on
   * presse bel et bien. D'où ce réglage, posé au cas par cas.
   */
  pressFeedback?: boolean;
  children: ReactNode;
}) {
  if (!liquidGlass) return <span className={className}>{children}</span>;

  return (
    <Glass
      as="span"
      className={className}
      rootClassName={rootClassName}
      pressFeedback={pressFeedback}
    >
      {children}
    </Glass>
  );
}

interface SurfaceProps extends ComponentPropsWithRef<'div'> {
  liquidGlass?: boolean;
}

/* LA SURFACE PARTAGÉE REND LE VRAI VERRE, ELLE AUSSI.

   Elle posait `opale-liquid` : un lavis CSS — deux dégradés radiaux et un flou
   d'arrière-plan — qui IMITAIT le matériau. L'imitation se voyait dès qu'on
   comparait : la carte affichait du vrai verre sous le commutateur pendant que
   `StatCard`, bâtie sur cette même surface, gardait le lavis. Deux rendus du
   même « verre liquide » sur la même page.

   Le matériau étant désormais le nôtre, il n'y a plus de raison de l'imiter. */
function Surface({ liquidGlass = false, className, children, ...props }: SurfaceProps) {
  const classes = cx('opale-surface', liquidGlass && 'opale-surface--glass', className);

  if (liquidGlass) {
    return (
      <Glass className={classes} rootClassName="opale-surface--glass-root" {...props}>
        {children}
      </Glass>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  variant?: ButtonVariant;
  size?: OpaleSize;
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
  liquidGlass?: boolean;
}

/* =============================================================================
   UN SEUL BOUTON, ET `liquidGlass` CHOISIT SA MATIÈRE.

   IL Y EN AVAIT DEUX, ET C'EST CE QUI EST CORRIGÉ ICI. Le paquet exportait un
   `Button` d’origine — celui qui passe par `<Glass>`, avec ses filtres SVG de
   déplacement et son onde au clic — ET ce `Button`, dont la prop
   `liquidGlass` ne posait qu'une classe CSS : deux dégradés radiaux sur
   `--opale-glass-surface`. Deux composants du même nom, dont l'un imitait
   l'autre sans l'égaler.

   DÉSORMAIS LA PROP DÉLÈGUE AU VRAI MATÉRIAU. `liquidGlass` ne repeint plus un
   fond : elle rend le composant de verre lui-même. « Activer le verre » et
   « utiliser le composant de verre » sont devenus la même chose, ce qui était
   déjà la promesse de la prop — elle ne la tenait pas.

   CE QUE CELA DONNE À QUI INTÈGRE : un seul nom à connaître, et le choix
   d'embarquer ou non le matériau, composant par composant, sans changer
   d'import.

   LE VERRE PORTE LA PALETTE D'OPALE, PAS CELLE DU COMPOSANT D’ORIGINE.

   Une première version faisait correspondre les sept rôles Opale aux quatre
   teintes de l’ancien composant — `danger` sur `negative`, `accent` sur `warning`. Elle
   s'est démentie toute seule le jour où le secondaire est passé de l'olive au
   bleu : sous verre il restait VERT, parce qu'il empruntait la teinte
   `positive` d'une autre palette. Une correspondance arbitraire ne survit pas
   au premier changement de marque.

   Le ancien composant en verre est donc rendu SANS variante, et la teinte vient d'une
   classe par rôle Opale, tirée des jetons. Basculer le commutateur ne change
   plus la couleur du bouton, seulement sa matière — ce qui était le propos.

   CE QUI SE PERD, ET IL FAUT LE SAVOIR : `loading`, `startIcon`, `endIcon` et
   `fullWidth` n'existent pas sur le ancien composant en verre. Ils sont ignorés sous
   verre, et c'est préférable à une seconde implémentation qui les simulerait
   mal. `opale.tsx` cesse par ailleurs d'être une feuille autonome : c'est le
   prix d'un composant unique, et il est moins cher que le doublon.
   ========================================================================== */
export const Button = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'ref'>>(function Button(
  {
    variant = 'primary',
    size = 'medium',
    loading = false,
    startIcon,
    endIcon,
    fullWidth = false,
    liquidGlass = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  /* LE MÊME CONTENU DANS LES DEUX ÉTATS, et c'est ce qui garantit que le
     commutateur ne change QUE la matière. Une version précédente déléguait à
     un composant tiers qui n'avait ni `loading`, ni `startIcon`, ni
     `endIcon`, ni `fullWidth` : ces quatre props étaient silencieusement
     ignorées sous verre. Elles fonctionnent maintenant des deux côtés,
     puisqu'il n'y a plus qu'un seul balisage. */
  const content = (
    <>
      {/* L'ICÔNE EST DÉCORATIVE, ET ELLE DOIT LE DIRE. Rendue nue, la
          glyphe entrait dans le nom du bouton : « × Supprimer », « ✎
          Modifier », « ✓ Approuver ». La commande vocale ne retrouvait plus
          « Supprimer », et le lecteur d'écran lisait un caractère avant
          chaque libellé (WCAG 2.5.3). Un bouton SANS texte, lui, passe par
          `aria-label` — voir `IconActionButton`. */}
      {loading ? (
        <span className="opale-spinner" aria-hidden="true" />
      ) : (
        startIcon && <span aria-hidden="true">{startIcon}</span>
      )}
      <span>{children}</span>
      {!loading && endIcon}
    </>
  );

  const classes = cx(
    'opale-button',
    `opale-button--${variant}`,
    size !== 'medium' && `opale-button--${size}`,
    fullWidth && 'opale-button--full',
    liquidGlass && 'opale-button--glass',
    className,
  );

  /* LE DÉCOUPAGE EN SQUIRCLE APPARTIENT À L'ENVELOPPE, pas au contenu. Les
     trois couches du verre vivent DERRIÈRE le bouton, dans le conteneur : ne
     découper que le contenu laissait la réfraction et le filet spéculaire
     dépasser en rectangle tout autour de la silhouette. */
  if (liquidGlass) {
    return (
      <Glass
        as="button"
        ref={ref}
        className={classes}
        rootClassName={cx('opale-button--glass-root', fullWidth && 'opale-button--full')}
        enableLiquidAnimation
        disabled={disabled || loading}
        type={type}
        {...props}
      >
        {content}
      </Glass>
    );
  }

  return (
    <button ref={ref} className={classes} disabled={disabled || loading} type={type} {...props}>
      {content}
    </button>
  );
});
Button.displayName = 'Button';

/** Les props de `Pressable` : celles de `Button`, dont la variante `text` est le défaut. */
export type PressableProps = ButtonProps;

export const Pressable = forwardRef<HTMLButtonElement, Omit<PressableProps, 'ref'>>(
  function Pressable(props, ref) {
    return <Button variant="text" {...props} ref={ref} />;
  },
);
Pressable.displayName = 'Pressable';

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

  const classes = cx(
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
        rootClassName={cx('opale-card--glass-root', `opale-card--glass-root--e${elevation}`)}
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
    <div className={cx('opale-card-grid', className)} {...props}>
      {children}
    </div>
  );
}

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  icon?: ReactNode;
  liquidGlass?: boolean;
  /** Avec `type="search"`, pose le repère `search` autour du champ. Défaut : `true`. */
  searchLandmark?: boolean;
  /** Avec `type="search"`, le nom du repère `search`. */
  searchLandmarkLabel?: string;
}

/** @deprecated Depuis 3.6 — utilisez `InputProps`. */
export type FieldProps = InputProps;

export const Input = forwardRef<HTMLInputElement, Omit<InputProps, 'ref'>>(function Input(
  {
    label,
    helperText,
    error,
    icon,
    liquidGlass = false,
    searchLandmark,
    searchLandmarkLabel,
    className,
    id,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error || helperText;

  /* LE MESSAGE SORT DU `<label>`, ET C'EST TOUT L'OBJET DE CE REMANIEMENT.

     L'ensemble du champ était enveloppé dans un `<label>` : le texte d'aide
     et le message d'erreur se retrouvaient donc DANS le nom accessible.
     « E-mail » devenait « E-mail Adresse invalide » — ce qui casse la
     commande vocale, qui ne retrouve plus « E-mail », et noie l'erreur dans
     l'étiquette au lieu d'en faire une description.

     Pire : rien ne l'ANNONÇAIT. Ni `aria-describedby`, ni `aria-invalid`,
     ni région live. On validait, le message apparaissait, et il ne se
     passait rien d'audible (WCAG 4.1.3 et 3.3.1).

     Le libellé redevient donc un `<label htmlFor>` — le clic dessus focalise
     toujours le champ —, et le message devient une description annoncée. */
  return (
    <div className={cx('opale-field', className)}>
      {label && (
        <label className="opale-field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      {/* LA FRONTIÈRE PASSE SOUS LE LIBELLÉ, ET AU-DESSUS DU CHAMP.

          Ce qui porte du TEXTE reste hors du verre — le libellé, le texte
          d'aide, le message d'erreur, et l'association `htmlFor`/`id` qui les
          relie. Seule la BOÎTE du champ devient du verre.

          `icon` FONCTIONNE MAINTENANT SOUS VERRE. Le champ tiers n'avait
          aucun emplacement où la poser, donc la prop était silencieusement
          ignorée dès qu'on basculait le commutateur. La coquille étant
          désormais la nôtre, l'icône y reste. */}
      {props.type === 'search' ? (
        <SearchBar
          {...props}
          ref={ref}
          id={inputId}
          icon={icon}
          liquidGlass={liquidGlass}
          landmark={searchLandmark}
          landmarkLabel={searchLandmarkLabel}
          aria-invalid={error ? true : props['aria-invalid']}
          aria-describedby={message ? messageId : props['aria-describedby']}
        />
      ) : (
        <FieldShell
          liquidGlass={liquidGlass}
          className={cx('opale-input-shell', liquidGlass && 'opale-input-shell--glass')}
          rootClassName="opale-input--glass-root"
        >
          {icon}
          <input
            ref={ref}
            id={inputId}
            className="opale-input"
            aria-invalid={error ? true : undefined}
            aria-describedby={message ? messageId : undefined}
            {...props}
          />
        </FieldShell>
      )}
      {message && (
        <span
          id={messageId}
          /* `role="alert"` SUR LA SEULE ERREUR. Un texte d'aide est là dès
             le départ : l'annoncer d'autorité couperait la parole au reste
             de la page pour redire ce que la description dit déjà. */
          role={error ? 'alert' : undefined}
          className={cx('opale-field__helper', Boolean(error) && 'opale-field__helper--error')}
        >
          {message}
        </span>
      )}
    </div>
  );
});
Input.displayName = 'Input';

export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
  /** L'erreur, annoncée et décrite après la description ; rend la case invalide. */
  error?: ReactNode;
  liquidGlass?: boolean;
}

/** Le message d'erreur d'un contrôle en rangée, hors de son `<label>`. */
function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} role="alert" className="opale-field__helper opale-field__helper--error">
      {children}
    </span>
  );
}

export function Checkbox({
  label,
  description,
  error,
  liquidGlass = false,
  className,
  onChange,
  ...props
}: CheckboxProps) {
  const labelId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const describedBy =
    [label && description ? descriptionId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  /* L'ÉTAT N'A PLUS BESOIN D'ÊTRE RECOPIÉ EN JAVASCRIPT.

     La version précédente tenait un état miroir (`useMirrorState`) pour dire à
     la case tierce si elle devait se peindre cochée. La coche est désormais la
     nôtre : `.opale-checkbox:checked + * .opale-checkbox-mark` la peint depuis
     le CSS, à partir de l'état réel du natif. Un état dérivé de moins, c'est
     une occasion de désynchronisation de moins — et `onChange` redevient un
     simple passe-plat. */
  const row = (
    <label className={cx('opale-checkbox-row', className)}>
      {/* LA DESCRIPTION EST DÉCRITE, PLUS NOMMÉE. Rendue dans le `<label>`,
          elle entrait dans le nom de la case : « Recevoir les notifications
          Les nouveautés du design system ». Le nom d'une case doit être ce
          qu'on coche, et le reste une description (WCAG 1.3.1). */}
      <input
        type="checkbox"
        className="opale-checkbox"
        /* `aria-labelledby` DÉSIGNE LE SEUL LIBELLÉ, et il faut cette précision.
           Ajouter `aria-describedby` ne suffisait pas : la rangée EST un
           `<label>`, donc tout ce qu'elle contient — description comprise —
           entre dans le nom calculé. Nommer explicitement le prend de vitesse,
           et la rangée reste cliquable sur toute sa surface, ce qui est le
           point de la construire ainsi. */
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        onChange={onChange}
        {...props}
      />
      {/* LA COCHE EST UNE DÉCORATION, sous verre comme sans. La vraie case est
          l'`<input>` natif, invisible et posé sur toute la rangée ; c'est le
          `<label>` qui reçoit le clic. */}
      <FieldShell
        liquidGlass={liquidGlass}
        className={cx('opale-checkbox-mark', liquidGlass && 'opale-checkbox-mark--glass')}
        rootClassName="opale-checkbox--glass-root"
        pressFeedback
      >
        {null}
      </FieldShell>
      <span id={labelId}>{label ?? description}</span>
      {label && description && (
        <small id={descriptionId} className="opale-field__helper">
          {description}
        </small>
      )}
    </label>
  );
  if (!error) return row;
  return (
    <>
      {row}
      <FieldError id={errorId}>{error}</FieldError>
    </>
  );
}

export interface ToggleProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  label?: ReactNode;
  /** L'erreur, annoncée et décrite ; rend l'interrupteur invalide. */
  error?: ReactNode;
  liquidGlass?: boolean;
}

export function Toggle({
  label,
  error,
  liquidGlass = false,
  className,
  onChange,
  ...props
}: ToggleProps) {
  const errorId = useId();
  /* Même simplification que pour la case : la piste et sa poignée sont celles
     d'Opale, et `.opale-toggle:checked` les peint depuis le CSS. Le verre
     habille la piste sans se mêler de son état. */
  const row = (
    <label className={cx('opale-toggle-row', className)}>
      <input
        type="checkbox"
        className="opale-toggle"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={onChange}
        {...props}
      />
      <FieldShell
        liquidGlass={liquidGlass}
        className={cx('opale-toggle-track', liquidGlass && 'opale-toggle-track--glass')}
        rootClassName="opale-toggle--glass-root"
        pressFeedback
      >
        <span className="opale-toggle-thumb" />
      </FieldShell>
      {label && <span>{label}</span>}
    </label>
  );
  if (!error) return row;
  return (
    <>
      {row}
      <FieldError id={errorId}>{error}</FieldError>
    </>
  );
}

export interface SliderProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  label?: ReactNode;
  valueLabel?: ReactNode;
  /** La valeur dite en mots, en `aria-valuetext` : « 3 sur 10 ». */
  valueText?: string;
  /** Dérive `aria-valuetext` de la valeur, à chaque déplacement. `valueText` gagne. */
  getValueText?: (value: number) => string;
  liquidGlass?: boolean;
}

/* =============================================================================
   LA BULLE DU CURSEUR, ET CE QUI LA FAIT GLISSER.

   `STRETCH_MAX` BORNE LA DÉFORMATION. Au-delà d'un cinquième, la bulle cesse
   de ressembler à une goutte et devient un trait : l'effet se retourne contre
   lui-même. `STRETCH_GAIN` convertit une fraction de course parcourue depuis
   le dernier événement en allongement — un glissement continu envoie des pas
   de l'ordre du pour-cent, un clic à l'autre bout envoie tout d'un coup et se
   trouve écrêté.

   `STRETCH_RELAX_MS` EST CE QUI REND LA GOUTTE VIVANTE. Sans lui, la
   déformation resterait figée à la dernière valeur reçue : la bulle
   s'allongerait et n'en reviendrait jamais. Le délai est plus court que la
   cadence d'un glissement (un pointeur émet toutes les 8 à 16 ms), donc il ne
   se déclenche qu'à l'arrêt réel.
   ========================================================================== */
const STRETCH_MAX = 0.22;
const STRETCH_GAIN = 2.6;
const STRETCH_RELAX_MS = 140;

/** La fraction parcourue, bornée à [0, 1]. */
function rangeProgress(input: HTMLInputElement): number {
  const min = Number(input.min === '' ? 0 : input.min);
  const max = Number(input.max === '' ? 100 : input.max);

  if (!(max > min)) return 0;

  return Math.min(Math.max((Number(input.value) - min) / (max - min), 0), 1);
}

export function Slider({
  label,
  valueLabel,
  valueText,
  getValueText,
  liquidGlass = false,
  className,
  onChange,
  ref,
  ...props
}: SliderProps) {
  const generatedSliderId = useId();
  const sliderId = props.id ?? generatedSliderId;
  /* SOUS VERRE, LA PISTE EST LE MATÉRIAU LUI-MÊME.

     CE QUI N'ALLAIT PAS. Le curseur se contentait d'un `<input type="range">`
     natif posé dans une boîte de verre : sa piste était peinte par l'agent
     utilisateur, à `accent-color`, sur toute la largeur. Elle touchait donc
     les bords du verre et le débordait par endroits — un rail opaque au
     milieu d'un matériau transparent, qui ne ressemblait ni à du verre ni à
     un curseur d'Opale.

     CE QUI EST FAIT MAINTENANT. L'enveloppe de verre EST la piste : une pilule
     pleine largeur, avec ses trois couches. Le remplissage et la bulle sont
     deux DÉCORATIONS peintes par-dessus, et le natif — invisible, étendu sur
     toute la piste — reste la seule commande : son clavier, son `name`, son
     `ChangeEvent` et son rôle `slider` ne changent pas. C'est exactement le
     partage déjà en place pour la case à cocher.

     LA POSITION EST ÉCRITE DANS LE DOM, PAS DANS UN ÉTAT REACT. Un état
     miroir avait été supprimé de ce composant, et il ne revient pas : deux
     décorations n'ont pas besoin d'un rendu React pour bouger, elles ont
     besoin d'une variable CSS. L'écrire directement évite de re-rendre le
     composant à chaque pixel d'un glissement, et — surtout — évite de rendre
     contrôlé un curseur que l'appelant avait laissé libre. */
  const inputRef = useRef<HTMLInputElement>(null);
  /* La ref de l'appelant reçoit le même natif : un formulaire l'enregistre
     sans priver le curseur de celle qui pose sa progression. */
  const controlRef = useCallback(
    (node: HTMLInputElement | null) => mergeRefs(inputRef, ref)(node),
    [ref],
  );
  const previous = useRef<number | null>(null);
  const relax = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* La position se repose après CHAQUE rendu, sans condition. C'est ce qui
     couvre les cas qu'un gestionnaire d'événement ne voit pas : un curseur
     contrôlé dont le parent change la valeur, un `min`/`max` qui bouge, le
     premier montage. La déformation, elle, n'y est pas touchée — elle
     appartient au geste, et un rendu n'est pas un geste. */
  useEffect(() => {
    const input = inputRef.current;
    const shell = input?.parentElement;

    if (!input || !shell) return;

    const progress = rangeProgress(input);
    shell.style.setProperty('--opale-range-progress', String(progress));
    previous.current = progress;
    if (getValueText && valueText === undefined && props['aria-valuetext'] === undefined) {
      input.setAttribute('aria-valuetext', getValueText(Number(input.value)));
    }
  });

  useEffect(() => () => clearTimeout(relax.current), []);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const shell = input.parentElement;

    if (shell) {
      const progress = rangeProgress(input);
      shell.style.setProperty('--opale-range-progress', String(progress));

      /* WCAG 2.3.3 — la déformation est du mouvement non essentiel, et elle
         est pilotée depuis JavaScript : une règle CSS ne pourrait pas la
         retirer, un style en ligne l'emportant sur elle. La préférence se lit
         donc ici, à la source. */
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

      if (!reduced) {
        const delta = Math.abs(progress - (previous.current ?? progress));
        const stretch = Math.min(delta * STRETCH_GAIN, STRETCH_MAX);

        shell.style.setProperty('--opale-range-stretch', String(stretch));
        clearTimeout(relax.current);
        relax.current = setTimeout(() => {
          shell.style.setProperty('--opale-range-stretch', '0');
        }, STRETCH_RELAX_MS);
      }

      previous.current = progress;
    }
    /* Un curseur libre ne re-rend pas : le texte de valeur suit dans le DOM. */
    if (getValueText && valueText === undefined && props['aria-valuetext'] === undefined) {
      input.setAttribute('aria-valuetext', getValueText(Number(input.value)));
    }

    onChange?.(event);
  };

  /* LE NATIF EST ÉCRIT UNE FOIS ET POSÉ DANS LES DEUX BRANCHES. Les deux
     rendus n'ont pas la même charpente — sous verre il faut une piste fine et
     une bulle qui la dépasse —, mais le CONTRÔLE, lui, doit rester le même
     élément aux mêmes propriétés. L'extraire est ce qui empêche les deux
     branches de diverger sans qu'on le voie. */
  const control = (
    <input
      ref={controlRef}
      id={sliderId}
      type="range"
      className="opale-range"
      aria-valuetext={valueText}
      onChange={handleChange}
      {...props}
    />
  );

  return (
    <div className={cx('opale-field', className)}>
      {/* LE NOM DU CURSEUR CHANGEAIT À CHAQUE CRAN, et c'est le plus gênant des
          trois défauts de cette famille. Le `<label>` enveloppait la valeur
          autant que le libellé : le nom accessible devenait « Volume 42 »,
          puis « Volume 43 »… Toute commande vocale visant « Volume » échouait,
          et un lecteur d'écran réannonçait le nom du contrôle à chaque flèche.
          Le libellé nomme, la valeur décrit — et le curseur natif annonce déjà
          sa valeur par `aria-valuenow`. */}
      {(label || valueLabel) && (
        <span className="opale-card__header">
          <label className="opale-field__label" htmlFor={sliderId}>
            {label}
          </label>
          {/* PAS D'`aria-hidden` ICI. La valeur n'est plus dans le `<label>`,
              donc elle n'entre plus dans le nom du curseur : la cacher ne
              servirait qu'à la retirer aussi de la lecture ordinaire de la
              page, alors qu'elle est l'information qu'on affiche. */}
          <span>{valueLabel ?? props.value}</span>
        </span>
      )}
      {liquidGlass ? (
        /* LA BULLE VIT HORS DU VERRE, ET C'EST LA PISTE FINE QUI L'IMPOSE.

           La piste ne fait plus que douze pixels de haut. Le matériau clôt sa
           boîte (`overflow: hidden`, sans quoi ses trois couches déborderaient
           de la silhouette), donc une bulle de vingt-six pixels posée dedans
           serait rognée aux deux tiers. Elle sort ; la part mouillée, qui est
           l'eau DANS la piste, reste dedans.

           LE NATIF SORT AUSSI, et pour la même raison retournée : il couvre
           trente-six pixels de haut pour offrir une cible de pointeur
           confortable, quand la piste n'en montre que douze. Enfermé dans le
           verre, sa zone sensible aurait été rognée à la hauteur visible. */
        <span className="opale-range-field">
          <FieldShell
            liquidGlass
            className="opale-range-shell opale-range-shell--glass"
            rootClassName="opale-range--glass-root"
          >
            <span className="opale-range-wet" aria-hidden="true" />
          </FieldShell>
          {control}
          {/* APRÈS le natif : les deux états de la bulle — la prise et le
              focus clavier — se peignent par le sélecteur frère `~`, qui ne
              regarde que ce qui suit. */}
          <span className="opale-range-bubble" aria-hidden="true" />
        </span>
      ) : (
        <span className="opale-range-shell">{control}</span>
      )}
    </div>
  );
}

export interface SelectProps extends ComponentPropsWithRef<'select'> {
  label?: ReactNode;
  helperText?: ReactNode;
  /** L'erreur, annoncée et décrite à la place de l'aide ; rend le champ invalide. */
  error?: ReactNode;
  options?: readonly SelectOption[];
  liquidGlass?: boolean;
}

export function Select({
  label,
  helperText,
  error,
  options,
  liquidGlass = false,
  className,
  id,
  children,
  onChange,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  /* LE SÉLECTEUR REDEVIENT UN SEUL ÉLÉMENT, ET C'EST UN SOULAGEMENT.

     Le composant tiers n'était pas un `<select>` : un bouton et une liste de
     `<button>`. Le substituer aurait coûté le nom de formulaire, le sélecteur
     natif du mobile et les `<option>` passés en enfants — le champ se serait
     affiché et le formulaire aurait cessé d'envoyer sa valeur. Il fallait donc
     superposer le natif, transparent, par-dessus la peau, tenir les deux
     d'accord par un état miroir, et n'envoyer à la peau que les libellés qui
     étaient des chaînes, les `ReactNode` lui étant incompréhensibles.

     Tout cela tombe : le verre enveloppe le `<select>` natif d'Opale. Les
     libellés redeviennent des `ReactNode` sans condition, et `children`
     fonctionne sous verre comme sans. */
  /* LE TEXTE D'AIDE SORT DU `<label>`, COMME DANS `Input`. Enveloppé avec le
     champ, il entrait dans son NOM : « Pays Choisissez votre pays de
     résidence » au lieu de « Pays » décrit par une aide — ce qui casse la
     commande vocale visant « Pays » (WCAG 1.3.1). La correction avait été
     appliquée au champ de saisie et pas à ses trois voisins. */
  const helperId = `${selectId}-helper`;
  const message = error || helperText;

  return (
    <div className={cx('opale-field', className)}>
      {label && (
        <label className="opale-field__label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <FieldShell
        liquidGlass={liquidGlass}
        className={cx('opale-input-shell', liquidGlass && 'opale-input-shell--glass')}
        rootClassName="opale-input--glass-root"
      >
        <select
          id={selectId}
          className="opale-select"
          aria-describedby={message ? helperId : undefined}
          aria-invalid={error ? true : undefined}
          onChange={onChange}
          {...props}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
      </FieldShell>
      {message && (
        <span
          id={helperId}
          role={error ? 'alert' : undefined}
          className={cx('opale-field__helper', Boolean(error) && 'opale-field__helper--error')}
        >
          {message}
        </span>
      )}
    </div>
  );
}

export interface MultiSelectProps extends SelectProps {
  /**
   * La sélection. Présente, l'appelant la tient. Un tableau est la forme
   * attendue ; une valeur seule vaut une sélection d'un élément.
   */
  value?: SelectProps['value'];
  /** Appelée après chaque bascule, avec la sélection complète. `onChange` natif part aussi. */
  onValueChange?: (value: string[]) => void;
  /** @deprecated Depuis 3.6 — utilisez `value`. */
  values?: readonly string[];
}

/* Une sélection multiple se lit toujours en tableau. Le type hérité du
   `<select>` natif admet aussi une chaîne ou un nombre : ils valent une
   sélection d'un élément. */
function toSelection(value: SelectProps['value']): readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  return value;
}

/**
 * La sélection multiple, habillée aux couleurs d'Opale.
 *
 * ================================================================
 * POURQUOI CE COMPOSANT N'EST PLUS UN `<select multiple>` VISIBLE.
 *
 * Il en était un, et c'était un mur : la liste déroulante multiple native est
 * la SEULE commande de formulaire qu'aucune feuille de style ne peut habiller.
 * Ses rangées sélectionnées sont peintes par le système d'exploitation — d'où
 * les bandes GRISES qui traversaient le composant au milieu d'une vitrine qui
 * n'a pas une seule autre surface grise. Ni `background`, ni `color`, ni
 * `::selection`, ni `appearance: none` n'ont de prise dessus : le rendu
 * appartient au moteur, pas au document.
 *
 * LE NATIF N'A PAS DISPARU POUR AUTANT — IL EST DEVENU LE PORTEUR DE VALEUR.
 * Un `<select multiple>` reste rendu, masqué visuellement, et c'est lui qui
 * porte les `<option>` et leur état `selected`. Cela préserve À L'IDENTIQUE le
 * contrat des consommateurs : `onChange` reçoit un événement dont
 * `currentTarget.selectedOptions` est la liste attendue, et le champ continue
 * de participer à la soumission d'un formulaire avec son `name`. Réécrire
 * l'API aurait cassé tous les appels existants pour un gain d'apparence.
 *
 * L'ÉVÉNEMENT EST ÉMIS SUR LE NATIF, ET C'EST CE QUI REND L'ILLUSION HONNÊTE.
 * Cocher une option modifie `option.selected` puis distribue un `change` qui
 * bouillonne : React l'entend à la racine et appelle le `onChange` du
 * consommateur avec le vrai `<select>` pour cible. Personne n'a à savoir que
 * la liste visible est faite de `<div>`.
 *
 * LE NATIF EST HORS DE L'ARBRE D'ACCESSIBILITÉ (`aria-hidden`, `tabIndex={-1}`)
 * et la liste VISIBLE porte les rôles. L'inverse — garder le natif focusable
 * et décorer par-dessus — était tentant et faux : un champ focusable invisible
 * est un piège au clavier, d'autant plus depuis que la vitrine ne peint plus
 * d'anneau de focus. Ici, ce qu'on voit est ce qu'on pilote.
 * ================================================================
 */
export function MultiSelect({
  value,
  onValueChange,
  values,
  label,
  helperText,
  error,
  options = [],
  liquidGlass = false,
  className,
  id,
  onChange,
  defaultValue,
  ref,
  ...props
}: MultiSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const labelId = `${fieldId}-label`;
  const selectRef = useRef<HTMLSelectElement>(null);
  /* La ref de l'appelant désigne le `<select>` porteur de valeur, comme pour
     un champ natif ; la liste visible garde la sienne pour les bascules. */
  const nativeRef = useCallback(
    (node: HTMLSelectElement | null) => mergeRefs(selectRef, ref)(node),
    [ref],
  );
  /* LE MODE NON CONTRÔLÉ TIENT SA PROPRE SÉLECTION. Sans `value`, la liste
     visible lisait un ensemble vide recréé à chaque rendu : le clic cochait
     l'option du `<select>` caché, mais ni la coche ni `aria-selected` ne
     bougeaient. L'état part de `defaultValue` et suit chaque `change` du natif ;
     en mode contrôlé, `value` (ou l'ancien `values`) reste seul maître. */
  const [current, setCurrent] = useControllableState<readonly string[]>(
    toSelection(value) ?? values,
    () => toSelection(defaultValue) ?? [],
  );
  const selected = new Set(current);

  /* `activeIndex` est l'option DÉSIGNÉE au clavier, distincte des options
     COCHÉES : dans une `listbox` multi-sélection, on parcourt sans choisir et
     l'on choisit sans se déplacer. Les confondre obligerait à cocher tout ce
     qu'on survole en chemin. */
  const [activeIndex, setActiveIndex] = useState(0);

  const toggle = (value: string) => {
    const select = selectRef.current;

    if (!select) return;

    for (const option of Array.from(select.options)) {
      if (option.value === value) option.selected = !option.selected;
    }

    /* `bubbles`, sans quoi React ne verra rien : son écouteur n'est pas posé
       sur le `<select>` mais à la racine de l'arbre. */
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => (current >= last ? 0 : current + 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((current) => (current <= 0 ? last : current - 1));
        return;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        return;
      case 'End':
        event.preventDefault();
        setActiveIndex(last);
        return;
      case ' ':
      case 'Enter': {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) toggle(option.value);
        return;
      }
      default:
    }
  };

  return (
    <div className={cx('opale-field', className)}>
      {label && (
        <span className="opale-field__label" id={labelId}>
          {label}
        </span>
      )}

      <select
        ref={nativeRef}
        id={fieldId}
        className="opale-visually-hidden"
        multiple
        value={[...current]}
        onChange={(event) => {
          const next = Array.from(event.currentTarget.selectedOptions, (option) => option.value);
          setCurrent(next);
          onValueChange?.(next);
          onChange?.(event);
        }}
        aria-hidden="true"
        tabIndex={-1}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {typeof option.label === 'string' ? option.label : option.value}
          </option>
        ))}
      </select>

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- la
          `listbox` EST la commande : c'est le motif ARIA de la sélection
          multiple, et les `option` en sont les enfants exigés. */}
      {/* LE MATÉRIAU EST CELUI DE TOUT LE MONDE, ENFIN.

          Cette liste posait `.opale-liquid`, l'ancienne imitation en lavis
          laiteux d'avant la réécriture du verre : sur une même page, une liste
          multiple et un select rendaient deux verres différents. `FieldShell`
          est la coquille des champs ; elle bascule sur `Glass` quand on le
          demande et rend un simple `<span>` sinon, donc le balisage et les
          attributs ARIA de la liste ne changent pas d'un état à l'autre. */}
      <FieldShell
        liquidGlass={liquidGlass}
        className={cx('opale-multiselect', liquidGlass && 'opale-multiselect--glass')}
        rootClassName="opale-multiselect--glass-root"
      >
        <div
          className="opale-multiselect__list"
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby={label ? labelId : undefined}
          /* `aria-activedescendant` NE DOIT PAS DÉSIGNER UN ÉLÉMENT ABSENT :
             sans option, la référence ne résout rien et la liste annonce un
             descendant actif qui n'existe pas. */
          aria-activedescendant={options.length ? `${fieldId}-option-${activeIndex}` : undefined}
          aria-describedby={error || helperText ? `${fieldId}-helper` : undefined}
          aria-invalid={error ? true : undefined}
          tabIndex={0}
          onKeyDown={onKeyDown}
        >
          {options.map((option, index) => {
            const isSelected = selected.has(option.value);

            return (
              /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus --
               LES DEUX RÈGLES SE TROMPENT ICI, ET POUR LA MÊME RAISON. Elles
               réclament un écouteur clavier et un `tabIndex` sur l'option. Or
               le motif `listbox` + `aria-activedescendant` veut exactement
               l'inverse : le focus reste sur la LISTE, qui porte tout le
               clavier, et l'option désignée l'est par son identifiant. Rendre
               l'option focusable ajouterait autant d'arrêts de tabulation que
               d'options et couperait la frappe de la liste ; y poser un
               `onKeyDown` serait du code mort, l'élément ne pouvant jamais
               recevoir d'événement clavier. Même arbitrage que le combobox de
               la recherche de la vitrine. */
              <div
                key={option.value}
                id={`${fieldId}-option-${index}`}
                className="opale-multiselect__option"
                role="option"
                aria-selected={isSelected}
                data-active={index === activeIndex ? 'true' : undefined}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setActiveIndex(index);
                  toggle(option.value);
                }}
              >
                <span className="opale-multiselect__mark" aria-hidden="true" />
                <span className="opale-multiselect__label">{option.label}</span>
              </div>
            );
          })}
        </div>
      </FieldShell>

      {(error || helperText) && (
        <span
          id={`${fieldId}-helper`}
          role={error ? 'alert' : undefined}
          className={cx('opale-field__helper', Boolean(error) && 'opale-field__helper--error')}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
}

export interface AutocompleteProps extends InputProps {
  options?: readonly string[];
}

export function Autocomplete({ options = [], ...props }: AutocompleteProps) {
  const listId = useId();
  return (
    <>
      <Input list={listId} {...props} />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}

/* =============================================================================
   L'ÉDITION EN PLACE : ENTRÉE VALIDE, ÉCHAP RÉTABLIT, LA SORTIE VALIDE.

   Le composant était un alias nu d'`Input` sous une fiche qui promettait ces
   deux touches. Elles existent désormais.

   LA RÉFÉRENCE EST LA DERNIÈRE VALEUR VALIDÉE, pas la toute première. Elle
   est relevée à la prise de focus, puis à chaque validation : valider « B »,
   taper « C » et presser Échap ramène à « B ».

   ENTRÉE NE SOUMET PLUS LE FORMULAIRE. Dans un `<form>`, Entrée sur un champ
   texte déclenche l'envoi : valider un nom de colonne enverrait la page.

   ÉCHAP N'EST CONSOMMÉ QUE S'IL Y A QUELQUE CHOSE À ANNULER. Dans une Modal,
   il fermait aussi le dialogue : on perdait tout pour annuler une saisie.
   Quand il rétablit une valeur, l'événement est arrêté et marqué ; quand il
   n'y a rien à rétablir, il remonte et reprend son sens de fermeture.

   LA VALEUR RÉTABLIE PASSE PAR `onChange`, contrôlé comme libre. Le natif est
   réécrit par son accesseur d'origine puis un `input` est émis : c'est ce que
   React écoute. Un brouillon tenu par l'appelant suit donc l'annulation, et
   un champ contrôlé n'a rien à câbler de plus.

   QUITTER LE CHAMP VALIDE, comme dans un tableur. Sortir par Tab laissait une
   valeur affichée que personne n'avait reçue : une perte silencieuse.

   LA COMPOSITION IME EST LAISSÉE TRANQUILLE. En japonais ou en chinois,
   l'Entrée qui confirme une conversion arrive avec `key === 'Enter'` : elle
   aurait validé une saisie inachevée.
   ========================================================================== */
export interface InlineInputProps extends InputProps {
  /** Entrée, ou sortie du champ après modification : la valeur est validée. */
  onCommit?: (value: string) => void;
  /** Échap : reçoit la valeur rétablie. */
  onCancel?: (value: string) => void;
}

function writeNativeValue(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

export function InlineInput({
  onCommit,
  onCancel,
  onFocus,
  onBlur,
  onKeyDown,
  ...props
}: InlineInputProps) {
  const reference = useRef('');

  const commit = (value: string) => {
    reference.current = value;
    onCommit?.(value);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    reference.current = event.currentTarget.value;
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    if (value !== reference.current) commit(value);
    onBlur?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const composing = event.nativeEvent.isComposing || event.keyCode === 229;
    if (!composing && event.key === 'Enter') {
      event.preventDefault();
      commit(input.value);
    } else if (!composing && event.key === 'Escape' && input.value !== reference.current) {
      event.preventDefault();
      event.stopPropagation();
      writeNativeValue(input, reference.current);
      onCancel?.(reference.current);
    }
    onKeyDown?.(event);
  };

  return <Input {...props} onFocus={handleFocus} onBlur={handleBlur} onKeyDown={handleKeyDown} />;
}

export interface SegmentedControlProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'onChange' | 'defaultValue' | 'children'
> {
  options: readonly SelectOption[];
  /** L'option pressée. Présente, l'appelant la tient ; absente et sans `defaultValue`, aucune. */
  value?: string;
  /** L'option pressée au montage quand `value` est absente. Seule elle fait retenir l'appui. */
  defaultValue?: string;
  /** Appelée à chaque appui, même sur l'option déjà pressée. */
  onValueChange?: (value: string) => void;
  /** @deprecated Depuis 3.6 — utilisez `onValueChange`. */
  onChange?: (value: string) => void;
  className?: string;
  liquidGlass?: boolean;
}

/**
 * Le fond de la sélection est un élément UNIQUE qui glisse sous l'option
 * choisie, et non un fond qui s'allume sur un bouton pendant qu'il s'éteint sur
 * un autre — cette seconde forme ne laisse rien à animer, elle saute.
 *
 * Le raisonnement est celui de `Tabs.List` (voir l'en-tête de
 * `components/tabs/Tabs.tsx`), redit ici parce que ce fichier ne dépend
 * d'AUCUN composant de `components/**` et que c'est délibéré : `opale.tsx` est
 * une feuille autonome, lisible d'un bout à l'autre sans ouvrir le reste du
 * dossier. Les trois points qui comptent :
 *  - `aria-pressed` reste la source de vérité, lue dans le DOM ;
 *  - l'indicateur est `aria-hidden`, il n'annonce rien que `aria-pressed` ne
 *    dise déjà ;
 *  - le premier placement ne s'anime pas, sinon l'indicateur traverserait le
 *    composant à chaque montage.
 *
 * `translate3d` avec les deux axes, et non le seul X : `.opale-segmented` est
 * en `flex-wrap: wrap`, donc les options passent à la ligne dès que la place
 * manque et l'indicateur doit descendre avec elles.
 */
export function SegmentedControl({
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  onChange,
  className,
  liquidGlass = false,
  ref,
  ...rest
}: SegmentedControlProps) {
  const [value, setValue] = useOptionalState(valueProp, defaultValue);
  const groupRef = useRef<HTMLDivElement>(null);
  /* Le groupe mesuré est aussi celui que reçoit l'appelant. */
  const trackRef = useCallback(
    (node: HTMLDivElement | null) => mergeRefs(groupRef, ref)(node),
    [ref],
  );
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    const indicator = indicatorRef.current;

    if (!group || !indicator) return;

    const place = () => {
      const active = group.querySelector<HTMLElement>('[aria-pressed="true"]');

      if (!active) {
        indicator.style.opacity = '0';
        return;
      }

      const groupRect = group.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      /* Rectangles nuls : première mise en page, ou jsdom qui n'a pas de mise
         en page. On ne place rien plutôt que de poser un indicateur de 0 px
         dans le coin, d'où il glisserait à la première vraie mesure. */
      if (activeRect.width === 0 || activeRect.height === 0) return;

      indicator.style.opacity = '1';
      indicator.style.width = `${activeRect.width}px`;
      indicator.style.height = `${activeRect.height}px`;
      indicator.style.transform = `translate3d(${activeRect.left - groupRect.left + group.scrollLeft}px, ${activeRect.top - groupRect.top + group.scrollTop}px, 0)`;

      if (!indicator.dataset.animated) {
        /* Un changement de matière remonte le nœud de la pastille : armer
           l'animation sur ce nœud, après son premier placement mesuré. */
        void indicator.offsetWidth;
        indicator.dataset.animated = 'true';
      }
    };

    place();

    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(place);

    if (observer) {
      observer.observe(group);
      group.querySelectorAll('.opale-segmented__item').forEach((item) => observer.observe(item));
    }

    window.addEventListener('resize', place);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [options, value, liquidGlass]);

  /* LA MESURE SE FAIT SUR LE MÊME NŒUD DANS LES DEUX MATIÈRES. `Glass`
     transmet sa `ref` à sa couche de CONTENU, celle qui porte `className` :
     le groupe mesuré par `getBoundingClientRect` est donc exactement celui
     qui contient les boutons, verre ou pas. Mesurer l'enveloppe donnerait un
     indicateur décalé de l'épaisseur du matériau. */
  const Track = liquidGlass ? Glass : 'div';
  const trackProps = liquidGlass ? ({ rootClassName: 'opale-segmented--glass-root' } as const) : {};

  return (
    <Track
      {...rest}
      {...trackProps}
      ref={trackRef}
      className={cx('opale-segmented', liquidGlass && 'opale-segmented--glass', className)}
      role="group"
    >
      <span ref={indicatorRef} aria-hidden="true" className="opale-segmented__indicator" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="opale-segmented__item"
          aria-pressed={value === option.value}
          onClick={() => {
            setValue(option.value);
            onValueChange?.(option.value);
            onChange?.(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </Track>
  );
}

export type FormProps = ComponentPropsWithRef<'form'>;

export function Form({ className, ...props }: FormProps) {
  return <form className={cx('opale-stack', 'opale-stack--column', className)} {...props} />;
}

export interface IconActionButtonProps extends Omit<ButtonProps, 'children'> {
  icon?: OpaleIconName;
  label: string;
}

export function IconActionButton({
  icon = 'more-horizontal',
  label,
  variant = 'tonal',
  className,
  ...props
}: IconActionButtonProps) {
  /* Le nom accessible reste indépendant du glyphe. Le rendu tonal remplace
     le filet ghost masqué, qui n'apparaissait qu'aux quatre bords du bouton
     et traversait aussi le verre liquide. La variante reste configurable. */
  return (
    <Button
      {...props}
      variant={variant}
      className={cx('opale-icon-action-button', className)}
      aria-label={label}
    >
      <IconGlyph name={icon} className="opale-icon__glyph" />
    </Button>
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
  const classes = cx(
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
    <Heading {...rest} className={cx('opale-heading', className)}>
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
    <p {...rest} className={cx('opale-text', `opale-text--${variant}`, className)}>
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
      className={cx('opale-icon', className)}
      role={named ? 'img' : undefined}
    >
      {isOpaleIconName(name) ? <IconGlyph name={name} className="opale-icon__glyph" /> : name}
    </span>
  );
}

/**
 * L'encart de retour en flux.
 *
 * CE QUE CE COMPOSANT NE PEUT PAS GARANTIR, ET QUI REVIENT À L'APPELANT. Une
 * région live doit exister AVANT que son contenu n'arrive, sans quoi l'annonce
 * se perd. Ici la région naît avec le message, puisque c'est l'appelant qui
 * monte l'encart au moment de le montrer — le composant n'a aucun moyen de se
 * monter à l'avance. `role="alert"` est le plus souvent rattrapé à
 * l'insertion, `role="status"` beaucoup moins.
 *
 * Pour un message qui doit être entendu à coup sûr, montez l'encart dès le
 * départ et ne changez que son contenu, ou passez par `ToastProvider`, dont
 * les régions sont permanentes par construction.
 *
 * Ce comportement dépend du couple navigateur/lecteur d'écran et n'a pas été
 * vérifié ici faute de lecteur d'écran.
 */
/* LE TITRE PAR DÉFAUT EST UN MOT FRANÇAIS, PAS LE NOM DE LA PROP. L'encart
   écrivait `severity` tel quel : « info », « error », en anglais et en bas de
   casse, lu ainsi par les lecteurs d'écran (WCAG 3.1.2). */
const FEEDBACK_TITLES = {
  success: 'Succès',
  info: 'Information',
  warning: 'Attention',
  error: 'Erreur',
} as const;

/** La nature d'un retour : sa couleur, son titre par défaut et l'urgence de son annonce. */
export type FeedbackTone = 'success' | 'info' | 'warning' | 'error';

export interface FeedbackProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Le ton de l'encart : sa couleur, son titre par défaut et son rôle. Défaut : `info`. */
  tone?: FeedbackTone;
  /** @deprecated Depuis 3.6 — utilisez `tone`. */
  severity?: FeedbackTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  liquidGlass?: boolean;
}

export function Feedback({
  tone,
  severity,
  title,
  children,
  className,
  liquidGlass = false,
  ...rest
}: FeedbackProps) {
  const resolvedTone = tone ?? severity ?? 'info';
  const classes = cx(
    'opale-feedback',
    `opale-feedback--${resolvedTone}`,
    liquidGlass && 'opale-feedback--glass',
    className,
  );
  const role = resolvedTone === 'error' ? 'alert' : 'status';
  const content = (
    <>
      <strong>{title ?? FEEDBACK_TITLES[resolvedTone]}</strong>
      <span>{children}</span>
    </>
  );

  /* LE RÔLE EST POSÉ SUR LE MÊME NŒUD DANS LES DEUX MATIÈRES, et c'est le
     contrat à ne pas laisser dépendre d'une apparence : `Glass` rend le rôle
     sur sa couche de CONTENU, celle qui porte `className`, donc la région
     live reste là où elle était. */
  if (liquidGlass) {
    return (
      <Glass {...rest} className={classes} rootClassName="opale-feedback--glass-root" role={role}>
        {content}
      </Glass>
    );
  }

  return (
    <div {...rest} className={classes} role={role}>
      {content}
    </div>
  );
}

/* =============================================================================
   LE MESSAGE POSÉ À L'ÉCRAN.

   DEUX COMPOSANTS PORTENT LE MOT « TOAST » ET CE N'EST PAS UN DOUBLON.
   `ToastProvider` est une FILE : on lui demande d'afficher un message depuis
   n'importe où dans l'arbre, il l'empile, le minute et le congédie. `Toast`,
   ci-dessous, est un message UNIQUE dont l'appelant tient l'état ouvert/fermé.
   Le second sert quand il n'y a qu'une chose à dire et qu'on veut la contrôler
   directement ; prendre la file pour ça obligerait à envelopper l'arbre.

   CE QU'IL LUI MANQUAIT, ET QUE LA FILE AVAIT DÉJÀ. Il rendait une surface
   grise, au milieu du flux, sans ton ni place : « Modifications enregistrées »
   et « Publication refusée » s'affichaient à l'identique, là où le composant
   se trouvait dans la page. Il prend désormais les deux mêmes réglages que la
   file — un TON et une PLACE — et se rend dans un portail, donc à l'endroit de
   l'écran qu'on lui indique et non à l'endroit du code.

   UNE ANCRE PAR PLACE, PARTAGÉE. Chaque instance montait sa propre ancre plein
   écran en fin de `<body>`, d'où deux défauts documentés à la création du
   composant et levés ensemble :

   1. DEUX MESSAGES À LA MÊME PLACE SE RECOUVRAIENT au pixel près, le second
      cachant le premier et sa croix. Ils partagent maintenant l'ancre de leur
      place et s'y empilent. Minuter, dédoublonner et congédier reste le
      travail de `ToastProvider` ; empiler proprement, c'est le minimum.

   2. LA CROIX D'UN MESSAGE EN HAUT ÉTAIT LE DERNIER ARRÊT CLAVIER de la page —
      mesuré, 106ᵉ sur 106. Les ancres du haut vivent désormais en TÊTE de
      `<body>`, celles du bas en fin : l'ordre de tabulation suit la place à
      l'écran, sans `tabindex` positif, qui aurait déplacé l'ordre de toute la
      page pour un message passager. L'arbitrage est assumé : un message
      ouvert en haut passe AVANT un éventuel lien d'évitement de l'application,
      comme il passe avant lui à l'écran. Il ne coûte qu'un arrêt, et seulement
      tant que le message est ouvert.

   L'ancre naît avec la première instance de sa place et disparaît avec la
   dernière. Ses deux régions live vivent donc aussi longtemps qu'un message
   peut y entrer, ouvert ou fermé — la condition pour qu'il soit annoncé.
   ========================================================================== */

/**
 * Les six places possibles à l'écran.
 * @deprecated Depuis 3.6 — utilisez `OpalePlacement`.
 */
export type ToastPlacement = OpalePlacement;

/**
 * Les tons, et leur couleur. `neutral` n'en porte aucune.
 * @deprecated Depuis 3.6 — utilisez `OpaleTone`.
 */
export type ToastTone = OpaleTone;

/**
 * Les tons qui doivent INTERROMPRE la lecture.
 *
 * Une erreur annoncée poliment arrive à la fin de ce que l'utilisateur est en
 * train de lire, c'est-à-dire trop tard pour un échec ; un enregistrement
 * annoncé de façon assertive coupe la parole pour rien. Le découpage est le
 * même que celui de `ToastProvider`, et il tient à la même raison.
 */
const ASSERTIVE_TONES = new Set<OpaleTone>(['error', 'warning']);

/**
 * L'icône de chaque ton.
 *
 * LA COULEUR NE PEUT PAS ÊTRE LE SEUL SIGNAL (WCAG 1.4.1), et elle l'était :
 * relevé dans le DOM, le balisage des cinq tons ne différait que par une
 * variable de couleur — pas d'icône, pas de titre, même encre. « La carte n'a
 * pas été régénérée » et « Étape publiée » étaient le même objet pour qui
 * distingue mal le vert du rouge, en contrastes forcés ou sur un écran
 * monochrome. La distinction `status`/`alert` sauvait le lecteur d'écran, pas
 * l'utilisateur voyant.
 *
 * `neutral` N'EN A PAS, et c'est cohérent : il n'a pas de couleur non plus. Il
 * n'y a rien à doubler.
 */
const TONE_ICON: Record<OpaleTone, OpaleIconName | null> = {
  neutral: null,
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'x-circle',
  info: 'info',
};

interface ToastAnchor {
  readonly status: HTMLDivElement;
  readonly alert: HTMLDivElement;
  readonly root: HTMLDivElement;
  users: number;
}

const TOAST_ANCHORS = new Map<OpalePlacement, ToastAnchor>();
const toastAnchorListeners = new Set<() => void>();

function notifyToastAnchors() {
  toastAnchorListeners.forEach((listener) => listener());
}

function acquireToastAnchor(position: OpalePlacement) {
  let anchor = TOAST_ANCHORS.get(position);
  if (!anchor) {
    const root = document.createElement('div');
    root.className = `opale-toast-anchor opale-toast-anchor--${position}`;
    const status = document.createElement('div');
    status.setAttribute('role', 'status');
    const alert = document.createElement('div');
    alert.setAttribute('role', 'alert');
    root.append(status, alert);
    if (position.startsWith('top')) document.body.prepend(root);
    else document.body.append(root);
    anchor = { root, status, alert, users: 0 };
    TOAST_ANCHORS.set(position, anchor);
  }
  anchor.users += 1;
}

/* LA DESTRUCTION ATTEND LA FIN DU COMMIT. Un message qui en remplace un autre
   — `key` qui change — démonte l'ancien et monte le nouveau dans le même
   commit, et le nettoyage du premier passe avant l'abonnement du second : le
   compteur touchait zéro, l'ancre était retirée puis recréée, et le message
   entrait dans une région live née dans la même tâche, dont l'annonce peut se
   perdre. Le retrait est donc remis à une micro-tâche, et n'a lieu que si
   personne n'a repris l'ancre entre-temps. */
function releaseToastAnchor(position: OpalePlacement) {
  const anchor = TOAST_ANCHORS.get(position);
  if (!anchor) return;
  anchor.users -= 1;
  if (anchor.users > 0) return;
  queueMicrotask(() => {
    if (anchor.users > 0 || TOAST_ANCHORS.get(position) !== anchor) return;
    anchor.root.remove();
    TOAST_ANCHORS.delete(position);
    notifyToastAnchors();
  });
}

/* L'ANCRE S'OBTIENT PAR UN MAGASIN EXTERNE, pas par un état posé dans un
   effet. S'abonner, c'est occuper l'ancre de sa place — la créer si l'on est
   le premier — et se désabonner, la libérer. React relit l'instantané aussitôt
   après l'abonnement et rend le portail dans la foulée. Côté serveur,
   l'instantané est `null` : pas d'ancre, pas de portail, et rien à hydrater. */
function useToastAnchor(position: OpalePlacement): ToastAnchor | null {
  const subscribe = useCallback(
    (listener: () => void) => {
      toastAnchorListeners.add(listener);
      acquireToastAnchor(position);
      notifyToastAnchors();
      return () => {
        toastAnchorListeners.delete(listener);
        releaseToastAnchor(position);
      };
    },
    [position],
  );
  return useSyncExternalStore(
    subscribe,
    () => TOAST_ANCHORS.get(position) ?? null,
    () => null,
  );
}

export interface ToastProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  message: ReactNode;
  /** Affiché par défaut ; l'appelant tient l'état ouvert. */
  open?: boolean;
  /** Appelée avec `false` sur la croix. Sa présence rend la croix. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Depuis 3.6 — utilisez `onOpenChange`. */
  onClose?: () => void;
  /** Rend la carte dans le matériau « verre liquide ». Originale par défaut. */
  liquidGlass?: boolean;
  /** Le ton, qui choisit la couleur du filet et de l'icône. */
  tone?: OpaleTone;
  /** La place à l'écran. Le message est rendu dans un portail, pas en flux. */
  position?: OpalePlacement;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<ToastLabels>;
  className?: string;
}

const DEFAULT_TOAST_LABELS: ToastLabels = { close: 'Fermer la notification' };

export function Toast({
  message,
  open = true,
  onOpenChange,
  onClose,
  tone = 'neutral',
  position = 'bottom-right',
  liquidGlass = false,
  labels: labelsProp,
  className,
  ref,
  ...rest
}: ToastProps) {
  /* LES DEUX RÉGIONS SONT MONTÉES EN PERMANENCE, LE MESSAGE SEUL APPARAÎT.

     Le composant entier — `role="status"` compris — était rendu au moment où
     le message arrivait. Une région live insérée EN MÊME TEMPS que son
     contenu n'est pas surveillée par la technologie d'assistance à l'instant
     de l'insertion : l'annonce se perd (WCAG 4.1.3). C'est exactement ce que
     l'en-tête de `ToastProvider` décrit et corrige pour la file ; la
     correction n'avait pas été reportée ici.

     IL EN FAUT DEUX ET NON UNE, pour la même raison que dans la file : le
     rôle d'une région ne peut pas changer en cours de route sans la remonter,
     ce qui reproduirait exactement le défaut qu'on corrige. Les deux sont donc
     posées d'avance, vides, et le message entre dans celle de son ton. */
  const closeClick = closeClickHandler(onOpenChange, onClose);
  const labels = resolveLabels(DEFAULT_TOAST_LABELS, labelsProp);
  const assertive = ASSERTIVE_TONES.has(tone);
  const classes = cx(
    'opale-toast',
    tone !== 'neutral' && `opale-toast--${tone}`,
    liquidGlass && 'opale-toast--glass',
    className,
  );
  /* SOUS VERRE, LE TON PASSE DU REMPLISSAGE AU LAVIS. Une carte de verre
     remplie d'un vert opaque n'est plus du verre : elle ne réfracte plus
     rien. La feuille compose donc `--opale-glass-surface` — le jeton que
     `Glass` lit pour son voile — à partir du ton, et l'encre redevient celle
     du matériau. */
  const Shell = liquidGlass ? Glass : 'div';
  const shellProps = liquidGlass ? ({ rootClassName: 'opale-toast--glass-root' } as const) : {};
  const cardRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useCallback(
    (node: HTMLDivElement | null) => mergeRefs(cardRef, ref)(node),
    [ref],
  );
  const card = open ? (
    <Shell
      {...rest}
      {...shellProps}
      ref={cardRefs}
      className={classes}
      data-opale-toast-tone={tone}
    >
      {/* LE TON REMPLIT LA CARTE, ET L'ICÔNE PREND SON ENCRE.

          Le ton n'était qu'un filet de 4 px en ombre intérieure, rogné à ses
          deux extrémités par le rayon de la carte : il occupait environ un
          pour cent de la surface, et c'est la SURFACE qui manquait, pas la
          saturation.

          L'ICÔNE EST MASQUÉE AUX TECHNOLOGIES D'ASSISTANCE, et ce n'est pas
          une contradiction avec ce qui précède : l'urgence leur est déjà dite
          par la région — polie ou assertive — dans laquelle le message entre.
          Lui donner en plus un nom ferait annoncer « attention » avant chaque
          avertissement, c'est-à-dire répéter ce que le ton de l'annonce porte
          déjà. Le doublage manquait à l'ŒIL, pas à l'oreille.

          `neutral` N'A PAS D'ICÔNE puisqu'il n'a pas de ton : sa carte reste
          la surface d'Opale sous l'encre d'Opale, et il n'y a rien à
          doubler. */}
      {TONE_ICON[tone] && <IconGlyph name={TONE_ICON[tone]} className="opale-toast__icon" />}
      <span className="opale-toast__message">{message}</span>
      {closeClick && (
        <button
          className="opale-toast__close"
          type="button"
          onClick={closeClick}
          aria-label={labels.close}
        >
          <Icon name="close" />
        </button>
      )}
    </Shell>
  ) : null;

  /* L'ANCRE NE CAPTE PAS LE POINTEUR quand elle est vide (voir la feuille),
     sinon une bande invisible avalerait les clics de la page en permanence.

     SANS `document`, LE COMPOSANT NE REND RIEN — c'est ce que fait `Modal`. Le
     repli tentant est de rendre l'ancre EN PLACE dans l'arbre ; il est pire
     que rien. L'ancre est `position: fixed`, donc un ancêtre qui porte
     `backdrop-filter`, `transform` ou `filter` — tout verre de ce dépôt — en
     deviendrait le bloc conteneur, et le message s'afficherait dans la carte.

     LE MESSAGE ENTRE DANS LA RÉGION DE SON TON : polie ou assertive. Les deux
     existent dès que l'ancre existe. Pour qu'elles précèdent le message — ce
     qui garantit son annonce —, montez le composant fermé et ouvrez-le ensuite,
     ou gardez une autre instance à la même place. */
  const anchor = useToastAnchor(position);
  /* Le message fixe ne doit pas couvrir l'élément atteint au clavier. */
  useScrollPadding(cardRef, position.startsWith('top') ? 'top' : 'bottom', open && anchor !== null);

  if (!anchor || !card) return null;

  return createPortal(card, assertive ? anchor.alert : anchor.status);
}

export interface SpinnerProps extends ComponentPropsWithRef<'span'> {
  label?: string;
  className?: string;
}

/**
 * L'indicateur d'attente.
 *
 * Même réserve que `Feedback` : sa région `status` naît avec lui, donc
 * l'apparition du témoin n'est pas garantie d'être annoncée. Pour un chargement
 * dont l'issue doit être entendue, gardez une région montée et n'y changez que
 * le texte.
 */
export function Spinner({ label = 'Chargement', className, ...rest }: SpinnerProps) {
  return (
    <span {...rest} className={cx('opale-stack', className)} role="status">
      <span className="opale-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

/** Les props de `ProgressBar`. `ref` et les attributs vont à l'élément `progressbar`. */
export interface ProgressBarProps extends ComponentPropsWithRef<'div'> {
  value?: number;
  label?: string;
  className?: string;
  liquidGlass?: boolean;
}

export function ProgressBar({
  value = 0,
  label,
  className,
  liquidGlass = false,
  ...rest
}: ProgressBarProps) {
  const labelId = useId();
  /* LA PISTE EST CE QUI CHANGE DE MATIÈRE, PAS LA VALEUR. Le remplissage
     reste opaque sous verre : une progression translucide sur un paysage ne
     se lirait plus, et c'est la seule chose que la barre a à dire. */
  const Track = liquidGlass ? Glass : 'div';
  const trackProps = liquidGlass ? ({ rootClassName: 'opale-progress--glass-root' } as const) : {};
  /* La valeur annoncée est celle qu'on voit : bornée à [0, 100]. */
  const bounded = Number.isFinite(value) ? Math.max(0, Math.min(value, 100)) : 0;

  return (
    <div className={cx('opale-field', className)}>
      {/* LE LIBELLÉ ÉTAIT FRÈRE DE LA BARRE, RELIÉ À RIEN. Trois progressions
          sur une page s'annonçaient « barre de progression, 40 % » trois fois,
          sans jamais dire de quoi (WCAG 1.3.1). */}
      {label && (
        <span className="opale-field__label" id={labelId}>
          {label}
        </span>
      )}
      <Track
        aria-labelledby={label ? labelId : undefined}
        {...rest}
        {...trackProps}
        className={cx('opale-progress', liquidGlass && 'opale-progress--glass')}
        role="progressbar"
        aria-valuenow={bounded}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="opale-progress__value" style={{ width: `${bounded}%` }} />
      </Track>
    </div>
  );
}

/* LA FERMETURE DES SURIMPRESSIONS. Le rappel canonique part d'abord, l'ancien
   ensuite et seulement pour une fermeture. Sans aucun des deux, il n'y a pas
   de rappel, donc ni croix ni bouton Fermer. */
function closeHandler(
  onOpenChange: ((open: boolean) => void) | undefined,
  onClose: (() => void) | undefined,
): ((open: boolean) => void) | undefined {
  if (!onOpenChange && !onClose) return undefined;
  return (open) => {
    onOpenChange?.(open);
    if (!open) onClose?.();
  };
}

/* LE BOUTON QUI FERME. L'ancien rappel reçoit l'événement du clic, comme
   lorsqu'il était lui-même le gestionnaire du bouton ; le canonique reçoit
   `false`. */
function closeClickHandler(
  onOpenChange: ((open: boolean) => void) | undefined,
  onClose: MouseEventHandler<HTMLButtonElement> | undefined,
): MouseEventHandler<HTMLButtonElement> | undefined {
  if (!onOpenChange && !onClose) return undefined;
  return (event) => {
    onOpenChange?.(false);
    onClose?.(event);
  };
}

/** Les textes de `ConfirmDialog`. `close` nomme la croix. */
export interface ConfirmDialogLabels extends ModalLabels {
  /** Le titre, quand `title` n'est pas passé. Défaut : « Confirmer ». */
  title: string;
  /** Défaut : « Annuler ». */
  cancel: string;
  /** Défaut : « Confirmer ». */
  confirm: string;
}

/** Les props de `ConfirmDialog`. `ref` et les attributs vont au panneau du dialogue. */
export interface ConfirmDialogProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  /** Appelée sur Confirmer. Le dialogue ne se ferme pas seul : l'appelant ferme après son action. */
  onConfirm?: () => void;
  /** `false` sur Annuler, Échap, le voile ou la croix. Jamais sur Confirmer. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Depuis 3.6 — utilisez `onOpenChange`. */
  onCancel?: () => void;
  /** Remplace les textes français par défaut, clé par clé. `title` gagne sur `labels.title`. */
  labels?: Partial<ConfirmDialogLabels>;
  liquidGlass?: boolean;
}

const DEFAULT_CONFIRM_DIALOG_LABELS: ConfirmDialogLabels = {
  close: 'Fermer',
  title: 'Confirmer',
  cancel: 'Annuler',
  confirm: 'Confirmer',
};

export function ConfirmDialog({
  open = false,
  title,
  children,
  onConfirm,
  onOpenChange,
  onCancel,
  labels: labelsProp,
  liquidGlass = false,
  ...rest
}: ConfirmDialogProps) {
  const close = closeHandler(onOpenChange, onCancel);
  const labels = resolveLabels(DEFAULT_CONFIRM_DIALOG_LABELS, labelsProp);
  /* L'IDENTIFIANT DU TITRE ÉTAIT EN DUR — `id="opale-confirm-title"` — ce qui
     faisait résoudre `aria-labelledby` sur le mauvais titre dès que deux
     confirmations coexistaient. `Modal` le dérive d'un `useId`.

     LE CORPS DEVIENT LA DESCRIPTION DU DIALOGUE, et ce n'est pas un
     déplacement cosmétique. Relevé sur le dialogue ouvert, `aria-describedby`
     valait `null` : « Cette action est irréversible » n'appartenait ni au nom
     ni à la description du dialogue. La plupart des lecteurs d'écran lisent le
     contenu quand le panneau prend le focus, donc ce n'était pas bloquant —
     mais sur une confirmation DESTRUCTRICE, la conséquence est précisément ce
     qui doit être annoncé avec la question, pas après elle. `Modal` sait poser
     `aria-describedby` depuis sa prop `description` ; `ConfirmDialog` ne la
     lui passait simplement pas. */
  return (
    <Modal
      {...rest}
      open={open}
      onOpenChange={close}
      liquidGlass={liquidGlass}
      labels={{ close: labels.close }}
      title={title === undefined ? labels.title : title}
      description={children}
      footer={
        <>
          <Button variant="text" onClick={closeClickHandler(onOpenChange, onCancel)}>
            {labels.cancel}
          </Button>
          <Button onClick={onConfirm}>{labels.confirm}</Button>
        </>
      }
    />
  );
}

export interface EmptyStateProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  liquidGlass?: boolean;
}

export function EmptyState({
  title = 'Aucun résultat',
  description,
  action,
  liquidGlass = false,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <Card
      {...rest}
      className={cx('opale-empty-state', className)}
      title={title}
      subtitle={description}
      actions={action}
      liquidGlass={liquidGlass}
    >
      <Icon name="search" />
    </Card>
  );
}

export interface NavItem {
  id: string;
  label: ReactNode;
  href?: string;
  icon?: ReactNode;
}

export interface NavbarProps extends Omit<
  ComponentPropsWithRef<'nav'>,
  'onSelect' | 'onChange' | 'defaultValue' | 'children'
> {
  items?: readonly NavItem[];
  /** L'entrée courante. Présente, l'appelant la tient ; absente et sans `defaultValue`, aucune. */
  value?: string;
  /** L'entrée courante au montage quand `value` est absente. Seule elle fait retenir le clic. */
  defaultValue?: string;
  /** Ne part que des entrées sans `href` (boutons) ; un lien navigue. */
  onValueChange?: (id: string) => void;
  /** @deprecated Depuis 3.6 — utilisez `value`. */
  activeId?: string;
  /** @deprecated Depuis 3.6 — utilisez `onValueChange`. */
  onSelect?: (id: string) => void;
  /** Le nom du repère ; `aria-label` gagne. Défaut : « Navigation ». */
  label?: string;
  className?: string;
  liquidGlass?: boolean;
}

export function Navbar({
  items = [],
  value,
  defaultValue,
  onValueChange,
  activeId: activeIdProp,
  onSelect,
  label = 'Navigation',
  className,
  liquidGlass = false,
  ...rest
}: NavbarProps) {
  const [activeId, setActiveId] = useOptionalState(value ?? activeIdProp, defaultValue);
  const select = (id: string) => {
    setActiveId(id);
    onValueChange?.(id);
    onSelect?.(id);
  };
  const Rail = liquidGlass ? Glass : 'nav';
  const railProps = liquidGlass
    ? ({ as: 'nav', rootClassName: 'opale-surface--glass-root' } as const)
    : {};

  return (
    /* LE RAIL CHANGE DE MATIÈRE, PAS DE BALISE. `Glass` rend l'élément demandé
       pour son CONTENU : le `<nav>` et son nom accessible restent le même nœud
       dans les deux rendus, donc la navigation garde son rôle sous verre. */
    <Rail
      aria-label={label}
      {...rest}
      {...railProps}
      className={cx('opale-surface', liquidGlass && 'opale-surface--glass', 'opale-nav', className)}
    >
      {items.map((item) =>
        item.href ? (
          <a
            key={item.id}
            href={item.href}
            className="opale-nav__item"
            aria-current={activeId === item.id ? 'page' : undefined}
          >
            {item.icon}
            {item.label}
          </a>
        ) : (
          <button
            key={item.id}
            type="button"
            className="opale-nav__item"
            aria-current={activeId === item.id ? 'page' : undefined}
            onClick={() => select(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ),
      )}
    </Rail>
  );
}

export interface MenuProps extends ComponentPropsWithRef<'details'> {
  label?: ReactNode;
  items?: readonly NavItem[];
  /** Le nom de la navigation rendue depuis `items`. Défaut : celui de `Navbar`. */
  navigationLabel?: string;
  className?: string;
  children?: ReactNode;
  liquidGlass?: boolean;
}

export function Menu({
  label = 'Menu',
  items = [],
  navigationLabel,
  className,
  children,
  liquidGlass = false,
  ...rest
}: MenuProps) {
  const classes = cx(
    'opale-surface',
    liquidGlass && 'opale-surface--glass',
    'opale-panel',
    className,
  );
  const content = (
    <>
      <summary>{label}</summary>
      {items.length > 0 ? (
        <Navbar items={items} label={navigationLabel} liquidGlass={liquidGlass} />
      ) : (
        children
      )}
    </>
  );

  if (liquidGlass) {
    return (
      <Glass {...rest} as="details" className={classes} rootClassName="opale-surface--glass-root">
        {content}
      </Glass>
    );
  }

  return (
    <details {...rest} className={classes}>
      {content}
    </details>
  );
}

export interface LinkProps extends ComponentPropsWithRef<'a'> {
  children: ReactNode;
}

export function Link({ children, className, ...props }: LinkProps) {
  return (
    <a className={cx('opale-link', className)} {...props}>
      {children}
    </a>
  );
}

/** Les textes de `SidePanel`. `close` nomme la croix. */
export interface SidePanelLabels extends ModalLabels {
  /** Le titre, quand `title` n'est pas passé. Défaut : « Panneau ». */
  title: string;
}

/** Les props de `SidePanel`. `ref` et les attributs vont au panneau. */
export interface SidePanelProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  /** Appelée avec `false` sur Échap, le voile ou la croix. Sa présence rend la croix. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Depuis 3.6 — utilisez `onOpenChange`. */
  onClose?: () => void;
  /** Remplace les textes français par défaut, clé par clé. `title` gagne sur `labels.title`. */
  labels?: Partial<SidePanelLabels>;
  liquidGlass?: boolean;
}

const DEFAULT_SIDE_PANEL_LABELS: SidePanelLabels = { close: 'Fermer', title: 'Panneau' };

export function SidePanel({
  open = false,
  title,
  children,
  onOpenChange,
  onClose,
  labels: labelsProp,
  liquidGlass = false,
  ...rest
}: SidePanelProps) {
  const labels = resolveLabels(DEFAULT_SIDE_PANEL_LABELS, labelsProp);
  /* IL COULE ENFIN SUR LE CÔTÉ. Sa fiche annonçait « panneau latéral
     coulissant » et il rendait la boîte CENTRÉE du dialogue — même classe,
     même position. La coquille le plaque désormais contre le bord de fin sur
     toute la hauteur ; voir `.opale-side-panel` dans `opale.css`. */
  return (
    <Modal
      {...rest}
      open={open}
      onOpenChange={closeHandler(onOpenChange, onClose)}
      liquidGlass={liquidGlass}
      labels={{ close: labels.close }}
      title={title === undefined ? labels.title : title}
      rootClassName="opale-side-panel"
    >
      {children}
    </Modal>
  );
}

/** Les textes de `CommandPalette`. `close` nomme la croix et le bouton Fermer. */
export interface CommandPaletteLabels extends ModalLabels {
  /** Défaut : « Palette de commandes ». */
  title: string;
  /** Le libellé du champ de recherche. Défaut : « Rechercher une commande ». */
  search: string;
  /** Avec `items`, le nom de la liste. Défaut : « Commandes ». */
  results?: string;
  /** Avec `items`, le compte annoncé. Défaut : « 3 résultats », « Aucun résultat ». */
  resultCount?: (count: number) => string;
}

const DEFAULT_COMMAND_PALETTE_LABELS: Required<CommandPaletteLabels> = {
  close: 'Fermer',
  title: 'Palette de commandes',
  search: 'Rechercher une commande',
  results: 'Commandes',
  resultCount: (count) =>
    count === 0 ? 'Aucun résultat' : `${count} résultat${count > 1 ? 's' : ''}`,
};

/** Une commande de la palette. */
export interface CommandPaletteItem {
  id: string;
  label: ReactNode;
  /** Un texte secondaire, sous le libellé. */
  description?: ReactNode;
  /** Visible mais ni activable ni choisie aux flèches. */
  disabled?: boolean;
  /** Appelée quand la commande est choisie, avant `onItemSelect`. */
  onSelect?: () => void;
}

/** Les props de `CommandPalette`. `ref` et les attributs vont au panneau. */
export interface CommandPaletteProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'title' | 'onChange' | 'defaultValue'
> {
  open?: boolean;
  /** Le texte de la recherche. Présent, l'appelant le tient. */
  value?: string;
  /** Le texte de départ quand `value` est absente. */
  defaultValue?: string;
  /** Appelée à chaque frappe dans la recherche. */
  onValueChange?: (value: string) => void;
  /** @deprecated Depuis 3.6 — utilisez `onValueChange`. */
  onChange?: (value: string) => void;
  /** Appelée avec `false` sur Échap, le voile, la croix ou Fermer. Sa présence rend Fermer. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Depuis 3.6 — utilisez `onOpenChange`. */
  onClose?: () => void;
  /** Un contenu libre, rendu sous la recherche. */
  children?: ReactNode;
  /**
   * Les commandes, déjà filtrées par l'appelant. Présentes, la recherche devient
   * une combobox : flèches haut et bas, Entrée, et le compte annoncé.
   */
  items?: readonly CommandPaletteItem[];
  /** Appelée avec l'`id` de la commande choisie, à Entrée ou au clic. */
  onItemSelect?: (id: string) => void;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<CommandPaletteLabels>;
  liquidGlass?: boolean;
}

export function CommandPalette({
  open = false,
  value,
  defaultValue = '',
  onValueChange,
  onChange,
  onOpenChange,
  onClose,
  children,
  items,
  onItemSelect,
  labels: labelsProp,
  liquidGlass = false,
  ...rest
}: CommandPaletteProps) {
  const close = closeHandler(onOpenChange, onClose);
  const labels = resolveLabels<Required<CommandPaletteLabels>>(
    DEFAULT_COMMAND_PALETTE_LABELS,
    labelsProp,
  );
  /* La modale donne d'abord le focus au panneau pour annoncer son titre.
     Au cadre suivant, la palette place le curseur dans sa recherche : on peut
     lancer une commande sans clic, tout en laissant Modal retenir l'élément
     à qui rendre le focus à la fermeture. */
  const [query, setQuery] = useControllableState<string>(value, defaultValue, onValueChange);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  /* LA COMMANDE ACTIVE SE DÉDUIT : celle retenue aux flèches si elle est
     encore là et active, la première active sinon. */
  const listboxId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const enabledItems = (items ?? []).filter((item) => !item.disabled);
  const active = enabledItems.find((item) => item.id === activeId) ?? enabledItems[0];
  const optionId = (item: CommandPaletteItem) => `${listboxId}-${item.id}`;
  const choose = (item: CommandPaletteItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    onItemSelect?.(item.id);
  };
  const handleComboboxKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && active) {
      event.preventDefault();
      choose(active);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (enabledItems.length === 0) return;
    const index = active ? enabledItems.indexOf(active) : -1;
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const next = enabledItems[(index + step + enabledItems.length) % enabledItems.length];
    setActiveId(next.id);
  };
  const combobox = items
    ? ({
        role: 'combobox',
        'aria-expanded': items.length > 0,
        'aria-controls': listboxId,
        'aria-autocomplete': 'list',
        'aria-activedescendant': active ? optionId(active) : undefined,
        onKeyDown: handleComboboxKeys,
      } as const)
    : {};

  return (
    <Modal
      {...rest}
      open={open}
      onOpenChange={close}
      liquidGlass={liquidGlass}
      labels={{ close: labels.close }}
      title={labels.title}
      footer={
        close ? (
          <Button variant="text" onClick={closeClickHandler(onOpenChange, onClose)}>
            {labels.close}
          </Button>
        ) : undefined
      }
    >
      <div className="opale-command-palette__content">
        {/* Le dialogue est déjà un repère : la recherche n'en ajoute pas. */}
        <Input
          ref={searchRef}
          type="search"
          searchLandmark={false}
          {...combobox}
          label={labels.search}
          value={query}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setQuery(next);
            onChange?.(next);
          }}
        />
        {items && (
          <>
            <div
              id={listboxId}
              role="listbox"
              aria-label={labels.results}
              className="opale-command-palette__results opale-command-palette__listbox"
            >
              {items.map((item) => (
                /* Le focus reste dans la recherche : l'option est désignée par
                   `aria-activedescendant`, pas focalisée. */
                /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus --
                   Le clavier est porté par la combobox, comme dans `MultiSelect`. */
                <div
                  key={item.id}
                  id={optionId(item)}
                  role="option"
                  aria-selected={item === active}
                  aria-disabled={item.disabled ? true : undefined}
                  className="opale-command-palette__option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item)}
                >
                  <span className="opale-command-palette__option-label">{item.label}</span>
                  {item.description && (
                    <span className="opale-command-palette__option-description">
                      {item.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div role="status" className="opale-visually-hidden">
              {labels.resultCount(items.length)}
            </div>
          </>
        )}
        {children && <div className="opale-command-palette__results">{children}</div>}
      </div>
    </Modal>
  );
}

export interface BreadcrumbProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  items?: readonly NavItem[];
}

export function Breadcrumb({ items = [], className, ...rest }: BreadcrumbProps) {
  return (
    /* UNE LISTE ORDONNÉE, ET UN MAILLON COURANT. Le fil était une suite de
       `<span>` : rien n'annonçait « liste de quatre éléments, élément deux »,
       et aucun `aria-current` ne disait où l'on se trouve — sur le composant
       dont c'est l'unique fonction (WCAG 1.3.1). */
    <nav aria-label="Fil d'Ariane" {...rest} className={cx('opale-breadcrumb', className)}>
      <ol>
        {items.map((item, index) => {
          /* LA DERNIÈRE ÉTAPE EST LA PAGE COURANTE, LIEN OU PAS. `aria-current`
             ne vivait que dans la branche `href` — or l'étape où l'on se trouve
             n'a presque jamais de lien, puisqu'elle mènerait ici. Le cas
             ordinaire n'était donc jamais marqué. */
          const current = index === items.length - 1 ? 'page' : undefined;
          return (
            <li key={item.id}>
              {index > 0 && <span aria-hidden="true">/</span>}
              {item.href ? (
                <a href={item.href} aria-current={current}>
                  {item.label}
                </a>
              ) : (
                <span aria-current={current}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
/* =============================================================================
   LE BANDEAU SE SOUVIENT DU CHOIX, ET L'ON PEUT REFUSER.

   Il réapparaissait à chaque visite : un bandeau de consentement qui revient
   sans fin n'est pas neutre, il apprend à cliquer « Accepter » sans lire. Le
   choix est désormais écrit dans `localStorage`, sous `storageKey`.

   REFUSER DOIT ÊTRE AUSSI SIMPLE QU'ACCEPTER. Le bandeau n'offrait qu'un
   bouton ; mémoriser un choix suppose qu'il y en ait deux, et les deux ont le
   même poids.

   `open` DÉCIDE S'IL EST PASSÉ ; LA MÉMOIRE DÉCIDE SINON. Sans `open`, le
   bandeau s'affiche tant qu'aucun choix n'est mémorisé et se retire sur le
   choix. Avec `open`, l'appelant garde la main — c'est ce qui permet un lien
   « Gérer mes cookies » qui le rouvre, choix mémorisé ou pas.

   LE CHOIX MÉMORISÉ SE LIT AU DÉMARRAGE, pas dans un rappel. `onAccept` ne
   part qu'au clic : qui démarre une mesure d'audience sur ce rappel doit
   aussi lire `readCookieConsent()` au chargement, sans quoi la mesure ne
   redémarrerait plus jamais après la première visite.

   LE SERVEUR N'A PAS DE STOCKAGE. Il rend le bandeau ; le client, s'il lit un
   choix, le retire APRÈS l'hydratation. Un `useState` initialisé depuis
   `localStorage` rendait `null` dès le premier rendu client : React y voyait
   un désaccord avec le HTML reçu et reconstruisait le sous-arbre.
   `useSyncExternalStore` et son instantané serveur font exactement ce
   passage. Il suit aussi les autres onglets, par l'événement `storage`.

   LE STOCKAGE PEUT MANQUER — navigation privée, cookies bloqués. Chaque accès
   est gardé, et le choix de la visite est tenu en mémoire à côté : sans
   stockage, le bandeau se retire quand même sur le clic.

   UN REPÈRE NOMMÉ, PAS UNE RÉGION LIVE. Rendu par `Feedback`, il héritait de
   `role="status"` : un contenu présent au montage n'y est pas annoncé, et une
   région live n'est pas faite pour porter des boutons. Une `<section>`
   nommée se trouve, elle, dans la liste des régions du lecteur d'écran.
   ========================================================================== */
export const COOKIE_CONSENT_KEY = 'opale-cookie-consent';

/* Même durée que la sortie « slide-from-bottom » de Toast. */
const COOKIE_EXIT_MS = 240;

export type CookieConsent = 'accepted' | 'declined';

/** Le choix mémorisé sous `key`, ou `null` s'il n'y en a pas ou que le stockage manque. */
export function readCookieConsent(key: string | null = COOKIE_CONSENT_KEY): CookieConsent | null {
  if (!key || typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(key);
    return stored === 'accepted' || stored === 'declined' ? stored : null;
  } catch {
    return null;
  }
}

const consentListeners = new Set<() => void>();

function subscribeConsent(listener: () => void) {
  consentListeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    consentListeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/** Les textes de `CookieBanner`. */
export interface CookieBannerLabels {
  /** Le nom de la région, quand `aria-label` n'est pas passé. Défaut : « Consentement aux cookies ». */
  region: string;
  /** Défaut : « Cookies ». */
  title: string;
  /** Le message, quand `children` n'est pas passé. */
  message: string;
  /** Défaut : « Refuser ». */
  decline: string;
  /** Défaut : « Accepter ». */
  accept: string;
}

const DEFAULT_COOKIE_BANNER_LABELS: CookieBannerLabels = {
  region: 'Consentement aux cookies',
  title: 'Cookies',
  message: 'Nous utilisons des cookies pour améliorer votre expérience.',
  decline: 'Refuser',
  accept: 'Accepter',
};

/** Les props de `CookieBanner`. `ref` et les attributs vont à la `<section>` nommée. */
export interface CookieBannerProps extends ComponentPropsWithRef<'section'> {
  /** Passé, il décide seul de l'affichage ; omis, le bandeau suit le choix mémorisé. */
  open?: boolean;
  /** Appelée avec `false` quand l'utilisateur choisit. Le bandeau ne s'ouvre jamais de lui-même. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  onAccept?: () => void;
  onDecline?: () => void;
  /** Clé de `localStorage` où le choix est mémorisé ; `null` coupe la mémoire. */
  storageKey?: string | null;
  /** Remplace les textes français par défaut, clé par clé. `children` gagne sur `labels.message`. */
  labels?: Partial<CookieBannerLabels>;
  liquidGlass?: boolean;
}

export function CookieBanner({
  open,
  onOpenChange,
  children,
  onAccept,
  onDecline,
  storageKey = COOKIE_CONSENT_KEY,
  labels: labelsProp,
  liquidGlass = false,
  className,
  ...rest
}: CookieBannerProps) {
  const stored = useSyncExternalStore(
    subscribeConsent,
    () => readCookieConsent(storageKey),
    () => null,
  );
  const [decided, setDecided] = useState<CookieConsent | null>(null);
  const textId = useId();
  const labels = resolveLabels(DEFAULT_COOKIE_BANNER_LABELS, labelsProp);
  const visible = open ?? !(decided ?? stored);
  const [wasVisible, setWasVisible] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  /* Le bandeau fixe ne doit pas couvrir l'élément atteint au clavier. */
  useScrollPadding(anchorRef, 'bottom', visible);

  /* La sortie animée suit un clic ou la fermeture pilotée par `open`. Une
     préférence déjà mémorisée, découverte après hydratation, se retire tout
     de suite pour ne pas laisser clignoter un bandeau devenu inutile. */
  if (visible !== wasVisible) {
    setWasVisible(visible);
    setLeaving(!visible && (decided !== null || open === false));
  }

  useEffect(() => {
    if (!leaving) return undefined;
    const timeout = window.setTimeout(() => setLeaving(false), COOKIE_EXIT_MS);
    return () => window.clearTimeout(timeout);
  }, [leaving]);

  const decide = (choice: CookieConsent) => {
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, choice);
      } catch {
        /* Stockage inaccessible : le choix vaut pour cette visite. */
      }
    }
    setDecided(choice);
    consentListeners.forEach((listener) => listener());
    onOpenChange?.(false);
    (choice === 'accepted' ? onAccept : onDecline)?.();
  };

  if (!visible && !leaving) return null;

  const Shell = liquidGlass ? Glass : 'section';
  const shellProps = liquidGlass
    ? ({ as: 'section', rootClassName: 'opale-cookie-banner--glass-root' } as const)
    : {};

  return (
    <div ref={anchorRef} className="opale-cookie-banner-anchor">
      <div
        className={cx(
          toastMotion.card,
          toastMotion.slideFromBottom,
          leaving && toastMotion.leaving,
        )}
        inert={leaving}
        aria-hidden={leaving ? true : undefined}
      >
        <Shell
          aria-label={labels.region}
          aria-describedby={textId}
          {...rest}
          {...shellProps}
          className={cx(
            'opale-cookie-banner',
            liquidGlass && 'opale-cookie-banner--glass',
            className,
          )}
        >
          <div className="opale-cookie-banner__copy">
            <strong>{labels.title}</strong>
            <div id={textId}>{children === undefined ? labels.message : children}</div>
          </div>
          <div className="opale-cookie-banner__actions">
            <Button variant="danger" size="small" onClick={() => decide('declined')}>
              {labels.decline}
            </Button>
            <Button variant="primary" size="small" onClick={() => decide('accepted')}>
              {labels.accept}
            </Button>
          </div>
        </Shell>
      </div>
    </div>
  );
}

export interface SelectionBarProps extends ComponentPropsWithRef<'div'> {
  selectedCount?: number;
  children?: ReactNode;
  liquidGlass?: boolean;
}

export function SelectionBar({
  selectedCount = 0,
  children,
  liquidGlass = false,
  className,
  ...rest
}: SelectionBarProps) {
  return (
    <Surface
      {...rest}
      liquidGlass={liquidGlass}
      className={cx('opale-selection-bar', 'opale-panel', className)}
    >
      {/* LE COMPTE CHANGEAIT SANS UN MOT. On cochait des lignes et le total
          n'était jamais annoncé (WCAG 4.1.3). La région est montée en
          permanence avec la barre, donc elle est surveillée avant que le
          nombre ne bouge — c'est la condition pour qu'une annonce parte. */}
      <span aria-live="polite">
        {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
      </span>
      {children}
    </Surface>
  );
}

export interface StackProps extends ComponentPropsWithRef<'div'> {
  direction?: 'row' | 'column';
  wrap?: boolean;
}

export function Stack({
  direction = 'column',
  wrap = false,
  className,
  children,
  ...props
}: StackProps) {
  return (
    <div
      className={cx(
        'opale-stack',
        direction === 'column' && 'opale-stack--column',
        wrap && 'opale-stack--wrap',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface LayoutProps extends ComponentPropsWithRef<'div'> {
  navigation?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function Layout({ navigation, children, className, ...rest }: LayoutProps) {
  return (
    <div {...rest} className={cx('opale-layout', className)}>
      {navigation}
      <main className="opale-layout__content">{children}</main>
    </div>
  );
}

export interface DividerProps extends Omit<ComponentPropsWithRef<'hr'>, 'children'> {
  className?: string;
}

export function Divider({ className, ...rest }: DividerProps) {
  return <hr {...rest} className={cx('opale-divider', className)} />;
}

export interface BackgroundSurfaceProps extends ComponentPropsWithRef<'div'> {
  shape?: boolean;
}

/**
 * Le fond décoratif du catalogue.
 *
 * `shape` REMPLACE L'ANCIEN `ShapeBackground`, qui était ce composant plus un
 * `::after`. Les deux classes déclaraient la même boîte — mêmes `position`,
 * `overflow` et `background` — et PARTAGEAIENT déjà le même `::before` dans un
 * sélecteur groupé : seule la forme organique les distinguait. Deux composants
 * pour un pseudo-élément, c'était un de trop.
 */
export function BackgroundSurface({
  shape = false,
  children,
  className,
  ...props
}: BackgroundSurfaceProps) {
  return (
    <div
      className={cx(
        'opale-opaley-background',
        shape && 'opale-opaley-background--shape',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface DescriptionListProps extends Omit<ComponentPropsWithRef<'dl'>, 'children'> {
  items?: readonly { term: ReactNode; description: ReactNode }[];
}

export function DescriptionList({ items = [], className, ...rest }: DescriptionListProps) {
  return (
    <dl {...rest} className={cx('opale-description-list', className)}>
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
    <ul {...rest} className={cx('opale-bullet-list', className)}>
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
      className={cx('opale-rating', className)}
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
    <Surface {...rest} className={cx('opale-stat-card', className)} liquidGlass={liquidGlass}>
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
      className={cx('opale-donut', className)}
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
      className={cx('opale-panel', 'opale-table-panel', className)}
    >
      <div className="opale-table-scroll">
        <table
          className={cx(
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
    <nav aria-label="Liens légaux" {...rest} className={cx('opale-legal-links', className)}>
      {links.map((link) => (
        <a key={link.id} href={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}

/**
 * Les props de `FileCard`. La coquille est un `<button>` quand `onClick` est
 * passé, un `<div>` sinon : `ref` et les attributs visent donc un `HTMLElement`.
 */
export interface FileCardProps extends Omit<HTMLAttributes<HTMLElement>, 'onClick'> {
  name: string;
  size?: string;
  selected?: boolean;
  onClick?: () => void;
  liquidGlass?: boolean;
  ref?: Ref<HTMLElement>;
}

export function FileCard({
  name,
  size,
  selected = false,
  onClick,
  liquidGlass = false,
  className,
  ref,
  ...rest
}: FileCardProps) {
  /* Une ref d'`HTMLElement` ne se pose pas telle quelle sur un `<button>` : la
     fonction qui l'enveloppe, elle, convient aux deux balises. */
  const shellRef = useCallback((node: HTMLElement | null) => mergeRefs(ref)(node), [ref]);
  return (
    /* `aria-pressed` ET UNE CLASSE PROPRE, À LA PLACE DU LAVIS.

       La sélection n'était signalée que par `.opale-liquid` — l'ancienne
       imitation du verre, détournée en surbrillance. Deux défauts pour le
       prix d'un : un lecteur d'écran ne pouvait pas dire quelles cartes
       étaient choisies (WCAG 4.1.2), et l'information n'existait que par la
       couleur (1.4.1). La classe dédiée porte un liseré et une coche ; l'état
       est désormais annoncé. */
    <FileCardShell
      {...rest}
      shellRef={shellRef}
      liquidGlass={liquidGlass}
      className={cx(
        'opale-surface',
        liquidGlass && 'opale-surface--glass',
        'opale-file-card',
        selected && 'opale-file-card--selected',
        className,
      )}
      selected={selected}
      onClick={onClick}
    >
      <IconGlyph name="file" className="opale-file-card__icon" />
      <span className="opale-file-card__text">
        <strong>{name}</strong>
        {size && <small className="opale-field__helper">{size}</small>}
        {selected && !onClick && <span className="opale-visually-hidden">Sélectionné</span>}
      </span>
    </FileCardShell>
  );
}

/**
 * La coquille de la carte de fichier, dans l'une ou l'autre matière.
 *
 * `Glass as="button"` REND LE BOUTON SUR SA COUCHE DE CONTENU : `aria-pressed`
 * et le gestionnaire de clic restent donc sur le MÊME nœud que dans le rendu
 * original. C'est la règle de tout ce fichier — le contrat d'accessibilité ne
 * dépend pas de l'apparence.
 */
function FileCardShell({
  liquidGlass,
  children,
  selected,
  onClick,
  shellRef,
  ...props
}: Omit<HTMLAttributes<HTMLElement>, 'onClick'> & {
  liquidGlass: boolean;
  className: string;
  selected: boolean;
  onClick?: () => void;
  shellRef: RefCallback<HTMLElement>;
  children: ReactNode;
}) {
  if (liquidGlass) {
    return onClick ? (
      <Glass
        {...props}
        ref={shellRef}
        as="button"
        type="button"
        rootClassName="opale-file-card--glass-root"
        aria-pressed={selected}
        onClick={onClick}
      >
        {children}
      </Glass>
    ) : (
      <Glass {...props} ref={shellRef} as="div" rootClassName="opale-file-card--glass-root">
        {children}
      </Glass>
    );
  }

  return onClick ? (
    <button {...props} ref={shellRef} type="button" aria-pressed={selected} onClick={onClick}>
      {children}
    </button>
  ) : (
    <div {...props} ref={shellRef}>
      {children}
    </div>
  );
}
/** Les textes de `Dropzone`. */
export interface DropzoneLabels {
  /** L'invite, quand `children` n'est pas passé. Défaut : « Ajoutez vos fichiers ». */
  prompt: string;
  /** Défaut : « Sélectionner des fichiers ». */
  select: string;
  /** Défaut : « Sélection désactivée ». */
  disabled: string;
  /** Défaut : « Sélectionnez au maximum 2 fichiers. ». */
  tooManyFiles: (maxFiles: number) => string;
  /** Défaut : « Un fichier dépasse la taille maximale de 1024 octets. ». */
  fileTooLarge: (maxSizeBytes: number) => string;
  /** Défaut : « Le type d’un fichier n’est pas accepté. ». */
  typeRejected: string;
}

const DEFAULT_DROPZONE_LABELS: DropzoneLabels = {
  prompt: 'Ajoutez vos fichiers',
  select: 'Sélectionner des fichiers',
  disabled: 'Sélection désactivée',
  tooManyFiles: (maxFiles) =>
    `Sélectionnez au maximum ${maxFiles} fichier${maxFiles > 1 ? 's' : ''}.`,
  fileTooLarge: (maxSizeBytes) =>
    `Un fichier dépasse la taille maximale de ${maxSizeBytes} octets.`,
  typeRejected: 'Le type d’un fichier n’est pas accepté.',
};

/** Les props de `Dropzone`. `ref` et les attributs vont au `<label>` qui porte la zone. */
export interface DropzoneProps extends Omit<
  ComponentPropsWithRef<'label'>,
  'children' | 'onError'
> {
  onFiles?: (files: FileList) => void;
  onError?: (message: string) => void;
  children?: ReactNode;
  accept?: string;
  maxFiles?: number;
  maxSizeBytes?: number;
  disabled?: boolean;
  liquidGlass?: boolean;
  /** Remplace les textes français par défaut, clé par clé. `children` gagne sur `labels.prompt`. */
  labels?: Partial<DropzoneLabels>;
}

function fileMatchesAccept(file: File, accept: string): boolean {
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return rules.some((rule) =>
    rule.startsWith('.')
      ? name.endsWith(rule)
      : rule.endsWith('/' + '*')
        ? type.startsWith(rule.slice(0, -1))
        : type === rule,
  );
}

export function Dropzone({
  onFiles,
  onError,
  children,
  accept,
  maxFiles,
  maxSizeBytes,
  disabled = false,
  liquidGlass = false,
  labels: labelsProp,
  className,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  ...rest
}: DropzoneProps) {
  const Zone = liquidGlass ? Glass : 'label';
  const zoneProps = liquidGlass
    ? ({ as: 'label', rootClassName: 'opale-dropzone--glass-root' } as const)
    : {};
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const depth = useRef(0);
  const labels = resolveLabels(DEFAULT_DROPZONE_LABELS, labelsProp);
  const errorId = useId();

  const receive = (files: FileList) => {
    if (disabled || files.length === 0) return;
    let message = '';
    if (maxFiles !== undefined && files.length > maxFiles) {
      message = labels.tooManyFiles(maxFiles);
    } else if (
      maxSizeBytes !== undefined &&
      Array.from(files).some((file) => file.size > maxSizeBytes)
    ) {
      message = labels.fileTooLarge(maxSizeBytes);
    } else if (accept && Array.from(files).some((file) => !fileMatchesAccept(file, accept))) {
      message = labels.typeRejected;
    }
    setError(message);
    if (message) onError?.(message);
    else onFiles?.(files);
  };

  /* Le geste de la zone d'abord, le gestionnaire de l'appelant ensuite. */
  const dragHandlers = {
    onDragEnter: (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      if (!disabled) {
        depth.current += 1;
        setDragging(true);
      }
      onDragEnter?.(event);
    },
    onDragOver: (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      onDragOver?.(event);
    },
    onDragLeave: (event: DragEvent<HTMLLabelElement>) => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
      onDragLeave?.(event);
    },
    onDrop: (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      depth.current = 0;
      setDragging(false);
      receive(event.dataTransfer.files);
      onDrop?.(event);
    },
  };

  /* L'ERREUR VIT HORS DU `<label>` : dedans, elle entrait dans le nom du champ.
     Elle le décrit, et sa région reste montée pour être annoncée. */
  return (
    <>
      <Zone
        {...rest}
        {...zoneProps}
        {...dragHandlers}
        className={cx('opale-dropzone', liquidGlass && 'opale-dropzone--glass', className)}
        data-dragging={dragging ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
      >
        <input
          type="file"
          className="opale-visually-hidden"
          multiple
          accept={accept}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            if (event.currentTarget.files) receive(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />
        <strong>{children === undefined ? labels.prompt : children}</strong>
        <span className="opale-dropzone__action">{disabled ? labels.disabled : labels.select}</span>
      </Zone>
      <span id={errorId} className="opale-dropzone__error" role="alert">
        {error}
      </span>
    </>
  );
}

/** Les textes de `Lightbox`. `close` nomme la croix et le bouton Fermer. */
export interface LightboxLabels extends ModalLabels {
  /** Le nom du dialogue, quand `aria-label` n'est pas passé. Défaut : « Aperçu ». */
  dialog: string;
}

const DEFAULT_LIGHTBOX_LABELS: LightboxLabels = { close: 'Fermer', dialog: 'Aperçu' };

/** Les props de `Lightbox`. `ref` et les attributs vont au panneau. */
export interface LightboxProps extends Omit<ComponentPropsWithRef<'div'>, 'title' | 'children'> {
  src?: string;
  /* `alt` EST OBLIGATOIRE, ET IL NE PEUT PAS EN ÊTRE AUTREMENT. Sa valeur par
     défaut était la chaîne vide, c'est-à-dire « cette image est décorative » —
     déclaré sur la seule chose que la visionneuse existe pour montrer. Un
     appelant distrait produisait une lightbox vide pour qui ne voit pas, sans
     le moindre signal. Une prop obligatoire dit « décris-moi » ; un défaut
     vide dit « ce n'est pas grave ». Rupture d'API assumée. */
  alt: string;
  open?: boolean;
  /** Appelée avec `false` sur Échap, le voile, la croix ou Fermer. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Depuis 3.6 — utilisez `onOpenChange`. */
  onClose?: () => void;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<LightboxLabels>;
  liquidGlass?: boolean;
}

export function Lightbox({
  src,
  alt,
  open = false,
  onOpenChange,
  onClose,
  labels: labelsProp,
  liquidGlass = false,
  ...rest
}: LightboxProps) {
  const close = closeHandler(onOpenChange, onClose);
  const labels = resolveLabels(DEFAULT_LIGHTBOX_LABELS, labelsProp);
  return (
    <Modal
      aria-label={labels.dialog}
      {...rest}
      labels={{ close: labels.close }}
      open={open && Boolean(src)}
      onOpenChange={close}
      liquidGlass={liquidGlass}
      rootClassName="opale-lightbox"
      footer={
        /* UN BOUTON PLEIN, ET NON LE FANTÔME. `ghost` trace son contour par un
           masque découpé en squircle : autour d'un libellé court, il ne restait
           que deux crochets de part et d'autre de « Fermer ». `tonal` est le
           bouton secondaire du système. */
        <Button
          variant="tonal"
          liquidGlass={liquidGlass}
          onClick={closeClickHandler(onOpenChange, onClose)}
        >
          {labels.close}
        </Button>
      }
    >
      {src && <img src={src} alt={alt} />}
    </Modal>
  );
}
/* =============================================================================
   LE PRESSE-PAPIER DIT CE QUI S'EST PASSÉ.

   `writeText` était lancé sans être attendu, et « Copié » posé sans
   condition : en HTTP hors localhost — où `navigator.clipboard` n'existe
   pas — ou sur un refus de permission, le bouton affirmait une copie qui
   n'avait pas eu lieu. Et l'état ne revenait jamais : un second clic, une
   heure plus tard, ne changeait plus rien à l'écran.

   L'ANNONCE PASSE PAR UNE RÉGION, pas par le libellé du bouton. Un lecteur
   d'écran ne relit pas le nom du contrôle qu'on vient d'actionner : « Copié »
   apparaissait sans un mot (WCAG 4.1.3). La région est montée vide dès le
   départ, condition pour que son premier changement soit entendu.
   ========================================================================== */
const CLIPBOARD_RESET_MS = 2000;

type ClipboardState = 'idle' | 'copied' | 'failed';

const CLIPBOARD_STATUS: Record<ClipboardState, string> = {
  idle: '',
  copied: 'Copié dans le presse-papier',
  failed: 'Échec de la copie',
};

/** Les props de `Clipboard`. `ref` et les attributs vont au bouton de copie. */
export interface ClipboardProps extends Omit<ButtonProps, 'children' | 'value'> {
  value: string;
  liquidGlass?: boolean;
  children?: ReactNode;
}

export function Clipboard({
  value,
  liquidGlass = false,
  children = 'Copier',
  onClick,
  ...rest
}: ClipboardProps) {
  const [state, setState] = useState<ClipboardState>('idle');
  const reset = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(reset.current), []);

  const copy = async () => {
    /* LA RÉGION REPASSE PAR LE VIDE. Deux copies rapprochées laissaient le même
       texte en place : la seconde n'était pas entendue. */
    setState('idle');
    clearTimeout(reset.current);
    let next: ClipboardState = 'failed';
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        next = 'copied';
      }
    } catch {
      next = 'failed';
    }
    setState(next);
    /* L'ÉCHEC RESTE jusqu'au prochain essai : effacé au bout de deux secondes,
       il disparaissait avant qu'on ait pu le lire ou réagir. */
    if (next === 'copied') {
      reset.current = setTimeout(() => setState('idle'), CLIPBOARD_RESET_MS);
    }
  };

  return (
    <>
      <Button
        size="small"
        variant="tonal"
        {...rest}
        liquidGlass={liquidGlass}
        onClick={(event) => {
          void copy();
          onClick?.(event);
        }}
      >
        {state === 'copied' ? 'Copié' : state === 'failed' ? 'Échec de la copie' : children}
      </Button>
      <span className="opale-visually-hidden" role="status">
        {CLIPBOARD_STATUS[state]}
      </span>
    </>
  );
}
/* =============================================================================
   LA CARTE SVG, REFONDUE EN 3.5.0.

   CE QU'ELLE ÉTAIT. Un `<svg>` de 400 × 180 avec une courbe décorative, qui
   attendait des enfants : un cadre, pas une carte. Ni zoom, ni déplacement,
   ni sélection — tout ce qu'on attend d'une carte revenait à l'appelant.

   CE QU'ELLE EST. L'appelant fournit le DESSIN — un viewBox et des régions,
   chacune un tracé et un nom — et, s'il le veut, une couleur par région. Le
   composant s'occupe de la VUE (zoom, déplacement, cadrage), des GESTES
   (pincement, glissement, molette), de la SÉLECTION (clic, clavier) et de
   l'accessibilité. Il ne connaît aucune règle métier : une carte de chaleur,
   un quiz ou un sélecteur de zone de livraison s'écrivent avec les mêmes
   props.

   LES CHOIX QUI LA DISTINGUENT DE CE QUI L'A INSPIRÉE, et chacun corrige un
   défaut constaté ailleurs :

   - La molette NE CONFISQUE PAS le défilement de la page : sans Ctrl ou ⌘,
     elle laisse défiler et affiche la consigne. Le pincement d'un pavé tactile
     arrive avec Ctrl, il zoome donc sans rien apprendre.
   - UN SEUL ARRÊT DE TABULATION, et les flèches pour parcourir : cent
     départements en tabulation, ce sont cent pressions pour sortir de la carte.
     La région atteinte au clavier est ramenée dans la vue si elle en sort.
   - Survol, focus et sélection sont peints par un CALQUE AU-DESSUS des régions :
     le contour d'une région n'est jamais masqué par ses voisines, qui sont
     dessinées après elle.
   - Le trait ne s'épaissit pas en zoomant (`vector-effect`), et le contour par
     défaut tient 3:1 dans les deux thèmes — il porte le découpage.
   - Les commandes indisponibles restent à leur place, `aria-disabled` : un
     bouton qui disparaît sous le focus jette le clavier en haut de la page.
   ========================================================================== */

export interface SvgMapRegion {
  /** Identifiant de la région, renvoyé par `onSelect`. */
  readonly id: string;
  /** Le tracé, tel quel : l'attribut `d` d'un `<path>`. */
  readonly path: string;
  /** Nom lisible : affiché au survol, et nom accessible à défaut d'`ariaLabel`. */
  readonly name?: string;
  /**
   * Nom accessible, jamais affiché. Il se résout dans l'ordre `ariaLabel`,
   * `name`, puis l'identifiant. Un jeu de désignation qui retire `name` — pour
   * que l'infobulle ne vende pas la réponse — doit poser `ariaLabel`, sans quoi
   * un lecteur d'écran annoncerait l'identifiant, c'est-à-dire la réponse.
   */
  readonly ariaLabel?: string;
}

/** Les textes des boutons de zoom. */
export interface SvgMapControlsLabels {
  /** Le nom du groupe, quand `aria-label` n'est pas passé. Défaut : « Zoom ». */
  group: string;
  /** Défaut : « Zoomer ». */
  zoomIn: string;
  /** Défaut : « Dézoomer ». */
  zoomOut: string;
  /** Défaut : « Vue d’ensemble ». */
  reset: string;
}

/** Les textes d'une carte ; les clés des commandes vont aux boutons de zoom intégrés. */
export interface SvgMapLabels extends SvgMapControlsLabels {
  /** Le nom de la carte, quand `label` n'est pas passé. Défaut : « Carte ». */
  map: string;
  /** La consigne affichée à la molette sans modificateur. */
  wheelHint: string;
  /** La consigne clavier d'une carte illustrative, annoncée après la description. */
  instructions: string;
  /** La consigne clavier d'une carte sélectionnable. */
  instructionsSelectable: string;
}

const DEFAULT_SVG_MAP_CONTROLS_LABELS: SvgMapControlsLabels = {
  group: 'Zoom',
  zoomIn: 'Zoomer',
  zoomOut: 'Dézoomer',
  reset: 'Vue d’ensemble',
};

const DEFAULT_SVG_MAP_LABELS: SvgMapLabels = {
  ...DEFAULT_SVG_MAP_CONTROLS_LABELS,
  map: 'Carte',
  wheelHint: 'Ctrl ou ⌘ + molette pour zoomer',
  instructions:
    'Flèches pour déplacer la vue, plus et moins pour zoomer, zéro pour revenir à la vue d’ensemble.',
  instructionsSelectable:
    'Flèches pour aller à la région voisine, Entrée pour choisir, Maj et flèches pour déplacer la vue, plus et moins pour zoomer, zéro pour revenir à la vue d’ensemble.',
};

export interface SvgMapProps extends Omit<ComponentPropsWithRef<'div'>, 'onSelect' | 'children'> {
  /** Vue d'ensemble du dessin, au format de l'attribut `viewBox`. */
  readonly viewBox: string;
  readonly regions: readonly SvgMapRegion[];
  /** Nom de la carte, annoncé par les lecteurs d'écran ; gagne sur `labels.map`. */
  readonly label?: string;
  /**
   * Description de la carte, annoncée après son nom : ce qu'elle montre, ou où
   * trouver les mêmes données en texte. Une carte de chaleur n'est qu'une image
   * pour qui ne la voit pas — elle doit dire où lire ses valeurs.
   */
  readonly description?: ReactNode;
  /** Couleur de remplissage d'une région, appelée à chaque rendu. */
  readonly fill?: (id: string) => string | undefined;
  /**
   * Couleur du contour des régions. Le défaut tient 3:1 contre le remplissage
   * PAR DÉFAUT ; avec des teintes calculées par `fill`, c'est à l'appelant de
   * choisir un contour qui se détache des siennes.
   */
  readonly stroke?: string;
  /** Rend les régions cliquables et atteignables au clavier. */
  readonly selectable?: boolean;
  readonly onSelect?: (id: string) => void;
  /**
   * Les régions retenues, si l'appelant en tient la liste : elles sont
   * soulignées et annoncées `aria-pressed`. Sans cette prop, aucun état pressé
   * n'est annoncé — le composant ne l'invente pas.
   */
  readonly selected?: readonly string[];
  /** Vue partagée avec l'appelant, créée par `useSvgMapViewport`. */
  readonly viewport?: UseSvgMapViewportResult;
  /** Zoom maximal, en facteur de la vue d'ensemble (vue interne seulement). */
  readonly maxZoom?: number;
  /** Largeur maximale ; la carte se centre au-delà. */
  readonly maxWidth?: string;
  /** Hauteur maximale, traduite en largeur au rapport du viewBox. */
  readonly maxHeight?: string;
  /** Boutons de zoom intégrés. */
  readonly controls?: boolean;
  /** Déplacement, en pixels, au-delà duquel un contact devient un glissement. */
  readonly tapTolerance?: number;
  /** Zoom à la molette : avec Ctrl ou ⌘ par défaut, toujours, ou jamais. */
  readonly wheel?: SvgMapWheel;
  /** Posé au-dessus de la carte, en haut à gauche : légende, consigne. */
  readonly overlay?: ReactNode;
  /** Dessin supplémentaire, dans les coordonnées de la carte : repères, tracés. */
  readonly children?: ReactNode;
  /** Remplace les textes français par défaut, clé par clé. */
  readonly labels?: Partial<SvgMapLabels>;
  readonly liquidGlass?: boolean;
  readonly className?: string;
}

const SVG_MAP_DEFAULT_STEP = 1.6;

/** La direction de chaque flèche, en unités de la vue. */
const SVG_MAP_ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

export function SvgMap({
  viewBox,
  regions,
  label,
  description,
  fill,
  stroke,
  selectable = false,
  onSelect,
  selected,
  viewport: sharedViewport,
  maxZoom = 9,
  maxWidth,
  maxHeight,
  controls = true,
  tapTolerance = 6,
  wheel = 'modifier',
  overlay,
  children,
  labels: labelsProp,
  liquidGlass = false,
  className,
  style: styleProp,
  onKeyDown,
  ...rest
}: SvgMapProps) {
  const labels = resolveLabels(DEFAULT_SVG_MAP_LABELS, labelsProp);
  /* LE CROCHET EST TOUJOURS APPELÉ, et la vue de l'appelant l'emporte : l'ordre
     des crochets ne peut pas dépendre d'une prop. */
  const ownViewport = useSvgMapViewport(viewBox, { maxZoom });
  const viewport = sharedViewport ?? ownViewport;
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const regionRefs = useRef(new Map<string, SVGPathElement>());
  const descriptionId = useId();
  const { onPointerDown, onClickCapture, dragging, hint } = useSvgMapGestures(svgRef, viewport, {
    tapTolerance,
    wheel,
  });

  /* UN TRACÉ ILLISIBLE N'EMPORTE PAS LA CARTE. Il est dessiné quand même — le
     navigateur fait de son mieux avec — mais n'a pas de boîte : le cadrage
     l'ignore au lieu de faire tomber toute la page. */
  const bounds = useMemo(() => {
    const map = new Map<string, Bounds>();
    for (const region of regions) {
      try {
        map.set(region.id, pathBounds(region.path));
      } catch {
        /* Région sans boîte : voir ci-dessus. */
      }
    }
    return map;
  }, [regions]);
  const { registerRegions } = viewport;
  useLayoutEffect(() => registerRegions(bounds), [bounds, registerRegions]);

  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  /* Échap ferme l'infobulle jusqu'au prochain survol ou au prochain focus
     (WCAG 1.4.13) : elle recouvre les régions voisines. */
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  /* Un clic donne aussi le focus à la région. Le recentrage animé qui suit un
     focus au clavier ferait alors glisser la carte sous le pointeur, entre
     l'appui et le relâchement : le clic tomberait à côté. */
  const pointerFocus = useRef(false);

  const rovingId =
    activeId && bounds.has(activeId)
      ? activeId
      : (selected?.find((id) => bounds.has(id)) ?? regions[0]?.id);
  const selectedSet = useMemo(() => new Set(selected ?? []), [selected]);
  const base = useMemo(() => parseSvgViewBox(viewport.viewBox), [viewport.viewBox]);
  const ratio = base.width / base.height;

  const nameOf = (region: SvgMapRegion) => region.ariaLabel ?? region.name ?? region.id;

  const focusRegion = (id: string) => {
    setActiveId(id);
    regionRefs.current.get(id)?.focus();
  };

  /* LES FLÈCHES SUIVENT LA GÉOGRAPHIE, PAS LA LISTE. L'ordre du tableau ne
     dit rien de la carte — il peut même être mélangé — et « droite » doit
     mener à droite. Chaque flèche vise la région la plus proche dans sa
     direction, l'écart perpendiculaire pesant double ; sans voisine dans cette
     direction, le focus reste où il est. Début et Fin gardent l'ordre de la
     liste, qui est un ordre de lecture. */
  const neighbour = (id: string, key: string): string | null => {
    const from = bounds.get(id);
    if (!from) return null;
    const center = (b: Bounds) => ({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 });
    const origin = center(from);
    const direction = SVG_MAP_ARROWS[key];
    if (!direction) return null;
    const [ax, ay] = direction;
    let best: { id: string; score: number } | null = null;
    for (const [candidate, box] of bounds) {
      if (candidate === id) continue;
      const c = center(box);
      const along = (c.x - origin.x) * ax + (c.y - origin.y) * ay;
      if (along <= 0.5) continue;
      const across = Math.abs((c.x - origin.x) * ay) + Math.abs((c.y - origin.y) * ax);
      const score = along + 2 * across;
      if (!best || score < best.score) best = { id: candidate, score };
    }
    return best?.id ?? null;
  };

  const handleRegionKeyDown = (event: KeyboardEvent<SVGPathElement>, index: number) => {
    const id = regions[index].id;
    const target =
      event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
        ? null
        : event.key.startsWith('Arrow')
          ? neighbour(id, event.key)
          : event.key === 'Home'
            ? regions[0].id
            : event.key === 'End'
              ? regions[regions.length - 1].id
              : undefined;

    if (target !== undefined) {
      event.preventDefault();
      if (target) focusRegion(target);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(regions[index].id);
    }
  };

  /* LES RACCOURCIS DE ZOOM S'ENTENDENT PARTOUT DANS LA CARTE — sur une région
     comme sur ses commandes. Ctrl/⌘ + et − restent au navigateur : ce sont les
     siens, et les confisquer empêcherait d'agrandir la page. */
  /* LES RACCOURCIS NE PARTENT QUE DE LA CARTE ET DE SES COMMANDES. Un champ
     posé dans `overlay` doit pouvoir recevoir « 0 » ou « - » : sans ce filtre,
     taper un code postal remettait la carte en vue d'ensemble. */
  const isMapTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    (target === svgRef.current ||
      target.hasAttribute('data-region-id') ||
      target.closest('.opale-svg-map-controls') !== null);

  /** Le centre de la région qui a le focus : c'est là que zoome le clavier. */
  const focusOrigin = () => {
    const box = focusedId ? bounds.get(focusedId) : undefined;
    return box ? { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 } : undefined;
  };

  const handleMapKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    /* Échap consommé par l'infobulle : la modale englobante reste ouverte. */
    if (event.key === 'Escape' && tooltipName) {
      event.preventDefault();
      event.stopPropagation();
      setTooltipDismissed(true);
      return;
    }
    if (!isMapTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;

    /* SE DÉPLACER AU CLAVIER. Une carte zoomée ne se parcourait qu'en la
       glissant (WCAG 2.1.1, 2.5.7). Maj + flèches déplacent la vue de partout ;
       sur une carte sans régions à choisir, les flèches seules suffisent. */
    const pan = SVG_MAP_ARROWS[event.key];
    if (pan && (event.shiftKey || event.target === svgRef.current)) {
      event.preventDefault();
      const view = viewport.getView();
      viewport.panBy(pan[0] * view.width * 0.2, pan[1] * view.height * 0.2);
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      viewport.zoomBy(SVG_MAP_DEFAULT_STEP, focusOrigin(), { animate: true });
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      viewport.zoomBy(1 / SVG_MAP_DEFAULT_STEP, focusOrigin(), { animate: true });
    } else if (event.key === '0') {
      event.preventDefault();
      viewport.reset();
    }
  };

  /* Les raccourcis de la carte d'abord, le gestionnaire de l'appelant ensuite. */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    handleMapKeys(event);
    onKeyDown?.(event);
  };

  /* L'INFOBULLE SE PLACE EN POURCENTAGES DU CADRE, et c'est ce qui la garde
     juste pendant un zoom. Au clavier, elle se calcule depuis la vue — donc
     suit la région pendant qu'une transition la ramène à l'écran — sans jamais
     mesurer le DOM pendant le rendu. Au pointeur, elle suit le curseur. */
  const anchorOf = (id: string) => {
    const box = bounds.get(id);
    if (!box) return { x: 50, y: 50 };
    const { view } = viewport;
    return {
      x: (((box.minX + box.maxX) / 2 - view.x) / view.width) * 100,
      y: ((box.minY - view.y) / view.height) * 100,
    };
  };

  const pointerAnchor = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current?.getBoundingClientRect();
    return canvas && canvas.width > 0 && canvas.height > 0
      ? {
          x: ((clientX - canvas.left) / canvas.width) * 100,
          y: ((clientY - canvas.top) / canvas.height) * 100,
        }
      : { x: 50, y: 50 };
  };

  const tooltipRegion = hovered ?? (focusedId ? { id: focusedId, ...anchorOf(focusedId) } : null);
  const tooltipName =
    tooltipRegion && !tooltipDismissed
      ? regions.find((region) => region.id === tooltipRegion.id)?.name
      : undefined;

  const maxInlineSize = [maxWidth, maxHeight && `calc(${maxHeight} * ${ratio})`].filter(Boolean);
  /* Le style de l'appelant d'abord ; le rapport et les bornes, vitaux, ensuite. */
  const style = {
    ...styleProp,
    '--opale-svg-map-ratio': `${base.width} / ${base.height}`,
    ...(stroke ? { '--opale-svg-map-stroke': stroke } : {}),
    ...(maxInlineSize.length > 0
      ? {
          maxInlineSize:
            maxInlineSize.length > 1 ? `min(${maxInlineSize.join(', ')})` : maxInlineSize[0],
        }
      : {}),
  } as CSSProperties;

  const regionById = (id: string) => regions.find((region) => region.id === id);
  const overlayPath = (
    id: string,
    kind: 'hover' | 'selected-halo' | 'selected' | 'focus-halo' | 'focus',
  ) => {
    const region = regionById(id);
    return region ? (
      <path
        key={`${kind}-${id}`}
        d={region.path}
        className={`opale-svg-map__${kind}`}
        vectorEffect="non-scaling-stroke"
      />
    ) : null;
  };

  const canvas = (
    <div
      ref={canvasRef}
      className="opale-svg-map__canvas"
      data-zoomed={viewport.zoomed ? 'true' : undefined}
      data-dragging={dragging ? 'true' : undefined}
    >
      <svg
        ref={svgRef}
        className="opale-svg-map__svg"
        viewBox={viewport.current}
        preserveAspectRatio="xMidYMid meet"
        /* RÔLE IMAGE, OU GROUPE DÈS QU'ON PEUT SÉLECTIONNER. Une image rend son
           sous-arbre décoratif : les régions y disparaîtraient des lecteurs
           d'écran, alors qu'elles sont justement ce qu'on désigne. */
        role={selectable ? 'group' : 'img'}
        aria-label={label ?? labels.map}
        aria-describedby={descriptionId}
        /* Sans régions à choisir, c'est la carte elle-même qui prend le focus :
           c'est par elle que le clavier zoome et se déplace. */
        tabIndex={selectable ? undefined : 0}
        data-selectable={selectable ? 'true' : undefined}
        onPointerDown={(event) => {
          pointerFocus.current = true;
          setTimeout(() => {
            pointerFocus.current = false;
          }, 0);
          onPointerDown(event);
        }}
        onClickCapture={onClickCapture}
      >
        <g className="opale-svg-map__regions">
          {regions.map((region, index) => {
            const isSelected = selectedSet.has(region.id);
            const color = fill?.(region.id);
            return (
              <path
                key={region.id}
                ref={(node) => {
                  if (node) regionRefs.current.set(region.id, node);
                  else regionRefs.current.delete(region.id);
                }}
                d={region.path}
                data-region-id={region.id}
                className="opale-svg-map__region"
                style={color ? { fill: color } : undefined}
                vectorEffect="non-scaling-stroke"
                {...(selectable
                  ? {
                      role: 'button',
                      tabIndex: region.id === rovingId ? 0 : -1,
                      'aria-label': nameOf(region),
                      'aria-pressed': selected ? isSelected : undefined,
                      onClick: () => onSelect?.(region.id),
                      onKeyDown: (event: KeyboardEvent<SVGPathElement>) =>
                        handleRegionKeyDown(event, index),
                      onFocus: () => {
                        setActiveId(region.id);
                        setFocusedId(region.id);
                        setTooltipDismissed(false);
                        if (!pointerFocus.current) viewport.reveal(region.id);
                      },
                      onBlur: () =>
                        setFocusedId((current) => (current === region.id ? null : current)),
                    }
                  : { 'aria-hidden': true })}
                onPointerMove={(event) => {
                  if (hovered?.id !== region.id) setTooltipDismissed(false);
                  setHovered({ id: region.id, ...pointerAnchor(event.clientX, event.clientY) });
                }}
                onPointerLeave={() =>
                  setHovered((current) => (current?.id === region.id ? null : current))
                }
              />
            );
          })}
        </g>

        {/* LE CALQUE DES ÉTATS, AU-DESSUS DE TOUTES LES RÉGIONS. Une région est
            peinte avant ses voisines : son contour, épaissi sur place, serait
            recouvert pour moitié. Redessiné ici, il reste entier. */}
        <g className="opale-svg-map__states" aria-hidden="true">
          {[...selectedSet].map((id) => overlayPath(id, 'selected-halo'))}
          {[...selectedSet].map((id) => overlayPath(id, 'selected'))}
          {hovered && !dragging && overlayPath(hovered.id, 'hover')}
          {focusedId && overlayPath(focusedId, 'focus-halo')}
          {focusedId && overlayPath(focusedId, 'focus')}
        </g>

        {children}
      </svg>

      {overlay && <div className="opale-svg-map__overlay">{overlay}</div>}

      {controls && (
        <SvgMapControls
          viewport={viewport}
          liquidGlass={liquidGlass}
          labels={labels}
          className="opale-svg-map__controls"
        />
      )}

      {tooltipName && tooltipRegion && !dragging && (
        <span
          className="opale-svg-map__tooltip"
          aria-hidden="true"
          style={{ left: `${tooltipRegion.x}%`, top: `${tooltipRegion.y}%` }}
        >
          {tooltipName}
        </span>
      )}

      {/* La consigne est pour la souris : le clavier a ses raccourcis, décrits
          plus bas, et l'annoncer à chaque molette serait du bruit. */}
      <span
        className="opale-svg-map__hint"
        aria-hidden="true"
        data-visible={hint ? 'true' : undefined}
      >
        {labels.wheelHint}
      </span>

      <span id={descriptionId} className="opale-visually-hidden">
        {description ? <>{description} </> : null}
        {selectable ? labels.instructionsSelectable : labels.instructions}
      </span>
    </div>
  );

  return (
    /* LES RACCOURCIS SONT DÉLÉGUÉS, PAS PORTÉS : l'enveloppe n'est pas un
       contrôle et ne prend pas le focus. Elle écoute les touches qui remontent
       de ses vrais contrôles — les régions et les boutons de zoom. */
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- délégation des raccourcis, voir ci-dessus
    <div
      {...rest}
      className={cx('opale-svg-map', liquidGlass && 'opale-svg-map--glass', className)}
      style={style}
      onKeyDown={handleKeyDown}
    >
      {liquidGlass ? (
        <Surface liquidGlass className="opale-svg-map__plate">
          {canvas}
        </Surface>
      ) : (
        <div className="opale-svg-map__plate">{canvas}</div>
      )}
    </div>
  );
}

export interface SvgMapControlsProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** La vue à piloter, celle que renvoie `useSvgMapViewport`. */
  readonly viewport: UseSvgMapViewportResult;
  /**
   * Pas de zoom des boutons. 1,6 est plus franc que la molette : un bouton
   * qu'on clique doit se voir agir.
   */
  readonly step?: number;
  /** Remplace les textes français par défaut, clé par clé. */
  readonly labels?: Partial<SvgMapControlsLabels>;
  readonly liquidGlass?: boolean;
  readonly className?: string;
}

export function SvgMapControls({
  viewport,
  step = SVG_MAP_DEFAULT_STEP,
  labels: labelsProp,
  liquidGlass = false,
  className,
  ...rest
}: SvgMapControlsProps) {
  const labels = resolveLabels(DEFAULT_SVG_MAP_CONTROLS_LABELS, labelsProp);
  const act = (enabled: boolean, run: () => void) => () => {
    if (enabled) run();
  };

  return (
    <div
      aria-label={labels.group}
      {...rest}
      className={cx('opale-svg-map-controls', className)}
      role="group"
    >
      <IconActionButton
        icon="zoom-in"
        label={labels.zoomIn}
        size="small"
        liquidGlass={liquidGlass}
        aria-disabled={viewport.canZoomIn ? undefined : true}
        onClick={act(viewport.canZoomIn, () => viewport.zoomBy(step, undefined, { animate: true }))}
      />
      <IconActionButton
        icon="zoom-out"
        label={labels.zoomOut}
        size="small"
        liquidGlass={liquidGlass}
        aria-disabled={viewport.zoomed ? undefined : true}
        onClick={act(viewport.zoomed, () =>
          viewport.zoomBy(1 / step, undefined, { animate: true }),
        )}
      />
      <IconActionButton
        icon="home"
        label={labels.reset}
        size="small"
        liquidGlass={liquidGlass}
        aria-disabled={viewport.zoomed ? undefined : true}
        onClick={act(viewport.zoomed, () => viewport.reset())}
      />
    </div>
  );
}

/** @deprecated Depuis 3.6 — métadonnée de la vitrine, sans remplaçant public. */
export type CatalogEntry = ShowcaseCatalogEntry;

/** @deprecated Depuis 3.6 — métadonnée de la vitrine, sans remplaçant public. */
export const OPALE_CATALOG: readonly CatalogEntry[] = CATALOG;

/* LE NAMESPACE `Opale` : chaque composant du paquet sous un seul nom. Les
   exports nommés (`import { Button } from '@thomascaron/opale-ui'`) restent la
   forme recommandée ; `Opale.Button` désigne le même composant. */
const COMPONENTS = {
  Button: Button,
  Pressable: Pressable,
  Card: Card,
  CardGrid: CardGrid,
  Input: Input,
  SearchBar: SearchBar,
  PageScaffold: PageScaffold,
  InlineInput: InlineInput,
  Checkbox: Checkbox,
  Toggle: Toggle,
  Slider: Slider,
  Select: Select,
  MultiSelect: MultiSelect,
  Autocomplete: Autocomplete,
  Form: Form,
  SegmentedControl: SegmentedControl,
  IconActionButton: IconActionButton,
  DataTable: DataTable,
  DescriptionList: DescriptionList,
  BulletList: BulletList,
  Badge: Badge,
  Rating: Rating,
  RatingInput: RatingInput,
  Pagination: Pagination,
  Skeleton: Skeleton,
  StatCard: StatCard,
  Donut: Donut,
  LegalLinks: LegalLinks,
  Heading: Heading,
  Text: Text,
  Icon: Icon,
  Feedback: Feedback,
  Toast: Toast,
  Spinner: Spinner,
  ProgressBar: ProgressBar,
  ConfirmDialog: ConfirmDialog,
  EmptyState: EmptyState,
  Navbar: Navbar,
  Menu: Menu,
  Link: Link,
  SidePanel: SidePanel,
  CommandPalette: CommandPalette,
  Breadcrumb: Breadcrumb,
  CookieBanner: CookieBanner,
  SelectionBar: SelectionBar,
  Stack: Stack,
  Layout: Layout,
  Divider: Divider,
  BackgroundSurface: BackgroundSurface,
  FileCard: FileCard,
  Dropzone: Dropzone,
  Lightbox: Lightbox,
  Clipboard: Clipboard,
  SvgMap: SvgMap,
  SvgMapControls: SvgMapControls,
  Modal: Modal,
  Tabs: Tabs,
  Sidebar: Sidebar,
  Topbar: Topbar,
  SiteNav: SiteNav,
  ToastProvider: ToastProvider,
} as const;

/** Tous les composants d'Opale sous un seul nom : `Opale.Button` est `Button`. */
export const Opale = {
  ...COMPONENTS,
  /** @deprecated Depuis 3.6 — utilisez `BackgroundSurface`. */
  Background: BackgroundSurface,
} as const;

/** @deprecated Depuis 3.6 — utilisez les exports nommés. */
export const OpaleUI = Opale;
