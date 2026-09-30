import {
  cloneElement,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

import { FloatingSurface } from '../popover/FloatingSurface';
import type { AnchorSide } from '../../shared/anchor-position';
import { floatingLayerOf } from '../../shared/floating-layer';
import { mergeRefs } from '../../shared/merge-refs';
import { PageThemeContext, pageThemeAttributes } from '../../shared/page-theme-context';
import { useAnchorPosition } from '../../shared/use-anchor-position';
import { useControllableState } from '../../shared/use-controllable-state';
import { useDocumentBody } from '../../shared/use-document-body';

import styles from './style/Tooltip.module.css';

/* =============================================================================
   L'INFOBULLE, SELON LE MOTIF « TOOLTIP » DE L'APG ET WCAG 1.4.13.

   CE QU'ELLE EST : UNE DESCRIPTION, JAMAIS UNE INFORMATION ESSENTIELLE. Elle
   n'existe qu'au survol et au focus — rien au toucher, rien pour qui ne pointe
   pas le déclencheur. Ce qu'on ne peut pas se permettre de rater va dans la
   page ; ce qui est interactif va dans un `Popover`. Son contenu n'est pas
   focalisable, et il ne doit pas l'être.

   LE CONTRAT, POINT PAR POINT.

     — L'ENFANT EST LE DÉCLENCHEUR. Un seul élément focalisable, qui reçoit par
       `cloneElement` ses gestionnaires, sa `ref` et `aria-describedby` —
       ajouté à la description qu'il portait déjà, pas à sa place. L'infobulle
       ne rend AUCUN nœud à l'endroit où elle est écrite : ni `<span>` autour
       d'un bouton de barre, ni ancre dans un `<tbody>`.

     — SURVOL AVEC DÉLAI, FOCUS SANS. Le délai (300 ms par défaut) évite le
       clignotement d'un pointeur qui traverse l'interface ; au clavier, le
       focus EST l'intention. Le toucher n'ouvre rien : un doigt qui touche
       un bouton veut l'activer.

     — CONGÉDIABLE, SURVOLABLE, PERSISTANTE (1.4.13). Échap la retire sans
       bouger le pointeur ni le focus, écoutée sur `document` pour couvrir
       l'ouverture au seul survol ; le pointeur peut quitter le déclencheur
       pour la bulle sans qu'elle disparaisse — un court délai de fermeture
       couvre l'écart entre les deux ; elle reste tant qu'on ne la congédie pas.

     — ÉCHAP EST CONSOMMÉ. `preventDefault`, que `Modal` respecte : une
       infobulle ouverte dans une modale se retire seule, la modale reste.

     — UN APPUI LA RETIRE. Cliquer un bouton, c'est l'utiliser ; le focus que
       ce clic donne ne la rouvre pas.

   LE PORTAIL est celui des autres surimpressions : conteneur résolu par
   `useDocumentBody` (rien au serveur ni pendant l'hydratation), thème du
   gabarit par `PageThemeContext`, et couche de la modale quand le
   déclencheur en fait partie (`shared/floating-layer.ts`).
   ========================================================================== */

/** Le côté du déclencheur où se pose la bulle. */
export type TooltipPlacement = AnchorSide;

/** Ce que l'infobulle pose sur son déclencheur. */
export interface TooltipTriggerProps {
  /** Reçoit l'`id` de la bulle quand elle est ouverte, après la valeur du déclencheur. */
  'aria-describedby'?: string;
  /** Appelé avant l'ouverture différée au survol ; un toucher n'ouvre pas la bulle. */
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  /** Appelé avant la fermeture différée. */
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  /** Appelé avant que l'appui ne retire la bulle. */
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  /** Appelé avant l'ouverture au focus clavier. */
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  /** Appelé avant la fermeture à la perte du focus. */
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  /** La référence du déclencheur, fusionnée avec celle qui positionne la bulle. */
  ref?: Ref<HTMLElement>;
}

export type TooltipProps = Omit<ComponentPropsWithoutRef<'div'>, 'content' | 'children'> & {
  /** Le texte de la bulle. Une description courte, jamais une information essentielle. */
  content: ReactNode;
  /** Le déclencheur : un seul élément focalisable, un `<button>` le plus souvent. */
  children: ReactElement<TooltipTriggerProps>;
  /** Le côté préféré ; la bulle bascule du côté opposé si la place manque. Défaut : `top`. */
  placement?: TooltipPlacement;
  /** Le délai avant l'apparition au survol, en millisecondes. Défaut : 300. */
  delay?: number;
  /** Le délai avant la disparition quand le pointeur s'en va, en millisecondes. Défaut : 100. */
  closeDelay?: number;
  /** L'écart entre le déclencheur et la bulle, en pixels. Défaut : 8. */
  offset?: number;
  /** Ouverte ou non ; présente, elle rend l'appelant maître. */
  open?: boolean;
  /** L'état d'ouverture initial, sans contrôle. Défaut : `false`. */
  defaultOpen?: boolean;
  /** Appelée à chaque intention d'ouvrir ou de fermer. */
  onOpenChange?: (open: boolean) => void;
  /** Rend la bulle dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /** Le conteneur du portail. Défaut : `<body>`, ou la couche de la modale englobante. */
  portalContainer?: HTMLElement | null;
  /** La bulle, celle qui porte `role="tooltip"`. */
  ref?: Ref<HTMLDivElement>;
};

/* LES DÉLAIS D'OUVERTURE ET DE FERMETURE, ET LE DRAPEAU D'APPUI. Isolés dans
   un crochet : les minuteries et le drapeau sont des refs, que le rendu ne
   lit jamais — seuls les gestionnaires y touchent. */
function useHoverIntent(
  open: boolean,
  setOpen: (next: boolean) => void,
  delay: number,
  closeDelay: number,
) {
  const openTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /* Vrai entre un appui sur le déclencheur et sa perte de focus : le focus
     donné par un clic n'est pas une demande d'aide. */
  const pressed = useRef(false);

  const cancel = useCallback(() => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => cancel, [cancel]);

  const show = useCallback(() => {
    cancel();
    if (!open) setOpen(true);
  }, [cancel, open, setOpen]);

  const hide = useCallback(() => {
    cancel();
    if (open) setOpen(false);
  }, [cancel, open, setOpen]);

  const scheduleShow = useCallback(() => {
    cancel();
    if (!open) openTimer.current = setTimeout(() => setOpen(true), delay);
  }, [cancel, delay, open, setOpen]);

  const scheduleHide = useCallback(() => {
    cancel();
    if (open) closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [cancel, closeDelay, open, setOpen]);

  const press = useCallback(() => {
    pressed.current = true;
  }, []);
  const release = useCallback(() => {
    pressed.current = false;
  }, []);
  const wasPressed = useCallback(() => pressed.current, []);

  return { show, hide, scheduleShow, scheduleHide, cancel, press, release, wasPressed };
}

const Tooltip = ({
  content,
  children,
  placement = 'top',
  delay = 300,
  closeDelay = 100,
  offset = 8,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  liquidGlass = false,
  portalContainer,
  className,
  id: idProp,
  onPointerEnter,
  onPointerLeave,
  ref,
  ...rest
}: TooltipProps) => {
  const element = isValidElement(children) ? children : null;
  const generatedId = useId();
  const tooltipId = idProp ?? generatedId;
  const [open, setOpen] = useControllableState(openProp, defaultOpen, onOpenChange);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const positionerRef = useRef<HTMLDivElement>(null);
  const { show, hide, scheduleShow, scheduleHide, cancel, press, release, wasPressed } =
    useHoverIntent(open, setOpen, delay, closeDelay);

  /* ÉCHAP SUR `document` : l'infobulle ouverte au seul survol n'a pas le
     focus, et doit pourtant se congédier sans bouger le pointeur. Un Échap
     déjà consommé — un menu, un popover qui se ferme — ne la concerne pas. */
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      hide();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hide, open]);

  const childProps: TooltipTriggerProps = element?.props ?? {};
  const childRef = childProps.ref;
  /* LE DÉCLENCHEUR N'EST RETENU QUE PRÉSENT. Une ref fonction change à chaque
     rendu de l'appelant ; si elle remettait l'état à `null` avant de le
     reposer, chaque rendu en appellerait un autre. */
  const attachTrigger = useCallback(
    (node: HTMLElement | null) =>
      mergeRefs<HTMLElement>((element) => {
        if (element) setTrigger(element);
        return () => {};
      }, childRef)(node),
    [childRef],
  );

  const body = useDocumentBody();
  const container = body && trigger ? (portalContainer ?? floatingLayerOf(trigger, body)) : null;
  const visible = open && container !== null;

  useAnchorPosition(positionerRef, trigger, {
    enabled: visible,
    side: placement,
    align: 'center',
    offset,
  });

  const pageTheme = useContext(PageThemeContext);

  /* APRÈS LES CROCHETS, pour que leur ordre ne dépende de rien. */
  if (!element) {
    throw new Error('Tooltip attend un seul élément comme déclencheur, un bouton le plus souvent.');
  }

  const describedBy = open
    ? [childProps['aria-describedby'], tooltipId].filter(Boolean).join(' ')
    : childProps['aria-describedby'];

  const triggerElement = cloneElement(element, {
    ref: attachTrigger,
    'aria-describedby': describedBy,
    onPointerEnter: (event: PointerEvent<HTMLElement>) => {
      childProps.onPointerEnter?.(event);
      if (event.pointerType !== 'touch') scheduleShow();
    },
    onPointerLeave: (event: PointerEvent<HTMLElement>) => {
      childProps.onPointerLeave?.(event);
      scheduleHide();
    },
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      childProps.onPointerDown?.(event);
      press();
      hide();
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      childProps.onFocus?.(event);
      if (!wasPressed()) show();
    },
    onBlur: (event: FocusEvent<HTMLElement>) => {
      childProps.onBlur?.(event);
      release();
      hide();
    },
  });

  return (
    <>
      {triggerElement}
      {visible &&
        createPortal(
          <div
            ref={positionerRef}
            className={clsx('opale-tooltip', styles.positioner)}
            data-side={placement}
            {...pageThemeAttributes(pageTheme)}
          >
            <FloatingSurface
              {...rest}
              ref={ref}
              liquidGlass={liquidGlass}
              id={tooltipId}
              role="tooltip"
              rootClassName={clsx('opale-tooltip__shell', styles.shell)}
              className={clsx('opale-tooltip__content', styles.content, className)}
              onPointerEnter={(event: PointerEvent<HTMLDivElement>) => {
                onPointerEnter?.(event);
                cancel();
              }}
              onPointerLeave={(event: PointerEvent<HTMLDivElement>) => {
                onPointerLeave?.(event);
                scheduleHide();
              }}
            >
              {content}
            </FloatingSurface>
          </div>,
          container,
        )}
    </>
  );
};

export default Tooltip;
