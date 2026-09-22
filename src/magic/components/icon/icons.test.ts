import { describe, expect, it } from 'vitest';

import { ICON_GROUPS, ICON_NAMES, OPALE_ICONS, isOpaleIconName } from './icons';

/* =============================================================================
   LE JEU D'ICÔNES SE TIENT LUI-MÊME.

   Un jeu de cette taille ne se relit pas à l'œil : cent quatorze dessins, et
   une faute de frappe dans une commande SVG ne produit AUCUNE erreur — le
   navigateur abandonne le chemin en silence et affiche un carré vide. Les
   gardes ci-dessous attrapent ce que la relecture laisse passer.
   ========================================================================== */

describe('le catalogue', () => {
  it('devrait publier un jeu large — au moins cent icônes', () => {
    expect(ICON_NAMES.length).toBeGreaterThanOrEqual(100);
  });

  it('devrait nommer chaque icône en minuscules et tirets', () => {
    const mal = ICON_NAMES.filter((name) => !/^[a-z][a-z0-9-]*$/.test(name));

    expect(mal).toEqual([]);
  });

  /* LE TYPE LITTÉRAL DIT DÉJÀ QU'AUCUNE LISTE N'EST VIDE — `as const` fige la
     longueur de chacune —, donc le vérifier serait vacant. Ce qui ne se
     déduit pas du type, c'est qu'une icône ne soit pas un TRACÉ VIDE : `['']`
     a une longueur de 1 et ne dessine rien. */
  it('devrait donner un tracé non vide à chaque icône', () => {
    const vides = ICON_NAMES.filter((name) =>
      (OPALE_ICONS[name] as readonly string[]).some((d) => d.trim().length === 0),
    );

    expect(vides).toEqual([]);
  });

  /* UNE COMMANDE SVG INCONNUE NE LÈVE RIEN. `M12 3.5v8` est valide,
     `M12 3.5w8` ne l'est pas — et le second ne dessine simplement rien. Le
     jeu s'en tient aux commandes qu'il emploie vraiment ; en ajouter une
     demande de l'inscrire ici, ce qui est le point. */
  it('devrait n’employer que les commandes de tracé connues du jeu', () => {
    const autorisees = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/;
    const mal = ICON_NAMES.filter((name) =>
      OPALE_ICONS[name].some((d) => !autorisees.test(d)),
    );

    expect(mal).toEqual([]);
  });

  it('devrait commencer chaque tracé par un déplacement absolu', () => {
    const mal = ICON_NAMES.flatMap((name) =>
      OPALE_ICONS[name].filter((d) => !d.startsWith('M')).map(() => name),
    );

    expect(mal).toEqual([]);
  });

  /* LA GRILLE EST 24×24 ET LA MARGE EST RÉELLE. Une coordonnée absolue hors
     de [0, 24] sort du `viewBox` : le dessin est rogné, ce qui à petite taille
     se lit comme une icône « cassée » sans que rien ne le signale. Seules les
     coordonnées du `M` initial sont vérifiables sans interpréter tout le
     chemin — c'est déjà ce qui attrape une faute de frappe d'un facteur dix. */
  it('devrait poser chaque départ de tracé dans la grille', () => {
    const dehors: string[] = [];

    for (const name of ICON_NAMES) {
      for (const d of OPALE_ICONS[name]) {
        const depart = /^M(-?[\d.]+)[\s,](-?[\d.]+)/.exec(d);
        if (!depart) continue;
        const [x, y] = [Number(depart[1]), Number(depart[2])];
        if (x < 0 || x > 24 || y < 0 || y > 24) dehors.push(`${name} → ${d.slice(0, 18)}`);
      }
    }

    expect(dehors).toEqual([]);
  });
});

describe('les familles', () => {
  /* UNE ICÔNE AJOUTÉE AU CATALOGUE ET OUBLIÉE DANS LES FAMILLES EST PUBLIÉE
     MAIS INVISIBLE : la page « Icônes » parcourt les familles, pas le
     catalogue. C'est exactement le genre d'oubli qu'aucune relecture ne
     rattrape, parce que rien ne manque à l'écran. */
  it('devrait ranger chaque icône dans exactement une famille', () => {
    const rangees = ICON_GROUPS.flatMap((group) => group.names);

    expect([...rangees].sort()).toEqual([...ICON_NAMES].sort());
    expect(new Set(rangees).size).toBe(rangees.length);
  });

  it('devrait nommer chaque famille', () => {
    expect(ICON_GROUPS.every((group) => group.label.trim().length > 0)).toBe(true);
    expect(new Set(ICON_GROUPS.map((group) => group.label)).size).toBe(ICON_GROUPS.length);
  });
});

describe('isOpaleIconName', () => {
  it('devrait reconnaître un nom du jeu', () => {
    expect(isOpaleIconName('map-pin')).toBe(true);
  });

  /* LE GARDE-FOU DE LA RÉTROCOMPATIBILITÉ. `Icon` reçoit encore des glyphes
     — « ✦ », « ⌘ », « ✓ » — et doit les laisser passer inchangés. */
  it.each(['✦', '⌘', '✓', '', 'Map-Pin', 'inconnue'])('devrait rejeter %s', (value) => {
    expect(isOpaleIconName(value)).toBe(false);
  });

  it('devrait rejeter ce qui n’est pas une chaîne', () => {
    expect(isOpaleIconName(null)).toBe(false);
    expect(isOpaleIconName(42)).toBe(false);
  });
});
