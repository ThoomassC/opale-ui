/* =============================================================================
   L'IMAGERIE DU GLOBE DE `WorldMap` — chargée à la demande.

   Un `<canvas>` sous le `<svg>`, sur la partie visible du disque. La
   texture se fait UNE FOIS par gabarit : les 16 tuiles du niveau 2, en
   `crossOrigin="anonymous"`, recomposées en équirectangulaire 2048 × 1024
   (`raster.ts`). Chaque image, chaque pixel du disque y lit son texel par
   l'inverse orthographique ; les vecteurs du disque sont précalculés par
   taille de toile.

   LA TOILE EST BORNÉE : min(diamètre × densité de pixels, 720) au repos, la
   moitié pendant un geste. Si deux images dépassent 16 ms, le globe ne se
   repeint plus qu'au repos.

   UNE TEXTURE ILLISIBLE REND LA MAIN À LA CARTE. Plus de la moitié des tuiles
   en échec, pas de contexte 2D, ou une `SecurityError` (un serveur sans CORS
   souille la toile) : `onFailure`, et la carte revient au dessin.
   ========================================================================== */

import { useEffect, useRef, useState } from 'react';

import {
  diskVectors,
  equirectangular,
  sampleGlobe,
  tileUrl,
  type FrameRect,
  type Texture,
} from './raster';
import { globeRadius, type Frame, type WorldMapView } from './view';

export interface GlobeRasterProps {
  /** La vue peinte. */
  readonly view: WorldMapView;
  readonly frame: Frame;
  /** La largeur affichée du cadre, en pixels. */
  readonly framePx: number;
  /** Un geste est en cours : la toile passe à demi-résolution. */
  readonly moving: boolean;
  /** Le gabarit des tuiles (`{z}`, `{x}`, `{y}`). */
  readonly template: string;
  /** Appelée quand la texture est indisponible. */
  readonly onFailure: (error: Error) => void;
}

const TEXTURE_ZOOM = 2;
const TILE_PX = 256;
const MAX_CANVAS_PX = 720;
const FRAME_BUDGET_MS = 16;

const textures = new Map<string, Promise<Texture>>();

/** Charge une tuile ; `null` si elle échoue. */
function loadTile(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

/** La texture équirectangulaire d'un gabarit, faite une fois et partagée. */
function textureOf(template: string): Promise<Texture> {
  let texture = textures.get(template);
  if (!texture) {
    const count = 2 ** TEXTURE_ZOOM;
    const urls: { readonly x: number; readonly y: number; readonly url: string }[] = [];
    for (let y = 0; y < count; y += 1) {
      for (let x = 0; x < count; x += 1) {
        urls.push({ x, y, url: tileUrl(template, { z: TEXTURE_ZOOM, x, y }) });
      }
    }
    texture = Promise.all(urls.map(({ url }) => loadTile(url))).then((images) => {
      if (images.filter((image) => !image).length * 2 > images.length) {
        throw new Error('Imagerie du globe indisponible.');
      }
      const size = count * TILE_PX;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('Toile 2D indisponible.');
      images.forEach((image, index) => {
        if (image) context.drawImage(image, urls[index].x * TILE_PX, urls[index].y * TILE_PX);
      });
      /* Lève une `SecurityError` si une tuile a souillé la toile. */
      const { data } = context.getImageData(0, 0, size, size);
      return equirectangular({ data, width: size, height: size }, 2048, 1024);
    });
    /* Un échec n'est pas gardé : une autre carte, plus tard, pourra réessayer. */
    texture.catch(() => textures.delete(template));
    textures.set(template, texture);
  }
  return texture;
}

/** Le disque d'une vue, et sa partie visible dans le cadre. */
function diskOf(frame: Frame, zoom: number) {
  const cx = frame.width / 2;
  const cy = frame.height / 2;
  const radius = globeRadius(frame, zoom);
  const rect: FrameRect = {
    x0: Math.max(0, cx - radius),
    y0: Math.max(0, cy - radius),
    x1: Math.min(frame.width, cx + radius),
    y1: Math.min(frame.height, cy + radius),
  };
  return { cx, cy, radius, rect };
}

export default function GlobeRaster({
  view,
  frame,
  framePx,
  moving,
  template,
  onFailure,
}: GlobeRasterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [texture, setTexture] = useState<Texture | null>(null);
  const failureRef = useRef(onFailure);
  const slowFrames = useRef(0);
  const disk = useRef<{ key: string; vectors: Float32Array } | null>(null);
  const { longitude, latitude, zoom } = view;

  useEffect(() => {
    failureRef.current = onFailure;
  });

  useEffect(() => {
    let live = true;
    textureOf(template).then(
      (loaded) => {
        if (live) setTexture(loaded);
      },
      (error: unknown) => {
        if (live)
          failureRef.current(
            error instanceof Error || error instanceof DOMException
              ? error
              : new Error(String(error)),
          );
      },
    );
    return () => {
      live = false;
    };
  }, [template]);

  /* LA TOILE SE PEINT APRÈS LE RENDU : c'est une synchronisation avec un
     système extérieur, le contexte 2D, pas un état dérivé. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !texture) return;
    if (moving && slowFrames.current >= 2) return;
    const started = performance.now();
    const { cx, cy, radius, rect } = diskOf(frame, zoom);
    const density = (framePx / frame.width) * (window.devicePixelRatio || 1);
    const scale =
      Math.min(
        1,
        MAX_CANVAS_PX / ((Math.max(rect.x1 - rect.x0, rect.y1 - rect.y0) || 1) * density),
      ) * (moving ? 0.5 : 1);
    const columns = Math.max(1, Math.round((rect.x1 - rect.x0) * density * scale));
    const rows = Math.max(1, Math.round((rect.y1 - rect.y0) * density * scale));
    const key = `${columns}:${rows}:${rect.x0}:${rect.y0}:${rect.x1}:${rect.y1}:${radius}`;
    if (disk.current?.key !== key) {
      disk.current = { key, vectors: diskVectors(columns, rows, rect, cx, cy, radius) };
    }
    const context = canvas.getContext('2d');
    if (!context) return;
    /* Redimensionner une toile la réalloue : seulement quand sa taille change. */
    if (canvas.width !== columns) canvas.width = columns;
    if (canvas.height !== rows) canvas.height = rows;
    const image = context.createImageData(columns, rows);
    sampleGlobe(texture, disk.current.vectors, longitude, latitude, image.data);
    context.putImageData(image, 0, 0);
    /* Seules les images d'un geste comptent : au repos, la toile pleine a
       droit à plus d'une image (720 px, ≈ 18 ms mesurés). */
    if (moving && performance.now() - started > FRAME_BUDGET_MS) slowFrames.current += 1;
  }, [texture, longitude, latitude, zoom, frame, framePx, moving]);

  const { rect } = diskOf(frame, zoom);
  const percent = (value: number, of: number) => `${(value / of) * 100}%`;
  return (
    <canvas
      ref={canvasRef}
      className="opale-world-map__texture"
      aria-hidden="true"
      style={{
        left: percent(rect.x0, frame.width),
        top: percent(rect.y0, frame.height),
        width: percent(rect.x1 - rect.x0, frame.width),
        height: percent(rect.y1 - rect.y0, frame.height),
      }}
    />
  );
}
