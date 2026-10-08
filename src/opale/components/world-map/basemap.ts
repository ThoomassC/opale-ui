/* =============================================================================
   L'IMAGERIE DE `WorldMap` — pure donnée, livrée sans "use client".

   La NASA publie par GIBS la mosaïque Blue Marble en tuiles Web Mercator,
   sans clé, avec CORS ouvert, jusqu'au niveau 8. C'est le fond « satellite »
   par défaut ; une application peut en servir un autre par `tileUrl`.
   ========================================================================== */

/**
 * Le gabarit des tuiles NASA GIBS Blue Marble (relief ombré et bathymétrie),
 * en Web Mercator : `{z}`, `{x}` et `{y}` sont remplacés à chaque tuile.
 */
export const GIBS_BLUE_MARBLE_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg';
