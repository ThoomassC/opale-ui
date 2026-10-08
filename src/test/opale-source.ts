/* La source du catalogue d'Opale, lue comme un seul texte par les gardes qui
   découpent le corps d'un composant entre deux déclarations de premier niveau.

   Les modules de `src/opale/catalog/` sont mis bout à bout, déclarations
   d'import retirées : un import en tête de fichier n'appartient pas au corps
   du dernier composant du module précédent. Un module ajouté au catalogue
   s'ajoute ici. */

import cookieConsent from '../opale/catalog/cookie-consent.ts?raw';
import display from '../opale/catalog/display.tsx?raw';
import feedback from '../opale/catalog/feedback.tsx?raw';
import forms from '../opale/catalog/forms.tsx?raw';
import layout from '../opale/catalog/layout.tsx?raw';
import modules from '../opale/catalog/modules.tsx?raw';
import namespace from '../opale/opale-namespace.ts?raw';
import navigation from '../opale/catalog/navigation.tsx?raw';
import shells from '../opale/catalog/shells.tsx?raw';
import svgMap from '../opale/catalog/svg-map.tsx?raw';
import toastAnchors from '../opale/catalog/toast-anchors.ts?raw';
import worldMap from '../opale/catalog/world-map.tsx?raw';

const IMPORT_DECLARATION = /^import\b[^;]*;[ \t]*\r?\n/gm;

/** Les modules du catalogue, dans l'ordre de lecture. */
export const OPALE_CATALOG_MODULES: readonly string[] = [
  shells,
  forms,
  display,
  toastAnchors,
  feedback,
  navigation,
  cookieConsent,
  layout,
  modules,
  svgMap,
  worldMap,
  namespace,
];

/** Le texte de tous les modules du catalogue, sans leurs déclarations d'import. */
export const OPALE_CATALOG_SOURCE: string = OPALE_CATALOG_MODULES.map((source) =>
  source.replace(IMPORT_DECLARATION, ''),
).join('\n');
