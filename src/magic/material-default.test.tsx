import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  Modal,
  SearchBar,
  Sidebar,
  SiteNav,
  Tabs,
  Topbar,
  ToastProvider,
  useToast,
} from './components';
import searchBarSheet from './components/search-bar/style/SearchBar.module.scss?raw';
import modalSheet from './components/modal/style/Modal.module.css?raw';
import sidebarSheet from './components/sidebar/style/Sidebar.module.css?raw';
import tabsSheet from './components/tabs/style/Tabs.module.css?raw';
import toastSheet from './components/toast/style/Toast.module.css?raw';
import topbarSheet from './components/topbar/style/Topbar.module.css?raw';
import opaleSource from './opale.tsx?raw';
import { Opale } from './opale';

afterEach(cleanup);

/* =============================================================================
   LA RÈGLE DU CATALOGUE : ORIGINAL PAR DÉFAUT, VERRE SUR DEMANDE.

   Chaque composant d'Opale qui sait porter le matériau doit rendre sa version
   PLEINE tant qu'on ne demande rien, et le verre par la seule prop
   `liquidGlass`. Le matériau est une option ; il n'est le rendu par défaut de
   personne.

   CE QUE CETTE RÈGLE A RATTRAPÉ. Six composants ne savaient rendre QUE du
   verre : `SearchBar`, `Topbar`, `Sidebar`, `Tabs`, `Modal` et la file de
   notifications. Aucun n'avait de prop pour en sortir. Posés sur une page
   claire, ils y affichaient une encre blanche et un liseré blanc sur du blanc
   — le matériau n'ayant rien à réfracter, il ne restait qu'un rectangle pâle.

   POURQUOI UN FICHIER À PART, et pas un test dans chacun des composants. Parce
   que c'est une règle DU CATALOGUE et non une propriété de chaque composant :
   écrite vingt fois, elle se serait perdue dix-neuf fois. Ici, un composant
   ajouté à la liste est un composant tenu par la règle, et un composant à
   matière qu'on oublie d'inscrire ne se voit nulle part — d'où le garde de
   couverture, en fin de fichier, qui compte les porteurs du matériau dans la
   source et les compare à cette liste.
   ========================================================================== */

/** Le marqueur du matériau, posé par `Glass` sur son enveloppe. */
const material = (container: HTMLElement) => container.querySelector('[data-opale-glass]');

/* `Declencheur` VIT HORS DU RENDU DE SON HÔTE. Déclaré à l'intérieur, React
   en recevait un type NEUF à chaque rendu et démontait l'arbre au lieu de le
   mettre à jour — le toast disparaissait entre deux assertions. */
function Declencheur() {
  const { showToast } = useToast();

  return (
    <button type="button" onClick={() => showToast({ title: 'Enregistré' })}>
      Notifier
    </button>
  );
}

/** Rend le portail du fournisseur de notifications avec un toast déjà posé. */
function ToastHarness({ liquidGlass }: { liquidGlass?: boolean }) {
  return (
    <ToastProvider liquidGlass={liquidGlass}>
      <Declencheur />
    </ToastProvider>
  );
}

/* `CardGrid` N'EST PAS DE LA LISTE, ET CE N'EST PAS UN OUBLI. C'est une
   grille de mise en page : elle ne porte pas le matériau, elle ARRANGE des
   cartes qui le portent. Son exemple du catalogue transmet bien `liquidGlass`
   — aux cartes qu'elle contient —, ce qui est exact pour l'extrait de code
   affiché, mais la grille elle-même n'a aucune surface à rendre. */
const PORTEURS = [
  { nom: 'Button', rendre: (g?: boolean) => <Opale.Button liquidGlass={g}>Agir</Opale.Button> },
  {
    nom: 'Card',
    rendre: (g?: boolean) => (
      <Opale.Card liquidGlass={g} title="Titre">
        Corps
      </Opale.Card>
    ),
  },
  { nom: 'Badge', rendre: (g?: boolean) => <Opale.Badge liquidGlass={g}>Neuf</Opale.Badge> },
  { nom: 'Input', rendre: (g?: boolean) => <Opale.Input liquidGlass={g} label="Nom" /> },
  {
    nom: 'InlineInput',
    rendre: (g?: boolean) => <Opale.InlineInput liquidGlass={g} label="Nom" />,
  },
  {
    nom: 'Autocomplete',
    rendre: (g?: boolean) => <Opale.Autocomplete liquidGlass={g} label="Nom" />,
  },
  { nom: 'Select', rendre: (g?: boolean) => <Opale.Select liquidGlass={g} label="Choix" /> },
  {
    nom: 'MultiSelect',
    rendre: (g?: boolean) => <Opale.MultiSelect liquidGlass={g} label="Choix" options={[]} />,
  },
  { nom: 'Checkbox', rendre: (g?: boolean) => <Opale.Checkbox liquidGlass={g} label="Oui" /> },
  { nom: 'Toggle', rendre: (g?: boolean) => <Opale.Toggle liquidGlass={g} label="Actif" /> },
  { nom: 'Slider', rendre: (g?: boolean) => <Opale.Slider liquidGlass={g} label="Volume" /> },
  {
    nom: 'StatCard',
    rendre: (g?: boolean) => <Opale.StatCard liquidGlass={g} label="Vues" value="12" />,
  },
  {
    nom: 'Pressable',
    rendre: (g?: boolean) => <Opale.Pressable liquidGlass={g}>Zone</Opale.Pressable>,
  },
  { nom: 'SearchBar', rendre: (g?: boolean) => <SearchBar liquidGlass={g} /> },
  { nom: 'Topbar', rendre: (g?: boolean) => <Topbar liquidGlass={g}>Barre</Topbar> },
  { nom: 'Sidebar', rendre: (g?: boolean) => <Sidebar liquidGlass={g}>Rail</Sidebar> },
  {
    nom: 'Tabs',
    rendre: (g?: boolean) => (
      <Tabs liquidGlass={g} defaultValue="a">
        <Tabs.List>
          <Tabs.Trigger value="a">A</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="a">Contenu</Tabs.Content>
      </Tabs>
    ),
  },
  {
    nom: 'Modal',
    rendre: (g?: boolean) => (
      <Modal open liquidGlass={g} title="Titre">
        Corps
      </Modal>
    ),
  },
  { nom: 'SiteNav', rendre: (g?: boolean) => <SiteNav liquidGlass={g} /> },

  /* LES PORTEURS AJOUTÉS PAR L'AUDIT D'UTILITÉ. Ils peignent tous une
     surface — une carte, un panneau, une piste, un rail —, donc le matériau
     a quelque chose à y faire. Ceux qui n'en peignent pas sont nommés plus
     bas, avec leur raison. */
  {
    nom: 'Feedback',
    rendre: (g?: boolean) => (
      <Opale.Feedback liquidGlass={g} severity="info" title="Note">
        Message
      </Opale.Feedback>
    ),
  },
  { nom: 'Toast', rendre: (g?: boolean) => <Opale.Toast liquidGlass={g} message="Publié" /> },
  {
    nom: 'ProgressBar',
    rendre: (g?: boolean) => <Opale.ProgressBar liquidGlass={g} label="Envoi" value={40} />,
  },
  {
    nom: 'SegmentedControl',
    rendre: (g?: boolean) => (
      <Opale.SegmentedControl
        liquidGlass={g}
        value="a"
        options={[{ value: 'a', label: 'A' }]}
      />
    ),
  },
  {
    nom: 'ConfirmDialog',
    rendre: (g?: boolean) => (
      <Opale.ConfirmDialog open liquidGlass={g} title="Confirmer ?">
        Irréversible.
      </Opale.ConfirmDialog>
    ),
  },
  { nom: 'EmptyState', rendre: (g?: boolean) => <Opale.EmptyState liquidGlass={g} /> },
  {
    nom: 'Navbar',
    rendre: (g?: boolean) => (
      <Opale.Navbar liquidGlass={g} items={[{ id: 'a', label: 'Accueil' }]} />
    ),
  },
  { nom: 'Menu', rendre: (g?: boolean) => <Opale.Menu liquidGlass={g}>Contenu</Opale.Menu> },
  {
    nom: 'SidePanel',
    rendre: (g?: boolean) => (
      <Opale.SidePanel open liquidGlass={g}>
        Corps
      </Opale.SidePanel>
    ),
  },
  {
    nom: 'CommandPalette',
    rendre: (g?: boolean) => <Opale.CommandPalette open liquidGlass={g} />,
  },
  { nom: 'CookieBanner', rendre: (g?: boolean) => <Opale.CookieBanner liquidGlass={g} /> },
  {
    nom: 'SelectionBar',
    rendre: (g?: boolean) => <Opale.SelectionBar liquidGlass={g} selectedCount={2} />,
  },
  {
    nom: 'DataTable',
    rendre: (g?: boolean) => (
      <Opale.DataTable
        liquidGlass={g}
        columns={[{ key: 'n', label: 'Nom' }]}
        rows={[{ n: 'Opale' }]}
      />
    ),
  },
  { nom: 'FileCard', rendre: (g?: boolean) => <Opale.FileCard liquidGlass={g} name="plan.fig" /> },
  { nom: 'Dropzone', rendre: (g?: boolean) => <Opale.Dropzone liquidGlass={g} /> },
  {
    nom: 'Lightbox',
    rendre: (g?: boolean) => (
      <Opale.Lightbox open liquidGlass={g} src="/x.jpg" alt="Une photographie" />
    ),
  },
  { nom: 'Clipboard', rendre: (g?: boolean) => <Opale.Clipboard liquidGlass={g} value="npm i" /> },
  {
    nom: 'IconActionButton',
    rendre: (g?: boolean) => (
      <Opale.IconActionButton liquidGlass={g} icon="trash" label="Supprimer" />
    ),
  },
  { nom: 'SvgMap', rendre: (g?: boolean) => <Opale.SvgMap liquidGlass={g} /> },
] as const;

describe('la matière est une option, jamais le rendu par défaut', () => {
  for (const { nom, rendre } of PORTEURS) {
    it(`${nom} rend l’original tant qu’on ne demande rien`, () => {
      /* LA PROP N'EST PAS PASSÉE DU TOUT, et c'est la seule façon d'éprouver
         un DÉFAUT. Une première version passait `liquidGlass={false}` : le
         test restait vert quand on retournait le défaut à `true`, puisqu'il
         ne demandait jamais au composant de choisir. Le test de mutation l'a
         montré — `undefined` laisse la valeur par défaut s'appliquer. */
      const { container } = render(rendre());

      expect(
        material(container) ?? material(document.body),
        `${nom} rend le matériau sans qu’on l’ait demandé. Posé sur une page ` +
          'claire, le verre n’a rien à réfracter : il ne reste qu’un rectangle ' +
          'pâle, et son encre claire disparaît dans le fond.',
      ).toBeNull();
    });

    it(`${nom} rend le verre quand on le demande`, () => {
      const { container } = render(rendre(true));

      expect(
        material(container) ?? material(document.body),
        `${nom} ignore \`liquidGlass\` : le commutateur de la vitrine bascule ` +
          'et rien ne change.',
      ).not.toBeNull();
    });
  }

  /* LA FILE DE NOTIFICATIONS SE MONTRE AUTREMENT : ses cartes n'existent
     qu'après un appel, donc elle ne se prête pas au rendu direct des autres. */
  it('ToastProvider rend l’original tant qu’on ne demande rien', async () => {
    const { container } = render(<ToastHarness />);

    screen.getByRole('button', { name: 'Notifier' }).click();
    await screen.findByText('Enregistré');

    expect(material(container) ?? material(document.body)).toBeNull();
  });

  it('ToastProvider rend le verre quand on le demande', async () => {
    render(<ToastHarness liquidGlass />);

    screen.getByRole('button', { name: 'Notifier' }).click();
    await screen.findByText('Enregistré');

    expect(material(document.body)).not.toBeNull();
  });

  /* LE GARDE DE COUVERTURE.

     La liste ci-dessus est écrite à la main : un composant à matière qu'on
     oublie d'y inscrire échappe à la règle sans que rien ne rougisse. Ce test
     relit la source et exige que tout composant exporté qui BRANCHE sur
     `liquidGlass` soit tenu quelque part — ici, ou dans la liste des exclus,
     qui dit pourquoi.

     Il ne couvre que `opale.tsx` : les six composants de `components/**` sont
     nommés un par un dans la liste, et ils sont six. */
  it('ne laisse aucun composant à matière hors de la règle', () => {
    /* Les composants EXCLUS, et la raison de chacun. */
    const exclus = new Map([
      ['FieldShell', 'coquille interne, jamais exportée : elle sert les champs ci-dessus'],
      ['Surface', 'primitive interne, jamais exportée : Card et StatCard la portent'],
      ['FileCardShell', 'coquille interne de FileCard, jamais exportée'],
      /* CES QUATRE-LÀ NE SONT PAS DES COMPOSANTS mais des VARIABLES LOCALES :
         `const Track = liquidGlass ? Glass : 'div'`. Elles portent une
         majuscule parce que JSX l'exige d'un type d'élément, et c'est à cela
         seul que le découpage les confond avec des composants. */
      ['Track', 'variable locale : le type d’élément de la piste, choisi par la matière'],
      ['Shell', 'variable locale : le type d’élément de la carte du toast'],
      ['Rail', 'variable locale : le type d’élément du rail de navigation'],
      ['Zone', 'variable locale : le type d’élément de la zone de dépôt'],
    ]);

    const tenus = new Set<string>(PORTEURS.map((porteur) => porteur.nom));
    const oublies: string[] = [];

    /* Chaque déclaration de composant, et le texte qui la suit jusqu'à la
       suivante : c'est son corps, au sens où on en a besoin ici. */
    const frontieres = [
      ...opaleSource.matchAll(
        /(?:export )?(?:function|const|interface|type|class) ([A-Z]\w*)[\s(=<:]/g,
      ),
    ];

    for (const [index, frontiere] of frontieres.entries()) {
      const nom = frontiere[1];
      const debut = frontiere.index ?? 0;
      const fin = frontieres[index + 1]?.index ?? opaleSource.length;
      const corps = opaleSource.slice(debut, fin);

      /* LES FRONTIÈRES INCLUENT LES TYPES, LES CANDIDATS NON. Sans les types,
         le découpage d'un composant court débordait sur l'interface suivante :
         `CardGrid`, qui ne branche sur rien, héritait du `liquidGlass` de
         `FieldProps` déclarée juste après et se retrouvait accusé à tort. */
      if (!/^(?:export )?(?:function|const) /.test(corps)) continue;

      /* « Brancher sur la matière » se lit à l'usage de la prop dans le corps,
         pas à sa présence dans un type : `MultiSelect` héritait la prop de
         `SelectProps` bien avant de savoir la rendre. */
      if (!/liquidGlass/.test(corps)) continue;
      if (exclus.has(nom) || tenus.has(nom)) continue;

      oublies.push(nom);
    }

    expect(
      oublies,
      'Ces composants branchent sur `liquidGlass` sans être tenus par la ' +
        `règle « original par défaut » — ${oublies.join(', ')}. Inscrivez-les ` +
        'dans PORTEURS, ou dans la liste des exclus avec la raison.',
    ).toEqual([]);
  });

  /* =========================================================================
     UN JETON BLANC RÉGLÉ POUR LE VERRE NE DOIT PAS PILOTER LE RENDU PLEIN.

     LE DÉFAUT OBSERVÉ. Les feuilles de ces six composants ont été écrites pour
     le matériau : leurs jetons d'encre valent du blanc, puisqu'ils se posent
     sur une photographie. En leur ajoutant une version pleine, on a repris la
     COULEUR DU TEXTE — visible, donc vite corrigée — mais pas celle de
     l'ANNEAU DE FOCUS, qui dérive du même jeton. Le bandeau d'onglets
     dessinait ainsi son anneau en blanc à 94 % sur un fond blanc : rien, et
     rien ne rougissait (WCAG 2.4.7).

     CE QUE CE TEST FAIT. Pour chaque feuille qui porte un bloc `.plain`, il
     cherche les jetons dont la valeur est un blanc ou quasi-blanc, retient
     ceux qu'une règle `:focus-visible` consomme, et exige que le bloc `.plain`
     les redéfinisse. C'est la forme générale du défaut, pas le seul cas connu.
     ====================================================================== */
  const FEUILLES = [
    { nom: 'SearchBar', css: searchBarSheet },
    { nom: 'Topbar', css: topbarSheet },
    { nom: 'Sidebar', css: sidebarSheet },
    { nom: 'Tabs', css: tabsSheet },
    { nom: 'Modal', css: modalSheet },
    { nom: 'Toast', css: toastSheet },
  ];

  it.each(FEUILLES)(
    '$nom ne laisse aucun jeton blanc peindre le focus du rendu plein',
    ({ nom, css }) => {
      const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, '');
      const plain = /\.plain\b[^{]*\{([^}]*)\}/.exec(sansCommentaires)?.[1];

      /* Une feuille sans bloc `.plain` n'a pas de rendu plein à protéger : son
       composant ne porte pas le matériau, ou il n'a pas de surface propre. */
      if (!plain) return;

      /* Les jetons dont la valeur est un blanc — littéral ou `rgba(255,…)`. */
      /* LES JETONS RÉGLÉS POUR LE VERRE : un blanc, ou le marine du voile.

         Une première version ne retenait que les blancs consommés par une
         règle de focus. Trop étroit : le bandeau d'onglets gardait ainsi deux
         jetons MARINE — la pastille de sélection et le fond du panneau — qui
         devenaient des plaques ardoise au milieu d'une carte blanche, et
         l'onglet retenu, seule information de la barre, y tombait à 1,59:1.

         Seules les valeurs LITTÉRALES comptent : un jeton dérivé par
         `color-mix` d'une couleur de thème suit déjà le thème. */
      const teintesDeVerre = [
        ...sansCommentaires.matchAll(
          /(--[\w-]+):\s*(#fff\w*|rgba?\(\s*255,\s*255,\s*255[^)]*\)|rgba?\(\s*7,\s*28,\s*43[^)]*\))/g,
        ),
      ].map((match) => match[1]);

      /* UN JETON EST EN CAUSE dès qu'une règle QUELCONQUE de la feuille le
         consomme — pas seulement une règle de focus : la pastille de
         sélection et le fond du panneau sont peints par des règles
         ordinaires. */
      const coupables = teintesDeVerre.filter(
        (jeton) =>
          new RegExp(`var\\(${jeton}[,)]`).test(sansCommentaires) &&
          !new RegExp(`${jeton}:`).test(plain),
      );

      expect(
        coupables,
        `${nom} : ${coupables.join(', ')} garde une valeur réglée pour le ` +
          'verre — un blanc ou le marine du voile — alors que le rendu plein ' +
          'la consomme. Redéfinissez le jeton dans le bloc `.plain`.',
      ).toEqual([]);
    },
  );
});
