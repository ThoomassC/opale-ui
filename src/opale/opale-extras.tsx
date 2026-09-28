import { useId, useState, type CSSProperties } from 'react';

import { IconGlyph } from './components/icon';

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
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  label?: string;
}

/** Pagination contrôlée, utilisable au clavier avec des boutons natifs. */
export function Pagination({
  page,
  pageCount,
  onChange,
  disabled = false,
  label = 'Pagination',
}: PaginationProps) {
  const total = Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0;
  const current = Number.isFinite(page) ? Math.max(1, Math.min(total || 1, Math.floor(page))) : 1;
  const visible = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((number) => number >= 1 && number <= total)
    .sort((a, b) => a - b);
  return (
    <nav className="opale-pagination" aria-label={label}>
      <button
        type="button"
        disabled={disabled || current <= 1}
        onClick={() => onChange(current - 1)}
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
            onClick={() => onChange(number)}
          >
            {number}
          </button>,
        ];
      })}
      <button
        type="button"
        disabled={disabled || total === 0 || current >= total}
        onClick={() => onChange(current + 1)}
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
  onChange,
  disabled = false,
  name,
}: RatingInputProps) {
  const [internal, setInternal] = useState(defaultValue);
  const generatedName = useId();
  const total = Math.max(1, Math.min(10, Math.floor(max)));
  const selected = value ?? internal;
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
                if (value === undefined) setInternal(number);
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
