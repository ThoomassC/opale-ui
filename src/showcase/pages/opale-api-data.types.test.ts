import { describe, expect, it } from 'vitest';

import { loadPublicApi, type PublicProp } from '../../test/public-api';
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

function propsOf(component: string): ReadonlyMap<string, PublicProp> {
  const props = api.propsOfType(`${component}Props`) ?? [];
  return new Map(props.map((prop) => [prop.name, prop]));
}

describe('la documentation des props du catalogue', () => {
  it.each(components)(
    'devrait exporter le type des props de %s',
    (component) => {
      expect(
        api.propsOfType(`${component}Props`),
        `${component}Props n’est pas exporté`,
      ).toBeDefined();
    },
    TIMEOUT,
  );

  it.each(components)(
    'devrait ne documenter que des props réelles de %s, avec leur caractère requis',
    (component) => {
      const props = propsOf(component);
      const drifts = CATALOG_API[component].rows.flatMap((row) => {
        const prop = props.get(row.name);
        if (!prop) return [`${row.name} : absente de ${component}Props`];
        const documented = row.required === true;
        if (documented === prop.required) return [];
        const say = (required: boolean) => (required ? 'requise' : 'facultative');
        return [`${row.name} : documentée ${say(documented)}, typée ${say(prop.required)}`];
      });
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
