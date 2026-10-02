import { describe, expect, it } from 'vitest';

import {
  DECOR_BACKDROPS,
  GLASS_BACKDROPS,
  GLASS_LAYERS,
  SEMANTIC_WASHES,
  STATE_WASHES,
  nested,
  resolveBackdrop,
  withWash,
} from './backdrop';
import type { BackdropSpec } from './backdrop';
import { contrastRatio, deltaEOklab, parseRgba } from './color';
import { parseThemes, resolveToken } from './stylesheet';
import type { Theme, ThemeName } from './stylesheet';
import materialsSource from '../tokens/materials.css?raw';
import primitivesSource from '../tokens/primitives.css?raw';
import rolesSource from '../tokens/roles.css?raw';

/**
 * LE CONTRASTE SUR LE VERRE — chaque encre, sur chaque support atteignable,
 * dans les trois thèmes.
 *
 * `tokens.contract.test.ts` mesure une encre contre UN jeton. C'est vrai et
 * insuffisant : le support réel d'une encre de carte est une pile — sol de
 * page, halo, remplissage de verre, lavis d'état — et chaque couche rabote le
 * contraste de la suivante. Ce fichier mesure la pile, via `backdrop.ts`.
 *
 * LE HALO NE FOURNIT PAS LE CONTRASTE, IL LE DÉGRADE, et c'est le fait qui
 * organise tout le fichier. Mesuré ici, en clair, sur `--text-body` :
 * 9,04:1 sur la carte posée sur la page nue, 7,28:1 dès qu'un halo passe
 * dessous, 5,59:1 avec le lavis d'appui par-dessus. Halo absent = MEILLEUR cas.
 * Aucun composant n'a donc à exiger un halo derrière lui ; c'est le contrat qui
 * doit mesurer le pire, et c'est pourquoi les deux bulles sont dans
 * `GLASS_BACKDROPS`.
 *
 * CE QUI EST MESURÉ, ET CE QUI NE L'EST PAS. Seules les couches de `background`
 * sont composées. `backdrop-filter: blur() saturate() brightness()` et le
 * ménisque (`--glass-edge-*`) sont HORS du domaine mesuré : un flou moyenne les
 * pixels du dessous, une saturation déplace la couleur reçue, et rien de cela
 * n'est calculé. Les chiffres de ce fichier sont donc des ESTIMATIONS de ce
 * qu'un navigateur peint — au sens exact où `portfolio/src/index.css:287` emploie
 * ce mot. La liste complète des limites est en tête de `backdrop.ts` ; elle
 * appartient au modèle, pas à ce fichier.
 *
 * LES PIRES CAS SONT ÉCRITS, ÉTIQUETÉS DE LEUR SUPPORT, ET RECALCULÉS. Un
 * ratio en commentaire qui n'est pas rejoué est une affirmation qui se lit
 * comme une vérification. Le § 7 est cette table.
 */

/* ============================================================================
   Seuils.
   ========================================================================== */

const AAA_TEXT = 7; // WCAG 1.4.6 — texte, niveau AAA
const AA_TEXT = 4.5; // WCAG 1.4.3 — texte, niveau AA
const AA_NON_TEXT = 3; // WCAG 1.4.11 — composants d'interface et graphiques

/**
 * Dérive tolérée entre un pire cas DÉCLARÉ au § 7 et sa mesure.
 *
 * La MOITIÉ du dernier chiffre écrit, et pas un centième : à 0,01, déclarer
 * 5,60 pour une mesure de 5,591 passait — l'erreur d'un chiffre dans la table
 * était exactement ce qui ne devait pas passer. À 0,005, seul l'arrondi correct
 * du centième est accepté. Prouvé par échec délibéré avant d'être écrit :
 *
 *   `--text-body` clair, 5.59 → 5.6
 *     FAIL … mesuré 5.591:1, déclaré 5.60:1
 *
 * La conséquence est qu'un pire cas dont la mesure tombe pile sur un demi-
 * centième (`--text-body` sombre vaut 5,1449) s'écrit avec son arrondi VRAI,
 * 5,14 et non 5,15 : la table dit la mesure, pas le chiffre qu'on aurait aimé.
 */
const MAX_RATIO_DRIFT = 0.005;

/**
 * Plancher de perceptibilité du liseré de carte, en ΔE OKLab.
 *
 * Ce n'est PAS un seuil WCAG, et le § 8 explique pourquoi il ne peut pas l'être.
 * 10 est choisi sous le pire cas mesuré (12,53) avec 2,5 de marge : assez pour
 * qu'un halo un peu plus dense ne fasse pas tomber la suite, assez peu pour
 * qu'un liseré qu'on affaiblirait de moitié la fasse tomber.
 */
const MIN_RIM_DELTA_E = 10;

/**
 * Sous ce ΔE OKLab, deux aplats sont la même couleur — même constante et même
 * raison qu'au § 12 de `tokens.contract.test.ts`.
 */
const MAX_MERGE_DELTA_E = 0.5;

const THEME_NAMES = ['light', 'dark-os', 'dark-explicit'] as const satisfies readonly ThemeName[];

/* ============================================================================
   La vraie feuille, dans l'ordre du document. `tokens.css` n'est qu'un point
   d'entrée : ses `@import` ne sont pas résolus par `?raw`, et lire
   `materials.css` avant `roles.css` laisserait `--glass-fill-solid` sans valeur.
   ========================================================================== */

const stylesheet = `${primitivesSource}\n${rolesSource}\n${materialsSource}`;
const themes = parseThemes(stylesheet);

function themeNamed(name: ThemeName): Theme {
  const found = themes.find((theme) => theme.name === name);

  if (found === undefined) {
    throw new Error(
      `thème « ${name} » absent — reçus : ${themes.map((theme) => theme.name).join(', ') || '(aucun)'}`,
    );
  }

  return found;
}

function tokenOf(name: ThemeName, token: string): string {
  return resolveToken(themeNamed(name), token);
}

function backdropOf(name: ThemeName, backdrop: BackdropSpec): string {
  return resolveBackdrop(themeNamed(name), backdrop);
}

function ratioOn(name: ThemeName, ink: string, backdrop: BackdropSpec): number {
  return contrastRatio(tokenOf(name, ink), backdropOf(name, backdrop));
}

/** Asserts a contrast floor and reports the measured value plus the shortfall. */
function expectRatio(measured: number, minimum: number, subject: string): void {
  expect(
    measured,
    `${subject} — mesuré ${measured.toFixed(2)}:1, exigé ${minimum}:1 (manque ${Math.max(
      0,
      minimum - measured,
    ).toFixed(2)})`,
  ).toBeGreaterThanOrEqual(minimum);
}

/* ============================================================================
   Les encres, groupées par EMPLOI — c'est l'emploi qui décide du seuil.
   ========================================================================== */

/**
 * Les cinq encres qu'une carte porte réellement : titre, texte courant, texte
 * secondaire, encre d'accent, surtitre éditorial. Ce sont les rôles de texte de
 * `roles.css`, et la liste est celle que le portfolio a établie règle par règle
 * (`.timeline .company`, `.project-card p`, `.accessibility-status`,
 * `.project-date`, `.eyebrow`).
 */
const CARD_INKS: readonly string[] = [
  '--text-strong',
  '--text-body',
  '--text-muted',
  '--text-accent',
  '--accent-secondary',
];

/**
 * Les trois encres sémantiques. Elles vivent sur une carte comme les autres —
 * un message d'erreur est du texte —, donc même seuil AA.
 */
const SEMANTIC_INKS: readonly string[] = ['--danger', '--success', '--warning'];

const TEXT_INKS: readonly string[] = [...CARD_INKS, ...SEMANTIC_INKS];

/** Tous les supports atteignables : les cinq nus, et les quinze sous lavis. */
const WASHED_BACKDROPS: readonly BackdropSpec[] = GLASS_BACKDROPS.flatMap((backdrop) =>
  STATE_WASHES.map((wash) => withWash(backdrop, wash)),
);

const ALL_BACKDROPS: readonly BackdropSpec[] = [...GLASS_BACKDROPS, ...WASHED_BACKDROPS];

/** Le support nommé dans `GLASS_BACKDROPS`, retrouvé par sa pile et non par son rang. */
function glassBackdrop(layers: readonly unknown[]): BackdropSpec {
  const found = GLASS_BACKDROPS.find(
    (backdrop) => JSON.stringify(backdrop.layers) === JSON.stringify(layers),
  );

  if (found === undefined) {
    throw new Error(`aucun support de GLASS_BACKDROPS ne porte la pile ${JSON.stringify(layers)}`);
  }

  return found;
}

const BARE_PAGE = glassBackdrop([GLASS_LAYERS.page]);
const CARD_ON_PAGE = glassBackdrop([GLASS_LAYERS.page, GLASS_LAYERS.glassFill]);
const CARD_ON_COOL = glassBackdrop([
  GLASS_LAYERS.page,
  GLASS_LAYERS.coolHalo,
  GLASS_LAYERS.glassFill,
]);
const CARD_ON_WARM = glassBackdrop([
  GLASS_LAYERS.page,
  GLASS_LAYERS.warmHalo,
  GLASS_LAYERS.glassFill,
]);
const OPAQUE_CARD = glassBackdrop([GLASS_LAYERS.opaqueCard]);

/* ========================================================================== */

describe('1. Les deux chemins vers le sombre composent le MÊME support', () => {
  /*
   * `dark-os` sert la préférence système et `dark-explicit` le choix de
   * l'utilisateur. Les blocs sont dupliqués à la main dans les deux feuilles ;
   * le § 9 de `tokens.contract.test.ts` vérifie que les JETONS ne divergent pas,
   * ce § vérifie que les SUPPORTS COMPOSÉS n'ont pas divergé non plus. Ce n'est
   * pas le même contrôle : une divergence sur `--halo-opacity` seule laisse
   * chaque jeton coloré identique et déplace pourtant les vingt supports.
   */
  it.each(ALL_BACKDROPS.map((backdrop) => ({ label: backdrop.label, backdrop })))(
    '$label',
    ({ backdrop }) => {
      expect(backdropOf('dark-explicit', backdrop)).toBe(backdropOf('dark-os', backdrop));
    },
  );
});

describe('2. Le remplissage de verre : ce qu’il achète, et son plafond', () => {
  /*
   * `materials.css` justifie l'alpha 0,40 du verre clair par une mesure : le
   * remplissage lève la carte de 1,078:1 contre le sol, quand le blanc PUR ne
   * la lèverait qu'à 1,202:1. « Il n'y a plus rien à acheter en blanchissant »
   * est donc une affirmation arithmétique, et ce § la rejoue. C'est elle qui
   * force la séparation de la carte à passer par le liseré (§ 8) et par l'ombre.
   */
  it('en clair, le verre lève la carte de 1,078:1 contre le sol', () => {
    expect(ratioOn('light', '--site-background', CARD_ON_PAGE)).toBeCloseTo(1.078, 3);
  });

  it('en clair, le blanc PUR plafonne à 1,202:1 — le verre en prend déjà les deux tiers', () => {
    const white = resolveBackdrop(themeNamed('light'), {
      label: 'une carte blanc pur',
      layers: [GLASS_LAYERS.page, { token: '--tc-white' }],
    });

    expect(contrastRatio(white, tokenOf('light', '--site-background'))).toBeCloseTo(1.202, 3);
  });

  it('en sombre, le verre CREUSE la carte de 1,037:1 — la polarité s’inverse, pas le modèle', () => {
    expect(ratioOn('dark-os', '--site-background', CARD_ON_PAGE)).toBeCloseTo(1.037, 3);
  });

  it.each(THEME_NAMES)('le repli opaque est la MÊME carte que le verre composé — %s', (name) => {
    /*
     * `--glass-fill-solid` est un alias de `--surface`, servi quand
     * `backdrop-filter` manque. S'il rendait une autre carte, la moitié des
     * navigateurs verrait une palette non mesurée. Mesuré : ΔE OKLab 0,06 en
     * clair et 0,10 en sombre — la même couleur, à un centième près.
     */
    const drift = deltaEOklab(backdropOf(name, CARD_ON_PAGE), backdropOf(name, OPAQUE_CARD));

    expect(
      drift,
      `le repli opaque dérive de ΔE ${drift.toFixed(3)} du verre composé en ${name}`,
    ).toBeLessThan(MAX_MERGE_DELTA_E);
  });
});

describe('3. Le halo DÉGRADE le contraste, il ne le fournit jamais', () => {
  /*
   * L'inversion à ne pas faire, et la raison d'être de tout ce fichier. Le halo
   * tire la carte vers la mi-luminosité : sur un thème clair il l'assombrit, sur
   * un thème sombre il l'éclaircit, et dans les deux cas il RAPPROCHE le support
   * de l'encre. Une palette validée contre `--site-background` seul est validée
   * contre le meilleur cas.
   *
   * Le § est restreint aux encres de TEXTE, et c'est une limite du fait, pas une
   * commodité : une encre dont la clarté est voisine de celle du support — par
   * exemple `--focus-inner`, à 1,08:1 sur la carte claire — est au contraire
   * AMÉLIORÉE par le halo. Ce qui est vrai pour tout le monde, c'est que le halo
   * déplace ; ce qui est vrai des encres de lecture, c'est qu'il leur coûte.
   */
  it.each(
    THEME_NAMES.flatMap((theme) =>
      TEXT_INKS.flatMap((ink) =>
        [CARD_ON_COOL, CARD_ON_WARM].map((halo) => ({ theme, ink, halo, label: halo.label })),
      ),
    ),
  )('$ink perd du contraste sur « $label » — $theme', ({ theme, ink, halo }) => {
    const best = ratioOn(theme, ink, CARD_ON_PAGE);
    const measured = ratioOn(theme, ink, halo);

    expect(
      measured,
      `${ink} en ${theme} : ${measured.toFixed(2)}:1 sur ${halo.label} contre ` +
        `${best.toFixed(2)}:1 sur la carte posée sur la page nue. Si le halo se met à ` +
        'AMÉLIORER le contraste, ce n’est plus le pire cas et l’enveloppe du § 7 mesure à côté.',
    ).toBeLessThan(best);
  });
});

describe('4. Toute encre de texte tient AA sur les cinq supports NUS', () => {
  /*
   * Le seul § dont la portée est universelle : une encre de texte peut être
   * posée sur n'importe laquelle des cinq cartes, sans lavis, par n'importe
   * quel composant. C'est donc la contrainte que la palette doit tenir partout.
   *
   * Pires cas mesurés, chacun étiqueté du support qui l'a produit :
   *   --accent-secondary  4,58:1  la carte sur le halo froid   (sombre)
   *   --text-muted        5,86:1  la carte sur le halo froid   (clair)
   * Soit 0,08 de marge pour le cuivre sombre : ce test tombera au premier halo
   * sensiblement plus clair, et c'est ce qu'on lui demande.
   *
   * `--warning` occupait la seconde ligne à 4,75:1 tant que l'ambre clair était
   * `--tc-amber-482`. Il tient 9,97:1 depuis que le § 9 a fait tomber cette
   * encre ; ce n'est plus une encre tendue de la palette, c'est la plus large.
   */
  it.each(
    THEME_NAMES.flatMap((theme) =>
      TEXT_INKS.flatMap((ink) =>
        GLASS_BACKDROPS.map((backdrop) => ({ theme, ink, backdrop, label: backdrop.label })),
      ),
    ),
  )('$ink sur « $label » — $theme', ({ theme, ink, backdrop }) => {
    expectRatio(
      ratioOn(theme, ink, backdrop),
      AA_TEXT,
      `${ink} sur ${backdrop.label} (${backdropOf(theme, backdrop)}) en ${theme}`,
    );
  });
});

describe('5. Les deux encres de lecture tiennent AAA sur les cinq supports nus', () => {
  /*
   * `--text-strong` et `--text-body` portent le texte long : la cible est
   * WCAG 1.4.6, pas 1.4.3. Pire cas mesuré : `--text-body` à 7,28:1 sur la
   * carte sur le halo froid en clair — 0,28 de marge sur 7:1. Les trois autres
   * encres de carte ne sont PAS tenues à AAA, et c'est délibéré : `--text-muted`
   * y tombe à 5,86:1 au même endroit, et exiger AAA d'une encre secondaire la
   * ferait converger sur l'encre forte, ce que le plancher de ΔE de
   * `tokens.contract.test.ts` interdit par ailleurs.
   */
  const READING_INKS = ['--text-strong', '--text-body'] as const;

  it.each(
    THEME_NAMES.flatMap((theme) =>
      READING_INKS.flatMap((ink) =>
        GLASS_BACKDROPS.map((backdrop) => ({ theme, ink, backdrop, label: backdrop.label })),
      ),
    ),
  )('$ink sur « $label » — $theme', ({ theme, ink, backdrop }) => {
    expectRatio(
      ratioOn(theme, ink, backdrop),
      AAA_TEXT,
      `${ink} sur ${backdrop.label} (${backdropOf(theme, backdrop)}) en ${theme}`,
    );
  });
});

describe('6. --control-border tient 3:1 sur les VINGT supports, lavis compris', () => {
  /*
   * WCAG 1.4.11 : le liseré est le seul indice visible d'un champ ou d'un bouton
   * secondaire, donc son seuil est un vrai plancher, pas une préférence. Et
   * contrairement aux encres de texte, un contrôle se pose bien sur un lavis
   * d'état — c'est même sa raison d'être —, donc les quinze supports sous lavis
   * sont dans la portée.
   *
   * Pire cas mesuré : 3,18:1 en clair et 3,27:1 en sombre, tous deux sur la
   * carte sur le halo froid sous le lavis d'appui.
   *
   * CE § N'EST PAS LE PIRE CAS ABSOLU DU JETON, et il ne prétend pas l'être :
   * le § 15 de `tokens.contract.test.ts` ajoute la TUILE D'ICÔNE dans la pile et
   * descend à 3,01:1 (clair) et 3,09:1 (sombre). La tuile est une couche de
   * composant, pas un support de carte, donc elle n'entre pas dans
   * `GLASS_BACKDROPS` ; les deux chaînes s'enchaînent proprement — même sol,
   * une couche de plus, deux dixièmes de moins.
   */
  it.each(
    THEME_NAMES.flatMap((theme) =>
      ALL_BACKDROPS.map((backdrop) => ({ theme, backdrop, label: backdrop.label })),
    ),
  )('« $label » — $theme', ({ theme, backdrop }) => {
    expectRatio(
      ratioOn(theme, '--control-border', backdrop),
      AA_NON_TEXT,
      `--control-border sur ${backdrop.label} (${backdropOf(theme, backdrop)}) en ${theme}`,
    );
  });
});

/* ============================================================================
   § 7 — L'ENVELOPPE.
   ========================================================================== */

/**
 * Le pire support de toute la palette, mesuré : la carte sur le halo FROID sous
 * le lavis d'APPUI. Quatre couches — page, halo, verre, lavis — et c'est
 * l'argument minimal des neuf encres dans les trois thèmes, sans exception.
 *
 * Le halo froid bat le chaud de peu (3,18:1 contre 3,19:1 pour
 * `--control-border` en clair), ce qui est cohérent avec la parité de présence
 * que le § 14 de `tokens.contract.test.ts` épingle sur les deux bulles.
 */
const WORST_BACKDROP = withWash(CARD_ON_COOL, '--panel-surface-active');

interface WorstCase {
  readonly ink: string;
  /** Le plancher WCAG applicable à l'emploi de cette encre. */
  readonly floor: number;
  /** Pire ratio de toute l'enveloppe, thème clair. */
  readonly light: number;
  /** Le même, thème sombre — identique dans `dark-os` et `dark-explicit` (§ 1). */
  readonly dark: number;
  /**
   * Renseigné SEULEMENT quand le pire cas passe sous `floor`, et il dit alors
   * ce qu'un composant doit faire à la place. Une palette qui remonterait au-
   * dessus du seuil fait ÉCHOUER l'entrée : la liste ne peut pas rester
   * périmée.
   */
  readonly shortfall?: string;
}

/**
 * Les pires cas, encre par encre, sur les vingt supports.
 *
 * CE QUE CETTE TABLE EST. Une librairie ne sait pas quelles règles ses
 * consommateurs écriront : elle ne peut donc pas décréter que `--warning` sur un
 * lavis d'appui est interdit, ni prétendre que ce couple tient AA. Ce qu'elle
 * peut faire, et ce que fait cette table, c'est PUBLIER le plafond de chaque
 * encre avec le support qui le produit, et le recalculer à chaque exécution.
 * Un auteur de composant y lit ce qu'il ne doit pas faire ; la CI y vérifie que
 * personne ne l'a déplacé sans le dire.
 *
 * Les quatre `shortfall` ne sont pas des dettes déguisées : ce sont les seuls
 * couples encre × support où la palette ne tient pas AA, ils sont nommés, et
 * chacun porte l'encre de remplacement qui tient au même endroit.
 */
const WORST_CASES: readonly WorstCase[] = [
  { ink: '--text-strong', floor: AA_TEXT, light: 6.85, dark: 6.12 },
  { ink: '--text-body', floor: AA_TEXT, light: 5.59, dark: 5.14 },
  {
    ink: '--text-muted',
    floor: AA_TEXT,
    light: 4.5,
    dark: 4.31,
    shortfall:
      'en sombre, l’encre secondaire ne passe pas le lavis d’APPUI au-dessus d’un halo. Elle ' +
      'tient 7,00:1 au lavis de repos et 6,67:1 sur la carte nue : c’est l’appui, et lui seul, ' +
      'qui est hors budget. Un composant qui garde du texte secondaire visible pendant l’appui ' +
      'passe à --text-body (5,15:1 au même endroit).',
  },
  {
    ink: '--text-accent',
    floor: AA_TEXT,
    light: 4.4,
    dark: 4.23,
    shortfall:
      'ce manquement est celui du TEXTE, pas celui du LISERÉ, et la distinction est la même que ' +
      'celle du § 6 pour --control-border. En TEXTE (WCAG 1.4.3, 4,5:1), l’encre d’accent ne se ' +
      'pose pas sur un lavis d’APPUI au-dessus d’un halo, dans aucun des deux thèmes : c’est ' +
      'l’arbitrage que le portfolio avait fait à la main, son lavis d’appui ne portant que ' +
      '--text-strong (6,85:1 clair, 6,12:1 sombre sur ce même support). En LISERÉ (WCAG 1.4.11, ' +
      '3:1) le même couple est LÉGITIME, mesuré 4,40:1 en clair et 4,23:1 en sombre, soit 1,40 ' +
      'et 1,23 de marge sur le seuil applicable — la note d’origine interdisait donc en toutes ' +
      'lettres un emploi licite. L’exemple qui l’avait fait tomber était ' +
      '`.tc-btn--secondary:hover`, qui posait `border-color: var(--text-accent)` sur un lavis ' +
      'd’appui ; cette feuille a été SUPPRIMÉE en 1.0 avec les dix-huit composants d’Opale, et ' +
      'aucun composant du paquet n’exerce plus ce couple — `src/opale` n’emploie aucun jeton. Le ' +
      'plancher reste celui du TEXTE : il tient le jeton, pas son unique usage passé.',
  },
  {
    ink: '--accent-secondary',
    floor: AA_TEXT,
    light: 4.75,
    dark: 2.96,
    shortfall:
      'le cuivre est ÉDITORIAL — surtitre, date, décor — et jamais un contrôle : il n’a donc ' +
      'rien à faire sur un lavis d’état, qui est une couche d’INTERACTION. Sur les cinq ' +
      'supports nus, son pire cas reste 4,58:1 (sombre, carte sur le halo froid). En sombre, ' +
      'sur le lavis d’appui au-dessus du halo froid, il tombe à 2,96:1 — sous AA et même sous ' +
      '3:1. C’est la mesure la plus basse de toute la table.',
  },
  { ink: '--danger', floor: AA_TEXT, light: 6.9, dark: 4.57 },
  { ink: '--success', floor: AA_TEXT, light: 5.36, dark: 5.28 },
  /*
   * L'EXEMPTION DE `--warning` A ÉTÉ RETIRÉE, ET C'EST LE § 9 QUI L'A FAIT
   * TOMBER. Elle disait « une mention d'avertissement se pose sur une carte
   * NUE, où son pire cas est 4,75:1 » — une consigne que la librairie ne
   * pouvait pas tenir, puisque `.tc-message--warn` ne se posait pas sur une
   * carte nue : il peignait son propre lavis, et `Backdrop` l'autorisait à le
   * faire au-dessus d'un halo sans carte du tout. Mesurée, cette chaîne valait
   * 3,35:1. Les deux composants nommés ici ont été supprimés en 1.0 ; la chaîne
   * de superposition qui les a fait tomber, elle, reste calculable depuis
   * `materials.css`, et c'est elle que la table rejoue — pas eux.
   * L'ambre clair a donc été remplacé par `--tc-amber-300` dans `roles.css` (et
   * l'ambre juste, à ouvrir en primitive, est nommé là-bas). Le pire cas de
   * cette table remonte du même coup de 3,65 à 5,395 — et non à 7,65 comme
   * l'annonçait la version intermédiaire de cette table, calée sur
   * `--tc-amber-300`. Cette primitive tenait le seuil mais passait DEVANT
   * `--text-strong` (10,28:1) sur le sol : une encre d'avertissement plus
   * contrastée que l'encre forte est une faute d'apparence. `--tc-amber-390`
   * a été battue pour cet emploi, avec 4,96:1 au pire au § 9.
   */
  { ink: '--warning', floor: AA_TEXT, light: 5.395, dark: 5.38 },
  { ink: '--control-border', floor: AA_NON_TEXT, light: 3.18, dark: 3.27 },
];

describe('7. L’enveloppe : le pire cas de chaque encre, étiqueté de son support', () => {
  function worstOf(theme: ThemeName, ink: string): { ratio: number; label: string } {
    return ALL_BACKDROPS.map((backdrop) => ({
      ratio: ratioOn(theme, ink, backdrop),
      label: backdrop.label,
    })).reduce((worst, candidate) => (candidate.ratio < worst.ratio ? candidate : worst));
  }

  it.each(
    THEME_NAMES.flatMap((theme) => WORST_CASES.map((worstCase) => ({ theme, ...worstCase }))),
  )('$ink — $theme', ({ theme, ink, light, dark, floor, shortfall }) => {
    const declared = theme === 'light' ? light : dark;
    const measured = worstOf(theme, ink);

    // (a) LE SUPPORT. Si le pire cas change de support, la table ne mesure plus
    //     ce qu'elle prétend mesurer, même si le nombre tombe juste par hasard.
    expect(
      measured.label,
      `en ${theme}, le pire support de ${ink} est « ${measured.label} » et non ` +
        `« ${WORST_BACKDROP.label} ». Le pire cas a bougé de place : remesurez les neuf encres ` +
        'avant de retoucher cette table.',
    ).toBe(WORST_BACKDROP.label);

    // (b) LE NOMBRE.
    expect(
      Math.abs(measured.ratio - declared),
      `${ink} en ${theme} sur ${measured.label} — mesuré ${measured.ratio.toFixed(3)}:1, ` +
        `déclaré ${declared.toFixed(2)}:1. Écrivez la mesure, ne déplacez pas la tolérance.`,
    ).toBeLessThanOrEqual(MAX_RATIO_DRIFT);

    // (c) LE VERDICT, dans les deux sens. Une exemption qui n'est plus
    //     nécessaire doit être SUPPRIMÉE, sans quoi la table finit par
    //     autoriser ce que la palette tient déjà.
    if (shortfall === undefined) {
      expectRatio(measured.ratio, floor, `${ink} sur ${measured.label} en ${theme}`);
    } else {
      const worstOfBoth = Math.min(light, dark);

      expect(
        worstOfBoth,
        `${ink} porte une note de manquement alors que son pire cas des deux thèmes vaut ` +
          `${worstOfBoth.toFixed(2)}:1, au-dessus du plancher de ${floor}:1. La palette a ` +
          'progressé : retirez le `shortfall` au lieu de le laisser exempter une encre qui ' +
          'n’en a plus besoin.',
      ).toBeLessThan(floor);
    }
  });

  it('n’exempte que ce qui est nommé', () => {
    // La contrepartie du (c) : le nombre d'exemptions est lui-même épinglé, pour
    // qu'en ajouter une soit une modification visible en revue et non une ligne
    // de plus dans une liste que personne ne recompte.
    expect(
      WORST_CASES.filter((worstCase) => worstCase.shortfall !== undefined).map((w) => w.ink),
    ).toStrictEqual(['--text-muted', '--text-accent', '--accent-secondary']);
  });

  /*
   * LA MOITIÉ VRAIE DE L'EXEMPTION DE `--text-accent`, REJOUÉE.
   *
   * Sa note dit deux choses : le teal ne porte pas de TEXTE sur un lavis
   * d'appui (mesuré au (b) ci-dessus, sous 4,5:1) et il y porte légitimement un
   * LISERÉ (WCAG 1.4.11, 3:1). La seconde moitié était une affirmation en
   * prose ; sans ce bloc, la table pouvait interdire ce que
   * `.tc-btn--secondary:hover` faisait à bon droit sans que rien ne le
   * signale. Ce bouton n'existe plus depuis la 1.0, et le bloc reste : il ne
   * garde pas un composant, il garde le fait qu'un liseré d'accent sur un lavis
   * d'appui est licite — vrai pour le prochain composant qui l'emploiera.
   *
   * Le `floor` de la table reste AA_TEXT, et c'est correct : une encre qui sert
   * DEUX emplois est tenue par le plus exigeant, et la note nomme l'autre.
   */
  it.each(
    THEME_NAMES.flatMap((theme) =>
      ALL_BACKDROPS.map((backdrop) => ({ theme, backdrop, label: backdrop.label })),
    ),
  )('--text-accent tient le seuil du LISERÉ sur « $label » — $theme', ({ theme, backdrop }) => {
    expectRatio(
      ratioOn(theme, '--text-accent', backdrop),
      AA_NON_TEXT,
      `--text-accent EN LISERÉ sur ${backdrop.label} (${backdropOf(theme, backdrop)}) en ${theme}`,
    );
  });

  it('couvre toutes les encres mesurées par les §§ 4 à 6', () => {
    expect(WORST_CASES.map((worstCase) => worstCase.ink)).toStrictEqual([
      ...TEXT_INKS,
      '--control-border',
    ]);
  });
});

describe('8. --glass-border : un bord perceptible, et pas un composant', () => {
  /*
   * SEUIL DE PERCEPTIBILITÉ, PAS LES 3:1 DE WCAG 1.4.11 — un choix argumenté,
   * pas un oubli, et repris tel quel du portfolio.
   *
   * 1.4.11 porte sur « l'information visuelle nécessaire pour identifier les
   * composants d'interface ». Une carte de verre est un CONTENEUR décoratif :
   * rien n'a besoin de son liseré pour être identifié ni actionné, et les vraies
   * bordures de contrôle sont mesurées à 3:1 au § 6. Exiger 3:1 ici imposerait un
   * trait d'encre franc sur une carte claire — c'est-à-dire bloquerait une
   * palette valide. Mesuré, ce liseré tient entre 1,66:1 et 1,74:1 en clair, et
   * `materials.css` documente cette valeur comme voulue, la séparation étant
   * portée par l'ombre (`--glass-shadow`, ΔE 20,6 contre le sol clair).
   *
   * Ce qui est donc exigé est la PERCEPTIBILITÉ du bord, en ΔE OKLab. Mesuré :
   * 16,75 contre la page nue en clair et 18,50 en sombre — les deux chiffres que
   * `materials.css` annonce arrondis à 16,7 et 18,5 —, et jamais moins de 13,99
   * (clair) ni 12,53 (sombre) sur l'ensemble des vingt supports.
   *
   * LE PIXEL MESURÉ. Le fond de la carte est peint SOUS la bordure
   * (`background-clip: border-box` par défaut), donc le pixel de bordure vaut
   * `--glass-border` composé sur le support, et c'est au support qu'on le
   * compare.
   */
  function rimDeltaE(theme: ThemeName, backdrop: BackdropSpec): number {
    const support = backdropOf(theme, backdrop);
    const rim = resolveBackdrop(themeNamed(theme), {
      label: `le liseré sur ${backdrop.label}`,
      layers: [...backdrop.layers, { token: '--glass-border' }],
    });

    return deltaEOklab(rim, support);
  }

  it('le liseré est translucide — il n’a donc pas de contraste propre', () => {
    // La raison pour laquelle ce § compose au lieu de mesurer le jeton : un
    // `rgba()` mesuré seul rendrait son ratio contre du blanc pur.
    for (const theme of THEME_NAMES) {
      expect(parseRgba(tokenOf(theme, '--glass-border')).alpha).toBeLessThan(1);
    }
  });

  it('vaut ΔE 16,75 contre la page nue en clair — le chiffre de materials.css', () => {
    expect(rimDeltaE('light', BARE_PAGE)).toBeCloseTo(16.75, 2);
  });

  it('vaut ΔE 18,50 contre la page nue en sombre, où c’est LUI qui détache la carte', () => {
    expect(rimDeltaE('dark-os', BARE_PAGE)).toBeCloseTo(18.5, 2);
  });

  it.each(
    THEME_NAMES.flatMap((theme) =>
      ALL_BACKDROPS.map((backdrop) => ({ theme, backdrop, label: backdrop.label })),
    ),
  )('reste perceptible sur « $label » — $theme', ({ theme, backdrop }) => {
    const measured = rimDeltaE(theme, backdrop);

    expect(
      measured,
      `--glass-border sur ${backdrop.label} en ${theme} — ΔE ${measured.toFixed(2)}, ` +
        `plancher ${MIN_RIM_DELTA_E}. Sous ce plancher la carte n’a plus de bord : ` +
        'l’ombre portée est le seul relais, et elle est quasi inopérante en sombre.',
    ).toBeGreaterThanOrEqual(MIN_RIM_DELTA_E);
  });
});

describe('9. Une encre sémantique tient AA sur SON PROPRE lavis, verre et halos compris', () => {
  /*
   * LE TROU QUE LES §§ 4 À 7 NE VOYAIENT PAS, ET IL A COÛTÉ UN ÉCHEC RÉEL.
   *
   * Trois mesures existaient, et aucune ne regardait le bon support :
   *
   *  - le § 4 mesure les encres sémantiques sur les cinq cartes NUES. Vrai, mais
   *    `Message` ne se pose jamais sur une carte nue : il peint son propre fond ;
   *  - le § 7 publie leur pire cas sur les vingt supports, lavis d'ÉTAT compris.
   *    Un lavis d'état n'est pas le fond d'un `Message` — c'est une couche
   *    d'interaction — donc ce chiffre ne décrit pas ce rendu-ci non plus ;
   *  - le § 11 de `tokens.contract.test.ts` mesure bien l'encre sur son propre
   *    lavis, mais sur trois aplats OPAQUES (`--site-background`, `--surface`,
   *    `--panel-surface` composé sur la carte), écrits avant que le verre et les
   *    halos n'existent.
   *
   * Résultat : `.tc-message--warn` posait `--warning` sur `--warning-quiet` à
   * `font-size: var(--text-base)` — donc 4,5:1 exigé par WCAG 1.4.3, pas 3:1 —
   * et personne ne mesurait la chaîne réelle. Elle valait 4,17:1 sur une carte
   * au-dessus d'un halo, et 3,35:1 sur le décor nu au-dessus du même halo.
   *
   * LES DEUX SUPPORTS DE DÉCOR NU SONT DANS LA PORTÉE ICI, ET NULLE PART
   * AILLEURS. `Backdrop` rend ses disques puis SES ENFANTS, sans rien exiger
   * d'eux : un `Message` qui n'est pas dans une `Card` a le halo pour seul
   * substrat. C'est le pire support atteignable de la librairie, et il n'entre
   * pas dans `GLASS_BACKDROPS` — voir la note de `DECOR_BACKDROPS`, qui dit
   * pourquoi le produit avec les lavis d'ÉTAT, lui, décrirait un rendu fictif.
   *
   * NEUF ASSERTIONS, une par ton et par thème, chacune mesurant les SEPT
   * supports et rapportant le pire avec son nom. Le seuil est AA_TEXT sans
   * exception possible : un bandeau d'état est du texte courant.
   */
  const TONES = ['danger', 'success', 'warning'] as const;
  const SUPPORTS: readonly BackdropSpec[] = [...GLASS_BACKDROPS, ...DECOR_BACKDROPS];

  it('nomme un lavis sémantique par ton, et rien de plus', () => {
    // Sans cette garde, un ton retiré de `SEMANTIC_WASHES` viderait le produit
    // en silence et le bloc resterait vert en ne mesurant plus ce ton.
    expect([...SEMANTIC_WASHES].sort()).toStrictEqual(
      TONES.map((tone) => `--${tone}-quiet`).sort(),
    );
  });

  it.each(THEME_NAMES.flatMap((theme) => TONES.map((tone) => ({ theme, tone }))))(
    '--$tone sur --$tone-quiet — $theme',
    ({ theme, tone }) => {
      const worst = SUPPORTS.map((backdrop) => {
        const washed = withWash(backdrop, `--${tone}-quiet`);

        return { label: washed.label, ratio: ratioOn(theme, `--${tone}`, washed) };
      }).reduce((worse, candidate) => (candidate.ratio < worse.ratio ? candidate : worse));

      expectRatio(worst.ratio, AA_TEXT, `--${tone} sur ${worst.label} en ${theme}`);
    },
  );
});

/* ============================================================================
   § 10 — LA MONOTONIE DE L'IMBRICATION.

   C'EST LE § QUI AUTORISE LES §§ 4 À 7 À NE PAS ÉCRIRE VINGT SUPPORTS DE PLUS.

   Sous le thème verre, un contrôle de verre posé dans une carte de verre met son
   encre sur `page → halo → remplissage → remplissage → lavis` : une couche de
   plus que le pire cas de `GLASS_BACKDROPS`. Naïvement, il faudrait donc rouvrir
   la liste fermée des cinq supports, la doubler pour l'imbrication simple, la
   tripler pour la double — et remesurer les neuf encres sur chacun.

   LE THÉORÈME QUI L'ÉVITE. Chaque remplissage de verre supplémentaire ÉLOIGNE le
   support de l'encre de lecture : en clair `--glass-fill` est un voile blanc,
   donc le support blanchit ; en sombre c'est un lavis d'encre, donc il creuse ;
   et dans les deux cas l'encre de lecture est de l'AUTRE côté. Le ratio est donc
   croissant en profondeur, la profondeur 1 est le PLANCHER, et l'enveloppe déjà
   publiée par le § 7 reste l'enveloppe en mode verre.

   SI CE BLOC ROUGIT, IL N'Y A PLUS RIEN À DÉDUIRE. L'enveloppe du § 7 ne borne
   alors plus les supports imbriqués, et il faut réellement les écrire : deux
   halos × trois profondeurs × quatre états de lavis, remesurés pour les neuf
   encres. C'est la valeur exacte de ce §, et c'est pourquoi il mesure la chaîne
   entière au lieu de faire confiance au sens de `--glass-fill`.

   ================== CE QUE CE § NE MESURE PAS, ET NE PEUT PAS ================

   Les limites du modèle sont en tête de `backdrop.ts` ; l'imbrication en ajoute
   trois, et la première est la plus grave de tout le contrat :

    1. LE RAYON DE FLOU EXCÈDE L'ÉLÉMENT SUR UN CONTRÔLE. `--glass-blur` vaut
       32 px, un `<input>` fait 44 px de haut : le filtre échantillonne au-DELÀ
       du contrôle. Son arrière-plan effectif est une moyenne de voisinage qui
       inclut ce qui est À CÔTÉ, pas seulement ce qui est DERRIÈRE. Pour une
       carte de 300 px, « la carte est entièrement posée sur un halo » reste un
       pire cas défendable ; pour un contrôle, aucune arithmétique de couches ne
       peut l'exprimer. Les piles de ce § bornent l'empilement des `background`,
       pas ce qu'un moteur mélange.
    2. DEUX `backdrop-filter` IMBRIQUÉS. Selon le moteur, l'enfant échantillonne
       la sortie DÉJÀ FILTRÉE du parent, ou la page brute. Le modèle suppose
       l'empilement des fonds, ce qui ne décrit exactement ni l'un ni l'autre.
    3. `blur() saturate() brightness()` reste hors du domaine mesuré — la tête de
       ce fichier le dit déjà, et les chiffres ci-dessous sont donc des
       ESTIMATIONS, au sens exact où le dépôt emploie ce mot. Un thème qui pousse
       le `saturate()` déplace la couleur reçue sans qu'aucun test bouge.
   ========================================================================== */

/**
 * LA PORTÉE DU § 10, DÉCLARÉE — les neuf encres de l'enveloppe du § 7.
 *
 * Ce sont les encres de LECTURE (les cinq rôles de texte de la carte, les trois
 * encres sémantiques) et le liseré de contrôle. Pas une commodité : c'est le
 * domaine exact où le théorème est vrai, et l'exclusion est nommée juste en
 * dessous.
 */
const NESTED_INKS: readonly string[] = [...TEXT_INKS, '--control-border'];

/**
 * L'EXCLUSION, NOMMÉE ET JUSTIFIÉE — comme `THEME_INVARIANT` le fait ailleurs.
 *
 * La monotonie ne vaut que pour les encres de lecture. Une encre dont la clarté
 * est du MÊME côté que le remplissage est au contraire DÉGRADÉE par
 * l'imbrication : `--focus-inner` est un citron quasi blanc en clair
 * (`#f6ffde`), donc un verre qui blanchit le support le rapproche d'elle.
 * Mesuré sur la carte au halo froid sous le lavis d'appui : 1,74:1 à la
 * profondeur 1, 1,53:1 à 2, 1,42:1 à 3 — et 2,31:1 → 2,08:1 → 1,92:1 en sombre.
 *
 * CE N'EST PAS UN MANQUEMENT. Cette encre n'est jamais mesurée contre une carte :
 * c'est le disque INTÉRIEUR de l'anneau de focus, qui se pose sur l'aplat
 * `--accent` et sur `--focus-outer`, et le § 7 de `tokens.contract.test.ts` la
 * mesure là — aux deux seuls endroits où un navigateur la peint. Le contre-
 * exemple est rejoué ci-dessous plutôt que caché : un théorème dont le domaine
 * n'est pas éprouvé est une généralisation qui attend de se faire prendre.
 */
const NESTING_EXCLUDED_INK = '--focus-inner';

/** Les profondeurs mesurées : le nombre TOTAL de remplissages de verre. */
const NESTING_DEPTHS = [1, 2, 3] as const;

/**
 * Les deux sols halotés, `page → halo`, SANS remplissage.
 *
 * C'est la base sur laquelle `nested` empile : `nested(sol, n)` vaut donc
 * `page → halo → n remplissages`, et `n` se lit comme le nombre de verres
 * traversés. La profondeur 1 doit rendre la pile de carte DÉJÀ publiée dans
 * `GLASS_BACKDROPS`, ce que le premier test de ce § vérifie — sans quoi ce bloc
 * mesurerait une chaîne voisine de celle du § 7 et en déduirait des bornes pour
 * elle.
 */
const HALOED_GROUNDS = [
  {
    label: 'le halo froid',
    ground: { label: 'le halo froid', layers: [GLASS_LAYERS.page, GLASS_LAYERS.coolHalo] },
    card: CARD_ON_COOL,
  },
  {
    label: 'le halo chaud',
    ground: { label: 'le halo chaud', layers: [GLASS_LAYERS.page, GLASS_LAYERS.warmHalo] },
    card: CARD_ON_WARM,
  },
] as const satisfies readonly {
  label: string;
  ground: BackdropSpec;
  card: BackdropSpec;
}[];

/**
 * Le sol du support que le § 7 publie comme pire cas — la bulle FROIDE — et le
 * lavis d'APPUI qui le complète. La table de l'échelle ci-dessous est mesurée
 * là, et nulle part ailleurs : c'est ce qui fait que sa colonne `n=1` doit
 * retomber sur les chiffres de `WORST_CASES`.
 */
const WORST_GROUND: BackdropSpec = HALOED_GROUNDS[0].ground;
const WORST_WASH = '--panel-surface-active';

/** `page → halo → depth remplissages → lavis`, la chaîne complète du §. */
function nestedSupport(ground: BackdropSpec, depth: number, wash: string): BackdropSpec {
  return withWash(nested(ground, depth), wash);
}

/**
 * L'échelle des trois profondeurs, DÉCLARÉE et recalculée — à la manière du
 * § 7, sur le support que la table du § 7 publie déjà : la carte au halo FROID
 * sous le lavis d'APPUI.
 *
 * La colonne `n=1` de `--control-border`, `--text-body` et `--text-strong`
 * reprend donc, au centième près, les trois pires cas de `WORST_CASES` — c'est
 * la preuve que les deux blocs mesurent bien la même chaîne, et le dernier test
 * du § l'exige explicitement.
 */
interface NestingLadder {
  readonly ink: string;
  /** Ratios aux profondeurs 1, 2 et 3, thème clair. */
  readonly light: readonly [number, number, number];
  /** Les mêmes en sombre — identiques dans `dark-os` et `dark-explicit` (§ 1). */
  readonly dark: readonly [number, number, number];
}

const NESTING_LADDER: readonly NestingLadder[] = [
  { ink: '--control-border', light: [3.18, 3.61, 3.89], dark: [3.27, 3.63, 3.93] },
  { ink: '--text-body', light: [5.59, 6.35, 6.85], dark: [5.14, 5.71, 6.2] },
  { ink: '--text-strong', light: [6.85, 7.78, 8.39], dark: [6.12, 6.79, 7.37] },
];

describe('10. Chaque verre de plus ÉLOIGNE le support de l’encre de lecture', () => {
  it.each(HALOED_GROUNDS.map(({ label, ground, card }) => ({ label, ground, card })))(
    'la profondeur 1 rend la pile de carte déjà publiée — « $label »',
    ({ ground, card }) => {
      /*
       * LE PONT AVEC LE § 7, et la condition de validité de tout ce bloc. Si
       * `nested(sol, 1)` cessait d'être la carte de `GLASS_BACKDROPS`, le § 10
       * mesurerait une chaîne voisine et en déduirait des bornes pour une autre.
       */
      expect(nested(ground, 1).layers).toStrictEqual(card.layers);
    },
  );

  it.each(
    THEME_NAMES.flatMap((theme) =>
      HALOED_GROUNDS.flatMap(({ label, ground }) =>
        STATE_WASHES.flatMap((wash) =>
          NESTED_INKS.map((ink) => ({ theme, label, ground, wash, ink })),
        ),
      ),
    ),
  )(
    '$ink croît avec la profondeur sur « $label », lavis $wash — $theme',
    ({ theme, ground, wash, ink }) => {
      const [first, second, third] = NESTING_DEPTHS.map((depth) => ({
        depth,
        ratio: ratioOn(theme, ink, nestedSupport(ground, depth, wash)),
      }));

      const explain = (lower: typeof first, higher: typeof first): string =>
        `${ink} en ${theme} sur ${nestedSupport(ground, higher.depth, wash).label} — ` +
        `${higher.ratio.toFixed(3)}:1 à la profondeur ${higher.depth} contre ` +
        `${lower.ratio.toFixed(3)}:1 à la profondeur ${lower.depth}. Un remplissage de verre ` +
        'de plus vient de RAPPROCHER le support de cette encre : la profondeur 1 n’est plus ' +
        'le plancher, l’enveloppe du § 7 ne borne plus les supports imbriqués, et il faut ' +
        'écrire les vingt supports de plus au lieu de les déduire.';

      expect(second.ratio, explain(first, second)).toBeGreaterThan(first.ratio);
      expect(third.ratio, explain(second, third)).toBeGreaterThan(second.ratio);
    },
  );

  it.each(
    THEME_NAMES.flatMap((theme) =>
      NESTING_LADDER.flatMap((ladder) =>
        NESTING_DEPTHS.map((depth) => ({ theme, depth, ...ladder })),
      ),
    ),
  )(
    '$ink vaut le ratio déclaré à la profondeur $depth — $theme',
    ({ theme, depth, ink, light, dark }) => {
      const declared = (theme === 'light' ? light : dark)[depth - 1];
      const support = nestedSupport(WORST_GROUND, depth, WORST_WASH);
      const measured = ratioOn(theme, ink, support);

      expect(
        Math.abs(measured - declared),
        `${ink} en ${theme} sur ${support.label} — mesuré ${measured.toFixed(3)}:1, ` +
          `déclaré ${declared.toFixed(2)}:1. Écrivez la mesure, ne déplacez pas la tolérance.`,
      ).toBeLessThanOrEqual(MAX_RATIO_DRIFT);
    },
  );

  it.each(
    THEME_NAMES.flatMap((theme) => WORST_CASES.map((worstCase) => ({ theme, ...worstCase }))),
  )(
    'l’enveloppe du § 7 borne encore $ink sous imbrication — $theme',
    ({ theme, ink, light, dark }) => {
      /*
       * LA CONCLUSION DU §, ÉNONCÉE COMME UNE ASSERTION. Le pire des dix-huit
       * supports imbriqués (deux halos × trois profondeurs × trois lavis) ne
       * descend jamais sous le pire cas que le § 7 publie déjà. Le cas d'égalité
       * est attendu et voulu : pour une encre dont le pire cas est la carte au
       * halo froid sous le lavis d'appui, la profondeur 1 EST ce support.
       */
      const declared = theme === 'light' ? light : dark;
      const worst = HALOED_GROUNDS.flatMap(({ ground }) =>
        STATE_WASHES.flatMap((wash) =>
          NESTING_DEPTHS.map((depth) => {
            const support = nestedSupport(ground, depth, wash);

            return { label: support.label, ratio: ratioOn(theme, ink, support) };
          }),
        ),
      ).reduce((worse, candidate) => (candidate.ratio < worse.ratio ? candidate : worse));

      expect(
        worst.ratio,
        `${ink} en ${theme} tombe à ${worst.ratio.toFixed(3)}:1 sur ${worst.label}, sous le ` +
          `pire cas de ${declared.toFixed(2)}:1 que le § 7 publie pour les vingt supports NON ` +
          'imbriqués. L’enveloppe ne borne plus le mode verre : ajoutez ces supports à la ' +
          'table du § 7 au lieu de la laisser annoncer un plafond qu’elle ne tient pas.',
      ).toBeGreaterThanOrEqual(declared - MAX_RATIO_DRIFT);
    },
  );

  it('déclare sa portée : les neuf encres de l’enveloppe, et l’exclusion nommée', () => {
    // Sans cette garde, retirer une encre de la portée serait invisible en
    // revue : le produit rétrécirait et le bloc resterait vert.
    expect(NESTED_INKS).toStrictEqual([...TEXT_INKS, '--control-border']);
    expect(NESTED_INKS).not.toContain(NESTING_EXCLUDED_INK);
  });

  it.each(THEME_NAMES)(
    `${NESTING_EXCLUDED_INK} est au contraire DÉGRADÉ par l’imbrication — %s`,
    (theme) => {
      /*
       * LE CONTRE-EXEMPLE, ÉCRIT ET REJOUÉ. Il borne le théorème par le bas :
       * si cette encre se mettait à CROÎTRE avec la profondeur, c'est que
       * `--glass-fill` aurait changé de polarité, et la portée du § 10 devrait
       * être rouverte plutôt qu'élargie en silence.
       *
       * Mesures sur la carte au halo froid, lavis d'appui posé : 1,741 → 1,532
       * → 1,422 en clair, 2,309 → 2,081 → 1,918 en sombre. Aucune n'atteint
       * 3:1, et aucune n'a à l'atteindre : le § 7 de `tokens.contract.test.ts`
       * mesure cette encre contre l'aplat `--accent` et contre `--focus-outer`,
       * les deux seuls endroits où un navigateur la peint.
       */
      const [first, second, third] = NESTING_DEPTHS.map((depth) =>
        ratioOn(theme, NESTING_EXCLUDED_INK, nestedSupport(WORST_GROUND, depth, WORST_WASH)),
      );

      const measured = `${first.toFixed(3)} → ${second.toFixed(3)} → ${third.toFixed(3)}`;
      const explain =
        `${NESTING_EXCLUDED_INK} en ${theme} mesure ${measured} aux profondeurs 1, 2 et 3. ` +
        'Il DÉCROISSAIT, ce qui est la raison de son exclusion de la portée du § 10 ; s’il ' +
        'croît désormais, `--glass-fill` a changé de polarité et la portée doit être ' +
        'rouverte, pas élargie en silence.';

      expect(second, explain).toBeLessThan(first);
      expect(third, explain).toBeLessThan(second);
    },
  );

  it('le citron de focus vaut 1,741:1 en clair et 2,309:1 en sombre à la profondeur 1', () => {
    // Les deux chiffres du commentaire ci-dessus, rejoués — un ratio écrit et
    // non mesuré est une affirmation qui se lit comme une vérification.
    const support = nestedSupport(WORST_GROUND, 1, WORST_WASH);

    expect(ratioOn('light', NESTING_EXCLUDED_INK, support)).toBeCloseTo(1.741, 3);
    expect(ratioOn('dark-os', NESTING_EXCLUDED_INK, support)).toBeCloseTo(2.309, 3);
  });
});

/* ============================================================================
   § 11 — L'APLAT ACCENT COMME FRONTIÈRE (WCAG 1.4.11).

   ET IL RÉVÈLE UN TROU PRÉEXISTANT, QUE LE THÈME VERRE N'A PAS CRÉÉ.

   `.tc-btn--primary` déclare `background: var(--accent)` ET
   `border-color: var(--accent)` : son APLAT EST SA FORME. C'est donc lui, et non
   une encre posée dessus, qui porte « l'information visuelle nécessaire pour
   identifier le composant » au sens de WCAG 1.4.11 — d'où un plancher de 3:1
   contre les couleurs ADJACENTES, c'est-à-dire contre son substrat.

   AUCUN TEST DE CE DÉPÔT NE LE MESURAIT LÀ. Trois blocs s'en approchaient et
   regardaient tous ailleurs :

    - le § 2 de `tokens.contract.test.ts` mesure l'encre POSÉE SUR l'accent dans
      les trois états du contrôle. C'est le contraste du libellé, pas celui de la
      forme ;
    - le § 7 de `tokens.contract.test.ts` mesure `--focus-inner` contre l'aplat
      `--accent`. C'est l'anneau de focus contre le bouton, pas le bouton contre
      la page ;
    - le § 3 de `tokens.contract.test.ts` mesure `--control-border` sur ses trois
      supports. C'est le liseré du bouton SECONDAIRE ; le primaire n'en a pas
      d'autre que son propre aplat.

   Résultat : le teal du bouton primaire n'a jamais été mesuré contre ce sur quoi
   il est posé. Mesuré ici, DEUX cellules sur dix passent sous 3:1, toutes deux
   en thème SOMBRE, et sans le thème verre — c'est le rendu d'aujourd'hui, celui
   que la page `#/compositions/verre-et-frise` produit en sombre.

   LES DIX CHIFFRES SONT DÉCLARÉS, RECALCULÉS, ET VÉRIFIÉS DANS LES DEUX SENS,
   à la manière du § 7 : une exemption dont la palette n'a plus besoin fait
   ROUGIR la suite au lieu de survivre à sa raison.
   ========================================================================== */

/**
 * Le pire cas de `--accent` sur un support de `GLASS_BACKDROPS`.
 *
 * `shortfall` est renseigné SEULEMENT quand l'un des deux thèmes passe sous
 * 3:1, et il dit alors ce qu'un composant doit faire à la place. Même mécanisme
 * et même contrepartie qu'au § 7 : la note est nommée, et elle rougit dès que la
 * palette la rend inutile.
 */
interface AccentBoundary {
  /** Le libellé du support, tel que `GLASS_BACKDROPS` le porte. */
  readonly label: string;
  readonly light: number;
  /** Le même en sombre — identique dans `dark-os` et `dark-explicit` (§ 1). */
  readonly dark: number;
  readonly shortfall?: string;
}

const ACCENT_BOUNDARIES: readonly AccentBoundary[] = [
  { label: 'la page nue', light: 4.53, dark: 3.28 },
  { label: 'la carte sur la page nue', light: 4.88, dark: 3.4 },
  {
    label: 'la carte sur le halo froid',
    light: 3.93,
    dark: 2.59,
    shortfall:
      'en sombre, l’aplat du bouton primaire ne se détache PAS d’une carte posée sur le halo ' +
      'froid : 2,59:1 contre les 3:1 de WCAG 1.4.11, soit 0,41 de manque. Le teal n’est pas en ' +
      'cause — il tient 3,40:1 sur la même carte sans halo et 3,28:1 sur la page nue —, c’est ' +
      'le HALO qui remonte le substrat vers lui : la bulle froide sombre est un teal (#004452) ' +
      'de la même famille que l’accent. Ce qu’un composant fait à la place : `.tc-btn--primary` ' +
      'a besoin d’un liseré propre dès qu’il peut être posé sur un halo — `--control-border` ' +
      'tient 3,27:1 au même endroit —, ou le halo doit rester hors de la boîte du bouton. ' +
      'CE MANQUEMENT EST ANTÉRIEUR AU THÈME VERRE : il ne dépend que de `--halo-tint` et de ' +
      '`--glass-fill`, tous deux servis sans `data-material="glass"`.',
  },
  {
    label: 'la carte sur le halo chaud',
    light: 3.96,
    dark: 2.78,
    shortfall:
      'même manquement sur la bulle chaude, et il est plus étroit : 2,78:1 en sombre, soit ' +
      '0,22 de manque. La cause diffère — le brun chaud (#58281c) n’est pas de la famille du ' +
      'teal, il est simplement plus clair que le sol —, la conséquence est la même, et le ' +
      'remède aussi. Les deux bulles sont tenues à parité de présence (§ 14 de ' +
      '`tokens.contract.test.ts`) : corriger l’une sans l’autre déplacerait le pire cas sans ' +
      'le supprimer.',
  },
  { label: 'la carte en repli opaque', light: 4.87, dark: 3.4 },
];

describe('11. L’aplat --accent tient 3:1 contre son substrat — sa forme EST sa couleur', () => {
  /** Le support de `GLASS_BACKDROPS` que ce libellé nomme. */
  function backdropLabelled(label: string): BackdropSpec {
    const found = GLASS_BACKDROPS.find((backdrop) => backdrop.label === label);

    if (found === undefined) {
      throw new Error(
        `aucun support de GLASS_BACKDROPS ne porte le libellé « ${label} » — reçus : ` +
          GLASS_BACKDROPS.map((backdrop) => backdrop.label).join(', '),
      );
    }

    return found;
  }

  it('mesure les CINQ supports de carte, dans leur ordre de déclaration', () => {
    // La table est indexée par libellé : sans cette garde, un support ajouté à
    // `GLASS_BACKDROPS` resterait hors de la mesure et le bloc resterait vert.
    expect(ACCENT_BOUNDARIES.map((boundary) => boundary.label)).toStrictEqual(
      GLASS_BACKDROPS.map((backdrop) => backdrop.label),
    );
  });

  it.each(
    THEME_NAMES.flatMap((theme) => ACCENT_BOUNDARIES.map((boundary) => ({ theme, ...boundary }))),
  )('« $label » — $theme', ({ theme, label, light, dark, shortfall }) => {
    const backdrop = backdropLabelled(label);
    const declared = theme === 'light' ? light : dark;
    const measured = ratioOn(theme, '--accent', backdrop);

    // (a) LE NOMBRE. Les dix chiffres publiés sont recalculés, y compris les
    //     huit qui passent : c'est ce qui fait qu'un teal retouché déplace la
    //     table au lieu de la laisser mentir.
    expect(
      Math.abs(measured - declared),
      `--accent sur ${label} (${backdropOf(theme, backdrop)}) en ${theme} — mesuré ` +
        `${measured.toFixed(3)}:1, déclaré ${declared.toFixed(2)}:1. Écrivez la mesure, ne ` +
        'déplacez pas la tolérance.',
    ).toBeLessThanOrEqual(MAX_RATIO_DRIFT);

    // (b) LE VERDICT, DANS LES DEUX SENS — le mécanisme du § 7, non affaibli.
    if (shortfall === undefined) {
      expectRatio(
        measured,
        AA_NON_TEXT,
        `--accent EN TANT QUE FORME sur ${label} (${backdropOf(theme, backdrop)}) en ${theme}`,
      );
    } else {
      const worstOfBoth = Math.min(light, dark);

      expect(
        worstOfBoth,
        `« ${label} » porte une note de manquement alors que son pire cas des deux thèmes vaut ` +
          `${worstOfBoth.toFixed(2)}:1, au-dessus du plancher de ${AA_NON_TEXT}:1. La palette a ` +
          'progressé : retirez le `shortfall` au lieu de le laisser exempter un support qui ' +
          'n’en a plus besoin.',
      ).toBeLessThan(AA_NON_TEXT);
    }
  });

  it('n’exempte que ce qui est nommé — deux supports, et ces deux-là', () => {
    expect(
      ACCENT_BOUNDARIES.filter((boundary) => boundary.shortfall !== undefined).map(
        (boundary) => boundary.label,
      ),
    ).toStrictEqual(['la carte sur le halo froid', 'la carte sur le halo chaud']);
  });

  it('les deux seules cellules sous 3:1 sont les halos en SOMBRE', () => {
    /*
     * LA GARDE EXHAUSTIVE, et celle qui rend le (b) infalsifiable. Le (b) ne
     * regarde que les nombres DÉCLARÉS ; ce test parcourt les quinze mesures
     * réelles et épingle exactement lesquelles tombent. Une cellule qui se met à
     * tomber ailleurs rougit ici, et une cellule réparée rougit aussi.
     */
    const failing = THEME_NAMES.flatMap((theme) =>
      ACCENT_BOUNDARIES.filter(
        (boundary) => ratioOn(theme, '--accent', backdropLabelled(boundary.label)) < AA_NON_TEXT,
      ).map((boundary) => `${boundary.label} — ${theme}`),
    );

    expect(
      failing,
      'la liste des cellules sous 3:1 a changé. Si une cellule a été RÉPARÉE, retirez-la ici ' +
        'et retirez son `shortfall` ; si une NOUVELLE est tombée, elle doit être nommée avant ' +
        'd’être ajoutée.',
    ).toStrictEqual([
      'la carte sur le halo froid — dark-os',
      'la carte sur le halo chaud — dark-os',
      'la carte sur le halo froid — dark-explicit',
      'la carte sur le halo chaud — dark-explicit',
    ]);
  });

  /*
   * LA PHRASE QUI COMPTE, RENDUE VÉRIFIABLE. Le thème verre ajoute un attribut
   * `data-material="glass"` et un `backdrop-filter` ; il n'introduit AUCUN des
   * jetons de la chaîne mesurée ci-dessus. `parseThemes` ne lit que les trois
   * blocs de thème — `:root`, le `@media` sombre, `[data-theme='dark']` — donc
   * une couche qui ne vivrait que sous un sélecteur de matériau ferait échouer
   * `resolveToken` ici. Que les quatre se résolvent EST la preuve que ce
   * manquement est servi sans le moindre attribut : il existait avant la V2, et
   * le verre n'en est pas l'alibi.
   */
  it.each(
    ['--accent', '--site-background', '--halo-tint', '--halo-tint-warm', '--glass-fill'].flatMap(
      (token) => THEME_NAMES.map((theme) => ({ theme, token })),
    ),
  )(
    '$token de la chaîne fautive vit dans les blocs de thème ordinaires — $theme',
    ({ theme, token }) => {
      expect(
        () => tokenOf(theme, token),
        `${token} ne se résout pas dans le thème \`${theme}\` : s’il a migré sous un sélecteur ` +
          'de matériau, la note du § 11 ne peut plus dire que le manquement est antérieur au ' +
          'thème verre — remesurez avant de réécrire la note.',
      ).not.toThrow();
    },
  );
});
