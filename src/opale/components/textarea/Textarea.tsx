import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import { FieldShell } from '../../catalog/shells';
import type { OpaleSize } from '../../shared';
import { resolveLabels } from '../../shared/labels';
import { warnIfUnnamed } from '../../deprecations';
import { mergeRefs } from '../../shared/merge-refs';
import { mergeIds } from '../field/merge-ids';
import styles from './style/Textarea.module.css';

/** Les textes du compteur de `Textarea`. */
export interface TextareaLabels {
  /**
   * Le compte affiché sous le champ. `max` est absent sans `maxLength`.
   * Défaut : « 12 / 200 », ou « 12 caractères » sans limite.
   */
  count: (length: number, max: number | undefined) => string;
  /** La limite, décrite au focus (`aria-describedby`). Défaut : « 200 caractères maximum ». */
  limit: (max: number) => string;
  /** L'annonce polie, après une pause de frappe. Défaut : « Il reste 12 caractères ». */
  remaining: (remaining: number) => string;
}

const plural = (count: number) => (Math.abs(count) > 1 ? 's' : '');

const DEFAULT_TEXTAREA_LABELS: TextareaLabels = {
  count: (length, max) =>
    max === undefined ? `${length} caractère${plural(length)}` : `${length} / ${max}`,
  limit: (max) => `${max} caractère${plural(max)} maximum`,
  remaining: (remaining) => `Il reste ${remaining} caractère${plural(remaining)}`,
};

/* L'annonce attend la fin d'une rafale de frappe : annoncer chaque touche
   couperait la parole au lecteur d'écran qui relit ce qu'on vient d'écrire. */
const ANNOUNCE_DELAY_MS = 1000;

const CONTROL_HEIGHT_TOKEN: Readonly<Record<OpaleSize, string | undefined>> = {
  small: 'var(--opale-control-sm)',
  medium: undefined,
  large: 'var(--opale-control-lg)',
};

/**
 * Les props de `Textarea`.
 *
 * DEUX DESTINATIONS, ET C'EST VOULU (DX-03). `className` va à l'ENVELOPPE —
 * `.opale-field`, qui porte libellé, aide, erreur et compteur.
 * Tout le reste — `id`, `name`, `style`, `ref`, `aria-*`, `data-*`, les
 * gestionnaires — va au `<textarea>` natif :
 * un formulaire, un test ou une bibliothèque de formulaires vise ainsi le
 * vrai contrôle. `controlClassName` habille ce natif.
 */
export interface TextareaProps extends Omit<ComponentPropsWithRef<'textarea'>, 'size'> {
  /** Va à l'enveloppe, pas au contrôle natif. Voir `TextareaProps`. */
  className?: string;
  /** Une classe de plus sur le `<textarea>` natif, à côté de `.opale-textarea`. */
  controlClassName?: string;
  /** Le libellé visible, rendu en `<label for>`. */
  label?: ReactNode;
  /** Le texte d'aide sous le champ ; il décrit le champ, l'erreur le remplace. */
  helperText?: ReactNode;
  /** L'erreur, annoncée et décrite à la place de l'aide ; rend le champ invalide. */
  error?: ReactNode;
  /** Rend la coquille du champ sur le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
  /**
   * La taille : corps de texte et marges internes, sur l'échelle des
   * contrôles (`--opale-control-sm|md|lg`). Défaut : `medium`.
   */
  size?: OpaleSize;
  /**
   * Appelée à chaque saisie avec la nouvelle valeur. `onChange` natif part
   * aussi, avant elle.
   */
  onValueChange?: (value: string) => void;
  /**
   * Fait grandir le champ avec son contenu, de `minRows` à `maxRows` lignes ;
   * au-delà, il défile. La poignée de redimensionnement disparaît. Défaut :
   * `false`.
   */
  autoResize?: boolean;
  /** Le nombre de lignes visibles au départ, posé en `rows`. Défaut : 3. `rows` gagne. */
  minRows?: number;
  /** Avec `autoResize`, la hauteur maximale, en lignes. Absente : aucune limite. */
  maxRows?: number;
  /**
   * Affiche le nombre de caractères saisis. Avec `maxLength`, la limite est
   * décrite au focus et le reste est annoncé poliment après une pause de
   * frappe. Défaut : `false`.
   */
  showCount?: boolean;
  /** Remplace les textes français du compteur, clé par clé. */
  labels?: Partial<TextareaLabels>;
}

type MaxRowsStyle = CSSProperties & { '--opale-textarea-max-rows'?: number };

/* =============================================================================
   LA ZONE DE TEXTE, BÂTIE COMME LE CHAMP DE SAISIE.

   MÊME BALISAGE QU'`Input`, À L'ÉLÉMENT PRÈS. Le libellé est un `<label for>`
   hors de la coquille, le message une description annoncée, et la coquille
   (`.opale-input-shell`) la même boîte, pleine ou en verre. Le natif porte
   AUSSI `.opale-input` : il hérite de l'encre, de la police, de l'anneau de
   focus et des réglages de verre du champ voisin au lieu de les recopier.

   LA HAUTEUR AUTOMATIQUE S'ÉCRIT DANS LE DOM, PAS DANS UN ÉTAT. Mesurer
   `scrollHeight` et le reposer en `height` ne demande aucun rendu React :
   l'écrire à la saisie, après chaque rendu (une valeur contrôlée qui change),
   sur `reset()` et quand la largeur change suffit. Le plafond `maxRows` est
   tenu en CSS (`max-height` en `lh`), si bien que le natif défile de lui-même
   au-delà.

   LE COMPTEUR SE LIT ET S'ANNONCE À PART. Le compte visible est caché aux
   lecteurs d'écran : lu à chaque touche, il serait insupportable. La limite
   est une description, lue une fois au focus ; le reste est une région
   polie, écrite après une pause de frappe et jamais au montage.
   ========================================================================== */
export function Textarea({
  label,
  helperText,
  error,
  liquidGlass = false,
  size = 'medium',
  onValueChange,
  autoResize = false,
  minRows = 3,
  maxRows,
  showCount = false,
  labels: labelsProp,
  className,
  controlClassName,
  id,
  rows,
  style,
  onChange,
  ref,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: TextareaProps) {
  const labels = resolveLabels(DEFAULT_TEXTAREA_LABELS, labelsProp);
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const messageId = `${textareaId}-message`;
  const limitId = `${textareaId}-limit`;
  const message = error || helperText;
  const invalid = error ? true : ariaInvalid;
  const { maxLength, value, defaultValue } = props;
  const limited = showCount && maxLength !== undefined && maxLength >= 0;

  /* Contrôlé, le compte se dérive de `value` pendant le rendu ; libre, il suit
     la saisie et la réinitialisation du formulaire. */
  const [uncontrolledLength, setUncontrolledLength] = useState(
    () => String(defaultValue ?? '').length,
  );
  const length = value !== undefined ? String(value).length : uncontrolledLength;
  const [announcement, setAnnouncement] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const controlRef = useCallback(
    (node: HTMLTextAreaElement | null) => mergeRefs(textareaRef, ref)(node),
    [ref],
  );
  const announceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fit = useCallback(() => {
    const textarea = textareaRef.current;
    if (!autoResize || !textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [autoResize]);

  /* Après chaque rendu : une valeur contrôlée posée par le parent n'émet
     aucun événement de saisie. */
  useLayoutEffect(fit);

  /* Sans libellé ni nom ARIA, la zone reste muette : signalé en développement. */
  useEffect(() => {
    if (textareaRef.current) warnIfUnnamed('Textarea', textareaRef.current);
  }, []);

  /* LA RÉINITIALISATION D'UN FORMULAIRE N'ÉMET AUCUNE SAISIE. Le compte et la
     hauteur se relisent donc sur `reset`, une fois le natif revenu à sa
     valeur par défaut — l'événement part AVANT la remise à zéro. */
  useEffect(() => {
    const form = textareaRef.current?.form;
    if (!form) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onReset = () => {
      timer = setTimeout(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        setUncontrolledLength(textarea.value.length);
        fit();
      }, 0);
    };
    form.addEventListener('reset', onReset);
    return () => {
      form.removeEventListener('reset', onReset);
      clearTimeout(timer);
    };
  }, [fit]);

  /* Une ligne qui se replie quand la largeur change change aussi la hauteur. */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!autoResize || !textarea || typeof ResizeObserver === 'undefined') return;
    let width = textarea.clientWidth;
    const observer = new ResizeObserver(() => {
      if (textarea.clientWidth === width) return;
      width = textarea.clientWidth;
      fit();
    });
    observer.observe(textarea);
    return () => observer.disconnect();
  }, [autoResize, fit]);

  useEffect(() => () => clearTimeout(announceTimer.current), []);

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.currentTarget.value;
    if (value === undefined) setUncontrolledLength(next.length);
    fit();
    if (limited) {
      clearTimeout(announceTimer.current);
      announceTimer.current = setTimeout(() => {
        setAnnouncement(labels.remaining(Math.max(maxLength - next.length, 0)));
      }, ANNOUNCE_DELAY_MS);
    }
    onChange?.(event);
    onValueChange?.(next);
  };

  const heightToken = CONTROL_HEIGHT_TOKEN[size];
  const fieldStyle = heightToken
    ? ({ '--opale-control-md': heightToken } as CSSProperties)
    : undefined;
  const controlStyle: MaxRowsStyle | undefined =
    autoResize && maxRows !== undefined
      ? { '--opale-textarea-max-rows': maxRows, ...style }
      : style;

  return (
    <div
      className={clsx(
        'opale-field',
        'opale-textarea-field',
        size !== 'medium' && [`opale-field--${size}`, `opale-textarea-field--${size}`],
        styles.field,
        styles[size],
        className,
      )}
      style={fieldStyle}
    >
      {label && (
        <label className="opale-field__label" htmlFor={textareaId}>
          {label}
        </label>
      )}
      <FieldShell
        liquidGlass={liquidGlass}
        className={clsx(
          'opale-input-shell',
          'opale-textarea-shell',
          styles.shell,
          liquidGlass && 'opale-input-shell--glass',
        )}
        rootClassName="opale-input--glass-root"
      >
        <textarea
          ref={controlRef}
          id={textareaId}
          rows={rows ?? minRows}
          className={clsx(
            'opale-input',
            'opale-textarea',
            styles.textarea,
            autoResize && ['opale-textarea--auto', styles.auto],
            autoResize && maxRows !== undefined && styles.capped,
            controlClassName,
          )}
          style={controlStyle}
          {...props}
          onChange={handleChange}
          aria-invalid={invalid}
          aria-describedby={mergeIds(
            ariaDescribedBy,
            message ? messageId : undefined,
            limited ? limitId : undefined,
          )}
        />
      </FieldShell>
      {(message || showCount) && (
        <span className={clsx('opale-textarea__footer', styles.footer)}>
          {message ? (
            <span
              id={messageId}
              role={error ? 'alert' : undefined}
              className={clsx(
                'opale-field__helper',
                Boolean(error) && 'opale-field__helper--error',
              )}
            >
              {message}
            </span>
          ) : (
            <span />
          )}
          {showCount && (
            <span
              className={clsx('opale-field__helper', 'opale-textarea__count', styles.count)}
              aria-hidden="true"
            >
              {labels.count(length, limited ? maxLength : undefined)}
            </span>
          )}
        </span>
      )}
      {limited && (
        <>
          <span id={limitId} hidden>
            {labels.limit(maxLength)}
          </span>
          <span role="status" aria-live="polite" className="opale-visually-hidden">
            {announcement}
          </span>
        </>
      )}
    </div>
  );
}
