import { Select } from '../../../magic';
import type { SelectOption } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { SelectSizeScene } from './scenes';
import { MagicCell, MagicGroundNote, MagicPreamble, MagicStage } from './stage';

/** Quatre options de démonstration — assez pour que la liste ait à défiler. */
const OPTIONS: readonly SelectOption[] = [
  { value: 'japon', label: 'Japon' },
  { value: 'perou', label: 'Pérou' },
  { value: 'islande', label: 'Islande' },
  { value: 'maroc', label: 'Maroc' },
];

const USAGE = `import { Select } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// TOUJOURS contrôlé pour la valeur ; l'ouverture, elle, est interne.
const [country, setCountry] = useState<string>();

<Select
  options={[{ value: 'japon', label: 'Japon' }]}
  value={country}
  onChange={setCountry}
  placeholder="Choisir un pays"
/>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'options',
    type: 'SelectOption[]',
    required: true,
    description: (
      <>
        <code>{'{ value: string; label: string }'}</code>. Un tableau <strong>mutable</strong> dans
        leur type : un <code>readonly</code> ne passe pas sans copie.
      </>
    ),
  },
  {
    name: 'value',
    type: 'string',
    description: (
      <>
        La valeur retenue. <strong>Aucun état interne</strong> : sans <code>value</code> ni{' '}
        <code>onChange</code>, la liste s’ouvre et se referme mais rien ne se sélectionne jamais.
      </>
    ),
  },
  {
    name: 'onChange',
    type: '(value: string) => void',
    description: 'Reçoit la valeur choisie. La liste se referme d’elle-même après l’appel.',
  },
  {
    name: 'placeholder',
    type: 'string',
    defaultValue: "'Select an option'",
    description: (
      <>
        Le libellé quand rien n’est retenu. <strong>Le défaut est en anglais</strong> — sur un site
        français, il faut le passer.
      </>
    ),
  },
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: 'Coussin du bouton, de la liste et des options.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    description: (
      <>
        Le bouton devient inerte et la liste ne s’ouvre plus — le rendu de la liste est gardé par{' '}
        <code>isOpen &amp;&amp; !disabled</code>.
      </>
    ),
  },
  {
    name: 'enableClickAnimation',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Arme l’ondulation sur le bouton d’ouverture.',
  },
];

export const selectPage: DocPage = {
  slug: 'composants/select',
  label: 'Select',
  group: 'composants',
  title: 'Select',
  lede: (
    <>
      Une liste déroulante entièrement reconstruite : un <code>&lt;button&gt;</code> qui ouvre un
      panneau de verre rempli d’autres <code>&lt;button&gt;</code>. Ce n’est <strong>pas</strong> un{' '}
      <code>&lt;select&gt;</code> — rien n’est soumis avec un formulaire — et la fermeture au clic
      extérieur est câblée à la main sur <code>document</code>.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Select" code={USAGE} />

      <Specimen
        title="Les trois crans — ouvrez-les"
        note={
          <>
            La scène est volontairement <strong>haute</strong> : le panneau se déploie en flux
            absolu sous le bouton, et sur une scène ajustée à son contenu il serait rogné.{' '}
            <MagicGroundNote />
          </>
        }
      >
        <SelectSizeScene options={OPTIONS} />
      </Specimen>

      <Specimen
        title="Désactivé, et la valeur retenue"
        note={
          <>
            La seconde figure est <strong>non contrôlée volontairement</strong> — <code>value</code>{' '}
            est passé sans <code>onChange</code> — pour montrer ce que fait le composant dans ce cas
            : il ouvre, il ferme, et il ne change jamais de valeur.
          </>
        }
      >
        <MagicStage tall>
          <MagicCell label={<code>disabled</code>}>
            <Select disabled options={[...OPTIONS]} placeholder="Indisponible" />
          </MagicCell>
          <MagicCell
            label={
              <>
                <code>value</code> sans <code>onChange</code> — inerte
              </>
            }
          >
            <Select options={[...OPTIONS]} value="islande" />
          </MagicCell>
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-select"
        note={
          <>
            Sept props propres et <strong>rien d’autre</strong> : <code>SelectProps</code> n’étend
            ni <code>ComponentPropsWithoutRef</code> ni <code>GlassProps</code>. Le{' '}
            <code>{'{...props}'}</code> du composant est donc toujours vide en pratique, et aucun{' '}
            <code>aria-*</code> ni <code>id</code> ne peut être passé — c’est la limite la plus dure
            de ce composant.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Ce qui manque au clavier, et c’est structurel.</strong> Le bouton s’atteint et
        s’actionne, les options aussi une fois la liste ouverte — ce sont de vrais boutons. Mais il
        n’y a ni <code>role=&quot;listbox&quot;</code>, ni <code>aria-expanded</code>, ni{' '}
        <code>aria-activedescendant</code>, ni navigation par flèches, ni fermeture par{' '}
        <kbd>Échap</kbd> : la liste ne s’annonce pas comme une liste et son état ouvert n’est
        annoncé nulle part. Le type ne permettant pas de passer un <code>aria-*</code>, cela ne se
        rattrape pas depuis l’appelant.
      </p>

      <p className="tc-doc-prose">
        <strong>
          Il n’y a plus de <code>&lt;select&gt;</code> natif dans cette librairie.
        </strong>{' '}
        La 1.0 en publiait un, simplement habillé, ce qui lui donnait gratuitement la navigation au
        clavier, la recherche par frappe, le volet natif du téléphone et l’envoi dans un formulaire.
        La 2.0 ne le publie plus : ce que ce composant-ci a perdu, listé ci-dessus, n’est plus
        rattrapable par un autre composant du paquet.
      </p>
    </PageBody>
  ),
};
