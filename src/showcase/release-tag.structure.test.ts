import { execFileSync } from 'node:child_process';

import { describe, expect, it } from 'vitest';

import { UI_VERSION } from './version';
import { INSTALL_REF, INSTALL_REF_KIND } from './install-ref';

/* La page Installation utilise une branche pendant la recette et un tag après
   publication. On ne doit jamais proposer un tag absent. La branche est
   annoncée explicitement ; le contrôle du tag ne s'applique qu'une fois
   `INSTALL_REF_KIND` passé à `tag`. La disponibilité distante de la branche
   est vérifiée lors du push, hors de ce test local. */

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

describe('la référence d’installation affichée', () => {
  const tags = localTags();

  it('n’annonce un tag que lorsqu’il existe, sinon la branche de recette', () => {
    if (INSTALL_REF_KIND === 'branch') {
      expect(INSTALL_REF).toBe('recette');
      expect(INSTALL_REF).not.toBe(`v${UI_VERSION}`);
      return;
    }

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
    ).toContain(INSTALL_REF);
  });
});
