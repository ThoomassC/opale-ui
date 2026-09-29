/**
 * Les mesures de la palette, en hexadécimaux littéraux : chaque plaque montre
 * les deux thèmes quel que soit celui du lecteur.
 *
 * `palette-data.test.ts` compare chaque valeur au jeton résolu dans les vraies
 * feuilles, exige que tout rôle coloré soit plaqué ou exclu avec sa raison, et
 * refuse une exclusion dont le jeton n'existe plus.
 *
 * Un lavis porte sa valeur déclarée en `rgba()` dans `hex`, et dans `wash` la
 * pile où il se compose avec l'aplat qui en résulte, seul peint. Les ratios
 * sont recopiés de `roles.css` et `materials.css`, absents s'ils n'y sont pas.
 */

/**
 * Un lavis translucide, et ce qu'il devient.
 *
 * `composite` n'est pas une saisie libre : le test le recalcule par
 * `compositeLayers([...over, valeur du jeton])` et échoue si l'aplat écrit ici
 * n'est pas celui-là, canal par canal.
 *
 * Il peut différer d'une unité par canal des primitives du bloc
 * d'aplatissement (`prefers-reduced-transparency`) : celles-ci réemploient une
 * primitive déjà nommée quand elle est à moins de 0,5 de ΔE OKLab de la
 * composition exacte. Les deux chiffres sont justes, ils ne répondent pas à la
 * même question.
 */
export interface Wash {
  /** Pile de jetons sous le lavis, **la plus basse d'abord**. */
  readonly over: readonly string[];
  /** Aplat opaque rendu par `over` + le lavis. C'est lui qu'on peint. */
  readonly composite: string;
}

export interface Swatch {
  /** Nom du jeton, sans `var()`. */
  readonly token: string;
  /**
   * Valeur **déclarée** par la feuille : un hexadécimal, ou un `rgba()` quand
   * le jeton est un lavis. Dans ce second cas, voir `wash`.
   */
  readonly hex: string;
  /**
   * Ratio de contraste mesuré, notation française. Absent quand la feuille
   * n'en documente aucun — un sol, un décor, un lavis d'accent.
   */
  readonly ratio?: string;
  /** Support contre lequel le ratio est mesuré, ou nature du jeton. */
  readonly against: string;
  /** Présent uniquement si le jeton est translucide. */
  readonly wash?: Wash;
}

export interface PlateGroup {
  readonly title: string;
  readonly note: string;
  readonly swatches: readonly Swatch[];
}

export interface Plate {
  readonly id: string;
  /** Thème documenté par la plaque. C'est lui que le test résout. */
  readonly theme: 'light' | 'dark';
  readonly title: string;
  readonly groundLabel: string;
  /** Fond littéral de la plaque — `--site-background`. */
  readonly ground: string;
  /** Encre littérale de la plaque — `--text-strong`. */
  readonly ink: string;
  /** Encre atténuée, pour les notes — `--text-muted`. */
  readonly inkMuted: string;
  /**
   * Filet littéral — `--rule`, et c'est un LAVIS.
   *
   * La valeur déclarée est posée telle quelle en `borderColor` sur un élément
   * dont le fond est `ground` : le navigateur compose, et le rendu est exact.
   * Aucun aplat à substituer ici.
   */
  readonly rule: string;
  readonly groups: readonly PlateGroup[];
}

const GROUNDS_NOTE =
  'Le sol de la page, la carte, et les trois lavis d’état. Les lavis ne sont pas des sols : ils n’ont de contraste que celui de la carte sous eux — sur un repli à #ebf4f6 il ne restait plus rien à éclaircir, donc la couche creuse en clair et éclaircit en sombre.';

const NEUTRALS_NOTE =
  'Les neutres sont le teal vidé de sa chroma : la même teinte, la saturation retirée. Rien ne jure avec l’accent parce que rien n’en est étranger.';

const TEAL_NOTE =
  'Le teal est l’encre des actions : bouton, lien, focus, état. S’il apparaît, quelque chose est actionnable ou vient de changer.';

const COPPER_NOTE =
  'Le cuivre est le décor et l’éditorial — filet, lettrine, chiffre de section. Il ne porte jamais un contrôle : une couleur chaude sur un bouton rompt le contrat.';

const TRACE_NOTE =
  'Le double anneau inverse ses deux tons entre les thèmes : l’un des deux contraste toujours avec le fond local, quel qu’il soit.';

const GLASS_NOTE =
  'Le matériau, pas l’emploi. Le remplissage de verre composé sur le sol nu tombe exactement sur la carte opaque — c’est la preuve la plus courte que `--glass-fill-solid` n’avait pas à être un second littéral. Les halos sont des disques PLEINS posés à `--halo-opacity` : ce qui protège le texte est le remplissage de la carte, jamais l’effacement de la bulle.';

/* Plaquée et non exclue : la pastille peint la composition du `rgba()` sur le
   sol. Aucun ratio affiché, la feuille n'en documente aucun. */
const ACCENT_SHADOW_NOTE =
  'L’ombre que projette l’aplat accent, et elle NE SE THÈME PAS : l’accent est le même teal dans les deux thèmes, donc son ombre aussi — seule change la couleur sous elle. Son encre est un indigo dérivé de l’accent, pas une teinte choisie : au prochain déplacement de l’accent, elle se re-dérive.';

const STATUS_NOTE =
  'Trois avancements, et le libellé textuel est le garde-fou réel : mesurées en simulation deutéranope, ces trois pastilles sont indiscernables. La couleur est un renfort. La pastille « acquis » est un ALIAS de « en direct », pas un second littéral.';

export const LIGHT_PLATE: Plate = {
  id: 'plate-light',
  theme: 'light',
  title: 'Thème clair',
  groundLabel: 'sol #deedf0',
  ground: '#deedf0',
  ink: '#193940',
  inkMuted: '#3e5359',
  rule: 'rgba(7, 20, 23, 0.16)',
  groups: [
    {
      title: 'Sols et surfaces',
      note: GROUNDS_NOTE,
      swatches: [
        { token: '--site-background', hex: '#deedf0', against: 'le sol de la page' },
        { token: '--surface', hex: '#ebf4f6', against: 'la carte, repli opaque du verre' },
        {
          token: '--panel-surface',
          hex: 'rgba(7, 20, 23, 0.05)',
          ratio: '1,107:1',
          against: 'lavis de repos, sur la carte',
          wash: { over: ['--surface'], composite: '#e0e9eb' },
        },
        {
          token: '--panel-surface-hover',
          hex: 'rgba(7, 20, 23, 0.1)',
          ratio: '1,230:1',
          against: 'lavis de survol, sur la carte',
          wash: { over: ['--surface'], composite: '#d4dee0' },
        },
        {
          token: '--panel-surface-active',
          hex: 'rgba(7, 20, 23, 0.13)',
          ratio: '1,313:1',
          against: 'lavis d’appui, sur la carte',
          wash: { over: ['--surface'], composite: '#cdd7d9' },
        },
      ],
    },
    {
      title: 'Neutres — les encres',
      note: NEUTRALS_NOTE,
      swatches: [
        { token: '--text-strong', hex: '#193940', ratio: '10,28:1', against: 'sur le sol' },
        { token: '--text-body', hex: '#2b464c', ratio: '8,39:1', against: 'sur le sol' },
        { token: '--text-muted', hex: '#3e5359', ratio: '6,76:1', against: 'sur le sol' },
      ],
    },
    {
      title: 'Primaire — le teal',
      note: TEAL_NOTE,
      swatches: [
        { token: '--text-accent', hex: '#0e5968', ratio: '6,60:1', against: 'sur le sol' },
        { token: '--accent', hex: '#087487', ratio: '5,44:1', against: 'blanc sur l’aplat' },
        { token: '--accent-hover', hex: '#00687b', ratio: '6,43:1', against: 'blanc sur l’aplat' },
        { token: '--accent-active', hex: '#005d6f', ratio: '7,51:1', against: 'blanc sur l’aplat' },
        {
          token: '--text-on-accent',
          hex: '#ffffff',
          ratio: '5,44:1',
          against: 'sur l’aplat accent',
        },
        {
          token: '--accent-quiet',
          hex: 'rgba(8, 116, 135, 0.1)',
          against: 'lavis d’accent, sur la carte',
          wash: { over: ['--surface'], composite: '#d4e7eb' },
        },
        {
          token: '--accent-quiet-border',
          hex: 'rgba(8, 116, 135, 0.42)',
          against: 'liseré du lavis, sur la carte',
          wash: { over: ['--surface'], composite: '#8cbec7' },
        },
      ],
    },
    {
      title: 'Secondaire — le cuivre',
      note: COPPER_NOTE,
      swatches: [
        { token: '--accent-secondary', hex: '#723e32', ratio: '7,13:1', against: 'sur le sol' },
      ],
    },
    {
      title: 'Traits et focus',
      note: TRACE_NOTE,
      swatches: [
        {
          token: '--border-subtle',
          hex: 'rgba(7, 20, 23, 0.138)',
          ratio: '1,34:1',
          against: 'décoratif seul, sur la carte',
          wash: { over: ['--surface'], composite: '#ccd5d7' },
        },
        { token: '--control-border', hex: '#59696d', ratio: '4,77:1', against: 'sur le sol' },
        { token: '--focus-outer', hex: '#000000', ratio: '17,48:1', against: 'sur le sol' },
        { token: '--focus-inner', hex: '#f6ffde', ratio: '5,26:1', against: 'sur l’aplat accent' },
      ],
    },
    {
      title: 'Le verre et les halos',
      note: GLASS_NOTE,
      swatches: [
        {
          token: '--glass-fill',
          hex: 'rgba(255, 255, 255, 0.4)',
          ratio: '1,078:1',
          against: 'remplissage, sur le sol',
          wash: { over: ['--site-background'], composite: '#ebf4f6' },
        },
        {
          token: '--glass-border',
          hex: 'rgba(7, 20, 23, 0.25)',
          against: 'liseré d’encre, sur le sol',
          wash: { over: ['--site-background'], composite: '#a8b7ba' },
        },
        {
          token: '--halo-tint',
          hex: '#84cbdc',
          ratio: '1,45:1',
          against: 'disque froid, sur le sol',
        },
        {
          token: '--halo-tint-warm',
          hex: '#f0b3a4',
          ratio: '1,44:1',
          against: 'disque chaud, sur le sol',
        },
        {
          token: '--icon-surface-start',
          hex: 'rgba(132, 203, 220, 0.24)',
          ratio: '1,120:1',
          against: 'tuile, arrêt de départ, sur la carte',
          wash: { over: ['--surface'], composite: '#d2eaf0' },
        },
        {
          token: '--icon-surface-end',
          hex: 'rgba(132, 203, 220, 0.42)',
          ratio: '1,221:1',
          against: 'tuile, arrêt d’arrivée, sur la carte',
          wash: { over: ['--surface'], composite: '#c0e3eb' },
        },
        {
          token: '--shadow-ink',
          hex: 'rgba(4, 15, 19, 0.3)',
          against: 'ombre portée, sur le sol',
          wash: { over: ['--site-background'], composite: '#9daaae' },
        },
      ],
    },
    {
      title: 'L’ombre de l’aplat accent',
      note: ACCENT_SHADOW_NOTE,
      swatches: [
        {
          token: '--accent-shadow-ink',
          hex: 'rgba(34, 44, 86, 0.24)',
          against: 'au repos, sur le sol',
          wash: { over: ['--site-background'], composite: '#b1bfcb' },
        },
        {
          token: '--accent-shadow-ink-pressed',
          hex: 'rgba(34, 44, 86, 0.28)',
          against: 'à l’appui, sur le sol',
          wash: { over: ['--site-background'], composite: '#a9b7c5' },
        },
      ],
    },
    {
      title: 'États et disponibilité',
      note: STATUS_NOTE,
      swatches: [
        {
          token: '--badge-live-surface',
          hex: '#005568',
          against: 'aplat « en direct » et « acquis »',
        },
        { token: '--badge-live-text', hex: '#ffffff', ratio: '8,40:1', against: 'sur la pastille' },
        {
          token: '--status-progress-surface',
          hex: '#ffe0af',
          against: 'aplat « en cours »',
        },
        {
          token: '--status-progress-text',
          hex: '#845d22',
          ratio: '4,63:1',
          against: 'sur sa pastille',
        },
        { token: '--status-upcoming-surface', hex: '#e6d6ff', against: 'aplat « à venir »' },
        {
          token: '--status-upcoming-text',
          hex: '#6b5591',
          ratio: '4,63:1',
          against: 'sur sa pastille',
        },
      ],
    },
  ],
};

export const DARK_PLATE: Plate = {
  id: 'plate-dark',
  theme: 'dark',
  title: 'Thème sombre',
  groundLabel: 'sol #0f191c',
  ground: '#0f191c',
  ink: '#b6dae3',
  inkMuted: '#9eb7bd',
  rule: 'rgba(225, 234, 236, 0.16)',
  groups: [
    {
      title: 'Sols et surfaces',
      note: GROUNDS_NOTE,
      swatches: [
        { token: '--site-background', hex: '#0f191c', against: 'le sol de la page' },
        {
          token: '--surface',
          hex: '#0c1518',
          against: 'la carte — plus SOMBRE que la page : ici elle creuse',
        },
        {
          token: '--panel-surface',
          hex: 'rgba(225, 234, 236, 0.05)',
          ratio: '1,111:1',
          against: 'voile de repos, sur la carte',
          wash: { over: ['--surface'], composite: '#172023' },
        },
        {
          token: '--panel-surface-hover',
          hex: 'rgba(225, 234, 236, 0.121)',
          ratio: '1,347:1',
          against: 'voile de survol, sur la carte',
          wash: { over: ['--surface'], composite: '#262f32' },
        },
        {
          token: '--panel-surface-active',
          hex: 'rgba(225, 234, 236, 0.16)',
          ratio: '1,519:1',
          against: 'voile d’appui, sur la carte',
          wash: { over: ['--surface'], composite: '#2e373a' },
        },
      ],
    },
    {
      title: 'Neutres — les encres',
      note: NEUTRALS_NOTE,
      swatches: [
        { token: '--text-strong', hex: '#b6dae3', ratio: '12,01:1', against: 'sur le sol' },
        { token: '--text-body', hex: '#aac8d0', ratio: '10,10:1', against: 'sur le sol' },
        { token: '--text-muted', hex: '#9eb7bd', ratio: '8,47:1', against: 'sur le sol' },
      ],
    },
    {
      title: 'Primaire — le teal',
      note: TEAL_NOTE,
      swatches: [
        { token: '--text-accent', hex: '#78bbca', ratio: '8,30:1', against: 'sur le sol' },
        { token: '--accent', hex: '#087487', ratio: '5,44:1', against: 'blanc sur l’aplat' },
        { token: '--accent-hover', hex: '#208093', ratio: '4,59:1', against: 'blanc sur l’aplat' },
        { token: '--accent-active', hex: '#00677a', ratio: '6,52:1', against: 'blanc sur l’aplat' },
        {
          token: '--text-on-accent',
          hex: '#ffffff',
          ratio: '5,44:1',
          against: 'sur l’aplat accent',
        },
        {
          token: '--accent-quiet',
          hex: 'rgba(8, 116, 135, 0.16)',
          against: 'lavis d’accent, sur la carte',
          wash: { over: ['--surface'], composite: '#0b242a' },
        },
        {
          token: '--accent-quiet-border',
          hex: 'rgba(8, 116, 135, 0.55)',
          against: 'liseré du lavis, sur la carte',
          wash: { over: ['--surface'], composite: '#0a4955' },
        },
      ],
    },
    {
      title: 'Secondaire — le cuivre',
      note: COPPER_NOTE,
      swatches: [
        { token: '--accent-secondary', hex: '#bf8576', ratio: '5,81:1', against: 'sur le sol' },
      ],
    },
    {
      title: 'Traits et focus',
      note: TRACE_NOTE,
      swatches: [
        {
          token: '--border-subtle',
          hex: 'rgba(225, 234, 236, 0.121)',
          against: 'décoratif seul, sur la carte',
          wash: { over: ['--surface'], composite: '#262f32' },
        },
        { token: '--control-border', hex: '#8d9ea2', ratio: '6,42:1', against: 'sur le sol' },
        { token: '--focus-outer', hex: '#f6ffde', ratio: '17,24:1', against: 'sur le sol' },
        { token: '--focus-inner', hex: '#000000', ratio: '3,86:1', against: 'sur l’aplat accent' },
      ],
    },
    {
      title: 'Le verre et les halos',
      note: GLASS_NOTE,
      swatches: [
        {
          token: '--glass-fill',
          hex: 'rgba(0, 4, 6, 0.2)',
          ratio: '1,037:1',
          against: 'remplissage, sur le sol',
          wash: { over: ['--site-background'], composite: '#0c1518' },
        },
        {
          token: '--glass-border',
          hex: 'rgba(225, 234, 236, 0.22)',
          against: 'liseré clair, sur le sol — ici c’est LUI qui détache la carte',
          wash: { over: ['--site-background'], composite: '#3d474a' },
        },
        { token: '--halo-tint', hex: '#004452', against: 'disque froid' },
        { token: '--halo-tint-warm', hex: '#58281c', against: 'disque chaud' },
        {
          token: '--icon-surface-start',
          hex: 'rgba(8, 116, 135, 0.2)',
          ratio: '1,195:1',
          against: 'tuile, arrêt de départ, sur la carte',
          wash: { over: ['--surface'], composite: '#0b282e' },
        },
        {
          token: '--icon-surface-end',
          hex: 'rgba(0, 68, 82, 0.45)',
          ratio: '1,222:1',
          against: 'tuile, arrêt d’arrivée, sur la carte',
          wash: { over: ['--surface'], composite: '#072a32' },
        },
        {
          token: '--shadow-ink',
          hex: 'rgba(4, 15, 19, 0.5)',
          against: 'ombre portée, sur le sol — quasi inopérante ici',
          wash: { over: ['--site-background'], composite: '#0a1418' },
        },
      ],
    },
    {
      title: 'L’ombre de l’aplat accent',
      note: ACCENT_SHADOW_NOTE,
      swatches: [
        {
          token: '--accent-shadow-ink',
          hex: 'rgba(34, 44, 86, 0.24)',
          against: 'au repos, sur le sol — MÊME valeur déclarée qu’en clair',
          wash: { over: ['--site-background'], composite: '#141e2a' },
        },
        {
          token: '--accent-shadow-ink-pressed',
          hex: 'rgba(34, 44, 86, 0.28)',
          against: 'à l’appui, sur le sol',
          wash: { over: ['--site-background'], composite: '#141e2c' },
        },
      ],
    },
    {
      title: 'États et disponibilité',
      note: STATUS_NOTE,
      swatches: [
        {
          token: '--badge-live-surface',
          hex: '#005568',
          against: 'aplat « en direct » et « acquis » — VALEUR UNIQUE, non thémée',
        },
        { token: '--badge-live-text', hex: '#ffffff', ratio: '8,40:1', against: 'sur la pastille' },
        { token: '--status-progress-surface', hex: '#422700', against: 'aplat « en cours »' },
        {
          token: '--status-progress-text',
          hex: '#b19061',
          ratio: '4,62:1',
          against: 'sur sa pastille',
        },
        { token: '--status-upcoming-surface', hex: '#2f1e48', against: 'aplat « à venir »' },
        {
          token: '--status-upcoming-text',
          hex: '#9886bb',
          ratio: '4,62:1',
          against: 'sur sa pastille',
        },
      ],
    },
  ],
};

export const PLATES: readonly Plate[] = [LIGHT_PLATE, DARK_PLATE];

export interface SemanticRow {
  readonly theme: 'Clair' | 'Sombre';
  readonly token: string;
  readonly hex: string;
  /** Ratio contre `--site-background`. */
  readonly onGround: string;
  /** Ratio contre `--surface`. */
  readonly onCard: string;
  /** Fond littéral de la vignette, pour que le carré se lise. */
  readonly plateGround: string;
  readonly plateInk: string;
  readonly role: string;
  readonly glyph: string;
}

export const SEMANTIC_ROWS: readonly SemanticRow[] = [
  {
    theme: 'Clair',
    token: '--danger',
    hex: '#66151a',
    onGround: '10,36:1',
    onCard: '11,15:1',
    plateGround: '#deedf0',
    plateInk: '#193940',
    role: 'Échec, perte, action irréversible',
    glyph: '✕',
  },
  {
    theme: 'Clair',
    token: '--success',
    hex: '#0d4f2c',
    onGround: '8,05:1',
    onCard: '8,66:1',
    plateGround: '#deedf0',
    plateInk: '#193940',
    role: 'Confirmation, mesure validée',
    glyph: '✓',
  },
  {
    // Assombri une SECONDE fois, de #7b5620 à #422700, et la première
    // correction montre exactement ce qui manquait : #845d22 → #7b5620 avait
    // été calé sur le pire substrat que le contrat savait alors nommer — le
    // lavis posé sur `--panel-surface`, un aplat opaque. Le vrai pire support
    // est le HALO SANS CARTE, que `Backdrop` offre à tout enfant hors `Card`,
    // et l'ambre y tombait à 3,35:1 sous `.tc-message--warn` (texte, donc
    // 4,5:1 exigé). Le § 9 de `contract/glass.contract.test.ts` mesure
    // désormais cette chaîne ; pire cas 7,04:1.
    //
    // La primitive a été ouverte : `--tc-amber-390` (#5a3f18, L 0,389681,
    // teinte 73,5°). Les deux voisines étaient fausses chacune dans un sens —
    // 482 sous le seuil, 300 plus contrastée que `--text-strong` sur le sol.
    theme: 'Clair',
    token: '--warning',
    hex: '#5a3f18',
    onGround: '8,10:1',
    onCard: '8,71:1',
    plateGround: '#deedf0',
    plateInk: '#193940',
    role: 'Réserve, valeur à vérifier',
    glyph: '▲',
  },
  {
    theme: 'Sombre',
    token: '--danger',
    hex: '#f2a3a3',
    onGround: '8,96:1',
    onCard: '9,28:1',
    plateGround: '#0f191c',
    plateInk: '#b6dae3',
    role: 'Échec, perte, action irréversible',
    glyph: '✕',
  },
  {
    theme: 'Sombre',
    token: '--success',
    hex: '#88d6a4',
    onGround: '10,37:1',
    onCard: '10,74:1',
    plateGround: '#0f191c',
    plateInk: '#b6dae3',
    role: 'Confirmation, mesure validée',
    glyph: '✓',
  },
  {
    theme: 'Sombre',
    token: '--warning',
    hex: '#e0c489',
    onGround: '10,57:1',
    onCard: '10,94:1',
    plateGround: '#0f191c',
    plateInk: '#b6dae3',
    role: 'Réserve, valeur à vérifier',
    glyph: '▲',
  },
];
