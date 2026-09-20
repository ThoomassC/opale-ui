import { Badge, Card, Opale } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MagicCell, MagicGroundNote, MagicPreamble, MagicStage } from './stage';

const USAGE = `import { Card } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

<Card>
  <h3>Titre</h3>
  <p>Une carte de verre.</p>
</Card>

<Card size="large" direction="row" align="center" justify="space-between">
  <span>Étape publiée</span>
  <Opale.Button>Ouvrir</Opale.Button>
</Card>`;

const PROPS: readonly PropRow[] = [
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: 'Le coussin intérieur. Trois crans.',
  },
  {
    name: 'direction',
    type: "'column' | 'row'",
    defaultValue: "'col'",
    description: (
      <>
        <strong>Le défaut est faux, et il est inoffensif.</strong> Le composant écrit{' '}
        <code>direction = &apos;col&apos;</code> — une valeur qui n’est pas dans le type — puis
        teste <code>direction === &apos;row&apos;</code>. Tout ce qui n’est pas{' '}
        <code>&apos;row&apos;</code> retombe donc en colonne, y compris ce{' '}
        <code>&apos;col&apos;</code> illégal. Défaut réel, gardé tel quel.
      </>
    ),
  },
  {
    name: 'align',
    type: "'center' | 'start' | 'end'",
    defaultValue: "'start'",
    description: (
      <>
        <code>align-items</code>. La classe est construite par concaténation de chaînes —{' '}
        <code>items</code> + la valeur capitalisée — donc une valeur hors type sort en{' '}
        <code>undefined</code> et n’aligne rien.
      </>
    ),
  },
  {
    name: 'justify',
    type: "'center' | 'start' | 'end' | 'space-between' | 'space-around'",
    defaultValue: "'start'",
    description: (
      <>
        <code>justify-content</code>, même mécanique de construction, avec deux cas spéciaux pour{' '}
        <code>space-between</code> et <code>space-around</code>.
      </>
    ),
  },
  {
    name: '…HTMLAttributes<HTMLDivElement> & GlassProps',
    type: 'union',
    description: (
      <>
        Tout part sur <code>Glass</code>, dont l’élément de contenu reste un{' '}
        <code>&lt;div&gt;</code> : <code>as</code> est accepté par le type mais <code>Card</code> ne
        le transmet pas.
      </>
    ),
  },
];

export const cardPage: DocPage = {
  slug: 'composants/card',
  label: 'Card',
  group: 'composants',
  title: 'Card',
  lede: (
    <>
      Une surface de verre qui est aussi une <strong>boîte flexible</strong> : contrairement à la
      carte d’Opale, elle décide de la disposition de ses enfants — direction, alignement,
      justification. Purement présentationnelle par ailleurs : elle n’impose aucun rôle et c’est à
      l’appelant de rendre la sémantique à l’intérieur.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Card" code={USAGE} />

      <Specimen title="Les trois crans de coussin" note={<MagicGroundNote />}>
        <MagicStage>
          {(['small', 'medium', 'large'] as const).map((size) => (
            <MagicCell key={size} label={<code>size=&quot;{size}&quot;</code>}>
              {/* `<strong>` et non `<h3>` : ces cartes sont des figures de
                  démonstration, pas du contenu. Un titre de niveau 3 par
                  vignette rendrait « Étape small » navigable dans le plan de
                  titres de la page, ce qui n'est pas une information. */}
              <Card size={size}>
                <strong>Étape {size}</strong>
                <span>Trois jours à Kyoto.</span>
              </Card>
            </MagicCell>
          ))}
        </MagicStage>
      </Specimen>

      <Specimen
        title="La carte comme boîte flexible — direction et justification"
        note={
          <>
            La seconde figure est le seul cas où <code>direction</code> change quelque chose :{' '}
            <code>&apos;row&apos;</code>. Toute autre valeur, défaut compris, rend une colonne.
          </>
        }
      >
        <MagicStage stack>
          <MagicCell label="colonne (défaut)">
            <Card>
              <span>Kyoto</span>
              <Badge variant="positive">publiée</Badge>
            </Card>
          </MagicCell>
          <MagicCell
            label={
              <>
                <code>direction=&quot;row&quot;</code> +{' '}
                <code>justify=&quot;space-between&quot;</code> +{' '}
                <code>align=&quot;center&quot;</code>
              </>
            }
          >
            <Card direction="row" justify="space-between" align="center">
              <span>Kyoto</span>
              <Opale.Button size="small">Ouvrir</Opale.Button>
            </Card>
          </MagicCell>
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-card"
        note={
          <>
            Quatre props propres, plus <code>HTMLAttributes&lt;HTMLDivElement&gt;</code>, plus{' '}
            <code>GlassProps</code>. Aucune union discriminée et aucun matériau alternatif : cette
            carte est <strong>toujours</strong> du verre.
          </>
        }
        rows={PROPS}
      />

      {/* La comparaison renvoyait à la `Card` d'Opale, que la 2.0 ne publie
          plus. Le lien qui SURVIT est celui des jetons d'élévation : ils sont
          dans `src/tokens/materials.css`, donc toujours publiés — c'est la
          feuille qui les consommait qui a disparu, pas eux. */}
      <p className="tc-doc-prose">
        La carte d’Opale séparait les deux responsabilités : une surface — verre ou aplat, quatre
        crans d’élévation — qui laissait la disposition à l’appelant. La 2.0 ne la publie plus, et{' '}
        <strong>cette carte-ci ne connaît qu’un matériau</strong> : elle est toujours du verre, et
        n’a pas de cran. Les quatre crans, eux, restent des jetons publiés —{' '}
        <a className="tc-doc-link" href={hrefFor('elevation')}>
          Élévation
        </a>
        .
      </p>
    </PageBody>
  ),
};
