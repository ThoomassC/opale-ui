import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

import { ModalDepthContext } from '../modal/modal-stack';
import type { AnchorAlign, AnchorSide } from '../../shared/anchor-position';
import { floatingLayerOf, focusablesIn } from '../../shared/floating-layer';
import { returnFocusAfterRemoval } from '../../shared/focus-return';
import { mergeRefs } from '../../shared/merge-refs';
import { registerOverlay, type OverlayHandle } from '../../shared/overlay-stack';
import { PageThemeContext, pageThemeAttributes } from '../../shared/page-theme-context';
import { activeElementOf } from '../../shared/tree-root';
import { useAnchorPosition } from '../../shared/use-anchor-position';
import { useControllableState } from '../../shared/use-controllable-state';
import { useDocumentBody } from '../../shared/use-document-body';
import { useOutsidePress } from '../../shared/use-outside-press';

import { FloatingSurface } from './FloatingSurface';
import styles from './style/Popover.module.css';

/* =============================================================================
   LE POPOVER, SELON LE MOTIF « DIALOG » DE L'APG, NON MODAL PAR DÉFAUT.

   UN DÉCLENCHEUR ET UN PANNEAU INTERACTIF. Ce que l'infobulle ne peut pas
   porter — un champ, un bouton, un lien — va ici. Le panneau est un
   `role="dialog"` nommé par son déclencheur ; le déclencheur annonce ce qu'il
   ouvre (`aria-haspopup="dialog"`), son état (`aria-expanded`) et, ouvert,
   ce qu'il contrôle (`aria-controls`).

   LE CONTRAT, POINT PAR POINT.

     — LE CLIC BASCULE. Le déclencheur est un `<button>` natif : Entrée et
       Espace l'activent sans une ligne de code.

     — À L'OUVERTURE, LE FOCUS ENTRE : sur le premier élément focalisable du
       panneau, ou sur le panneau lui-même s'il n'en a aucun.

     — ÉCHAP FERME ET REND LE FOCUS AU DÉCLENCHEUR. Il est consommé
       (`preventDefault`) : une modale englobante reste ouverte, un popover
       parent aussi. Le panneau n'écoute que les touches nées DANS son DOM —
       une modale ouverte depuis le panneau lui transmet ses événements par
       l'arbre React, et Échap y appartient à la modale.

     — L'APPUI AU DEHORS FERME, sans voler le focus : l'utilisateur est allé
       ailleurs, il y reste. « Dehors » se lit dans l'arbre React
       (`shared/use-outside-press.ts`) : un popover imbriqué est DEDANS.

     — NON MODAL, LA TABULATION PEUT EN SORTIR, et le popover se ferme en la
       laissant partir : `Maj+Tab` depuis le premier élément rend le focus au
       déclencheur, `Tab` depuis le dernier le pose sur le déclencheur puis
       laisse le navigateur passer au suivant. Le panneau se comporte donc,
       au clavier, comme s'il était inséré juste après son déclencheur.

     — MODAL (`modal`), LE FOCUS EST PIÉGÉ et le reste de la page reçoit
       `inert` et `aria-hidden` par la pile partagée (`overlay-stack.ts`),
       comme sous `Modal` : `aria-modal="true"` n'est posé que parce qu'il est
       tenu.

   LES PARTIES SONT EXPORTÉES SOUS LEUR NOM (`PopoverTrigger`,
   `PopoverContent`) : une référence client ne se lit pas par un point dans un
   Server Component.
   ========================================================================== */

/** Le côté du déclencheur où se pose le panneau. */
export type PopoverPlacement = AnchorSide;
/** L'alignement du panneau sur le déclencheur. */
export type PopoverAlign = AnchorAlign;

interface PopoverContextValue {
  readonly open: boolean;
  readonly setOpen: (next: boolean) => void;
  readonly modal: boolean;
  readonly triggerId: string;
  readonly contentId: string;
  readonly trigger: HTMLElement | null;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly registerTrigger: (node: HTMLElement | null) => () => void;
  readonly markInside: () => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext(part: string): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (!context) throw new Error(`${part} doit être rendu à l’intérieur de Popover.`);
  return context;
}

export interface PopoverProps {
  /** Ouvert ou non ; présent, il rend l'appelant maître. */
  open?: boolean;
  /** L'état d'ouverture initial, sans contrôle. Défaut : `false`. */
  defaultOpen?: boolean;
  /** Appelée à chaque intention d'ouvrir ou de fermer. */
  onOpenChange?: (open: boolean) => void;
  /** Piège le focus et rend le reste de la page inerte. Défaut : `false`. */
  modal?: boolean;
  /** `PopoverTrigger` et `PopoverContent`, dans n'importe quelle mise en page. */
  children?: ReactNode;
}

/** La racine : elle tient l'état, et ne rend aucun élément. */
function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  modal = false,
  children,
}: PopoverProps) {
  const [open, setOpen] = useControllableState(openProp, defaultOpen, onOpenChange);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const baseId = useId();

  /* LE DÉCLENCHEUR N'EST RETENU QUE PRÉSENT : un retour à `null` suivi d'une
     nouvelle valeur, à chaque changement de ref de l'appelant, coûterait un
     rendu par rendu. La ref objet, elle, suit exactement le DOM. */
  const registerTrigger = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
    if (node) setTrigger(node);
    return () => {
      triggerRef.current = null;
    };
  }, []);

  const close = useCallback(() => setOpen(false), [setOpen]);
  const { markInside } = useOutsidePress(open, close);

  const context = useMemo<PopoverContextValue>(
    () => ({
      open,
      setOpen,
      modal,
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
      trigger,
      triggerRef,
      registerTrigger,
      markInside,
    }),
    [baseId, markInside, modal, open, registerTrigger, setOpen, trigger],
  );

  return <PopoverContext.Provider value={context}>{children}</PopoverContext.Provider>;
}

export type PopoverTriggerProps = ComponentPropsWithoutRef<'button'> & {
  /** La référence du bouton déclencheur, fusionnée avec celle du panneau. */
  ref?: Ref<HTMLButtonElement>;
};

/** Le bouton qui ouvre et ferme le panneau. Sans style propre : posez la classe d'un bouton. */
function PopoverTrigger({
  ref,
  className,
  id,
  type = 'button',
  onClick,
  onPointerDown,
  onKeyDown,
  ...rest
}: PopoverTriggerProps) {
  const { open, setOpen, triggerId, contentId, registerTrigger, markInside } =
    usePopoverContext('PopoverTrigger');
  const refs = useCallback(
    (node: HTMLButtonElement | null) => mergeRefs<HTMLButtonElement>(registerTrigger, ref)(node),
    [ref, registerTrigger],
  );

  return (
    <button
      {...rest}
      ref={refs}
      type={type}
      id={id ?? triggerId}
      className={clsx('opale-popover__trigger', className)}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(event);
        markInside();
      }}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(!open);
      }}
      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event);
        if (event.key === 'Escape' && open && !event.defaultPrevented) {
          event.preventDefault();
          setOpen(false);
        }
      }}
    />
  );
}

export type PopoverContentProps = ComponentPropsWithoutRef<'div'> & {
  /** Le côté préféré ; le panneau bascule du côté opposé si la place manque. Défaut : `bottom`. */
  placement?: PopoverPlacement;
  /** L'alignement sur le déclencheur. Défaut : `center`. */
  align?: PopoverAlign;
  /** L'écart entre le déclencheur et le panneau, en pixels. Défaut : 8. */
  offset?: number;
  /** Rend le panneau dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /** Le conteneur du portail. Défaut : `<body>`, ou la couche de la modale englobante. */
  portalContainer?: HTMLElement | null;
  /** Le panneau, celui qui porte `role="dialog"`. */
  ref?: Ref<HTMLDivElement>;
};

/** Le panneau, rendu dans un portail contre son déclencheur. */
function PopoverContent({
  placement = 'bottom',
  align = 'center',
  offset = 8,
  liquidGlass = false,
  portalContainer,
  className,
  children,
  onKeyDown,
  onPointerDown,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ref,
  ...rest
}: PopoverContentProps) {
  const { open, setOpen, modal, contentId, trigger, triggerRef, markInside } =
    usePopoverContext('PopoverContent');
  const positionerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  /* LE FOCUS REVIENT AU DÉCLENCHEUR S'IL ÉTAIT DANS LE PANNEAU AU RETRAIT —
     fermeture par l'appelant, démontage du parent. Il ne revient pas s'il est
     déjà parti ailleurs : un appui au dehors l'a donné à ce qu'il visait. En
     modal, c'est la pile des surimpressions qui le rend. */
  const panelRefs = useCallback(
    (node: HTMLDivElement | null) => {
      const release = mergeRefs(panelRef, ref)(node);
      return () => {
        if (node && !modal) returnFocusAfterRemoval(node, triggerRef);
        if (typeof release === 'function') release();
      };
    },
    [modal, ref, triggerRef],
  );

  const body = useDocumentBody();
  const container = body && trigger ? (portalContainer ?? floatingLayerOf(trigger, body)) : null;
  const visible = open && container !== null;

  useAnchorPosition(positionerRef, trigger, { enabled: visible, side: placement, align, offset });

  /* MODAL : L'INERTIE PUIS LE FOCUS, DANS CET ORDRE — même raison que sous
     `Modal` : les nettoyages suivent l'ordre de déclaration, et rendre le
     focus à un déclencheur encore inerte ne ferait rien. */
  const depth = useContext(ModalDepthContext) + 1;
  const overlayRef = useRef<OverlayHandle | null>(null);
  useEffect(() => {
    const node = positionerRef.current;
    if (!visible || !modal || !node) return undefined;
    const overlay = registerOverlay(node, depth, panelRef.current);
    overlayRef.current = overlay;
    return () => {
      overlay.release();
      if (overlayRef.current === overlay) overlayRef.current = null;
    };
  }, [depth, modal, visible]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!visible || !panel) return undefined;
    const overlay = modal ? overlayRef.current : null;
    overlay?.captureReturnFocus();
    (focusablesIn(panel)[0] ?? panel).focus({ preventScroll: true });
    return overlay ? () => overlay.restoreFocus() : undefined;
  }, [modal, visible]);

  const pageTheme = useContext(PageThemeContext);

  if (!visible) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const panel = event.currentTarget;
    /* Une touche née hors du DOM du panneau — dans une modale ouverte depuis
       lui — remonte l'arbre React jusqu'ici ; elle ne le concerne pas. */
    if (event.defaultPrevented || !(event.target instanceof Node) || !panel.contains(event.target))
      return;

    if (event.key === 'Escape') {
      event.preventDefault();
      if (!modal) triggerRef.current?.focus();
      setOpen(false);
      return;
    }

    if (event.key !== 'Tab') return;
    const focusables = focusablesIn(panel);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = activeElementOf(panel);
    const atStart = !first || active === first || active === panel;
    const atEnd = !last || active === last;

    if (modal) {
      if (!first || !last) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
      } else if (event.shiftKey ? atStart : atEnd) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
      return;
    }

    if (event.shiftKey ? atStart : atEnd) {
      /* `Maj+Tab` s'arrête sur le déclencheur ; `Tab` part de lui vers le
         suivant, déplacement que fait le navigateur. */
      if (event.shiftKey) event.preventDefault();
      triggerRef.current?.focus();
      setOpen(false);
    }
  };

  const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : trigger?.id || undefined);

  return createPortal(
    <ModalDepthContext.Provider value={modal ? depth : depth - 1}>
      <div
        ref={positionerRef}
        className={clsx('opale-popover', styles.positioner)}
        data-side={placement}
        {...pageThemeAttributes(pageTheme)}
      >
        <FloatingSurface
          {...rest}
          ref={panelRefs}
          liquidGlass={liquidGlass}
          id={contentId}
          role="dialog"
          aria-modal={modal ? 'true' : undefined}
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          tabIndex={-1}
          rootClassName={clsx('opale-popover__shell', styles.shell)}
          className={clsx('opale-popover__panel', styles.panel, className)}
          onKeyDown={handleKeyDown}
          onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
            onPointerDown?.(event);
            markInside();
          }}
        >
          {children}
        </FloatingSurface>
      </div>
    </ModalDepthContext.Provider>,
    container,
  );
}

export default Popover;

/* LES PARTIES SOUS LEUR PROPRE NOM, pour les Server Components. */
export { PopoverTrigger, PopoverContent };
