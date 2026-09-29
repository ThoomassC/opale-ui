import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  type ComponentPropsWithoutRef,
  type ForwardRefExoticComponent,
  type MouseEvent,
  type ReactNode,
  type RefAttributes,
} from 'react';
import clsx from 'clsx';

import { warnDeprecatedProps } from '../../deprecations';
import Glass, { type GlassSurfaceProps, type LegacySurfaceAnimationProps } from '../glass/Glass';
import type { OpaleSize } from '../../shared';
import { resolveLabels } from '../../shared/labels';
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

   CE QUI N'A PAS CHANGÉ ET QUI RESTE UNE LIMITE : les entrées sont des
   `<button>`, pas des liens. Pas de `href`, donc ni clic du milieu, ni
   ouverture dans un onglet, ni « copier l'adresse ». C'est le contrat public du
   composant — `SidebarItemProps` étend `ComponentPropsWithoutRef<'button'>` et
   `onSelectItem` reçoit un `MouseEvent<HTMLButtonElement>` — et en faire un
   polymorphe serait une autre API, pas une correction.
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
}

/* EN FRANÇAIS, COMME LE RESTE DE LA BIBLIOTHÈQUE : lu avec la voix française
   du document, un nom anglais devient inintelligible (WCAG 3.1.2). */
const DEFAULT_SIDEBAR_LABELS: SidebarLabels = {
  items: 'Navigation latérale',
  expand: 'Déplier le rail',
  collapse: 'Replier le rail',
};

export type SidebarContextValue = {
  size: SidebarSize;
  collapsed: boolean;
  collapsible: boolean;
  toggleCollapsed: () => void;
  handleItemSelect: (itemId: string, event: MouseEvent<HTMLButtonElement>) => void;
  /** L'entrée retenue, absente quand aucune ne l'est. */
  value?: string;
  /** @deprecated Depuis 3.6 — utilisez `value`. */
  activeItemId?: string;
  /** L'identifiant de l'`<aside>`, pour l'`aria-controls` de la bascule. */
  sidebarId: string;
  /** Les textes effectifs du rail ; absents, les défauts français s'appliquent. */
  labels?: SidebarLabels;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const useSidebarContext = (component: string) => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error(`${component} must be used within Sidebar`);
  }

  return context;
};

export type SidebarProps = Omit<ComponentPropsWithoutRef<'aside'>, 'onToggle' | 'defaultValue'> & {
  size?: SidebarSize;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  /** Appelée à chaque bascule du pli, avec le nouvel état. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** @deprecated Depuis 3.6 — utilisez `onCollapsedChange`. */
  onToggle?: (collapsed: boolean) => void;
  /** L'entrée retenue. Présente, l'appelant la tient ; `null` : aucune. */
  value?: string | null;
  /** L'entrée retenue au montage quand `value` est absente. */
  defaultValue?: string | null;
  /** Appelée à chaque sélection d'une entrée, même celle déjà retenue. */
  onValueChange?: (itemId: string) => void;
  /** @deprecated Depuis 3.6 — utilisez `value`. */
  activeItemId?: string;
  /** @deprecated Depuis 3.6 — utilisez `defaultValue`. */
  defaultActiveItemId?: string;
  /** @deprecated Depuis 3.6 — utilisez `onValueChange`. */
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
} & Pick<GlassSurfaceProps, 'rootClassName' | 'rootStyle'> &
  LegacySurfaceAnimationProps;

const widthClassMap: Record<SidebarSize, string> = {
  small: styles.small,
  medium: styles.medium,
  large: styles.large,
};

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
      activeItemId: activeItemIdProp,
      defaultActiveItemId,
      onSelectItem,
      labels: labelsProp,
      liquidGlass = false,
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

    /* `useId` EST APPELÉ INCONDITIONNELLEMENT, et l'`id` de l'appelant gagne
       ensuite. Un crochet ne se met pas derrière un `??` : l'ordre des crochets
       doit être le même à chaque rendu, y compris celui où l'appelant passe
       enfin son propre identifiant. */
    const generatedId = useId();
    const sidebarId = id ?? generatedId;
    const { items, expand, collapse } = resolveLabels(DEFAULT_SIDEBAR_LABELS, labelsProp);
    /* Mémorisé sur les chaînes : un `labels` littéral recréé à chaque rendu ne
       doit pas renouveler le contexte. */
    const labels = useMemo<SidebarLabels>(
      () => ({ items, expand, collapse }),
      [items, expand, collapse],
    );

    const contextValue = useMemo<SidebarContextValue>(
      () => ({
        size,
        collapsed,
        collapsible,
        toggleCollapsed: handleToggle,
        handleItemSelect,
        value: activeItemId,
        activeItemId,
        sidebarId,
        labels,
      }),
      [
        size,
        collapsed,
        collapsible,
        handleToggle,
        handleItemSelect,
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

    if (!liquidGlass) {
      return (
        <SidebarContext.Provider value={contextValue}>
          <aside
            ref={ref}
            id={sidebarId}
            className={clsx(shellClasses, contentClasses, styles.plain)}
            style={rootStyle ? { ...rootStyle, ...style } : style}
            {...rest}
          >
            {children}
          </aside>
        </SidebarContext.Provider>
      );
    }

    return (
      <SidebarContext.Provider value={contextValue}>
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
          rootStyle={rootStyle}
          className={contentClasses}
          style={style}
          {...rest}
        >
          {children}
        </Glass>
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

export type SidebarItemProps = ComponentPropsWithoutRef<'button'> & {
  itemId: string;
  icon?: ReactNode;
  badge?: ReactNode;
  /** Ce que le badge dit au lecteur d'écran, en description. Défaut : le badge. */
  badgeLabel?: ReactNode;
  collapsedFallback?: ReactNode;
};

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

const SidebarItem = forwardRef<HTMLButtonElement, SidebarItemProps>(
  (
    {
      itemId,
      icon,
      badge,
      badgeLabel,
      collapsedFallback,
      disabled,
      className,
      children,
      onClick,
      'aria-describedby': ariaDescribedBy,
      ...rest
    },
    ref,
  ) => {
    const { collapsed, handleItemSelect, value } = useSidebarContext('Sidebar.Item');
    const badgeId = useId();
    const describedBy = badge
      ? [ariaDescribedBy, badgeId].filter(Boolean).join(' ')
      : ariaDescribedBy;

    const isActive = value === itemId;

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
        ref={ref}
        type="button"
        className={clsx(
          'opale-sidebar__item',
          styles.item,
          collapsed && styles.itemCollapsed,
          isActive && styles.itemActive,
          className,
        )}
        onClick={handleClick}
        disabled={disabled}
        /* L'ENTRÉE RETENUE EST LA PAGE COURANTE, ET ELLE LE DIT. C'est la seule
           façon pour un lecteur d'écran d'apprendre « vous êtes ici » ; la
           classe qui l'assombrit ne s'entend pas. `aria-current` est un
           attribut global : il est valide sur un `<button>` comme sur un `<a>`,
           même si ce rail gagnerait par ailleurs à être fait de liens. */
        aria-current={isActive ? 'page' : undefined}
        aria-describedby={describedBy}
        {...rest}
      >
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
            replié, jamais retiré. C'est ce qui donne au bouton le MÊME nom
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
  Item: typeof SidebarItem;
  Toggle: typeof SidebarToggle;
  useSidebar: () => SidebarContextValue;
};

const Sidebar = SidebarBase as SidebarCompoundComponent;

Sidebar.Header = SidebarHeader;
Sidebar.Footer = SidebarFooter;
Sidebar.Items = SidebarItems;
Sidebar.Item = SidebarItem;
Sidebar.Toggle = SidebarToggle;
Sidebar.useSidebar = () => useSidebarContext('Sidebar.useSidebar');

export default Sidebar;
