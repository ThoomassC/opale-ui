import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import opaleSheet from './opale.css?raw';
import {
  BackgroundSurface,
  Badge,
  Breadcrumb,
  Button,
  DescriptionList,
  Checkbox,
  Dropzone,
  Input,
  MultiSelect,
  ProgressBar,
  Select,
  SelectionBar,
  Slider,
  Toast,
  CommandPalette,
  ConfirmDialog,
  Lightbox,
  Rating,
  SegmentedControl,
  SidePanel,
} from './opale';

afterEach(cleanup);

describe('Button', () => {
  it('utilise button comme type sûr par défaut et respecte un type explicite', () => {
    render(
      <>
        <Button>Action</Button>
        <Button type="submit">Envoyer</Button>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Action' })).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: 'Envoyer' })).toHaveAttribute('type', 'submit');
  });

  it.each(['primary', 'secondary', 'accent', 'danger'] as const)(
    'expose la variante pleine %s',
    (variant) => {
      render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByRole('button', { name: variant })).toHaveClass(`opale-button--${variant}`);
    },
  );

  it('conserve ghost dans l’API pour les boutons spécialisés existants', () => {
    render(<Button variant="ghost">Action secondaire</Button>);
    expect(screen.getByRole('button', { name: 'Action secondaire' })).toHaveClass(
      'opale-button--ghost',
    );
  });
});

describe('SegmentedControl', () => {
  const OPTIONS = [
    { value: 'design', label: 'Design system' },
    { value: 'code', label: 'Code' },
  ] as const;

  /* jsdom n'a pas de mise en page : tout rectangle y vaut 0, ce qui est aussi
     l'état d'une première peinture. Les rectangles ne sont doublés que là où le
     test veut voir la pastille se déplacer. */
  const rect = (left: number, width: number): DOMRect =>
    ({
      bottom: 36,
      height: 36,
      left,
      right: left + width,
      top: 0,
      width,
      x: left,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('garde aria-pressed comme seule annonce de la sélection', () => {
    const { container } = render(<SegmentedControl options={OPTIONS} value="code" />);
    const indicator = container.querySelector('.opale-segmented__indicator');

    expect(indicator).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('laisse la pastille sans position tant que rien n’est mesurable', () => {
    const { container } = render(<SegmentedControl options={OPTIONS} value="code" />);
    const indicator = container.querySelector<HTMLElement>('.opale-segmented__indicator');

    expect(indicator?.style.transform).toBe('');
    expect(indicator?.dataset.animated).toBeUndefined();
  });

  it('place la pastille sous l’option pressée', () => {
    const { container } = render(<SegmentedControl options={OPTIONS} value="code" />);
    const group = screen.getByRole('group');
    const pressed = screen.getByRole('button', { name: 'Code' });

    vi.spyOn(group, 'getBoundingClientRect').mockReturnValue(rect(0, 240));
    vi.spyOn(pressed, 'getBoundingClientRect').mockReturnValue(rect(130, 72));

    fireEvent(window, new Event('resize'));

    const indicator = container.querySelector<HTMLElement>('.opale-segmented__indicator');
    expect(indicator?.style.transform).toBe('translate3d(130px, 0px, 0)');
    expect(indicator?.style.width).toBe('72px');
    expect(indicator?.dataset.animated).toBe('true');
  });

  it('montre immédiatement la sélection après passage au verre', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains('opale-segmented')) return rect(0, 240);
      if (this.getAttribute('aria-pressed') === 'true') return rect(130, 72);
      return rect(0, 36);
    });

    const { container, rerender } = render(<SegmentedControl options={OPTIONS} value="code" />);
    rerender(<SegmentedControl options={OPTIONS} value="code" liquidGlass />);

    const indicator = container.querySelector<HTMLElement>('.opale-segmented__indicator');
    expect(container.querySelector('.opale-segmented--glass')).toBeInTheDocument();
    expect(indicator?.style.width).toBe('72px');
    expect(indicator?.style.transform).toBe('translate3d(130px, 0px, 0)');
  });
});

/* =============================================================================
   LES SIX DÉFAUTS BLOQUANTS RELEVÉS PAR L'AUDIT.

   Chacun rendait une fonction inutilisable pour quelqu'un — pas « moins
   agréable » : inutilisable. Les tests visent donc l'USAGE, pas la
   déclaration : peut-on atteindre le champ, entendre la note, fermer le
   dialogue.
   ========================================================================== */
describe('les bloquants de l’audit d’accessibilité', () => {
  /* LE DÉPÔT DE FICHIERS ÉTAIT UN CUL-DE-SAC AU CLAVIER. L'`<input>` portait
     l'attribut `hidden`, donc `display: none` : hors de l'ordre de
     tabulation, dans un `<label>` qui n'est pas focalisable lui-même. On
     tabulait et l'on ne rencontrait rien (WCAG 2.1.1). */
  it('laisse atteindre le dépôt de fichiers au clavier', () => {
    render(<Dropzone />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    expect(input, 'Le champ de fichier est introuvable.').not.toBeNull();

    /* CE QUI SE VÉRIFIE EST LA MISE EN PAGE, PAS LA TABULATION.

       Une première version tabulait avec `userEvent` et attendait le champ.
       Elle passait AVEC l'attribut `hidden` remis : le test de mutation l'a
       montré. `userEvent.tab()` s'appuie sur ses propres heuristiques de
       focusabilité et ne consulte pas le `display` calculé — le test
       n'aurait jamais vu revenir le défaut.

       jsdom, lui, calcule bien `display: none` pour `[hidden]` (vérifié).
       C'est donc cette valeur qu'on lit : un élément à `display: none` n'est
       ni focalisable ni dans l'arbre d'accessibilité, quel que soit le moteur.
       C'est la cause exacte, et elle est observable ici. */
    expect(
      getComputedStyle(input).display,
      '`display: none` retire le champ du clavier ET de l’arbre ' +
        'd’accessibilité : le dépôt devient un cul-de-sac (WCAG 2.1.1).',
    ).not.toBe('none');
    expect(
      getComputedStyle(input).display,
      'Le champ doit être masqué par découpage, pas déclassé.',
    ).not.toBe('');
  });

  /* L'ANNEAU DE FOCUS DE LA CASE À COCHER. Son natif est absolu, de 1 px, à
     opacité nulle : sans règle, le navigateur dessine l'anneau sur une boîte
     invisible. jsdom ne peignant rien, c'est la feuille qu'on lit — et ce
     qu'on y vérifie est l'ABSENCE D'ASYMÉTRIE avec l'interrupteur, qui est
     la forme qu'avait l'oubli. */
  it('marque le focus de la case comme celui de l’interrupteur', () => {
    const sheet = opaleSheet.replace(/\/\*[\s\S]*?\*\//g, '');

    for (const [control, skin] of [
      ['opale-checkbox', 'opale-checkbox-mark'],
      ['opale-toggle', 'opale-toggle-track'],
    ]) {
      expect(
        sheet,
        `« .${control} » n’allume pas « .${skin} » au focus clavier : son ` +
          'contrôle natif est invisible, donc l’anneau se dessine sur rien.',
      ).toMatch(new RegExp(`\\.${control}:focus-visible \\+ \\.${skin}`));
    }
  });

  /* LES QUATRE DIALOGUES N'EN ÉTAIENT PAS. Aucun n'avait de piège de focus,
     d'Échap ni de restitution — et `ConfirmDialog` annonçait pourtant
     `aria-modal="true"`. Ils délèguent maintenant à `Modal`, qui a tout cela
     et ses propres tests ; ce qui se vérifie ici est la DÉLÉGATION. */
  const DIALOGUES = [
    {
      nom: 'ConfirmDialog',
      rendre: (onClose: () => void) => (
        <ConfirmDialog open title="Supprimer ?" onCancel={onClose}>
          Cette action est définitive.
        </ConfirmDialog>
      ),
    },
    {
      nom: 'SidePanel',
      rendre: (onClose: () => void) => (
        <SidePanel open title="Détails" onClose={onClose}>
          Contenu
        </SidePanel>
      ),
    },
    {
      nom: 'CommandPalette',
      rendre: (onClose: () => void) => <CommandPalette open onClose={onClose} />,
    },
    {
      nom: 'Lightbox',
      rendre: (onClose: () => void) => (
        <Lightbox open src="/image.png" alt="Une image" onClose={onClose} />
      ),
    },
  ];

  for (const { nom, rendre } of DIALOGUES) {
    it(`${nom} se ferme par Échap et prend le focus`, async () => {
      const onClose = vi.fn();
      render(rendre(onClose));

      const dialog = screen.getByRole('dialog');

      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(
        dialog.contains(document.activeElement),
        `${nom} laisse le focus DERRIÈRE le voile : on tabule dans une page ` +
          'qu’on ne voit plus.',
      ).toBe(true);

      fireEvent.keyDown(dialog, { key: 'Escape' });

      expect(onClose, `${nom} ne se ferme pas par Échap.`).toHaveBeenCalled();
    });
  }

  /* LA PALETTE DE COMMANDES N'AVAIT QU'UN TEXTE INDICATIF POUR ÉTIQUETTE. Un
     placeholder disparaît à la première frappe et n'est pas une étiquette
     (WCAG 3.3.2) — sur le composant dont la vocation est le clavier. */
  it('donne une vraie étiquette au champ de la palette', () => {
    render(<CommandPalette open />);

    const champ = screen.getByRole('textbox', { name: 'Rechercher une commande' });

    expect(champ).toBeInTheDocument();
    expect(
      champ.getAttribute('placeholder'),
      'Le nom du champ ne doit pas reposer sur son texte indicatif.',
    ).toBeNull();
  });

  /* LA NOTE N'ÉTAIT ANNONCÉE NULLE PART. `aria-label` sur un `<span>` sans
     rôle est ignoré par les API d'accessibilité, et les cinq étoiles sont
     `aria-hidden` : un lecteur d'écran traversait la note en silence. */
  it('annonce la note du composant Rating', () => {
    render(<Rating value={3} max={5} />);

    expect(screen.getByRole('img', { name: '3 sur 5' })).toBeInTheDocument();
  });
});

/* =============================================================================
   LES DOUBLONS RETIRÉS, ET CE QUI DOIT SURVIVRE À LEUR RETRAIT.
   ========================================================================== */
describe('les doublons du catalogue', () => {
  /* `ShapeBackground` EST DEVENU UNE PROP. Les deux classes déclaraient la
     même boîte et partageaient déjà le même `::before` : seule la forme
     organique les séparait. */
  it('rend la forme organique sous une prop, et seulement si on la demande', () => {
    const { container, rerender } = render(<BackgroundSurface>Fond</BackgroundSurface>);
    const surface = () => container.firstElementChild as HTMLElement;

    expect(surface()).toHaveClass('opale-opaley-background');
    expect(surface()).not.toHaveClass('opale-opaley-background--shape');

    rerender(<BackgroundSurface shape>Fond</BackgroundSurface>);

    expect(surface()).toHaveClass('opale-opaley-background--shape');
  });

  /* LE BADGE A ABSORBÉ `StatusChip`, qui n'était qu'un alias posant le même
     `.opale-badge` sous un autre nom. Son ton doit donc continuer de produire
     une classe distincte : c'est tout ce que l'alias apportait. */
  it('garde le ton du badge distinct de son défaut', () => {
    const { container } = render(
      <>
        <Badge>Défaut</Badge>
        <Badge tone="danger">Danger</Badge>
      </>,
    );

    const badges = [...container.querySelectorAll('.opale-badge')];

    expect(badges[1]?.className).toContain('opale-badge--danger');
    expect(badges[0]?.className).not.toContain('opale-badge--');
  });
});

/* =============================================================================
   LES CONSTATS « SÉRIEUX » ET « MINEURS » DE L'AUDIT.

   Aucun ne rendait un composant inutilisable — ils le rendaient MUET, ou
   bavard, ou menteur sur son état. Ce qui se vérifie ici est donc ce qu'une
   technologie d'assistance PERÇOIT, pas ce que le balisage déclare.
   ========================================================================== */
describe('les constats sérieux de l’audit', () => {
  const sheet = opaleSheet.replace(/\/\*[\s\S]*?\*\//g, '');

  /* LE MESSAGE D'ERREUR ÉTAIT DANS LE NOM DU CHAMP. Tout le champ était
     enveloppé dans un `<label>` : « E-mail » devenait « E-mail Adresse
     invalide », ce qui casse la commande vocale et noie l'erreur dans
     l'étiquette. Et rien ne l'annonçait. */
  it('sort l’erreur du nom du champ et la fait annoncer', () => {
    render(<Input label="E-mail" error="Adresse invalide" />);

    const champ = screen.getByRole('textbox', { name: 'E-mail' });

    expect(champ, 'Le champ doit s’appeler « E-mail », et rien de plus.').toBeInTheDocument();
    expect(champ).toHaveAttribute('aria-invalid', 'true');
    expect(champ).toHaveAccessibleDescription('Adresse invalide');
    expect(
      screen.getByRole('alert'),
      'Une erreur qui apparaît sans être annoncée laisse l’utilisateur devant ' +
        'un formulaire refusé en silence.',
    ).toHaveTextContent('Adresse invalide');
  });

  it('n’annonce pas un simple texte d’aide comme une alerte', () => {
    render(<Input label="E-mail" helperText="Format : nom@domaine.fr" />);

    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveAccessibleDescription(
      'Format : nom@domaine.fr',
    );
    expect(screen.queryByRole('alert'), 'Un texte d’aide n’a pas à couper la parole.').toBeNull();
  });

  /* TROIS BARRES SUR UNE PAGE S'ANNONÇAIENT « barre de progression, 40 % »
     trois fois, sans jamais dire de quoi : le libellé était frère de la
     barre, relié à rien. */
  it('donne son nom à la barre de progression', () => {
    render(<ProgressBar label="Téléversement" value={40} />);

    expect(screen.getByRole('progressbar', { name: 'Téléversement' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
  });

  /* L'ICÔNE DÉCORATIVE ENTRAIT DANS LE NOM DU BOUTON : « × Supprimer ». Le
     cas portait sur `DeleteButton`, qui n'était que ce `Button`-ci avec son
     libellé écrit en dur ; l'invariant, lui, appartenait déjà à `Button`. */
  it('garde l’icône d’un bouton hors de son nom', () => {
    render(
      <Button variant="danger" startIcon="×">
        Supprimer
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
  });

  /* UNE RÉGION LIVE INSÉRÉE EN MÊME TEMPS QUE SON CONTENU n'est pas
     surveillée au moment de l'insertion : l'annonce se perd. */
  it('monte la région du toast avant son message', () => {
    const { rerender } = render(<Toast message="Enregistré" open={false} />);

    const region = screen.getByRole('status');

    expect(region, 'La région doit exister avant le message.').toBeEmptyDOMElement();

    rerender(<Toast message="Enregistré" open />);

    expect(
      screen.getByRole('status'),
      'Et rester la MÊME région : c’est elle qui est surveillée.',
    ).toHaveTextContent('Enregistré');
  });

  /* LE COMPTE CHANGEAIT SANS UN MOT : on cochait des lignes et le total
     n'était jamais annoncé (WCAG 4.1.3). La région est montée avec la barre,
     donc avant que le nombre ne bouge — c'est la condition pour qu'une
     annonce parte. */
  it('annonce le compte de la sélection', () => {
    const { container } = render(<SelectionBar selectedCount={3} />);

    expect(container.querySelector('[aria-live]')).not.toBeNull();
  });

  it('structure la liste de définitions et le fil d’Ariane', () => {
    const { container } = render(
      <DescriptionList items={[{ term: 'Version', description: '3.1.1' }]} />,
    );

    expect(
      container.querySelector('dl > span'),
      'Le modèle de contenu d’un `<dl>` n’admet pas de `<span>` intercalé.',
    ).toBeNull();

    cleanup();
    render(
      <Breadcrumb
        items={[
          { id: 'a', label: 'Accueil', href: '#a' },
          { id: 'b', label: 'Composants', href: '#b' },
        ]}
      />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(
      screen.getByRole('link', { current: 'page' }),
      'Le dernier maillon doit dire où l’on se trouve.',
    ).toHaveTextContent('Composants');
  });

  /* LA PAGE COURANTE NE SE DISTINGUAIT QUE PAR LA COULEUR, et partageait sa
     déclaration avec `:hover`. jsdom ne peint rien : on lit la feuille. */
  it('marque la page courante autrement que par la couleur', () => {
    /* LA RÈGLE PROPRE, ET NON CELLE PARTAGÉE AVEC `:hover`. Le sélecteur
       apparaît dans les deux ; ne lire que le premier bloc venu reviendrait à
       interroger précisément la règle qu'on reproche. */
    const rule =
      [...sheet.matchAll(/([^{}]+)\{([^}]*)\}/g)]
        .filter((match) =>
          match[1]
            .split(',')
            .map((one) => one.trim())
            .includes('\u002e' + "opale-nav__item[aria-current='page']"),
        )
        .map((match) => match[2])
        .join('\n') ?? '';

    expect(rule, 'Aucune règle propre à la page courante.').not.toBe('');
    expect(
      rule,
      'Fond et couleur sont partagés avec `:hover` : il faut une marque qui ' +
        'survive aux niveaux de gris.',
    ).toMatch(/font-weight/);
    expect(sheet).toMatch(/\.opale-nav__item\[aria-current='page'\]::before/);
  });

  /* RAMENER LA SEULE DURÉE À 0,01 ms N'ARRÊTE PAS UNE ANIMATION `infinite` :
     elle se rejoue indéfiniment, et l'anneau saute d'un angle arbitraire à
     chaque image — l'inverse de ce qu'on demande. */
  it('borne aussi les animations en boucle quand on demande moins de mouvement', () => {
    /* LA FEUILLE EN COMPTE PLUSIEURS — le curseur a le sien. On retient celui
       qui borne les animations, puisque c'est de lui qu'il s'agit. */
    const bloc =
      [...sheet.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
        .map((match) => match[1])
        .find((body) => /animation-duration/.test(body)) ?? '';

    expect(bloc, 'Le filet anti-mouvement est introuvable.').not.toBe('');
    expect(bloc).toMatch(/animation-duration:\s*0\.01ms/);
    expect(
      bloc,
      'Sans plafond d’itérations, une animation `infinite` se rejoue une fois ' +
        'par centième de milliseconde au lieu de s’arrêter.',
    ).toMatch(/animation-iteration-count:\s*1/);
  });
});

/* =============================================================================
   LE SECOND AUDIT : CE QUE LA PREMIÈRE CORRECTION AVAIT LAISSÉ AUX VOISINS.

   `Input` avait sorti son message du `<label>`, et le commentaire expliquait
   pourquoi : enveloppé avec le champ, un texte d'aide entre dans son NOM. Ses
   trois voisins — le sélecteur, la case, le curseur — n'avaient pas suivi.
   Le pire des trois est le curseur : sa valeur étant DANS le libellé, son nom
   accessible changeait à chaque cran.
   ========================================================================== */
describe('le nom des champs ne contient que leur libellé', () => {
  it('Select décrit son aide au lieu de la nommer', () => {
    render(<Select label="Pays" helperText="Choisissez votre pays de résidence" />);

    const champ = screen.getByRole('combobox', { name: 'Pays' });

    expect(champ).toBeInTheDocument();
    expect(champ).toHaveAccessibleDescription('Choisissez votre pays de résidence');
  });

  it('Checkbox décrit sa description au lieu de la nommer', () => {
    render(<Checkbox label="Recevoir les notifications" description="Les nouveautés du system." />);

    const case_ = screen.getByRole('checkbox', { name: 'Recevoir les notifications' });

    expect(case_).toBeInTheDocument();
    expect(case_).toHaveAccessibleDescription('Les nouveautés du system.');
  });

  /* LE NOM D'UN CURSEUR NE DOIT PAS BOUGER QUAND SA VALEUR BOUGE : une
     commande vocale visant « Volume » échouerait dès le premier cran, et un
     lecteur d'écran réannoncerait le contrôle à chaque flèche. */
  it('Slider garde le même nom quand sa valeur change', () => {
    const { rerender } = render(<Slider label="Volume" value={42} valueLabel="42 %" readOnly />);

    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();

    rerender(<Slider label="Volume" value={43} valueLabel="43 %" readOnly />);

    expect(
      screen.getByRole('slider', { name: 'Volume' }),
      'Le nom du curseur a suivi sa valeur : toute commande vocale le perd.',
    ).toBeInTheDocument();
  });

  it('MultiSelect relie son aide et ne désigne pas une option absente', () => {
    const { container, rerender } = render(
      <MultiSelect label="Domaines" helperText="Deux au plus." />,
    );

    const liste = screen.getByRole('listbox');

    expect(liste).toHaveAccessibleDescription('Deux au plus.');
    expect(
      liste.getAttribute('aria-activedescendant'),
      'Sans option, la référence ne résout rien.',
    ).toBeNull();

    rerender(
      <MultiSelect
        label="Domaines"
        options={[{ value: 'a', label: 'A' }]}
        helperText="Deux au plus."
      />,
    );

    const actif = screen.getByRole('listbox').getAttribute('aria-activedescendant');

    expect(actif).not.toBeNull();
    expect(container.querySelector(`#${CSS.escape(actif ?? '')}`)).not.toBeNull();
  });

  /* LA ZONE DE DÉPÔT MONTRE LE FOCUS DE SON CHAMP. Le natif est masqué par
     découpage, et un `clip-path` rogne l'anneau du navigateur : il fallait le
     dessiner sur la zone, qui est ce que l'on voit. jsdom ne peint pas, donc
     c'est la feuille qu'on lit. */
  it('dessine le focus de la zone de dépôt sur la zone', () => {
    render(<Dropzone />);

    const sheet = opaleSheet.replace(/\/\*[\s\S]*?\*\//g, '');

    expect(
      sheet,
      'Le champ est masqué par découpage : son anneau est rogné. Sans règle ' +
        'sur la zone, tabuler dedans ne change pas un pixel (WCAG 2.4.7).',
    ).toMatch(/\.opale-dropzone:focus-within\s*\{[^}]*outline:/);
  });

  it('souligne les liens du fil d’Ariane', () => {
    const sheet = opaleSheet.replace(/\/\*[\s\S]*?\*\//g, '');
    const rule = /\.opale-breadcrumb a\s*\{([^}]*)\}/.exec(sheet)?.[1] ?? '';

    expect(rule, 'La règle des liens du fil est introuvable.').not.toBe('');
    expect(
      rule,
      'Contre le gris qui l’entoure, le primaire ne donne que 1,08:1 : sans ' +
        'soulignement, rien ne dit qu’un maillon est cliquable (WCAG 1.4.1).',
    ).toMatch(/text-decoration:\s*underline/);
  });
});

/* =============================================================================
   LA NOTE FRACTIONNAIRE.

   `Rating` comparait `index + 1 <= value` : 3,75 dessinait donc exactement les
   mêmes trois étoiles que 3,0, et les trois quarts disparaissaient — sans que
   rien ne le signale, ni à l'écran ni dans le nom accessible. Les cas
   ci-dessous tiennent les cinq états d'UNE étoile, l'arrondi au quart, et le
   fait que le dessin et l'annonce disent la même note.
   ========================================================================== */
describe('Rating — le remplissage au quart', () => {
  /** La fraction peinte, étoile par étoile, lue sur le dessin lui-même. */
  function fills(container: HTMLElement): readonly string[] {
    return [...container.querySelectorAll('.opale-rating__star')].map(
      (node) => node.getAttribute('data-opale-rating-fill') ?? '',
    );
  }

  it('devrait remplir les étoiles pleines, le quart demandé, puis rien', () => {
    const { container } = render(<Rating value={3.75} max={5} />);

    expect(fills(container)).toEqual(['1', '1', '1', '0.75', '0']);
  });

  it.each([
    [0.25, '0.25'],
    [0.5, '0.5'],
    [0.75, '0.75'],
    [1, '1'],
  ])('devrait peindre %s comme la fraction %s de la première étoile', (value, expected) => {
    const { container } = render(<Rating value={value} max={5} />);

    expect(fills(container)[0]).toBe(expected);
  });

  /* LA TABLE DE COUPE EST SYMÉTRIQUE ET MONOTONE. Symétrique parce que
     l'étoile l'est ; monotone parce qu'une note plus haute doit toujours
     peindre plus. Une valeur recopiée de travers casserait l'une des deux
     sans rien casser d'autre. */
  it('devrait couper de plus en plus loin à mesure que la note monte', () => {
    const coupes = [0, 0.25, 0.5, 0.75, 1].map((value) => {
      const { container } = render(<Rating value={value} max={1} />);
      const arret = container.querySelectorAll('.opale-rating__star stop')[0];

      return Number.parseFloat(arret.getAttribute('offset') ?? '0');
    });

    expect(coupes).toEqual([...coupes].sort((a, b) => a - b));
    expect(coupes[0]).toBe(0);
    expect(coupes[4]).toBe(100);
    expect(coupes[2]).toBe(50);
    expect(coupes[1] + coupes[3]).toBeCloseTo(100, 5);
  });

  /* L'ARRONDI EST FAIT UNE SEULE FOIS, AVANT LE DESSIN ET AVANT L'ANNONCE.
     Arrondir au rendu seulement laisserait le lecteur d'écran dire « 3,7 sur
     5 » devant trois étoiles et trois quarts : deux notes selon qu'on voit ou
     qu'on écoute. */
  it('devrait ramener une note hors pas sur le quart le plus proche, dessin et annonce ensemble', () => {
    const { container } = render(<Rating value={3.7} max={5} />);

    expect(fills(container)[3]).toBe('0.75');
    expect(screen.getByRole('img', { name: '3,75 sur 5' })).toBeInTheDocument();
  });

  it('devrait annoncer la note décimale à la française', () => {
    render(<Rating value={2.5} max={5} />);

    expect(screen.getByRole('img', { name: '2,5 sur 5' })).toBeInTheDocument();
  });

  it.each([
    [-2, '0 sur 5'],
    [12, '5 sur 5'],
    [Number.NaN, '0 sur 5'],
  ])('devrait borner une note de %s à « %s »', (value, name) => {
    render(<Rating value={value} max={5} />);

    expect(screen.getByRole('img', { name })).toBeInTheDocument();
  });

  /* LE CONTOUR RESTE SOUS LE PLEIN. Peindre seulement la fraction laisserait
     une étoile à un quart sans silhouette : on ne verrait qu'un moignon, et
     `max` deviendrait indevinable. */
  it('devrait poser autant d’étoiles que de max, quelle que soit la note', () => {
    const { container } = render(<Rating value={1.25} max={5} />);

    expect(container.querySelectorAll('.opale-rating__star')).toHaveLength(5);
  });

  /* LA COUPE EST NETTE, ET C'EST CE QUI REND LA FRACTION LISIBLE. Deux arrêts
     de dégradé au même décalage : écartés, ils donneraient un fondu, donc une
     étoile dont on ne saurait plus dire où elle s'arrête. */
  /* LA COUPE N'EST PAS À 75 % DE LA LARGEUR, ET C'EST LE POINT. Une étoile n'a
     pas son encre répartie uniformément : mesuré sur ce tracé, couper à 75 %
     de la largeur en peint 86,8 %, et couper à 25 % n'en peint que 14,1 %. Les
     décalages attendus ici sont ceux qui peignent VRAIMENT la fraction
     annoncée — modifier le tracé de l'étoile oblige à reprendre la mesure. */
  it('devrait couper net, par deux arrêts de dégradé au même décalage', () => {
    const { container } = render(<Rating value={3.75} max={5} />);

    const arrets = [...container.querySelectorAll('.opale-rating__star')[3].querySelectorAll('stop')];

    expect(arrets).toHaveLength(2);
    expect(arrets[0].getAttribute('offset')).toBe('66.40%');
    expect(arrets[1].getAttribute('offset')).toBe('66.40%');
    expect(arrets[1].getAttribute('stop-opacity')).toBe('0');
  });

  /* LE DÉGRADÉ EST NOMMÉ PAR `useId`, DONC UNIQUE PAR INSTANCE. Un
     identifiant en dur ferait que deux rangées sur la même page partagent
     leur coupe : la seconde afficherait la note de la première. */
  it('devrait donner à chaque rangée ses propres dégradés', () => {
    const { container } = render(
      <>
        <Rating value={1} max={2} />
        <Rating value={2} max={2} />
      </>,
    );

    const ids = [...container.querySelectorAll('linearGradient')].map((n) => n.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  /* LE CONTOUR EST TOUJOURS PEINT. Sans lui, une étoile au quart n'est qu'un
     moignon : on ne voit « un quart » que si l'on voit aussi le tout. */
  it('devrait tracer le contour de chaque étoile, même vide', () => {
    const { container } = render(<Rating value={0} max={5} />);

    const contours = [...container.querySelectorAll('.opale-rating__star path')].filter(
      (p) => p.getAttribute('stroke') === 'currentColor',
    );

    expect(contours).toHaveLength(5);
  });
});

/* =============================================================================
   LE BARÈME DU `Rating` EST UNE ENTRÉE COMME UNE AUTRE.

   `value` était borné, `max` ne l'était pas — alors qu'il sert de plafond au
   clamp, de compte à `Array.from` et de second terme au nom accessible. Les
   trois valeurs ci-dessous viennent toutes d'un calcul plausible : une moyenne
   sur zéro élément, un barème lu dans une API, un barème décimal.
   ========================================================================== */
describe('Rating — le barème', () => {
  it('devrait retomber sur cinq quand le barème n’est pas un nombre', () => {
    render(<Rating value={3} max={Number.NaN} />);

    expect(screen.getByRole('img', { name: '3 sur 5' })).toBeInTheDocument();
  });

  /* `Array.from({ length: Infinity })` boucle sur 2⁵³−1 : l'onglet gèle. Ce
     cas ne se voit pas en relecture — il ressemble à un rendu lent. */
  it('devrait retomber sur cinq plutôt que de boucler sur un barème infini', () => {
    const { container } = render(<Rating value={3} max={Number.POSITIVE_INFINITY} />);

    expect(container.querySelectorAll('.opale-rating__star')).toHaveLength(5);
  });

  /* UN BARÈME DÉCIMAL MÉLANGEAIT DEUX ÉCRITURES DANS LA MÊME PHRASE : « 3,75
     sur 4.5 », virgule pour la note et point pour le barème — exactement ce
     que `formatRating` existe pour éviter —, avec quatre étoiles dessinées
     pour un barème annoncé de quatre et demi. */
  it('devrait arrondir un barème décimal à l’entier, dessin et annonce ensemble', () => {
    const { container } = render(<Rating value={3.75} max={4.5} />);

    expect(container.querySelectorAll('.opale-rating__star')).toHaveLength(5);
    expect(screen.getByRole('img', { name: '3,75 sur 5' })).toBeInTheDocument();
  });

  it.each([0, -3])('devrait ramener un barème de %s à une étoile', (max) => {
    const { container } = render(<Rating value={1} max={max} />);

    expect(container.querySelectorAll('.opale-rating__star')).toHaveLength(1);
    expect(screen.getByRole('img', { name: '1 sur 1' })).toBeInTheDocument();
  });

  it('devrait plafonner le barème à vingt étoiles', () => {
    const { container } = render(<Rating value={3} max={400} />);

    expect(container.querySelectorAll('.opale-rating__star')).toHaveLength(20);
  });
});

/* =============================================================================
   LA CONSÉQUENCE D'UNE CONFIRMATION APPARTIENT AU DIALOGUE.

   Relevé sur le dialogue ouvert, `aria-describedby` valait `null` : « Cette
   action est irréversible » ne faisait partie ni du nom ni de la description
   du dialogue. La plupart des lecteurs d'écran lisent le contenu quand le
   panneau prend le focus — ce n'était donc pas bloquant —, mais sur une
   confirmation DESTRUCTRICE la conséquence doit être annoncée AVEC la
   question. `Modal` savait la poser ; `ConfirmDialog` ne la lui passait pas.
   ========================================================================== */
describe('ConfirmDialog — la description', () => {
  it('devrait décrire le dialogue par son corps', () => {
    render(
      <ConfirmDialog open title="Supprimer le fichier ?">
        Cette action est irréversible.
      </ConfirmDialog>,
    );

    const dialogue = screen.getByRole('dialog');
    const id = dialogue.getAttribute('aria-describedby');

    expect(id).toBeTruthy();
    expect(document.getElementById(id as string)).toHaveTextContent(
      'Cette action est irréversible.',
    );
  });

  it('devrait garder son titre comme nom accessible', () => {
    render(<ConfirmDialog open title="Supprimer le fichier ?">Irréversible.</ConfirmDialog>);

    expect(screen.getByRole('dialog', { name: 'Supprimer le fichier ?' })).toBeInTheDocument();
  });

  it('ne devrait rien décrire quand il n’a pas de corps', () => {
    render(<ConfirmDialog open title="Confirmer ?" />);

    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });
});
