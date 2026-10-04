import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

import Glass from '../glass/Glass';
import { GLYPH_CLOSE } from '../icon/glyphs';
import { IconPaths } from '../icon/IconPaths';
import { MODAL_EXEMPT_ATTRIBUTE } from '../modal/Modal';
import type { OpalePlacement, OpaleTone } from '../../shared';
import { rememberFocusOrigin, returnFocus } from '../../shared/focus-return';
import { resolveLabels } from '../../shared/labels';
import { useDocumentBody } from '../../shared/use-document-body';
import { useDocumentPageTheme } from '../../shared/use-page-theme';
import { useScrollPadding } from '../../shared/use-scroll-padding';
import { resolveToastText } from './toast-content';
import { ToastContext, type ToastContextValue } from './toast-context';

import styles from './style/Toast.module.css';

/* =============================================================================
   LA FILE DE NOTIFICATIONS, ÉCRITE PAR OPALE.

   CE COMPOSANT EST UNE FILE, PAS UNE NOTIFICATION. `ToastProvider` monte un
   portail, retient une liste, la groupe par coin, l'empile, l'anime et la
   minute ; ses cartes sont internes et ne s'atteignent que par `showToast`.
   `Opale.Toast`, qui porte le même mot, est autre chose : un message rendu SUR
   PLACE, ouvert et fermé par une prop. Les deux coexistent à dessein — voir la
   page « ToastProvider » de la vitrine.

   POURQUOI CE FICHIER A ÉTÉ RÉÉCRIT, ET CE QUE LA VERSION COPIÉE RATAIT.

   1. LA RÉGION LIVE ÉTAIT POSÉE SUR LE NŒUD QUI VENAIT D'APPARAÎTRE. Chaque
      carte portait elle-même `role="status" aria-live="polite"`. Or une région
      live insérée EN MÊME TEMPS que son contenu n'est, selon le lecteur
      d'écran, pas annoncée du tout : la technologie d'assistance surveille les
      régions qu'elle connaît déjà, et celle-là naît avec son texte dedans.
      Autrement dit, le seul dispositif d'accessibilité du composant avait une
      chance sérieuse de ne rien faire.

      LES RÉGIONS SONT DONC PERMANENTES. Chacun des six coins porte deux
      régions vides montées avec le fournisseur — bien avant le premier toast —
      et les cartes sont insérées DEDANS. C'est ce qui rend l'annonce fiable.

   2. TOUT PARLAIT SUR LE MÊME TON. Une erreur de publication était annoncée
      aussi poliment qu'un brouillon enregistré, c'est-à-dire à la fin de ce
      que l'utilisateur était en train de lire. D'où DEUX régions par coin et
      non une : `role="status"` (poli) pour `default`, `success` et `info`,
      `role="alert"` (assertif) pour `error` et `warning`.

      CE QUE CE DÉCOUPAGE COÛTE, ET IL FAUT LE DIRE : à l'intérieur d'un même
      coin, les erreurs se groupent entre elles au lieu de s'intercaler par
      ordre d'arrivée avec les autres. Deux niveaux de politesse ne tiennent
      pas dans une seule région ; entre un ordre d'empilement parfait et une
      urgence correctement annoncée, c'est l'urgence qui gagne.

   3. UN MESSAGE POUVAIT S'EFFACER AVANT D'AVOIR ÉTÉ LU. C'est WCAG 2.2.1, et
      c'était la faute la plus sérieuse : la minuterie de quatre secondes
      courait quoi qu'il arrive. Quelqu'un qui lit lentement, qui traduit, ou
      qui vient d'atteindre la croix au clavier voyait la carte disparaître
      sous le curseur. La minuterie se met désormais en PAUSE au survol et dès
      que le focus entre dans la carte, et elle reprend là où elle s'était
      arrêtée — pas depuis le début, ce qui punirait un survol accidentel.
      `duration: Infinity` reste la façon de la désarmer complètement.

   4. LES PHASES ÉTAIENT PILOTÉES PAR DES `setState` EN CORPS D'EFFET — trois
      d'entre eux, plus un pour le conteneur de portail —, ce que la règle
      `react-hooks/set-state-in-effect` signalait à juste titre et que
      l'`eslint-disable` en tête de fichier faisait taire. L'entrée est
      désormais une animation CSS qui n'a besoin d'aucun état ; la sortie est
      un drapeau porté par la FILE, là où il appartient, puisque c'est la file
      qui décide de congédier. Il ne reste dans la carte qu'un état de pause,
      écrit depuis des gestionnaires d'évènements.

   CE QUI NE CHANGE PAS : `ToastProviderProps`, `ToastDefinition`, `useToast` et
   ses trois opérations, les six positions, les quatre
   animations et leurs durées de sortie. Le message d'erreur du hook est même
   gardé au mot près, parce que la vitrine le cite.
   ========================================================================== */

/** Les tons qui doivent INTERROMPRE la lecture plutôt que l'attendre. */
const ASSERTIVE_TONES = new Set<OpaleTone>(['error', 'warning']);

/* Sans ton, un message est neutre. L'ancien `variant` (et son `default`) a
   été retiré en 4.0.0. */
const resolveTone = ({ tone }: ToastDefinition): OpaleTone => tone ?? 'neutral';

/** L'entrée en scène d'une notification. */
export type ToastAnimation = 'slide-from-right' | 'slide-from-left' | 'slide-from-bottom' | 'scale';

/** Les six places de la file : le vocabulaire commun d'Opale. */
type ToastPosition = OpalePlacement;

export type ToastDefinition = {
  /**
   * L'identifiant du toast. Un `id` déjà présent dans la file REMPLACE son
   * toast au lieu d'en empiler un second : le remplaçant repart de zéro — sa
   * durée entière, son entrée, son propre `onClose` —, et le remplacé
   * disparaît sans prévenir le sien, puisqu'il n'a pas été fermé.
   */
  id?: string;
  /** Le texte principal. Même rôle que `message` ; l'emporte si les deux sont donnés. */
  title?: ReactNode;
  /**
   * Le texte principal, sous le nom qu'emploie `Toast`. Alias de `title`, non
   * déprécié ; donner les deux écrit un avertissement de développement.
   */
  message?: ReactNode;
  description?: ReactNode;
  /** Le ton : couleur de la carte et urgence de l'annonce. Défaut : `neutral`. */
  tone?: OpaleTone;
  /**
   * En millisecondes ; `Infinity` désarme la fermeture. Sans durée ici ni sur
   * le fournisseur, `error` et `warning` restent jusqu'à leur fermeture.
   */
  duration?: number;
  animation?: ToastAnimation;
  position?: ToastPosition;
  enableLiquidAnimation?: boolean;
  /**
   * Rend la notification dans le matériau « verre liquide ».
   *
   * PAR DÉFAUT ELLE EST ORIGINALE. Ce composant ne savait rendre que du verre :
   * le matériau est une OPTION de chaque composant d'Opale, jamais son seul
   * état.
   */
  liquidGlass?: boolean;
  onClose?: () => void;
};

type ToastRecord = ToastDefinition & {
  id: string;
  /* LE NUMÉRO DE PASSAGE DANS LA FILE, qui entre dans la clé de la carte. Un
     remplacement par `id` gardait la même clé, donc la même carte et ses refs :
     le reste à courir de l'ancien, et son drapeau « onClose déjà prévenu ». */
  revision: number;
  dismissed: boolean;
  duration: number;
  animation: ToastAnimation;
  position: ToastPosition;
  tone: OpaleTone;
  enableLiquidAnimation: boolean;
  liquidGlass: boolean;
};

/** Les textes d'une notification. */
export interface ToastLabels {
  /** Le nom de la croix. Défaut : « Fermer la notification ». */
  close: string;
}

const DEFAULT_TOAST_LABELS: ToastLabels = { close: 'Fermer la notification' };

export type ToastProviderProps = PropsWithChildren<{
  /** La durée par défaut, en millisecondes. Défaut : 4000, sauf `error` et `warning`. */
  duration?: number;
  /** L'entrée des notifications. Défaut : `slide-from-right`. */
  animation?: ToastAnimation;
  /** La pile par défaut, qu'une notification peut remplacer. Défaut : `top-right`. */
  position?: ToastPosition;
  /** L'onde qui parcourt une notification en verre à son apparition. Défaut : `true`. */
  enableLiquidAnimation?: boolean;
  /**
   * Rend la notification dans le matériau « verre liquide ».
   *
   * PAR DÉFAUT ELLE EST ORIGINALE. Ce composant ne savait rendre que du verre :
   * le matériau est une OPTION de chaque composant d'Opale, jamais son seul
   * état.
   */
  liquidGlass?: boolean;
  /** L'élément qui reçoit les piles. Défaut : `document.body`. */
  portalContainer?: HTMLElement | null;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<ToastLabels>;
}>;

/* L'ordre de cette liste est l'ordre du DOM des six piles. Il n'a pas
   d'incidence visuelle — chaque pile est positionnée en absolu — mais il fixe
   l'ordre dans lequel un lecteur d'écran parcourt les régions en mode lecture,
   et il vaut mieux qu'il soit écrit une fois que déduit d'un `Object.keys`. */
const POSITIONS: readonly ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const toneClass: Record<OpaleTone, string> = {
  neutral: styles.default,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
  info: styles.info,
};

const animationClass: Record<ToastAnimation, string> = {
  'slide-from-right': styles.slideFromRight,
  'slide-from-left': styles.slideFromLeft,
  'slide-from-bottom': styles.slideFromBottom,
  scale: styles.scale,
};

const positionClass: Record<ToastPosition, string> = {
  'top-right': styles.topRight,
  'top-left': styles.topLeft,
  'top-center': styles.topCenter,
  'bottom-right': styles.bottomRight,
  'bottom-left': styles.bottomLeft,
  'bottom-center': styles.bottomCenter,
};

/* Les durées de sortie, en accord avec `Toast.module.css` (`--opale-motion`)
   et avec ce que la vitrine documente. Elles minutent le RETRAIT du DOM : trop courtes, la carte
   disparaît en plein mouvement ; trop longues, elle reste invisible à occuper
   sa place dans la pile. */
const ANIMATION_MS: Record<ToastAnimation, number> = {
  'slide-from-right': 220,
  'slide-from-left': 220,
  'slide-from-bottom': 220,
  scale: 220,
};

/* Le sens d'empilement. En haut, le plus récent se pose près du bord, donc en
   tête ; en bas, il se pose également près du bord, donc en queue. Les deux
   listes se déduisent de l'ordre d'insertion — pas besoin d'horodater. */
const NEWEST_FIRST: Record<ToastPosition, boolean> = {
  'top-right': true,
  'top-left': true,
  'top-center': true,
  'bottom-right': false,
  'bottom-left': false,
  'bottom-center': false,
};

const generateToastId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
};

/* =============================================================================
   LA CARTE DE NOTIFICATION, DANS LES DEUX MATIÈRES.

   Le verre sépare l'enveloppe du contenu ; une carte pleine n'en a pas besoin
   et porte les deux classes. Le reste — le texte, le bouton de fermeture, la
   minuterie et sa pause — ne dépend d'aucune des deux.
   ========================================================================== */
function ToastSurface({
  liquidGlass,
  rootClassName,
  className,
  enableLiquidAnimation,
  triggerAnimation,
  children,
}: {
  readonly liquidGlass: boolean;
  readonly rootClassName?: string;
  readonly className?: string;
  readonly enableLiquidAnimation?: boolean;
  readonly triggerAnimation?: boolean;
  readonly children: ReactNode;
}) {
  if (!liquidGlass) {
    return <div className={clsx(rootClassName, className, styles.plain)}>{children}</div>;
  }

  return (
    <Glass
      rootClassName={rootClassName}
      className={className}
      enableLiquidAnimation={enableLiquidAnimation}
      triggerAnimation={triggerAnimation}
    >
      {children}
    </Glass>
  );
}

type ToastCardProps = {
  readonly toast: ToastRecord;
  readonly onDismiss: (id: string) => void;
  readonly onRemove: (id: string) => void;
  readonly labels: ToastLabels;
};

function ToastCard({ toast, onDismiss, onRemove, labels }: ToastCardProps) {
  const {
    animation,
    description,
    dismissed,
    enableLiquidAnimation,
    id,
    liquidGlass,
    onClose,
    title,
    tone,
  } = toast;

  const [paused, setPaused] = useState(false);
  const [entered, setEntered] = useState(false);

  /* Le reste à courir, pas l'échéance. C'est ce qui permet à une reprise de
     repartir d'où la pause a coupé au lieu de rejouer la durée entière — un
     survol involontaire ne doit pas rallonger indéfiniment le séjour d'un
     toast, il doit juste ne pas le raccourcir. */
  const remaining = useRef(toast.duration);
  /* LA SORTIE REND LE FOCUS (ACC-10). La carte retient l'élément d'où le focus
     est entré ; quand elle commence à partir en le tenant, il y retourne — la
     carte en sortie ne capte plus le pointeur, et son retrait laisserait sinon
     le focus sur <body>. */
  const cardRef = useRef<HTMLDivElement>(null);
  const focusOrigin = useRef<HTMLElement | null>(null);
  const startedAt = useRef(0);
  const closeAnnounced = useRef(false);

  /* L'onde du verre demande un FRONT : `Glass` lit `triggerAnimation` comme un
     passage à vrai, pas comme une valeur vraie. La carte naissant avec, il faut
     la lui fabriquer à l'image suivante. Le `setState` vit dans le callback de
     `requestAnimationFrame` et non dans le corps de l'effet — c'est la
     distinction que fait `react-hooks/set-state-in-effect`. */
  useEffect(() => {
    if (!enableLiquidAnimation) return undefined;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [enableLiquidAnimation]);

  /* LA MINUTERIE D'AUTO-FERMETURE — WCAG 2.2.1.
     Elle ne tourne ni pendant la pause, ni une fois la sortie engagée. Le
     nettoyage défalque le temps consommé, donc les reprises s'enchaînent sans
     perdre ni regagner de temps. */
  useEffect(() => {
    if (dismissed || paused || !Number.isFinite(remaining.current)) return undefined;

    startedAt.current = Date.now();
    const timer = setTimeout(() => onDismiss(id), Math.max(remaining.current, 0));

    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [dismissed, id, onDismiss, paused]);

  /* LA SORTIE. `onClose` est prévenu UNE SEULE FOIS, au moment où la carte
     commence à partir et non quand elle finit : c'est l'évènement que
     l'appelant attend, et le faire attendre l'animation lui ferait croire que
     la fermeture est plus lente qu'elle ne l'est. */
  useEffect(() => {
    if (!dismissed) return undefined;

    if (!closeAnnounced.current) {
      closeAnnounced.current = true;
      returnFocus(cardRef.current, focusOrigin.current);
      onClose?.();
    }

    const timer = setTimeout(() => onRemove(id), ANIMATION_MS[animation]);
    return () => clearTimeout(timer);
  }, [animation, dismissed, id, onClose, onRemove]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return (
    <div
      className={clsx(
        'opale-toast-provider__card',
        styles.card,
        animationClass[animation],
        dismissed && styles.leaving,
      )}
      data-testid="toast"
      /* Les quatre gestionnaires sont le dispositif WCAG 2.2.1, et il en faut
         quatre : la souris et le doigt passent par le pointeur, le clavier par
         le focus. N'en poser que deux laisserait dehors exactement le public
         que le critère protège. */
      ref={cardRef}
      onPointerEnter={pause}
      onPointerLeave={resume}
      onFocus={(event) => {
        rememberFocusOrigin(event, focusOrigin);
        pause();
      }}
      onBlur={resume}
    >
      <ToastSurface
        liquidGlass={liquidGlass}
        rootClassName={clsx('opale-toast-provider__surface', styles.surface, toneClass[tone])}
        className={clsx('opale-toast-provider__body', styles.body)}
        enableLiquidAnimation={enableLiquidAnimation}
        triggerAnimation={entered}
      >
        <div className={clsx('opale-toast-provider__text', styles.text)}>
          {title && <p className={clsx('opale-toast-provider__title', styles.title)}>{title}</p>}
          {description && (
            <p className={clsx('opale-toast-provider__description', styles.description)}>
              {description}
            </p>
          )}
        </div>

        <button
          type="button"
          className={clsx('opale-toast-provider__close', styles.close)}
          aria-label={labels.close}
          onClick={() => onDismiss(id)}
        >
          {/* Le tracé de la croix d'Opale, comme dans `Modal` : pas le signe « × ». */}
          <IconPaths paths={GLYPH_CLOSE} className={styles.closeGlyph} />
        </button>
      </ToastSurface>
    </div>
  );
}

/* LA PILE D'UN COIN. Occupée, elle réserve sa place au bord de la fenêtre :
   un toast fixe ne doit pas couvrir l'élément atteint au clavier. */
function ToastStack({
  position,
  occupied,
  children,
}: {
  readonly position: ToastPosition;
  readonly occupied: boolean;
  readonly children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollPadding(ref, position.startsWith('top') ? 'top' : 'bottom', occupied);
  return (
    <div
      ref={ref}
      className={clsx('opale-toast-provider__stack', styles.stack, positionClass[position])}
    >
      {children}
    </div>
  );
}

/** La durée d'un toast dont ni l'appel ni le fournisseur ne fixent la durée. */
const DEFAULT_DURATION_MS = 4000;

export const ToastProvider = ({
  children,
  duration: durationProp,
  animation = 'slide-from-right',
  position = 'top-right',
  enableLiquidAnimation = true,
  liquidGlass = false,
  portalContainer,
  labels: labelsProp,
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const duration = durationProp ?? DEFAULT_DURATION_MS;
  const revisions = useRef(0);

  const showToast = useCallback(
    (toast: ToastDefinition) => {
      const id = toast.id ?? generateToastId();

      const tone = resolveTone(toast);
      /* UN MESSAGE URGENT NE PART PAS SEUL (WCAG 2.2.1) : sans durée
         explicite, `error` et `warning` attendent leur fermeture. */
      revisions.current += 1;
      const record: ToastRecord = {
        ...toast,
        title: resolveToastText('showToast', toast.title, toast.message),
        id,
        revision: revisions.current,
        tone,
        duration:
          toast.duration ??
          durationProp ??
          (ASSERTIVE_TONES.has(tone) ? Infinity : DEFAULT_DURATION_MS),
        animation: toast.animation ?? animation,
        position: toast.position ?? position,
        enableLiquidAnimation: toast.enableLiquidAnimation ?? enableLiquidAnimation,
        liquidGlass: toast.liquidGlass ?? liquidGlass,
        dismissed: false,
      };

      setToasts((previous) => {
        /* UN `id` FOURNI DEUX FOIS REMPLACE, IL N'EMPILE PAS. L'amont ajoutait
           quand même, ce qui donnait deux enfants React de même clé : React
           n'en réconcilie alors qu'un correctement, et le second toast pouvait
           hériter de l'état du premier — minuterie comprise. Remplacer sur
           place est le seul comportement qui donne un sens à la prop `id`.

           LE REMPLAÇANT EST UNE CARTE NEUVE (ROB-06). Remplacer l'objet ne
           suffisait pas : la clé restait la même, donc la carte aussi, avec
           ses refs. Un « Enregistré » de cinq secondes posé sur un
           « Enregistrement… » presque échu partait en deux dixièmes de
           seconde ; posé pendant la sortie de l'ancien, il ne prévenait
           jamais son `onClose`. La révision entre dans la clé : la carte est
           remontée, minuterie et drapeaux compris. */
        const index = previous.findIndex((existing) => existing.id === id);
        if (index === -1) return [...previous, record];

        const next = [...previous];
        next[index] = record;
        return next;
      });

      return id;
    },
    [animation, durationProp, enableLiquidAnimation, liquidGlass, position],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((previous) =>
      previous.map((toast) => (toast.id === id ? { ...toast, dismissed: true } : toast)),
    );
  }, []);

  const clearToasts = useCallback(() => {
    setToasts((previous) => previous.map((toast) => ({ ...toast, dismissed: true })));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast,
      clearToasts,
      defaults: { duration, animation, position, enableLiquidAnimation, liquidGlass },
    }),
    [
      animation,
      clearToasts,
      dismissToast,
      duration,
      enableLiquidAnimation,
      liquidGlass,
      position,
      showToast,
    ],
  );

  /* Chaque coin est découpé en deux files par NIVEAU DE POLITESSE, pas par
     variante : `error` et `warning` interrompent, tout le reste attend son
     tour. */
  const grouped = useMemo(() => {
    const empty = () => ({ polite: [] as ToastRecord[], assertive: [] as ToastRecord[] });
    const byPosition = Object.fromEntries(POSITIONS.map((key) => [key, empty()])) as Record<
      ToastPosition,
      { polite: ToastRecord[]; assertive: ToastRecord[] }
    >;

    for (const toast of toasts) {
      const bucket = byPosition[toast.position] ?? byPosition['top-right'];
      (ASSERTIVE_TONES.has(toast.tone) ? bucket.assertive : bucket.polite).push(toast);
    }

    for (const key of POSITIONS) {
      if (!NEWEST_FIRST[key]) continue;
      byPosition[key].polite.reverse();
      byPosition[key].assertive.reverse();
    }

    return byPosition;
  }, [toasts]);

  /* Résolu pendant le rendu, comme chez `Modal`, mais par
     `useSyncExternalStore` (ROB-02). Le garde `typeof document` faisait rendre
     `null` au serveur et le portail au premier rendu client : l'écart faisait
     jeter et recréer TOUT le HTML serveur de l'application, sans un toast
     affiché. L'instantané serveur vaut `null` aussi pendant l'hydratation ;
     hors hydratation, le portail est là dès le premier rendu. */
  const body = useDocumentBody();
  const portalNode = body ? (portalContainer ?? body) : null;

  /* LE THÈME LOCAL SUIT LA FILE (THM-05). Le fournisseur n'a pas d'emplacement
     à lui dans la page — il est le plus souvent posé AU-DESSUS du gabarit —,
     donc le thème est celui du gabarit du document quand il n'y en a qu'un.
     Il est relu à l'arrivée du premier toast, et suivi tant qu'il y en a.
     Le nœud racine est tenu en état : remplacé — un autre `portalContainer` —,
     il relance l'effet au lieu de laisser le thème sur l'ancien. */
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null);
  useDocumentPageTheme(portalRoot, portalNode !== null && toasts.length > 0);

  const labels = resolveLabels(DEFAULT_TOAST_LABELS, labelsProp);

  const renderCard = (toast: ToastRecord) => (
    <ToastCard
      key={`${toast.id}:${toast.revision}`}
      toast={toast}
      onDismiss={dismissToast}
      onRemove={removeToast}
      labels={labels}
    />
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {portalNode &&
        createPortal(
          <div
            ref={setPortalRoot}
            className={clsx('opale-toast-provider', styles.root)}
            data-testid="toast-portal"
            /* Une modale ouverte rend le reste de la page inerte ; les toasts
               lancés depuis elle doivent rester annoncés et refermables. */
            {...{ [MODAL_EXEMPT_ATTRIBUTE]: '' }}
          >
            {POSITIONS.map((key) => (
              <ToastStack
                key={key}
                position={key}
                occupied={grouped[key].polite.length + grouped[key].assertive.length > 0}
              >
                {/* `role="status"` implique `aria-atomic="true"`, ce qui ferait
                    relire TOUTE la pile à chaque arrivée. La remise à `false`
                    est donc obligatoire, pas décorative. `aria-relevant` borne
                    l'annonce aux ajouts : le départ d'une carte n'a rien à
                    dire. */}
                <div
                  className={clsx('opale-toast-provider__region', styles.region)}
                  role="status"
                  aria-live="polite"
                  aria-atomic="false"
                  aria-relevant="additions"
                >
                  {grouped[key].polite.map(renderCard)}
                </div>

                <div
                  className={clsx('opale-toast-provider__region', styles.region)}
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="false"
                  aria-relevant="additions"
                >
                  {grouped[key].assertive.map(renderCard)}
                </div>
              </ToastStack>
            ))}
          </div>,
          portalNode,
        )}
    </ToastContext.Provider>
  );
};
