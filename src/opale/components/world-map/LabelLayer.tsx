/* =============================================================================
   LES ÉTIQUETTES DE `WorldMap` — chargées à la demande.

   Les noms des pays et des villes ne paraissent qu'avec les données, qui
   arrivent après le premier rendu : ce module se charge en même temps
   qu'elles, et le chargement initial de la carte n'en paie rien.

   CHOISIES AU REPOS, PLACÉES SUR LA VUE PEINTE. Le placement (glouton, sans
   DOM : `labels.ts`) suit la vue posée ; pendant un geste, les étiquettes
   retenues suivent la projection de la vue peinte, et celles qui passent
   derrière le globe s'effacent.

   ELLES CONTOURNENT CE QUI EST POSÉ SUR LA CARTE : les repères, et les
   bascules et commandes, dont les boîtes sont mesurées ici
   (`ResizeObserver`), en unités du cadre. Sous 30 rem, les commandes passent
   sous la carte et ne gênent plus rien.
   ========================================================================== */

import { useEffect, useMemo, useState, type RefObject } from 'react';

import type { WorldDataFile } from './data-format';
import { placeLabels, type CityCandidate, type CountryCandidate, type LabelBox } from './labels';
import { byMinZoom } from './lod';
import type { Frame, WorldMapView } from './view';

/** Une projection : `[x, y, face]` en unités du cadre, la face négative derrière le globe. */
export type Projector = (
  view: WorldMapView,
) => (longitude: number, latitude: number) => readonly number[];

export interface LabelLayerProps {
  /** Les fichiers du niveau affiché. */
  readonly files: readonly WorldDataFile[];
  /** La vue posée, qui choisit les étiquettes, et la vue peinte, qui les place. */
  readonly settled: WorldMapView;
  readonly view: WorldMapView;
  readonly frame: Frame;
  /** Le zoom web au repos. */
  readonly webZoom: number;
  /** Une unité du cadre, en pixels affichés. */
  readonly unit: number;
  readonly locale: string;
  /** Le nom d'un pays par son code ISO. */
  readonly nameOf: (countryId: string) => string | undefined;
  readonly projector: Projector;
  /** Les repères, que les étiquettes contournent. */
  readonly pins: readonly { readonly longitude: number; readonly latitude: number }[];
  /** Le cadre de la carte, où chercher les commandes, et sa surface rognée. */
  readonly frameRef: RefObject<HTMLDivElement | null>;
  readonly canvasRef: RefObject<HTMLDivElement | null>;
  /** Change quand les commandes affichées changent : elles sont alors remesurées. */
  readonly controlsKey: string;
  /** Appelée si le module n'a pas pu être chargé (voir `WorldMap`). */
  readonly onFailure: (error: Error) => void;
}

/** Tailles des étiquettes, en pixels affichés. */
const COUNTRY_FONT_PX = 12;
const CITY_FONT_PX = 11;
/** La pastille d'un repère, anneaux compris, en pixels affichés. */
const PIN_PX = 20;
/** La marge des étiquettes au bord du cadre, en pixels affichés. */
const LABEL_MARGIN_PX = 4;
const cityName = (
  place: { readonly n: string; readonly fr?: string; readonly en?: string },
  locale: string,
) =>
  locale.startsWith('fr')
    ? (place.fr ?? place.n)
    : locale.startsWith('en')
      ? (place.en ?? place.n)
      : place.n;
interface Placed {
  readonly id: string;
  readonly text: string;
  readonly kind: 'country' | 'city';
  readonly longitude: number;
  readonly latitude: number;
}

export default function LabelLayer({
  files,
  settled,
  view,
  frame,
  webZoom,
  unit,
  locale,
  nameOf,
  projector,
  pins,
  frameRef,
  canvasRef,
  controlsKey,
}: LabelLayerProps) {
  /* LES COMMANDES POSÉES SUR LA CARTE SONT DES OBSTACLES pour les
     étiquettes : leurs boîtes sont mesurées, en unités du cadre, à chaque
     changement de taille (le groupe des flèches paraît au premier zoom).
     Sous 30 rem, elles passent sous la carte et ne gênent plus rien. */
  const [controlBoxes, setControlBoxes] = useState<readonly LabelBox[]>([]);
  useEffect(() => {
    const node = frameRef.current;
    const surface = canvasRef.current;
    if (!node || !surface || typeof ResizeObserver === 'undefined') return undefined;
    const boxes = [
      ...node.querySelectorAll('.opale-world-map__layers, .opale-world-map__controls'),
    ];
    const measure = () => {
      const box = surface.getBoundingClientRect();
      if (box.width <= 0) return;
      const k = frame.width / box.width;
      const next = boxes.flatMap((element) => {
        const r = element.getBoundingClientRect();
        const left = (r.left - box.left) * k;
        const top = (r.top - box.top) * k;
        const right = (r.right - box.left) * k;
        const bottom = (r.bottom - box.top) * k;
        return right > left && right > 0 && bottom > 0 && left < frame.width && top < frame.height
          ? [{ left, top, right, bottom }]
          : [];
      });
      setControlBoxes((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    for (const element of boxes) observer.observe(element);
    return () => observer.disconnect();
  }, [frame, frameRef, canvasRef, controlsKey]);

  /* Les positions des repères, par leur valeur : un tableau `pins` recréé à
     chaque rendu de l'appelant ne relance pas le placement. */
  const pinKey = pins.map(({ longitude, latitude }) => `${longitude},${latitude}`).join(';');
  const pinSpots = useMemo(
    () => (pinKey ? pinKey.split(';').map((spot) => spot.split(',').map(Number)) : []),
    [pinKey],
  );
  const placed = useMemo<readonly Placed[]>(() => {
    const geo = new Map<string, readonly [number, number]>();
    const countries: CountryCandidate[] = [];
    const cities: CityCandidate[] = [];
    const at = projector(settled);
    const inFrame = ([x, y, face]: readonly number[]) =>
      face >= 0 && x >= 0 && y >= 0 && x <= frame.width && y <= frame.height;
    /* Une carte étroite montre le monde sous le zoom web 1 : les plus grands
       pays y sont nommés quand même, si la place le permet. */
    const labelZoom = Math.max(webZoom, 1.5);
    for (const file of files) {
      for (const candidate of file.countryLabels ?? []) {
        if (geo.has(candidate.id) || candidate.min > labelZoom + 0.5 || candidate.max < webZoom) {
          continue;
        }
        const text = nameOf(candidate.id);
        const point = at(candidate.lon, candidate.lat);
        const [x, y] = point;
        if (!text || !inFrame(point)) continue;
        geo.set(candidate.id, [candidate.lon, candidate.lat]);
        countries.push({ id: candidate.id, text, x, y, minLabel: candidate.min });
      }
      for (const place of byMinZoom(file.places ?? [], webZoom)) {
        const id = `${place.n}@${place.lon},${place.lat}`;
        const point = at(place.lon, place.lat);
        const [x, y] = point;
        if (geo.has(id) || !inFrame(point)) continue;
        geo.set(id, [place.lon, place.lat]);
        cities.push({
          id,
          text: cityName(place, locale),
          x,
          y,
          population: place.pop,
          capital: place.cap === 1,
        });
      }
    }
    /* Les étiquettes contournent les repères — une pastille sur « Islande »
       en cachait le nom — et les commandes posées sur la carte. */
    const half = (PIN_PX / 2) * unit;
    const obstacles = pinSpots.flatMap(([longitude = 0, latitude = 0]) => {
      const [x, y, face] = at(longitude, latitude);
      return face < 0 ? [] : [{ left: x - half, right: x + half, top: y - half, bottom: y + half }];
    });
    return placeLabels(countries, cities, {
      width: frame.width,
      height: frame.height,
      countryFontSize: COUNTRY_FONT_PX * unit,
      cityFontSize: CITY_FONT_PX * unit,
      obstacles: [...obstacles, ...controlBoxes],
      margin: LABEL_MARGIN_PX * unit,
    }).map(({ id, text, kind }) => {
      const [longitude, latitude] = geo.get(id) ?? [0, 0];
      return { id, text, kind, longitude, latitude };
    });
  }, [files, settled, frame, webZoom, nameOf, locale, unit, projector, pinSpots, controlBoxes]);

  const project = projector(view);
  return (
    <g className="opale-world-map__labels" aria-hidden="true">
      {placed.map(({ id, text, kind, longitude, latitude }) => {
        const [x, y, face] = project(longitude, latitude);
        if (face < 0) return null;
        return kind === 'country' ? (
          <text
            key={id}
            x={x}
            y={y}
            className="opale-world-map__country-label"
            fontSize={COUNTRY_FONT_PX * unit}
            strokeWidth={3 * unit}
          >
            {text}
          </text>
        ) : (
          <g key={id} className="opale-world-map__city">
            <circle cx={x} cy={y} r={2.5 * unit} strokeWidth={unit} />
            <text
              x={x + (CITY_FONT_PX * unit) / 2}
              y={y}
              fontSize={CITY_FONT_PX * unit}
              strokeWidth={3 * unit}
            >
              {text}
            </text>
          </g>
        );
      })}
    </g>
  );
}
