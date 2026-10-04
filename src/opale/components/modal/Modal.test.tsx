import modalStyles from './style/Modal.module.css?raw';
import modalClasses from './style/Modal.module.css';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import Modal, { type ModalProps } from './Modal';
import { ToastProvider, useToast } from '../toast';
import { declarations, selectorsDeclaring } from '../../../test/css-rules';

/* =============================================================================
   LES SIX CAS D'ORIGINE SONT TOUS LÀ, ET AUCUN N'A ÉTÉ AFFAIBLI.

   Ils tenaient le contrat visible du composant — rendu, voile, Échap, portail,
   verrou de défilement — et c'est ce contrat que la réécriture devait garder
   intact. Ils sont repris À L'IDENTIQUE dans leurs assertions ; seul leur
   habillage suit le style du dépôt (français, `getByRole` plutôt que
   `getByTestId` là où le rôle existait déjà).

   CE QUI EST AJOUTÉ TIENT LE CONTRAT QUI N'ÉTAIT PAS TESTÉ, c'est-à-dire
   exactement celui que la réécriture apporte : piège de focus, restitution du
   focus au déclencheur, inertie de l'arrière-plan. Un motif de dialogue dont
   ces trois-là ne sont pas mesurés est un motif dont on espère qu'il marche.
   ========================================================================== */

const renderModal = (props?: Partial<ModalProps>) => {
  const onOpenChange = vi.fn();

  const result = render(
    <Modal
      open
      onOpenChange={onOpenChange}
      title="Glass modal"
      description="Keeps the focus on your content."
      footer={<span>Footer actions</span>}
      {...props}
    >
      <p>Modal body content</p>
    </Modal>,
  );

  return { ...result, onOpenChange };
};

describe('Modal', () => {
  it('rend le contenu du dialogue à l’ouverture', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Glass modal' })).toBeInTheDocument();
    expect(screen.getByText('Modal body content')).toBeInTheDocument();
  });

  it('appelle onOpenChange au clic sur le voile', () => {
    const { onOpenChange } = renderModal();

    const overlay = screen.getByTestId('modal-overlay');
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('ne ferme pas quand le clic sur le voile est désarmé', () => {
    const { onOpenChange } = renderModal({ closeOnOverlay: false });

    const overlay = screen.getByTestId('modal-overlay');
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay);

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('appelle onOpenChange sur Échap', () => {
    const { onOpenChange } = renderModal();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('se portaille dans le body par défaut', () => {
    renderModal();

    const modalContainer = screen.getByTestId('modal-container');
    expect(modalContainer.parentElement!.tagName).toBe('BODY');
  });

  it('verrouille le défilement du body à l’ouverture et le restaure à la fermeture', () => {
    const { rerender } = render(
      <Modal open onOpenChange={() => {}} title="Glass modal">
        <p>Modal body content</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal open={false} onOpenChange={() => {}} title="Glass modal">
        <p>Modal body content</p>
      </Modal>,
    );

    expect(document.body.style.overflow).toBe('');
  });

  /* ---------------------------------------------------------------------- */

  it('donne le focus au panneau à l’ouverture', () => {
    renderModal();

    expect(screen.getByRole('dialog', { name: 'Glass modal' })).toHaveFocus();
  });

  it('rend le focus au déclencheur à la fermeture', () => {
    /* LE DÉCLENCHEUR DOIT VIVRE HORS DU MODAL ET SURVIVRE À SA FERMETURE :
       c'est tout le cas d'usage. On le rend donc à côté, et on le focalise à
       la main avant l'ouverture — ce que fait un vrai clic. */
    const Harness = ({ open }: { open: boolean }) => (
      <>
        <button type="button">Ouvrir</button>
        <Modal open={open} onOpenChange={() => {}} title="Glass modal">
          <p>Modal body content</p>
        </Modal>
      </>
    );

    const { rerender } = render(<Harness open={false} />);
    const trigger = screen.getByRole('button', { name: 'Ouvrir' });
    trigger.focus();
    expect(trigger).toHaveFocus();

    rerender(<Harness open />);
    expect(trigger).not.toHaveFocus();

    rerender(<Harness open={false} />);
    expect(trigger).toHaveFocus();
  });

  it('piège la tabulation entre le premier et le dernier élément focusable', () => {
    render(
      <Modal
        open
        onOpenChange={() => {}}
        title="Glass modal"
        footer={<button type="button">OK</button>}
      >
        <button type="button">Dans le corps</button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Glass modal' });
    const close = screen.getByRole('button', { name: 'Fermer' });
    const last = screen.getByRole('button', { name: 'OK' });

    /* `Tab` depuis le dernier revient au premier. On ne teste pas les pas
       intermédiaires : ils appartiennent au navigateur, et jsdom ne les joue
       pas — c'est précisément pour ça que le piège ne s'occupe que des bords. */
    last.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(close).toHaveFocus();

    /* `Shift+Tab` depuis le premier repart au dernier. */
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('retient le focus sur le panneau quand le dialogue n’a aucun élément focusable', () => {
    /* Sans `onClose` ni `onOpenChange`, la croix n'est pas rendue : le
       dialogue n'a plus rien de focusable, et la tabulation s'échapperait vers
       une page rendue inerte, c'est-à-dire nulle part. */
    render(
      <Modal open title="Glass modal">
        <p>Modal body content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Glass modal' });
    fireEvent.keyDown(dialog, { key: 'Tab' });

    expect(dialog).toHaveFocus();
  });

  it('rend l’arrière-plan inerte le temps de l’ouverture, et le restitue ensuite', () => {
    const Harness = ({ open }: { open: boolean }) => (
      <>
        <button type="button">Derrière</button>
        <Modal open={open} onOpenChange={() => {}} title="Glass modal">
          <p>Modal body content</p>
        </Modal>
      </>
    );

    const { rerender, baseElement } = render(<Harness open={false} />);

    /* Le conteneur de rendu de Testing Library est un frère du portail : c'est
       lui, l'arrière-plan, dans ce test. */
    const background = baseElement.querySelector('div')!;
    expect(background).not.toHaveAttribute('inert');

    rerender(<Harness open />);
    expect(background).toHaveAttribute('inert');
    expect(background).toHaveAttribute('aria-hidden', 'true');

    rerender(<Harness open={false} />);
    expect(background).not.toHaveAttribute('inert');
    expect(background).not.toHaveAttribute('aria-hidden');
  });

  /* A11Y-02 — un « Enregistré » lancé depuis la modale n'était pas annoncé :
     les régions live des toasts, portées dans `<body>`, recevaient `inert` et
     `aria-hidden` comme le reste de l'arrière-plan. */
  it('laisse les toasts audibles et cliquables pendant l’ouverture', () => {
    const Emit = () => {
      const { showToast } = useToast();
      return (
        <button type="button" onClick={() => showToast({ title: 'Enregistré', duration: 0 })}>
          Enregistrer
        </button>
      );
    };

    const { baseElement } = render(
      <ToastProvider>
        <button type="button">Derrière</button>
        <Modal open onOpenChange={() => {}} title="Glass modal">
          <Emit />
        </Modal>
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    const portal = screen.getByTestId('toast-portal');
    for (
      let node: HTMLElement | null = portal;
      node && node !== baseElement;
      node = node.parentElement
    ) {
      expect(node).not.toHaveAttribute('inert');
      expect(node).not.toHaveAttribute('aria-hidden');
    }
    expect(
      screen.getAllByRole('status').some((region) => region.textContent?.includes('Enregistré')),
    ).toBe(true);
    expect(baseElement.querySelector('div')).toHaveAttribute('inert');
  });

  it('épargne une région exemptée même rendue au fond d’un arrière-plan', () => {
    const { baseElement } = render(
      <>
        <div data-testid="app">
          <p>Contenu</p>
          <div data-opale-modal-exempt="" data-testid="live" />
        </div>
        <Modal open onOpenChange={() => {}} title="Glass modal">
          <p>Modal body content</p>
        </Modal>
      </>,
    );

    expect(screen.getByTestId('live')).not.toHaveAttribute('inert');
    expect(screen.getByTestId('app')).not.toHaveAttribute('inert');
    expect(screen.getByText('Contenu')).toHaveAttribute('inert');
    expect(baseElement).not.toHaveAttribute('inert');
  });

  it('n’expose aucun dialogue quand il est fermé', () => {
    render(
      <Modal open={false} onOpenChange={() => {}} title="Glass modal">
        <p>Modal body content</p>
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('modal-container')).not.toBeInTheDocument();
  });

  it('laisse l’appelant surcharger le nom accessible sans perdre role ni aria-modal', () => {
    /* `{...rest}` passe désormais AVANT les attributs du contrat : un appelant
       ne peut plus casser le motif en posant son propre `role`, mais il garde
       la main sur le nom. */
    render(
      <Modal
        open
        onOpenChange={() => {}}
        aria-label="Dialogue nommé par l’appelant"
        role="alertdialog"
      >
        <p>Modal body content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Dialogue nommé par l’appelant' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});

/* =============================================================================
   LE FOCUS REVIENT AU DÉCLENCHEUR PAR LES TROIS SORTIES, ET L'ARRIÈRE-PLAN
   N'EST INERTE QUE LE TEMPS DE L'OUVERTURE.

   LE DÉFAUT QUE CES CAS TIENNENT. React exécute les nettoyages dans l'ordre de
   déclaration des effets : si celui du focus passe avant celui de l'inertie,
   `focus()` vise un déclencheur encore `inert` et ne fait rien, sans erreur.
   Mesuré au navigateur sur les trois sorties : le focus retombait sur
   `<body>`.

   CE GARDE LISAIT LA SOURCE, et il ne tenait que l'ordre de deux COMMENTAIRES :
   renommer l'un le rougissait, déplacer le code sans ses commentaires le
   laissait vert. Il est remplacé par un rendu. jsdom n'implémente pas `inert`
   — c'est ce qui rendait le défaut invisible — ; `src/test/inert.ts` lui donne
   la seule sémantique en jeu ici, celle du navigateur : `focus()` sur un
   élément inerte est sans effet. Avec elle, inverser les deux effets fait
   rougir les trois cas ci-dessous.

   Les sorties sont jouées comme un utilisateur les joue (`userEvent`), sur un
   modal CONTRÔLÉ : c'est `onOpenChange` qui referme, pas le test.
   ========================================================================== */
describe('Modal — restitution du focus et inertie, par chaque sortie', () => {
  const Harness = () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Ouvrir
        </button>
        <Modal open={open} onOpenChange={setOpen} title="Glass modal">
          <p>Modal body content</p>
        </Modal>
      </>
    );
  };

  const exits = [
    ['Échap', (user: UserEvent) => user.keyboard('{Escape}')],
    [
      'le bouton Fermer',
      (user: UserEvent) => user.click(screen.getByRole('button', { name: 'Fermer' })),
    ],
    ['le clic sur le voile', (user: UserEvent) => user.click(screen.getByTestId('modal-overlay'))],
  ] as const;

  it.each(exits)(
    'devrait rendre le focus au déclencheur quand on ferme par %s',
    async (_, exit) => {
      const user = userEvent.setup();
      render(<Harness />);
      const trigger = screen.getByRole('button', { name: 'Ouvrir' });

      await user.click(trigger);
      expect(screen.getByRole('dialog', { name: 'Glass modal' })).toHaveFocus();

      await exit(user);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    },
  );

  it.each(exits)(
    'devrait rendre l’arrière-plan inerte pendant l’ouverture et plus après une fermeture par %s',
    async (_, exit) => {
      const user = userEvent.setup();
      render(<Harness />);
      const trigger = screen.getByRole('button', { name: 'Ouvrir' });

      await user.click(trigger);
      expect(trigger.closest('[inert]')).not.toBeNull();
      expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();

      await exit(user);

      expect(trigger.closest('[inert]')).toBeNull();
      expect(trigger.closest('[aria-hidden="true"]')).toBeNull();
    },
  );
});

/* =============================================================================
   LA SILHOUETTE DU PANNEAU ORIGINAL.

   `.panel` demande `border-radius: inherit`, ce qui est juste EN VERRE — il y
   est une couche de contenu dans l'enveloppe arrondie de `Glass`. En rendu
   original il n'y a pas d'enveloppe : `.shell` et `.panel` atterrissent sur le
   même élément, `inherit` remonte au conteneur du voile, qui n'a aucun rayon,
   et la valeur calculée tombe à zéro. Le dialogue original était un rectangle
   à angles vifs pendant que sa version en verre était arrondie, et rien ne le
   signalait : jsdom ne fait pas de mise en page, donc seul le TEXTE de la
   feuille peut porter ce garde.
   ========================================================================== */
describe('les contours du panneau original', () => {
  /** Ce que la feuille retient pour `.plain`, au premier niveau. */
  const plain = declarations(modalStyles, '.plain');

  it('devrait écrire son propre rayon plutôt que de l’hériter', () => {
    expect(plain.get('border-radius')).toBe('var(--opale-radius-lg)');
  });

  /* `--opale-divider` SEUL NE DESSINE PAS D'ARÊTE : mesuré, il tient 1,09:1
     contre la surface blanche. Le panneau doit donc porter une bordure tirée
     de l'encre du texte, qui suit les deux thèmes. */
  it('devrait porter une arête tirée de l’encre et non du seul filet de séparation', () => {
    expect(plain.get('border')).toMatch(/^1px solid color-mix\(in srgb, var\(--opale-text\) /);
  });

  it('devrait garder son ombre portée', () => {
    expect(plain.get('box-shadow')).toMatch(/var\(--opale-shadow-4\)$/);
  });
});

describe('la croix de fermeture', () => {
  it('devrait dessiner un tracé et non le caractère « × »', () => {
    render(<Modal open title="Confirmer" onOpenChange={() => {}} />);

    const croix = screen.getByRole('button', { name: 'Fermer' });

    expect(croix.querySelector('svg')).not.toBeNull();
    expect(croix.textContent).toBe('');
  });

  /* LE TRACÉ EST MASQUÉ, LE BOUTON EST NOMMÉ. Un `<svg>` exposé ferait
     énumérer des chemins par le lecteur d'écran par-dessus le nom du bouton. */
  it('devrait masquer son tracé aux technologies d’assistance', () => {
    render(<Modal open title="Confirmer" onOpenChange={() => {}} />);

    const svg = screen.getByRole('button', { name: 'Fermer' }).querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });
});

describe('l’en-tête sans titre', () => {
  /* `showHeader` EST VRAI DÈS QU'IL Y A UN `onClose` : une visionneuse
     d'image, un dialogue tout en contenu, posaient donc un bloc de titre VIDE
     à côté de leur croix — et depuis que l'en-tête tire un filet, une ligne
     pleine largeur sous un bouton isolé. */
  it('ne devrait pas poser de bloc de titre vide', () => {
    const { baseElement } = render(
      <Modal open onOpenChange={() => {}}>
        <img alt="Une photographie" src="/x.jpg" />
      </Modal>,
    );

    expect(baseElement.querySelector('h2')).toBeNull();
    expect(baseElement.querySelector('[class*="heading"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });

  it('devrait poser le bloc de titre dès qu’il y a un titre', () => {
    const { baseElement } = render(<Modal open title="Confirmer" onOpenChange={() => {}} />);

    expect(baseElement.querySelector('[class*="heading"]')).not.toBeNull();
  });

  /* LE BALISAGE NE SUFFIT PAS. `.header` est rendu même sans titre — c'est la
     croix qui l'exige —, donc si la feuille tirait son filet sur `.header` tout
     court, la ligne pleine largeur reviendrait sous un bouton isolé. jsdom ne
     fait pas de mise en page : seul le TEXTE de la feuille peut le tenir. */
  /* MÊME RAISON POUR LE PIED. Sans corps — une confirmation, depuis que sa
     phrase est passée en description —, les deux filets se retrouvaient face à
     face autour d'une bande vide. */
  /** Les sélecteurs qui tirent un filet, `@media` compris. */
  const filets = selectorsDeclaring(modalStyles, 'box-shadow');

  it('devrait conditionner le filet du pied à la présence d’un corps', () => {
    expect(filets).toContain('.body + .footer');
    expect(filets).not.toContain('.footer');
  });

  it('devrait conditionner le filet d’en-tête à la présence d’un titre', () => {
    expect(filets).toContain('.header:has(.heading)');
    expect(filets.filter((selector) => selector.endsWith('.header'))).toEqual([]);
  });
});

/* =============================================================================
   `open` + `onOpenChange`, ET L'ÉCHELLE `small | medium | large`.
   `onClose` et `sm | md | lg` restent acceptés : les cas ci-dessus qui les
   emploient prouvent que les anciens noms marchent encore.
   ========================================================================== */

describe('Modal — onOpenChange et taille', () => {
  it('devrait rendre la croix avec onOpenChange seul, et fermer par elle et par Échap', () => {
    const onOpenChange = vi.fn();
    render(<Modal open onOpenChange={onOpenChange} title="Réglages" />);

    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onOpenChange).toHaveBeenNthCalledWith(1, false);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
  });

  it.each([
    ['small', 'sm'],
    ['medium', 'md'],
    ['large', 'lg'],
  ] as const)('devrait poser la même classe pour size="%s" et size="%s"', (size, legacy) => {
    const { unmount } = render(<Modal open title="Canonique" size={size} />);
    const canonical = screen.getByRole('dialog').className;
    unmount();

    render(<Modal open title="Hérité" size={legacy} />);

    expect(screen.getByRole('dialog').className).toBe(canonical);
    expect(screen.getByRole('dialog')).toHaveClass(modalClasses[legacy]);
  });

  it('devrait garder medium par défaut', () => {
    render(<Modal open title="Défaut" />);

    expect(screen.getByRole('dialog')).toHaveClass(modalClasses.md);
  });
});
