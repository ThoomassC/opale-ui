import { useContext } from 'react';

import { FieldContext, type FieldControlProps } from './field-context';
import { mergeIds } from './merge-ids';

/** Les props qu'un contrôle maison apporte lui-même, et que le champ complète. */
export type FieldOwnProps = Partial<Omit<FieldControlProps, 'aria-invalid' | 'aria-required'>> & {
  /** L'état d'erreur propre au contrôle. Dans un `Field`, l'erreur du champ l'emporte. */
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling';
  /** Le caractère obligatoire propre au contrôle. Dans un `Field`, celui du champ l'emporte. */
  'aria-required'?: boolean | 'true' | 'false';
};

/**
 * Les props d'accessibilité du `Field` qui entoure le composant, fusionnées
 * avec celles que le composant apporte.
 *
 * C'est la voie des contrôles RÉUTILISABLES : le composant appelle le crochet,
 * étale le résultat sur l'élément focalisable, et devient nommé, décrit et
 * validé dès qu'on le pose dans un `Field` — sans que l'appelant ait à écrire
 * de fonction enfant.
 *
 * Dans un `Field` : l'`id` et `aria-labelledby` du champ l'emportent (ce sont
 * eux que vise le libellé), les descriptions s'ajoutent après celles du
 * composant, et l'erreur du champ force `aria-invalid`. Hors d'un `Field` :
 * les props reçues sont rendues telles quelles.
 */
export function useFieldProps<P extends FieldOwnProps = FieldOwnProps>(
  own?: P,
): Omit<P, keyof FieldOwnProps> & FieldOwnProps {
  const field = useContext(FieldContext);
  const base: FieldOwnProps & Omit<P, keyof FieldOwnProps> = own ?? ({} as P);
  if (!field) return base;

  return {
    ...base,
    id: field.id,
    'aria-labelledby': field['aria-labelledby'] ?? base['aria-labelledby'],
    'aria-describedby': mergeIds(base['aria-describedby'], field['aria-describedby']),
    'aria-invalid': field['aria-invalid'] ?? base['aria-invalid'],
    'aria-required': field['aria-required'] ?? base['aria-required'],
  };
}
