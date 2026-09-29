/* Les composants de navigation du catalogue. */

import {
  useEffect,
  useId,
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
import { resolveLabels } from '../shared/labels';
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

export interface NavbarProps extends Omit<
  ComponentPropsWithRef<'nav'>,
  'onSelect' | 'onChange' | 'defaultValue' | 'children'
> {
  items?: readonly NavItem[];
  /** L'entrée courante. Présente, l'appelant la tient ; absente et sans `defaultValue`, aucune. */
  value?: string;
  /** L'entrée courante au montage quand `value` est absente. Seule elle fait retenir le clic. */
  defaultValue?: string;
  /** Ne part que des entrées sans `href` (boutons) ; un lien navigue. */
  onValueChange?: (id: string) => void;
  /** @deprecated Depuis 3.6 — utilisez `value`. */
  activeId?: string;
  /** @deprecated Depuis 3.6 — utilisez `onValueChange`. */
  onSelect?: (id: string) => void;
  /** Le nom du repère ; `aria-label` gagne. Défaut : « Navigation ». */
  label?: string;
  className?: string;
  liquidGlass?: boolean;
}

export function Navbar({
  items = [],
  value,
  defaultValue,
  onValueChange,
  activeId: activeIdProp,
  onSelect,
  label = 'Navigation',
  className,
  liquidGlass = false,
  ...rest
}: NavbarProps) {
  const [activeId, setActiveId] = useOptionalState(value ?? activeIdProp, defaultValue);
  const select = (id: string) => {
    setActiveId(id);
    onValueChange?.(id);
    onSelect?.(id);
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

export interface MenuProps extends ComponentPropsWithRef<'details'> {
  label?: ReactNode;
  items?: readonly NavItem[];
  /** Le nom de la navigation rendue depuis `items`. Défaut : celui de `Navbar`. */
  navigationLabel?: string;
  className?: string;
  children?: ReactNode;
  liquidGlass?: boolean;
}

export function Menu({
  label = 'Menu',
  items = [],
  navigationLabel,
  className,
  children,
  liquidGlass = false,
  ...rest
}: MenuProps) {
  const classes = clsx(
    'opale-surface',
    liquidGlass && 'opale-surface--glass',
    'opale-panel',
    className,
  );
  const content = (
    <>
      <summary>{label}</summary>
      {items.length > 0 ? (
        <Navbar items={items} label={navigationLabel} liquidGlass={liquidGlass} />
      ) : (
        children
      )}
    </>
  );

  if (liquidGlass) {
    return (
      <Glass {...rest} as="details" className={classes} rootClassName="opale-surface--glass-root">
        {content}
      </Glass>
    );
  }

  return (
    <details {...rest} className={classes}>
      {content}
    </details>
  );
}

export interface LinkProps extends ComponentPropsWithRef<'a'> {
  children: ReactNode;
}

export function Link({ children, className, ...props }: LinkProps) {
  return (
    <a className={clsx('opale-link', className)} {...props}>
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
  open?: boolean;
  title?: ReactNode;
  children?: ReactNode;
  /** Appelée avec `false` sur Échap, le voile ou la croix. Sa présence rend la croix. */
  onOpenChange?: (open: boolean) => void;
  /** @deprecated Depuis 3.6 — utilisez `onOpenChange`. */
  onClose?: () => void;
  /** Remplace les textes français par défaut, clé par clé. `title` gagne sur `labels.title`. */
  labels?: Partial<SidePanelLabels>;
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
  ...rest
}: CommandPaletteProps) {
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
        close ? (
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

export interface BreadcrumbProps extends Omit<ComponentPropsWithRef<'nav'>, 'children'> {
  items?: readonly NavItem[];
}

export function Breadcrumb({ items = [], className, ...rest }: BreadcrumbProps) {
  return (
    /* UNE LISTE ORDONNÉE, ET UN MAILLON COURANT. Le fil était une suite de
       `<span>` : rien n'annonçait « liste de quatre éléments, élément deux »,
       et aucun `aria-current` ne disait où l'on se trouve — sur le composant
       dont c'est l'unique fonction (WCAG 1.3.1). */
    <nav aria-label="Fil d'Ariane" {...rest} className={clsx('opale-breadcrumb', className)}>
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
  children?: ReactNode;
  onAccept?: () => void;
  onDecline?: () => void;
  /** Clé de `localStorage` où le choix est mémorisé ; `null` coupe la mémoire. */
  storageKey?: string | null;
  /** Remplace les textes français par défaut, clé par clé. `children` gagne sur `labels.message`. */
  labels?: Partial<CookieBannerLabels>;
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

  const decide = (choice: CookieConsent) => {
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
    <div ref={anchorRef} className="opale-cookie-banner-anchor">
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

export interface SelectionBarProps extends ComponentPropsWithRef<'div'> {
  selectedCount?: number;
  children?: ReactNode;
  liquidGlass?: boolean;
}

export function SelectionBar({
  selectedCount = 0,
  children,
  liquidGlass = false,
  className,
  ...rest
}: SelectionBarProps) {
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
      <span aria-live="polite">
        {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
      </span>
      {children}
    </Surface>
  );
}
