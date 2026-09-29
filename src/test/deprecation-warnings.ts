import { afterEach, beforeEach, expect, vi, type MockInstance } from 'vitest';

import { DEPRECATED_PROPS, deprecationMessage } from '../opale/deprecations';

/* =============================================================================
   UN FICHIER DE TEST QUI EMPLOIE DES NOMS DÉPRÉCIÉS LE DIT.

   Depuis 3.9, une prop dépréciée écrit un avertissement en développement — et
   Vitest tourne en `NODE_ENV=test`. Les tests de compatibilité exercent
   l'ancienne API EXPRÈS ; d'autres la croisent en passant. Leurs
   avertissements ne doivent ni polluer la sortie, ni masquer un vrai
   avertissement : cet espion les RECUEILLE, puis vérifie après chaque test
   que tout ce qui est parti par `console.warn` est bien un message de la
   table des dépréciations, mot pour mot. Tout autre avertissement fait
   échouer le test qui l'a émis.

   Local au fichier qui l'appelle, jamais global : un fichier qui n'en a pas
   besoin garde une console intacte.
   ========================================================================== */

const KNOWN = new Set<string>(DEPRECATED_PROPS.map(deprecationMessage));

/** À appeler au premier niveau d'un fichier qui emploie volontairement l'ancienne API. */
export function expectOnlyDeprecationWarnings(): void {
  let warn: MockInstance<typeof console.warn> | undefined;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    const unexpected = (warn?.mock.calls ?? [])
      .map((args) => args.map(String).join(' '))
      .filter((message) => !KNOWN.has(message));
    warn?.mockRestore();
    expect(
      unexpected,
      'console.warn a reçu autre chose qu’un avertissement de dépréciation d’Opale',
    ).toEqual([]);
  });
}
