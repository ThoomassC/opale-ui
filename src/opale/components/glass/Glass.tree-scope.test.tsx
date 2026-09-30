import { act, cleanup, render } from '@testing-library/react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import Glass from './Glass';

/* =============================================================================
   LE FILTRE DE VERRE VIT DANS LA PORTÉE D'ARBRE DU VERRE (ROB-09).

   `filter: url('#opale-glass-displacement')` se résout dans la portée d'arbre
   de l'élément filtré : son document, ou sa racine fantôme. Posé dans le
   `<body>` du document de la fenêtre, le filtre est INTROUVABLE pour un verre
   rendu dans une racine fantôme ou dans une iframe — le déplacement disparaît
   sans un mot. Le filtre est donc posé une fois PAR PORTÉE, et retiré avec le
   dernier verre de cette portée.
   ========================================================================== */

const FILTER_ID = 'opale-glass-displacement';

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

function shadowMount() {
  const host = document.createElement('div');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const mount = document.createElement('div');
  shadow.append(mount);
  return { shadow, mount };
}

describe('Glass — le filtre dans une racine fantôme', () => {
  it('devrait poser le filtre dans la racine fantôme, et nulle part ailleurs', () => {
    const { shadow, mount } = shadowMount();

    render(<Glass>Verre</Glass>, { container: mount });

    expect(shadow.getElementById(FILTER_ID)).not.toBeNull();
    expect(document.getElementById(FILTER_ID)).toBeNull();
  });

  it('devrait tenir un filtre par portée, chacun retiré avec son dernier verre', () => {
    const { shadow, mount } = shadowMount();
    const outside = render(<Glass>Dehors</Glass>);
    const inside = render(<Glass>Dedans</Glass>, { container: mount });

    expect(document.querySelectorAll(`#${FILTER_ID}`)).toHaveLength(1);
    expect(shadow.querySelectorAll(`#${FILTER_ID}`)).toHaveLength(1);

    inside.unmount();
    expect(shadow.getElementById(FILTER_ID)).toBeNull();
    expect(document.getElementById(FILTER_ID)).not.toBeNull();

    outside.unmount();
    expect(document.getElementById(FILTER_ID)).toBeNull();
  });
});

describe('Glass — le filtre dans une iframe', () => {
  it('devrait poser le filtre dans le document de l’iframe', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const doc = frame.contentDocument;
    if (!doc) throw new Error('jsdom n’a pas créé le document de l’iframe');
    const mount = doc.createElement('div');
    doc.body.append(mount);
    const root = createRoot(mount);

    act(() => root.render(<Glass>Verre</Glass>));

    expect(doc.getElementById(FILTER_ID)?.closest('svg')?.parentNode).toBe(doc.body);
    expect(document.getElementById(FILTER_ID)).toBeNull();

    act(() => root.unmount());
    expect(doc.getElementById(FILTER_ID)).toBeNull();
  });
});
