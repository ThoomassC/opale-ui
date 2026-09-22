import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import opaleSheet from './opale.css?raw';
import { Opale } from './index';
import { CatalogPreview } from '../showcase/pages/catalog-preview';

/* =============================================================================
   `Opale.Toast` — LE TON ET LA PLACE.

   Le composant rendait une surface grise au milieu du flux : « Modifications
   enregistrées » et « Publication refusée » s'affichaient à l'identique, à
   l'endroit du code plutôt qu'à un endroit de l'écran. Les cas ci-dessous
   tiennent les deux réglages ajoutés, et surtout la politesse de l'annonce —
   qui est la seule partie que l'œil ne vérifie pas.
   ========================================================================== */

const TONES = ['neutral', 'success', 'warning', 'error', 'info'] as const;

const PLACEMENTS = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
] as const;

describe('la place à l’écran', () => {
  it.each(PLACEMENTS)('devrait ancrer le message en %s', (position) => {
    const { baseElement } = render(<Opale.Toast message="Publié" position={position} />);

    expect(baseElement.querySelector(`.opale-toast-anchor--${position}`)).not.toBeNull();
  });

  /* LE PORTAIL EST LE POINT. Rendu en flux, le message se serait affiché là où
     le composant est appelé — c'est-à-dire n'importe où —, ce qui rend la prop
     `position` décorative. Le conteneur de rendu reste donc VIDE. */
  it('devrait rendre le message hors de son conteneur d’appel', () => {
    const { container } = render(<Opale.Toast message="Publié" position="top-left" />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.getByText('Publié')).toBeInTheDocument();
  });

  it('devrait poser l’ancre en bas à droite par défaut', () => {
    const { baseElement } = render(<Opale.Toast message="Publié" />);

    expect(baseElement.querySelector('.opale-toast-anchor--bottom-right')).not.toBeNull();
  });
});

describe('le ton', () => {
  it.each(TONES)('devrait marquer le ton %s sur la carte', (tone) => {
    render(<Opale.Toast message="Publié" tone={tone} />);

    expect(screen.getByText('Publié').closest('[data-opale-toast-tone]')).toHaveAttribute(
      'data-opale-toast-tone',
      tone,
    );
  });

  /* LA COULEUR EST PORTÉE PAR UNE CLASSE, PAS SEULEMENT PAR UN ATTRIBUT DE
     DONNÉE : c'est la classe que la feuille lit. Un ton qui poserait
     l'attribut sans la classe serait annoncé et invisible. */
  it.each(['success', 'warning', 'error', 'info'] as const)(
    'devrait donner sa classe de couleur au ton %s',
    (tone) => {
      render(<Opale.Toast message="Publié" tone={tone} />);

      expect(screen.getByText('Publié').closest('.opale-toast')).toHaveClass(
        `opale-toast--${tone}`,
      );
    },
  );

  it('ne devrait pas colorer le ton neutre', () => {
    render(<Opale.Toast message="Publié" tone="neutral" />);

    expect(screen.getByText('Publié').closest('.opale-toast')?.className).not.toMatch(
      /opale-toast--/,
    );
  });
});

/* =============================================================================
   LA POLITESSE DE L'ANNONCE.

   C'est la moitié invisible du ton, et celle qu'aucune relecture visuelle ne
   rattrape : un échec annoncé poliment arrive après ce que l'utilisateur est
   en train de lire, donc trop tard pour l'empêcher d'agir.
   ========================================================================== */
describe('les régions live', () => {
  it.each(['error', 'warning'] as const)('devrait annoncer %s de façon assertive', (tone) => {
    render(<Opale.Toast message="Refusé" tone={tone} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Refusé');
  });

  it.each(['neutral', 'success', 'info'] as const)(
    'devrait annoncer %s poliment',
    (tone) => {
      render(<Opale.Toast message="Publié" tone={tone} />);

      expect(screen.getByRole('status')).toHaveTextContent('Publié');
    },
  );

  /* LES DEUX RÉGIONS SONT MONTÉES AVANT LE MESSAGE. Une région live insérée en
     même temps que son contenu n'est pas surveillée à l'instant de
     l'insertion : l'annonce se perd (WCAG 4.1.3). Fermé, le composant doit
     donc laisser ses deux régions en place et vides. */
  it('devrait garder ses deux régions montées quand il est fermé', () => {
    render(<Opale.Toast message="Publié" open={false} />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
  });
});

describe('la fermeture', () => {
  it('devrait nommer sa croix et appeler onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Opale.Toast message="Publié" onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Fermer la notification' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ne devrait pas poser de croix sans onClose', () => {
    render(<Opale.Toast message="Publié" />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});

/* =============================================================================
   L'APERÇU DU CATALOGUE DOIT PROPOSER TOUT CE QUE LE COMPOSANT ACCEPTE.

   Les deux listes de l'aperçu sont recopiées des types ; une place ajoutée au
   composant et oubliée là serait publiée sans pouvoir être essayée, ce que
   rien d'autre ne signale.
   ========================================================================== */
describe('l’aperçu du catalogue', () => {
  it('devrait offrir les six places et les cinq tons', () => {
    render(<CatalogPreview name="Toast" liquidGlass={false} />);

    const places = screen.getByRole('combobox', { name: 'Place à l’écran' });
    const tons = screen.getByRole('combobox', { name: 'Ton' });

    expect([...places.querySelectorAll('option')].map((o) => o.value)).toEqual([...PLACEMENTS]);
    expect([...tons.querySelectorAll('option')].map((o) => o.value)).toEqual([...TONES]);
  });

  /* « ÇA L'AFFICHE PILE LÀ OÙ C'EST INDIQUÉ DANS LE CODE » : la ligne montrée
     sous les sélecteurs et l'ancre réellement posée doivent citer la MÊME
     place. Les laisser diverger est précisément ce qui rendait l'aperçu
     inutile. */
  it('devrait poser l’ancre exactement là où sa ligne de code l’annonce', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(<CatalogPreview name="Toast" liquidGlass={false} />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Place à l’écran' }),
      'top-center',
    );

    expect(screen.getByText(/position="top-center"/)).toBeInTheDocument();
    expect(baseElement.querySelector('.opale-toast-anchor--top-center')).not.toBeNull();
  });
});

/* =============================================================================
   LA COULEUR N'EST PAS LE SEUL SIGNAL.

   Relevé dans le DOM avant correction : le balisage des cinq tons ne différait
   que par une variable de couleur — ni icône, ni titre, même encre. En vision
   des couleurs réduite, en contrastes forcés ou sur un écran monochrome,
   « La carte n'a pas été régénérée » et « Étape publiée » étaient le même
   objet. C'est WCAG 1.4.1, et la distinction status/alert n'y répond pas :
   elle sauve le lecteur d'écran, pas l'utilisateur voyant.
   ========================================================================== */
describe('le ton se voit autrement que par la couleur', () => {
  it.each(['success', 'warning', 'error', 'info'] as const)(
    'devrait doubler le ton %s par une icône',
    (tone) => {
      render(<Opale.Toast message="Publié" tone={tone} />);

      expect(screen.getByText('Publié').closest('.opale-toast')?.querySelector('svg')).not.toBeNull();
    },
  );

  /* LES QUATRE DESSINS DOIVENT DIFFÉRER ENTRE EUX, et la comparaison porte sur
     le TRACÉ ENTIER : `x-circle` et `info` partagent leur premier chemin — le
     cercle —, donc comparer le premier `<path>` aurait déclaré identiques deux
     icônes qui ne le sont pas, et laissé passer une vraie collision ailleurs. */
  it('devrait donner aux quatre tons colorés quatre dessins distincts', () => {
    const dessins = (['success', 'warning', 'error', 'info'] as const).map((tone) => {
      const vue = render(<Opale.Toast message={tone} tone={tone} />);
      const carte = vue.baseElement.querySelector(`[data-opale-toast-tone='${tone}']`);

      return [...(carte?.querySelectorAll('path') ?? [])].map((p) => p.getAttribute('d')).join('|');
    });

    expect(new Set(dessins).size).toBe(4);
  });

  /* `neutral` N'A PAS DE COULEUR, donc il n'a rien à doubler. Lui coller une
     icône reviendrait à inventer un ton là où le composant n'en annonce pas. */
  it('ne devrait pas poser d’icône sur le ton neutre', () => {
    render(<Opale.Toast message="Publié" tone="neutral" />);

    expect(screen.getByText('Publié').closest('.opale-toast')?.querySelector('svg')).toBeNull();
  });

  /* L'ICÔNE EST MUETTE : l'urgence est déjà portée par la région live dans
     laquelle le message entre. Un nom accessible ferait annoncer « attention »
     avant chaque avertissement. */
  it('devrait masquer l’icône de ton aux technologies d’assistance', () => {
    render(<Opale.Toast message="Refusé" tone="error" />);

    const svg = screen.getByText('Refusé').closest('.opale-toast')?.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

/* =============================================================================
   LE TON PLEIN.

   Le ton n'était qu'un filet de 4 px posé en `inset` À L'INTÉRIEUR d'un rayon
   de 1,375 rem : la bordure arrondie le rognait à ses deux extrémités, et il
   n'en restait qu'une virgule collée au bord gauche — environ un pour cent de
   la carte. Ce qui manquait à la couleur était de la SURFACE, pas de la
   saturation.

   CE QUE LE REMPLISSAGE COÛTE, et ce que les cas ci-dessous tiennent : le
   message se lit désormais SUR la couleur, donc le seuil applicable passe de
   3:1 à 4,5:1. Les jetons bruts ne le tiennent pas — l'ambre sous une encre
   claire donne 4,07:1 —, d'où l'assombrissement, qui est une condition de
   lisibilité et non un goût.
   ========================================================================== */
describe('le ton plein', () => {
  /** La feuille, commentaires retirés — jsdom ne fait pas de mise en page. */
  const sheet = opaleSheet.replace(/\/\*[\s\S]*?\*\//g, '');

  /** Le corps d'une règle, par son sélecteur exact. */
  function rule(selector: string): string {
    const debut = sheet.indexOf(`${selector} {`);
    expect(debut, `règle ${selector} absente`).toBeGreaterThan(-1);

    return sheet.slice(debut, sheet.indexOf('}', debut));
  }

  it('devrait peindre la carte avec le remplissage du ton et écrire avec son encre', () => {
    const carte = rule('.opale-toast');

    expect(carte).toMatch(/background:\s*var\(--opale-toast-fill, var\(--opale-surface\)\)/);
    expect(carte).toMatch(/color:\s*var\(--opale-toast-fill-ink, var\(--opale-text\)\)/);
  });

  /* LE REPLI EST CE QUI TIENT `neutral`. Sans ton, les deux variables ne sont
     pas déclarées : la carte doit retomber sur la surface et l'encre d'Opale,
     pas sur `transparent` — un message sans fond posé sur la page. */
  it('devrait rendre le ton neutre sur la surface d’Opale', () => {
    render(<Opale.Toast message="Publié" tone="neutral" />);

    const carte = screen.getByText('Publié').closest('.opale-toast');

    expect(carte?.className).not.toMatch(/opale-toast--/);
    expect(carte?.querySelector('svg')).toBeNull();
  });

  /* L'ASSOMBRISSEMENT EST LA CONDITION DE LISIBILITÉ. Sans lui, l'ambre sous
     une encre claire tient 4,07:1 — sous le seuil du texte. Le mélange porte
     le pire des quatre à 5,57:1. */
  it.each(['success', 'warning', 'error', 'info'] as const)(
    'devrait assombrir le remplissage du ton %s pour porter une encre claire',
    (tone) => {
      const corps = rule(`.opale-toast--${tone}`);

      expect(corps).toMatch(/--opale-toast-fill:\s*color-mix\(in srgb, var\(--opale-\w+\) 80%, var\(--opale-text\)\)/);
      expect(corps).toMatch(/--opale-toast-fill-ink:\s*#fbfaf9/);
    },
  );

  /* LES DEUX RÔLES S'ÉCHANGENT D'UN THÈME À L'AUTRE. Les jetons de
     remplissage ne sont pas redéfinis pour le sombre : une carte remplie avec
     eux, déjà assombrie de 20 %, serait un vert presque noir sur un sol noir. */
  it('devrait échanger le remplissage et l’encre en thème sombre', () => {
    const sombre = rule(":root[data-theme='dark'] .opale-toast");

    expect(sombre).toMatch(/--opale-toast-fill:\s*var\(--opale-toast-tone\)/);
    expect(sombre).toMatch(/--opale-toast-fill-ink:\s*#0c0f0d/);
  });

  /* LA CROIX EST POSÉE SUR LA COULEUR. Une encre secondaire y serait un gris
     sur du vert, et un anneau de focus bleu sur une carte rouge ne se verrait
     pas : les deux se composent à partir de l'encre de la carte. */
  it('devrait faire hériter la croix de l’encre de la carte', () => {
    expect(rule('.opale-toast__close')).toMatch(/color:\s*inherit/);
    expect(rule('.opale-toast__close:focus-visible')).toMatch(/outline:[^;]*currentColor/);
  });
});
