/**
 * Les libellés effectifs d'un composant : chaque clé omise ou `undefined` garde
 * sa valeur française par défaut. Les défauts ne sont jamais modifiés. Interne.
 */
export function resolveLabels<T extends object>(defaults: T, overrides: Partial<T> | undefined): T {
  if (!overrides) return defaults;
  const labels = { ...defaults };
  for (const key of Object.keys(overrides) as Array<keyof T>) {
    const value = overrides[key];
    if (value !== undefined) labels[key] = value;
  }
  return labels;
}
