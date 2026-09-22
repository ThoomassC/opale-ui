import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import opaleSheet from './opale.css?raw';
import {
  Button,
  CommandPalette,
  ConfirmDialog,
  Dropzone,
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
