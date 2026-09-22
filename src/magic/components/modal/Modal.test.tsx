import modalSource from './Modal.tsx?raw';
import modalStyles from './style/Modal.module.css?raw';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Modal, { type ModalProps } from './Modal';

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
        <Modal open={open} onClose={() => {}} title="Glass modal">
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
      <Modal open onClose={() => {}} title="Glass modal" footer={<button type="button">OK</button>}>
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
        <Modal open={open} onClose={() => {}} title="Glass modal">
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

  it('n’expose aucun dialogue quand il est fermé', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Glass modal">
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
      <Modal open onClose={() => {}} aria-label="Dialogue nommé par l’appelant" role="alertdialog">
        <p>Modal body content</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Dialogue nommé par l’appelant' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});

/* =============================================================================
   L'ORDRE DES DEUX EFFETS EST LE CORRECTIF, ET AUCUN TEST DE RENDU NE PEUT LE
   VOIR.

   Le focus n'était jamais rendu au déclencheur : React exécute les nettoyages
   dans l'ORDRE DE DÉCLARATION, et celui du focus passait avant celui de
   l'inertie — `focus()` sur un élément encore `inert` ne fait rien, sans lever
   d'erreur. Mesuré au navigateur sur les trois sorties : le focus retombait
   sur `<body>`.

   POURQUOI CE GARDE LIT LA SOURCE PLUTÔT QUE DE RENDRE. jsdom N'IMPLÉMENTE PAS
   `inert` : le `focus()` y réussit, donc le test de restitution qui existe
   au-dessus passait AU VERT pendant tout le temps où le défaut était livré.
   Un test de comportement ne peut pas attraper ce bug ici ; seule la position
   relative des deux blocs le décide.
   ========================================================================== */
describe('l’ordre des effets de Modal', () => {
  it('déclare la restitution du focus APRÈS la levée de l’inertie', () => {
    const inertie = modalSource.indexOf("L'INERTIE DE L'ARRIÈRE-PLAN");
    const focus = modalSource.indexOf("CET EFFET EST DÉCLARÉ APRÈS CELUI DE L'INERTIE");

    expect(inertie, 'Le commentaire de l’effet d’inertie est introuvable.').toBeGreaterThan(-1);
    expect(focus, 'Le commentaire de l’effet de focus est introuvable.').toBeGreaterThan(-1);
    expect(
      focus,
      'L’effet de focus est déclaré AVANT celui de l’inertie. Son nettoyage ' +
        'rendra donc le focus au déclencheur pendant que l’arrière-plan porte ' +
        'encore `inert`, et l’appel sera sans effet — silencieusement. jsdom ne ' +
        'voit pas ce défaut : il n’implémente pas `inert`.',
    ).toBeGreaterThan(inertie);
  });
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
  /** Le corps de la règle `.plain`, commentaires retirés. */
  const plain = (() => {
    const sans = modalStyles.replace(/\/\*[\s\S]*?\*\//g, '');
    const debut = sans.indexOf('.plain {');
    return sans.slice(debut, sans.indexOf('}', debut));
  })();

  it('devrait écrire son propre rayon plutôt que de l’hériter', () => {
    expect(plain).toMatch(/border-radius:\s*var\(--opale-radius-lg\)/);
  });

  /* `--opale-divider` SEUL NE DESSINE PAS D'ARÊTE : mesuré, il tient 1,09:1
     contre la surface blanche. Le panneau doit donc porter un anneau tiré de
     l'encre du texte, qui suit les deux thèmes. */
  it('devrait porter une arête tirée de l’encre et non du seul filet de séparation', () => {
    expect(plain).toMatch(/color-mix\(in srgb, var\(--opale-text\)/);
  });

  it('devrait garder son ombre portée', () => {
    expect(plain).toMatch(/var\(--opale-shadow-4\)/);
  });
});

describe('la croix de fermeture', () => {
  it('devrait dessiner un tracé et non le caractère « × »', () => {
    render(<Modal open title="Confirmer" onClose={() => {}} />);

    const croix = screen.getByRole('button', { name: 'Fermer' });

    expect(croix.querySelector('svg')).not.toBeNull();
    expect(croix.textContent).toBe('');
  });

  /* LE TRACÉ EST MASQUÉ, LE BOUTON EST NOMMÉ. Un `<svg>` exposé ferait
     énumérer des chemins par le lecteur d'écran par-dessus le nom du bouton. */
  it('devrait masquer son tracé aux technologies d’assistance', () => {
    render(<Modal open title="Confirmer" onClose={() => {}} />);

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
      <Modal open onClose={() => {}}>
        <img alt="Une photographie" src="/x.jpg" />
      </Modal>,
    );

    expect(baseElement.querySelector('h2')).toBeNull();
    expect(baseElement.querySelector('[class*="heading"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
  });

  it('devrait poser le bloc de titre dès qu’il y a un titre', () => {
    const { baseElement } = render(<Modal open title="Confirmer" onClose={() => {}} />);

    expect(baseElement.querySelector('[class*="heading"]')).not.toBeNull();
  });

  /* LE BALISAGE NE SUFFIT PAS. `.header` est rendu même sans titre — c'est la
     croix qui l'exige —, donc si la feuille tirait son filet sur `.header` tout
     court, la ligne pleine largeur reviendrait sous un bouton isolé. jsdom ne
     fait pas de mise en page : seul le TEXTE de la feuille peut le tenir. */
  /* MÊME RAISON POUR LE PIED. Sans corps — une confirmation, depuis que sa
     phrase est passée en description —, les deux filets se retrouvaient face à
     face autour d'une bande vide. */
  it('devrait conditionner le filet du pied à la présence d’un corps', () => {
    const sans = modalStyles.replace(/\/\*[\s\S]*?\*\//g, '');

    expect(sans).toMatch(/\.body \+ \.footer\s*\{[^}]*box-shadow/);
    expect(sans).not.toMatch(/(^|\n)\.footer\s*\{[^}]*box-shadow/);
  });

  it('devrait conditionner le filet d’en-tête à la présence d’un titre', () => {
    const sans = modalStyles.replace(/\/\*[\s\S]*?\*\//g, '');

    expect(sans).toMatch(/\.header:has\(\.heading\)\s*\{[^}]*box-shadow/);
    expect(sans).not.toMatch(/\.header\s*\{[^}]*box-shadow/);
  });
});
