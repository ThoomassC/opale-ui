/* =============================================================================
   LE GLOBE VECTORIEL DE `WorldMap` — chargé à la demande.

   `WorldMap` ne l'importe que par `import()`, au premier passage en globe :
   la découpe par l'horizon, le graticule et le limbe ne pèsent rien sur une
   carte qui reste en plan. Il se dessine dans le `<svg>` de la carte, par
   dessus le disque d'océan qu'elle pose elle-même dès le rendu serveur.

   À CHAQUE RENDU, TOUT EST REDÉCOUPÉ : la rotation change le tracé, pas une
   transformation. Pendant un geste, la carte ne lui passe que le 110m ; les
   anneaux de la face cachée sont écartés avant toute découpe
   (`globe-paths.ts`).

   SUR L'IMAGERIE, pas de remplissage : seuls les traits, clairs, chacun
   doublé dessous d'un halo sombre — les mêmes tracés rendus deux fois, le
   premier groupe avec les jetons du halo (voir `opale.css`).
   ========================================================================== */

import { useId, useMemo } from 'react';

import type { WorldDataFile } from './data-format';
import { globePaths, graticule } from './globe-paths';
import { createRotation } from './projection';
import { globeRadius, type Frame, type WorldMapView } from './view';

export interface GlobeLayerProps {
  /** Les fichiers du niveau affiché. */
  readonly files: readonly WorldDataFile[];
  /** La vue peinte. */
  readonly view: WorldMapView;
  readonly frame: Frame;
  /** Le zoom web au repos : fleuves et pas du graticule. */
  readonly webZoom: number;
  /** Couleur de remplissage d'un pays, par son code ISO. */
  readonly fill?: (countryId: string) => string | undefined;
  /** L'imagerie est dessous : traits seuls, cernés d'un halo. */
  readonly imagery: boolean;
  /** Appelée si le module n'a pas pu être chargé (voir `WorldMap`). */
  readonly onFailure: (error: Error) => void;
}

/** Le graticule se resserre de 30° à 10° à partir de ce zoom web. */
const FINE_GRATICULE_ZOOM = 2;
/** L'atmosphère déborde du disque de 6 % de son rayon. */
const ATMOSPHERE = 1.06;

export default function GlobeLayer({
  files,
  view,
  frame,
  webZoom,
  fill,
  imagery,
}: GlobeLayerProps) {
  const limb = `${useId()}limb`;
  const cx = frame.width / 2;
  const cy = frame.height / 2;
  const radius = globeRadius(frame, view.zoom);
  const { longitude, latitude } = view;

  const { layers, grid } = useMemo(() => {
    const disk = { rotate: createRotation(longitude, latitude), cx, cy, radius };
    return {
      layers: files.map((file) => globePaths(file, { ...disk, webZoom })),
      grid: graticule(webZoom >= FINE_GRATICULE_ZOOM ? 10 : 30, disk),
    };
  }, [files, longitude, latitude, cx, cy, radius, webZoom]);

  /* SUR L'IMAGERIE, chaque trait est doublé dessous d'un halo sombre : les
     mêmes tracés, plus larges, d'autres jetons. */
  const lines = layers.map((paths, index) => (
    <g key={index} className="opale-world-map__lines">
      {paths.lakes && <path d={paths.lakes} className="opale-world-map__lake" fillRule="evenodd" />}
      <path d={paths.rivers} className="opale-world-map__river" vectorEffect="non-scaling-stroke" />
      <path
        d={paths.borders}
        className="opale-world-map__border"
        vectorEffect="non-scaling-stroke"
      />
      <path d={paths.coast} className="opale-world-map__coast" vectorEffect="non-scaling-stroke" />
    </g>
  ));
  /* Le dégradé est dessiné sur un cercle plus grand que le disque : son bord
     intérieur assombrit le limbe, son anneau extérieur est l'atmosphère. */
  const edge = 1 / ATMOSPHERE;

  return (
    <g className="opale-world-map__globe">
      <defs>
        <radialGradient id={limb}>
          <stop offset={edge * 0.72} className="opale-world-map__limb-clear" />
          <stop offset={edge} className="opale-world-map__limb-shade" />
          <stop offset={edge} className="opale-world-map__limb-air" />
          <stop offset={1} className="opale-world-map__limb-clear" />
        </radialGradient>
      </defs>
      <path d={grid} className="opale-world-map__graticule" vectorEffect="non-scaling-stroke" />
      {layers.map((paths, index) =>
        paths.countries.map(({ id, d }) => {
          const color = imagery ? undefined : fill?.(id);
          return (
            <path
              key={`${index}:${id}`}
              d={d}
              data-country={id}
              className="opale-world-map__land"
              fillRule="evenodd"
              style={color ? { fill: color } : undefined}
            />
          );
        }),
      )}
      {imagery && <g className="opale-world-map__halo">{lines}</g>}
      {lines}
      <circle
        className="opale-world-map__limb"
        cx={cx}
        cy={cy}
        r={radius * ATMOSPHERE}
        fill={`url(#${limb})`}
        aria-hidden="true"
      />
    </g>
  );
}
