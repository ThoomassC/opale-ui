import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import opaleSheet from './opale.css?raw';
import { Modal } from './components/modal';
import {
  Badge,
  Breadcrumb,
  Card,
  Clipboard,
  COOKIE_CONSENT_KEY,
  CookieBanner,
  DataTable,
  Dropzone,
  InlineInput,
  readCookieConsent,
} from './opale';

/* ============================================================================
   LES PROMESSES QUE LE CODE TIENT DÉSORMAIS.

   La campagne des fiches honnêtes a réécrit trente-six descriptions pour
   qu'elles cessent d'annoncer ce qui n'existait pas. Huit de ces promesses
   valaient d'être TENUES plutôt qu'effacées : ce fichier fixe leur
   comportement. Chaque bloc dit ce qui manquait, et le test le reproduit.
   ========================================================================== */

const SHEET = opaleSheet.replace(/\/\*[\s\S]*?\*\//g, '');

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

/* ---------------------------------------------------------------------------
   Breadcrumb — la dernière étape sans lien n'était marquée nulle part.
   `aria-current` n'était posé que dans la branche `href` : or la dernière
   étape, qui est la page où l'on est, n'a presque jamais de lien.
   ------------------------------------------------------------------------- */
describe('Breadcrumb — la page courante', () => {
  it('devrait marquer la dernière étape même quand elle n’a pas de lien', () => {
    render(
      <Breadcrumb
        items={[
          { id: 'a', label: 'Accueil', href: '#a' },
          { id: 'b', label: 'Button' },
        ]}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(within(items[1]).getByText('Button')).toHaveAttribute('aria-current', 'page');
    expect(within(items[0]).getByRole('link')).not.toHaveAttribute('aria-current');
  });
});

/* ---------------------------------------------------------------------------
   Badge — le point de notification.
   ------------------------------------------------------------------------- */
describe('Badge — le point de notification', () => {
  it('devrait rendre un point dont le texte reste lu par les lecteurs d’écran', () => {
    const { container } = render(<Badge dot>3 messages non lus</Badge>);

    const badge = container.querySelector('.opale-badge');
    expect(badge).toHaveClass('opale-badge--dot');
    // Le texte n'est pas retiré : il est masqué à l'œil, pas à l'oreille.
    expect(screen.getByText('3 messages non lus')).toHaveClass('opale-visually-hidden');
  });

  it('devrait donner au point une taille fixe dans la feuille', () => {
    expect(SHEET).toMatch(/\.opale-badge--dot\s*\{[^}]*inline-size:/);
  });
});

/* ---------------------------------------------------------------------------
   Card — `elevation` posait une classe qu'aucune feuille ne servait :
   `elevation={3}` et `elevation={0}` rendaient la même ombre.
   ------------------------------------------------------------------------- */
describe('Card — les quatre élévations', () => {
  const shadowOf = (level: number) =>
    SHEET.match(new RegExp(`\\.opale-card--e${level}\\s*\\{[^}]*box-shadow:\\s*([^;]+);`))?.[1];

  it('devrait servir chacune des quatre classes d’élévation', () => {
    for (const level of [0, 1, 2, 3]) {
      expect(
        shadowOf(level),
        `.opale-card--e${level} n'est servie par aucune règle.`,
      ).toBeDefined();
    }
  });

  it('devrait donner quatre ombres distinctes, la première nulle', () => {
    const shadows = [0, 1, 2, 3].map(shadowOf);
    expect(shadows[0]).toBe('none');
    expect(new Set(shadows).size).toBe(4);
  });
});

/* ---------------------------------------------------------------------------
   Clipboard — « Copié » s'affichait même quand la copie échouait, et ne
   revenait jamais à son libellé.
   ------------------------------------------------------------------------- */
describe('Clipboard — l’état fugace et l’échec', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const click = async () => {
    fireEvent.click(screen.getByRole('button'));
    // Laisse la promesse de `writeText` se régler.
    await act(async () => {});
  };

  it('devrait annoncer la copie réussie, puis revenir à son libellé', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<Clipboard value="npm i opale">Copier</Clipboard>);

    await click();

    expect(writeText).toHaveBeenCalledWith('npm i opale');
    expect(screen.getByRole('button')).toHaveTextContent('Copié');
    expect(screen.getByRole('status')).toHaveTextContent('Copié dans le presse-papier');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('button')).toHaveTextContent('Copier');
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('devrait dire l’échec quand l’écriture est refusée', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('refusé'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<Clipboard value="x" />);

    await click();

    expect(screen.getByRole('button')).toHaveTextContent('Échec de la copie');
    expect(screen.getByRole('status')).toHaveTextContent('Échec de la copie');
  });

  it('devrait dire l’échec quand le presse-papier n’existe pas (HTTP hors localhost)', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
    render(<Clipboard value="x" />);

    await click();

    expect(screen.getByRole('button')).toHaveTextContent('Échec de la copie');
  });
});

/* ---------------------------------------------------------------------------
   CookieBanner — le bandeau réapparaissait à chaque visite, et ne proposait
   pas de refuser.
   ------------------------------------------------------------------------- */
describe('CookieBanner — la mémorisation du choix', () => {
  it('devrait mémoriser l’acceptation et ne plus s’afficher ensuite', () => {
    const onAccept = vi.fn();
    const { unmount } = render(<CookieBanner onAccept={onAccept} />);

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));

    expect(onAccept).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('accepted');
    expect(screen.queryByText('Cookies')).toBeNull();

    unmount();
    render(<CookieBanner />);
    expect(screen.queryByText('Cookies'), 'Le choix doit survivre à la visite.').toBeNull();
  });

  it('devrait proposer de refuser, et mémoriser le refus', () => {
    const onDecline = vi.fn();
    render(<CookieBanner onDecline={onDecline} />);

    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));

    expect(onDecline).toHaveBeenCalledOnce();
    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('declined');
    expect(screen.queryByText('Cookies')).toBeNull();
  });

  it('devrait lire la clé fournie, et ne rien écrire quand la mémoire est coupée', () => {
    window.localStorage.setItem('mon-site', 'accepted');
    const { unmount } = render(<CookieBanner storageKey="mon-site" />);
    expect(screen.queryByText('Cookies')).toBeNull();
    unmount();

    render(<CookieBanner storageKey={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));
    expect(window.localStorage.getItem(COOKIE_CONSENT_KEY)).toBeNull();
  });

  it('devrait ignorer une valeur stockée qu’il ne reconnaît pas', () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'peut-être');
    render(<CookieBanner />);
    expect(screen.getByText('Cookies')).toBeInTheDocument();
  });

  it('devrait fonctionner quand le stockage est inaccessible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqué');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqué');
    });
    render(<CookieBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));
    expect(screen.queryByText('Cookies')).toBeNull();
    vi.restoreAllMocks();
  });
});

/* ---------------------------------------------------------------------------
   DataTable — « tri, sélection et clavier » pour un `<table>` statique.
   ------------------------------------------------------------------------- */
describe('DataTable — le tri par colonne', () => {
  const columns = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'count', label: 'Usages', sortable: true },
    { key: 'note', label: 'Note' },
  ];
  const rows = [
    { name: 'Écran', count: 12, note: 'b' },
    { name: 'avatar', count: 3, note: 'a' },
    { name: 'Bouton', count: 120, note: 'c' },
  ];
  const firstColumn = () =>
    screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent);

  it('devrait garder l’ordre fourni tant que rien n’est trié', () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(firstColumn()).toEqual(['Écran', 'avatar', 'Bouton']);
    for (const header of screen.getAllByRole('columnheader')) {
      expect(header).not.toHaveAttribute('aria-sort');
    }
  });

  it('devrait trier au clic sur l’en-tête, puis inverser', () => {
    const onSortChange = vi.fn();
    render(<DataTable columns={columns} rows={rows} onSortChange={onSortChange} />);

    fireEvent.click(screen.getByRole('button', { name: /Nom/ }));
    // Ordre alphabétique français : casse et accents ne décident pas.
    expect(firstColumn()).toEqual(['avatar', 'Bouton', 'Écran']);
    expect(screen.getByRole('columnheader', { name: /Nom/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    expect(onSortChange).toHaveBeenLastCalledWith({ key: 'name', direction: 'ascending' });

    fireEvent.click(screen.getByRole('button', { name: /Nom/ }));
    expect(firstColumn()).toEqual(['Écran', 'Bouton', 'avatar']);
    expect(screen.getByRole('columnheader', { name: /Nom/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('devrait trier les nombres comme des nombres', () => {
    render(<DataTable columns={columns} rows={rows} />);
    fireEvent.click(screen.getByRole('button', { name: /Usages/ }));
    expect(firstColumn()).toEqual(['avatar', 'Écran', 'Bouton']);
  });

  it('devrait n’offrir de bouton qu’aux colonnes triables', () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(
      within(screen.getByRole('columnheader', { name: 'Note' })).queryByRole('button'),
    ).toBeNull();
  });

  it('devrait annoncer le tri, que `aria-sort` seul ne fait pas entendre', () => {
    render(<DataTable columns={columns} rows={rows} />);
    fireEvent.click(screen.getByRole('button', { name: /Usages/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Trié par Usages, ordre croissant');
  });

  it('devrait trier par `sortValue` quand la cellule n’est pas du texte', () => {
    render(
      <DataTable
        columns={[
          {
            key: 'size',
            label: 'Taille',
            sortable: true,
            sortValue: (row) => Number(row.bytes),
          },
        ]}
        rows={[
          { size: <strong>2 Mo</strong>, bytes: 2_000_000 },
          { size: <strong>3 ko</strong>, bytes: 3_000 },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Taille/ }));
    expect(firstColumn()).toEqual(['3 ko', '2 Mo']);
  });

  it('devrait partir d’un tri initial et rendre une légende', () => {
    render(
      <DataTable
        caption="Composants"
        columns={columns}
        rows={rows}
        defaultSort={{ key: 'count', direction: 'descending' }}
      />,
    );
    expect(screen.getByRole('table', { name: 'Composants' })).toBeInTheDocument();
    expect(firstColumn()).toEqual(['Bouton', 'Écran', 'avatar']);
  });
});

/* ---------------------------------------------------------------------------
   Dropzone — une « zone de dépôt » sans `onDrop` : un fichier lâché dessus
   était ignoré, ou ouvert par le navigateur à la place de la page.
   ------------------------------------------------------------------------- */
describe('Dropzone — le glisser-déposer', () => {
  const zone = () => document.querySelector('.opale-dropzone') as HTMLElement;

  it('devrait accepter un fichier lâché sur la zone', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);
    const file = new File(['x'], 'maquette.png', { type: 'image/png' });

    fireEvent.dragEnter(zone(), { dataTransfer: { files: [file], types: ['Files'] } });
    expect(zone()).toHaveAttribute('data-dragging', 'true');

    const drop = fireEvent.drop(zone(), { dataTransfer: { files: [file], types: ['Files'] } });

    expect(drop, 'Sans preventDefault, le navigateur ouvre le fichier.').toBe(false);
    expect(onFiles).toHaveBeenCalledOnce();
    expect(onFiles.mock.calls[0][0][0]).toBe(file);
    expect(zone()).not.toHaveAttribute('data-dragging');
  });

  it('devrait autoriser le dépôt en annulant dragover', () => {
    render(<Dropzone />);
    expect(fireEvent.dragOver(zone(), { dataTransfer: { files: [], types: ['Files'] } })).toBe(
      false,
    );
  });

  /* PASSER SUR UN ENFANT ÉMET `dragenter` SUR L'ENFANT, PUIS `dragleave` SUR
     LA ZONE. C'est cette séquence, et non `relatedTarget` — que jsdom ignore et
     que Safari laisse à `null` —, qui doit laisser la zone en survol. */
  it('devrait rester en survol quand le pointeur passe sur un enfant de la zone', () => {
    render(<Dropzone />);
    const title = zone().querySelector('strong') as HTMLElement;

    fireEvent.dragEnter(zone(), { dataTransfer: { files: [], types: ['Files'] } });
    fireEvent.dragEnter(title, { dataTransfer: { files: [], types: ['Files'] } });
    fireEvent.dragLeave(zone());
    expect(zone()).toHaveAttribute('data-dragging', 'true');

    fireEvent.dragLeave(title);
    expect(zone(), 'Sortir de l’enfant puis de la zone la quitte.').not.toHaveAttribute(
      'data-dragging',
    );
  });

  it('devrait quitter l’état de survol quand le fichier sort de la zone', () => {
    render(<Dropzone />);
    fireEvent.dragEnter(zone(), { dataTransfer: { files: [], types: ['Files'] } });
    fireEvent.dragLeave(zone());
    expect(zone()).not.toHaveAttribute('data-dragging');
  });

  it('devrait ne rien transmettre pour un dépôt sans fichier', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);
    fireEvent.drop(zone(), { dataTransfer: { files: [], types: ['text/plain'] } });
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('devrait montrer le survol dans la feuille', () => {
    expect(SHEET).toMatch(/\.opale-dropzone\[data-dragging='true'\]\s*\{/);
  });
});

/* ---------------------------------------------------------------------------
   InlineInput — un alias d'`Input` qui promettait Entrée et Échap.
   ------------------------------------------------------------------------- */
describe('InlineInput — Entrée valide, Échap rétablit', () => {
  it('devrait valider sur Entrée, sans soumettre le formulaire', () => {
    const onCommit = vi.fn();
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <InlineInput label="Nom" defaultValue="Opale" onCommit={onCommit} />
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Nom' });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Opale UI' } });
    const enter = fireEvent.keyDown(input, { key: 'Enter' });

    expect(onCommit).toHaveBeenCalledWith('Opale UI');
    expect(enter, 'Entrée doit valider le champ, pas le formulaire.').toBe(false);
  });

  it('devrait rétablir la valeur d’entrée sur Échap', () => {
    const onCancel = vi.fn();
    render(<InlineInput label="Nom" defaultValue="Opale" onCancel={onCancel} />);
    const input = screen.getByRole('textbox', { name: 'Nom' }) as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Brouillon' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input.value).toBe('Opale');
    expect(onCancel).toHaveBeenCalledWith('Opale');
  });

  it('devrait prendre pour référence la valeur validée, pas la toute première', () => {
    render(<InlineInput label="Nom" defaultValue="A" />);
    const input = screen.getByRole('textbox', { name: 'Nom' }) as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'B' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.change(input, { target: { value: 'C' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input.value).toBe('B');
  });

  it('devrait laisser passer les gestionnaires de l’appelant', () => {
    const onKeyDown = vi.fn();
    const onFocus = vi.fn();
    render(<InlineInput label="Nom" onKeyDown={onKeyDown} onFocus={onFocus} />);
    const input = screen.getByRole('textbox', { name: 'Nom' });

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'a' });

    expect(onFocus).toHaveBeenCalledOnce();
    expect(onKeyDown).toHaveBeenCalledOnce();
  });
});

/* ============================================================================
   CE QUE LA RELECTURE A TROUVÉ.

   Deux relectures croisées — bogues et accessibilité — ont éprouvé la
   première version de ces huit comportements. Chaque constat retenu est
   reproduit ici avant sa correction.
   ========================================================================== */

describe('InlineInput — ce que la relecture a trouvé', () => {
  /* Échap rétablissait le champ ET fermait la modale : la Modal écoute Échap
     sur `window`, et l'événement y remontait. On perdait tout le dialogue en
     voulant annuler une saisie. */
  it('devrait garder la modale ouverte quand Échap annule une saisie, et la fermer au second', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Renommer">
        <InlineInput label="Nom" defaultValue="A" />
      </Modal>,
    );
    const input = screen.getByRole('textbox', { name: 'Nom' }) as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'B' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input.value).toBe('A');
    expect(onClose, 'Annuler la saisie ne doit pas fermer le dialogue.').not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClose, 'Rien à annuler : Échap reprend son sens de fermeture.').toHaveBeenCalledOnce();
  });

  /* En japonais ou en chinois, l'Entrée qui confirme la conversion arrive avec
     `key === 'Enter'` : elle validait une saisie inachevée. */
  it('devrait ignorer Entrée et Échap pendant une composition IME', () => {
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    render(<InlineInput label="Nom" onCommit={onCommit} onCancel={onCancel} />);
    const input = screen.getByRole('textbox', { name: 'Nom' });

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    fireEvent.keyDown(input, { key: 'Escape', isComposing: true });

    expect(onCommit).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });

  /* Libre, Échap réécrivait le natif sans prévenir `onChange` : un brouillon
     tenu par l'appelant gardait la valeur abandonnée. Contrôlé, il fallait
     câbler `onCancel` en plus. */
  it('devrait prévenir onChange de la valeur rétablie, contrôlé comme libre', () => {
    function Controlled() {
      const [value, setValue] = useState('A');
      return (
        <InlineInput
          label="Nom"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
        />
      );
    }
    render(<Controlled />);
    const input = screen.getByRole('textbox', { name: 'Nom' }) as HTMLInputElement;

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'B' } });
    expect(input.value).toBe('B');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(input.value, 'Le parent doit recevoir la valeur rétablie.').toBe('A');
  });

  /* Quitter le champ par Tab laissait une valeur affichée et jamais validée :
     une perte silencieuse. La sortie valide, comme dans un tableur. */
  it('devrait valider à la sortie du champ quand la valeur a changé, et seulement alors', () => {
    const onCommit = vi.fn();
    render(<InlineInput label="Nom" defaultValue="A" onCommit={onCommit} />);
    const input = screen.getByRole('textbox', { name: 'Nom' });

    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'B' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith('B');
  });
});

describe('CookieBanner — ce que la relecture a trouvé', () => {
  /* Le bandeau relisait le choix et se taisait : `onAccept` n'était appelé
     qu'à la visite du clic. L'analytique démarrée par ce rappel ne démarrait
     donc plus jamais ensuite. Le choix mémorisé se lit au démarrage. */
  it('devrait exposer le choix mémorisé à qui démarre l’application', () => {
    expect(readCookieConsent()).toBeNull();
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    expect(readCookieConsent()).toBe('accepted');
    window.localStorage.setItem('autre', 'declined');
    expect(readCookieConsent('autre')).toBe('declined');
    window.localStorage.setItem('autre', 'peut-être');
    expect(readCookieConsent('autre')).toBeNull();
  });

  /* Un lien « Gérer mes cookies » qui pose `open={true}` ne rouvrait plus
     rien. `open`, s'il est passé, décide ; la mémoire ne décide que lorsqu'il
     ne l'est pas. */
  it('devrait se rouvrir quand l’appelant passe open, choix mémorisé ou pas', () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    render(<CookieBanner open />);
    expect(screen.getByRole('region', { name: 'Consentement aux cookies' })).toBeInTheDocument();
  });

  /* Les deux boutons vivaient dans une région `status` : un contenu présent
     au montage n'y est pas annoncé, et une région live n'est pas faite pour
     des contrôles. Un repère nommé se trouve, lui, par la liste des régions. */
  it('devrait être un repère nommé, et non une région live', () => {
    render(<CookieBanner />);
    const region = screen.getByRole('region', { name: 'Consentement aux cookies' });
    expect(region.closest('[role="status"], [role="alert"], [aria-live]')).toBeNull();
    expect(within(region).getAllByRole('button')).toHaveLength(2);
  });

  /* Le serveur n'a pas de stockage et rend le bandeau ; le client, qui lit
     « accepté », rendait `null` dès l'hydratation : React 19 signalait une
     erreur et reconstruisait le sous-arbre. */
  it('devrait s’hydrater sans erreur quand un choix est mémorisé', async () => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    const html = renderToString(<CookieBanner />);
    expect(html, 'Sans stockage, le serveur rend le bandeau.').toContain('Cookies');

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const onRecoverableError = vi.fn();

    await act(async () => {
      hydrateRoot(container, <CookieBanner />, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(container.textContent, 'Hydraté, le client lit le choix et masque.').not.toContain(
      'Cookies',
    );
    container.remove();
  });
});

describe('Badge — ce que la relecture a trouvé', () => {
  /* `[data-opale-glass] .opale-badge` pèse 0,2,0 et remplaçait le fond plein
     du point par une teinte à 62 % : sous verre, le point devenait
     translucide et perdait le contraste qui justifie son plein. */
  it('devrait garder le point plein sous verre', () => {
    expect(SHEET).toMatch(
      /\[data-opale-glass\] \.opale-badge\.opale-badge--dot[^{]*\{[^}]*background:\s*var\(--opale-badge-dot\)/,
    );
  });

  /* En contrastes forcés, `background` est remplacé par `Canvas` : le point
     prenait la couleur du fond et disparaissait. */
  it('devrait dessiner le point en contrastes forcés', () => {
    expect(SHEET).toMatch(
      /@media \(forced-colors: active\)\s*\{[^@]*\.opale-badge--dot\s*\{[^}]*CanvasText/,
    );
  });
});

describe('DataTable — ce que la relecture a trouvé', () => {
  const orderOf = (values: readonly (string | number)[]) => {
    cleanup();
    render(
      <DataTable
        columns={[
          {
            key: 'v',
            label: 'Valeur',
            sortable: true,
            sortValue: (row) => row.raw as string | number,
          },
        ]}
        rows={values.map((raw) => ({ v: String(raw), raw }))}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Valeur/ }));
    return screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => row.textContent);
  };

  /* Nombre contre nombre en arithmétique, nombre contre texte au collateur :
     `1.5 < "1.10" < 1.25 < 1.5`, un cycle. `Array.sort` n'a plus d'ordre
     défini, et le résultat dépend de l'ordre d'arrivée. */
  it('devrait trier une colonne mixte selon un ordre total, quel que soit l’ordre fourni', () => {
    const expected = ['1.25', '1.5', '1.10'];
    expect(orderOf([1.5, '1.10', 1.25])).toEqual(expected);
    expect(orderOf(['1.10', 1.25, 1.5])).toEqual(expected);
    expect(orderOf([1.25, 1.5, '1.10'])).toEqual(expected);
  });

  /* Un libellé qui n'est pas une chaîne faisait annoncer la clé technique :
     « Trié par uses ». */
  it('devrait annoncer sortLabel quand le libellé n’est pas du texte', () => {
    render(
      <DataTable
        columns={[
          {
            key: 'uses',
            label: <abbr title="Usages">Us.</abbr>,
            sortable: true,
            sortLabel: 'Usages',
          },
        ]}
        rows={[{ uses: 2 }, { uses: 1 }]}
      />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('status')).toHaveTextContent('Trié par Usages, ordre croissant');
  });
});

describe('Clipboard — ce que la relecture a trouvé', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  /* Deux copies en moins de deux secondes laissaient la région sur le même
     texte : la seconde n'était pas entendue. La région repasse par le vide. */
  it('devrait annoncer une seconde copie rapprochée', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<Clipboard value="x" />);

    fireEvent.click(screen.getByRole('button'));
    await act(async () => {});
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('status'), 'La région se vide avant de reparler.').toHaveTextContent(
      '',
    );
    await act(async () => {});
    expect(screen.getByRole('status')).toHaveTextContent('Copié dans le presse-papier');
  });

  /* L'échec s'effaçait au bout de deux secondes, avant qu'on ait pu le lire
     ou réagir. Il reste jusqu'au prochain essai. */
  it('devrait garder l’échec affiché jusqu’au prochain essai', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
    render(<Clipboard value="x" />);

    fireEvent.click(screen.getByRole('button'));
    await act(async () => {});
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByRole('button')).toHaveTextContent('Échec de la copie');
  });
});

describe('Card et Dropzone sous verre — ce que la relecture a trouvé', () => {
  /* Le verre clôt sa boîte (`overflow: hidden`) : l'ombre du cran, posée sur
     la carte, y était rognée. `elevation` ne changeait rien sous verre. Le
     cran passe à l'enveloppe, qui n'est rognée par rien. */
  it('devrait porter l’élévation sur l’enveloppe de verre', () => {
    const { container } = render(
      <Card liquidGlass elevation={3}>
        x
      </Card>,
    );
    expect(container.querySelector('.opale-card--glass-root--e3')).not.toBeNull();
    for (const level of [0, 1, 2, 3]) {
      expect(SHEET).toMatch(
        new RegExp(`\\.opale-card--glass-root--e${level}\\s*\\{[^}]*box-shadow:`),
      );
    }
  });

  it('devrait garder le survol du dépôt translucide sous verre', () => {
    expect(SHEET).toMatch(/\.opale-dropzone--glass\[data-dragging='true'\]\s*\{[^}]*transparent/);
  });
});
