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

import { FloatingSurface } from '../popover/FloatingSurface';
import type { AnchorAlign, AnchorSide } from '../../shared/anchor-position';
import { floatingLayerOf } from '../../shared/floating-layer';
import { returnFocusAfterRemoval } from '../../shared/focus-return';
import { mergeRefs } from '../../shared/merge-refs';
import { PageThemeContext, pageThemeAttributes } from '../../shared/page-theme-context';
import { activeElementOf } from '../../shared/tree-root';
import { useAnchorPosition } from '../../shared/use-anchor-position';
import { useControllableState } from '../../shared/use-controllable-state';
import { useDocumentBody } from '../../shared/use-document-body';
import { useOutsidePress } from '../../shared/use-outside-press';

import styles from './style/DropdownMenu.module.css';

/* =============================================================================
   LE MENU DÉROULANT, SELON LE MOTIF « MENU BUTTON » DE L'APG.

   POURQUOI UN SECOND MENU. `Menu`, dans le catalogue, est un `<details>` : un
   panneau qui se déplie dans le flux, sans rôle de menu, sans flèches, sans
   recherche par lettre. C'est une divulgation de navigation, et il le reste.
   Celui-ci est un MENU D'ACTIONS au sens d'ARIA, et il en tient le contrat.

   LE CONTRAT, POINT PAR POINT.

     — LE BOUTON annonce `aria-haspopup="menu"` et `aria-expanded`. Clic,
       Entrée, Espace ou Flèche bas ouvrent sur le premier élément ; Flèche
       haut sur le dernier.

     — LE MENU (`role="menu"`, nommé par le bouton) porte des éléments
       `menuitem`, `menuitemcheckbox` et `menuitemradio`. Aucun n'est un arrêt
       de tabulation : le focus s'y déplace aux flèches (en bouclant), à Début
       et Fin, et par la saisie de leurs premières lettres.

     — UN ÉLÉMENT DÉSACTIVÉ RESTE ATTEIGNABLE, comme le demande l'APG : on doit
       pouvoir lire qu'une action existe et qu'elle est indisponible. Il porte
       `aria-disabled` et ne s'active pas.

     — ENTRÉE ET ESPACE ACTIVENT, le clic aussi, par un seul chemin : la
       touche déclenche le `click` de l'élément. Un `menuitem` referme le menu
       et rend le focus au bouton ; une case ou un bouton radio le laisse
       ouvert, pour cocher plusieurs choses de suite (`closeOnSelect` change
       l'un et l'autre).

     — ÉCHAP REFERME ET REND LE FOCUS AU BOUTON, et il est consommé : une
       modale englobante reste ouverte. TAB referme aussi, et le focus
       poursuit depuis le bouton — le menu n'est pas une étape de la page.

     — LE POINTEUR DÉPLACE LE FOCUS. Survoler un élément le focalise : la
       surbrillance du pointeur et celle du clavier sont la même.

   CE QUI N'EST PAS FAIT : les sous-menus. Un menu d'actions qui en a besoin
   est souvent un menu trop chargé ; le jour où il le faudra, ce sera une
   partie de plus, sans rien changer à celles-ci.

   LES PARTIES SONT EXPORTÉES SOUS LEUR NOM, pour les Server Components.
   ========================================================================== */

/** Le côté du bouton où se pose le menu. */
export type DropdownMenuPlacement = AnchorSide;
/** L'alignement du menu sur le bouton. */
export type DropdownMenuAlign = AnchorAlign;

type FocusIntent = 'first' | 'last';

interface DropdownMenuContextValue {
  readonly open: boolean;
  readonly openWith: (intent: FocusIntent) => void;
  readonly close: (returnFocus: boolean) => void;
  readonly triggerId: string;
  readonly contentId: string;
  readonly trigger: HTMLElement | null;
  readonly triggerRef: RefObject<HTMLElement | null>;
  readonly registerTrigger: (node: HTMLElement | null) => () => void;
  readonly intentRef: RefObject<FocusIntent>;
  readonly markInside: () => void;
  readonly select: (value: string | undefined) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useMenuContext(part: string): DropdownMenuContextValue {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error(`${part} doit être rendu à l’intérieur de DropdownMenu.`);
  return context;
}

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

function itemsOf(menu: HTMLElement): HTMLElement[] {
  return Array.from(menu.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
}

const labelOf = (item: HTMLElement): string =>
  (item.dataset.textValue ?? item.textContent ?? '').trim().toLowerCase();

/* LA RECHERCHE PAR LETTRE. Une lettre seule cherche À PARTIR DE L'ÉLÉMENT
   SUIVANT — taper « s » deux fois passe d'un « S… » au suivant ; plusieurs
   lettres cherchent à partir de l'élément COURANT, qui correspond peut-être
   déjà au préfixe qu'on complète. La même lettre répétée (« ss ») revient au
   premier cas. Rien ne correspond : le focus ne bouge pas. */
function findByPrefix(items: HTMLElement[], current: number, buffer: string): HTMLElement | null {
  const repeated = buffer.length > 1 && [...buffer].every((character) => character === buffer[0]);
  const search = repeated ? buffer[0] : buffer;
  const start = search.length === 1 ? current + 1 : Math.max(current, 0);
  for (let step = 0; step < items.length; step += 1) {
    const candidate = items[(start + step) % items.length];
    if (labelOf(candidate).startsWith(search)) return candidate;
  }
  return null;
}

const TYPEAHEAD_RESET_MS = 500;

export interface DropdownMenuProps {
  /** Ouvert ou non ; présent, il rend l'appelant maître. */
  open?: boolean;
  /** L'état d'ouverture initial, sans contrôle. Défaut : `false`. */
  defaultOpen?: boolean;
  /** Appelée à chaque intention d'ouvrir ou de fermer. */
  onOpenChange?: (open: boolean) => void;
  /** Appelée avec la `value` de l'élément activé, quel que soit son genre. */
  onSelect?: (value: string) => void;
  /** `DropdownMenuTrigger` et `DropdownMenuContent`. */
  children?: ReactNode;
}

/** La racine : elle tient l'état, et ne rend aucun élément. */
function DropdownMenu({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onSelect,
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useControllableState(openProp, defaultOpen, onOpenChange);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const intentRef = useRef<FocusIntent>('first');
  const baseId = useId();

  const registerTrigger = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
    if (node) setTrigger(node);
    return () => {
      triggerRef.current = null;
    };
  }, []);

  const openWith = useCallback(
    (next: FocusIntent) => {
      intentRef.current = next;
      setOpen(true);
    },
    [setOpen],
  );

  const close = useCallback(
    (returnFocus: boolean) => {
      if (returnFocus) triggerRef.current?.focus();
      setOpen(false);
    },
    [setOpen],
  );

  const closeFromOutside = useCallback(() => setOpen(false), [setOpen]);
  const { markInside } = useOutsidePress(open, closeFromOutside);

  const select = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) onSelect?.(value);
    },
    [onSelect],
  );

  const context = useMemo<DropdownMenuContextValue>(
    () => ({
      open,
      openWith,
      close,
      triggerId: `${baseId}-trigger`,
      contentId: `${baseId}-content`,
      trigger,
      triggerRef,
      registerTrigger,
      intentRef,
      markInside,
      select,
    }),
    [baseId, close, markInside, open, openWith, registerTrigger, select, trigger],
  );

  return <DropdownMenuContext.Provider value={context}>{children}</DropdownMenuContext.Provider>;
}

export type DropdownMenuTriggerProps = ComponentPropsWithoutRef<'button'> & {
  /** La référence du bouton déclencheur, fusionnée avec celle du menu. */
  ref?: Ref<HTMLButtonElement>;
};

/** Le bouton qui ouvre le menu. Sans style propre : posez la classe d'un bouton. */
function DropdownMenuTrigger({
  ref,
  className,
  id,
  type = 'button',
  onClick,
  onKeyDown,
  onPointerDown,
  ...rest
}: DropdownMenuTriggerProps) {
  const { open, openWith, close, triggerId, contentId, registerTrigger, markInside } =
    useMenuContext('DropdownMenuTrigger');
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
      className={clsx('opale-dropdown-menu__trigger', className)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
        onPointerDown?.(event);
        markInside();
      }}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (open) close(false);
        else openWith('first');
      }}
      onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          openWith(event.key === 'ArrowDown' ? 'first' : 'last');
        }
      }}
    />
  );
}

export type DropdownMenuContentProps = ComponentPropsWithoutRef<'div'> & {
  /** Le côté préféré ; le menu bascule du côté opposé si la place manque. Défaut : `bottom`. */
  placement?: DropdownMenuPlacement;
  /** L'alignement sur le bouton. Défaut : `start`. */
  align?: DropdownMenuAlign;
  /** L'écart entre le bouton et le menu, en pixels. Défaut : 4. */
  offset?: number;
  /** Rend le menu dans le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /** Le conteneur du portail. Défaut : `<body>`, ou la couche de la modale englobante. */
  portalContainer?: HTMLElement | null;
  /** Le menu, celui qui porte `role="menu"`. */
  ref?: Ref<HTMLDivElement>;
};

/** La liste des éléments, rendue dans un portail contre son bouton. */
function DropdownMenuContent({
  placement = 'bottom',
  align = 'start',
  offset = 4,
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
}: DropdownMenuContentProps) {
  const { open, close, contentId, trigger, triggerRef, intentRef, markInside } =
    useMenuContext('DropdownMenuContent');
  const positionerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const typeahead = useRef({
    buffer: '',
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  });

  const menuRefs = useCallback(
    (node: HTMLDivElement | null) => {
      const release = mergeRefs(menuRef, ref)(node);
      return () => {
        if (node) returnFocusAfterRemoval(node, triggerRef);
        if (typeof release === 'function') release();
      };
    },
    [ref, triggerRef],
  );

  const body = useDocumentBody();
  const container = body && trigger ? (portalContainer ?? floatingLayerOf(trigger, body)) : null;
  const visible = open && container !== null;

  useAnchorPosition(positionerRef, trigger, { enabled: visible, side: placement, align, offset });

  /* À L'OUVERTURE, LE FOCUS VA AU PREMIER OU AU DERNIER ÉLÉMENT, selon la
     touche qui a ouvert. Un menu vide garde le focus sur lui-même. */
  useEffect(() => {
    const menu = menuRef.current;
    if (!visible || !menu) return;
    const items = itemsOf(menu);
    const target = intentRef.current === 'last' ? items[items.length - 1] : items[0];
    (target ?? menu).focus({ preventScroll: true });
    intentRef.current = 'first';
  }, [intentRef, visible]);

  useEffect(() => {
    const state = typeahead.current;
    return () => clearTimeout(state.timer);
  }, []);

  const pageTheme = useContext(PageThemeContext);

  if (!visible) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    const menu = event.currentTarget;
    if (event.defaultPrevented || !(event.target instanceof Node) || !menu.contains(event.target))
      return;

    const items = itemsOf(menu);
    const active = activeElementOf(menu);
    const current = items.findIndex((candidate) => candidate === active);
    const focusAt = (index: number) => items[(index + items.length) % items.length]?.focus();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(current + 1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(current === -1 ? -1 : current - 1);
        return;
      case 'Home':
      case 'PageUp':
        event.preventDefault();
        focusAt(0);
        return;
      case 'End':
      case 'PageDown':
        event.preventDefault();
        focusAt(-1);
        return;
      case 'Escape':
        event.preventDefault();
        close(true);
        return;
      case 'Tab':
        /* Le focus repart du bouton ; `Tab` le fait avancer depuis lui. */
        if (event.shiftKey) event.preventDefault();
        close(true);
        return;
      case 'Enter':
      case ' ':
        if (current !== -1 && !(event.key === ' ' && typeahead.current.buffer)) {
          event.preventDefault();
          items[current].click();
          return;
        }
        break;
      default:
        break;
    }

    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    const state = typeahead.current;
    state.buffer += event.key.toLowerCase();
    clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.buffer = '';
    }, TYPEAHEAD_RESET_MS);
    findByPrefix(items, current, state.buffer)?.focus();
  };

  const labelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : trigger?.id || undefined);

  return createPortal(
    <div
      ref={positionerRef}
      className={clsx('opale-dropdown-menu', styles.positioner)}
      data-side={placement}
      {...pageThemeAttributes(pageTheme)}
    >
      <FloatingSurface
        {...rest}
        ref={menuRefs}
        liquidGlass={liquidGlass}
        id={contentId}
        role="menu"
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        rootClassName={clsx('opale-dropdown-menu__shell', styles.shell)}
        className={clsx('opale-dropdown-menu__content', styles.content, className)}
        onKeyDown={handleKeyDown}
        onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
          onPointerDown?.(event);
          markInside();
        }}
      >
        {children}
      </FloatingSurface>
    </div>,
    container,
  );
}

/* =============================================================================
   LES ÉLÉMENTS. Un seul gabarit pour les trois rôles : il pose le rôle, l'état
   désactivé, la recherche par lettre et le focus au survol, et il n'appelle
   son action qu'au `click` — que la touche Entrée ou Espace déclenche aussi.
   ========================================================================== */

type ItemBaseProps = Omit<ComponentPropsWithoutRef<'div'>, 'onSelect'> & {
  /** Indisponible : atteignable et lisible, mais sans effet. */
  disabled?: boolean;
  /** Le texte cherché par la saisie de lettres, quand le contenu n'est pas du texte simple. */
  textValue?: string;
  /** La référence de l'élément de menu. */
  ref?: Ref<HTMLDivElement>;
};

interface ItemFrameProps extends ItemBaseProps {
  role: 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';
  checked?: boolean;
  indicator?: ReactNode;
  onActivate: () => void;
}

function ItemFrame({
  role,
  checked,
  indicator,
  disabled = false,
  textValue,
  onActivate,
  className,
  children,
  onClick,
  onPointerMove,
  ref,
  ...rest
}: ItemFrameProps) {
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- Entrée et Espace sont écoutés sur le menu, qui déclenche ce `click` : voir `handleKeyDown`
    <div
      {...rest}
      ref={ref}
      role={role}
      tabIndex={-1}
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      data-text-value={textValue}
      className={clsx(
        'opale-dropdown-menu__item',
        styles.item,
        indicator !== undefined && styles.withIndicator,
        className,
      )}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        if (disabled || event.defaultPrevented) return;
        onActivate();
      }}
      onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
        onPointerMove?.(event);
        const item = event.currentTarget;
        if (activeElementOf(item) !== item) item.focus({ preventScroll: true });
      }}
    >
      {indicator !== undefined && (
        <span
          className={clsx('opale-dropdown-menu__indicator', styles.indicator)}
          aria-hidden="true"
        >
          {indicator}
        </span>
      )}
      {children}
    </div>
  );
}

export type DropdownMenuItemProps = ItemBaseProps & {
  /** La valeur passée au `onSelect` du menu. */
  value?: string;
  /** Appelée à l'activation, avant la fermeture. */
  onSelect?: () => void;
  /** Referme le menu après l'activation. Défaut : `true`. */
  closeOnSelect?: boolean;
};

/** Une action du menu (`role="menuitem"`). */
function DropdownMenuItem({
  value,
  onSelect,
  closeOnSelect = true,
  ...rest
}: DropdownMenuItemProps) {
  const { close, select } = useMenuContext('DropdownMenuItem');
  return (
    <ItemFrame
      {...rest}
      role="menuitem"
      onActivate={() => {
        onSelect?.();
        select(value);
        if (closeOnSelect) close(true);
      }}
    />
  );
}

/* La coche : un tracé, pas un caractère — même raison que la croix de `Modal`. */
const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} focusable="false">
    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export type DropdownMenuCheckboxItemProps = ItemBaseProps & {
  /** La valeur passée au `onSelect` du menu. */
  value?: string;
  /** Coché ou non ; présent, il rend l'appelant maître. */
  checked?: boolean;
  /** L'état initial, sans contrôle. Défaut : `false`. */
  defaultChecked?: boolean;
  /** Appelée avec le nouvel état à chaque activation. */
  onCheckedChange?: (checked: boolean) => void;
  /** Referme le menu après l'activation. Défaut : `false`. */
  closeOnSelect?: boolean;
};

/** Une option à cocher (`role="menuitemcheckbox"`). */
function DropdownMenuCheckboxItem({
  value,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  closeOnSelect = false,
  ...rest
}: DropdownMenuCheckboxItemProps) {
  const { close, select } = useMenuContext('DropdownMenuCheckboxItem');
  const [checked, setChecked] = useControllableState(checkedProp, defaultChecked, onCheckedChange);
  return (
    <ItemFrame
      {...rest}
      role="menuitemcheckbox"
      checked={checked}
      indicator={checked ? CHECK : null}
      onActivate={() => {
        setChecked(!checked);
        select(value);
        if (closeOnSelect) close(true);
      }}
    />
  );
}

interface RadioGroupContextValue {
  readonly value: string | undefined;
  readonly setValue: (next: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export type DropdownMenuGroupProps = ComponentPropsWithoutRef<'div'> & {
  /** Le titre du groupe, affiché et lu comme son nom. */
  label?: ReactNode;
  /** La référence du groupe. */
  ref?: Ref<HTMLDivElement>;
};

/** Un groupe d'éléments (`role="group"`), nommé par son `label`. */
function DropdownMenuGroup({
  label,
  className,
  children,
  'aria-labelledby': ariaLabelledBy,
  ref,
  ...rest
}: DropdownMenuGroupProps) {
  const labelId = useId();
  const hasLabel = label !== undefined && label !== null && label !== false;
  return (
    <div
      {...rest}
      ref={ref}
      role="group"
      aria-labelledby={ariaLabelledBy ?? (hasLabel ? labelId : undefined)}
      className={clsx('opale-dropdown-menu__group', styles.group, className)}
    >
      {hasLabel && (
        <div id={labelId} className={clsx('opale-dropdown-menu__label', styles.label)}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

export type DropdownMenuRadioGroupProps = Omit<DropdownMenuGroupProps, 'defaultValue'> & {
  /** L'option retenue ; présente, elle rend l'appelant maître. */
  value?: string;
  /** L'option retenue au départ, sans contrôle. */
  defaultValue?: string;
  /** Appelée avec la valeur de l'option activée. */
  onValueChange?: (value: string) => void;
};

/** Un groupe d'options exclusives, qui porte la valeur retenue. */
function DropdownMenuRadioGroup({
  value: valueProp,
  defaultValue,
  onValueChange,
  ...rest
}: DropdownMenuRadioGroupProps) {
  const handleChange = useCallback(
    (next: string | undefined) => {
      if (next !== undefined) onValueChange?.(next);
    },
    [onValueChange],
  );
  const [value, setValue] = useControllableState<string | undefined>(
    valueProp,
    defaultValue,
    handleChange,
  );
  const context = useMemo<RadioGroupContextValue>(() => ({ value, setValue }), [setValue, value]);
  return (
    <RadioGroupContext.Provider value={context}>
      <DropdownMenuGroup {...rest} />
    </RadioGroupContext.Provider>
  );
}

export type DropdownMenuRadioItemProps = ItemBaseProps & {
  /** La valeur de l'option, retenue par le groupe et passée au `onSelect` du menu. */
  value: string;
  /** Referme le menu après l'activation. Défaut : `false`. */
  closeOnSelect?: boolean;
};

/** Une option exclusive (`role="menuitemradio"`), dans un `DropdownMenuRadioGroup`. */
function DropdownMenuRadioItem({
  value,
  closeOnSelect = false,
  ...rest
}: DropdownMenuRadioItemProps) {
  const { close, select } = useMenuContext('DropdownMenuRadioItem');
  const group = useContext(RadioGroupContext);
  if (!group) throw new Error('DropdownMenuRadioItem doit être rendu dans DropdownMenuRadioGroup.');
  const checked = group.value === value;
  return (
    <ItemFrame
      {...rest}
      role="menuitemradio"
      checked={checked}
      indicator={checked ? <span className={styles.dot} /> : null}
      onActivate={() => {
        group.setValue(value);
        select(value);
        if (closeOnSelect) close(true);
      }}
    />
  );
}

export type DropdownMenuSeparatorProps = ComponentPropsWithoutRef<'div'> & {
  /** La référence du séparateur. */
  ref?: Ref<HTMLDivElement>;
};

/** Un filet entre deux groupes d'éléments (`role="separator"`). */
function DropdownMenuSeparator({ className, ref, ...rest }: DropdownMenuSeparatorProps) {
  return (
    <div
      {...rest}
      ref={ref}
      role="separator"
      className={clsx('opale-dropdown-menu__separator', styles.separator, className)}
    />
  );
}

export default DropdownMenu;

/* LES PARTIES SOUS LEUR PROPRE NOM, pour les Server Components. */
export {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
};
