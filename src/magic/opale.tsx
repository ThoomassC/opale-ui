import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type CSSProperties,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

import Glass from './components/glass/Glass';
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
import { Modal } from './components/modal';

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

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'tonal' | 'ghost' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

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

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  liquidGlass?: boolean;
}

/* LA SURFACE PARTAGÉE REND LE VRAI VERRE, ELLE AUSSI.

   Elle posait `opale-liquid` : un lavis CSS — deux dégradés radiaux et un flou
   d'arrière-plan — qui IMITAIT le matériau. L'imitation se voyait dès qu'on
   comparait : la carte affichait du vrai verre sous le commutateur pendant que
   `StatCard`, bâtie sur cette même surface, gardait le lavis. Deux rendus du
   même « Liquid Glass » sur la même page.

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

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
  liquidGlass?: boolean;
}

/* =============================================================================
   UN SEUL BOUTON, ET `liquidGlass` CHOISIT SA MATIÈRE.

   IL Y EN AVAIT DEUX, ET C'EST CE QUI EST CORRIGÉ ICI. Le paquet exportait un
   `Button` vendoré — celui qui passe par `<Glass>`, avec ses filtres SVG de
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

   LE VERRE PORTE LA PALETTE D'OPALE, PAS CELLE DU COMPOSANT VENDORÉ.

   Une première version faisait correspondre les sept rôles Opale aux quatre
   teintes du vendoré — `danger` sur `negative`, `accent` sur `warning`. Elle
   s'est démentie toute seule le jour où le secondaire est passé de l'olive au
   bleu : sous verre il restait VERT, parce qu'il empruntait la teinte
   `positive` d'une autre palette. Une correspondance arbitraire ne survit pas
   au premier changement de marque.

   Le composant vendoré est donc rendu SANS variante, et la teinte vient d'une
   classe par rôle Opale, tirée des jetons. Basculer le commutateur ne change
   plus la couleur du bouton, seulement sa matière — ce qui était le propos.

   CE QUI SE PERD, ET IL FAUT LE SAVOIR : `loading`, `startIcon`, `endIcon` et
   `fullWidth` n'existent pas sur le composant vendoré. Ils sont ignorés sous
   verre, et c'est préférable à une seconde implémentation qui les simulerait
   mal. `opale.tsx` cesse par ailleurs d'être une feuille autonome : c'est le
   prix d'un composant unique, et il est moins cher que le doublon.
   ========================================================================== */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
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
  ) => {
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
  },
);
Button.displayName = 'Button';

export const Pressable = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
  <Button ref={ref} variant="text" {...props} />
));
Pressable.displayName = 'Pressable';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  elevation?: 0 | 1 | 2 | 3;
  liquidGlass?: boolean;
}

export function Card({
  title,
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
            {title && <h3 className="opale-card__title">{title}</h3>}
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
      <Glass className={classes} rootClassName="opale-card--glass-root" {...props}>
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

export function CardGrid({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('opale-card-grid', className)} {...props}>
      {children}
    </div>
  );
}

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  icon?: ReactNode;
  liquidGlass?: boolean;
}

export const Input = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, helperText, error, icon, liquidGlass = false, className, id, ...props }, ref) => {
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
  },
);
Input.displayName = 'Input';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
  liquidGlass?: boolean;
}

export function Checkbox({
  label,
  description,
  liquidGlass = false,
  className,
  onChange,
  ...props
}: CheckboxProps) {
  /* L'ÉTAT N'A PLUS BESOIN D'ÊTRE RECOPIÉ EN JAVASCRIPT.

     La version précédente tenait un état miroir (`useMirrorState`) pour dire à
     la case tierce si elle devait se peindre cochée. La coche est désormais la
     nôtre : `.opale-checkbox:checked + * .opale-checkbox-mark` la peint depuis
     le CSS, à partir de l'état réel du natif. Un état dérivé de moins, c'est
     une occasion de désynchronisation de moins — et `onChange` redevient un
     simple passe-plat. */
  return (
    <label className={cx('opale-checkbox-row', className)}>
      <input type="checkbox" className="opale-checkbox" onChange={onChange} {...props} />
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
      <span>{label ?? description}</span>
      {label && description && <small className="opale-field__helper">{description}</small>}
    </label>
  );
}

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  liquidGlass?: boolean;
}

export function Toggle({ label, liquidGlass = false, className, onChange, ...props }: ToggleProps) {
  /* Même simplification que pour la case : la piste et sa poignée sont celles
     d'Opale, et `.opale-toggle:checked` les peint depuis le CSS. Le verre
     habille la piste sans se mêler de son état. */
  return (
    <label className={cx('opale-toggle-row', className)}>
      <input type="checkbox" className="opale-toggle" onChange={onChange} {...props} />
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
}

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  valueLabel?: ReactNode;
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
  liquidGlass = false,
  className,
  onChange,
  ...props
}: SliderProps) {
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

    onChange?.(event);
  };

  /* LE NATIF EST ÉCRIT UNE FOIS ET POSÉ DANS LES DEUX BRANCHES. Les deux
     rendus n'ont pas la même charpente — sous verre il faut une piste fine et
     une bulle qui la dépasse —, mais le CONTRÔLE, lui, doit rester le même
     élément aux mêmes propriétés. L'extraire est ce qui empêche les deux
     branches de diverger sans qu'on le voie. */
  const control = (
    <input ref={inputRef} type="range" className="opale-range" onChange={handleChange} {...props} />
  );

  return (
    <label className={cx('opale-field', className)}>
      {(label || valueLabel) && (
        <span className="opale-card__header">
          <span className="opale-field__label">{label}</span>
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
    </label>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  helperText?: ReactNode;
  options?: readonly { value: string; label: ReactNode }[];
  liquidGlass?: boolean;
}

export function Select({
  label,
  helperText,
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
  return (
    <label className={cx('opale-field', className)} htmlFor={selectId}>
      {label && <span className="opale-field__label">{label}</span>}
      <FieldShell
        liquidGlass={liquidGlass}
        className={cx('opale-input-shell', liquidGlass && 'opale-input-shell--glass')}
        rootClassName="opale-input--glass-root"
      >
        <select id={selectId} className="opale-select" onChange={onChange} {...props}>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
      </FieldShell>
      {helperText && <span className="opale-field__helper">{helperText}</span>}
    </label>
  );
}

export interface MultiSelectProps extends SelectProps {
  values?: readonly string[];
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
  values,
  label,
  helperText,
  options = [],
  liquidGlass = false,
  className,
  id,
  onChange,
  ...props
}: MultiSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const labelId = `${fieldId}-label`;
  const selectRef = useRef<HTMLSelectElement>(null);
  const selected = new Set(values ?? []);

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
        ref={selectRef}
        id={fieldId}
        className="opale-visually-hidden"
        multiple
        value={values}
        onChange={onChange}
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
          aria-activedescendant={`${fieldId}-option-${activeIndex}`}
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

      {helperText && <span className="opale-field__helper">{helperText}</span>}
    </div>
  );
}

export interface AutocompleteProps extends FieldProps {
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

export function InlineInput(props: FieldProps) {
  return <Input {...props} />;
}

export interface SegmentedControlProps {
  options: readonly { value: string; label: ReactNode }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
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
export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const hasPlacedRef = useRef(false);

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

      if (!hasPlacedRef.current) {
        hasPlacedRef.current = true;
        /* Force le calcul de la mise en page : la position ci-dessus devient
           l'état de départ de la transition armée juste après. */
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
  }, [options, value]);

  return (
    <div ref={groupRef} className={cx('opale-segmented', className)} role="group">
      <span ref={indicatorRef} aria-hidden="true" className="opale-segmented__indicator" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="opale-segmented__item"
          aria-pressed={value === option.value}
          onClick={() => onChange?.(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Form({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form className={cx('opale-stack', 'opale-stack--column', className)} {...props} />;
}

export function LanguageSelector({
  value = 'FR',
  onChange,
  className,
  ariaLabel = 'Langue',
}: {
  value?: string;
  onChange?: SelectHTMLAttributes<HTMLSelectElement>['onChange'];
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <Select
      className={className}
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
      options={[
        { value: 'FR', label: 'Français' },
        { value: 'EN', label: 'English' },
        { value: 'ES', label: 'Español' },
      ]}
    />
  );
}

export function ThemeToggle({
  dark = false,
  onChange,
  className,
}: {
  dark?: boolean;
  onChange?: (dark: boolean) => void;
  className?: string;
}) {
  return (
    <Toggle
      className={className}
      aria-label="Thème"
      checked={dark}
      onChange={(event) => onChange?.(event.currentTarget.checked)}
    />
  );
}

export function AddButton(props: Omit<ButtonProps, 'children'>) {
  return (
    <Button {...props} startIcon="+">
      Ajouter
    </Button>
  );
}
export function SaveButton({
  onSaved,
  ...props
}: Omit<ButtonProps, 'children'> & { onSaved?: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <Button
      {...props}
      onClick={(event) => {
        setSaved(true);
        onSaved?.();
        props.onClick?.(event);
      }}
    >
      {saved ? 'Enregistré' : 'Enregistrer'}
    </Button>
  );
}
export function ApproveButton(props: Omit<ButtonProps, 'children'>) {
  return (
    <Button {...props} variant="primary" startIcon="✓">
      Valider
    </Button>
  );
}
export function EditButton(props: Omit<ButtonProps, 'children'>) {
  return (
    <Button {...props} variant="tonal" startIcon="✎">
      Modifier
    </Button>
  );
}
export function DeleteButton(props: Omit<ButtonProps, 'children'>) {
  return (
    <Button {...props} variant="danger" startIcon="×">
      Supprimer
    </Button>
  );
}
export function IconActionButton({
  label = 'Action',
  ...props
}: Omit<ButtonProps, 'children'> & { label?: string }) {
  return (
    <Button {...props} aria-label={label} variant="ghost">
      {label.slice(0, 1)}
    </Button>
  );
}

export function Badge({
  tone = 'primary',
  liquidGlass = false,
  children,
  className,
}: {
  tone?: 'primary' | 'accent' | 'danger';
  liquidGlass?: boolean;
  children: ReactNode;
  className?: string;
}) {
  /* LE BADGE EST LE MÊME DES DEUX CÔTÉS. La pastille tierce forçait ses
     libellés en CAPITALES, imposait sa propre graisse et ignorait le ton
     d'Opale au profit de six variantes d'une autre palette : il fallait
     reprendre chacune de ces décisions à coups de `!important`. La pastille
     d'Opale étant désormais le contenu du verre, elle garde son ton, sa
     pilule et sa casse. */
  const classes = cx(
    'opale-badge',
    tone !== 'primary' && `opale-badge--${tone}`,
    liquidGlass && 'opale-badge--glass',
    className,
  );

  if (liquidGlass) {
    return (
      <Glass as="span" className={classes} rootClassName="opale-badge--glass-root">
        {children}
      </Glass>
    );
  }

  return <span className={classes}>{children}</span>;
}

/**
 * @deprecated Utilisez `Badge` avec sa prop `tone`. `StatusChip` n'est qu'un
 * `Badge` amputé : il n'exposait ni `tone` ni `liquidGlass` et contraignait
 * son contenu à une chaîne. La démonstration du catalogue affichait deux
 * statuts différents… rendus à l'identique, faute de pouvoir les distinguer.
 *
 * Le ton est transmis depuis cette version, pour que le composant cesse au
 * moins de mentir tant qu'il existe.
 */
export function StatusChip({
  status = 'En production',
  tone,
  className,
}: {
  status?: string;
  tone?: 'primary' | 'accent' | 'danger';
  className?: string;
}) {
  return (
    <Badge tone={tone} className={className}>
      {status}
    </Badge>
  );
}

export function Heading({
  level = 2,
  children,
  className,
}: {
  level?: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}) {
  const Heading = `h${level}` as 'h1';
  return <Heading className={cx('opale-heading', className)}>{children}</Heading>;
}

export function Text({
  variant = 'body',
  children,
  className,
}: {
  variant?: 'body' | 'label' | 'caption' | 'metric';
  children: ReactNode;
  className?: string;
}) {
  return <p className={cx('opale-text', `opale-text--${variant}`, className)}>{children}</p>;
}

export function Icon({
  name = '✦',
  label,
  className,
}: {
  name?: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cx('opale-icon', className)}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {name}
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
export function Feedback({
  severity = 'info',
  title,
  children,
  className,
}: {
  severity?: 'success' | 'info' | 'warning' | 'error';
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx('opale-feedback', `opale-feedback--${severity}`, className)}
      role={severity === 'error' ? 'alert' : 'status'}
    >
      <strong>{title ?? severity}</strong>
      <span>{children}</span>
    </div>
  );
}

export function Toast({
  message,
  open = true,
  onClose,
  className,
}: {
  message: ReactNode;
  open?: boolean;
  onClose?: () => void;
  className?: string;
}) {
  /* LA RÉGION EST MONTÉE EN PERMANENCE, LE MESSAGE SEUL APPARAÎT.

     Le composant entier — `role="status"` compris — était rendu au moment où
     le message arrivait. Une région live insérée EN MÊME TEMPS que son
     contenu n'est pas surveillée par la technologie d'assistance à l'instant
     de l'insertion : l'annonce se perd (WCAG 4.1.3). C'est exactement ce que
     l'en-tête de `ToastProvider` décrit et corrige pour la file ; la
     correction n'avait pas été reportée ici.

     La région extérieure ne porte aucun style : vide, elle n'occupe rien. */
  return (
    <div role="status">
      {open && (
        <div className={cx('opale-surface', 'opale-panel', className)}>
          <span>{message}</span>
          {onClose && (
            <button
              className="opale-dialog__close"
              type="button"
              onClick={onClose}
              aria-label="Fermer"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * L'indicateur d'attente.
 *
 * Même réserve que `Feedback` : sa région `status` naît avec lui, donc
 * l'apparition du témoin n'est pas garantie d'être annoncée. Pour un chargement
 * dont l'issue doit être entendue, gardez une région montée et n'y changez que
 * le texte.
 */
export function Spinner({
  label = 'Chargement',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span className={cx('opale-stack', className)} role="status">
      <span className="opale-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function ProgressBar({
  value = 0,
  label,
  className,
}: {
  value?: number;
  label?: string;
  className?: string;
}) {
  const labelId = useId();

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
      <div
        className="opale-progress"
        role="progressbar"
        aria-labelledby={label ? labelId : undefined}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="opale-progress__value"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open = false,
  title = 'Confirmer',
  children,
  onConfirm,
  onCancel,
}: {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  /* L'IDENTIFIANT DU TITRE ÉTAIT EN DUR — `id="opale-confirm-title"` — ce qui
     faisait résoudre `aria-labelledby` sur le mauvais titre dès que deux
     confirmations coexistaient. `Modal` le dérive d'un `useId`. */
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="text" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onConfirm}>Confirmer</Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export function EmptyState({
  title = 'Aucun résultat',
  description,
  action,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="opale-empty-state" title={title} subtitle={description} actions={action}>
      <Icon name="⌁" />
    </Card>
  );
}

export interface NavItem {
  id: string;
  label: ReactNode;
  href?: string;
  icon?: ReactNode;
}
export function Navbar({
  items = [],
  activeId,
  onSelect,
  className,
}: {
  items?: readonly NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <nav className={cx('opale-surface', 'opale-nav', className)} aria-label="Navigation">
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
            onClick={() => onSelect?.(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ),
      )}
    </nav>
  );
}

export function Menu({
  label = 'Menu',
  items = [],
  className,
  children,
}: {
  label?: ReactNode;
  items?: readonly NavItem[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <details className={cx('opale-surface', 'opale-panel', className)}>
      <summary>{label}</summary>
      {items.length > 0 ? <Navbar items={items} /> : children}
    </details>
  );
}

export function Link({
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return (
    <a className={cx('opale-link', className)} {...props}>
      {children}
    </a>
  );
}

export function SidePanel({
  open = false,
  title = 'Panneau',
  children,
  onClose,
}: {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
}) {
  /* IL COULE ENFIN SUR LE CÔTÉ. Sa fiche annonçait « panneau latéral
     coulissant » et il rendait la boîte CENTRÉE du dialogue — même classe,
     même position. La coquille le plaque désormais contre le bord de fin sur
     toute la hauteur ; voir `.opale-side-panel` dans `opale.css`. */
  return (
    <Modal open={open} onClose={onClose} title={title} rootClassName="opale-side-panel">
      {children}
    </Modal>
  );
}

export function SettingsMenu({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Menu className={className} label="Réglages" items={[]}>
      <div className="opale-stack opale-stack--column">{children}</div>
    </Menu>
  );
}
export function CommandPalette({
  open = false,
  value = '',
  onChange,
  onClose,
  children,
}: {
  open?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onClose?: () => void;
  children?: ReactNode;
}) {
  /* LE CHAMP A UNE ÉTIQUETTE, ET PLUS SEULEMENT UN TEXTE INDICATIF. Un
     placeholder disparaît à la première frappe, ne survit pas à la
     reconnaissance vocale et n'est pas une étiquette (WCAG 3.3.2) : il était
     pourtant le seul nom accessible du champ. Sur le composant dont la
     vocation EST le clavier, l'ironie méritait d'être corrigée.

     `onClose` EST UNE PROP NOUVELLE, et elle est la condition du reste : un
     dialogue qu'on ne peut pas fermer n'en est pas un. */
  return (
    <Modal open={open} onClose={onClose} aria-label="Palette de commandes">
      <Input
        label="Rechercher une commande"
        value={value}
        onChange={(event) => onChange?.(event.currentTarget.value)}
      />
      {children}
    </Modal>
  );
}

export function Breadcrumb({ items = [] }: { items?: readonly NavItem[] }) {
  return (
    /* UNE LISTE ORDONNÉE, ET UN MAILLON COURANT. Le fil était une suite de
       `<span>` : rien n'annonçait « liste de quatre éléments, élément deux »,
       et aucun `aria-current` ne disait où l'on se trouve — sur le composant
       dont c'est l'unique fonction (WCAG 1.3.1). */
    <nav className="opale-breadcrumb" aria-label="Fil d'Ariane">
      <ol>
        {items.map((item, index) => (
          <li key={item.id}>
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <a href={item.href} aria-current={index === items.length - 1 ? 'page' : undefined}>
                {item.label}
              </a>
            ) : (
              item.label
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
export function Toolbar({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('opale-surface', 'opale-toolbar', 'opale-panel', className)} {...props}>
      {children}
    </div>
  );
}
export function CookieBanner({
  open = true,
  children = 'Nous utilisons des cookies pour améliorer votre expérience.',
  onAccept,
}: {
  open?: boolean;
  children?: ReactNode;
  onAccept?: () => void;
}) {
  return open ? (
    <Feedback severity="info" title="Cookies">
      {children}
      <Button size="small" onClick={onAccept}>
        Accepter
      </Button>
    </Feedback>
  ) : null;
}
export function SelectionBar({
  selectedCount = 0,
  children,
}: {
  selectedCount?: number;
  children?: ReactNode;
}) {
  return (
    <div className="opale-surface opale-selection-bar opale-panel">
      {/* LE COMPTE CHANGEAIT SANS UN MOT. On cochait des lignes et le total
          n'était jamais annoncé (WCAG 4.1.3). La région est montée en
          permanence avec la barre, donc elle est surveillée avant que le
          nombre ne bouge — c'est la condition pour qu'une annonce parte. */}
      <span aria-live="polite">
        {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
      </span>
      {children}
    </div>
  );
}
export function Scrollbar({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('opale-scrollbar', className)}>{children}</div>;
}

export function Stack({
  direction = 'column',
  wrap = false,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { direction?: 'row' | 'column'; wrap?: boolean }) {
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
export function Layout({
  navigation,
  children,
  className,
}: {
  navigation?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('opale-layout', className)}>
      {navigation}
      <main className="opale-layout__content">{children}</main>
    </div>
  );
}
export function PageScaffold({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('opale-page-scaffold', className)}>{children}</div>;
}
export function PageContent({ children, className }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cx('opale-page-content', className)}>{children}</section>;
}
export function Divider({ className }: { className?: string }) {
  return <hr className={cx('opale-divider', className)} />;
}
export function Separator({ className }: { className?: string }) {
  return <span className={cx('opale-separator', className)} aria-hidden="true" />;
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
}: HTMLAttributes<HTMLDivElement> & { shape?: boolean }) {
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

export function DescriptionList({
  items = [],
}: {
  items?: readonly { term: ReactNode; description: ReactNode }[];
}) {
  return (
    <dl className="opale-description-list">
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
export function BulletList({ items = [] }: { items?: readonly ReactNode[] }) {
  return (
    <ul className="opale-bullet-list">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
export function Rating({ value = 0, max = 5 }: { value?: number; max?: number }) {
  return (
    /* `role="img"` EST OBLIGATOIRE ICI. Un `aria-label` posé sur un élément
       sans rôle — un `<span>` a le rôle `generic` — est ignoré par les API
       d'accessibilité, et les étoiles enfants sont toutes `aria-hidden` : la
       note ne s'annonçait donc PAS DU TOUT (WCAG 1.1.1). `Icon`, quelques
       lignes plus haut, prend déjà cette précaution. */
    <span className="opale-rating" role="img" aria-label={`${value} sur ${max}`}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} aria-hidden="true">
          {index + 1 <= value ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}
export function StatCard({
  label,
  value,
  delta,
  liquidGlass = false,
}: {
  label: ReactNode;
  value: ReactNode;
  delta?: ReactNode;
  liquidGlass?: boolean;
}) {
  return (
    <Surface className="opale-stat-card" liquidGlass={liquidGlass}>
      <span className="opale-stat-card__label">{label}</span>
      <strong className="opale-stat-card__value">{value}</strong>
      {delta && <span className="opale-stat-card__delta">{delta}</span>}
    </Surface>
  );
}
export function Donut({ value = 60, label = `${value}%` }: { value?: number; label?: string }) {
  return (
    <div
      className="opale-donut"
      data-label={label}
      style={{ '--opale-donut-value': `${value}%` } as CSSProperties}
      role="img"
      aria-label={label}
    />
  );
}
export function Legend({
  items = [],
}: {
  items?: readonly { label: ReactNode; color?: string }[];
}) {
  return (
    <div className="opale-stack opale-stack--wrap">
      {items.map((item, index) => (
        <span key={index} className="opale-stack">
          <Separator />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export interface DataTableProps {
  columns?: readonly { key: string; label: ReactNode }[];
  rows?: readonly Record<string, ReactNode>[];
}
export function DataTable({ columns = [], rows = [] }: DataTableProps) {
  return (
    <div className="opale-surface opale-panel">
      <table className="opale-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key}>{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalLinks({ links = [] }: { links?: readonly NavItem[] }) {
  return (
    <nav className="opale-legal-links" aria-label="Liens légaux">
      {links.map((link) => (
        <a key={link.id} href={link.href}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}

export function FileCard({
  name,
  size,
  selected = false,
  onClick,
}: {
  name: string;
  size?: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    /* `aria-pressed` ET UNE CLASSE PROPRE, À LA PLACE DU LAVIS.

       La sélection n'était signalée que par `.opale-liquid` — l'ancienne
       imitation du verre, détournée en surbrillance. Deux défauts pour le
       prix d'un : un lecteur d'écran ne pouvait pas dire quelles cartes
       étaient choisies (WCAG 4.1.2), et l'information n'existait que par la
       couleur (1.4.1). La classe dédiée porte un liseré et une coche ; l'état
       est désormais annoncé. */
    <button
      type="button"
      className={cx('opale-surface', 'opale-file-card', selected && 'opale-file-card--selected')}
      aria-pressed={selected}
      onClick={onClick}
    >
      <span className="opale-file-card__icon" aria-hidden="true">
        ⌁
      </span>
      <span>
        <strong>{name}</strong>
        {size && <small className="opale-field__helper">{size}</small>}
      </span>
    </button>
  );
}
export function Dropzone({
  onFiles,
  children = 'Déposez vos fichiers ici',
}: {
  onFiles?: (files: FileList) => void;
  children?: ReactNode;
}) {
  return (
    <label className="opale-dropzone">
      {/* `opale-visually-hidden` ET NON `hidden`, ET C'EST LA DIFFÉRENCE ENTRE
          UN COMPOSANT ET UN CUL-DE-SAC. L'attribut `hidden` vaut
          `display: none` : le champ sortait de l'ordre de tabulation, et le
          `<label>` qui l'enveloppe n'est pas focalisable. On tabulait donc
          jusqu'ici et l'on ne rencontrait RIEN — envoyer un fichier au clavier
          était impossible (WCAG 2.1.1). La classe, elle, masque par découpage
          sans déclasser : le champ garde son arrêt de tabulation, son anneau
          de focus et son annonce. */}
      <input
        type="file"
        className="opale-visually-hidden"
        multiple
        onChange={(event) => event.currentTarget.files && onFiles?.(event.currentTarget.files)}
      />
      <strong>{children}</strong>
      <span>Sélectionner des fichiers</span>
    </label>
  );
}
export function Lightbox({
  src,
  alt,
  open = false,
  onClose,
}: {
  src?: string;
  /* `alt` EST OBLIGATOIRE, ET IL NE PEUT PAS EN ÊTRE AUTREMENT. Sa valeur par
     défaut était la chaîne vide, c'est-à-dire « cette image est décorative » —
     déclaré sur la seule chose que la visionneuse existe pour montrer. Un
     appelant distrait produisait une lightbox vide pour qui ne voit pas, sans
     le moindre signal. Une prop obligatoire dit « décris-moi » ; un défaut
     vide dit « ce n'est pas grave ». Rupture d'API assumée. */
  alt: string;
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <Modal
      open={open && Boolean(src)}
      onClose={onClose}
      aria-label="Aperçu"
      rootClassName="opale-lightbox"
      footer={
        <Button variant="ghost" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      {src && <img src={src} alt={alt} />}
    </Modal>
  );
}
export function Map({ children = 'Carte interactive' }: { children?: ReactNode }) {
  /* `role="group"` ET NON `role="img"`. Une image rend tous ses descendants
     PRÉSENTATIONNELS : ils disparaissent de l'arbre d'accessibilité. Or ce
     composant reçoit ses marqueurs en `children`, et sa fiche promet des
     bulles et un clic — des marqueurs cliquables restaient focalisables tout
     en devenant anonymes et sans rôle, le pire des deux mondes (WCAG 1.3.1).
     Le groupe garde son nom et laisse voir ce qu'il contient. */
  return (
    <div className="opale-map" role="group" aria-label="Carte">
      {children}
    </div>
  );
}
export function RouteGuard({
  allowed = true,
  fallback = 'Accès refusé',
  children,
}: {
  allowed?: boolean;
  fallback?: ReactNode;
  children?: ReactNode;
}) {
  return allowed ? <>{children}</> : <Feedback severity="error">{fallback}</Feedback>;
}
export function I18n({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
export function Http({ status = 'API prête' }: { status?: ReactNode }) {
  return <StatusChip status={String(status)} />;
}
export function Validation({ valid = true }: { valid?: boolean }) {
  return <StatusChip status={valid ? 'Valide' : 'À corriger'} />;
}
export function Sound({ enabled = true }: { enabled?: boolean }) {
  return <Toggle label="Sons" defaultChecked={enabled} />;
}
export function LocalStore({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
export function Countdown({ seconds = 60 }: { seconds?: number }) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    /* PAS DE RÉGION LIVE ICI, ET C'EST LE CONTRAIRE DU DÉFAUT VOISIN. La
       valeur change CHAQUE SECONDE : le lecteur d'écran énonçait « 59 s,
       58 s, 57 s… » sans discontinuer et couvrait tout le reste de la page.
       Aucun critère WCAG ne l'interdit — c'est une question de qualité, pas
       de conformité —, mais un composant qui monopolise la parole est
       inutilisable. Le décompte reste lisible ; il cesse d'être criée. */
    <span className="opale-countdown">{remaining}s</span>
  );
}
export function Game({ score = 0 }: { score?: number }) {
  return (
    <div className="opale-surface opale-game">
      <Heading level={3}>Partie</Heading>
      <strong className="opale-stat-card__value">{score}</strong>
      <Button size="small">Continuer</Button>
    </div>
  );
}
export function Clipboard({ value, children = 'Copier' }: { value: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="small"
      variant="tonal"
      onClick={() => {
        void navigator.clipboard?.writeText(value);
        setCopied(true);
      }}
    >
      {copied ? 'Copié' : children}
    </Button>
  );
}
export function SvgMap({ children }: { children?: ReactNode }) {
  return (
    /* Même raison que pour `Map` : le tracé décoratif est marqué comme tel,
       et le conteneur devient un groupe pour ne pas effacer ses marqueurs. */
    <svg className="opale-svg-map" viewBox="0 0 400 180" role="group" aria-label="Carte SVG">
      <path
        aria-hidden="true"
        d="M20 135 C80 35 135 165 205 75 S325 35 380 125"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        opacity=".35"
      />
      {children}
    </svg>
  );
}

export interface CatalogEntry {
  readonly name: string;
  readonly category: string;
  readonly description: string;
}

export const OPALE_CATALOG: readonly CatalogEntry[] = [
  ['Button', 'Inputs', "Bouton d'action avec variantes, tailles et état de chargement."],
  ['Pressable', 'Inputs', 'Surface cliquable sans apparence : forme, focus et sélection.'],
  ['InlineInput', 'Inputs', "Champ d'édition en place : Entrée valide, Échap abandonne."],
  ['Input', 'Inputs', 'Champ de saisie avec validation, icône et types spécialisés.'],
  ['Checkbox', 'Inputs', 'Case à cocher avec label, sous-label et état indéterminé.'],
  ['Toggle', 'Inputs', 'Interrupteur animé pour les états binaires.'],
  ['Slider', 'Inputs', 'Curseur contrôlé avec libellé, valeur et graduations.'],
  ['MultiSelect', 'Inputs', 'Sélection multiple avec chips et liste déroulante.'],
  ['Select', 'Inputs', 'Sélecteur mono-valeur avec libellé accessible et options illustrées.'],
  ['Autocomplete', 'Inputs', 'Champ à suggestions avec filtrage et présélection.'],
  ['Form', 'Inputs', 'Formulaire orchestré par les primitives contrôlées.'],
  ['LanguageSelector', 'Inputs', "Sélecteur de langue branché sur l'i18n."],
  ['SegmentedControl', 'Inputs', 'Sélecteur segmenté animé pour choisir une option.'],
  ['ThemeToggle', 'Inputs', 'Bascule de thème clair ou sombre, avec matériau local.'],
  ['AddButton', 'Boutons spécialisés', "Bouton d'ajout avec icône plus intégrée."],
  ['SaveButton', 'Boutons spécialisés', "Bouton d'enregistrement unique, avec confirmation."],
  ['ApproveButton', 'Boutons spécialisés', 'Bouton de validation avec icône check.'],
  ['EditButton', 'Boutons spécialisés', "Bouton d'édition avec icône crayon."],
  ['DeleteButton', 'Boutons spécialisés', 'Bouton de suppression avec confirmation intégrée.'],
  ['IconActionButton', 'Boutons spécialisés', "Bouton d'action carré à icône."],
  ['Card', 'Affichage de données', 'Carte avec titre, sous-titre, actions et élévations.'],
  ['CardGrid', 'Affichage de données', 'Grille responsive auto-adaptative pour cartes.'],
  ['DataTable', 'Affichage de données', 'Table riche avec tri, sélection et clavier.'],
  ['DescriptionList', 'Affichage de données', 'Liste de paires libellé / valeur.'],
  ['BulletList', 'Affichage de données', 'Liste à puces avec icônes personnalisables.'],
  ['StatusChip', 'Affichage de données', 'Pastille de statut en plusieurs tonalités.'],
  ['Badge', 'Affichage de données', 'Pastille de compteur ou point de notification.'],
  ['Rating', 'Affichage de données', 'Note moyenne en étoiles, remplissage fractionnaire.'],
  ['StatCard', 'Affichage de données', 'Carte de métrique avec valeur, variation et icône.'],
  ['Donut', 'Affichage de données', 'Graphique en anneau segmenté avec contenu central.'],
  ['LegalLinks', 'Affichage de données', 'Pied de page légal et mentions.'],
  ['Legend', 'Affichage de données', 'Légende de statuts pour tableaux et graphiques.'],
  ['Heading', 'Affichage de données', 'Titres hiérarchisés avec échelle typographique.'],
  ['Text', 'Affichage de données', 'Corps de texte, labels, légendes et métriques.'],
  ['Icon', 'Affichage de données', 'Icônes Opale en plusieurs tailles.'],
  ['Feedback', 'Feedback', 'Encart de message contextuel en quatre sévérités.'],
  ['Toast', 'Feedback', 'Notification éphémère avec fermeture automatique.'],
  ['Spinner', 'Feedback', 'Indicateur de chargement circulaire.'],
  ['ProgressBar', 'Feedback', 'Barre de progression déterminée ou segmentée.'],
  ['ConfirmDialog', 'Feedback', "Boîte de dialogue de confirmation d'action."],
  ['EmptyState', 'Feedback', 'État vide illustré avec titre, description et action.'],
  ['Navbar', 'Navigation', 'Barre de navigation responsive avec sous-menus.'],
  ['Menu', 'Navigation', 'Menu contextuel positionnable avec items.'],
  ['Link', 'Navigation', 'Lien stylé compatible avec les routeurs externes.'],
  ['SidePanel', 'Navigation', 'Panneau latéral coulissant avec titre et footer.'],
  ['SettingsMenu', 'Navigation', 'Menu de réglages : thème, langue et session.'],
  ['CommandPalette', 'Navigation', 'Palette de commandes avec recherche clavier.'],
  ['Breadcrumb', 'Navigation', "Fil d'Ariane avec repli automatique."],
  ['Toolbar', 'Navigation', 'Barre d’outils : recherche, tri et actions.'],
  ['CookieBanner', 'Navigation', 'Bandeau de consentement avec mémorisation.'],
  ['Scrollbar', 'Navigation', 'Barre de défilement appliquée par le thème.'],
  ['SelectionBar', 'Navigation', "Barre d'actions groupées sur sélection multiple."],
  ['Stack', 'Mise en page', 'Empilement flexbox avec gaps issus des tokens.'],
  ['Layout', 'Mise en page', 'Gabarit de page avec navigation et contenu.'],
  ['PageScaffold', 'Mise en page', 'Squelette complet : navigation, contenu et footer.'],
  ['PageContent', 'Mise en page', 'Conteneur de contenu avec en-tête et footer.'],
  ['Divider', 'Mise en page', 'Séparateur horizontal ou vertical.'],
  ['Separator', 'Mise en page', 'Séparateur décoratif léger.'],
  ['BackgroundSurface', 'Mise en page', 'Fond animé par thème.'],
  ['FileCard', 'Modules', 'Carte de fichier ou dossier avec aperçu et sélection.'],
  ['Dropzone', 'Modules', 'Zone de dépôt par glisser-déposer ou sélection.'],
  ['Lightbox', 'Modules', "Visionneuse plein écran d'images et documents."],
  ['Map', 'Modules', 'Carte avec marqueurs, bulles et clic.'],
  ['RouteGuard', 'Modules', 'Garde de routes et redirections.'],
  ['I18n', 'Modules', 'Provider d’internationalisation et messages.'],
  ['Http', 'Modules', 'Client API avec gestion d’erreurs normalisée.'],
  ['Validation', 'Modules', 'Règles de validation réutilisables.'],
  ['Sound', 'Modules', 'Sons sémantiques, coupure et volume.'],
  ['LocalStore', 'Modules', 'État local typé, versionné et synchronisé.'],
  ['Countdown', 'Modules', 'Compte à rebours calé sur une échéance absolue.'],
  ['Game', 'Modules', 'Pièces de partie, série et grille partageable.'],
  ['Clipboard', 'Modules', 'Copie dans le presse-papier avec état fugace.'],
  ['SvgMap', 'Modules', 'Carte SVG gestuelle et accessible au clavier.'],
].map(([name, category, description]) => ({ name, category, description }));

export const OpaleUI = {
  Button: Button,
  Pressable: Pressable,
  Card: Card,
  CardGrid: CardGrid,
  Input: Input,
  InlineInput: InlineInput,
  Checkbox: Checkbox,
  Toggle: Toggle,
  Slider: Slider,
  Select: Select,
  MultiSelect: MultiSelect,
  Autocomplete: Autocomplete,
  Form: Form,
  LanguageSelector: LanguageSelector,
  SegmentedControl: SegmentedControl,
  ThemeToggle: ThemeToggle,
  AddButton: AddButton,
  SaveButton: SaveButton,
  ApproveButton: ApproveButton,
  EditButton: EditButton,
  DeleteButton: DeleteButton,
  IconActionButton: IconActionButton,
  DataTable: DataTable,
  DescriptionList: DescriptionList,
  BulletList: BulletList,
  StatusChip: StatusChip,
  Badge: Badge,
  Rating: Rating,
  StatCard: StatCard,
  Donut: Donut,
  LegalLinks: LegalLinks,
  Legend: Legend,
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
  SettingsMenu: SettingsMenu,
  CommandPalette: CommandPalette,
  Breadcrumb: Breadcrumb,
  Toolbar: Toolbar,
  CookieBanner: CookieBanner,
  Scrollbar: Scrollbar,
  SelectionBar: SelectionBar,
  Stack: Stack,
  Layout: Layout,
  PageScaffold: PageScaffold,
  PageContent: PageContent,
  Divider: Divider,
  Separator: Separator,
  BackgroundSurface: BackgroundSurface,
  FileCard: FileCard,
  Dropzone: Dropzone,
  Lightbox: Lightbox,
  Map: Map,
  RouteGuard: RouteGuard,
  I18n: I18n,
  Http: Http,
  Validation: Validation,
  Sound: Sound,
  LocalStore: LocalStore,
  Countdown: Countdown,
  Game: Game,
  Clipboard: Clipboard,
  SvgMap: SvgMap,
} as const;

/** Namespace public Opale pour les composants du catalogue V3. */
export const Opale = { ...OpaleUI, Background: BackgroundSurface } as const;
