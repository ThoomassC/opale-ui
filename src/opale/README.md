# `src/opale` — les composants d'Opale et leur matériau

Ce dossier est le **point d'entrée racine du paquet**. `import { Button } from
'@thomascaron/opale-ui'` sert ce code, et `@thomascaron/opale-ui/opale.css` sert
ses deux feuilles compilées en une.

Tout ce qu'il contient est écrit par Opale. C'est une phrase courte, et elle a
coûté cher : jusqu'à la 3.1, ce dossier était la copie d'une librairie tierce.
La section « D'où vient ce dossier » plus bas raconte cet héritage, parce qu'il
explique le nom du dossier, le préfixe des classes et la présence d'un fichier
de notices à la racine — trois choses qu'on ne devine pas.

## Ce qu'il y a dedans

Deux familles de code, et elles ne se ressemblent pas.

**`components/` — des composants composés, un dossier chacun.** Ce sont les
pièces qui ont une structure interne, un état, ou les deux : elles ne se
réduisent pas à un élément natif habillé.

| Composant | Ce que c'est | Monte `Glass` |
| --- | --- | --- |
| `Glass` | le matériau lui-même | — |
| `Modal` | un dialogue à portail, contrôlé | oui |
| `PageScaffold` | une page complète et configurable | via Topbar et SearchBar |
| `SearchBar` | un champ de recherche à suggestions | oui |
| `Sidebar` | un rail de navigation pliable | oui |
| `SiteNav` | la navigation de site, à bulle | **non** |
| `Tabs` | le motif d'onglets ARIA | oui |
| `ToastProvider` (+ `useToast`) | une file de notifications | oui |
| `Topbar` | une barre de page composée | oui |

`PageScaffold` assemble les briques publiques et délègue `liquidGlass` à `Topbar` et
`SearchBar`. `SiteNav` garde sa bulle propre, écrite dans `liquid-bubble.tsx`.

**`opale.tsx` — le catalogue plat.** Un seul fichier, et c'est un choix
défendable : ce sont des composants courts — une vingtaine de lignes en moyenne
sur les 1 923 du fichier —, dont la valeur est d'être **cohérents entre eux**
plutôt qu'isolables. Leurs fiches — nom, catégorie, phrase de présentation —
vivent dans `catalog.ts`, réparties en catégories — primitives, champs, données,
retour d'information, navigation, disposition, modules. Le namespace `Opale`
réunit tous les composants du paquet, composés compris ; les exemples importent
par nom (`import { Button } from '@thomascaron/opale-ui'`). `OpaleUI`,
`Opale.Background`, `OPALE_CATALOG` et `CatalogEntry` restent exportés, dépréciés
depuis 3.6.

La règle qui gouverne ce fichier est écrite en tête, et elle mérite d'être
répétée ici : **le verre est la peau, le contrôle natif reste le moteur.** Là où
un composant porte un état — case, interrupteur, curseur, sélecteur —, c'est
l'élément natif qui garde le focus, le clavier, le nom de formulaire et son
`ChangeEvent`. La prop `liquidGlass` ne change que la matière, jamais la
mécanique.

## Le matériau

`Glass` est la primitive du dossier, et la seule chose qu'il faut vraiment
comprendre pour lire le reste.

**Trois couches, et chacune fait une chose.** La **réfraction** échantillonne ce
qu'il y a derrière — `backdrop-filter: blur(0.75px) saturate(1.08)`, puis un
déplacement par bruit fractal. Le **lavis** pose la teinte et le bombé ; c'est la
seule couche colorée. Le **filet spéculaire** dessine l'arête de lumière en
`inset box-shadow`. Le contenu passe au-dessus des trois, dans son propre plan.

**Aucune bordure n'est peinte.** Le bord vient du seul filet spéculaire. Une
`border` en plus donnerait deux contours, et c'est le défaut le plus visible d'un
faux verre.

**Le filtre SVG est monté une seule fois pour toute la page.** Un compteur de
montages au niveau du module pose `#opale-glass-displacement` au premier verre et
le retire au dernier. C'est une correction, pas un raffinement : la version
d'avant en montait un **par instance**, tous porteurs du même `id`. Dix champs de
verre donnaient dix identifiants en double dans le document — un document
invalide, et un `url(#…)` qui n'en résout qu'un.

**Les couches sont nommées pour l'hôte.** L'enveloppe porte `data-opale-glass`,
et chaque couche `data-opale-glass-layer="refraction" | "tint" | "specular" |
"content"`. Ce sont des attributs **de contrat**, au même titre que les props, et
la raison est concrète : la classe d'un module CSS est hachée à la compilation,
donc innommable depuis une feuille d'hôte ou un test. La vitrine visait
auparavant `[class*='glassFilter']`, faute de mieux ; ce raccourci a cassé net le
jour où les couches ont changé de nom, **et il l'a fait en silence** — un
sélecteur sans correspondance ne rougit nulle part.

Les noms internes ont d'ailleurs tous changé à cette occasion : `glassFilter`,
`glassOverlay`, `glassSpecular`, `glassContainer` et `glassContent` n'existent
plus. Si une feuille d'hôte les cite encore, elle ne s'applique à rien.

**Les réglages du verre sont les mêmes d'un composant à l'autre.**
`liquidGlass` choisit la matière ; `className` et `style` vont au contenu.
`rootClassName` et `rootStyle` restent publics parce qu'ils sont **le seul accès
à l'enveloppe depuis l'appel** — celle qui porte largeur, rayon et ombre —, et
ils valent aussi en version pleine, fondus sur l'élément unique (le `style` de
l'appelant l'emporte). `enableLiquidAnimation` règle l'onde là où le composant
en fait naître une : ouverture de `Modal`, arrivée d'un toast, clic dans
`SearchBar`. Le reste est interne au matériau : `triggerAnimation`, l'onde d'une
surface (`enableLiquidAnimation` de `Topbar`, `Sidebar`, `Tabs`), `as` et
`pressFeedback` de `Modal` et `Tabs`, et l'ancien `enableClickAnimation` de
`SearchBar`. Ces props gardent leur effet et portent `@deprecated` ; en version
pleine, elles n'arrivent plus dans le DOM.

## Les classes stables

Les classes des modules sont hachées (`opale-mod-panel-x7Kq2`) : une feuille
d'hôte ne peut pas les nommer. Chaque racine et chaque partie qui compte porte
donc **aussi** une classe `opale-*` non hachée, dans les deux matières. La classe
du module reste à côté ; `stable-classes.test.tsx` vérifie la liste ci-dessous.

Le nommage suit `opale.css` : `opale-<bloc>` pour la racine,
`opale-<bloc>__<partie>` pour une partie, `--<état>` pour un état.
**`__shell` désigne l'élément qui porte la silhouette** (largeur, rayon, ombre) :
l'enveloppe du verre avec `liquidGlass`, le même élément que la racine sans.

| Composant | Classes |
| --- | --- |
| `Modal` | `opale-modal` (conteneur de portail), `__backdrop`, `__shell`, `__panel` (le `role="dialog"`), `__header`, `__heading`, `__title`, `__description`, `__close`, `__body`, `__footer` |
| `Tabs` | `opale-tabs`, `__shell`, `__list`, `__indicator`, `__trigger`, `__trigger-shell`, `__content` |
| `Sidebar` | `opale-sidebar`, `opale-sidebar--collapsed`, `__shell`, `__header`, `__items`, `__item`, `__item-icon`, `__item-fallback`, `__item-label`, `__badge`, `__footer`, `__toggle` |
| `Topbar` | `opale-topbar`, `__shell`, `__section`, `__brand`, `__brand-icon`, `__brand-content`, `__brand-title`, `__brand-subtitle`, `__actions`, `__divider` |
| `ToastProvider` | `opale-toast-provider` (conteneur de portail), `__stack`, `__region`, `__card`, `__surface`, `__body`, `__text`, `__title`, `__description`, `__close` |
| `SearchBar` | `opale-search-bar` (le repère `search`), `__shell`, `__icon`, `__input` |
| `SiteNav` | `opale-site-nav` (le `<header>`), `__shell`, `__brand`, `__inner`, `__list`, `__link`, `__bubble` |
| `PageScaffold` | `opale-page-scaffold`, `__skip-link`, `__header`, `__header-shell`, `__brand`, `__search`, `__suggestions`, `__suggestion`, `__suggestion-label`, `__suggestion-group`, `__no-results`, `__navigation`, `__mobile-navigation`, `__menu-button`, `__actions`, `__main`, `__intro`, `__footer`, `__footer-links`, `__copyright` |

`ToastProvider` s'appelle `opale-toast-provider` et non `opale-toast` : ce nom
appartient déjà à `Opale.Toast` dans `opale.css`.

**La spécificité est celle du module : une classe, (0,1,0).** À poids égal,
l'ordre tranche : la feuille d'hôte doit être chargée après celles d'Opale, ou
viser `.hote .opale-modal__panel`. Les états passent par les attributs ARIA
déjà posés — `[aria-selected='true']` sur un onglet, `[aria-current='page']` sur
une entrée ou un lien.

## Les feuilles

Neuf modules de style, un par composant rendu : **huit `.module.css` et un seul
`.module.scss`** (`SearchBar`). Le déséquilibre n'est pas une négligence, c'est
un vestige — le dossier était intégralement en SCSS, et chaque composant réécrit
est reparti en CSS simple. `sass` reste une dépendance de développement tant que
ce module unique existe.

**`motion.scss` ne contient plus qu'une chose** : le filet
`prefers-reduced-motion`. Tout le reste — `@tailwind components`,
`@tailwind utilities`, une famille de police universelle, trois classes globales
`.small` / `.medium` / `.large` — a disparu avec les `@apply` qu'il servait.
**Tailwind, PostCSS et Autoprefixer sont sortis des dépendances du paquet avec
eux** ; vérifiable dans `package.json`, qui ne déclare plus que `clsx` en
dépendance d'exécution.

Le filet reste global parce qu'il est le seul réglage qui **doit** l'être : il
vaut pour toutes les classes émises par les modules de ce dossier, quelle que
soit leur spécificité, et un composant ne peut pas le poser pour ses voisins. Il
réduit la liste des propriétés en transition plutôt que de couper les
transitions — les changements de **couleur** ne sont pas du mouvement, et les
supprimer rendrait les états brutaux sans rien apporter à qui demande moins
d'animation.

**`opale.css` porte les jetons `--opale-*`** : palette, typographie, espacement,
rayons, ombres, et les réglages du verre (`--opale-glass-radius`,
`--opale-glass-surface`, `--opale-glass-border`, `--opale-glass-highlight`,
`--opale-glass-shadow`). C'est le vocabulaire que les neuf modules consomment ;
aucun d'eux n'écrit une couleur en dur pour son texte.

Les deux feuilles sont importées par `index.ts` et non seulement déclarées —
`barrel-side-effects.structure.test.ts` tient cette paire.

## Ce qui est mesuré

Ce dépôt en fait un principe : ce qui n'est pas mesuré est nommé comme tel. Voici
donc les deux listes, dans cet ordre.

**La suite de tests.** `npx vitest run src/opale` rend **10 fichiers, 115 tests,
tous verts**. Sept des huit composants ont un fichier de test à côté d'eux :

| Fichier | Tests |
| --- | --- |
| `components/tabs/Tabs.test.tsx` | 24 |
| `components/toast/ToastProvider.test.tsx` | 14 |
| `components/modal/Modal.test.tsx` | 13 |
| `components/sidebar/Sidebar.test.tsx` | 8 |
| `components/topbar/Topbar.test.tsx` | 6 |
| `components/site-nav/site-nav.test.tsx` | 5 |
| `components/search-bar/SearchBar.test.tsx` | 1 |
| `opale-liquid-glass.test.tsx` | 33 |
| `opale.test.tsx` | 9 |
| `barrel-side-effects.structure.test.ts` | 2 |

**`Glass` n'a pas de fichier de test dans son dossier**, et c'est à noter
puisqu'il est la primitive que six composants montent. Il n'est pas pour autant
sans garde : `opale-liquid-glass.test.tsx` l'exerce à travers ses consommateurs,
et c'est là que vivent ses 33 assertions. Un test unitaire du matériau
lui-même — montage et démontage du filtre partagé, compteur d'instances, présence
des quatre couches — reste à écrire.

**Le linter.** `npx eslint src/opale` rend **0 erreur et 6 avertissements**. Plus
aucun fichier de ce dossier ne porte d'`eslint-disable` en tête : les deux
derniers, dans `Modal` et `ToastProvider`, masquaient un `setState` en corps
d'effet que la réécriture a supprimé. Il subsiste deux
`eslint-disable-next-line` **en ligne et documentés** dans `opale.tsx`, ce qui est
la forme qu'on veut — un pragma qui nomme sa règle et sa raison, pas un
interrupteur de fichier.

## Ce qui n'est pas mesuré

- **Le coût GPU du verre.** Le déplacement SVG est coupé sous
  `prefers-reduced-transparency`, `prefers-reduced-motion`, sous 37,5 rem et sous
  un pointeur grossier (`Glass.displacement.structure.test.ts`) ; le flou reste
  partout. Aucun profil n'a été pris : ni le panneau Performance de Chromium
  (durée de *Paint* et de *Composite* par image, en défilant une page chargée de
  verres), ni le clignotement des zones repeintes (*Paint flashing*), ni la
  comparaison avec et sans le filtre sur un appareil mobile réel.
- **Aucun audit `axe`** n'a été passé sur ces composants. Ce qu'on sait de leur
  accessibilité vient de la lecture du code, d'ESLint et des tests écrits à la
  main.
- **Aucun test de lecteur d'écran.** Ni VoiceOver, ni NVDA, ni Orca. En
  particulier, on ne sait pas ce qu'un lecteur annonce à l'apparition d'un toast,
  ni combien de fois.
- **Aucun rendu Firefox ni WebKit.** Les mesures citées dans les commentaires de
  ce dossier ont été faites sous Chromium (`chrome-headless-shell`) ou déduites de
  la cascade. `filter: url(#…)` et `backdrop-filter` n'ont pas de comportement
  vérifié hors Chromium, et ce sont précisément les deux déclarations dont le
  matériau dépend.
- **Aucun harnais navigateur en CI.** `jsdom` ne peint pas : `getComputedStyle` y
  rend les valeurs déclarées, aucun pixel n'existe. Les mesures de rendu ont été
  faites à la main, une fois, et **rien ne les rejoue**.
- **Aucun ratio de contraste n'est recalculé sur ces composants.** Les tests de
  contrat ne lisent que `src/tokens/`. Les composants consomment désormais des
  jetons mesurés, ce qui est une garantie bien meilleure qu'avant — mais c'est la
  garantie du **jeton**, pas celle de la composition rendue.

## Reste ouvert

- **Un seul module en SCSS.** `SearchBar.module.scss` est le dernier, et il tient
  `sass` dans les dépendances de développement à lui seul. Le convertir en CSS
  simple alignerait le dossier et retirerait une dépendance.
- **Les commentaires sont publiés.** Ils survivent dans `dist/opale/opale.css`. Sans
  conséquence fonctionnelle, mais si la feuille doit être minifiée, c'est côté
  configuration de build — jamais en appauvrissant la source.
- **Le poids du paquet n'a pas été remesuré** après la réécriture. La suppression
  de Tailwind et de huit composants devrait l'avoir fait baisser nettement ;
  « devrait » n'est pas une mesure.
