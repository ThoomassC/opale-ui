import { Badge } from '../../../magic';
import type { BadgeVariant } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MagicCell, MagicGroundNote, MagicPreamble, MagicStage } from './stage';

/** Les six variantes, dans l'ordre de leur type. */
const VARIANTS: readonly BadgeVariant[] = [
  'default',
  'positive',
  'negative',
  'warning',
  'info',
  'neutral',
];

const USAGE = `import { Badge } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

<Badge>active</Badge>
<Badge variant="positive">publié</Badge>
<Badge variant="negative" leadingIcon={<Croix />}>échec</Badge>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'variant',
    type: "'default' | 'positive' | 'negative' | 'warning' | 'info' | 'neutral'",
    defaultValue: "'default'",
    description: (
      <>
        Ajoute une classe <strong>globale, non préfixée</strong> — <code>bg-positive</code>,{' '}
        <code>bg-negative</code>… — publiée par un bloc <code>:global</code> de{' '}
        <code>Badge.module.scss</code>. Collision possible chez le consommateur, et c’est écrit dans{' '}
        <code>src/magic/README.md</code>.
      </>
    ),
  },
  {
    name: 'leadingIcon',
    type: 'ReactNode',
    description: 'Rendu avant les enfants, dans son propre conteneur.',
  },
  {
    name: 'trailingIcon',
    type: 'ReactNode',
    description: 'Rendu après les enfants.',
  },
  {
    name: 'className',
    type: 'string',
    description: (
      <>Fusionné avec la classe du badge et celle de la variante, sur le contenu du verre.</>
    ),
  },
  {
    name: '…HTMLAttributes<HTMLSpanElement> & GlassProps',
    type: 'union',
    description: (
      <>
        Le composant appelle <code>Glass as=&quot;span&quot;</code> avec{' '}
        <code>rootClassName=&quot;rounded-full&quot;</code> — une classe qui{' '}
        <strong>ne prend pas</strong>, voir plus bas. Voir aussi{' '}
        <a className="tc-doc-link" href={hrefFor('composants/glass')}>
          Glass
        </a>
        .
      </>
    ),
  },
];

export const badgePage: DocPage = {
  slug: 'composants/badge',
  label: 'Badge',
  group: 'composants',
  title: 'Badge',
  lede: (
    <>
      Une pastille de verre, six variantes de fond. Elle <em>veut</em> être une pilule et ne l’est
      pas — c’est le défaut mesuré au bas de cette page. Le contenu est un <code>&lt;span&gt;</code>{' '}
      mais l’enveloppe de <code>Glass</code> reste un <code>&lt;div&gt;</code>, si bien qu’un{' '}
      <code>Badge</code> ne peut pas se poser dans un <code>&lt;p&gt;</code> : ce serait un bloc
      dans un paragraphe, et React le signale.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Badge" code={USAGE} />

      <Specimen
        title="Les six variantes"
        note={
          <>
            Les cinq variantes colorées fonctionnent, mais <strong>par accident de cascade</strong>{' '}
            : leurs couleurs viennent d’un bloc <code>:global</code> de{' '}
            <code>Badge.module.scss</code> qui passe après l’utilitaire Tailwind et emploie le
            raccourci <code>background</code>. <MagicGroundNote />
          </>
        }
      >
        <MagicStage>
          {VARIANTS.map((variant) => (
            <MagicCell key={variant} label={<code>variant=&quot;{variant}&quot;</code>}>
              <Badge variant={variant}>étape {variant}</Badge>
            </MagicCell>
          ))}
        </MagicStage>
      </Specimen>

      <Specimen
        title="Les deux emplacements d’icône"
        note={
          <>
            Chaque icône est enveloppée par le composant ; elle reste dans le flux du libellé et{' '}
            <strong>n’est pas masquée aux technologies d’assistance</strong> — un{' '}
            <code>aria-hidden</code> est à votre charge si l’icône est décorative.
          </>
        }
      >
        <MagicStage>
          <MagicCell label={<code>leadingIcon</code>}>
            <Badge variant="positive" leadingIcon={<span aria-hidden="true">✓</span>}>
              publié
            </Badge>
          </MagicCell>
          <MagicCell label={<code>trailingIcon</code>}>
            <Badge variant="info" trailingIcon={<span aria-hidden="true">→</span>}>
              en revue
            </Badge>
          </MagicCell>
          <MagicCell label="les deux à la fois">
            <Badge
              variant="warning"
              leadingIcon={<span aria-hidden="true">!</span>}
              trailingIcon={<span aria-hidden="true">→</span>}
            >
              à vérifier
            </Badge>
          </MagicCell>
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-badge"
        note={
          <>
            <code>BadgeProps</code> est l’intersection de trois choses :{' '}
            <code>HTMLAttributes&lt;HTMLSpanElement&gt;</code>, ses quatre props propres, et{' '}
            <code>GlassProps</code>. Un badge accepte donc <code>rootClassName</code>,{' '}
            <code>rootStyle</code> et <code>triggerAnimation</code> sans que sa page d’origine le
            dise.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>
          La pilule n’existe pas, et c’est mesuré au navigateur — pas seulement dans cette vitrine,
          dans le paquet publié aussi.
        </strong>{' '}
        <code>Badge</code> passe <code>rootClassName=&quot;rounded-full&quot;</code> à{' '}
        <code>Glass</code> pour arrondir son enveloppe. L’utilitaire{' '}
        <code>.rounded-full {'{ border-radius: 9999px }'}</code> et la classe interne de l’enveloppe{' '}
        <code>{'{ border-radius: var(--lg-radius, 22px) }'}</code> ont la{' '}
        <strong>même spécificité</strong> (0,1,0), et celle de l’enveloppe passe{' '}
        <strong>plus tard</strong> dans la feuille produite — lignes 51 et 403 du{' '}
        <code>magic.css</code> publié, offsets 1 578 et 17 011. Valeur calculée relevée au
        navigateur sur les figures ci-dessus : <code>border-radius: 22px</code>. Opale a relevé ce
        rayon de 8 à 22 px pour que les composants s’arrondissent, mais cela n’a rien réglé ici :{' '}
        <strong>seule la valeur a changé, le mécanisme est intact</strong> et 22 px sur une pastille
        de 24 px de haut n’est toujours pas une pilule. Le correctif est en amont
        — <code>rootStyle</code> au lieu de <code>rootClassName</code>, comme le fait leur{' '}
        <code>Switch</code> —, et il n’est pas dans <code>src/magic/README.md</code> :{' '}
        <a className="tc-doc-link" href={hrefFor('composants/glass')}>
          Glass
        </a>{' '}
        explique le mécanisme.
      </p>

      {/* LE PARAGRAPHE DE COMPARAISON A ÉTÉ RETIRÉ, ET SON ABSENCE EST LE SUJET.
          Il renvoyait à `Tag` et `Pill` d'Opale — « tous deux sous contrat de
          couleur, avec des ratios mesurés » — pour situer ce badge par rapport
          à eux. La 2.0 ne publie plus ni l'un ni l'autre : il n'y a plus de
          pastille sous contrat de couleur dans cette librairie, donc plus de
          point de comparaison. Ce qui est perdu est dit ci-dessous plutôt que
          laissé en lien mort. */}
      <p className="tc-doc-prose">
        <strong>Il n’y a plus de pastille sous contrat de couleur dans cette librairie.</strong> La
        1.0 en publiait deux, <code>Tag</code> et <code>Pill</code>, dont les ratios étaient mesurés
        et recalculés en intégration continue. La 2.0 ne les publie plus : le seul badge de la
        librairie est celui de cette page, et <strong>aucun de ses ratios n’est mesuré</strong>.
      </p>
    </PageBody>
  ),
};
