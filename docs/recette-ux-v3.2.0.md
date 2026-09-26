# Revue UX et compatibilité de la branche `codex/recette-ux-v3.2.0`

## Périmètre vérifié

La direction visuelle de la recette 3.2.0 est conservée. Le sommaire mobile reste replié à l’ouverture. Cette branche ajoute des recettes, des états documentés, des contrôles de démonstration, des composants utiles et des corrections d’accessibilité. Elle n’a pas vocation à modifier l’alias public de recette avant revue.

## Anciens exports cités dans les notes de version

`CURRENT_REMOVED_COMPONENTS` énumère 28 noms historiques. Les projets locaux `portfolio` et `travels_in_world` ont été inspectés dans leurs `package.json` et leurs imports `src/**/*.{ts,tsx}`. Aucun ne consomme `@thomascaron/opale-ui` à ce jour. `portfolio` utilise encore `@thomascaron/opale` à la révision `5bdefcf` et importe `Badge`, `Card`, `Button`, `SiteNav` et `SiteNavItem`. Cette observation ne couvre pas des consommateurs distants ou non présents dans l’espace de travail.

| Noms historiques                                               | Migration indiquée                                                    | Point de vigilance                                                                                   |
| -------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| AddButton, SaveButton, ApproveButton, EditButton, DeleteButton | Button ou IconActionButton ; ConfirmDialog pour les actions sensibles | Conserver le libellé accessible et les confirmations nécessaires.                                    |
| Carousel                                                       | CardGrid pour une grille statique                                     | Aucune équivalence de défilement ou de navigation de carrousel.                                      |
| FileUploader                                                   | Dropzone                                                              | Rebrancher l’envoi côté application ; contraintes `accept`, taille et nombre maintenant disponibles. |
| SlidingIndicator                                               | SegmentedControl                                                      | Rebrancher la valeur et `onChange`.                                                                  |
| ShapeBackground                                                | Background avec `shape`                                               | Vérifier le rendu sur les deux thèmes.                                                               |
| StatusChip, Http, Validation                                   | Badge pour un état court ; Feedback pour un message                   | Aucun composant ne reconstitue automatiquement les règles métier.                                    |
| ThemeToggle, Sound                                             | Toggle                                                                | La persistance et les effets restent du ressort de l’application.                                    |
| LanguageSelector                                               | Select                                                                | La traduction doit être reliée à l’application.                                                      |
| SettingsMenu                                                   | Menu                                                                  | Vérifier liens et actions dans `items`.                                                              |
| Map                                                            | SvgMap                                                                | Aucun fond cartographique fourni.                                                                    |
| Legend                                                         | Liste sémantique adaptée                                              | Pas de remplacement dédié.                                                                           |
| PageContent, PageScaffold                                      | Layout, Stack et HTML sémantique                                      | Recomposer le gabarit selon la page.                                                                 |
| Separator                                                      | Divider                                                               | Remplacement direct pour le séparateur horizontal.                                                   |
| Scrollbar                                                      | Défilement natif                                                      | Aucun composant de substitution.                                                                     |
| Toolbar                                                        | Barre adaptée au contexte                                             | Rôles et clavier à traiter pour chaque outil.                                                        |
| I18n, LocalStore, RouteGuard                                   | Solutions de l’application                                            | Responsabilités hors du périmètre UI.                                                                |
| Game, Countdown                                                | Implémentation métier                                                 | Aucun équivalent Opale.                                                                              |

Les 28 noms sont déjà absents du catalogue 3.2.0 de départ ; aucune suppression supplémentaire n’est faite ici. La migration doit être validée dans chaque consommateur avant une suppression d’export public.

## API légère conservée

`Pressable` appelle `Button` avec la variante texte. `Form` applique l’empilement vertical à un formulaire natif. `BulletList` rend une liste native depuis `items`. `LegalLinks` nomme une navigation de liens légaux. Ces raccourcis ont un faible coût mais restent des imports publics documentés : les retirer pendant la recette 3.2.0 créerait une rupture sans bénéfice d’usage mesuré. Leur éventuelle dépréciation demande un inventaire des consommateurs publiés et une version majeure.

## CSS et compatibilité

`doc-v3.css` accumule des règles de reprise et des `!important`. La présente branche nettoie uniquement un sélecteur mobile redondant. Une consolidation plus large doit comparer les styles calculés et les captures de la recette aux largeurs 320, 375 et 1280 px, en thèmes clair et sombre, y compris les états de focus, avant de supprimer chaque règle. Les nouveaux styles restent regroupés en fin de feuille pour une revue ciblée.

Les polices Bricolage Grotesque et Chivo sont désormais embarquées dans la feuille publiée. Leurs licences complètes figurent dans `THIRD-PARTY-NOTICES.md`. Le build de bibliothèque intègre les WOFF2 dans `dist/magic/magic.css` et n’émet plus de requête Google Fonts.

## Publication

Le tag Git `v3.2.0` pointe encore vers l’état antérieur à cette branche. La commande d’installation depuis ce tag n’inclut donc pas les améliorations proposées ici. Les notes de version de la branche renvoient à son code de revue. Aucune fusion, mise à jour du tag ni déploiement sur `recette` n’est effectué dans cette tâche.
