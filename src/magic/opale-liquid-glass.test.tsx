import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import glassSource from './components/glass/style/Glass.module.css?raw';
import opaleSource from './opale.css?raw';
import { Opale } from './opale';

/* =============================================================================
   LE COMMUTATEUR NE DOIT CHANGER QUE LA MATIÈRE.

   Sept composants d'Opale rendent désormais leur homologue vendoré quand
   `liquidGlass` est vrai — c'est ce qui a permis de supprimer sept doublons. La
   tentation, à chaque fois, était de substituer le composant ENTIER. Elle est
   coûteuse d'une façon qui ne se voit pas à l'écran :

     — leur `Checkbox` émet `onChange(checked: boolean)` quand Opale émet un
       `ChangeEvent` : un formulaire contrôlé cesse d'être notifié, et la case
       continue de s'afficher parfaitement ;
     — leur piste de `Slider` est un `<div>` sans rôle ni clavier : le curseur
       reste visible et devient inutilisable au clavier ;
     — leur `Select` n'est pas un `<select>` : le champ s'affiche et le
       formulaire n'envoie plus rien.

   Aucune de ces trois pannes ne rougit sur un test de rendu, et aucune ne se
   voit à l'œil. D'où ce fichier, qui vérifie les trois choses qu'une prop
   d'apparence n'a pas le droit de changer : le MATÉRIAU est bien là, le
   CONTRÔLE natif est toujours le seul, et son ÉVÉNEMENT part encore.
   ========================================================================== */

/**
 * Le marqueur du vrai matériau.
 *
 * `Glass` pose `data-opale-glass` sur son enveloppe. C'est un CONTRAT, pas un
 * détail d'implémentation : la classe du module est hachée à la compilation,
 * donc inutilisable ici comme dans la feuille d'un hôte.
 *
 * La version précédente cherchait le filtre SVG `#lg-dist`, que le composant
 * tiers montait DANS chaque instance. Le nôtre n'en monte qu'un pour toute la
 * page, sur `document.body` — un identifiant unique au lieu de dix doublons —,
 * si bien que le chercher sous le composant ne prouvait plus rien.
 */
function hasGlassMaterial(container: HTMLElement): boolean {
  return container.querySelector('[data-opale-glass]') !== null;
}

/** Les sept fusions, et de quoi rendre chacune. */
const FUSIONS = [
  {
    name: 'Badge',
    render: (glass: boolean) => <Opale.Badge liquidGlass={glass}>Nouveau</Opale.Badge>,
  },
  {
    name: 'Card',
    render: (glass: boolean) => (
      <Opale.Card liquidGlass={glass} title="Titre">
        <p>Corps</p>
      </Opale.Card>
    ),
  },
  {
    name: 'Checkbox',
    render: (glass: boolean) => <Opale.Checkbox liquidGlass={glass} label="Notifications" />,
  },
  {
    name: 'Input',
    render: (glass: boolean) => <Opale.Input liquidGlass={glass} label="Email" />,
  },
  {
    name: 'Select',
    render: (glass: boolean) => (
      <Opale.Select
        liquidGlass={glass}
        label="Rôle"
        options={[
          { value: 'a', label: 'Auteur' },
          { value: 'b', label: 'Relecteur' },
        ]}
      />
    ),
  },
  {
    name: 'Slider',
    render: (glass: boolean) => (
      <Opale.Slider liquidGlass={glass} label="Volume" defaultValue={40} />
    ),
  },
  {
    name: 'Toggle',
    render: (glass: boolean) => <Opale.Toggle liquidGlass={glass} label="Activé" />,
  },
] as const;

describe('les sept fusions original / liquid glass', () => {
  it.each(FUSIONS)('$name ne porte aucun verre au repos', ({ render: renderCase }) => {
    const { container } = render(renderCase(false));

    expect(hasGlassMaterial(container)).toBe(false);
  });

  it.each(FUSIONS)('$name rend le vrai matériau sous verre', ({ render: renderCase }) => {
    const { container } = render(renderCase(true));

    expect(hasGlassMaterial(container)).toBe(true);
  });

  /* LE COMPTE DE CONTRÔLES EST LE GARDE LE PLUS IMPORTANT DU FICHIER.

     Poser une peau interactive par-dessus un contrôle natif crée DEUX
     contrôles : deux arrêts de tabulation, deux annonces au lecteur d'écran,
     et une case qu'on peut cocher deux fois. Le verre est donc rendu inerte —
     `aria-hidden`, `tabIndex={-1}`, `pointer-events: none`. Ce test vérifie le
     résultat plutôt que le moyen : quoi qu'on change, il ne doit jamais y
     avoir plus d'un contrôle après bascule qu'avant. */
  it.each([
    { name: 'Checkbox', role: 'checkbox' as const },
    { name: 'Toggle', role: 'checkbox' as const },
    { name: 'Slider', role: 'slider' as const },
    { name: 'Input', role: 'textbox' as const },
    { name: 'Select', role: 'combobox' as const },
  ])('$name n’expose qu’un seul $role, avec ou sans verre', ({ name, role }) => {
    const fusion = FUSIONS.find((entry) => entry.name === name);

    const plain = render(fusion!.render(false));
    const before = plain.getAllByRole(role).length;
    plain.unmount();

    const glass = render(fusion!.render(true));

    expect(
      glass.getAllByRole(role),
      `${name} sous verre expose ${glass.getAllByRole(role).length} éléments de rôle ` +
        `« ${role} » contre ${before} sans verre. Une peau de verre qui reste ` +
        'atteignable ajoute un arrêt de tabulation et une seconde annonce.',
    ).toHaveLength(before);
  });

  /* L'ÉVÉNEMENT NATIF, UN PAR CONTRÔLE. Ce que le vendoré ne sait pas émettre.
     `event.target` est vérifié parce que c'est lui qui distingue un VRAI
     `ChangeEvent` d'un objet fabriqué pour faire passer le test. */
  it('Checkbox remonte un ChangeEvent natif sous verre', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Opale.Checkbox liquidGlass label="Notifications" onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Notifications' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].target).toBeInstanceOf(HTMLInputElement);
    expect(onChange.mock.calls[0][0].target.checked).toBe(true);
  });

  it('Toggle remonte un ChangeEvent natif sous verre', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Opale.Toggle liquidGlass label="Activé" onChange={onChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Activé' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].target.checked).toBe(true);
  });

  /* LE CURSEUR RESTE UN CONTRÔLE NATIF, ce que leur piste en `<div>` n'est pas.

     CE TEST N'APPUIE PAS SUR UNE FLÈCHE, ET C'EST DÉLIBÉRÉ : jsdom
     n'implémente pas le clavier de `input[type=range]`. Mesuré — une flèche
     droite sur un range NU, sans verre et sans Opale, laisse la valeur à 40 et
     n'émet aucun `change`. Un test « le clavier fonctionne » y serait donc
     rouge sur du code correct, et le rendre vert demanderait de simuler
     soi-même ce que le navigateur fait : on vérifierait sa propre simulation.

     Ce qui EST vérifiable ici, et qui suffit, c'est la CAUSE : l'élément qui
     porte le rôle est un `<input type="range">`, et il est atteignable par
     tabulation. Le clavier découle de la plateforme dès lors que ces deux
     faits tiennent ; c'est leur `<div>` sans rôle ni `tabindex` qui n'en
     dispose pas. */
  it('Slider reste un contrôle natif tabulable sous verre', async () => {
    const user = userEvent.setup();
    render(<Opale.Slider liquidGlass label="Volume" defaultValue={40} />);

    const slider = screen.getByRole('slider');

    expect(slider).toBeInstanceOf(HTMLInputElement);
    expect((slider as HTMLInputElement).type).toBe('range');

    await user.tab();

    expect(
      slider,
      'le curseur sous verre n’est plus atteignable au clavier : la peau de verre ' +
        'a pris sa place dans le parcours de tabulation.',
    ).toHaveFocus();
  });

  /* Le pointeur, lui, se teste : un `change` émis par le natif doit encore
     remonter à l'appelant sous verre. */
  it('Slider remonte un ChangeEvent natif sous verre', () => {
    const onChange = vi.fn();
    render(<Opale.Slider liquidGlass label="Volume" defaultValue={40} onChange={onChange} />);

    fireEvent.change(screen.getByRole('slider'), { target: { value: '70' } });

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].target.value).toBe('70');
  });

  /* LA SOUMISSION DE FORMULAIRE, que leur `Select` — un bouton et des boutons —
     ne porte pas. Le `name` doit encore arriver dans les données. */
  it('Select reste un champ de formulaire nommé sous verre', () => {
    render(
      <form aria-label="essai">
        <Opale.Select
          liquidGlass
          name="role"
          label="Rôle"
          defaultValue="b"
          options={[
            { value: 'a', label: 'Auteur' },
            { value: 'b', label: 'Relecteur' },
          ]}
        />
      </form>,
    );

    const data = new FormData(screen.getByRole('form', { name: 'essai' }) as HTMLFormElement);

    expect(data.get('role')).toBe('b');
  });

  /* LA RÉFÉRENCE DE `Input`, dont la perte est la plus silencieuse de
     toutes : le champ s'affiche, et `ref.current` vaut `null`. Le composant
     vendoré ne DÉCLARE pas de `ref` — React 19 la transmet quand même, et
     c'est ce que ce test épingle, car un recast qui saute ne fait rougir
     personne d'autre. */
  it('Input transmet toujours sa ref sous verre', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Opale.Input liquidGlass label="Email" ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  /* Le libellé et le texte d'aide appartiennent à Opale et n'ont pas
     d'équivalent chez le vendoré : la frontière passe sous eux. S'ils
     disparaissaient, le champ deviendrait anonyme pour un lecteur d'écran. */
  it.each([
    { name: 'Input', node: <Opale.Input liquidGlass label="Email" helperText="Adresse valide." /> },
    {
      name: 'Select',
      node: (
        <Opale.Select
          liquidGlass
          label="Rôle"
          helperText="Adresse valide."
          options={[{ value: 'a', label: 'Auteur' }]}
        />
      ),
    },
  ])('$name garde son libellé et son texte d’aide sous verre', ({ node }) => {
    render(node);

    expect(screen.getByText('Adresse valide.')).toBeInTheDocument();
    expect(screen.getByText(/Email|Rôle/)).toBeInTheDocument();
  });
});

/* =============================================================================
   LA TEINTE DU VERRE VIENT DES JETONS D'OPALE, JAMAIS DE L'AUTRE PALETTE.

   Ce garde existe parce que le défaut s'est déjà produit deux fois. Sur le
   bouton, une correspondance entre les rôles d'Opale et les variantes du
   vendoré envoyait le « secondaire » sur leur teinte `positive` : il restait
   VERT à côté d'un primaire bleu. Sur l'interrupteur, leur module code
   `#34d399` en dur — vert lui aussi — et la bascule le faisait apparaître au
   milieu d'une interface saphir.

   Les deux fois, le symptôme était le même et invisible à la lecture du TSX :
   la couleur ne venait pas de la marque. Le test vise donc la cause — aucune
   règle de verre ne doit porter d'hexadécimal, et les états actifs doivent
   citer un jeton.
   ========================================================================== */
describe('les teintes du verre', () => {
  /* LES RÈGLES SONT LUES EN ENTIER, ET NON LIGNE À LIGNE.

     Une première version filtrait les LIGNES contenant à la fois le sélecteur
     et la déclaration. Vérifié par mutation : elle ne voyait pas un `#34d399`
     replacé dans une règle écrite sur plusieurs lignes — c'est-à-dire dans la
     forme qu'ont justement les règles d'état. Le garde aurait été vert sur le
     défaut qu'il existe pour attraper. */
  /* LES COMMENTAIRES SONT RETIRÉS AVANT L'ANALYSE, et c'est le test qui l'a
     exigé : celui qui explique la correction CITE `#34d399` pour dire d'où
     venait le vert. Sans ce nettoyage, le garde rougissait sur sa propre
     documentation — un faux positif qu'on aurait fini par désactiver, et le
     garde avec. */
  const stripped = opaleSource.replace(/\/\*[\s\S]*?\*\//g, '');
  const glassRules = [...stripped.matchAll(/([^{}]*--glass[^{}]*)\{([^}]*)\}/g)].map(
    ([, selector, body]) => `${selector.trim()} { ${body.replace(/\s+/g, ' ').trim()} }`,
  );

  it('couvre bien les règles de verre de la feuille', () => {
    expect(glassRules.length).toBeGreaterThanOrEqual(12);
  });

  it('ne code aucune couleur en dur dans une règle de verre', () => {
    const hardcoded = glassRules.filter((rule) => /#[0-9a-f]{3,8}\b/i.test(rule));

    expect(
      hardcoded,
      'Une règle de verre porte un hexadécimal au lieu d’un jeton Opale :\n  ' +
        hardcoded.join('\n  ') +
        '\n\nUne couleur écrite en dur ne suit pas la marque — c’est ainsi que le ' +
        'bouton secondaire est resté vert après le passage du secondaire au bleu.',
    ).toEqual([]);
  });

  /* CE GARDE A CHANGÉ DE CIBLE PARCE QUE LE MÉCANISME A CHANGÉ, et le
     changement vaut d'être dit. L'état actif était porté par un `data-checked`
     que React recopiait depuis un état miroir tenu en JavaScript : il fallait
     ce miroir pour dire à un composant TIERS de se peindre coché. La coche et
     la piste étant désormais les nôtres, le CSS lit directement `:checked` sur
     l'`<input>` natif — un état dérivé de moins, donc une désynchronisation de
     moins. L'exigence, elle, ne bouge pas d'un pouce : la couleur d'un état
     actif vient de la palette d'Opale, jamais d'un hexadécimal emprunté. */
  it('peint les états actifs avec le primaire d’Opale', () => {
    for (const mark of ['opale-checkbox-mark', 'opale-toggle-track']) {
      const rule = new RegExp(`:checked \\+ \\* \\.${mark}[^{]*\\{[^}]*var\\(--opale-primary\\)`);

      expect(
        opaleSource,
        `L’état coché de « .${mark} » sous verre ne cite pas --opale-primary : sa ` +
          'couleur vient donc d’ailleurs que de la palette d’Opale.',
      ).toMatch(rule);
    }
  });
});

/* =============================================================================
   CLIQUER SUR CE QU'ON VOIT DOIT BASCULER LE CONTRÔLE.

   LE DÉFAUT LIVRÉ, ET POURQUOI TOUTE LA SUITE ÉTAIT VERTE PENDANT CE TEMPS.
   Le commutateur de verre était MORT AU CLIC : la peau était alors un
   composant tiers, et son `<button>` interne remettait `pointer-events: auto`
   sous l'enveloppe qui les coupait. Le clic mourait sur un bouton sans
   gestionnaire au lieu de traverser jusqu'au `<label>`.

   Les tests de comportement ne l'ont pas vu parce qu'ils cliquaient
   `getByRole('checkbox')` — l'`<input>` natif, jamais la surface qu'un humain
   vise. Ils prouvaient que le contrôle répond quand on l'atteint, pas qu'on
   peut l'atteindre. C'est le seul endroit du fichier où cette distinction
   comptait, et c'est exactement là qu'elle manquait.

   CE GARDE A REMPLACÉ UN GARDE DE MÉCANISME. La version précédente vérifiait
   qu'une règle CSS coupait bien `pointer-events` sur les DESCENDANTS de la
   peau. Cette règle n'existe plus et n'a plus lieu d'exister : la peau n'est
   plus un composant tiers avec ses propres gestionnaires, c'est le `<span>`
   décoratif d'Opale enveloppé de verre. Garder le garde aurait exigé d'écrire
   la règle pour lui seul — un test qui impose du code dont il est le seul
   usager. On vise donc le RÉSULTAT, qui lui reste vrai quelle que soit la
   mécanique : un clic sur la surface visible bascule le contrôle.
   ========================================================================== */
describe('le clic sur la surface visible', () => {
  it.each([
    { name: 'Checkbox', mark: 'opale-checkbox-mark', label: 'Notifications' },
    { name: 'Toggle', mark: 'opale-toggle-track', label: 'Activé' },
  ])('$name bascule quand on clique sa peau de verre', async ({ name, mark, label }) => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      name === 'Checkbox' ? (
        <Opale.Checkbox liquidGlass label={label} onChange={onChange} />
      ) : (
        <Opale.Toggle liquidGlass label={label} onChange={onChange} />
      ),
    );

    const skin = container.querySelector(`.${mark}`);

    expect(skin, `la peau « .${mark} » n’est pas rendue sous verre`).not.toBeNull();

    await user.click(skin as Element);

    expect(
      onChange,
      `Cliquer la surface visible de ${name} n’a rien basculé. Le contrôle natif ` +
        'est ailleurs : si un élément de la peau intercepte le clic sans le ' +
        'transmettre au `<label>`, le composant est mort au pointeur — et tous ' +
        'les autres tests restent verts, parce qu’ils cliquent l’input directement.',
    ).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].target.checked).toBe(true);
  });
});

describe('la technique de sélection des couches', () => {
  const stripped = opaleSource.replace(/\/\*[\s\S]*?\*\//g, '');

  /* ON NE VISE PAS UNE COUCHE PAR SA POSITION, ET LE DÉPÔT EN A PAYÉ LES DEUX
     FORMES.

     La première : des sélecteurs structurels (`> div`, `> :last-child`) qui
     désignent le bon élément aujourd'hui et son voisin le jour où `Glass`
     gagne un calque.

     La seconde, plus insidieuse, a réellement cassé : les feuilles de la
     vitrine attrapaient les couches par `[class*='glassFilter']`, faute de
     pouvoir nommer une classe de module hachée. Vingt-neuf sélecteurs se sont
     tus d'un coup quand le matériau a été réécrit et que les couches ont
     changé de nom — un sélecteur sans correspondance ne rougit nulle part, et
     la barre du haut avait perdu son verre sans que rien ne le dise.

     `Glass` expose donc `data-opale-glass` sur son enveloppe et
     `data-opale-glass-layer` sur chaque couche. C'est un contrat, au même
     titre que ses props. */
  it('atteint les couches du verre par leur nom, jamais par leur position', () => {
    const positional = [...stripped.matchAll(/([^{}]*--glass[^{}]*)\{/g)]
      .map(([, selector]) => selector.trim())
      .filter((selector) => /(>\s*div\b|:last-child|:first-of-type|:nth-child)/.test(selector));

    expect(
      positional,
      'Ces règles de verre visent une POSITION plutôt qu’une classe :\n  ' +
        positional.join('\n  ') +
        "\n\nVisez la couche par son nom — `[data-opale-glass-layer='tint']` — que " +
        '`Glass` pose exprès pour cela et qui survit à l’ajout d’un calque.',
    ).toEqual([]);
  });
});

/* =============================================================================
   L'ACCESSIBILITÉ DU MATÉRIAU, ÉPINGLÉE — PARCE QU'ELLE A DÉJÀ ÉTÉ PERDUE.

   Ces trois décisions ne se voient pas à l'écran tant qu'on ne les cherche pas,
   et l'une d'elles a DÉJÀ été défaite dans ce dépôt : les anneaux de focus ont
   été retirés de toute la vitrine sur demande, et le matériau s'est retrouvé
   sans aucun indicateur — mesuré à l'époque, `outline-width: 0px`.

   Ce fichier lit la feuille du matériau, qui est un module CSS : jsdom ne
   calcule pas la cascade, donc on ne peut pas mesurer un rendu ici. On épingle
   donc la RÈGLE, et les mesures qui l'ont motivée sont écrites à côté d'elle
   dans la feuille.
   ========================================================================== */
describe('l’accessibilité du matériau', () => {
  const glassSheet = glassSource.replace(/\/\*[\s\S]*?\*\//g, '');
  const opaleSheet = opaleSource.replace(/\/\*[\s\S]*?\*\//g, '');

  /* CE GARDE A DÉJÀ EU TORT DEUX FOIS, ET LES DEUX FOIS DE LA MÊME FAÇON.

     Première version : il exigeait un `outline: 2px solid` et passait au vert
     — sur un anneau qui n'était pas peint. Le bouton porte un `clip-path` pour
     sa silhouette en squircle, et un `clip-path` rogne l'`outline` de son
     propre élément. Mesuré alors : 0 % du périmètre au-dessus de 3:1.

     Deuxième version : il exigeait un `box-shadow: inset`, peint à l'intérieur
     de la boîte, donc hors d'atteinte du découpage. Correct, et devenu faux le
     jour où le traitement choisi est passé à une ombre EXTÉRIEURE.

     LA LEÇON, ÉCRITE UNE FOIS POUR TOUTES : un garde de feuille de style ne
     prouve jamais qu'une règle est PEINTE. Il ne peut vérifier que la
     cohérence entre la déclaration et ce que la boîte autorise — c'est ce que
     fait le test suivant, qui interdit au découpage et au halo de coexister
     sur la même boîte. */
  it('marque le focus par une ombre extérieure, sans rétablir le rectangle refusé', () => {
    const rule = /\.glass:has\(:focus-visible\)[^{]*\{([^}]*)\}/.exec(glassSheet)?.[1] ?? '';

    expect(
      rule,
      'Le matériau ne marque plus le focus. Les jetons d’anneau de la vitrine ' +
        'valent `transparent` : sans cette règle, un champ de verre n’a AUCUN ' +
        'indicateur au clavier (WCAG 2.4.7).',
    ).toMatch(/box-shadow:\s*var\(\s*--opale-glass-focus-halo/);

    expect(
      rule,
      'Le traitement retenu est une ombre AUTOUR de la silhouette. Une ombre ' +
        '`inset` est peinte dedans : ce serait un autre traitement.',
    ).not.toMatch(/box-shadow:[^;]*inset/);

    expect(
      rule,
      'Un `outline` est rogné par le `clip-path` des composants qui en portent un.',
    ).not.toMatch(/outline:\s*\d/);
    expect(rule).not.toMatch(/--opale-focus/);
    expect(
      rule,
      'L’arête du verre doit s’allumer avec le halo : une ombre sombre seule ne ' +
        'se distingue pas d’un fond sombre.',
    ).toMatch(/--opale-glass-edge/);
  });

  /* UN HALO EXTÉRIEUR ET UN DÉCOUPAGE NE PEUVENT PAS COEXISTER SUR UNE BOÎTE.

     C'est la règle que les deux pannes précédentes avaient en commun, et le
     seul garde qui les aurait vues. Le bouton porte donc sa silhouette sur ses
     COUCHES : même forme à l'écran, enveloppe libre de peindre autour d'elle.

     CE QUE CE TEST NE PEUT PAS FAIRE : constater que le halo est peint. jsdom
     ne compose rien. Ce qu'il constate est plus étroit et suffisant — la boîte
     qui le porte n'a rien qui puisse l'effacer. */
  it('ne découpe pas l’enveloppe qui porte le halo', () => {
    const root = /\.opale-button--glass-root\s*\{([^}]*)\}/.exec(opaleSheet)?.[1] ?? '';

    expect(root, '`.opale-button--glass-root` est introuvable.').not.toBe('');
    expect(
      root,
      'L’enveloppe du bouton se découpe elle-même : son `box-shadow` extérieur ' +
        'est donc rogné, et le focus n’est pas peint. La silhouette doit ' +
        'descendre sur les couches.',
    ).not.toMatch(/clip-path/);

    expect(
      opaleSheet,
      'La silhouette en squircle a disparu du bouton : elle doit être portée ' +
        'par les enfants de l’enveloppe.',
    ).toMatch(/\.opale-button--glass-root > \*\s*\{[^}]*clip-path/);
  });

  /* LE HALO PORTE DEUX TONS, ET CE N'EST PAS UN GOÛT.

     MESURÉ, sur les pixels du cliché des scènes ramenés à leurs quantiles de
     luminance et sur les surfaces plates des deux thèmes, en composant l'alpha
     réel de chaque ombre à chaque distance du bord :

       une ombre marine seule ....... 1,05:1 au pire fond
       une ombre noire seule ........ 1,10:1
       les deux tons, réglés ........ 4,08:1

     Le verre se pose aussi bien sur une carte blanche que sur une
     photographie voilée à 65 %, qui est sombre : aucune teinte unique ne
     contraste contre les deux. Le plancher de 1.4.11 est 3:1.

     CE QUE CE TEST GARDE, c'est la CONSTRUCTION dont ce résultat dépend —
     deux tons, aucun bord net —, pas les chiffres eux-mêmes, qu'aucun test en
     jsdom ne peut recalculer : il faudrait composer des pixels. Voir le
     premier réglage essayé, qui avait la bonne construction et tombait
     pourtant à 2,01:1 : la construction est nécessaire, pas suffisante. Ce
     garde attrape la régression grossière, la mesure attrape le réglage. */
  it('garde deux tons flous, seule construction qui tienne sur les deux fonds', () => {
    const halos = [...opaleSheet.matchAll(/--opale-glass-focus-halo:\s*([^;]+);/g)].map((match) =>
      match[1].replace(/\s+/g, ' ').trim(),
    );

    expect(halos.length, 'Le halo du focus n’est plus défini nulle part.').toBeGreaterThan(0);

    for (const halo of halos) {
      expect(
        halo,
        `Pas de lueur claire dans « ${halo} » : sur un fond sombre, l’ombre disparaît.`,
      ).toMatch(/rgba\(255, 255, 255/);
      expect(
        halo,
        `Pas d’ombre sombre dans « ${halo} » : sur un fond clair, la lueur disparaît.`,
      ).toMatch(/rgba\((?:7, 28, 43|0, 0, 0)/);

      /* Le traitement choisi est une OMBRE, pas un anneau : aucun de ses
         rayons n'a le droit d'avoir un bord net, ce qu'un flou nul donnerait. */
      const blurs = [...halo.matchAll(/0 0 (\d+)px/g)].map((match) => Number(match[1]));

      expect(blurs.length, `Les rayons de « ${halo} » sont illisibles.`).toBe(2);
      for (const blur of blurs) {
        expect(
          blur,
          `Un rayon flouté à ${blur} px dessine un trait, pas une ombre.`,
        ).toBeGreaterThanOrEqual(4);
      }

      /* Les deux tons se recouvrent au ras de la boîte, là où chacun est le
         plus dense, et la lueur DÉLAVE l'ombre. Les écarter dans l'espace est
         ce qui a fait passer le réglage de 2,01:1 à 4,08:1 — l'étalement de
         l'ombre sombre doit rester nettement supérieur à celui de la lueur. */
      const spreads = [...halo.matchAll(/0 0 \d+px (\d+)px/g)].map((match) => Number(match[1]));

      expect(spreads.length, `Les étalements de « ${halo} » sont illisibles.`).toBe(2);
      expect(
        spreads[1] - spreads[0],
        'L’ombre sombre doit s’étaler bien au-delà de la lueur, sans quoi les ' +
          'deux se recouvrent et se délavent l’une l’autre.',
      ).toBeGreaterThanOrEqual(4);
    }
  });

  /* LE CONTRÔLE POSÉ À CÔTÉ DU VERRE DOIT L'ALLUMER AUSSI. La case et
     l'interrupteur gardent leur `<input>` natif comme FRÈRE du matériau :
     `:focus-within` ne s'y déclenche jamais, et la page ne changeait pas d'un
     seul pixel au focus clavier. */
  it('allume le verre depuis un contrôle qui lui est frère', () => {
    for (const control of ['opale-checkbox', 'opale-toggle']) {
      expect(
        opaleSource,
        `« .${control} » ne marque pas le focus sur le verre voisin : son ` +
          '`<input>` est frère du matériau, donc `:focus-within` ne peut pas le voir.',
      ).toMatch(new RegExp(`\\.${control}:focus-visible \\+ \\[data-opale-glass\\]`));
    }
  });

  /* LE CHROME DU NAVIGATEUR DOIT ÊTRE NEUTRALISÉ. Un `<Glass as="button">` nu
     rendait un bouton au fond `rgb(239, 239, 239)` — opaque, masquant les trois
     couches, encre blanche à 1,15:1. Tailwind posait ce reset ; en le retirant
     on l'a perdu sans le remplacer. */
  it('neutralise le chrome de l’agent utilisateur sur son contenu', () => {
    const reset =
      /\.content:where\(button, input, select, textarea\)\s*\{([^}]*)\}/.exec(glassSheet)?.[1] ??
      '';

    expect(reset, 'Sans `appearance: none`, un bouton natif garde son fond gris.').toMatch(
      /appearance:\s*none/,
    );
    expect(reset).toMatch(/background:\s*transparent/);
  });

  it('borne le rebond pour qu’il réponde sans fatiguer', () => {
    const press =
      /\.glass\[data-opale-glass-press='true'\]:active\s*\{([^}]*)\}/.exec(glassSheet)?.[1] ?? '';
    const duration = Number(/(\d+)ms/.exec(press)?.[1] ?? 0);

    expect(press, 'Le rebond ne part que sur `:active` — jamais au survol, jamais seul.').toMatch(
      /animation:/,
    );
    expect(
      duration,
      `Le rebond dure ${duration} ms. Au-delà d’un quart de seconde, un retour ` +
        'd’appui cesse d’être un retour et devient une attente.',
    ).toBeLessThanOrEqual(260);
    expect(press, 'Un rebond qui se répète est une gêne, pas un retour.').not.toMatch(/infinite/);

    /* L'amplitude reste sous 4 % : la boîte ne bouge pas, donc rien ne se
       décale autour. C'est ce qui permet d'en mettre partout. */
    const frames = /@keyframes opale-glass-press\s*\{([\s\S]*?)\n\}/.exec(glassSheet)?.[1] ?? '';
    const scales = [...frames.matchAll(/scale\(([\d.]+)\)/g)].map((m) => Number(m[1]));

    expect(scales.length, 'Les étapes du rebond sont introuvables.').toBeGreaterThan(2);
    for (const scale of scales) {
      expect(
        Math.abs(scale - 1),
        `L’étape scale(${scale}) dépasse 4 % d’amplitude.`,
      ).toBeLessThanOrEqual(0.04);
    }
  });

  it('efface le mouvement pour qui en demande moins, sans effacer le focus', () => {
    const reduced =
      /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}/.exec(glassSheet)?.[1] ?? '';

    expect(reduced, 'L’onde doit s’effacer.').toMatch(/\.ripple/);
    expect(reduced, 'Le rebond doit s’effacer : c’est du mouvement non essentiel.').toMatch(
      /\.glass\[data-opale-glass-press='true'\]:active/,
    );
    /* Le focus, lui, RESTE. Demander moins d'animation n'est pas renoncer à
       savoir où l'on est : un indicateur est une information, pas un effet. */
    expect(reduced).not.toMatch(/focus-within/);
  });

  it('écrit son encre en blanc et dit à quelle condition elle se lit', () => {
    expect(opaleSource).toMatch(/--opale-glass-ink:\s*#fff/);
    expect(
      opaleSource,
      'L’encre blanche n’a de sens qu’avec un voile sous le matériau : le jeton ' +
        'qui le porte doit exister, sans quoi on publie du blanc sur du blanc.',
    ).toMatch(/--opale-glass-scrim:/);
  });
});

/* =============================================================================
   LES SEUILS DE LISIBILITÉ VIENNENT D'UNE MESURE, DONC ILS SE GARDENT.

   Trois nombres de ce système ne sont pas des réglages de goût : le voile sous
   le matériau, l'opacité plancher d'une encre atténuée, et le fait que l'encre
   soit blanche. Ils ont été obtenus en échantillonnant le cliché des scènes
   pixel par pixel, et ils tiennent ensemble — baisser l'un casse les autres.

   CE QUE CE FICHIER NE PEUT PAS FAIRE : mesurer un contraste sur une
   photographie. jsdom ne peint rien, et le calcul demande les pixels composés.
   La mesure a donc été faite au navigateur (9 pages à scène, 79 textes ; 10
   pages de catalogue sous verre, 28 textes — aucun sous 4,5:1). Ce qui est
   épinglé ici, ce sont les CONSTANTES dont ce résultat dépend : les voir
   changer sans qu'on refasse la mesure est le vrai risque.
   ========================================================================== */
/* =============================================================================
   LE REBOND APPARTIENT À CE QU'ON PRESSE, PAS À CE QUI L'ENTOURE.

   LE DÉFAUT. `:active` ne désigne pas seulement l'élément touché : la
   spécification l'applique aussi à TOUS SES ANCÊTRES. Une règle `.glass:active`
   faisait donc rebondir le conteneur de verre dès qu'on cliquait n'importe quoi
   dedans — une entrée du sommaire faisait sauter le sommaire entier, un bouton
   dans une modale faisait sauter la modale.

   POURQUOI AUCUN TEST NE L'A VU. Celui qui gardait le rebond lisait la FEUILLE
   et vérifiait sa durée, son amplitude et son absence de répétition. Trois
   bonnes questions, et pas la quatrième : SUR QUOI il part. Un contrôle de
   valeurs ne dit jamais rien du périmètre d'un sélecteur.

   CE QUI EST VÉRIFIÉ ICI est donc le périmètre, sur le DOM rendu et non sur la
   feuille : l'attribut que la règle exige est présent sur les activables et
   absent des surfaces. jsdom ne peignant aucune animation, l'attribut est le
   seul témoin observable — et c'est justement celui que la feuille lit.
   ========================================================================== */
describe('le périmètre du rebond', () => {
  /** L'enveloppe de verre la plus externe du rendu. */
  const envelope = (container: HTMLElement) =>
    container.querySelector('[data-opale-glass]') as HTMLElement | null;

  const PRESSABLE = [
    { name: 'Button', render: () => <Opale.Button liquidGlass>Continuer</Opale.Button> },
    /* La case et l'interrupteur gardent leur `<input>` À CÔTÉ du verre : la
       coquille est un `<span>`, que rien ne distingue d'une surface. C'est le
       cas que la déduction par balise ne peut pas voir, et le réglage explicite
       est là pour lui. */
    { name: 'Checkbox', render: () => <Opale.Checkbox liquidGlass label="Oui" /> },
    { name: 'Toggle', render: () => <Opale.Toggle liquidGlass label="Actif" /> },
  ];

  const SURFACES = [
    {
      name: 'Card',
      render: () => (
        <Opale.Card liquidGlass title="Titre">
          Corps
        </Opale.Card>
      ),
    },
    { name: 'Input', render: () => <Opale.Input liquidGlass label="Nom" /> },
    { name: 'Select', render: () => <Opale.Select liquidGlass label="Choix" options={[]} /> },
    { name: 'Badge', render: () => <Opale.Badge liquidGlass>Neuf</Opale.Badge> },
  ];

  for (const { name, render: renderOne } of PRESSABLE) {
    it(`fait rebondir ${name}, qu'on presse`, () => {
      const { container } = render(renderOne());

      expect(
        envelope(container),
        `${name} est une cible d'activation : son verre doit répondre à l'appui.`,
      ).toHaveAttribute('data-opale-glass-press', 'true');
    });
  }

  for (const { name, render: renderOne } of SURFACES) {
    it(`laisse ${name} immobile, qu'on ne presse pas`, () => {
      const { container } = render(renderOne());

      expect(
        envelope(container),
        `${name} est une surface. Marquée pressable, elle rebondirait à chaque ` +
          "clic sur ce qu'elle contient, `:active` remontant aux ancêtres.",
      ).not.toHaveAttribute('data-opale-glass-press');
    });
  }

  /* Le cas complet : un bouton de verre DANS une carte de verre. Le seul qui
     reproduise la panne — deux enveloppes, une seule doit répondre. */
  it('ne fait rebondir que le bouton, pas la carte qui le porte', () => {
    const { container } = render(
      <Opale.Card liquidGlass title="Titre">
        <Opale.Button liquidGlass>Continuer</Opale.Button>
      </Opale.Card>,
    );

    const envelopes = [...container.querySelectorAll('[data-opale-glass]')];
    const pressing = envelopes.filter((node) => node.hasAttribute('data-opale-glass-press'));

    expect(envelopes.length, 'Les deux matériaux doivent bien être rendus.').toBe(2);
    expect(
      pressing,
      'Une seule enveloppe doit rebondir : celle du bouton. Si la carte la ' +
        "rejoint, tout clic à l'intérieur fait sauter la carte entière.",
    ).toHaveLength(1);
    expect(pressing[0]?.querySelector('button')).not.toBeNull();
  });
});

/* =============================================================================
   LE CURSEUR SOUS VERRE : LA PISTE EST LE MATÉRIAU, LA BULLE EST PEINTE.

   CE QUI A CHANGÉ, ET POURQUOI IL FAUT LE GARDER. Le curseur laissait l'agent
   utilisateur peindre sa propre piste dans la boîte de verre : un rail opaque
   qui touchait les bords du matériau et le débordait. La piste est désormais
   l'enveloppe elle-même, et deux décorations — la part mouillée, la bulle —
   sont peintes par Opale depuis une variable CSS.

   CE QUE CES TESTS SURVEILLENT EN PRIORITÉ, ce n'est pas l'apparence : c'est
   que le remplacement n'a rien pris à l'utilisateur. Un contrôle natif rendu
   invisible est la manière la plus courante de casser un curseur sans que
   rien ne se voie — il suffit de le cacher un peu trop bien.
   ========================================================================== */
describe('le curseur sous verre', () => {
  const opaleSheet = opaleSource.replace(/\/\*[\s\S]*?\*\//g, '');

  /** Le conteneur du curseur, qui porte les variables lues par les décorations.
      C'est le parent du natif : la part mouillée vit dans le verre, la bulle
      dehors, et seul un ancêtre commun peut les servir toutes les deux. */
  const shellOf = (container: HTMLElement) =>
    container.querySelector('.opale-range-field') as HTMLElement;

  it('écrit la position dans le DOM au lieu de re-rendre le composant', () => {
    const { container } = render(<Opale.Slider liquidGlass label="Volume" defaultValue={40} />);
    const shell = shellOf(container);

    expect(
      shell.style.getPropertyValue('--opale-range-progress'),
      'La position doit être posée dès le montage, sans attendre un geste.',
    ).toBe('0.4');

    fireEvent.change(screen.getByRole('slider'), { target: { value: '75' } });

    expect(shell.style.getPropertyValue('--opale-range-progress')).toBe('0.75');
  });

  it('respecte min et max plutôt que de supposer 0–100', () => {
    const { container } = render(
      <Opale.Slider liquidGlass label="Température" min={10} max={30} defaultValue={25} />,
    );

    expect(
      shellOf(container).style.getPropertyValue('--opale-range-progress'),
      '25 sur l’échelle 10–30 vaut les trois quarts de la course, pas le quart.',
    ).toBe('0.75');
  });

  /* LA DÉFORMATION EST BORNÉE, ET LA BORNE SE VÉRIFIE SUR LE CAS QUI LA
     SOLLICITE : un clic à l'autre bout de la piste envoie toute la course en
     un seul événement. Sans écrêtage, la bulle deviendrait un trait. */
  it('borne l’allongement de la bulle, même sur un saut d’un bout à l’autre', () => {
    const { container } = render(<Opale.Slider liquidGlass label="Volume" defaultValue={0} />);
    const shell = shellOf(container);

    fireEvent.change(screen.getByRole('slider'), { target: { value: '100' } });

    const stretch = Number(shell.style.getPropertyValue('--opale-range-stretch'));

    expect(stretch, 'Aucun allongement n’a été posé.').toBeGreaterThan(0);
    expect(stretch, `Allongement de ${stretch} : la goutte devient un trait.`).toBeLessThanOrEqual(
      0.22,
    );
  });

  it('laisse la goutte se reposer quand le geste s’arrête', () => {
    vi.useFakeTimers();

    try {
      const { container } = render(<Opale.Slider liquidGlass label="Volume" defaultValue={10} />);
      const shell = shellOf(container);

      fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } });
      expect(Number(shell.style.getPropertyValue('--opale-range-stretch'))).toBeGreaterThan(0);

      vi.advanceTimersByTime(200);

      expect(
        shell.style.getPropertyValue('--opale-range-stretch'),
        'Sans retour au repos, la bulle resterait étirée indéfiniment.',
      ).toBe('0');
    } finally {
      vi.useRealTimers();
    }
  });

  /* WCAG 2.3.3. L'allongement est écrit en JavaScript : un style en ligne
     l'emporte sur toute règle de la feuille, donc `@media
     (prefers-reduced-motion)` ne pourrait pas le retirer. La préférence doit
     être lue à la source, et c'est exactement ce que ce test vérifie. */
  it('n’étire rien quand on demande moins d’animation', () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const previous = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { value: matchMedia, configurable: true });

    try {
      const { container } = render(<Opale.Slider liquidGlass label="Volume" defaultValue={0} />);

      fireEvent.change(screen.getByRole('slider'), { target: { value: '100' } });

      expect(
        shellOf(container).style.getPropertyValue('--opale-range-stretch'),
        'La déformation doit être décidée en JavaScript : la feuille ne peut ' +
          'pas défaire un style en ligne.',
      ).toBe('');
      expect(
        shellOf(container).style.getPropertyValue('--opale-range-progress'),
        'La position, elle, n’est pas du mouvement : elle reste posée.',
      ).toBe('1');
    } finally {
      Object.defineProperty(window, 'matchMedia', { value: previous, configurable: true });
    }
  });

  it('ne peint ses décorations que sous verre', () => {
    const { container, rerender } = render(<Opale.Slider label="Volume" defaultValue={40} />);

    expect(container.querySelector('.opale-range-bubble')).toBeNull();
    expect(container.querySelector('.opale-range-wet')).toBeNull();

    rerender(<Opale.Slider liquidGlass label="Volume" defaultValue={40} />);

    for (const selector of ['.opale-range-bubble', '.opale-range-wet']) {
      const decoration = container.querySelector(selector);

      expect(decoration, `${selector} manque sous verre.`).not.toBeNull();
      expect(
        decoration,
        `${selector} est un dessin : annoncé, il doublerait le curseur natif.`,
      ).toHaveAttribute('aria-hidden', 'true');
    }

    expect(screen.getAllByRole('slider')).toHaveLength(1);
  });

  /* LE PIÈGE DE CE COMPOSANT : le natif doit DISPARAÎTRE à l'œil sans
     disparaître de l'ordre de tabulation ni de l'arbre d'accessibilité.
     `display: none` et `visibility: hidden` font les deux ; l'opacité nulle ne
     fait que la première. Le test lit la feuille, faute de mise en page en
     jsdom, et il vise la faute précise qu'on pourrait commettre en voulant
     « mieux » cacher le contrôle. */
  it('cache le contrôle natif sans le retirer du clavier', () => {
    /* Le sélecteur apparaît dans PLUSIEURS blocs — il termine aussi une liste
       partagée avec les champs, qui n'y pose qu'une couleur. Les réunir évite
       de lire le premier venu et de conclure sur le mauvais. */
    const rule = [...opaleSheet.matchAll(/\.opale-range-field \.opale-range[^,{]*\{([^}]*)\}/g)]
      .map((match) => match[1])
      .join('\n');

    expect(rule, 'La règle qui cache le natif est introuvable.').not.toBe('');
    expect(rule, 'Le natif doit être effacé par l’opacité.').toMatch(/opacity:\s*0/);
    expect(rule, '`display: none` retirerait le curseur du clavier.').not.toMatch(
      /display:\s*none/,
    );
    expect(rule, '`visibility: hidden` le retirerait aussi.').not.toMatch(/visibility:\s*hidden/);
  });

  /* L'INDICATEUR DE FOCUS DOIT DISPARAÎTRE QUAND ON LÂCHE LA GOUTTE.

     `:focus-within` et `:focus` s'allument sur n'importe quelle prise de
     focus, clic de souris compris : après un glissement, le natif garde le
     focus et le halo restait affiché jusqu'au prochain clic ailleurs. Un
     curseur n'attend pas de saisie textuelle, donc les navigateurs ne lui
     accordent `:focus-visible` qu'au clavier — c'est la seule des trois
     pseudo-classes qui produise le comportement voulu.

     CE QUE CE TEST NE PEUT PAS FAIRE : rejouer un glissement et constater
     l'extinction. jsdom ne décide pas de `:focus-visible`, qui est une
     heuristique du navigateur. Il vérifie donc la pseudo-classe employée,
     c'est-à-dire la cause. */
  it('éteint le focus de la bulle dès qu’on lâche la souris', () => {
    const rules = [...opaleSheet.matchAll(/([^{}]*\.opale-range-bubble[^{}]*)\{([^}]*)\}/g)];
    const focusRules = rules.filter(([, selector]) => /:focus/.test(selector));

    expect(focusRules.length, 'Aucune règle de focus sur la bulle.').toBeGreaterThan(0);

    for (const [, selector] of focusRules) {
      expect(
        selector,
        `« ${selector.trim()} » garde le halo allumé après un clic de souris.`,
      ).not.toMatch(/:focus(?!-visible)/);
    }

    /* Et le halo doit bien être celui du matériau, pas un anneau réinventé. */
    expect(
      focusRules.map(([, , body]) => body).join('\n'),
      'La bulle doit porter le halo du verre, comme tout le reste.',
    ).toMatch(/var\(--opale-glass-focus-halo\)/);
  });

  /* LE NIVEAU D'EAU SUIT LE CENTRE DE LA BULLE, PAS LA FRACTION BRUTE.

     La bulle court sur `100% - sa largeur`, donc son centre n'est pas à
     `fraction × 100%`. Remplir jusqu'à cette fraction laissait l'eau en
     retrait de la poignée d'un écart proportionnel à la largeur de la bulle —
     visible dès qu'on l'a élargie. Les deux doivent partager le même terme de
     course. */
  it('arrête la part mouillée au centre de la bulle', () => {
    const wet = /\.opale-range-wet \{([^}]*)\}/.exec(opaleSheet)?.[1] ?? '';
    const width = /inline-size:\s*calc\(([\s\S]*?)\);/.exec(wet)?.[1] ?? '';

    expect(wet, 'La part mouillée est introuvable.').not.toBe('');
    expect(
      width.replace(/\s+/g, ' '),
      'La part mouillée doit partir d’une demi-largeur de bulle et suivre la ' +
        'même course qu’elle, sans quoi le niveau d’eau est décalé de la poignée.',
    ).toMatch(
      /var\(--opale-range-bubble-width\) \/ 2 \+ var\(--opale-range-progress, 0\) \* \( ?100% - var\(--opale-range-bubble-width\) ?\)/,
    );
  });

  /* LA BULLE SE PLACE SUR LA COURSE UTILE, PAS SUR LA LARGEUR DE LA PISTE.
     Sinon elle sort d'un demi-diamètre aux deux extrémités — c'est-à-dire
     exactement le défaut qu'on vient de corriger sur la piste native, reporté
     sur la poignée. */
  it('garde la bulle dans la piste aux deux extrémités', () => {
    const rule = /\.opale-range-bubble \{([^}]*)\}/.exec(opaleSheet)?.[1] ?? '';
    const offset = /inset-inline-start:\s*calc\(([^;]*)\);/.exec(rule)?.[1] ?? '';

    expect(rule, 'La bulle est introuvable.').not.toBe('');
    expect(
      offset,
      'La bulle se place sur 100 % de la piste : elle déborde d’une demi-' +
        'largeur à gauche comme à droite. Sa course utile est `100% - sa largeur`.',
    ).toMatch(/100%\s*-\s*(?:[\d.]+rem|var\(--opale-range-bubble-width\))/);
  });
});

/* =============================================================================
   L'ENVELOPPE DOIT COLLER À LA PEAU QU'ELLE HABILLE.

   LE DÉFAUT OBSERVÉ. L'interrupteur montrait deux arêtes au bas de sa pilule.
   Sa piste est `inline-flex` : dans l'enveloppe, qui est un bloc, elle forme
   une LIGNE, et une ligne réserve sous elle la place des jambages. Mesuré au
   navigateur : enveloppe 31,59 px pour une piste de 28. Le filet spéculaire
   du matériau traçait son arête en bas de l'enveloppe, le fond de la piste la
   sienne trois pixels et demi plus haut.

   POURQUOI CE TEST LIT LA FEUILLE ET NON LA PAGE. jsdom ne met rien en page :
   il rend toutes les hauteurs nulles, donc l'écart est invisible pour lui. Ce
   qui se vérifie ici est la CAUSE — une coquille de verre ne doit pas être de
   niveau ligne — et elle se vérifie pour toutes les coquilles à la fois, pas
   seulement pour celle qui a fauté.
   ========================================================================== */
describe('les coquilles de verre', () => {
  const opaleSheet = opaleSource.replace(/\/\*[\s\S]*?\*\//g, '');

  /** Les peaux posées DANS une enveloppe de verre, et leur `display` final. */
  const SKINS = [
    'opale-toggle-track--glass',
    'opale-checkbox-mark--glass',
    'opale-input-shell--glass',
    'opale-range-shell--glass',
    'opale-badge--glass',
  ];

  it('ne pose aucune peau de niveau ligne dans une enveloppe', () => {
    for (const skin of SKINS) {
      /* La DERNIÈRE déclaration gagne à spécificité égale, et toutes ces
         règles pèsent (0,1,0) : c'est donc la dernière qu'il faut lire. */
      const displays = [
        ...opaleSheet.matchAll(new RegExp(`\\.${skin}(?![\\w-])[^,{]*\\{([^}]*)\\}`, 'g')),
      ]
        .flatMap((match) => [...match[1].matchAll(/display:\s*([\w-]+)/g)])
        .map((match) => match[1]);

      const display = displays.at(-1);

      if (display === undefined) continue;

      expect(
        display,
        `« .${skin} » est en « ${display} » : de niveau ligne, elle forme une ` +
          'ligne dans son enveloppe, qui réserve sous elle la place des ' +
          'jambages. L’enveloppe devient plus haute que la peau et le matériau ' +
          'trace une seconde arête en dessous.',
      ).not.toMatch(/^inline/);
    }
  });

  /* LE PIÈGE DE CASCADE QUI A MASQUÉ LE VERRE. `.opale-toggle-track--glass`
     posait `background: transparent` depuis le bloc commun des peaux, écrit
     AVANT `.opale-toggle-track`. Les deux pèsent (0,1,0) : à égalité c'est
     l'ordre qui tranche, et la piste colorée gagnait. On voyait une pilule
     plate là où on attendait du verre — et rien ne rougissait. */
  it('laisse la peau de verre gagner sur la peau pleine', () => {
    /* La position de la DERNIÈRE règle dont un sélecteur est EXACTEMENT cette
       classe, et qui peint un fond.

       « exactement » n'est pas un détail : une première version se contentait
       de chercher la classe quelque part dans le sélecteur, si bien que
       « .opale-toggle:checked + * .opale-toggle-track--glass » la satisfaisait
       — et le garde restait vert alors que la règle nue avait disparu. Le
       test de mutation l'a montré. */
    const lastBareRule = (className: string): number => {
      let found = -1;

      for (const rule of opaleSheet.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        const selectors = rule[1].split(',').map((one) => one.trim());

        if (!selectors.includes(`.${className}`)) continue;
        if (!/background:/.test(rule[2])) continue;

        found = rule.index ?? found;
      }

      return found;
    };

    for (const [plein, verre] of [['opale-toggle-track', 'opale-toggle-track--glass']]) {
      const positionPleine = lastBareRule(plein);
      const positionVerre = lastBareRule(verre);

      expect(positionPleine, `« .${plein} » ne peint aucun fond.`).toBeGreaterThan(-1);
      expect(
        positionVerre,
        `« .${verre} » ne reprend aucun fond pour son propre compte.`,
      ).toBeGreaterThan(-1);
      expect(
        positionVerre,
        `« .${verre} » est déclarée AVANT « .${plein} ». À spécificité égale, ` +
          'c’est la dernière qui gagne : le fond plein recouvrirait le verre.',
      ).toBeGreaterThan(positionPleine);
    }
  });
});

describe('les seuils de lisibilité du verre', () => {
  /** L'opacité plancher d'une encre blanche, mesurée : en dessous, AA tombe. */
  const PLANCHER = 0.85;

  it('garde le voile à l’opacité qui rend le blanc conforme', () => {
    const scrim = /--opale-glass-scrim:\s*rgba\(7,\s*28,\s*43,\s*([\d.]+)\)/.exec(opaleSource)?.[1];

    expect(scrim, '`--opale-glass-scrim` est introuvable ou a changé de forme.').toBeDefined();
    expect(
      Number(scrim),
      `Le voile est à ${scrim}. Mesuré sur le cliché des scènes : à 0,60 le blanc ` +
        'tombe à 4,19:1 à travers le lavis du verre, sous le seuil AA. 0,65 est le ' +
        'premier palier conforme (4,87:1). Le baisser demande de refaire la mesure.',
    ).toBeGreaterThanOrEqual(0.65);
  });

  it('ne laisse aucune encre atténuée passer sous le plancher mesuré', () => {
    const muted = /--opale-glass-ink-muted:\s*rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/.exec(
      opaleSource,
    )?.[1];

    expect(muted, '`--opale-glass-ink-muted` est introuvable.').toBeDefined();
    expect(
      Number(muted),
      `L’encre atténuée est à ${muted}. Sur le pixel le plus clair du cliché voilé, ` +
        `le premier palier qui tient 4,5:1 est ${PLANCHER}. En dessous, un texte ` +
        'indicatif devient non conforme — et personne ne mesure jamais une atténuation.',
    ).toBeGreaterThanOrEqual(PLANCHER);
  });

  it('reprend l’encre des pièces qui déclarent la leur', () => {
    /* Carte, statistique, pastille et libellé de champ posent leur propre
       couleur, pensée pour la carte blanche. Sous verre elles doivent la
       reprendre, sinon on mesure 1,20:1 — ce qui est arrivé. */
    for (const piece of [
      '.opale-stat-card__value',
      '.opale-card__title',
      '.opale-badge',
      '.opale-field__label',
    ]) {
      expect(
        opaleSource,
        `« ${piece} » ne reprend pas l’encre du verre : sa couleur propre, pensée ` +
          'pour un fond clair, restera sur la photographie.',
      ).toMatch(new RegExp(`\\[data-opale-glass\\][^{]*${piece.replace('.', '\\.')}`));
    }
  });
});
