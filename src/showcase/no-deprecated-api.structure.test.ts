import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { loadPublicApi, readConfig } from '../test/public-api';

/* =============================================================================
   LA VITRINE N'ENSEIGNE PAS L'API DÉPRÉCIÉE.

   Depuis 3.6, les anciens noms (`OpaleUI`, `Opale.Background`, `onClose`,
   `activeItemId`, `size="sm"`…) compilent encore et portent `@deprecated`. La
   vitrine est la première chose qu'on recopie : elle ne doit plus les montrer,
   ni dans son code, ni dans les extraits qu'elle affiche.

   DEUX LECTURES, parce qu'il y a deux sortes de code.
   1. LE CODE DE LA VITRINE est lu par le vérificateur de TypeScript : tout
      symbole d'Opale qui porte `@deprecated` — export, membre, prop JSX,
      champ d'objet — est refusé, sans liste à tenir à jour.
   2. LES EXTRAITS AFFICHÉS sont des gabarits de texte. Ils sont analysés comme
      du TSX, sans types : une balise d'Opale y est rapprochée des props
      dépréciées de son `XProps`, et un nom d'export déprécié y est refusé dès
      qu'il est importé, qualifié ou typé.
   Les valeurs héritées d'une taille (`sm`, `compact`…) ne sont pas des
   symboles : elles sont cherchées sur `size` et `headerSize`.

   Un fichier témoin, hors vitrine, prouve que chaque lecture voit ce qu'elle
   prétend voir.
   ========================================================================== */

const TIMEOUT = 60_000;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SHOWCASE = join(ROOT, 'src/showcase');
const OPALE = join(ROOT, 'src/opale');
const FIXTURE = join(ROOT, 'src/test/deprecated-api.fixture.tsx');

const LEGACY_SIZES = new Set(['sm', 'md', 'lg', 'compact', 'comfortable', 'spacious']);
const SIZE_PROPS = new Set(['size', 'headerSize']);

const showcaseFiles = ts.sys
  .readDirectory(SHOWCASE, ['.ts', '.tsx'])
  .filter((file) => !/\.test\.tsx?$/.test(file) && !file.endsWith('.d.ts'));

const { options, ambient } = readConfig();
const program = ts.createProgram({ rootNames: [...showcaseFiles, FIXTURE, ...ambient], options });
const checker = program.getTypeChecker();
const api = loadPublicApi();

const deprecatedExports = new Set(api.exportNames.filter((name) => api.isDeprecated(name)));

function isOpaleSymbol(symbol: ts.Symbol): boolean {
  return (symbol.declarations ?? []).some((declaration) =>
    declaration.getSourceFile().fileName.startsWith(OPALE),
  );
}

const isDeprecated = (symbol: ts.Symbol) =>
  isOpaleSymbol(symbol) && symbol.getJsDocTags(checker).some((tag) => tag.name === 'deprecated');

/* Une prop JSX ou un champ d'objet a son propre symbole, local : c'est la
   propriété du type attendu qui porte la dépréciation. */
function targetOf(node: ts.Identifier): ts.Symbol | undefined {
  const { parent } = node;
  const container =
    ts.isJsxAttribute(parent) && parent.name === node
      ? parent.parent
      : (ts.isPropertyAssignment(parent) || ts.isShorthandPropertyAssignment(parent)) &&
          parent.name === node
        ? parent.parent
        : undefined;
  if (container) {
    const expected = checker.getContextualType(container);
    return expected ? checker.getPropertyOfType(expected, node.text) : undefined;
  }
  const symbol = checker.getSymbolAtLocation(node);
  return symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

function literalOf(initializer: ts.JsxAttributeValue | undefined): string | undefined {
  if (!initializer) return undefined;
  if (ts.isStringLiteral(initializer)) return initializer.text;
  if (ts.isJsxExpression(initializer) && initializer.expression) {
    const { expression } = initializer;
    if (ts.isStringLiteralLike(expression)) return expression.text;
  }
  return undefined;
}

function where(source: ts.SourceFile, node: ts.Node, offsetLine = 0): string {
  const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
  return `${relative(ROOT, source.fileName)}:${line + 1 + offsetLine}`;
}

/* ---- 1. Le code, lu avec ses types. */
function typedFindings(source: ts.SourceFile): string[] {
  const findings: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isIdentifier(node)) {
      const symbol = targetOf(node);
      if (symbol && isDeprecated(symbol)) findings.push(`${where(source, node)} ${node.text}`);
    }
    if (
      ts.isJsxAttribute(node) &&
      ts.isIdentifier(node.name) &&
      SIZE_PROPS.has(node.name.text) &&
      LEGACY_SIZES.has(literalOf(node.initializer) ?? '')
    ) {
      const symbol = targetOf(node.name);
      if (symbol && isOpaleSymbol(symbol)) {
        findings.push(`${where(source, node)} ${node.name.text}="${literalOf(node.initializer)}"`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return findings;
}

/* ---- 2. Les extraits, lus comme du texte TSX. */
function templateText(node: ts.TemplateLiteral): string {
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return node.head.text + node.templateSpans.map((span) => `x${span.literal.text}`).join('');
}

function tagNameOf(tag: ts.JsxTagNameExpression): string {
  return tag.getText().replace(/^Opale\./, '');
}

function snippetFindings(text: string): string[] {
  const snippet = ts.createSourceFile(
    'snippet.tsx',
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const findings: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = tagNameOf(node.tagName);
      const props = api.propsOfType(`${tag.replace('.', '')}Props`);
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute) || !ts.isIdentifier(attribute.name)) continue;
        const name = attribute.name.text;
        if (props?.some((prop) => prop.name === name && prop.deprecated)) {
          findings.push(`<${tag} ${name}>`);
        }
        if (
          props &&
          SIZE_PROPS.has(name) &&
          LEGACY_SIZES.has(literalOf(attribute.initializer) ?? '')
        ) {
          findings.push(`<${tag} ${name}="${literalOf(attribute.initializer)}">`);
        }
      }
    }
    const named =
      ts.isImportSpecifier(node) || ts.isTypeReferenceNode(node)
        ? ts.isImportSpecifier(node)
          ? node.name.text
          : node.typeName.getText()
        : ts.isPropertyAccessExpression(node)
          ? node.expression.getText()
          : undefined;
    if (named && deprecatedExports.has(named)) findings.push(named);
    if (ts.isPropertyAccessExpression(node) && node.getText() === 'Opale.Background') {
      findings.push('Opale.Background');
    }
    ts.forEachChild(node, visit);
  };
  visit(snippet);
  return [...new Set(findings)];
}

function templateFindings(source: ts.SourceFile): string[] {
  const findings: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      for (const finding of snippetFindings(templateText(node))) {
        findings.push(`${where(source, node)} (extrait) ${finding}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return findings;
}

function findingsOf(file: string): string[] {
  const source = program.getSourceFile(file);
  if (!source) throw new Error(`Fichier absent du programme : ${file}`);
  return [...typedFindings(source), ...templateFindings(source)];
}

describe('l’API dépréciée dans la vitrine', () => {
  it('balaie bien les sources de la vitrine', () => {
    expect(showcaseFiles.length).toBeGreaterThan(40);
    expect(deprecatedExports).toContain('OpaleUI');
  });

  it(
    'voit chaque forme dépréciée du fichier témoin',
    () => {
      const found = findingsOf(FIXTURE).map((finding) => finding.replace(/^\S+ /, ''));
      expect(found).toEqual(
        expect.arrayContaining([
          'OpaleUI',
          'Background',
          'variant',
          'onCancel',
          'activeItemId',
          'density',
          'emptyMessage',
          'size="sm"',
          'size="spacious"',
          '(extrait) OpaleUI',
          '(extrait) <ConfirmDialog onCancel>',
          '(extrait) <Modal size="lg">',
          '(extrait) <Modal onClose>',
          '(extrait) <Pagination page>',
        ]),
      );
    },
    TIMEOUT,
  );

  it(
    'ne trouve aucun nom déprécié dans le code ni les extraits de la vitrine',
    () => {
      expect(showcaseFiles.flatMap(findingsOf)).toEqual([]);
    },
    TIMEOUT,
  );
});
