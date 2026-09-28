import type { ReactElement } from 'react';

export type HeaderLanguage = 'FR' | 'EN' | 'ES';

/* =============================================================================
   LES DRAPEAUX SONT DESSINÉS, ET CE N'EST PAS UN CAPRICE DE DESSINATEUR.

   La solution courte était les émojis régionaux — 🇫🇷 🇬🇧 🇪🇸, trois caractères,
   zéro ligne de SVG. Elle ne tient pas : Windows n'embarque AUCUNE police de
   drapeaux (Segoe UI Emoji rend les paires d'indicatifs régionaux en deux
   LETTRES encadrées, « FR », « GB », « ES »), et le rendu de Chrome sous
   Windows est donc du texte, pas une image. Le contrôle aurait affiché des
   sigles là où la demande est un drapeau, et la taille du glyphe aurait suivi
   la police du système au lieu de la maquette.

   Ces trois SVG font 60 × 40 (le rapport 3:2 de la France et de l'Espagne,
   arrondi pour le Royaume-Uni qui est en 2:1 — à 20 px de large, l'écart ne se
   voit pas et l'alignement des trois vignettes, lui, se voit). Ils sont
   `aria-hidden` : le nom de chaque option vient d'un libellé texte masqué
   visuellement, qui porte son `lang`. Un drapeau n'est pas une langue, et
   « Français » se prononce mieux que « drapeau de la France ».
   ========================================================================== */

/** Le rapport commun aux trois vignettes, en unités de la `viewBox`. */
const VIEW_BOX = '0 0 60 40';

function FrenchFlag() {
  return (
    <>
      <rect width="60" height="40" fill="#f5f5f5" />
      <rect width="20" height="40" fill="#002395" />
      <rect x="40" width="20" height="40" fill="#ed2939" />
    </>
  );
}

/* L'Union Jack EXACT est contreformé : les bandes rouges de la croix de Saint-
   Patrick sont décalées d'un quart de largeur de part et d'autre de la
   diagonale, et le dessin change de moitié en moitié. À 20 px de large, ce
   décalage vaut moins d'un demi-pixel ; le rendre demanderait six chemins
   rognés pour une différence qu'aucun écran ne peint. Cette version garde donc
   les diagonales centrées — la silhouette lue reste celle du drapeau. */
function BritishFlag() {
  return (
    <>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#f5f5f5" strokeWidth="8" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0V40M0 20H60" stroke="#f5f5f5" strokeWidth="13" />
      <path d="M30 0V40M0 20H60" stroke="#c8102e" strokeWidth="8" />
    </>
  );
}

function SpanishFlag() {
  return (
    <>
      <rect width="60" height="40" fill="#aa151b" />
      <rect y="10" width="60" height="20" fill="#f1bf00" />
    </>
  );
}

const FLAGS: Record<HeaderLanguage, () => ReactElement> = {
  FR: FrenchFlag,
  EN: BritishFlag,
  ES: SpanishFlag,
};

export interface LanguageFlagProps {
  readonly language: HeaderLanguage;
  readonly className?: string;
}

/**
 * La vignette d'une langue. Purement décorative : c'est le libellé masqué de
 * l'option qui porte le nom accessible.
 */
export function LanguageFlag({ language, className }: LanguageFlagProps) {
  const Flag = FLAGS[language];

  return (
    <svg
      className={className}
      viewBox={VIEW_BOX}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <Flag />
    </svg>
  );
}
