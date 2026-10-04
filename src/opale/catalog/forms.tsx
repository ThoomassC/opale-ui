/* Les composants de saisie et d'action du catalogue. */

import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type AriaRole,
  type ComponentPropsWithRef,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type OptionHTMLAttributes,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import Glass from '../components/glass/Glass';
import SearchBar from '../components/search-bar/SearchBar';
import { IconGlyph, type OpaleIconName } from '../components/icon';
import type { OpaleSize } from '../shared';
import { warnDeprecatedProps, warnIfUnnamed } from '../deprecations';
import { resolveLabels } from '../shared/labels';
import { mergeRefs } from '../shared/merge-refs';
import { useControllableState, useOptionalState } from '../shared/use-controllable-state';
import { FieldShell, FieldError } from './shells';

/** Le rôle visuel d'un bouton. */
export type ButtonVariant =
  'primary' | 'secondary' | 'accent' | 'danger' | 'tonal' | 'ghost' | 'text';

/** Un choix proposé par une liste : sa valeur de formulaire et son libellé. */
export interface SelectOption {
  value: string;
  label: ReactNode;
  /**
   * Rend le choix visible mais impossible à retenir. Honoré par `Select`
   * (`<option disabled>`), `MultiSelect` (`aria-disabled`, la bascule est
   * refusée) et `SegmentedControl` (`<button disabled>`). Défaut : `false`.
   */
  disabled?: boolean;
}

/* =============================================================================
   LA TAILLE D'UN CHAMP PASSE PAR LE JETON DE HAUTEUR, PAS PAR UNE RÈGLE NEUVE.

   La coquille d'un champ (`.opale-input-shell`) tient sa hauteur de
   `--opale-control-md`, comme le bouton moyen. Redéfinir ce jeton sur
   l'enveloppe, et sur elle seule, fait prendre au champ la hauteur du bouton
   `small` ou `large` voisin — y compris sous le cran « au doigt » qui fait
   grandir toute l'échelle, puisque la valeur empruntée est elle-même un jeton.
   `medium` ne pose rien : le balisage par défaut est celui de la 2.9.

   La classe `opale-field--<taille>` accompagne le jeton, pour le reste du
   réglage (corps de texte, marges) et pour l'appelant qui veut s'y accrocher.
   ========================================================================== */
const CONTROL_HEIGHT_TOKEN: Readonly<Record<OpaleSize, string | undefined>> = {
  small: 'var(--opale-control-sm)',
  medium: undefined,
  large: 'var(--opale-control-lg)',
};

function isOpaleSize(size: unknown): size is OpaleSize {
  return size === 'small' || size === 'medium' || size === 'large';
}

/** La classe de taille d'un bloc, absente pour `medium` comme pour une valeur inconnue. */
function sizeModifier(block: string, size: unknown): string | false {
  return isOpaleSize(size) && size !== 'medium' && `${block}--${size}`;
}

/** Le jeton de hauteur redéfini sur l'enveloppe d'un champ, ou rien pour `medium`. */
function fieldSizeStyle(size: unknown): CSSProperties | undefined {
  const height = isOpaleSize(size) ? CONTROL_HEIGHT_TOKEN[size] : undefined;
  return height ? ({ '--opale-control-md': height } as CSSProperties) : undefined;
}

/* =============================================================================
   LA DESCRIPTION D'UN CHAMP SE FUSIONNE, ELLE NE SE REMPLACE PAS.

   Chaque champ posait son `aria-describedby` — vers l'aide ou l'erreur — puis
   étalait les props de l'appelant par-dessus. Un appelant qui reliait un texte
   d'aide externe (compteur, consigne, react-hook-form) EFFAÇAIT donc le lien
   vers le message d'erreur : l'erreur s'affichait et n'était plus annoncée à
   la prise de focus (WCAG 1.3.1, 3.3.1). Les identifiants de l'appelant
   passent d'abord, puis l'aide, puis l'erreur ; les doublons tombent.
   ========================================================================== */
function mergeIds(...ids: ReadonlyArray<string | false | null | undefined>): string | undefined {
  const unique = new Set(ids.flatMap((id) => (id ? id.split(/\s+/).filter(Boolean) : [])));
  return unique.size > 0 ? [...unique].join(' ') : undefined;
}

/** Un `ReactNode` qui rend quelque chose : ni absent, ni `false`, ni chaîne vide. */
function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

/* Les gestionnaires qu'un bouton `disabled` natif ne recevait jamais : ceux-là
   seuls se taisent pendant `loading`. Le focus et sa perte restent vécus. */
const BUSY_SILENCED_HANDLER =
  /^on(?:Click|DoubleClick|AuxClick|Pointer(?:Down|Up)|Mouse(?:Down|Up)|Key(?:Down|Up|Press))(?:Capture)?$/;

function withoutActivationHandlers<T extends object>(props: T): T {
  const kept = { ...props };
  for (const key of Object.keys(kept)) {
    if (BUSY_SILENCED_HANDLER.test(key)) Reflect.deleteProperty(kept, key);
  }
  return kept;
}

/** Les textes d'un bouton. */
export interface ButtonLabels {
  /**
   * La description du bouton pendant `loading` — son nom, lui, ne change pas.
   * Défaut : « Chargement en cours ».
   */
  loading: string;
}

const DEFAULT_BUTTON_LABELS: ButtonLabels = {
  loading: 'Chargement en cours',
};

export interface ButtonProps extends ComponentPropsWithRef<'button'> {
  /**
   * Le type natif. Défaut : `button`, et non `submit` comme en HTML : un
   * bouton d'Opale ne soumet un formulaire que si on le demande
   * (`type="submit"`).
   */
  type?: 'button' | 'submit' | 'reset';
  /**
   * Le rôle visuel du bouton : `primary` pour l'action principale, `danger` pour une action
   * destructive, `ghost` ou `text` pour une action discrète. Défaut : `primary`.
   */
  variant?: ButtonVariant;
  /** La hauteur du bouton, partagée avec les champs de même taille. Défaut : `medium`. */
  size?: OpaleSize;
  /**
   * Bloque l'action et affiche une progression. Le bouton reste FOCALISABLE :
   * il porte `aria-disabled="true"` et `aria-busy="true"` au lieu de
   * `disabled`, ignore les clics et ne soumet pas son formulaire. Son nom ne
   * change pas : `labels.loading` le DÉCRIT (`aria-describedby`). Comme sous
   * `disabled`, ni les gestionnaires d'appui de l'appelant (clic, pointeur,
   * souris, clavier) ni ceux de ses parents ne voient l'activation ; le focus
   * et sa perte, eux, restent vécus.
   */
  loading?: boolean;
  /** Une icône décorative avant le libellé. Ignorée sous verre. */
  startIcon?: ReactNode;
  /** Une icône décorative après le libellé. Ignorée sous verre. */
  endIcon?: ReactNode;
  /** Étire le bouton sur toute la largeur de son conteneur. Défaut : `false`. Ignoré sous verre. */
  fullWidth?: boolean;
  /**
   * Rend le bouton sur le matériau « verre liquide ». L'encre du verre est
   * BLANCHE par défaut : elle suppose une photographie voilée derrière. Sur
   * une page claire unie, posez `data-opale-glass-ink="page"` sur la racine
   * (voir l'en-tête « LE VERRE POSÉ SUR LA PAGE » d'`opale.css`).
   */
  liquidGlass?: boolean;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<ButtonLabels>;
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
   mal. Le catalogue dépend donc de `Glass` : c'est le prix d'un composant
   unique, et il est moins cher que le doublon.
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
    labels: labelsProp,
    className,
    children,
    disabled,
    type = 'button',
    onClick,
    'aria-busy': ariaBusy,
    'aria-disabled': ariaDisabled,
    'aria-describedby': ariaDescribedBy,
    ...callerProps
  },
  ref,
) {
  const labels = resolveLabels(DEFAULT_BUTTON_LABELS, labelsProp);
  const loadingId = useId();
  /* LE CHARGEMENT NE DÉSACTIVE PLUS LE BOUTON, ET C'EST LA CORRECTION (ACC-09).

     `disabled` pendant `loading` faisait tomber le focus sur `<body>` dès que
     le bouton focalisé passait en attente — le cas le plus courant : Entrée
     sur « Enregistrer ». Le lecteur d'écran ne savait plus où il était, et
     rien n'annonçait l'attente.

     Le bouton garde donc le focus et devient INACTIF sans être désactivé :
     `aria-disabled` le dit, `aria-busy` dit pourquoi, et le clic est annulé.
     Annuler le clic suffit à bloquer le formulaire : la soumission implicite
     (Entrée dans un champ) passe elle aussi par un clic synthétique sur le
     bouton par défaut, et `preventDefault` l'arrête au même endroit.

     Un `disabled` explicite garde son sens natif : l'appelant qui désactive
     vraiment le bouton l'obtient, chargement ou non.

     CE QUE `disabled` TAISAIT SE TAIT ENCORE. Un bouton natif désactivé
     n'émettait aucun clic : ni `onClick`, ni `<Card onClick>` autour, ni les
     `onMouseDown`, `onKeyDown`, `onClickCapture` de l'appelant. Pendant
     l'attente, ces gestionnaires ne sont pas transmis, et le clic — comme
     Entrée ou Espace, qui l'engendrent — ne remonte plus aux parents. Les
     autres touches remontent : Échap doit encore fermer la modale. */
  const busy = loading && !disabled;
  const props = busy ? withoutActivationHandlers(callerProps) : callerProps;
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (busy) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };
  const handleBusyKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
  };
  const stateProps = {
    'aria-busy': busy ? true : ariaBusy,
    'aria-disabled': busy ? true : ariaDisabled,
    'aria-describedby': mergeIds(ariaDescribedBy, loading ? loadingId : null),
    ...(busy ? { onKeyDown: handleBusyKeyDown, onKeyUp: handleBusyKeyDown } : {}),
  } as const;

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
      {/* L'ATTENTE EST DÉCRITE, PAS NOMMÉE, parce que le témoin est décoratif
          et qu'un nom qui change casse qui le cherche : `getByRole('button',
          { name: 'Enregistrer' })`, la commande vocale « cliquer Enregistrer ».
          `hidden` retire le texte du nom calculé à partir du contenu ; une
          description désignée par `aria-describedby` se lit quand même. */}
      {loading && (
        <span id={loadingId} hidden>
          {labels.loading}
        </span>
      )}
      {!loading && endIcon}
    </>
  );

  const classes = clsx(
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
        rootClassName={clsx('opale-button--glass-root', fullWidth && 'opale-button--full')}
        enableLiquidAnimation={!busy}
        disabled={disabled}
        type={type}
        {...props}
        {...stateProps}
        onClick={handleClick}
      >
        {content}
      </Glass>
    );
  }

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled}
      type={type}
      {...props}
      {...stateProps}
      onClick={handleClick}
    >
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

/**
 * Les props de `Input`.
 *
 * DEUX DESTINATIONS, ET C'EST VOULU (DX-03). `className` va à l'ENVELOPPE —
 * `.opale-field`, qui porte libellé, aide et erreur.
 * Tout le reste — `id`, `name`, `style`, `ref`, `aria-*`, `data-*`, les
 * gestionnaires — va à l'`<input>` natif :
 * un formulaire, un test ou une bibliothèque de formulaires vise ainsi le
 * vrai contrôle.
 *
 * Depuis 2.10, `controlClassName` habille le contrôle lui-même — l'`<input>`
 * natif, à côté de `.opale-input` (ou de `.opale-search-bar__input` avec
 * `type="search"`).
 *
 * L'ATTRIBUT NATIF `size` N'EST PAS PRIS EN CHARGE, et ne l'a jamais été : il
 * était déjà retiré du type. `size` est l'échelle d'Opale (voir la prop).
 */
export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size'> {
  /** Va à l'enveloppe, pas au contrôle natif. Voir `InputProps`. */
  className?: string;
  /** Va au contrôle natif, à côté de sa classe d'Opale. Voir `InputProps`. */
  controlClassName?: string;
  /**
   * La hauteur du champ, alignée sur celle du `Button` de même taille :
   * `small`, `medium` ou `large`. Défaut : `medium`. Ce n'est PAS l'attribut
   * natif `size` (une largeur en caractères), qui n'est pas pris en charge.
   */
  size?: OpaleSize;
  /**
   * Le libellé visible, relié au champ par un `<label>`. Sans libellé, nommez le champ par
   * `aria-label`.
   */
  label?: ReactNode;
  /**
   * L'aide sous le champ, reliée par `aria-describedby`. Remplacée par `error` quand elle est
   * présente.
   */
  helperText?: ReactNode;
  /**
   * L'erreur, annoncée et décrite à la place de l'aide ; rend le champ invalide (`aria-invalid`).
   */
  error?: ReactNode;
  /** Une icône décorative en tête du champ. */
  icon?: ReactNode;
  /** Rend le composant dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /** Avec `type="search"`, pose le repère `search` autour du champ. Défaut : `true`. */
  searchLandmark?: boolean;
  /** Avec `type="search"`, le nom du repère `search`. */
  searchLandmarkLabel?: string;
}

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
    controlClassName,
    size = 'medium',
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error || helperText;
  /* L'erreur l'emporte sur un `aria-invalid={false}` passé par un formulaire :
     le message affiché et l'état annoncé ne doivent pas se contredire. */
  const invalid = error ? true : ariaInvalid;
  const described = mergeIds(ariaDescribedBy, message ? messageId : undefined);

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
    <div
      className={clsx('opale-field', sizeModifier('opale-field', size), className)}
      style={fieldSizeStyle(size)}
    >
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
          className={controlClassName}
          size={isOpaleSize(size) ? size : undefined}
          icon={icon}
          liquidGlass={liquidGlass}
          landmark={searchLandmark}
          landmarkLabel={searchLandmarkLabel}
          aria-invalid={invalid}
          aria-describedby={described}
        />
      ) : (
        <FieldShell
          liquidGlass={liquidGlass}
          className={clsx('opale-input-shell', liquidGlass && 'opale-input-shell--glass')}
          rootClassName="opale-input--glass-root"
        >
          {icon}
          <input
            ref={ref}
            id={inputId}
            className={clsx('opale-input', controlClassName)}
            {...props}
            aria-invalid={invalid}
            aria-describedby={described}
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
          className={clsx('opale-field__helper', Boolean(error) && 'opale-field__helper--error')}
        >
          {message}
        </span>
      )}
    </div>
  );
});
Input.displayName = 'Input';

/**
 * Les props de `Checkbox`.
 *
 * DEUX DESTINATIONS, ET C'EST VOULU (DX-03). `className` va à l'ENVELOPPE —
 * le `<label class="opale-checkbox-row">`, case et libellé.
 * Tout le reste — `id`, `name`, `style`, `ref`, `aria-*`, `data-*`, les
 * gestionnaires — va à l'`<input type="checkbox">` natif :
 * un formulaire, un test ou une bibliothèque de formulaires vise ainsi le
 * vrai contrôle.
 * L'erreur, elle, est rendue en frère de cette rangée, hors de l'enveloppe.
 *
 * Depuis 2.10, `controlClassName` va à l'`<input type="checkbox">` natif, à
 * côté de `.opale-checkbox`. Ce natif est INVISIBLE — il couvre la rangée et
 * reçoit le clic : pour peindre la case, ciblez `.opale-checkbox-mark` depuis
 * la classe de l'enveloppe, ou `.ma-classe:checked + * .opale-checkbox-mark`
 * depuis `controlClassName`.
 */
export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  /** Va à l'enveloppe, pas au contrôle natif. Voir `CheckboxProps`. */
  className?: string;
  /** Va au contrôle natif, invisible, à côté de `.opale-checkbox`. Voir `CheckboxProps`. */
  controlClassName?: string;
  /**
   * La taille de la case : `small`, `medium` ou `large`. Défaut : `medium`.
   * Pose `opale-checkbox-row--<taille>` sur la rangée. L'attribut natif `size`
   * n'a aucun effet sur une case et n'est pas transmis ; un nombre, accepté en
   * 2.9 par le type natif, reste accepté et ignoré.
   */
  size?: OpaleSize | number;
  /** Le libellé cliquable de la case, qui la nomme. */
  label?: ReactNode;
  /** Le texte sous le libellé, relié à la case par `aria-describedby`. */
  description?: ReactNode;
  /**
   * L'erreur, annoncée et décrite après la description ; rend la case invalide.
   *
   * Le message est rendu en FRÈRE de la rangée, sans conteneur commun : dans
   * une grille ou un flex parent, la case et son erreur occupent deux cellules.
   * C'est le balisage de toute la 2.x et il ne change pas en correctif — un
   * conteneur déplacerait les sélecteurs et la mise en page des intégrations
   * existantes. Pour tenir les deux dans une cellule, enveloppez la case.
   */
  error?: ReactNode;
  /**
   * L'état « mixte » d'une case parente (« tout sélectionner » quand une
   * partie seulement l'est). Posé sur la propriété native `indeterminate`,
   * que le navigateur expose comme `aria-checked="mixed"`. Il n'existe pas en
   * attribut HTML : c'est la prop qui le rétablit à chaque rendu, un clic
   * l'effaçant côté navigateur.
   *
   * Absente, la case ne touche pas à la propriété : un état posé par la `ref`
   * (`ref.current.indeterminate = true`, la seule voie avant la 2.9.3) tient.
   */
  indeterminate?: boolean;
  /** Rend le composant dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

export function Checkbox({
  label,
  description,
  error,
  indeterminate,
  liquidGlass = false,
  className,
  controlClassName,
  size = 'medium',
  onChange,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: CheckboxProps) {
  const labelId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const describedBy = mergeIds(
    ariaDescribedBy,
    label && description ? descriptionId : null,
    error ? errorId : null,
  );
  /* `aria-labelledby` NE DÉSIGNE QUE CE QUI EXISTE, ET NE PASSE JAMAIS DEVANT
     L'APPELANT. Il était posé sans condition : sans `label` ni `description`,
     il pointait vers un `<span>` VIDE, et l'emportait sur `aria-label` dans le
     calcul du nom. `<Checkbox aria-label="Sélectionner la ligne" />` — la case
     d'une ligne de tableau — n'avait aucun nom. Un `aria-labelledby` de
     l'appelant gagne toujours ; un `aria-label` de l'appelant n'est plus
     recouvert par le libellé. */
  const labelledBy =
    ariaLabelledBy ??
    (ariaLabel === undefined && hasContent(label ?? description) ? labelId : undefined);

  /* `indeterminate` N'EST QU'UNE PROPRIÉTÉ DU DOM : aucun attribut ne la
     porte, donc elle s'écrit sur le natif, après chaque rendu. L'écrire à
     chaque fois, et pas seulement quand la prop change, rétablit l'état
     après un clic — le navigateur l'efface en cochant.

     MAIS SEULEMENT QUAND LA PROP EST LÀ. Avant la 2.9.3, la `ref` était le
     seul moyen de poser l'état mixte : une valeur par défaut `false`, écrite
     à chaque rendu, l'effaçait au premier rendu du parent. Sans la prop, la
     propriété appartient à l'appelant ; on ne l'efface qu'une fois, quand la
     prop disparaît après avoir été posée. */
  const inputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useCallback(
    (node: HTMLInputElement | null) => mergeRefs(inputRef, ref)(node),
    [ref],
  );
  const indeterminateSet = useRef(false);
  useLayoutEffect(() => {
    const input = inputRef.current;
    const wasSet = indeterminateSet.current;
    indeterminateSet.current = indeterminate !== undefined;
    if (!input) return;
    if (indeterminate !== undefined) input.indeterminate = indeterminate;
    else if (wasSet) input.indeterminate = false;
  });

  /* L'ÉTAT N'A PLUS BESOIN D'ÊTRE RECOPIÉ EN JAVASCRIPT.

     La version précédente tenait un état miroir (`useMirrorState`) pour dire à
     la case tierce si elle devait se peindre cochée. La coche est désormais la
     nôtre : `.opale-checkbox:checked + * .opale-checkbox-mark` la peint depuis
     le CSS, à partir de l'état réel du natif. Un état dérivé de moins, c'est
     une occasion de désynchronisation de moins — et `onChange` redevient un
     simple passe-plat. */
  const row = (
    <label
      className={clsx('opale-checkbox-row', sizeModifier('opale-checkbox-row', size), className)}
    >
      {/* LA DESCRIPTION EST DÉCRITE, PLUS NOMMÉE. Rendue dans le `<label>`,
          elle entrait dans le nom de la case : « Recevoir les notifications
          Les nouveautés du design system ». Le nom d'une case doit être ce
          qu'on coche, et le reste une description (WCAG 1.3.1). */}
      <input
        type="checkbox"
        className={clsx('opale-checkbox', controlClassName)}
        /* `aria-labelledby` DÉSIGNE LE SEUL LIBELLÉ, et il faut cette précision.
           Ajouter `aria-describedby` ne suffisait pas : la rangée EST un
           `<label>`, donc tout ce qu'elle contient — description comprise —
           entre dans le nom calculé. Nommer explicitement le prend de vitesse,
           et la rangée reste cliquable sur toute sa surface, ce qui est le
           point de la construire ainsi. */
        onChange={onChange}
        {...props}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-invalid={error ? true : ariaInvalid}
        ref={inputRefs}
      />
      {/* LA COCHE EST UNE DÉCORATION, sous verre comme sans. La vraie case est
          l'`<input>` natif, invisible et posé sur toute la rangée ; c'est le
          `<label>` qui reçoit le clic. */}
      <FieldShell
        liquidGlass={liquidGlass}
        className={clsx('opale-checkbox-mark', liquidGlass && 'opale-checkbox-mark--glass')}
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

/**
 * Les props de `Toggle`.
 *
 * DEUX DESTINATIONS, ET C'EST VOULU (DX-03). `className` va à l'ENVELOPPE —
 * le `<label class="opale-toggle-row">`, interrupteur et libellé.
 * Tout le reste — `id`, `name`, `style`, `ref`, `aria-*`, `data-*`, les
 * gestionnaires — va à l'`<input type="checkbox">` natif :
 * un formulaire, un test ou une bibliothèque de formulaires vise ainsi le
 * vrai contrôle.
 * L'erreur, elle, est rendue en frère de cette rangée, hors de l'enveloppe.
 *
 * Depuis 2.10, `controlClassName` va à l'`<input type="checkbox">` natif, à
 * côté de `.opale-toggle`. Ce natif est INVISIBLE : pour peindre la piste,
 * ciblez `.opale-toggle-track` depuis la classe de l'enveloppe.
 */
export interface ToggleProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'size'> {
  /** Va à l'enveloppe, pas au contrôle natif. Voir `ToggleProps`. */
  className?: string;
  /** Va au contrôle natif, invisible, à côté de `.opale-toggle`. Voir `ToggleProps`. */
  controlClassName?: string;
  /**
   * La taille de l'interrupteur : `small`, `medium` ou `large`. Défaut :
   * `medium`. Pose `opale-toggle-row--<taille>` sur la rangée. L'attribut
   * natif `size` n'a aucun effet sur une case et n'est pas transmis ; un
   * nombre, accepté en 2.9 par le type natif, reste accepté et ignoré.
   */
  size?: OpaleSize | number;
  /** Le libellé cliquable de l'interrupteur, qui le nomme. */
  label?: ReactNode;
  /**
   * L'erreur, annoncée et décrite ; rend l'interrupteur invalide. Rendue en
   * frère de la rangée, comme celle de `Checkbox` : voir sa documentation.
   */
  error?: ReactNode;
  /** Rend le composant dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /**
   * Le rôle exposé à la technologie d'assistance. `"switch"` est recommandé :
   * l'interrupteur s'annonce alors « activé / désactivé » plutôt que
   * « coché / non coché », sans changer son état natif (`checked`). Absent,
   * l'élément reste une case à cocher, comme en 2.x.
   *
   * La 3.0.0 posera `role="switch"` par défaut.
   */
  role?: AriaRole;
}

export function Toggle({
  label,
  error,
  liquidGlass = false,
  className,
  controlClassName,
  size = 'medium',
  onChange,
  ref,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: ToggleProps) {
  const errorId = useId();
  /* LE NOM SE LIT DANS LE DOM, UNE FOIS MONTÉ : un `<label for>` posé hors du
     composant nomme l'interrupteur sans qu'aucune prop ne le dise. */
  const inputRef = useRef<HTMLInputElement>(null);
  const inputRefs = useCallback(
    (node: HTMLInputElement | null) => mergeRefs(inputRef, ref)(node),
    [ref],
  );
  useEffect(() => {
    if (inputRef.current) warnIfUnnamed('Toggle', inputRef.current);
  }, []);
  /* Même simplification que pour la case : la piste et sa poignée sont celles
     d'Opale, et `.opale-toggle:checked` les peint depuis le CSS. Le verre
     habille la piste sans se mêler de son état. */
  const row = (
    <label className={clsx('opale-toggle-row', sizeModifier('opale-toggle-row', size), className)}>
      <input
        type="checkbox"
        className={clsx('opale-toggle', controlClassName)}
        onChange={onChange}
        {...props}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={mergeIds(ariaDescribedBy, error ? errorId : undefined)}
        ref={inputRefs}
      />
      <FieldShell
        liquidGlass={liquidGlass}
        className={clsx('opale-toggle-track', liquidGlass && 'opale-toggle-track--glass')}
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

/**
 * Les props de `Slider`.
 *
 * DEUX DESTINATIONS, ET C'EST VOULU (DX-03). `className` va à l'ENVELOPPE —
 * `.opale-field`, qui porte libellé et valeur.
 * Tout le reste — `id`, `name`, `style`, `ref`, `aria-*`, `data-*`, les
 * gestionnaires — va à l'`<input type="range">` natif :
 * un formulaire, un test ou une bibliothèque de formulaires vise ainsi le
 * vrai contrôle.
 *
 * Depuis 2.10, `controlClassName` va à l'`<input type="range">` natif, à côté
 * de `.opale-range`.
 */
export interface SliderProps extends Omit<ComponentPropsWithRef<'input'>, 'type'> {
  /** Va à l'enveloppe, pas au contrôle natif. Voir `SliderProps`. */
  className?: string;
  /** Va au contrôle natif, à côté de `.opale-range`. Voir `SliderProps`. */
  controlClassName?: string;
  /** Le libellé visible du curseur, qui le nomme. */
  label?: ReactNode;
  /**
   * La valeur affichée à côté du libellé. Défaut : la valeur courante, suivie au glissement.
   * Visuelle seulement : voir `valueText` pour la technologie d'assistance.
   */
  valueLabel?: ReactNode;
  /** La valeur dite en mots, en `aria-valuetext` : « 3 sur 10 ». */
  valueText?: string;
  /** Dérive `aria-valuetext` de la valeur, à chaque déplacement. `valueText` gagne. */
  getValueText?: (value: number) => string;
  /** Rend le composant dans le matériau « verre liquide ». Défaut : `false`. */
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
  controlClassName,
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
  const valueRef = useRef<HTMLSpanElement>(null);
  const showValue = (input: HTMLInputElement) => {
    const display = valueRef.current;
    if (display && display.textContent !== input.value) display.textContent = input.value;
  };

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
    showValue(input);
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
    showValue(input);
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
      className={clsx('opale-range', controlClassName)}
      aria-valuetext={valueText}
      onChange={handleChange}
      {...props}
    />
  );

  return (
    <div className={clsx('opale-field', className)}>
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
          {valueLabel !== undefined || props.value !== undefined ? (
            <span>{valueLabel ?? props.value}</span>
          ) : (
            /* LIBRE, LE CURSEUR ÉCRIT SA VALEUR LUI-MÊME (DX-27). `props.value`
               est absent : l'en-tête restait vide et ne suivait pas le
               glissement. React ne rend AUCUN enfant ici, et c'est ce qui
               permet d'y écrire depuis le DOM sans conflit — comme la
               progression, la valeur suit le natif, qu'elle vienne d'un
               glissement, de `defaultValue` ou d'une ref de formulaire. */
            <span ref={valueRef} className="opale-range-value" />
          )}
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

/**
 * Les props de `Select`.
 *
 * DEUX DESTINATIONS, ET C'EST VOULU (DX-03). `className` va à l'ENVELOPPE —
 * `.opale-field`, qui porte libellé, aide et erreur.
 * Tout le reste — `id`, `name`, `style`, `ref`, `aria-*`, `data-*`, les
 * gestionnaires — va au `<select>` natif :
 * un formulaire, un test ou une bibliothèque de formulaires vise ainsi le
 * vrai contrôle.
 *
 * Depuis 2.10, `controlClassName` va au `<select>` natif, à côté de
 * `.opale-select`.
 */
export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'size'> {
  /** Va à l'enveloppe, pas au contrôle natif. Voir `SelectProps`. */
  className?: string;
  /** Va au contrôle natif, à côté de `.opale-select`. Voir `SelectProps`. */
  controlClassName?: string;
  /** Le libellé visible, relié à la liste par un `<label>`. */
  label?: ReactNode;
  /**
   * L'aide sous la liste, reliée par `aria-describedby`. Remplacée par `error` quand elle est
   * présente.
   */
  helperText?: ReactNode;
  /** L'erreur, annoncée et décrite à la place de l'aide ; rend le champ invalide. */
  error?: ReactNode;
  /** Les choix, rendus avant `children`. Un choix `disabled` reste lisible sans être retenu. */
  options?: readonly SelectOption[];
  /** Rend le composant dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /**
   * La hauteur du champ, alignée sur celle du `Button` de même taille :
   * `small`, `medium` ou `large`. Défaut : `medium`.
   *
   * UN NOMBRE GARDE SON SENS NATIF, comme en 2.9 : le nombre de rangées
   * visibles, qui fait du champ une liste ouverte. Il est conservé pour la
   * compatibilité ; pour une liste ouverte à choix multiple, préférez
   * `MultiSelect`.
   */
  size?: OpaleSize | number;
  /**
   * Appelée à chaque choix avec la valeur retenue, AVANT `onChange`, qui part
   * toujours. C'est `event.currentTarget.value` : avec `multiple`, la première
   * valeur cochée seulement — `MultiSelect` donne la sélection entière.
   */
  onValueChange?: (value: string, event: ChangeEvent<HTMLSelectElement>) => void;
  /**
   * Le texte de la première option, vide (`value=""`), qui dit qu'aucun choix
   * n'est encore fait. Sans `value` ni `defaultValue`, c'est elle qui est
   * sélectionnée au montage.
   *
   * Avec `required`, elle est `disabled` et `hidden` : on ne peut plus y
   * revenir, et le formulaire refuse l'envoi tant qu'un vrai choix n'est pas
   * fait (`validity.valueMissing`). Sans `required`, elle reste un choix — « aucun ».
   * Ignoré avec `multiple`.
   */
  placeholder?: string;
}

export function Select({
  label,
  helperText,
  error,
  options,
  liquidGlass = false,
  className,
  controlClassName,
  size = 'medium',
  onValueChange,
  placeholder,
  id,
  children,
  onChange,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  /* LA TAILLE D'OPALE ET L'ATTRIBUT NATIF NE SE CONFONDENT PAS : une chaîne
     règle la hauteur, un nombre part tel quel sur le `<select>`, comme avant. */
  const nativeSize = typeof size === 'number' ? size : undefined;
  const opaleSize = typeof size === 'number' ? 'medium' : size;
  /* LE PLACEHOLDER N'EST SÉLECTIONNÉ QUE SI PERSONNE D'AUTRE NE L'EST. Une
     option `disabled` en tête n'est pas choisie d'elle-même : le navigateur
     retient la première option ACTIVE. `defaultValue=""` la désigne donc
     explicitement, et seulement quand l'appelant n'a rien dit. */
  const showPlaceholder = placeholder !== undefined && !props.multiple;
  const placeholderDefault =
    showPlaceholder && props.value === undefined && props.defaultValue === undefined
      ? { defaultValue: '' }
      : {};
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(event.currentTarget.value, event);
    onChange?.(event);
  };

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
    <div
      className={clsx('opale-field', sizeModifier('opale-field', opaleSize), className)}
      style={fieldSizeStyle(opaleSize)}
    >
      {label && (
        <label className="opale-field__label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <FieldShell
        liquidGlass={liquidGlass}
        className={clsx('opale-input-shell', liquidGlass && 'opale-input-shell--glass')}
        rootClassName="opale-input--glass-root"
      >
        <select
          id={selectId}
          className={clsx('opale-select', controlClassName)}
          size={nativeSize}
          {...placeholderDefault}
          {...props}
          onChange={handleChange}
          aria-describedby={mergeIds(ariaDescribedBy, message ? helperId : undefined)}
          aria-invalid={error ? true : ariaInvalid}
        >
          {showPlaceholder && (
            <option value="" disabled={props.required} hidden={props.required}>
              {placeholder}
            </option>
          )}
          {options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
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
          className={clsx('opale-field__helper', Boolean(error) && 'opale-field__helper--error')}
        >
          {message}
        </span>
      )}
    </div>
  );
}

/* `MultiSelect` NE REPREND PAS LES AJOUTS 3.10 DE `Select`. Sa valeur est un
   tableau (`onValueChange` diffère), son contrôle visible n'est pas le natif
   (`controlClassName` n'aurait rien à habiller) et une liste ouverte n'a ni
   placeholder ni hauteur de champ. `size` y garde son type de la 2.9 : le
   nombre natif, posé sur le `<select>` porteur de valeur, caché. */
export interface MultiSelectProps extends Omit<
  SelectProps,
  'onValueChange' | 'placeholder' | 'controlClassName' | 'size'
> {
  /** L'attribut natif, posé sur le `<select>` caché : sans effet sur la liste visible. */
  size?: number;
  /**
   * La sélection. Présente, l'appelant la tient. Un tableau est la forme
   * attendue ; une valeur seule vaut une sélection d'un élément.
   */
  value?: SelectProps['value'];
  /** Appelée après chaque bascule, avec la sélection complète. `onChange` natif part aussi. */
  onValueChange?: (value: string[]) => void;
  /** @deprecated Depuis 2.6 — utilisez `value`. */
  values?: readonly string[];
  /**
   * Des `<option>` (éventuellement groupées dans des `<optgroup>`), ajoutées
   * après `options`, comme pour `Select`. Tout autre enfant est ignoré.
   */
  children?: ReactNode;
}

/* Une sélection multiple se lit toujours en tableau. Le type hérité du
   `<select>` natif admet aussi une chaîne ou un nombre : ils valent une
   sélection d'un élément. */
function toSelection(value: SelectProps['value']): readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'string' || typeof value === 'number') return [String(value)];
  return value;
}

type OptionElementProps = OptionHTMLAttributes<HTMLOptionElement> & { children?: ReactNode };
type OptgroupElementProps = { children?: ReactNode };

/* LES `<option>` EN ENFANTS DEVIENNENT DES OPTIONS. `MultiSelectProps` hérite
   de `children` par `SelectProps`, mais la liste visible ne lisait que
   `options` : `<MultiSelect><option /></MultiSelect>` ne rendait rien, alors
   que `Select` accepte ces enfants. */
function optionsFromChildren(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child): SelectOption[] => {
    if (!isValidElement(child)) return [];
    if (child.type === 'optgroup') {
      return optionsFromChildren((child.props as OptgroupElementProps).children);
    }
    if (child.type !== 'option') return [];
    const props = child.props as OptionElementProps;
    const text = typeof props.children === 'string' ? props.children : '';
    return [
      {
        value: String(props.value ?? text),
        label: props.children,
        ...(props.disabled ? { disabled: true } : {}),
      },
    ];
  });
}

/** La sélection que porte le natif, dans l'ordre des options. */
function readSelection(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions, (option) => option.value);
}

function sameSelection(one: readonly string[], other: readonly string[]): boolean {
  return one.length === other.length && one.every((value, index) => value === other[index]);
}

const NATIVE_SELECTED = Object.getOwnPropertyDescriptor(
  typeof HTMLOptionElement === 'undefined' ? {} : HTMLOptionElement.prototype,
  'selected',
);

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
 *
 * LE NATIF N'EST PLUS CONTRÔLÉ PAR REACT, IL EST ÉCRIT ET RELU.
 * Il recevait `value={[...current]}` : chaque rendu réimposait l'état interne.
 * Tout ce qui écrit le DOM sans passer par cet état — la réinitialisation d'un
 * `<form>`, `register`, `setValue` et `reset` de react-hook-form, qui posent
 * `option.selected` directement — laissait donc la liste visible figée, puis
 * voyait sa valeur écrasée au rendu suivant. Désormais la sélection est
 * ÉCRITE sur le natif quand elle change, et RELUE quand quelqu'un d'autre l'a
 * écrite : une écriture de `option.selected` est observée, et la
 * réinitialisation du formulaire aussi. En mode contrôlé, `value` reste seul
 * maître : une écriture extérieure est aussitôt ramenée à `value`.
 * ================================================================
 */
export function MultiSelect({
  value,
  onValueChange,
  values,
  label,
  helperText,
  error,
  options: optionsProp,
  liquidGlass = false,
  className,
  id,
  onChange,
  defaultValue,
  ref,
  children,
  disabled = false,
  required,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: MultiSelectProps) {
  warnDeprecatedProps('MultiSelect', { values });
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const labelId = `${fieldId}-label`;
  const helperId = `${fieldId}-helper`;
  const options = [...(optionsProp ?? []), ...optionsFromChildren(children)];
  const optionsKey = options.map((option) => option.value).join('\u0000');
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
  const [current, setCurrent, isControlled] = useControllableState<readonly string[]>(
    toSelection(value) ?? values,
    () => toSelection(defaultValue) ?? [],
  );
  /* La sélection de départ devient celle que `form.reset()` rétablit : React
     la pose en `defaultSelected` au montage d'un `<select>` non contrôlé. */
  const [initialSelection] = useState(() => [...current]);
  const selected = new Set(current);

  /* `activeIndex` est l'option DÉSIGNÉE au clavier, distincte des options
     COCHÉES : dans une `listbox` multi-sélection, on parcourt sans choisir et
     l'on choisit sans se déplacer. Les confondre obligerait à cocher tout ce
     qu'on survole en chemin. */
  const [activeIndex, setActiveIndex] = useState(0);

  /* Vrai pendant que le composant écrit lui-même le natif : ses propres
     écritures ne doivent pas se faire passer pour des écritures extérieures. */
  const writing = useRef(false);
  const pending = useRef(false);
  const reconcile = useRef<() => void>(() => undefined);

  const writeSelection = useCallback((select: HTMLSelectElement, next: readonly string[]) => {
    writing.current = true;
    for (const option of Array.from(select.options)) option.selected = next.includes(option.value);
    writing.current = false;
  }, []);

  /* Ce qui se fait quand le natif a été écrit du dehors : en mode contrôlé,
     `value` est réimposée ; sinon, l'état suit le DOM. Relu après chaque rendu
     pour voir la dernière sélection. */
  useLayoutEffect(() => {
    reconcile.current = () => {
      const select = selectRef.current;
      if (!select) return;
      if (isControlled) {
        writeSelection(select, current);
        return;
      }
      const next = readSelection(select);
      if (!sameSelection(next, current)) setCurrent(next);
    };
  });

  /* LE NATIF SUIT LA SÉLECTION, et seulement quand elle change — ou quand les
     options changent. Le réécrire à chaque rendu effacerait une écriture
     extérieure pas encore relue. */
  useLayoutEffect(() => {
    const select = selectRef.current;
    if (select) writeSelection(select, current);
  }, [current, optionsKey, writeSelection]);

  /* L'ÉCRITURE DIRECTE DE `option.selected` EST OBSERVÉE. Aucun événement ne
     part quand un script — react-hook-form, un test, un autre composant —
     coche une option du natif : l'accesseur est donc doublé sur chaque option,
     par instance, et prévient le composant avant de rendre la main au natif.
     Une microtâche regroupe les écritures d'une même boucle. */
  useLayoutEffect(() => {
    const select = selectRef.current;
    const native = NATIVE_SELECTED;
    if (!select || !native?.get || !native.set) return;
    const { get, set } = native;
    const observed = Array.from(select.options);
    for (const option of observed) {
      Object.defineProperty(option, 'selected', {
        configurable: true,
        get() {
          return get.call(this);
        },
        set(next: boolean) {
          set.call(this, next);
          if (writing.current || pending.current) return;
          pending.current = true;
          queueMicrotask(() => {
            pending.current = false;
            reconcile.current();
          });
        },
      });
    }
    return () => {
      for (const option of observed) Reflect.deleteProperty(option, 'selected');
    };
  }, [optionsKey]);

  /* LA RÉINITIALISATION DU FORMULAIRE EST RELUE. L'événement `reset` part
     AVANT que le navigateur ne rétablisse les options : la relecture attend
     donc la tâche suivante. */
  useEffect(() => {
    const form = selectRef.current?.form;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => reconcile.current(), 0);
    };
    form.addEventListener('reset', onReset);
    return () => {
      clearTimeout(timer);
      form.removeEventListener('reset', onReset);
    };
  }, []);

  const toggle = (optionValue: string) => {
    const select = selectRef.current;

    /* DÉSACTIVÉE, LA LISTE NE COCHE PLUS RIEN. `disabled` partait sur le
       natif caché : la liste visible restait cochable au clic comme au
       clavier, `onValueChange` partait, et le formulaire — qui n'envoie pas un
       champ désactivé — soumettait autre chose que ce qu'on voyait. */
    if (!select || disabled) return;
    /* UNE OPTION DÉSACTIVÉE SE LIT ET NE SE COCHE PAS, au clic comme au
       clavier : la bascule est refusée avant d'écrire le natif. */
    if (options.find((option) => option.value === optionValue)?.disabled) return;

    writing.current = true;
    for (const option of Array.from(select.options)) {
      if (option.value === optionValue) option.selected = !option.selected;
    }
    writing.current = false;

    /* `bubbles`, sans quoi React ne verra rien : son écouteur n'est pas posé
       sur le `<select>` mais à la racine de l'arbre. */
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const last = options.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => (index >= last ? 0 : index + 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => (index <= 0 ? last : index - 1));
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

  const message = error || helperText;
  /* LE NOM, LA DESCRIPTION ET LES ÉTATS VONT À LA LISTE VISIBLE. Étalés sur le
     natif caché (`aria-hidden`), `aria-label`, `aria-labelledby`,
     `aria-describedby`, `required` et `disabled` n'atteignaient jamais le
     contrôle réel : `<MultiSelect aria-label="Tags" />` rendait une liste sans
     nom. Le natif garde ce qui sert au formulaire — `name`, `form`,
     `required`, `disabled` —, la liste reçoit ce qui s'annonce. */
  const labelledBy =
    ariaLabelledBy ?? (ariaLabel === undefined && hasContent(label) ? labelId : undefined);

  return (
    <div className={clsx('opale-field', className)}>
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
        defaultValue={initialSelection}
        disabled={disabled}
        required={required}
        onChange={(event) => {
          const next = readSelection(event.currentTarget);
          setCurrent(next);
          onValueChange?.(next);
          onChange?.(event);
          /* En mode contrôlé, un appelant qui refuse la bascule doit retrouver
             sa valeur sur le natif : React ne rétablit plus un `<select>`
             qu'il ne contrôle pas. */
          if (isControlled) queueMicrotask(() => reconcile.current());
        }}
        aria-hidden="true"
        tabIndex={-1}
        /* `aria-label` reste AUSSI sur le natif, qui est la cible de la `ref`
           et des attributs de racine depuis 2.6 : caché de l'arbre
           d'accessibilité, il n'annonce rien, mais un appelant qui le lisait
           là continue de l'y trouver. */
        aria-label={ariaLabel}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {typeof option.label === 'string' ? option.label : option.value}
          </option>
        ))}
      </select>

      {/* LE MATÉRIAU EST CELUI DE TOUT LE MONDE, ENFIN.

          Cette liste posait `.opale-liquid`, l'ancienne imitation en lavis
          laiteux d'avant la réécriture du verre : sur une même page, une liste
          multiple et un select rendaient deux verres différents. `FieldShell`
          est la coquille des champs ; elle bascule sur `Glass` quand on le
          demande et rend un simple `<span>` sinon, donc le balisage et les
          attributs ARIA de la liste ne changent pas d'un état à l'autre. */}
      <FieldShell
        liquidGlass={liquidGlass}
        className={clsx(
          'opale-multiselect',
          liquidGlass && 'opale-multiselect--glass',
          disabled && 'opale-multiselect--disabled',
        )}
        rootClassName="opale-multiselect--glass-root"
      >
        <div
          className="opale-multiselect__list"
          role="listbox"
          aria-multiselectable="true"
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          /* `aria-activedescendant` NE DOIT PAS DÉSIGNER UN ÉLÉMENT ABSENT :
             sans option, la référence ne résout rien et la liste annonce un
             descendant actif qui n'existe pas. */
          aria-activedescendant={options.length ? `${fieldId}-option-${activeIndex}` : undefined}
          aria-describedby={mergeIds(ariaDescribedBy, message ? helperId : undefined)}
          aria-invalid={error ? true : ariaInvalid}
          aria-required={required ? true : undefined}
          aria-disabled={disabled ? true : undefined}
          tabIndex={disabled ? -1 : 0}
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
                aria-disabled={option.disabled ? true : undefined}
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
          className={clsx('opale-field__helper', Boolean(error) && 'opale-field__helper--error')}
        >
          {error || helperText}
        </span>
      )}
    </div>
  );
}

/**
 * Les props d'`Autocomplete` : celles d'`Input`, plus la liste des suggestions.
 *
 * CE N'EST PAS UN COMBOBOX APG. Le champ s'appuie sur les suggestions natives
 * du navigateur (`<datalist>` relié par `list`) : leur apparence, leur filtrage
 * et leur clavier appartiennent au navigateur et varient de l'un à l'autre, et
 * aucune option n'est annoncée par Opale (`aria-activedescendant`,
 * `aria-expanded`). La saisie reste libre : une valeur hors liste est acceptée.
 * Pour un choix fermé, prenez `Select` ; pour une liste filtrée et pilotée au
 * clavier, `CommandPalette`.
 */
export interface AutocompleteProps extends InputProps {
  /** Les suggestions natives (`<datalist>`), dédoublonnées. */
  options?: readonly string[];
}

/** Un champ de saisie libre, avec les suggestions natives du navigateur (`<datalist>`). */
export function Autocomplete({ options = [], ...props }: AutocompleteProps) {
  const listId = useId();
  return (
    <>
      <Input list={listId} {...props} />
      <datalist id={listId}>
        {/* UNE SUGGESTION NE S'AFFICHE QU'UNE FOIS (ROB-10). Des options venues
            d'une API sans dédoublonnage donnaient deux clés React identiques ;
            deux fois « Paris » dans la liste n'apporte rien à personne. */}
        {[...new Set(options)].map((option) => (
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
  /** Les options. Une option `disabled` rend un `<button disabled>`. */
  options: readonly SelectOption[];
  /**
   * L'option pressée. Présente, l'appelant la tient ; absente et sans
   * `defaultValue`, aucune.
   *
   * SANS L'UNE NI L'AUTRE, L'APPUI N'EST PAS RETENU — contrairement à `Tabs`.
   * Le clic appelle `onValueChange`, mais aucune option ne reste pressée tant
   * que le parent ne renvoie pas `value`. C'est le comportement de toute la
   * 2.x et il ne change pas avant la 3.0.0 ; en développement, un appui ainsi
   * perdu écrit un avertissement, une fois. Passez `defaultValue` pour un
   * groupe libre, `value` + `onValueChange` pour un groupe tenu.
   */
  value?: string;
  /** L'option pressée au montage quand `value` est absente. Seule elle fait retenir l'appui. */
  defaultValue?: string;
  /** Appelée à chaque appui, même sur l'option déjà pressée. */
  onValueChange?: (value: string) => void;
  /** @deprecated Depuis 2.6 — utilisez `onValueChange`. */
  onChange?: (value: string) => void;
  /** Va au groupe (`role="group"`). */
  className?: string;
  /** Va à chaque `<button>` d'option, à côté de `.opale-segmented__item`. */
  controlClassName?: string;
  /**
   * La taille du groupe : `small`, `medium` ou `large`. Défaut : `medium`.
   * Pose `opale-segmented--<taille>` sur le groupe.
   */
  size?: OpaleSize;
  /** Rend le composant dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

/* =============================================================================
   L'APPUI PERDU EST SIGNALÉ, PAS CORRIGÉ (DX-13).

   Sans `value` ni `defaultValue`, un clic prévient l'appelant et ne presse
   rien. Le corriger — retenir l'appui comme `Tabs` — changerait le rendu d'une
   intégration 2.x : c'est pour la 3.0.0. En attendant, le développeur est
   prévenu, et SEULEMENT quand l'appui est réellement perdu.

   « Ni `value` ni `defaultValue` au rendu » ne suffit pas à le dire : un
   parent qui tient la valeur peut partir de `undefined` — rien de pressé tant
   qu'on n'a pas choisi — et la renvoyer au premier appui. Ce cas est légitime
   et ne doit pas crier. La vérification attend donc la tâche suivante, après
   le rendu que l'appui a pu provoquer : si `value` est toujours absente,
   personne n'a retenu le clic.

   Une fois par chargement de page, en développement seulement — le même
   contrat que les avertissements de `deprecations.ts`, dont le test d'env est
   repris ici faute d'y être exporté.
   ========================================================================== */
declare const process: { readonly env: { readonly NODE_ENV?: string } };

function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

let lostSegmentedClickWarned = false;

const LOST_SEGMENTED_CLICK =
  '[Opale] SegmentedControl : sans `value` ni `defaultValue`, l’option cliquée ne reste pas ' +
  'pressée — passez `defaultValue` pour que le groupe s’en souvienne, ou `value` pour le tenir.';

/**
 * Le fond de la sélection est un élément UNIQUE qui glisse sous l'option
 * choisie, et non un fond qui s'allume sur un bouton pendant qu'il s'éteint sur
 * un autre — cette seconde forme ne laisse rien à animer, elle saute.
 *
 * Le raisonnement est celui de `Tabs.List` (voir l'en-tête de
 * `components/tabs/Tabs.tsx`), redit ici parce que ce fichier ne dépend
 * d'AUCUN composant de `components/**` et que c'est délibéré : le catalogue
 * se lit sans ouvrir le reste du dossier. Les trois points qui comptent :
 *  - `aria-pressed` reste la source de vérité, lue dans le DOM ;
 *  - l'indicateur est `aria-hidden`, il n'annonce rien que `aria-pressed` ne
 *    dise déjà ;
 *  - le premier placement ne s'anime pas, sinon l'indicateur traverserait le
 *    composant à chaque montage.
 *
 * `translate3d` avec les deux axes, et non le seul X : `.opale-segmented` est
 * en `flex-wrap: wrap`, donc les options passent à la ligne dès que la place
 * manque et l'indicateur doit descendre avec elles.
 *
 * Seul `transform` est transitionné : `width` et `height` sont posées d'un coup,
 * sans relancer la mise en page à chaque image ni déformer le rayon.
 */
export function SegmentedControl({
  options,
  value: valueProp,
  defaultValue,
  onValueChange,
  onChange,
  className,
  controlClassName,
  size = 'medium',
  liquidGlass = false,
  ref,
  ...rest
}: SegmentedControlProps) {
  warnDeprecatedProps('SegmentedControl', { onChange });
  const [value, setValue] = useOptionalState(valueProp, defaultValue);
  /* La dernière `value` reçue, relue par la vérification différée de l'appui. */
  const latestValue = useRef(valueProp);
  useLayoutEffect(() => {
    latestValue.current = valueProp;
  });
  const lostClickCheck = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(lostClickCheck.current), []);
  const watchLostClick = () => {
    if (lostSegmentedClickWarned || !isDevelopment()) return;
    if (valueProp !== undefined || defaultValue !== undefined) return;
    clearTimeout(lostClickCheck.current);
    lostClickCheck.current = setTimeout(() => {
      if (latestValue.current !== undefined || lostSegmentedClickWarned) return;
      lostSegmentedClickWarned = true;
      console.warn(LOST_SEGMENTED_CLICK);
    }, 0);
  };
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
  }, [options, value, liquidGlass, size]);

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
      className={clsx(
        'opale-segmented',
        sizeModifier('opale-segmented', size),
        liquidGlass && 'opale-segmented--glass',
        className,
      )}
      role="group"
    >
      <span ref={indicatorRef} aria-hidden="true" className="opale-segmented__indicator" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={clsx('opale-segmented__item', controlClassName)}
          aria-pressed={value === option.value}
          disabled={option.disabled}
          onClick={() => {
            watchLostClick();
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
  return <form className={clsx('opale-stack', 'opale-stack--column', className)} {...props} />;
}

/**
 * Les props d'`IconActionButton`, un `Button` réduit à son icône. Seul écart
 * avec `ButtonProps` : `variant` vaut `tonal` par défaut, et non `primary`.
 */
export interface IconActionButtonProps extends Omit<ButtonProps, 'children'> {
  /** Le glyphe du bouton, décoratif. Défaut : `more-horizontal`. */
  icon?: OpaleIconName;
  /**
   * Le nom accessible du bouton, posé en `aria-label`. Obligatoire : l'icône seule ne nomme rien.
   */
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
      className={clsx('opale-icon-action-button', className)}
      aria-label={label}
    >
      <IconGlyph name={icon} className="opale-icon__glyph" />
    </Button>
  );
}
