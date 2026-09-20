import { describe, expect, it } from 'vitest';

import { ruleBody } from '../test/css-rules';
import canopSource from '../magic/canop.css?raw';
import docSource from './doc-v3.css?raw';
import tokensSource from '../tokens/tokens.css?raw';

describe('la forme interactive CanopUI', () => {
  it('épingle la palette saphir et la géométrie mesurée sur la référence', () => {
    const root = canopSource.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? '';
    const darkRoot = ruleBody(canopSource, ":root[data-theme='dark']") ?? '';
    const button = ruleBody(canopSource, '.canop-button') ?? '';
    const small = ruleBody(canopSource, '.canop-button--small') ?? '';
    const large = ruleBody(canopSource, '.canop-button--large') ?? '';

    expect(root).toMatch(/--canop-primary:\s*#315c9e/);
    expect(root).toMatch(/--canop-primary-dark:\s*#23457a/);
    expect(root).toMatch(/--canop-primary-light:\s*#5f87c4/);
    expect(root).toMatch(/--canop-font-display:\s*'Chivo'/);
    expect(root).not.toMatch(/--canop-font-display:\s*'Titan One'/);
    expect(root).toMatch(/--canop-font-mono:\s*'Hack'/);
    expect(darkRoot).toMatch(/--canop-primary:\s*#5d87cb/);
    expect(darkRoot).toMatch(/--canop-primary-dark:\s*#739cda/);
    expect(root).toMatch(/--canop-secondary-dark:\s*#6a7455/);
    expect(root).toMatch(/--canop-accent:\s*#f4ad15/);
    expect(root).toMatch(/--canop-danger:\s*#b3261e/);
    expect(root).toMatch(/--canop-radius-md:\s*1\.375rem/);
    expect(root).toMatch(/--canop-squircle-clip:\s*polygon\(/);
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

    expect(canopSource).not.toContain('family=Titan+One');
    expect(pageTitle).toMatch(/font:\s*600\s+clamp\(1\.8rem,\s*3vw,\s*2\.75rem\)/);
    expect(pageTitle).toMatch(/letter-spacing:\s*-0\.03em/);
    expect(homeTitle).toMatch(/font-size:\s*clamp\(1\.8rem,\s*3vw,\s*2\.75rem\)/);
    /* La règle de l'accueil REDÉCLARE la graisse : sans ce garde, la ramener à
       400 annulerait le changement sur la seule page où le titre est le
       sujet, et aucun autre test ne le verrait. */
    expect(homeTitle).toMatch(/font-weight:\s*600/);
    expect(stats).toMatch(/font:\s*600\s+clamp\(1\.4rem,\s*2\.5vw,\s*2rem\)/);
    expect(ruleBody(canopSource, '.canop-text--metric') ?? '').toMatch(/font-size:\s*2rem/);
  });

  /* LA POLICE DE TITRE EST SERVIE PAR LA MÊME REQUÊTE QUE CHIVO, et c'est la
     seule chose qui sépare un second jeton d'un second aller-retour réseau
     bloquant au premier rendu. Un `@import` supplémentaire aurait fonctionné à
     l'écran et coûté une requête de plus, sans que rien ne le signale. */
  /* LA SUPPRESSION DE L'ANNEAU DE FOCUS EST UNE DÉCISION, DONC ELLE SE GARDE.

     Sans ce test, rétablir l'anneau serait une seule ligne, et le rectangle que
     le propriétaire a demandé de retirer reviendrait sans que rien ne le dise.
     Ce qui est épinglé n'est pas une valeur d'apparence mais le MÉCANISME :
     la suppression passe par les trois jetons de couleur de focus, vérifiés
     ailleurs comme ne servant à rien d'autre. Un `box-shadow: none !important`
     général aurait aussi emporté la lueur du champ de saisie et celle des
     cartes, qui ne sont pas des anneaux.

     `tokens.css` N'EST PAS CONCERNÉ et ne doit pas l'être : c'est un artefact
     publié (`exports["./tokens.css"]`), donc y couper l'anneau le retirerait
     aux consommateurs du paquet. La dernière assertion l'empêche. */
  it('ne peint plus aucun anneau de focus dans la vitrine', () => {
    /* Le sélecteur est une LISTE sur deux lignes (`:root,` puis `.tc-doc`), que
       le lecteur de règles partagé ne sait pas retrouver par son nom. On lit
       donc le bloc dans la source, ce qui épingle aussi le fait que les trois
       jetons vivent bien ENSEMBLE — les séparer serait la façon la plus simple
       d'en oublier un. */
    const scope = /:root,\s*\.tc-doc\s*\{([\s\S]*?)\}/.exec(docSource)?.[1] ?? '';

    expect(scope).toMatch(/--focus-outer:\s*transparent/);
    expect(scope).toMatch(/--focus-inner:\s*transparent/);
    expect(scope).toMatch(/--canop-focus:\s*transparent/);

    /* Les deux `outline` posés en dur — ceux qui citaient `--canop-primary` et
       non un jeton de focus — sont éteints à part, les jetons ne pouvant rien
       pour eux. */
    expect(docSource).toMatch(
      /\.tc-doc-main:focus-visible[\s\S]{0,120}outline:\s*none\s*!important/,
    );

    /* La feuille PUBLIÉE garde son anneau : la vitrine n'impose pas son choix
       d'accessibilité aux projets qui installent le paquet. */
    expect(tokensSource).toMatch(/:focus-visible\s*\{[\s\S]*?outline:\s*3px\s+solid/);
  });

  it('borne la police de titre et la sert sans requête supplémentaire', () => {
    const imports = canopSource.match(/@import url\([^)]*\);/g) ?? [];
    const root = canopSource.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';

    expect(imports).toHaveLength(1);
    expect(imports[0]).toContain('family=Bricolage+Grotesque');
    expect(imports[0]).toContain('family=Chivo');
    expect(root).toMatch(/--canop-font-title:\s*'Bricolage Grotesque'/);
    /* `--canop-font-display` NE BOUGE PAS : il habille le titre du rail, les
       titres de plaques, la métrique, le donut et le compte à rebours, qui
       gardent Chivo. Le jeton dédié est ce qui borne le changement. */
    expect(root).toMatch(/--canop-font-display:\s*'Chivo'/);
  });

  it('dessine Button avec le polygone sur un calque qui ne rogne pas le focus', () => {
    const shape = canopSource.match(/\.canop-button::before\s*\{([\s\S]*?)\}/)?.[1] ?? '';

    expect(shape).toMatch(/clip-path:\s*var\(--canop-squircle-clip\)/);
    expect(shape).toMatch(/background:\s*var\(--canop-button-background\)/);
    expect(canopSource).toMatch(
      /\.canop-button:focus-visible,[\s\S]{0,240}outline:\s*3px\s+solid\s+var\(--canop-focus\)/,
    );
    expect(canopSource).toMatch(/outline-offset:\s*3px/);
  });

  it.each([
    '.tc-doc-topbar__tab::before',
    '.tc-doc-search::before',
    '.tc-doc-search__option::before',
    '.tc-doc-nav__link::before',
    '.tc-doc-home__action::before',
  ])('%s devrait réutiliser la même squircle', (selector) => {
    expect(ruleBody(docSource, selector) ?? '').toMatch(
      /clip-path:\s*var\(--canop-squircle-clip\)/,
    );
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
    expect(code).toMatch(/font-family:\s*var\(--canop-font-mono\)/);
    expect(ruleBody(docSource, '.tc-doc-token--string') ?? '').toMatch(
      /color:\s*var\(--tc-doc-code-string\)/,
    );
    expect(theme).toMatch(/background:\s*transparent\s*!important/);
  });

  it('garde la recherche nette au focus et renforce seulement les éléments sélectionnés', () => {
    const searchFocus = ruleBody(docSource, '.tc-doc-search:focus-within') ?? '';

    expect(docSource).toMatch(
      /\.tc-doc-search::after\s*\{[\s\S]*?z-index:\s*-1;[\s\S]*?background:\s*var\(--canop-surface\)/,
    );
    expect(searchFocus).toMatch(/box-shadow:\s*none\s*!important/);
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
