import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Checkbox, Input, MultiSelect, Select, Slider, Toggle } from './opale';

afterEach(cleanup);

/* ============================================================================
   LE NOM ET LA DESCRIPTION D'UN CHAMP APPARTIENNENT AUSSI À L'APPELANT.

   Deux défauts de la même famille (audit DX-06, DX-14 / ACC-08) :

   — la case à cocher posait TOUJOURS `aria-labelledby` vers le texte de son
     libellé. Sans `label`, ce texte est vide, et `aria-labelledby` l'emporte
     sur `aria-label` : `<Checkbox aria-label="Sélectionner la ligne" />`, le
     cas courant d'une ligne de tableau, n'avait AUCUN nom ;

   — un `aria-describedby` de l'appelant (texte d'aide externe, compteur,
     react-hook-form) REMPLAÇAIT le lien vers le message d'erreur, qui n'était
     plus annoncé à la prise de focus. Les identifiants se fusionnent
     désormais : ceux de l'appelant d'abord, puis l'aide, puis l'erreur.
   ========================================================================== */

function Hint() {
  return <p id="hint">Huit caractères au moins</p>;
}

describe('Checkbox', () => {
  it('prend le nom de son aria-label quand elle n’a pas de libellé', () => {
    render(<Checkbox aria-label="Sélectionner la ligne" />);
    expect(screen.getByRole('checkbox', { name: 'Sélectionner la ligne' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-labelledby');
  });

  it('garde le libellé pour nom, et la description pour description', () => {
    render(<Checkbox label="Notifications" description="Les nouveautés du design system" />);
    const box = screen.getByRole('checkbox', { name: 'Notifications' });
    expect(box).toHaveAccessibleDescription('Les nouveautés du design system');
  });

  it('ne recouvre pas l’aria-label de l’appelant par son propre libellé', () => {
    render(<Checkbox label="Ligne 3" aria-label="Sélectionner la ligne 3" />);
    expect(screen.getByRole('checkbox', { name: 'Sélectionner la ligne 3' })).toBeInTheDocument();
  });

  it('respecte l’aria-labelledby de l’appelant', () => {
    render(
      <>
        <span id="col">Colonne A</span>
        <Checkbox label="Ignoré" aria-labelledby="col" />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Colonne A' })).toBeInTheDocument();
  });

  it('fusionne l’aria-describedby de l’appelant avec la description et l’erreur', () => {
    render(
      <>
        <Hint />
        <Checkbox label="CGU" description="À lire" error="Obligatoire" aria-describedby="hint" />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'CGU' })).toHaveAccessibleDescription(
      'Huit caractères au moins À lire Obligatoire',
    );
  });
});

describe('aria-describedby fusionné', () => {
  it('Input garde le lien vers son erreur', () => {
    render(
      <>
        <Hint />
        <Input label="Mot de passe" error="Trop court" aria-describedby="hint" />
      </>,
    );
    const field = screen.getByLabelText('Mot de passe');
    expect(field).toHaveAccessibleDescription('Huit caractères au moins Trop court');
    expect(field).toHaveAttribute('aria-invalid', 'true');
  });

  it('Input en recherche garde aussi le lien vers son erreur', () => {
    render(
      <>
        <Hint />
        <Input type="search" label="Chercher" error="Vide" aria-describedby="hint" />
      </>,
    );
    expect(screen.getByLabelText('Chercher')).toHaveAccessibleDescription(
      'Huit caractères au moins Vide',
    );
  });

  it('Input reste invalide quand un formulaire lui passe aria-invalid={false}', () => {
    render(<Input label="Nom" error="Obligatoire" aria-invalid={false} />);
    expect(screen.getByLabelText('Nom')).toHaveAttribute('aria-invalid', 'true');
  });

  it('Input sans message garde l’aria-describedby de l’appelant tel quel', () => {
    render(
      <>
        <Hint />
        <Input label="Nom" aria-describedby="hint" />
      </>,
    );
    expect(screen.getByLabelText('Nom')).toHaveAttribute('aria-describedby', 'hint');
  });

  it('Select garde le lien vers son erreur', () => {
    render(
      <>
        <Hint />
        <Select label="Pays" error="Choisissez" aria-describedby="hint" options={[]} />
      </>,
    );
    expect(screen.getByLabelText('Pays')).toHaveAccessibleDescription(
      'Huit caractères au moins Choisissez',
    );
  });

  it('Toggle garde le lien vers son erreur', () => {
    render(
      <>
        <Hint />
        <Toggle label="Actif" error="Requis" aria-describedby="hint" />
      </>,
    );
    expect(screen.getByRole('switch', { name: 'Actif' })).toHaveAccessibleDescription(
      'Huit caractères au moins Requis',
    );
  });

  it('Slider transmet l’aria-describedby de l’appelant', () => {
    render(
      <>
        <Hint />
        <Slider label="Volume" aria-describedby="hint" />
      </>,
    );
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveAccessibleDescription(
      'Huit caractères au moins',
    );
  });

  it('MultiSelect décrit sa liste visible par l’appelant, l’aide et l’erreur', () => {
    render(
      <>
        <Hint />
        <MultiSelect
          label="Villes"
          error="Une ville au moins"
          aria-describedby="hint"
          options={[{ value: 'paris', label: 'Paris' }]}
        />
      </>,
    );
    expect(screen.getByRole('listbox', { name: 'Villes' })).toHaveAccessibleDescription(
      'Huit caractères au moins Une ville au moins',
    );
  });
});

/* ============================================================================
   MULTISELECT : CE QU'ON VOIT EST CE QU'ON PILOTE, Y COMPRIS SES ÉTATS.

   `disabled`, `required`, `aria-label` partaient dans `...props`, donc sur le
   `<select>` caché et `aria-hidden` (audit DX-04 / ACC-07). La liste visible
   restait focusable, cochable au clic comme au clavier, et sans nom : l'écran
   et la soumission divergeaient.
   ========================================================================== */
describe('MultiSelect, noms et états', () => {
  const OPTIONS = [
    { value: 'paris', label: 'Paris' },
    { value: 'lyon', label: 'Lyon' },
  ];

  it('nomme la liste visible par aria-label', () => {
    render(<MultiSelect aria-label="Tags" options={OPTIONS} />);
    expect(screen.getByRole('listbox', { name: 'Tags' })).toBeInTheDocument();
  });

  it('nomme la liste visible par l’aria-labelledby de l’appelant', () => {
    render(
      <>
        <h2 id="titre">Destinations</h2>
        <MultiSelect label="Ignoré" aria-labelledby="titre" options={OPTIONS} />
      </>,
    );
    expect(screen.getByRole('listbox', { name: 'Destinations' })).toBeInTheDocument();
  });

  it('annonce required sur la liste visible, et le garde sur le natif', () => {
    const { container } = render(<MultiSelect label="Villes" required options={OPTIONS} />);
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-required', 'true');
    expect(container.querySelector('select')).toBeRequired();
  });

  it('désactivé, ne se focalise plus et ne coche plus rien', () => {
    const onValueChange = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <MultiSelect
        label="Villes"
        disabled
        options={OPTIONS}
        onValueChange={onValueChange}
        onChange={onChange}
      />,
    );
    const list = screen.getByRole('listbox', { name: 'Villes' });

    expect(list).toHaveAttribute('aria-disabled', 'true');
    expect(list).toHaveAttribute('tabindex', '-1');
    expect(container.querySelector('select')).toBeDisabled();

    fireEvent.click(screen.getByRole('option', { name: 'Lyon' }));
    fireEvent.keyDown(list, { key: ' ' });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('option', { name: 'Lyon' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('option', { name: 'Paris' })).toHaveAttribute('aria-selected', 'false');
  });
});
