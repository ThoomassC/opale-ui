import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import Glass from '../glass/Glass';

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
   ses trois opérations, les quatre variantes, les six positions, les quatre
   animations et leurs durées de sortie. Le message d'erreur du hook est même
   gardé au mot près, parce que la vitrine le cite.
   ========================================================================== */

/* `warning` A ÉTÉ AJOUTÉ APRÈS COUP, ET SON ABSENCE ÉTAIT UN TROU. La file
   savait dire « c'est fait », « c'est raté » et « pour information » ; elle
   n'avait rien pour « c'est passé, mais regardez ». Faute de ton, ces
   messages-là partaient en `error` — ce qui interrompt pour rien — ou en
   `default` — ce qui les rend invisibles. */
type ToastVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

/** Les tons qui doivent INTERROMPRE la lecture plutôt que l'attendre. */
const ASSERTIVE_VARIANTS = new Set<ToastVariant>(['error', 'warning']);

type ToastAnimation = 'slide-from-right' | 'slide-from-left' | 'slide-from-bottom' | 'scale';

type ToastPosition =
  'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

export type ToastDefinition = {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
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
  dismissed: boolean;
  duration: number;
  animation: ToastAnimation;
  position: ToastPosition;
  variant: ToastVariant;
  enableLiquidAnimation: boolean;
  liquidGlass: boolean;
};

export type ToastProviderProps = PropsWithChildren<{
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
  portalContainer?: HTMLElement | null;
}>;

type ToastContextValue = {
  showToast: (toast: ToastDefinition) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  defaults: {
    duration: number;
    animation: ToastAnimation;
    position: ToastPosition;
    enableLiquidAnimation: boolean;
    liquidGlass: boolean;
  };
};

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

const variantClass: Record<ToastVariant, string> = {
  default: styles.default,
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

/* Les durées de sortie, en accord avec `Toast.module.css` et avec ce que la
   vitrine documente. Elles minutent le RETRAIT du DOM : trop courtes, la carte
   disparaît en plein mouvement ; trop longues, elle reste invisible à occuper
   sa place dans la pile. */
const ANIMATION_MS: Record<ToastAnimation, number> = {
  'slide-from-right': 220,
  'slide-from-left': 220,
  'slide-from-bottom': 240,
  scale: 200,
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

const ToastContext = createContext<ToastContextValue | null>(null);

const cx = (...values: readonly (string | false | null | undefined)[]) =>
  values.filter(Boolean).join(' ');

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
function Carte({
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
    return <div className={cx(rootClassName, className, styles.plain)}>{children}</div>;
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
};

function ToastCard({ toast, onDismiss, onRemove }: ToastCardProps) {
  const {
    animation,
    description,
    dismissed,
    enableLiquidAnimation,
    id,
    liquidGlass,
    onClose,
    title,
    variant,
  } = toast;

  const [paused, setPaused] = useState(false);
  const [entered, setEntered] = useState(false);

  /* Le reste à courir, pas l'échéance. C'est ce qui permet à une reprise de
     repartir d'où la pause a coupé au lieu de rejouer la durée entière — un
     survol involontaire ne doit pas rallonger indéfiniment le séjour d'un
     toast, il doit juste ne pas le raccourcir. */
  const remaining = useRef(toast.duration);
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
      onClose?.();
    }

    const timer = setTimeout(() => onRemove(id), ANIMATION_MS[animation]);
    return () => clearTimeout(timer);
  }, [animation, dismissed, id, onClose, onRemove]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return (
    <div
      className={cx(styles.card, animationClass[animation], dismissed && styles.leaving)}
      data-testid="toast"
      /* Les quatre gestionnaires sont le dispositif WCAG 2.2.1, et il en faut
         quatre : la souris et le doigt passent par le pointeur, le clavier par
         le focus. N'en poser que deux laisserait dehors exactement le public
         que le critère protège. */
      onPointerEnter={pause}
      onPointerLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <Carte
        liquidGlass={liquidGlass}
        rootClassName={cx(styles.surface, variantClass[variant])}
        className={styles.body}
        enableLiquidAnimation={enableLiquidAnimation}
        triggerAnimation={entered}
      >
        <div className={styles.text}>
          {title && <p className={styles.title}>{title}</p>}
          {description && <p className={styles.description}>{description}</p>}
        </div>

        <button
          type="button"
          className={styles.close}
          aria-label="Fermer la notification"
          onClick={() => onDismiss(id)}
        >
          <span aria-hidden="true">×</span>
        </button>
      </Carte>
    </div>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  /* Le message est en anglais et au mot près celui de l'origine : la page de
     vitrine le cite entre guillemets, et un appelant a pu l'écrire dans un
     test à lui. C'est une erreur de développement, pas un texte d'interface —
     elle n'a donc pas à suivre la langue du produit. */
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider = ({
  children,
  duration = 4000,
  animation = 'slide-from-right',
  position = 'top-right',
  enableLiquidAnimation = true,
  liquidGlass = false,
  portalContainer,
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const showToast = useCallback(
    (toast: ToastDefinition) => {
      const id = toast.id ?? generateToastId();

      const record: ToastRecord = {
        ...toast,
        id,
        variant: toast.variant ?? 'default',
        duration: toast.duration ?? duration,
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
           place est le seul comportement qui donne un sens à la prop `id`. */
        const index = previous.findIndex((existing) => existing.id === id);
        if (index === -1) return [...previous, record];

        const next = [...previous];
        next[index] = record;
        return next;
      });

      return id;
    },
    [animation, duration, enableLiquidAnimation, liquidGlass, position],
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
     variante : `error` est la seule chose qui interrompt, tout le reste
     attend son tour. */
  const grouped = useMemo(() => {
    const empty = () => ({ polite: [] as ToastRecord[], assertive: [] as ToastRecord[] });
    const byPosition = Object.fromEntries(POSITIONS.map((key) => [key, empty()])) as Record<
      ToastPosition,
      { polite: ToastRecord[]; assertive: ToastRecord[] }
    >;

    for (const toast of toasts) {
      const bucket = byPosition[toast.position] ?? byPosition['top-right'];
      (ASSERTIVE_VARIANTS.has(toast.variant) ? bucket.assertive : bucket.polite).push(toast);
    }

    for (const key of POSITIONS) {
      if (!NEWEST_FIRST[key]) continue;
      byPosition[key].polite.reverse();
      byPosition[key].assertive.reverse();
    }

    return byPosition;
  }, [toasts]);

  /* Résolu pendant le rendu, comme chez `Modal` : `document.body` ne demande
     pas d'être monté, il demande d'exister. L'amont passait par un effet et un
     `setState`, ce qui retardait le portail d'un tour de rendu pour rien. */
  const portalNode = portalContainer ?? (typeof document === 'undefined' ? null : document.body);

  const renderCard = (toast: ToastRecord) => (
    <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} onRemove={removeToast} />
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {portalNode &&
        createPortal(
          <div className={styles.root} data-testid="toast-portal">
            {POSITIONS.map((key) => (
              <div key={key} className={cx(styles.stack, positionClass[key])}>
                {/* `role="status"` implique `aria-atomic="true"`, ce qui ferait
                    relire TOUTE la pile à chaque arrivée. La remise à `false`
                    est donc obligatoire, pas décorative. `aria-relevant` borne
                    l'annonce aux ajouts : le départ d'une carte n'a rien à
                    dire. */}
                <div
                  className={styles.region}
                  role="status"
                  aria-live="polite"
                  aria-atomic="false"
                  aria-relevant="additions"
                >
                  {grouped[key].polite.map(renderCard)}
                </div>

                <div
                  className={styles.region}
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="false"
                  aria-relevant="additions"
                >
                  {grouped[key].assertive.map(renderCard)}
                </div>
              </div>
            ))}
          </div>,
          portalNode,
        )}
    </ToastContext.Provider>
  );
};
