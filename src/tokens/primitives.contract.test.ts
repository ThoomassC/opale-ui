import { describe, expect, it } from 'vitest';

import materialsSource from './materials.css?raw';
import primitivesSource from './primitives.css?raw';
import rolesSource from './roles.css?raw';
import { oklab, oklchHue, parseRgba } from '../contract/color';
import { parseCustomProperties, ruleBodies, stripComments } from '../contract/stylesheet';

/**
 * Primitives are named `--tc-<family>-<L>`, where `<L>` is the measured OKLab
 * lightness ×1000. The number is a fact, not a rank — which only holds while
 * something checks it. Rename a primitive without remeasuring and this fails.
 */

const OPAQUE_PRIMITIVE = /^--tc-([a-z]+)-(\d{3})$/;
/** `--tc-teal-801-a24` : la primitive `--tc-teal-801` à l'alpha 0,24. */
const DERIVED_ALPHA = /^--tc-([a-z]+-\d{3})-a(\d{2})$/;
const HEX_ANYWHERE = /#[0-9a-f]{3,8}\b/gi;

/**
 * Les familles soumises à la contrainte de teinte froide, ÉCRITES, plutôt que
 * déduites d'un préfixe.
 *
 * L'ancienne version ne contraignait que `--tc-mist-*` et laissait toutes les
 * autres familles hors garde par simple absence de test. C'était tenable tant
 * que la palette n'avait que des neutres et un teal ; elle porte désormais un
 * ambre à 79° et un violet à 300°, dont aucune plage froide ne peut rien dire.
 * Nommer la liste rend la décision lisible : `mist` et `teal` sont le champ
 * neutre et l'encre des actions, ils partagent la teinte du sol, et une dérive
 * de l'un des deux salit la page. Les autres familles sont du DÉCOR ou du
 * SIGNAL, et leur teinte est justement ce qui les distingue.
 */
const COOL_HUE_FAMILIES = ['mist', 'teal'] as const;
const COOL_HUE_RANGE = { min: 205, max: 225 } as const;

function primitives(): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const body of ruleBodies(stripComments(primitivesSource), ':root')) {
    for (const [name, value] of parseCustomProperties(body)) {
      tokens.set(name, value);
    }
  }
  return tokens;
}

function familyOf(name: string): string | undefined {
  return OPAQUE_PRIMITIVE.exec(name)?.[1];
}

describe('la couche primitives', () => {
  it('déclare au moins une primitive', () => {
    expect(primitives().size).toBeGreaterThan(0);
  });

  it.each([...primitives()].filter(([name]) => OPAQUE_PRIMITIVE.test(name)))(
    'le nombre de %s est sa luminosité OKLab mesurée',
    (name, value) => {
      const claimed = Number(OPAQUE_PRIMITIVE.exec(name)?.[2]);
      const measured = Math.round(oklab(value).lightness * 1000);
      expect(
        measured,
        `${name} vaut ${value}, dont la luminosité OKLab mesure ${measured} et non ${claimed}`,
      ).toBe(claimed);
    },
  );

  it.each(
    [...primitives()].filter(([name]) => {
      const family = familyOf(name);
      return family !== undefined && (COOL_HUE_FAMILIES as readonly string[]).includes(family);
    }),
  )('%s reste sur la teinte froide du champ', (name, value) => {
    const hue = oklchHue(value);
    expect(
      hue,
      `${name} (${value}) est à ${hue.toFixed(1)}° : hors de la plage froide, le neutre devient sale`,
    ).toBeGreaterThanOrEqual(COOL_HUE_RANGE.min);
    expect(hue).toBeLessThanOrEqual(COOL_HUE_RANGE.max);
  });

  it('couvre réellement chaque famille froide déclarée', () => {
    // Sans cette garde, une faute de frappe dans COOL_HUE_FAMILIES viderait le
    // test ci-dessus et il resterait vert en ne mesurant plus rien.
    const covered = new Set(
      [...primitives().keys()].map(familyOf).filter((family) => family !== undefined),
    );
    for (const family of COOL_HUE_FAMILIES) {
      expect(covered, `la famille « ${family} » n'a aucune primitive opaque`).toContain(family);
    }
  });

  /**
   * `<famille>-<L>` doit identifier UNE couleur.
   *
   * La luminosité seule n'identifie rien — `--tc-mist-921` et `--tc-amber-921`
   * mesurent la même L et n'ont rien à voir — mais deux valeurs différentes
   * sous le MÊME nom de famille et la même L seraient un nom qui ment, et une
   * de ces deux valeurs disparaîtrait dans la cascade sans un mot.
   */
  it('ne donne jamais deux valeurs au même couple famille + luminosité', () => {
    const byName = new Map<string, Set<string>>();
    for (const [name, value] of primitives()) {
      if (!OPAQUE_PRIMITIVE.test(name)) continue;
      byName.set(name, new Set([...(byName.get(name) ?? []), value]));
    }
    const collisions = [...byName]
      .filter(([, values]) => values.size > 1)
      .map(([name, values]) => `${name} : ${[...values].join(' et ')}`);

    expect(collisions, `noms ambigus :\n  ${collisions.join('\n  ')}`).toEqual([]);
  });

  /**
   * Une primitive `-aNN` bâtie sur une primitive nommée doit VRAIMENT être sa
   * base à cet alpha. Les commentaires de `materials.css` affirment que la
   * tuile d'icône est « dérivée du halo » : sans ce test, cette affirmation
   * survivrait à un changement de halo qui laisserait la tuile derrière.
   */
  it.each([...primitives()].filter(([name]) => DERIVED_ALPHA.test(name)))(
    '%s est bien sa base à son alpha',
    (name, value) => {
      const [, base, alphaDigits] = DERIVED_ALPHA.exec(name) ?? [];
      const baseValue = primitives().get(`--tc-${base}`);

      expect(baseValue, `${name} annonce une base --tc-${base} qui n'existe pas`).toBeDefined();

      const derived = parseRgba(value);
      const source = parseRgba(baseValue as string);

      expect(
        [derived.red, derived.green, derived.blue],
        `${name} (${value}) n'a pas les canaux de --tc-${base} (${baseValue})`,
      ).toEqual([source.red, source.green, source.blue]);
      expect(
        derived.alpha,
        `${name} porte l'alpha ${derived.alpha} et non 0,${alphaDigits}`,
      ).toBeCloseTo(Number(alphaDigits) / 100, 5);
    },
  );
});

describe('la direction de dépendance entre couches', () => {
  /**
   * Le fichier ENTIER, et non trois sélecteurs choisis.
   *
   * La version précédente ne lisait que `:root`, `:root:not([data-theme="light"])`
   * et `:root[data-theme="dark"]`. Le bloc d'aplatissement ajouté en v0.3.0 vit
   * dans un `@media (prefers-reduced-transparency: reduce)`, et le sien à lui
   * dans un `@media` imbriqué : trois sélecteurs de plus, dont aucun n'était
   * regardé. Un hexadécimal y aurait passé sans un mot. Les commentaires sont
   * retirés d'abord, donc les ratios et les valeurs mesurées qui y sont cités
   * restent parfaitement autorisés.
   */
  /*
   * `styles/glass.css` ET `styles/lens.css` FIGURAIENT DANS CETTE LISTE ET
   * N'EXISTENT PLUS. La 2.0 ne publie plus que les composants verre liquide de
   * `src/opale/**` ; les deux feuilles de matière de l'ancienne charte sont
   * supprimées avec les composants qu'elles coiffaient.
   *
   * CE QUI N'EST DONC PLUS GARANTI, dit précisément : plus rien ne vérifie
   * qu'une feuille de MATIÈRE — au sens « qui ne cite que des jetons de
   * matériau, et où un hexadécimal passerait pour de la plomberie plutôt que
   * pour une couleur » — est exempte d'hexadécimal. C'était leur seule raison
   * d'être ici : leur masque de liseré peint en `currentColor`, parce qu'un
   * masque ne lit que le canal alpha et qu'une teinte arbitraire n'a aucune
   * raison d'être écrite en dur. La garde n'a plus de sujet dans ce dépôt : il
   * ne reste aucune feuille de matière, et `src/opale/**` est hors du contrat
   * de couleur d'Opale par construction (ses couleurs sont des littéraux
   * assumés, voir `src/opale/README.md`) — l'y soumettre serait affirmer le
   * contraire de ce que le paquet annonce.
   *
   * LA COUVERTURE DES JETONS PRIMITIFS EST INTACTE, et c'est vérifiable : les
   * deux feuilles n'étaient lues QUE par ce test-ci. Aucun des tests de nommage
   * OKLab, de teinte froide, d'unicité famille+luminosité ou de dérivation
   * `-aNN` ne les consultait — tous partent de `primitivesSource`. Le jour où
   * une feuille de matière revient, elle se rajoute ici : c'est tout l'intérêt
   * d'une liste qui se relit à chaque feuille ajoutée.
   */
  it.each([
    ['roles.css', rolesSource],
    ['materials.css', materialsSource],
  ])('%s ne contient aucun hexadécimal : toute couleur y passe par un jeton', (file, source) => {
    const declarations = stripComments(source);
    const offenders = [...declarations.matchAll(HEX_ANYWHERE)].map((match) => {
      const at = match.index ?? 0;
      return `${match[0]} — « …${declarations.slice(Math.max(0, at - 48), at + match[0].length)}… »`;
    });

    expect(offenders, `hexadécimaux trouvés dans ${file} :\n  ${offenders.join('\n  ')}`).toEqual(
      [],
    );
  });

  it('primitives.css ne cite aucun jeton de rôle ni de matériau : la dépendance ne remonte pas', () => {
    const upperLayerPrefixes = [
      '--text-',
      '--accent',
      '--surface',
      '--site-',
      '--panel-',
      '--focus-',
      '--shadow-',
      '--glass-',
      '--halo-',
      '--icon-surface-',
      '--status-',
      '--badge-',
    ];
    const offenders = [...primitives()].filter(([, value]) =>
      upperLayerPrefixes.some((prefix) => value.includes(`var(${prefix}`)),
    );
    expect(offenders.map(([name]) => name)).toEqual([]);
  });

  it('roles.css ne cite aucun jeton de matériau : materials.css est chargé APRÈS', () => {
    const materialPrefixes = ['--glass-', '--halo-', '--icon-surface-'];
    const offenders: string[] = [];
    for (const body of [
      ...ruleBodies(stripComments(rolesSource), ':root'),
      ...ruleBodies(stripComments(rolesSource), ':root:not([data-theme="light"])'),
      ...ruleBodies(stripComments(rolesSource), ':root[data-theme="dark"]'),
    ]) {
      for (const [name, value] of parseCustomProperties(body)) {
        if (materialPrefixes.some((prefix) => value.includes(`var(${prefix}`))) {
          offenders.push(`${name}: ${value}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
