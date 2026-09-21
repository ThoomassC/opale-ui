import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
 * `Glass` monte un filtre SVG de déplacement (`lg-dist`) pour chacune de ses
 * instances. Sa présence distingue le VERRE du lavis CSS `.opale-liquid` qui
 * l'imitait — et c'est exactement la distinction que ces fusions établissent :
 * chercher une classe d'Opale aurait laissé passer l'imitation.
 */
function hasGlassMaterial(container: HTMLElement): boolean {
  return container.querySelector('filter#lg-dist') !== null;
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

  it('peint les états actifs avec le primaire d’Opale', () => {
    for (const selector of ['.opale-toggle--glass', '.opale-checkbox--glass']) {
      const rule = new RegExp(
        `${selector.replace('.', '\\.')}\\[data-checked='true'\\][^{]*\\{[^}]*var\\(--opale-primary\\)`,
      );

      expect(
        opaleSource,
        `L’état actif de « ${selector} » ne cite pas --opale-primary : sa couleur ` +
          'vient donc d’ailleurs que de la palette d’Opale.',
      ).toMatch(rule);
    }
  });
});

/* =============================================================================
   LA PEAU DE VERRE NE DOIT PAS INTERCEPTER LE CLIC — LE DÉFAUT A ÉTÉ LIVRÉ.

   Le commutateur de verre était MORT AU CLIC en production, et toute la suite
   était verte. La cause : `pointer-events: none` posé sur la seule enveloppe.
   Un descendant peut réactiver le pointeur qu'un ancêtre a coupé, et leur
   module le fait — le clic mourait sur un `<button>` sans gestionnaire au lieu
   de traverser jusqu'au `<label>`.

   POURQUOI LES TESTS DE COMPORTEMENT NE L'ONT PAS VU, et c'est la leçon : ils
   cliquent `getByRole('checkbox')`, c'est-à-dire l'`<input>` natif — jamais la
   surface qu'un humain vise. Ils prouvent que le contrôle répond quand on
   l'atteint, pas qu'on peut l'atteindre. jsdom ne calcule ni cascade ni
   `elementFromPoint` : la vérification par l'usage est impossible ici, elle a
   été faite au navigateur. Reste à épingler la RÈGLE, pour qu'on ne la
   rétrécisse pas à l'enveloppe une seconde fois.
   ========================================================================== */
describe('l’inertie de la peau de verre', () => {
  const stripped = opaleSource.replace(/\/\*[\s\S]*?\*\//g, '');

  it.each(['.opale-checkbox--glass', '.opale-toggle--glass'])(
    '%s coupe le pointeur sur ses DESCENDANTS et pas seulement sur lui-même',
    (wrapper) => {
      const rules = [...stripped.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(([, , body]) =>
        /pointer-events:\s*none/.test(body),
      );
      const covers = rules.some(([, selector]) =>
        selector.split(',').some((part) => part.trim() === `${wrapper} *`),
      );

      expect(
        covers,
        `Aucune règle ne coupe \`pointer-events\` sur « ${wrapper} * ».\n\n` +
          'Le couper sur la seule enveloppe NE SUFFIT PAS : le composant vendoré ' +
          'remet `pointer-events: auto` sur son bouton interne, qui intercepte alors ' +
          'le clic et ne fait rien. C’est exactement le défaut qui a rendu ' +
          'l’interrupteur de verre inutilisable en production.',
      ).toBe(true);
    },
  );

  /* La technique de sélection est celle de la page du matériau. Un sélecteur
     structurel (`> div`, `> :last-child`) viserait le bon élément aujourd'hui
     et le voisin demain, sans rien faire rougir. */
  it('atteint les couches du verre par leur classe, jamais par leur position', () => {
    const positional = [...stripped.matchAll(/([^{}]*--glass[^{}]*)\{/g)]
      .map(([, selector]) => selector.trim())
      .filter((selector) => /(>\s*div\b|:last-child|:first-of-type|:nth-child)/.test(selector));

    expect(
      positional,
      'Ces règles de verre visent une POSITION plutôt qu’une classe :\n  ' +
        positional.join('\n  ') +
        "\n\nUtilisez la forme de `doc.css` — `[class*='glassContent']` — qui nomme " +
        'la couche visée et survit à l’ajout d’un calque dans `Glass`.',
    ).toEqual([]);
  });
});
