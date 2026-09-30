/* La carte SVG interactive et ses commandes de zoom. */

import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import clsx from 'clsx';

import {
  useSvgMapViewport,
  type SvgMapWheel,
  type UseSvgMapViewportResult,
} from '../components/svg-map';
import { type Bounds } from '../components/svg-map/path-bounds';
import { useRegionBounds } from '../components/svg-map/useRegionBounds';
import { useSvgMapGestures } from '../components/svg-map/useSvgMapGestures';
import { parseViewBox as parseSvgViewBox, zoomOf } from '../components/svg-map/viewport';
import { holdsFocus } from '../shared/focus-return';
import { resolveLabels } from '../shared/labels';
import { Surface } from './shells';
import { IconActionButton } from './forms';

/* =============================================================================
   LA CARTE SVG, REFONDUE EN 3.5.0.

   CE QU'ELLE ÉTAIT. Un `<svg>` de 400 × 180 avec une courbe décorative, qui
   attendait des enfants : un cadre, pas une carte. Ni zoom, ni déplacement,
   ni sélection — tout ce qu'on attend d'une carte revenait à l'appelant.

   CE QU'ELLE EST. L'appelant fournit le DESSIN — un viewBox et des régions,
   chacune un tracé et un nom — et, s'il le veut, une couleur par région. Le
   composant s'occupe de la VUE (zoom, déplacement, cadrage), des GESTES
   (pincement, glissement, molette), de la SÉLECTION (clic, clavier) et de
   l'accessibilité. Il ne connaît aucune règle métier : une carte de chaleur,
   un quiz ou un sélecteur de zone de livraison s'écrivent avec les mêmes
   props.

   LES CHOIX QUI LA DISTINGUENT DE CE QUI L'A INSPIRÉE, et chacun corrige un
   défaut constaté ailleurs :

   - La molette NE CONFISQUE PAS le défilement de la page : sans Ctrl ou ⌘,
     elle laisse défiler et affiche la consigne. Le pincement d'un pavé tactile
     arrive avec Ctrl, il zoome donc sans rien apprendre.
   - UN SEUL ARRÊT DE TABULATION, et les flèches pour parcourir : cent
     départements en tabulation, ce sont cent pressions pour sortir de la carte.
     La région atteinte au clavier est ramenée dans la vue si elle en sort.
   - Survol, focus et sélection sont peints par un CALQUE AU-DESSUS des régions :
     le contour d'une région n'est jamais masqué par ses voisines, qui sont
     dessinées après elle.
   - Le trait ne s'épaissit pas en zoomant (`vector-effect`), et le contour par
     défaut tient 3:1 dans les deux thèmes — il porte le découpage.
   - Les commandes indisponibles restent à leur place, `aria-disabled` : un
     bouton qui disparaît sous le focus jette le clavier en haut de la page.
   ========================================================================== */

export interface SvgMapRegion {
  /** Identifiant de la région, renvoyé par `onSelect`. */
  readonly id: string;
  /** Le tracé, tel quel : l'attribut `d` d'un `<path>`. */
  readonly path: string;
  /** Nom lisible : affiché au survol, et nom accessible à défaut d'`ariaLabel`. */
  readonly name?: string;
  /**
   * Nom accessible, jamais affiché. Il se résout dans l'ordre `ariaLabel`,
   * `name`, puis l'identifiant. Un jeu de désignation qui retire `name` — pour
   * que l'infobulle ne vende pas la réponse — doit poser `ariaLabel`, sans quoi
   * un lecteur d'écran annoncerait l'identifiant, c'est-à-dire la réponse.
   */
  readonly ariaLabel?: string;
}

/** Les textes des boutons de zoom. */
export interface SvgMapControlsLabels {
  /** Le nom du groupe, quand `aria-label` n'est pas passé. Défaut : « Zoom ». */
  group: string;
  /** Défaut : « Zoomer ». */
  zoomIn: string;
  /** Défaut : « Dézoomer ». */
  zoomOut: string;
  /** Défaut : « Vue d’ensemble ». */
  reset: string;
  /*
   * LES CLÉS DU DÉPLACEMENT SONT OPTIONNELLES, et c'est ce qui garde l'ajout
   * compatible : un appelant qui construisait un `SvgMapControlsLabels`
   * complet compile encore. Omises, elles gardent leur défaut français.
   */
  /** Le nom du groupe des flèches. Défaut : « Déplacement ». */
  pan?: string;
  /** Défaut : « Déplacer vers le haut ». */
  panUp?: string;
  /** Défaut : « Déplacer vers le bas ». */
  panDown?: string;
  /** Défaut : « Déplacer vers la gauche ». */
  panLeft?: string;
  /** Défaut : « Déplacer vers la droite ». */
  panRight?: string;
}

/** Les textes d'une carte ; les clés des commandes vont aux boutons de zoom intégrés. */
export interface SvgMapLabels extends SvgMapControlsLabels {
  /** Le nom de la carte, quand `label` n'est pas passé. Défaut : « Carte ». */
  map: string;
  /** La consigne affichée à la molette sans modificateur. */
  wheelHint: string;
  /** La consigne clavier d'une carte illustrative, annoncée après la description. */
  instructions: string;
  /** La consigne clavier d'une carte sélectionnable. */
  instructionsSelectable: string;
}

const DEFAULT_SVG_MAP_CONTROLS_LABELS: Required<SvgMapControlsLabels> = {
  group: 'Zoom',
  zoomIn: 'Zoomer',
  zoomOut: 'Dézoomer',
  reset: 'Vue d’ensemble',
  pan: 'Déplacement',
  panUp: 'Déplacer vers le haut',
  panDown: 'Déplacer vers le bas',
  panLeft: 'Déplacer vers la gauche',
  panRight: 'Déplacer vers la droite',
};

const DEFAULT_SVG_MAP_LABELS: SvgMapLabels = {
  ...DEFAULT_SVG_MAP_CONTROLS_LABELS,
  map: 'Carte',
  wheelHint: 'Ctrl ou ⌘ + molette pour zoomer',
  instructions:
    'Flèches pour déplacer la vue, plus et moins pour zoomer, zéro pour revenir à la vue d’ensemble.',
  instructionsSelectable:
    'Flèches pour aller à la région voisine, Entrée pour choisir, Maj et flèches pour déplacer la vue, plus et moins pour zoomer, zéro pour revenir à la vue d’ensemble.',
};

export interface SvgMapProps extends Omit<ComponentPropsWithRef<'div'>, 'onSelect' | 'children'> {
  /** Vue d'ensemble du dessin, au format de l'attribut `viewBox`. */
  readonly viewBox: string;
  readonly regions: readonly SvgMapRegion[];
  /** Nom de la carte, annoncé par les lecteurs d'écran ; gagne sur `labels.map`. */
  readonly label?: string;
  /**
   * Description de la carte, annoncée après son nom : ce qu'elle montre, ou où
   * trouver les mêmes données en texte. Une carte de chaleur n'est qu'une image
   * pour qui ne la voit pas — elle doit dire où lire ses valeurs.
   */
  readonly description?: ReactNode;
  /** Couleur de remplissage d'une région, appelée à chaque rendu. */
  readonly fill?: (id: string) => string | undefined;
  /**
   * Couleur du contour des régions. Le défaut tient 3:1 contre le remplissage
   * PAR DÉFAUT ; avec des teintes calculées par `fill`, c'est à l'appelant de
   * choisir un contour qui se détache des siennes.
   */
  readonly stroke?: string;
  /**
   * Rend les régions cliquables et atteignables au clavier.
   *
   * SUR UN PETIT ÉCRAN, PRÉVOYEZ UNE LISTE À CÔTÉ. Une région de carte fait la
   * taille que lui donne la géographie : sur un téléphone, beaucoup tombent
   * sous 24 px — quelques pixels pour un petit pays ou un département de la
   * petite couronne —, ce que WCAG 2.5.8 refuse comme cible, sauf si la même
   * action est offerte ailleurs sur la page. Une liste des régions (`<select>`,
   * `Opale.Select`) branchée sur le même `onSelect` et le même `selected` est
   * cet équivalent. Le zoom (pincement, commandes) agrandit les cibles, mais ne
   * dispense pas de l'équivalent.
   */
  readonly selectable?: boolean;
  readonly onSelect?: (id: string) => void;
  /**
   * Les régions retenues, si l'appelant en tient la liste : elles sont
   * soulignées et annoncées `aria-pressed`. Sans cette prop, aucun état pressé
   * n'est annoncé — le composant ne l'invente pas.
   */
  readonly selected?: readonly string[];
  /** Vue partagée avec l'appelant, créée par `useSvgMapViewport`. */
  readonly viewport?: UseSvgMapViewportResult;
  /** Zoom maximal, en facteur de la vue d'ensemble (vue interne seulement). */
  readonly maxZoom?: number;
  /** Largeur maximale ; la carte se centre au-delà. */
  readonly maxWidth?: string;
  /** Hauteur maximale, traduite en largeur au rapport du viewBox. */
  readonly maxHeight?: string;
  /** Boutons de zoom intégrés. */
  readonly controls?: boolean;
  /**
   * Flèches de déplacement dans les commandes intégrées, affichées une fois la
   * carte zoomée (WCAG 2.5.7) : sans elles, atteindre un coin d'une carte
   * zoomée exigeait un glissement. Défaut : `true`. Sans effet quand
   * `controls` est faux — un appelant qui pose ses propres `SvgMapControls`
   * les demande par leur prop `pan`.
   */
  readonly panControls?: boolean;
  /** Déplacement, en pixels, au-delà duquel un contact devient un glissement. */
  readonly tapTolerance?: number;
  /** Zoom à la molette : avec Ctrl ou ⌘ par défaut, toujours, ou jamais. */
  readonly wheel?: SvgMapWheel;
  /**
   * Posé au-dessus de la carte, en haut à gauche : légende, consigne. Sur un
   * écran de moins de 30 rem, il passe sous le dessin, avec les commandes de
   * zoom : posé dessus, il en masquait une bonne part.
   */
  readonly overlay?: ReactNode;
  /** Dessin supplémentaire, dans les coordonnées de la carte : repères, tracés. */
  readonly children?: ReactNode;
  /** Remplace les textes français par défaut, clé par clé. */
  readonly labels?: Partial<SvgMapLabels>;
  readonly liquidGlass?: boolean;
  readonly className?: string;
}

const SVG_MAP_DEFAULT_STEP = 1.6;

/** Le pas d'un déplacement, clavier ou flèche : un cinquième de la vue. */
const SVG_MAP_PAN_STEP = 0.2;

/** La direction de chaque flèche, en unités de la vue. */
const SVG_MAP_ARROWS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1],
};

export function SvgMap({
  viewBox,
  regions,
  label,
  description,
  fill,
  stroke,
  selectable = false,
  onSelect,
  selected,
  viewport: sharedViewport,
  maxZoom = 9,
  maxWidth,
  maxHeight,
  controls = true,
  panControls = true,
  tapTolerance = 6,
  wheel = 'modifier',
  overlay,
  children,
  labels: labelsProp,
  liquidGlass = false,
  className,
  style: styleProp,
  onKeyDown,
  ...rest
}: SvgMapProps) {
  const labels = resolveLabels(DEFAULT_SVG_MAP_LABELS, labelsProp);
  /* LE CROCHET EST TOUJOURS APPELÉ, et la vue de l'appelant l'emporte : l'ordre
     des crochets ne peut pas dépendre d'une prop. */
  const ownViewport = useSvgMapViewport(viewBox, { maxZoom });
  const viewport = sharedViewport ?? ownViewport;
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const regionRefs = useRef(new Map<string, SVGPathElement>());
  const descriptionId = useId();
  const { onPointerDown, onClickCapture, dragging, hint } = useSvgMapGestures(svgRef, viewport, {
    tapTolerance,
    wheel,
  });

  /* LES BOÎTES SUIVENT LE CONTENU DES RÉGIONS, PAS L'IDENTITÉ DU TABLEAU : un
     `regions={items.map(…)}` écrit par l'appelant ne fait plus relire tous les
     tracés à chaque rendu. Un tracé illisible est dessiné quand même, sans
     boîte : le cadrage l'ignore au lieu de faire tomber la page. */
  const bounds = useRegionBounds(regions);
  const { registerRegions } = viewport;
  useLayoutEffect(() => registerRegions(bounds), [bounds, registerRegions]);

  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  /* Échap ferme l'infobulle jusqu'au prochain survol ou au prochain focus
     (WCAG 1.4.13) : elle recouvre les régions voisines. */
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  /* Un clic donne aussi le focus à la région. Le recentrage animé qui suit un
     focus au clavier ferait alors glisser la carte sous le pointeur, entre
     l'appui et le relâchement : le clic tomberait à côté. */
  const pointerFocus = useRef(false);

  const rovingId =
    activeId && bounds.has(activeId)
      ? activeId
      : (selected?.find((id) => bounds.has(id)) ?? regions[0]?.id);
  const selectedSet = useMemo(() => new Set(selected ?? []), [selected]);
  const base = useMemo(() => parseSvgViewBox(viewport.viewBox), [viewport.viewBox]);
  const ratio = base.width / base.height;

  const nameOf = (region: SvgMapRegion) => region.ariaLabel ?? region.name ?? region.id;

  const focusRegion = (id: string) => {
    setActiveId(id);
    regionRefs.current.get(id)?.focus();
  };

  /* LES FLÈCHES SUIVENT LA GÉOGRAPHIE, PAS LA LISTE. L'ordre du tableau ne
     dit rien de la carte — il peut même être mélangé — et « droite » doit
     mener à droite. Chaque flèche vise la région la plus proche dans sa
     direction, l'écart perpendiculaire pesant double ; sans voisine dans cette
     direction, le focus reste où il est. Début et Fin gardent l'ordre de la
     liste, qui est un ordre de lecture. */
  const neighbour = (id: string, key: string): string | null => {
    const from = bounds.get(id);
    if (!from) return null;
    const center = (b: Bounds) => ({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 });
    const origin = center(from);
    const direction = SVG_MAP_ARROWS[key];
    if (!direction) return null;
    const [ax, ay] = direction;
    let best: { id: string; score: number } | null = null;
    for (const [candidate, box] of bounds) {
      if (candidate === id) continue;
      const c = center(box);
      const along = (c.x - origin.x) * ax + (c.y - origin.y) * ay;
      if (along <= 0.5) continue;
      const across = Math.abs((c.x - origin.x) * ay) + Math.abs((c.y - origin.y) * ax);
      const score = along + 2 * across;
      if (!best || score < best.score) best = { id: candidate, score };
    }
    return best?.id ?? null;
  };

  const handleRegionKeyDown = (event: KeyboardEvent<SVGPathElement>, index: number) => {
    const id = regions[index].id;
    const target =
      event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
        ? null
        : event.key.startsWith('Arrow')
          ? neighbour(id, event.key)
          : event.key === 'Home'
            ? regions[0].id
            : event.key === 'End'
              ? regions[regions.length - 1].id
              : undefined;

    if (target !== undefined) {
      event.preventDefault();
      if (target) focusRegion(target);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(regions[index].id);
    }
  };

  /* LES RACCOURCIS DE ZOOM S'ENTENDENT PARTOUT DANS LA CARTE — sur une région
     comme sur ses commandes. Ctrl/⌘ + et − restent au navigateur : ce sont les
     siens, et les confisquer empêcherait d'agrandir la page. */
  /* LES RACCOURCIS NE PARTENT QUE DE LA CARTE ET DE SES COMMANDES. Un champ
     posé dans `overlay` doit pouvoir recevoir « 0 » ou « - » : sans ce filtre,
     taper un code postal remettait la carte en vue d'ensemble. */
  const isMapTarget = (target: EventTarget | null) =>
    target instanceof Element &&
    (target === svgRef.current ||
      target.hasAttribute('data-region-id') ||
      target.closest('.opale-svg-map-controls') !== null);

  /** Le centre de la région qui a le focus : c'est là que zoome le clavier. */
  const focusOrigin = () => {
    const box = focusedId ? bounds.get(focusedId) : undefined;
    return box ? { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 } : undefined;
  };

  const handleMapKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    /* Échap consommé par l'infobulle : la modale englobante reste ouverte. */
    if (event.key === 'Escape' && tooltipName) {
      event.preventDefault();
      event.stopPropagation();
      setTooltipDismissed(true);
      return;
    }
    if (!isMapTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;

    /* SE DÉPLACER AU CLAVIER. Une carte zoomée ne se parcourait qu'en la
       glissant (WCAG 2.1.1, 2.5.7). Maj + flèches déplacent la vue de partout ;
       sur une carte sans régions à choisir, les flèches seules suffisent. */
    const pan = SVG_MAP_ARROWS[event.key];
    if (pan && (event.shiftKey || event.target === svgRef.current)) {
      event.preventDefault();
      /* Le pas se mesure sur la vue d'arrivée, d'où part le déplacement. */
      const view = viewport.target ?? viewport.getView();
      viewport.panBy(
        pan[0] * view.width * SVG_MAP_PAN_STEP,
        pan[1] * view.height * SVG_MAP_PAN_STEP,
      );
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      viewport.zoomBy(SVG_MAP_DEFAULT_STEP, focusOrigin(), { animate: true });
    } else if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      viewport.zoomBy(1 / SVG_MAP_DEFAULT_STEP, focusOrigin(), { animate: true });
    } else if (event.key === '0') {
      event.preventDefault();
      viewport.reset();
    }
  };

  /* Les raccourcis de la carte d'abord, le gestionnaire de l'appelant ensuite. */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    handleMapKeys(event);
    onKeyDown?.(event);
  };

  /* L'INFOBULLE SE PLACE EN POURCENTAGES DU CADRE, et c'est ce qui la garde
     juste pendant un zoom. Au clavier, elle se calcule depuis la vue — donc
     suit la région pendant qu'une transition la ramène à l'écran — sans jamais
     mesurer le DOM pendant le rendu. Au pointeur, elle suit le curseur. */
  const anchorOf = (id: string) => {
    const box = bounds.get(id);
    if (!box) return { x: 50, y: 50 };
    const { view } = viewport;
    return {
      x: (((box.minX + box.maxX) / 2 - view.x) / view.width) * 100,
      y: ((box.minY - view.y) / view.height) * 100,
    };
  };

  const pointerAnchor = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current?.getBoundingClientRect();
    return canvas && canvas.width > 0 && canvas.height > 0
      ? {
          x: ((clientX - canvas.left) / canvas.width) * 100,
          y: ((clientY - canvas.top) / canvas.height) * 100,
        }
      : { x: 50, y: 50 };
  };

  const tooltipRegion = hovered ?? (focusedId ? { id: focusedId, ...anchorOf(focusedId) } : null);
  const tooltipName =
    tooltipRegion && !tooltipDismissed
      ? regions.find((region) => region.id === tooltipRegion.id)?.name
      : undefined;

  const maxInlineSize = [maxWidth, maxHeight && `calc(${maxHeight} * ${ratio})`].filter(Boolean);
  /* Le style de l'appelant d'abord ; le rapport et les bornes, vitaux, ensuite. */
  const style = {
    ...styleProp,
    '--opale-svg-map-ratio': `${base.width} / ${base.height}`,
    ...(stroke ? { '--opale-svg-map-stroke': stroke } : {}),
    ...(maxInlineSize.length > 0
      ? {
          maxInlineSize:
            maxInlineSize.length > 1 ? `min(${maxInlineSize.join(', ')})` : maxInlineSize[0],
        }
      : {}),
  } as CSSProperties;

  const regionById = (id: string) => regions.find((region) => region.id === id);
  const overlayPath = (
    id: string,
    kind: 'hover' | 'selected-halo' | 'selected' | 'focus-halo' | 'focus',
  ) => {
    const region = regionById(id);
    return region ? (
      <path
        key={`${kind}-${id}`}
        d={region.path}
        className={`opale-svg-map__${kind}`}
        vectorEffect="non-scaling-stroke"
      />
    ) : null;
  };

  const canvas = (
    <div
      ref={canvasRef}
      className="opale-svg-map__canvas"
      data-zoomed={viewport.zoomed ? 'true' : undefined}
      data-dragging={dragging ? 'true' : undefined}
    >
      <svg
        ref={svgRef}
        className="opale-svg-map__svg"
        viewBox={viewport.current}
        preserveAspectRatio="xMidYMid meet"
        /* RÔLE IMAGE, OU GROUPE DÈS QU'ON PEUT SÉLECTIONNER. Une image rend son
           sous-arbre décoratif : les régions y disparaîtraient des lecteurs
           d'écran, alors qu'elles sont justement ce qu'on désigne. */
        role={selectable ? 'group' : 'img'}
        aria-label={label ?? labels.map}
        aria-describedby={descriptionId}
        /* Sans régions à choisir, c'est la carte elle-même qui prend le focus :
           c'est par elle que le clavier zoome et se déplace. */
        tabIndex={selectable ? undefined : 0}
        data-selectable={selectable ? 'true' : undefined}
        onPointerDown={(event) => {
          pointerFocus.current = true;
          setTimeout(() => {
            pointerFocus.current = false;
          }, 0);
          onPointerDown(event);
        }}
        onClickCapture={onClickCapture}
      >
        <g className="opale-svg-map__regions">
          {regions.map((region, index) => {
            const isSelected = selectedSet.has(region.id);
            const color = fill?.(region.id);
            return (
              <path
                key={region.id}
                ref={(node) => {
                  if (node) regionRefs.current.set(region.id, node);
                  else regionRefs.current.delete(region.id);
                }}
                d={region.path}
                data-region-id={region.id}
                className="opale-svg-map__region"
                style={color ? { fill: color } : undefined}
                vectorEffect="non-scaling-stroke"
                {...(selectable
                  ? {
                      role: 'button',
                      tabIndex: region.id === rovingId ? 0 : -1,
                      'aria-label': nameOf(region),
                      'aria-pressed': selected ? isSelected : undefined,
                      onClick: () => onSelect?.(region.id),
                      onKeyDown: (event: KeyboardEvent<SVGPathElement>) =>
                        handleRegionKeyDown(event, index),
                      onFocus: () => {
                        setActiveId(region.id);
                        setFocusedId(region.id);
                        setTooltipDismissed(false);
                        if (!pointerFocus.current) viewport.reveal(region.id);
                      },
                      onBlur: () =>
                        setFocusedId((current) => (current === region.id ? null : current)),
                    }
                  : { 'aria-hidden': true })}
                onPointerMove={(event) => {
                  if (hovered?.id !== region.id) setTooltipDismissed(false);
                  setHovered({ id: region.id, ...pointerAnchor(event.clientX, event.clientY) });
                }}
                onPointerLeave={() =>
                  setHovered((current) => (current?.id === region.id ? null : current))
                }
              />
            );
          })}
        </g>

        {/* LE CALQUE DES ÉTATS, AU-DESSUS DE TOUTES LES RÉGIONS. Une région est
            peinte avant ses voisines : son contour, épaissi sur place, serait
            recouvert pour moitié. Redessiné ici, il reste entier. */}
        <g className="opale-svg-map__states" aria-hidden="true">
          {[...selectedSet].map((id) => overlayPath(id, 'selected-halo'))}
          {[...selectedSet].map((id) => overlayPath(id, 'selected'))}
          {hovered && !dragging && overlayPath(hovered.id, 'hover')}
          {focusedId && overlayPath(focusedId, 'focus-halo')}
          {focusedId && overlayPath(focusedId, 'focus')}
        </g>

        {children}
      </svg>

      {tooltipName && tooltipRegion && !dragging && (
        <span
          className="opale-svg-map__tooltip"
          aria-hidden="true"
          style={{ left: `${tooltipRegion.x}%`, top: `${tooltipRegion.y}%` }}
        >
          {tooltipName}
        </span>
      )}

      {/* La consigne est pour la souris : le clavier a ses raccourcis, décrits
          plus bas, et l'annoncer à chaque molette serait du bruit. */}
      <span
        className="opale-svg-map__hint"
        aria-hidden="true"
        data-visible={hint ? 'true' : undefined}
      >
        {labels.wheelHint}
      </span>

      <span id={descriptionId} className="opale-visually-hidden">
        {description ? <>{description} </> : null}
        {selectable ? labels.instructionsSelectable : labels.instructions}
      </span>
    </div>
  );

  /* L'INVITE ET LES COMMANDES SONT SŒURS DU CADRE, PAS SES ENFANTS. Le cadre
     doit coïncider avec le `<svg>` : l'infobulle s'y place en pourcentages de
     sa boîte. Sur un écran large, les deux se posent quand même SUR le dessin —
     le `frame` a la boîte du cadre, son seul enfant en flux. Sur un écran
     étroit, elles passent dessous (voir `opale.css`), et le cadre, lui, ne
     grandit pas. L'ordre de tabulation ne change pas : régions, invite,
     commandes. */
  const frame = (
    <div className="opale-svg-map__frame">
      {canvas}

      {overlay && <div className="opale-svg-map__overlay">{overlay}</div>}

      {controls && (
        <SvgMapControls
          viewport={viewport}
          liquidGlass={liquidGlass}
          labels={labels}
          pan={panControls}
          className="opale-svg-map__controls"
        />
      )}
    </div>
  );

  return (
    /* LES RACCOURCIS SONT DÉLÉGUÉS, PAS PORTÉS : l'enveloppe n'est pas un
       contrôle et ne prend pas le focus. Elle écoute les touches qui remontent
       de ses vrais contrôles — les régions et les boutons de zoom. */
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- délégation des raccourcis, voir ci-dessus
    <div
      {...rest}
      className={clsx('opale-svg-map', liquidGlass && 'opale-svg-map--glass', className)}
      style={style}
      onKeyDown={handleKeyDown}
    >
      {liquidGlass ? (
        <Surface liquidGlass className="opale-svg-map__plate">
          {frame}
        </Surface>
      ) : (
        <div className="opale-svg-map__plate">{frame}</div>
      )}
    </div>
  );
}

export interface SvgMapControlsProps extends Omit<ComponentPropsWithRef<'div'>, 'children'> {
  /** La vue à piloter, celle que renvoie `useSvgMapViewport`. */
  readonly viewport: UseSvgMapViewportResult;
  /**
   * Pas de zoom des boutons. 1,6 est plus franc que la molette : un bouton
   * qu'on clique doit se voir agir.
   */
  readonly step?: number;
  /** Remplace les textes français par défaut, clé par clé. */
  readonly labels?: Partial<SvgMapControlsLabels>;
  /**
   * Ajoute les flèches de déplacement, affichées une fois la vue zoomée.
   * Défaut : `false` ici — une barre posée par l'appelant garde la forme
   * qu'il lui a donnée ; `SvgMap` les demande pour ses commandes intégrées.
   */
  readonly pan?: boolean;
  readonly liquidGlass?: boolean;
  readonly className?: string;
}

/** Les quatre flèches : direction en unités de la vue, glyphe, clé de libellé. */
const SVG_MAP_PAN_BUTTONS = [
  { key: 'panUp', direction: [0, -1], icon: 'arrow-up', area: 'up' },
  { key: 'panLeft', direction: [-1, 0], icon: 'arrow-left', area: 'left' },
  { key: 'panRight', direction: [1, 0], icon: 'arrow-right', area: 'right' },
  { key: 'panDown', direction: [0, 1], icon: 'arrow-down', area: 'down' },
] as const;

/* Une vue « au bord » l'est à un millième d'unité près : les vues animées et
   bornées ne tombent pas exactement sur le bord du dessin. */
const SVG_MAP_EDGE_EPSILON = 1e-3;

export function SvgMapControls({
  viewport,
  step = SVG_MAP_DEFAULT_STEP,
  labels: labelsProp,
  pan = false,
  liquidGlass = false,
  className,
  ...rest
}: SvgMapControlsProps) {
  const labels = resolveLabels<Required<SvgMapControlsLabels>>(
    DEFAULT_SVG_MAP_CONTROLS_LABELS,
    labelsProp,
  );
  const act = (enabled: boolean, run: () => void) => () => {
    if (enabled) run();
  };

  /* LES FLÈCHES SUIVENT LA VUE VISÉE, PAS LA VUE PEINTE. Elles apparaissent
     au clic sur « Zoomer » et disparaissent au retour à la vue d'ensemble,
     pas 280 ms plus tard à la fin de la transition — et une flèche cliquée
     pendant un retour animé n'interrompt pas ce retour à mi-course.

     `target` MANQUE À UNE VUE CONSTRUITE À LA MAIN — il est arrivé en 3.9.3 :
     on retombe alors sur la vue peinte. Et rien n'est lu tant que les
     flèches ne sont pas demandées. */
  const base = useMemo(() => parseSvgViewBox(viewport.viewBox), [viewport.viewBox]);
  const target = pan ? (viewport.target ?? viewport.view) : undefined;
  const room =
    target && zoomOf(target, base) > 1.001
      ? {
          up: target.y > base.y + SVG_MAP_EDGE_EPSILON,
          down: target.y + target.height < base.y + base.height - SVG_MAP_EDGE_EPSILON,
          left: target.x > base.x + SVG_MAP_EDGE_EPSILON,
          right: target.x + target.width < base.x + base.width - SVG_MAP_EDGE_EPSILON,
        }
      : null;

  /* LES FLÈCHES DISPARAISSENT PARFOIS SOUS LE FOCUS — « 0 » tapé sur l'une
     d'elles, ou une vue d'ensemble demandée de l'extérieur. Le focus serait
     retombé sur `<body>` (WCAG 2.4.3) ; il va à « Vue d’ensemble », le bouton
     qui vient d'agir et qui reste en place. Le nettoyage d'une `ref` passe
     AVANT le retrait du nœud : le focus y est encore, on peut le voir. La
     `ref` est stable, sans quoi son nettoyage courrait à chaque rendu. */
  const resetRef = useRef<HTMLButtonElement>(null);
  const panGroupRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return undefined;
    return () => {
      if (holdsFocus(node)) resetRef.current?.focus();
    };
  }, []);

  return (
    <div
      aria-label={labels.group}
      {...rest}
      className={clsx('opale-svg-map-controls', className)}
      role="group"
    >
      <IconActionButton
        icon="zoom-in"
        label={labels.zoomIn}
        size="small"
        liquidGlass={liquidGlass}
        aria-disabled={viewport.canZoomIn ? undefined : true}
        onClick={act(viewport.canZoomIn, () => viewport.zoomBy(step, undefined, { animate: true }))}
      />
      <IconActionButton
        icon="zoom-out"
        label={labels.zoomOut}
        size="small"
        liquidGlass={liquidGlass}
        aria-disabled={viewport.zoomed ? undefined : true}
        onClick={act(viewport.zoomed, () =>
          viewport.zoomBy(1 / step, undefined, { animate: true }),
        )}
      />
      <IconActionButton
        ref={resetRef}
        icon="home"
        label={labels.reset}
        size="small"
        liquidGlass={liquidGlass}
        aria-disabled={viewport.zoomed ? undefined : true}
        onClick={act(viewport.zoomed, () => viewport.reset())}
      />
      {target && room && (
        <div
          ref={panGroupRef}
          role="group"
          aria-label={labels.pan}
          className="opale-svg-map-controls__pan"
        >
          {SVG_MAP_PAN_BUTTONS.map(({ key, direction: [dx, dy], icon, area }) => (
            <IconActionButton
              key={key}
              icon={icon}
              label={labels[key]}
              size="small"
              liquidGlass={liquidGlass}
              className={`opale-svg-map-controls__pan-${area}`}
              /* AU BORD DU DESSIN, LA FLÈCHE RESTE EN PLACE, `aria-disabled`,
                 comme les boutons de zoom : un bouton qui disparaît sous le
                 focus jette le clavier en haut de la page. */
              aria-disabled={room[area] ? undefined : true}
              onClick={act(room[area], () => {
                /* Le pas se mesure sur la vue d'arrivée, d'où part le
                   déplacement : celle que les flèches lisent. */
                viewport.panBy(
                  dx * target.width * SVG_MAP_PAN_STEP,
                  dy * target.height * SVG_MAP_PAN_STEP,
                );
              })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
