import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

type CanopButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'tonal' | 'ghost' | 'text';
type CanopButtonSize = 'small' | 'medium' | 'large';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  liquidGlass?: boolean;
}

function Surface({ liquidGlass = false, className, children, ...props }: SurfaceProps) {
  return (
    <div
      className={cx('canop-surface', liquidGlass && 'canop-liquid', className)}
      data-liquid-glass={liquidGlass ? 'true' : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CanopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CanopButtonVariant;
  size?: CanopButtonSize;
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
  liquidGlass?: boolean;
}

export const CanopButton = forwardRef<HTMLButtonElement, CanopButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      loading = false,
      startIcon,
      endIcon,
      fullWidth = false,
      liquidGlass = false,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      className={cx(
        'canop-button',
        `canop-button--${variant}`,
        size !== 'medium' && `canop-button--${size}`,
        fullWidth && 'canop-button--full',
        liquidGlass && 'canop-liquid',
        className,
      )}
      data-liquid-glass={liquidGlass ? 'true' : undefined}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading ? <span className="canop-spinner" aria-hidden="true" /> : startIcon}
      <span>{children}</span>
      {!loading && endIcon}
    </button>
  ),
);
CanopButton.displayName = 'CanopButton';

export const CanopPressable = forwardRef<HTMLButtonElement, CanopButtonProps>((props, ref) => (
  <CanopButton ref={ref} variant="text" {...props} />
));
CanopPressable.displayName = 'CanopPressable';

export interface CanopCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  elevation?: 0 | 1 | 2 | 3;
  liquidGlass?: boolean;
}

export function CanopCard({ title, subtitle, actions, footer, elevation = 1, liquidGlass = false, className, children, ...props }: CanopCardProps) {
  return (
    <Surface className={cx('canop-card', `canop-card--e${elevation}`, className)} liquidGlass={liquidGlass} {...props}>
      {(title || subtitle || actions) && (
        <div className="canop-card__header">
          <div>
            {title && <h3 className="canop-card__title">{title}</h3>}
            {subtitle && <p className="canop-card__subtitle">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="canop-card__body">{children}</div>
      {footer && <div className="canop-card__footer">{footer}</div>}
    </Surface>
  );
}

export function CanopCardGrid({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('canop-card-grid', className)} {...props}>{children}</div>;
}

export interface CanopFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  icon?: ReactNode;
  liquidGlass?: boolean;
}

export const CanopInput = forwardRef<HTMLInputElement, CanopFieldProps>(
  ({ label, helperText, error, icon, liquidGlass = false, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <label className={cx('canop-field', className)} htmlFor={inputId}>
        {label && <span className="canop-field__label">{label}</span>}
        <span className={cx('canop-input-shell', liquidGlass && 'canop-liquid')}>
          {icon}
          <input ref={ref} id={inputId} className="canop-input" {...props} />
        </span>
        {(error || helperText) && <span className={cx('canop-field__helper', Boolean(error) && 'canop-field__helper--error')}>{error || helperText}</span>}
      </label>
    );
  },
);
CanopInput.displayName = 'CanopInput';

export interface CanopCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
}

export function CanopCheckbox({ label, description, className, ...props }: CanopCheckboxProps) {
  return (
    <label className={cx('canop-checkbox-row', className)}>
      <input type="checkbox" className="canop-checkbox" {...props} />
      <span className="canop-checkbox-mark" aria-hidden="true" />
      <span>{label ?? description}</span>
      {label && description && <small className="canop-field__helper">{description}</small>}
    </label>
  );
}

export interface CanopToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  liquidGlass?: boolean;
}

export function CanopToggle({ label, liquidGlass = false, className, ...props }: CanopToggleProps) {
  return (
    <label className={cx('canop-toggle-row', liquidGlass && 'canop-liquid', className)}>
      <input type="checkbox" className="canop-toggle" {...props} />
      <span className="canop-toggle-track" aria-hidden="true"><span className="canop-toggle-thumb" /></span>
      {label && <span>{label}</span>}
    </label>
  );
}

export interface CanopSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  valueLabel?: ReactNode;
}

export function CanopSlider({ label, valueLabel, className, ...props }: CanopSliderProps) {
  return (
    <label className={cx('canop-field', className)}>
      {(label || valueLabel) && <span className="canop-card__header"><span className="canop-field__label">{label}</span><span>{valueLabel ?? props.value}</span></span>}
      <input type="range" className="canop-range" {...props} />
    </label>
  );
}

export interface CanopSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  helperText?: ReactNode;
  options?: readonly { value: string; label: ReactNode }[];
  liquidGlass?: boolean;
}

export function CanopSelect({ label, helperText, options, liquidGlass = false, className, id, children, ...props }: CanopSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <label className={cx('canop-field', className)} htmlFor={selectId}>
      {label && <span className="canop-field__label">{label}</span>}
      <span className={cx('canop-input-shell', liquidGlass && 'canop-liquid')}>
        <select id={selectId} className="canop-select" {...props}>
          {options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          {children}
        </select>
      </span>
      {helperText && <span className="canop-field__helper">{helperText}</span>}
    </label>
  );
}

export interface CanopMultiSelectProps extends CanopSelectProps {
  values?: readonly string[];
}

/**
 * La sélection multiple, habillée aux couleurs d'Opale.
 *
 * ================================================================
 * POURQUOI CE COMPOSANT N'EST PLUS UN `<select multiple>` VISIBLE.
 *
 * Il en était un, et c'était un mur : la liste déroulante multiple native est
 * la SEULE commande de formulaire qu'aucune feuille de style ne peut habiller.
 * Ses rangées sélectionnées sont peintes par le système d'exploitation — d'où
 * les bandes GRISES qui traversaient le composant au milieu d'une vitrine qui
 * n'a pas une seule autre surface grise. Ni `background`, ni `color`, ni
 * `::selection`, ni `appearance: none` n'ont de prise dessus : le rendu
 * appartient au moteur, pas au document.
 *
 * LE NATIF N'A PAS DISPARU POUR AUTANT — IL EST DEVENU LE PORTEUR DE VALEUR.
 * Un `<select multiple>` reste rendu, masqué visuellement, et c'est lui qui
 * porte les `<option>` et leur état `selected`. Cela préserve À L'IDENTIQUE le
 * contrat des consommateurs : `onChange` reçoit un événement dont
 * `currentTarget.selectedOptions` est la liste attendue, et le champ continue
 * de participer à la soumission d'un formulaire avec son `name`. Réécrire
 * l'API aurait cassé tous les appels existants pour un gain d'apparence.
 *
 * L'ÉVÉNEMENT EST ÉMIS SUR LE NATIF, ET C'EST CE QUI REND L'ILLUSION HONNÊTE.
 * Cocher une option modifie `option.selected` puis distribue un `change` qui
 * bouillonne : React l'entend à la racine et appelle le `onChange` du
 * consommateur avec le vrai `<select>` pour cible. Personne n'a à savoir que
 * la liste visible est faite de `<div>`.
 *
 * LE NATIF EST HORS DE L'ARBRE D'ACCESSIBILITÉ (`aria-hidden`, `tabIndex={-1}`)
 * et la liste VISIBLE porte les rôles. L'inverse — garder le natif focusable
 * et décorer par-dessus — était tentant et faux : un champ focusable invisible
 * est un piège au clavier, d'autant plus depuis que la vitrine ne peint plus
 * d'anneau de focus. Ici, ce qu'on voit est ce qu'on pilote.
 * ================================================================
 */
export function CanopMultiSelect({
  values,
  label,
  helperText,
  options = [],
  liquidGlass = false,
  className,
  id,
  onChange,
  ...props
}: CanopMultiSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const labelId = `${fieldId}-label`;
  const selectRef = useRef<HTMLSelectElement>(null);
  const selected = new Set(values ?? []);

  /* `activeIndex` est l'option DÉSIGNÉE au clavier, distincte des options
     COCHÉES : dans une `listbox` multi-sélection, on parcourt sans choisir et
     l'on choisit sans se déplacer. Les confondre obligerait à cocher tout ce
     qu'on survole en chemin. */
  const [activeIndex, setActiveIndex] = useState(0);

  const toggle = (value: string) => {
    const select = selectRef.current;

    if (!select) return;

    for (const option of Array.from(select.options)) {
      if (option.value === value) option.selected = !option.selected;
    }

    /* `bubbles`, sans quoi React ne verra rien : son écouteur n'est pas posé
       sur le `<select>` mais à la racine de l'arbre. */
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = options.length - 1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => (current >= last ? 0 : current + 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((current) => (current <= 0 ? last : current - 1));
        return;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        return;
      case 'End':
        event.preventDefault();
        setActiveIndex(last);
        return;
      case ' ':
      case 'Enter': {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) toggle(option.value);
        return;
      }
      default:
    }
  };

  return (
    <div className={cx('canop-field', className)}>
      {label && (
        <span className="canop-field__label" id={labelId}>
          {label}
        </span>
      )}

      <select
        ref={selectRef}
        id={fieldId}
        className="canop-visually-hidden"
        multiple
        value={values}
        onChange={onChange}
        aria-hidden="true"
        tabIndex={-1}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {typeof option.label === 'string' ? option.label : option.value}
          </option>
        ))}
      </select>

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role -- la
          `listbox` EST la commande : c'est le motif ARIA de la sélection
          multiple, et les `option` en sont les enfants exigés. */}
      <div
        className={cx('canop-multiselect', liquidGlass && 'canop-liquid')}
        role="listbox"
        aria-multiselectable="true"
        aria-labelledby={label ? labelId : undefined}
        aria-activedescendant={`${fieldId}-option-${activeIndex}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {options.map((option, index) => {
          const isSelected = selected.has(option.value);

          return (
            /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus --
               LES DEUX RÈGLES SE TROMPENT ICI, ET POUR LA MÊME RAISON. Elles
               réclament un écouteur clavier et un `tabIndex` sur l'option. Or
               le motif `listbox` + `aria-activedescendant` veut exactement
               l'inverse : le focus reste sur la LISTE, qui porte tout le
               clavier, et l'option désignée l'est par son identifiant. Rendre
               l'option focusable ajouterait autant d'arrêts de tabulation que
               d'options et couperait la frappe de la liste ; y poser un
               `onKeyDown` serait du code mort, l'élément ne pouvant jamais
               recevoir d'événement clavier. Même arbitrage que le combobox de
               la recherche de la vitrine. */
            <div
              key={option.value}
              id={`${fieldId}-option-${index}`}
              className="canop-multiselect__option"
              role="option"
              aria-selected={isSelected}
              data-active={index === activeIndex ? 'true' : undefined}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setActiveIndex(index);
                toggle(option.value);
              }}
            >
              <span className="canop-multiselect__mark" aria-hidden="true" />
              <span className="canop-multiselect__label">{option.label}</span>
            </div>
          );
        })}
      </div>

      {helperText && <span className="canop-field__helper">{helperText}</span>}
    </div>
  );
}

export interface CanopAutocompleteProps extends CanopFieldProps {
  options?: readonly string[];
}

export function CanopAutocomplete({ options = [], ...props }: CanopAutocompleteProps) {
  const listId = useId();
  return (
    <>
      <CanopInput list={listId} {...props} />
      <datalist id={listId}>{options.map((option) => <option key={option} value={option} />)}</datalist>
    </>
  );
}

export function CanopInlineInput(props: CanopFieldProps) {
  return <CanopInput {...props} />;
}

export interface CanopSegmentedControlProps {
  options: readonly { value: string; label: ReactNode }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

/**
 * Le fond de la sélection est un élément UNIQUE qui glisse sous l'option
 * choisie, et non un fond qui s'allume sur un bouton pendant qu'il s'éteint sur
 * un autre — cette seconde forme ne laisse rien à animer, elle saute.
 *
 * Le raisonnement est celui de `Tabs.List` (voir l'en-tête de
 * `components/tabs/Tabs.tsx`), redit ici parce que ce fichier ne dépend
 * d'AUCUN composant de `components/**` et que c'est délibéré : `canop.tsx` est
 * une feuille autonome, lisible d'un bout à l'autre sans ouvrir le reste du
 * dossier. Les trois points qui comptent :
 *  - `aria-pressed` reste la source de vérité, lue dans le DOM ;
 *  - l'indicateur est `aria-hidden`, il n'annonce rien que `aria-pressed` ne
 *    dise déjà ;
 *  - le premier placement ne s'anime pas, sinon l'indicateur traverserait le
 *    composant à chaque montage.
 *
 * `translate3d` avec les deux axes, et non le seul X : `.canop-segmented` est
 * en `flex-wrap: wrap`, donc les options passent à la ligne dès que la place
 * manque et l'indicateur doit descendre avec elles.
 */
export function CanopSegmentedControl({ options, value, onChange, className }: CanopSegmentedControlProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const hasPlacedRef = useRef(false);

  useLayoutEffect(() => {
    const group = groupRef.current;
    const indicator = indicatorRef.current;

    if (!group || !indicator) return;

    const place = () => {
      const active = group.querySelector<HTMLElement>('[aria-pressed="true"]');

      if (!active) {
        indicator.style.opacity = '0';
        return;
      }

      const groupRect = group.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      /* Rectangles nuls : première mise en page, ou jsdom qui n'a pas de mise
         en page. On ne place rien plutôt que de poser un indicateur de 0 px
         dans le coin, d'où il glisserait à la première vraie mesure. */
      if (activeRect.width === 0 || activeRect.height === 0) return;

      indicator.style.opacity = '1';
      indicator.style.width = `${activeRect.width}px`;
      indicator.style.height = `${activeRect.height}px`;
      indicator.style.transform = `translate3d(${activeRect.left - groupRect.left + group.scrollLeft}px, ${activeRect.top - groupRect.top + group.scrollTop}px, 0)`;

      if (!hasPlacedRef.current) {
        hasPlacedRef.current = true;
        /* Force le calcul de la mise en page : la position ci-dessus devient
           l'état de départ de la transition armée juste après. */
        void indicator.offsetWidth;
        indicator.dataset.animated = 'true';
      }
    };

    place();

    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(place);

    if (observer) {
      observer.observe(group);
      group.querySelectorAll('.canop-segmented__item').forEach((item) => observer.observe(item));
    }

    window.addEventListener('resize', place);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [options, value]);

  return (
    <div ref={groupRef} className={cx('canop-segmented', className)} role="group">
      <span ref={indicatorRef} aria-hidden="true" className="canop-segmented__indicator" />
      {options.map((option) => (
        <button key={option.value} type="button" className="canop-segmented__item" aria-pressed={value === option.value} onClick={() => onChange?.(option.value)}>{option.label}</button>
      ))}
    </div>
  );
}

export function CanopForm({ className, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form className={cx('canop-stack', 'canop-stack--column', className)} {...props} />;
}

export function CanopLanguageSelector({ value = 'FR', onChange, className, ariaLabel = 'Langue' }: { value?: string; onChange?: SelectHTMLAttributes<HTMLSelectElement>['onChange']; className?: string; ariaLabel?: string }) {
  return <CanopSelect className={className} aria-label={ariaLabel} value={value} onChange={onChange} options={[{ value: 'FR', label: 'Français' }, { value: 'EN', label: 'English' }, { value: 'ES', label: 'Español' }]} />;
}

export function CanopThemeToggle({ dark = false, onChange, className }: { dark?: boolean; onChange?: (dark: boolean) => void; className?: string }) {
  return <CanopToggle className={className} aria-label="Thème" checked={dark} onChange={(event) => onChange?.(event.currentTarget.checked)} />;
}

export function CanopAddButton(props: Omit<CanopButtonProps, 'children'>) { return <CanopButton {...props} startIcon="+">Ajouter</CanopButton>; }
export function CanopSaveButton({ onSaved, ...props }: Omit<CanopButtonProps, 'children'> & { onSaved?: () => void }) {
  const [saved, setSaved] = useState(false);
  return <CanopButton {...props} onClick={(event) => { setSaved(true); onSaved?.(); props.onClick?.(event); }}>{saved ? 'Enregistré' : 'Enregistrer'}</CanopButton>;
}
export function CanopApproveButton(props: Omit<CanopButtonProps, 'children'>) { return <CanopButton {...props} variant="primary" startIcon="✓">Valider</CanopButton>; }
export function CanopEditButton(props: Omit<CanopButtonProps, 'children'>) { return <CanopButton {...props} variant="tonal" startIcon="✎">Modifier</CanopButton>; }
export function CanopDeleteButton(props: Omit<CanopButtonProps, 'children'>) { return <CanopButton {...props} variant="danger" startIcon="×">Supprimer</CanopButton>; }
export function CanopIconActionButton({ label = 'Action', ...props }: Omit<CanopButtonProps, 'children'> & { label?: string }) { return <CanopButton {...props} aria-label={label} variant="ghost">{label.slice(0, 1)}</CanopButton>; }

export function CanopBadge({ tone = 'primary', children, className }: { tone?: 'primary' | 'accent' | 'danger'; children: ReactNode; className?: string }) {
  return <span className={cx('canop-badge', tone !== 'primary' && `canop-badge--${tone}`, className)}>{children}</span>;
}

export function CanopStatusChip({ status = 'En production', className }: { status?: string; className?: string }) { return <CanopBadge className={className}>{status}</CanopBadge>; }

export function CanopHeading({ level = 2, children, className }: { level?: 1 | 2 | 3 | 4; children: ReactNode; className?: string }) {
  const Heading = `h${level}` as 'h1';
  return <Heading className={cx('canop-heading', className)}>{children}</Heading>;
}

export function CanopText({ variant = 'body', children, className }: { variant?: 'body' | 'label' | 'caption' | 'metric'; children: ReactNode; className?: string }) {
  return <p className={cx('canop-text', `canop-text--${variant}`, className)}>{children}</p>;
}

export function CanopIcon({ name = '✦', label, className }: { name?: ReactNode; label?: string; className?: string }) {
  return <span className={cx('canop-icon', className)} aria-label={label} role={label ? 'img' : undefined}>{name}</span>;
}

export function CanopFeedback({ severity = 'info', title, children, className }: { severity?: 'success' | 'info' | 'warning' | 'error'; title?: ReactNode; children: ReactNode; className?: string }) {
  return <div className={cx('canop-feedback', `canop-feedback--${severity}`, className)} role={severity === 'error' ? 'alert' : 'status'}><strong>{title ?? severity}</strong><span>{children}</span></div>;
}

export function CanopToast({ message, open = true, onClose, className }: { message: ReactNode; open?: boolean; onClose?: () => void; className?: string }) {
  if (!open) return null;
  return <div className={cx('canop-surface', 'canop-panel', className)} role="status"><span>{message}</span>{onClose && <button className="canop-dialog__close" type="button" onClick={onClose} aria-label="Fermer">×</button>}</div>;
}

export function CanopSpinner({ label = 'Chargement', className }: { label?: string; className?: string }) { return <span className={cx('canop-stack', className)} role="status"><span className="canop-spinner" aria-hidden="true" /><span>{label}</span></span>; }

export function CanopProgressBar({ value = 0, label, className }: { value?: number; label?: string; className?: string }) {
  return <div className={cx('canop-field', className)}>{label && <span className="canop-field__label">{label}</span>}<div className="canop-progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><div className="canop-progress__value" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} /></div></div>;
}

export function CanopConfirmDialog({ open = false, title = 'Confirmer', children, onConfirm, onCancel }: { open?: boolean; title?: ReactNode; children?: ReactNode; onConfirm?: () => void; onCancel?: () => void }) {
  if (!open) return null;
  return <div className="canop-dialog-backdrop"><div className="canop-dialog" role="dialog" aria-modal="true" aria-labelledby="canop-confirm-title"><div className="canop-dialog__header"><h2 id="canop-confirm-title" className="canop-card__title">{title}</h2><button className="canop-dialog__close" type="button" onClick={onCancel} aria-label="Fermer">×</button></div><div className="canop-dialog__body">{children}</div><div className="canop-dialog__footer"><CanopButton variant="text" onClick={onCancel}>Annuler</CanopButton><CanopButton onClick={onConfirm}>Confirmer</CanopButton></div></div></div>;
}

export function CanopEmptyState({ title = 'Aucun résultat', description, action }: { title?: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return <CanopCard className="canop-empty-state" title={title} subtitle={description} actions={action}><CanopIcon name="⌁" /></CanopCard>;
}

export interface CanopNavItem { id: string; label: ReactNode; href?: string; icon?: ReactNode; }
export function CanopNavbar({ items = [], activeId, onSelect, className }: { items?: readonly CanopNavItem[]; activeId?: string; onSelect?: (id: string) => void; className?: string }) {
  return <nav className={cx('canop-surface', 'canop-nav', className)} aria-label="Navigation">{items.map((item) => item.href ? <a key={item.id} href={item.href} className="canop-nav__item" aria-current={activeId === item.id ? 'page' : undefined}>{item.icon}{item.label}</a> : <button key={item.id} type="button" className="canop-nav__item" aria-current={activeId === item.id ? 'page' : undefined} onClick={() => onSelect?.(item.id)}>{item.icon}{item.label}</button>)}</nav>;
}

export function CanopMenu({ label = 'Menu', items = [], className, children }: { label?: ReactNode; items?: readonly CanopNavItem[]; className?: string; children?: ReactNode }) {
  return <details className={cx('canop-surface', 'canop-panel', className)}><summary>{label}</summary>{items.length > 0 ? <CanopNavbar items={items} /> : children}</details>;
}

export function CanopLink({ children, className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) { return <a className={cx('canop-link', className)} {...props}>{children}</a>; }

export function CanopSidePanel({ open = false, title = 'Panneau', children, onClose }: { open?: boolean; title?: ReactNode; children?: ReactNode; onClose?: () => void }) {
  if (!open) return null;
  return <div className="canop-dialog-backdrop"><aside className="canop-dialog" aria-label={typeof title === 'string' ? title : undefined}><div className="canop-dialog__header"><h2 className="canop-card__title">{title}</h2><button className="canop-dialog__close" type="button" onClick={onClose} aria-label="Fermer">×</button></div>{children}</aside></div>;
}

export function CanopSettingsMenu({ children, className }: { children?: ReactNode; className?: string }) { return <CanopMenu className={className} label="Réglages" items={[]}><div className="canop-stack canop-stack--column">{children}</div></CanopMenu>; }
export function CanopCommandPalette({ open = false, value = '', onChange, children }: { open?: boolean; value?: string; onChange?: (value: string) => void; children?: ReactNode }) { return open ? <div className="canop-dialog-backdrop"><div className="canop-dialog"><CanopInput value={value} onChange={(event) => onChange?.(event.currentTarget.value)} placeholder="Rechercher une commande" />{children}</div></div> : null; }

export function CanopBreadcrumb({ items = [] }: { items?: readonly CanopNavItem[] }) { return <nav className="canop-breadcrumb" aria-label="Fil d'Ariane">{items.map((item, index) => <span key={item.id}>{index > 0 && <span aria-hidden="true">/</span>}{item.href ? <a href={item.href}>{item.label}</a> : item.label}</span>)}</nav>; }
export function CanopToolbar({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cx('canop-surface', 'canop-toolbar', 'canop-panel', className)} {...props}>{children}</div>; }
export function CanopCookieBanner({ open = true, children = 'Nous utilisons des cookies pour améliorer votre expérience.', onAccept }: { open?: boolean; children?: ReactNode; onAccept?: () => void }) { return open ? <CanopFeedback severity="info" title="Cookies">{children}<CanopButton size="small" onClick={onAccept}>Accepter</CanopButton></CanopFeedback> : null; }
export function CanopSelectionBar({ selectedCount = 0, children }: { selectedCount?: number; children?: ReactNode }) { return <div className="canop-surface canop-selection-bar canop-panel"><span>{selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}</span>{children}</div>; }
export function CanopScrollbar({ children, className }: HTMLAttributes<HTMLDivElement>) { return <div className={cx('canop-scrollbar', className)}>{children}</div>; }

export function CanopStack({ direction = 'column', wrap = false, className, children, ...props }: HTMLAttributes<HTMLDivElement> & { direction?: 'row' | 'column'; wrap?: boolean }) { return <div className={cx('canop-stack', direction === 'column' && 'canop-stack--column', wrap && 'canop-stack--wrap', className)} {...props}>{children}</div>; }
export function CanopLayout({ navigation, children, className }: { navigation?: ReactNode; children?: ReactNode; className?: string }) { return <div className={cx('canop-layout', className)}>{navigation}<main className="canop-layout__content">{children}</main></div>; }
export function CanopPageScaffold({ children, className }: HTMLAttributes<HTMLDivElement>) { return <div className={cx('canop-page-scaffold', className)}>{children}</div>; }
export function CanopPageContent({ children, className }: HTMLAttributes<HTMLDivElement>) { return <section className={cx('canop-page-content', className)}>{children}</section>; }
export function CanopDivider({ className }: { className?: string }) { return <hr className={cx('canop-divider', className)} />; }
export function CanopSeparator({ className }: { className?: string }) { return <span className={cx('canop-separator', className)} aria-hidden="true" />; }
export function CanopCanopyBackground({ children, className }: HTMLAttributes<HTMLDivElement>) { return <div className={cx('canop-canopy-background', className)}>{children}</div>; }
export function CanopShapeBackground({ children, className }: HTMLAttributes<HTMLDivElement>) { return <div className={cx('canop-shape-background', className)}>{children}</div>; }
export function CanopSlidingIndicator({ children, className }: HTMLAttributes<HTMLDivElement>) { return <div className={cx('canop-sliding-indicator', className)}>{children}</div>; }

export function CanopDescriptionList({ items = [] }: { items?: readonly { term: ReactNode; description: ReactNode }[] }) { return <dl className="canop-description-list">{items.map((item, index) => <span key={index}><dt>{item.term}</dt><dd>{item.description}</dd></span>)}</dl>; }
export function CanopBulletList({ items = [] }: { items?: readonly ReactNode[] }) { return <ul className="canop-bullet-list">{items.map((item, index) => <li key={index}>{item}</li>)}</ul>; }
export function CanopRating({ value = 0, max = 5 }: { value?: number; max?: number }) { return <span className="canop-rating" aria-label={`${value} sur ${max}`}>{Array.from({ length: max }, (_, index) => <span key={index} aria-hidden="true">{index + 1 <= value ? '★' : '☆'}</span>)}</span>; }
export function CanopStatCard({ label, value, delta, liquidGlass = false }: { label: ReactNode; value: ReactNode; delta?: ReactNode; liquidGlass?: boolean }) { return <Surface className="canop-stat-card" liquidGlass={liquidGlass}><span className="canop-stat-card__label">{label}</span><strong className="canop-stat-card__value">{value}</strong>{delta && <span className="canop-stat-card__delta">{delta}</span>}</Surface>; }
export function CanopDonut({ value = 60, label = `${value}%` }: { value?: number; label?: string }) { return <div className="canop-donut" data-label={label} style={{ '--canop-donut-value': `${value}%` } as CSSProperties} role="img" aria-label={label} />; }
export function CanopLegend({ items = [] }: { items?: readonly { label: ReactNode; color?: string }[] }) { return <div className="canop-stack canop-stack--wrap">{items.map((item, index) => <span key={index} className="canop-stack"><CanopSeparator />{item.label}</span>)}</div>; }

export interface CanopDataTableProps { columns?: readonly { key: string; label: ReactNode }[]; rows?: readonly Record<string, ReactNode>[]; }
export function CanopDataTable({ columns = [], rows = [] }: CanopDataTableProps) { return <div className="canop-surface canop-panel"><table className="canop-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}</tr>)}</tbody></table></div>; }

export function CanopCarousel({ children, className }: HTMLAttributes<HTMLDivElement>) { return <div className={cx('canop-card-grid', className)}>{children}</div>; }
export function CanopLegalLinks({ links = [] }: { links?: readonly CanopNavItem[] }) { return <nav className="canop-legal-links" aria-label="Liens légaux">{links.map((link) => <a key={link.id} href={link.href}>{link.label}</a>)}</nav>; }

export function CanopFileCard({ name, size, selected = false, onClick }: { name: string; size?: string; selected?: boolean; onClick?: () => void }) { return <button type="button" className={cx('canop-surface', 'canop-file-card', selected && 'canop-liquid')} onClick={onClick}><span className="canop-file-card__icon">⌁</span><span><strong>{name}</strong>{size && <small className="canop-field__helper">{size}</small>}</span></button>; }
export function CanopDropzone({ onFiles, children = 'Déposez vos fichiers ici' }: { onFiles?: (files: FileList) => void; children?: ReactNode }) { return <label className="canop-dropzone"><input type="file" hidden multiple onChange={(event) => event.currentTarget.files && onFiles?.(event.currentTarget.files)} /><strong>{children}</strong><span>Sélectionner des fichiers</span></label>; }
export function CanopFileUploader({ onFiles }: { onFiles?: (files: FileList) => void }) { return <CanopDropzone onFiles={onFiles} />; }
export function CanopLightbox({ src, alt = '', open = false, onClose }: { src?: string; alt?: string; open?: boolean; onClose?: () => void }) { return open && src ? <div className="canop-lightbox" role="dialog" aria-label="Aperçu"><img src={src} alt={alt} /><CanopButton variant="ghost" onClick={onClose}>Fermer</CanopButton></div> : null; }
export function CanopMap({ children = 'Carte interactive' }: { children?: ReactNode }) { return <div className="canop-map" role="img" aria-label="Carte">{children}</div>; }
export function CanopRouteGuard({ allowed = true, fallback = 'Accès refusé', children }: { allowed?: boolean; fallback?: ReactNode; children?: ReactNode }) { return allowed ? <>{children}</> : <CanopFeedback severity="error">{fallback}</CanopFeedback>; }
export function CanopI18n({ children }: { children?: ReactNode }) { return <>{children}</>; }
export function CanopHttp({ status = 'API prête' }: { status?: ReactNode }) { return <CanopStatusChip status={String(status)} />; }
export function CanopValidation({ valid = true }: { valid?: boolean }) { return <CanopStatusChip status={valid ? 'Valide' : 'À corriger'} />; }
export function CanopSound({ enabled = true }: { enabled?: boolean }) { return <CanopToggle label="Sons" defaultChecked={enabled} />; }
export function CanopLocalStore({ children }: { children?: ReactNode }) { return <>{children}</>; }
export function CanopCountdown({ seconds = 60 }: { seconds?: number }) { const [remaining, setRemaining] = useState(seconds); useEffect(() => { const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, []); return <span className="canop-countdown" aria-live="polite">{remaining}s</span>; }
export function CanopGame({ score = 0 }: { score?: number }) { return <div className="canop-surface canop-game"><CanopHeading level={3}>Partie</CanopHeading><strong className="canop-stat-card__value">{score}</strong><CanopButton size="small">Continuer</CanopButton></div>; }
export function CanopClipboard({ value, children = 'Copier' }: { value: string; children?: ReactNode }) { const [copied, setCopied] = useState(false); return <CanopButton size="small" variant="tonal" onClick={() => { void navigator.clipboard?.writeText(value); setCopied(true); }}>{copied ? 'Copié' : children}</CanopButton>; }
export function CanopSvgMap({ children }: { children?: ReactNode }) { return <svg className="canop-svg-map" viewBox="0 0 400 180" role="img" aria-label="Carte SVG"><path d="M20 135 C80 35 135 165 205 75 S325 35 380 125" fill="none" stroke="currentColor" strokeWidth="8" opacity=".35" />{children}</svg>; }

export interface CanopCatalogEntry { readonly name: string; readonly category: string; readonly description: string; }

export const CANOP_CATALOG: readonly CanopCatalogEntry[] = [
  ['CanopButton', 'Inputs', "Bouton d'action avec variantes, tailles et état de chargement."],
  ['CanopPressable', 'Inputs', 'Surface cliquable sans apparence : forme, focus et sélection.'],
  ['CanopInlineInput', 'Inputs', "Champ d'édition en place : Entrée valide, Échap abandonne."],
  ['CanopInput', 'Inputs', 'Champ de saisie avec validation, icône et types spécialisés.'],
  ['CanopCheckbox', 'Inputs', 'Case à cocher avec label, sous-label et état indéterminé.'],
  ['CanopToggle', 'Inputs', 'Interrupteur animé pour les états binaires.'],
  ['CanopSlider', 'Inputs', 'Curseur contrôlé avec libellé, valeur et graduations.'],
  ['CanopMultiSelect', 'Inputs', 'Sélection multiple avec chips et liste déroulante.'],
  ['CanopSelect', 'Inputs', 'Sélecteur mono-valeur avec libellé accessible et options illustrées.'],
  ['CanopAutocomplete', 'Inputs', 'Champ à suggestions avec filtrage et présélection.'],
  ['CanopForm', 'Inputs', 'Formulaire orchestré par les primitives contrôlées.'],
  ['CanopLanguageSelector', 'Inputs', "Sélecteur de langue branché sur l'i18n."],
  ['CanopSegmentedControl', 'Inputs', 'Sélecteur segmenté animé pour choisir une option.'],
  ['CanopThemeToggle', 'Inputs', 'Bascule de thème clair ou sombre, avec matériau local.'],
  ['CanopAddButton', 'Boutons spécialisés', "Bouton d'ajout avec icône plus intégrée."],
  ['CanopSaveButton', 'Boutons spécialisés', "Bouton d'enregistrement unique, avec confirmation."],
  ['CanopApproveButton', 'Boutons spécialisés', 'Bouton de validation avec icône check.'],
  ['CanopEditButton', 'Boutons spécialisés', "Bouton d'édition avec icône crayon."],
  ['CanopDeleteButton', 'Boutons spécialisés', 'Bouton de suppression avec confirmation intégrée.'],
  ['CanopIconActionButton', 'Boutons spécialisés', "Bouton d'action carré à icône."],
  ['CanopCard', 'Affichage de données', 'Carte avec titre, sous-titre, actions et élévations.'],
  ['CanopCardGrid', 'Affichage de données', 'Grille responsive auto-adaptative pour cartes.'],
  ['CanopCarousel', 'Affichage de données', 'Carrousel de cartes avec navigation.'],
  ['CanopDataTable', 'Affichage de données', 'Table riche avec tri, sélection et clavier.'],
  ['CanopDescriptionList', 'Affichage de données', 'Liste de paires libellé / valeur.'],
  ['CanopBulletList', 'Affichage de données', 'Liste à puces avec icônes personnalisables.'],
  ['CanopStatusChip', 'Affichage de données', 'Pastille de statut en plusieurs tonalités.'],
  ['CanopBadge', 'Affichage de données', 'Pastille de compteur ou point de notification.'],
  ['CanopRating', 'Affichage de données', 'Note moyenne en étoiles, remplissage fractionnaire.'],
  ['CanopStatCard', 'Affichage de données', 'Carte de métrique avec valeur, variation et icône.'],
  ['CanopDonut', 'Affichage de données', 'Graphique en anneau segmenté avec contenu central.'],
  ['CanopLegalLinks', 'Affichage de données', 'Pied de page légal et mentions.'],
  ['CanopLegend', 'Affichage de données', 'Légende de statuts pour tableaux et graphiques.'],
  ['CanopHeading', 'Affichage de données', 'Titres hiérarchisés avec échelle typographique.'],
  ['CanopText', 'Affichage de données', 'Corps de texte, labels, légendes et métriques.'],
  ['CanopIcon', 'Affichage de données', 'Icônes Opale en plusieurs tailles.'],
  ['CanopFeedback', 'Feedback', 'Encart de message contextuel en quatre sévérités.'],
  ['CanopToast', 'Feedback', 'Notification éphémère avec fermeture automatique.'],
  ['CanopSpinner', 'Feedback', 'Indicateur de chargement circulaire.'],
  ['CanopProgressBar', 'Feedback', 'Barre de progression déterminée ou segmentée.'],
  ['CanopConfirmDialog', 'Feedback', "Boîte de dialogue de confirmation d'action."],
  ['CanopEmptyState', 'Feedback', 'État vide illustré avec titre, description et action.'],
  ['CanopNavbar', 'Navigation', 'Barre de navigation responsive avec sous-menus.'],
  ['CanopMenu', 'Navigation', 'Menu contextuel positionnable avec items.'],
  ['CanopLink', 'Navigation', 'Lien stylé compatible avec les routeurs externes.'],
  ['CanopSidePanel', 'Navigation', 'Panneau latéral coulissant avec titre et footer.'],
  ['CanopSettingsMenu', 'Navigation', 'Menu de réglages : thème, langue et session.'],
  ['CanopCommandPalette', 'Navigation', 'Palette de commandes avec recherche clavier.'],
  ['CanopBreadcrumb', 'Navigation', "Fil d'Ariane avec repli automatique."],
  ['CanopToolbar', 'Navigation', 'Barre d’outils : recherche, tri et actions.'],
  ['CanopCookieBanner', 'Navigation', 'Bandeau de consentement avec mémorisation.'],
  ['CanopScrollbar', 'Navigation', 'Barre de défilement appliquée par le thème.'],
  ['CanopSelectionBar', 'Navigation', "Barre d'actions groupées sur sélection multiple."],
  ['CanopStack', 'Mise en page', 'Empilement flexbox avec gaps issus des tokens.'],
  ['CanopLayout', 'Mise en page', 'Gabarit de page avec navigation et contenu.'],
  ['CanopPageScaffold', 'Mise en page', 'Squelette complet : navigation, contenu et footer.'],
  ['CanopPageContent', 'Mise en page', 'Conteneur de contenu avec en-tête et footer.'],
  ['CanopDivider', 'Mise en page', 'Séparateur horizontal ou vertical.'],
  ['CanopSeparator', 'Mise en page', 'Séparateur décoratif léger.'],
  ['CanopCanopyBackground', 'Mise en page', 'Fond animé par thème.'],
  ['CanopShapeBackground', 'Mise en page', 'Arrière-plan décoratif à formes organiques.'],
  ['CanopSlidingIndicator', 'Mise en page', 'Indicateur coulissant partagé entre éléments.'],
  ['CanopFileUploader', 'Modules', 'Upload de fichiers par chunks.'],
  ['CanopFileCard', 'Modules', 'Carte de fichier ou dossier avec aperçu et sélection.'],
  ['CanopDropzone', 'Modules', 'Zone de dépôt par glisser-déposer ou sélection.'],
  ['CanopLightbox', 'Modules', "Visionneuse plein écran d'images et documents."],
  ['CanopMap', 'Modules', 'Carte avec marqueurs, bulles et clic.'],
  ['CanopRouteGuard', 'Modules', 'Garde de routes et redirections.'],
  ['CanopI18n', 'Modules', 'Provider d’internationalisation et messages.'],
  ['CanopHttp', 'Modules', 'Client API avec gestion d’erreurs normalisée.'],
  ['CanopValidation', 'Modules', 'Règles de validation réutilisables.'],
  ['CanopSound', 'Modules', 'Sons sémantiques, coupure et volume.'],
  ['CanopLocalStore', 'Modules', 'État local typé, versionné et synchronisé.'],
  ['CanopCountdown', 'Modules', 'Compte à rebours calé sur une échéance absolue.'],
  ['CanopGame', 'Modules', 'Pièces de partie, série et grille partageable.'],
  ['CanopClipboard', 'Modules', 'Copie dans le presse-papier avec état fugace.'],
  ['CanopSvgMap', 'Modules', 'Carte SVG gestuelle et accessible au clavier.'],
].map(([name, category, description]) => ({ name, category, description }));

export const CanopUI = {
  Button: CanopButton,
  Pressable: CanopPressable,
  Card: CanopCard,
  CardGrid: CanopCardGrid,
  Input: CanopInput,
  InlineInput: CanopInlineInput,
  Checkbox: CanopCheckbox,
  Toggle: CanopToggle,
  Slider: CanopSlider,
  Select: CanopSelect,
  MultiSelect: CanopMultiSelect,
  Autocomplete: CanopAutocomplete,
  Form: CanopForm,
  LanguageSelector: CanopLanguageSelector,
  SegmentedControl: CanopSegmentedControl,
  ThemeToggle: CanopThemeToggle,
  AddButton: CanopAddButton,
  SaveButton: CanopSaveButton,
  ApproveButton: CanopApproveButton,
  EditButton: CanopEditButton,
  DeleteButton: CanopDeleteButton,
  IconActionButton: CanopIconActionButton,
  Carousel: CanopCarousel,
  DataTable: CanopDataTable,
  DescriptionList: CanopDescriptionList,
  BulletList: CanopBulletList,
  StatusChip: CanopStatusChip,
  Badge: CanopBadge,
  Rating: CanopRating,
  StatCard: CanopStatCard,
  Donut: CanopDonut,
  LegalLinks: CanopLegalLinks,
  Legend: CanopLegend,
  Heading: CanopHeading,
  Text: CanopText,
  Icon: CanopIcon,
  Feedback: CanopFeedback,
  Toast: CanopToast,
  Spinner: CanopSpinner,
  ProgressBar: CanopProgressBar,
  ConfirmDialog: CanopConfirmDialog,
  EmptyState: CanopEmptyState,
  Navbar: CanopNavbar,
  Menu: CanopMenu,
  Link: CanopLink,
  SidePanel: CanopSidePanel,
  SettingsMenu: CanopSettingsMenu,
  CommandPalette: CanopCommandPalette,
  Breadcrumb: CanopBreadcrumb,
  Toolbar: CanopToolbar,
  CookieBanner: CanopCookieBanner,
  Scrollbar: CanopScrollbar,
  SelectionBar: CanopSelectionBar,
  Stack: CanopStack,
  Layout: CanopLayout,
  PageScaffold: CanopPageScaffold,
  PageContent: CanopPageContent,
  Divider: CanopDivider,
  Separator: CanopSeparator,
  CanopyBackground: CanopCanopyBackground,
  ShapeBackground: CanopShapeBackground,
  SlidingIndicator: CanopSlidingIndicator,
  FileUploader: CanopFileUploader,
  FileCard: CanopFileCard,
  Dropzone: CanopDropzone,
  Lightbox: CanopLightbox,
  Map: CanopMap,
  RouteGuard: CanopRouteGuard,
  I18n: CanopI18n,
  Http: CanopHttp,
  Validation: CanopValidation,
  Sound: CanopSound,
  LocalStore: CanopLocalStore,
  Countdown: CanopCountdown,
  Game: CanopGame,
  Clipboard: CanopClipboard,
  SvgMap: CanopSvgMap,
} as const;

/** Namespace public Opale pour les composants du catalogue V3. */
export const Opale = { ...CanopUI, Background: CanopCanopyBackground } as const;
