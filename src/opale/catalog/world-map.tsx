/* La carte du monde : plan vectoriel, niveaux de détail et repères. */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import clsx from 'clsx';

import type { SvgMapWheel } from '../components/svg-map';
import { ARROW_DIRECTIONS, isArrowKey, nearestInDirection } from '../components/svg-map/neighbour';
import { useSvgMapGestures } from '../components/svg-map/useSvgMapGestures';
import {
  GLYPH_ARROW_DOWN,
  GLYPH_ARROW_LEFT,
  GLYPH_ARROW_RIGHT,
  GLYPH_ARROW_UP,
  GLYPH_HOME,
  GLYPH_ZOOM_IN,
  GLYPH_ZOOM_OUT,
  type IconPathData,
} from '../components/icon/glyphs';
import { IconPaths } from '../components/icon/IconPaths';
import { WorldDataSession, type LoadedLevel } from '../components/world-map/data-cache';
import {
  placeLabels,
  type CityCandidate,
  type CountryCandidate,
} from '../components/world-map/labels';
import { byMinZoom, flatBounds, selectLod, visibleTiles } from '../components/world-map/lod';
import { flatPaths } from '../components/world-map/path-builder';
import { countryAt, regionNamer } from '../components/world-map/place';
import {
  isWorldMapViewportState,
  useWorldMapViewportState,
  type UseWorldMapViewportResult,
  type WorldMapView,
  type WorldMapViewportState,
} from '../components/world-map/useWorldMapViewport';
import {
  flatTransform,
  frameOf,
  panByPixels,
  projectFlat,
  webZoom,
  WORLD_SIZE,
  type Frame,
  type WorldMapMode,
} from '../components/world-map/view';
import { holdsFocus } from '../shared/focus-return';
import { resolveLabels } from '../shared/labels';
import { useControllableState } from '../shared/use-controllable-state';
import { Button } from './forms';
import { Surface } from './shells';

export { GIBS_BLUE_MARBLE_URL } from '../components/world-map/basemap';
export type { WorldMapMode } from '../components/world-map/view';

/* =============================================================================
   LA CARTE DU MONDE.

   UNE VRAIE CARTE, SANS BIBLIOTHÈQUE. Les données libres de Natural Earth,
   servies par l'application (`dataUrl`), se chargent par niveau de détail :
   le monde entier en 110m, 50m en approchant, puis des tuiles 10m de 10° de
   côté. Le niveau se choisit AU REPOS : pendant un geste, seule la
   transformation du `<g>` qui porte le dessin change, et le niveau suivant
   se charge 150 ms après le dernier mouvement.

   LE CLAVIER A DEUX ARRÊTS. La surface de la carte (flèches : déplacer,
   plus et moins : zoomer, zéro ou Origine : vue d'ensemble), puis la liste
   des repères — un seul arrêt aussi, les flèches menant au repère voisin
   dans leur direction. Un repère hors de la vue y est ramené quand il prend
   le focus. Les actions au clavier sont annoncées, une fois la vue posée :
   « Zoom 3, centré sur France ».

   LE RENDU SERVEUR EST JUSTE. Rien n'est lu de `window` au rendu : les
   repères se placent en pourcentages du cadre dès le HTML, et les données,
   la largeur affichée et la préférence de mouvement arrivent en effets.

   Le globe et l'imagerie satellite sont déclarés dans l'interface
   (`mode`, `basemap`) mais pas encore dessinés : la carte se rend en plan
   vectoriel, et n'affiche pas de bascule tant qu'il n'y a rien à basculer.
   ========================================================================== */

/** Le fond de carte : le dessin vectoriel, ou l'imagerie satellite. */
export type WorldMapBasemap = 'vector' | 'satellite';

export interface WorldMapPin {
  /** Identifiant du repère, renvoyé par `onPinSelect`. */
  readonly id: string;
  /** Longitude, en degrés, de −180 à 180. */
  readonly longitude: number;
  /** Latitude, en degrés, de −90 à 90. */
  readonly latitude: number;
  /** Nom du repère : son nom accessible, et l'étiquette affichée au survol et au focus. */
  readonly label: string;
  /** Teinte de la pastille. Défaut : `'primary'`. */
  readonly tone?: 'primary' | 'accent' | 'neutral';
}

/** Les textes d'une carte du monde. */
export interface WorldMapLabels {
  /** Le nom de la carte, quand `label` n'est pas passé. Défaut : « Carte du monde ». */
  map: string;
  /** Le nom de la liste des repères. Défaut : « Repères ». */
  pins: string;
  /** Le nom du groupe des commandes. Défaut : « Zoom ». */
  zoom: string;
  /** Défaut : « Zoomer ». */
  zoomIn: string;
  /** Défaut : « Dézoomer ». */
  zoomOut: string;
  /** Défaut : « Vue d’ensemble ». */
  reset: string;
  /** Le nom du groupe des flèches. Défaut : « Déplacement ». */
  pan: string;
  /** Défaut : « Déplacer vers le haut ». */
  panUp: string;
  /** Défaut : « Déplacer vers le bas ». */
  panDown: string;
  /** Défaut : « Déplacer vers la gauche ». */
  panLeft: string;
  /** Défaut : « Déplacer vers la droite ». */
  panRight: string;
  /** La bascule du globe. Défaut : « Globe ». */
  globe: string;
  /** La bascule de l'imagerie. Défaut : « Satellite ». */
  satellite: string;
  /** La consigne affichée à la molette sans modificateur. */
  wheelHint: string;
  /** La consigne clavier, annoncée après la description. */
  instructions: string;
  /** Affiché tant que le premier niveau de détail n'est pas arrivé. */
  loading: string;
  /** Affiché quand un niveau de détail n'a pas pu être chargé. */
  dataError: string;
  /** Affiché quand l'imagerie a échoué et que la carte revient au dessin. */
  basemapError: string;
  /** La consigne du globe à son zoom maximal. */
  globeZoomLimit: string;
  /** Le lieu annoncé quand le centre de la vue n'est sur aucun pays. Défaut : « l’océan ». */
  ocean: string;
  /** L'annonce d'une vue, après une action au clavier. */
  announceView: (info: {
    readonly zoom: number;
    readonly place?: string;
    readonly longitude: number;
    readonly latitude: number;
  }) => string;
}

const frenchNumber = (value: number) =>
  new Intl.NumberFormat('fr', { maximumFractionDigits: 1 }).format(value);

const DEFAULT_WORLD_MAP_LABELS: WorldMapLabels = {
  map: 'Carte du monde',
  pins: 'Repères',
  zoom: 'Zoom',
  zoomIn: 'Zoomer',
  zoomOut: 'Dézoomer',
  reset: 'Vue d’ensemble',
  pan: 'Déplacement',
  panUp: 'Déplacer vers le haut',
  panDown: 'Déplacer vers le bas',
  panLeft: 'Déplacer vers la gauche',
  panRight: 'Déplacer vers la droite',
  globe: 'Globe',
  satellite: 'Satellite',
  wheelHint: 'Ctrl ou ⌘ + molette pour zoomer',
  instructions:
    'Flèches pour déplacer la vue, plus et moins pour zoomer, zéro ou Origine pour revenir à la vue d’ensemble. Les repères suivent la carte : les flèches y mènent au repère voisin.',
  loading: 'Chargement de la carte…',
  dataError: 'Détails indisponibles',
  basemapError: 'Imagerie indisponible : retour au dessin',
  globeZoomLimit: 'Passer en plan pour plus de détail',
  ocean: 'l’océan',
  announceView: ({ zoom, place, longitude, latitude }) =>
    `Zoom ${frenchNumber(zoom)}, centré sur ${
      place ??
      `${frenchNumber(Math.abs(latitude))}° ${latitude < 0 ? 'S' : 'N'}, ${frenchNumber(
        Math.abs(longitude),
      )}° ${longitude < 0 ? 'O' : 'E'}`
    }`,
};

export interface WorldMapProps extends Omit<ComponentPropsWithRef<'div'>, 'onSelect' | 'children'> {
  /**
   * L'adresse du dossier des données (`index.json`, `110m.json`, `50m.json`,
   * `10m/`), produit par `scripts/world-data.mjs` et servi par l'application :
   * rien n'est livré dans le paquet. Résolue contre l'adresse de la page.
   */
  readonly dataUrl: string;
  /** Vue partagée avec l'appelant, créée par `useWorldMapViewport` ; `defaultView` est alors ignorée. */
  readonly viewport?: UseWorldMapViewportResult;
  /** La vue de départ, et celle où ramène « Vue d’ensemble » (vue interne seulement). */
  readonly defaultView?: WorldMapView;
  /** Le mode de rendu, contrôlé : plan ou globe. Le globe n'est pas encore dessiné. */
  readonly mode?: WorldMapMode;
  /** Le mode de départ, non contrôlé. Défaut : `'flat'`. */
  readonly defaultMode?: WorldMapMode;
  /** Appelée quand l'utilisateur demande un autre mode. */
  readonly onModeChange?: (mode: WorldMapMode) => void;
  /** Le fond de carte, contrôlé : dessin ou imagerie. L'imagerie n'est pas encore dessinée. */
  readonly basemap?: WorldMapBasemap;
  /** Le fond de départ, non contrôlé. Défaut : `'vector'`. */
  readonly defaultBasemap?: WorldMapBasemap;
  /** Appelée quand l'utilisateur demande un autre fond. */
  readonly onBasemapChange?: (basemap: WorldMapBasemap) => void;
  /** Le gabarit des tuiles d'imagerie (`{z}`, `{x}`, `{y}`). Défaut : `GIBS_BLUE_MARBLE_URL`. */
  readonly tileUrl?: string;
  /** Le niveau le plus fin des tuiles d'imagerie ; au-delà, elles sont agrandies. Défaut : 8. */
  readonly tileMaxZoom?: number;
  /** Le crédit de l'imagerie, obligatoire quand `tileUrl` désigne une autre source. */
  readonly tileAttribution?: ReactNode;
  /** Les repères posés sur la carte, dans l'ordre de lecture (Début et Fin le suivent). */
  readonly pins?: readonly WorldMapPin[];
  /** Appelée avec l'`id` du repère choisi, au clic, sur Entrée ou Espace. */
  readonly onPinSelect?: (id: string) => void;
  /**
   * Les repères retenus, si l'appelant en tient la liste : soulignés et
   * annoncés `aria-pressed`. Sans cette prop, aucun état pressé n'est annoncé.
   */
  readonly selectedPins?: readonly string[];
  /** Couleur de remplissage d'un pays, par son code ISO 3166-1 alpha-2 ; appelée à chaque rendu. */
  readonly fill?: (countryId: string) => string | undefined;
  /** Nom de la carte, annoncé par les lecteurs d'écran ; gagne sur `labels.map`. */
  readonly label?: string;
  /** Description de la carte, annoncée après son nom : ce qu'elle montre, où lire ses données en texte. */
  readonly description?: ReactNode;
  /** La langue des noms de pays et de villes (`Intl.DisplayNames`). Défaut : `'fr'`. */
  readonly locale?: string;
  /** Le rapport largeur / hauteur du cadre, au format CSS `aspect-ratio`. Défaut : `'16 / 9'`. */
  readonly aspectRatio?: string;
  /** Boutons de zoom et de déplacement intégrés. Défaut : `true`. */
  readonly controls?: boolean;
  /** Bascules plan / globe et dessin / satellite, affichées quand ces rendus existent. Défaut : `true`. */
  readonly layerControls?: boolean;
  /** Zoom à la molette : avec Ctrl ou ⌘ par défaut, toujours, ou jamais. */
  readonly wheel?: SvgMapWheel;
  /** Remplace les textes français par défaut, clé par clé. */
  readonly labels?: Partial<WorldMapLabels>;
  /** Rend la plaque et les commandes dans le matériau « verre liquide ». Défaut : `false`. */
  readonly liquidGlass?: boolean;
  /** Appelée quand un niveau de détail n'a pas pu être chargé ; le niveau affiché reste. */
  readonly onDataError?: (error: Error) => void;
  /** Appelée quand l'imagerie échoue et que la carte revient au dessin. */
  readonly onBasemapError?: (error: Error) => void;
  /** Une classe ajoutée à côté de `.opale-world-map`, sur la racine. */
  readonly className?: string;
}

/** Le zoom d'une pression sur plus, moins ou les boutons : un niveau, deux fois plus près. */
const ZOOM_STEP = 2;
/** Le pas d'un déplacement, clavier ou flèche : un cinquième du cadre. */
const PAN_STEP = 0.2;
/** Le délai après la dernière action au clavier avant d'annoncer la vue. */
const ANNOUNCE_MS = 500;
/** La largeur affichée supposée tant qu'elle n'est pas mesurée — et sur le serveur. */
const DEFAULT_FRAME_PX = 1000;
/** Tailles des étiquettes, en pixels affichés. */
const COUNTRY_FONT_PX = 12;
const CITY_FONT_PX = 11;

/** Le rapport d'un `aspect-ratio` CSS : `'16 / 9'`, `'2'`. Un rapport illisible retombe sur 16 / 9. */
function parseRatio(value: string): number {
  const [width = '', height = '1'] = value.split('/');
  const ratio = Number(width) / Number(height);
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 16 / 9;
}

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

export function WorldMap({
  dataUrl,
  viewport: sharedViewport,
  defaultView,
  mode: modeProp,
  defaultMode = 'flat',
  onModeChange,
  basemap: basemapProp,
  defaultBasemap = 'vector',
  onBasemapChange,
  /* Les réglages de l'imagerie et des bascules sont reçus, et non transmis
     au `<div>` : ils seront lus par le globe et le fond satellite. */
  /* eslint-disable @typescript-eslint/no-unused-vars -- lus par le globe et le fond satellite, à venir */
  tileUrl,
  tileMaxZoom,
  tileAttribution,
  onBasemapError,
  layerControls = true,
  /* eslint-enable @typescript-eslint/no-unused-vars */
  pins = [],
  onPinSelect,
  selectedPins,
  fill,
  label,
  description,
  locale = 'fr',
  aspectRatio = '16 / 9',
  controls = true,
  wheel = 'modifier',
  labels: labelsProp,
  liquidGlass = false,
  onDataError,
  className,
  style: styleProp,
  onKeyDown,
  ...rest
}: WorldMapProps) {
  const labels = resolveLabels(DEFAULT_WORLD_MAP_LABELS, labelsProp);
  const [mode] = useControllableState(modeProp, defaultMode, onModeChange);
  const [basemap] = useControllableState(basemapProp, defaultBasemap, onBasemapChange);

  /* LE CROCHET EST TOUJOURS APPELÉ, et la vue de l'appelant l'emporte : l'ordre
     des crochets ne peut pas dépendre d'une prop. */
  const ownViewport = useWorldMapViewportState({ initialView: defaultView });
  const viewport: WorldMapViewportState =
    sharedViewport && isWorldMapViewportState(sharedViewport) ? sharedViewport : ownViewport;
  const { view, moving, registerFrame } = viewport;

  const ratio = parseRatio(aspectRatio);
  const frame = useMemo(() => frameOf(ratio), [ratio]);
  useLayoutEffect(() => registerFrame('flat', frame), [registerFrame, frame]);

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const descriptionId = useId();
  const { onPointerDown, onClickCapture, dragging, hint } = useSvgMapGestures(
    svgRef,
    viewport.gestureTarget,
    { tapTolerance: 6, wheel },
  );

  /* LA LARGEUR AFFICHÉE RÈGLE LE DÉTAIL : une carte large montre plus au même
     zoom. Mesurée en effet ; le serveur suppose 1000 px. */
  const [framePx, setFramePx] = useState(DEFAULT_FRAME_PX);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      if (width > 0) setFramePx(width);
    });
    observer.observe(svg);
    return () => observer.disconnect();
  }, []);
  /** Une unité du cadre, en pixels affichés : les tailles s'écrivent en pixels. */
  const unit = frame.width / framePx;

  /* LA VUE AU REPOS choisit le niveau, les traits et les étiquettes : pendant
     un geste, elle ne bouge pas, et rien n'est recalculé. */
  const [settled, setSettled] = useState(view);
  if (!moving && settled !== view) setSettled(view);
  const restZoom = webZoom(settled.zoom, framePx);

  /* ------------------------------------------------------------------------
     Les données.
     --------------------------------------------------------------------- */
  const [level, setLevel] = useState<LoadedLevel | null>(null);
  const [failed, setFailed] = useState(false);
  const sessionRef = useRef<WorldDataSession | null>(null);
  const shownRef = useRef('');
  const errorRef = useRef(onDataError);
  useLayoutEffect(() => {
    errorRef.current = onDataError;
  });

  const tiles = visibleTiles(flatBounds(settled, frame));
  const lod = selectLod({
    mode: 'flat',
    webZoom: restZoom,
    previous: level?.lod,
    tileCount: tiles?.length ?? null,
  });
  const tileList = lod === '10m' ? (tiles ?? []).join(',') : '';

  useEffect(() => {
    const session = new WorldDataSession(dataUrl, {
      onLoad: (loaded) => {
        setLevel(loaded);
        setFailed(false);
      },
      onError: (error) => {
        setFailed(true);
        errorRef.current?.(error);
      },
    });
    sessionRef.current = session;
    shownRef.current = '';
    return () => {
      session.dispose();
      sessionRef.current = null;
    };
  }, [dataUrl]);

  useEffect(() => {
    const key = `${lod}:${tileList}`;
    if (moving || shownRef.current === key) return;
    shownRef.current = key;
    sessionRef.current?.show(lod, tileList ? tileList.split(',') : []);
  }, [dataUrl, moving, lod, tileList]);

  /* ------------------------------------------------------------------------
     Le dessin : tracés écrits une fois par fichier, en unités du monde.
     --------------------------------------------------------------------- */
  const layers = useMemo(() => (level ? level.files.map(flatPaths) : []), [level]);
  const drawing = useMemo(
    () => (
      <>
        {layers.map((paths, index) =>
          paths.countries.map(({ id, d }) => {
            const color = fill?.(id);
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
        {layers.map((paths, index) => (
          <g key={index} className="opale-world-map__lines">
            {paths.lakes && (
              <path d={paths.lakes} className="opale-world-map__lake" fillRule="evenodd" />
            )}
            <path
              d={paths.admin1(restZoom)}
              className="opale-world-map__admin1"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={paths.rivers(restZoom)}
              className="opale-world-map__river"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={paths.borders}
              className="opale-world-map__border"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={paths.coast}
              className="opale-world-map__coast"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </>
    ),
    [layers, fill, restZoom],
  );

  /* ------------------------------------------------------------------------
     Les étiquettes : choisies au repos, placées sur la vue peinte.
     --------------------------------------------------------------------- */
  const nameOf = useMemo(() => regionNamer(locale), [locale]);
  const placed = useMemo<readonly Placed[]>(() => {
    if (!level) return [];
    const geo = new Map<string, readonly [number, number]>();
    const countries: CountryCandidate[] = [];
    const cities: CityCandidate[] = [];
    const inFrame = (x: number, y: number) =>
      x >= 0 && y >= 0 && x <= frame.width && y <= frame.height;
    for (const file of level.files) {
      for (const candidate of file.countryLabels ?? []) {
        if (geo.has(candidate.id) || candidate.min > restZoom + 0.5 || candidate.max < restZoom) {
          continue;
        }
        const text = nameOf(candidate.id);
        const [x, y] = projectFlat(candidate.lon, candidate.lat, settled, frame);
        if (!text || !inFrame(x, y)) continue;
        geo.set(candidate.id, [candidate.lon, candidate.lat]);
        countries.push({ id: candidate.id, text, x, y, minLabel: candidate.min });
      }
      for (const place of byMinZoom(file.places ?? [], restZoom)) {
        const id = `${place.n}@${place.lon},${place.lat}`;
        const [x, y] = projectFlat(place.lon, place.lat, settled, frame);
        if (geo.has(id) || !inFrame(x, y)) continue;
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
    return placeLabels(countries, cities, {
      width: frame.width,
      height: frame.height,
      countryFontSize: COUNTRY_FONT_PX * unit,
      cityFontSize: CITY_FONT_PX * unit,
    }).map(({ id, text, kind }) => {
      const [longitude, latitude] = geo.get(id) ?? [0, 0];
      return { id, text, kind, longitude, latitude };
    });
  }, [level, settled, frame, restZoom, nameOf, locale, unit]);

  /* ------------------------------------------------------------------------
     Les repères.
     --------------------------------------------------------------------- */
  const pinRefs = useRef(new Map<string, HTMLButtonElement>());
  const [activePin, setActivePin] = useState<string | undefined>(undefined);
  /* Un clic donne aussi le focus au repère : le ramener dans la vue ferait
     glisser la carte sous le pointeur entre l'appui et le relâchement. */
  const pointerFocus = useRef(false);
  const selectedSet = useMemo(() => new Set(selectedPins ?? []), [selectedPins]);
  const pinPoints = pins.map((pin) => {
    const [x, y] = projectFlat(pin.longitude, pin.latitude, view, frame);
    return { pin, x, y };
  });
  const centers = new Map(pinPoints.map(({ pin, x, y }) => [pin.id, { x, y }]));
  const has = (id: string | undefined): id is string =>
    id !== undefined && pins.some((pin) => pin.id === id);
  const rovingId = has(activePin)
    ? activePin
    : (selectedPins?.find((id) => has(id)) ?? pins[0]?.id);
  /** Une marge d'une demi-pastille : un repère rogné par le bord est hors champ. */
  const margin = 12 * unit;
  const offView = (x: number, y: number) =>
    x < margin || y < margin || x > frame.width - margin || y > frame.height - margin;

  const focusPin = (id: string) => {
    setActivePin(id);
    pinRefs.current.get(id)?.focus();
  };

  const handlePinKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
    const id = pins[index].id;
    const target = isArrowKey(event.key)
      ? nearestInDirection(centers, id, event.key)
      : event.key === 'Home'
        ? pins[0].id
        : event.key === 'End'
          ? pins[pins.length - 1].id
          : undefined;
    if (target === undefined) return;
    event.preventDefault();
    if (target) focusPin(target);
  };

  /* ------------------------------------------------------------------------
     L'annonce, après une action au clavier seulement.
     --------------------------------------------------------------------- */
  const [announcement, setAnnouncement] = useState('');
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ viewport, level, labels, nameOf });
  useLayoutEffect(() => {
    latest.current = { viewport, level, labels, nameOf };
  });
  useEffect(
    () => () => {
      if (announceTimer.current !== null) clearTimeout(announceTimer.current);
    },
    [],
  );

  const announce = useCallback(() => {
    if (announceTimer.current !== null) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => {
      announceTimer.current = null;
      const { viewport: current, level: loaded, labels: texts, nameOf: name } = latest.current;
      /* LA VUE VISÉE, PAS LA VUE PEINTE : une page en arrière-plan suspend
         ses images, et l'animation peut ne pas être arrivée. */
      const { longitude, latitude, zoom } = current.target;
      const country = loaded ? countryAt(loaded.files, longitude, latitude) : undefined;
      const place = country ? (name(country) ?? country) : loaded ? texts.ocean : undefined;
      setAnnouncement(
        texts.announceView({ zoom: Math.round(zoom * 10) / 10, place, longitude, latitude }),
      );
    }, ANNOUNCE_MS);
  }, []);

  /* ------------------------------------------------------------------------
     Le clavier de la carte.
     --------------------------------------------------------------------- */
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);
  /* Échap ferme l'infobulle jusqu'au survol d'un autre pays (WCAG 1.4.13). */
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const tooltipName = hovered && !tooltipDismissed && !dragging ? nameOf(hovered.id) : undefined;

  /* Les raccourcis ne partent que de la carte, de ses repères et de ses
     commandes : un champ posé à côté garde « 0 » et « - ». */
  const isMapTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    (target === svgRef.current ||
      target.closest('.opale-world-map__pins') !== null ||
      target.closest('.opale-world-map-controls') !== null);

  const handleMapKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && tooltipName) {
      event.preventDefault();
      event.stopPropagation();
      setTooltipDismissed(true);
      return;
    }
    if (
      event.defaultPrevented ||
      !isMapTarget(event.target) ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }
    const onSurface = event.target === svgRef.current;
    const pan = isArrowKey(event.key) ? ARROW_DIRECTIONS[event.key] : undefined;
    let acted = true;
    if (pan && (onSurface || event.shiftKey)) {
      viewport.gestureTarget.panBy(
        pan[0] * frame.width * PAN_STEP,
        pan[1] * frame.height * PAN_STEP,
      );
    } else if (event.key === '+' || event.key === '=') {
      viewport.zoomBy(ZOOM_STEP, { animate: true });
    } else if (event.key === '-' || event.key === '_') {
      viewport.zoomBy(1 / ZOOM_STEP, { animate: true });
    } else if (event.key === '0' || (event.key === 'Home' && onSurface)) {
      viewport.reset();
    } else {
      acted = false;
    }
    if (acted) {
      event.preventDefault();
      announce();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    handleMapKeys(event);
    onKeyDown?.(event);
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const target = event.target instanceof Element ? event.target.closest('[data-country]') : null;
    const id = target?.getAttribute('data-country');
    if (!id) {
      if (hovered) setHovered(null);
      return;
    }
    const box = canvasRef.current?.getBoundingClientRect();
    const x = box && box.width > 0 ? ((event.clientX - box.left) / box.width) * 100 : 50;
    const y = box && box.height > 0 ? ((event.clientY - box.top) / box.height) * 100 : 50;
    if (id !== hovered?.id) setTooltipDismissed(false);
    setHovered({ id, x, y });
  };

  /* ------------------------------------------------------------------------
     Le rendu.
     --------------------------------------------------------------------- */
  const { scale, x: tx, y: ty } = flatTransform(view, frame);
  const status = failed ? labels.dataError : level ? undefined : labels.loading;
  const style = {
    ...styleProp,
    '--opale-world-map-ratio': aspectRatio,
  } as CSSProperties;

  const canvas = (
    <div
      ref={canvasRef}
      className="opale-world-map__canvas"
      data-zoomed={viewport.zoomed ? 'true' : undefined}
      data-dragging={dragging ? 'true' : undefined}
    >
      {/* LA SURFACE EST UNE IMAGE QUI PREND LE FOCUS, pas une `application` :
          ses raccourcis sont décrits par `aria-describedby`, et le lecteur
          d'écran garde ses propres commandes. */}
      <svg
        ref={svgRef}
        className="opale-world-map__svg"
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        role="img"
        aria-label={label ?? labels.map}
        aria-describedby={descriptionId}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHovered(null)}
      >
        <g className="opale-world-map__world" transform={`translate(${tx} ${ty}) scale(${scale})`}>
          <rect className="opale-world-map__ocean" width={WORLD_SIZE} height={WORLD_SIZE} />
          {drawing}
        </g>
        <g className="opale-world-map__labels" aria-hidden="true">
          {placed.map(({ id, text, kind, longitude, latitude }) => {
            const [x, y] = projectFlat(longitude, latitude, view, frame);
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
      </svg>

      {pins.length > 0 && (
        <ul className="opale-world-map__pins" aria-label={labels.pins}>
          {pinPoints.map(({ pin, x, y }, index) => (
            <li
              key={pin.id}
              className="opale-world-map__pin"
              data-tone={pin.tone ?? 'primary'}
              style={{ left: `${(x / frame.width) * 100}%`, top: `${(y / frame.height) * 100}%` }}
            >
              <button
                ref={(node) => {
                  if (node) pinRefs.current.set(pin.id, node);
                  else pinRefs.current.delete(pin.id);
                }}
                type="button"
                className="opale-world-map__pin-button"
                tabIndex={pin.id === rovingId ? 0 : -1}
                aria-label={pin.label}
                aria-pressed={selectedPins ? selectedSet.has(pin.id) : undefined}
                onClick={() => onPinSelect?.(pin.id)}
                onKeyDown={(event) => handlePinKeyDown(event, index)}
                onPointerDown={() => {
                  pointerFocus.current = true;
                  setTimeout(() => {
                    pointerFocus.current = false;
                  }, 0);
                }}
                onFocus={() => {
                  setActivePin(pin.id);
                  if (!pointerFocus.current && offView(x, y)) {
                    viewport.flyTo({ longitude: pin.longitude, latitude: pin.latitude });
                  }
                }}
              >
                <span className="opale-world-map__pin-label" aria-hidden="true">
                  {pin.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {tooltipName && hovered && (
        <span
          className="opale-world-map__tooltip"
          aria-hidden="true"
          style={{ left: `${hovered.x}%`, top: `${hovered.y}%` }}
        >
          {tooltipName}
        </span>
      )}

      <span
        className="opale-world-map__hint"
        aria-hidden="true"
        data-visible={hint ? 'true' : undefined}
      >
        {labels.wheelHint}
      </span>

      {status && (
        <p className="opale-world-map__status" role="status">
          {status}
        </p>
      )}

      <span className="opale-visually-hidden" aria-live="polite">
        {announcement}
      </span>
      <span id={descriptionId} className="opale-visually-hidden">
        {description ? <>{description} </> : null}
        {labels.instructions}
      </span>
    </div>
  );

  const frameNode = (
    <div className="opale-world-map__frame">
      {canvas}
      {controls && (
        <WorldMapControls
          viewport={viewport}
          frame={frame}
          labels={labels}
          liquidGlass={liquidGlass}
          onKeyboardAction={announce}
        />
      )}
    </div>
  );

  return (
    /* LES RACCOURCIS SONT DÉLÉGUÉS, PAS PORTÉS : l'enveloppe ne prend pas le
       focus, elle écoute les touches qui remontent de la carte, de ses
       repères et de ses commandes. */
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- délégation des raccourcis, voir ci-dessus
    <div
      {...rest}
      className={clsx('opale-world-map', liquidGlass && 'opale-world-map--glass', className)}
      style={style}
      data-mode={mode}
      data-basemap={basemap}
      onKeyDown={handleKeyDown}
    >
      {liquidGlass ? (
        <Surface liquidGlass className="opale-world-map__plate">
          {frameNode}
        </Surface>
      ) : (
        <div className="opale-world-map__plate">{frameNode}</div>
      )}
    </div>
  );
}

/** Les quatre flèches : direction, glyphe, clé de libellé. */
const PAN_BUTTONS = [
  { key: 'panUp', direction: [0, -1], glyph: GLYPH_ARROW_UP, area: 'up' },
  { key: 'panLeft', direction: [-1, 0], glyph: GLYPH_ARROW_LEFT, area: 'left' },
  { key: 'panRight', direction: [1, 0], glyph: GLYPH_ARROW_RIGHT, area: 'right' },
  { key: 'panDown', direction: [0, 1], glyph: GLYPH_ARROW_DOWN, area: 'down' },
] as const;

interface WorldMapControlsProps {
  readonly viewport: WorldMapViewportState;
  readonly frame: Frame;
  readonly labels: WorldMapLabels;
  readonly liquidGlass: boolean;
  /** Appelée après une action faite au clavier, pour l'annonce. */
  readonly onKeyboardAction: () => void;
}

/* LES COMMANDES SUIVENT LA VUE VISÉE, pas la vue peinte : les flèches
   paraissent au clic sur « Zoomer », et une commande indisponible reste à sa
   place, `aria-disabled` — un bouton qui disparaît sous le focus jette le
   clavier en haut de la page. */
function WorldMapControls({
  viewport,
  frame,
  labels,
  liquidGlass,
  onKeyboardAction,
}: WorldMapControlsProps) {
  const { target } = viewport;
  const bounds = { mode: 'flat', frame, maxZoom: viewport.maxZoom } as const;
  /** Vrai si un pas dans cette direction déplace encore la vue. */
  const room = (dx: number, dy: number) => {
    const next = panByPixels(
      target,
      dx * frame.width * PAN_STEP,
      dy * frame.height * PAN_STEP,
      bounds,
    );
    return (
      Math.abs(next.longitude - target.longitude) > 1e-6 ||
      Math.abs(next.latitude - target.latitude) > 1e-6
    );
  };
  /* Un clic au clavier (Entrée, Espace) a un `detail` nul : celui-là s'annonce. */
  const act = (enabled: boolean, run: () => void) => (event: MouseEvent<HTMLButtonElement>) => {
    if (!enabled) return;
    run();
    if (event.detail === 0) onKeyboardAction();
  };

  /* Les flèches disparaissent au retour à la vue d'ensemble : le focus qui y
     était va à « Vue d’ensemble », le bouton qui vient d'agir. */
  const resetRef = useRef<HTMLButtonElement>(null);
  const panGroupRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return undefined;
    return () => {
      if (holdsFocus(node)) resetRef.current?.focus();
    };
  }, []);

  /* LE BOUTON D'ICÔNE D'OPALE, DESSINÉ PAR SES TRACÉS : `IconActionButton`
     prend un NOM d'icône, et emporte le catalogue entier (12 ko) pour cinq
     glyphes. Mêmes classes, même `Button`, mêmes tracés (`glyphs.ts`). */
  const control = (
    key: string,
    glyph: IconPathData,
    name: string,
    enabled: boolean,
    run: () => void,
    extra: { readonly className?: string; readonly ref?: Ref<HTMLButtonElement> } = {},
  ) => (
    <Button
      key={key}
      ref={extra.ref}
      variant="tonal"
      size="small"
      liquidGlass={liquidGlass}
      className={clsx('opale-icon-action-button', extra.className)}
      aria-label={name}
      aria-disabled={enabled ? undefined : true}
      onClick={act(enabled, run)}
    >
      <IconPaths paths={glyph} className="opale-icon__glyph" />
    </Button>
  );

  return (
    <div
      role="group"
      aria-label={labels.zoom}
      className="opale-world-map-controls opale-world-map__controls"
    >
      {control('in', GLYPH_ZOOM_IN, labels.zoomIn, viewport.canZoomIn, () =>
        viewport.zoomBy(ZOOM_STEP, { animate: true }),
      )}
      {control('out', GLYPH_ZOOM_OUT, labels.zoomOut, viewport.zoomed, () =>
        viewport.zoomBy(1 / ZOOM_STEP, { animate: true }),
      )}
      {control('reset', GLYPH_HOME, labels.reset, viewport.zoomed, () => viewport.reset(), {
        ref: resetRef,
      })}
      {viewport.zoomed && (
        <div
          ref={panGroupRef}
          role="group"
          aria-label={labels.pan}
          className="opale-world-map-controls__pan"
        >
          {PAN_BUTTONS.map(({ key, direction: [dx, dy], glyph, area }) =>
            control(
              key,
              glyph,
              labels[key],
              room(dx, dy),
              () =>
                viewport.gestureTarget.panBy(
                  dx * frame.width * PAN_STEP,
                  dy * frame.height * PAN_STEP,
                ),
              { className: `opale-world-map-controls__pan-${area}` },
            ),
          )}
        </div>
      )}
    </div>
  );
}
