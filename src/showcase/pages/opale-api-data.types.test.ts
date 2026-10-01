import { describe, expect, it } from 'vitest';

import { loadPublicApi, type PublicProp } from '../../test/public-api';
import type { PropRow } from './api';
import { CATALOG_API } from './opale-api-data';

/* =============================================================================
   LA DOCUMENTATION DES PROPS EST CONFRONTÉE AUX TYPES PUBLIÉS.

   `CATALOG_API` est écrit à la main. Il décrit les props d'un premier usage,
   et rien ne l'empêchait de décrire une prop qui n'existe pas, d'annoncer
   facultative une prop requise, ou d'oublier une prop sans laquelle le
   composant ne compile pas. Ce garde lit les `XProps` exportés par l'entrée
   racine avec le compilateur, et rapproche chaque ligne de la réalité.
   ========================================================================== */

const TIMEOUT = 60_000;
const api = loadPublicApi();

const components = Object.keys(CATALOG_API).sort();

/* LE TYPE DES PROPS SE DÉDUIT DU NOM, SAUF QUAND LE NOM EST PRIS. `FieldProps`
   reste l'alias déprécié d'`InputProps` jusqu'en 3.0.0 : les props du `Field`
   de la 2.10.0 s'appellent donc `FieldWrapperProps`. */
const PROPS_TYPE_OF: Readonly<Record<string, string>> = { Field: 'FieldWrapperProps' };

function propsTypeOf(component: string): string {
  return PROPS_TYPE_OF[component] ?? `${component}Props`;
}

function propsOf(component: string): ReadonlyMap<string, PublicProp> {
  const props = api.propsOfType(propsTypeOf(component)) ?? [];
  return new Map(props.map((prop) => [prop.name, prop]));
}

/** Les lignes d'un tableau confrontées aux props de leur type. */
function driftsOf(
  rows: readonly PropRow[],
  typeName: string,
  props: ReadonlyMap<string, PublicProp>,
) {
  return rows.flatMap((row) => {
    const prop = props.get(row.name);
    if (!prop) return [`${row.name} : absente de ${typeName}`];
    const documented = row.required === true;
    if (documented === prop.required) return [];
    const say = (required: boolean) => (required ? 'requise' : 'facultative');
    return [`${row.name} : documentée ${say(documented)}, typée ${say(prop.required)}`];
  });
}

/* LES PARTIES D'UN COMPOSANT COMPOSÉ (`PopoverContent`, `Radio`…) ont leur
   propre tableau, confronté à leur propre type. */
const parts = Object.values(CATALOG_API)
  .flatMap((doc) => doc.parts ?? [])
  .map((part) => [part.name, part] as const);

describe('la documentation des props des parties', () => {
  it('devrait couvrir au moins une partie', () => {
    expect(parts.length).toBeGreaterThan(0);
  });

  it.each(parts)(
    'devrait ne documenter que des props réelles de %s',
    (name, part) => {
      const typeName = `${name}Props`;
      const props = new Map((api.propsOfType(typeName) ?? []).map((prop) => [prop.name, prop]));
      expect(props.size, `${typeName} n’est pas exporté`).toBeGreaterThan(0);
      expect(driftsOf(part.rows, typeName, props)).toEqual([]);
      expect(part.rows.map((row) => row.name).filter((row) => props.get(row)?.deprecated)).toEqual(
        [],
      );
    },
    TIMEOUT,
  );
});

describe('la documentation des props du catalogue', () => {
  it.each(components)(
    'devrait exporter le type des props de %s',
    (component) => {
      expect(
        api.propsOfType(propsTypeOf(component)),
        `${propsTypeOf(component)} n’est pas exporté`,
      ).toBeDefined();
    },
    TIMEOUT,
  );

  it.each(components)(
    'devrait ne documenter que des props réelles de %s, avec leur caractère requis',
    (component) => {
      const drifts = driftsOf(
        CATALOG_API[component].rows,
        propsTypeOf(component),
        propsOf(component),
      );
      expect(drifts).toEqual([]);
    },
    TIMEOUT,
  );

  it.each(components)(
    'devrait documenter chaque prop requise de %s',
    (component) => {
      const documented = new Set(CATALOG_API[component].rows.map((row) => row.name));
      const missing = [...propsOf(component).values()]
        .filter((prop) => prop.required && prop.name !== 'children' && !documented.has(prop.name))
        .map((prop) => prop.name);
      expect(missing).toEqual([]);
    },
    TIMEOUT,
  );

  it.each(components)(
    'ne devrait pas recommander de prop dépréciée de %s',
    (component) => {
      const props = propsOf(component);
      const deprecated = CATALOG_API[component].rows
        .map((row) => row.name)
        .filter((name) => props.get(name)?.deprecated === true);
      expect(deprecated).toEqual([]);
    },
    TIMEOUT,
  );
});
