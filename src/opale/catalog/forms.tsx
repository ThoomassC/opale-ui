/* Les composants de saisie et d'action du catalogue. */

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import Glass from '../components/glass/Glass';
import SearchBar from '../components/search-bar/SearchBar';
import { IconGlyph, type OpaleIconName } from '../components/icon';
import type { OpaleSize } from '../shared';
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
    <div className={clsx('opale-field', className)}>
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
          className={clsx('opale-input-shell', liquidGlass && 'opale-input-shell--glass')}
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
          className={clsx('opale-field__helper', Boolean(error) && 'opale-field__helper--error')}
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
    <label className={clsx('opale-checkbox-row', className)}>
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
    <label className={clsx('opale-toggle-row', className)}>
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
    <div className={clsx('opale-field', className)}>
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
          className={clsx('opale-field__helper', Boolean(error) && 'opale-field__helper--error')}
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

      {/* LE MATÉRIAU EST CELUI DE TOUT LE MONDE, ENFIN.

          Cette liste posait `.opale-liquid`, l'ancienne imitation en lavis
          laiteux d'avant la réécriture du verre : sur une même page, une liste
          multiple et un select rendaient deux verres différents. `FieldShell`
          est la coquille des champs ; elle bascule sur `Glass` quand on le
          demande et rend un simple `<span>` sinon, donc le balisage et les
          attributs ARIA de la liste ne changent pas d'un état à l'autre. */}
      <FieldShell
        liquidGlass={liquidGlass}
        className={clsx('opale-multiselect', liquidGlass && 'opale-multiselect--glass')}
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
          className={clsx('opale-field__helper', Boolean(error) && 'opale-field__helper--error')}
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
      className={clsx('opale-segmented', liquidGlass && 'opale-segmented--glass', className)}
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
  return <form className={clsx('opale-stack', 'opale-stack--column', className)} {...props} />;
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
      className={clsx('opale-icon-action-button', className)}
      aria-label={label}
    >
      <IconGlyph name={icon} className="opale-icon__glyph" />
    </Button>
  );
}
