/* Les composants de navigation du catalogue. */

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import Glass from '../components/glass/Glass';
import { Modal, type ModalLabels } from '../components/modal';
import toastMotion from '../components/toast/style/Toast.module.css';
import { warnDeprecatedProps } from '../deprecations';
import { rememberFocusOrigin, returnFocus } from '../shared/focus-return';
import { resolveLabels } from '../shared/labels';
import { navigateOnClick, type NavigateHandler } from '../shared/navigate';
import { useControllableState, useOptionalState } from '../shared/use-controllable-state';
import { useScrollPadding } from '../shared/use-scroll-padding';
import {
  COOKIE_CONSENT_KEY,
  notifyConsent,
  readCachedCookieConsent,
  subscribeConsent,
  type CookieConsent,
} from './cookie-consent';
import { Surface } from './shells';
import { Button, Input } from './forms';
import { closeHandler, closeClickHandler } from './close-handlers';

export interface NavItem {
  id: string;
  label: ReactNode;
  href?: string;
  icon?: ReactNode;
}

/* L'AVERTISSEMENT DE DÉVELOPPEMENT, une fois par chargement et par message.
   Même lecture de `process.env.NODE_ENV` que `deprecations.ts`, dont ce canal
   devrait à terme relever : c'est l'expression que les bundlers remplacent,
   et une `ReferenceError` (ni bundler ni Node) vaut silence. */
declare const process: { readonly env: { readonly NODE_ENV?: string } };

function isDevelopment(): boolean {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
}

const devWarned = new Set<string>();

function warnDevOnce(message: string): void {
  if (devWarned.has(message) || !isDevelopment()) return;
  devWarned.add(message);
  console.warn(message);
}

const NAVBAR_LOST_CLICK =
  '[Opale] Navbar : sans `value` ni `defaultValue`, l’entrée cliquée ne devient pas ' +
  'courante — passez `defaultValue` pour que la barre s’en souvienne, ou `value` pour la tenir.';

export interface NavbarProps extends Omit<
  ComponentPropsWithRef<'nav'>,
  'onSelect' | 'onChange' | 'defaultValue' | 'children'
> {
  /** Les entrées de la barre : un lien avec `href`, un bouton sans. Défaut : aucune. */
  items?: readonly NavItem[];
  /** L'entrée courante. Présente, l'appelant la tient ; absente et sans `defaultValue`, aucune. */
  value?: string;
  /**
   * L'entrée courante au montage quand `value` est absente. SEULE ELLE FAIT
   * RETENIR LE CLIC : sans `value` ni `defaultValue`, une entrée cliquée ne
   * devient pas courante (`aria-current`), même si `onValueChange` part. C'est
   * le comportement de la 3.x, signalé en développement ; passez
   * `defaultValue` pour que la barre se souvienne seule, `value` pour la tenir.
   */
  defaultValue?: string;
  /** Ne part que des entrées sans `href` (boutons) ; un lien navigue, ou passe par `onNavigate`. */
  onValueChange?: (id: string) => void;
  /**
   * Le crochet du routeur côté client, pour les entrées avec `href`. Sur un
   * clic gauche simple, la barre annule la navigation native puis l'appelle ;
   * Ctrl, Cmd, Maj, Alt, le clic du milieu et `target` vers un autre onglet
   * restent au navigateur. En non contrôlé (`defaultValue`), l'entrée routée
   * devient courante ; `onValueChange` ne part pas. Voir `shared/navigate.ts`
   * pour Next.js et React Router.
   */
  onNavigate?: NavigateHandler<NavItem>;
  /** @deprecated Depuis 3.6 — utilisez `value`. */
  activeId?: string;
  /** @deprecated Depuis 3.6 — utilisez `onValueChange`. */
  onSelect?: (id: string) => void;
  /** Le nom du repère ; `aria-label` gagne. Défaut : « Navigation ». */
  label?: string;
  /** Une classe ajoutée à la barre. */
  className?: string;
  /** Rend la barre dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

/* LA BARRE RENDUE PAR `Menu` NE PRÉVIENT PAS : ses entrées ne se retiennent
   pas — le menu se referme sur la destination —, l'avertissement y mentirait. */
const InsideMenuContext = createContext(false);

export function Navbar({
  items = [],
  value,
  defaultValue,
  onValueChange,
  onNavigate,
  activeId: activeIdProp,
  onSelect,
  label = 'Navigation',
  className,
  liquidGlass = false,
  ...rest
}: NavbarProps) {
  warnDeprecatedProps('Navbar', { activeId: activeIdProp, onSelect });
  const [activeId, setActiveId] = useOptionalState(value ?? activeIdProp, defaultValue);
  /* UN CLIC QUI N'EST PAS RETENU SE SIGNALE (DX-13). Rien ne change en 3.x —
     des appelants comptent sur ce « rien » —, mais la barre prévient une fois,
     en développement, quand une entrée cliquée ne devient pas courante.
     LA VÉRIFICATION EST DIFFÉRÉE D'UNE TÂCHE, comme pour `SegmentedControl` :
     un parent qui tient la valeur et part de `undefined` la pose en réponse au
     clic, et ne doit pas être accusé. Seule compte la `value` relue après. */
  const insideMenu = useContext(InsideMenuContext);
  const latestValue = useRef(value ?? activeIdProp);
  useLayoutEffect(() => {
    latestValue.current = value ?? activeIdProp;
  });
  const lostClickCheck = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(lostClickCheck.current), []);
  const watchLostClick = () => {
    if (insideMenu || devWarned.has(NAVBAR_LOST_CLICK) || !isDevelopment()) return;
    if (latestValue.current !== undefined || defaultValue !== undefined) return;
    clearTimeout(lostClickCheck.current);
    lostClickCheck.current = setTimeout(() => {
      if (latestValue.current !== undefined) return;
      warnDevOnce(NAVBAR_LOST_CLICK);
    }, 0);
  };
  const select = (id: string) => {
    setActiveId(id);
    onValueChange?.(id);
    onSelect?.(id);
    watchLostClick();
  };
  const Rail = liquidGlass ? Glass : 'nav';
  const railProps = liquidGlass
    ? ({ as: 'nav', rootClassName: 'opale-surface--glass-root' } as const)
    : {};

  return (
    /* LE RAIL CHANGE DE MATIÈRE, PAS DE BALISE. `Glass` rend l'élément demandé
       pour son CONTENU : le `<nav>` et son nom accessible restent le même nœud
       dans les deux rendus, donc la navigation garde son rôle sous verre. */
    <Rail
      aria-label={label}
      {...rest}
      {...railProps}
      className={clsx(
        'opale-surface',
        liquidGlass && 'opale-surface--glass',
        'opale-nav',
        className,
      )}
    >
      {items.map((item) =>
        item.href ? (
          <a
            key={item.id}
            href={item.href}
            className="opale-nav__item"
            aria-current={activeId === item.id ? 'page' : undefined}
            onClick={(event) => {
              if (!navigateOnClick(item, event, onNavigate)) return;
              setActiveId(item.id);
              watchLostClick();
            }}
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
            onClick={() => select(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ),
      )}
    </Rail>
  );
}

/**
 * Les props de `Menu`, un DISCLOSURE (`<details>`/`<summary>`) : un sommaire
 * qui déplie un panneau de liens ou de contenu libre, dans le flux de la page.
 */
export interface MenuProps extends ComponentPropsWithRef<'details'> {
  /** Le texte du sommaire, qui ouvre et referme le panneau. Défaut : « Menu ». */
  label?: ReactNode;
  /** Les liens du panneau, rendus en `Navbar`. Présents, ils remplacent `children`. */
  items?: readonly NavItem[];
  /** Le nom de la navigation rendue depuis `items`. Défaut : celui de `Navbar`. */
  navigationLabel?: string;
  /**
   * Le crochet du routeur pour les liens de `items`, avec le contrat de
   * `Navbar.onNavigate`. Après un clic routé, le menu se referme et rend le
   * focus à son sommaire : la page ne se recharge pas pour le faire.
   */
  onNavigate?: NavigateHandler<NavItem>;
  /** Une classe ajoutée au `<details>`. */
  className?: string;
  /** Un contenu libre pour le panneau, rendu quand `items` est vide. */
  children?: ReactNode;
  /** Rend le menu dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

/**
 * Un « menu simple » : un disclosure natif `<details>`, ouvert au clic sur son
 * sommaire, refermé par Échap. Il n'est ni positionné ni refermé au clic
 * extérieur, et ne porte pas le rôle `menu` — c'est un panneau de navigation
 * ou de contenu, pas un menu d'actions. Pour une liste d'actions ancrée à un
 * bouton (motif APG « menu button », flèches, fermeture extérieure), utilisez
 * `DropdownMenu`.
 */
export function Menu({
  label = 'Menu',
  items = [],
  navigationLabel,
  onNavigate,
  className,
  children,
  liquidGlass = false,
  onKeyDown,
  ...rest
}: MenuProps) {
  /* ÉCHAP REFERME (ACC-23). Le nom « Menu » fait attendre Échap, et le
     `<details>` natif l'ignore. Ouvert, il se referme et rend le focus au
     `<summary>`, qui l'a ouvert. Échap est alors consommé — `preventDefault`,
     que `Modal` respecte, et plus de propagation — pour qu'une modale
     englobante ne se ferme pas avec lui. Fermé, Échap passe son chemin. */
  const handleKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
    onKeyDown?.(event);
    const details = event.currentTarget;
    if (event.key !== 'Escape' || event.defaultPrevented || !details.open) return;
    event.preventDefault();
    event.stopPropagation();
    details.open = false;
    details.querySelector<HTMLElement>(':scope > summary')?.focus();
  };
  const classes = clsx(
    'opale-surface',
    liquidGlass && 'opale-surface--glass',
    'opale-panel',
    className,
  );
  /* LA PAGE NE SE RECHARGE PLUS, DONC LE MENU SE REFERME LUI-MÊME. Sans
     routeur, le rechargement le refermait ; routé, il restait ouvert sur la
     nouvelle page. Même sortie qu'Échap : fermé, focus au sommaire. */
  const routeAndClose: NavigateHandler<NavItem> | undefined = onNavigate
    ? (item, event) => {
        const details = event.currentTarget.closest('details');
        onNavigate(item, event);
        if (!details) return;
        details.open = false;
        details.querySelector<HTMLElement>(':scope > summary')?.focus();
      }
    : undefined;
  const content = (
    <>
      <summary>{label}</summary>
      {items.length > 0 ? (
        <InsideMenuContext.Provider value>
          <Navbar
            items={items}
            label={navigationLabel}
            liquidGlass={liquidGlass}
            onNavigate={routeAndClose}
          />
        </InsideMenuContext.Provider>
      ) : (
        children
      )}
    </>
  );

  if (liquidGlass) {
    return (
      <Glass
        {...rest}
        as="details"
        className={classes}
        rootClassName="opale-surface--glass-root"
        onKeyDown={handleKeyDown}
      >
        {content}
      </Glass>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Échap délégué depuis les contrôles du panneau, voir `handleKeyDown`
    <details {...rest} className={classes} onKeyDown={handleKeyDown}>
      {content}
    </details>
  );
}

export interface LinkProps extends ComponentPropsWithRef<'a'> {
  /** Le texte du lien, qui en est le nom. */
  children: ReactNode;
  /** Pose le lien sur le matériau « verre liquide ». Original par défaut. */
  liquidGlass?: boolean;
}

export function Link({ children, className, liquidGlass = false, ...props }: LinkProps) {
  const classes = clsx('opale-link', liquidGlass && 'opale-link--glass', className);
  if (liquidGlass) {
    return (
      <Glass {...props} as="a" className={classes} rootClassName="opale-link--glass-root">
        {children}
      </Glass>
    );
  }
  return (
    <a className={classes} {...props}>
      {children}
    </a>
  );
}

/** Les textes de `SidePanel`. `close` nomme la croix. */
export interface SidePanelLabels extends ModalLabels {
  /** Le titre, quand `title` n'est pas passé. Défaut : « Panneau ». */
  title: string;
}

/** Les props de `SidePanel`. `ref` et les attributs vont au panneau. */
export interface SidePanelProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  /** Ouvert ou non, piloté par l'appelant. Défaut : `false`. */
  open?: boolean;
  /** Le titre du panneau, qui le nomme. Défaut : `labels.title`, « Panneau » ; `null` le retire. */
  title?: ReactNode;
  /** Le contenu du panneau. */
  children?: ReactNode;
  /** Appelée avec `false` sur Échap, le voile ou la croix. Sa présence rend la croix. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Depuis 3.6 — utilisez `onOpenChange`. */
  onClose?: () => void;
  /** Remplace les textes français par défaut, clé par clé. `title` gagne sur `labels.title`. */
  labels?: Partial<SidePanelLabels>;
  /** Rend le panneau dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

const DEFAULT_SIDE_PANEL_LABELS: SidePanelLabels = { close: 'Fermer', title: 'Panneau' };

export function SidePanel({
  open = false,
  title,
  children,
  onOpenChange,
  onClose,
  labels: labelsProp,
  liquidGlass = false,
  ...rest
}: SidePanelProps) {
  warnDeprecatedProps('SidePanel', { onClose });
  const labels = resolveLabels(DEFAULT_SIDE_PANEL_LABELS, labelsProp);
  /* IL COULE ENFIN SUR LE CÔTÉ. Sa fiche annonçait « panneau latéral
     coulissant » et il rendait la boîte CENTRÉE du dialogue — même classe,
     même position. La coquille le plaque désormais contre le bord de fin sur
     toute la hauteur ; voir `.opale-side-panel` dans `opale.css`. */
  return (
    <Modal
      {...rest}
      open={open}
      onOpenChange={closeHandler(onOpenChange, onClose)}
      liquidGlass={liquidGlass}
      labels={{ close: labels.close }}
      title={title === undefined ? labels.title : title}
      rootClassName="opale-side-panel"
    >
      {children}
    </Modal>
  );
}

/** Les textes de `CommandPalette`. `close` nomme la croix et le bouton Fermer. */
export interface CommandPaletteLabels extends ModalLabels {
  /** Défaut : « Palette de commandes ». */
  title: string;
  /** Le libellé du champ de recherche. Défaut : « Rechercher une commande ». */
  search: string;
  /** Avec `items`, le nom de la liste. Défaut : « Commandes ». */
  results?: string;
  /** Avec `items`, le compte annoncé. Défaut : « 3 résultats », « Aucun résultat ». */
  resultCount?: (count: number) => string;
}

const DEFAULT_COMMAND_PALETTE_LABELS: Required<CommandPaletteLabels> = {
  close: 'Fermer',
  title: 'Palette de commandes',
  search: 'Rechercher une commande',
  results: 'Commandes',
  resultCount: (count) =>
    count === 0 ? 'Aucun résultat' : `${count} résultat${count > 1 ? 's' : ''}`,
};

/** Une commande de la palette. */
export interface CommandPaletteItem {
  id: string;
  label: ReactNode;
  /** Un texte secondaire, sous le libellé. */
  description?: ReactNode;
  /** Visible mais ni activable ni choisie aux flèches. */
  disabled?: boolean;
  /** Appelée quand la commande est choisie, avant `onItemSelect`. */
  onSelect?: () => void;
}

/** Les props de `CommandPalette`. `ref` et les attributs vont au panneau. */
export interface CommandPaletteProps extends Omit<
  ComponentPropsWithRef<'div'>,
  'title' | 'onChange' | 'defaultValue'
> {
  /** Ouverte ou non, pilotée par l'appelant. Défaut : `false`. */
  open?: boolean;
  /** Le texte de la recherche. Présent, l'appelant le tient. */
  value?: string;
  /** Le texte de départ quand `value` est absente. */
  defaultValue?: string;
  /** Appelée à chaque frappe dans la recherche. */
  onValueChange?: (value: string) => void;
  /** @deprecated Depuis 3.6 — utilisez `onValueChange`. */
  onChange?: (value: string) => void;
  /** Appelée avec `false` sur Échap, le voile, la croix ou Fermer. Sa présence rend Fermer. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Depuis 3.6 — utilisez `onOpenChange`. */
  onClose?: () => void;
  /** Un contenu libre, rendu sous la recherche. */
  children?: ReactNode;
  /**
   * Les commandes, déjà filtrées par l'appelant. Présentes, la recherche devient
   * une combobox : flèches haut et bas, Entrée, et le compte annoncé.
   */
  items?: readonly CommandPaletteItem[];
  /** Appelée avec l'`id` de la commande choisie, à Entrée ou au clic. */
  onItemSelect?: (id: string) => void;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<CommandPaletteLabels>;
  /**
   * Rend le bouton « Fermer » du pied, en plus de la croix d'en-tête. Défaut : `true`.
   * À `false`, seule la croix ferme le dialogue (elle n'existe qu'avec `onOpenChange`
   * ou `onClose`) ; son nom et la gestion du focus sont inchangés.
   */
  footerClose?: boolean;
  /** Rend le panneau dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

export function CommandPalette({
  open = false,
  value,
  defaultValue = '',
  onValueChange,
  onChange,
  onOpenChange,
  onClose,
  children,
  items,
  onItemSelect,
  labels: labelsProp,
  liquidGlass = false,
  footerClose = true,
  ...rest
}: CommandPaletteProps) {
  warnDeprecatedProps('CommandPalette', { onChange, onClose });
  const close = closeHandler(onOpenChange, onClose);
  const labels = resolveLabels<Required<CommandPaletteLabels>>(
    DEFAULT_COMMAND_PALETTE_LABELS,
    labelsProp,
  );
  /* La modale donne d'abord le focus au panneau pour annoncer son titre.
     Au cadre suivant, la palette place le curseur dans sa recherche : on peut
     lancer une commande sans clic, tout en laissant Modal retenir l'élément
     à qui rendre le focus à la fermeture. */
  const [query, setQuery] = useControllableState<string>(value, defaultValue, onValueChange);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => searchRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  /* LA COMMANDE ACTIVE SE DÉDUIT : celle retenue aux flèches si elle est
     encore là et active, la première active sinon. */
  const listboxId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const enabledItems = (items ?? []).filter((item) => !item.disabled);
  const active = enabledItems.find((item) => item.id === activeId) ?? enabledItems[0];
  const optionId = (item: CommandPaletteItem) => `${listboxId}-${item.id}`;
  const choose = (item: CommandPaletteItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    onItemSelect?.(item.id);
  };
  const handleComboboxKeys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && active) {
      event.preventDefault();
      choose(active);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    if (enabledItems.length === 0) return;
    const index = active ? enabledItems.indexOf(active) : -1;
    const step = event.key === 'ArrowDown' ? 1 : -1;
    const next = enabledItems[(index + step + enabledItems.length) % enabledItems.length];
    setActiveId(next.id);
    /* L'OPTION ACTIVE RESTE À L'ÉCRAN (ACC-05). Le focus reste dans la
       recherche : l'option n'est désignée que par `aria-activedescendant`, et
       sa surbrillance est la seule marque visible. Sans défilement, elle
       sortait du dialogue après une douzaine de flèches. `nearest` ne bouge
       rien tant qu'elle est déjà visible. L'option existe déjà dans le DOM —
       seule sa marque change —, donc on peut la viser tout de suite. */
    const option = document.getElementById(optionId(next));
    if (typeof option?.scrollIntoView === 'function') option.scrollIntoView({ block: 'nearest' });
  };
  const combobox = items
    ? ({
        role: 'combobox',
        'aria-expanded': items.length > 0,
        'aria-controls': listboxId,
        'aria-autocomplete': 'list',
        'aria-activedescendant': active ? optionId(active) : undefined,
        onKeyDown: handleComboboxKeys,
      } as const)
    : {};

  return (
    <Modal
      {...rest}
      open={open}
      onOpenChange={close}
      liquidGlass={liquidGlass}
      labels={{ close: labels.close }}
      title={labels.title}
      footer={
        close && footerClose ? (
          <Button variant="text" onClick={closeClickHandler(onOpenChange, onClose)}>
            {labels.close}
          </Button>
        ) : undefined
      }
    >
      <div className="opale-command-palette__content">
        {/* Le dialogue est déjà un repère : la recherche n'en ajoute pas. */}
        <Input
          ref={searchRef}
          type="search"
          searchLandmark={false}
          {...combobox}
          label={labels.search}
          value={query}
          onChange={(event) => {
            const next = event.currentTarget.value;
            setQuery(next);
            onChange?.(next);
          }}
        />
        {items && (
          <>
            <div
              id={listboxId}
              role="listbox"
              aria-label={labels.results}
              className="opale-command-palette__results opale-command-palette__listbox"
            >
              {items.map((item) => (
                /* Le focus reste dans la recherche : l'option est désignée par
                   `aria-activedescendant`, pas focalisée. */
                /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus --
                   Le clavier est porté par la combobox, comme dans `MultiSelect`. */
                <div
                  key={item.id}
                  id={optionId(item)}
                  role="option"
                  aria-selected={item === active}
                  aria-disabled={item.disabled ? true : undefined}
                  className="opale-command-palette__option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(item)}
                >
                  <span className="opale-command-palette__option-label">{item.label}</span>
                  {item.description && (
                    <span className="opale-command-palette__option-description">
                      {item.description}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div role="status" className="opale-visually-hidden">
              {labels.resultCount(items.length)}
            </div>
          </>
        )}
        {children && <div className="opale-command-palette__results">{children}</div>}
      </div>
    </Modal>
  );
}

/** Les textes de `Breadcrumb`. */
export interface BreadcrumbLabels {
  /** Le nom du repère, quand `aria-label` n'est pas passé. Défaut : « Fil d'Ariane ». */
  navigation: string;
}

const DEFAULT_BREADCRUMB_LABELS: BreadcrumbLabels = { navigation: "Fil d'Ariane" };

export interface BreadcrumbProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  /**
   * Les étapes du fil, de la racine à la page courante ; la dernière est marquée
   * `aria-current="page"`. Défaut : aucune.
   */
  items?: readonly NavItem[];
  /**
   * Le crochet du routeur pour les étapes avec `href`, avec le contrat de
   * `Navbar.onNavigate` : clic gauche simple seulement, navigation native
   * annulée par le fil.
   */
  onNavigate?: NavigateHandler<NavItem>;
  /** Remplace les textes français par défaut, clé par clé. `aria-label` gagne sur `labels.navigation`. */
  labels?: Partial<BreadcrumbLabels>;
  /** Pose le fil sur le matériau « verre liquide ». Original par défaut. */
  liquidGlass?: boolean;
}

export function Breadcrumb({
  items = [],
  onNavigate,
  labels: labelsProp,
  liquidGlass = false,
  className,
  ...rest
}: BreadcrumbProps) {
  const labels = resolveLabels(DEFAULT_BREADCRUMB_LABELS, labelsProp);
  const Shell = liquidGlass ? Glass : 'nav';
  const shellProps = liquidGlass
    ? ({ as: 'nav', rootClassName: 'opale-breadcrumb--glass-root' } as const)
    : {};
  return (
    /* UNE LISTE ORDONNÉE, ET UN MAILLON COURANT. Le fil était une suite de
       `<span>` : rien n'annonçait « liste de quatre éléments, élément deux »,
       et aucun `aria-current` ne disait où l'on se trouve — sur le composant
       dont c'est l'unique fonction (WCAG 1.3.1). */
    <Shell
      aria-label={labels.navigation}
      {...rest}
      {...shellProps}
      className={clsx('opale-breadcrumb', liquidGlass && 'opale-breadcrumb--glass', className)}
    >
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
                <a
                  href={item.href}
                  aria-current={current}
                  onClick={(event) => navigateOnClick(item, event, onNavigate)}
                >
                  {item.label}
                </a>
              ) : (
                <span aria-current={current}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </Shell>
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
/* Même durée que la sortie « slide-from-bottom » de Toast. */
const COOKIE_EXIT_MS = 240;

/** Les textes de `CookieBanner`. */
export interface CookieBannerLabels {
  /** Le nom de la région, quand `aria-label` n'est pas passé. Défaut : « Consentement aux cookies ». */
  region: string;
  /** Défaut : « Cookies ». */
  title: string;
  /** Le message, quand `children` n'est pas passé. */
  message: string;
  /** Défaut : « Refuser ». */
  decline: string;
  /** Défaut : « Accepter ». */
  accept: string;
}

const DEFAULT_COOKIE_BANNER_LABELS: CookieBannerLabels = {
  region: 'Consentement aux cookies',
  title: 'Cookies',
  message: 'Nous utilisons des cookies pour améliorer votre expérience.',
  decline: 'Refuser',
  accept: 'Accepter',
};

/** Les props de `CookieBanner`. `ref` et les attributs vont à la `<section>` nommée. */
export interface CookieBannerProps extends ComponentPropsWithRef<'section'> {
  /** Passé, il décide seul de l'affichage ; omis, le bandeau suit le choix mémorisé. */
  open?: boolean;
  /** Appelée avec `false` quand l'utilisateur choisit. Le bandeau ne s'ouvre jamais de lui-même. */
  onOpenChange?: (open: boolean) => void;
  /** Le message du bandeau. Défaut : `labels.message`. */
  children?: ReactNode;
  /** Appelée au clic sur Accepter, une fois le choix mémorisé. */
  onAccept?: () => void;
  /** Appelée au clic sur Refuser, une fois le choix mémorisé. */
  onDecline?: () => void;
  /** Clé de `localStorage` où le choix est mémorisé ; `null` coupe la mémoire. */
  storageKey?: string | null;
  /** Remplace les textes français par défaut, clé par clé. `children` gagne sur `labels.message`. */
  labels?: Partial<CookieBannerLabels>;
  /** Rend le bandeau dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

export function CookieBanner({
  open,
  onOpenChange,
  children,
  onAccept,
  onDecline,
  storageKey = COOKIE_CONSENT_KEY,
  labels: labelsProp,
  liquidGlass = false,
  className,
  ...rest
}: CookieBannerProps) {
  const stored = useSyncExternalStore(
    subscribeConsent,
    () => readCachedCookieConsent(storageKey),
    () => null,
  );
  const [decided, setDecided] = useState<CookieConsent | null>(null);
  const textId = useId();
  const labels = resolveLabels(DEFAULT_COOKIE_BANNER_LABELS, labelsProp);
  const visible = open ?? !(decided ?? stored);
  const [wasVisible, setWasVisible] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  /* Le bandeau fixe ne doit pas couvrir l'élément atteint au clavier. */
  useScrollPadding(anchorRef, 'bottom', visible);

  /* La sortie animée suit un clic ou la fermeture pilotée par `open`. Une
     préférence déjà mémorisée, découverte après hydratation, se retire tout
     de suite pour ne pas laisser clignoter un bandeau devenu inutile. */
  if (visible !== wasVisible) {
    setWasVisible(visible);
    setLeaving(!visible && (decided !== null || open === false));
  }

  useEffect(() => {
    if (!leaving) return undefined;
    const timeout = window.setTimeout(() => setLeaving(false), COOKIE_EXIT_MS);
    return () => window.clearTimeout(timeout);
  }, [leaving]);

  /* LE CHOIX REND LE FOCUS (ACC-10). Le bandeau devient inerte dès le clic,
     puis se retire : le bouton pressé perdait le focus, qui tombait sur
     <body>. Il retourne à l'élément d'où il était entré dans le bandeau —
     AVANT l'inertie, qui l'expulserait sinon. */
  const focusOrigin = useRef<HTMLElement | null>(null);
  const decide = (choice: CookieConsent) => {
    returnFocus(anchorRef.current, focusOrigin.current);
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, choice);
      } catch {
        /* Stockage inaccessible : le choix vaut pour cette visite. */
      }
    }
    setDecided(choice);
    notifyConsent();
    onOpenChange?.(false);
    (choice === 'accepted' ? onAccept : onDecline)?.();
  };

  if (!visible && !leaving) return null;

  const Shell = liquidGlass ? Glass : 'section';
  const shellProps = liquidGlass
    ? ({ as: 'section', rootClassName: 'opale-cookie-banner--glass-root' } as const)
    : {};

  return (
    <div
      ref={anchorRef}
      className="opale-cookie-banner-anchor"
      onFocus={(event) => rememberFocusOrigin(event, focusOrigin)}
    >
      <div
        className={clsx(
          toastMotion.card,
          toastMotion.slideFromBottom,
          leaving && toastMotion.leaving,
        )}
        inert={leaving}
        aria-hidden={leaving ? true : undefined}
      >
        <Shell
          aria-label={labels.region}
          aria-describedby={textId}
          {...rest}
          {...shellProps}
          className={clsx(
            'opale-cookie-banner',
            liquidGlass && 'opale-cookie-banner--glass',
            className,
          )}
        >
          <div className="opale-cookie-banner__copy">
            <strong>{labels.title}</strong>
            <div id={textId}>{children === undefined ? labels.message : children}</div>
          </div>
          <div className="opale-cookie-banner__actions">
            <Button variant="danger" size="small" onClick={() => decide('declined')}>
              {labels.decline}
            </Button>
            <Button variant="primary" size="small" onClick={() => decide('accepted')}>
              {labels.accept}
            </Button>
          </div>
        </Shell>
      </div>
    </div>
  );
}

/** Les textes de `SelectionBar`. */
export interface SelectionBarLabels {
  /** Le compte annoncé. Défaut : « 1 sélectionné », « 3 sélectionnés ». */
  count: (count: number) => string;
}

const DEFAULT_SELECTION_BAR_LABELS: SelectionBarLabels = {
  count: (count) => `${count} sélectionné${count > 1 ? 's' : ''}`,
};

export interface SelectionBarProps extends ComponentPropsWithRef<'div'> {
  /** Le nombre d'éléments sélectionnés, annoncé à chaque changement. Défaut : `0`. */
  selectedCount?: number;
  /** Les actions sur la sélection, des `Button` le plus souvent. */
  children?: ReactNode;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<SelectionBarLabels>;
  /** Rend la barre dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

export function SelectionBar({
  selectedCount = 0,
  children,
  labels: labelsProp,
  liquidGlass = false,
  className,
  ...rest
}: SelectionBarProps) {
  const labels = resolveLabels(DEFAULT_SELECTION_BAR_LABELS, labelsProp);
  return (
    <Surface
      {...rest}
      liquidGlass={liquidGlass}
      className={clsx('opale-selection-bar', 'opale-panel', className)}
    >
      {/* LE COMPTE CHANGEAIT SANS UN MOT. On cochait des lignes et le total
          n'était jamais annoncé (WCAG 4.1.3). La région est montée en
          permanence avec la barre, donc elle est surveillée avant que le
          nombre ne bouge — c'est la condition pour qu'une annonce parte. */}
      <span aria-live="polite">{labels.count(selectedCount)}</span>
      {children}
    </Surface>
  );
}
