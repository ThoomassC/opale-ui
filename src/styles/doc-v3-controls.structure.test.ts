import { describe, expect, it } from 'vitest';

import { atRules, declaration, declarations, parseRules } from '../test/css-rules';
import opaleSource from '../opale/opale.css?raw';
import fontsSource from '../opale/fonts.css?raw';
import searchBarSource from '../opale/components/search-bar/style/SearchBar.module.scss?raw';
import docSource from './doc-v3.css?raw';
import tokensSource from '../tokens/tokens.css?raw';

/** Les déclarations retenues de chaque `@font-face`, dans l'ordre de la feuille. */
const fontFaces = (source: string): ReadonlyMap<string, string>[] =>
  parseRules(source)
    .filter((rule) => rule.prelude === '@font-face')
    .map((rule) => declarations(`.face { ${rule.body} }`, '.face'));

/** La source déclarée pour une famille, ou `undefined`. */
const fontSource = (family: string): string | undefined =>
  fontFaces(fontsSource).find((face) => face.get('font-family') === `'${family}'`)?.get('src');

describe('la forme interactive OpaleUI', () => {
  it('épingle la palette saphir et la géométrie mesurée sur la référence', () => {
    const root = declarations(opaleSource, ':root');
    const darkRoot = declarations(opaleSource, ":root[data-theme='dark']");
    const button = declarations(opaleSource, '.opale-button');

    expect(root.get('--opale-primary')).toBe('#315c9e');
    expect(root.get('--opale-primary-dark')).toBe('#23457a');
    expect(root.get('--opale-primary-light')).toBe('#5f87c4');
    expect(root.get('--opale-font-display')).toMatch(/^'Chivo',/);
    expect(root.get('--opale-font-display')).not.toMatch(/^'Titan One'/);
    expect(root.get('--opale-font-mono')).toMatch(/^'Hack',/);
    expect(darkRoot.get('--opale-primary')).toBe('#5d87cb');
    expect(darkRoot.get('--opale-primary-dark')).toBe('#739cda');
    /* LE SECONDAIRE EST PASSÉ DE L'OLIVE AU BLEU D'ACIER, et ce garde suit.
       Un bouton « secondaire » vert à côté d'un primaire saphir ne se lisait pas
       comme le second rôle du même rôle. Le chiffre change, l'exigence non :
       c'est toujours `--opale-secondary-dark` qui peint le fond du bouton, et
       il est désormais mesuré à 5,52:1 avec l'encre claire — contre 4,75 pour
       l'olive qu'il remplace. */
    expect(root.get('--opale-secondary-dark')).toBe('#3a6b8a');
    expect(root.get('--opale-accent')).toBe('#f4ad15');
    expect(root.get('--opale-danger')).toBe('#b3261e');
    expect(root.get('--opale-radius-md')).toBe('1.375rem');
    expect(root.get('--opale-squircle-clip')).toMatch(/^polygon\(/);
    expect(root.get('--opale-squircle-clip')).toContain('0.0057');
    expect(root.get('--opale-squircle-clip')).toContain('0.7427');

    expect(button.get('min-height')).toBe('var(--opale-control-md)');
    expect(root.get('--opale-control-md')).toBe('2.75rem');
    expect(button.get('padding')).toBe('0.375rem 1.25rem');
    expect(button.get('font')).toMatch(
      /^600 var\(--opale-text-sm\) ?\/ ?var\(--opale-leading-relaxed\)/,
    );
    expect(button.get('border-radius')).toBe('0');
    expect(declaration(opaleSource, '.opale-button--small', 'min-height')).toBe(
      'var(--opale-control-sm)',
    );
    expect(declaration(opaleSource, '.opale-button--large', 'min-height')).toBe(
      'var(--opale-control-lg)',
    );
    expect(root.get('--opale-control-sm')).toBe('2.25rem');
    expect(root.get('--opale-control-lg')).toBe('3rem');
  });

  /* CE GARDE A CHANGÉ D'INTENTION, ET C'EST DÉLIBÉRÉ. Il épinglait une graisse
     de 400 sur les titres — une valeur réglée POUR CHIVO, dont le 400 porte
     déjà à grande taille. Les titres et les chiffres passent à Bricolage
     Grotesque, dont le 400 est nettement plus léger : garder le chiffre aurait
     gardé la lettre de la décision en perdant ce qu'elle cherchait. Ce qui est
     gardé, c'est l'ÉCHELLE — les deux `clamp` n'ont pas bougé d'un pixel — et
     le fait que les titres restent plus légers que le gras plein. */
  it('tient l’échelle d’affichage et la police de titre', () => {
    const pageTitle = declarations(docSource, '.tc-doc-page__title');
    const homeTitle = declarations(docSource, '.tc-doc-main--home .tc-doc-page__title');

    expect(atRules(opaleSource, 'import').filter((params) => params.includes('Titan'))).toEqual(
      [],
    );
    expect(pageTitle.get('font')).toMatch(/^600 clamp\(1\.8rem, 3vw, 2\.75rem\)/);
    expect(pageTitle.get('letter-spacing')).toMatch(/^-0\.03em/);
    expect(homeTitle.get('font-size')).toMatch(/^clamp\(1\.8rem, 3vw, 2\.75rem\)/);
    /* La règle de l'accueil REDÉCLARE la graisse : sans ce garde, la ramener à
       400 annulerait le changement sur la seule page où le titre est le
       sujet, et aucun autre test ne le verrait. */
    expect(homeTitle.get('font-weight')).toMatch(/^600/);
    expect(declaration(docSource, '.tc-doc-home__stats dt', 'font')).toMatch(
      /^600 clamp\(1\.4rem, 2\.5vw, 2rem\)/,
    );
    expect(declaration(opaleSource, '.opale-text--metric', 'font-size')).toBe(
      'var(--opale-text-2xl)',
    );
  });

  /* L'ANNEAU DE FOCUS EST UNE DÉCISION, DONC ELLE SE GARDE — DANS SA NOUVELLE FORME.

     Il avait été éteint à la demande du propriétaire : un rectangle bleu épais,
     doublé d'un filet citron, autour de contrôles en squircle. Il revient
     discret, et ce test tient ce qui le distingue de l'ancien : les jetons
     bruyants restent éteints, un seul trait de 2 px au clavier seulement,
     d'encre graphite et non bleue. Sans ce garde, rallumer l'ancien anneau
     tiendrait en une ligne.

     `tokens.css` N'EST PAS CONCERNÉ et ne doit pas l'être : c'est un artefact
     publié (`exports["./tokens.css"]`). La dernière assertion l'empêche. */
  it('peint un anneau discret au clavier, et jamais l’ancien', () => {
    const scope = declarations(docSource, '.tc-doc');

    // L'ancien anneau — halo bleu et filet citron — reste éteint.
    expect(scope.get('--focus-outer')).toBe('transparent');
    expect(scope.get('--focus-inner')).toBe('transparent');
    // Le nouveau : l'encre du texte, et la bibliothèque parle la même langue.
    expect(scope.get('--tc-doc-focus-ring')).toMatch(/^color-mix\(in srgb, var\(--opale-text\)/);
    expect(scope.get('--opale-focus')).toBe('var(--tc-doc-focus-ring)');

    // Au clavier seulement, un trait de 2 px, sans ombre.
    const ring = declarations(docSource, '.tc-doc :focus-visible');
    expect(ring.get('outline')).toBe('2px solid var(--tc-doc-focus-ring)');
    expect(ring.get('outline-offset')).toBe('3px');

    /* Aucune règle `:focus` nu de la vitrine ne dessine de trait : il
       s'allumerait aussi au clic de souris. */
    const mouseRings = parseRules(docSource).flatMap((rule) =>
      rule.selectors
        .filter((selector) => /^\.tc-doc .*:focus$/.test(selector))
        .map((selector) => ({
          selector,
          outline: declaration(docSource, selector, 'outline', { within: rule.context }) ?? '',
        }))
        .filter(({ outline }) => /^[1-9]/.test(outline)),
    );
    expect(mouseRings).toEqual([]);

    // Les cibles de focus programmatique restent sans anneau.
    expect(declaration(docSource, ".tc-doc [tabindex='-1']:focus-visible", 'outline')).toBe(
      'none !important',
    );
    expect(declaration(docSource, '.tc-doc-main:focus-visible', 'outline')).toBe(
      'none !important',
    );

    /* La feuille PUBLIÉE garde son anneau : la vitrine n'impose pas son choix
       d'accessibilité aux projets qui installent le paquet. */
    expect(declaration(tokensSource, ':focus-visible', 'outline')).toMatch(/^3px solid/);
  });

  /* L'ANNEAU ÉPOUSE LA SILHOUETTE. Les squircles sont peints par un
     pseudo-élément et la boîte reste un rectangle : sans rayon, l'anneau
     retrouvait les « oreilles » qui avaient fait éteindre l'ancien. */
  it('arrondit la boîte des contrôles en squircle quand ils portent le focus', () => {
    const shaped = parseRules(docSource)
      .flatMap((rule) => rule.selectors)
      .map((selector) => selector.replace(/\s+/g, ' '))
      .find(
        (selector) =>
          selector.startsWith('.tc-doc :is(') &&
          selector.endsWith('):focus-visible') &&
          selector.includes('.opale-button'),
      );

    expect(shaped).toContain('.tc-doc-nav__link');
    expect(declaration(docSource, shaped ?? '', 'border-radius')).toMatch(
      /^calc\(var\(--opale-squircle-radius\) \* 0\.68\)/,
    );
  });

  /* LA POLICE DE TITRE EST SERVIE PAR LA MÊME REQUÊTE QUE CHIVO, et c'est la
     seule chose qui sépare un second jeton d'un second aller-retour réseau
     bloquant au premier rendu. Un `@import` supplémentaire aurait fonctionné à
     l'écran et coûté une requête de plus, sans que rien ne le signale. */
  it('borne la police de titre et la sert sans requête supplémentaire', () => {
    const root = declarations(opaleSource, ':root');

    expect(atRules(opaleSource, 'import')).toHaveLength(0);
    /* LES POLICES VIVENT DANS `fonts.css`, PAS DANS `opale.css`. Le build de la
       librairie incorpore tout ce qu'`opale.css` référence : les deux woff2
       partaient en base64 dans la feuille bloquante (~110 kB gzip) et
       `font-display: swap` n'y servait plus à rien. Livrées à part, elles se
       chargent et se mettent en cache comme des fichiers. */
    expect(atRules(opaleSource, 'font-face')).toHaveLength(0);
    expect(fontSource('Bricolage Grotesque')).toContain('fonts/bricolage-grotesque-latin.woff2');
    expect(fontSource('Chivo')).toContain('fonts/chivo-latin.woff2');
    expect(root.get('--opale-font-title')).toMatch(/^'Bricolage Grotesque',/);
    /* `--opale-font-display` NE BOUGE PAS : il habille le titre du rail, les
       titres de plaques, la métrique, le donut et le compte à rebours, qui
       gardent Chivo. Le jeton dédié est ce qui borne le changement. */
    expect(root.get('--opale-font-display')).toMatch(/^'Chivo',/);
  });

  it('dessine Button avec le polygone sur un calque qui ne rogne pas le focus', () => {
    const shape = declarations(opaleSource, '.opale-button::before');
    const root = declarations(opaleSource, ':root');

    expect(shape.get('clip-path')).toBe('var(--opale-squircle-clip)');
    expect(shape.get('background')).toBe('var(--opale-button-background)');
    expect(declaration(opaleSource, '.opale-button:focus-visible', 'outline')).toBe(
      'var(--opale-focus-ring-width) solid var(--opale-focus)',
    );
    expect(root.get('--opale-focus-ring-width')).toBe('3px');
    expect(root.get('--opale-focus-ring-offset')).toBe('3px');
  });

  it.each([
    '.tc-doc-topbar__tab::before',
    '.tc-doc-search__option::before',
    '.tc-doc-nav__link::before',
    '.tc-doc-home__action::before',
  ])('%s devrait réutiliser la même squircle', (selector) => {
    expect(declaration(docSource, selector, 'clip-path')).toBe('var(--opale-squircle-clip)');
  });

  it('place la squircle de recherche dans le composant partagé', () => {
    expect(declaration(searchBarSource, '.plain::before', 'clip-path')).toBe(
      'var(--opale-squircle-clip)',
    );
    expect(declaration(searchBarSource, '.plain::after', 'clip-path')).toBe(
      'var(--opale-squircle-clip)',
    );
    expect(declaration(searchBarSource, '.plain::after', 'background')).toBe(
      'var(--opale-surface)',
    );
  });

  it('garde les actions de code, leur dévoilement animé et le filet anti-mouvement', () => {
    expect(declaration(docSource, '.tc-doc-codeexample__actions', 'justify-content')).toBe(
      'flex-end',
    );
    expect(declaration(docSource, '.tc-doc-codeexample__reveal', 'grid-template-rows')).toBe(
      '0fr',
    );
    expect(
      declaration(docSource, ".tc-doc-codeexample__reveal[data-open='true']", 'grid-template-rows'),
    ).toBe('1fr');
    expect(
      declaration(docSource, '.tc-doc-codeexample__reveal', 'transition', {
        within: '@media (prefers-reduced-motion: reduce)',
      }),
    ).toBe('none !important');
  });

  it('rend le panneau de code minimal, sans rail gauche et avec une palette syntaxique', () => {
    const code = declarations(docSource, '.tc-doc-codeexample__reveal .tc-doc-code');

    expect(code.get('border')).toBe('0 !important');
    expect(code.get('border-inline-start')).toBe('0 !important');
    expect(code.get('font-family')).toMatch(/^var\(--opale-font-mono\)/);
    expect(declaration(docSource, '.tc-doc-token--string', 'color')).toBe(
      'var(--tc-doc-code-string)',
    );
    expect(
      declaration(docSource, '.tc-doc-topbar__actions .tc-doc-themetoggle', 'background'),
    ).toBe('transparent !important');
  });

  it('garde la recherche nette au focus et renforce seulement les éléments sélectionnés', () => {
    expect(declaration(searchBarSource, '.plain:focus-within', '--opale-search-border')).toBe(
      'var(--opale-primary)',
    );
    expect(declaration(docSource, '.tc-doc-search', 'box-shadow')).toBe('none !important');
    expect(declaration(docSource, ".tc-doc-nav__link[aria-current='page']", 'font-weight')).toBe(
      '600',
    );
    expect(
      declaration(docSource, ".tc-doc-topbar__tab[aria-current='page']", 'font-weight'),
    ).toBe('600');
    expect(
      declaration(
        docSource,
        ".tc-doc-search__option[aria-selected='true'] .tc-doc-search__label",
        'font-weight',
      ),
    ).toBe('600');
  });
});
