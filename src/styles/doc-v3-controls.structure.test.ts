import { describe, expect, it } from 'vitest';

import { ruleBody } from '../test/css-rules';
import opaleSource from '../magic/opale.css?raw';
import searchBarSource from '../magic/components/search-bar/style/SearchBar.module.scss?raw';
import docSource from './doc-v3.css?raw';
import tokensSource from '../tokens/tokens.css?raw';

describe('la forme interactive OpaleUI', () => {
  it('épingle la palette saphir et la géométrie mesurée sur la référence', () => {
    const root = ruleBody(opaleSource, ':root') ?? '';
    const darkRoot = ruleBody(opaleSource, ":root[data-theme='dark']") ?? '';
    const button = ruleBody(opaleSource, '.opale-button') ?? '';
    const small = ruleBody(opaleSource, '.opale-button--small') ?? '';
    const large = ruleBody(opaleSource, '.opale-button--large') ?? '';

    expect(root).toMatch(/--opale-primary:\s*#315c9e/);
    expect(root).toMatch(/--opale-primary-dark:\s*#23457a/);
    expect(root).toMatch(/--opale-primary-light:\s*#5f87c4/);
    expect(root).toMatch(/--opale-font-display:\s*'Chivo'/);
    expect(root).not.toMatch(/--opale-font-display:\s*'Titan One'/);
    expect(root).toMatch(/--opale-font-mono:\s*'Hack'/);
    expect(darkRoot).toMatch(/--opale-primary:\s*#5d87cb/);
    expect(darkRoot).toMatch(/--opale-primary-dark:\s*#739cda/);
    /* LE SECONDAIRE EST PASSÉ DE L'OLIVE AU BLEU D'ACIER, et ce garde suit.
       Un bouton « secondaire » vert à côté d'un primaire saphir ne se lisait pas
       comme le second rôle du même rôle. Le chiffre change, l'exigence non :
       c'est toujours `--opale-secondary-dark` qui peint le fond du bouton, et
       il est désormais mesuré à 5,52:1 avec l'encre claire — contre 4,75 pour
       l'olive qu'il remplace. */
    expect(root).toMatch(/--opale-secondary-dark:\s*#3a6b8a/);
    expect(root).toMatch(/--opale-accent:\s*#f4ad15/);
    expect(root).toMatch(/--opale-danger:\s*#b3261e/);
    expect(root).toMatch(/--opale-radius-md:\s*1\.375rem/);
    expect(root).toMatch(/--opale-squircle-clip:\s*polygon\(/);
    expect(root).toContain('0.0057');
    expect(root).toContain('0.7427');

    expect(button).toMatch(/min-height:\s*2\.75rem/);
    expect(button).toMatch(/padding:\s*0\.375rem\s+1\.25rem/);
    expect(button).toMatch(/font:\s*600\s+0\.875rem\/1\.75/);
    expect(button).toMatch(/border-radius:\s*0/);
    expect(small).toMatch(/min-height:\s*2\.25rem/);
    expect(large).toMatch(/min-height:\s*3rem/);
  });

  /* CE GARDE A CHANGÉ D'INTENTION, ET C'EST DÉLIBÉRÉ. Il épinglait une graisse
     de 400 sur les titres — une valeur réglée POUR CHIVO, dont le 400 porte
     déjà à grande taille. Les titres et les chiffres passent à Bricolage
     Grotesque, dont le 400 est nettement plus léger : garder le chiffre aurait
     gardé la lettre de la décision en perdant ce qu'elle cherchait. Ce qui est
     gardé, c'est l'ÉCHELLE — les deux `clamp` n'ont pas bougé d'un pixel — et
     le fait que les titres restent plus légers que le gras plein. */
  it('tient l’échelle d’affichage et la police de titre', () => {
    const pageTitle = ruleBody(docSource, '.tc-doc-page__title') ?? '';
    const homeTitle = ruleBody(docSource, '.tc-doc-main--home .tc-doc-page__title') ?? '';
    const stats = ruleBody(docSource, '.tc-doc-home__stats dt') ?? '';

    expect(opaleSource).not.toContain('family=Titan+One');
    expect(pageTitle).toMatch(/font:\s*600\s+clamp\(1\.8rem,\s*3vw,\s*2\.75rem\)/);
    expect(pageTitle).toMatch(/letter-spacing:\s*-0\.03em/);
    expect(homeTitle).toMatch(/font-size:\s*clamp\(1\.8rem,\s*3vw,\s*2\.75rem\)/);
    /* La règle de l'accueil REDÉCLARE la graisse : sans ce garde, la ramener à
       400 annulerait le changement sur la seule page où le titre est le
       sujet, et aucun autre test ne le verrait. */
    expect(homeTitle).toMatch(/font-weight:\s*600/);
    expect(stats).toMatch(/font:\s*600\s+clamp\(1\.4rem,\s*2\.5vw,\s*2rem\)/);
    expect(ruleBody(opaleSource, '.opale-text--metric') ?? '').toMatch(/font-size:\s*2rem/);
  });

  /* LA POLICE DE TITRE EST SERVIE PAR LA MÊME REQUÊTE QUE CHIVO, et c'est la
     seule chose qui sépare un second jeton d'un second aller-retour réseau
     bloquant au premier rendu. Un `@import` supplémentaire aurait fonctionné à
     l'écran et coûté une requête de plus, sans que rien ne le signale. */
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
    const scope = /:root,\s*\.tc-doc\s*\{([\s\S]*?)\}/.exec(docSource)?.[1] ?? '';

    // L'ancien anneau — halo bleu et filet citron — reste éteint.
    expect(scope).toMatch(/--focus-outer:\s*transparent/);
    expect(scope).toMatch(/--focus-inner:\s*transparent/);
    // Le nouveau : l'encre du texte, et la bibliothèque parle la même langue.
    expect(scope).toMatch(/--tc-doc-focus-ring:\s*color-mix\(in srgb,\s*var\(--opale-text\)/);
    expect(scope).toMatch(/--opale-focus:\s*var\(--tc-doc-focus-ring\)/);

    // Au clavier seulement, un trait de 2 px, sans ombre.
    const ring = /\.tc-doc :focus-visible\s*\{([^}]*)\}/.exec(docSource)?.[1] ?? '';
    expect(ring).toMatch(/outline:\s*2px solid var\(--tc-doc-focus-ring\)/);
    expect(ring).toMatch(/outline-offset:\s*3px/);
    expect(docSource).not.toMatch(/\.tc-doc [^{]*:focus\s*[,{][^}]*outline:\s*[1-9]/);

    // Les cibles de focus programmatique restent sans anneau.
    expect(docSource).toMatch(
      /\.tc-doc \[tabindex='-1'\]:focus-visible[\s\S]{0,120}outline:\s*none\s*!important/,
    );
    expect(docSource).toMatch(
      /\.tc-doc-main:focus-visible[\s\S]{0,120}outline:\s*none\s*!important/,
    );

    /* La feuille PUBLIÉE garde son anneau : la vitrine n'impose pas son choix
       d'accessibilité aux projets qui installent le paquet. */
    expect(tokensSource).toMatch(/:focus-visible\s*\{[\s\S]*?outline:\s*3px\s+solid/);
  });

  /* L'ANNEAU ÉPOUSE LA SILHOUETTE. Les squircles sont peints par un
     pseudo-élément et la boîte reste un rectangle : sans rayon, l'anneau
     retrouvait les « oreilles » qui avaient fait éteindre l'ancien. */
  it('arrondit la boîte des contrôles en squircle quand ils portent le focus', () => {
    const shaped = /\.tc-doc\s*:is\(([^)]*)\):focus-visible\s*\{([^}]*)\}/.exec(docSource) ?? [];
    expect(shaped[1]).toContain('.opale-button');
    expect(shaped[1]).toContain('.tc-doc-nav__link');
    expect(shaped[2]).toMatch(
      /border-radius:\s*calc\(var\(--opale-squircle-radius\)\s*\*\s*0\.68\)/,
    );
  });

  it('borne la police de titre et la sert sans requête supplémentaire', () => {
    const imports = opaleSource.match(/@import url\([^)]*\);/g) ?? [];
    const root = ruleBody(opaleSource, ':root') ?? '';

    expect(imports).toHaveLength(0);
    expect(opaleSource).toMatch(
      /font-family: 'Bricolage Grotesque'[\s\S]*?fonts\/bricolage-grotesque-latin\.woff2/,
    );
    expect(opaleSource).toMatch(/font-family: 'Chivo'[\s\S]*?fonts\/chivo-latin\.woff2/);
    expect(root).toMatch(/--opale-font-title:\s*'Bricolage Grotesque'/);
    /* `--opale-font-display` NE BOUGE PAS : il habille le titre du rail, les
       titres de plaques, la métrique, le donut et le compte à rebours, qui
       gardent Chivo. Le jeton dédié est ce qui borne le changement. */
    expect(root).toMatch(/--opale-font-display:\s*'Chivo'/);
  });

  it('dessine Button avec le polygone sur un calque qui ne rogne pas le focus', () => {
    const shape = opaleSource.match(/\.opale-button::before\s*\{([\s\S]*?)\}/)?.[1] ?? '';

    expect(shape).toMatch(/clip-path:\s*var\(--opale-squircle-clip\)/);
    expect(shape).toMatch(/background:\s*var\(--opale-button-background\)/);
    expect(opaleSource).toMatch(
      /\.opale-button:focus-visible,[\s\S]{0,240}outline:\s*3px\s+solid\s+var\(--opale-focus\)/,
    );
    expect(opaleSource).toMatch(/outline-offset:\s*3px/);
  });

  it.each([
    '.tc-doc-topbar__tab::before',
    '.tc-doc-search__option::before',
    '.tc-doc-nav__link::before',
    '.tc-doc-home__action::before',
  ])('%s devrait réutiliser la même squircle', (selector) => {
    expect(ruleBody(docSource, selector) ?? '').toMatch(
      /clip-path:\s*var\(--opale-squircle-clip\)/,
    );
  });

  it('place la squircle de recherche dans le composant partagé', () => {
    expect(searchBarSource).toMatch(
      /\.plain::before,\s*\.plain::after\s*\{[\s\S]*?clip-path:\s*var\(--opale-squircle-clip\)/,
    );
    expect(searchBarSource).toMatch(/\.plain::after\s*\{[^}]*background:\s*var\(--opale-surface\)/);
  });

  it('garde les actions de code, leur dévoilement animé et le filet anti-mouvement', () => {
    expect(ruleBody(docSource, '.tc-doc-codeexample__actions') ?? '').toMatch(
      /justify-content:\s*flex-end/,
    );
    expect(ruleBody(docSource, '.tc-doc-codeexample__reveal') ?? '').toMatch(
      /grid-template-rows:\s*0fr/,
    );
    expect(ruleBody(docSource, ".tc-doc-codeexample__reveal[data-open='true']") ?? '').toMatch(
      /grid-template-rows:\s*1fr/,
    );
    expect(docSource).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*\.tc-doc-codeexample__reveal/,
    );
  });

  it('rend le panneau de code minimal, sans rail gauche et avec une palette syntaxique', () => {
    const code = ruleBody(docSource, '.tc-doc-codeexample__reveal .tc-doc-code') ?? '';
    const theme = ruleBody(docSource, '.tc-doc-topbar__actions .tc-doc-themetoggle') ?? '';

    expect(code).toMatch(/border:\s*0\s*!important/);
    expect(code).toMatch(/border-inline-start:\s*0\s*!important/);
    expect(code).toMatch(/font-family:\s*var\(--opale-font-mono\)/);
    expect(ruleBody(docSource, '.tc-doc-token--string') ?? '').toMatch(
      /color:\s*var\(--tc-doc-code-string\)/,
    );
    expect(theme).toMatch(/background:\s*transparent\s*!important/);
  });

  it('garde la recherche nette au focus et renforce seulement les éléments sélectionnés', () => {
    const searchFocus = ruleBody(searchBarSource, '.plain:focus-within') ?? '';
    const headerWrapper = ruleBody(docSource, '.tc-doc-search') ?? '';

    expect(searchFocus).toMatch(/--opale-search-border:\s*var\(--opale-primary\)/);
    expect(headerWrapper).toMatch(/box-shadow:\s*none\s*!important/);
    expect(docSource).toMatch(
      /\.tc-doc-nav__link\[aria-current='page'\]\s*\{\s*font-weight:\s*600/,
    );
    expect(docSource).toMatch(
      /\.tc-doc-topbar__tab\[aria-current='page'\]\s*\{\s*font-weight:\s*600/,
    );
    expect(docSource).toMatch(
      /\.tc-doc-search__option\[aria-selected='true'\]\s+\.tc-doc-search__label\s*\{\s*font-weight:\s*600/,
    );
  });
});
