import { useMemo, useState } from 'react';

import { Opale, SvgMap, useSvgMapViewport } from '../../../../opale';
import { MaterialSwitch } from '../material-switch';
import { RegionPicker } from './region-picker';
import { CONTINENT_FRAMES, WORLD_COUNTRIES, WORLD_VIEWBOX } from './world';

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

export default function WorldMap() {
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

  /* LA LISTE DIT L'ÉTAT, COMME LE NOM ACCESSIBLE : « Japon — visité ». Triée
     dans l'ordre alphabétique français, celui où l'on cherche un pays. */
  const options = useMemo(
    () =>
      [...regions]
        .sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id, 'fr'))
        .map((region) => {
          const state = trips.get(region.id);
          const name = region.name ?? region.id;
          return { id: region.id, label: state ? `${name} — ${TRIP_LABEL[state]}` : name };
        }),
    [regions, trips],
  );

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
            {/* L'ÉQUIVALENT DE LA CARTE. Sur un téléphone, la Lettonie mesure
                dix pixels sur quatre : la liste fait la même bascule que le
                clic, avec une cible qui se touche. Elle revient à l'invite
                après chaque choix — c'est une action, pas une valeur. */}
            <RegionPicker
              label="Ou basculez un pays par la liste"
              placeholder="Choisir un pays…"
              options={options}
              value=""
              onPick={toggle}
              helperText="Chaque choix fait tourner l’état : non visité, visité, à venir."
              liquidGlass={liquidGlass}
            />
          </div>
        );
      }}
    </MaterialSwitch>
  );
}
