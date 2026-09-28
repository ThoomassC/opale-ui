import { readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/* =============================================================================
   UNE SEULE CONVENTION D'IMPORT DANS LES EXTRAITS.

   Les composants s'importent par leur nom depuis `@thomascaron/opale-ui`, et
   la feuille `@thomascaron/opale-ui/opale.css` une seule fois, à la racine de
   l'application. La page Installation l'explique ; c'est le seul endroit de
   la vitrine qui importe la feuille. Les autres extraits montrent le
   composant, pas la mise en place de l'application.

   UN EXTRAIT est un littéral de chaîne qui contient du JSX d'Opale ou un
   import. Les exemples du catalogue (`opale-components.tsx`) sont écrits avec
   `Opale.X` pour que la vitrine puisse viser une balise, puis réécrits en
   imports nommés avant l'affichage : leur rendu est vérifié par
   `opale-components.test.tsx`, pas ici.
   ========================================================================== */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SHOWCASE = join(ROOT, 'src/showcase');
const REWRITTEN = new Set(['src/showcase/pages/opale-components.tsx']);
const STYLESHEET_OWNER = 'src/showcase/pages/installation.tsx';
const STYLESHEET = /import '@thomascaron\/opale-ui\/opale\.css'/g;

const files = ts.sys
  .readDirectory(SHOWCASE, ['.ts', '.tsx'])
  .filter((file) => !/\.test\.tsx?$/.test(file) && !file.endsWith('.d.ts'))
  .map((file) => relative(ROOT, file));

interface Snippet {
  readonly where: string;
  readonly text: string;
}

function isSnippet(text: string): boolean {
  return /<(?:Opale\.)?[A-Z]\w*[\s/>]/.test(text) || /^\s*import\s/m.test(text);
}

function snippetsOf(file: string): readonly Snippet[] {
  const source = ts.createSourceFile(
    file,
    readFileSync(join(ROOT, file), 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const found: Snippet[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateExpression(node) ||
      ts.isJsxText(node)
    ) {
      const text = ts.isTemplateExpression(node)
        ? node.head.text + node.templateSpans.map((span) => `x${span.literal.text}`).join('')
        : node.text;
      if (isSnippet(text)) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
        found.push({ where: `${file}:${line + 1}`, text });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

const SNIPPETS = files.flatMap(snippetsOf);

function readmeBlocks(): readonly string[] {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  return [...readme.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map(([, body]) => body ?? '');
}

describe('la convention d’import des extraits', () => {
  it('balaie bien les extraits de la vitrine et du README', () => {
    expect(SNIPPETS.length).toBeGreaterThan(20);
    expect(readmeBlocks().length).toBeGreaterThan(3);
  });

  it('n’emploie ni l’espace de noms Opale ni OpaleUI dans un extrait affiché', () => {
    const guilty = SNIPPETS.filter(
      ({ where, text }) =>
        !REWRITTEN.has(where.replace(/:\d+$/, '')) && /\bOpale(?:UI\b|\.[A-Z])/.test(text),
    ).map(({ where }) => where);

    expect(guilty).toEqual([]);
  });

  it('n’importe la feuille que sur la page Installation, une fois par extrait', () => {
    const importing = SNIPPETS.filter(({ text }) => (text.match(STYLESHEET) ?? []).length > 0);

    expect(importing.map(({ where }) => where.replace(/:\d+$/, ''))).toEqual(
      importing.map(() => STYLESHEET_OWNER),
    );
    expect(importing.length).toBeGreaterThan(0);
    for (const { where, text } of importing) {
      expect((text.match(STYLESHEET) ?? []).length, where).toBe(1);
    }
  });

  it('suit la même convention dans le README, feuille importée une seule fois', () => {
    const blocks = readmeBlocks();

    expect(blocks.filter((block) => /\bOpale(?:UI\b|\.[A-Z])/.test(block))).toEqual([]);
    expect(blocks.join('\n').match(STYLESHEET) ?? []).toHaveLength(1);
  });
});
