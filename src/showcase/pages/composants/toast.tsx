import type { DocPage } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { ToastPositionScene, ToastVariantScene } from './scenes';
import { MagicGroundNote, MagicPreamble } from './stage';

const USAGE = `import { ToastProvider, useToast } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// 1. Le fournisseur, AUTOUR de l'arbre qui déclenchera les toasts.
<ToastProvider position="bottom-right" duration={4000}>
  <App />
</ToastProvider>

// 2. Le déclencheur, DANS cet arbre. \`useToast\` JETTE hors du fournisseur.
function Publish() {
  const { showToast, dismissToast, clearToasts } = useToast();

  return (
    <Button
      text="Publier"
      onClick={() => showToast({ title: 'Étape publiée', variant: 'success' })}
    />
  );
}`;

const PROPS: readonly PropRow[] = [
  {
    name: 'ToastProvider children',
    type: 'ReactNode',
    required: true,
    description: (
      <>
        L’arbre qui pourra déclencher des toasts. <code>useToast</code>{' '}
        <strong>jette une erreur</strong> hors de ce fournisseur — ce n’est pas un repli silencieux.
      </>
    ),
  },
  {
    name: 'ToastProvider duration',
    type: 'number',
    defaultValue: '4000',
    description: (
      <>
        Millisecondes avant fermeture automatique. <code>Infinity</code> désarme la minuterie : le
        toast reste jusqu’à un clic ou un <code>dismissToast</code>.
      </>
    ),
  },
  {
    name: 'ToastProvider position',
    type: "'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'",
    defaultValue: "'top-right'",
    description: (
      <>
        Le coin par défaut. Chaque toast peut le surcharger, et les toasts sont regroupés par
        position — six piles possibles, empilées du plus récent en haut ou en bas selon le coin.
      </>
    ),
  },
  {
    name: 'ToastProvider animation',
    type: "'slide-from-right' | 'slide-from-left' | 'slide-from-bottom' | 'scale'",
    defaultValue: "'slide-from-right'",
    description: (
      <>
        L’entrée par défaut, surchargeable par toast. La durée de sortie est indexée sur ce choix —
        220, 220, 240 ou 200 ms.
      </>
    ),
  },
  {
    name: 'ToastProvider portalContainer',
    type: 'HTMLElement | null',
    defaultValue: 'document.body',
    description: 'L’hôte du portail, résolu après le montage.',
  },
  {
    name: 'useToast().showToast',
    type: '(toast: ToastDefinition) => string',
    description: (
      <>
        Empile un toast et rend son identifiant. <code>ToastDefinition</code> accepte{' '}
        <code>id</code>, <code>title</code>, <code>description</code>, <code>variant</code>,{' '}
        <code>duration</code>, <code>animation</code>, <code>position</code>,{' '}
        <code>enableLiquidAnimation</code> et <code>onClose</code>.
      </>
    ),
  },
  {
    name: 'useToast().dismissToast / clearToasts',
    type: '(id: string) => void / () => void',
    description: (
      <>
        Marquent un toast, ou tous, comme congédiés : la phase de sortie s’enclenche, puis le
        retrait effectif après la durée d’animation.
      </>
    ),
  },
];

export const toastPage: DocPage = {
  slug: 'composants/toast',
  label: 'Toast',
  group: 'composants',
  title: 'Toast',
  lede: (
    <>
      Le seul composant de la librairie qui ne s’importe pas comme un composant : c’est un{' '}
      <strong>fournisseur plus un hook</strong>. <code>ToastProvider</code> enveloppe l’arbre et
      porte la file, <code>useToast()</code> donne <code>showToast</code>, <code>dismissToast</code>{' '}
      et <code>clearToasts</code>, et les toasts se peignent dans un portail sur{' '}
      <code>document.body</code>. Quatre variantes, six positions, quatre animations.
    </>
  ),
  render: () => (
    <PageBody>
      <MagicPreamble />

      <UsageBlock label="Le montage de Toast, en deux temps" code={USAGE} />

      <p className="tc-doc-prose">
        <strong>Ce que son montage exige, et l’ordre compte.</strong> Un <code>ToastProvider</code>{' '}
        doit envelopper <em>tout</em> l’arbre qui déclenchera des toasts, et <code>useToast()</code>{' '}
        doit être appelé <em>à l’intérieur</em> de cet arbre — hors du fournisseur, le hook{' '}
        <strong>jette</strong> « <code>useToast must be used within ToastProvider</code> ».
        Corollaire de conception : le déclencheur ne peut pas être le composant qui rend le
        fournisseur, puisqu’un fournisseur ne se consomme pas lui-même. Chaque scène de cette page
        monte donc son propre <code>ToastProvider</code>, et ses boutons sont des composants séparés
        — c’est la contrainte, écrite en code.
      </p>

      <Specimen
        title="Les quatre variantes — déclenchez-les"
        note={
          <>
            <strong>
              Les toasts sont portaillés dans <code>document.body</code> : ils apparaissent en haut
              à droite de la fenêtre, pas dans la scène.
            </strong>{' '}
            Ils se ferment seuls au bout de 4 s, à la croix, ou avec « Tout fermer ». La scène est
            sombre pour ses boutons, qui sont ceux de la librairie. <MagicGroundNote />
          </>
        }
      >
        <ToastVariantScene />
      </Specimen>

      <Specimen
        title="Positions, animations, et une durée infinie"
        note={
          <>
            Ce fournisseur est réglé sur <code>duration={'{Infinity}'}</code> : rien ne se ferme
            tout seul, il faut la croix ou « Tout fermer ». Les trois boutons visent trois coins
            différents — les piles sont indépendantes.
          </>
        }
      >
        <ToastPositionScene />
      </Specimen>

      <PropsTable
        id="magic-toast"
        title="L’interface — le fournisseur et le hook"
        note={
          <>
            <code>ToastProvider</code> est un composant de configuration : ses cinq props sont les{' '}
            <em>défauts</em> de la file, et chaque appel à <code>showToast</code> peut les
            surcharger. Aucun composant <code>Toast</code> n’est exporté — la carte est interne.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Ce que sa région live fait, et ce qu’elle ne fait pas.</strong> Chaque carte porte{' '}
        <code>role=&quot;status&quot;</code> et <code>aria-live=&quot;polite&quot;</code>, donc son
        contenu est annoncé à l’apparition. Mais l’attribut est posé sur le nœud{' '}
        <em>qui vient d’apparaître</em> plutôt que sur un conteneur persistant : selon le lecteur
        d’écran, une région live insérée en même temps que son contenu peut n’être pas annoncée du
        tout. C’est le seul motif de la librairie où le doute porte sur le comportement d’une
        technologie d’assistance et non sur le code — et il n’a pas été mesuré ici. Le bouton de
        fermeture, lui, porte <code>aria-label=&quot;close toast&quot;</code>, en anglais et non
        surchargeable.
      </p>

      <p className="tc-doc-prose">
        <strong>Il n’y a plus de message d’état dans le flux.</strong> La 1.0 publiait un{' '}
        <code>Message</code> posé <em>à côté</em> de ce qui l’avait produit — donc lisible sans
        limite de temps, et retrouvable en relisant la page. La 2.0 ne le publie plus : le seul
        moyen d’annoncer un état est cette carte flottante, qui s’efface au bout de quatre secondes.
      </p>
    </PageBody>
  ),
};
