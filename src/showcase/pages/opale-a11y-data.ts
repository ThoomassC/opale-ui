import type { ComponentState } from './component-page';

/* LE CONTRAT D'ACCESSIBILITÉ ET LES ÉTATS DES FICHES DU CATALOGUE.

   Chaque ligne décrit ce que fait le code de `src/opale/catalog/` et
   `src/opale/opale-extras.tsx`, JSDoc comprise — rien de plus. Les accents
   graves deviennent du code à l'affichage (voir `InlineCode`). Une fiche sans
   entrée fait jeter la page : `component-page.structure.test.tsx` le verrait. */

export interface CatalogStateDoc {
  readonly state: ComponentState;
  readonly text: string;
}

export interface CatalogA11yDoc {
  readonly states: readonly CatalogStateDoc[];
  readonly keyboard: readonly string[];
  readonly semantics: readonly string[];
  readonly limits: readonly string[];
}

export const CATALOG_A11Y: Readonly<Record<string, CatalogA11yDoc>> = {
  Button: {
    states: [
      { state: 'disabled', text: 'La prop `disabled` est transmise au `<button>` natif.' },
      {
        state: 'loading',
        text: '`loading` pose `disabled` sur le bouton et remplace l’icône de début par un indicateur `aria-hidden`.',
      },
    ],
    keyboard: [
      'Élément `<button>` natif : Entrée et Espace l’activent.',
      'Atteint par Tab ; retiré de l’ordre de tabulation quand il est désactivé ou en chargement.',
    ],
    semantics: [
      'Élément `<button>` natif, `type="button"` par défaut.',
      '`startIcon` et l’indicateur de chargement sont `aria-hidden` : le nom accessible vient du seul libellé.',
      'Un bouton sans texte se nomme par `aria-label` — voir `IconActionButton`.',
    ],
    limits: ['`loading` ne pose pas `aria-busy` : l’attente n’est dite que par la désactivation.'],
  },
  Pressable: {
    states: [
      { state: 'disabled', text: 'Comme `Button` : `disabled` est transmis au `<button>` natif.' },
      {
        state: 'loading',
        text: 'Comme `Button` : `loading` désactive le bouton et affiche un indicateur `aria-hidden`.',
      },
    ],
    keyboard: ['Élément `<button>` natif : Entrée et Espace l’activent.'],
    semantics: [
      'Un `Button` rendu avec la variante `text` par défaut ; il en garde la sémantique.',
    ],
    limits: [],
  },
  InlineInput: {
    states: [
      { state: 'disabled', text: 'Comme `Input` : `disabled` est transmis à l’`<input>` natif.' },
      {
        state: 'error',
        text: 'Comme `Input` : `error` pose `aria-invalid` et un message en `role="alert"`.',
      },
    ],
    keyboard: [
      'Entrée valide la saisie (`onCommit`) sans envoyer le formulaire parent.',
      'Échap rétablit la dernière valeur validée si la saisie a changé ; sinon la touche remonte, vers une `Modal` par exemple.',
      'Quitter le champ, avec Tab par exemple, valide la valeur si elle a changé.',
      'Entrée et Échap sont ignorées pendant une composition IME.',
    ],
    semantics: [
      'Même sémantique qu’`Input`.',
      'La valeur rétablie par Échap est réémise par un événement `input`, donc reçue par `onChange`.',
    ],
    limits: [],
  },
  Input: {
    states: [
      { state: 'disabled', text: 'La prop `disabled` est transmise à l’`<input>` natif.' },
      {
        state: 'error',
        text: '`error` pose `aria-invalid="true"` et affiche le message, relié par `aria-describedby` et annoncé par `role="alert"`.',
      },
    ],
    keyboard: ['Élément `<input>` natif : saisie et déplacement standards ; atteint par Tab.'],
    semantics: [
      'Le libellé est un `<label htmlFor>` relié à l’`id` du champ, généré par `useId` à défaut.',
      'Le texte d’aide ou l’erreur est une description (`aria-describedby`), hors du nom accessible.',
      '`role="alert"` n’est posé que sur l’erreur, pas sur le texte d’aide.',
    ],
    limits: [],
  },
  Checkbox: {
    states: [
      {
        state: 'disabled',
        text: 'La prop `disabled` est transmise à l’`<input type="checkbox">` natif.',
      },
    ],
    keyboard: ['Case native : Espace la coche ou la décoche ; atteinte par Tab.'],
    semantics: [
      'L’`<input type="checkbox">` natif porte l’état ; la coche visible est une décoration.',
      '`aria-labelledby` désigne le seul libellé : la description n’entre pas dans le nom.',
      'La `description` est reliée par `aria-describedby`.',
      'Toute la rangée est un `<label>`, cliquable sur toute sa surface.',
    ],
    limits: [],
  },
  Toggle: {
    states: [
      {
        state: 'disabled',
        text: 'La prop `disabled` est transmise à l’`<input type="checkbox">` natif.',
      },
    ],
    keyboard: ['Case native : Espace bascule l’état ; atteinte par Tab.'],
    semantics: [
      'Un `<input type="checkbox">` natif dans un `<label>` ; la piste et la poignée sont peintes depuis `:checked`.',
    ],
    limits: ['Aucun `role="switch"` : l’interrupteur est annoncé comme une case à cocher.'],
  },
  Slider: {
    states: [
      {
        state: 'disabled',
        text: 'La prop `disabled` est transmise à l’`<input type="range">` natif.',
      },
    ],
    keyboard: [
      'Curseur `<input type="range">` natif : flèches, Début, Fin, Page précédente et Page suivante changent la valeur.',
    ],
    semantics: [
      'Rôle `slider` natif ; la valeur est exposée par le curseur lui-même.',
      'Le libellé est un `<label htmlFor>` ; la valeur affichée reste hors du nom accessible.',
      'Le remplissage et la bulle sont `aria-hidden`.',
      'L’étirement de la bulle est coupé sous `prefers-reduced-motion: reduce`.',
    ],
    limits: [],
  },
  MultiSelect: {
    states: [
      {
        state: 'empty',
        text: 'Sans option, `aria-activedescendant` n’est pas posé : il ne désigne jamais un élément absent.',
      },
    ],
    keyboard: [
      'Flèche bas et flèche haut déplacent l’option active, en bouclant aux extrémités.',
      'Début et Fin vont à la première et à la dernière option.',
      'Espace et Entrée cochent ou décochent l’option active.',
      'La liste est un seul arrêt de tabulation ; les options ne sont pas focusables.',
    ],
    semantics: [
      '`role="listbox"` avec `aria-multiselectable="true"`, nommée par `aria-labelledby` vers le libellé.',
      'Options en `role="option"` avec `aria-selected` ; l’option active est désignée par `aria-activedescendant`.',
      'Un `<select multiple>` natif caché (`aria-hidden`, `tabIndex=-1`) porte la valeur pour le formulaire.',
      'Le `helperText` est relié par `aria-describedby`.',
    ],
    limits: [
      'Le `<select>` caché n’écrit que les libellés en chaîne ; sinon il reprend la valeur de l’option.',
    ],
  },
  Select: {
    states: [{ state: 'disabled', text: 'La prop `disabled` est transmise au `<select>` natif.' }],
    keyboard: ['Élément `<select>` natif : clavier du navigateur ; atteint par Tab.'],
    semantics: [
      'Un `<select>` natif, relié à son libellé par un `<label htmlFor>`.',
      'Le `helperText` est relié par `aria-describedby`, hors du nom accessible.',
    ],
    limits: [],
  },
  Autocomplete: {
    states: [
      { state: 'disabled', text: 'Comme `Input` : `disabled` est transmis à l’`<input>` natif.' },
      {
        state: 'error',
        text: 'Comme `Input` : `error` pose `aria-invalid` et un message en `role="alert"` relié par `aria-describedby`.',
      },
    ],
    keyboard: ['Suggestions natives d’un `<datalist>` : clavier du navigateur.'],
    semantics: [
      'Un `Input` relié par `list` à un `<datalist>` dont l’`id` est généré par `useId`.',
    ],
    limits: ['L’affichage et l’annonce des suggestions dépendent du navigateur.'],
  },
  Form: {
    states: [],
    keyboard: ['Élément `<form>` natif : Entrée dans un champ texte envoie le formulaire.'],
    semantics: ['Un `<form>` natif en colonne ; les attributs de l’appelant sont transmis.'],
    limits: [],
  },
  SegmentedControl: {
    states: [],
    keyboard: [
      'Chaque option est un `<button>` natif : Tab passe de l’une à l’autre, Entrée et Espace la choisissent.',
    ],
    semantics: [
      'Conteneur en `role="group"`.',
      'Chaque option porte `aria-pressed`.',
      'L’indicateur qui glisse sous l’option choisie est `aria-hidden`.',
    ],
    limits: [],
  },
  IconActionButton: {
    states: [
      { state: 'disabled', text: 'Comme `Button` : `disabled` est transmis au `<button>` natif.' },
      {
        state: 'loading',
        text: 'Comme `Button` : `loading` désactive le bouton et affiche un indicateur `aria-hidden`.',
      },
    ],
    keyboard: ['Élément `<button>` natif : Entrée et Espace l’activent.'],
    semantics: [
      'La prop `label`, obligatoire, devient l’`aria-label` du bouton.',
      'Le nom accessible ne dépend pas du glyphe affiché.',
    ],
    limits: [],
  },
  Card: {
    states: [],
    keyboard: [],
    semantics: [
      'Le `title` est rendu dans un `<h3>`, le `subtitle` dans un `<p>`.',
      'Conteneur `<div>` sans rôle ; les attributs de l’appelant sont transmis.',
    ],
    limits: ['Le titre est toujours un `<h3>`, quel que soit le plan de la page hôte.'],
  },
  CardGrid: {
    states: [],
    keyboard: [],
    semantics: [
      'Un `<div>` de mise en grille, sans rôle ; les attributs de l’appelant sont transmis.',
    ],
    limits: [],
  },
  DataTable: {
    states: [
      {
        state: 'loading',
        text: '`loading` affiche une ligne « Chargement des données… », annoncée par la région `role="status"`.',
      },
      {
        state: 'empty',
        text: 'Avec `rows` vide, une cellule pleine largeur affiche « Aucune donnée à afficher. » (`labels.empty`).',
      },
    ],
    keyboard: [
      'En-tête triable : `<button>` natif, atteint par Tab, déclenché par Entrée ou Espace.',
      'Chaque action alterne ordre croissant et décroissant ; pas de déplacement aux flèches.',
    ],
    semantics: [
      'Une vraie `<table>`, `<caption>` optionnelle ; les en-têtes portent `scope="col"`.',
      '`aria-sort` n’est posé que sur la colonne triée (`ascending` ou `descending`).',
      'Une région `role="status"` masquée annonce « Trié par X, ordre croissant » après une action, jamais au montage.',
      'Les icônes de tri et d’état vide sont décoratives ; l’indicateur de chargement est `aria-hidden`.',
    ],
    limits: [
      'Sans `rowKey`, l’indice sert de clé : il ne vaut que pour des lignes stables.',
      'Une cellule sans valeur triable (nœud React sans `sortValue`) part en fin de liste dans les deux sens.',
      '`loading` ne pose pas `aria-busy`.',
    ],
  },
  DescriptionList: {
    states: [],
    keyboard: [],
    semantics: ['Liste `<dl>` native ; chaque paire `<dt>`/`<dd>` est groupée dans un `<div>`.'],
    limits: [],
  },
  BulletList: {
    states: [],
    keyboard: [],
    semantics: ['Liste `<ul>` native de `<li>`.'],
    limits: [],
  },
  Badge: {
    states: [],
    keyboard: [],
    semantics: [
      'Un `<span>` sans rôle.',
      'Avec `dot`, le texte est masqué à l’œil mais reste lu par les lecteurs d’écran.',
    ],
    limits: [],
  },
  Rating: {
    states: [],
    keyboard: [],
    semantics: [
      '`role="img"` et `aria-label` du type « 3,75 sur 5 », à virgule française.',
      'Chaque étoile est un `<svg>` `aria-hidden` et `focusable="false"`.',
      'La note est arrondie au quart avant le rendu : le nom et le dessin disent la même valeur.',
    ],
    limits: [
      'La note est arrondie au quart et bornée à [0, max] ; une valeur non finie vaut 0.',
      'Le barème est arrondi à un entier entre 1 et 20 ; une valeur non finie donne 5.',
    ],
  },
  RatingInput: {
    states: [
      {
        state: 'disabled',
        text: '`disabled` est posé sur le `<fieldset>`, ce qui désactive tous les boutons radio.',
      },
    ],
    keyboard: [
      'Groupe de radios natifs : Tab entre dans le groupe, les flèches déplacent la sélection.',
    ],
    semantics: [
      '`<fieldset>` dont la `<legend>` porte le libellé, obligatoire.',
      'Chaque `<input type="radio">` est nommé « n sur total » par `aria-label` ; les étoiles sont `aria-hidden`.',
      'Les radios partagent un `name`, généré par `useId` à défaut.',
    ],
    limits: [],
  },
  Pagination: {
    states: [
      {
        state: 'disabled',
        text: '`disabled` désactive tous les boutons ; Précédent et Suivant le sont aussi aux bornes.',
      },
      {
        state: 'empty',
        text: 'Avec `pageCount` à 0, aucun bouton de page n’est rendu et Précédent et Suivant sont désactivés.',
      },
    ],
    keyboard: [
      'Boutons `<button>` natifs : Tab de l’un à l’autre, Entrée et Espace choisissent la page.',
    ],
    semantics: [
      'Repère `<nav>` nommé par `aria-label` (« Pagination » par défaut).',
      'La page courante porte `aria-current="page"`.',
      'Chaque bouton est nommé par `aria-label` : « Page 3 », « Page précédente », « Page suivante ».',
      'Les points de suspension entre pages sont `aria-hidden`.',
    ],
    limits: [],
  },
  Skeleton: {
    states: [
      {
        state: 'loading',
        text: 'Espace réservé pendant un chargement, toujours `aria-hidden="true"`, même si l’appelant passe un autre attribut.',
      },
    ],
    keyboard: [],
    semantics: [
      '`aria-hidden="true"` imposé : le squelette n’est pas exposé aux technologies d’assistance.',
    ],
    limits: ['Décoratif : c’est le conteneur qui doit annoncer le chargement (`role="status"`).'],
  },
  StatCard: {
    states: [],
    keyboard: [],
    semantics: ['Surface `<div>` sans rôle ; la valeur est dans un `<strong>`.'],
    limits: [],
  },
  Donut: {
    states: [],
    keyboard: [],
    semantics: ['`role="img"` avec `aria-label` égal à `label`, « {value}% » par défaut.'],
    limits: [],
  },
  LegalLinks: {
    states: [],
    keyboard: ['Liens `<a>` natifs : Entrée suit le lien.'],
    semantics: ['Rendu en `<nav>` avec `aria-label="Liens légaux"`.'],
    limits: [],
  },
  Heading: {
    states: [],
    keyboard: [],
    semantics: ['Un vrai titre `<h1>` à `<h4>` selon `level` (`<h2>` par défaut).'],
    limits: [],
  },
  Text: {
    states: [],
    keyboard: [],
    semantics: ['Un paragraphe `<p>` ; `variant` ne change que le style.'],
    limits: [],
  },
  Icon: {
    states: [],
    keyboard: [],
    semantics: ['Avec `label` ou `aria-label`, le `<span>` reçoit `role="img"` et ce nom.'],
    limits: [
      'Sans nom, ni rôle ni `aria-hidden` ne sont posés : une icône décorative doit recevoir `aria-hidden`.',
    ],
  },
  Feedback: {
    states: [
      {
        state: 'error',
        text: 'Le ton `error` pose `role="alert"` ; les autres tons posent `role="status"`.',
      },
    ],
    keyboard: [],
    semantics: [
      'Région live : `role="alert"` pour une erreur, `role="status"` sinon, sur le même nœud dans les deux matériaux.',
      'Le titre par défaut est un mot français lié au ton : « Erreur », « Information »…',
    ],
    limits: [
      'La région live naît avec le message : son annonce n’est pas garantie, surtout avec `role="status"`.',
      'Pour une annonce sûre, montez l’encart à l’avance et ne changez que son contenu, ou passez par `ToastProvider`.',
      'Comportement non vérifié avec un lecteur d’écran.',
    ],
  },
  Toast: {
    states: [
      {
        state: 'error',
        text: 'Les tons `error` et `warning` entrent dans une région `role="alert"`, les autres dans une région `role="status"`.',
      },
    ],
    keyboard: [
      'La croix est un `<button>` natif : Entrée et Espace ferment.',
      'Un message du haut passe en tête de l’ordre de tabulation, un message du bas à la fin.',
    ],
    semantics: [
      'Rendu dans un portail, à une ancre partagée par position qui porte deux régions live permanentes (`status` et `alert`).',
      'L’icône du ton double la couleur à l’œil et n’a pas de nom accessible.',
      'La croix est nommée « Fermer la notification » et n’apparaît qu’avec `onOpenChange`.',
    ],
    limits: [
      'Pour garantir l’annonce, montez le message fermé puis ouvrez-le, ou gardez une autre instance à la même place.',
      'Ni minuterie ni file : c’est le rôle de `ToastProvider`.',
      'Un message ouvert en haut passe avant un éventuel lien d’évitement dans l’ordre de tabulation.',
      'Sans `document` (rendu serveur), rien n’est rendu.',
    ],
  },
  Spinner: {
    states: [
      {
        state: 'loading',
        text: 'Témoin d’attente : `role="status"` avec un libellé lisible, « Chargement » par défaut.',
      },
    ],
    keyboard: [],
    semantics: ['`role="status"` sur le conteneur ; le cercle animé est `aria-hidden`.'],
    limits: [
      'La région `status` naît avec le témoin : son apparition n’est pas toujours annoncée.',
    ],
  },
  ProgressBar: {
    states: [],
    keyboard: [],
    semantics: [
      '`role="progressbar"` avec `aria-valuenow`, `aria-valuemin=0` et `aria-valuemax=100`.',
      'Nommée par `aria-labelledby` vers le libellé visible, quand il est fourni.',
    ],
    limits: [],
  },
  ConfirmDialog: {
    states: [],
    keyboard: [
      'Échap ferme le dialogue (`onOpenChange(false)`).',
      'Tab et Maj+Tab restent piégés dans le dialogue.',
      'Annuler et Confirmer sont des `<button>` natifs.',
    ],
    semantics: [
      'Délègue à `Modal` : `role="dialog"` et `aria-modal="true"`.',
      'Nommé par son titre (`aria-labelledby`) ; le corps est la description (`aria-describedby`).',
      'Focus donné au panneau à l’ouverture, rendu au déclencheur à la fermeture.',
      'Pendant l’ouverture, l’arrière-plan est `inert` et `aria-hidden`, et le défilement de la page est bloqué.',
    ],
    limits: ['Confirmer ne ferme pas le dialogue : l’appelant le ferme après son action.'],
  },
  EmptyState: {
    states: [
      {
        state: 'empty',
        text: 'Composant d’état vide : une `Card` dont le titre par défaut est « Aucun résultat ».',
      },
    ],
    keyboard: [],
    semantics: ['Le titre est le `<h3>` de la `Card`, la description son sous-titre.'],
    limits: ['L’icône de loupe n’a ni nom ni `aria-hidden`.'],
  },
  Navbar: {
    states: [],
    keyboard: [
      'Entrée sans `href` : `<button>` natif, Entrée et Espace la choisissent.',
      'Entrée avec `href` : `<a>` natif, Entrée suit le lien.',
    ],
    semantics: [
      'Rendu en `<nav>`, nommé « Navigation » par défaut ; `aria-label` le remplace.',
      'L’entrée courante porte `aria-current="page"`, lien ou bouton.',
      'Sous verre, le `<nav>` et son nom restent sur le même nœud.',
    ],
    limits: [
      '`onValueChange` ne part que des entrées sans `href` : suivre un lien ne change pas l’entrée courante.',
    ],
  },
  Menu: {
    states: [],
    keyboard: [
      '`<details>`/`<summary>` natifs : Entrée et Espace sur le résumé ouvrent ou referment le menu.',
    ],
    semantics: [
      'L’état ouvert ou fermé est exposé nativement par le `<summary>`.',
      'Avec `items`, le contenu est une `Navbar` (`<nav>` nommé « Navigation ») ; sinon ce sont les `children`.',
    ],
    limits: [
      'Ni Échap ni flèches : seuls Tab et le comportement natif de `<details>` s’appliquent.',
      'La `Navbar` interne ne reçoit pas de `value` : aucune entrée n’y porte `aria-current`.',
    ],
  },
  Link: {
    states: [],
    keyboard: ['Élément `<a>` natif : Entrée suit le lien.'],
    semantics: ['Un `<a>` natif ; `href` et les attributs `aria-*` lui sont transmis.'],
    limits: [],
  },
  SidePanel: {
    states: [],
    keyboard: [
      'Échap ferme le panneau, sauf si un contrôle interne a déjà consommé la touche.',
      'Tab sur le dernier élément revient au premier, Maj+Tab sur le premier va au dernier.',
      'Le focus va au panneau à l’ouverture et revient à l’élément qui l’avait à la fermeture.',
    ],
    semantics: [
      '`role="dialog"`, `aria-modal="true"`, nommé par son titre `<h2>` (« Panneau » par défaut, `labels.title`).',
      'Arrière-plan `inert` et `aria-hidden` pendant l’ouverture, valeurs d’origine restaurées ensuite.',
      'Croix nommée « Fermer » (`labels.close`), rendue seulement avec `onOpenChange`.',
      'Le voile est `aria-hidden` ; un clic dessus ferme le panneau. Le défilement de la page est verrouillé.',
    ],
    limits: [],
  },
  CommandPalette: {
    states: [],
    keyboard: [
      'Échap ferme la palette, sauf si un contrôle interne a déjà consommé la touche.',
      'Le focus arrive dans le champ de recherche : on tape sans cliquer.',
      'Tab et Maj+Tab restent piégés ; le focus revient au déclencheur à la fermeture.',
    ],
    semantics: [
      '`role="dialog"`, `aria-modal="true"`, nommé « Palette de commandes » (`labels.title`).',
      'Champ `type="search"` libellé « Rechercher une commande » (`labels.search`).',
      'Arrière-plan `inert` et `aria-hidden` pendant l’ouverture.',
    ],
    limits: ['Les résultats et leur navigation sont fournis par l’appelant.'],
  },
  Breadcrumb: {
    states: [],
    keyboard: [
      'Étapes avec `href` : `<a>` natif, Entrée suit le lien ; les autres ne sont pas focusables.',
    ],
    semantics: [
      '`<nav>` nommé « Fil d’Ariane », contenant une liste ordonnée `<ol>`.',
      'La dernière étape porte `aria-current="page"`.',
      'Le séparateur « / » est `aria-hidden`.',
    ],
    limits: [],
  },
  CookieBanner: {
    states: [],
    keyboard: [
      'Refuser et Accepter sont des `<button>` natifs.',
      'Échap ne ferme pas le bandeau : il ne se ferme que sur un choix.',
    ],
    semantics: [
      '`<section>` nommée par `aria-label` (« Consentement aux cookies » par défaut) et décrite par `aria-describedby`.',
      'Un repère nommé et non une région live : il se trouve dans la liste des régions du lecteur d’écran.',
      'Pendant l’animation de sortie, l’enveloppe est `inert` et `aria-hidden`.',
      'Refuser et Accepter ont le même poids visuel.',
    ],
    limits: [
      'Sans stockage (navigation privée, cookies bloqués), le choix ne vaut que pour la visite en cours.',
      '`onAccept` ne part qu’au clic : lisez `readCookieConsent()` au chargement.',
      'Rendu côté serveur, le bandeau n’est retiré qu’après hydratation si un choix est déjà mémorisé.',
    ],
  },
  SelectionBar: {
    states: [],
    keyboard: [],
    semantics: [
      'Le compte « N sélectionné(s) » est dans une région `aria-live="polite"` montée avec la barre.',
    ],
    limits: [],
  },
  Stack: {
    states: [],
    keyboard: [],
    semantics: ['Un `<div>` de mise en page, sans rôle ni attribut ARIA propre.'],
    limits: [],
  },
  Layout: {
    states: [],
    keyboard: [],
    semantics: [
      'Le contenu est rendu dans un repère `<main>` ; `navigation` est posée avant, telle quelle.',
    ],
    limits: [],
  },
  Divider: {
    states: [],
    keyboard: [],
    semantics: ['Élément `<hr>` natif, exposé comme séparateur.'],
    limits: [],
  },
  BackgroundSurface: {
    states: [],
    keyboard: [],
    semantics: ['Un `<div>` décoratif, sans rôle ni attribut ARIA propre.'],
    limits: [],
  },
  FileCard: {
    states: [],
    keyboard: [
      'Avec `onClick` : `<button>` natif, Entrée et Espace déclenchent la carte.',
      'Sans `onClick` : un `<div>`, non focusable.',
    ],
    semantics: [
      'Avec `onClick`, la carte est un `<button>` qui porte `aria-pressed` selon `selected`.',
      'Sans `onClick` mais `selected`, un texte masqué « Sélectionné » est ajouté.',
      'La sélection se voit aussi par un liseré et une coche, pas seulement par la couleur.',
    ],
    limits: [],
  },
  Dropzone: {
    states: [
      {
        state: 'disabled',
        text: 'Avec `disabled`, le champ fichier est désactivé, les dépôts sont ignorés et « Sélection désactivée » s’affiche.',
      },
      {
        state: 'error',
        text: 'Un fichier refusé (nombre, taille, type) affiche le message en `role="alert"`, pose `aria-invalid` et appelle `onError`.',
      },
    ],
    keyboard: [
      'Le `<input type="file">` natif, masqué mais focusable, est atteint par Tab ; Entrée ou Espace ouvrent le sélecteur.',
    ],
    semantics: [
      'La zone est un `<label>` qui englobe le champ : il tire son nom du texte de la zone.',
      'Le message d’erreur est dans une région `role="alert"` montée en permanence.',
    ],
    limits: [
      'Le glisser-déposer n’a pas d’équivalent clavier propre : le sélecteur natif en tient lieu.',
    ],
  },
  Lightbox: {
    states: [],
    keyboard: [
      'Échap ferme l’aperçu, sauf si un contrôle interne a déjà consommé la touche.',
      'Tab et Maj+Tab restent piégés ; le focus va au panneau à l’ouverture et revient au déclencheur ensuite.',
    ],
    semantics: [
      '`role="dialog"`, `aria-modal="true"`, nommé par `aria-label` (« Aperçu » par défaut).',
      '`alt` est obligatoire et posé sur l’`<img>`.',
      'Bouton Fermer du pied rendu par défaut, retiré par `footerClose={false}` ; arrière-plan `inert` et `aria-hidden` pendant l’ouverture.',
    ],
    limits: ['Sans `src`, le dialogue ne s’ouvre pas, même avec `open`.'],
  },
  Clipboard: {
    states: [
      { state: 'disabled', text: '`disabled` est transmis au bouton de copie.' },
      {
        state: 'error',
        text: 'Si la copie échoue, le bouton affiche « Échec de la copie », annoncé par `role="status"`.',
      },
    ],
    keyboard: ['`<button>` natif : Entrée et Espace lancent la copie.'],
    semantics: [
      'Une région `role="status"` masquée, montée vide, annonce « Copié dans le presse-papier » ou « Échec de la copie ».',
      'La région repasse par le vide avant chaque copie : deux copies de suite sont toutes deux annoncées.',
      'Les attributs et la `ref` vont au bouton de copie.',
    ],
    limits: [
      'Sans `navigator.clipboard` (HTTP hors localhost), la copie échoue toujours.',
      'Le succès s’efface après 2 secondes ; l’échec reste affiché jusqu’au prochain essai.',
    ],
  },
  Textarea: {
    states: [
      { state: 'disabled', text: '`disabled` est transmis au `<textarea>` natif.' },
      {
        state: 'error',
        text: '`error` pose `aria-invalid` et remplace l’aide par un message en `role="alert"`, désigné par `aria-describedby`.',
      },
    ],
    keyboard: [
      '`<textarea>` natif : Entrée ajoute une ligne, Tab quitte le champ.',
      'Avec `autoResize`, la hauteur suit la saisie sans rendu React ; au-delà de `maxRows`, le champ défile.',
    ],
    semantics: [
      'Libellé en `<label for>`, hors de la coquille ; l’aide ou l’erreur est une description.',
      'Le compte visible est `aria-hidden` : lu à chaque touche, il serait insupportable.',
      'Avec `maxLength`, la limite est une description lue au focus, et le reste est annoncé poliment après une pause de frappe, jamais au montage.',
      'Sans libellé ni nom ARIA, un avertissement l’écrit en développement.',
    ],
    limits: [
      'Avec `autoResize`, la poignée de redimensionnement disparaît.',
      'Sans `maxLength`, `showCount` affiche le compte sans rien annoncer.',
    ],
  },
  RadioGroup: {
    states: [
      {
        state: 'disabled',
        text: '`disabled` désactive tout le groupe par le `<fieldset>` natif ; une option `disabled` reste visible sans pouvoir être cochée.',
      },
      {
        state: 'error',
        text: '`error` pose `aria-invalid` sur le groupe et ajoute un message en `role="alert"` à sa description.',
      },
    ],
    keyboard: [
      'Radios natifs : Tab entre dans le groupe sur le radio coché, les flèches changent le choix, Espace coche.',
    ],
    semantics: [
      '`<fieldset role="radiogroup">` nommé par sa `<legend>` (`label`), ou par `aria-label`.',
      'L’aide et l’erreur décrivent le groupe, lues à l’entrée et non répétées à chaque flèche.',
      'Chaque radio est nommé par son libellé et décrit par sa `description`.',
      '`required` pose `required` sur chaque radio et `aria-required` sur le groupe.',
    ],
    limits: [
      '`ref`, `onChange` et `onBlur` vont à chaque radio : la ref est appelée une fois par radio.',
    ],
  },
  Field: {
    states: [
      {
        state: 'error',
        text: '`error` pose `aria-invalid` sur le contrôle et ajoute un message en `role="alert"` après l’aide, qui reste affichée.',
      },
    ],
    keyboard: ['Le clavier est celui du contrôle fourni : le champ n’en ajoute aucun.'],
    semantics: [
      'Le libellé est un `<label for>` et nomme aussi par `aria-labelledby` ce que `for` ne nomme pas : un `role="combobox"`, un bouton maison.',
      'Le contrôle reçoit `id`, `aria-labelledby`, `aria-describedby`, `aria-invalid` et `aria-required` par la fonction enfant ou par `useFieldProps()`.',
      'La marque `*` de `required` est `aria-hidden` : `aria-required` dit déjà « obligatoire ».',
    ],
    limits: [
      'Rien n’est posé d’office : un contrôle qui n’étale pas les props reçues reste sans nom.',
      '`required` ne pose pas la validation native : c’est au contrôle de la porter.',
    ],
  },
  Grid: {
    states: [],
    keyboard: [],
    semantics: [
      'Un `<div>` sans rôle : l’ordre de lecture est celui du code, quelle que soit la colonne.',
    ],
    limits: [
      'Un nombre de colonnes fixe ne passe pas à une colonne sur un écran étroit : préférez une largeur minimale de piste.',
    ],
  },
  Carousel: {
    states: [],
    keyboard: [
      'La piste est focalisable : Flèche droite et Flèche gauche passent à la diapositive suivante et précédente — inversées de droite à gauche —, Début et Fin vont aux extrémités.',
      'Les flèches d’un champ placé dans une diapositive restent au champ.',
      'Flèches, points et bouton pause sont des `<button type="button">` natifs. Aux extrémités, les flèches portent `aria-disabled="true"` et restent focalisables : le focus ne tombe jamais sur `<body>`.',
      'Le bouton pause vient en premier dans l’ordre de tabulation, avant la piste (APG).',
      'Alt, Ctrl ou Cmd avec une flèche restent au navigateur.',
      'Les diapositives entièrement hors de la piste sont `inert` : la tabulation ne se pose jamais hors de l’écran.',
    ],
    semantics: [
      'La racine est une `role="region"` nommée par `label`, avec `aria-roledescription="carrousel"`.',
      'Chaque diapositive est un `role="group"` nommé « 2 sur 6 », avec `aria-roledescription="diapositive"`.',
      'Les points forment un groupe nommé, un par position atteignable : les diapositives qui ne peuvent venir au bord de départ partagent celle du bout. Le point actif porte `aria-current="true"`.',
      'Une région polie annonce « 2 sur 6 » une fois la diapositive atteinte après un changement voulu, jamais pendant la lecture automatique ni quand un parent contrôlant refuse le changement.',
      'La lecture automatique rend toujours un bouton pause (WCAG 2.2.2) et s’arrête sous le pointeur, tant que le focus est dedans et tant que la page est cachée ; sous `prefers-reduced-motion`, elle ne démarre pas et les défilements sont instantanés.',
    ],
    limits: [
      'Sans JavaScript, la piste défile au doigt et à la molette, mais flèches, points et clavier ne font rien.',
      'Un changement de `prefers-reduced-motion` en cours de visite vaut au prochain montage.',
    ],
  },
  Reveal: {
    states: [],
    keyboard: [
      'Aucune touche propre. Le focus qui entre dans un bloc encore en attente le montre aussitôt : la tabulation ne se pose jamais sur un contenu invisible.',
    ],
    semantics: [
      'L’élément rendu par `as`, sans rôle ajouté : le contenu est lu dans l’ordre du code, qu’il soit monté ou non.',
      'Visible au repos : le serveur, une page sans script et l’impression rendent le contenu à son état final. Seuls les blocs sous la vue au montage passent en attente, jamais ceux déjà à l’écran.',
      'Sous `prefers-reduced-motion: reduce`, aucune transformation ni animation : le contenu est simplement là. Rien ne dépend de la couleur ; les contrastes forcés n’ont rien à corriger.',
    ],
    limits: [
      'La montée native, liée au défilement, se rejoue à chaque entrée par le bas, même avec `once`.',
      'Le repli observe la vue de la page : dans un conteneur qui défile lui-même, un bloc sous son bord reste visible et ne monte pas.',
    ],
  },
  Marquee: {
    states: [],
    keyboard: [
      'Le bouton « Mettre en pause » / « Lire » vient avant le contenu dans l’ordre de tabulation (WCAG 2.2.2). Le focus posé dans le contenu suspend aussi le défilement.',
    ],
    semantics: [
      'Une région nommée par `label`, sans `aria-roledescription` : le rôle natif est annoncé dans la langue du lecteur.',
      'Le contenu est lu une seule fois : la copie qui assure la boucle est `aria-hidden` et `inert`, rien n’y est focalisable.',
      'Le bouton change de nom plutôt que de porter `aria-pressed`, comme celui du carrousel.',
      'Immobile au serveur, sans script, sous `prefers-reduced-motion: reduce` et à l’impression : le contenu passe à la ligne, jamais rogné, et le bouton est caché faute de mouvement à suspendre. En contrastes forcés, le bouton prend les couleurs système.',
    ],
    limits: [
      'Les entrées ne sont pas interactives : ni lien, ni bouton, ni champ, ni média, ni `iframe`, ni composant à effets. La copie de la boucle est inerte — un clic sur deux n’y ferait rien — et dupliquerait champs, lecteurs et effets. Un avertissement de développement le signale.',
      'Les entrées sont rendues deux fois à l’écran : un `id` dans une entrée serait dupliqué.',
      'Un changement de `prefers-reduced-motion` en cours de visite arrête le mouvement tout de suite ; la copie masquée n’est retirée qu’au prochain montage.',
    ],
  },
  SplitHeading: {
    states: [],
    keyboard: ['Aucune touche propre : un titre ne reçoit pas le focus.'],
    semantics: [
      'Un vrai titre `h1` à `h6`, sans `aria-label` (certaines techniques d’assistance l’ignorent sur un titre) : son nom est la phrase entière, rendue une fois, cachée de l’écran. Les mots visibles sont `aria-hidden`.',
      'Copier le titre rend la phrase une fois : la copie lisible est exclue de la sélection.',
      'Visible au repos : le serveur, une page sans script, l’impression et `prefers-reduced-motion: reduce` montrent chaque mot à son état final. Sous mouvement réduit, rien ne bouge — pas même un fondu.',
      'Aucun décalage de mise en page : les mots sont en ligne dès le rendu serveur, seuls `transform` et `opacity` s’animent.',
    ],
    limits: [
      'Du texte seulement : un enfant riche (lien, `em`) est rendu tel quel, sans découpe ni animation, et un avertissement de développement le signale.',
      'Un texte de droite à gauche (hébreu, arabe…) est rendu sans découpe ni animation : un mot en `inline-block` est neutre pour l’algorithme bidi, et des mots découpés s’afficheraient en ordre inverse sur une page de gauche à droite.',
      'Un titre vide n’a pas de nom accessible : un avertissement de développement le signale.',
      'La phrase est dans le DOM deux fois — les mots visibles et la copie lisible : `innerText` et `textContent` du titre la rendent deux fois, et la recherche dans la page (Ctrl+F) peut compter une occurrence invisible. La copie à la souris, elle, ne la rend qu’une fois.',
      'Dans un conteneur qui défile lui-même, `trigger="view"` attend que le titre soit visible dans ce conteneur et dans la vue.',
    ],
  },
  Tooltip: {
    states: [],
    keyboard: [
      'Le focus du déclencheur l’ouvre sans délai ; Échap la retire sans déplacer le focus, et la touche est consommée.',
    ],
    semantics: [
      'La bulle porte `role="tooltip"` et s’ajoute à l’`aria-describedby` du déclencheur, sans remplacer sa description.',
      'Survolable et persistante (WCAG 1.4.13) : le pointeur peut passer du déclencheur à la bulle.',
      'Aucun nœud n’est rendu à la place de l’infobulle : l’enfant est le déclencheur.',
    ],
    limits: [
      'Rien au toucher : une information essentielle va dans la page, un contenu interactif dans un `Popover`.',
      'Le contenu n’est pas focalisable.',
    ],
  },
  Popover: {
    states: [],
    keyboard: [
      'Le déclencheur est un `<button>` natif : Entrée et Espace ouvrent et ferment.',
      'À l’ouverture, le focus va au premier élément focalisable du panneau.',
      'Échap ferme et rend le focus au déclencheur ; la touche est consommée, une modale englobante reste ouverte.',
      'Non modal, Tab depuis le dernier élément ferme et poursuit après le déclencheur.',
    ],
    semantics: [
      'Le panneau est un `role="dialog"` nommé par son déclencheur.',
      'Le déclencheur annonce `aria-haspopup="dialog"`, `aria-expanded` et, ouvert, `aria-controls`.',
      'Avec `modal`, le focus est piégé, le reste de la page est `inert` et `aria-modal="true"` est posé.',
    ],
    limits: ['L’appui au dehors ferme sans déplacer le focus.'],
  },
  DropdownMenu: {
    states: [
      {
        state: 'disabled',
        text: 'Un élément `disabled` reste atteignable aux flèches et porte `aria-disabled`, sans s’activer.',
      },
    ],
    keyboard: [
      'Sur le bouton, Entrée, Espace ou Flèche bas ouvrent sur le premier élément, Flèche haut sur le dernier.',
      'Dans le menu, les flèches bouclent, Début et Fin vont aux extrémités, une lettre saute à l’élément qui commence par elle.',
      'Entrée et Espace activent ; un élément referme le menu, une case ou un choix exclusif le laisse ouvert.',
      'Échap ferme et rend le focus au bouton ; Tab ferme et poursuit depuis le bouton.',
    ],
    semantics: [
      'Le bouton annonce `aria-haspopup="menu"` et `aria-expanded` ; le menu `role="menu"` est nommé par lui.',
      'Éléments `menuitem`, `menuitemcheckbox` et `menuitemradio`, avec `aria-checked` pour les deux derniers.',
      'Les groupes portent `role="group"`, nommés par leur `label` ; le filet `role="separator"`.',
    ],
    limits: [
      'Pas de sous-menus.',
      'Aucun élément n’est un arrêt de tabulation : le menu n’est pas une étape de la page.',
    ],
  },
};
