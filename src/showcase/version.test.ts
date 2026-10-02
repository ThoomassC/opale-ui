import { describe, expect, it } from 'vitest';
/* Le VRAI fichier, lu tel qu'il est sur le disque. `?raw` et non un import de
   module JSON : la vitrine se garde d'ouvrir `resolveJsonModule` — c'est la
   raison d'être de la constante — et son test ne doit pas l'ouvrir à sa place.
   Le chemin est relatif à CE fichier, donc juste quel que soit le répertoire
   depuis lequel la suite est lancée. */
import manifestSource from '../../package.json?raw';
import { UI_VERSION } from './version';

/* ============================================================================
   POURQUOI CE FICHIER EXISTE

   `UI_VERSION` est une constante RECOPIÉE À LA MAIN depuis `package.json` —
   choix assumé pour ne pas ouvrir `resolveJsonModule` sur le paquet publié.
   Une copie que rien ne tient dérive : la barre de navigation afficherait
   « 0.4.0 » sur une librairie publiée en 0.6.0, et aucune suite ne rougirait.

   Ce test lit donc le VRAI fichier. Pas la valeur recopiée une seconde fois
   dans le test — ce qui ne comparerait que deux copies entre elles et laisserait
   passer exactement la dérive qu'on veut attraper.
   ========================================================================== */

const MANIFEST = 'package.json';

/** Un semver de publication : trois nombres, rien d'autre. */
const RELEASE_SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

/** La version du vrai `package.json`, lue sans faire confiance à sa forme. */
function readManifestVersion(): string {
  const parsed: unknown = JSON.parse(manifestSource);

  if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
    throw new Error(`${MANIFEST} ne déclare aucun champ « version »`);
  }

  const { version } = parsed;

  if (typeof version !== 'string') {
    throw new Error(`la « version » de ${MANIFEST} n'est pas une chaîne mais un ${typeof version}`);
  }

  return version;
}

describe('UI_VERSION', () => {
  it('devrait valoir exactement la version déclarée par package.json', () => {
    const declared = readManifestVersion();

    expect(
      UI_VERSION,
      `la vitrine annoncerait « ${UI_VERSION} » alors que ${MANIFEST} publie ` +
        `« ${declared} » — reporter la valeur dans src/showcase/version.ts`,
    ).toBe(declared);
  });

  it('devrait avoir la forme d’un semver de publication major.minor.patch', () => {
    expect(
      UI_VERSION,
      `« ${UI_VERSION} » n'est pas une version de publication : ni pré-version, ` +
        `ni métadonnée de build, ni plage — trois nombres séparés par des points`,
    ).toMatch(RELEASE_SEMVER);
  });

  it('devrait annoncer un major au moins égal à 1, la librairie étant publiée', () => {
    const [major = ''] = UI_VERSION.split('.');

    expect(
      Number(major),
      `major lu « ${major} » dans « ${UI_VERSION} » — la librairie est en 1.0, ` +
        `un 0.x signalerait une version de développement affichée en vitrine`,
    ).toBeGreaterThanOrEqual(1);
  });
});
