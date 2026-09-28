import { useId, type CSSProperties } from 'react';

import { IconGlyph } from './components/icon';
import { useControllableState } from './shared/use-controllable-state';

export interface SkeletonProps {
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
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={['opale-skeleton', rounded && 'opale-skeleton--rounded', className]
        .filter(Boolean)
        .join(' ')}
      style={{ width, height } as CSSProperties}
    />
  );
}

export interface PaginationProps {
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
  label?: string;
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
  label = 'Pagination',
}: PaginationProps) {
  const [requested, setRequested] = useControllableState<number>(
    value ?? page,
    defaultValue,
    onValueChange,
  );
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
    <nav className="opale-pagination" aria-label={label}>
      <button
        type="button"
        disabled={disabled || current <= 1}
        onClick={() => choose(current - 1)}
        aria-label="Page précédente"
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
            aria-label={`Page ${number}`}
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
        aria-label="Page suivante"
      >
        ›
      </button>
    </nav>
  );
}

export interface RatingInputProps {
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
}: RatingInputProps) {
  const [selected, setSelected] = useControllableState<number>(value, defaultValue, onValueChange);
  const generatedName = useId();
  const total = Math.max(1, Math.min(10, Math.floor(max)));
  return (
    <fieldset className="opale-rating-input" disabled={disabled}>
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
