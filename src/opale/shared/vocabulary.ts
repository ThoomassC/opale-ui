/** L'échelle de taille unique d'Opale. Un composant peut n'en accepter qu'une partie. */
export type OpaleSize = 'small' | 'medium' | 'large';

/**
 * Le ton d'un message : sa couleur, son icône et l'urgence de son annonce.
 * `warning` et `error` interrompent la lecture ; les autres attendent leur tour.
 */
export type OpaleTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

/** Les six places d'un élément posé en surimpression de l'écran. */
export type OpalePlacement =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

/** Les tailles héritées, encore acceptées par certains composants. Interne : non réexporté. */
type LegacySize = 'sm' | 'md' | 'lg' | 'compact' | 'comfortable' | 'spacious';

const LEGACY_SIZES: Readonly<Record<LegacySize, OpaleSize>> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
  compact: 'small',
  comfortable: 'medium',
  spacious: 'large',
};

function isLegacySize(size: string): size is LegacySize {
  return Object.hasOwn(LEGACY_SIZES, size);
}

/** Ramène une taille, héritée ou canonique, sur l'échelle d'Opale. Interne. */
export function normalizeSize(
  size: OpaleSize | LegacySize | undefined,
  fallback: OpaleSize,
): OpaleSize {
  if (size === undefined) return fallback;
  return isLegacySize(size) ? LEGACY_SIZES[size] : size;
}
