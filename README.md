# Opale — `@thomascaron/opale-ui`

Le système de design Opale pour React 19 : **62 composants**, leurs jetons `--opale-*`, deux
thèmes (clair et sombre), une matière « verre liquide » à activer composant par composant, et un
contrat de couleur exécutable qui recalcule chaque ratio de contraste en CI.

La vitrine documente chaque composant (démo, props, états, accessibilité, limites) et publie
les notes de versions. Licence MIT.

## Installation

Le paquet s'installe depuis GitHub, il n'est pas publié sur npm. Installez **un tag de
version** : le code ne bouge plus sous vos pieds.

```bash
npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v3.8.0"
```

Prérequis : React 19 et Node 20.19 ou 22.12 et plus. Le paquet se compile à l'installation
(`prepare` → `build:lib`).

> **Point de vigilance en déploiement.** Si `prepare` ne tourne pas, `dist/` est absent et le
> build casse en production sans avoir cassé en local : c'est le cas avec
> `npm ci --ignore-scripts`, et avec pnpm 10, qui bloque par défaut les scripts des
> dépendances (autorisez `@thomascaron/opale-ui` dans `onlyBuiltDependencies`).

## Une seule convention d'import

La feuille une fois, à la racine de l'application ; chaque composant par son nom.

```tsx
import '@thomascaron/opale-ui/opale.css'; // jetons, composants et polices
import { Button, Modal } from '@thomascaron/opale-ui';
```

- Le bundle porte la directive `"use client"` : les composants s'importent tels quels depuis
  un Server Component de Next.js (App Router).
- Les déclarations de types se lisent en `moduleResolution` `bundler` comme en
  `node16`/`nodenext`. Chaque composant exporte son type de props (`ButtonProps`,
  `ModalProps`…).
- Le namespace `Opale` (`Opale.Button`) désigne les mêmes composants ; l'import nommé reste la
  forme recommandée.

Les points d'entrée déclarés dans `package.json` :

| Spécifieur       | Cible                    | Ce que c'est                                             |
| ---------------- | ------------------------ | -------------------------------------------------------- |
| `.`              | `dist/opale/index.js`    | Les composants                                           |
| `./opale.css`    | `dist/opale/opale.css`   | Les jetons `--opale-*`, les composants ; relie `fonts.css` |
| `./fonts.css`    | `dist/opale/fonts.css`   | Chivo et Bricolage Grotesque, en fichiers woff2          |
| `./tokens.css`   | `dist/tokens/tokens.css` | La charte `--tc-*`, pour écrire vos propres surfaces     |
| `./contract`     | `dist/contract/index.js` | Le contrat de couleur — dépendance de développement      |
| `./package.json` | `package.json`           |                                                          |

Les composants n'ont besoin que de `./opale.css`. `./tokens.css` sert à qui compose ses propres
surfaces dans la palette de la charte.

## Les conventions de l'API

Depuis la 3.6, tous les composants suivent les mêmes noms :

| Besoin                 | Props                                                   |
| ---------------------- | ------------------------------------------------------- |
| Une valeur             | `value`, `defaultValue`, `onValueChange`                |
| Ouvrir, fermer         | `open`, `onOpenChange`                                  |
| La taille              | `size` : `small`, `medium`, `large`                     |
| Le ton d'un message    | `tone` : `neutral`, `info`, `success`, `warning`, `error` |
| Les textes d'interface | `labels` (défauts français), `locale` pour les tris     |
| La matière             | `liquidGlass`                                           |

Chaque composant accepte aussi `ref`, `className`, `style` et les attributs natifs de son
élément ; les champs de formulaire les transmettent à leur contrôle natif, ce qui les rend
utilisables avec react-hook-form.

Les anciens noms (`onChange` à valeur, `page`, `values`, `activeItemId`, `onClose`,
`onCancel`, `severity`, `density`, `OpaleUI`…) restent acceptés et fonctionnent comme en 3.5 ;
l'éditeur les barre et indique le nouveau nom.

## PageScaffold — une page prête à adapter

`PageScaffold` assemble la marque, la navigation, la recherche, le contenu principal et le pied
de page. La mise en page s'adapte au mobile, le menu fonctionne au clavier, et le header porte
une bascule clair/sombre et un sélecteur FR/EN/ES.

```tsx
import { Card, PageScaffold } from '@thomascaron/opale-ui';

<PageScaffold
  siteName="Atelier"
  navigation={[{ id: 'home', href: '/', label: 'Accueil' }]}
  activeId="home"
  searchAction="/recherche"
  footerLinks={[{ id: 'legal', href: '/mentions-legales', label: 'Mentions légales' }]}
>
  <Card title="Bienvenue">Votre contenu.</Card>
</PageScaffold>;
```

- La recherche soumet un formulaire GET vers `/search` par défaut : prévoyez la route, ou
  passez `searchAction` / `onSearch`.
- `slots` remplace individuellement la marque, la navigation, la recherche, les actions,
  l'intro et le pied de page.
- Le thème est limité au gabarit : il ne change pas celui de la page hôte. `theme` / `language`
  pilotent les valeurs, `defaultTheme` / `defaultLanguage` les laissent au gabarit.

## Le catalogue

Tout est exporté à la racine.

- **Les composants composés**, un dossier chacun sous `src/opale/components/` : `Glass`,
  `Modal`, `PageScaffold`, `SearchBar`, `Sidebar`, `SiteNav`, `Tabs`, `ToastProvider` (et le
  hook `useToast`) et `Topbar`.
- **Le catalogue**, dans `src/opale/catalog/` : **52 fiches** réparties en sept familles —
  saisie, boutons spécialisés, affichage de données, navigation, retours, mise en page et
  modules. La vitrine génère une page de démonstration par fiche.

`Glass` est la primitive de la matière. Les composants qui acceptent `liquidGlass` l'activent
un par un ; posez un fond riche derrière eux, un verre sur un aplat uni ne réfracte rien.

## Le thème

Les jetons `--opale-*` portent deux thèmes. Le clair s'applique par défaut ; le sombre avec
`data-theme="dark"` sur la racine du document, ou localement avec
`data-opale-page-theme="dark"` sur un conteneur (c'est ce que fait `PageScaffold`). Les
échelles de hauteurs de contrôle, de texte, d'interligne et l'anneau de focus sont des jetons
communs à tous les composants.

## La charte et le contrat de couleur

### `./contract`

Une dépendance de développement : rien n'y importe React ni ne touche au DOM, donc zéro octet
au budget de l'application.

```ts
import {
  contrastRatio, // le ratio WCAG entre deux couleurs résolues
  parseThemes, // une feuille de jetons en texte → ses thèmes reconstruits
  resolveToken, // (theme, token) → la couleur, indirections suivies
  compositeLayers, // une pile de couches alpha → l'aplat opaque qu'elle présente
  oklab, // la conversion OKLab
  deltaEOklab, // l'écart perceptuel entre deux couleurs
  resolveBackdrop, // (theme, spec) → l'aplat opaque qu'une pile présente à une encre
} from '@thomascaron/opale-ui/contract';
import type { BackdropSpec, Theme, ThemeName } from '@thomascaron/opale-ui/contract';
```

### Architecture des jetons de la charte

Trois couches, une seule direction de dépendance : `materials → roles → primitives`.

| Couche         | Fichier                     | Ce qu'elle nomme                        |
| -------------- | --------------------------- | --------------------------------------- |
| **Primitives** | `src/tokens/primitives.css` | Une **couleur**, pas un emploi          |
| **Rôles**      | `src/tokens/roles.css`      | Un **emploi** — « le texte fort »       |
| **Matériaux**  | `src/tokens/materials.css`  | Le verre, ses filtres, les halos        |

Les **54 primitives** sont nommées `--tc-<famille>-<L>`, où `<L>` est la luminosité OKLab
mesurée ×1000 : le nom est une donnée, et le contrat la vérifie primitive par primitive.

### Les manquements de contraste, publiés

Le contrat mesure chaque encre de la charte sur vingt supports (cinq supports × nu et trois
lavis d'état). Quatre couples ne tiennent pas leur seuil ; ils sont nommés plutôt que
contournés, et le test les vérifie dans les deux sens — une exemption devenue inutile fait
échouer la suite. Tous tombent sur le même support : une surface posée sur un halo, avec le
lavis d'appui par-dessus.

| Encre                | Pire cas mesuré                          | Plancher |
| -------------------- | ---------------------------------------- | -------- |
| `--accent-secondary` | 4,75:1 clair / 2,96:1 sombre             | 4,5:1    |
| `--text-accent`      | 4,40:1 clair / 4,23:1 sombre             | 4,5:1    |
| `--text-muted`       | 4,50:1 clair / 4,31:1 sombre             | 4,5:1    |
| `--accent` (l'aplat) | 2,59:1 sur le halo froid, sombre         | 3:1      |

Sur les cinq supports nus, toutes les encres tiennent AA.

## Limites connues

- **Le contrat mesure la charte, pas le rendu des composants.** Les composants lisent des
  jetons mesurés et ont leurs propres tests de comportement, de contraste et d'accessibilité,
  mais aucune couleur *rendue* n'est échantillonnée.
- **Le verre n'a pas de garde visuel automatisé.** `jsdom` ne peint pas : ni le flou, ni le
  ménisque, ni le filet spéculaire ne sont vérifiés en CI. `filter: url(#…)` et
  `backdrop-filter` n'ont été vérifiés que sous Chromium.
- **Le CSS publié n'est pas minifié** : ses commentaires partent chez le consommateur.

## La vitrine

```bash
npm install
npm run dev        # http://127.0.0.1:5173
```

Un site de documentation rendu dans la palette qu'il documente : une page par fondation, une
page par composant, les notes de versions et une recherche à suggestions. Le routage passe par
le fragment (`#/composants/opale-button`) : la vitrine se construit en statique dans
`dist-showcase/`. Chaque version antérieure reste consultable sous `public/versions/`.

## Scripts

| Commande              | Ce qu'elle fait                                                |
| --------------------- | -------------------------------------------------------------- |
| `npm run dev`         | Sert la vitrine sur `127.0.0.1:5173`                           |
| `npm test`            | `vitest run` — contrat, composants et vitrine                  |
| `npm run test:watch`  | La même suite en veille                                        |
| `npm run coverage`    | La suite avec le rapport `v8`                                  |
| `npm run build:lib`   | Construit le paquet dans `dist/` (appelé par `prepare`)        |
| `npm run check:dist`  | Vérifie le paquet construit : `"use client"`, types, polices   |
| `npm run check:consumer` | Emballe le paquet et le compile dans une application témoin (nodenext, bundler) |
| `npm run build`       | Construit la vitrine statique dans `dist-showcase/`            |
| `npm run typecheck`   | `tsc -b --noEmit`                                              |
| `npm run lint`        | ESLint, `jsx-a11y` compris                                     |
| `npm run format`      | Prettier                                                       |
| `npm run release`     | Pose le tag de la version du manifeste, après vérifications    |

## Licence

MIT — voir [`LICENSE`](./LICENSE). Les polices embarquées ont leurs propres licences, dans
[`THIRD-PARTY-NOTICES.md`](./THIRD-PARTY-NOTICES.md).
