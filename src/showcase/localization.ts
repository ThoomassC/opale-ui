import type { DocGroupId, DocPage } from './doc-model';

export type Language = 'FR' | 'EN' | 'ES';

export const DEFAULT_LANGUAGE: Language = 'FR';

export const LANGUAGE_OPTIONS: readonly { value: Language; label: string }[] = [
  { value: 'FR', label: 'Français' },
  { value: 'EN', label: 'English' },
  { value: 'ES', label: 'Español' },
];

export interface InterfaceCopy {
  readonly skipToContent: string;
  readonly home: string;
  readonly installation: string;
  readonly releaseNotes: string;
  readonly primaryNavigation: string;
  readonly primaryMenu: string;
  readonly openMenu: string;
  readonly darkTheme: string;
  readonly language: string;
  readonly searchLabel: string;
  readonly searchPlaceholder: string;
  readonly suggestions: string;
  readonly noSearchResult: string;
  readonly contents: string;
  readonly documentation: string;
  readonly stable: string;
  readonly contentsScroll: string;
  readonly contentsStart: string;
  readonly contentsWidth: string;
  readonly contentLanguageNotice: string;
}

const COPY: Record<Language, InterfaceCopy> = {
  FR: {
    skipToContent: 'Aller au contenu',
    home: 'Accueil',
    installation: 'Installation',
    releaseNotes: 'Notes de versions',
    primaryNavigation: 'Navigation principale',
    primaryMenu: 'Menu principal',
    openMenu: 'Ouvrir le menu',
    darkTheme: 'Thème sombre',
    language: 'Langue',
    searchLabel: 'Rechercher une page',
    searchPlaceholder: 'Rechercher',
    suggestions: 'Suggestions',
    noSearchResult: 'Aucune page ne correspond.',
    contents: 'Sommaire',
    documentation: 'Documentation',
    stable: 'stable',
    contentsScroll: 'Défilement du sommaire',
    contentsStart: 'Début du sommaire',
    contentsWidth: 'Largeur du sommaire',
    contentLanguageNotice: '',
  },
  EN: {
    skipToContent: 'Skip to content',
    home: 'Home',
    installation: 'Installation',
    releaseNotes: 'Release notes',
    primaryNavigation: 'Primary navigation',
    primaryMenu: 'Primary menu',
    openMenu: 'Open menu',
    darkTheme: 'Dark theme',
    language: 'Language',
    searchLabel: 'Search for a page',
    searchPlaceholder: 'Search',
    suggestions: 'Suggestions',
    noSearchResult: 'No matching page.',
    contents: 'Contents',
    documentation: 'Documentation',
    stable: 'stable',
    contentsScroll: 'Contents scroll',
    contentsStart: 'Start of contents',
    contentsWidth: 'Contents width',
    contentLanguageNotice:
      'The navigation is translated; documentation content is currently in French.',
  },
  ES: {
    skipToContent: 'Ir al contenido',
    home: 'Inicio',
    installation: 'Instalación',
    releaseNotes: 'Notas de versión',
    primaryNavigation: 'Navegación principal',
    primaryMenu: 'Menú principal',
    openMenu: 'Abrir el menú',
    darkTheme: 'Tema oscuro',
    language: 'Idioma',
    searchLabel: 'Buscar una página',
    searchPlaceholder: 'Buscar',
    suggestions: 'Sugerencias',
    noSearchResult: 'No hay páginas coincidentes.',
    contents: 'Índice',
    documentation: 'Documentación',
    stable: 'estable',
    contentsScroll: 'Desplazamiento del índice',
    contentsStart: 'Inicio del índice',
    contentsWidth: 'Ancho del índice',
    contentLanguageNotice:
      'La navegación está traducida; el contenido de la documentación está actualmente en francés.',
  },
};

const PAGE_LABELS: Record<Exclude<Language, 'FR'>, Readonly<Record<string, string>>> = {
  EN: {
    '': 'Home',
    installation: 'Installation',
    'notes-de-versions': 'Release notes',
    utilisation: 'Usage',
    theming: 'Theming',
    typographie: 'Typography',
    icones: 'Icons',
    palette: 'Color palette',
    espacement: 'Spacing and radii',
    elevation: 'Elevation',
    verre: 'Glass',
    'verre-liquide': 'Liquid Glass',
    accessibilite: 'Accessibility',
  },
  ES: {
    '': 'Inicio',
    installation: 'Instalación',
    'notes-de-versions': 'Notas de versión',
    utilisation: 'Uso',
    theming: 'Temas',
    typographie: 'Tipografía',
    icones: 'Iconos',
    palette: 'Paleta de colores',
    espacement: 'Espaciado y radios',
    elevation: 'Elevación',
    verre: 'Vidrio',
    'verre-liquide': 'Vidrio líquido',
    accessibilite: 'Accesibilidad',
  },
};

const PAGE_TITLES: Record<Exclude<Language, 'FR'>, Readonly<Record<string, string>>> = {
  EN: {
    '': 'The design system for the Opale ecosystem.',
  },
  ES: {
    '': 'El sistema de diseño del ecosistema Opale.',
  },
};

const SECTION_LABELS: Record<Exclude<Language, 'FR'>, Readonly<Record<string, string>>> = {
  EN: {
    introduction: 'INTRODUCTION',
    fondations: 'FOUNDATIONS',
    composants: 'COMPONENTS',
    'prise-en-main': 'GETTING STARTED',
    inputs: 'INPUTS',
    'boutons-specialises': 'SPECIALIZED BUTTONS',
    'affichage-de-donnees': 'DATA DISPLAY',
    feedback: 'FEEDBACK',
    navigation: 'NAVIGATION',
    'mise-en-page': 'LAYOUT',
    modules: 'MODULES',
    autres: 'OTHER',
  },
  ES: {
    introduction: 'INTRODUCCIÓN',
    fondations: 'FUNDAMENTOS',
    composants: 'COMPONENTES',
    'prise-en-main': 'PRIMEROS PASOS',
    inputs: 'ENTRADAS',
    'boutons-specialises': 'BOTONES ESPECIALIZADOS',
    'affichage-de-donnees': 'VISUALIZACIÓN DE DATOS',
    feedback: 'RESPUESTA',
    navigation: 'NAVEGACIÓN',
    'mise-en-page': 'DISEÑO',
    modules: 'MÓDULOS',
    autres: 'OTROS',
  },
};

const GROUP_LABELS: Record<Exclude<Language, 'FR'>, Record<DocGroupId, string>> = {
  EN: { introduction: 'Introduction', fondations: 'Foundations', composants: 'Components' },
  ES: { introduction: 'Introducción', fondations: 'Fundamentos', composants: 'Componentes' },
};

export function isLanguage(value: string | null): value is Language {
  return value === 'FR' || value === 'EN' || value === 'ES';
}

export function copyFor(language: Language): InterfaceCopy {
  return COPY[language];
}

export function pageLabelFor(page: DocPage, language: Language, fallback = page.label): string {
  return language === 'FR' ? fallback : (PAGE_LABELS[language][page.slug] ?? fallback);
}

export function pageTitleFor(page: DocPage, language: Language): string {
  if (language === 'FR') return page.title;
  return PAGE_TITLES[language][page.slug] ?? PAGE_LABELS[language][page.slug] ?? page.title;
}

export function localizedPages(pages: readonly DocPage[], language: Language): readonly DocPage[] {
  if (language === 'FR') return pages;

  return pages.map((page) => ({
    ...page,
    label: pageLabelFor(page, language),
    title: pageTitleFor(page, language),
  }));
}

export function sectionLabelFor(id: string, fallback: string, language: Language): string {
  return language === 'FR' ? fallback : (SECTION_LABELS[language][id] ?? fallback);
}

export function groupLabelFor(id: DocGroupId, fallback: string, language: Language): string {
  return language === 'FR' ? fallback : GROUP_LABELS[language][id];
}

export function searchCountMessage(
  language: Language,
  total: number,
  maxSuggestions: number,
): string {
  if (language === 'EN') {
    if (total === 0) return COPY.EN.noSearchResult;
    if (total === 1) return '1 page found.';
    if (total > maxSuggestions) {
      return `${total} pages found; the first ${maxSuggestions} are shown.`;
    }
    return `${total} pages found.`;
  }

  if (language === 'ES') {
    if (total === 0) return COPY.ES.noSearchResult;
    if (total === 1) return '1 página encontrada.';
    if (total > maxSuggestions) {
      return `${total} páginas encontradas; se muestran las ${maxSuggestions} primeras.`;
    }
    return `${total} páginas encontradas.`;
  }

  if (total === 0) return COPY.FR.noSearchResult;
  if (total === 1) return '1 page trouvée.';
  if (total > maxSuggestions) {
    return `${total} pages trouvées, les ${maxSuggestions} premières sont proposées.`;
  }
  return `${total} pages trouvées.`;
}
