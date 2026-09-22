import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import opaleSheet from './opale.css?raw';
import {
  BackgroundSurface,
  Badge,
  Breadcrumb,
  Button,
  Countdown,
  DeleteButton,
  DescriptionList,
  Input,
  Map,
  ProgressBar,
  SelectionBar,
  Toast,
  CommandPalette,
  ConfirmDialog,
  Dropzone,
  Lightbox,
  Rating,
  SegmentedControl,
  SidePanel,
  StatusChip,
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
  /* `StatusChip` NE TRANSMETTAIT PAS LE TON. Sa démonstration affichait « En
     production » et « En révision » côte à côte, rendus À L'IDENTIQUE : deux
     statuts qu'on ne pouvait pas distinguer, dans un composant dont le seul
     objet est de distinguer des statuts. */
  it('laisse StatusChip distinguer deux statuts', () => {
    const { container } = render(
      <>
        <StatusChip status="En production" />
        <StatusChip status="En révision" tone="accent" />
      </>,
    );

    const chips = [...container.querySelectorAll('.opale-badge')];

    expect(chips).toHaveLength(2);
    expect(
      chips[0]?.className,
      'Deux statuts rendus avec les mêmes classes ne se distinguent pas.',
    ).not.toBe(chips[1]?.className);
  });

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

  /* LE BADGE RESTE LA RÉFÉRENCE : c'est vers lui que `StatusChip` est
     déprécié, donc son ton doit continuer de produire une classe distincte. */
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

  /* `role="img"` REND TOUS LES DESCENDANTS PRÉSENTATIONNELS. Les marqueurs
     passés en `children` restaient focalisables tout en devenant anonymes. */
  it('laisse voir ce qu’une carte contient', () => {
    const { container } = render(
      <Map>
        <button type="button">Paris</button>
      </Map>,
    );

    /* CE QUI SE VÉRIFIE EST LE RÔLE, PAS LA REQUÊTE.

       Une première version cherchait le bouton avec `getByRole` et passait
       AVEC `role="img"` remis : le test de mutation l'a montré. Testing
       Library interroge le DOM et n'applique pas la règle ARIA des enfants
       PRÉSENTATIONNELS — un vrai lecteur d'écran, si. Le test aurait donc
       certifié comme accessible un balisage qui efface ses propres marqueurs.

       C'est la cause qu'on épingle : `img` élague ses descendants, `group`
       les garde. */
    const carte = container.querySelector('.opale-map') as HTMLElement;

    expect(carte.getAttribute('role')).not.toBe('img');
    expect(
      carte,
      'Un conteneur qui reçoit des marqueurs en `children` ne peut pas se ' +
        'déclarer image : le rôle rendrait tous ses descendants présentationnels.',
    ).toHaveAttribute('role', 'group');
    expect(carte).toHaveAccessibleName('Carte');
  });

  /* L'ICÔNE DÉCORATIVE ENTRAIT DANS LE NOM DU BOUTON : « × Supprimer ». */
  it('garde l’icône d’un bouton hors de son nom', () => {
    render(<DeleteButton />);

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

  /* LE COMPTE CHANGEAIT SANS UN MOT ; LE DÉCOMPTE, LUI, PARLAIT CHAQUE
     SECONDE ET COUVRAIT LA PAGE. Les deux défauts sont symétriques. */
  it('annonce le compte de la sélection sans faire crier le décompte', () => {
    const { container, unmount } = render(<SelectionBar selectedCount={3} />);

    expect(container.querySelector('[aria-live]')).not.toBeNull();
    unmount();

    const { container: chrono } = render(<Countdown seconds={60} />);

    expect(
      chrono.querySelector('[aria-live]'),
      'Une valeur qui change chaque seconde monopolise la parole.',
    ).toBeNull();
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
