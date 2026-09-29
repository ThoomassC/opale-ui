import { afterEach, describe, expect, it } from 'vitest';

/* Le complément `inert` est installé par `setup.ts`. S'il cessait d'agir, les
   tests de restitution du focus du modal repasseraient à vide : ils sont
   verts sur un défaut réel quand jsdom ignore `inert`. Ce fichier tient donc
   le complément lui-même. */

afterEach(() => {
  document.body.replaceChildren();
});

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.body.querySelector('button')!;
};

describe('le complément inert de jsdom', () => {
  it('devrait refuser le focus à un élément dont un ancêtre est inerte', () => {
    const button = mount('<div inert><button type="button">x</button></div>');

    button.focus();

    expect(document.activeElement).not.toBe(button);
  });

  it('devrait refuser le focus à un élément inerte lui-même', () => {
    const button = mount('<button type="button" inert>x</button>');

    button.focus();

    expect(document.activeElement).not.toBe(button);
  });

  it('devrait rendre le focus possible dès que l’inertie est levée', () => {
    const button = mount('<div inert><button type="button">x</button></div>');
    document.body.querySelector('div')!.removeAttribute('inert');

    button.focus();

    expect(document.activeElement).toBe(button);
  });
});
