import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

/* =============================================================================
   LA SURFACE PUBLIQUE, LUE PAR LE COMPILATEUR ET NON PAR UNE EXPRESSION
   RATIONNELLE.

   Ce que le paquet exporte est ce que `src/opale/index.ts` rend visible, une
   fois les `export *` et les réexports de type résolus. Seul le vérificateur
   de TypeScript sait faire ce calcul : il suit les barils, les alias et les
   `Omit`, et il sait si une prop est facultative ou `@deprecated`.

   Le programme est construit une seule fois par processus de test, avec les
   options de `tsconfig.app.json`.
   ========================================================================== */

export interface PublicProp {
  readonly name: string;
  readonly required: boolean;
  readonly deprecated: boolean;
}

export interface PublicApi {
  /** Les noms exportés par l'entrée racine, triés. */
  readonly exportNames: readonly string[];
  /** Les props d'un type exporté (`ButtonProps`…), ou `undefined` s'il n'est pas exporté. */
  propsOfType(typeName: string): readonly PublicProp[] | undefined;
  /** Vrai si l'export porte `@deprecated` ; `undefined` s'il n'est pas exporté. */
  isDeprecated(exportName: string): boolean | undefined;
  /** Les membres de la valeur exportée (`Opale.Background`…) qui portent `@deprecated`, triés. */
  deprecatedMembersOf(exportName: string): readonly string[] | undefined;
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ENTRY = join(ROOT, 'src/opale/index.ts');

/* Les options de l'application, et ses déclarations ambiantes (`*.module.scss`,
   `vite/client`) : sans elles, les imports de feuilles ne se résolvent pas. */
export function readConfig(): { options: ts.CompilerOptions; ambient: string[] } {
  const configPath = join(ROOT, 'tsconfig.app.json');
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, ROOT, undefined, configPath);
  return {
    options: { ...parsed.options, noEmit: true },
    ambient: parsed.fileNames.filter((file) => file.endsWith('.d.ts')),
  };
}

/* `getAliasedSymbol` lève une erreur interne sur un symbole qui n'est pas un
   alias : on ne résout que ce qui en est un. */
function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
}

const isDeprecatedSymbol = (checker: ts.TypeChecker, symbol: ts.Symbol) =>
  symbol.getJsDocTags(checker).some((tag) => tag.name === 'deprecated');

let cached: PublicApi | undefined;

export function loadPublicApi(): PublicApi {
  if (cached) return cached;

  const { options, ambient } = readConfig();
  const program = ts.createProgram({ rootNames: [ENTRY, ...ambient], options });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(ENTRY);
  if (!source) throw new Error(`Entrée introuvable : ${ENTRY}`);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`Aucun module pour ${ENTRY}`);

  const exports = new Map(
    checker.getExportsOfModule(moduleSymbol).map((symbol) => [symbol.getName(), symbol]),
  );

  cached = {
    exportNames: [...exports.keys()].sort(),
    propsOfType(typeName) {
      const exported = exports.get(typeName);
      if (!exported) return undefined;
      const symbol = resolveAlias(checker, exported);
      if (!(symbol.flags & (ts.SymbolFlags.Interface | ts.SymbolFlags.TypeAlias))) return undefined;
      const type = checker.getDeclaredTypeOfSymbol(symbol);
      return checker.getPropertiesOfType(type).map((prop) => ({
        name: prop.getName(),
        required: !(prop.flags & ts.SymbolFlags.Optional),
        deprecated: isDeprecatedSymbol(checker, prop),
      }));
    },
    isDeprecated(exportName) {
      const exported = exports.get(exportName);
      return exported ? isDeprecatedSymbol(checker, resolveAlias(checker, exported)) : undefined;
    },
    deprecatedMembersOf(exportName) {
      const exported = exports.get(exportName);
      if (!exported) return undefined;
      const type = checker.getTypeOfSymbol(resolveAlias(checker, exported));
      return checker
        .getPropertiesOfType(type)
        .filter((member) => isDeprecatedSymbol(checker, member))
        .map((member) => member.getName())
        .sort();
    },
  };
  return cached;
}
