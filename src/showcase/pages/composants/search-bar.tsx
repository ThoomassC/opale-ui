import { Opale } from '../../../opale';
import { Specimen } from '../../section';
import { PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { ComponentPageLayout } from '../component-page';
import { MaterialSwitch, PlainStage } from './material-switch';

const USAGE = `import { SearchBar } from '@thomascaron/opale-ui';

<SearchBar placeholder="Un voyage, un lieu, un pays…" />`;

const PROPS: readonly PropRow[] = [
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: 'Taille du texte dans la barre.',
  },
  {
    name: 'enableLiquidAnimation',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Active la déformation liquide au clic, en verre liquide.',
  },
  {
    name: 'icon',
    type: 'ReactNode',
    defaultValue: 'loupe Opale',
    description: 'Remplace la loupe décorative si une autre icône est nécessaire.',
  },
  {
    name: 'liquidGlass',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Active le matériau verre liquide.',
  },
  {
    name: '…ComponentPropsWithoutRef<"input">',
    type: 'union (sans size)',
    description: 'Les attributs et événements natifs de l’input.',
  },
];

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `search-bar.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function SearchBarContent() {
  return (
    <ComponentPageLayout
      id="search-bar"
      imports={['SearchBar']}
      demo={
        <Specimen title="Barre de recherche">
          <MaterialSwitch name="SearchBar">
            {(liquidGlass) => (
              <div style={{ width: '100%', maxWidth: '36rem' }}>
                <Opale.SearchBar
                  liquidGlass={liquidGlass}
                  placeholder="Un voyage, un lieu, un pays…"
                  aria-label="Rechercher"
                />
              </div>
            )}
          </MaterialSwitch>
        </Specimen>
      }
      examples={
        <>
          <UsageBlock label="Import et appel de SearchBar" code={USAGE} />
          <Specimen title="Les trois tailles, et l’état désactivé">
            <PlainStage stack>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <div key={size} style={{ width: '100%', maxWidth: '36rem' }}>
                  <Opale.SearchBar
                    size={size}
                    placeholder={`size="${size}"`}
                    aria-label={`Rechercher, taille ${size}`}
                  />
                </div>
              ))}
              <div style={{ width: '100%', maxWidth: '36rem' }}>
                <Opale.SearchBar
                  disabled
                  placeholder="disabled"
                  aria-label="Rechercher, désactivé"
                />
              </div>
            </PlainStage>
          </Specimen>
        </>
      }
      props={<PropsTable id="search-bar" rows={PROPS} />}
      states={[
        {
          state: 'disabled',
          description: (
            <>
              <code>disabled</code> désactive l’<code>&lt;input&gt;</code> natif et coupe l’onde du
              verre.
            </>
          ),
        },
      ]}
      accessibility={{
        keyboard: [
          <>
            Aucune touche propre : c’est le clavier natif d’un{' '}
            <code>&lt;input type=&quot;search&quot;&gt;</code>.
          </>,
        ],
        semantics: [
          <>
            L’enveloppe porte <code>role=&quot;search&quot;</code> : chaque barre est un repère de
            recherche.
          </>,
          <>
            Le champ est nommé par l’<code>aria-label</code> passé ; à défaut, « Rechercher », sauf
            si un <code>aria-labelledby</code> ou un <code>id</code> laisse un{' '}
            <code>&lt;label for&gt;</code> le nommer.
          </>,
          <>
            La loupe par défaut est <code>aria-hidden</code> ; une icône passée par{' '}
            <code>icon</code> est rendue telle quelle.
          </>,
        ],
      }}
      limits={[
        <>
          <code>role=&quot;search&quot;</code> est posé sur un <code>&lt;div&gt;</code>, pas sur un{' '}
          <code>&lt;form&gt;</code> : la soumission est à la charge de l’appelant.
        </>,
        <>
          <code>ref</code> et <code>className</code> visent l’<code>&lt;input&gt;</code>, pas
          l’enveloppe.
        </>,
        <>Ni bouton d’effacement propre, ni texte d’aide intégré.</>,
      ]}
    />
  );
}
