import { describe, expect, it } from 'vitest';

import docSource from '../styles/doc.css?raw';
import { declaration, declarations, parseRules, ruleBody } from './css-rules';

/* =============================================================================
   LE LECTEUR DE CSS SE TESTE, PARCE QUE TROIS GARDES EN DÉPENDENT.

   Un garde de structure qui lit la feuille avec un lecteur faux est pire qu'une
   absence de garde : il est vert, et il est vert pour une raison qu'on ne
   soupçonne pas. C'est ce qui est arrivé — la version en expression
   rationnelle passait par CHANCE, l'accolade fermante de l'at-rule décalant
   les correspondances suivantes de la bonne quantité.

   Les deux premiers tests sont donc les CONTRE-EXEMPLES qui la mettaient en
   défaut, écrits comme tels.
   ========================================================================== */

const AT_RULE = `
:root {
  --a: 1;
}

@media (min-width: 60rem) {
  .premiere {
    color: red;
  }

  .seconde {
    color: blue;
  }
}

.hors-bloc {
  color: green;
}
`;

describe('le lecteur de règles CSS', () => {
  it('ne devrait PAS lire une at-rule comme une règle', () => {
    /* LE CONTRE-EXEMPLE Nº 1. `/([^{}]+)\{([^}]*)\}/g` rendait pour
       `@media (min-width: 60rem)` un corps commençant par « .premiere { » :
       l'at-rule était une règle, et son prélude un sélecteur. */
    expect(
      ruleBody(AT_RULE, '@media (min-width: 60rem)'),
      'une at-rule est lue comme une règle : son prélude passe pour un sélecteur.',
    ).toBeNull();
  });

  it('devrait atteindre la PREMIÈRE règle d’un bloc, pas seulement les suivantes', () => {
    /* LE CONTRE-EXEMPLE Nº 2, et le plus vicieux. L'ancienne expression
       rationnelle avalait la première règle du bloc dans le corps de l'at-rule,
       donc `.premiere` était INATTEIGNABLE — et si un sélecteur du même nom
       existait hors du bloc, c'est lui qui était rendu, en silence. */
    expect(ruleBody(AT_RULE, '.premiere'), '.premiere est inatteignable.').toMatch(/color:\s*red/);
    expect(ruleBody(AT_RULE, '.seconde')).toMatch(/color:\s*blue/);
    expect(ruleBody(AT_RULE, '.hors-bloc')).toMatch(/color:\s*green/);
  });

  it('devrait distinguer deux règles de même sélecteur par leur CONTEXTE', () => {
    /* C'est la capacité qui manquait, et le défaut qu'elle attrape : une règle
       sortie de son `@media` reste une règle. Sur `doc.css`, sortir les deux
       règles du pli du sommaire de leur bloc 60 rem passe un téléphone en deux
       colonnes, et aucun garde ne pouvait le voir. */
    const ambigu = `
      .cible {
        color: base;
      }
      @media (min-width: 60rem) {
        .cible {
          color: large;
        }
      }
    `;

    expect(ruleBody(ambigu, '.cible')).toMatch(/color:\s*base/);
    expect(ruleBody(ambigu, '.cible', { within: '@media (min-width: 60rem)' })).toMatch(
      /color:\s*large/,
    );
    expect(
      ruleBody(ambigu, '.cible', { within: '@media (min-width: 99rem)' }),
      'un contexte absent doit rendre null et non la règle de base.',
    ).toBeNull();
  });

  it('devrait comparer le contexte sans se laisser prendre par l’espacement', () => {
    const espace = `@media   (min-width:60rem)  {\n  .cible { color: x; }\n}`;
    expect(ruleBody(espace, '.cible', { within: '@media (min-width: 60rem)' })).toMatch(
      /color:\s*x/,
    );
  });

  it('devrait exiger le sélecteur EXACT et non un préfixe', () => {
    /* `.tc-doc-nav__all` est un préfixe de `.tc-doc-nav__alltitle`, et les deux
       vivent dans `doc.css`. Un `includes` aurait lu la mauvaise règle. */
    const prefixe = `.a__all { color: un; }\n.a__alltitle { color: deux; }`;
    expect(ruleBody(prefixe, '.a__all')).toMatch(/color:\s*un/);
    expect(ruleBody(prefixe, '.a__alltitle')).toMatch(/color:\s*deux/);
  });

  it('devrait découper les préludes à plusieurs sélecteurs', () => {
    const groupe = `.a,\n.b {\n  color: partage;\n}`;
    expect(ruleBody(groupe, '.a')).toMatch(/partage/);
    expect(ruleBody(groupe, '.b')).toMatch(/partage/);
  });

  it('ne devrait pas refermer une règle sur une accolade citée dans une chaîne', () => {
    /* Le balayage à accolades d'avant postcss ignorait les chaînes : le `}` de
       `content` refermait `.a`, et `.b` n'existait plus. */
    const chaine = `.a { content: "}"; color: un; }\n.b { color: deux; }`;

    expect(ruleBody(chaine, '.a')).toMatch(/color:\s*un/);
    expect(ruleBody(chaine, '.b')).toMatch(/color:\s*deux/);
  });

  it('devrait lire doc.css en entier sans laisser de règle dans un corps', () => {
    /* LA GARDE DE L'HYPOTHÈSE DU MODULE : il ne gère pas le CSS imbriqué (une
       règle DANS une règle), au motif qu'aucune feuille du dépôt n'en contient.
       Ce test le vérifie au lieu de le supposer — le jour où quelqu'un imbrique
       une règle, il rougit ici plutôt que de faire mentir trois gardes. */
    const nested = parseRules(docSource).filter((rule) => rule.body.includes('{'));

    expect(
      nested.map((rule) => rule.prelude),
      'des règles de doc.css contiennent elles-mêmes des règles (CSS imbriqué) : ' +
        'le lecteur les traite comme des déclarations, donc les gardes qui en dépendent ' +
        'lisent du texte qui n’est pas ce qu’ils croient.',
    ).toEqual([]);

    expect(parseRules(docSource).length, 'doc.css devrait rendre des règles').toBeGreaterThan(100);
  });
});

/* =============================================================================
   `declarations` : CE QUE LA FEUILLE RETIENT, PAS CE QU'ELLE MENTIONNE.

   Une expression rationnelle sur un corps de règle réussit dès qu'une
   déclaration correspond, même écrasée trois lignes plus bas. Ces cas tiennent
   les trois différences qui comptent : la dernière valeur gagne, le contexte
   est exact, et `!important` n'est pas perdu.
   ========================================================================== */
describe('les déclarations retenues pour un sélecteur', () => {
  it('devrait retenir la dernière valeur écrite, règles du même sélecteur fusionnées', () => {
    const feuille = `.a { color: rouge; margin: 0; }\n.a { color: bleu; }`;

    expect(Object.fromEntries(declarations(feuille, '.a'))).toEqual({
      color: 'bleu',
      margin: '0',
    });
  });

  it('devrait ignorer par défaut les règles posées dans une at-rule', () => {
    const feuille = `.a { color: base; }\n@media (min-width: 60rem) { .a { color: large; } }`;

    expect(declaration(feuille, '.a', 'color')).toBe('base');
    expect(declaration(feuille, '.a', 'color', { within: '@media (min-width:60rem)' })).toBe(
      'large',
    );
  });

  it('devrait exiger la pile d’at-rules complète quand on la donne', () => {
    const feuille = `@supports (display: grid) { @media (x) { .a { color: niche; } } }`;

    expect(declaration(feuille, '.a', 'color', { within: '@media (x)' })).toBeUndefined();
    expect(
      declaration(feuille, '.a', 'color', { within: ['@supports (display: grid)', '@media (x)'] }),
    ).toBe('niche');
  });

  it('devrait garder !important dans la valeur', () => {
    expect(declaration('.a { color: red !important; }', '.a', 'color')).toBe('red !important');
  });

  it('devrait ne rien rendre pour un sélecteur absent ou seulement préfixe', () => {
    const feuille = `.a__alltitle { color: deux; }`;

    expect(declarations(feuille, '.a__all').size).toBe(0);
  });

  it('devrait trouver un sélecteur au sein d’une liste, virgules entre parenthèses respectées', () => {
    const feuille = `:is(.x, .y) .a,\n.b { color: partage; }`;

    expect(declaration(feuille, '.b', 'color')).toBe('partage');
    expect(declaration(feuille, ':is(.x, .y) .a', 'color')).toBe('partage');
  });

  it('ne devrait pas lire une valeur citée en commentaire', () => {
    expect(declaration('.a { /* color: faux; */ color: vrai; }', '.a', 'color')).toBe('vrai');
  });
});
