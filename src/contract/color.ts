/**
 * Colour maths for the token contract: sRGB ↔ OKLab, WCAG contrast, alpha
 * compositing, perceptual distance. Pure functions, no dependency, no I/O.
 *
 * Lifted verbatim from `portfolio/src/test/color.ts`, where these eleven
 * helpers were written and proven against a 1107-line suite. They moved here
 * because a contract that lives in one project's test folder cannot guard a
 * second project — which is exactly how six tokens diverged unnoticed.
 */
const HEX_COLOR = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_FUNCTION = /^rgba?\(([^)]*)\)$/i;

/** Linear-light sRGB channels in [0, 1], the input of every formula below. */
interface LinearRgb {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

/** Canaux 8 bits d'une couleur CSS, alpha compris. */
export interface RgbaColor {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
  /** Opacité dans [0, 1]. Vaut 1 pour toute notation qui n'en porte pas. */
  readonly alpha: number;
}

/** A colour in the OKLab space. Perceptually uniform, unlike sRGB. */
export interface Oklab {
  readonly lightness: number;
  readonly a: number;
  readonly b: number;
}

function channelByte(part: string): number {
  return part.endsWith("%") ? (Number.parseFloat(part) * 255) / 100 : Number.parseFloat(part);
}

function alphaValue(part: string): number {
  return part.endsWith("%") ? Number.parseFloat(part) / 100 : Number.parseFloat(part);
}

/**
 * Canaux 8 bits et alpha d'une couleur CSS.
 *
 * Accepte `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb(...)` et `rgba(...)` — les
 * formes dans lesquelles les tokens du thème sont écrits. L'alpha est RENDU, jamais
 * jeté : c'est en le jetant en silence que `contrastRatio` mesurait un ratio contre
 * le blanc pur là où la couleur réelle était un voile blanc sur un fond clair.
 */
export function parseRgba(color: string): RgbaColor {
  const trimmed = color.trim();

  if (/^transparent$/i.test(trimmed)) return { red: 0, green: 0, blue: 0, alpha: 0 };
  if (/^color-mix\(/i.test(trimmed)) return parseColorMix(trimmed);

  const hexMatch = HEX_COLOR.exec(trimmed);

  if (hexMatch !== null) {
    const hex = hexMatch[1];
    const expanded =
      hex.length <= 4
        ? hex
            .split("")
            .map((channel) => channel + channel)
            .join("")
        : hex;

    const bytes = [0, 2, 4, 6]
      .filter((offset) => offset < expanded.length)
      .map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16));

    return {
      red: bytes[0],
      green: bytes[1],
      blue: bytes[2],
      alpha: bytes.length === 4 ? bytes[3] / 255 : 1,
    };
  }

  const functionMatch = RGB_FUNCTION.exec(trimmed);

  if (functionMatch !== null) {
    const parts = functionMatch[1].split(/[\s,/]+/).filter((part) => part.length > 0);

    const channels = parts.slice(0, 3).map(channelByte);
    const alpha = parts.length === 4 ? alphaValue(parts[3]) : 1;

    if (
      channels.length === 3 &&
      (parts.length === 3 || parts.length === 4) &&
      channels.every((channel) => Number.isFinite(channel)) &&
      Number.isFinite(alpha)
    ) {
      return { red: channels[0], green: channels[1], blue: channels[2], alpha };
    }
  }

  throw new Error(
    `couleur CSS attendue (#rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(), transparent ` +
      `ou color-mix(in srgb, …)), reçu "${color}"`
  );
}

/** Les membres d'une liste séparée par des virgules, parenthèses respectées. */
function splitTopLevel(list: string): readonly string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < list.length; index += 1) {
    const char = list[index];
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
    else if (char === "," && depth === 0) {
      parts.push(list.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(list.slice(start).trim());

  return parts;
}

const MIX_PERCENTAGE = /(?:^|\s)(-?[\d.]+)%(?=\s|$)/;

/** Une couleur d'un `color-mix()` et sa part facultative, dans un ordre ou l'autre. */
function mixComponent(part: string, whole: string): { color: string; share: number | undefined } {
  const match = MIX_PERCENTAGE.exec(part);
  if (match === null) return { color: part, share: undefined };

  const share = Number.parseFloat(match[1]);
  if (!Number.isFinite(share) || share < 0 || share > 100) {
    throw new Error(`parts de color-mix hors de [0 %, 100 %] dans "${whole}"`);
  }

  return { color: (part.slice(0, match.index) + part.slice(match.index + match[0].length)).trim(), share };
}

/**
 * `color-mix(in srgb, A p%, B q%)`, calculé comme CSS Color 5 le prescrit.
 *
 * SEUL L'ESPACE sRGB EST CALCULÉ, et tout autre espace est REFUSÉ par son nom.
 * Toutes les feuilles de ce paquet mélangent en sRGB ; un `in oklab` approximé
 * en sRGB rendrait une couleur fausse et un contraste faux, sans le dire.
 *
 * Les parts se normalisent à 100 % : une part absente complète l'autre, deux
 * absentes valent moitié-moitié, et une somme inférieure à 100 % réduit
 * l'opacité d'autant. Le mélange est PRÉMULTIPLIÉ par l'alpha : mélanger avec
 * `transparent` baisse l'opacité sans tirer la teinte vers le noir — c'est ce
 * que peint le navigateur pour `--opale-button-hover-background`.
 */
function parseColorMix(color: string): RgbaColor {
  const open = color.indexOf("(");
  if (!color.endsWith(")")) throw new Error(`color-mix non refermé : "${color}"`);

  const [space, first, second, ...extra] = splitTopLevel(color.slice(open + 1, -1));
  const spaceName = (space ?? "").replace(/^in\s+/i, "").trim().toLowerCase();

  if (spaceName !== "srgb") {
    throw new Error(
      `color-mix(in ${spaceName}) non pris en charge : seul l'espace srgb est résolu, ` +
        `et approximer un autre espace rendrait un contraste faux. Reçu "${color}"`
    );
  }
  if (first === undefined || second === undefined || extra.length > 0) {
    throw new Error(`color-mix attend exactement deux couleurs, reçu "${color}"`);
  }

  const one = mixComponent(first, color);
  const other = mixComponent(second, color);
  const shareOne = one.share ?? (other.share === undefined ? 50 : 100 - other.share);
  const shareOther = other.share ?? 100 - shareOne;
  const total = shareOne + shareOther;

  if (total <= 0) throw new Error(`parts de color-mix nulles dans "${color}"`);

  const weightOne = shareOne / total;
  const weightOther = shareOther / total;
  const top = parseRgba(one.color);
  const bottom = parseRgba(other.color);
  const alpha = top.alpha * weightOne + bottom.alpha * weightOther;
  const channel = (a: number, b: number): number =>
    alpha === 0 ? 0 : (a * top.alpha * weightOne + b * bottom.alpha * weightOther) / alpha;

  return {
    red: channel(top.red, bottom.red),
    green: channel(top.green, bottom.green),
    blue: channel(top.blue, bottom.blue),
    alpha: alpha * Math.min(total / 100, 1),
  };
}

/**
 * Canal 8 bits d'une couleur CSS, dans l'ordre rouge, vert, bleu.
 *
 * L'alpha est écarté ici : cette fonction sert les formules qui n'ont de sens que sur
 * une couleur déjà aplatie. Toute mesure qui dépend du substrat passe par
 * `compositeLayers` d'abord.
 */
export function parseColor(color: string): readonly [number, number, number] {
  const { red, green, blue } = parseRgba(color);

  return [red, green, blue];
}

function formatRgb(red: number, green: number, blue: number, alpha = 1): string {
  // Trois décimales : assez pour que la composition de quatre couches ne dérive pas
  // d'un millième de canal, assez peu pour qu'un message d'échec reste lisible.
  const round = (value: number): number => Number(value.toFixed(3));

  return alpha < 1
    ? `rgba(${round(red)}, ${round(green)}, ${round(blue)}, ${round(alpha)})`
    : `rgb(${round(red)}, ${round(green)}, ${round(blue)})`;
}

/**
 * La même couleur, dont l'opacité est multipliée par `factor`.
 *
 * Sert à traduire une `opacity` CSS en alpha de composition : un disque plein de
 * `--halo-tint` posé à `opacity: var(--halo-opacity)` se compose exactement comme le
 * même ton en `rgba()` à cet alpha. La multiplication, et non le remplacement, est ce
 * que fait le navigateur quand l'élément porte déjà un fond translucide.
 */
export function withAlpha(color: string, factor: number): string {
  if (!Number.isFinite(factor) || factor < 0 || factor > 1) {
    throw new Error(`facteur d'opacité attendu dans [0, 1], reçu "${factor}"`);
  }

  const { red, green, blue, alpha } = parseRgba(color);

  return formatRgb(red, green, blue, alpha * factor);
}

/**
 * `top` posé sur `bottom` en source-over sRGB non linéaire, tel que le navigateur le
 * peint : `out = a·top + (1 − a)·bottom` sur les octets, sans linéarisation.
 *
 * Pas de linéarisation, donc, et ce n'est pas une approximation : c'est ce que fait
 * un compositeur en espace non linéaire, et mesurer un contraste sur un aplat que
 * l'utilisateur ne voit pas serait le vrai faux résultat.
 *
 * `bottom` doit être opaque. Composer sur un substrat lui-même translucide rendrait
 * une couleur translucide, donc un contraste toujours indéterminé : la pile doit
 * partir d'un sol, et le sol d'une page c'est son fond.
 */
export function compositeOver(top: string, bottom: string): string {
  const over = parseRgba(top);
  const under = parseRgba(bottom);

  if (under.alpha < 1) {
    throw new Error(
      `substrat translucide : "${bottom}" a un alpha de ${under.alpha}. ` +
        "Empile les couches depuis une couleur opaque avec compositeLayers([fond, …])."
    );
  }

  const mix = (channelTop: number, channelBottom: number): number =>
    over.alpha * channelTop + (1 - over.alpha) * channelBottom;

  return formatRgb(
    mix(over.red, under.red),
    mix(over.green, under.green),
    mix(over.blue, under.blue)
  );
}

/**
 * Aplat opaque d'une pile de couches, **la plus basse d'abord**.
 *
 * L'ordre est celui de la peinture : `[fond de page, halo, remplissage de verre,
 * lavis d'état]`. C'est la seule façon honnête de nommer le support d'un token
 * translucide — un `rgba()` n'a pas de contraste propre, il a le contraste de ce sur
 * quoi il est posé.
 */
export function compositeLayers(layers: readonly string[]): string {
  const [ground, ...above] = layers;

  if (ground === undefined) {
    throw new Error("compositeLayers attend au moins une couche, la plus basse d'abord");
  }

  const groundAlpha = parseRgba(ground).alpha;

  if (groundAlpha < 1) {
    throw new Error(
      `la couche la plus basse doit être opaque : "${ground}" a un alpha de ${groundAlpha}`
    );
  }

  return above.reduce((under, over) => compositeOver(over, under), ground);
}

function assertOpaque(color: string, role: string): void {
  const { alpha } = parseRgba(color);

  if (alpha < 1) {
    throw new Error(
      `${role} translucide : "${color}" a un alpha de ${alpha}, son contraste dépend ` +
        "donc de ce qu'il y a derrière. Aplatis-le d'abord — " +
        `compositeLayers([fond, …, "${color}"]) — puis mesure le résultat.`
    );
  }
}

function toLinearRgb(color: string): LinearRgb {
  const [red, green, blue] = parseColor(color).map((channel) => {
    const normalised = channel / 255;

    return normalised <= 0.03928 ? normalised / 12.92 : ((normalised + 0.055) / 1.055) ** 2.4;
  });

  return { red, green, blue };
}

/**
 * Luminance relative WCAG d'une couleur.
 *
 * Les tests comparent des luminances plutôt que des codes couleur : la palette
 * exacte appartient à la refonte graphique, mais « le thème sombre annonce une
 * couleur sombre au navigateur » est un comportement durable.
 */
export function relativeLuminance(color: string): number {
  const { red, green, blue } = toLinearRgb(color);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Seuil de référence : le gris moyen. Au-dessus c'est clair, en dessous c'est sombre. */
export const MID_GREY_LUMINANCE = relativeLuminance("#808080");

/**
 * Ratio de contraste WCAG 2.1 entre deux couleurs OPAQUES, dans [1, 21].
 *
 * L'ordre des arguments est indifférent : la formule normalise déjà claire sur
 * sombre.
 *
 * Une entrée d'alpha < 1 est REFUSÉE, elle n'est pas composée d'office sur du blanc.
 * `contrastRatio("#2c464b", "rgba(255, 255, 255, 0.4)")` rendait 12.70 — le ratio
 * contre le blanc pur — quand le composite réel sur `#daecf0` vaut 8.16 : un chiffre
 * faux et rassurant, la pire des sorties pour un test d'accessibilité. Le refus est
 * préféré à un paramètre de substrat facultatif parce qu'un paramètre qu'on oublie
 * refait exactement le bug, en silence, alors qu'un refus arrête l'appelant ; et
 * parce que le substrat réel d'un token n'est pas une couleur mais une PILE (fond de
 * page → halo → verre → lavis), que seul `compositeLayers` sait dire.
 */
export function contrastRatio(one: string, other: string): number {
  assertOpaque(one, "première couleur");
  assertOpaque(other, "seconde couleur");

  const first = relativeLuminance(one);
  const second = relativeLuminance(other);

  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/**
 * Conversion sRGB vers OKLab (Björn Ottosson, 2020).
 *
 * Sert à mesurer ce que l'œil voit et non ce que l'octet contient : deux teals
 * séparés de 40 unités hexadécimales peuvent être indiscernables, alors que
 * l'écart OKLab, lui, ne mentira pas.
 */
export function oklab(color: string): Oklab {
  // Même raison que dans `contrastRatio` : une teinte lue en jetant l'alpha est la
  // teinte d'une couleur que personne ne voit.
  assertOpaque(color, "couleur");

  const { red, green, blue } = toLinearRgb(color);

  const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);

  return {
    lightness: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
    a: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    b: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
  };
}

/**
 * Distance perceptuelle ΔE entre deux couleurs, sur l'échelle ×100.
 *
 * OKLab natif donne des écarts autour de 0,1 ; les commentaires de `index.css`
 * raisonnent en centièmes (« ΔE OKLab contre --accent 14.4 »). On garde leur
 * échelle pour que test et commentaire parlent des mêmes nombres.
 */
export function deltaEOklab(one: string, other: string): number {
  const first = oklab(one);
  const second = oklab(other);

  return (
    100 * Math.hypot(first.lightness - second.lightness, first.a - second.a, first.b - second.b)
  );
}

/** Teinte OKLCH en degrés, dans [0, 360[. */
export function oklchHue(color: string): number {
  const { a, b } = oklab(color);

  return ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
}

/**
 * Écart de teinte OKLCH en degrés, dans [0, 180] : la teinte est un angle, donc
 * 350 deg et 10 deg sont séparés de 20 deg, pas de 340 deg.
 */
export function oklchHueDistance(one: string, other: string): number {
  const gap = Math.abs(oklchHue(one) - oklchHue(other)) % 360;

  return gap > 180 ? 360 - gap : gap;
}
