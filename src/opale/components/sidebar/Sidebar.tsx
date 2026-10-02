import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type FocusEvent,
  type ForwardRefExoticComponent,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefAttributes,
} from 'react';
import clsx from 'clsx';

import { warnDeprecatedProps } from '../../deprecations';
import Glass, { type GlassSurfaceProps, type LegacySurfaceAnimationProps } from '../glass/Glass';
import type { OpaleSize } from '../../shared';
import { resolveLabels } from '../../shared/labels';
import { mergeRefs } from '../../shared/merge-refs';
import {
  navigateOnClick,
  shouldHandleNavigation,
  type NavigateHandler,
} from '../../shared/navigate';
import { useControllableState } from '../../shared/use-controllable-state';
import styles from './style/Sidebar.module.css';

/* =============================================================================
   LE RAIL LATÉRAL, ÉCRIT PAR OPALE.

   POURQUOI CE FICHIER A ÉTÉ RÉÉCRIT. Il était copié d'une librairie tierce. Le
   propriétaire veut l'indépendance du paquet ; et un rail de navigation est
   précisément le genre de composant qu'on ne peut pas se permettre de subir,
   parce que ses défauts sont des défauts d'ACCESSIBILITÉ — ils ne se voient
   pas à l'écran, ils s'entendent.

   L'INTERFACE PUBLIQUE NE BOUGE PAS. `SidebarProps`, `SidebarHeaderProps`,
   `SidebarFooterProps`, `SidebarItemsProps`, `SidebarItemProps`,
   `SidebarToggleProps` gardent leurs noms, leurs props et leur comportement ;
   `collapsed`, `activeItemId`, leurs pendants non contrôlés, `onToggle` et
   `onSelectItem` se comportent exactement comme avant.

   QUATRE DÉFAUTS CORRIGÉS, ET CHACUN SE CONSTATE.

   1. UNE ENTRÉE REPLIÉE PERDAIT SON NOM. Le libellé était retiré du DOM au
      repli, et le nom accessible rattrapé par un `aria-label` calculé depuis
      les enfants — mais seulement `typeof children === 'string'`. Toute entrée
      dont le libellé passait par un élément (une traduction, un `<span>`, du
      texte enrichi) devenait un bouton ANONYME dès qu'on repliait le rail.
      Le libellé est désormais toujours rendu, et seulement masqué à l'œil.

   2. LE `<nav>` N'AVAIT PAS DE NOM. Un rail non nommé s'annonce « navigation »
      tout court, ce qui ne distingue rien dans une page qui en compte deux ou
      trois. `Sidebar.Items` porte un `aria-label` par défaut, que l'appelant
      remplace — et doit remplacer dès qu'il y a plusieurs rails.

   3. L'ENTRÉE RETENUE N'ÉTAIT QU'UNE CLASSE. Rien ne la signalait à un lecteur
      d'écran : `aria-current="page"` le dit maintenant.

   4. LA BASCULE DE REPLI NE DISAIT PAS SON ÉTAT. Son nom changeait
      (« collapse » / « expand »), ce qui s'entend au moment où on l'actionne,
      mais rien ne répondait à « est-ce ouvert ? » posé à froid.
      `aria-expanded` et `aria-controls` le disent.

   UN DÉFAUT DE TYPAGE CORRIGÉ AUSSI, et la page de la vitrine en parlait :
   `SidebarProps` étendait `ComponentPropsWithoutRef<'aside'>` en entier, qui
   apporte le `onToggle` du DOM — celui de `<details>`. TypeScript intersectait
   les deux signatures et le paramètre de `onToggle` arrivait en
   `boolean | ToggleEvent<HTMLElement>` : passer un `setCollapsed` de React ne
   compilait pas. Le `onToggle` du DOM est retiré, et l'on récupère la signature
   qui était documentée depuis le début.

   UNE ENTRÉE PEUT ÊTRE UN LIEN (2.10, DX-02). Sans `href`, l'entrée reste un
   `<button>`, au contrat inchangé. Avec `href`, elle rend un `<a>` : clic du
   milieu, ouverture dans un onglet et « copier l'adresse » redeviennent
   possibles, et `Sidebar.onNavigate` remet le clic simple au routeur de
   l'application, avec la règle commune de `shared/navigate.ts`. Le rappel
   déprécié `onSelectItem`, typé sur un `<button>`, ne part pas d'un lien.
   ========================================================================== */

type SidebarSize = OpaleSize;

/** Les textes du rail, transmis par le contexte à `Sidebar.Items` et `Sidebar.Toggle`. */
export interface SidebarLabels {
  /** Le nom du repère `Sidebar.Items`. Défaut : « Navigation latérale ». */
  items: string;
  /** Le nom de la bascule quand le rail est replié. Défaut : « Déplier le rail ». */
  expand: string;
  /** Le nom de la bascule quand le rail est déplié. Défaut : « Replier le rail ». */
  collapse: string;
  /** Le nom de la barre de défilement (`customScrollbar`). Défaut : « Défilement du rail ». */
  scroll: string;
  /** Ce que la barre annonce tout en haut. Défaut : « Début du rail ». */
  scrollStart: string;
  /** Le nom de la poignée de largeur (`resizable`). Défaut : « Largeur du rail ». */
  resize: string;
  /** Le bouton qui déplie le rail en format mobile (`mobile`). Défaut : « Sommaire ». */
  menu: string;
  /** Le nom de la rangée de raccourcis vers les parties. Défaut : « Parties du rail ». */
  shortcuts: string;
}

/* EN FRANÇAIS, COMME LE RESTE DE LA BIBLIOTHÈQUE : lu avec la voix française
   du document, un nom anglais devient inintelligible (WCAG 3.1.2). */
const DEFAULT_SIDEBAR_LABELS: SidebarLabels = {
  items: 'Navigation latérale',
  expand: 'Déplier le rail',
  collapse: 'Replier le rail',
  scroll: 'Défilement du rail',
  scrollStart: 'Début du rail',
  resize: 'Largeur du rail',
  menu: 'Sommaire',
  shortcuts: 'Parties du rail',
};

/** Une partie du rail, telle qu'elle s'inscrit pour les raccourcis du format mobile. */
type SidebarGroupEntry = { id: string; label: string; reveal: () => void };

/* Les largeurs des trois tailles, en pixels, celles de la feuille
   (12,5 · 16,25 · 20 rem) : le point de départ d'un rail `resizable`. */
const SIZE_WIDTH: Record<SidebarSize, number> = { small: 200, medium: 260, large: 320 };
const RESIZE_STEP = 16;

export type SidebarContextValue = {
  size: SidebarSize;
  collapsed: boolean;
  collapsible: boolean;
  toggleCollapsed: () => void;
  handleItemSelect: (itemId: string, event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Retient une entrée lien et prévient `onValueChange`, sans `onSelectItem`.
   * Facultatif : une valeur écrite pour 3.9 compile encore.
   */
  selectLink?: (itemId: string) => void;
  /** Le crochet du routeur, pour les entrées avec `href`. */
  onNavigate?: NavigateHandler<SidebarNavigationTarget>;
  /** L'entrée retenue, absente quand aucune ne l'est. */
  value?: string;
  /** @deprecated Depuis 2.6 — utilisez `value`. */
  activeItemId?: string;
  /** L'identifiant de l'`<aside>`, pour l'`aria-controls` de la bascule. */
  sidebarId: string;
  /** Les textes effectifs du rail ; absents, les défauts français s'appliquent. */
  labels?: SidebarLabels;
  /** Inscrit ou met à jour une partie, pour les raccourcis du format mobile. */
  upsertGroup?: (entry: SidebarGroupEntry) => void;
  /** Retire une partie démontée. */
  removeGroup?: (id: string) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const useSidebarContext = (component: string) => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error(`${component} must be used within Sidebar`);
  }

  return context;
};

/** La destination d'une entrée lien, telle que `Sidebar.onNavigate` la reçoit. */
type SidebarNavigationTarget = { readonly id: string; readonly href: string };

export type SidebarProps = Omit<ComponentPropsWithoutRef<'aside'>, 'onToggle' | 'defaultValue'> & {
  /** La largeur et la densité du rail. Défaut : `medium`. */
  size?: SidebarSize;
  /** Le pli contrôlé. À accompagner de `onCollapsedChange`. */
  collapsed?: boolean;
  /** Le pli de départ en mode non contrôlé. Défaut : `false`. */
  defaultCollapsed?: boolean;
  /** Autorise le pli par `Sidebar.Toggle`. Défaut : `false` : la bascule n'a alors aucun effet. */
  collapsible?: boolean;
  /** Appelée à chaque bascule du pli, avec le nouvel état. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** @deprecated Depuis 2.6 — utilisez `onCollapsedChange`. */
  onToggle?: (collapsed: boolean) => void;
  /** L'entrée retenue. Présente, l'appelant la tient ; `null` : aucune. */
  value?: string | null;
  /** L'entrée retenue au montage quand `value` est absente. */
  defaultValue?: string | null;
  /** Appelée à chaque sélection d'une entrée, même celle déjà retenue. */
  onValueChange?: (itemId: string) => void;
  /**
   * Le crochet du routeur côté client, pour les entrées avec `href`. Sur un
   * clic gauche simple, le rail retient l'entrée, annule la navigation native
   * puis l'appelle avec `{ id, href }` ; Ctrl, Cmd, Maj, Alt, le clic du milieu
   * et `target` vers un autre onglet restent au navigateur, sans rien retenir.
   * Next.js : `(item) => router.push(item.href)` ; React Router :
   * `(item) => navigate(item.href)`.
   */
  onNavigate?: NavigateHandler<SidebarNavigationTarget>;
  /** @deprecated Depuis 2.6 — utilisez `value`. */
  activeItemId?: string;
  /** @deprecated Depuis 2.6 — utilisez `defaultValue`. */
  defaultActiveItemId?: string;
  /** @deprecated Depuis 2.6 — utilisez `onValueChange`. */
  onSelectItem?: (itemId: string, event: MouseEvent<HTMLButtonElement>) => void;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<SidebarLabels>;
  /**
   * Rend le rail dans le matériau « verre liquide ».
   *
   * PAR DÉFAUT IL EST ORIGINAL. Ce composant ne savait rendre que du verre :
   * le matériau est une OPTION de chaque composant d'Opale, jamais son seul
   * état.
   */
  liquidGlass?: boolean;
  /**
   * Une barre de défilement dessinée par Opale, celle du sommaire de la
   * documentation : un curseur qu'on glisse, une piste, et le clavier (flèches,
   * pages, début, fin) quand elle a le focus. Le contenu du rail défile dans
   * sa propre zone ; le rail doit donc recevoir une hauteur de son hôte.
   * Défaut : `false`, la barre du navigateur.
   */
  customScrollbar?: boolean;
  /**
   * Une poignée sur le bord du rail règle sa largeur, au glisser et au
   * clavier (flèches, Début, Fin). Le rail est alors enveloppé d'un cadre
   * (`.opale-sidebar__frame`) qui porte la poignée et prend la hauteur de sa
   * colonne ; `rootStyle` et `rootClassName` restent sur le rail, dans le
   * cadre. Sans effet rail plié. Défaut : `false`.
   */
  resizable?: boolean;
  /** La largeur pilotée, en pixels, avec `resizable`. */
  width?: number;
  /** La largeur de départ, en pixels. Défaut : celle de `size` (200, 260 ou 320). */
  defaultWidth?: number;
  /** La largeur minimale, en pixels. Défaut : 224. */
  minWidth?: number;
  /** La largeur maximale, en pixels. Défaut : 480. */
  maxWidth?: number;
  /** Appelée à chaque changement de largeur, au glisser comme au clavier. */
  onWidthChange?: (width: number) => void;
  /**
   * Le format mobile du sommaire de la documentation : un bouton « Sommaire »
   * qui déplie le rail, une rangée de raccourcis vers chaque `Sidebar.Group`,
   * puis le rail en pleine largeur, sans poignée. Échap le replie et rend le
   * focus au bouton. `auto` l'adopte sous 30 rem de fenêtre ; `menu` toujours
   * (un cadre étroit, un exemple) ; `off` jamais. Défaut : `off`.
   */
  mobile?: 'off' | 'auto' | 'menu';
} & Pick<GlassSurfaceProps, 'rootClassName' | 'rootStyle'> &
  LegacySurfaceAnimationProps;

const widthClassMap: Record<SidebarSize, string> = {
  small: styles.small,
  medium: styles.medium,
  large: styles.large,
};

/*
 * LA ZONE QUI DÉFILE ET SA BARRE — LE SOMMAIRE DE LA DOCUMENTATION, EN PIÈCE.
 *
 * Le curseur est un indicateur : sa taille, sa position et l'état ARIA de la
 * barre sont écrits dans le DOM à chaque défilement, sans rendu React — un
 * état par événement de molette rerendait toutes les entrées.
 *
 * La barre est focalisable (`role="scrollbar"`) : les flèches avancent de 80 %
 * d'une vue, Page précédente et suivante d'une vue entière, Début et Fin
 * mènent aux bouts. Rail plié, elle disparaît : il ne reste que des icônes.
 */
function SidebarScrollArea({
  id,
  collapsed,
  labels,
  children,
}: {
  id: string;
  collapsed: boolean;
  labels: SidebarLabels;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const maxRef = useRef(0);
  const dragRef = useRef<{ pointerId: number; startY: number; start: number; travel: number }>(
    null,
  );

  useEffect(() => {
    const area = scrollRef.current;
    if (!area) return;
    const update = () => {
      const view = area.clientHeight;
      /* Sous 2 px d'écart, c'est un arrondi, pas un contenu qui dépasse ; une
         zone de hauteur nulle n'est pas encore mesurée. Dans les deux cas,
         rien ne défile et la barre reste cachée. */
      const overflow = area.scrollHeight - view;
      const max = view > 0 && overflow >= 2 ? overflow : 0;
      maxRef.current = max;
      const size = max === 0 || !view ? 1 : Math.max(0.14, Math.min(1, view / area.scrollHeight));
      const offset = max === 0 ? 0 : (area.scrollTop / max) * (1 - size);
      const bar = barRef.current;
      if (!bar) return;
      bar.style.setProperty('--opale-sidebar-thumb-size', `${size * 100}%`);
      bar.style.setProperty('--opale-sidebar-thumb-offset', `${offset * 100}%`);
      bar.dataset.idle = max === 0 ? 'true' : 'false';
      bar.setAttribute('aria-valuemax', String(Math.round(max)));
      bar.setAttribute('aria-valuenow', String(Math.round(area.scrollTop)));
      bar.setAttribute(
        'aria-valuetext',
        max === 0 ? labels.scrollStart : `${Math.round((area.scrollTop / max) * 100)} %`,
      );
    };
    update();
    area.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    observer?.observe(area);
    if (area.firstElementChild) observer?.observe(area.firstElementChild);
    return () => {
      area.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [collapsed, labels.scrollStart]);

  const scrollTo = (top: number) => {
    const area = scrollRef.current;
    if (area) area.scrollTop = Math.max(0, Math.min(maxRef.current, top));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    const area = scrollRef.current;
    if (!area || maxRef.current === 0) return;
    const view = area.clientHeight;
    const targets: Record<string, number> = {
      ArrowUp: area.scrollTop - Math.max(24, view * 0.8),
      ArrowDown: area.scrollTop + Math.max(24, view * 0.8),
      PageUp: area.scrollTop - view,
      PageDown: area.scrollTop + view,
      Home: 0,
      End: maxRef.current,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    scrollTo(targets[event.key] as number);
  };

  return (
    <>
      <div ref={scrollRef} id={id} className={clsx('opale-sidebar__scroll', styles.scroll)}>
        {children}
      </div>
      {!collapsed && (
        <span
          ref={barRef}
          role="scrollbar"
          aria-label={labels.scroll}
          aria-controls={id}
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={0}
          aria-valuenow={0}
          aria-valuetext={labels.scrollStart}
          tabIndex={0}
          className={clsx('opale-sidebar__scrollbar', styles.scrollbar)}
          onKeyDown={onKeyDown}
        >
          <span
            className={clsx('opale-sidebar__scrollbar-thumb', styles.scrollbarThumb)}
            onPointerDown={(event) => {
              const bar = barRef.current;
              const area = scrollRef.current;
              if (!bar || !area || maxRef.current === 0) return;
              dragRef.current = {
                pointerId: event.pointerId,
                startY: event.clientY,
                start: area.scrollTop,
                travel: Math.max(
                  1,
                  bar.getBoundingClientRect().height -
                    event.currentTarget.getBoundingClientRect().height,
                ),
              };
              event.currentTarget.setPointerCapture?.(event.pointerId);
              event.preventDefault();
            }}
            onPointerMove={(event) => {
              const drag = dragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              scrollTo(drag.start + ((event.clientY - drag.startY) / drag.travel) * maxRef.current);
            }}
            onPointerUp={(event) => {
              if (dragRef.current?.pointerId !== event.pointerId) return;
              event.currentTarget.releasePointerCapture?.(event.pointerId);
              dragRef.current = null;
            }}
            onPointerCancel={() => {
              dragRef.current = null;
            }}
          />
        </span>
      )}
    </>
  );
}

/*
 * LA POIGNÉE DE LARGEUR — `role="separator"` focalisable, le motif ARIA du
 * séparateur de fenêtre : sa valeur est la largeur du rail qu'elle contrôle.
 * Au glisser, le rail suit le pointeur ; au clavier, les flèches avancent de
 * 16 px (32 avec Maj), Début et Fin mènent aux bornes. En écriture de droite
 * à gauche, le bord est à gauche : le sens du glisser et des flèches
 * horizontales s'inverse.
 */
function SidebarResizeHandle({
  width,
  min,
  max,
  label,
  controls,
  onChange,
}: {
  width: number;
  min: number;
  max: number;
  label: string;
  controls: string;
  onChange: (width: number) => void;
}) {
  const dragRef = useRef<{ pointerId: number; startX: number; start: number; dir: number }>(null);
  const rtl = (element: Element) => getComputedStyle(element).direction === 'rtl';

  /* Un séparateur FOCALISABLE est interactif (ARIA 1.2, motif « Window
     Splitter ») ; jsx-a11y ne connaît que le séparateur statique. */
  /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
  return (
    <div
      role="separator"
      aria-label={label}
      aria-controls={controls}
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={width}
      aria-valuetext={`${width} px`}
      tabIndex={0}
      className={clsx('opale-sidebar__resize', styles.resize)}
      onKeyDown={(event) => {
        const step = event.shiftKey ? RESIZE_STEP * 2 : RESIZE_STEP;
        const dir = rtl(event.currentTarget) ? -1 : 1;
        const targets: Record<string, number> = {
          ArrowLeft: width - step * dir,
          ArrowRight: width + step * dir,
          ArrowDown: width - step,
          ArrowUp: width + step,
          Home: min,
          End: max,
        };
        if (!(event.key in targets)) return;
        event.preventDefault();
        onChange(targets[event.key] as number);
      }}
      onPointerDown={(event) => {
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          start: width,
          dir: rtl(event.currentTarget) ? -1 : 1,
        };
        event.currentTarget.parentElement?.setAttribute('data-resizing', 'true');
        event.currentTarget.setPointerCapture?.(event.pointerId);
        event.preventDefault();
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        onChange(drag.start + (event.clientX - drag.startX) * drag.dir);
      }}
      onPointerUp={(event) => {
        if (dragRef.current?.pointerId !== event.pointerId) return;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        event.currentTarget.parentElement?.removeAttribute('data-resizing');
        dragRef.current = null;
      }}
      onPointerCancel={(event) => {
        event.currentTarget.parentElement?.removeAttribute('data-resizing');
        dragRef.current = null;
      }}
    >
      <span aria-hidden="true" />
    </div>
  );
  /* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
}

const SidebarBase = forwardRef<HTMLElement, SidebarProps>(
  (
    {
      size = 'medium',
      collapsed: collapsedProp,
      defaultCollapsed = false,
      collapsible = false,
      onCollapsedChange,
      onToggle,
      value: valueProp,
      defaultValue,
      onValueChange,
      onNavigate,
      activeItemId: activeItemIdProp,
      defaultActiveItemId,
      onSelectItem,
      labels: labelsProp,
      liquidGlass = false,
      customScrollbar = false,
      resizable = false,
      width: widthProp,
      defaultWidth,
      minWidth = 224,
      maxWidth = 480,
      onWidthChange,
      mobile = 'off',
      className,
      rootClassName,
      rootStyle,
      style,
      enableLiquidAnimation: enableLiquidAnimationProp,
      triggerAnimation: triggerAnimationProp,
      children,
      id,
      ...rest
    },
    ref,
  ) => {
    /* Les valeurs BRUTES, avant leur défaut : une prop absente n'avertit pas. */
    warnDeprecatedProps('Sidebar', {
      onToggle,
      activeItemId: activeItemIdProp,
      defaultActiveItemId,
      onSelectItem,
      enableLiquidAnimation: enableLiquidAnimationProp,
      triggerAnimation: triggerAnimationProp,
    });
    const enableLiquidAnimation = enableLiquidAnimationProp ?? false;
    const triggerAnimation = triggerAnimationProp ?? false;
    /* LES DEUX ÉTATS SONT CONTRÔLABLES SÉPARÉMENT, et le motif est le même pour
       les deux : une prop présente rend l'appelant maître, une prop absente
       laisse le composant se souvenir. Le rappel part dans les DEUX cas — un
       appelant non contrôlé veut savoir ce qui s'est passé, même s'il n'a rien
       à ranger. */
    const [collapsed, setCollapsedState] = useControllableState(collapsedProp, defaultCollapsed);

    const setCollapsed = useCallback(
      (next: boolean) => {
        setCollapsedState(next);
        onCollapsedChange?.(next);
        onToggle?.(next);
      },
      [setCollapsedState, onCollapsedChange, onToggle],
    );

    const handleToggle = useCallback(() => {
      if (!collapsible) {
        return;
      }

      setCollapsed(!collapsed);
    }, [collapsible, collapsed, setCollapsed]);

    /* Le nom canonique gagne : `value` d'abord, puis l'ancien `activeItemId`.
       `null` est une valeur contrôlée, d'où la comparaison à `undefined`. */
    const [active, setActive] = useControllableState<string | null>(
      valueProp !== undefined ? valueProp : activeItemIdProp,
      defaultValue !== undefined ? defaultValue : (defaultActiveItemId ?? null),
    );
    const activeItemId = active ?? undefined;

    const handleItemSelect = useCallback(
      (itemId: string, event: MouseEvent<HTMLButtonElement>) => {
        setActive(itemId);
        onValueChange?.(itemId);
        onSelectItem?.(itemId, event);
      },
      [setActive, onValueChange, onSelectItem],
    );

    const selectLink = useCallback(
      (itemId: string) => {
        setActive(itemId);
        onValueChange?.(itemId);
      },
      [setActive, onValueChange],
    );

    /* `useId` EST APPELÉ INCONDITIONNELLEMENT, et l'`id` de l'appelant gagne
       ensuite. Un crochet ne se met pas derrière un `??` : l'ordre des crochets
       doit être le même à chaque rendu, y compris celui où l'appelant passe
       enfin son propre identifiant. */
    const generatedId = useId();
    const sidebarId = id ?? generatedId;
    const { items, expand, collapse, scroll, scrollStart, resize, menu, shortcuts } = resolveLabels(
      DEFAULT_SIDEBAR_LABELS,
      labelsProp,
    );
    /* Mémorisé sur les chaînes : un `labels` littéral recréé à chaque rendu ne
       doit pas renouveler le contexte. */
    const labels = useMemo<SidebarLabels>(
      () => ({ items, expand, collapse, scroll, scrollStart, resize, menu, shortcuts }),
      [items, expand, collapse, scroll, scrollStart, resize, menu, shortcuts],
    );

    /* LES PARTIES INSCRITES, pour les raccourcis du format mobile. Une mise à
       jour qui ne change rien rend le même tableau : React n'en refait pas le
       rendu. */
    const [groups, setGroups] = useState<readonly SidebarGroupEntry[]>([]);
    const upsertGroup = useCallback((entry: SidebarGroupEntry) => {
      setGroups((current) => {
        const index = current.findIndex((group) => group.id === entry.id);
        if (index >= 0 && current[index]?.label === entry.label) return current;
        if (index < 0) return [...current, entry];
        const next = [...current];
        next[index] = entry;
        return next;
      });
    }, []);
    const removeGroup = useCallback((groupId: string) => {
      setGroups((current) => current.filter((group) => group.id !== groupId));
    }, []);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuToggleRef = useRef<HTMLButtonElement>(null);
    const frameRef = useRef<HTMLDivElement>(null);

    /* ÉCHAP REPLIE LE RAIL DÉPLIÉ quand le focus est dedans, et rend le focus
       au bouton. Pressée ailleurs, la touche appartient à la page ; en format
       ordinaire (`auto` sur grand écran), le bouton est caché : rien à faire. */
    useEffect(() => {
      if (!menuOpen) return;
      const closeOnEscape = (event: globalThis.KeyboardEvent) => {
        if (event.key !== 'Escape') return;
        if (!(event.target instanceof Node) || !frameRef.current?.contains(event.target)) return;
        const narrow =
          mobile === 'menu' ||
          (mobile === 'auto' && !!window.matchMedia?.('(max-width: 30rem)').matches);
        if (!narrow) return;
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      };
      document.addEventListener('keydown', closeOnEscape);
      return () => document.removeEventListener('keydown', closeOnEscape);
    }, [menuOpen, mobile]);

    /* LA LARGEUR RÉGLABLE, contrôlable comme le reste, et toujours bornée. */
    const clampWidth = (next: number) => Math.max(minWidth, Math.min(maxWidth, Math.round(next)));
    const [width, setWidthState] = useControllableState(
      widthProp,
      () => defaultWidth ?? SIZE_WIDTH[size],
    );
    const changeWidth = (next: number) => {
      const bounded = clampWidth(next);
      setWidthState(bounded);
      onWidthChange?.(bounded);
    };
    const showResize = resizable && !collapsed && mobile !== 'menu';
    const widthStyle = showResize ? { width: `${clampWidth(width)}px` } : undefined;

    const contextValue = useMemo<SidebarContextValue>(
      () => ({
        size,
        collapsed,
        collapsible,
        toggleCollapsed: handleToggle,
        handleItemSelect,
        selectLink,
        onNavigate,
        value: activeItemId,
        activeItemId,
        sidebarId,
        labels,
        upsertGroup,
        removeGroup,
      }),
      [
        upsertGroup,
        removeGroup,
        size,
        collapsed,
        collapsible,
        handleToggle,
        handleItemSelect,
        selectLink,
        onNavigate,
        activeItemId,
        sidebarId,
        labels,
      ],
    );

    const shellClasses = clsx(
      'opale-sidebar__shell',
      styles.sidebarRoot,
      collapsed ? styles.collapsed : widthClassMap[size],
      rootClassName,
    );
    const contentClasses = clsx(
      'opale-sidebar',
      collapsed && 'opale-sidebar--collapsed',
      styles.sidebar,
      collapsed && styles.sidebarCollapsed,
      className,
    );

    const body = customScrollbar ? (
      <SidebarScrollArea collapsed={collapsed} labels={labels} id={`${sidebarId}-scroll`}>
        {children}
      </SidebarScrollArea>
    ) : (
      children
    );

    const handle = showResize ? (
      <SidebarResizeHandle
        width={clampWidth(width)}
        min={minWidth}
        max={maxWidth}
        label={labels.resize}
        controls={sidebarId}
        onChange={changeWidth}
      />
    ) : null;

    /* Chaque raccourci ouvre sa partie, puis la fait défiler en tête du rail. */
    const revealGroup = (group: SidebarGroupEntry) => {
      group.reveal();
      requestAnimationFrame(() => {
        const target = document.getElementById(group.id);
        const area =
          document.getElementById(`${sidebarId}-scroll`) ?? document.getElementById(sidebarId);
        if (!target || !area) return;
        area.scrollTop += target.getBoundingClientRect().top - area.getBoundingClientRect().top;
      });
    };

    const ordered = [...groups].sort((a, b) => {
      const first = typeof document === 'undefined' ? null : document.getElementById(a.id);
      const second = typeof document === 'undefined' ? null : document.getElementById(b.id);
      if (!first || !second) return 0;
      return first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });

    /* La poignée déborde du bord du rail : le verre rogne ce qui dépasse
       (`overflow: hidden`), elle vit donc sur un cadre autour de lui — qui
       porte aussi le bouton et les raccourcis du format mobile. */
    const frame = (rail: ReactNode) => {
      if (mobile === 'off') {
        return showResize ? (
          <div className={clsx('opale-sidebar__frame', styles.frame)}>
            {rail}
            {handle}
          </div>
        ) : (
          rail
        );
      }
      return (
        <div
          className={clsx('opale-sidebar__frame', styles.frame, styles.frameMobile)}
          data-mobile={mobile}
          data-menu={menuOpen ? 'open' : 'closed'}
          ref={frameRef}
        >
          <button
            ref={menuToggleRef}
            type="button"
            className={clsx('opale-sidebar__menu-toggle', styles.menuToggle)}
            aria-expanded={menuOpen}
            aria-controls={sidebarId}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {labels.menu}
          </button>
          {menuOpen && ordered.length > 0 && (
            <div
              role="group"
              aria-label={labels.shortcuts}
              className={clsx('opale-sidebar__shortcuts', styles.shortcuts)}
            >
              {ordered.map((group) => (
                <button key={group.id} type="button" onClick={() => revealGroup(group)}>
                  {group.label}
                </button>
              ))}
            </div>
          )}
          <div
            className={clsx('opale-sidebar__rail-slot', styles.railSlot)}
            hidden={mobile === 'menu' && !menuOpen}
          >
            {rail}
            {handle}
          </div>
        </div>
      );
    };

    if (!liquidGlass) {
      return (
        <SidebarContext.Provider value={contextValue}>
          {frame(
            <aside
              ref={ref}
              id={sidebarId}
              className={clsx(
                shellClasses,
                contentClasses,
                styles.plain,
                customScrollbar && styles.scrollHost,
              )}
              style={{ ...rootStyle, ...style, ...widthStyle }}
              {...rest}
            >
              {body}
            </aside>,
          )}
        </SidebarContext.Provider>
      );
    }

    return (
      <SidebarContext.Provider value={contextValue}>
        {frame(
          <Glass
            as="aside"
            ref={ref}
            id={sidebarId}
            /* LE VERRE NE RÉAGIT PAS AU CLIC ICI, et c'est réfléchi : une onde
             qui part sous le doigt à chaque sélection d'entrée ferait clignoter
             la surface entière d'un rail qu'on parcourt. Le retour visuel
             appartient à l'entrée, qui l'a. */
            enableLiquidAnimation={enableLiquidAnimation}
            triggerAnimation={triggerAnimation}
            rootClassName={shellClasses}
            rootStyle={widthStyle ? { ...rootStyle, ...widthStyle } : rootStyle}
            className={clsx(contentClasses, customScrollbar && styles.scrollHost)}
            style={style}
            {...rest}
          >
            {body}
          </Glass>,
        )}
      </SidebarContext.Provider>
    );
  },
);

SidebarBase.displayName = 'Sidebar';

export type SidebarHeaderProps = ComponentPropsWithoutRef<'div'>;

const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ className, ...rest }, ref) => {
    const { collapsed } = useSidebarContext('Sidebar.Header');

    return (
      <div
        ref={ref}
        className={clsx(
          'opale-sidebar__header',
          styles.header,
          collapsed && styles.headerCollapsed,
          className,
        )}
        {...rest}
      />
    );
  },
);

SidebarHeader.displayName = 'Sidebar.Header';

export type SidebarFooterProps = ComponentPropsWithoutRef<'div'>;

const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={clsx('opale-sidebar__footer', styles.footer, className)} {...rest} />
  ),
);

SidebarFooter.displayName = 'Sidebar.Footer';

export type SidebarItemsProps = ComponentPropsWithoutRef<'nav'>;

/*
 * Le nom par défaut du point de repère de navigation (`labels.items`).
 *
 * POURQUOI UN DÉFAUT PLUTÔT QUE RIEN. Un `<nav>` sans nom s'annonce
 * « navigation », point ; dans une page qui en porte trois — le sommaire, le
 * rail, le pied —, la liste des repères d'un lecteur d'écran devient trois
 * lignes identiques. Un nom générique mais présent vaut mieux qu'aucun : il
 * distingue au moins le rail du reste.
 *
 * POURQUOI CELUI-CI. Le rôle `navigation` est déjà annoncé par le repère ;
 * l'écrire dans le nom donnerait « navigation navigation ». Le mot restant est
 * donc le nom du composant, dans la langue des deux libellés de la bascule —
 * mêler deux langues dans un même composant serait pire que de n'en parler
 * qu'une. Les trois se traduisent ensemble par `labels`.
 *
 * DÈS QU'IL Y A DEUX RAILS DANS UNE PAGE, IL FAUT LE REMPLACER : deux repères
 * de même nom ne se distinguent pas davantage que deux repères sans nom.
 */
const SidebarItems = forwardRef<HTMLElement, SidebarItemsProps>(({ className, ...rest }, ref) => {
  /* Hors d'un `Sidebar`, la liste garde son nom français : elle ne l'exigeait
     pas avant, elle ne l'exige pas davantage. */
  const context = useContext(SidebarContext);
  return (
    /* `aria-label` EST POSÉ AVANT `{...rest}`, donc l'appelant l'emporte — y
       compris pour l'effacer avec `aria-label={undefined}` s'il préfère un
       `aria-labelledby`. */
    <nav
      ref={ref}
      aria-label={context?.labels?.items ?? DEFAULT_SIDEBAR_LABELS.items}
      className={clsx('opale-sidebar__items', styles.items, className)}
      {...rest}
    />
  );
});

SidebarItems.displayName = 'Sidebar.Items';

export type SidebarGroupProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & {
  /** Le titre de la partie, qui nomme le groupe pour les lecteurs d'écran. */
  title: ReactNode;
  /** Le titre replie et déplie la partie. Défaut : `true`. */
  collapsible?: boolean;
  /** Ouverte au départ, quand `open` n'est pas piloté. Défaut : `true`. */
  defaultOpen?: boolean;
  /** L'ouverture pilotée par l'appelant. */
  open?: boolean;
  /** Appelée avec le nouvel état quand le titre est activé. */
  onOpenChange?: (open: boolean) => void;
};

/*
 * UNE PARTIE DU RAIL : UN TITRE, PUIS SES ENTRÉES — LE SOMMAIRE DE LA
 * DOCUMENTATION D'OPALE, DEVENU UNE PIÈCE DE LA LIBRAIRIE.
 *
 * Le titre nomme le groupe (`role="group"` + `aria-labelledby`) : un lecteur
 * d'écran annonce « Prise en main, groupe » en y entrant. Repliable, il est un
 * bouton qui dit son état (`aria-expanded`) et désigne ce qu'il cache
 * (`aria-controls`) ; le contenu fermé est `hidden`, donc hors de la
 * tabulation comme de l'arbre d'accessibilité.
 *
 * RAIL PLIÉ : le titre n'a plus la place d'être lu. Il reste dans le DOM,
 * masqué à l'œil seulement, pour nommer le groupe, et toutes les entrées
 * restent visibles — un groupe fermé ne cacherait plus que des icônes, sans
 * titre à activer pour les rendre.
 */
const SidebarGroup = forwardRef<HTMLDivElement, SidebarGroupProps>(
  (
    {
      title,
      collapsible = true,
      defaultOpen = true,
      open: openProp,
      onOpenChange,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const context = useContext(SidebarContext);
    const railCollapsed = context?.collapsed ?? false;
    const id = useId();
    const titleId = `${id}-title`;
    const contentId = `${id}-content`;
    const [openState, setOpenState] = useState(defaultOpen);
    const open = openProp ?? openState;
    const canToggle = collapsible && !railCollapsed;
    const shown = open || !canToggle;
    const titleRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    /* Où est le focus dans le groupe : le DOM ne le dit plus une fois
       l'élément caché ou démonté, il faut donc le retenir avant. */
    const focusIn = useRef<'title' | 'content' | null>(null);

    /* LE FOCUS NE TOMBE PAS SUR <body>. Un groupe fermé sous le focus le rend
       à son titre ; un rail plié sous le titre, à la première entrée. */
    useLayoutEffect(() => {
      if (!shown && focusIn.current === 'content') titleRef.current?.focus();
    }, [shown]);
    useLayoutEffect(() => {
      if (!canToggle && focusIn.current === 'title')
        contentRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
    }, [canToggle]);

    /* L'INSCRIPTION AUPRÈS DU RAIL, pour les raccourcis du format mobile : le
       libellé est le texte du titre, relu après chaque rendu ; une valeur
       inchangée ne coûte rien. Le raccourci rouvre la partie. */
    const reveal = useRef(() => {});
    useLayoutEffect(() => {
      reveal.current = () => {
        if (openProp === undefined) setOpenState(true);
        if (!open) onOpenChange?.(true);
      };
    });
    const upsert = context?.upsertGroup;
    const remove = context?.removeGroup;
    const entryReveal = useRef(() => reveal.current());
    useEffect(() => {
      const label = document.getElementById(titleId)?.textContent ?? '';
      upsert?.({ id: titleId, label, reveal: entryReveal.current });
    });
    useEffect(() => () => remove?.(titleId), [remove, titleId]);

    const toggle = () => {
      const next = !open;
      if (openProp === undefined) setOpenState(next);
      onOpenChange?.(next);
    };

    return (
      <div
        ref={ref}
        role="group"
        aria-labelledby={titleId}
        onFocus={(event) => {
          focusIn.current = contentRef.current?.contains(event.target) ? 'content' : 'title';
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) focusIn.current = null;
        }}
        className={clsx(
          'opale-sidebar__group',
          styles.group,
          railCollapsed && styles.groupCollapsed,
          className,
        )}
        {...rest}
      >
        {canToggle ? (
          <button
            ref={titleRef}
            type="button"
            id={titleId}
            className={clsx('opale-sidebar__group-title', styles.groupTitle)}
            aria-expanded={open}
            aria-controls={contentId}
            onClick={toggle}
          >
            {title}
          </button>
        ) : (
          <span
            id={titleId}
            className={clsx(
              'opale-sidebar__group-title',
              styles.groupTitle,
              railCollapsed && styles.itemContentHidden,
            )}
          >
            {title}
          </span>
        )}
        <div
          ref={contentRef}
          id={contentId}
          className={clsx('opale-sidebar__group-items', styles.groupItems)}
          hidden={!shown}
        >
          {children}
        </div>
      </div>
    );
  },
);

SidebarGroup.displayName = 'Sidebar.Group';

type SidebarItemOwnProps = {
  /**
   * L'identifiant de l'entrée, comparé à `value` et transmis à `onValueChange`. Unique dans le
   * rail.
   */
  itemId: string;
  /** L'icône de l'entrée, décorative, seule visible quand le rail est plié. */
  icon?: ReactNode;
  /** Un compteur ou une pastille affichés en bout d'entrée. */
  badge?: ReactNode;
  /** Ce que le badge dit au lecteur d'écran, en description. Défaut : le badge. */
  badgeLabel?: ReactNode;
  /**
   * Ce qui remplace l'icône absente quand le rail est plié. Défaut : l'initiale du libellé, sinon
   * `•`.
   */
  collapsedFallback?: ReactNode;
};

/**
 * Les props de `Sidebar.Item` sans `href` : l'entrée est un `<button>`, le
 * contrat historique, inchangé. Ce nom reste un type objet, comme en 2.9, pour
 * qu'une interface puisse toujours l'étendre ; la variante lien est
 * `SidebarItemLinkProps`, et `Sidebar.Item` accepte l'une ou l'autre.
 */
export type SidebarItemProps = ComponentPropsWithoutRef<'button'> &
  SidebarItemOwnProps & {
    /** Absent : l'entrée est un bouton. */
    href?: undefined;
  };

/**
 * Avec `href`, l'entrée est un lien `<a>` : clic du milieu, nouvel onglet et
 * « copier l'adresse » fonctionnent, et `Sidebar.onNavigate` reçoit les clics
 * simples. `target`, `rel` et les autres attributs d'un lien sont transmis.
 */
export type SidebarItemLinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> &
  SidebarItemOwnProps & {
    /** L'adresse du lien. Sa présence rend un `<a>` au lieu d'un `<button>`. */
    href: string;
    /** Désactivé, le lien perd son adresse et se dit `aria-disabled` : ni navigation, ni sélection. */
    disabled?: boolean;
  };

/** Ce que `Sidebar.Item` accepte : un bouton sans `href`, un lien avec. */
export type SidebarItemAnyProps = SidebarItemProps | SidebarItemLinkProps;

/**
 * La vignette d'une entrée repliée qui n'a pas d'icône.
 *
 * Purement visuelle : dans un rail de 88 px dont les libellés sont masqués, il
 * faut peindre quelque chose. L'initiale du libellé quand il est une chaîne, un
 * point médian sinon — et `aria-hidden` dans les deux cas, parce qu'une
 * initiale n'est pas un nom.
 */
const getCollapsedFallback = (collapsedFallback: ReactNode | undefined, children: ReactNode) => {
  if (collapsedFallback) {
    return collapsedFallback;
  }

  if (typeof children === 'string' && children.trim().length > 0) {
    return children.trim().charAt(0).toUpperCase();
  }

  return '•';
};

const SidebarItem = forwardRef<HTMLButtonElement | HTMLAnchorElement, SidebarItemAnyProps>(
  (
    {
      itemId,
      icon,
      badge,
      badgeLabel,
      collapsedFallback,
      className,
      children,
      'aria-describedby': ariaDescribedBy,
      ...element
    },
    ref,
  ) => {
    const { collapsed, handleItemSelect, selectLink, onNavigate, value } =
      useSidebarContext('Sidebar.Item');
    /* L'INFOBULLE DU RAIL REPLIÉ (ACC-25, WCAG 1.4.13). Replié, une entrée ne
       montre qu'une icône ou une initiale : l'utilisateur voyant — souris,
       clavier, commande vocale — devait deviner la cible. L'infobulle n'est
       PAS un second texte : c'est le libellé déjà rendu, masqué à l'œil, que
       la feuille déroule au survol et au focus. Le nom accessible ne bouge
       donc pas, et aucun `title` ne le double (un `title` ne s'affiche pas au
       focus et ne se congédie pas).

       Échap la congédie sans déplacer le focus ; elle revient au prochain
       focus ou au prochain survol. L'événement n'est PAS arrêté : l'infobulle
       ne peut pas savoir si elle est peinte (`:focus-visible` n'existe qu'en
       CSS), et avaler l'Échap d'un tiroir qui contient le rail serait pire
       qu'une infobulle qui se ferme avec lui. */
    const [tooltipDismissed, setTooltipDismissed] = useState(false);
    const [hovered, setHovered] = useState(false);
    const tooltip = collapsed ? (tooltipDismissed ? 'dismissed' : 'true') : undefined;

    /* ÉCHAP AU SURVOL, FOCUS AILLEURS. Écouté sur l'entrée seule, Échap ne
       congédiait que l'infobulle ouverte au clavier : ouverte à la souris,
       elle restait peinte tant que le pointeur restait dessus (relevé sous
       Chromium, WCAG 1.4.13). Le document est un système extérieur au rendu,
       d'où l'effet : l'écoute n'existe que pendant le survol d'une entrée
       repliée dont l'infobulle est montrée, et part avec le pointeur ou au
       démontage. Même règle que sur l'entrée : l'événement n'est pas arrêté. */
    const listening = collapsed && hovered && !tooltipDismissed;
    useEffect(() => {
      if (!listening) return undefined;
      const handleDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.key === 'Escape') setTooltipDismissed(true);
      };
      document.addEventListener('keydown', handleDocumentKeyDown);
      return () => document.removeEventListener('keydown', handleDocumentKeyDown);
    }, [listening]);
    const badgeId = useId();
    const describedBy = badge
      ? [ariaDescribedBy, badgeId].filter(Boolean).join(' ')
      : ariaDescribedBy;
    /* UNE REF, DEUX BALISES. L'appelant reçoit le `<button>` ou le `<a>`
       rendu ; la ref fusionnée est mémorisée pour ne pas être détachée puis
       rattachée à chaque rendu. */
    const elementRef = useMemo(() => mergeRefs<HTMLButtonElement | HTMLAnchorElement>(ref), [ref]);

    const isActive = value === itemId;

    /* LE COMPORTEMENT DE L'INFOBULLE NE DÉPEND PAS DE LA BALISE. Chaque
       branche appelle ces quatre pièces depuis ses propres gestionnaires,
       typés sur son élément, avant de passer la main à ceux de l'appelant. */
    const dismissOnEscape = (key: string) => {
      if (collapsed && key === 'Escape') setTooltipDismissed(true);
    };
    const restoreOnBlur = () => setTooltipDismissed(false);
    const startHover = () => setHovered(true);
    /* Le pointeur qui s'en va rend l'infobulle au prochain survol — sauf si
       l'entrée garde le focus : elle réapparaîtrait sous le clavier qui vient
       de la congédier. */
    const endHover = (element: HTMLElement) => {
      setHovered(false);
      if (element.ownerDocument.activeElement !== element) setTooltipDismissed(false);
    };

    const classes = clsx(
      'opale-sidebar__item',
      styles.item,
      collapsed && styles.itemCollapsed,
      isActive && styles.itemActive,
      className,
    );

    const content = (
      <>
        {icon ? (
          <span className={clsx('opale-sidebar__item-icon', styles.itemIcon)} aria-hidden="true">
            {icon}
          </span>
        ) : null}

        {collapsed && !icon ? (
          <span
            className={clsx('opale-sidebar__item-fallback', styles.itemFallback)}
            aria-hidden="true"
          >
            {getCollapsedFallback(collapsedFallback, children)}
          </span>
        ) : null}

        {/* LE CONTENU EST TOUJOURS RENDU — masqué à l'œil quand le rail est
            replié, jamais retiré. C'est ce qui donne à l'entrée le MÊME nom
            accessible dans les deux états, quel que soit le type du libellé.
            Voir la feuille pour le détail du défaut que cela corrige. */}
        <span className={clsx(styles.itemContent, collapsed && styles.itemContentHidden)}>
          <span className={clsx('opale-sidebar__item-label', styles.itemText)}>{children}</span>

          {/* LE BADGE VISIBLE EST `aria-hidden` : dans le nom, il ferait
              « Analytics 4 », un nom qui bouge avec le compteur (WCAG 2.5.3).
              Il s'entend en DESCRIPTION, par un texte masqué que
              `aria-describedby` désigne. */}
          {badge ? (
            <>
              <span className={clsx('opale-sidebar__badge', styles.itemBadge)} aria-hidden="true">
                {badge}
              </span>
              <span id={badgeId} hidden>
                {badgeLabel ?? badge}
              </span>
            </>
          ) : null}
        </span>
      </>
    );

    if (element.href !== undefined) {
      const { href, disabled, onClick, onKeyDown, onBlur, onMouseEnter, onMouseLeave, ...rest } =
        element;

      /* LE CLIC D'UN LIEN SUIT LA RÈGLE COMMUNE (`shared/navigate.ts`). Le
         `onClick` de l'appelant passe d'abord : s'il annule, rien n'est
         retenu. Un clic modifié, du milieu ou vers un autre onglet reste au
         navigateur ET ne retient rien — la page courante n'a pas changé. Un
         clic simple retient l'entrée, puis la remet au routeur s'il y en a
         un ; sans routeur, le lien navigue. */
      const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
        if (!shouldHandleNavigation(event)) return;
        selectLink?.(itemId);
        navigateOnClick({ id: itemId, href }, event, onNavigate);
      };

      return (
        <a
          ref={elementRef}
          className={classes}
          /* DÉSACTIVÉ, LE LIEN N'A PLUS D'ADRESSE : il sort de la tabulation
             et ne mène nulle part, comme un bouton `disabled`. `role="link"`
             garde son rôle, qu'un `<a>` sans `href` perd. */
          href={disabled ? undefined : href}
          role={disabled ? 'link' : undefined}
          aria-disabled={disabled ? true : undefined}
          onClick={handleClick}
          onKeyDown={(event) => {
            dismissOnEscape(event.key);
            onKeyDown?.(event);
          }}
          onBlur={(event) => {
            restoreOnBlur();
            onBlur?.(event);
          }}
          onMouseEnter={(event) => {
            startHover();
            onMouseEnter?.(event);
          }}
          onMouseLeave={(event) => {
            endHover(event.currentTarget);
            onMouseLeave?.(event);
          }}
          data-opale-tooltip={tooltip}
          aria-current={isActive ? 'page' : undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {content}
        </a>
      );
    }

    /* `href` est ici `undefined` : il reste dans `rest` et ne rend rien. */
    const { disabled, onClick, onKeyDown, onBlur, onMouseEnter, onMouseLeave, ...rest } = element;

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      /* LA GARDE EST REDONDANTE AVEC L'ATTRIBUT `disabled`, ET ELLE RESTE.
         React n'appelle pas le gestionnaire d'un contrôle désactivé, donc en
         pratique on n'arrive jamais ici ; mais `disabled` peut être retiré par
         une classe, un `form` extérieur ou un futur passage à `aria-disabled`
         — et le jour où cela arrive, une sélection silencieuse se produirait
         sans que rien ne la signale. Une ligne contre ce risque est un bon
         prix. */
      if (disabled) {
        event.preventDefault();
        return;
      }

      handleItemSelect(itemId, event);
      onClick?.(event);
    };

    return (
      <button
        ref={elementRef}
        type="button"
        className={classes}
        onClick={handleClick}
        onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
          dismissOnEscape(event.key);
          onKeyDown?.(event);
        }}
        onBlur={(event: FocusEvent<HTMLButtonElement>) => {
          restoreOnBlur();
          onBlur?.(event);
        }}
        onMouseEnter={(event) => {
          startHover();
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          endHover(event.currentTarget);
          onMouseLeave?.(event);
        }}
        disabled={disabled}
        data-opale-tooltip={tooltip}
        /* L'ENTRÉE RETENUE EST LA PAGE COURANTE, ET ELLE LE DIT. C'est la seule
           façon pour un lecteur d'écran d'apprendre « vous êtes ici » ; la
           classe qui l'assombrit ne s'entend pas. `aria-current` est un
           attribut global : il est valide sur un `<button>` comme sur un `<a>`. */
        aria-current={isActive ? 'page' : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
        {content}
      </button>
    );
  },
);

SidebarItem.displayName = 'Sidebar.Item';

export type SidebarToggleProps = ComponentPropsWithoutRef<'button'>;

/** Le chevron de la bascule : décoratif, il suit l'encre et pivote au repli. */
const ToggleChevron = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    className={clsx(styles.toggleIcon, collapsed && styles.toggleIconCollapsed)}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M10 3.25 5.25 8 10 12.75"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SidebarToggle = forwardRef<HTMLButtonElement, SidebarToggleProps>(
  ({ className, onClick, children, ...rest }, ref) => {
    const {
      collapsible,
      collapsed,
      toggleCollapsed,
      sidebarId,
      labels = DEFAULT_SIDEBAR_LABELS,
    } = useSidebarContext('Sidebar.Toggle');

    /* SANS `collapsible`, LA BASCULE NE REND RIEN. Ce n'est pas un oubli : un
       bouton qui ne peut rien faire est pire qu'un bouton absent — il est dans
       l'ordre de tabulation, il s'annonce, et il ne répond pas. */
    if (!collapsible) {
      return null;
    }

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      toggleCollapsed();
      onClick?.(event);
    };

    return (
      <button
        ref={ref}
        type="button"
        className={clsx('opale-sidebar__toggle', styles.toggle, className)}
        /* LE NOM DIT L'ACTION, `aria-expanded` DIT L'ÉTAT, et les deux sont
           nécessaires. Le nom seul ne répond qu'à « que va-t-il se passer si
           j'appuie ? » ; il ne répond pas à « où en suis-je ? » posé à froid,
           par exemple en arrivant sur la page au clavier. */
        /* LE REPLI NE S'APPLIQUE QUE S'IL N'Y A PAS DE LIBELLÉ VISIBLE, et il
           est en français comme le reste de la bibliothèque.

           Il était posé INCONDITIONNELLEMENT : un appelant qui écrivait
           `<Sidebar.Toggle>Replier</Sidebar.Toggle>` obtenait un bouton dont
           le nom accessible était « collapse sidebar ». La commande vocale
           « clique Replier » échouait alors, le nom et le libellé visible
           n'ayant plus un mot en commun (WCAG 2.5.3). Et ces libellés anglais
           étaient lus avec la voix du document — le défaut que `Modal` déclare
           avoir corrigé chez lui. */
        aria-label={children ? undefined : collapsed ? labels.expand : labels.collapse}
        aria-expanded={!collapsed}
        aria-controls={sidebarId}
        onClick={handleClick}
        {...rest}
      >
        {children ?? <ToggleChevron collapsed={collapsed} />}
      </button>
    );
  },
);

SidebarToggle.displayName = 'Sidebar.Toggle';

type SidebarCompoundComponent = ForwardRefExoticComponent<
  SidebarProps & RefAttributes<HTMLElement>
> & {
  Header: typeof SidebarHeader;
  Footer: typeof SidebarFooter;
  Items: typeof SidebarItems;
  Group: typeof SidebarGroup;
  Item: typeof SidebarItem;
  Toggle: typeof SidebarToggle;
  useSidebar: () => SidebarContextValue;
};

const Sidebar = SidebarBase as SidebarCompoundComponent;

Sidebar.Header = SidebarHeader;
Sidebar.Footer = SidebarFooter;
Sidebar.Items = SidebarItems;
Sidebar.Group = SidebarGroup;
Sidebar.Item = SidebarItem;
Sidebar.Toggle = SidebarToggle;
Sidebar.useSidebar = () => useSidebarContext('Sidebar.useSidebar');

export default Sidebar;

/* LES PARTIES SOUS LEUR PROPRE NOM, pour les Server Components : une référence
   client ne se lit pas par un point, `Sidebar.Header` y lève une erreur.
   `SidebarHeader` est le même objet que `Sidebar.Header`. */
export { SidebarHeader, SidebarFooter, SidebarItems, SidebarGroup, SidebarItem, SidebarToggle };
