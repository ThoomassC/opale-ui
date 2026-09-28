import { lazy, Suspense, useMemo, useState } from 'react';

import { Opale, SvgMap, useSvgMapViewport } from '../../../../opale';
import { Specimen } from '../../../section';
import { PropsTable, UsageBlock } from '../../api';
import type { PropRow } from '../../api';
import { ComponentPageLayout } from '../../component-page';
import { CATALOG_API } from '../../opale-api-data';
import { MaterialSwitch, PlainStage } from '../material-switch';

/* LE MONDE SE CHARGE À PART. Le jeu 50m pèse l'essentiel de cette page ; lié
   au reste, il retardait l'affichage des départements, qui n'en ont pas
   besoin. La démonstration arrive quand ses données sont là. */
const WorldMap = lazy(() => import('./world-map'));
import { CORSE, FRANCE_DEPARTMENTS, FRANCE_VIEWBOX, ILE_DE_FRANCE } from './france-departments';

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
    <ComponentPageLayout
      id="svg-map"
      imports={['SvgMap', 'SvgMapControls', 'useSvgMapViewport']}
      demo={
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
              souffler la réponse, si bien qu’un lecteur d’écran peut les parcourir mais pas y
              jouer.
            </>
          }
        >
          <FindTheDepartment />
        </Specimen>
      }
      examples={
        <>
          <UsageBlock label="Import et appels représentatifs de SvgMap" code={USAGE} />
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
                La carte de <strong>Travels in World</strong>, rendue par <code>SvgMap</code> : les
                239 pays du jeu 50m de world-atlas — la résolution de Travels in World — projetés en
                Natural Earth I dans son cadre d’usine de 960 × 500, joints sur leur code ISO
                numérique et nommés en français par <code>Intl.DisplayNames</code>. Cliquez un pays
                pour le passer de non visité à visité, puis à venir ; l’état s’entend aussi dans son
                nom. Les boutons cadrent sur un continent.
              </>
            }
          >
            <Suspense
              fallback={<p className="tc-doc-svgmap-loading">Chargement de la carte du monde…</p>}
            >
              <WorldMap />
            </Suspense>
          </Specimen>

          <Specimen
            title="Cadrer de l’extérieur"
            note="La vue peut être tenue par l’appelant. Le cadrage garde le rapport de la carte — un ensemble plus haut que large n’est pas coupé — et reste centré même quand l’ensemble est plus petit que le zoom maximal ne l’autorise."
          >
            <FramedMap />
          </Specimen>
        </>
      }
      props={
        <>
          <PropsTable id="svg-map" note={api.states} rows={api.rows} />
          <PropsTable id="svg-map-region" title="SvgMapRegion" rows={REGION_ROWS} />
          <PropsTable
            id="svg-map-viewport"
            title="useSvgMapViewport(viewBox, { maxZoom })"
            note={
              <>
                Passée à <code>SvgMap</code> et à <code>SvgMapControls</code>, la vue est partagée :
                la carte, ses commandes et l’appelant voient la même.
              </>
            }
            rows={VIEWPORT_ROWS}
          />
          <p className="tc-doc-prose tc-doc-svgmap-credit">
            Tracés des départements : svg-maps de Victor Cazanave, sous licence CC-BY-4.0. Carte du
            monde : world-atlas (licence ISC), d’après les données Natural Earth, du domaine public.
            Ni l’un ni l’autre ne font partie de la librairie — la vitrine les installe pour la
            démonstration.
          </p>
        </>
      }
      states={[
        {
          state: 'disabled',
          description: (
            <>
              Les commandes indisponibles — zoom maximal atteint, rien à dézoomer ou à réinitialiser
              — portent <code>aria-disabled=&quot;true&quot;</code> : elles restent focusables et le
              clic est sans effet.
            </>
          ),
        },
      ]}
      accessibility={{
        keyboard: [
          <>
            Avec <code>selectable</code>, la carte est un seul arrêt de tabulation (tabindex
            roulant) : les flèches mènent à la région voisine dans leur direction,{' '}
            <kbd>Origine</kbd> et <kbd>Fin</kbd> suivent l’ordre du tableau, <kbd>Entrée</kbd> et{' '}
            <kbd>Espace</kbd> appellent <code>onSelect</code>.
          </>,
          <>
            <kbd>Maj</kbd> + flèches déplacent la vue ; sans <code>selectable</code>, le{' '}
            <code>&lt;svg&gt;</code> prend le focus et les flèches seules la déplacent.
          </>,
          <>
            <kbd>+</kbd> zoome sur la région qui a le focus, <kbd>−</kbd> dézoome, <kbd>0</kbd>{' '}
            revient à la vue d’ensemble ; jamais avec <kbd>Ctrl</kbd>, <kbd>⌘</kbd> ou{' '}
            <kbd>Alt</kbd>, pour laisser le zoom du navigateur.
          </>,
          <>
            <kbd>Échap</kbd> masque l’infobulle jusqu’au prochain survol ou focus. Une région
            atteinte au clavier est ramenée dans la vue.
          </>,
        ],
        semantics: [
          <>
            Le <code>&lt;svg&gt;</code> porte <code>role=&quot;img&quot;</code>, ou{' '}
            <code>role=&quot;group&quot;</code> avec <code>selectable</code>, nommé par{' '}
            <code>label</code> et décrit par <code>description</code> suivie des consignes clavier.
          </>,
          <>
            Une région sélectionnable est un <code>&lt;path role=&quot;button&quot;&gt;</code> nommé
            par <code>ariaLabel</code>, puis <code>name</code>, puis <code>id</code> ;{' '}
            <code>aria-pressed</code> n’est posé que si <code>selected</code> est fourni.
          </>,
          <>
            <code>SvgMapControls</code> est un <code>role=&quot;group&quot;</code> nommé « Zoom »,
            de boutons « Zoomer », « Dézoomer » et « Vue d’ensemble ».
          </>,
          <>
            L’infobulle et la consigne de molette sont <code>aria-hidden</code>. Sous{' '}
            <code>prefers-reduced-motion</code>, les cadrages ne sont pas animés.
          </>,
        ],
      }}
      limits={[
        <>Aucune région live n’annonce le niveau de zoom ni le déplacement de la vue.</>,
        <>
          L’infobulle (le <code>name</code>) est seulement visuelle ; une carte de chaleur doit
          reprendre ses valeurs en texte.
        </>,
        <>
          Une molette sans <kbd>Ctrl</kbd> ou <kbd>⌘</kbd> fait défiler la page ; un contact qui
          bouge de plus de six pixels ne vaut plus un clic.
        </>,
        <>Une région dont le tracé n’a pas de boîte est exclue des flèches et du cadrage.</>,
      ]}
    />
  );
}
