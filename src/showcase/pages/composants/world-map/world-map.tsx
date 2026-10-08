import { useState } from 'react';

import { Opale, WorldMap, useWorldMapViewport } from '../../../../opale';
import type { WorldMapBasemap, WorldMapMode, WorldMapPin, WorldMapView } from '../../../../opale';
import { Specimen } from '../../../section';
import { PropsTable, UsageBlock } from '../../api';
import type { PropRow } from '../../api';
import { ComponentPageLayout } from '../../component-page';
import { CATALOG_API } from '../../opale-api-data';
import { MaterialSwitch } from '../material-switch';

/* =============================================================================
   LA CARTE DU MONDE, SERVIE PAR LA VITRINE.

   Les données Natural Earth vivent dans `public/world-map/v1/` : la vitrine
   les sert comme une application le ferait, et la carte les charge par
   niveau de détail. Rien n'est importé ici que la carte elle-même.
   ========================================================================== */

const DATA_URL = '/world-map/v1';

const USAGE = `import { WorldMap, useWorldMapViewport } from '@thomascaron/opale-ui';

// Les données sont servies par l'application : public/world-map/v1/.
<WorldMap
  dataUrl="/world-map/v1"
  label="Nos bureaux"
  pins={offices}                 // { id, longitude, latitude, label, tone? }[]
  onPinSelect={(id) => open(id)}
  selectedPins={[current]}       // soulignés et annoncés aria-pressed
  fill={(iso) => colorFor(iso)}  // un pays, par son code ISO
/>

// Piloter la vue de l'extérieur : la carte et l'appelant partagent la même.
const viewport = useWorldMapViewport();
<button onClick={() => viewport.flyTo({ longitude: 2.35, latitude: 48.86, zoom: 4 })}>
  Paris
</button>
<WorldMap dataUrl="/world-map/v1" viewport={viewport} />

// Le globe et l'imagerie NASA : chargés au premier usage seulement.
const [mode, setMode] = useState<WorldMapMode>('globe');
<WorldMap
  dataUrl="/world-map/v1"
  mode={mode}                    // 'flat' | 'globe' ; zoom du globe borné à 3
  onModeChange={setMode}
  defaultBasemap="satellite"     // 'vector' | 'satellite' (NASA GIBS Blue Marble)
  onBasemapError={(error) => report(error)}
/>`;

const CITIES: readonly WorldMapPin[] = [
  { id: 'paris', longitude: 2.352, latitude: 48.857, label: 'Paris' },
  { id: 'new-york', longitude: -74.006, latitude: 40.713, label: 'New York' },
  { id: 'tokyo', longitude: 139.692, latitude: 35.69, label: 'Tokyo', tone: 'accent' },
  { id: 'rio', longitude: -43.196, latitude: -22.908, label: 'Rio de Janeiro' },
  { id: 'le-cap', longitude: 18.424, latitude: -33.925, label: 'Le Cap' },
  { id: 'sydney', longitude: 151.209, latitude: -33.869, label: 'Sydney', tone: 'accent' },
  { id: 'reykjavik', longitude: -21.896, latitude: 64.146, label: 'Reykjavik', tone: 'neutral' },
  { id: 'nairobi', longitude: 36.822, latitude: -1.292, label: 'Nairobi' },
  { id: 'mumbai', longitude: 72.878, latitude: 19.076, label: 'Bombay' },
];

/* Les continents, en vues : un centre et un zoom choisis à l'œil, pour un
   cadre de 16 / 9. Un continent n'est pas l'union de ses pays — la France
   emporte la Guyane — : on vise une vue, pas un ensemble. */
const CONTINENTS: readonly { readonly label: string; readonly view: WorldMapView }[] = [
  { label: 'Europe', view: { longitude: 12, latitude: 52, zoom: 2.2 } },
  { label: 'Afrique', view: { longitude: 18, latitude: 2, zoom: 1.4 } },
  { label: 'Asie', view: { longitude: 95, latitude: 35, zoom: 1.3 } },
  { label: 'Amérique du Nord', view: { longitude: -100, latitude: 45, zoom: 1.3 } },
  { label: 'Amérique du Sud', view: { longitude: -60, latitude: -20, zoom: 1.4 } },
  { label: 'Océanie', view: { longitude: 145, latitude: -28, zoom: 1.8 } },
];

function CityMap() {
  const viewport = useWorldMapViewport();
  const [selected, setSelected] = useState<string | null>(null);
  const city = CITIES.find((item) => item.id === selected);

  /* Choisir un repère, par la carte ou par la liste : la même action. */
  const choose = (id: string) => setSelected((current) => (current === id ? null : id));

  return (
    <MaterialSwitch name="la carte du monde" stack>
      {(liquidGlass) => (
        <div className="tc-doc-svgmap-demo">
          <div className="tc-doc-svgmap-demo__bar tc-doc-svgmap-demo__bar--start">
            {CONTINENTS.map(({ label, view }) => (
              <Opale.Button
                key={label}
                size="small"
                variant="tonal"
                liquidGlass={liquidGlass}
                onClick={() => viewport.flyTo(view)}
              >
                {label}
              </Opale.Button>
            ))}
            <Opale.Button
              size="small"
              variant="tonal"
              liquidGlass={liquidGlass}
              aria-disabled={viewport.zoomed ? undefined : true}
              onClick={() => {
                if (viewport.zoomed) viewport.reset();
              }}
            >
              Monde
            </Opale.Button>
          </div>
          <WorldMap
            dataUrl={DATA_URL}
            label="Carte du monde, neuf villes"
            description="Les mêmes villes sont listées sous la carte."
            viewport={viewport}
            pins={CITIES}
            selectedPins={selected ? [selected] : []}
            onPinSelect={choose}
            liquidGlass={liquidGlass}
          />
          {/* L'ÉQUIVALENT DES REPÈRES. Une pastille fait 24 px, mais deux villes
              voisines se chevauchent en vue d'ensemble : la liste offre la même
              action avec une cible pleine (WCAG 2.5.8), et y fait voler la vue. */}
          <ul className="tc-doc-worldmap-cities" aria-label="Les villes, en liste">
            {CITIES.map((item) => (
              <li key={item.id}>
                <Opale.Button
                  size="small"
                  variant="ghost"
                  liquidGlass={liquidGlass}
                  aria-pressed={item.id === selected}
                  onClick={() => {
                    choose(item.id);
                    viewport.flyTo({ longitude: item.longitude, latitude: item.latitude, zoom: 3 });
                  }}
                >
                  {item.label}
                </Opale.Button>
              </li>
            ))}
          </ul>
          <p role="status" className="tc-doc-svgmap-demo__status">
            {city ? `Ville choisie : ${city.label}.` : ''}
          </p>
        </div>
      )}
    </MaterialSwitch>
  );
}

/* =============================================================================
   PLAN OU GLOBE, DESSIN OU SATELLITE — EN CONTRÔLÉ.

   Les bascules sont celles de la page, pas celles de la carte
   (`layerControls={false}`) : la carte suit `mode` et `basemap`, et ne fait
   que demander un changement par `onModeChange` et `onBasemapChange`.
   ========================================================================== */
function LayersDemo() {
  const [mode, setMode] = useState<WorldMapMode>('globe');
  const [basemap, setBasemap] = useState<WorldMapBasemap>('satellite');
  const [failure, setFailure] = useState<string | null>(null);

  return (
    <MaterialSwitch name="le globe" stack>
      {(liquidGlass) => (
        <div className="tc-doc-svgmap-demo">
          <div className="tc-doc-svgmap-demo__bar tc-doc-svgmap-demo__bar--start">
            {(
              [
                ['flat', 'Plan'],
                ['globe', 'Globe'],
              ] as const
            ).map(([value, text]) => (
              <Opale.Button
                key={value}
                size="small"
                variant={mode === value ? 'primary' : 'tonal'}
                liquidGlass={liquidGlass}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {text}
              </Opale.Button>
            ))}
            {(
              [
                ['vector', 'Dessin'],
                ['satellite', 'Satellite'],
              ] as const
            ).map(([value, text]) => (
              <Opale.Button
                key={value}
                size="small"
                variant={basemap === value ? 'primary' : 'tonal'}
                liquidGlass={liquidGlass}
                aria-pressed={basemap === value}
                onClick={() => {
                  setFailure(null);
                  setBasemap(value);
                }}
              >
                {text}
              </Opale.Button>
            ))}
          </div>
          <WorldMap
            dataUrl={DATA_URL}
            label="Le monde, en globe ou en plan"
            defaultView={{ longitude: 10, latitude: 25, zoom: 0 }}
            mode={mode}
            onModeChange={setMode}
            basemap={basemap}
            onBasemapChange={setBasemap}
            onBasemapError={(error) => setFailure(error.message)}
            layerControls={false}
            pins={CITIES}
            liquidGlass={liquidGlass}
          />
          <p role="status" className="tc-doc-svgmap-demo__status">
            {failure ? `onBasemapError : ${failure}` : ''}
          </p>
        </div>
      )}
    </MaterialSwitch>
  );
}

/* Une couche GIBS qui n'existe pas : chaque tuile répond 400. */
const BROKEN_TILES =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Couche_inexistante/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg';

/* =============================================================================
   LES ÉTATS D'ERREUR, À LA DEMANDE.

   Rien ne part tant qu'on n'a pas choisi une panne : la page ne demande pas
   de tuiles en échec à chaque visite.
   ========================================================================== */
function ErrorsDemo() {
  const [broken, setBroken] = useState<'imagery' | 'data' | null>(null);
  const [log, setLog] = useState('');

  return (
    <div className="tc-doc-svgmap-demo">
      <div className="tc-doc-svgmap-demo__bar tc-doc-svgmap-demo__bar--start">
        <Opale.Button
          size="small"
          variant={broken === 'imagery' ? 'primary' : 'tonal'}
          aria-pressed={broken === 'imagery'}
          onClick={() => {
            setLog('');
            setBroken('imagery');
          }}
        >
          Imagerie introuvable
        </Opale.Button>
        <Opale.Button
          size="small"
          variant={broken === 'data' ? 'primary' : 'tonal'}
          aria-pressed={broken === 'data'}
          onClick={() => {
            setLog('');
            setBroken('data');
          }}
        >
          Données introuvables
        </Opale.Button>
        <Opale.Button
          size="small"
          variant="ghost"
          aria-disabled={broken ? undefined : true}
          onClick={() => {
            if (!broken) return;
            setLog('');
            setBroken(null);
          }}
        >
          Rétablir
        </Opale.Button>
      </div>
      <WorldMap
        key={broken ?? 'ok'}
        dataUrl={broken === 'data' ? '/world-map/absent' : DATA_URL}
        label="Carte du monde, en panne simulée"
        defaultBasemap={broken === 'imagery' ? 'satellite' : 'vector'}
        tileUrl={broken === 'imagery' ? BROKEN_TILES : undefined}
        tileAttribution={broken === 'imagery' ? 'Couche d’essai inexistante' : undefined}
        onBasemapError={(error) => setLog(`onBasemapError : ${error.message}`)}
        onDataError={(error) => setLog(`onDataError : ${error.message}`)}
      />
      <p role="status" className="tc-doc-svgmap-demo__status">
        {log}
      </p>
    </div>
  );
}

const PIN_ROWS: readonly PropRow[] = [
  {
    name: 'id',
    type: 'string',
    required: true,
    description: 'Identifiant, renvoyé par onPinSelect.',
  },
  {
    name: 'longitude / latitude',
    type: 'number',
    required: true,
    description: 'La position, en degrés.',
  },
  {
    name: 'label',
    type: 'string',
    required: true,
    description: 'Nom accessible du repère, et étiquette affichée au survol et au focus.',
  },
  {
    name: 'tone',
    type: "'primary' | 'accent' | 'neutral'",
    description: 'Teinte de la pastille ; le double anneau la détache de tout fond.',
  },
];

const VIEWPORT_ROWS: readonly PropRow[] = [
  {
    name: 'view / target',
    type: 'WorldMapView',
    description: 'La vue peinte, et la vue visée par la transition en cours : centre et zoom.',
  },
  {
    name: 'zoomed / canZoomIn',
    type: 'boolean',
    description:
      'Vrai hors de la vue d’ensemble ; vrai tant que le zoom maximal n’est pas atteint.',
  },
  {
    name: 'flyTo',
    type: '(view, { animate? }) => void',
    description: 'Va à un centre, à un zoom, ou aux deux ; ce qui n’est pas précisé est gardé.',
  },
  {
    name: 'zoomBy',
    type: '(factor, { animate? }) => void',
    description: 'Un facteur supérieur à 1 rapproche, au centre de la vue.',
  },
  { name: 'reset', type: '({ animate? }) => void', description: 'Revient à la vue initiale.' },
  { name: 'getView', type: '() => WorldMapView', description: 'La vue à l’instant.' },
];

export default function WorldMapContent() {
  const api = CATALOG_API.WorldMap;

  return (
    <ComponentPageLayout
      id="world-map"
      imports={['WorldMap', 'useWorldMapViewport']}
      demo={
        <Specimen
          title="Neuf villes, six continents"
          note={
            <>
              Pincez, glissez — ou <strong>Ctrl / ⌘ + molette</strong> : une molette nue laisse
              défiler la page et le dit. Le détail s’affine en approchant : le monde en 110m, puis
              50m, puis des tuiles 10m où paraissent les fleuves, les régions et les villes. Au
              clavier, la carte est <strong>un arrêt de tabulation</strong> (flèches pour déplacer,{' '}
              <kbd>+</kbd> et <kbd>−</kbd> pour zoomer, <kbd>0</kbd> pour revenir), les repères un
              second : les flèches mènent à la ville voisine dans leur direction, et une ville hors
              champ est ramenée dans la vue.
            </>
          }
        >
          <CityMap />
        </Specimen>
      }
      examples={
        <>
          <UsageBlock label="Import et appels représentatifs de WorldMap" code={USAGE} />
          <Specimen
            title="Le globe et l’imagerie satellite"
            note={
              <>
                Glissez pour faire tourner le globe ; au clavier, les flèches le tournent d’un
                cinquième du cadre. Son zoom s’arrête à 3, et le dit : au-delà, le plan prend le
                relais avec son détail 10m. En satellite, la mosaïque Blue Marble de la NASA passe
                sous le dessin, réduit à des traits clairs cernés de sombre ; le crédit reste
                affiché tant qu’elle l’est. Globe et imagerie ne se téléchargent qu’à leur premier
                usage.
              </>
            }
          >
            <LayersDemo />
          </Specimen>
          <Specimen
            title="Pannes — imagerie et données"
            note={
              <>
                Une imagerie dont plus de la moitié des tuiles échouent rend la main au dessin, le
                dit et appelle <code>onBasemapError</code> ; les tuiles en échec ne sont pas
                redemandées. Des données introuvables affichent « Détails indisponibles » et
                appellent <code>onDataError</code>.
              </>
            }
          >
            <ErrorsDemo />
          </Specimen>
        </>
      }
      props={
        <>
          <PropsTable id="world-map" note={api.states} rows={api.rows} />
          <PropsTable id="world-map-pin" title="WorldMapPin" rows={PIN_ROWS} />
          <PropsTable
            id="world-map-viewport"
            title="useWorldMapViewport({ initialView, maxZoom, onViewChange })"
            note={
              <>
                Passée à <code>WorldMap</code>, la vue est partagée : la carte et l’appelant voient
                la même. <code>onViewChange</code> n’est appelée qu’une fois la vue posée, jamais à
                chaque image.
              </>
            }
            rows={VIEWPORT_ROWS}
          />
          <p className="tc-doc-prose tc-doc-svgmap-credit">
            Données : Natural Earth, du domaine public (« Made with Natural Earth »). Elles ne font
            pas partie de la librairie : l’application les sert depuis son propre dossier, comme la
            vitrine depuis <code>public/world-map/v1/</code>. Imagerie : « We acknowledge the use of
            imagery provided by services from NASA’s Global Imagery Browse Services (GIBS), part of
            NASA’s Earth Science Data and Information System (ESDIS). » — Blue Marble, NASA Earth
            Observatory.
          </p>
        </>
      }
      states={[
        {
          state: 'disabled',
          description: (
            <>
              Les commandes sans effet — zoom maximal, vue d’ensemble, bord du monde — portent{' '}
              <code>aria-disabled=&quot;true&quot;</code> : elles restent focusables et le clic est
              sans effet.
            </>
          ),
        },
        {
          state: 'loading',
          description: (
            <>
              Le cadre a sa proportion dès le premier rendu, et « Chargement de la carte… »
              s’affiche jusqu’à l’arrivée du premier niveau de détail.
            </>
          ),
        },
        {
          state: 'error',
          description: (
            <>
              Un niveau qui échoue affiche « Détails indisponibles » et appelle{' '}
              <code>onDataError</code> ; le niveau précédent reste affiché, rien n’est retenté seul.
              Une imagerie indisponible — plus de la moitié des tuiles en échec, ou une texture du
              globe refusée par CORS — ramène au dessin, affiche « Imagerie indisponible : retour au
              dessin » et appelle <code>onBasemapError</code>.
            </>
          ),
        },
      ]}
      accessibility={{
        keyboard: [
          <>
            La surface prend le focus : flèches pour déplacer d’un cinquième, <kbd>+</kbd> et{' '}
            <kbd>−</kbd> pour zoomer, <kbd>0</kbd> ou <kbd>Origine</kbd> pour revenir ; jamais avec{' '}
            <kbd>Ctrl</kbd>, <kbd>⌘</kbd> ou <kbd>Alt</kbd>, pour laisser le zoom du navigateur.
          </>,
          <>
            Les repères sont un seul arrêt de tabulation : les flèches suivent la géographie,{' '}
            <kbd>Origine</kbd> et <kbd>Fin</kbd> l’ordre du tableau, <kbd>Entrée</kbd> et{' '}
            <kbd>Espace</kbd> appellent <code>onPinSelect</code>. Un repère hors champ est ramené
            dans la vue.
          </>,
          <>
            <kbd>Échap</kbd> masque l’infobulle du pays survolé.
          </>,
          <>
            Sur le globe, les flèches le font tourner ; un repère de la face cachée est ramené
            devant quand il prend le focus. À son zoom maximal, « Zoomer » passe en{' '}
            <code>aria-disabled</code> et la consigne « Passer en plan pour plus de détail »
            s’affiche et s’annonce.
          </>,
        ],
        semantics: [
          <>
            Le <code>&lt;svg&gt;</code> porte <code>role=&quot;img&quot;</code>, nommé par{' '}
            <code>label</code> et décrit par <code>description</code> suivie des consignes clavier.
          </>,
          <>
            Les repères sont une <code>&lt;ul&gt;</code> nommée de <code>&lt;button&gt;</code> ;{' '}
            <code>aria-pressed</code> n’est posé que si <code>selectedPins</code> est fourni.
          </>,
          <>
            Après une action au clavier, une région <code>aria-live=&quot;polite&quot;</code>{' '}
            annonce la vue : « Zoom 3, centré sur France ».
          </>,
          <>
            L’infobulle et la consigne de molette sont <code>aria-hidden</code>. Sous{' '}
            <code>prefers-reduced-motion</code>, les vols ne sont pas animés.
          </>,
          <>
            Les bascules « Globe » et « Satellite » sont des boutons <code>aria-pressed</code>.
            L’imagerie (<code>&lt;img alt=&quot;&quot;&gt;</code>, toile) et le limbe du globe sont
            décoratifs, cachés de l’arbre et retirés en contrastes forcés ; le crédit, lui, est du
            texte.
          </>,
        ],
      }}
      limits={[
        <>
          Les données ne sont pas dans le paquet : <code>dataUrl</code> est obligatoire, et une
          politique de sécurité doit autoriser son hôte en <code>connect-src</code>.
        </>,
        <>Les pays ne sont pas sélectionnables ; seuls les repères le sont.</>,
        <>Le monde ne se répète pas horizontalement, et le nord reste en haut.</>,
        <>
          Le globe ne descend pas sous le zoom 3 ni sous le détail 50m, et ne tourne pas tout seul.
          L’imagerie GIBS s’arrête au niveau 8 : au-delà, elle est agrandie. Une politique de
          sécurité doit autoriser <code>img-src https://gibs.earthdata.nasa.gov</code>.
        </>,
        <>
          Une molette sans <kbd>Ctrl</kbd> ou <kbd>⌘</kbd> fait défiler la page ; un contact qui
          bouge de plus de six pixels ne vaut plus un clic.
        </>,
      ]}
    />
  );
}
