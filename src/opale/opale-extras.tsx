import { useId, useLayoutEffect, useRef, type ComponentPropsWithRef } from 'react';

import Glass from './components/glass/Glass';
import { GLYPH_STAR } from './components/icon/glyphs';
import { IconPaths } from './components/icon/IconPaths';
import { resolveLabels } from './shared/labels';
import { useControllableState } from './shared/use-controllable-state';

export interface SkeletonProps extends Omit<ComponentPropsWithRef<'span'>, 'children'> {
  /** La largeur, en pixels ou en longueur CSS. Défaut : `100%`. */
  width?: string | number;
  /** La hauteur, en pixels ou en longueur CSS. Défaut : `1rem`. */
  height?: string | number;
  /** Arrondit le bloc en pilule, pour un avatar ou une pastille. Défaut : `false`. */
  rounded?: boolean;
  /** Une classe ajoutée à côté de `.opale-skeleton`. */
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
  /** Le nombre total de pages, arrondi à l'entier inférieur. */
  pageCount: number;
  /** La page courante, à partir de 1. Présente, l'appelant tient la page. */
  value?: number;
  /** La page de départ quand `value` est absente. Défaut : 1. */
  defaultValue?: number;
  /** Appelée à chaque choix de page, même la page courante. */
  onValueChange?: (page: number) => void;
  /** Rend tous les boutons inactifs. Défaut : `false`. */
  disabled?: boolean;
  /** Le nom du repère ; gagne sur `labels.navigation`. */
  label?: string;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<PaginationLabels>;
  /** Pose la pagination sur le matériau « verre liquide ». Originale par défaut. */
  liquidGlass?: boolean;
}

/** Pagination contrôlable, utilisable au clavier avec des boutons natifs. */
export function Pagination({
  value,
  defaultValue = 1,
  onValueChange,
  pageCount,
  disabled = false,
  label,
  labels: labelsProp,
  liquidGlass = false,
  className,
  ...rest
}: PaginationProps) {
  const [requested, setRequested] = useControllableState<number>(
    value,
    defaultValue,
    onValueChange,
  );
  const labels = resolveLabels(DEFAULT_PAGINATION_LABELS, labelsProp);
  const choose = (next: number) => {
    setRequested(next);
  };
  const stepRef = useRef<HTMLButtonElement | null>(null);
  /* UNE FLÈCHE QUI DEVIENT INACTIVE SOUS LE FOCUS le rendrait à `<body>` :
     il passe alors au bouton de la page courante. */
  useLayoutEffect(() => {
    const step = stepRef.current;
    stepRef.current = null;
    if (!step?.disabled) return;
    const active = document.activeElement;
    if (active !== step && active !== document.body && active !== null) return;
    step.parentElement?.querySelector<HTMLButtonElement>('button[aria-current="page"]')?.focus();
  });
  const stepTo = (button: HTMLButtonElement, next: number) => {
    stepRef.current = button;
    choose(next);
  };
  const total = Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0;
  const current = Number.isFinite(requested)
    ? Math.max(1, Math.min(total || 1, Math.floor(requested)))
    : 1;
  const visible = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((number) => number >= 1 && number <= total)
    .sort((a, b) => a - b);
  const Shell = liquidGlass ? Glass : 'nav';
  const shellProps = liquidGlass
    ? ({ as: 'nav', rootClassName: 'opale-pagination--glass-root' } as const)
    : {};
  return (
    <Shell
      aria-label={label ?? labels.navigation}
      {...rest}
      {...shellProps}
      className={['opale-pagination', liquidGlass && 'opale-pagination--glass', className]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        disabled={disabled || current <= 1}
        onClick={(event) => stepTo(event.currentTarget, current - 1)}
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
        onClick={(event) => stepTo(event.currentTarget, current + 1)}
        aria-label={labels.next}
      >
        ›
      </button>
    </Shell>
  );
}

/** Les textes de `RatingInput`. */
export interface RatingInputLabels {
  /** Le nom de chaque étoile. Défaut : « 3 sur 5 ». */
  option: (value: number, max: number) => string;
}

const DEFAULT_RATING_INPUT_LABELS: RatingInputLabels = {
  option: (value, max) => `${value} sur ${max}`,
};

/** Les props de `RatingInput`. `ref` et les attributs vont au `<fieldset>` ; `name` reste aux radios. */
export interface RatingInputProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'onChange' | 'defaultValue' | 'children' | 'name'
> {
  /** Le nom du groupe, rendu en `<legend>`. Obligatoire. */
  label: string;
  /** La note contrôlée. À accompagner de `onValueChange`. */
  value?: number;
  /** La note de départ en mode non contrôlé. Défaut : `0`, aucune étoile. */
  defaultValue?: number;
  /** Le nombre d'étoiles, de 1 à 10. Défaut : `5`. */
  max?: number;
  /** Appelée à chaque choix d'une note. */
  onValueChange?: (value: number) => void;
  /** Rend le groupe inactif, radios comprises. Défaut : `false`. */
  disabled?: boolean;
  /**
   * Le `name` partagé des radios, lu par la soumission du formulaire. Défaut : un identifiant
   * généré.
   */
  name?: string;
  /** Remplace les textes français par défaut, clé par clé. */
  labels?: Partial<RatingInputLabels>;
}

/** Note interactive distincte de Rating, qui reste un affichage seul. */
export function RatingInput({
  label,
  value,
  defaultValue = 0,
  max = 5,
  onValueChange,
  disabled = false,
  name,
  labels: labelsProp,
  className,
  ...rest
}: RatingInputProps) {
  const labels = resolveLabels(DEFAULT_RATING_INPUT_LABELS, labelsProp);
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
              }}
              aria-label={labels.option(number, total)}
            />
            <IconPaths paths={GLYPH_STAR} />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
