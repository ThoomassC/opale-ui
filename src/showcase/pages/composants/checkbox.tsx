import { Checkbox } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { CheckboxSizeScene } from './scenes';
import { MagicCell, MagicGroundNote, MagicPreamble, MagicStage } from './stage';

const USAGE = `import { Checkbox } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// TOUJOURS contrôlé : \`checked\` retombe sur \`false\` sans état à vous.
const [accepted, setAccepted] = useState(false);

<Checkbox
  checked={accepted}
  onChange={setAccepted}
  label="J'accepte"
  aria-label="J'accepte"
/>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'checked',
    type: 'boolean',
    defaultValue: 'false',
    description: (
      <>
        <strong>Le composant n’a aucun état interne.</strong> Sans <code>checked</code> ni{' '}
        <code>onChange</code>, la case reste décochée pour toujours et le clic ne fait rien de
        visible.
      </>
    ),
  },
  {
    name: 'onChange',
    type: '(checked: boolean) => void  ∩  ChangeEventHandler<HTMLDivElement>',
    description: (
      <>
        Reçoit la valeur <em>suivante</em>, pas un événement — mais{' '}
        <strong>le type dit autre chose</strong>, et c’est la collision décrite plus bas :{' '}
        <code>CheckboxProps</code> intersecte <code>GlassProps</code>, qui apporte le{' '}
        <code>onChange</code> de React. Le paramètre arrive donc en{' '}
        <code>boolean | ChangeEvent&lt;HTMLDivElement&gt;</code>.
      </>
    ),
  },
  {
    name: 'label',
    type: 'string',
    description: (
      <>
        Rendu dans un <code>&lt;span onClick&gt;</code> à côté de la case —{' '}
        <strong>
          pas un <code>&lt;label for&gt;</code>
        </strong>
        . Voir l’avertissement plus bas.
      </>
    ),
  },
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: 'La taille de la case et de l’icône de coche.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    description: (
      <>
        Pose le vrai attribut sur le <code>&lt;button&gt;</code> et neutralise <code>onChange</code>
        .
      </>
    ),
  },
  {
    name: 'enableClickAnimation',
    type: 'boolean',
    defaultValue: 'true',
    description: (
      <>
        Arme l’ondulation.{' '}
        <strong>
          Non désarmée par <code>disabled</code>
        </strong>
        , contrairement à ce que fait <code>Button</code> — mais le clic n’arrive jamais sur un
        bouton désactivé, donc l’écart est sans effet visible.
      </>
    ),
  },
];

export const checkboxPage: DocPage = {
  slug: 'composants/checkbox',
  label: 'Checkbox',
  group: 'composants',
  title: 'Checkbox',
  lede: (
    <>
      Une case à cocher de verre, sans état interne : elle est <strong>toujours contrôlée</strong>.
      Ce n’est pas un <code>&lt;input type=&quot;checkbox&quot;&gt;</code> mais un{' '}
      <code>&lt;button&gt;</code> qui dessine une coche en SVG, donc rien n’est envoyé avec un
      formulaire et rien ne s’annonce comme « case à cocher ».
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Checkbox" code={USAGE} />

      <Specimen
        title="Les trois crans — cliquez, l’état est à vous"
        note={
          <>
            Chacune de ces cases est câblée sur un <code>useState</code> de la vitrine : sans lui,
            aucune ne changerait d’apparence au clic. <MagicGroundNote />
          </>
        }
      >
        <CheckboxSizeScene />
      </Specimen>

      {/* SCÈNE FIGÉE, DONC ÉCRITE ICI ET NON DANS `scenes.tsx` : deux cases
          désactivées n'ont pas d'état, donc elles n'ont pas besoin d'être un
          composant, et les garder sur place les garde à côté de leur prose. */}
      <Specimen
        title="Désactivé, coché et décoché"
        note="Deux apparences figées : le vrai attribut disabled est posé sur le <button>, donc il sort de l’ordre de tabulation."
      >
        <MagicStage>
          <MagicCell label={<code>disabled</code>}>
            <Checkbox disabled label="décoché, inerte" aria-label="décoché, inerte" />
          </MagicCell>
          <MagicCell
            label={
              <>
                <code>disabled</code> + <code>checked</code>
              </>
            }
          >
            <Checkbox disabled checked label="coché, inerte" aria-label="coché, inerte" />
          </MagicCell>
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-checkbox"
        note={
          <>
            <code>CheckboxProps</code> ne comprend <strong>ni</strong>{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;input&apos;&gt;</code> <strong>ni</strong>{' '}
            <code>ComponentPropsWithoutRef&lt;&apos;button&apos;&gt;</code> : six props propres,
            plus <code>GlassProps</code>. Les attributs qui passent — <code>aria-label</code>,{' '}
            <code>id</code>, <code>name</code> — le font par <code>GlassProps</code>, qui les
            transmet à l’élément de contenu.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>
          Deux défauts d’accessibilité réels, gardés tels quels et documentés dans{' '}
          <code>src/magic/README.md</code>.
        </strong>{' '}
        Le libellé est un <code>&lt;span onClick&gt;</code> : cliquer le texte fonctionne à la
        souris et <strong>pas au clavier</strong>, et le texte n’est pas associé au contrôle, donc
        il n’en devient pas le nom accessible — c’est pourquoi chaque case de cette page reçoit en
        plus un <code>aria-label</code> écrit à la main. Et le contrôle est un{' '}
        <code>&lt;button&gt;</code> sans <code>role=&quot;checkbox&quot;</code> ni{' '}
        <code>aria-checked</code> : son état coché n’est annoncé nulle part. Le fichier porte un{' '}
        <code>eslint-disable</code> ciblé qui dit exactement cela.
      </p>

      <p className="tc-doc-prose">
        <strong>Une collision de types, trouvée en écrivant cette page.</strong>{' '}
        <code>CheckboxProps</code> déclare <code>onChange?: (checked: boolean) =&gt; void</code>{' '}
        puis intersecte <code>GlassProps</code>, qui apporte le <code>onChange</code> de React —{' '}
        <code>ChangeEventHandler&lt;HTMLDivElement&gt;</code>. TypeScript intersecte les deux
        signatures, donc le paramètre du gestionnaire arrive en{' '}
        <code>boolean | ChangeEvent&lt;HTMLDivElement&gt;</code> et un{' '}
        <code>onChange={'{setChecked}'}</code> direct <strong>ne compile pas</strong>. À l’exécution
        le composant n’appelle jamais qu’avec un booléen ; il faut donc un{' '}
        <code>typeof next === &apos;boolean&apos;</code> pour satisfaire le compilateur, et c’est ce
        que fait le code de cette page. Le même motif atteint <code>Sidebar.onToggle</code> — voir{' '}
        <a className="tc-doc-link" href={hrefFor('composants/sidebar')}>
          Sidebar
        </a>
        .
      </p>

      <p className="tc-doc-prose">
        <strong>Il n’y a plus de case native dans cette librairie.</strong> La 1.0 publiait une{' '}
        <code>Checkbox</code> qui était un vrai <code>&lt;input type=&quot;checkbox&quot;&gt;</code>{' '}
        associé à son <code>&lt;label&gt;</code> — donc cochable au clavier, nommée par son libellé,
        et dont l’état était annoncé par le moteur. La 2.0 ne la publie plus : la seule case de la
        librairie est celle de cette page, avec les deux défauts ci-dessus.
      </p>
    </PageBody>
  ),
};
