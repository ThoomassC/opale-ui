# Journal des versions

Généré par `npm run changelog` depuis `src/showcase/releases.ts` : ne pas modifier à la main.
Les mêmes notes, avec leurs démonstrations, sont sur la page « Versions » de la vitrine.

## 3.9.4 — 30 septembre 2026

À la marque de chaque projet : des jetons publics documentés, une couleur qui dérive ses états, un thème système sans flash, des feuilles pour Tailwind et sans polices, un paquet plus léger. Sans rupture.

### À votre marque

- **Une page pour personnaliser** — La page « Personnaliser » liste les jetons publics, stables en 3.x, avec leurs valeurs claires et sombres, et donne la recette d’une marque. checkBrand, dans le contrat, mesure les contrastes d’une couleur de marque et propose l’encre qui tient.
- **Une couleur, tous ses états** — data-opale-brand="derive" calcule survol, éclairci et anneau de focus depuis --opale-primary ; data-opale-scope applique une marque ou un rayon à un seul sous-arbre ; chaque aplat a son encre (--opale-on-primary, --opale-on-secondary, --opale-on-danger). Sans ces attributs, rien ne change.
- **Le thème du système, sans flash** — PageScaffold accepte defaultTheme="system" et themeStorageKey ; useOpaleTheme pilote le thème du document et opaleThemeScript le pose avant l’affichage, pour Next.js comme pour Vite.

### Le paquet

- **Des feuilles pour chaque projet** — opale.layered.css range Opale dans @layer opale, pour que les utilitaires de Tailwind v4 l’emportent ; opale-nofonts.css laisse vos propres polices. Les polices de repli sont calées sur Chivo et Bricolage pour limiter le saut au chargement, et le mouvement réduit ne touche plus que les éléments d’Opale.
- **Plus léger et mieux suivi** — Modal, les toasts, Rating et FileCard n’embarquent plus le jeu d’icônes entier (Modal : 10 → 5,7 ko compressés). SvgMap ne relit plus ses tracés à chaque rendu. L’archive publie un package.json épuré et un CHANGELOG ; la CI teste Node 20, 22 et 24 et React 19.0.

### Finitions

- **Des contours et du verre qui tiennent** — Le contour du bouton ghost est continu, l’anneau de focus suit la forme du bouton, les rayons et espacements des composants suivent l’échelle, le verre fonctionne dans un Shadow DOM, et un champ de verre ne déborde plus d’une Card de verre. Toast accepte title et description, comme showToast.

## 3.9.3 — 30 septembre 2026

Accessible partout : du verre lisible sur une page claire, des états visibles en contrastes forcés, un focus qui ne se perd plus et des changements annoncés. Sans rupture.

### Lisible partout

- **Du verre sur une page claire** — data-opale-glass-ink="page" sur un ancêtre donne au verre l’encre de la page : champs, onglets, erreurs et boutons pleins restent lisibles sur un fond clair uni. Sans backdrop-filter, le verre prend un lavis plus dense. Le verre par défaut ne change pas, sauf les toasts de verre, dont l’encre suit enfin leur couleur de ton (illisibles en sombre jusqu’ici).
- **Les états ne tiennent plus à la seule couleur** — L’onglet retenu est souligné, la page courante de Pagination a son anneau de focus, et en contrastes forcés Windows l’interrupteur, la progression, le segment, l’onglet, la page et l’entrée de Sidebar retenus restent visibles.

### Au clavier et à l’oreille

- **Le focus ne se perd plus** — Un bouton en chargement garde le focus et l’annonce (« Chargement en cours », traduisible) sans pouvoir être activé ; fermer un toast ou accepter le bandeau de cookies rend le focus d’où il venait ; Échap ferme Menu.
- **Ce qui change est annoncé** — Un Toast rendu à la demande est bien lu, la recherche de PageScaffold annonce le nombre de suggestions, et l’option active de CommandPalette reste à l’écran au clavier.
- **Moins de gestes précis** — SvgMap zoomée se déplace aussi par des flèches ; le rail replié de Sidebar montre une infobulle au survol et au focus, fermée par Échap ; les liens du fil d’Ariane font 24 px ; SiteNav tient à 320 px, même sans reset box-sizing chez l’hôte, et contraste en sombre ; l’interrupteur coché fonctionne de droite à gauche.

### Ajouts

- **Quelques options de plus, toutes facultatives** — Checkbox indeterminate, Layout mainAs, SvgMap panControls, labels sur Button et SearchBar ; Slider non contrôlé affiche sa valeur, DataTable qui défile se parcourt au clavier, et un nom manquant est signalé en développement sur plus de composants.

## 3.9.2 — 29 septembre 2026

Sûre en production : des dialogues qui ne figent plus la page, une hydratation Next.js intacte, des parties composées utilisables côté serveur, une marque qui traverse PageScaffold et des champs fiables dans un formulaire. Sans rupture.

### Dialogues et toasts

- **La page ne reste plus figée** — Deux dialogues fermés dans le même geste, ou dans le désordre, laissaient la page inerte et le défilement bloqué. Une pile partagée ne neutralise plus que le reste de la page sous le dialogue du dessus, et restitue tout quand le dernier se ferme. Le verrou compense aussi la barre de défilement : la page ne saute plus.
- **Next.js hydrate enfin** — ToastProvider à la racine et les dialogues ouverts au premier rendu cassaient l’hydratation : la page rendue par le serveur était jetée. Leur portail n’apparaît plus qu’après l’hydratation. Chaque composant est désormais testé en rendu serveur puis hydraté sous StrictMode.
- **Le thème suit les portails** — Un dialogue ou un toast ouvert dans un PageScaffold sombre s’affiche sombre. Rappeler showToast avec le même id redonne au toast sa durée entière.

### Next.js et le paquet

- **Les parties composées ont un nom** — TabsList, TabsTrigger, TabsContent, SidebarItem, TopbarBrand… sont exportés sous leur nom, utilisables depuis un Server Component. Tabs.List reste valable dans un composant client.
- **Les données restent côté serveur** — ICON_NAMES, COOKIE_CONSENT_KEY, le catalogue et les liens par défaut de SiteNav ne portent plus « use client » : ils ont leur vraie valeur dans un Server Component. Le paquet se charge aussi par require().

### Thème et formulaires

- **Votre marque traverse PageScaffold** — Une couleur posée sur :root n’est plus remise au bleu d’Opale dans le gabarit. La classe facultative .opale-root peint la page hôte (fond, encre, police, color-scheme) selon le thème. Le contrat de couleur lit enfin la feuille publiée minifiée et color-mix().
- **Des champs qui tiennent dans un formulaire** — Dropzone envoie ses fichiers avec name ; MultiSelect désactivé ne se coche plus et reste d’accord avec reset() et les bibliothèques de formulaire ; Checkbox garde son aria-label ; un aria-describedby ajouté ne masque plus le message d’erreur.

## 3.9.1 — 29 septembre 2026

Correctifs responsive : Topbar et SvgMap à l’aise sur téléphone, et une vitrine qui ne défile plus en largeur, de 320 px au zoom du texte. Sans changement d’API.

### Petits écrans

- **Topbar passe à la ligne** — Sous 30rem, le titre garde une largeur minimale et les actions passent sur une seconde ligne au lieu de recouvrir le badge. Rien ne change au-delà.
- **SvgMap libère son dessin** — Sous 30rem, l’invite et les commandes de zoom passent sous la carte au lieu de la couvrir. Elles sont désormais regroupées avec le dessin dans .opale-svg-map__frame : un sélecteur qui visait .opale-svg-map__canvas > .opale-svg-map__overlay doit viser le cadre.

### Vitrine

- **Plus de défilement horizontal** — Les fiches composant tiennent dans l’écran de 320 à 1024 px ; les tables de props défilent dans leur cadre. Le menu, le sommaire (fermé par Échap), le rail tablette, la marque et les blocs de code de migration, désormais atteignables au clavier, sont revus pour le mobile et le zoom du texte.
- **Des démos qui laissent lire** — Le bandeau de cookies ne s’affiche plus d’office sur sa fiche, la carte propose une liste pour choisir une région sans viser au doigt, et la prose ne dépasse plus une largeur de lecture confortable.

## 3.9.0 — 29 septembre 2026

La dernière 3.x : une archive construite à chaque version, et la sortie des anciens noms préparée — avertissements en développement, guide de migration, Toggle en interrupteur en option. Sans rupture.

### Distribution

- **Une archive construite à chaque version** — Chaque version publie sur GitHub une archive déjà compilée : npm, pnpm et yarn l’installent sans chaîne de build, même avec --ignore-scripts ou pnpm 10. L’installation par tag Git reste possible et inchangée.

### Préparer la 4.0

- **Les anciens noms se signalent** — En développement, chaque prop dépréciée écrit une fois dans la console son remplaçant et la version qui la retirera. Rien en production, et les anciens noms marchent toujours.
- **Un guide de migration** — La page « Migrer vers la 4.0 » liste chaque ancien nom, ce qui le remplace et depuis quand, ainsi que les changements que la 4.0.0 apportera.
- **Toggle en interrupteur, en option** — role="switch" sur Toggle l’annonce comme un interrupteur ; ce sera le rôle par défaut en 4.0.0. En développement, un Toggle sans nom accessible est signalé.

## 3.8.0 — 29 septembre 2026

Une recherche de PageScaffold branchée sur votre routeur, un seul bouton Fermer en option, et un SegmentedControl plus léger à animer. Sans rupture.

### Nouveautés

- **Une navigation de recherche à brancher** — PageScaffold accepte searchNavigate : la suggestion choisie passe par votre routeur au lieu de recharger la page. Sans cette prop, rien ne change.
- **Un seul bouton Fermer** — Lightbox et CommandPalette acceptent footerClose={false} pour ne garder que la croix d’en-tête. Par défaut, le bouton du pied reste.

### Finitions

- **SegmentedControl glisse sans recalculer la page** — La pastille se déplace par transformation seulement ; elle prend la largeur de sa nouvelle option au départ du geste. Sans animation quand le système demande moins de mouvement.

## 3.7.1 — 29 septembre 2026

Correctifs : un test de CookieBanner qui vérifie enfin ce qu’il annonce, et une carte du monde plus légère. Aucun changement d’API.

### Corrections

- **Un test qui teste vraiment** — Le test de CookieBanner avec un stockage inaccessible fait désormais vraiment échouer localStorage ; avant, il passait sans rien vérifier. Le bandeau survit bien à un stockage bloqué, en lecture comme en écriture.
- **Une carte du monde plus légère** — Les cadres des continents sont calculés à la construction : la page SvgMap ne charge plus de bibliothèque de projection. Le détail 50m ne change pas.
- **Une vitrine qui décrit le présent** — Les commentaires de la vitrine disent ce que le code garantit aujourd’hui, sans raconter son histoire.

## 3.7.0 — 29 septembre 2026

Modales empilées, focus gardé, erreurs sur tous les champs, jetons partout, classes stables et un paquet bien plus léger — sans rupture.

### Accessibilité

- **Modales empilées** — Échap ne ferme que la modale du dessus : une confirmation ouverte depuis un panneau latéral ne ferme plus les deux. Dans une modale, Échap sur une carte ferme d’abord son infobulle.
- **Le focus ne se perd plus** — La pagination reporte le focus sur la page courante quand une flèche se désactive, et les surfaces fixées en bas ou l’en-tête collant réservent leur place au défilement.
- **CommandPalette en combobox** — Avec la nouvelle prop items, la palette suit le motif combobox : flèches, Entrée et nombre de résultats annoncé.
- **Des erreurs sur tous les champs** — Select, MultiSelect, Checkbox et Toggle acceptent error, relié au champ et annoncé comme celui d’Input.
- **Messages urgents et repères** — Sans duration, un toast d’erreur ou d’avertissement reste jusqu’à ce qu’on le ferme. PageScaffold propose un lien d’évitement (showSkipLink), Card un titleAs, et les repères de recherche et de navigation se nomment.

### Cohérence et API

- **Des échelles partout** — Empilement, voile, opacité de l’état désactivé, animations, couleurs, espacements et rayons de l’en-tête passent tous par des jetons. Le verre a deux recettes nommées : réfraction et dépoli.
- **Des classes stables** — Chaque partie des composants composés porte une classe non hachée, par exemple opale-modal__panel ou opale-tabs__trigger, pour les surcharger depuis l’application.
- **Le verre sur quatre composants de plus** — Rating, Breadcrumb, Link et Pagination acceptent liquidGlass. Les réglages internes du verre restent acceptés et sont dépréciés.

### Poids et livraison

- **Un paquet plus léger** — La feuille publiée est minifiée (18 ko compressés au lieu de 67) et le code est livré module par module : importer un Divider seul coûte 266 octets au lieu de 47 ko.
- **Un paquet vérifié comme on le reçoit** — La CI emballe le paquet, l’installe dans une application témoin et la compile en nodenext et en bundler, avec un budget de poids. Les versions ne se publient que depuis recette.
- **Corrections** — Un glissement annulé de SiteNav ne marque plus l’onglet survolé comme page courante ; Glass ne retire plus un filtre posé par la page ; le fil d’Ariane s’aligne sur une ligne, sans numéros.

## 3.6.1 — 29 septembre 2026

Une documentation au même plan pour chaque composant, le contrat plutôt que l’histoire, et un README à jour. Aucun changement de la librairie.

### Documentation

- **Un seul plan pour chaque composant** — Chaque page suit le même ordre : Import, Démo, Exemples, Props, États, Accessibilité et Limites connues. PageScaffold a sa démonstration.
- **Le contrat plutôt que l’histoire** — Les pages disent comment employer le composant et ce qu’il ne fait pas ; l’historique reste dans ces notes. La source des tracés de SvgMap est de nouveau affichée.
- **Quand préférer le composant voisin** — Toast et ToastProvider, Modal et ConfirmDialog renvoient l’un vers l’autre et disent lequel choisir.
- **Un README à jour** — Installation, convention d’import, conventions de l’API, thème, contrat de couleur et limites connues, avec des chiffres recalculés depuis le code. Les notes 3.5.0 et 3.3.0 sont complétées.
- **Un vocabulaire français** — La prose dit « verre liquide » et le code liquidGlass ; le sommaire et les familles du catalogue sont en français à l’affichage.

### Qualité

- **Des tests qui rendent** — La restitution du focus de Modal est prouvée par le rendu sur ses trois sorties, et les feuilles de style sont lues par un vrai analyseur CSS dans les tests.

## 3.6.0 — 28 septembre 2026

Une seule convention d’API pour les valeurs, l’ouverture, les tailles, les tons, les libellés et les refs, sans casser aucune application en 3.5.

### Une API unique, sans rupture

- **Valeurs** — Chaque composant à valeur accepte value, defaultValue et onValueChange : SegmentedControl, CommandPalette, Pagination, RatingInput, MultiSelect, Navbar, Sidebar et SiteNav. DataTable accepte un tri contrôlé.
- **Ouverture** — Modal, ConfirmDialog, SidePanel, Lightbox, CommandPalette, Toast et CookieBanner signalent leur fermeture par onOpenChange(false). ConfirmDialog ne le fait jamais sur Confirmer.
- **Tailles et tons** — Une seule échelle small, medium, large pour Modal, Topbar, PageScaffold et DataTable, et un seul tone pour Feedback et les toasts.
- **ref et attributs natifs** — Chaque composant accepte ref, className, style, id, data-* et aria-*. Les champs les transmettent au contrôle natif, ce qui les rend utilisables avec react-hook-form.
- **Libellés et langue** — Treize composants acceptent labels pour traduire leurs textes d’interface, avec les libellés français par défaut. DataTable trie selon locale.
- **Types et imports** — Chaque composant exporte son type de props, et la documentation importe par nom. Le namespace Opale gagne Modal, Tabs, Sidebar, Topbar, SiteNav et ToastProvider.

### Compatibilité

- **Anciens noms conservés** — onChange, page, values, activeItemId, onClose, onCancel, severity, density, OpaleUI et les autres restent acceptés et fonctionnent comme en 3.5 ; l’éditeur les barre et indique le nouveau nom.
- **Corrections visibles** — CommandPalette accepte la saisie sans value, et MultiSelect affiche la value qu’on lui passe.
- **Opale ne doit rien à personne** — Les composants vivent désormais dans leur propre dossier et leurs classes générées portent le préfixe opale-mod-. Les points d’entrée du paquet ne changent pas.

### Migrer depuis la 3.5.2

#### Passer aux nouveaux noms (facultatif)

Avant :

```tsx
<Pagination page={page} onChange={setPage} pageCount={8} />
```

Après :

```tsx
<Pagination value={page} onValueChange={setPage} pageCount={8} />
```

#### Fermer avec onOpenChange (facultatif)

Avant :

```tsx
<Modal open={open} onClose={() => setOpen(false)} />
```

Après :

```tsx
<Modal open={open} onOpenChange={setOpen} />
```

## 3.5.2 — 28 septembre 2026

Un seul langage visuel : jetons, hauteurs, texte et focus communs à tous les composants, contrastes au seuil.

### Un seul langage visuel

- **Un seul jeu de jetons** — SiteNav, sa bulle et SearchBar ne lisent plus que les jetons --opale-* : plus de barre teal au milieu d’une interface bleue, et la police d’Opale est posée sur chaque composant, quelle que soit celle de la page.
- **Encres qui suivent le thème** — Le texte des boutons, des toasts et de la pagination reste lisible dans une section sombre d’une page claire, et inversement.
- **Hauteurs communes** — Boutons, champs, selects, boutons-icônes, pagination et SearchBar partagent --opale-control-sm, md et lg : un champ et le bouton voisin font tous deux 44 px.
- **Échelle typographique** — Six tailles --opale-text-* et trois interlignes --opale-leading-* remplacent vingt tailles écrites en dur.

### Accessibilité

- **Un seul anneau de focus** — Même largeur et même décalage partout ; les liens de SiteNav et SearchBar ont désormais un anneau visible au clavier.
- **Contrastes au seuil** — Bordure des champs, interrupteur éteint et texte d’avertissement atteignent les ratios WCAG sur les deux thèmes.
- **Toasts sous une modale** — Un toast lancé depuis une modale ouverte est annoncé et refermable. L’attribut data-opale-modal-exempt garde toute autre région vivante.

## 3.5.1 — 28 septembre 2026

Opale s’installe en production : tag de version, Next.js App Router, types nodenext, polices en fichiers, licence MIT.

### Prête pour la production

- **Next.js App Router** — Le bundle porte la directive « use client » : les composants s’importent tels quels depuis un Server Component, sans enveloppe.
- **Types lisibles en nodenext** — Les déclarations publiées nomment leurs fichiers en entier : un projet en moduleResolution node16 ou nodenext les lit sans erreur.
- **Polices en fichiers** — Chivo et Bricolage Grotesque ne sont plus incorporées en base64 : opale.css passe de 379 à 232 kB et relie fonts.css, que votre bundler émet en woff2. Aucun import à ajouter.
- **Version installable et licence** — Les tags v3.3.0, v3.4.0 et v3.5.0 sont publiés et le tag v4.0.0, posé par erreur sur un code antérieur, est retiré. Opale est sous licence MIT.

### Corrections

- **MultiSelect non contrôlé** — Sans la prop values, la sélection est maintenant affichée et annoncée ; defaultValue est pris en compte.
- **Feedback en français** — Sans titre, l’encart affiche Succès, Information, Attention ou Erreur au lieu du nom anglais de sa sévérité.
- **Guide d’installation** — La page Installation couvre les prérequis, la compilation à l’installation, les styles, le thème et Next.js.

## 3.5.0 — 27 septembre 2026

**Rupture.**

SvgMap devient une vraie carte : zoom, déplacement, cadrage et sélection, au geste comme au clavier, dans les deux matières.

### SvgMap refondue

- **Une vraie carte** — L’appelant fournit un viewBox et des régions ; le composant gère la vue, le zoom, le déplacement, le cadrage animé et la sélection. Une couleur par région suffit pour une carte de chaleur ou un quiz.
- **Des gestes qui ne piègent pas la page** — Pincement, glissement, et molette avec Ctrl ou ⌘ : une molette nue laisse défiler la page et affiche la consigne. Au-delà de six pixels, un contact devient un déplacement et ne vaut plus sélection.
- **Clavier et lecteurs d’écran** — Un seul arrêt de tabulation, des flèches qui mènent à la région voisine, Maj + flèches pour déplacer la vue, + et − pour zoomer sur la région qui a le focus. Le contour par défaut tient 3:1 dans les deux thèmes, et les états sont peints au-dessus des régions voisines.
- **Vue pilotable et commandes détachables** — useSvgMapViewport partage la vue avec l’appelant — fitTo, zoomBy, reveal, reset — et SvgMapControls se branche à part. La carte existe en version originale et en verre liquide.
- **Cadrer sur un ensemble de régions** — fitBounds cadre la vue sur une boîte englobante : un continent, un groupe de départements, une sélection.
- **Une plaque aux coins arrondis** — L’anneau de focus suit l’arrondi de la plaque et non le rectangle du dessin, et les tracés ne débordent plus dans les coins.

### Vitrine

- **La carte du monde** — La page SvgMap gagne un carnet de voyage sur la carte du monde au 1:50 000 000, chargé à part pour ne pas alourdir la page.
- **Le nom OpaleUI** — Le nom de la librairie prend un O majuscule et s’écrit plus grand dans l’en-tête, en Chivo 700 ; le titre des onglets suit.
- **L’en-tête resserré** — Le bouton de menu prend le même espacement que la bascule de thème et le sélecteur de langue.

### Migrer depuis la 3.4.0

#### Donner le dessin à la carte

Avant :

```tsx
<SvgMap>
  <path d="…" />
</SvgMap>
```

Après :

```tsx
<SvgMap
  viewBox="0 0 613 585"
  regions={[{ id: "75", path: "…", name: "Paris" }]}
/>
```

## 3.4.0 — 27 septembre 2026

Des composants qui se voient dans les deux matières : Sidebar retravaillée, SiteNav en vrai verre, et quatre corrections de rendu.

### Navigation

- **Sidebar retravaillée** — Les icônes perdent leur tuile grise, l’entrée retenue prend la teinte d’Opale et un liseré qui se voit aussi rail replié, et les entrées repliées deviennent des vignettes carrées identiques. Le pied du rail ne laisse plus de point orphelin une fois replié.
- **Sidebar et SiteNav dans les deux matières** — La Sidebar pliable et la SiteNav se montrent désormais en version originale et en verre liquide. La SiteNav en verre n’est plus un aplat bleu posé sur la photographie.

### Composants corrigés

- **Divider visible** — Le séparateur occupe toute la largeur de son conteneur et trace un trait lisible dans les deux thèmes ; il tombait à 0 px dans une grille et ne contrastait qu’à 1,09:1 en sombre.
- **Dropzone sous verre** — Le verre ne perd plus contre la zone pleine : fond transparent, tirets et texte clairs. L’action de sélection passe en italique et se rapproche du titre.
- **FileCard et Lightbox** — Sous verre, la vignette de la carte de fichier redevient une surface. La visionneuse range sa croix en haut à droite, comme tout dialogue sans titre, et ferme par un Button tonal.

## 3.3.0 — 26 septembre 2026

PageScaffold compose une page complète dans la direction visuelle d’Opale.

### Créer une page avec Opale

- **PageScaffold, un gabarit complet** — Le nouveau composant assemble une marque, une navigation responsive, la barre de recherche Opale, un contenu principal et un pied de page avec copyright.
- **Une page prête à personnaliser** — Nom du site, liens, page courante, recherche, introduction, largeur, styles et zones remplaçables sont configurables par les propriétés et les slots.

### Navigation et accessibilité

- **Menu mobile et repères sémantiques** — Le menu s’ouvre au bouton, se ferme avec Échap ou après un choix et restaure le focus. Un clic extérieur referme aussi le menu.
- **Recherche branchable** — La recherche utilise SearchBar, propose des suggestions personnalisables et soumet un formulaire GET natif ; un callback peut prendre le relais.

### Composants retouchés

- **CommandPalette** — Une mise en page resserrée et une recherche plus directe.
- **CookieBanner et Toast** — Le bandeau se place mieux ; les toasts centrent leur contenu, bougent plus doucement et précisent le survol de leur croix.
- **Navbar, DataTable, Modal et SegmentedControl en verre liquide** — Un meilleur contraste sous le verre ; la modale en verre retrouve une teinte lisible.
- **IconActionButton et focus des champs** — Le bouton-icône est retravaillé dans ses deux matières, et l’anneau de focus des champs suit leur arrondi.

### Vitrine

- **La goutte d’Opale** — Le logo devient une goutte en verre liquide, et le tag de version une pastille aux marges de la référence.

## 3.2.0 — 24 septembre 2026

**Rupture.**

Un catalogue resserré qui tient ce qu’il annonce : chaque composant garde sa matière d’origine et son verre liquide, et la vitrine se lit sur un téléphone.

### Compatibilité et migration

- **28 exports retirés depuis la 3.1.1** — Les alias, composants sans comportement propre et promesses non tenues quittent le catalogue. Le tableau de migration ci-dessous indique les remplacements possibles.
- **Trois API à adapter** — Glass devient la propriété liquidGlass ; IconActionButton exige un label et reçoit icon ; Lightbox exige alt. Les exemples avant/après sont juste sous cette rubrique.

### Composants et interactions

- **Le verre liquide reste optionnel** — Les composants qui peignent une surface acceptent liquidGlass ; ils gardent leur matériau d’origine par défaut.
- **Notifications, notes et icônes enrichies** — Toast propose cinq tons et six positions, Rating se remplit au quart d’étoile et Opale fournit 125 icônes dessinées à la main.
- **Des interactions qui fonctionnent** — DataTable trie, Dropzone accepte le dépôt, CookieBanner mémorise le choix, Clipboard signale l’échec et InlineInput valide ou annule au clavier. Badge et Card gagnent leurs variantes documentées.

### Documentation et qualité

- **Des fiches fidèles au code** — Chaque fiche décrit le comportement réel du composant et un test empêche les promesses sans implémentation.
- **Thème sombre lisible** — Les jetons de fond et d’encre sont séparés pour garder un contraste cohérent.
- **Vitrine adaptée au téléphone** — La documentation tient à 320 px ; sous 30 rem, le sommaire devient repliable.

### Améliorations de recette

- **Catalogue praticable** — Les fiches exposent leur API et leurs états ; Button, Input et DataTable disposent de réglages dont le code suit l’aperçu.
- **Trois composants supplémentaires** — Skeleton, Pagination et RatingInput couvrent le chargement, les listes paginées et la saisie d’une note.
- **États et fichiers mieux gérés** — DataTable traite les lignes stables, le vide et le chargement ; Dropzone contrôle type, nombre et taille des fichiers ; FileCard devient statique sans action.
- **Parcours et polices autonomes** — L’accueil, les guides et le sommaire mobile facilitent l’accès au catalogue ; les polices sont servies localement.

### Migrer depuis la 3.1.1

#### Activer le verre sur le composant

Avant :

```tsx
<Glass><Card>Contenu</Card></Glass>
```

Après :

```tsx
<Card liquidGlass>Contenu</Card>
```

#### Nommer l’icône d’action

Avant :

```tsx
<IconActionButton label="Partager" />
```

Après :

```tsx
<IconActionButton icon="share" label="Partager" />
```

#### Décrire l’image de la visionneuse

Avant :

```tsx
<Lightbox src="/visuel.png" open />
```

Après :

```tsx
<Lightbox src="/visuel.png" alt="Aperçu du composant" open />
```

### Composants retirés

- `AddButton`, `SaveButton`, `ApproveButton`, `EditButton`, `DeleteButton` : Utilisez Button ou IconActionButton ; ajoutez ConfirmDialog pour confirmer une suppression.
- `Carousel` : CardGrid couvre la grille statique ; aucun carrousel animé équivalent.
- `FileUploader` : Utilisez Dropzone.
- `SlidingIndicator` : Utilisez SegmentedControl.
- `ShapeBackground` : Utilisez Background avec sa propriété shape.
- `StatusChip`, `Http`, `Validation` : Utilisez Badge pour un état court ou Feedback pour un message.
- `ThemeToggle`, `Sound` : Utilisez Toggle relié à l’état réel de votre application.
- `LanguageSelector` : Utilisez Select relié à votre système de traduction.
- `SettingsMenu` : Utilisez Menu.
- `Map` : SvgMap couvre un SVG interactif ; aucun fond cartographique n’est fourni.
- `Legend` : Utilisez une liste sémantique adaptée à la visualisation.
- `PageContent`, `PageScaffold` : Composez la page avec Layout, Stack et les éléments HTML adaptés.
- `Separator` : Utilisez Divider.
- `Scrollbar` : Utilisez le défilement natif du navigateur.
- `Toolbar` : Créez une barre d’outils adaptée avec le rôle et le clavier appropriés.
- `I18n`, `LocalStore`, `RouteGuard` : Ces responsabilités relèvent de la traduction, du stockage et du routeur de l’application.
- `Game`, `Countdown` : Aucun équivalent Opale ; implémentez le comportement nécessaire dans l’application.

## 3.1.1 — 21 septembre 2026

**Rupture.**

Opale porte ses propres composants et fait du verre liquide une option de chacun d’eux.

- Chaque composant du catalogue porte désormais le nom d’Opale — Button, Card, Input — au lieu de l’ancien préfixe de ses premières versions.
- Un seul composant par nom : les sept doublons « original » et « verre liquide » sont fusionnés en Badge, Card, Checkbox, Input, Select, Slider et Toggle.
- Le verre liquide devient une propriété des composants (liquidGlass) et non un second jeu de composants : le commutateur change la matière, jamais la taille, la position ni le comportement.
- Sous verre, le contrôle natif reste le moteur : le champ garde son focus, son clavier, son nom de formulaire et son événement de changement.
- Les démonstrations de verre se posent sur un paysage, sans quoi le matériau n’a rien à réfracter et ne se voit pas.
- Rupture : les jetons CSS et les classes publiés prennent le préfixe opale-, et les exports nommés perdent le leur. Le chemin Opale.Button ne change pas.

## 3.0.0 — 18 septembre 2026

**Rupture.**

Opale adopte un langage visuel unifié et étend son catalogue sans retirer les composants historiques.

- Ajout des tokens, layouts et primitives visuelles du catalogue Opale.
- Ajout des thèmes clair et sombre, avec le verre liquide activable composant par composant.
- Ajout de nouveaux composants Opale en conservant les exports existants.

## 2.1.0 — 18 septembre 2026

La vitrine gagne un historique de versions et conserve chaque état publié sous une adresse indépendante.

- Ajout de la page « Notes de versions » dans la navigation.
- Ajout de snapshots utilisables pour les versions 0.1.0 à 2.0.0.
- La version courante reste à la racine : les anciennes versions ne sont jamais écrasées.

## 2.0.0 — 14 septembre 2026

**Rupture.**

Le paquet devient Opale et adopte ses composants en verre liquide.

- Quatorze composants verre liquide sont publiés à la racine.
- La vitrine passe d’une charte unique à une documentation navigable.
- Rupture majeure : les composants maison de la 1.x ne sont plus exportés.

## 1.2.0 — 10 septembre 2026

Un bouton bulle et sa lentille arrivent sans modifier les API existantes.

- Ajout de la variante `bubble` de `Button`.
- Ajout de `GlassLens` et de la feuille optionnelle `lens.css`.
- Les consommateurs qui n’emploient pas ces nouveautés restent inchangés.

## 1.1.0 — 9 septembre 2026

Le thème verre liquide devient une feuille optionnelle, sans déplacement de l’API.

- Ajout de `glass.css` et de l’axe de matériau optionnel.
- Les jetons, rôles, composants et classes de la 1.0 restent compatibles.
- La vitrine documente le coût et les replis du matériau.

## 1.0.0 — 9 septembre 2026

L’API du socle est déclarée stable après l’arrivée des composants partagés.

- Le vocabulaire de la palette et des composants est stabilisé.
- La vitrine devient une documentation par page.
- Les consommateurs de la 0.3.0 disposent d’un contrat stable.

## 0.3.0 — 8 septembre 2026

Le socle accueille les composants portés du portfolio et la palette canonique.

- Ajout des composants partagés manquants.
- Adoption de la palette du portfolio et de la couche de matériaux.
- Le contrat exécutable mesure désormais le socle commun.

## 0.2.0 — 6 septembre 2026

Les fonds clairs passent du gris écran à une surface papier mesurée.

- Révision des fonds clairs de la palette.
- Le contrat de couleur est recalibré sur ces nouvelles surfaces.

## 0.1.0 — 5 septembre 2026

Première version du socle UI commun, de ses jetons et de son contrat de couleur.

- Première palette mesurée et premières échelles publiées.
- Ajout du contrat exécutable et de la vitrine de référence.
