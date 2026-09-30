import type { Ref, RefCallback } from 'react';

/**
 * Une ref qui en alimente plusieurs : le composant garde la sienne, l'appelant
 * reçoit la même.
 *
 * Elle rend une fonction de nettoyage (React 19) : au détachement, chaque ref
 * objet est vidée, chaque ref fonction est rappelée avec `null` — ou, si elle a
 * rendu son propre nettoyage, c'est lui qui part. Les refs absentes sont
 * ignorées.
 */
export function mergeRefs<T>(...refs: ReadonlyArray<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    const cleanups = refs.map((ref) => {
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        return typeof cleanup === 'function' ? cleanup : () => ref(null);
      }
      if (ref) {
        ref.current = node;
        return () => {
          ref.current = null;
        };
      }
      return undefined;
    });

    return () => {
      for (const cleanup of cleanups) cleanup?.();
    };
  };
}
