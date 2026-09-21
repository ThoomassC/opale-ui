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

  it('rend le focus visible sans rétablir le rectangle refusé', () => {
    const rule = /\.glass:focus-within\s*\{([^}]*)\}/.exec(glassSheet)?.[1] ?? '';

    expect(
      rule,
      'Le matériau ne marque plus le focus. Les jetons d’anneau de la vitrine ' +
        'valent `transparent` : sans cette règle, un champ de verre n’a AUCUN ' +
        'indicateur au clavier (WCAG 2.4.7).',
    ).toMatch(/outline:\s*\d+px\s+solid/);

    /* L'anneau doit contraster avec ce qui l'entoure (2.4.11). Blanc sur le
       voile mesuré : 5,56:1. Un anneau qui emprunterait `--opale-focus` serait
       transparent dans la vitrine — c'est exactement le piège. */
    expect(rule).not.toMatch(/--opale-focus/);
    expect(
      rule,
      'L’arête du verre doit s’allumer : c’est l’indicateur porté par la matière.',
    ).toMatch(/--opale-glass-edge/);
  });

  it('borne le rebond pour qu’il réponde sans fatiguer', () => {
    const press = /\.glass:active\s*\{([^}]*)\}/.exec(glassSheet)?.[1] ?? '';
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
      /\.glass:active/,
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
