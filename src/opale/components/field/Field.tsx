import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import clsx from 'clsx';

import { FieldError } from '../../catalog/shells';
import { FieldContext, type FieldControlProps } from './field-context';
import { hasContent, mergeIds } from './merge-ids';
import styles from './style/Field.module.css';

/**
 * Les props de `Field`.
 *
 * `className`, `style`, `ref`, `data-*` et le reste vont à l'ENVELOPPE —
 * `.opale-field`, qui porte libellé, aide et erreur. Le contrôle, lui,
 * appartient à l'appelant : il reçoit ses props d'accessibilité par la
 * fonction enfant ou par `useFieldProps()`.
 *
 * `FieldProps` reste l'ancien alias déprécié d'`InputProps` jusqu'en 4.0.0 :
 * d'où ce nom.
 */
export interface FieldWrapperProps extends Omit<ComponentPropsWithRef<'div'>, 'id' | 'children'> {
  /** Le libellé visible, rendu en `<label for>` et désigné par `aria-labelledby`. */
  label?: ReactNode;
  /** Le texte d'aide, sous le contrôle ; il DÉCRIT le contrôle, il ne le nomme pas. */
  description?: ReactNode;
  /**
   * L'erreur, annoncée (`role="alert"`) et décrite après l'aide ; rend le
   * contrôle invalide (`aria-invalid`). L'aide reste affichée à côté.
   */
  error?: ReactNode;
  /**
   * Déclare le champ obligatoire : `aria-required` sur le contrôle, et une
   * marque décorative `*` après le libellé. La validation native (`required`
   * sur un `<input>`) reste à poser par l'appelant, qui sait si son contrôle
   * en a une.
   */
  required?: boolean;
  /** L'identifiant du CONTRÔLE, pas de l'enveloppe. Généré par défaut. */
  id?: string;
  /** Va à l'enveloppe, à côté de `.opale-field` et `.opale-form-field`. */
  className?: string;
  /**
   * Le contrôle. Une fonction reçoit ses props d'accessibilité à étaler sur
   * l'élément focalisable ; un nœud les lit par `useFieldProps()`.
   */
  children: ReactNode | ((props: FieldControlProps) => ReactNode);
}

/* =============================================================================
   LE CHAMP GÉNÉRIQUE : CE QU'`Input` FAIT POUR SON `<input>`, POUR N'IMPORTE
   QUEL CONTRÔLE.

   POURQUOI UNE FONCTION ENFANT, ET PAS `cloneElement`. Cloner l'enfant pour
   lui injecter `id` et `aria-*` suppose que l'enfant les transmet à son
   élément focalisable — ce qu'on ne peut ni vérifier ni typer. Un composant
   qui les ignore ou les pose sur son enveloppe donne un libellé qui ne nomme
   rien, sans une erreur. La fonction enfant rend le contrat EXPLICITE et typé :
   l'appelant voit ce qu'il reçoit et choisit où l'étaler. Le contexte lu par
   `useFieldProps()` est la même chose pour un contrôle réutilisable, écrit une
   fois pour toutes.

   LE LIBELLÉ NOMME DEUX FOIS, ET C'EST VOULU. `<label for>` nomme un contrôle
   natif et le focalise au clic ; `aria-labelledby` nomme ce que `for` ne sait
   pas nommer — un `<div role="combobox">`, un bouton maison. Sur un natif,
   les deux désignent le même texte : le nom calculé ne change pas.

   L'ERREUR N'EFFACE PAS L'AIDE. Là où `Input` remplace son aide par l'erreur,
   le champ générique garde les deux, comme `Checkbox` : la consigne est ce
   qui permet de corriger.
   ========================================================================== */
export function Field({
  label,
  description,
  error,
  required = false,
  id,
  className,
  children,
  ...props
}: FieldWrapperProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const labelId = `${controlId}-label`;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const hasLabel = hasContent(label);
  const hasDescription = hasContent(description);
  const hasError = hasContent(error);

  const describedBy = mergeIds(hasDescription && descriptionId, hasError && errorId);

  const controlProps: FieldControlProps = {
    id: controlId,
    ...(hasLabel && { 'aria-labelledby': labelId }),
    ...(describedBy && { 'aria-describedby': describedBy }),
    ...(hasError && { 'aria-invalid': true as const }),
    ...(required && { 'aria-required': true as const }),
  };

  return (
    <div className={clsx('opale-field', 'opale-form-field', styles.field, className)} {...props}>
      {hasLabel && (
        <label id={labelId} className="opale-field__label" htmlFor={controlId}>
          {label}
          {required && (
            /* DÉCORATIVE : `aria-required` dit déjà « obligatoire ». Lue, la
               marque ajouterait « astérisque » au nom du contrôle. */
            <span className={clsx('opale-field__required', styles.required)} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <FieldContext.Provider value={controlProps}>
        {typeof children === 'function' ? children(controlProps) : children}
      </FieldContext.Provider>
      {hasDescription && (
        <span id={descriptionId} className="opale-field__helper">
          {description}
        </span>
      )}
      {hasError && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
