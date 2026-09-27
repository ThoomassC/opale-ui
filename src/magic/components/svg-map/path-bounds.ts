/* =============================================================================
   LA BOÎTE D'UN TRACÉ, CALCULÉE SANS NAVIGATEUR.

   POURQUOI NE PAS DEMANDER `getBBox()`. Le cadrage doit savoir où est une
   région AVANT qu'elle ne soit peinte — une vue pilotée de l'extérieur peut
   demander « cadre sur l'Île-de-France » au premier rendu —, et `getBBox()`
   n'existe ni côté serveur ni dans jsdom. Lire l'attribut `d` rend le cadrage
   déterministe, donc testable.

   LA BOÎTE EST CONSERVATRICE, ET C'EST VOULU. Une courbe de Bézier tient
   toujours dans l'enveloppe de ses points de contrôle : les inclure donne une
   boîte parfois un peu large, jamais trop étroite. Pour cadrer, un léger excès
   de marge est invisible ; une région rognée ne l'est pas. Un arc est borné de
   même, sans calculer son centre — voir plus bas.
   ========================================================================== */

export interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** Nombre d'arguments consommés par chaque commande, répétitions comprises. */
const ARITY: Readonly<Record<string, number>> = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0,
};

const NUMBER = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/y;
const SEPARATORS = /[\s,]*/y;

/* =============================================================================
   UN LECTEUR, PAS UNE EXPRESSION RÉGULIÈRE.

   Les drapeaux d'un arc tiennent sur UN caractère, et svgo les écrit collés :
   « a1 1 0 011 1 » se lit rotation 0, grand arc 0, sens 1, puis 1 1. Découper
   le tracé en nombres d'avance lisait « 011 » d'un bloc — l'arc disparaissait
   en silence et la lettre suivante devenait un nombre. Le lecteur sait donc,
   argument par argument, s'il attend un nombre ou un drapeau.
   ========================================================================== */
class PathReader {
  private index = 0;
  private readonly d: string;

  constructor(d: string) {
    this.d = d;
  }

  private skip() {
    SEPARATORS.lastIndex = this.index;
    SEPARATORS.exec(this.d);
    this.index = SEPARATORS.lastIndex;
  }

  done(): boolean {
    this.skip();
    return this.index >= this.d.length;
  }

  /** La commande qui commence ici, s'il y en a une. */
  command(): string | null {
    this.skip();
    const char = this.d[this.index];
    if (char && /[MLHVCSQTAZmlhvcsqtaz]/.test(char)) {
      this.index += 1;
      return char;
    }
    return null;
  }

  number(): number {
    this.skip();
    NUMBER.lastIndex = this.index;
    const match = NUMBER.exec(this.d);
    if (!match) throw this.error('un nombre');
    this.index = NUMBER.lastIndex;
    return Number(match[0]);
  }

  flag(): number {
    this.skip();
    const char = this.d[this.index];
    if (char !== '0' && char !== '1') throw this.error('un drapeau 0 ou 1');
    this.index += 1;
    return Number(char);
  }

  private error(expected: string) {
    return new Error(
      `Tracé SVG invalide : ${expected} attendu à la position ${this.index} de « ${this.d.slice(0, 40)} ».`,
    );
  }
}

export function pathBounds(d: string): Bounds {
  const reader = new PathReader(d);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const include = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  /* Le dernier point de contrôle, pour les courbes « lisses » S et T qui en
     prennent le reflet. */
  let controlX = 0;
  let controlY = 0;
  let previous = '';
  let command = '';

  while (!reader.done()) {
    const explicit = reader.command();
    if (explicit) {
      command = explicit;
      if (command === 'Z' || command === 'z') {
        x = startX;
        y = startY;
        previous = 'Z';
        continue;
      }
    } else if (!command || command === 'Z' || command === 'z') {
      throw new Error(`Tracé SVG invalide : « ${d.slice(0, 40)} » — une commande est attendue.`);
    }

    const upper = command.toUpperCase();
    const relative = command !== upper;
    if (ARITY[upper] === undefined) throw new Error(`Commande SVG inconnue : « ${command} ».`);

    const ox = relative ? x : 0;
    const oy = relative ? y : 0;

    switch (upper) {
      case 'M':
      case 'L':
      case 'T': {
        const nx = reader.number() + ox;
        const ny = reader.number() + oy;
        if (upper === 'T') {
          const smooth = previous === 'Q' || previous === 'T';
          controlX = smooth ? 2 * x - controlX : x;
          controlY = smooth ? 2 * y - controlY : y;
          include(controlX, controlY);
        }
        x = nx;
        y = ny;
        if (upper === 'M') {
          startX = x;
          startY = y;
          /* Les paires qui suivent un déplacement sont des lignes. */
          command = relative ? 'l' : 'L';
        }
        break;
      }
      case 'H':
        x = reader.number() + ox;
        break;
      case 'V':
        y = reader.number() + oy;
        break;
      case 'C': {
        include(reader.number() + ox, reader.number() + oy);
        controlX = reader.number() + ox;
        controlY = reader.number() + oy;
        include(controlX, controlY);
        x = reader.number() + ox;
        y = reader.number() + oy;
        break;
      }
      case 'S': {
        const smooth = previous === 'C' || previous === 'S';
        include(smooth ? 2 * x - controlX : x, smooth ? 2 * y - controlY : y);
        controlX = reader.number() + ox;
        controlY = reader.number() + oy;
        include(controlX, controlY);
        x = reader.number() + ox;
        y = reader.number() + oy;
        break;
      }
      case 'Q': {
        controlX = reader.number() + ox;
        controlY = reader.number() + oy;
        include(controlX, controlY);
        x = reader.number() + ox;
        y = reader.number() + oy;
        break;
      }
      case 'A': {
        const rx = Math.abs(reader.number());
        const ry = Math.abs(reader.number());
        reader.number(); // rotation
        reader.flag(); // grand arc
        reader.flag(); // sens
        const nx = reader.number() + ox;
        const ny = reader.number() + oy;
        /* LA BOÎTE D'UN ARC SANS CALCULER SON CENTRE. Le navigateur agrandit
           des rayons trop courts jusqu'à la demi-corde ; le rayon effectif est
           donc au moins celle-ci. Tout point du cercle est à moins de deux
           rayons de chacune des extrémités : l'intersection des deux carrés
           qui en découlent contient l'arc, grand ou petit. */
        const r = Math.max(rx, ry, Math.hypot(nx - x, ny - y) / 2);
        include(Math.max(x, nx) - 2 * r, Math.max(y, ny) - 2 * r);
        include(Math.min(x, nx) + 2 * r, Math.min(y, ny) + 2 * r);
        x = nx;
        y = ny;
        break;
      }
    }

    include(x, y);
    previous = upper;
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    throw new Error('Tracé SVG vide : aucune coordonnée à borner.');
  }

  return { minX, minY, maxX, maxY };
}

export function unionBounds(all: readonly Bounds[]): Bounds {
  if (all.length === 0) throw new Error('Aucune boîte à réunir.');

  return all.reduce((acc, b) => ({
    minX: Math.min(acc.minX, b.minX),
    minY: Math.min(acc.minY, b.minY),
    maxX: Math.max(acc.maxX, b.maxX),
    maxY: Math.max(acc.maxY, b.maxY),
  }));
}
