import { describe, expect, it } from 'vitest';

import { declarations, parseRules } from '../test/css-rules';
import mainSource from '../main.tsx?raw';
import hackSource from './hack-font.css?raw';

/* =============================================================================
   LA VITRINE NE LIVRE QUE LES FACES DE HACK QU'ELLE PEINT.

   Hack ne sert qu'au code : le texte en romain, les balises et les commandes
   en gras (`.tc-doc-token--tag`, `--command`), les commentaires en italique
   (`--comment`). Aucune règle ne demande le gras italique. La feuille du
   paquet `hack-font` déclarait les quatre faces, chacune en woff2 et en woff :
   huit fichiers dans `dist-showcase`, là où trois woff2 suffisent — tout
   navigateur visé lit le woff2.
   ========================================================================== */

const faces = parseRules(hackSource)
  .filter((rule) => rule.prelude === '@font-face')
  .map((rule) => declarations(`.face { ${rule.body} }`, '.face'));

describe('les faces de Hack', () => {
  it('remplacent la feuille complète du paquet', () => {
    expect(mainSource).not.toContain('hack-font/build/web/hack.css');
    expect(mainSource).toContain("import './styles/hack-font.css';");
  });

  it('sont le romain, le gras et l’italique, et rien d’autre', () => {
    const shapes = faces.map((face) => `${face.get('font-weight')} ${face.get('font-style')}`);
    expect(shapes).toEqual(['400 normal', '700 normal', '400 italic']);
  });

  it('ne pointent que vers du woff2', () => {
    for (const face of faces) {
      expect(face.get('font-family')).toBe("'Hack'");
      const src = face.get('src') ?? '';
      expect(src).toMatch(/format\('woff2'\)/);
      expect(src).not.toMatch(/\.woff['?)]/);
      expect(src.match(/url\(/g)).toHaveLength(1);
    }
  });
});
