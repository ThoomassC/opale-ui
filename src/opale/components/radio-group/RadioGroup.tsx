import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type ChangeEvent,
  type ChangeEventHandler,
  type ComponentPropsWithRef,
  type FocusEvent,
  type FocusEventHandler,
  type ReactNode,
  type Ref,
} from 'react';
import clsx from 'clsx';

import { FieldError, FieldShell } from '../../catalog/shells';
import type { OpaleSize } from '../../shared';
import { warnIfUnnamed } from '../../deprecations';
import { mergeRefs } from '../../shared/merge-refs';
import { hasContent, mergeIds } from '../field/merge-ids';
import { RadioGroupContext, type RadioGroupContextValue } from './radio-group-context';
import styles from './style/RadioGroup.module.css';

/** Un choix d'un `RadioGroup` : la forme de `SelectOption`, plus une description. */
export interface RadioOption {
  /** La valeur envoyée par le formulaire quand ce choix est coché. */
  value: string;
  /** Le libellé : il NOMME le radio. */
  label: ReactNode;
  /** Un texte sous le libellé : il DÉCRIT le radio, sans entrer dans son nom. */
  description?: ReactNode;
  /** Rend le choix visible mais impossible à cocher. Défaut : `false`. */
  disabled?: boolean;
}

/**
 * Les props de `Radio`.
 *
 * DEUX DESTINATIONS, ET C'EST VOULU (DX-03). `className` va à l'ENVELOPPE —
 * le `<label class="opale-radio-row">`, rond et libellé.
 * Tout le reste — `id`, `style`, `ref`, `aria-*`, `data-*`, les
 * gestionnaires — va à l'`<input type="radio">` natif ; `controlClassName`
 * l'habille. Dans un `RadioGroup`, `name`, `checked`, `required` et `form`
 * viennent du groupe.
 */
export interface RadioProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'value' | 'size'
> {
  /** La valeur envoyée par le formulaire quand ce radio est coché. */
  value: string;
  /** Le libellé : il nomme le radio. */
  label?: ReactNode;
  /** Un texte sous le libellé ; il décrit le radio. */
  description?: ReactNode;
  /** Va à l'enveloppe, pas au contrôle natif. Voir `RadioProps`. */
  className?: string;
  /** Une classe de plus sur l'`<input>` natif, à côté de `.opale-radio`. */
  controlClassName?: string;
  /** Hors d'un groupe : le rond sur le matériau « verre liquide ». Dans un groupe, celui du groupe. */
  liquidGlass?: boolean;
}

/**
 * Les props de `RadioGroup`.
 *
 * TROIS DESTINATIONS, ET C'EST VOULU. `className`, `style`, `id`, `aria-*`,
 * `data-*` et le reste vont au `<fieldset role="radiogroup">`, qui porte la
 * légende, l'aide et l'erreur. `name`, `ref`, `onChange`, `onBlur`, `required`
 * et `form` vont à CHAQUE `<input type="radio">` natif — c'est la forme d'un
 * champ radio pour un formulaire : `<RadioGroup {...register('plan')} />`
 * (react-hook-form) enregistre ainsi chacun des radios, et la ref de
 * l'appelant est appelée une fois par radio.
 */
export interface RadioGroupProps extends Omit<
  ComponentPropsWithRef<'fieldset'>,
  'onChange' | 'onBlur' | 'ref' | 'defaultValue' | 'children' | 'form'
> {
  /** La légende du groupe : elle NOMME le groupe. Sans elle, donnez `aria-label`. */
  label?: ReactNode;
  /** Le texte d'aide sous la légende ; il décrit le groupe. */
  helperText?: ReactNode;
  /** L'erreur, annoncée et décrite sur le groupe ; rend le groupe invalide. */
  error?: ReactNode;
  /** Les choix, rendus avant les `<Radio>` passés en enfants. */
  options?: readonly RadioOption[];
  /** Des `<Radio>`, rendus après `options`. */
  children?: ReactNode;
  /**
   * Le nom de formulaire, partagé par tous les radios. Absent, un nom interne
   * les regroupe quand même (flèches, choix unique) : donnez-en un pour que la
   * valeur parte dans un formulaire sous une clé connue.
   */
  name?: string;
  /** La valeur cochée. Présente, l'appelant la tient ; `''` ne coche rien. */
  value?: string;
  /** La valeur cochée au départ, et celle que `form.reset()` rétablit. */
  defaultValue?: string;
  /** Appelée avec la valeur du radio qu'on vient de cocher. `onChange` natif part aussi. */
  onValueChange?: (value: string) => void;
  /** Le `onChange` natif de chaque radio. */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /** Le `onBlur` natif de chaque radio. */
  onBlur?: FocusEventHandler<HTMLInputElement>;
  /** La ref de CHAQUE radio natif : appelée une fois par radio. */
  ref?: Ref<HTMLInputElement>;
  /** L'identifiant du `<form>` propriétaire, posé sur chaque radio. */
  form?: string;
  /** Rend le choix obligatoire : `required` sur chaque radio, `aria-required` sur le groupe. */
  required?: boolean;
  /** Désactive tout le groupe, par le `disabled` natif du `<fieldset>`. */
  disabled?: boolean;
  /** La disposition des choix. Défaut : `vertical`. */
  orientation?: 'vertical' | 'horizontal';
  /** La taille des ronds et du texte. Défaut : `medium`. */
  size?: OpaleSize;
  /** Rend les ronds sur le matériau « verre liquide ». Défaut : `false`. */
  liquidGlass?: boolean;
}

/* =============================================================================
   UN RADIO, NATIF, HABILLÉ COMME LA CASE À COCHER.

   Le natif est invisible et posé dans la rangée ; le rond est une décoration
   que `.opale-radio:checked + .opale-radio-mark` peint depuis le CSS, à partir
   de l'état réel du natif. Aucun état n'est recopié en JavaScript : le clavier
   (flèches, Espace), le choix unique et la soumission sont ceux du navigateur.

   LE NOM EST LE LIBELLÉ, LA DESCRIPTION DÉCRIT — la leçon de `Checkbox` : la
   rangée est un `<label>`, donc tout ce qu'elle contient entrerait dans le
   nom sans un `aria-labelledby` explicite.
   ========================================================================== */
export function Radio({
  value,
  label,
  description,
  className,
  controlClassName,
  liquidGlass: liquidGlassProp = false,
  onChange,
  onBlur,
  ref,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...props
}: RadioProps) {
  const group = useContext(RadioGroupContext);
  const labelId = useId();
  const descriptionId = useId();
  const groupRef = group?.inputRef;
  const inputRef = useCallback(
    (node: HTMLInputElement | null) => mergeRefs(groupRef, ref)(node),
    [groupRef, ref],
  );
  const liquidGlass = group ? group.liquidGlass : liquidGlassProp;
  const size = group?.size ?? 'medium';
  const labelledBy =
    ariaLabelledBy ?? (ariaLabel === undefined && hasContent(label) ? labelId : undefined);

  /* Contrôlé, le groupe impose `checked` ; libre, il pose `defaultChecked`,
     que la réinitialisation d'un formulaire rétablit sans React. */
  const checkedProps = group
    ? group.value !== undefined
      ? { checked: group.value === value }
      : { defaultChecked: group.defaultValue === value }
    : {};

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    group?.onChange(event);
    onChange?.(event);
  };
  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    group?.onBlur?.(event);
    onBlur?.(event);
  };

  return (
    <label
      className={clsx(
        'opale-radio-row',
        size !== 'medium' && `opale-radio-row--${size}`,
        styles.row,
        styles[size],
        liquidGlass && ['opale-radio-row--glass', styles.rowGlass],
        className,
      )}
    >
      <input
        type="radio"
        className={clsx('opale-radio', styles.radio, controlClassName)}
        {...props}
        {...checkedProps}
        {...(group && { name: group.name, required: group.required, form: group.form })}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={mergeIds(ariaDescribedBy, hasContent(description) && descriptionId)}
        ref={inputRef}
      />
      <FieldShell
        liquidGlass={liquidGlass}
        className={clsx(
          'opale-radio-mark',
          styles.mark,
          liquidGlass && ['opale-radio-mark--glass', styles.markGlass],
        )}
        rootClassName={clsx('opale-radio--glass-root', styles.glassRoot)}
        pressFeedback
      >
        {null}
      </FieldShell>
      {hasContent(label) && (
        <span id={labelId} className={clsx('opale-radio__label', styles.label)}>
          {label}
        </span>
      )}
      {hasContent(description) && (
        <small
          id={descriptionId}
          className={clsx('opale-field__helper', 'opale-radio__description', styles.description)}
        >
          {description}
        </small>
      )}
    </label>
  );
}

/* =============================================================================
   LE GROUPE : UN `<fieldset>` ET SA `<legend>`.

   `role="radiogroup"` sur le `<fieldset>` (que HTML autorise) fait annoncer
   « groupe de boutons radio » et rend valides `aria-invalid` et
   `aria-required`, qu'un simple groupe ne porte pas. La légende nomme le
   groupe ; `aria-labelledby` le dit explicitement, le calcul du nom d'un
   `fieldset` à rôle explicite n'étant pas tenu partout.

   L'AIDE ET L'ERREUR DÉCRIVENT LE GROUPE, PAS CHAQUE RADIO : lues à l'entrée
   dans le groupe, elles ne sont pas répétées à chaque flèche.

   LE GROUPE N'A PAS D'ÉTAT. Libre, les radios portent `defaultChecked` et le
   navigateur tient le reste ; contrôlé, `value` décide. `onValueChange` part
   du `change` natif, qui n'est émis que par le radio nouvellement coché.
   ========================================================================== */
export function RadioGroup({
  label,
  helperText,
  error,
  options,
  children,
  name,
  value,
  defaultValue,
  onValueChange,
  onChange,
  onBlur,
  ref,
  form,
  required = false,
  disabled,
  orientation = 'vertical',
  size = 'medium',
  liquidGlass = false,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  ...props
}: RadioGroupProps) {
  const baseId = useId();
  /* Le `ref` de l'appelant va aux radios (react-hook-form) : le groupe tient le sien. */
  const fieldsetRef = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    if (fieldsetRef.current) warnIfUnnamed('RadioGroup', fieldsetRef.current);
  }, []);
  const legendId = `${baseId}-legend`;
  const helperId = `${baseId}-helper`;
  const errorId = `${baseId}-error`;
  const hasLabel = hasContent(label);
  const hasHelper = hasContent(helperText);
  const hasError = hasContent(error);

  const context: RadioGroupContextValue = {
    name: name ?? baseId,
    value,
    defaultValue,
    required,
    form,
    size,
    liquidGlass,
    inputRef: ref,
    onChange: (event) => {
      onChange?.(event);
      if (event.currentTarget.checked) onValueChange?.(event.currentTarget.value);
    },
    onBlur,
  };

  return (
    <fieldset
      ref={fieldsetRef}
      role="radiogroup"
      className={clsx(
        'opale-radio-group',
        `opale-radio-group--${orientation}`,
        size !== 'medium' && `opale-radio-group--${size}`,
        styles.group,
        className,
      )}
      data-orientation={orientation}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={
        ariaLabelledBy ?? (ariaLabel === undefined && hasLabel ? legendId : undefined)
      }
      aria-describedby={mergeIds(ariaDescribedBy, hasHelper && helperId, hasError && errorId)}
      aria-invalid={hasError ? true : ariaInvalid}
      aria-required={required || undefined}
      {...props}
    >
      {hasLabel && (
        <legend id={legendId} className={clsx('opale-field__label', styles.legend)}>
          {label}
        </legend>
      )}
      {hasHelper && (
        <span id={helperId} className="opale-field__helper">
          {helperText}
        </span>
      )}
      <RadioGroupContext.Provider value={context}>
        <div className={clsx('opale-radio-group__options', styles.options)}>
          {options?.map((option) => (
            <Radio
              key={option.value}
              value={option.value}
              label={option.label}
              description={option.description}
              disabled={option.disabled}
            />
          ))}
          {children}
        </div>
      </RadioGroupContext.Provider>
      {hasError && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}
