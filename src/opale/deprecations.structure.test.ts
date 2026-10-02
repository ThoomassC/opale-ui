import { describe, expect, it } from 'vitest';

import { DEPRECATED_EXPORTS, DEPRECATED_PROPS } from './deprecations';

/* =============================================================================
   LA TABLE DES DÉPRÉCIATIONS ET LES `@deprecated` DU CODE NE DIVERGENT PAS.

   `deprecations.ts` alimente l'avertissement de développement et la page
   « Migrer vers la 3.0 ». Le JSDoc, lui, alimente l'éditeur. Deux sources pour
   un même fait : ce garde les rapproche, dans les deux sens, et vérifie que la
   version et le remplaçant annoncés sont les mêmes des deux côtés.

   UNE DÉCLARATION se repère par son fichier et le nom qui suit le commentaire :
   `components/modal/Modal.tsx#onClose`. `LegacySurfaceAnimationProps` porte un
   seul `@deprecated` pour trois composants : trois entrées, une clé.
   ========================================================================== */

const sources = import.meta.glob<string>(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

interface Declaration {
  readonly key: string;
  readonly since: string | undefined;
  readonly replacement: string | null;
}

const JSDOC = /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*([^\n]*)/g;
const DECLARED_NAME =
  /^(?:export\s+)?(?:declare\s+)?(?:readonly\s+)?(?:(?:type|const|let|interface|function)\s+)?([A-Za-z_$][\w$]*)/;

function declarationsOf(file: string, source: string): Declaration[] {
  const found: Declaration[] = [];
  for (const [, comment, next] of source.matchAll(JSDOC)) {
    /* La BALISE, pas le mot : un « `@deprecated` » cité entre accents graves
       dans une explication n'en est pas une. */
    const at = comment.search(/(?<=^|[\s*])@deprecated\b/);
    if (at === -1) continue;
    const name = DECLARED_NAME.exec(next.trim())?.[1];
    if (!name) throw new Error(`${file} : un @deprecated ne précède aucune déclaration lisible.`);
    const tag = comment.slice(at);
    found.push({
      key: `${file}#${name}`,
      since: /Depuis (\d+\.\d+)/.exec(tag)?.[1],
      replacement: /`([^`]+)`/.exec(tag)?.[1] ?? null,
    });
  }
  return found;
}

const DECLARATIONS = Object.entries(sources).flatMap(([path, source]) =>
  declarationsOf(path.replace(/^\.\//, ''), source),
);

const TABLE = [
  ...DEPRECATED_PROPS.map((entry) => ({
    key: `${entry.source}#${entry.prop}`,
    label: `${entry.component}.${entry.prop}`,
    since: entry.since,
    replacement: entry.replacement,
  })),
  ...DEPRECATED_EXPORTS.map((entry) => ({
    key: `${entry.source}#${entry.name.split('.').pop()}`,
    label: entry.name,
    since: entry.since,
    replacement: entry.replacement,
  })),
];

describe('la table des dépréciations', () => {
  it('balaie bien les sources de la librairie', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(40);
    expect(DECLARATIONS.length).toBeGreaterThan(30);
  });

  it('a une entrée pour chaque `@deprecated` du code', () => {
    const known = new Set(TABLE.map((entry) => entry.key));
    const missing = [...new Set(DECLARATIONS.map((declaration) => declaration.key))].filter(
      (key) => !known.has(key),
    );

    expect(
      missing,
      'Ces déclarations portent `@deprecated` sans entrée dans `src/opale/deprecations.ts` : ' +
        'ajoutez-les, sans quoi ni la console ni le guide de migration ne les connaissent.',
    ).toEqual([]);
  });

  it('ne tient aucune entrée sans `@deprecated` dans le code', () => {
    const declared = new Set(DECLARATIONS.map((declaration) => declaration.key));
    const orphans = TABLE.filter((entry) => !declared.has(entry.key)).map((entry) => entry.label);

    expect(
      orphans,
      'Ces entrées de `deprecations.ts` ne correspondent à aucun `@deprecated` : ' +
        'le JSDoc a disparu, ou le fichier `source` est faux.',
    ).toEqual([]);
  });

  it('annonce la même version et le même remplaçant que le JSDoc', () => {
    const mismatches = TABLE.flatMap((entry) =>
      DECLARATIONS.filter((declaration) => declaration.key === entry.key)
        .filter(
          (declaration) =>
            declaration.since !== entry.since || declaration.replacement !== entry.replacement,
        )
        .map(
          (declaration) =>
            `${entry.label} : table ${entry.since} → ${entry.replacement}, ` +
            `JSDoc ${declaration.since} → ${declaration.replacement}`,
        ),
    );

    expect(mismatches).toEqual([]);
  });

  it('ne déclare pas deux fois le même couple composant + prop', () => {
    const pairs = DEPRECATED_PROPS.map((entry) => `${entry.component}.${entry.prop}`);
    expect(pairs.filter((pair, index) => pairs.indexOf(pair) !== index)).toEqual([]);
  });
});
