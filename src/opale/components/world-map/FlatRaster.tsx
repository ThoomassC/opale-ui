/* =============================================================================
   L'IMAGERIE DU PLAN DE `WorldMap` — chargée à la demande.

   Des `<img>` sous le `<svg>`, posées en pourcentages du cadre pour la vue
   AU REPOS : leur niveau et leur nombre ne changent qu'une fois la vue
   posée, comme le niveau de détail. Pendant un geste, leur conteneur prend
   la transformation qui mène de la vue posée à la vue peinte — la même que
   celle du dessin. Au-delà du niveau le plus fin, les images sont agrandies.

   UNE TUILE EN ÉCHEC N'EST PAS REDEMANDÉE : elle sort de la liste. Quand plus
   de la moitié des tuiles d'une vue échouent, `onFailure` rend la main à la
   carte, qui revient au dessin. Sous toutes les tuiles, l'image du monde
   entier (niveau 0) bouche les trous pendant qu'elles arrivent.
   ========================================================================== */

import { useMemo, useRef, useState } from 'react';

import { rasterTiles, tileUrl } from './raster';
import { flatTransform, type Frame, type WorldMapView } from './view';

export interface FlatRasterProps {
  /** La vue peinte. */
  readonly view: WorldMapView;
  /** La vue posée : celle qui choisit les tuiles. */
  readonly settled: WorldMapView;
  readonly frame: Frame;
  /** La largeur affichée du cadre, en pixels. */
  readonly framePx: number;
  /** Le gabarit des tuiles (`{z}`, `{x}`, `{y}`). */
  readonly template: string;
  /** Le niveau le plus fin des tuiles. */
  readonly maxZoom: number;
  /** Appelée quand l'imagerie est indisponible : plus de la moitié des tuiles en échec. */
  readonly onFailure: (error: Error) => void;
}

const percent = (value: number, of: number) => `${(value / of) * 100}%`;

export default function FlatRaster({
  view,
  settled,
  frame,
  framePx,
  template,
  maxZoom,
  onFailure,
}: FlatRasterProps) {
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set());
  /* LES ÉCHECS SE COMPTENT DANS UNE RÉFÉRENCE : une rafale d'erreurs arrive
     avant le rendu suivant, et chaque gestionnaire lisait l'ensemble capturé
     au rendu — le dernier effaçait les autres. */
  const failures = useRef(new Set<string>());
  const reported = useRef(false);

  const tiles = useMemo(() => {
    const world = { z: 0, x: 0, y: 0 };
    return [
      {
        ...world,
        key: 'world',
        url: tileUrl(template, world),
        ...rasterTiles(settled, frame, framePx, 0)[0],
      },
      ...rasterTiles(settled, frame, framePx, maxZoom).map((tile) => ({
        ...tile,
        key: `${tile.z}/${tile.x}/${tile.y}`,
        url: tileUrl(template, tile),
      })),
    ];
  }, [settled, frame, framePx, maxZoom, template]);

  const fail = (url: string) => {
    failures.current.add(url);
    setFailed(new Set(failures.current));
    const wanted = tiles.slice(1);
    const missing = wanted.filter((tile) => failures.current.has(tile.url)).length;
    if (!reported.current && missing * 2 > wanted.length) {
      reported.current = true;
      onFailure(new Error('Imagerie indisponible.'));
    }
  };

  /* De la vue posée à la vue peinte : cadre₁ = cadre₀ × k + (dx, dy). */
  const from = flatTransform(settled, frame);
  const to = flatTransform(view, frame);
  const k = to.scale / from.scale;
  const dx = to.x - from.x * k;
  const dy = to.y - from.y * k;

  return (
    <div
      className="opale-world-map__raster"
      aria-hidden="true"
      style={{
        transform: `translate(${percent(dx, frame.width)}, ${percent(dy, frame.height)}) scale(${k})`,
      }}
    >
      {tiles.map(({ key, url, left, top, size }) =>
        failed.has(url) ? null : (
          <img
            key={key}
            className={key === 'world' ? undefined : 'opale-world-map__tile'}
            src={url}
            alt=""
            decoding="async"
            loading="lazy"
            draggable={false}
            onError={() => fail(url)}
            style={{
              left: percent(left, frame.width),
              top: percent(top, frame.height),
              width: percent(size, frame.width),
              height: percent(size, frame.height),
            }}
          />
        ),
      )}
    </div>
  );
}
