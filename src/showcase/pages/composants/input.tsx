import { Input } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MagicCell, MagicGroundNote, MagicPreamble, MagicStage } from './stage';

const USAGE = `import { Input } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// Non contrôlé : \`defaultValue\`, et on lit la valeur à la soumission.
<Input defaultValue="Kyoto" aria-label="Ville" />

// \`type\` est écrit en dur AVANT le spread, donc il se surcharge.
<Input type="email" placeholder="vous@exemple.fr" aria-label="Courriel" />`;

const PROPS: readonly PropRow[] = [
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: (
      <>
        Le coussin et la taille de texte.{' '}
        <code>ComponentPropsWithoutRef&lt;&apos;input&apos;&gt;</code> est <code>Omit</code>-é de
        son propre <code>size</code> pour laisser la place à celui-ci — l’attribut HTML{' '}
        <code>size</code> n’est donc pas transmissible.
      </>
    ),
  },
  {
    name: 'type',
    type: 'string',
    defaultValue: "'text'",
    description: (
      <>
        Écrit <strong>avant</strong> le spread des props, donc surchargeable — un{' '}
        <code>type=&quot;email&quot;</code> passe.
      </>
    ),
  },
  {
    name: 'placeholder',
    type: 'string',
    description: (
      <>
        Transmis tel quel. <strong>Il ne remplace pas une étiquette</strong> : il disparaît à la
        saisie et n’est pas un nom accessible fiable.
      </>
    ),
  },
  {
    name: 'disabled',
    type: 'boolean',
    description: 'Le vrai attribut, plus une classe qui atténue le champ.',
  },
  {
    name: 'enableClickAnimation',
    type: 'boolean',
    defaultValue: 'true',
    description: (
      <>
        Arme l’ondulation sur l’enveloppe de verre — donc{' '}
        <strong>un clic dans le champ fait onduler le verre</strong>, ce qui est inhabituel pour une
        zone de saisie.
      </>
    ),
  },
  {
    name: '…ComponentPropsWithoutRef<"input">',
    type: 'union (sans size)',
    description: (
      <>
        Tout le reste part sur le <code>&lt;input&gt;</code>.{' '}
        <strong>
          Pas de <code>ref</code>
        </strong>{' '}
        : le composant n’est pas un <code>forwardRef</code>, donc l’élément n’est pas atteignable
        par référence — un focus par programme est impossible.
      </>
    ),
  },
];

export const inputPage: DocPage = {
  slug: 'composants/input',
  label: 'Input',
  group: 'composants',
  title: 'Input',
  lede: (
    <>
      Un vrai <code>&lt;input&gt;</code>, posé dans une enveloppe de verre. C’est le seul contrôle
      de la librairie qui repose sur un élément de formulaire natif : il se soumet, il se valide, et
      il porte son état lui-même — le composant ne gère rien.{' '}
      <strong>
        Il ne rend en revanche aucune étiquette : le nom accessible est entièrement à votre charge.
      </strong>
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Input" code={USAGE} />

      <Specimen
        title="Les trois crans, vides puis remplis"
        note={
          <>
            Non contrôlés : ces champs se saisissent directement, aucun <code>useState</code> n’est
            derrière. <MagicGroundNote />
          </>
        }
      >
        <MagicStage>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <MagicCell key={size} label={<code>size=&quot;{size}&quot;</code>}>
              <Input size={size} placeholder={`cran ${size}`} aria-label={`cran ${size}`} />
            </MagicCell>
          ))}
          <MagicCell label="avec une valeur — defaultValue">
            <Input defaultValue="Kyoto" aria-label="Ville de l’étape" />
          </MagicCell>
        </MagicStage>
      </Specimen>

      <Specimen
        title="Désactivé, et un type surchargé"
        note={
          <>
            Le second champ prouve que <code>type</code> est surchargeable : il est déclaré en dur à{' '}
            <code>&quot;text&quot;</code> mais <em>avant</em> le spread des props.
          </>
        }
      >
        <MagicStage>
          <MagicCell label={<code>disabled</code>}>
            <Input disabled placeholder="indisponible" aria-label="Champ indisponible" />
          </MagicCell>
          <MagicCell label={<code>type=&quot;email&quot;</code>}>
            <Input type="email" placeholder="vous@exemple.fr" aria-label="Courriel" />
          </MagicCell>
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-input"
        note={
          <>
            <code>
              Omit&lt;ComponentPropsWithoutRef&lt;&apos;input&apos;&gt;, &apos;size&apos;&gt;
            </code>{' '}
            plus deux props propres. Noter l’asymétrie avec les autres composants de la librairie :
            celui-ci n’étend <strong>pas</strong> <code>GlassProps</code>, donc ni{' '}
            <code>rootClassName</code>, ni <code>rootStyle</code>, ni <code>triggerAnimation</code>{' '}
            ne sont acceptés.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Trois manques à connaître avant de l’employer dans un formulaire.</strong> Aucune
        étiquette n’est rendue — <code>aria-label</code> ou un <code>&lt;label for&gt;</code> écrit
        à côté sont obligatoires, et c’est ce que fait cette page. Aucun message d’erreur, aucun{' '}
        <code>aria-describedby</code>, aucun <code>aria-invalid</code> : l’état de validation est
        entièrement à construire. Et l’absence de <code>forwardRef</code> interdit de lui donner le
        focus par programme, ce qui est exactement ce qu’on veut faire après un échec de validation.
      </p>

      <p className="tc-doc-prose">
        <strong>Il n’y a plus de composant de champ dans cette librairie.</strong> La 1.0 traitait
        le sujet en deux : un <code>Input</code> pour le contrôle et un <code>Field</code> qui
        câblait l’étiquette, le texte d’aide et le message d’erreur — <code>&lt;label for&gt;</code>
        , <code>aria-describedby</code> et <code>aria-invalid</code> posés pour l’appelant. La 2.0
        ne publie plus ni l’un ni l’autre : les trois manques ci-dessus sont désormais à la charge
        de qui emploie ce champ, et rien dans le paquet ne les couvre.
      </p>
    </PageBody>
  ),
};
