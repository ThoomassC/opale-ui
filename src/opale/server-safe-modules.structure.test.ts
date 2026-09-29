import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  SERVER_SAFE_BARRELS,
  SERVER_SAFE_DATA_MODULES,
  SERVER_SAFE_MODULES,
} from '../../scripts/server-safe-modules.mjs';
import { readConfig } from '../test/public-api';
import * as root from '.';

/* =============================================================================
   CE QUI SE LIVRE SANS "use client" DOIT POUVOIR S'EN PASSER.

   `scripts/server-safe-modules.mjs` nomme les modules que la bannière du build
   épargne. Ce fichier tient les deux promesses de cette liste, sur les
   sources :
   - un module de la liste n'importe pas React, et un module de DONNÉES
     n'importe rien d'autre qu'un autre module de données de la liste ;
   - toute valeur publique qui n'est ni un composant ni un crochet est déclarée
     dans un module de la liste — sinon, côté serveur, elle devient une
     référence client et ment sur son type (`ICON_NAMES.length === 0`).
   `scripts/check-dist.mjs` vérifie ensuite le build lui-même.
   ========================================================================== */

const OPALE = resolve(dirname(fileURLToPath(import.meta.url)));

const sourceOf = (modulePath: string): string | undefined =>
  ['.ts', '.tsx'].map((ext) => join(OPALE, `${modulePath}${ext}`)).find((file) => existsSync(file));

const modulePathOf = (file: string): string =>
  relative(OPALE, file)
    .replaceAll('\\', '/')
    .replace(/\.tsx?$/, '');

/** Les imports de valeurs d'une source : `import type` et `export type` sont effacés au build. */
function valueImports(file: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest);
  return source.statements.flatMap((statement) => {
    if (ts.isImportDeclaration(statement)) {
      if (statement.importClause?.isTypeOnly) return [];
      return ts.isStringLiteral(statement.moduleSpecifier) ? [statement.moduleSpecifier.text] : [];
    }
    if (ts.isExportDeclaration(statement) && statement.moduleSpecifier) {
      if (statement.isTypeOnly) return [];
      return ts.isStringLiteral(statement.moduleSpecifier) ? [statement.moduleSpecifier.text] : [];
    }
    return [];
  });
}

/** Le module de `src/opale` qu'un import relatif désigne, baril `index` compris. */
function resolveRelative(from: string, specifier: string): string | undefined {
  const base = resolve(dirname(from), specifier.replace(/\.js$/, ''));
  const file = [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].find((candidate) =>
    existsSync(candidate),
  );
  return file ? modulePathOf(file) : undefined;
}

describe('la liste des modules sans "use client"', () => {
  it.each([...SERVER_SAFE_MODULES])('%s devrait exister dans src/opale', (modulePath) => {
    expect(sourceOf(modulePath)).toBeDefined();
  });

  it.each([...SERVER_SAFE_MODULES])('%s ne devrait pas importer React', (modulePath) => {
    const file = sourceOf(modulePath) ?? '';
    const reactImports = valueImports(file).filter((specifier) =>
      /^react(-dom)?(\/|$)/.test(specifier),
    );
    expect(reactImports).toEqual([]);
  });

  it.each([...SERVER_SAFE_DATA_MODULES])(
    '%s ne devrait importer que des modules de données de la liste',
    (modulePath) => {
      const file = sourceOf(modulePath) ?? '';
      const outside = valueImports(file).filter((specifier) => {
        if (!specifier.startsWith('.')) return true;
        const target = resolveRelative(file, specifier);
        return !target || !SERVER_SAFE_DATA_MODULES.includes(target);
      });
      expect(outside).toEqual([]);
    },
  );

  it('ne devrait pas confondre baril et donnée', () => {
    expect(SERVER_SAFE_BARRELS.filter((name) => SERVER_SAFE_DATA_MODULES.includes(name))).toEqual(
      [],
    );
  });
});

/* Un composant ou un crochet a besoin de la directive ; tout le reste — une
   constante, un tableau, une fonction pure, le namespace — doit rester une
   vraie valeur côté serveur. */
const exported: Readonly<Record<string, unknown>> = root;
const needsClient = (name: string, value: unknown): boolean =>
  /^use[A-Z]/.test(name) ||
  (/^[A-Z][a-z]/.test(name) &&
    (typeof value === 'function' ||
      (typeof value === 'object' && value !== null && '$$typeof' in value)));

describe('les valeurs publiques qui ne sont pas des composants', () => {
  it('devraient être déclarées dans un module sans "use client"', () => {
    const { options, ambient } = readConfig();
    const entry = join(OPALE, 'index.ts');
    const program = ts.createProgram({ rootNames: [entry, ...ambient], options });
    const checker = program.getTypeChecker();
    const source = program.getSourceFile(entry);
    const moduleSymbol = source && checker.getSymbolAtLocation(source);
    if (!moduleSymbol) throw new Error(`Aucun module pour ${entry}`);

    const misplaced = Object.entries(exported)
      .filter(([name, value]) => !needsClient(name, value))
      .flatMap(([name]) => {
        const symbol = checker
          .getExportsOfModule(moduleSymbol)
          .find((candidate) => candidate.getName() === name);
        if (!symbol) return [`${name} : introuvable`];
        const target =
          symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
        const declaration = target.valueDeclaration ?? target.declarations?.[0];
        const modulePath = declaration ? modulePathOf(declaration.getSourceFile().fileName) : '';
        return SERVER_SAFE_MODULES.includes(modulePath) ? [] : [`${name} (${modulePath})`];
      });

    expect(misplaced).toEqual([]);
  }, 60_000);
});
