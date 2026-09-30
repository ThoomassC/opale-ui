import { createContext } from 'react';

/**
 * Les props qu'un `Field` confie à son contrôle : de quoi être nommé, décrit,
 * et déclaré invalide ou requis. À étaler sur l'élément qui reçoit le focus.
 */
export interface FieldControlProps {
  /** L'identifiant du contrôle, visé par le `<label for>` du champ. */
  id: string;
  /**
   * Le libellé du champ. Il nomme aussi les contrôles qu'un `<label for>` ne
   * nomme pas : un `<div role="combobox">`, un bouton de sélection maison.
   * Absent quand le champ n'a pas de `label`.
   */
  'aria-labelledby'?: string;
  /** L'aide puis l'erreur, dans cet ordre. Absent quand il n'y a ni l'une ni l'autre. */
  'aria-describedby'?: string;
  /** `true` quand le champ porte une `error`, absent sinon. */
  'aria-invalid'?: true;
  /** `true` quand le champ est `required`, absent sinon. */
  'aria-required'?: true;
}

/** Le contexte d'un `Field`. Interne : lu par `useFieldProps()`. */
export const FieldContext = createContext<FieldControlProps | null>(null);
