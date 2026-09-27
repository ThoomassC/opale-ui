import { useMemo, useState } from 'react';

import { Opale, SvgMap, useSvgMapViewport } from '../../../../magic';
import { Specimen } from '../../../section';
import { PageBody, PropsTable, UsageBlock } from '../../api';
import type { PropRow } from '../../api';
import { CATALOG_API } from '../../opale-api-data';
import { MaterialSwitch, PlainStage } from '../material-switch';
import { CORSE, FRANCE_DEPARTMENTS, FRANCE_VIEWBOX, ILE_DE_FRANCE } from './france-departments';
import { CONTINENT_FRAMES, WORLD_COUNTRIES, WORLD_VIEWBOX } from './world';

const USAGE = `import { SvgMap, SvgMapControls, useSvgMapViewport } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// Le dessin vient de l'application : un viewBox et des régions.
<SvgMap
  label="Départements"
  viewBox="0 0 613 585"
  regions={departments}          // { id, path, name?, ariaLabel? }[]
  selectable
  onSelect={(id) => choose(id)}
  selected={chosen}              // soulignées et annoncées aria-pressed
  fill={(id) => colorFor(id)}    // appelée à chaque rendu
/>

// Piloter la vue de l'extérieur : la carte et l'appelant partagent la même.
const viewport = useSvgMapViewport('0 0 613 585');
<button onClick={() => viewport.fitTo(['75', '92', '93', '94'])}>Petite couronne</button>
<SvgMap viewBox="0 0 613 585" regions={departments} viewport={viewport} />`;

/* =============================================================================
   LE QUIZ. Une suite de départements dans un ordre fixe — mélangé, mais
   identique à chaque visite, pour que la démonstration soit reproductible.
   ========================================================================== */

/** Mélange déterministe : un générateur à graine suffit, rien ici n'est secret. */
function shuffled<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  let state = seed;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (state * 1103515245 + 12345) % 2 ** 31;
    const swap = state % (index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

const QUIZ_ORDER = shuffled(FRANCE_DEPARTMENTS, 17);

/* SANS `name`, AVEC `ariaLabel`. Le nom afficherait l'infobulle — donc la
   réponse — au survol ; sans rien, un lecteur d'écran annoncerait
   l'identifiant, c'est-à-dire le numéro, c'est-à-dire la réponse aussi. Le
   numéro de zone est tiré d'un second ordre mélangé, qui ne dit rien. */
const QUIZ_REGIONS = shuffled(FRANCE_DEPARTMENTS, 91).map((department, index) => ({
  id: department.id,
  path: department.path,
  ariaLabel: `Zone ${index + 1}`,
}));

type Answer = { readonly picked: string; readonly target: string };

function FindTheDepartment() {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [answer, setAnswer] = useState<Answer | null>(null);
  const target = QUIZ_ORDER[round % QUIZ_ORDER.length];

  const choose = (id: string) => {
    if (answer) return;
    setAnswer({ picked: id, target: target.id });
    setScore((current) => ({
      right: current.right + (id === target.id ? 1 : 0),
      total: current.total + 1,
    }));
  };

  const next = () => {
    setAnswer(null);
    setRound((current) => current + 1);
  };

  const correct = answer?.picked === answer?.target;

  return (
    <MaterialSwitch name="SvgMap" stack>
      {(liquidGlass) => {
        /* Les teintes de réponse passent par les jetons : elles suivent le
           thème, et sous verre elles laissent passer la réfraction. */
        const tint = (token: string) =>
          `color-mix(in srgb, var(${token}) ${liquidGlass ? 72 : 58}%, ${liquidGlass ? 'transparent' : 'var(--opale-surface)'})`;
        const fill = (id: string) => {
          if (!answer) return undefined;
          if (id === answer.target) return tint('--opale-success');
          if (id === answer.picked) return tint('--opale-danger');
          return undefined;
        };

        return (
          <div className="tc-doc-svgmap-demo">
            <SvgMap
              label="Carte des départements"
              viewBox={FRANCE_VIEWBOX}
              regions={QUIZ_REGIONS}
              selectable
              onSelect={choose}
              selected={answer ? [answer.target, answer.picked] : []}
              fill={fill}
              maxHeight="32rem"
              liquidGlass={liquidGlass}
              overlay={
                <p className="tc-doc-svgmap-demo__prompt">
                  Cliquez sur : <strong>{target.name}</strong>
                </p>
              }
            />
            <div className="tc-doc-svgmap-demo__bar">
              <span role="status" className="tc-doc-svgmap-demo__status">
                {answer
                  ? correct
                    ? `Bonne réponse : ${target.name}.`
                    : `C’était ailleurs — ${target.name} est en vert.`
                  : ''}
              </span>
              <Opale.Badge liquidGlass={liquidGlass}>
                score {score.right}/{score.total}
              </Opale.Badge>
              <Opale.Button size="small" variant="tonal" liquidGlass={liquidGlass} onClick={next}>
                {answer ? 'Suivant' : 'Passer'}
              </Opale.Button>
            </div>
          </div>
        );
      }}
    </MaterialSwitch>
  );
}

/* =============================================================================
   LA CARTE DE CHALEUR. Le niveau est déduit du numéro, de façon stable :
   aucune donnée réelle, seulement de quoi montrer quatre teintes.
   ========================================================================== */
const LEVELS = [
  { label: 'maîtrisé', share: 78 },
  { label: 'moyen', share: 52 },
  { label: 'à revoir', share: 28 },
  { label: 'jamais croisé', share: 0 },
] as const;

const levelOf = (id: string) => {
  const digits = Number.parseInt(id.replace(/\D/g, ''), 10) || 20;
  return (digits * 7) % LEVELS.length;
};

const heatFill = (id: string) => {
  const { share } = LEVELS[levelOf(id)];
  return share === 0
    ? undefined
    : `color-mix(in srgb, var(--opale-primary) ${share}%, var(--opale-surface))`;
};

function HeatMap() {
  return (
    <PlainStage stack>
      <SvgMap
        label="Niveau de connaissance par département"
        description="Les mêmes niveaux sont listés sous la carte, département par département."
        viewBox={FRANCE_VIEWBOX}
        regions={FRANCE_DEPARTMENTS}
        fill={heatFill}
        maxHeight="28rem"
        overlay={
          <ul className="tc-doc-svgmap-legend" aria-label="Légende">
            {LEVELS.map((level, index) => (
              <li key={level.label}>
                <span
                  className="tc-doc-svgmap-legend__swatch"
                  style={{
                    background:
                      heatFill(FRANCE_DEPARTMENTS.find((d) => levelOf(d.id) === index)?.id ?? '') ??
                      'var(--opale-svg-map-fill)',
                  }}
                  aria-hidden="true"
                />
                {level.label}
              </li>
            ))}
          </ul>
        }
      />
      {/* L'ÉQUIVALENT TEXTUEL. Une carte de chaleur n'est qu'une image pour qui
          ne la voit pas, et une infobulle au survol n'est rien pour le
          clavier : les valeurs doivent exister ailleurs, en texte. */}
      <details className="tc-doc-svgmap-data">
        <summary>Les niveaux en texte</summary>
        <dl>
          {LEVELS.map((level, index) => (
            <div key={level.label}>
              <dt>{level.label}</dt>
              <dd>
                {FRANCE_DEPARTMENTS.filter((department) => levelOf(department.id) === index)
                  .map((department) => department.name)
                  .join(', ')}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </PlainStage>
  );
}

/* =============================================================================
   LE MONDE — UN CARNET DE VOYAGE, COMME DANS « TRAVELS IN WORLD ».

   Trois états par pays, et chacun se dit de deux façons : une teinte, et un
   mot dans le nom accessible (« Japon, visité »). La teinte seule ne dirait
   rien à un lecteur d'écran ni en niveaux de gris.
   ========================================================================== */
type TripState = 'visited' | 'wished';

const TRIP_LABEL: Record<TripState, string> = { visited: 'visité', wished: 'à venir' };

const INITIAL_TRIPS: ReadonlyMap<string, TripState> = new Map([
  ['FR', 'visited'],
  ['ES', 'visited'],
  ['IT', 'visited'],
  ['MA', 'visited'],
  ['JP', 'visited'],
  ['CA', 'visited'],
  ['PE', 'wished'],
  ['IS', 'wished'],
  ['NZ', 'wished'],
]);

const CONTINENT_BUTTONS: readonly {
  readonly label: string;
  readonly continent: keyof typeof CONTINENT_FRAMES;
}[] = [
  { label: 'Europe', continent: 'europe' },
  { label: 'Afrique', continent: 'africa' },
  { label: 'Asie', continent: 'asia' },
  { label: 'Amériques', continent: 'americas' },
  { label: 'Océanie', continent: 'oceania' },
];

/** Un clic fait tourner l'état : non visité, visité, à venir, puis retour. */
const nextState = (state: TripState | undefined): TripState | undefined =>
  state === undefined ? 'visited' : state === 'visited' ? 'wished' : undefined;

function WorldMap() {
  const viewport = useSvgMapViewport(WORLD_VIEWBOX, { maxZoom: 12 });
  const [trips, setTrips] = useState<ReadonlyMap<string, TripState>>(INITIAL_TRIPS);

  const regions = useMemo(
    () =>
      WORLD_COUNTRIES.map((country) => {
        const state = trips.get(country.id);
        return state ? { ...country, ariaLabel: `${country.name}, ${TRIP_LABEL[state]}` } : country;
      }),
    [trips],
  );

  const toggle = (id: string) =>
    setTrips((current) => {
      const next = new Map(current);
      const state = nextState(current.get(id));
      if (state) next.set(id, state);
      else next.delete(id);
      return next;
    });

  const count = (state: TripState) => [...trips.values()].filter((value) => value === state).length;

  return (
    <MaterialSwitch name="la carte du monde" stack>
      {(liquidGlass) => {
        const ground = liquidGlass ? 'transparent' : 'var(--opale-surface)';
        const tints: Record<TripState, string> = {
          visited: `color-mix(in srgb, var(--opale-primary) ${liquidGlass ? 78 : 64}%, ${ground})`,
          wished: `color-mix(in srgb, var(--opale-accent) ${liquidGlass ? 80 : 72}%, ${ground})`,
        };
        const fill = (id: string) => {
          const state = trips.get(id);
          return state ? tints[state] : undefined;
        };

        return (
          <div className="tc-doc-svgmap-demo">
            <div className="tc-doc-svgmap-demo__bar tc-doc-svgmap-demo__bar--start">
              {CONTINENT_BUTTONS.map(({ label, continent }) => (
                <Opale.Button
                  key={continent}
                  size="small"
                  variant="tonal"
                  liquidGlass={liquidGlass}
                  onClick={() => viewport.fitBounds(CONTINENT_FRAMES[continent])}
                >
                  {label}
                </Opale.Button>
              ))}
            </div>
            {/* LA LÉGENDE SOUS LES BOUTONS, PAS SUR LA CARTE. Posée dans le coin
                supérieur, elle recouvrait le Canada et l'Alaska : sur un
                planisphère, les coins ne sont pas vides. */}
            <ul className="tc-doc-svgmap-legend tc-doc-svgmap-legend--inline" aria-label="Légende">
              {(['visited', 'wished'] as const).map((state) => (
                <li key={state}>
                  <span
                    className="tc-doc-svgmap-legend__swatch"
                    style={{ background: tints[state] }}
                    aria-hidden="true"
                  />
                  {TRIP_LABEL[state]} · {count(state)}
                </li>
              ))}
            </ul>
            <SvgMap
              label="Carte du monde, pays visités et à venir"
              viewBox={WORLD_VIEWBOX}
              regions={regions}
              viewport={viewport}
              selectable
              onSelect={toggle}
              fill={fill}
              liquidGlass={liquidGlass}
            />
          </div>
        );
      }}
    </MaterialSwitch>
  );
}

/* =============================================================================
   LE CADRAGE PILOTÉ DE L'EXTÉRIEUR.
   ========================================================================== */
function FramedMap() {
  const viewport = useSvgMapViewport(FRANCE_VIEWBOX);
  const regions = useMemo(() => FRANCE_DEPARTMENTS, []);

  return (
    <PlainStage stack>
      <div className="tc-doc-svgmap-demo__bar tc-doc-svgmap-demo__bar--start">
        <Opale.Button size="small" variant="tonal" onClick={() => viewport.fitTo(ILE_DE_FRANCE)}>
          Île-de-France
        </Opale.Button>
        <Opale.Button size="small" variant="tonal" onClick={() => viewport.fitTo(CORSE)}>
          Corse
        </Opale.Button>
        <Opale.Button
          size="small"
          variant="tonal"
          onClick={() => viewport.reset()}
          aria-disabled={viewport.zoomed ? undefined : true}
        >
          Vue d’ensemble
        </Opale.Button>
        <code className="tc-doc-svgmap-demo__viewbox">{viewport.current}</code>
      </div>
      <SvgMap
        label="Départements, cadrage piloté"
        viewBox={FRANCE_VIEWBOX}
        regions={regions}
        viewport={viewport}
        maxHeight="28rem"
      />
    </PlainStage>
  );
}

const REGION_ROWS: readonly PropRow[] = [
  { name: 'id', type: 'string', required: true, description: 'Identifiant, renvoyé par onSelect.' },
  {
    name: 'path',
    type: 'string',
    required: true,
    description: 'Le tracé, tel quel : l’attribut d d’un path.',
  },
  {
    name: 'name',
    type: 'string',
    description: 'Nom lisible : infobulle au survol, et nom accessible à défaut d’ariaLabel.',
  },
  {
    name: 'ariaLabel',
    type: 'string',
    description: (
      <>
        Nom accessible, jamais affiché. Il se résout dans l’ordre <code>ariaLabel</code>,{' '}
        <code>name</code>, puis l’identifiant. Un quiz qui retire <code>name</code> doit le poser :
        sinon le lecteur d’écran annonce l’identifiant, c’est-à-dire la réponse.
      </>
    ),
  },
];

const VIEWPORT_ROWS: readonly PropRow[] = [
  { name: 'current', type: 'string', description: 'La vue courante, au format viewBox.' },
  {
    name: 'zoom / zoomed',
    type: 'number / boolean',
    description: 'Facteur de zoom, et vrai dès qu’on quitte la vue d’ensemble.',
  },
  {
    name: 'fitTo',
    type: '(ids, { padding?, animate? }) => void',
    description: 'Cadre sur un ensemble de régions, en gardant le rapport de la carte.',
  },
  {
    name: 'fitBounds',
    type: '({ minX, minY, maxX, maxY }, options?) => void',
    description:
      'Cadre sur une zone du dessin. Pour un continent, dont les pays emportent des territoires lointains.',
  },
  {
    name: 'zoomBy',
    type: '(factor, origin?, { animate? }) => void',
    description:
      'Un facteur supérieur à 1 rapproche — le sens d’une loupe, celui qu’on lit dans « ×2 ».',
  },
  {
    name: 'reveal',
    type: '(id) => void',
    description: 'Ramène une région dans la vue si elle en sort, sans changer le zoom.',
  },
  { name: 'reset', type: '() => void', description: 'Revient à la vue d’ensemble.' },
];

export default function SvgMapContent() {
  const api = CATALOG_API.SvgMap;

  return (
    <PageBody>
      <UsageBlock label="Import et appels représentatifs de SvgMap" code={USAGE} />

      <Specimen
        title="Trouvez le département"
        note={
          <>
            Pincez, glissez, cliquez — ou <strong>Ctrl / ⌘ + molette</strong> : une molette nue
            laisse défiler la page et le dit. Un glissement se termine forcément sur une région,
            donc au-delà de six pixels le contact devient un déplacement et le clic qui suit est
            ignoré. Au clavier, la carte n’est qu’<strong>un arrêt de tabulation</strong> : les
            flèches mènent à la région voisine dans leur direction, <kbd>Maj</kbd> + flèches
            déplacent la vue, <kbd>+</kbd> et <kbd>−</kbd> zooment sur la région qui a le focus,{' '}
            <kbd>0</kbd> revient à la vue d’ensemble. Ce jeu-ci reste{' '}
            <strong>visuel par nature</strong> : les zones sont annoncées « Zone 12 » pour ne pas
            souffler la réponse, si bien qu’un lecteur d’écran peut les parcourir mais pas y jouer.
          </>
        }
      >
        <FindTheDepartment />
      </Specimen>

      <Specimen
        title="Colorier — une couleur par région"
        note="La fonction de remplissage est appelée à chaque rendu, pour chaque région : carte de chaleur, résultat de partie ou sélection s’écrivent sans que le composant connaisse la moindre règle métier. Survolez une région pour lire son nom ; les mêmes niveaux sont repris en texte sous la carte, et la prop description le dit aux lecteurs d’écran."
      >
        <HeatMap />
      </Specimen>

      <Specimen
        title="Le monde — un carnet de voyage"
        note={
          <>
            La carte de <strong>Travels in World</strong>, rendue par <code>SvgMap</code> : les pays
            de world-atlas projetés en Natural Earth I dans son cadre d’usine de 960 × 500, joints
            sur leur code ISO numérique et nommés en français par <code>Intl.DisplayNames</code>.
            Cliquez un pays pour le passer de non visité à visité, puis à venir ; l’état s’entend
            aussi dans son nom. Les boutons cadrent sur un continent.
          </>
        }
      >
        <WorldMap />
      </Specimen>

      <Specimen
        title="Cadrer de l’extérieur"
        note="La vue peut être tenue par l’appelant. Le cadrage garde le rapport de la carte — un ensemble plus haut que large n’est pas coupé — et reste centré même quand l’ensemble est plus petit que le zoom maximal ne l’autorise."
      >
        <FramedMap />
      </Specimen>

      <PropsTable id="svg-map" note={api.states} rows={api.rows} />
      <PropsTable id="svg-map-region" title="SvgMapRegion" rows={REGION_ROWS} />
      <PropsTable
        id="svg-map-viewport"
        title="useSvgMapViewport(viewBox, { maxZoom })"
        note={
          <>
            Passée à <code>SvgMap</code> et à <code>SvgMapControls</code>, la vue est partagée : la
            carte, ses commandes et l’appelant voient la même.
          </>
        }
        rows={VIEWPORT_ROWS}
      />

      <p className="tc-doc-prose tc-doc-svgmap-credit">
        Tracés des départements : svg-maps de Victor Cazanave, sous licence CC-BY-4.0. Carte du
        monde : world-atlas (licence ISC), d’après les données Natural Earth, du domaine public. Ni
        l’un ni l’autre ne font partie de la librairie — la vitrine les installe pour la
        démonstration.
      </p>
    </PageBody>
  );
}
