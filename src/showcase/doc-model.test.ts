import { describe, expect, it } from 'vitest';
import type { DocGroupId, DocPage } from './doc-model';
import { GROUPS, HOME_SLUG, findPage, hrefFor, parseSlug } from './doc-model';

/* ============================================================================
   POURQUOI CE FICHIER EXISTE

   Le routage de la vitrine tient sur une chaîne de caractères qu'on ne
   maîtrise pas : le fragment. Il arrive écrit à la main par un spécimen
   (`#palette`), tapé par un visiteur (`palette`, avec ou sans barre finale),
   normalisé et percent-encodé par le navigateur, ou tronqué par un copier-coller
   (`%E0%A4%A`). Chacune de ces formes a un comportement attendu, et la dernière
   fait lever `decodeURIComponent` : non traitée, elle sert une page blanche.

   Ce fichier ne teste que le MODÈLE. Il n'importe pas le registre : les pages
   sont écrites à côté et changent, alors que les règles de lecture d'un
   fragment ne changent pas. `findPage` est donc éprouvé sur des pages de test.
   ========================================================================== */

/** Une page minimale — seul son `slug` compte pour `findPage`. */
function pageFixture(slug: string, group: DocGroupId = 'fondations'): DocPage {
  return { slug, label: `label ${slug}`, group, title: `titre ${slug}`, render: () => null };
}

describe('parseSlug', () => {
  /* Les quatre formes qui désignent la même page. Les deux premières viennent
     des liens écrits du temps de la page unique, les deux dernières d'une
     adresse tapée à la main. */
  it.each([['#/palette'], ['#palette'], ['palette'], ['#/palette/']])(
    'devrait rendre « palette » pour le fragment %s',
    (hash) => {
      expect(parseSlug(hash), `fragment « ${hash} » mal lu`).toBe('palette');
    },
  );

  it('devrait préserver un slug profond', () => {
    expect(parseSlug('#/composants/button')).toBe('composants/button');
  });

  it.each([[''], ['#'], ['#/']])('devrait rendre l’accueil pour le fragment vide %s', (hash) => {
    expect(
      parseSlug(hash),
      `fragment « ${hash} » : un fragment vide est l'accueil, pas une page inconnue`,
    ).toBe(HOME_SLUG);
  });

  it('devrait décoder un fragment percent-encodé valide', () => {
    expect(parseSlug('#/fondations/%C3%A9l%C3%A9vation')).toBe('fondations/élévation');
  });

  /* Le cas qui, non traité, ne rougit nulle part et sert une page blanche :
     `decodeURIComponent('%E0%A4%A')` lève `URIError`. La vitrine doit se replier
     sur l'accueil — un fragment tronqué reste une adresse qu'un visiteur a
     ouverte. */
  it('devrait rendre l’accueil pour un fragment malformé plutôt que lever', () => {
    expect(() => parseSlug('#/%E0%A4%A')).not.toThrow();
    expect(parseSlug('#/%E0%A4%A')).toBe(HOME_SLUG);
  });
});

describe('hrefFor', () => {
  it('devrait rendre la forme canonique #/slug', () => {
    expect(hrefFor('palette')).toBe('#/palette');
  });

  /* L'aller-retour est la propriété qui compte : la coquille écrit les liens
     avec `hrefFor` et relit le fragment avec `parseSlug`. Si les deux diverguent,
     un clic sur une entrée de nav n'ouvre pas la page de cette entrée. */
  it.each([[HOME_SLUG], ['palette'], ['composants/button']])(
    'devrait faire l’aller-retour avec parseSlug pour « %s »',
    (slug) => {
      expect(
        parseSlug(hrefFor(slug)),
        `hrefFor(« ${slug} ») = « ${hrefFor(slug)} » ne se relit pas en « ${slug} »`,
      ).toBe(slug);
    },
  );
});

describe('findPage', () => {
  const pages = [pageFixture(HOME_SLUG, 'introduction'), pageFixture('palette')];

  it('devrait trouver la page d’un slug connu', () => {
    expect(findPage(pages, 'palette')?.slug).toBe('palette');
  });

  it('devrait trouver l’accueil par son slug vide', () => {
    expect(findPage(pages, HOME_SLUG)?.group).toBe('introduction');
  });

  /* Le modèle ne décide pas du repli : rendre l'accueil pour un slug inconnu
     est la responsabilité de la coquille, qui seule peut aussi corriger
     l'adresse affichée. */
  it('devrait rendre undefined pour un slug inconnu, sans se replier lui-même', () => {
    expect(findPage(pages, 'composants/inexistant')).toBeUndefined();
  });
});

describe('GROUPS', () => {
  it('devrait n’avoir que des identifiants uniques', () => {
    const ids = GROUPS.map((group) => group.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(
      duplicates,
      `identifiants de groupe en double : ${duplicates.join(', ')} — la barre ` +
        `de navigation rendrait deux fois le même groupe`,
    ).toEqual([]);
  });

  /* L'ordre est un contrat d'affichage : on entre par l'introduction, on
     descend vers les fondations, puis vers les composants.

     TROIS GROUPES ET NON CINQ, ET LA LISTE A ÉTÉ RÉDUITE PLUTÔT QUE RELÂCHÉE.
     La 2.0 supprime `compositions` — ses deux pages assemblaient des composants
     qui ne sont plus publiés — et supprime le groupe des composants en verre EN TANT QUE GROUPE, ses
     quatorze pages étant montées dans `composants`. Le libellé de ce test
     pourrait tenir sur `GROUPS.length`, et ce serait un test plus faible : ce
     qu'on épingle est l'ORDRE et les NOMS, parce qu'un groupe renommé change
     toutes les adresses du site.

     Les groupes restent volontairement réduits à leur libellé : les détails
     appartiennent aux pages, pas à la barre de navigation. */
  it('devrait servir les groupes dans l’ordre d’affichage attendu', () => {
    expect(GROUPS.map((group) => group.id)).toEqual(['introduction', 'fondations', 'composants']);
  });

  it('devrait donner un libellé non vide à chaque groupe', () => {
    const unlabelled = GROUPS.filter((group) => group.label.trim() === '').map((group) => group.id);

    expect(unlabelled, `groupes sans libellé : ${unlabelled.join(', ')}`).toEqual([]);
  });
});
