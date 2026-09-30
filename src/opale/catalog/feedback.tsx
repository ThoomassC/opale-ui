/* Les composants de retour du catalogue : encarts, notifications, attente, confirmation. */

import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

import Glass from '../components/glass/Glass';
import {
  GLYPH_ALERT_TRIANGLE,
  GLYPH_CHECK_CIRCLE,
  GLYPH_INFO,
  GLYPH_X_CIRCLE,
  type IconPathData,
} from '../components/icon/glyphs';
import { IconPaths } from '../components/icon/IconPaths';
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
import { Modal, type ModalLabels } from '../components/modal';
import type { ToastLabels } from '../components/toast';
import { resolveToastText } from '../components/toast/toast-content';
import type { OpalePlacement, OpaleSize, OpaleTone } from '../shared';
import { warnDeprecatedProps, warnIfUnnamed } from '../deprecations';
import { resolveLabels } from '../shared/labels';
import { mergeRefs } from '../shared/merge-refs';
import {
  PAGE_THEME_ATTRIBUTE,
  PAGE_THEME_COPY_ATTRIBUTE,
  PageThemeContext,
  pageThemeAttributes,
} from '../shared/page-theme-context';
import { useScrollPadding } from '../shared/use-scroll-padding';
import { Button } from './forms';
import { Card, Icon } from './display';
import { closeHandler, closeClickHandler } from './close-handlers';
import { rememberFocusOrigin, returnFocusAfterRemoval } from '../shared/focus-return';
import {
  getToastAnchor,
  subscribeToastAnchor,
  toastAnchorSettleDelay,
  toastAnchorSettled,
  type ToastAnchor,
} from './toast-anchors';

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
  neutral: 'Remarque',
  success: 'Succès',
  info: 'Information',
  warning: 'Attention',
  error: 'Erreur',
} as const;

/**
 * La nature d'un retour : sa couleur, son titre par défaut et l'urgence de son
 * annonce. Les cinq tons d'`OpaleTone` ; `neutral`, ajouté en 3.10, n'a pas de
 * couleur de signal et s'annonce poliment.
 */
export type FeedbackTone = OpaleTone;

export interface FeedbackProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Le ton de l'encart : sa couleur, son titre par défaut et son rôle. Défaut : `info`. */
  tone?: FeedbackTone;
  /** @deprecated Depuis 3.6 — utilisez `tone`. */
  severity?: FeedbackTone;
  /** Le titre de l'encart. Défaut : celui du ton (« Information », « Erreur »…). */
  title?: ReactNode;
  /** Le message, sous le titre. */
  children: ReactNode;
  /** Une classe ajoutée à côté de `.opale-feedback`. */
  className?: string;
  /** Rend l'encart dans le matériau « verre liquide ». Défaut : `false`. */
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
  warnDeprecatedProps('Feedback', { severity });
  const resolvedTone = tone ?? severity ?? 'info';
  const classes = clsx(
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
const TONE_ICON: Record<OpaleTone, IconPathData | null> = {
  neutral: null,
  success: GLYPH_CHECK_CIRCLE,
  warning: GLYPH_ALERT_TRIANGLE,
  error: GLYPH_X_CIRCLE,
  info: GLYPH_INFO,
};

/* L'ANCRE S'OBTIENT PAR UN MAGASIN EXTERNE, pas par un état posé dans un
   effet. S'abonner, c'est occuper l'ancre de sa place — la créer si l'on est
   le premier — et se désabonner, la libérer. React relit l'instantané aussitôt
   après l'abonnement et rend le portail dans la foulée. Côté serveur,
   l'instantané est `null` : pas d'ancre, pas de portail, et rien à hydrater. */
function useToastAnchor(position: OpalePlacement): ToastAnchor | null {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToastAnchor(position, listener),
    [position],
  );
  return useSyncExternalStore(
    subscribe,
    () => getToastAnchor(position),
    () => null,
  );
}

/**
 * Les props de `Toast`.
 *
 * LE TEXTE A DEUX NOMS, COMME DANS `showToast` : `message` ou `title`, au
 * choix, et `description` pour une seconde ligne. Aucun n'est déprécié.
 */
export interface ToastProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'title'> {
  /** Le texte du message. Même rôle que `title` ; l'emporte si les deux sont donnés. */
  message?: ReactNode;
  /**
   * Le texte du message, sous le nom qu'emploie `showToast`. Avec `message`, il
   * reste ce qu'il était jusqu'en 3.9.3 — l'attribut HTML `title` de la carte —,
   * et un avertissement de développement le signale.
   */
  title?: ReactNode;
  /** Une seconde ligne, sous le texte principal, comme dans `showToast`. */
  description?: ReactNode;
  /**
   * L'appelant tient l'état ouvert. DÉFAUT SURPRENANT : `true`, là où
   * `ConfirmDialog`, `SidePanel`, `CommandPalette` et `Lightbox` sont fermés
   * par défaut et où `Modal` exige `open`. Le motif prévu est
   * `{saved && <Toast … />}` ; pour un message monté d'avance, passez `open`.
   */
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
  /** Une classe ajoutée à la carte de la notification. */
  className?: string;
}

const DEFAULT_TOAST_LABELS: ToastLabels = { close: 'Fermer la notification' };

/* SOUS VERRE, LE THÈME VA AUSSI SUR L'ENVELOPPE. `Glass` passe les attributs
   à sa couche de contenu, et la `ref` la désigne ; or la teinte et le voile
   sont peints par les couches SŒURS du contenu, dans l'enveloppe. Le thème y
   est posé depuis la `ref` de rappel, au rattachement du nœud : un passage au
   verre pendant l'ouverture remonte la carte, et le nouveau nœud le reçoit
   aussitôt — sans effet, donc sans image dans le mauvais thème. */
function applyThemeToGlassRoot(node: HTMLElement, theme: 'light' | 'dark' | null) {
  const root = node.closest<HTMLElement>('.opale-toast--glass-root');
  if (!root || root === node) return;
  if (theme === null) {
    root.removeAttribute(PAGE_THEME_ATTRIBUTE);
    root.removeAttribute(PAGE_THEME_COPY_ATTRIBUTE);
    return;
  }
  root.setAttribute(PAGE_THEME_ATTRIBUTE, theme);
  root.setAttribute(PAGE_THEME_COPY_ATTRIBUTE, '');
}

export function Toast({
  message,
  title,
  description,
  open = true,
  onOpenChange,
  onClose,
  tone = 'neutral',
  position = 'bottom-right',
  liquidGlass = false,
  labels: labelsProp,
  className,
  ref,
  onFocus,
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
  warnDeprecatedProps('Toast', { onClose });
  /* `message` ET `title` (DOCS-04). Seul, `title` est le texte ; auprès de
     `message`, il redevient l'attribut natif qu'il était en 3.9.3. */
  const text = resolveToastText('Toast', message, title);
  const nativeTitle = message !== undefined && typeof title === 'string' ? title : undefined;
  const hasDescription = description !== undefined && description !== null && description !== false;
  const closeClick = closeClickHandler(onOpenChange, onClose);
  const labels = resolveLabels(DEFAULT_TOAST_LABELS, labelsProp);
  const assertive = ASSERTIVE_TONES.has(tone);
  const classes = clsx(
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
  /* LE THÈME LOCAL DU GABARIT SUIT LE MESSAGE (THM-05). `PageScaffold` le
     transmet par contexte, que le portail traverse. L'ancre de la place est
     partagée par tous les messages qui s'y rendent, peut-être depuis des
     gabarits différents : le thème se pose donc sur la CARTE, pendant le
     rendu. Rien n'est rendu à l'endroit où le composant est écrit — le
     conteneur d'appel reste vide, c'est un contrat. */
  const pageTheme = useContext(PageThemeContext);
  const cardRef = useRef<HTMLDivElement | null>(null);
  /* LA CROIX NE JETTE PLUS LE FOCUS SUR <body> (ACC-10). La carte retient
     l'élément d'où le focus est entré ; si elle est retirée pendant qu'elle
     le tient, il y retourne. Le nettoyage de la `ref` passe avant le retrait
     du DOM : c'est le dernier moment où l'on sait que le focus était dedans. */
  const focusOrigin = useRef<HTMLElement | null>(null);
  const cardRefs = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return undefined;
      if (liquidGlass) applyThemeToGlassRoot(node, pageTheme);
      const detach = mergeRefs(cardRef, ref)(node);
      return () => {
        returnFocusAfterRemoval(node, focusOrigin);
        if (typeof detach === 'function') detach();
      };
    },
    [liquidGlass, pageTheme, ref],
  );
  /* LE TEXTE ENTRE APRÈS LA RÉGION (ACC-15). Voir `toastAnchorSettled`. */
  const anchor = useToastAnchor(position);
  const [announcedIn, setAnnouncedIn] = useState<ToastAnchor | null>(null);
  const waitingForRegion =
    open && anchor !== null && announcedIn !== anchor && !toastAnchorSettled(anchor);
  useEffect(() => {
    if (!waitingForRegion || anchor === null) return undefined;
    const timeout = window.setTimeout(() => setAnnouncedIn(anchor), toastAnchorSettleDelay(anchor));
    return () => window.clearTimeout(timeout);
  }, [anchor, waitingForRegion]);
  const card = open ? (
    <Shell
      {...rest}
      title={nativeTitle}
      {...shellProps}
      ref={cardRefs}
      className={classes}
      data-opale-toast-tone={tone}
      {...pageThemeAttributes(pageTheme)}
      onFocus={(event: FocusEvent<HTMLDivElement>) => {
        rememberFocusOrigin(event, focusOrigin);
        onFocus?.(event);
      }}
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
      {TONE_ICON[tone] && <IconPaths paths={TONE_ICON[tone]} className="opale-toast__icon" />}
      {/* MASQUÉ LE TEMPS QUE LA RÉGION S'INSTALLE, PUIS RÉINSÉRÉ. La clé change
          quand l'attente prend fin : le texte entre alors dans une région déjà
          surveillée, et il n'est dit qu'une fois. L'œil, lui, le voit dès le
          premier rendu. */}
      <span
        key={waitingForRegion ? 'pending' : 'live'}
        className="opale-toast__message"
        aria-hidden={waitingForRegion ? true : undefined}
      >
        {hasDescription ? (
          <>
            <span className="opale-toast__title">{text}</span>
            <span className="opale-toast__description">{description}</span>
          </>
        ) : (
          text
        )}
      </span>
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
     existent dès que l'ancre existe. Quand l'ancre naît avec le message — le
     motif `{saved && <Toast … />}` —, le texte est masqué aux technologies
     d'assistance puis réinséré une fois la région installée (ACC-15) : monter
     le composant fermé n'est plus une condition de l'annonce. */
  /* Le message fixe ne doit pas couvrir l'élément atteint au clavier. */
  useScrollPadding(cardRef, position.startsWith('top') ? 'top' : 'bottom', open && anchor !== null);

  if (!anchor || !card) return null;

  return createPortal(card, assertive ? anchor.alert : anchor.status);
}

export interface SpinnerProps extends ComponentPropsWithRef<'span'> {
  /** Le texte d'attente, affiché et annoncé. Défaut : « Chargement ». */
  label?: string;
  /** La taille du témoin : 16, 24 ou 40 px. Défaut : `medium` (24 px). */
  size?: OpaleSize;
  /** Une classe ajoutée à côté de `.opale-stack`. */
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
export function Spinner({
  label = 'Chargement',
  size = 'medium',
  className,
  ...rest
}: SpinnerProps) {
  return (
    <span {...rest} className={clsx('opale-stack', className)} role="status">
      <span
        className={clsx('opale-spinner', size !== 'medium' && `opale-spinner--${size}`)}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

/**
 * Les props de `ProgressBar`.
 *
 * DEUX DESTINATIONS, COMME POUR LES CHAMPS (DX-03). `className` va à
 * l'ENVELOPPE — `.opale-field`, qui porte le libellé. Tout le reste — `id`,
 * `style`, `ref`, `aria-*`, `data-*`, les gestionnaires — va à l'élément
 * `role="progressbar"`.
 *
 * Il n'existe pas encore de `rootClassName` ni de `classNames` par zone
 * (candidat 3.10) : pour habiller la barre, ciblez `.opale-progress` depuis la
 * classe de l'enveloppe.
 */
export interface ProgressBarProps extends ComponentPropsWithRef<'div'> {
  /** L'avancement, en pour cent, borné à [0, 100]. Défaut : `0`. */
  value?: number;
  /**
   * Le libellé visible, qui nomme la barre. Sans libellé, nommez-la par `aria-label` ou
   * `aria-labelledby`.
   */
  label?: string;
  /** Va à l'enveloppe, pas à l'élément `progressbar`. Voir `ProgressBarProps`. */
  className?: string;
  /**
   * Rend la piste dans le matériau « verre liquide » ; le remplissage reste opaque. Défaut :
   * `false`.
   */
  liquidGlass?: boolean;
}

export function ProgressBar({
  value = 0,
  label,
  className,
  liquidGlass = false,
  ref,
  ...rest
}: ProgressBarProps) {
  const labelId = useId();
  /* SANS NOM, UNE BARRE DIT « 40 % » DE RIEN (ACC-21). Le nom se lit dans le
     DOM une fois monté, comme pour l'interrupteur : un `aria-labelledby` posé
     par l'appelant vers un titre de la page le nomme sans que `label` le dise. */
  const trackRef = useRef<HTMLDivElement | null>(null);
  const trackRefs = useCallback(
    (node: HTMLDivElement | null) => mergeRefs(trackRef, ref)(node),
    [ref],
  );
  useEffect(() => {
    if (trackRef.current) warnIfUnnamed('ProgressBar', trackRef.current);
  }, []);
  /* LA PISTE EST CE QUI CHANGE DE MATIÈRE, PAS LA VALEUR. Le remplissage
     reste opaque sous verre : une progression translucide sur un paysage ne
     se lirait plus, et c'est la seule chose que la barre a à dire. */
  const Track = liquidGlass ? Glass : 'div';
  const trackProps = liquidGlass ? ({ rootClassName: 'opale-progress--glass-root' } as const) : {};
  /* La valeur annoncée est celle qu'on voit : bornée à [0, 100]. */
  const bounded = Number.isFinite(value) ? Math.max(0, Math.min(value, 100)) : 0;

  return (
    <div className={clsx('opale-field', className)}>
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
        ref={trackRefs}
        className={clsx('opale-progress', liquidGlass && 'opale-progress--glass')}
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

/** Les textes de `ConfirmDialog`. `close` nomme la croix. */
export interface ConfirmDialogLabels extends ModalLabels {
  /** Le titre, quand `title` n'est pas passé. Défaut : « Confirmer ». */
  title: string;
  /** Défaut : « Annuler ». */
  cancel: string;
  /** Défaut : « Confirmer ». */
  confirm: string;
}

/** Le ton d'une confirmation : `danger` pour une action destructrice. */
export type ConfirmDialogTone = 'default' | 'danger';

/** Les props de `ConfirmDialog`. `ref` et les attributs vont au panneau du dialogue. */
export interface ConfirmDialogProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Ouvert ou non, piloté par l'appelant. Défaut : `false`. */
  open?: boolean;
  /** Le titre du dialogue. Défaut : `labels.title`, « Confirmer ». */
  title?: ReactNode;
  /** Le corps du dialogue, qui en devient la description : ce que l'action va faire. */
  children?: ReactNode;
  /**
   * Appelée sur Confirmer. Le dialogue ne se ferme pas seul : l'appelant ferme
   * après son action. Si elle rend une PROMESSE, le dialogue attend : Confirmer
   * passe en chargement et ignore les clics suivants, Annuler, Échap, le voile
   * et la croix sont sans effet, jusqu'à ce que la promesse soit tenue ou
   * rompue. Un rejet n'est pas avalé : il remonte comme sans le dialogue.
   */
  onConfirm?: () => void | PromiseLike<unknown>;
  /** `danger` rend Confirmer en bouton de danger. Défaut : `default` (primaire). */
  tone?: ConfirmDialogTone;
  /**
   * L'action est en cours, tenue par l'appelant : Confirmer passe en attente,
   * et Annuler, Échap, le voile et la croix sont bloqués. Une promesse rendue
   * par `onConfirm` met seulement Confirmer en attente (pas de double envoi) et
   * laisse Annuler possible. Défaut : `false`.
   */
  loading?: boolean;
  /** `false` sur Annuler, Échap, le voile ou la croix. Jamais sur Confirmer. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Depuis 3.6 — utilisez `onOpenChange`. */
  onCancel?: () => void;
  /** Remplace les textes français par défaut, clé par clé. `title` gagne sur `labels.title`. */
  labels?: Partial<ConfirmDialogLabels>;
  /** Rend le panneau dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

const DEFAULT_CONFIRM_DIALOG_LABELS: ConfirmDialogLabels = {
  close: 'Fermer',
  title: 'Confirmer',
  cancel: 'Annuler',
  confirm: 'Confirmer',
};

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

export function ConfirmDialog({
  open = false,
  title,
  children,
  onConfirm,
  onOpenChange,
  onCancel,
  labels: labelsProp,
  liquidGlass = false,
  tone = 'default',
  loading = false,
  ...rest
}: ConfirmDialogProps) {
  warnDeprecatedProps('ConfirmDialog', { onCancel });
  const labels = resolveLabels(DEFAULT_CONFIRM_DIALOG_LABELS, labelsProp);
  /* UN DOUBLE CLIC NE CONFIRME PAS DEUX FOIS (DX-17). Sur un appel réseau, le
     second clic partait avant la réponse : double suppression, double envoi.
     La promesse rendue par `onConfirm` tient le dialogue occupé. La `ref`
     ferme la porte dès le premier clic, avant même que l'état ne soit rendu ;
     l'état, lui, fait voir et entendre l'attente (`Button loading`). */
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const busy = loading || pending;
  /* ANNULER RESTE POSSIBLE PENDANT UNE PROMESSE. En 3.9, le retour de
     `onConfirm` était ignoré et l'utilisateur pouvait toujours renoncer ; un
     `onConfirm={() => mutation.mutateAsync()}` existant ne doit pas le priver
     d'Annuler, ni le coincer si la promesse ne se termine jamais. Seul
     `loading`, que l'appelant pose exprès, verrouille aussi la fermeture. */
  const locked = loading;
  const close = closeHandler(onOpenChange, onCancel);
  const guardedClose =
    close &&
    ((next: boolean) => {
      if (!locked) close(next);
    });
  const confirm = () => {
    if (busy || inFlight.current || !onConfirm) return;
    const result = onConfirm();
    if (!isThenable(result)) return;
    inFlight.current = true;
    setPending(true);
    const settle = () => {
      inFlight.current = false;
      setPending(false);
    };
    result.then(settle, (error: unknown) => {
      settle();
      throw error;
    });
  };
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
      onOpenChange={guardedClose}
      liquidGlass={liquidGlass}
      labels={{ close: labels.close }}
      title={title === undefined ? labels.title : title}
      description={children}
      footer={
        <>
          <Button
            variant="text"
            disabled={locked}
            onClick={closeClickHandler(onOpenChange, onCancel)}
          >
            {labels.cancel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            loading={busy}
            onClick={confirm}
          >
            {labels.confirm}
          </Button>
        </>
      }
    />
  );
}

export interface EmptyStateProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Le titre de l'état vide. Défaut : « Aucun résultat ». */
  title?: ReactNode;
  /** Le texte sous le titre : pourquoi c'est vide. */
  description?: ReactNode;
  /** L'action suivante proposée, un `Button` le plus souvent. */
  action?: ReactNode;
  /** Rend la carte dans le matériau « verre liquide ». Défaut : `false`. */
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
      className={clsx('opale-empty-state', className)}
      title={title}
      subtitle={description}
      actions={action}
      liquidGlass={liquidGlass}
    >
      <Icon name="search" />
    </Card>
  );
}
