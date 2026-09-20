# `src/magic` — react-magic-ui vendoré

## D'où vient ce code

Copie de [`react-magic-ui`](https://github.com/tweeedlex/react-magic-ui) de
`@tweeedlex`, version 1.0.9, sous licence **MIT, Copyright (c) 2025 tweeedlex**.
Le texte de licence est celui du dépôt d'origine, recopié dans
`THIRD-PARTY-NOTICES.md` à la racine ; chaque fichier porte un bandeau de
provenance.

**Depuis la 2.0, ce dossier EST le point d'entrée racine du paquet.** Il n'y a
plus de sous-chemin `@thomascaron/opale-ui/magic` : `import { Button } from
'@thomascaron/opale-ui'` sert ce code, et `@thomascaron/opale-ui/opale.css` sert
`magic.scss` compilée. Le dossier garde son nom parce que c'est lui qui porte la
provenance MIT — le renommer casserait le chemin sur lequel s'appuient le fichier
de notices et les bandeaux.

## Hors du contrat de couleur

**Ce dossier n'emploie aucun jeton `--tc-*` et n'est pas soumis au contrat de
couleur d'Opale.** Ses couleurs sont celles de tweeedlex : des blancs
semi-transparents (`rgba(255,255,255,.06)` à `.40`) posés sur un fond sombre,
plus les neuf couleurs de leur `@theme`. Aucun ratio de contraste n'a été mesuré
sur ce code et aucun ne le sera : il est gardé fidèle, pas conforme.

Les tests de contrat d'Opale ne lisent que `src/tokens/`, ils ne voient donc pas
ce dossier. Si l'un d'eux venait à balayer `src/**`, c'est `src/magic/**` qu'il
faudrait exclure explicitement, pas ce code qu'il faudrait réécrire.

**Ce que ça coûte au consommateur, mesuré.** Onze des quatorze modules peignent
leur libellé en blanc pur, en dur — `@apply text-white` ou `color: white`, jamais
un jeton ; les trois autres (`Glass`, `Slider`, `Switch`) n'écrivent pas de texte.
Sur un fond blanc, du blanc vaut **1,00:1** : invisible. Sur la plaque de
spécimen d'Opale (`--surface`, `rgb(235,244,246)`), **1,12:1**. Le seuil AA du
texte courant est 4,5:1. C'est pour ça, et pour rien d'autre, que la vitrine les
pose sur des scènes sombres (plancher mesuré 13,22:1, voir
`src/showcase/pages/composants/stage.tsx`).

Curiosité de leur code, notée parce qu'elle induit en erreur :
`Glass.module.scss:9` déclare `--lg-text: #ffffff` sur `:root`, et **aucune règle
ne la consomme** — vérifié, `grep -rn 'lg-text' src/magic/` ne rend que sa
déclaration. Surcharger cette variable chez soi ne change donc rien. Le blanc
vient des `text-white` des modules, un par un.

## Fidélité

Le code est copié **au caractère**. Vérifié fichier par fichier lors de la copie :
sur les **50 fichiers vendorés** (soit tout `src/magic/` sauf ce README,
`magic.scss` et `scss.d.ts`), 39 sont strictement identiques à la source ; les 11
autres ne diffèrent que par l'ajout du mot-clé `type` dans un import, imposé par
`verbatimModuleSyntax` du `tsconfig` d'Opale. Les seules autres additions sont des
commentaires : le bandeau de provenance partout, et cinq `eslint-disable`
documentés (voir plus bas).

> Le compte de fichiers est remesuré ici (`find src/magic -type f` → 53, moins les
> trois non vendorés) ; la répartition 39 / 11, elle, vient de la comparaison
> faite au moment de la copie et **n'est pas rejouable dans ce dépôt** — la source
> n'y est pas présente. Elle est reportée telle quelle.

Corollaire : les défauts de COMPORTEMENT de leur code sont conservés tels quels.
Ne les corrigez pas ici — remontez-les chez tweeedlex. Ce fichier est là pour
qu'aucun de ces défauts ne soit une surprise.

**Trois fichiers vendorés font désormais exception**, et la répartition 39 / 11
ci-dessus ne décrit donc plus l'arbre : elle décrit l'état à la copie. Voir
« Modifications du code vendoré » juste en dessous.

## Modifications du code vendoré

Distinctes des écarts de `magic.scss` : celles-ci touchent des fichiers de
composant, c'est-à-dire du code copié au caractère. Chacune corrige une faute
qui rendait le composant inutilisable **dans une page hôte**, pas un choix
esthétique de l'amont — et chacune est mesurée.

### `glass/Glass.tsx` et `glass/style/Glass.module.scss` — le matériau commun

La primitive `Glass` reprend maintenant la recette validée dans la vitrine de
« Verre liquide » pour tous les composants qui la composent : voile à alpha
0,06, relief radial, saturation à 1,08, blur à 0,75 px, déformation SVG douce
(échelle 12) et reflet à alpha 0,32. `Button`, `Card`, `Input`, `Select`,
`Modal`, `Sidebar`, `Tabs`, `Toast`, `Topbar` et les autres composants héritent
ainsi d'un même matériau sans recopier la recette dans chaque module.

### `glass/style/Glass.module.scss` — le rayon de l'enveloppe

`8px` figé → `var(--lg-radius, 22px)`, et `.glassFilter` passe de `8px` à
`inherit`.

L'enveloppe porte `overflow: hidden`. Son rayon ne décide donc pas de son seul
bord : **il rogne tout ce qu'elle contient**. Mesuré au navigateur, `Modal`
demandait `rounded-3xl` (24 px) sur son contenu et sortait à 8 px ; `Button`
demandait `rounded-xl` (12 px), même résultat. Aucun composant ne pouvait
s'arrondir plus que son enveloppe, et `rootClassName` ne le permettait pas
davantage (c'est le défaut du `Badge`, plus bas, qui est intact).

### `glass/style/Glass.module.scss` — le contexte d'empilement

`z-index: 0` ajouté à `.glassContainer`.

L'enveloppe était en `z-index: auto`, donc les `z-index` 1, 2 et 3 de ses quatre
couches **s'échappaient dans le contexte d'empilement de la page hôte**. Mesuré
sur la vitrine : aucun contexte d'empilement entre la glace et la racine,
`glassContent` sortant à 3 contre 2 pour la barre collante du site — le
composant se peignait par-dessus l'en-tête au défilement.

`z-index: 0` et non `isolation: isolate`, délibérément : `isolate` crée aussi une
**racine de fond**, et `.glassFilter` porte un `backdrop-filter: blur(0.75px)` qui
n'échantillonnerait alors plus que l'intérieur de l'enveloppe — le verre
cesserait de réfracter la page. Vérifié après correction : `backdrop-filter:
blur(0.75px) saturate(1.08)` et `filter: url("#lg-dist")` toujours actifs, un seul contexte
d'empilement, sur l'enveloppe.

### `modal/style/Modal.module.scss` et `modal/Modal.tsx` — la coquille

`Modal` ne passait que `className` à `Glass`, qui l'applique à sa couche de
CONTENU. Le rayon et l'ombre atterrissaient donc sur un enfant de l'enveloppe
en `overflow: hidden` : mesuré, le contenu sortait bien à 24 px mais l'enveloppe
le rognait à 8, et son ombre extérieure de 60 px était rognée par le même
`overflow`. **La modale n'avait en pratique ni angle arrondi ni ombre.**

Une classe `.modalShell` part donc sur `rootClassName`, c'est-à-dire sur
l'enveloppe : rayon 34 px, liseré, et les deux ombres.

Le voile passe de `blur(10px)` sur 30 % d'opacité à `blur(3px)` sur 60 %. Et le
liseré a dû être **presque opaque**, ce qui n'était pas prévu : un premier essai
à 38 % de blanc mesurait 1,13:1 contre le pourtour, invisible. La cause est
structurelle — la modale est translucide au-dessus du même voile que la page,
donc assombrir le voile fait descendre son remplissage avec lui et le rapport ne
bouge pas (remplissage mesuré 1,24:1 contre pourtour). À 75 % de blanc sur
1,5 px, l'arête compose `#d9dadc` et mesure **3,86:1** sur les pixels rendus,
au-dessus du plancher de 3:1 de WCAG 1.4.11. Un filet sombre extérieur de 1 px
tient l'arête dans l'autre sens, pour une page hôte claire.

## Les six écarts de `magic.scss`

`magic.scss` est le seul fichier volontairement différent de leur
`src/tailwind.css`. Chaque écart est aussi commenté sur place, et numéroté dans
la feuille.

1. **`@tailwind base;` absent.** Le Preflight réinitialise `*`, les titres, les
   marges et les boutons. Mesuré : avec le Preflight, le `<h1>` d'une application
   consommatrice passe de 32 px à 16 px et sa marge de 21,44 px à 0. Cette feuille
   étant publiée et importée par des applications tierces, le Preflight les
   casserait. `corePlugins: { preflight: false }` dans `tailwind.config.ts` rend
   l'intention exécutable plutôt que conventionnelle.
2. **Pas d'`@import url("https://fonts.googleapis.com/…")`.** Un import distant
   dans une feuille publiée impose une requête tierce à tous les consommateurs et
   échoue hors ligne. La famille est un jeton avec repli : `--magic-font`, défaut
   `"Nunito", sans-serif`. Le consommateur qui veut vraiment Nunito la charge
   lui-même.
3. **Police scopée, pas universelle.** Leur `* { font-family: "Nunito" }`
   s'appliquerait à toute la page du consommateur. Remplacé par une règle à
   spécificité nulle limitée à leurs propres classes :
   `:where([class*='opale-magic-'])`. Le préfixe `opale-magic-` est produit par
   `css.modules.generateScopedName` dans la configuration de build : **sans ce
   préfixe, cette règle ne s'applique à rien.**
4. **Deux déclarations du Preflight remises, scopées.** Les retirer toutes avait
   cassé du rendu, et les deux ont été mesurées :
   `button { background-color: transparent }`, sans laquelle un bouton garde le
   chrome natif du moteur (`rgb(239,239,239)`, `border-top 2px outset`) — ni
   `.btn`, ni `.input`, ni `.selectButton` ne posent ce fond ; et
   `*, ::before, ::after { border-style: solid; border-width: 0 }`, sans laquelle
   **aucune bordure ne se dessine** — Tailwind v3 n'émet jamais `border-style`
   pour un `@apply border`, il n'émet que `border-width` et compte sur le
   Preflight. Quatre sites concernés : `Modal.module.scss:51`,
   `Toast.module.scss:157`, `Select.module.scss:69` et `:104`. Les deux règles
   sont bornées aux classes de `/magic` et écrites en `:where()`, donc à
   spécificité nulle : n'importe quelle déclaration de module (0,1,0) les bat, ce
   qui est exactement ce qu'on veut.
5. **Leurs neuf couleurs de thème, rendues effectives.** Leur bloc
   `@theme { --color-danger: … }` est de la syntaxe Tailwind **v4** dans un projet
   Tailwind **v3.4.18** : v3 ne le traite pas, donc les neuf variables n'étaient
   définies nulle part, chez eux non plus. Les neuf valeurs sont recopiées au
   caractère depuis leur `@theme` et posées sur `:where([class*='opale-magic-'])`
   plutôt que sur `:root`, pour ne pas installer neuf variables très génériques
   chez le consommateur. Ce n'est pas un écart à leur intention, c'est la faire
   s'appliquer.
6. **Un bloc `prefers-reduced-motion: reduce`, que ni cette feuille ni la leur ne
   portait.** Mesuré : `grep -rn 'prefers-reduced-motion' src/magic/` rendait 0.
   Il y a pourtant quatre `@keyframes` de 0,8 s dans `Glass.module.scss`, qui se
   déclenchent au clic sur les treize composants bâtis sur `Glass`, plus la
   translation du toast. Le filet universel de `tokens.css` les couvrait — **à
   condition que le consommateur importe `tokens.css`**, ce que la 2.0 lui retire
   toute raison de faire, puisque les composants n'emploient plus aucun jeton. Le
   garde est devenu détachable au moment précis où il a cessé d'être implicite. Le
   bloc restreint la liste des propriétés en transition plutôt que de couper les
   transitions — moins de mouvement, pas moins de retour d'information — et c'est
   la seule règle de `/magic` écrite en sélecteur nu et en `!important`, parce que
   c'est la seule qui doit **gagner** contre les modules. Mesuré sous
   `chrome-headless-shell` avec `--force-prefers-reduced-motion` :
   `animationDuration` de `.glassAnimating` passe de `0.8s` à `1e-05s`, et à
   `0.8s` de nouveau hors préférence.

Leur bloc `@theme` n'est donc **pas** repris comme tel : c'est l'écart 5 qui en
recopie les valeurs sous une forme que Tailwind v3 applique.

> **Le bandeau en tête de `magic.scss` dit encore « les trois écarts ».** Il est
> en retard sur son propre fichier, qui en porte six. Corriger un commentaire de
> `src/magic/**` n'est pas du ressort de ce README ; c'est signalé ici.

## Les cinq `eslint-disable`

Le `eslint.config.js` d'Opale est plus strict que le leur. Cinq fichiers portent
un `eslint-disable` en tête, ciblé sur les seules règles qui s'y déclenchent,
parce que les satisfaire voudrait dire réécrire leur code. Deux d'entre eux
masquent de vrais défauts, et c'est écrit dans le pragma :

| Fichier | Règles | Ce que ça cache |
| --- | --- | --- |
| `glass/Glass.tsx` | `no-explicit-any` | ref et événement de clic typés `any` |
| `slider/Slider.tsx` | `no-unused-vars`, `no-static-element-interactions` | `showValue` sans effet ; piste non atteignable au clavier |
| `checkbox/Checkbox.tsx` | `click-events-have-key-events`, `no-static-element-interactions` | libellé en `<span onClick>` au lieu d'un `<label>` |
| `modal/Modal.tsx` | `set-state-in-effect` | `setState` en corps d'effet |
| `toast/ToastProvider.tsx` | `set-state-in-effect` | `setState` en corps d'effet |

Trois avertissements ESLint subsistent, non masqués — mesuré, `eslint src/magic`
rend `3 problems (0 errors, 3 warnings)` : deux `exhaustive-deps` (`Slider:97`,
`ToastProvider:195`) et un `react-refresh/only-export-components`
(`ToastProvider:241`).

## Trois défauts qui atteignent un consommateur

Ils sont dans leur code, donc ils ne sont pas corrigés — mais ils se voient à
l'usage et non à la lecture, alors ils sont écrits ici avec leur mesure.

### 1. `Badge` n'est pas une pilule, et son `rootClassName` est inerte

`Badge.tsx:51` passe `rootClassName={"rounded-full"}` à `Glass`. Cette classe
atterrit sur le même `<div>` que `styles.glassContainer` (`Glass.tsx:92-99`), et
les deux règles se disputent le même `border-radius` **à poids égal** :

| règle | spécificité | valeur | position dans `dist/magic/magic.css` |
| --- | --- | --- | --- |
| `.rounded-full` | (0,1,0) | `9999px` | ligne 51 (offset 1 578) |
| `.opale-magic-glassContainer-2XpdN` | (0,1,0) | `var(--lg-radius, 22px)` | ligne 403 (offset 17 011) |

À spécificité égale, c'est l'ordre du document qui tranche, et l'enveloppe passe
plus tard : **le rayon effectif est celui de l'enveloppe, pas 9999px.** Le badge
est un rectangle aux coins arrondis. Relevé au navigateur pour confirmation :
`glassContainer rounded-full` → **22px** ; `glassContainer` + `rootStyle` en
ligne → **999px**.

Le rayon de l'enveloppe valait `8px` en amont ; Opale l'a porté à 22 px et rendu
réglable par `--lg-radius` (voir « Modifications du code vendoré » plus bas).
**Cela n'a pas corrigé ce défaut-ci** : seule la valeur a changé, le mécanisme
est intact, et 22 px sur une pastille de 24 px de haut n'est pas davantage une
pilule que 8.

Leur `Switch` s'en sort parce qu'il emploie `rootStyle` et non `rootClassName`
(`Switch.tsx:38`, `rootStyle={{ borderRadius: "999px" }}`) : une déclaration en
ligne bat toute règle de feuille. C'est le contournement, et il vaut pour un
consommateur : **passer un `rootStyle` plutôt qu'un `rootClassName` dès qu'il
s'agit d'une propriété que `glassContainer` déclare aussi.**

C'est un trait de l'original — chez eux aussi la couche `@tailwind utilities`
passe avant les modules — donc ce n'est pas corrigé. Mais un consommateur qui
passe `rootClassName` croira que ça marche, et rien ne le détrompera.

> Les positions ci-dessus sont relevées sur la feuille produite ; elles se
> décalent à chaque build. Ce qui ne se décale pas, et qui est le fait : même
> spécificité, module déclaré après l'utilitaire.

### 2. `Button variant="default"` — l'extracteur ne lit pas les chaînes interpolées

`Button.tsx:47` construit sa classe de variante par interpolation :

```tsx
variant && `bg-${variant}`
```

L'extracteur de Tailwind ne lit pas le JavaScript : il cherche des suites de
caractères qui *ressemblent* à des classes dans le texte brut du fichier. Dans un
gabarit, il ne voit que `bg-`, et **aucune des quatre variantes déclarées
(`"default" | "positive" | "negative" | "warning"`) n'est un littéral**. Mesuré
sur `dist/magic/magic.css` tel que construit avant correction : `.bg-default`
**absente**, et le bouton sortait sans aucun fond.

**Corrigé, et voici par quoi.** `tailwind.config.ts` porte désormais
`safelist: ['bg-default', 'bg-positive', 'bg-negative', 'bg-warning']`. Vérifié sur
la feuille reconstruite : `.bg-default { background-color: var(--color-default) }`
est bien émise, ligne 52, et `--color-default` vaut `#FFFFFF22` depuis l'écart 5
de `magic.scss`. La correction ne vit que dans `dist/` : **une feuille construite
avant la `safelist` ne la porte pas**, donc `npm run build:magic` est la condition
pour qu'elle atteigne un consommateur.

**Pourquoi les quatre et pas seulement `bg-default`.** Cinq `.bg-*` — `positive`,
`negative`, `warning`, `info`, `neutral` — existaient déjà dans la feuille, et
elles y existent **deux fois** : une fois comme utilitaire Tailwind
(`background-color: var(--color-…)`, lignes 52-67 de la feuille produite), parce
que `Badge.tsx:26-33` les écrit en **littéraux** dans une table de correspondance
que l'extracteur sait lire ; et une fois comme dégradés dans le bloc `:global` de
`Badge.module.scss` (lignes 1633-1645), qui passe plus tard et emploie le
raccourci `background` — donc c'est lui qui peint. `bg-default` manquait parce que
cette même table associe `default` à la chaîne **vide**.

Conséquence : trois variantes de `Button` étaient portées **par un détail
d'implémentation de `Badge`**. Changez cette table, ou supprimez `Badge`, et
`Button variant="positive"` redevient inerte sans un mot — le mode de panne exact
qu'on répare pour `default`. Les quatre entrées de `safelist` sont là pour que le
bouton se tienne tout seul ; trois sont redondantes aujourd'hui, et sont là pour ne
pas l'être demain.

### 3. Deux collisions de types qui empêchent de brancher un `setState`

`CheckboxProps` et `SidebarProps` intersectent un rappel métier avec un
gestionnaire d'événement DOM du même nom, hérité de `GlassProps` (qui vaut
`ComponentPropsWithoutRef<'div'>` par défaut) et, pour `Sidebar`, aussi de
`ComponentPropsWithoutRef<'aside'>`. Le type résultant est une **intersection de
fonctions**, donc le paramètre arrive en union.

Mesuré au compilateur (`tsc --strict`, TypeScript 6.0) :

```
Type 'Dispatch<SetStateAction<boolean>>' is not assignable to type
  '((checked: boolean) => void) & ChangeEventHandler<HTMLDivElement, Element>'.

Type 'Dispatch<SetStateAction<boolean>>' is not assignable to type
  'ToggleEventHandler<HTMLElement> & ((collapsed: boolean) => void)
   & ToggleEventHandler<HTMLDivElement>'.
```

Autrement dit : `onChange={setChecked}` et `onToggle={setCollapsed}` **ne
compilent pas**. Il faut resserrer le paramètre au moment de l'employer. Cette
forme-là compile, vérifiée par `tsc` :

```tsx
const [checked, setChecked] = useState(false);
const [collapsed, setCollapsed] = useState(false);

<Checkbox
  checked={checked}
  onChange={(next) => {
    if (typeof next === 'boolean') setChecked(next);
  }}
/>

<Sidebar
  collapsed={collapsed}
  onToggle={(next) => {
    if (typeof next === 'boolean') setCollapsed(next);
  }}
/>
```

Le `typeof next === 'boolean'` n'est pas une précaution défensive : c'est ce qui
réduit l'union, et sans lui le corps ne compile pas. À l'exécution, `Checkbox`
n'appelle jamais `onChange` avec autre chose qu'un booléen
(`Checkbox.tsx:35`) — la branche fausse est donc morte, mais le compilateur
l'exige.

## Le quatrième point : `Slider` rejoint le verre

`Slider.tsx` monte désormais `Glass`, comme les autres composants de la
librairie. Il partage donc le `filter: url("#lg-dist")`, le reflet spéculaire et
la déformation liquide au clic. Sa piste reste volontairement celle de l'amont :
un `<div>` sans rôle ni clavier. Seule la poignée se déplace après une prise en
main, en continu à l'écran, y compris lorsque `step` arrondit la valeur émise.

## Reste ouvert

- **Classes globales dans la feuille publiée, et il y en a plus que prévu.**
  `Badge.module.scss` publie `.bg-positive`, `.bg-negative`, `.bg-warning`,
  `.bg-info` et `.bg-neutral` via un bloc `:global` ; `Glass.module.scss` publie
  quatre `--lg-*` sur `:root` (ligne 394 de la feuille produite) ; et les trois
  utilitaires **`.small`, `.medium` et `.large`** repris de leur `tailwind.css`
  **sont bien publiés eux aussi**. Vérifié :
  `grep -c '\.small\|\.medium\|\.large' dist/magic/magic.css` rend `5`, dont
  trois sont les règles elles-mêmes — `.small{` ligne 70, `.medium{` ligne 78,
  `.large{` ligne 86, avec leurs `padding` et leur `font-size`. Ils ne sont donc
  **pas** purgés, contrairement à ce qu'affirmait une version antérieure de ce
  fichier : le `@layer utilities` de `magic.scss` les déclare en dur, et une règle
  écrite à la main dans la feuille d'entrée n'est pas soumise à l'extraction. Trois
  noms aussi génériques que `.small`, `.medium` et `.large`, sans préfixe, dans une
  feuille que des applications tierces importent : c'est une collision qui attend.
  Les modules emploient leurs propres versions hachées, donc les retirer de
  `magic.scss` ne changerait rien au rendu des composants — mais ce serait un écart
  de plus à leur source, et ce n'est pas tranché.
- **Les commentaires de `magic.scss` sont publiés.** Ils survivent dans
  `dist/magic/magic.css` dès sa deuxième ligne ; mesuré, 256 lignes de la feuille
  produite sont du commentaire. Sans conséquence fonctionnelle, mais si la feuille
  doit être minifiée, c'est côté configuration de build.
- **`<filter id="lg-dist">` dupliqué.** `Glass.tsx:73` écrit cet `id` en dur :
  chaque instance de `Glass` réémet donc le même identifiant dans le document.
  Deux `id` identiques rendent le document invalide, et seul le premier est
  référençable — ce qui ne se voit pas ici, les filtres étant identiques. Le
  nombre d'occurrences dépend de la page.
- **La taille des paquets.** Ni le poids de `dist/magic/index.js` ni celui de
  `dist/magic/magic.css` n'ont été comparés à ceux de la 1.x, et le paquet est
  passé de composants sans état à des composants avec état, hooks et portail.

## Ce qui n'a pas été vérifié

Ce dépôt en fait un principe : ce qui n'est pas mesuré est nommé comme tel.

- **Aucun audit `axe`** n'a été passé sur ces quatorze composants. Les défauts
  d'accessibilité listés plus haut viennent de la lecture du code et d'ESLint, pas
  d'un outil de rendu.
- **Aucun test de lecteur d'écran.** Ni VoiceOver, ni NVDA, ni Orca.
- **Aucun rendu Firefox ni WebKit.** Les mesures de cette page ont été faites sous
  Chromium (`chrome-headless-shell`) ou déduites de la cascade. Le
  `filter: url(#lg-dist)` et le `backdrop-filter` en particulier n'ont pas de
  comportement vérifié hors Chromium.
- **Le comportement réel de la région live des toasts n'est pas mesuré.** On ne
  sait pas ce qu'un lecteur d'écran annonce à l'apparition d'un toast, ni s'il
  l'annonce, ni combien de fois.
- **Neuf des quatorze composants n'ont aucun test.** Cinq gardent ceux de leur
  source : `Badge`, `Button`, `Modal`, `Sidebar`, `Topbar` — **23 tests, verts**
  sous le `vitest` d'Opale sans adaptation d'environnement (`vitest run src/magic`
  → `Test Files 5 passed (5) · Tests 23 passed (23)`). Les neuf autres —
  `Card`, `Checkbox`, `Glass`, `Input`, `Select`, `Slider`, `Switch`, `Tabs`,
  `ToastProvider` — n'en ont pas, `Glass` compris, qui est pourtant la primitive
  que douze d'entre eux montent.
- **La comparaison au caractère avec la source amont n'est pas rejouable ici** :
  `react-magic-ui` n'est pas installé dans le dépôt. La répartition 39 / 11 des
  fichiers identiques est reportée de la copie initiale, pas remesurée.

## Les 14 composants

`Badge`, `Button`, `Card`, `Checkbox`, `Glass`, `Input`, `Modal`, `Select`,
`Sidebar`, `Slider`, `Switch`, `Tabs`, `ToastProvider` (plus le hook `useToast`),
`Topbar`.
