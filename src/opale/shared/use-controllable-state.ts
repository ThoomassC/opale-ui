import { useCallback, useState } from 'react';

/**
 * L'état contrôlable d'Opale : présente (`!== undefined`), `value` rend
 * l'appelant maître ; absente, le composant se souvient. Le rappel part dans
 * les deux modes, à chaque intention, même si la valeur ne change pas.
 * Pas de mise à jour fonctionnelle. Interne : non réexporté.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T | (() => T),
  onChange?: (next: T) => void,
): readonly [current: T, setValue: (next: T) => void, isControlled: boolean] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : internal;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(() => next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [current, setValue, isControlled];
}
