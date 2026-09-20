import { Switch } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { SwitchSizeScene } from './scenes';
import { MagicCell, MagicGroundNote, MagicPreamble, MagicStage } from './stage';

const USAGE = `import { Switch } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// La prop s'appelle \`setIsActive\`, pas \`onChange\`.
const [glass, setGlass] = useState(false);

<Switch
  isActive={glass}
  setIsActive={setGlass}
  aria-label="Verre liquide"
/>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'isActive',
    type: 'boolean',
    defaultValue: 'false',
    description: (
      <>
        <strong>Aucun état interne.</strong> Sans <code>isActive</code> ni <code>setIsActive</code>,
        l’interrupteur reste éteint et le clic n’a aucun effet visible.
      </>
    ),
  },
  {
    name: 'setIsActive',
    type: '(isActive: boolean) => void',
    description: (
      <>
        Reçoit la valeur <em>suivante</em>. Le nom est un{' '}
        <strong>setter et non un gestionnaire d’événement</strong> — <code>onChange</code> n’existe
        pas sur ce composant, et un <code>setState</code> de React s’y branche directement.
      </>
    ),
  },
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: (
      <>
        Posée <strong>deux fois</strong> — sur le contenu et sur l’enveloppe du verre — parce que la
        piste et l’enveloppe doivent avoir la même largeur.
      </>
    ),
  },
  {
    name: 'disabled',
    type: 'boolean',
    description: 'Le vrai attribut, plus une classe d’atténuation.',
  },
  {
    name: 'enableClickAnimation',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Arme l’ondulation de Glass au clic.',
  },
  {
    name: '…GlassProps',
    type: 'union',
    description: (
      <>
        La seule voie pour un <code>aria-label</code> ou un <code>id</code> — et elle est
        indispensable, voir plus bas. Le composant ne rend <strong>aucun enfant</strong> : il
        appelle <code>Glass</code> sans contenu.
      </>
    ),
  },
];

export const switchPage: DocPage = {
  slug: 'composants/switch',
  label: 'Switch',
  group: 'composants',
  title: 'Switch',
  lede: (
    <>
      Un interrupteur de verre : un <code>&lt;button&gt;</code> vide, dont la piste et le curseur
      sont entièrement peints en CSS. Toujours contrôlé, et par une prop nommée{' '}
      <code>setIsActive</code> — pas <code>onChange</code>. Comme il ne rend aucun contenu,{' '}
      <strong>il n’a aucun nom accessible tant qu’on ne lui en donne pas un à la main</strong>.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Switch" code={USAGE} />

      <Specimen
        title="Les trois crans — basculez-les"
        note={
          <>
            Le cran du milieu part allumé pour que les deux apparences soient visibles côte à côte.{' '}
            <MagicGroundNote />
          </>
        }
      >
        <SwitchSizeScene />
      </Specimen>

      <Specimen
        title="Désactivé, allumé et éteint"
        note={
          <>
            Ces deux-là sont volontairement <strong>non contrôlés</strong> : ils montrent les deux
            apparences figées.
          </>
        }
      >
        <MagicStage>
          <MagicCell label={<code>disabled</code>}>
            <Switch disabled aria-label="Interrupteur éteint, indisponible" />
          </MagicCell>
          <MagicCell
            label={
              <>
                <code>disabled</code> + <code>isActive</code>
              </>
            }
          >
            <Switch disabled isActive aria-label="Interrupteur allumé, indisponible" />
          </MagicCell>
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-switch"
        note={
          <>
            Cinq props propres, plus <code>GlassProps</code>. Pas de{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;button&apos;&gt;</code>, donc <code>type</code>{' '}
            n’est pas passable — le composant ne l’écrit pas non plus, si bien que ce bouton est un{' '}
            <strong>
              <code>type=&quot;submit&quot;</code> implicite
            </strong>{' '}
            : posé dans un <code>&lt;form&gt;</code>, le basculer soumettrait le formulaire.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Ce qu’il faut ajouter pour qu’il soit utilisable.</strong> Un{' '}
        <code>aria-label</code> (ou un <code>aria-labelledby</code>), sans quoi le contrôle
        s’annonce « bouton » et rien de plus — c’est ce que fait chaque figure de cette page. Et
        idéalement <code>role=&quot;switch&quot;</code> avec <code>aria-checked</code>, que le
        composant ne pose pas : son état allumé n’est visible qu’à l’œil. Les deux passent par{' '}
        <code>GlassProps</code>, donc les deux sont rattrapables depuis l’appelant, contrairement à
        ce qui se passe sur{' '}
        <a className="tc-doc-link" href={hrefFor('composants/select')}>
          Select
        </a>
        .
      </p>
    </PageBody>
  ),
};
