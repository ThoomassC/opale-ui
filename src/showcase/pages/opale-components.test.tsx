import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import opaleComponentsSource from './opale-components.tsx?raw';
import catalogPreviewSource from './catalog-preview.tsx?raw';
import { OPALE_CATALOG, Opale } from '../../magic';
import { catalogComponentLabel } from '../doc-model';
import { CatalogPreview } from './catalog-preview';
import { opaleComponentPages } from './opale-components';

afterEach(cleanup);

function renderButtonPage() {
  const page = opaleComponentPages.find((entry) => entry.label === 'Button');

  if (!page) throw new Error('La page Button du catalogue Opale est introuvable.');

  return render(<>{page.render()}</>);
}

describe('la page V3 de Button', () => {
  it('montre les quatre variantes pleines dans le même ordre que OpaleUI', () => {
    const { container } = renderButtonPage();
    const row = container.querySelector('.tc-doc-opale-preview__row');

    expect(row).not.toBeNull();

    const buttons = within(row as HTMLElement).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'Primaire',
      'Secondaire',
      'Accent',
      'Danger',
    ]);
    expect(buttons[3]).toHaveClass('opale-button--danger');
    expect(screen.queryByRole('button', { name: 'Ghost' })).not.toBeInTheDocument();
  });

  it('affiche le code exact de la rangée depuis sa commande', async () => {
    const user = userEvent.setup();
    renderButtonPage();

    await user.click(screen.getByRole('button', { name: 'Afficher le code' }));

    const code = screen.getByRole('group', {
      name: 'Exemple Button, défilement horizontal',
    });
    expect(code).toHaveTextContent('<Opale.Button variant="primary">Primaire</Opale.Button>');
    expect(code).toHaveTextContent('<Opale.Button variant="danger">Danger</Opale.Button>');
  });
});

describe('le catalogue interactif V3', () => {
  it('possède exactement une page, un export public et une démo pour chaque composant', () => {
    expect(opaleComponentPages).toHaveLength(OPALE_CATALOG.length);
    expect(new Set(OPALE_CATALOG.map((entry) => entry.name))).toHaveProperty(
      'size',
      OPALE_CATALOG.length,
    );

    for (const entry of OPALE_CATALOG) {
      const publicName = catalogComponentLabel(entry.name) as keyof typeof Opale;
      expect(Opale[publicName], `${entry.name} doit être exporté par Opale`).toBeDefined();
    }
  });

  it.each(OPALE_CATALOG)('$name rend un spécimen réel et non la carte générique', (entry) => {
    const { container } = render(<CatalogPreview name={entry.name} liquidGlass={false} />);
    const preview = container.querySelector(`[data-preview-component="${entry.name}"]`);

    expect(preview).not.toBeNull();
    expect(preview).not.toHaveTextContent('Démonstration manquante');
    expect(preview?.childElementCount).toBeGreaterThan(0);
  });

  /* =============================================================================
     LA LISTE DES COMPOSANTS « À VERRE » NE PEUT PAS DÉRIVER DE LA RÉALITÉ.

     `opale-components.tsx` n'ajoute ` liquidGlass` à l'extrait de code que pour
     les composants dont l'aperçu transmet vraiment la prop. Cette liste est
     écrite à la main, donc elle vieillira : câbler un septième aperçu sans
     l'inscrire donnerait un exemple qui ne reproduit pas ce qu'on voit, et
     l'inscrire sans câbler donnerait un exemple qui compile sans rien faire.
     Les deux sont des mensonges, et aucun ne se voit à la lecture.

     Le test rapproche donc la liste de ce que `catalog-preview.tsx` transmet
     réellement. C'est la seule endroit où les deux se regardent. */
  it('n’annonce le verre dans le code que pour les aperçus qui le transmettent', () => {
    const declared = (
      /const FORWARDS_LIQUID_GLASS: readonly string\[\] = \[([\s\S]*?)\];/.exec(
        opaleComponentsSource,
      )?.[1] ?? ''
    )
      /* Les noms sont NUS depuis que le préfixe de l'autre librairie est
         tombé : « Badge » tout court. La capture vise donc une
         majuscule initiale, ce que respectent tous les noms de composants. */
      .match(/'([A-Z][A-Za-z0-9]+)'/g)
      ?.map((quoted) => quoted.replaceAll("'", ''))
      .sort();

    const wired = [...catalogPreviewSource.matchAll(/case '([A-Z][A-Za-z0-9]+)':([\s\S]*?)break;/g)]
      .filter(([, , body]) => body.includes('liquidGlass={liquidGlass}'))
      .map(([, name]) => name)
      .sort();

    expect(
      declared,
      'FORWARDS_LIQUID_GLASS est introuvable dans opale-components.tsx.',
    ).toBeDefined();
    expect(
      declared,
      'La liste des composants qui annoncent `liquidGlass` dans leur extrait ne correspond ' +
        'plus aux aperçus qui transmettent la prop.\n' +
        `  annoncés : ${declared?.join(', ')}\n` +
        `  câblés   : ${wired.join(', ')}`,
    ).toEqual(wired);
  });

  it('fait réellement basculer ThemeToggle', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="ThemeToggle" liquidGlass={false} />);

    expect(screen.getByRole('status')).toHaveTextContent('Thème clair');
    await user.click(screen.getByRole('checkbox', { name: 'Thème' }));
    expect(screen.getByRole('status')).toHaveTextContent('Thème sombre');
  });

  it('rend SegmentedControl contrôlable', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="SegmentedControl" liquidGlass={false} />);

    await user.click(screen.getByRole('button', { name: 'Code' }));

    expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Design system' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('ouvre puis confirme ConfirmDialog', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="ConfirmDialog" liquidGlass={false} />);

    await user.click(screen.getByRole('button', { name: 'Supprimer le fichier' }));
    expect(screen.getByRole('dialog', { name: 'Supprimer le fichier ?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirmer' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ferme puis réaffiche Toast', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="Toast" liquidGlass={false} />);

    expect(screen.getByText('Modifications enregistrées')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(screen.queryByText('Modifications enregistrées')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Afficher le toast' }));
    expect(screen.getByText('Modifications enregistrées')).toBeInTheDocument();
  });

  it('soumet Form et affiche son résultat', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="Form" liquidGlass={false} />);

    await user.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Formulaire envoyé');
  });

  it('rend LanguageSelector et MultiSelect contrôlables', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CatalogPreview name="LanguageSelector" liquidGlass={false} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Langue' }), 'ES');
    expect(screen.getByRole('combobox', { name: 'Langue' })).toHaveValue('ES');
    expect(screen.getByText('ES')).toBeInTheDocument();

    /* LA SÉLECTION MULTIPLE N'EST PLUS UN `<select multiple>` VISIBLE, et ce
       test a changé avec elle — pas pour s'adoucir, pour suivre.

       Trois différences, toutes des améliorations, et c'est pourquoi le test
       les épingle plutôt que de les contourner :

       1. LE NOM. Il valait « Sélection multiple », un `aria-label` générique
          posé sur le natif, qui recouvrait le libellé visible. La liste est
          désormais nommée par CE libellé — « Domaines ». Un contrôle doit
          s'annoncer avec le mot qu'on lit à côté de lui (WCAG 2.5.3).
       2. LA CIBLE. `selectOptions` pilote un `<select>` ; la commande visible
          est maintenant une `listbox` ARIA, donc on clique ses `option` comme
          le ferait un utilisateur.
       3. LA VALEUR. Elle se lit sur `aria-selected`, et non plus sur la
          propriété `value` du natif.

       LE NATIF SURVIT, MASQUÉ, comme porteur de valeur : la dernière assertion
       le vérifie, car c'est lui qui garantit que `onChange` continue de rendre
       `currentTarget.selectedOptions` aux consommateurs existants. C'est le
       contrat qui ne devait PAS bouger. */
    rerender(<CatalogPreview name="MultiSelect" liquidGlass={false} />);

    const liste = screen.getByRole('listbox', { name: 'Domaines' });
    const optionsDe = () =>
      within(liste)
        .getAllByRole('option')
        .filter((option) => option.getAttribute('aria-selected') === 'true')
        .map((option) => option.textContent);

    expect(optionsDe()).toEqual(['Design system', 'Documentation']);

    await user.click(within(liste).getByRole('option', { name: 'Design system' }));
    await user.click(within(liste).getByRole('option', { name: 'Code' }));

    expect(optionsDe()).toEqual(['Code', 'Documentation']);

    /* Le `<select>` masqué porte la même vérité : c'est lui que reçoit le
       `onChange` du consommateur. */
    expect(document.querySelector('select[multiple]')).toHaveValue(['code', 'docs']);
  });

  it('confirme les actions des boutons spécialisés', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CatalogPreview name="AddButton" liquidGlass={false} />);

    await user.click(screen.getByRole('button', { name: /Ajouter/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Élément ajouté');

    rerender(<CatalogPreview name="SaveButton" liquidGlass={false} />);
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(screen.getByRole('button', { name: 'Enregistré' })).toBeInTheDocument();
  });

  it('met à jour la page active de Navbar', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="Navbar" liquidGlass={false} />);

    await user.click(screen.getByRole('button', { name: 'Activité' }));
    expect(screen.getByRole('button', { name: 'Activité' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('ferme CookieBanner après consentement', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="CookieBanner" liquidGlass={false} />);

    await user.click(screen.getByRole('button', { name: 'Accepter' }));
    expect(screen.queryByText(/Nous utilisons des cookies/)).not.toBeInTheDocument();
  });

  it('sélectionne FileCard et bloque RouteGuard', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CatalogPreview name="FileCard" liquidGlass={false} />);

    const file = screen.getByRole('button', { name: /design-system\.fig/ });
    await user.click(file);
    expect(file).toHaveClass('opale-liquid');

    rerender(<CatalogPreview name="RouteGuard" liquidGlass={false} />);
    await user.click(screen.getByRole('checkbox', { name: 'Accès autorisé' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Accès administrateur requis');
  });

  it('réagit à la validation et au score de Game', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CatalogPreview name="Validation" liquidGlass={false} />);

    await user.clear(screen.getByRole('textbox', { name: 'Identifiant' }));
    expect(screen.getByText('À corriger')).toBeInTheDocument();

    rerender(<CatalogPreview name="Game" liquidGlass={false} />);
    await user.click(screen.getByRole('button', { name: 'Marquer un point' }));
    expect(screen.getByText('13')).toBeInTheDocument();
  });
});
