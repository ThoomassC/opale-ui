import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import { UI_VERSION } from './version';

/* =============================================================================
   LA VERSION AFFICHÉE DOIT EXISTER COMME TAG, SANS QUOI ON DONNE UNE COMMANDE
   D'INSTALLATION QUI ÉCHOUE.

   LE DÉFAUT QUI A MOTIVÉ CE FICHIER. La page « Installation » construit sa
   commande depuis `UI_VERSION` :

       npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v3.0.0"

   Or le dépôt distant ne portait que `v0.1.0` et `v0.2.0`, alors que les
   archives figées allaient jusqu'à `v2.1.0`. La commande affichée échouait donc
   depuis quatre versions, et rien ne le signalait : ni un test — il n'y en
   avait pas sur ce point —, ni la page, qui se contente d'interpoler une
   chaîne. Un visiteur suivait la documentation et obtenait une erreur.

   CE QUE CE TEST VÉRIFIE, ET CE QU'IL NE PEUT PAS VÉRIFIER. Il lit les tags
   LOCAUX. Il ne contacte pas le réseau : un test qui dépend du distant échoue
   dans un train, et on finit par le désactiver. La publication du tag sur
   `origin` est donc du ressort de `npm run release`, qui pousse dans le même
   geste ; ce test constate que le geste a bien eu lieu ici.

   POURQUOI IL NE ROUGIT PAS PENDANT LA PRÉPARATION D'UNE VERSION. Parce que le
   numéro et le tag se posent ENSEMBLE, par le script. Monter `UI_VERSION` sans
   taguer est précisément l'erreur qu'on veut voir, pas un état de travail
   normal : la montée de version est le dernier geste avant la publication, pas
   le premier de la branche.

   L'ENVIRONNEMENT SANS TAGS EST DISTINGUÉ DE L'ABSENCE D'UN TAG. Un clone
   superficiel — ce que fait la plupart des intégrations continues par défaut —
   n'a AUCUN tag. Y faire échouer le test ne dirait rien sur la publication et
   apprendrait seulement à l'ignorer. Le cas est donc reconnu et annoncé, et il
   ne peut pas masquer le vrai défaut : il ne se déclenche que si la liste est
   entièrement vide, alors qu'un tag oublié laisse tous les autres en place.
   ========================================================================== */

/** Les tags du dépôt local, ou `null` si l'on n'est pas dans un dépôt Git. */
function localTags(): readonly string[] | null {
  try {
    return execFileSync('git', ['tag', '--list'], { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

describe('le tag de la version publiée', () => {
  const tags = localTags();

  it('existe pour la version que la vitrine annonce', () => {
    if (tags === null) {
      console.warn('Pas de dépôt Git accessible : vérification du tag ignorée.');
      return;
    }

    if (tags.length === 0) {
      console.warn('Aucun tag dans ce clone (clone superficiel ?) : vérification ignorée.');
      return;
    }

    expect(
      tags,
      `La vitrine annonce v${UI_VERSION}, et aucun tag « v${UI_VERSION} » n'existe.\n\n` +
        `La page « Installation » affiche pourtant :\n` +
        `  npm i "@thomascaron/opale-ui@github:ThoomassC/opale-ui#v${UI_VERSION}"\n` +
        `Cette commande échoue tant que le tag n'est pas publié.\n\n` +
        `Publiez-le avec « npm run release », qui vérifie l'arbre, les notes de ` +
        `version et la cohérence des numéros avant de poser et pousser le tag.\n\n` +
        `Tags présents : ${tags.join(', ')}`,
    ).toContain(`v${UI_VERSION}`);
  });
});
