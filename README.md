# Opale — `@thomascaron/opale-ui`

Le socle d'interface partagé par [`portfolio`](https://github.com/ThoomassC/portfolio) et
[`travels_in_world`](https://github.com/ThoomassC/travels_in_world).

> **La 3.1 rend le paquet entièrement à lui-même.** Le code d'une librairie tierce qui
> occupait `src/magic/` a été supprimé ou réécrit : huit composants qui n'étaient plus que
> des peaux sous `liquidGlass` ont disparu au profit de leur jumeau d'Opale, six ont été
> réécrits, et **Tailwind, PostCSS et Autoprefixer sont sortis des dépendances** avec les
> `@apply` qu'ils servaient. Le matériau verre est désormais le nôtre, opt-in composant par
> composant ; la vitrine propose les thèmes globaux `light` et `dark`.

La branche de recette prépare **3.3.0** avec PageScaffold. Son historique est consultable dans l’onglet
« Notes de versions » ; chaque état antérieur dispose aussi d’un snapshot utilisable sous
`public/versions/`. Les états antérieurs du paquet, y compris la **2.0** et ses composants
copiés d'une librairie tierce, sont décrits dans ces notes — et l'héritage lui-même dans
[`src/magic/README.md`](./src/magic/README.md).

Ce qui reste d'Opale, et qui est le cœur du dépôt : **la charte** — les jetons OKLab, les
trois thèmes — et **le contrat de couleur exécutable** qui la garde.

## Pourquoi ce dépôt existe

`travels_in_world/src/styles/tokens.css` affirmait en commentaire que sa palette était
« délibérément identique à celle du portfolio, pour que les deux sites se lisent comme des
frères », et demandait que tout changement de couleur y soit répercuté.

Six jetons sur six avaient divergé, plus les deux fonds sombres. Aucun outil n'a rien dit,
**parce qu'un commentaire n'est pas un garde**.

Ce dépôt est ce garde. Il publie, dans cet ordre de valeur :

1. **un contrat de couleur exécutable** — il lit la feuille de jetons comme du texte,
   reconstruit ses trois thèmes, recompose les couches alpha et recalcule chaque ratio que
   les commentaires annoncent. Un chiffre faux fait échouer la CI le jour où il est écrit ;
2. **la feuille de jetons canonique** — la palette du portfolio, devenue référence parce
   qu'elle est la seule des deux à être mesurée et testée ;
3. **le catalogue de composants**, qui réunit huit composants composés — dialogue, barre
   latérale, onglets, notifications, barres de navigation, champ de recherche et le
   matériau verre — et les briques plates du catalogue V3. Tous emploient les jetons
   `--opale-*` ; aucun n'écrit une couleur de texte en dur.

Les trois points sont vrais et testés à leur niveau : le contrat mesure la charte, la vitrine
mesure les routes et le catalogue, et les composants ont leurs propres tests.

## Ce que la 3.1 ne garantit pas

La 2.0 avait ici une section autrement plus lourde : les composants publiés à la racine
étaient copiés d'une librairie tierce, n'employaient aucun jeton de la charte, et peignaient
leurs libellés en **blanc pur, en dur** — soit du texte invisible (1,00:1) dès qu'on les
posait sur un fond clair. **Ce défaut n'existe plus** : ce code a été supprimé ou réécrit,
et les composants lisent aujourd'hui les jetons `--opale-*` comme le reste du paquet.

Ce qui reste vrai, et qu'il faut lire avant de s'y fier :

- **Les composants ne sont pas dans le domaine du contrat de couleur.** Les tests de contrat
  ne lisent que `src/tokens/` : ils mesurent la charte, pas ce qu'un composant compose avec
  elle. Un jeton mesuré posé dans une pile non mesurée reste une affirmation humaine —
  meilleure garantie qu'une couleur en dur, mais pas une preuve.
- **Aucun rendu du verre n'a de garde automatisé.** `jsdom` ne peint pas. Ni le flou, ni le
  ménisque, ni le filet spéculaire ne sont vérifiés en CI, et les mesures citées dans les
  commentaires ont été faites à la main, une fois, sous Chromium.
- **`filter: url(#…)` et `backdrop-filter` n'ont pas de comportement vérifié hors Chromium**,
  et ce sont les deux déclarations dont le matériau dépend entièrement.
- **`opale.css` embarque Bricolage Grotesque et Chivo**, sous SIL Open Font License 1.1.
  Les licences complètes figurent dans [`THIRD-PARTY-NOTICES.md`](./THIRD-PARTY-NOTICES.md).
  La feuille publiée ne déclenche plus de requête vers Google Fonts.

La vitrine continue de présenter les composants sur des **scènes sombres** — un dégradé à
trois arrêts (`#17314f`, `#2a2350`, `#101a2c`), plancher mesuré 13,22:1 contre le blanc
(`src/showcase/pages/composants/stage.tsx`). **La raison a changé** : ce n'est plus pour
rattraper des libellés illisibles, c'est parce qu'un verre a besoin de quelque chose à
réfracter. Flouter du blanc donne du blanc, et le matériau disparaît sur un fond uni clair.

[`src/magic/README.md`](./src/magic/README.md) reste le fichier à lire avant d'employer un
de ces composants : il donne le matériau, les huit composants composés, ce qui est mesuré et
ce qui ne l'est pas.

## Installation

Le paquet s'installe depuis GitHub ; il n'est pas publié sur npm. Le dernier tag est
`v3.2.0`. Pour essayer **PageScaffold en 3.3.0 sur la branche de recette** :

```bash
npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#recette"
```

Cette référence de branche évolue avec la recette. Le tag `v3.3.0` sera créé lors de la
publication ; la documentation ne propose pas de commande vers un tag inexistant.

Le paquet se compile à l'installation (`prepare` → `build:lib`). **Quatre points d'entrée**,
et les deux premiers suffisent :

```js
import '@thomascaron/opale-ui/tokens.css'; // la palette, les échelles, le focus, le mouvement
import '@thomascaron/opale-ui/opale.css'; // les jetons et les styles des composants, une fois par app
import { Button, Modal, Opale } from '@thomascaron/opale-ui';
```

```ts
import { contrastRatio, parseThemes } from '@thomascaron/opale-ui/contract'; // dev seulement
```

La forme exacte, telle qu'elle est déclarée dans `package.json` :

| Spécifieur      | Cible                       | Ce que c'est                                     |
| --------------- | --------------------------- | ------------------------------------------------ |
| `.`             | `dist/magic/index.js`       | Les composants composés et le catalogue V3       |
| `./contract`    | `dist/contract/index.js`    | Le contrat de couleur — dépendance de dev, zéro octet à l'exécution |
| `./tokens.css`  | `dist/tokens/tokens.css`    | La charte : primitives, rôles, matériaux         |
| `./opale.css`   | `dist/magic/magic.css`      | La feuille des composants                        |
| `./package.json`| `package.json`              |                                                  |

**Cinq spécifieurs de la 1.x ont disparu** : `./ui.css`, `./glass.css`, `./lens.css`,
`./magic` et `./magic.css`. Les trois premiers n'ont plus de feuille derrière eux ; les deux
derniers sont devenus la racine et `./opale.css`. Un consommateur de la 1.x ne se met pas à
jour en changeant un numéro — c'est une réécriture de ses imports, et c'est ce que le majeur
annonce.

`sideEffects` vaut `["**/*.css"]` — le double astérisque est nécessaire pour que
`dist/magic/magic.css` et `dist/tokens/*.css` soient tous les deux couverts, `"*.css"` ne
décrivant que la racine du paquet.

`./tokens.css` reste **facultative** pour qui n'emploie que les composants : ils ne citent
aucun jeton `--tc-*` — vérifié, `grep -rn -- '--tc-' src/magic/` ne rend rien. Leur
vocabulaire est celui des jetons `--opale-*`, que `./opale.css` porte avec eux. `tokens.css`
est en revanche la charte elle-même, donc indispensable à qui écrit ses propres surfaces dans
la palette d'Opale.

> **Point de vigilance en déploiement.** Si l'hôte n'exécute pas le script `prepare` (cache
> npm, image de build minimale), `dist/` sera absent et le build cassera en production sans
> avoir cassé en local. À vérifier par un déploiement de préversion.

## PageScaffold — une page Opale prête à adapter

`PageScaffold` assemble la marque, la navigation, la recherche `SearchBar`, le contenu principal
et le pied de page. La mise en page s'adapte au mobile et le menu fonctionne au clavier.
La recherche soumet un formulaire GET vers `/search` par défaut :
prévoyez cette route ou fournissez `searchAction` / `onSearch`.

```tsx
import { PageScaffold, Opale } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

<PageScaffold
  siteName="Atelier"
  navigation={[{ id: 'home', href: '/', label: 'Accueil' }]}
  activeId="home"
  searchAction="/recherche"
  footerLinks={[{ id: 'legal', href: '/mentions-legales', label: 'Mentions légales' }]}
>
  <Opale.Card title="Bienvenue">Votre contenu.</Opale.Card>
</PageScaffold>;
```

Les propriétés `logo`, `siteName`, `navigation`, `searchAction` et `footerLinks` règlent les
éléments courants. `slots` remplace individuellement `brand`, `navigation`, `search`, `actions`,
`intro`, `footer` et les autres zones. `classNames` et les variables CSS
`--page-scaffold-max-width` / `--page-scaffold-gutter` règlent les détails de présentation.
Le header inclut une bascule clair/sombre et un sélecteur FR/EN/ES. Le thème est limité au
`PageScaffold` : il ne modifie pas le thème de la page hôte. La langue traduit ses libellés
fournis par défaut ; si vous fournissez votre propre navigation ou contenu, traduisez-les dans
votre application via `onLanguageChange`. Utilisez `theme` / `language` pour piloter les valeurs,
ou `defaultTheme` / `defaultLanguage` pour laisser le gabarit les gérer. Les props `showThemeToggle`
et `showLanguageSelector` masquent les contrôles, et `slots.actions` remplace leur zone.
Les menus mobiles du gabarit et du site Opale se replient au clic extérieur.

La fiche `#/composants/page-scaffold` dans la vitrine de cette branche documente l'API complète.

## Le catalogue de composants

Tout est publié à la racine, exporté par `src/magic/index.ts`, et le catalogue a **deux
étages qui ne se ressemblent pas**.

**Huit composants composés**, un dossier chacun sous `src/magic/components/` : `Glass`,
`Modal`, `SearchBar`, `Sidebar`, `SiteNav`, `Tabs`, `ToastProvider` (plus le hook
`useToast`), `Topbar`. Ce sont les pièces qui ont une structure interne, un état, ou les
deux.

**Le catalogue plat**, dans `src/magic/opale.tsx` : **77 entrées** déclarées par
`OPALE_CATALOG` — primitives, champs, cartes, données, retour d'information, navigation,
disposition et modules —, dont la vitrine génère une page de démonstration chacune. Le
namespace `OpaleUI` les réexpose sous un second jeu de noms, sans écraser les exports
directs. Les composants qui portent `liquidGlass` activent le matériau un par un.

`Glass` est la primitive de matériau, et **six des sept autres composants composés la
montent**. La seule exception, vérifiée dans le code, est **`SiteNav`** : sa bulle est un
rendu à elle (`liquid-bubble.tsx`) et n'a pas besoin des trois couches.

**Ces composants ont un état, des hooks et des effets** : `Glass` tient une animation de
clic et monte un filtre SVG partagé, `Modal` un portail, `ToastProvider` un contexte. Ils ne
rendent donc pas tels quels en Server Component — une frontière `"use client"` est nécessaire
en Next.js App Router, et ils coûtent au budget JavaScript de leur hôte. C'est l'inverse exact
de la promesse que portait la 1.x, et il valait mieux l'écrire.

**Sept des huit composants composés ont un fichier de test à côté d'eux.** Mesuré :
`npx vitest run src/magic` → `Test Files 10 passed (10) · Tests 115 passed (115)`. `Glass`
est celui qui n'en a pas en propre : il est exercé à travers ses consommateurs par
`opale-liquid-glass.test.tsx` (33 tests), ce qui n'est pas la même chose qu'un test du
matériau lui-même. Le détail par fichier est dans
[`src/magic/README.md`](./src/magic/README.md).

## La charte, et le contrat qui la garde

### `./contract` — ce que l'entrée de développement exporte

Rien ici n'importe React, ne touche au DOM ni n'ouvre de fichier : c'est une dépendance de
développement, jamais une dépendance d'exécution, donc **zéro octet** au budget du
consommateur.

```ts
import {
  contrastRatio, // le ratio WCAG entre deux couleurs résolues
  parseThemes, // une feuille de jetons en texte → ses trois thèmes reconstruits
  resolveToken, // (theme, token) → la couleur, indirections suivies
  compositeLayers, // une pile de couches alpha → l'aplat opaque qu'elle présente
  oklab, // la conversion, et la mesure derrière le NOM des primitives
  deltaEOklab, // le plancher de séparation entre deux rôles voisins
} from '@thomascaron/opale-ui/contract';
import {
  resolveBackdrop, // (theme, spec) → l'aplat OPAQUE que la pile présente à une encre
  GLASS_BACKDROPS, // les CINQ supports sur lesquels une surface est mesurée
  GLASS_LAYERS, // les couches nommées une fois : page, halos, remplissage, repli opaque
  STATE_WASHES, // les trois lavis d'état, du repos à l'appui
  withWash, // le même support, un lavis posé dessus
} from '@thomascaron/opale-ui/contract';
import type { BackdropSpec, Theme, ThemeName } from '@thomascaron/opale-ui/contract';
```

Le **support composé** est dans le contrat, et il n'y a qu'une définition du mot « fond » :
le portfolio nommait ses piles dans son fichier de test (`CARD_FLOORS`, `WASH_SUPPORTS`),
`travels_in_world` dans le sien (une fonction `stack()` maison).

Le type s'appelle **`BackdropSpec`** et non `Backdrop` : un consommateur qui mesure sa propre
palette importe volontiers le contrat et ses propres composants dans le même fichier de
test, et un nom aussi générique se disputait la place.

### Architecture des jetons

Trois couches, une seule direction de dépendance : `materials → roles → primitives`, jamais
l'inverse.

| Couche         | Fichier                     | Ce qu'elle nomme                    | Qui peut la citer                |
| -------------- | --------------------------- | ----------------------------------- | -------------------------------- |
| **Primitives** | `src/tokens/primitives.css` | Une **couleur**, pas un emploi      | Rôles et matériaux, uniquement   |
| **Rôles**      | `src/tokens/roles.css`      | Un **emploi** — « le texte fort »   | Tout consommateur                |
| **Matériaux**  | `src/tokens/materials.css`  | Un **matériau** — le verre, ses filtres, les halos, les tuiles | Tout consommateur |

`tokens.css` n'est qu'un index de trois `@import`, et leur ordre est la direction de
dépendance. `materials.css` est chargé en **dernier** parce qu'il lit `--surface` et
`--shadow-ink` ; l'inverse laisserait `--glass-fill-solid` sans valeur. Le contrat vérifie la
partie vérifiable : aucun hexadécimal hors de `primitives.css`, et `roles.css` ne cite aucun
jeton de matériau.

Les **92 primitives** sont nommées `--tc-<famille>-<L>`, où `<L>` est la **luminosité OKLab
mesurée**, ×1000 et arrondie : `--tc-teal-515` vaut `#087487` parce que sa L vaut 0,515. Le
nom est une donnée, pas une convention — le contrat le vérifie, primitive par primitive.
Quatorze familles : `amber`, `citron`, `copper`, `green`, `indigo`, `mist`, `pitch`, `red`,
`shade`, `soot`, `teal`, `veil`, `violet`, `white`.

Trois blocs de thème, dans cet ordre et pas deux :

```css
:root { /* déclare TOUT, en entier */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { /* redéfinit */ } }
:root[data-theme='dark'] { /* redéfinit */ }
```

Le thème sombre est donc servi **sans une ligne de JavaScript** — la seule architecture
compatible avec un site entièrement prérendu. Une couleur dont la seule déclaration vit dans
un `@media` ne s'applique jamais dans l'état non marqué : le contrat échoue si un jeton
sombre manque au bloc clair.

### Le contrat teal & cuivre

| Rôle             | Jeton                | Ce qu'il a le droit de faire                                 |
| ---------------- | -------------------- | ------------------------------------------------------------ |
| L'encre          | `--accent`           | **Monopole** des actions et des états : boutons, liens, focus |
| Le décor         | `--accent-secondary` | L'éditorial et l'ornement, **jamais un contrôle**             |
| Le champ         | les neutres          | Le teal vidé de sa chroma : rien ne devient sale              |

Les deux sont tenus en opposition mesurée à 179,3° en clair et 179,5° en sombre, avec un
écart de luminosité OKLab d'au moins 0,08 — c'est lui qui empêche le décor d'usurper le
signal, puisque la teinte chaude est verrouillée par l'opposition.

Conséquence directe, et elle surprend : **l'action destructrice est un bouton à liseré,
jamais un aplat.** L'aplat plein est réservé au teal.

## Les quatre manquements de contraste, publiés

La règle nº 7 (voir plus bas) s'applique à la palette elle-même. Le contrat mesure chaque
encre sur les **vingt supports** du produit « cinq supports × (nu + trois lavis d'état) », et
quatre couples ne tiennent pas leur seuil. Ils sont nommés plutôt que contournés.

**Trois portent sur du TEXTE (WCAG 1.4.3, 4,5:1), le quatrième sur une FORME (WCAG 1.4.11,
3:1)** : le titre ne dit donc plus « AA » tout court.

Le pire support est toujours le même : **une surface posée sur le halo froid, avec le lavis
d'appui `--panel-surface-active` par-dessus**.

| Encre                | Pire cas mesuré                      | Plancher | Ce qui tient au même endroit |
| -------------------- | ------------------------------------ | -------- | ---------------------------- |
| `--accent-secondary` | **4,75:1** clair / **2,96:1** sombre | 4,5:1    | Le cuivre est ÉDITORIAL : il n'a rien à faire sur un lavis d'état, qui est une couche d'INTERACTION. Sur les cinq supports nus, son pire cas reste 4,58:1 |
| `--text-accent`      | **4,40:1** clair / **4,23:1** sombre | 4,5:1    | En TEXTE, un lavis d'appui ne porte que `--text-strong` — 6,85:1 clair, 6,12:1 sombre. En LISERÉ (3:1) le même couple est légitime, avec 1,40 et 1,23 de marge |
| `--text-muted`       | **4,50:1** clair / **4,31:1** sombre | 4,5:1    | `--text-body`, 5,15:1 au même endroit. C'est l'appui et lui seul : 7,00:1 au lavis de repos, 6,67:1 sur la surface nue |
| `--accent` (l'aplat) | **2,59:1** sur le halo froid / **2,78:1** sur le halo chaud, en sombre | 3:1 | Un aplat de teal a besoin d'un liseré propre dès qu'il peut être posé sur un halo : `--control-border` tient 3,27:1 au même endroit — ou le halo doit rester hors de sa boîte |

Le quatrième ne porte pas sur une encre mais sur une **forme**, et son pire support n'est pas
un lavis d'état : c'est le halo. Le § 11 de `src/contract/glass.contract.test.ts` publie ses
dix mesures.

| substrat                     | clair  | sombre     |
| ---------------------------- | ------ | ---------- |
| la page nue                  | 4,53:1 | 3,28:1     |
| la surface sur la page nue   | 4,88:1 | 3,40:1     |
| la surface sur le halo froid | 3,93:1 | **2,59:1** |
| la surface sur le halo chaud | 3,96:1 | **2,78:1** |
| la surface en repli opaque   | 4,87:1 | 3,40:1     |

Le teal n'est pas en cause : il tient 3,40:1 sans halo. C'est le halo qui remonte le substrat
vers lui — la bulle froide sombre (`#004452`) est un teal de la même famille que l'accent, la
bulle chaude (`#58281c`) est simplement plus claire que le sol.

**Sur les cinq supports nus, toutes les encres tiennent AA — pire cas 4,58:1.** C'est le
cuivre en sombre sur la surface posée sur le halo froid, soit 0,08 de marge.

Dit autrement, et c'est le point : **c'est le lavis qui fait tomber, pas le halo.** Le halo
seul dégrade le contraste sans le faire passer sous le seuil ; il faut une couche
d'interaction posée par-dessus pour franchir la ligne.

Ces quatre notes ne sont pas des dettes déguisées : le test les vérifie **dans les deux
sens**. Une exemption dont la palette n'a plus besoin fait échouer la suite, et le nombre
d'exemptions est lui-même épinglé — en ajouter une est une modification visible en revue.

## Ce que le contrat ne prouve pas

Il lit du CSS en **texte** et ne compose que des couches de `background`. Sont donc hors du
domaine mesuré, et aucune assertion de ce dépôt ne doit prétendre le contraire :

1. **Le `backdrop-filter`** et le ménisque (`--glass-edge-*`, `--glass-rim-width`). Un flou
   moyenne les pixels du dessous — il rapproche donc le support de sa propre moyenne — et
   `saturate(1.6)` comme `brightness(1.08)` déplacent la couleur reçue. Rien de tout cela
   n'est calculé. Le portfolio a la même limite et la déclare *estimation* ; on reprend le
   mot.
2. **Les dégradés rendus** — `--glass-specular`, `--glass-highlight`, `--icon-surface-*`. Un
   arrêt de couleur se mesure, et le § 15 le fait arrêt par arrêt ; le dégradé rendu non, sa
   couleur en un point donné dépendant de la géométrie de l'élément.
3. **La géométrie des halos.** Les bulles sont des disques positionnés, pas des aplats de
   page : le modèle suppose qu'une surface peut se trouver entièrement dessus, ce qui est le
   cas le plus défavorable et non le cas général.
4. **Ce qu'un navigateur peint vraiment sur un élément donné.** Le contrat prouve qu'une pile
   nommée est arithmétiquement juste ; l'appariement d'une pile avec une règle CSS reste une
   affirmation humaine.
5. **Tout `src/magic/`.** C'est la limite la plus large : les composants publiés à la racine
   ne sont pas dans le domaine du contrat. Ils ont cessé d'écrire leurs couleurs en dur et
   lisent désormais des jetons, ce qui est une garantie bien meilleure qu'en 2.0 — mais c'est
   la garantie du **jeton**, et le contrat ne mesure pas la pile que le composant en compose.
   Voir « Ce que la 3.1 ne garantit pas ».

### Il n'y a aucun harnais navigateur dans ce dépôt

Pas de Playwright, pas de capture, pas de test de rendu. `jsdom` ne peint pas :
`getComputedStyle` y rend les valeurs déclarées, aucun pixel n'existe. **Le rendu du verre
n'a donc aucun garde automatisé** — ni le flou, ni le ménisque, ni le liseré spéculaire.

Les mesures de rendu citées dans les commentaires (Chromium headless) ont été faites à la
main, une fois. **Elles ne sont pas rejouées en CI**, et rien ne les surveille.

## Les règles, en sept lignes

Une règle qu'on ne peut pas citer de mémoire n'est pas appliquée. Elles s'appliquent à la
charte et à ce qu'un consommateur écrit avec elle. `src/magic/` les suit désormais dans
l'esprit — ses composants nomment des rôles et n'écrivent plus de couleur en dur —, mais le
point 2 reste hors de sa portée : **ses valeurs ne sont pas recalculées en CI**.

1. **Un jeton nomme un rôle, jamais un emplacement.** Cinq encres de texte, pas douze cases
   par écran. `--card-title-color` est une dette : il fige un composant dans la palette.
2. **Une valeur de couleur se mesure, elle ne se déclare pas.** Sur le support où elle vit
   réellement, et le chiffre est recalculé en CI.
3. **Le support de référence n'est pas le fond de page.** Une palette validée contre
   `--site-background` seul est validée contre le meilleur cas.
4. **La hiérarchie se construit.** Résoudre chaque encre isolément contre son seuil les fait
   converger et tue la hiérarchie : plancher de ΔE OKLab 5 entre rôles voisins.
5. **Un invariant qui casse en silence a un test, pas un commentaire.**
6. **Le sens ne passe jamais par la couleur seule.** Le garde-fou réel est le libellé
   textuel ; la couleur est un renfort.
7. **Une contrainte non satisfaisable s'écrit, elle ne se contourne pas.** Une charte qui ne
   contient que des succès est une charte qu'on n'a pas éprouvée.

## La vitrine

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

Le serveur écoute sur `127.0.0.1` et non sur `localhost` (`server.host` dans
`vite.config.ts`) : sur une machine qui résout `localhost` en IPv6, l'adresse littérale est
la seule qui réponde.

Ce qui se rend est un **site de documentation** : barre de navigation à gauche, une page par
sujet, et une entrée par composant publié. La palette avec ses ratios mesurés, les échelles,
le contrat d'accessibilité, puis une page par composant. Le site est rendu **dans la palette
qu'il documente** : le document est une instance de lui-même, et si une règle est fausse il
se dégrade avec elle.

Les pages de composants sont l'exception, et pour la raison donnée plus haut : les composants
sont posés sur des **scènes sombres** (`MAGIC_STAGE_GROUND`, plancher mesuré 13,22:1) plutôt
que sur le sol de la vitrine. Ce n'est plus, comme en 2.0, pour rattraper des libellés blancs
en dur qui seraient illisibles ailleurs — c'est parce que le **verre a besoin d'un fond à
réfracter** : flouter un aplat clair uni donne le même aplat clair, et le matériau disparaît.
La scène reste la seule couleur littérale de ce dossier, et elle n'emploie aucun jeton
`--tc-*` : c'est un décor de démonstration, pas une surface de la charte.

Le routage passe par le fragment (`#/composants/button`) parce que la vitrine se construit en
statique dans `dist-showcase/`, sans serveur capable de réécrire une URL profonde vers
`index.html`.

La barre du haut porte un **champ de recherche à suggestions**, motif « Combobox » de l'APG
dans sa forme à liste : `role="combobox"` sur le champ, la liste en `aria-controls`, et
l'option courante désignée par **`aria-activedescendant`** — le focus ne quitte jamais le
champ. Les accents sont traités, et c'est ce qui compte dans une doc en français :
`elevation` trouve **Élévation**, `acces` trouve **Accessibilité**.

**Aucun raccourci global, et c'est une décision.** Un `⌘K` aurait fait moderne et détourne un
raccourci du navigateur ; un `/` vole la frappe dès que le focus est dans un champ, et cette
vitrine est pleine de spécimens d'`Input`.

## Arborescence

```
src/
├── tokens/                  ← LA CHARTE, publiée en ./tokens.css
│   ├── tokens.css           ← trois @import, et leur ordre est la dépendance
│   ├── primitives.css       ← 92 couleurs, --tc-<famille>-<L OKLab ×1000>
│   ├── roles.css            ← les emplois
│   ├── materials.css        ← le verre, les halos, les tuiles
│   └── primitives.contract.test.ts   ← 105 assertions sur le NOM des primitives
├── contract/                ← LE CONTRAT, publié en ./contract
│   ├── color.ts             ← OKLab, luminance, ratio, composition d'alphas
│   ├── stylesheet.ts        ← lire une feuille en texte, reconstruire ses thèmes
│   ├── backdrop.ts          ← les supports composés, nommés une fois
│   └── *.test.ts            ← 1 096 assertions
├── magic/                   ← LES COMPOSANTS, publiés à la racine
│   ├── README.md            ← le matériau, les composants, ce qui est mesuré
│   ├── magic.scss           ← le filet anti-mouvement, publié avec ./opale.css
│   ├── opale.css            ← les jetons --opale-* et le catalogue plat
│   ├── opale.tsx            ← 77 entrées de catalogue, un seul fichier
│   └── components/…         ← huit dossiers composés, un module de style chacun
├── showcase/                ← LA VITRINE, hors paquet
└── styles/doc.css           ← la feuille de la vitrine, hors paquet
```

`src/magic/` **garde son nom de dossier**, alors qu'il ne contient plus rien de la librairie
dont ce nom vient. La raison est mécanique : le préfixe de classe produit par le build est
`opale-magic-`, et le sélecteur du filet anti-mouvement de `magic.scss` en dépend. Renommer
le dossier ne casserait pas le build — cela rendrait cette règle **inerte, en silence**, ce
qui est bien pire. L'héritage lui-même est raconté dans
[`src/magic/README.md`](./src/magic/README.md).

## Scripts

| Commande              | Ce qu'elle fait                                                     |
| --------------------- | ------------------------------------------------------------------- |
| `npm run dev`         | Sert la vitrine sur `127.0.0.1:5173`                                |
| `npm test`            | `vitest run` — le contrat de couleur et les tests des composants     |
| `npm run test:watch`  | La même suite en veille                                             |
| `npm run coverage`    | La suite avec le rapport `v8`                                       |
| `npm run build:lib`   | `rm -rf dist`, puis les trois passes ci-dessous                     |
| `npm run build:css`   | Copie `src/tokens/*.css` dans `dist/tokens/`                        |
| `npm run build:magic` | Les `.d.ts` par `tsc`, puis le JS et `magic.css` par Vite           |
| `npm run build`       | Construit la vitrine statique dans `dist-showcase/`                 |
| `npm run typecheck`   | `tsc -b --noEmit`                                                   |
| `npm run lint`        | ESLint, `jsx-a11y` compris                                          |
| `npm run format`      | Prettier                                                            |

`prepare` appelle `build:lib`, ce qui est ce qui rend l'installation depuis git possible.

`build:css` est un `cp` : les commentaires des feuilles de jetons partent chez le
consommateur. Il n'y a pas de minifieur dans ce dépôt, et c'est un choix assumé — à corriger
dans le script, jamais en appauvrissant la source.

## Ce que ce dépôt ne fait pas

- Il **ne publie pas sur npm** et n'a pas vocation à le faire tant que deux projets
  suffisent. Il n'a pas non plus de fichier de licence à lui : voir
  [`THIRD-PARTY-NOTICES.md`](./THIRD-PARTY-NOTICES.md), dernière section.
- Il **n'a pas migré** `portfolio` ni `travels_in_world` : ils consomment encore leurs
  propres feuilles. La bascule de `travels_in_world` implique de reteindre son fond de
  `#c4d8de` vers `#deedf0`, donc de remesurer les remplissages de sa carte du monde — c'est
  un chantier réel, pas un chercher-remplacer. La 2.0 l'a rendu plus lourd, pas plus léger :
  les deux sites employaient les dix-huit composants qui viennent de disparaître.
- Il **ne mesure aucune couleur rendue de `src/magic/`.** Aucun ratio recalculé, aucun audit
  `axe`, aucun test de lecteur d'écran, aucun rendu Firefox ni WebKit. Les composants ont en
  revanche leurs propres tests de comportement : `npx vitest run src/magic` rend
  `Test Files 10 passed (10) · Tests 115 passed (115)`.
- Il **ne vérifie pas le rendu du verre.** Aucun harnais navigateur, aucune capture.
- Il **ne dépend plus de Google Fonts à l’exécution**. Bricolage Grotesque et Chivo sont
  embarquées dans `opale.css`, avec un repli système via `--opale-font-body` et
  `--opale-font-title`.

## Ce qui reste à décider

Par coût de retour en arrière décroissant.

1. **La compatibilité de la 3.2.0.** La version de recette retire des composants publics ;
   vérifier les consommateurs et le numéro semver avant une publication hors recette.
2. **La mesure des couleurs composées par les composants.** Le blocage de la 2.0 a disparu
   avec le code copié : plus rien n'oblige à rester « fidèle plutôt que conforme », puisque
   le code est le nôtre. Reste à décider si le contrat doit s'étendre aux piles que les
   composants composent, ou si la garantie du jeton suffit.
3. **Le harnais navigateur.** Le contrat de couleur sait recalculer une composition
   d'alphas ; il ne sait pas ce qu'un `backdrop-filter` a mis sous un libellé. Une sonde qui
   capture, échantillonne le pixel réel derrière une encre et recalcule le ratio est chiffrée
   à environ une journée. La surface de rendu qu'aucun test ne garde n'a pas diminué avec la
   réécriture : le matériau est toujours du `filter` et du `backdrop-filter`.
4. **Minifier le CSS publié dans `build:css`.** Mesuré sur la 1.x : le socle livré passait de
   46,3 à 5,7 kB gzippés (−88 %). Le périmètre a changé, le chiffre est donc à refaire, mais
   la conclusion tient — les commentaires sont la valeur du dépôt dans `src/`, ils n'ont
   aucune raison d'être téléchargés.
5. **Un test unitaire de `Glass`.** C'est la primitive que six composants montent, et le seul
   des huit composants composés sans fichier de test en propre. Ce qui mériterait d'être
   tenu : le montage et le démontage du filtre SVG partagé, le compteur d'instances, et la
   présence des quatre couches nommées.
6. **Convertir le dernier module SCSS.** `SearchBar.module.scss` tient `sass` dans les
   dépendances de développement à lui seul.
7. La bascule du fond de `travels_in_world` vers `#deedf0`, et le remesurage de sa carte.
8. Les familles de caractères, et le budget de police qui va avec.
9. La simulation de deutéranopie sur `--danger` / `--success` / `--warning` : elle n'a pas
   été faite, et le résultat peut changer les trois valeurs. Le rouge n'est séparé du cuivre
   que de 11,3° de teinte.

Deux questions que la charte laissait ouvertes sont **tranchées et mesurées** ici, plutôt que
reportées :

- **L'état désactivé ne se dit pas par `opacity`.** La recette `opacity: 0.45` héritée du
  portfolio donnait 2,20:1 en clair contre 3,00:1 en sombre — un écart d'un tiers entre deux
  thèmes pour la même règle est un accident, pas une intention. La charte propose à la place
  `--panel-surface-active` + `--text-muted` + une bordure tiretée : mesuré 5,55:1 en clair et
  5,69:1 en sombre pour le libellé, 3,92:1 et 4,31:1 pour la bordure. Le tiret est là parce
  que le sens ne doit pas passer par la couleur seule, y compris pour dire « inerte ». C'est
  désormais une consigne pour le consommateur : la feuille de bouton qui l'appliquait a
  disparu avec les dix-huit composants.
- **`--warning` clair a été assombri deux fois, et c'est la deuxième correction qui compte.**
  La charte proposait `#845d22` (`--tc-amber-508`) ; il est passé à `#7b5620`
  (`--tc-amber-482`), calé sur le pire substrat que le contrat savait alors nommer — un lavis
  posé sur un aplat opaque. Le vrai pire support est le **halo sans carte**, où l'ambre
  tombait à 3,35:1 pour du texte. Le jeton vaut aujourd'hui `--tc-amber-390` (`#5a3f18`),
  battu contre ses deux voisines : `482` ne tient que 3,35:1, et `300` tient 7,04:1 mais
  passe **devant** `--text-strong` (10,28:1) sur le sol — une encre d'avertissement plus
  contrastée que l'encre forte est une faute d'apparence. `390` tient 4,96:1 au pire, avec
  0,46 de marge. La règle nº 3 s'appliquait à elle-même, deux fois de suite : le fond de page
  n'est jamais le pire cas, et le pire cas qu'on sait nommer n'est pas forcément le pire cas.
