import { Button } from '../../../magic';
import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MagicCell, MagicGroundNote, MagicPreamble, MagicStage } from './stage';

type MagicButtonVariant = 'default' | 'positive' | 'negative' | 'warning';
type MagicButtonSize = 'small' | 'medium' | 'large';

const VARIANTS: readonly MagicButtonVariant[] = ['default', 'positive', 'negative', 'warning'];
const SIZES: readonly MagicButtonSize[] = ['small', 'medium', 'large'];

const USAGE = `import { Button } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// \`text\` OU des enfants — les enfants gagnent.
<Button text="Envoyer" />
<Button variant="negative" size="large" onClick={remove}>Supprimer</Button>
<Button rounded disabled text="Indisponible" />`;

const PROPS: readonly PropRow[] = [
  {
    name: 'text',
    type: 'string',
    description: (
      <>
        Le libellé, <strong>si aucun enfant n’est passé</strong> : le composant rend{' '}
        <code>children ?? text</code>. Les deux ensemble sont donc licites et l’un des deux est
        silencieusement ignoré.
      </>
    ),
  },
  {
    name: 'variant',
    type: "'default' | 'positive' | 'negative' | 'warning'",
    description: (
      <>
        Sans défaut : <strong>absente, aucune classe de fond n’est posée</strong> et le bouton garde
        le seul verre. Présente, elle ajoute la classe globale non préfixée{' '}
        <code>bg-&lt;variant&gt;</code>.
      </>
    ),
  },
  {
    name: 'size',
    type: "'small' | 'medium' | 'large'",
    defaultValue: "'medium'",
    description: 'Coussin et taille de texte. Trois crans, aucune hauteur plancher.',
  },
  {
    name: 'rounded',
    type: 'boolean',
    defaultValue: 'false',
    description: (
      <>
        Pilule complète. Pose une classe sur le contenu <em>et</em> sur l’enveloppe du verre — les
        deux sont nécessaires, sans quoi le rayon serait rogné par l’enveloppe.
      </>
    ),
  },
  {
    name: 'enableClickAnimation',
    type: 'boolean',
    defaultValue: 'true',
    description: (
      <>
        Arme l’ondulation de <code>Glass</code>. Combinée à <code>disabled</code> : l’ondulation est
        désarmée dès que le bouton est désactivé.
      </>
    ),
  },
  {
    name: 'disabled',
    type: 'boolean',
    description: (
      <>
        Le vrai attribut HTML — le bouton <strong>sort de l’ordre de tabulation</strong>. Le
        composant filtre en outre <code>onClick</code> lui-même, donc le gestionnaire n’est appelé
        ni par la souris ni par le clavier.
      </>
    ),
  },
  {
    name: 'ref',
    type: 'Ref<HTMLButtonElement>',
    description: (
      <>
        Atterrit sur le <code>&lt;button&gt;</code> de contenu, pas sur l’enveloppe. C’est ce qui
        permet à <code>Tabs.Trigger</code> de piloter le focus.
      </>
    ),
  },
];

export const buttonPage: DocPage = {
  slug: 'composants/button',
  label: 'Button',
  group: 'composants',
  title: 'Button',
  lede: (
    <>
      Un <code>&lt;button type=&quot;button&quot;&gt;</code> de verre, quatre variantes et trois
      crans de taille. <code>type</code> est écrit en dur par le composant :{' '}
      <strong>il ne peut pas soumettre un formulaire</strong>. Il est aussi la brique de{' '}
      <code>Tabs.Trigger</code>, qui le rend avec <code>role=&quot;tab&quot;</code>.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Import et appels représentatifs de Button" code={USAGE} />

      <Specimen
        title="Les quatre variantes, et le bouton sans variante"
        note={
          <>
            <code>variant</code> n’a <strong>aucun défaut</strong>, donc la première figure n’est
            pas <code>variant=&quot;default&quot;</code> : c’est un bouton auquel aucune classe de
            fond n’a été posée. Les deux premières figures sont pourtant{' '}
            <strong>identiques, et c’est mesuré</strong> — voir sous le tableau. <MagicGroundNote />
          </>
        }
      >
        <MagicStage>
          <MagicCell label="prop absente — verre seul">
            <Button text="Enregistrer" />
          </MagicCell>
          {VARIANTS.map((variant) => (
            <MagicCell key={variant} label={<code>variant=&quot;{variant}&quot;</code>}>
              <Button variant={variant} text="Enregistrer" />
            </MagicCell>
          ))}
        </MagicStage>
      </Specimen>

      <Specimen
        title="Les trois crans, et la pilule"
        note={
          <>
            Aucun de ces crans ne garantit la cible de 44 px que le{' '}
            <a className="tc-doc-link" href={hrefFor('accessibilite')}>
              contrat d’accessibilité d’Opale
            </a>{' '}
            impose à <code>tc-btn</code> : <code>small</code> descend nettement en dessous.
          </>
        }
      >
        <MagicStage>
          {SIZES.map((size) => (
            <MagicCell key={size} label={<code>size=&quot;{size}&quot;</code>}>
              <Button size={size} text="Publier" />
            </MagicCell>
          ))}
          <MagicCell label={<code>rounded</code>}>
            <Button rounded text="Publier" />
          </MagicCell>
        </MagicStage>
      </Specimen>

      <Specimen
        title="Désactivé, et l’ondulation au clic"
        note={
          <>
            Cliquez le second bouton : l’onde part du point cliqué et vit 800 ms. Le premier est
            inerte — <code>disabled</code> désarme aussi l’animation.
          </>
        }
      >
        <MagicStage>
          <MagicCell label={<code>disabled</code>}>
            <Button disabled text="Indisponible" />
          </MagicCell>
          <MagicCell label="ondulation au clic — armée par défaut">
            <Button variant="positive" text="Cliquez-moi" />
          </MagicCell>
          <MagicCell label={<code>enableClickAnimation={'{false}'}</code>}>
            <Button variant="positive" enableClickAnimation={false} text="Sans onde" />
          </MagicCell>
        </MagicStage>
      </Specimen>

      <PropsTable
        id="magic-button"
        note={
          <>
            <code>ComponentPropsWithoutRef&lt;&apos;button&apos;&gt;</code> plus six props propres,
            plus <code>GlassProps&lt;&apos;button&apos;&gt;</code>. Pas d’union discriminée : ce
            bouton ne connaît pas <code>href</code> et ne devient jamais un lien.
          </>
        }
        rows={PROPS}
      />

      {/* CE PARAGRAPHE A ÉTÉ RÉÉCRIT PARCE QUE LE DÉFAUT A ÉTÉ CORRIGÉ ENTRE
          TEMPS, et il aurait été plus facile de recopier l'ancienne version.
          Il affirmait « `variant="default"` ne peint rien », ce qui était vrai
          et mesuré : `.bg-default` était absente de la feuille produite, la
          classe étant construite par interpolation `` `bg-${variant}` `` que
          l'extracteur de Tailwind ne lit pas. Une `safelist` a depuis été
          ajoutée à `tailwind.config.ts`, et la règle est émise. RE-MESURÉ au
          navigateur sur la feuille construite du jour, et non déduit de la
          présence de la safelist. */}
      <p className="tc-doc-prose">
        <strong>
          <code>variant=&quot;default&quot;</code> peint désormais quelque chose — et ce n’est pas
          un dégradé.
        </strong>{' '}
        Fonds <strong>calculés</strong> relevés au navigateur sur les figures du premier spécimen :
      </p>

      <ul className="tc-doc-checklist">
        <li>
          prop absente — <code>background-color: rgba(0, 0, 0, 0)</code>,{' '}
          <code>background-image: none</code>
        </li>
        <li>
          <code>default</code> — <code>background-color: rgba(255, 255, 255, 0.133)</code>, et{' '}
          <strong>aucune image de fond</strong> : un voile blanc à 13 %, pas un aplat de variante
        </li>
        <li>
          <code>positive</code>, <code>negative</code>, <code>warning</code> — un{' '}
          <code>linear-gradient(135deg, …)</code> chacun, et un <code>background-color</code>{' '}
          transparent
        </li>
      </ul>

      <p className="tc-doc-prose">
        <strong>Ce qui a changé, et ce qui n’a pas changé.</strong> Le composant construit sa classe
        par interpolation — <code>{'`bg-${variant}`'}</code> —, une forme que l’extracteur de
        Tailwind ne peut pas lire : <code>.bg-default</code> était donc absente de la feuille
        produite et la variante sortait sans aucun fond. Une <code>safelist</code> de quatre entrées
        a été ajoutée à <code>tailwind.config.ts</code>, et la règle{' '}
        <code>.bg-default {'{ background-color: var(--color-default) }'}</code> est bien émise —
        relevée à l’<strong>offset 1578</strong> du <code>magic.css</code> publié (ligne 51), et à
        l’offset 11 509 dans le CSS de cette vitrine.
      </p>

      <p className="tc-doc-prose">
        L’<strong>asymétrie de mécanisme reste entière</strong>, elle. <code>default</code> est la
        seule des quatre variantes qui passe par un utilitaire Tailwind ; les trois autres viennent
        d’un bloc <code>:global</code> de <code>Badge.module.scss</code> — oui, la feuille du{' '}
        <em>badge</em> — qui n’a pas de règle pour <code>default</code>. Une variante de bouton
        peinte par la feuille d’un autre composant est un couplage qu’aucune safelist ne corrige, et
        c’est ce qu’il faudrait remonter en amont. <code>src/magic/README.md</code> garde la trace
        du défaut d’origine.
      </p>

      {/* CE QUE LA COMPARAISON DISAIT, ET POURQUOI ELLE NE PEUT PLUS ÊTRE UN
          LIEN. Ce paragraphe renvoyait au `Button` d'Opale pour opposer trois
          décisions. La 2.0 ne le publie plus, donc le lien tomberait à vide —
          mais les trois décisions perdues valent d'être nommées : c'est la
          liste de ce que ce bouton-ci NE fait pas. */}
      <p className="tc-doc-prose">
        <strong>Trois garanties de la 1.0 que ce bouton ne reprend pas.</strong> Le bouton d’Opale
        rendait un <code>&lt;a&gt;</code> dès qu’un <code>href</code> était présent ; celui-ci ne
        connaît pas <code>href</code> et ne devient jamais un lien. Il préférait{' '}
        <code>aria-disabled</code> à <code>disabled</code>, pour qu’un contrôle indisponible reste
        atteignable au clavier et puisse expliquer pourquoi ; celui-ci emploie <code>disabled</code>
        , qui le retire de l’ordre de tabulation. Et il garantissait une hauteur plancher de 48 px —{' '}
        <code>--target-button</code> ; celui-ci n’a aucun plancher de cible.
      </p>
    </PageBody>
  ),
};
