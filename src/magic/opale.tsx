import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type FocusEvent,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';

import Glass from './components/glass/Glass';
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
  const labelId = useId();
  const descriptionId = useId();

  /* L'ÉTAT N'A PLUS BESOIN D'ÊTRE RECOPIÉ EN JAVASCRIPT.

     La version précédente tenait un état miroir (`useMirrorState`) pour dire à
     la case tierce si elle devait se peindre cochée. La coche est désormais la
     nôtre : `.opale-checkbox:checked + * .opale-checkbox-mark` la peint depuis
     le CSS, à partir de l'état réel du natif. Un état dérivé de moins, c'est
     une occasion de désynchronisation de moins — et `onChange` redevient un
     simple passe-plat. */
  return (
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
        aria-describedby={label && description ? descriptionId : undefined}
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
    <input
      ref={inputRef}
      id={sliderId}
      type="range"
      className="opale-range"
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
  /* LE TEXTE D'AIDE SORT DU `<label>`, COMME DANS `Input`. Enveloppé avec le
     champ, il entrait dans son NOM : « Pays Choisissez votre pays de
     résidence » au lieu de « Pays » décrit par une aide — ce qui casse la
     commande vocale visant « Pays » (WCAG 1.3.1). La correction avait été
     appliquée au champ de saisie et pas à ses trois voisins. */
  const helperId = `${selectId}-helper`;

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
          aria-describedby={helperText ? helperId : undefined}
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
      {helperText && (
        <span id={helperId} className="opale-field__helper">
          {helperText}
        </span>
      )}
    </div>
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
          /* `aria-activedescendant` NE DOIT PAS DÉSIGNER UN ÉLÉMENT ABSENT :
             sans option, la référence ne résout rien et la liste annonce un
             descendant actif qui n'existe pas. */
          aria-activedescendant={options.length ? `${fieldId}-option-${activeIndex}` : undefined}
          aria-describedby={helperText ? `${fieldId}-helper` : undefined}
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

      {helperText && (
        <span id={`${fieldId}-helper`} className="opale-field__helper">
          {helperText}
        </span>
      )}
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
export interface InlineInputProps extends FieldProps {
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

  return (
    <Input {...props} onFocus={handleFocus} onBlur={handleBlur} onKeyDown={handleKeyDown} />
  );
}

export interface SegmentedControlProps {
  options: readonly { value: string; label: ReactNode }[];
  value?: string;
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
  value,
  onChange,
  className,
  liquidGlass = false,
}: SegmentedControlProps) {
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

  /* LA MESURE SE FAIT SUR LE MÊME NŒUD DANS LES DEUX MATIÈRES. `Glass`
     transmet sa `ref` à sa couche de CONTENU, celle qui porte `className` :
     le groupe mesuré par `getBoundingClientRect` est donc exactement celui
     qui contient les boutons, verre ou pas. Mesurer l'enveloppe donnerait un
     indicateur décalé de l'épaisseur du matériau. */
  const Track = liquidGlass ? Glass : 'div';
  const trackProps = liquidGlass
    ? ({ rootClassName: 'opale-segmented--glass-root' } as const)
    : {};

  return (
    <Track
      {...trackProps}
      ref={groupRef}
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
          onClick={() => onChange?.(option.value)}
        >
          {option.label}
        </button>
      ))}
    </Track>
  );
}

export function Form({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form className={cx('opale-stack', 'opale-stack--column', className)} {...props} />;
}



export function IconActionButton({
  icon = 'more-horizontal',
  label = 'Action',
  ...props
}: Omit<ButtonProps, 'children'> & { icon?: OpaleIconName; label?: string }) {
  /* IL RENDAIT LA PREMIÈRE LETTRE DU LIBELLÉ. `label.slice(0, 1)` : un bouton
     « Partager » affichait « P ». Ce n'était pas une icône, c'était l'aveu
     qu'il n'y en avait pas — le jeu d'Opale n'existait pas encore. Il en
     prend une vraie, par son nom ; le libellé reste le nom accessible, et
     seulement lui. */
  return (
    <Button {...props} aria-label={label} variant="ghost">
      <IconGlyph name={icon} className="opale-icon__glyph" />
    </Button>
  );
}

export function Badge({
  tone = 'primary',
  dot = false,
  liquidGlass = false,
  children,
  className,
}: {
  tone?: 'primary' | 'accent' | 'danger';
  /** Un point de notification : le texte est masqué à l'œil, lu à l'oreille. */
  dot?: boolean;
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
      <Glass as="span" className={classes} rootClassName="opale-badge--glass-root">
        {content}
      </Glass>
    );
  }

  return <span className={classes}>{content}</span>;
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
  name = 'sparkle',
  label,
  className,
}: {
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
}) {
  return (
    <span
      className={cx('opale-icon', className)}
      aria-label={label}
      role={label ? 'img' : undefined}
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
export function Feedback({
  severity = 'info',
  title,
  children,
  className,
  liquidGlass = false,
}: {
  severity?: 'success' | 'info' | 'warning' | 'error';
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  liquidGlass?: boolean;
}) {
  const classes = cx(
    'opale-feedback',
    `opale-feedback--${severity}`,
    liquidGlass && 'opale-feedback--glass',
    className,
  );
  const role = severity === 'error' ? 'alert' : 'status';
  const content = (
    <>
      <strong>{title ?? severity}</strong>
      <span>{children}</span>
    </>
  );

  /* LE RÔLE EST POSÉ SUR LE MÊME NŒUD DANS LES DEUX MATIÈRES, et c'est le
     contrat à ne pas laisser dépendre d'une apparence : `Glass` rend le rôle
     sur sa couche de CONTENU, celle qui porte `className`, donc la région
     live reste là où elle était. */
  if (liquidGlass) {
    return (
      <Glass className={classes} rootClassName="opale-feedback--glass-root" role={role}>
        {content}
      </Glass>
    );
  }

  return (
    <div className={classes} role={role}>
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

   DEUX LIMITES ASSUMÉES, ET ELLES DÉCOULENT TOUTES DEUX DU CHOIX CI-DESSUS.

   1. UN SEUL MESSAGE À LA FOIS. Chaque instance monte sa propre ancre plein
      écran : deux `Opale.Toast` ouverts à la même place se recouvrent au
      pixel près, le second cachant le premier et sa croix. Ce n'est pas un
      oubli, c'est la frontière entre les deux composants — empiler, minuter,
      dédoublonner et congédier est le travail de `ToastProvider`, qui existe
      pour ça. Celui-ci sert quand il n'y a qu'UNE chose à dire et qu'on veut
      en tenir l'état soi-même.

   2. L'ORDRE DE TABULATION NE SUIT PAS LA PLACE À L'ÉCRAN. Le portail écrit
      en fin de `<body>`, donc la croix d'un message posé en haut est le
      DERNIER arrêt clavier de la page — mesuré, 106ᵉ sur 106. Elle reste
      atteignable, mais après toute la page. Le maquiller avec un `tabindex`
      positif ferait bien pire : ce serait déplacer l'ordre de toute la page
      pour un message passager. Pour un message qu'on s'attend à fermer au
      clavier, préférez les places basses.
   ========================================================================== */

/** Les six places possibles à l'écran. Mêmes valeurs que `ToastProvider`. */
export type ToastPlacement =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** Les tons, et leur couleur. `neutral` n'en porte aucune. */
export type ToastTone = 'neutral' | 'success' | 'warning' | 'error' | 'info';

/**
 * Les tons qui doivent INTERROMPRE la lecture.
 *
 * Une erreur annoncée poliment arrive à la fin de ce que l'utilisateur est en
 * train de lire, c'est-à-dire trop tard pour un échec ; un enregistrement
 * annoncé de façon assertive coupe la parole pour rien. Le découpage est le
 * même que celui de `ToastProvider`, et il tient à la même raison.
 */
const ASSERTIVE_TONES = new Set<ToastTone>(['error', 'warning']);

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
const TONE_ICON: Record<ToastTone, OpaleIconName | null> = {
  neutral: null,
  success: 'check-circle',
  warning: 'alert-triangle',
  error: 'x-circle',
  info: 'info',
};

export function Toast({
  message,
  open = true,
  onClose,
  tone = 'neutral',
  position = 'bottom-right',
  liquidGlass = false,
  className,
}: {
  message: ReactNode;
  open?: boolean;
  onClose?: () => void;
  /** Rend la carte dans le matériau « verre liquide ». Originale par défaut. */
  liquidGlass?: boolean;
  /** Le ton, qui choisit la couleur du filet et de l'icône. */
  tone?: ToastTone;
  /** La place à l'écran. Le message est rendu dans un portail, pas en flux. */
  position?: ToastPlacement;
  className?: string;
}) {
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
  const card = open ? (
    <Shell {...shellProps} className={classes} data-opale-toast-tone={tone}>
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
      {onClose && (
        <button
          className="opale-toast__close"
          type="button"
          onClick={onClose}
          aria-label="Fermer la notification"
        >
          <Icon name="close" />
        </button>
      )}
    </Shell>
  ) : null;

  const content = (
    /* L'ANCRE NE CAPTE PAS LE POINTEUR quand elle est vide, sinon une bande
       invisible en haut ou en bas de l'écran avalerait les clics de la page
       en permanence — y compris quand aucun message n'est affiché. */
    <div className={`opale-toast-anchor opale-toast-anchor--${position}`}>
      <div role="status">{assertive ? null : card}</div>
      <div role="alert">{assertive ? card : null}</div>
    </div>
  );

  /* LE PORTAIL EST RÉSOLU PENDANT LE RENDU et non dans un effet : les régions
     doivent exister au premier rendu, pas au suivant.

     SANS `document`, LE COMPOSANT NE REND RIEN — c'est ce que fait `Modal`, et
     les deux composants à portail du dépôt doivent tenir le même contrat. Le
     repli tentant est de rendre l'ancre EN PLACE dans l'arbre ; il est pire
     que rien. L'ancre est `position: fixed`, donc un ancêtre qui porte
     `backdrop-filter`, `transform` ou `filter` — c'est-à-dire tout verre de ce
     dépôt — en devient le bloc conteneur : le message s'afficherait à
     l'intérieur de la carte, voire rogné par elle, puis serait détruit et
     reconstruit ailleurs à l'hydratation. Un message mal placé pendant une
     seconde est un défaut visible ; son absence pendant la même seconde ne
     l'est pas. */
  const container = typeof document === 'undefined' ? null : document.body;

  if (!container) return null;

  return createPortal(content, container);
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
  liquidGlass = false,
}: {
  value?: number;
  label?: string;
  className?: string;
  liquidGlass?: boolean;
}) {
  const labelId = useId();
  /* LA PISTE EST CE QUI CHANGE DE MATIÈRE, PAS LA VALEUR. Le remplissage
     reste opaque sous verre : une progression translucide sur un paysage ne
     se lirait plus, et c'est la seule chose que la barre a à dire. */
  const Track = liquidGlass ? Glass : 'div';
  const trackProps = liquidGlass
    ? ({ rootClassName: 'opale-progress--glass-root' } as const)
    : {};

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
        {...trackProps}
        className={cx('opale-progress', liquidGlass && 'opale-progress--glass')}
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
      </Track>
    </div>
  );
}

export function ConfirmDialog({
  open = false,
  title = 'Confirmer',
  children,
  onConfirm,
  onCancel,
  liquidGlass = false,
}: {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  liquidGlass?: boolean;
}) {
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
      open={open}
      onClose={onCancel}
      liquidGlass={liquidGlass}
      title={title}
      description={children}
      footer={
        <>
          <Button variant="text" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={onConfirm}>Confirmer</Button>
        </>
      }
    />
  );
}

export function EmptyState({
  title = 'Aucun résultat',
  description,
  action,
  liquidGlass = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  liquidGlass?: boolean;
}) {
  return (
    <Card
      className="opale-empty-state"
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
export function Navbar({
  items = [],
  activeId,
  onSelect,
  className,
  liquidGlass = false,
}: {
  items?: readonly NavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
  liquidGlass?: boolean;
}) {
  const Rail = liquidGlass ? Glass : 'nav';
  const railProps = liquidGlass
    ? ({ as: 'nav', rootClassName: 'opale-surface--glass-root' } as const)
    : {};

  return (
    /* LE RAIL CHANGE DE MATIÈRE, PAS DE BALISE. `Glass` rend l'élément demandé
       pour son CONTENU : le `<nav>` et son nom accessible restent le même nœud
       dans les deux rendus, donc la navigation garde son rôle sous verre. */
    <Rail
      {...railProps}
      className={cx('opale-surface', liquidGlass && 'opale-surface--glass', 'opale-nav', className)}
      aria-label="Navigation"
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
            onClick={() => onSelect?.(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ),
      )}
    </Rail>
  );
}

export function Menu({
  label = 'Menu',
  items = [],
  className,
  children,
  liquidGlass = false,
}: {
  label?: ReactNode;
  items?: readonly NavItem[];
  className?: string;
  children?: ReactNode;
  liquidGlass?: boolean;
}) {
  const classes = cx(
    'opale-surface',
    liquidGlass && 'opale-surface--glass',
    'opale-panel',
    className,
  );
  const content = (
    <>
      <summary>{label}</summary>
      {items.length > 0 ? <Navbar items={items} liquidGlass={liquidGlass} /> : children}
    </>
  );

  if (liquidGlass) {
    return (
      <Glass as="details" className={classes} rootClassName="opale-surface--glass-root">
        {content}
      </Glass>
    );
  }

  return <details className={classes}>{content}</details>;
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
  liquidGlass = false,
}: {
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  onClose?: () => void;
  liquidGlass?: boolean;
}) {
  /* IL COULE ENFIN SUR LE CÔTÉ. Sa fiche annonçait « panneau latéral
     coulissant » et il rendait la boîte CENTRÉE du dialogue — même classe,
     même position. La coquille le plaque désormais contre le bord de fin sur
     toute la hauteur ; voir `.opale-side-panel` dans `opale.css`. */
  return (
    <Modal
      open={open}
      onClose={onClose}
      liquidGlass={liquidGlass}
      title={title}
      rootClassName="opale-side-panel"
    >
      {children}
    </Modal>
  );
}

export function CommandPalette({
  open = false,
  value = '',
  onChange,
  onClose,
  children,
  liquidGlass = false,
}: {
  open?: boolean;
  value?: string;
  onChange?: (value: string) => void;
  onClose?: () => void;
  children?: ReactNode;
  liquidGlass?: boolean;
}) {
  /* LE CHAMP A UNE ÉTIQUETTE, ET PLUS SEULEMENT UN TEXTE INDICATIF. Un
     placeholder disparaît à la première frappe, ne survit pas à la
     reconnaissance vocale et n'est pas une étiquette (WCAG 3.3.2) : il était
     pourtant le seul nom accessible du champ. Sur le composant dont la
     vocation EST le clavier, l'ironie méritait d'être corrigée.

     `onClose` EST UNE PROP NOUVELLE, et elle est la condition du reste : un
     dialogue qu'on ne peut pas fermer n'en est pas un. */
  return (
    <Modal
      open={open}
      onClose={onClose}
      liquidGlass={liquidGlass}
      aria-label="Palette de commandes"
    >
      <Input
        label="Rechercher une commande"
        liquidGlass={liquidGlass}
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

export function CookieBanner({
  open,
  children = 'Nous utilisons des cookies pour améliorer votre expérience.',
  onAccept,
  onDecline,
  storageKey = COOKIE_CONSENT_KEY,
  liquidGlass = false,
}: {
  /** Passé, il décide seul de l'affichage ; omis, le bandeau suit le choix mémorisé. */
  open?: boolean;
  children?: ReactNode;
  onAccept?: () => void;
  onDecline?: () => void;
  /** Clé de `localStorage` où le choix est mémorisé ; `null` coupe la mémoire. */
  storageKey?: string | null;
  liquidGlass?: boolean;
}) {
  const stored = useSyncExternalStore(
    subscribeConsent,
    () => readCookieConsent(storageKey),
    () => null,
  );
  const [decided, setDecided] = useState<CookieConsent | null>(null);
  const textId = useId();

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
    (choice === 'accepted' ? onAccept : onDecline)?.();
  };

  const visible = open ?? !(decided ?? stored);
  if (!visible) return null;

  const Shell = liquidGlass ? Glass : 'section';
  const shellProps = liquidGlass
    ? ({ as: 'section', rootClassName: 'opale-feedback--glass-root' } as const)
    : {};

  return (
    <Shell
      {...shellProps}
      className={cx(
        'opale-feedback',
        'opale-feedback--info',
        'opale-cookie-banner',
        liquidGlass && 'opale-feedback--glass',
      )}
      aria-label="Consentement aux cookies"
      aria-describedby={textId}
    >
      <strong>Cookies</strong>
      <span>
        <span id={textId}>{children}</span>
        <span className="opale-cookie-banner__actions">
          {/* MÊME POIDS POUR LES DEUX. Un refus en lien gris à côté d'un
              « Accepter » plein pousse la main vers le second : c'est le
              motif que la CNIL reproche aux bandeaux. */}
          <Button size="small" liquidGlass={liquidGlass} onClick={() => decide('declined')}>
            Refuser
          </Button>
          <Button size="small" liquidGlass={liquidGlass} onClick={() => decide('accepted')}>
            Accepter
          </Button>
        </span>
      </span>
    </Shell>
  );
}

export function SelectionBar({
  selectedCount = 0,
  children,
  liquidGlass = false,
}: {
  selectedCount?: number;
  children?: ReactNode;
  liquidGlass?: boolean;
}) {
  return (
    <Surface liquidGlass={liquidGlass} className="opale-selection-bar opale-panel">
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
export function Divider({ className }: { className?: string }) {
  return <hr className={cx('opale-divider', className)} />;
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

  return (
    RATING_INK_CUTS[bas] + (RATING_INK_CUTS[haut] - RATING_INK_CUTS[bas]) * (position - bas)
  );
}

export function Rating({ value = 0, max = RATING_DEFAULT_MAX }: { value?: number; max?: number }) {
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
      className="opale-rating"
      role="img"
      aria-label={`${formatRating(note)} sur ${bareme}`}
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
}

export interface DataTableProps {
  columns?: readonly DataTableColumn[];
  rows?: readonly DataTableRow[];
  /** Nom de la table, rendu en `<caption>`. */
  caption?: ReactNode;
  defaultSort?: DataTableSort;
  onSortChange?: (sort: DataTableSort) => void;
  liquidGlass?: boolean;
}

const TABLE_COLLATOR = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' });

const SORT_WORDING: Record<DataTableSortDirection, string> = {
  ascending: 'ordre croissant',
  descending: 'ordre décroissant',
};

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
function compareKeys(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'number') return -1;
  if (typeof b === 'number') return 1;
  return TABLE_COLLATOR.compare(a, b);
}

export function DataTable({
  columns = [],
  rows = [],
  caption,
  defaultSort,
  onSortChange,
  liquidGlass = false,
}: DataTableProps) {
  const [sort, setSort] = useState<DataTableSort | undefined>(defaultSort);
  const [announcement, setAnnouncement] = useState('');

  const sortedColumn = sort && columns.find((column) => column.key === sort.key);

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
      return sign * compareKeys(a, b);
    });
  }

  const toggle = (column: DataTableColumn) => {
    const direction: DataTableSortDirection =
      sort?.key === column.key && sort.direction === 'ascending' ? 'descending' : 'ascending';
    const next = { key: column.key, direction };
    setSort(next);
    const name = column.sortLabel ?? (typeof column.label === 'string' ? column.label : column.key);
    setAnnouncement(`Trié par ${name}, ${SORT_WORDING[direction]}`);
    onSortChange?.(next);
  };

  return (
    <Surface liquidGlass={liquidGlass} className="opale-panel">
      <div className="opale-table-scroll">
        <table className="opale-table">
          {caption && <caption className="opale-table__caption">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sort?.key === column.key ? sort.direction : undefined;
                return (
                  <th key={column.key} scope="col" aria-sort={active}>
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
            {ordered.map(({ row, index }) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key}>{row[column.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span className="opale-visually-hidden" role="status">
        {announcement}
      </span>
    </Surface>
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
  liquidGlass = false,
}: {
  name: string;
  size?: string;
  selected?: boolean;
  onClick?: () => void;
  liquidGlass?: boolean;
}) {
  return (
    /* `aria-pressed` ET UNE CLASSE PROPRE, À LA PLACE DU LAVIS.

       La sélection n'était signalée que par `.opale-liquid` — l'ancienne
       imitation du verre, détournée en surbrillance. Deux défauts pour le
       prix d'un : un lecteur d'écran ne pouvait pas dire quelles cartes
       étaient choisies (WCAG 4.1.2), et l'information n'existait que par la
       couleur (1.4.1). La classe dédiée porte un liseré et une coche ; l'état
       est désormais annoncé. */
    <FileCardShell
      liquidGlass={liquidGlass}
      className={cx(
        'opale-surface',
        liquidGlass && 'opale-surface--glass',
        'opale-file-card',
        selected && 'opale-file-card--selected',
      )}
      aria-pressed={selected}
      onClick={onClick}
    >
      <IconGlyph name="file" className="opale-file-card__icon" />
      <span className="opale-file-card__text">
        <strong>{name}</strong>
        {size && <small className="opale-field__helper">{size}</small>}
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
  ...props
}: {
  liquidGlass: boolean;
  className: string;
  'aria-pressed': boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  if (liquidGlass) {
    return (
      <Glass as="button" type="button" rootClassName="opale-file-card--glass-root" {...props}>
        {children}
      </Glass>
    );
  }

  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
}
export function Dropzone({
  onFiles,
  children = 'Ajoutez vos fichiers',
  liquidGlass = false,
}: {
  onFiles?: (files: FileList) => void;
  children?: ReactNode;
  liquidGlass?: boolean;
}) {
  const Zone = liquidGlass ? Glass : 'label';
  const zoneProps = liquidGlass
    ? ({ as: 'label', rootClassName: 'opale-dropzone--glass-root' } as const)
    : {};
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  /* LE DÉPÔT EXISTE ENFIN. La zone s'appelait « de dépôt » et n'écoutait aucun
     `drop` : un fichier lâché dessus était ignoré — ou, pire, ouvert par le
     navigateur à la place de la page, faute d'un `preventDefault`. Les deux
     annulations sont ce qui fait d'un élément une cible de dépôt : `dragover`
     l'autorise, `drop` empêche l'ouverture.

     `dragleave` SE DÉCLENCHE AUSSI EN PASSANT SUR UN ENFANT : survoler le
     titre de la zone la faisait « quitter », et l'état de survol clignotait.
     On compte les entrées et les sorties plutôt que de lire `relatedTarget`,
     que Safari laisse à `null` sur ces événements : la zone n'est quittée que
     quand le compte retombe à zéro. */
  const dragHandlers = {
    onDragEnter: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      depth.current += 1;
      setDragging(true);
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
    },
    onDragLeave: () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      depth.current = 0;
      setDragging(false);
      const { files } = event.dataTransfer;
      if (files.length > 0) onFiles?.(files);
    },
  };

  return (
    <Zone
      {...zoneProps}
      {...dragHandlers}
      className={cx('opale-dropzone', liquidGlass && 'opale-dropzone--glass')}
      data-dragging={dragging ? 'true' : undefined}
    >
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
    </Zone>
  );
}
export function Lightbox({
  src,
  alt,
  open = false,
  onClose,
  liquidGlass = false,
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
  liquidGlass?: boolean;
}) {
  return (
    <Modal
      open={open && Boolean(src)}
      onClose={onClose}
      liquidGlass={liquidGlass}
      aria-label="Aperçu"
      rootClassName="opale-lightbox"
      footer={
        <Button variant="ghost" liquidGlass={liquidGlass} onClick={onClose}>
          Fermer
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

export function Clipboard({
  value,
  liquidGlass = false,
  children = 'Copier',
}: {
  value: string;
  liquidGlass?: boolean;
  children?: ReactNode;
}) {
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
        liquidGlass={liquidGlass}
        onClick={() => {
          void copy();
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
export function SvgMap({
  children,
  liquidGlass = false,
}: {
  children?: ReactNode;
  liquidGlass?: boolean;
}) {
  /* LE VERRE EST LA PLAQUE, PAS LE TRACÉ. Un `<svg>` ne peut pas être la
     couche de contenu de `Glass`, qui empile des `<div>` : la carte est donc
     POSÉE sur une surface de verre. C'est d'ailleurs ce qu'on veut voir — un
     tracé qui flotte au-dessus du paysage, et non un paysage rogné en forme
     de tracé. */
  const carte = (
    /* Le tracé décoratif est marqué comme tel, et le conteneur est un groupe
       pour ne pas effacer les marqueurs qu'il reçoit en `children`. */
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

  return liquidGlass ? (
    <Surface liquidGlass className="opale-svg-map__plate">
      {carte}
    </Surface>
  ) : (
    carte
  );
}

export interface CatalogEntry {
  readonly name: string;
  readonly category: string;
  readonly description: string;
}

export const OPALE_CATALOG: readonly CatalogEntry[] = [
  ['Button', 'Inputs', "Bouton d'action avec variantes, tailles et état de chargement."],
  [
    'Pressable',
    'Inputs',
    'Bouton sans fond, la variante texte de Button, pour un contenu cliquable.',
  ],
  ['InlineInput', 'Inputs', "Champ d'édition en place : Entrée valide, Échap rétablit."],
  ['Input', 'Inputs', "Champ de saisie avec libellé, icône, texte d'aide et erreur annoncée."],
  ['Checkbox', 'Inputs', 'Case à cocher avec label et sous-label décrit.'],
  ['Toggle', 'Inputs', 'Interrupteur animé pour les états binaires.'],
  ['Slider', 'Inputs', 'Curseur avec libellé, et valeur si on la lui fournit.'],
  ['MultiSelect', 'Inputs', 'Liste à choix multiples contrôlée, à la souris ou au clavier.'],
  ['Select', 'Inputs', "Sélecteur natif mono-valeur avec libellé et texte d'aide."],
  ['Autocomplete', 'Inputs', 'Champ à suggestions fournies, dans la liste native du navigateur.'],
  ['Form', 'Inputs', 'Formulaire natif, champs empilés en colonne.'],
  ['SegmentedControl', 'Inputs', 'Sélecteur segmenté animé pour choisir une option.'],
  ['IconActionButton', 'Boutons spécialisés', "Bouton d'action à icône seule, nommé par son libellé."],
  ['Card', 'Affichage de données', 'Carte avec titre, sous-titre, actions, pied et quatre élévations.'],
  ['CardGrid', 'Affichage de données', 'Grille responsive auto-adaptative pour cartes.'],
  ['DataTable', 'Affichage de données', 'Table de données triable par en-tête de colonne.'],
  ['DescriptionList', 'Affichage de données', 'Liste de paires libellé / valeur.'],
  ['BulletList', 'Affichage de données', "Liste à puces construite depuis un tableau d'éléments."],
  ['Badge', 'Affichage de données', 'Pastille de texte en trois tons, ou point de notification.'],
  ['Rating', 'Affichage de données', 'Note en étoiles, remplie au quart près.'],
  ['StatCard', 'Affichage de données', 'Carte de métrique avec libellé, valeur et variation.'],
  ['Donut', 'Affichage de données', 'Anneau de progression à une valeur, libellé au centre.'],
  ['LegalLinks', 'Affichage de données', 'Liens légaux regroupés dans une navigation.'],
  ['Heading', 'Affichage de données', "Titre de niveau 1 à 4 dans la police d'affichage."],
  ['Text', 'Affichage de données', 'Corps de texte, labels, légendes et métriques.'],
  ['Icon', 'Affichage de données', 'Icône Opale par son nom, ou nœud libre, libellé optionnel.'],
  ['Feedback', 'Feedback', 'Encart de message contextuel en quatre sévérités.'],
  ['Toast', 'Feedback', "Notification en cinq tons et six positions, fermée par l'appelant."],
  ['Spinner', 'Feedback', 'Indicateur de chargement circulaire.'],
  ['ProgressBar', 'Feedback', 'Barre de progression déterminée, de 0 à 100.'],
  ['ConfirmDialog', 'Feedback', "Boîte de dialogue de confirmation d'action."],
  ['EmptyState', 'Feedback', 'État vide illustré avec titre, description et action.'],
  ['Navbar', 'Navigation', 'Navigation en colonne, liens ou boutons, page courante signalée.'],
  ['Menu', 'Navigation', 'Menu dépliant dans le flux, avec items.'],
  ['Link', 'Navigation', 'Lien stylé sur la balise native.'],
  ['SidePanel', 'Navigation', 'Panneau latéral pleine hauteur, avec titre.'],
  [
    'CommandPalette',
    'Navigation',
    "Palette de commandes : un champ de recherche en modale, résultats fournis par l'appelant.",
  ],
  ['Breadcrumb', 'Navigation', "Fil d'Ariane en liste ordonnée, dernière étape marquée page courante."],
  ['CookieBanner', 'Navigation', 'Bandeau de consentement qui mémorise le choix, accepté ou refusé.'],
  ['SelectionBar', 'Navigation', "Barre d'actions groupées sur sélection multiple."],
  ['Stack', 'Mise en page', 'Empilement flexbox avec gaps issus des tokens.'],
  ['Layout', 'Mise en page', 'Gabarit de page avec navigation et contenu.'],
  ['Divider', 'Mise en page', 'Séparateur horizontal.'],
  [
    'BackgroundSurface',
    'Mise en page',
    'Fond de page aux dégradés du thème, forme décorative en option.',
  ],
  ['FileCard', 'Modules', 'Carte de fichier sélectionnable, avec nom et taille.'],
  ['Dropzone', 'Modules', 'Zone de dépôt par glisser-déposer, ou par le sélecteur natif.'],
  ['Lightbox', 'Modules', "Visionneuse d'image en modale, texte alternatif obligatoire."],
  ['Clipboard', 'Modules', "Copie dans le presse-papier, état fugace et échec annoncé."],
  ['SvgMap', 'Modules', 'Cadre SVG pour une carte : tracé de fond et contenu libre.'],
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
  SegmentedControl: SegmentedControl,
  IconActionButton: IconActionButton,
  DataTable: DataTable,
  DescriptionList: DescriptionList,
  BulletList: BulletList,
  Badge: Badge,
  Rating: Rating,
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
} as const;

/** Namespace public Opale pour les composants du catalogue V3. */
export const Opale = { ...OpaleUI, Background: BackgroundSurface } as const;
