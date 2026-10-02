# Opale — `@thomascaron/opale-ui`

Le système de design Opale pour React 19 : **61 composants**, leurs jetons `--opale-*`, deux
thèmes (clair et sombre), une matière « verre liquide » à activer composant par composant, et un
contrat de couleur exécutable qui recalcule chaque ratio de contraste en CI.

La vitrine documente chaque composant (démo, props, états, accessibilité, limites) et publie
les notes de versions. Licence MIT.

## Installation

Le paquet s'installe depuis GitHub, il n'est pas publié sur npm. Installez **une version
figée** : le code ne bouge plus sous vos pieds.

**Recommandé, à partir de la 2.9.0 — l'archive construite de la release.** Chaque release GitHub
porte l'archive du paquet déjà compilé : elle s'installe avec npm, pnpm ou yarn, sans script ni
chaîne de build à l'installation.

```bash
npm i https://github.com/ThoomassC/opale-ui/releases/download/v3.0.2/thomascaron-opale-ui-3.0.2.tgz
```

**Alternative avec npm — le tag Git** (seule voie pour les versions antérieures à la 2.9.0) :

```bash
npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v3.0.2"
```

Prérequis : React 19 et Node 20.19 ou 22.12 et plus. Par le tag Git, le paquet se compile à
l'installation (`prepare` → `build:lib`) et demande la chaîne de build chez vous.

> **Point de vigilance en déploiement (tag Git).** Si `prepare` ne tourne pas, `dist/` est absent
> et le build casse en production sans avoir cassé en local : c'est le cas avec
> `npm ci --ignore-scripts`. **Avec pnpm 10, installez l'archive** : pnpm refuse de compiler
> une dépendance Git (`ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`), et autoriser
> `@thomascaron/opale-ui` par son nom dans `onlyBuiltDependencies` ne suffit pas. L'archive de
> release n'a aucun de ces défauts.

## Une seule convention d'import

La feuille une fois, à la racine de l'application ; chaque composant par son nom.

```tsx
import '@thomascaron/opale-ui/opale.css'; // jetons, composants et polices
import { Button, Modal } from '@thomascaron/opale-ui';
```

- Les déclarations de types se lisent en `moduleResolution` `bundler` comme en
  `node16`/`nodenext`. Chaque composant exporte son type de props (`ButtonProps`,
  `ModalProps`…).
- Le namespace `Opale` (`Opale.Button`) désigne les mêmes composants ; l'import nommé reste la
  forme recommandée, et la seule qui marche partout. `Opale.*` référence tout le catalogue : un
  seul `Opale.Button` embarque le catalogue entier, là où `import { Button }` n’embarque que lui.

### Avec Tailwind v4 : la feuille en couche

`opale.css` est hors couche : elle bat toute règle rangée dans une `@layer`, donc tous les
utilitaires de Tailwind v4. Importez plutôt `opale.layered.css`, la même feuille rangée dans
`@layer opale`, et placez cette couche avant `components` et `utilities` :

```css
/* app.css */
@layer theme, base, opale, components, utilities;
@import 'tailwindcss';
@import '@thomascaron/opale-ui/opale.layered.css';
```

Une classe utilitaire (`class="mt-4"`) l'emporte alors sur la règle d'Opale. Une surcharge de
jeton hors couche (`:root { --opale-primary: … }`) l'emporte toujours, quel que soit l'ordre.

Une limite à connaître : le fond et la forme d'un `Button` sont peints par un pseudo-élément
(la silhouette arrondie), pas par le bouton lui-même. `bg-*` et `rounded-*` n'y changent donc
rien à l'œil ; passez par ses jetons, en utilitaire arbitraire au besoin
(`class="[--opale-button-background:var(--color-red-500)]"`) ou par `--opale-radius-md`.
Les marges, tailles et positions (`mt-4`, `w-full`) s'appliquent normalement.

### Sans les polices d'Opale

`opale.css` relie Chivo et Bricolage Grotesque par `@import './fonts.css'`. Pour servir vos
propres polices, importez `opale-nofonts.css` (ou `opale-nofonts.layered.css`) : la même
feuille, sans cet `@import`. N'importez qu'une seule des quatre feuilles.

### Avec Next.js (App Router)

Chaque module de composant porte la directive `"use client"` : un Server Component importe et
rend `Button`, `Card` ou `Tabs` sans les envelopper. Trois règles tiennent la frontière :

- **Dans un Server Component, les parties des composants composés par leur nom** :
  `TabsList`, `TabsTrigger`, `TabsContent`, `SidebarHeader`, `SidebarItems`, `SidebarItem`,
  `SidebarToggle`, `SidebarFooter`, `TopbarSection`, `TopbarBrand`, `TopbarActions`,
  `TopbarDivider`. Côté serveur, un composant client est une référence opaque qu'on ne lit pas
  par un point : `<Tabs.List>` y échoue, avec « Cannot access Tabs.List on the server » ou, au
  prérendu de `next build`, « Element type is invalid… got: undefined ».
- **La notation à point (`Tabs.List`) et le namespace `Opale.*` sont réservés aux Client
  Components**, comme les crochets (`useToast`) et les gestionnaires (`onClick`).
- **`ToastProvider` se pose une fois, dans le layout racine**, autour de `children` : un
  composant client peut envelopper des enfants serveur.

Les données — `ICON_NAMES`, `OPALE_ICONS`, `ICON_GROUPS`, `isOpaleIconName`,
`COOKIE_CONSENT_KEY`, `readCookieConsent` — sont livrées sans directive : elles se lisent côté
serveur comme de vraies valeurs.

```tsx
// app/layout.tsx — Server Component, qui importe aussi la feuille (voir plus haut)
import { ToastProvider } from '@thomascaron/opale-ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

// app/page.tsx — Server Component : les parties par leur nom
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@thomascaron/opale-ui';

export default function Page() {
  return (
    <Tabs defaultValue="apercu">
      <TabsList aria-label="Sections">
        <TabsTrigger value="apercu">Aperçu</TabsTrigger>
      </TabsList>
      <TabsContent value="apercu">Contenu rendu sur le serveur.</TabsContent>
    </Tabs>
  );
}
```

Les points d'entrée déclarés dans `package.json` :

| Spécifieur       | Cible                    | Ce que c'est                                               |
| ---------------- | ------------------------ | ---------------------------------------------------------- |
| `.`              | `dist/opale/index.js`    | Les composants ; `import` comme `require()`                |
| `./opale.css`    | `dist/opale/opale.css`   | Les jetons `--opale-*`, les composants ; relie `fonts.css` |
| `./opale.layered.css` | `dist/opale/opale.layered.css` | La même, rangée dans `@layer opale` (Tailwind v4) |
| `./opale-nofonts.css` | `dist/opale/opale-nofonts.css` | La même, sans l'`@import` des polices |
| `./opale-nofonts.layered.css` | `dist/opale/opale-nofonts.layered.css` | Sans polices, et en couche |
| `./fonts.css`    | `dist/opale/fonts.css`   | Chivo et Bricolage Grotesque, en fichiers woff2            |
| `./tokens.css`   | `dist/tokens/tokens.css` | La charte `--tc-*`, pour écrire vos propres surfaces       |
| `./contract`     | `dist/contract/index.js` | Le contrat de couleur — dépendance de développement        |
| `./package.json` | `package.json`           |                                                            |

Les composants n'ont besoin que d'une feuille : `./opale.css`, ou l'une de ses trois variantes. `./tokens.css` sert à qui compose ses propres
surfaces dans la palette de la charte.

## Les conventions de l'API

Depuis la 2.6, tous les composants suivent les mêmes noms :

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
`onCancel`, `severity`, `density`, `OpaleUI`…) restent acceptés et fonctionnent comme en 2.5 ;
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

- **Les composants composés**, un dossier chacun sous `src/opale/components/` : `Modal`,
  `PageScaffold`, `SearchBar`, `Sidebar`, `SiteNav`, `Tabs`, `ToastProvider` (et le hook
  `useToast`) et `Topbar`. Les parties de `Tabs`, `Sidebar` et `Topbar` sont aussi exportées
  par leur nom (`TabsList`, `SidebarItem`, `TopbarBrand`…).
- **Le catalogue**, dans `src/opale/catalog/` : **52 fiches** réparties en sept familles —
  saisie, boutons spécialisés, affichage de données, navigation, retours, mise en page et
  modules. La vitrine génère une page de démonstration par fiche.

Le verre n'est pas un composant publié : c'est la matière des autres. Les composants qui
acceptent `liquidGlass` l'activent un par un ; posez un fond riche derrière eux, un verre sur un
aplat uni ne réfracte rien.

## Le thème

Les jetons `--opale-*` portent deux thèmes. Le clair s'applique par défaut ; le sombre avec
`data-theme="dark"` sur la racine du document, ou localement avec
`data-opale-page-theme="dark"` sur un conteneur (c'est ce que fait `PageScaffold`). Les
échelles de hauteurs de contrôle, de texte, d'interligne et l'anneau de focus sont des jetons
communs à tous les composants.

La feuille ne peint pas la page hôte. Pour que le fond, l'encre, la police et les contrôles
natifs suivent le thème, posez la classe facultative `.opale-root` sur `<body>` (ou la racine
de l'application) :

```html
<html data-theme="dark">
  <body class="opale-root">…</body>
</html>
```

Une couleur de marque se surcharge sur `:root` (`--opale-primary: #16a34a;`) et traverse
`PageScaffold`. En sombre, redéclarez-la sous `:root[data-theme='dark']`.

### Suivre le système, sans flash

`useOpaleTheme` pilote le thème du document (`'light'`, `'dark'` ou `'system'`, mémorisé si
vous donnez une clé) ; `opaleThemeScript` renvoie le petit script à placer dans `<head>` pour
poser ce thème avant le premier affichage. Donnez-leur les mêmes options.

```tsx
// app/layout.tsx (Next.js)
import { opaleThemeScript } from '@thomascaron/opale-ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: opaleThemeScript({ storageKey: 'theme' }) }} />
      </head>
      <body className="opale-root">{children}</body>
    </html>
  );
}
```

```tsx
'use client';
import { useOpaleTheme } from '@thomascaron/opale-ui';

export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useOpaleTheme({ storageKey: 'theme' });
  return (
    <button type="button" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
      Thème {resolvedTheme === 'dark' ? 'clair' : 'sombre'}
    </button>
  );
}
```

`PageScaffold` suit la même logique en local : `defaultTheme="system"` et `themeStorageKey`.

## Personnaliser à sa marque

Opale se personnalise par ses jetons `--opale-*`, surchargés dans la feuille de l'application,
chargée après `opale.css`. Seuls les jetons **publics** sont des noms stables en 2.x ; la liste
complète, avec les valeurs claires et sombres, est sur la page « Personnaliser » de la vitrine
(`#/personnaliser`). Les autres sont des dérivés internes.

```css
:root {
  --opale-primary: #16a34a;
  --opale-primary-on-surface: #15803d; /* le primaire qui écrit : liens, lavis */
  --opale-focus: #15803d;
  --opale-on-primary: #14100b; /* l'encre des boutons primaires */
}
:root[data-theme='dark'] {
  --opale-primary: #4ade80;
  --opale-primary-light: #86efac; /* en sombre, le primaire écrit avec lui */
  --opale-on-primary: #0c0f0d;
}
```

- Chaque remplissage a son encre : `--opale-on-primary`, `--opale-on-secondary`,
  `--opale-on-danger` (qui valent `--opale-on-fill` par défaut) et `--opale-on-accent`.
- `data-opale-brand="derive"` (facultatif) calcule les états de la marque (survol, éclairci,
  focus) depuis `--opale-primary`.
- `data-opale-scope` recalcule les jetons dérivés dans un sous-arbre, pour une marque limitée à
  une section.
- La classe `.opale-root`, posée sur `<body>`, peint le fond, l'encre, la police et le schéma de
  couleurs du thème en vigueur.
- Les feuilles `opale.layered.css` (pour cohabiter avec Tailwind v4) et `opale-nofonts.css`
  (pour servir vos propres polices) sont décrites dans « Une seule convention d'import ».

### Valider sa marque en CI

```ts
import { checkBrand } from '@thomascaron/opale-ui/contract';
import { expect, it } from 'vitest';

it('la marque tient ses contrastes', () => {
  const report = checkBrand({
    primary: '#16a34a',
    primaryOnSurface: '#15803d',
    focus: '#15803d',
    onPrimary: '#14100b',
  });
  expect(report.failures).toEqual([]);
});
```

`checkBrand` mesure l'encre de chaque rôle sur son remplissage (4,5:1), le rôle écrit sur la
surface et sur le fond (4,5:1), et l'anneau de focus (3:1). Pour chaque remplissage, il propose
l'encre du thème qui tient. Passez `{ theme: 'dark' }` pour le thème sombre.

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
  mais aucune couleur _rendue_ n'est échantillonnée.
- **Le verre n'a pas de garde visuel automatisé.** `jsdom` ne peint pas : ni le flou, ni le
  ménisque, ni le filet spéculaire ne sont vérifiés en CI. `filter: url(#…)` et
  `backdrop-filter` n'ont été vérifiés que sous Chromium.

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
| `npm run check:dist`  | Vérifie le paquet construit : `"use client"` ciblé, types, polices, feuilles en couche et sans polices |
| `npm run check:size`  | Tient le poids d'un import isolé (`Divider`) sous son budget   |
| `npm run check:consumer` | Emballe le paquet comme l'archive de release (manifeste sans scripts) et le compile dans une application témoin (nodenext, bundler, `require`) |
| `npm run build`       | Construit la vitrine statique dans `dist-showcase/`            |
| `npm run typecheck`   | `tsc -b --noEmit`                                              |
| `npm run lint`        | ESLint, `jsx-a11y` compris                                     |
| `npm run format`      | Prettier                                                       |
| `npm run changelog`   | Régénère `CHANGELOG.md` depuis `src/showcase/releases.ts`      |
| `npm run release`     | Rejoue toute la suite, pose le tag et publie l'archive         |

## Versions

Le journal des versions est dans [`CHANGELOG.md`](./CHANGELOG.md), livré avec le paquet ; il
est régénéré depuis les notes de la vitrine.

## Licence

MIT — voir [`LICENSE`](./LICENSE). Les polices embarquées ont leurs propres licences, dans
[`THIRD-PARTY-NOTICES.md`](./THIRD-PARTY-NOTICES.md).
