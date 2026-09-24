import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { createPortal } from 'react-dom';

import Glass, { type GlassProps } from '../glass/Glass';

import { IconGlyph } from '../icon';

import styles from './style/Modal.module.css';

/* =============================================================================
   LA BOÎTE DE DIALOGUE MODALE, ÉCRITE PAR OPALE.

   POURQUOI CE FICHIER A ÉTÉ RÉÉCRIT. Il était copié d'une librairie tierce et
   se présentait comme un motif de dialogue sans en tenir les garanties. Un
   dialogue modal n'est pas un panneau flottant : c'est un contrat avec
   l'utilisateur au clavier et avec les technologies d'assistance, et ce
   contrat a une liste. La version copiée en cochait deux points sur six.

   CE QUI MANQUAIT, ET QUI EST ICI. Dans l'ordre où l'utilisateur les rencontre.

     1. LE FOCUS EST PIÉGÉ. L'amont donnait le focus au panneau puis le
        laissait partir : une tabulation sortait du dialogue et repartait dans
        la page derrière, qui restait pleinement interactive. On tabulait
        « dans » un modal pour se retrouver dans le menu du site. Le piège est
        écrit ici, sur le `keydown` du panneau.

     2. LE FOCUS EST RENDU AU DÉCLENCHEUR. À la fermeture, l'amont laissait le
        focus sur un nœud détruit — le navigateur le renvoie alors sur
        `<body>`, et la tabulation suivante repart du HAUT de la page. Pour
        quelqu'un qui navigue au clavier, fermer un modal faisait perdre sa
        place. L'élément actif est capturé à l'ouverture et restauré au
        nettoyage de l'effet, donc aussi bien à la fermeture qu'au démontage.

     3. L'ARRIÈRE-PLAN EST INERTE. `aria-modal="true"` DÉCLARE que le reste de
        la page est hors-jeu, il ne le FAIT pas : c'est une promesse au lecteur
        d'écran, sans effet sur le clavier ni sur la souris. Les frères du
        conteneur de portail, à chaque niveau jusqu'à `<body>`, reçoivent donc
        `inert` et `aria-hidden` le temps de l'ouverture, et retrouvent
        exactement leur valeur d'avant au nettoyage.

     4. LE BOUTON DE FERMETURE PARLE FRANÇAIS. Il annonçait « close modal » —
        en anglais, dans une librairie dont tout le reste est en français,
        c'est-à-dire dans une langue qui n'est pas celle déclarée par le
        document. Un lecteur d'écran lit alors l'étiquette avec la mauvaise
        voix. C'est désormais « Fermer ».

   CE QUI CHANGE ENCORE, ET POURQUOI.

   — PLUS DE `setState` EN CORPS D'EFFET, donc plus d'`eslint-disable`. L'amont
     attendait DEUX effets avant de rendre quoi que ce soit : un pour un drapeau
     `mounted`, un pour le conteneur de portail. Ce n'était pas un détail de
     style — c'est ce qui faisait qu'un `open` à vrai au premier rendu
     n'affichait RIEN avant le passage des effets. Le conteneur se résout
     maintenant PENDANT le rendu, ce qu'il a toujours pu faire : `document.body`
     ne demande pas d'être monté, il demande d'exister.

     CE QUE CETTE RÉSOLUTION IMMÉDIATE COÛTE, et il faut le dire : le garde
     `typeof document === 'undefined'` reste la seule protection côté serveur.
     Un modal rendu OUVERT au premier rendu d'une hydratation produira donc son
     portail côté client sans équivalent côté serveur. C'est le comportement de
     tous les portails React, et c'est préférable au défaut qu'on retire.

   — LE VERRE EST IMPORTÉ, PAS DÉCRIT. `Glass` porte la matière ; ce fichier ne
     décrit que la silhouette, et il la pose sur `rootClassName`, c'est-à-dire
     sur l'enveloppe qui rogne — voir `Modal.module.css`.

   — `{...rest}` PASSE EN PREMIER. Chez l'amont il passait en DERNIER, donc un
     appelant qui posait `role` ou `tabIndex` écrasait silencieusement ceux du
     dialogue et cassait le motif entier. Les attributs porteurs du contrat
     (`role`, `aria-modal`, `tabIndex`) sont désormais inécrasables ; les noms
     accessibles (`aria-label`, `aria-labelledby`, `aria-describedby`) restent
     surchargeables, parce que là c'est l'appelant qui sait.
   ========================================================================== */

type ModalSize = 'sm' | 'md' | 'lg';

/* `Omit<…, 'title'>` N'EST PAS UNE COQUETTERIE DE TYPAGE.

   `ComponentPropsWithoutRef<'div'>` apporte l'attribut HTML `title`, qui est
   une CHAÎNE. L'intersecter avec `title?: ReactNode` donnait
   `string & ReactNode`, c'est-à-dire une chaîne : la prop annonçait accepter
   un nœud et refusait tout ce qui n'en était pas un. Le type mentait, et
   personne ne s'en apercevait tant qu'aucun appelant n'essayait — le premier
   à passer un titre composé a échoué à la compilation. */
export type ModalProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  lockScroll?: boolean;
  size?: ModalSize;
  enableLiquidAnimation?: boolean;
  portalContainer?: HTMLElement | null;
  /**
   * Rend le panneau dans le matériau « verre liquide ».
   *
   * PAR DÉFAUT IL EST ORIGINAL. Ce composant ne savait rendre que du verre :
   * le matériau est une OPTION de chaque composant d'Opale, jamais son seul
   * état.
   */
  liquidGlass?: boolean;
  /* `GlassProps` REAPPORTE le `title` du `<div>` : il faut l'écarter des DEUX
     côtés, sans quoi l'intersection le ramène à une chaîne. */
} & Omit<GlassProps, 'title'>;

const sizeClass: Record<ModalSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

/* LA LISTE DES ÉLÉMENTS FOCUSABLES, ET SES DEUX LIMITES ASSUMÉES.

   Elle ne filtre NI sur la visibilité NI sur `inert`. Le filtre de visibilité
   demanderait `offsetParent`, qui vaut toujours `null` sous jsdom : le piège
   de focus deviendrait intestable, et un test qui ne teste rien est pire que
   pas de test. Un élément caché à l'intérieur d'un dialogue ouvert reste par
   ailleurs un cas rare ; l'arrière-plan, lui, est traité par `inert`. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex^="-"])',
].join(',');

const cx = (...values: readonly (string | false | null | undefined)[]) =>
  values.filter(Boolean).join(' ');

/* =============================================================================
   LE PANNEAU DU DIALOGUE, DANS LES DEUX MATIÈRES.

   `Glass` distingue l'ENVELOPPE — qui porte la silhouette, la taille et
   l'ombre — du CONTENU, qui porte le remplissage et l'encre. Une boîte pleine
   n'a pas besoin de cette séparation : les deux classes se posent sur le même
   `<div>`. Extraire ce choix ici évite d'écrire deux fois les huit attributs
   du dialogue, qui sont son contrat d'accessibilité.
   ========================================================================== */
type PanneauProps = Omit<GlassProps<'div'>, 'title'> & {
  liquidGlass: boolean;
  /* `ref` EST UNE PROP ORDINAIRE, et ce fichier n'importe pas `forwardRef`.
     React 19 l'a rendu inutile sur un composant de fonction ; l'envelopper
     ici n'apporterait qu'un import de plus. */
  ref?: Ref<HTMLDivElement>;
};

function Panneau({
  liquidGlass,
  ref,
  rootClassName,
  className,
  triggerAnimation,
  children,
  ...rest
}: PanneauProps) {
  if (liquidGlass) {
    return (
      <Glass
        {...rest}
        ref={ref}
        enableLiquidAnimation={false}
        triggerAnimation={triggerAnimation}
        rootClassName={rootClassName}
        className={className}
      >
        {children}
      </Glass>
    );
  }

  return (
    <div {...rest} ref={ref} className={cx(rootClassName, className, styles.plain)}>
      {children}
    </div>
  );
}

const Modal = ({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  footer,
  children,
  closeOnOverlay = true,
  closeOnEsc = true,
  lockScroll = true,
  size = 'md',
  enableLiquidAnimation = true,
  liquidGlass = false,
  className,
  rootClassName,
  portalContainer,
  onClick,
  onKeyDown,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: ModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  /* `HTMLDivElement` ET NON `HTMLElement` : `Glass` rend un `<div>` quand on ne
     lui demande rien d'autre, et sa `ref` est typée d'après l'élément demandé.
     Un `HTMLElement` y serait refusé — une `ref` est contravariante, donc le
     type le plus général n'est pas le plus accueillant. Tout ce que le panneau
     appelle dessus (`focus`, `contains`, `querySelectorAll`) est hérité. */
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  /* L'ONDE D'OUVERTURE SE DEMANDE UNE IMAGE APRÈS LE MONTAGE, ET ELLE N'A PAS
     LE CHOIX. `Glass` lit désormais `triggerAnimation` comme un FRONT — elle
     vient de passer à vrai — et non comme un niveau ; une valeur déjà vraie au
     montage ne déclenche donc rien. Or le panneau est démonté à chaque
     fermeture : il n'y a pas d'autre front disponible que celui qu'on fabrique
     ici.

     Le `setState` vit dans le CALLBACK de `requestAnimationFrame`, pas dans le
     corps de l'effet : c'est exactement la distinction que fait
     `react-hooks/set-state-in-effect`, et c'est pour ça que ce fichier n'a plus
     besoin de la désactiver. Le réarmement, lui, se fait par ajustement d'état
     PENDANT le rendu — même motif que `Glass`, pour la même raison : `Modal`
     reste monté quand il est fermé, donc sans cette remise à zéro la deuxième
     ouverture n'aurait plus de front. */
  const [openRipple, setOpenRipple] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setOpenRipple(false);
  }

  useEffect(() => {
    if (!open || !enableLiquidAnimation) return undefined;
    const frame = requestAnimationFrame(() => setOpenRipple(true));
    return () => cancelAnimationFrame(frame);
  }, [enableLiquidAnimation, open]);

  const handleClose = useCallback(() => {
    onOpenChange?.(false);
    onClose?.();
  }, [onClose, onOpenChange]);

  /* LE VERROU DE DÉFILEMENT RESTAURE LA VALEUR PRÉCÉDENTE, il ne remet pas à
     zéro. Un hôte qui avait déjà posé son propre `overflow` sur `<body>` le
     retrouve intact — une remise à `''` le lui aurait volé au passage. */
  useEffect(() => {
    if (!open || !lockScroll || typeof document === 'undefined') return undefined;

    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = 'hidden';

    return () => {
      style.overflow = previousOverflow;
    };
  }, [lockScroll, open]);

  /* L'ÉCOUTE D'ÉCHAP EST SUR `window`, et c'est ce que documente la vitrine.
     Sur le panneau, elle raterait le cas où le focus a été déplacé hors du
     dialogue par du code de l'appelant. */
  useEffect(() => {
    if (!open || !closeOnEsc) return undefined;

    /* `defaultPrevented` : un contrôle du dialogue a déjà consommé Échap —
       un champ d'édition en place qui rétablit sa valeur, une liste qui se
       replie. Fermer en plus ferait perdre tout le dialogue pour une
       annulation locale. */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeOnEsc, handleClose, open]);

  /* L'INERTIE DE L'ARRIÈRE-PLAN.

     On remonte du conteneur de portail jusqu'à `<body>` et, à chaque niveau,
     on neutralise les FRÈRES. C'est la seule façon correcte : neutraliser
     `<body>` entier neutraliserait aussi le dialogue, qui vit dedans.

     LES DEUX ATTRIBUTS SONT POSÉS, ET CE N'EST PAS UNE CEINTURE-BRETELLES.
     `inert` retire du clavier, de la souris ET de l'arbre d'accessibilité,
     mais il n'est arrivé qu'en 2023 dans Safari ; `aria-hidden` ne fait que
     l'arbre d'accessibilité, mais il est universel. Les deux ensemble couvrent
     le parc ; chacun seul laisse un trou.

     LA VALEUR PRÉCÉDENTE EST MÉMORISÉE, attribut par attribut, parce qu'un
     hôte peut très bien avoir déjà posé `aria-hidden="true"` sur un décor. Le
     nettoyage RESTAURE au lieu de retirer. */
  useEffect(() => {
    if (!open) return undefined;

    const node = containerRef.current;
    if (!node) return undefined;

    const restore: Array<[HTMLElement, string | null, string | null]> = [];

    let level: HTMLElement | null = node;
    while (level && level !== document.body && level.parentElement) {
      for (const sibling of level.parentElement.children) {
        if (sibling === level || !(sibling instanceof HTMLElement)) continue;
        restore.push([sibling, sibling.getAttribute('inert'), sibling.getAttribute('aria-hidden')]);
        sibling.setAttribute('inert', '');
        sibling.setAttribute('aria-hidden', 'true');
      }
      level = level.parentElement;
    }

    return () => {
      for (const [element, inert, hidden] of restore) {
        if (inert === null) element.removeAttribute('inert');
        else element.setAttribute('inert', inert);

        if (hidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', hidden);
      }
    };
  }, [open]);

  /* CET EFFET EST DÉCLARÉ APRÈS CELUI DE L'INERTIE, ET L'ORDRE EST LE CORRECTIF.

     React exécute les nettoyages dans l'ORDRE DE DÉCLARATION des effets.
     Déclaré avant, celui-ci rendait le focus au déclencheur pendant que
     l'arrière-plan portait encore `inert` — et `focus()` sur un élément inerte
     ne fait rien, sans lever d'erreur. Mesuré sur les trois sorties (Échap,
     bouton Fermer, clic sur la toile de fond) : le focus retombait sur
     `<body>`, donc l'utilisateur au clavier repartait du début de la page.

     Le défaut ne se voyait pas : le code était juste, le commentaire annonçait
     le bon comportement, et seul l'ordre de deux blocs le contredisait.

     Le panneau plutôt que le premier bouton : c'est ce que recommande l'APG
     quand le dialogue porte un texte à lire, et c'est ce qui fait annoncer le
     titre et la description avant les actions. La restauration vit dans le
     NETTOYAGE, donc elle couvre les trois sorties — fermeture, démontage du
     parent, et changement de `open` — sans qu'aucune ait à y penser. */
  useEffect(() => {
    if (!open) return undefined;

    const previous = document.activeElement;
    panelRef.current?.focus({ preventScroll: true });

    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [open]);

  /* LE PIÈGE DE FOCUS. Il ne déplace le focus que sur les DEUX bords de la
     liste — début en `Shift+Tab`, fin en `Tab` — et laisse le navigateur faire
     le reste du chemin. Une implémentation qui intercepterait chaque `Tab`
     pour recalculer la cible casserait l'ordre de tabulation naturel, y
     compris celui, non trivial, des contrôles composites.

     Le `keydown` de l'appelant est appelé EN PREMIER, et `defaultPrevented`
     est respecté : un appelant qui gère lui-même la tabulation garde la main. */
  const handlePanelKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);

      if (event.key !== 'Tab' || event.defaultPrevented) return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

      /* Un dialogue sans aucun élément focusable — pas de croix, pas de
         bouton, pas de lien — retient quand même le focus sur son panneau.
         Sans ce cas, la tabulation s'échapperait vers une page devenue inerte,
         c'est-à-dire nulle part. */
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey ? active === first || active === panel : active === last) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    },
    [onKeyDown],
  );

  const handlePanelClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      onClick?.(event);
    },
    [onClick],
  );

  /* Le conteneur de portail est résolu PENDANT le rendu — voir l'en-tête. Le
     garde sur `document` est ce qui garde le composant rendable là où il n'y a
     pas de DOM. */
  const container = portalContainer ?? (typeof document === 'undefined' ? null : document.body);

  if (!open || !container) return null;

  const labelledBy = ariaLabelledBy ?? (title ? titleId : undefined);
  const describedBy = ariaDescribedBy ?? (description ? descriptionId : undefined);
  const showHeader = Boolean(title || description || onClose || onOpenChange);

  return createPortal(
    <div ref={containerRef} className={styles.container} data-testid="modal-container">
      {/* Le voile n'est PAS un bouton, et il ne doit pas en devenir un : il
          porte `aria-hidden` parce que la fermeture qu'il offre à la souris
          existe déjà au clavier, par Échap et par la croix. En faire un
          contrôle exposé ajouterait une tabulation vide avant chaque
          dialogue. La règle jsx-a11y qui réclamerait un rôle sur un `onClick`
          ne se déclenche pas ici, justement parce que l'élément est retiré de
          l'arbre d'accessibilité. */}
      <div
        data-testid="modal-overlay"
        aria-hidden="true"
        className={styles.overlay}
        onClick={closeOnOverlay ? handleClose : undefined}
      />

      {/* LE PANNEAU, DANS L'UNE OU L'AUTRE MATIÈRE.

          Les attributs du dialogue — rôle, `aria-modal`, nom, description,
          `tabIndex` et les deux gestionnaires — sont écrits UNE FOIS et posés
          sur les deux rendus : c'est tout le contrat d'accessibilité du
          composant, et il ne doit pas dépendre d'une apparence. */}
      <Panneau
        {...rest}
        ref={panelRef}
        liquidGlass={liquidGlass}
        triggerAnimation={openRipple}
        rootClassName={cx(styles.shell, sizeClass[size], rootClassName)}
        className={cx(styles.panel, className)}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        onClick={handlePanelClick}
      >
        {showHeader && (
          <div className={styles.header}>
            {/* LE BLOC DE TITRE N'EXISTE QUE S'IL A QUELQUE CHOSE DEDANS.
                `showHeader` est vrai dès qu'il y a un `onClose`, donc un
                dialogue sans titre ni description — une visionneuse d'image,
                par exemple — posait une boîte vide à côté de sa croix, et le
                filet de séparation tirait une ligne pleine largeur sous un
                bouton isolé. La feuille s'accroche à la présence de ce bloc. */}
            {(title || description) && (
              <div className={styles.heading}>
                {title && (
                  <h2 id={titleId} className={styles.title}>
                    {title}
                  </h2>
                )}

                {description && (
                  <p id={descriptionId} className={styles.description}>
                    {description}
                  </p>
                )}
              </div>
            )}

            {(onClose || onOpenChange) && (
              <button
                type="button"
                className={styles.close}
                aria-label="Fermer"
                onClick={handleClose}
              >
                {/* LA CROIX EST UN TRACÉ, PLUS UN CARACTÈRE. « × » est le signe
                    MULTIPLIER : sa barre est plus fine que le reste de
                    l'interface, sa taille dépend de la police installée, et il
                    n'est pas centré dans sa boîte — d'où une croix qui flottait
                    un peu haut et un peu à gauche dans son cercle. Le tracé du
                    jeu d'Opale a l'épaisseur de trait de toutes les autres
                    icônes et se centre sur sa grille. */}
                <IconGlyph name="close" className={styles.closeGlyph} />
              </button>
            )}
          </div>
        )}

        {children && <div className={styles.body}>{children}</div>}

        {footer && <div className={styles.footer}>{footer}</div>}
      </Panneau>
    </div>,
    container,
  );
};

export default Modal;
