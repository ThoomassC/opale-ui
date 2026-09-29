import { cleanup, render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import opaleComponentsSource from './opale-components.tsx?raw';
import catalogPreviewSource from './catalog-preview.tsx?raw';
import { OPALE_CATALOG, Opale } from '../../opale';
import { catalogComponentLabel } from '../doc-model';
import { OPALE_CATALOG_SOURCE as opaleLibrarySource } from '../../test/opale-source';
import { CatalogPreview } from './catalog-preview';
import { CATALOG_API } from './opale-api-data';
import { opaleComponentPages } from './opale-component-pages';
import { preloadPages } from './lazy-page';

/* Les fondations, les composants et le catalogue se chargent à la demande :
   les monter d'un coup suppose de les charger d'avance, sans quoi chaque page
   suspendrait sur son emplacement d'attente. */
beforeAll(() => preloadPages());

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
    expect(code).toHaveTextContent("import { Button } from '@thomascaron/opale-ui';");
    expect(code).toHaveTextContent('<Button variant="primary">Primaire</Button>');
    expect(code).toHaveTextContent('<Button variant="danger">Danger</Button>');
  });
});

describe('les extraits copiables du catalogue', () => {
  /* L'extrait importe chaque composant par son nom : il ne reste aucun
     `Opale.X`, et chaque nom utilisé figure dans l'import. */
  /* SvgMap a sa page propre, sans le gabarit commun ni son extrait généré. */
  it.each(opaleComponentPages.filter((page) => page.label !== 'SvgMap'))('$label importe ses composants par leur nom', async (page) => {
    const { label } = page;
    const user = userEvent.setup();
    render(<>{page.render()}</>);
    await user.click(screen.getByRole('button', { name: 'Afficher le code' }));
    const code =
      screen.getByRole('group', { name: `Exemple ${label}, défilement horizontal` }).textContent ??
      '';

    expect(code).not.toMatch(/\bOpale\./);
    const imported = /^import \{ ([^}]+) \} from '@thomascaron\/opale-ui';/.exec(code)?.[1];
    expect(imported, 'ligne d’import absente').toBeDefined();
    for (const name of imported?.split(', ') ?? []) {
      expect(code.split('\n').slice(1).join('\n')).toMatch(new RegExp(`\\b${name}\\b`));
    }
  });

  it('importe aussi readCookieConsent quand l’extrait l’appelle', async () => {
    const user = userEvent.setup();
    const page = opaleComponentPages.find((entry) => entry.label === 'CookieBanner');
    if (!page) throw new Error('CookieBanner manquant');
    render(<>{page.render()}</>);
    await user.click(screen.getByRole('button', { name: 'Afficher le code' }));
    expect(
      screen.getByRole('group', { name: 'Exemple CookieBanner, défilement horizontal' }),
    ).toHaveTextContent("import { CookieBanner, readCookieConsent } from '@thomascaron/opale-ui';");
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

    expect(screen.getByText('Étape publiée sur le carnet')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    expect(screen.queryByText('Étape publiée sur le carnet')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Afficher le toast' }));
    expect(screen.getByText('Étape publiée sur le carnet')).toBeInTheDocument();
  });

  it('soumet Form et affiche son résultat', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="Form" liquidGlass={false} />);

    await user.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Formulaire envoyé');
  });

  it('rend MultiSelect contrôlable', async () => {
    const user = userEvent.setup();

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
    render(<CatalogPreview name="MultiSelect" liquidGlass={false} />);

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

  it('met à jour la page active de Navbar', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="Navbar" liquidGlass={false} />);

    await user.click(screen.getByRole('button', { name: 'Activité' }));
    expect(screen.getByRole('button', { name: 'Activité' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  /* RESP-13 : monté ouvert, le bandeau fixe recouvrait la fiche au
     chargement. Il attend désormais qu'on le demande. */
  it('monte CookieBanner fermé, l’affiche à la demande et le ferme après consentement', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="CookieBanner" liquidGlass={false} />);

    expect(screen.queryByText(/Nous utilisons des cookies/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Afficher le bandeau' }));
    await user.click(screen.getByRole('button', { name: 'Accepter' }));
    await waitForElementToBeRemoved(() => screen.queryByText(/Nous utilisons des cookies/));
  });

  it('sélectionne FileCard', async () => {
    const user = userEvent.setup();
    render(<CatalogPreview name="FileCard" liquidGlass={false} />);

    const file = screen.getByRole('button', { name: /design-system\.fig/ });

    /* L'ÉTAT SE LIT SUR `aria-pressed`, PLUS SUR UNE CLASSE DE STYLE. La
       sélection était signalée par `.opale-liquid` — l'ancienne imitation du
       verre détournée en surbrillance : rien ne l'annonçait, et l'information
       n'existait que par la couleur. Ce test visait la classe ; il vise
       maintenant ce qu'un lecteur d'écran entend. */
    expect(file).toHaveAttribute('aria-pressed', 'false');

    await user.click(file);

    expect(file).toHaveAttribute('aria-pressed', 'true');
    expect(file).toHaveClass('opale-file-card--selected');
  });
});

/* =============================================================================
   LA VITRINE NE DOIT PAS MONTRER UN COMMUTATEUR QUI NE FAIT RIEN.

   LE DÉFAUT OBSERVÉ. La page de chaque composant affiche « Verre liquide pour
   X ». Pour l'autocomplétion et la liste multiple, la démonstration ne
   transmettait pas la prop : le commutateur basculait, et rien ne changeait.
   Le composant, lui, la gère parfaitement — c'est l'exemple qui l'oubliait.

   CE QUE CE GARDE COUVRE, ET CE QU'IL LAISSE DE CÔTÉ. Il ne vise que les
   composants qui ACCEPTENT la prop : à eux, l'exemple doit la passer. Les
   composants qui n'ont pas de rendu de verre du tout relèvent d'une autre
   question — faut-il leur afficher ce commutateur ? —, qui se traite dans la
   page et non ici.
   ========================================================================== */
describe('les exemples du catalogue', () => {
  it('transmet le matériau à tout composant qui sait le porter', () => {
    /* « SAIT LE PORTER » SE LIT DANS LE RENDU, PAS DANS LE TYPE.

       Une première version interrogeait les interfaces de props : un
       composant qui déclare `liquidGlass` devait recevoir la prop. C'était
       trop large. `MultiSelect` hérite de `SelectProps`, donc il DÉCLARE la
       prop — et il ne rend pas le matériau, il pose l'ancienne classe
       d'imitation. Le garde réclamait un exemple qui aurait promis du verre
       pour montrer autre chose.

       Ce qui compte est donc ce que le corps du composant REND : `FieldShell`
       (la coquille des champs, qui bascule sur `Glass`) ou `Glass` lui-même. */
    const rendersMaterial = (name: string): boolean => {
      const start = new RegExp(
        `export (?:function ${name}\\(|const ${name} = (?:forwardRef|function))`,
      ).exec(opaleLibrarySource)?.index;

      if (start === undefined) return false;

      const next = /\nexport (?:function|const|interface) /.exec(
        opaleLibrarySource.slice(start + 10),
      );
      const body = opaleLibrarySource.slice(start, next ? start + 10 + next.index : undefined);

      /* LA DÉLÉGATION N'EST PAS COMPTÉE ICI, ET C'EST UNE LIMITE ASSUMÉE.
         Une vingtaine de composants rendent un `Button` ou un `Input` et
         hériteraient donc du matériau si on leur transmettait la prop —
         `Pressable`, `InlineInput`, les six boutons d'action, `ThemeToggle`…
         Faut-il le faire ? C'est une décision de catalogue, pas un défaut
         constaté : tant qu'elle n'est pas prise, ce garde n'a pas à la forcer.
         Le garde voisin, qui compare la liste des extraits aux aperçus
         câblés, couvre les régressions sur ceux qui sont déjà branchés. */
      return /<FieldShell|<Glass/.test(body);
    };

    const manquants = [...catalogPreviewSource.matchAll(/case '(\w+)':([\s\S]*?)\n {6}break;/g)]
      .filter(([, name, body]) => rendersMaterial(name) && !body.includes('liquidGlass'))
      .map(([, name]) => name);

    expect(
      manquants,
      'Ces exemples affichent le commutateur « verre liquide » sans transmettre ' +
        `la prop : il bascule et rien ne change — ${manquants.join(', ')}.`,
    ).toEqual([]);
  });
});

/* =============================================================================
   LE COMMUTATEUR DE MATIÈRE NE S'AFFICHE QUE LÀ OÙ IL AGIT.

   LE DÉFAUT. La page posait « Verre liquide pour X » sur les quatre-vingt-cinq
   composants du catalogue. Onze rendent le matériau. Pour les autres,
   basculer l'interrupteur posait la photographie et le voile sous un composant
   qui ne changeait pas : une quarantaine se retrouvaient avec leur encre
   sombre sur un cliché sombre. Le commutateur ne mentait pas seulement, il
   abîmait la démonstration qu'il était censé enrichir.

   CE TEST PARCOURT TOUT LE CATALOGUE plutôt que deux cas représentatifs :
   c'est la seule façon de constater qu'aucune page n'a été oubliée, et le
   défaut corrigé était précisément un oubli à grande échelle.
   ========================================================================== */
describe('le commutateur de matière', () => {
  const declared = new Set(
    (
      /const FORWARDS_LIQUID_GLASS: readonly string\[\] = \[([\s\S]*?)\];/.exec(
        opaleComponentsSource,
      )?.[1] ?? ''
    )
      .match(/'([A-Z][A-Za-z0-9]+)'/g)
      ?.map((quoted) => quoted.replaceAll("'", '')) ?? [],
  );

  it.each(OPALE_CATALOG)('$name ne montre le commutateur que s’il agit', (entry) => {
    const page = opaleComponentPages.find(
      (candidate) => candidate.label === catalogComponentLabel(entry.name),
    );

    if (!page) throw new Error(`Page introuvable pour ${entry.name}.`);

    const { container } = render(<>{page.render()}</>);
    /* TOUS LES COMMUTATEURS, ET NON LE SEUL. Une page propre peut en porter
       plusieurs — une par démonstration, comme celle de SvgMap. */
    const toggles = within(container).queryAllByRole('checkbox', {
      name: new RegExp(`^Verre liquide pour `),
    });
    const toggle = toggles[0] ?? null;

    if (declared.has(entry.name)) {
      expect(
        toggle,
        `${entry.name} rend le matériau : son commutateur doit être proposé.`,
      ).not.toBeNull();
    } else {
      expect(
        toggle,
        `${entry.name} ne rend pas le matériau. Le commutateur poserait la ` +
          'photographie sous un composant inchangé — encre sombre sur cliché ' +
          'sombre —, ce qui abîme la démonstration au lieu de l’enrichir.',
      ).toBeNull();
    }
  });
});

describe('API et exemples du catalogue', () => {
  it('documente une API essentielle pour chaque composant publié', () => {
    expect(Object.keys(CATALOG_API).sort()).toEqual(
      OPALE_CATALOG.map((entry) => entry.name).sort(),
    );
  });

  it('synchronise les réglages Button avec son extrait copiable', async () => {
    const user = userEvent.setup();
    renderButtonPage();
    await user.selectOptions(screen.getByLabelText('Variante'), 'danger');
    await user.selectOptions(screen.getByLabelText('Taille'), 'large');
    await user.click(screen.getByRole('checkbox', { name: 'Chargement' }));
    await user.click(screen.getByRole('button', { name: 'Afficher le code' }));
    expect(screen.getByRole('button', { name: 'Essai configuré' })).toBeDisabled();
    expect(
      screen.getByRole('group', { name: 'Exemple Button, défilement horizontal' }),
    ).toHaveTextContent('<Button variant="danger" size="large" loading>Essai configuré</Button>');
  });

  it('insère liquidGlass après un callback fléché complet', async () => {
    const user = userEvent.setup();
    const page = opaleComponentPages.find((entry) => entry.label === 'FileCard');
    if (!page) throw new Error('FileCard manquant');
    render(<>{page.render()}</>);
    await user.click(screen.getByRole('checkbox', { name: 'Verre liquide pour FileCard' }));
    await user.click(screen.getByRole('button', { name: 'Afficher le code' }));
    const code =
      screen.getByRole('group', { name: 'Exemple FileCard, défilement horizontal' }).textContent ??
      '';
    expect(code).toMatch(
      /onClick=\{\(\) => setSelected\(\(value\) => !value\)\}\s+liquidGlass\s*\/>/,
    );
  });

  it('montre le verre au bon niveau dans CardGrid', async () => {
    const user = userEvent.setup();
    const page = opaleComponentPages.find((entry) => entry.label === 'CardGrid');
    if (!page) throw new Error('CardGrid manquant');
    render(<>{page.render()}</>);
    await user.click(screen.getByRole('checkbox', { name: 'Verre liquide pour CardGrid' }));
    await user.click(screen.getByRole('button', { name: 'Afficher le code' }));
    const code =
      screen.getByRole('group', { name: 'Exemple CardGrid, défilement horizontal' }).textContent ??
      '';
    expect(code).toContain('<StatCard label="Composants"');
    expect(code).toContain('liquidGlass');
    expect(code).not.toContain('<CardGrid liquidGlass>');
  });
});
