/* Les cadres de continent précalculés, produits par `scripts/world-map.mjs` :
   la boîte projetée de chaque cadre en degrés, dans le repère 960 × 500. */
import type { SvgMapBounds } from '../../../../opale';

declare const continentFrames: Readonly<
  Record<'europe' | 'africa' | 'asia' | 'americas' | 'oceania', SvgMapBounds>
>;

export default continentFrames;
