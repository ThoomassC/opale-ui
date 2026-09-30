import { afterEach, describe, expect, it } from 'vitest';

import { activeElementOf, treeRootOf } from './tree-root';

/* =============================================================================
   LA PORTÉE D'ARBRE D'UN NŒUD : SON DOCUMENT, OU SA RACINE FANTÔME.

   `document` désigne le document de la fenêtre qui a chargé le script. Un
   composant rendu dans une racine fantôme (`attachShadow`) ou dans une iframe
   n'y vit pas : `document.activeElement` y renvoie l'HÔTE fantôme — ou
   l'iframe —, jamais l'élément qui a vraiment le focus.
   ========================================================================== */

afterEach(() => {
  document.body.replaceChildren();
});

function shadowButton() {
  const host = document.createElement('div');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const button = document.createElement('button');
  shadow.append(button);
  return { host, shadow, button };
}

describe('treeRootOf', () => {
  it('devrait rendre le document pour un nœud du document', () => {
    const button = document.createElement('button');
    document.body.append(button);

    expect(treeRootOf(button)).toBe(document);
  });

  it('devrait rendre la racine fantôme pour un nœud qui y vit', () => {
    const { shadow, button } = shadowButton();

    expect(treeRootOf(button)).toBe(shadow);
  });

  it('devrait rendre le document de l’iframe pour un nœud de l’iframe', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const doc = frame.contentDocument;
    if (!doc) throw new Error('jsdom n’a pas créé le document de l’iframe');
    const button = doc.createElement('button');
    doc.body.append(button);

    expect(treeRootOf(button)).toBe(doc);
  });

  it('devrait rendre null pour un nœud détaché', () => {
    expect(treeRootOf(document.createElement('div'))).toBeNull();
  });
});

describe('activeElementOf', () => {
  it('devrait rendre l’élément focalisé DANS la racine fantôme, pas son hôte', () => {
    const { host, shadow, button } = shadowButton();
    button.focus();

    expect(document.activeElement).toBe(host);
    expect(activeElementOf(shadow.firstChild as Node)).toBe(button);
  });

  it('devrait rendre l’élément actif du document pour un nœud du document', () => {
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();

    expect(activeElementOf(button)).toBe(button);
  });

  it('devrait retomber sur le document propriétaire d’un nœud détaché', () => {
    expect(activeElementOf(document.createElement('div'))).toBe(document.activeElement);
  });
});
