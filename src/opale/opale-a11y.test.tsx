import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider, useToast } from './components/toast';
import toastClasses from './components/toast/style/Toast.module.css';
import {
  Card,
  Checkbox,
  CommandPalette,
  CookieBanner,
  DataTable,
  Donut,
  Input,
  Menu,
  MultiSelect,
  Navbar,
  Pagination,
  ProgressBar,
  Select,
  Slider,
  Toast,
  Toggle,
} from './opale';

/* Comportements d'accessibilité : focus, annonces, repères. */

afterEach(cleanup);

describe('Pagination', () => {
  it('rend le focus à la page courante quand « suivante » devient inactive', async () => {
    const user = userEvent.setup();
    render(<Pagination pageCount={3} defaultValue={2} />);
    const next = screen.getByRole('button', { name: 'Page suivante' });

    next.focus();
    await user.keyboard('{Enter}');

    expect(next).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveFocus();
  });

  it('rend le focus à la page courante quand « précédente » devient inactive', async () => {
    const user = userEvent.setup();
    render(<Pagination pageCount={3} defaultValue={2} />);
    const previous = screen.getByRole('button', { name: 'Page précédente' });

    await user.click(previous);

    expect(previous).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveFocus();
  });

  it('laisse le focus sur « suivante » tant qu’elle reste active', async () => {
    const user = userEvent.setup();
    render(<Pagination pageCount={5} defaultValue={2} />);
    const next = screen.getByRole('button', { name: 'Page suivante' });

    await user.click(next);

    expect(next).toHaveFocus();
  });
});

/** Peint à `height` px du bas de la fenêtre les éléments qui portent `className`. */
function paintAtBottom(className: string, height: number) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    if (!this.classList.contains(className)) return new DOMRect(0, 0, 0, 0);
    return new DOMRect(0, window.innerHeight - height, 300, height - 16);
  });
}

const bottomPadding = () =>
  document.documentElement.style.getPropertyValue('scroll-padding-bottom');

describe('Réserve de défilement sous les surfaces fixes du bas', () => {
  it('réserve la place du bandeau de cookies tant qu’il est affiché', () => {
    const rect = paintAtBottom('opale-cookie-banner-anchor', 120);

    const { rerender } = render(<CookieBanner storageKey={null} open />);
    expect(bottomPadding()).toBe('120px');

    rerender(<CookieBanner storageKey={null} open={false} />);
    expect(bottomPadding()).toBe('');
    rect.mockRestore();
  });

  it('réserve la place d’un toast ouvert en bas, et la rend à sa fermeture', () => {
    const rect = paintAtBottom('opale-toast', 80);

    const { rerender } = render(<Toast message="Enregistré" position="bottom-right" />);
    expect(bottomPadding()).toBe('80px');

    rerender(<Toast message="Enregistré" position="bottom-right" open={false} />);
    expect(bottomPadding()).toBe('');
    rect.mockRestore();
  });

  it('ne réserve rien en bas pour un toast du haut', () => {
    const rect = paintAtBottom('opale-toast', 80);

    render(<Toast message="Enregistré" position="top-right" />);

    expect(bottomPadding()).toBe('');
    rect.mockRestore();
  });

  it('réserve la place de la file quand un toast arrive en bas', () => {
    const rect = paintAtBottom(toastClasses.bottomCenter, 90);
    function Trigger() {
      const { showToast } = useToast();
      return (
        <button type="button" onClick={() => showToast({ title: 'Publié', duration: Infinity })}>
          Publier
        </button>
      );
    }
    render(
      <ToastProvider position="bottom-center">
        <Trigger />
      </ToastProvider>,
    );
    expect(bottomPadding()).toBe('');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Publier' }));
    });

    expect(bottomPadding()).toBe('90px');
    rect.mockRestore();
  });
});

describe('Repères : nom et présence', () => {
  it('garde le repère search d’un Input de recherche par défaut, et le nomme sur demande', () => {
    render(<Input type="search" label="Filtrer" searchLandmarkLabel="Filtre des étapes" />);

    expect(screen.getByRole('search', { name: 'Filtre des étapes' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Filtrer' })).toBeInTheDocument();
  });

  it('retire le repère search d’un Input avec searchLandmark={false}', () => {
    render(<Input type="search" label="Filtrer" searchLandmark={false} />);

    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Filtrer' })).toBeInTheDocument();
  });

  it('ne pose pas de repère search dans la CommandPalette libre', () => {
    render(<CommandPalette open />);

    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });

  it('nomme la Navbar par label, « Navigation » restant le défaut', () => {
    const items = [{ id: 'a', label: 'Accueil', href: '/' }];
    render(
      <>
        <Navbar items={items} />
        <Navbar items={items} label="Pied de page" />
      </>,
    );

    expect(screen.getByRole('navigation', { name: 'Navigation' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Pied de page' })).toBeInTheDocument();
  });

  it('transmet navigationLabel à la navigation du Menu', () => {
    render(
      <Menu open items={[{ id: 'a', label: 'Accueil', href: '/' }]} navigationLabel="Compte" />,
    );

    expect(screen.getByRole('navigation', { name: 'Compte' })).toBeInTheDocument();
  });
});

describe('Champs en erreur : error, aria-invalid et description', () => {
  const OPTIONS = [
    { value: 'fr', label: 'France' },
    { value: 'be', label: 'Belgique' },
  ];

  it('Select décrit son erreur et se déclare invalide, à la place de l’aide', () => {
    render(<Select label="Pays" helperText="Votre pays" error="Pays requis" options={OPTIONS} />);

    const select = screen.getByRole('combobox', { name: 'Pays' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Pays requis');
    expect(screen.getByRole('alert')).toHaveTextContent('Pays requis');
    expect(screen.queryByText('Votre pays')).not.toBeInTheDocument();
  });

  it('Select sans erreur reste tel quel', () => {
    render(<Select label="Pays" helperText="Votre pays" options={OPTIONS} />);

    const select = screen.getByRole('combobox', { name: 'Pays' });
    expect(select).not.toHaveAttribute('aria-invalid');
    expect(select).toHaveAccessibleDescription('Votre pays');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('MultiSelect décrit son erreur sur la liste', () => {
    render(<MultiSelect label="Langues" error="Choisissez une langue" options={OPTIONS} />);

    const listbox = screen.getByRole('listbox', { name: 'Langues' });
    expect(listbox).toHaveAttribute('aria-invalid', 'true');
    expect(listbox).toHaveAccessibleDescription('Choisissez une langue');
    expect(screen.getByRole('alert')).toHaveTextContent('Choisissez une langue');
  });

  it('Checkbox décrit description puis erreur, sans toucher au nom', () => {
    render(
      <Checkbox
        label="J’accepte les conditions"
        description="Obligatoire pour continuer"
        error="Cochez la case"
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: 'J’accepte les conditions' });
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAccessibleDescription('Obligatoire pour continuer Cochez la case');
    expect(screen.getByRole('alert')).toHaveTextContent('Cochez la case');
  });

  it('Toggle décrit son erreur, sans toucher au nom', () => {
    render(<Toggle label="Notifications" error="Activation impossible" />);

    const toggle = screen.getByRole('checkbox', { name: 'Notifications' });
    expect(toggle).toHaveAttribute('aria-invalid', 'true');
    expect(toggle).toHaveAccessibleDescription('Activation impossible');
    expect(screen.getByRole('alert')).toHaveTextContent('Activation impossible');
  });

  it('Input garde le même motif', () => {
    render(<Input label="E-mail" error="Adresse invalide" />);

    const input = screen.getByRole('textbox', { name: 'E-mail' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Adresse invalide');
  });
});

describe('Card — niveau du titre', () => {
  it('garde un h3 par défaut', () => {
    render(<Card title="Résumé">Contenu</Card>);

    expect(screen.getByRole('heading', { level: 3, name: 'Résumé' })).toBeInTheDocument();
  });

  it.each(['h2', 'h4', 'h6'] as const)('rend le titre en %s avec titleAs', (tag) => {
    render(
      <Card title="Résumé" titleAs={tag}>
        Contenu
      </Card>,
    );

    const heading = screen.getByRole('heading', { level: Number(tag[1]), name: 'Résumé' });
    expect(heading).toHaveClass('opale-card__title');
  });
});

describe('Annonces : une fois, et avec leur contexte', () => {
  it('DataTable n’annonce le chargement qu’une fois, par sa région de statut', () => {
    render(<DataTable caption="Composants" columns={[{ key: 'name', label: 'Nom' }]} loading />);

    const texts = screen.getAllByText('Chargement des données…');
    const exposed = texts.filter((node) => !node.closest('[aria-hidden="true"]'));
    expect(exposed).toEqual([screen.getByRole('status')]);
    expect(screen.getByRole('table', { name: 'Composants' })).toHaveAttribute('aria-busy', 'true');
  });

  it('DataTable n’est pas occupée hors chargement', () => {
    render(<DataTable caption="Composants" columns={[{ key: 'name', label: 'Nom' }]} />);

    expect(screen.getByRole('table', { name: 'Composants' })).not.toHaveAttribute('aria-busy');
  });

  it.each([
    [140, '100'],
    [-20, '0'],
    [Number.NaN, '0'],
    [42, '42'],
  ])('ProgressBar borne aria-valuenow (%s → %s)', (value, expected) => {
    render(<ProgressBar label="Import" value={value} />);

    expect(screen.getByRole('progressbar', { name: 'Import' })).toHaveAttribute(
      'aria-valuenow',
      expected,
    );
  });

  it('Slider annonce valueText', () => {
    render(<Slider label="Volume" value={3} max={10} valueText="3 sur 10" readOnly />);

    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveAttribute(
      'aria-valuetext',
      '3 sur 10',
    );
  });

  it('Slider suit getValueText à chaque déplacement, même non contrôlé', () => {
    render(
      <Slider label="Luminosité" defaultValue={20} getValueText={(value) => `${value} pour cent`} />,
    );
    const slider = screen.getByRole('slider', { name: 'Luminosité' });
    expect(slider).toHaveAttribute('aria-valuetext', '20 pour cent');

    fireEvent.change(slider, { target: { value: '65' } });

    expect(slider).toHaveAttribute('aria-valuetext', '65 pour cent');
  });

  it('Slider sans texte de valeur ne pose pas aria-valuetext', () => {
    render(<Slider label="Volume" defaultValue={3} />);

    expect(screen.getByRole('slider', { name: 'Volume' })).not.toHaveAttribute('aria-valuetext');
  });

  it('Donut garde « 60% » par défaut et préfixe son contexte quand il est donné', () => {
    render(
      <>
        <Donut value={60} />
        <Donut value={72} context="Tâches terminées" />
      </>,
    );

    expect(screen.getByRole('img', { name: '60%' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Tâches terminées : 72%' })).toBeInTheDocument();
  });
});
