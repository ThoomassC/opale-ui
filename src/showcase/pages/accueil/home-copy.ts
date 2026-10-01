import type { CarouselLabels, ClipboardLabels, MarqueeLabels } from '../../../opale';
import type { Language } from '../../localization';

/* =============================================================================
   LES TEXTES DE L'ACCUEIL, DANS LES TROIS LANGUES DE L'INTERFACE.

   L'accueil est la seule page qui traduit son corps : c'est une page pleine
   largeur (`fullBleed`), et la coquille lui passe la langue choisie. Les
   autres pages restent en français, sous l'avis de la coquille.

   AUCUN CHIFFRE ÉCRIT À LA MAIN. Le nombre de composants vient du catalogue,
   la version de `version.ts` : les fonctions ci-dessous les reçoivent, pour
   qu'aucune phrase ne vieillisse à la prochaine publication.
   ========================================================================== */

/** Les familles du carrousel, dans l'ordre des diapositives. */
export type HomeFamilyId =
  'saisie' | 'formulaires' | 'couches' | 'affichage' | 'navigation' | 'mouvement';

export const HOME_FAMILIES: readonly HomeFamilyId[] = [
  'saisie',
  'formulaires',
  'couches',
  'affichage',
  'navigation',
  'mouvement',
];

export interface HomeFamilyCopy {
  /** Le nom de la famille, titre de la diapositive. */
  readonly name: string;
  /** Une ligne : ce que la famille apporte. */
  readonly line: string;
  /** Le lien vers la page qui ouvre la famille. */
  readonly link: string;
}

export interface HomeCopy {
  readonly hero: {
    readonly eyebrow: (version: string) => string;
    readonly title: string;
    readonly lede: string;
    readonly install: string;
    readonly components: string;
  };
  readonly components: {
    readonly title: string;
    readonly lede: (count: number) => string;
    /** Le nom de la région du carrousel. */
    readonly carousel: string;
    readonly carouselLabels: Partial<CarouselLabels>;
    readonly families: Readonly<Record<HomeFamilyId, HomeFamilyCopy>>;
    /** Les textes des démonstrations, famille par famille. */
    readonly demos: {
      readonly primary: string;
      readonly secondary: string;
      readonly tonal: string;
      readonly glass: string;
      readonly message: string;
      readonly messageHelp: string;
      readonly messageValue: string;
      readonly popoverTrigger: string;
      readonly popoverTitle: string;
      readonly popoverBody: string;
      readonly stable: string;
      readonly fresh: string;
      readonly offline: string;
      readonly tabsLabel: string;
      readonly tabs: readonly (readonly [string, string])[];
      readonly replay: string;
      readonly splitTitle: string;
    };
  };
  readonly qualities: {
    readonly title: string;
    readonly lede: string;
    /** Le nom de la région du bandeau. */
    readonly marquee: string;
    readonly marqueeLabels: Partial<MarqueeLabels>;
    /** Les entrées du bandeau : du texte seul, jamais un lien ni un bouton. */
    readonly marqueeItems: (count: number) => readonly string[];
    /** Les quatre preuves, chacune une phrase qu'on peut vérifier. */
    readonly proofs: (dependencies: readonly string[]) => readonly HomeProofCopy[];
  };
  readonly pages: {
    readonly title: string;
    readonly lede: string;
    readonly caption: string;
    readonly link: string;
    /** Les textes du gabarit montré en aperçu. */
    readonly scaffold: {
      readonly site: string;
      readonly home: string;
      readonly work: string;
      readonly about: string;
      readonly title: string;
      readonly description: string;
      readonly card: string;
      readonly body: string;
      readonly legal: string;
    };
  };
  readonly install: {
    readonly title: string;
    readonly lede: string;
    readonly commandLabel: string;
    readonly copy: string;
    readonly clipboardLabels: Partial<ClipboardLabels>;
    readonly guide: string;
    readonly migrate: string;
  };
}

export interface HomeProofCopy {
  readonly title: string;
  readonly text: string;
}

/**
 * Les dépendances d'exécution du paquet, citées par la preuve « une seule
 * dépendance ». Recopiées de `package.json` et gardées par `home.test.tsx` :
 * l'importer demanderait `resolveJsonModule` (voir `version.ts`).
 */
export const RUNTIME_DEPENDENCIES: readonly string[] = ['clsx'];

const FR: HomeCopy = {
  hero: {
    eyebrow: (version) => `Opale UI ${version} · design system React`,
    title: 'Des interfaces qui bougent, sans rien cacher.',
    lede: 'Des composants React accessibles et typés, rendus au serveur, avec le verre liquide en option.',
    install: 'Installer',
    components: 'Voir les composants',
  },
  components: {
    title: 'Les composants',
    lede: (count) => `${count} composants, rangés en familles. Chaque carte est une démo vivante.`,
    carousel: 'Les familles de composants',
    carouselLabels: {},
    families: {
      saisie: {
        name: 'Saisie',
        line: 'Des boutons à chaque ton, à la hauteur des champs.',
        link: 'Voir Button',
      },
      formulaires: {
        name: 'Formulaires',
        line: 'Libellé, aide et erreur, reliés au champ.',
        link: 'Voir Textarea',
      },
      couches: {
        name: 'Couches flottantes',
        line: 'Un panneau contre son bouton. Échap le referme.',
        link: 'Voir Popover',
      },
      affichage: {
        name: 'Affichage',
        line: 'Des pastilles, des cartes et des tableaux.',
        link: 'Voir Badge',
      },
      navigation: {
        name: 'Navigation',
        line: 'Des onglets qui se parcourent aux flèches.',
        link: 'Voir Tabs',
      },
      mouvement: {
        name: 'Mouvement',
        line: 'Un titre qui arrive mot à mot, immobile en mouvement réduit.',
        link: 'Voir SplitHeading',
      },
    },
    demos: {
      primary: 'Valider',
      secondary: 'Annuler',
      tonal: 'Brouillon',
      glass: 'En verre',
      message: 'Message',
      messageHelp: 'Le champ grandit avec le texte.',
      messageValue: 'Bonjour, je voudrais un devis.',
      popoverTrigger: 'Ouvrir le panneau',
      popoverTitle: 'Un panneau ancré',
      popoverBody: 'Il suit son bouton et rend le focus à la fermeture.',
      stable: 'Stable',
      fresh: 'Nouveau',
      offline: 'Hors ligne',
      tabsLabel: 'Étapes',
      tabs: [
        ['Installer', 'Une commande, une archive.'],
        ['Importer', 'Une feuille, une fois.'],
        ['Composer', 'Des composants par leur nom.'],
      ],
      replay: 'Rejouer',
      splitTitle: 'Un titre qui prend son temps.',
    },
  },
  qualities: {
    title: 'Les qualités',
    lede: 'Quatre engagements. Chacun se vérifie dans le code.',
    marquee: 'Ce qu’Opale garantit',
    marqueeLabels: {},
    marqueeItems: (count) => [
      'WCAG 2.2 AA',
      'React 19',
      'Rendu serveur',
      'Verre liquide',
      'Clair et sombre',
      'TypeScript strict',
      `${count} composants`,
    ],
    proofs: (dependencies) => [
      {
        title: 'Accessible',
        text: 'Rôles natifs, clavier complet, focus visible sur chaque fond. Chaque page de composant détaille son parcours.',
      },
      {
        title: dependencies.length === 1 ? 'Une seule dépendance' : 'Peu de dépendances',
        text: `À l’exécution, Opale n’ajoute que ${dependencies.join(', ')}. React 19 reste le vôtre, en dépendance paire.`,
      },
      {
        title: 'Rendu serveur',
        text: 'Les composants s’importent dans un Server Component de Next.js. Ceux qui ont besoin du navigateur portent déjà « use client ».',
      },
      {
        title: 'Verre liquide',
        text: 'Une prop, liquidGlass, composant par composant. Sans elle, le composant reste plein et lisible.',
      },
    ],
  },
  pages: {
    title: 'Des pages entières',
    lede: 'PageScaffold pose l’en-tête, la navigation, la recherche et le pied de page. Il vous reste le contenu.',
    caption:
      'Aperçu d’une page faite avec PageScaffold. Image figée : ses liens ne mènent nulle part.',
    link: 'Voir l’exemple',
    scaffold: {
      site: 'Atelier',
      home: 'Accueil',
      work: 'Projets',
      about: 'À propos',
      title: 'Une base pour vos projets',
      description: 'Une page accueillante, avec les composants Opale déjà en place.',
      card: 'Votre contenu',
      body: 'Ajoutez ici vos sections, vos cartes et vos interactions.',
      legal: 'Mentions légales',
    },
  },
  install: {
    title: 'Installer Opale UI',
    lede: 'Opale n’est pas sur npm. Chaque version est une release GitHub, avec son archive déjà construite.',
    commandLabel: 'Commande d’installation',
    copy: 'Copier la commande',
    clipboardLabels: {},
    guide: 'Lire le guide d’installation',
    migrate: 'Migrer vers la 3.0',
  },
};

const EN: HomeCopy = {
  hero: {
    eyebrow: (version) => `Opale UI ${version} · React design system`,
    title: 'Interfaces that move, hiding nothing.',
    lede: 'Accessible, typed React components, rendered on the server, with liquid glass as an option.',
    install: 'Install',
    components: 'Browse the components',
  },
  components: {
    title: 'The components',
    lede: (count) => `${count} components, grouped in families. Every card is a live demo.`,
    carousel: 'Component families',
    carouselLabels: {
      previous: 'Previous slide',
      next: 'Next slide',
      slide: (index, total) => `${index} of ${total}`,
      goTo: (index) => `Go to slide ${index}`,
      dots: 'Choose a slide',
      pause: 'Pause',
      play: 'Play',
    },
    families: {
      saisie: {
        name: 'Inputs',
        line: 'Buttons in every tone, as tall as the fields.',
        link: 'See Button',
      },
      formulaires: {
        name: 'Forms',
        line: 'Label, help and error, tied to the field.',
        link: 'See Textarea',
      },
      couches: {
        name: 'Overlays',
        line: 'A panel next to its button. Escape closes it.',
        link: 'See Popover',
      },
      affichage: {
        name: 'Data display',
        line: 'Badges, cards and tables.',
        link: 'See Badge',
      },
      navigation: {
        name: 'Navigation',
        line: 'Tabs you move through with the arrow keys.',
        link: 'See Tabs',
      },
      mouvement: {
        name: 'Motion',
        line: 'A title that arrives word by word, still under reduced motion.',
        link: 'See SplitHeading',
      },
    },
    demos: {
      primary: 'Confirm',
      secondary: 'Cancel',
      tonal: 'Draft',
      glass: 'Glass',
      message: 'Message',
      messageHelp: 'The field grows with the text.',
      messageValue: 'Hello, I would like a quote.',
      popoverTrigger: 'Open the panel',
      popoverTitle: 'An anchored panel',
      popoverBody: 'It follows its button and gives focus back when it closes.',
      stable: 'Stable',
      fresh: 'New',
      offline: 'Offline',
      tabsLabel: 'Steps',
      tabs: [
        ['Install', 'One command, one archive.'],
        ['Import', 'One stylesheet, once.'],
        ['Compose', 'Components by name.'],
      ],
      replay: 'Replay',
      splitTitle: 'A title that takes its time.',
    },
  },
  qualities: {
    title: 'The qualities',
    lede: 'Four commitments. Each one can be checked in the code.',
    marquee: 'What Opale guarantees',
    marqueeLabels: { pause: 'Pause', play: 'Play' },
    marqueeItems: (count) => [
      'WCAG 2.2 AA',
      'React 19',
      'Server rendering',
      'Liquid glass',
      'Light and dark',
      'Strict TypeScript',
      `${count} components`,
    ],
    proofs: (dependencies) => [
      {
        title: 'Accessible',
        text: 'Native roles, full keyboard support, visible focus on every ground. Each component page spells out its keyboard path.',
      },
      {
        title: dependencies.length === 1 ? 'A single dependency' : 'Few dependencies',
        text: `At runtime, Opale only adds ${dependencies.join(', ')}. React 19 stays yours, as a peer dependency.`,
      },
      {
        title: 'Server rendering',
        text: 'Components import into a Next.js Server Component. Those that need the browser already carry “use client”.',
      },
      {
        title: 'Liquid glass',
        text: 'One prop, liquidGlass, component by component. Without it, the component stays solid and readable.',
      },
    ],
  },
  pages: {
    title: 'Whole pages',
    lede: 'PageScaffold sets up the header, navigation, search and footer. The content is up to you.',
    caption: 'Preview of a page built with PageScaffold. A still image: its links go nowhere.',
    link: 'See the example',
    scaffold: {
      site: 'Atelier',
      home: 'Home',
      work: 'Projects',
      about: 'About',
      title: 'A home for your projects',
      description: 'A welcoming page, with Opale components already in place.',
      card: 'Your content',
      body: 'Add your sections, cards and interactions here.',
      legal: 'Legal notice',
    },
  },
  install: {
    title: 'Install Opale UI',
    lede: 'Opale is not on npm. Each version is a GitHub release, with its archive already built.',
    commandLabel: 'Install command',
    copy: 'Copy the command',
    clipboardLabels: {
      copy: 'Copy',
      copied: 'Copied',
      copiedStatus: 'Copied to the clipboard',
      failed: 'Copy failed',
    },
    guide: 'Read the installation guide',
    migrate: 'Migrate to 3.0',
  },
};

const ES: HomeCopy = {
  hero: {
    eyebrow: (version) => `Opale UI ${version} · sistema de diseño React`,
    title: 'Interfaces que se mueven, sin ocultar nada.',
    lede: 'Componentes React accesibles y tipados, renderizados en el servidor, con vidrio líquido opcional.',
    install: 'Instalar',
    components: 'Ver los componentes',
  },
  components: {
    title: 'Los componentes',
    lede: (count) =>
      `${count} componentes, agrupados en familias. Cada tarjeta es una demo en vivo.`,
    carousel: 'Las familias de componentes',
    carouselLabels: {
      previous: 'Diapositiva anterior',
      next: 'Diapositiva siguiente',
      slide: (index, total) => `${index} de ${total}`,
      goTo: (index) => `Ir a la diapositiva ${index}`,
      dots: 'Elegir una diapositiva',
      pause: 'Pausar',
      play: 'Reproducir',
    },
    families: {
      saisie: {
        name: 'Entradas',
        line: 'Botones de todos los tonos, a la altura de los campos.',
        link: 'Ver Button',
      },
      formulaires: {
        name: 'Formularios',
        line: 'Etiqueta, ayuda y error, unidos al campo.',
        link: 'Ver Textarea',
      },
      couches: {
        name: 'Capas flotantes',
        line: 'Un panel junto a su botón. Escape lo cierra.',
        link: 'Ver Popover',
      },
      affichage: {
        name: 'Visualización',
        line: 'Insignias, tarjetas y tablas.',
        link: 'Ver Badge',
      },
      navigation: {
        name: 'Navegación',
        line: 'Pestañas que se recorren con las flechas.',
        link: 'Ver Tabs',
      },
      mouvement: {
        name: 'Movimiento',
        line: 'Un título que llega palabra a palabra, quieto con movimiento reducido.',
        link: 'Ver SplitHeading',
      },
    },
    demos: {
      primary: 'Aceptar',
      secondary: 'Cancelar',
      tonal: 'Borrador',
      glass: 'Vidrio',
      message: 'Mensaje',
      messageHelp: 'El campo crece con el texto.',
      messageValue: 'Hola, quisiera un presupuesto.',
      popoverTrigger: 'Abrir el panel',
      popoverTitle: 'Un panel anclado',
      popoverBody: 'Sigue a su botón y devuelve el foco al cerrarse.',
      stable: 'Estable',
      fresh: 'Nuevo',
      offline: 'Sin conexión',
      tabsLabel: 'Pasos',
      tabs: [
        ['Instalar', 'Un comando, un archivo.'],
        ['Importar', 'Una hoja de estilos, una vez.'],
        ['Componer', 'Componentes por su nombre.'],
      ],
      replay: 'Repetir',
      splitTitle: 'Un título que se toma su tiempo.',
    },
  },
  qualities: {
    title: 'Las cualidades',
    lede: 'Cuatro compromisos. Cada uno se comprueba en el código.',
    marquee: 'Lo que Opale garantiza',
    marqueeLabels: { pause: 'Pausar', play: 'Reproducir' },
    marqueeItems: (count) => [
      'WCAG 2.2 AA',
      'React 19',
      'Renderizado en servidor',
      'Vidrio líquido',
      'Claro y oscuro',
      'TypeScript estricto',
      `${count} componentes`,
    ],
    proofs: (dependencies) => [
      {
        title: 'Accesible',
        text: 'Roles nativos, teclado completo, foco visible en cada fondo. Cada página de componente detalla su recorrido.',
      },
      {
        title: dependencies.length === 1 ? 'Una sola dependencia' : 'Pocas dependencias',
        text: `En ejecución, Opale solo añade ${dependencies.join(', ')}. React 19 sigue siendo tuyo, como dependencia par.`,
      },
      {
        title: 'Renderizado en servidor',
        text: 'Los componentes se importan en un Server Component de Next.js. Los que necesitan el navegador ya llevan «use client».',
      },
      {
        title: 'Vidrio líquido',
        text: 'Una prop, liquidGlass, componente por componente. Sin ella, el componente sigue sólido y legible.',
      },
    ],
  },
  pages: {
    title: 'Páginas completas',
    lede: 'PageScaffold coloca la cabecera, la navegación, la búsqueda y el pie de página. Solo falta tu contenido.',
    caption:
      'Vista previa de una página hecha con PageScaffold. Imagen fija: sus enlaces no llevan a ninguna parte.',
    link: 'Ver el ejemplo',
    scaffold: {
      site: 'Atelier',
      home: 'Inicio',
      work: 'Proyectos',
      about: 'Acerca de',
      title: 'Una base para tus proyectos',
      description: 'Una página acogedora, con los componentes Opale ya incluidos.',
      card: 'Tu contenido',
      body: 'Añade aquí tus secciones, tarjetas e interacciones.',
      legal: 'Aviso legal',
    },
  },
  install: {
    title: 'Instalar Opale UI',
    lede: 'Opale no está en npm. Cada versión es una release de GitHub, con su archivo ya construido.',
    commandLabel: 'Comando de instalación',
    copy: 'Copiar el comando',
    clipboardLabels: {
      copy: 'Copiar',
      copied: 'Copiado',
      copiedStatus: 'Copiado al portapapeles',
      failed: 'Error al copiar',
    },
    guide: 'Leer la guía de instalación',
    migrate: 'Migrar a la 3.0',
  },
};

export const HOME_COPY: Readonly<Record<Language, HomeCopy>> = { FR, EN, ES };
