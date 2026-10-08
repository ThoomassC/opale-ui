/* =============================================================================
   LES PROJECTIONS DE `WorldMap` — sans React, sans DOM.

   - PLAN : Mercator unitaire. Le monde tient dans le carré [0, 1] × [0, 1],
     ouest à gauche, nord en haut (y vers le bas, comme le SVG). La latitude
     est bornée à ±85,0511° : au-delà, Mercator part à l'infini, et c'est la
     borne des tuiles web — l'imagerie et le vecteur se superposent.
   - GLOBE : orthographique, vu de l'extérieur. Un point est d'abord tourné
     pour que le centre de la vue (λ0, φ0) vienne en face ; il est visible
     quand cos c = z ≥ 0. Sorties sur le disque unité, y vers le bas.
   ========================================================================== */

/** La latitude où Mercator rend un monde carré : la borne des tuiles web. */
export const MAX_LATITUDE = 85.0511287798066;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Une longitude ramenée dans [−180, 180). */
export function normalizeLongitude(longitude: number): number {
  const wrapped = (((longitude + 180) % 360) + 360) % 360;
  return wrapped - 180;
}

const clampLatitude = (latitude: number) =>
  Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));

/** Mercator unitaire : `[x, y]` dans [0, 1], y vers le bas. */
export function mercator(longitude: number, latitude: number): [number, number] {
  const phi = clampLatitude(latitude) * RAD;
  return [(longitude + 180) / 360, 0.5 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / (2 * Math.PI)];
}

/** L'inverse de `mercator` : `[longitude, latitude]` en degrés. */
export function inverseMercator(x: number, y: number): [number, number] {
  return [x * 360 - 180, (2 * Math.atan(Math.exp((0.5 - y) * 2 * Math.PI)) - Math.PI / 2) * DEG];
}

/**
 * Une rotation précalculée vers la vue centrée sur `(λ0, φ0)` : rend
 * `[x, y, z]` sur la sphère unité, x vers l'est, y vers le BAS de l'écran, z
 * vers l'observateur. `z` vaut cos c : le point est visible quand z ≥ 0.
 * Les sinus et cosinus du centre ne sont calculés qu'une fois — le globe
 * tourne des dizaines de milliers de points par image.
 */
export function createRotation(
  longitude0: number,
  latitude0: number,
): (longitude: number, latitude: number) => [number, number, number] {
  const lambda0 = longitude0 * RAD;
  const sinPhi0 = Math.sin(latitude0 * RAD);
  const cosPhi0 = Math.cos(latitude0 * RAD);
  return (longitude, latitude) => {
    const phi = latitude * RAD;
    const delta = longitude * RAD - lambda0;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    const cosDelta = Math.cos(delta);
    return [
      cosPhi * Math.sin(delta),
      -(cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosDelta),
      sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosDelta,
    ];
  };
}

/** Orthographique vue de `[λ0, φ0]` : `[x, y, z]`, voir `createRotation`. */
export function orthographic(
  longitude: number,
  latitude: number,
  [longitude0, latitude0]: readonly [number, number],
): [number, number, number] {
  return createRotation(longitude0, latitude0)(longitude, latitude);
}

/**
 * L'inverse de `orthographic` pour un point du disque unité (y vers le bas) :
 * `[longitude, latitude]`, ou `null` hors du disque.
 */
export function inverseOrthographic(
  x: number,
  y: number,
  [longitude0, latitude0]: readonly [number, number],
): [number, number] | null {
  const rho = Math.hypot(x, y);
  if (rho > 1 + 1e-12) return null;
  if (rho < 1e-12) return [normalizeLongitude(longitude0), latitude0];
  const up = -y;
  const c = Math.asin(Math.min(1, rho));
  const sinC = Math.sin(c);
  const cosC = Math.cos(c);
  const phi0 = latitude0 * RAD;
  const latitude = Math.asin(cosC * Math.sin(phi0) + (up * sinC * Math.cos(phi0)) / rho);
  const longitude =
    longitude0 * RAD +
    Math.atan2(x * sinC, rho * cosC * Math.cos(phi0) - up * sinC * Math.sin(phi0));
  return [normalizeLongitude(longitude * DEG), latitude * DEG];
}
