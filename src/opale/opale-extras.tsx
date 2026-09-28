import { useId, type ComponentPropsWithRef } from 'react';

import { IconGlyph } from './components/icon';
import { resolveLabels } from './shared/labels';
import { useControllableState } from './shared/use-controllable-state';

export interface SkeletonProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  className?: string;
}

/** Placeholder décoratif. Le conteneur doit annoncer le chargement. */
export function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = false,
  className,
  style,
  ...rest
}: SkeletonProps) {
  /* `aria-hidden` est le contrat : il passe après les attributs de l'appelant.
     Le `style` de l'appelant, lui, l'emporte sur `width` et `height`. */
  return (
    <span
      {...rest}
      aria-hidden="true"
      className={['opale-skeleton', rounded && 'opale-skeleton--rounded', className]
        .filter(Boolean)
        .join(' ')}
      style={{ width, height, ...style }}
    />
  );
}

/** Les textes de la pagination. */
export interface PaginationLabels {
  /** Le nom du repère, quand ni `aria-label` ni `label` ne sont passés. Défaut : « Pagination ». */
  navigation: string;
  /** Défaut : « Page précédente ». */
  previous: string;
  /** Défaut : « Page suivante ». */
  next: string;
  /** Le nom du bouton d'une page. Défaut : « Page 3 ». */
  page: (page: number) => string;
}

const DEFAULT_PAGINATION_LABELS: PaginationLabels = {
  navigation: 'Pagination',
  previous: 'Page précédente',
  next: 'Page suivante',
  page: (page) => `Page ${page}`,
};

export interface PaginationProps extends Omit<
  ComponentPropsWithRef<'nav'>,
  'onChange' | 'defaultValue' | 'children'
> {
  pageCount: number;
  /** La page courante, à partir de 1. Présente, l'appelant tient la page. */
  value?: number;
  /** La page de départ quand `value` est absente. Défaut : 1. */
  defaultValue?: number;
  /** Appelée à chaque choix de page, même la page courante. */
  onValueChange?: (page: number) => void;
  /** @deprecated Depuis 3.6 — utilisez `value`. */
  page?: number;
  /** @deprecated Depuis 3.6 — utilisez `onValueChange`. */
  onChange?: (page: number) => void;
  disabled?: boolean;
  /** Le nom du repère ; gagne sur `labels.navigation`. */
  label?: string;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<PaginationLabels>;
}

/** Pagination contrôlable, utilisable au clavier avec des boutons natifs. */
export function Pagination({
  value,
  defaultValue = 1,
  onValueChange,
  page,
  pageCount,
  onChange,
  disabled = false,
  label,
  labels: labelsProp,
  className,
  ...rest
}: PaginationProps) {
  const [requested, setRequested] = useControllableState<number>(
    value ?? page,
    defaultValue,
    onValueChange,
  );
  const labels = resolveLabels(DEFAULT_PAGINATION_LABELS, labelsProp);
  const choose = (next: number) => {
    setRequested(next);
    onChange?.(next);
  };
  const total = Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0;
  const current = Number.isFinite(requested)
    ? Math.max(1, Math.min(total || 1, Math.floor(requested)))
    : 1;
  const visible = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((number) => number >= 1 && number <= total)
    .sort((a, b) => a - b);
  return (
    <nav
      aria-label={label ?? labels.navigation}
      {...rest}
      className={['opale-pagination', className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        disabled={disabled || current <= 1}
        onClick={() => choose(current - 1)}
        aria-label={labels.previous}
      >
        ‹
      </button>
      {visible.flatMap((number, index) => {
        const before = visible[index - 1];
        return [
          ...(before && number - before > 1
            ? [
                <span key={`gap-${number}`} aria-hidden="true">
                  …
                </span>,
              ]
            : []),
          <button
            key={number}
            type="button"
            disabled={disabled}
            aria-current={number === current ? 'page' : undefined}
            data-neighbor={
              Math.abs(number - current) === 1 && number !== 1 && number !== total
                ? 'true'
                : undefined
            }
            aria-label={labels.page(number)}
            onClick={() => choose(number)}
          >
            {number}
          </button>,
        ];
      })}
      <button
        type="button"
        disabled={disabled || total === 0 || current >= total}
        onClick={() => choose(current + 1)}
        aria-label={labels.next}
      >
        ›
      </button>
    </nav>
  );
}

/** Les props de `RatingInput`. `ref` et les attributs vont au `<fieldset>` ; `name` reste aux radios. */
export interface RatingInputProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'onChange' | 'defaultValue' | 'children' | 'name'
> {
  label: string;
  value?: number;
  defaultValue?: number;
  max?: number;
  /** Appelée à chaque choix d'une note. */
  onValueChange?: (value: number) => void;
  /** @deprecated Depuis 3.6 — utilisez `onValueChange`. */
  onChange?: (value: number) => void;
  disabled?: boolean;
  name?: string;
}

/** Note interactive distincte de Rating, qui reste un affichage seul. */
export function RatingInput({
  label,
  value,
  defaultValue = 0,
  max = 5,
  onValueChange,
  onChange,
  disabled = false,
  name,
  className,
  ...rest
}: RatingInputProps) {
  const [selected, setSelected] = useControllableState<number>(value, defaultValue, onValueChange);
  const generatedName = useId();
  const total = Math.max(1, Math.min(10, Math.floor(max)));
  return (
    <fieldset
      {...rest}
      className={['opale-rating-input', className].filter(Boolean).join(' ')}
      disabled={disabled}
    >
      <legend>{label}</legend>
      <div className="opale-rating-input__options">
        {Array.from({ length: total }, (_, index) => index + 1).map((number) => (
          <label
            key={number}
            className="opale-rating-input__option"
            data-selected={number <= selected ? 'true' : undefined}
          >
            <input
              type="radio"
              name={name ?? generatedName}
              value={number}
              checked={selected === number}
              onChange={() => {
                setSelected(number);
                onChange?.(number);
              }}
              aria-label={`${number} sur ${total}`}
            />
            <IconGlyph name="star" aria-hidden="true" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
