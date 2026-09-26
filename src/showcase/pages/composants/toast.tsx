import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody, PropsTable, UsageBlock } from '../api';
import type { PropRow } from '../api';
import { MaterialSwitch } from './material-switch';
import { ToastPositionScene, ToastVariantScene } from './scenes';
import { MagicGroundNote } from './stage';

const USAGE = `import { Opale, ToastProvider, useToast } from '@thomascaron/opale-ui';
import '@thomascaron/opale-ui/opale.css';

// 1. Le fournisseur, AUTOUR de l'arbre qui déclenchera les toasts.
<ToastProvider position="bottom-right" duration={4000}>
  <App />
</ToastProvider>

// 2. Le déclencheur, DANS cet arbre. \`useToast\` JETTE hors du fournisseur.
function Publish() {
  const { showToast, dismissToast, clearToasts } = useToast();

  return (
    <Opale.Button
      onClick={() => showToast({ title: 'Étape publiée', variant: 'success' })}
    >
      Publier
    </Opale.Button>
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
        toast reste jusqu’à un clic ou un <code>dismissToast</code>.{' '}
        <strong>
          La minuterie se met en pause au survol et dès que le focus entre dans la carte
        </strong>
        , puis reprend le temps qui restait — pas la durée entière.
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
        Chaque pile est elle-même coupée en deux régions live, une polie et une assertive : à
        l’intérieur d’un coin, les <code>error</code> se groupent donc entre eux plutôt que de
        s’intercaler par ordre d’arrivée. Voir plus bas.
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
    description: (
      <>
        L’hôte du portail, <strong>résolu pendant le rendu</strong> et non après un effet. Les
        régions live y sont montées <em>avec</em> le fournisseur, donc avant le premier toast —
        c’est la condition pour qu’une insertion soit annoncée.
      </>
    ),
  },
  {
    name: 'useToast().showToast',
    type: '(toast: ToastDefinition) => string',
    description: (
      <>
        Empile un toast et rend son identifiant. <code>ToastDefinition</code> accepte{' '}
        <code>id</code>, <code>title</code>, <code>description</code>, <code>variant</code>,{' '}
        <code>duration</code>, <code>animation</code>, <code>position</code>,{' '}
        <code>enableLiquidAnimation</code> et <code>onClose</code>.{' '}
        <strong>
          Un <code>id</code> déjà présent dans la file remplace son toast au lieu d’en empiler un
          second
        </strong>{' '}
        — c’est ce qui rend la prop utilisable pour un message qui se met à jour
        («&nbsp;Enregistrement…&nbsp;» puis «&nbsp;Enregistré&nbsp;»).
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

/* =============================================================================
   CETTE PAGE S'APPELLE « ToastProvider » DEPUIS QU'ON A REGARDÉ CE QU'ELLE
   DOCUMENTE.

   ELLE S'APPELAIT « Toast », ET LE SOMMAIRE AFFICHAIT DONC « Toast » DEUX FOIS
   dans FEEDBACK — une fois pour elle, une fois pour `Opale.Toast`. Les sept
   autres homonymes du sommaire se sont réglés par une fusion : le vendoré est
   devenu la matière derrière `liquidGlass`, et sa page a disparu.

   CELUI-CI NE SE FUSIONNE PAS, ET IL FAUT DIRE POURQUOI PLUTÔT QUE LE FAIRE.
   Le paquet vendoré N'EXPORTE AUCUN COMPOSANT `Toast` : il exporte
   `ToastProvider` et `useToast`, c'est-à-dire une FILE — les cartes sont
   internes, montées par `createPortal` sur `document.body`, groupées par coin,
   empilées, animées et minutées. `Opale.Toast` est autre chose : un
   `<div role="status">` rendu SUR PLACE, ouvert et fermé par une prop `open`,
   sans file ni minuterie.

   LES SUBSTITUER AURAIT CASSÉ LES DEUX. Une `Opale.Toast liquidGlass` aurait
   fait partir dans un coin de l'écran la carte que l'appelant avait posée dans
   son flux — un déplacement, pas un changement de matière —, et la seule API
   de file du paquet n'aurait plus eu de porte publique. Deux mécanismes
   distincts ont droit à deux noms ; c'était le LIBELLÉ qui doublonnait, pas le
   composant, et c'est donc le libellé qu'on corrige.
   ========================================================================== */
/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `toast.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function ToastContent() {
  return (
    <PageBody>
      <UsageBlock label="Le montage de ToastProvider, en deux temps" code={USAGE} />

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
        title="Les cinq variantes — déclenchez-les"
        note={
          <>
            <strong>
              Les toasts sont portaillés dans <code>document.body</code> : ils apparaissent en haut
              à droite de la fenêtre, pas dans la scène.
            </strong>{' '}
            Ils se ferment seuls au bout de 4 s, à la croix, ou avec « Tout fermer » — et{' '}
            <strong>la minuterie s’arrête tant que le pointeur est dessus</strong>, donc survolez-en
            un pour le garder le temps de le lire. La scène est sombre pour ses boutons, qui sont
            ceux de la librairie. <MagicGroundNote />
          </>
        }
      >
        <MaterialSwitch name="ToastProvider">
          {(liquidGlass) => <ToastVariantScene liquidGlass={liquidGlass} />}
        </MaterialSwitch>
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
            surcharger.{' '}
            <strong>
              Cette file n’exporte aucun composant <code>Toast</code>
            </strong>{' '}
            — sa carte est interne et n’est atteignable que par <code>showToast</code>. Le{' '}
            <code>Opale.Toast</code> que publie le paquet est un composant à part, rendu en place :
            il n’est pas la carte de cette file.
          </>
        }
        rows={PROPS}
      />

      <p className="tc-doc-prose">
        <strong>Ses régions live sont permanentes, et c’est tout le changement.</strong> La version
        d’avant posait <code>role=&quot;status&quot;</code> sur <em>la carte elle-même</em>,
        c’est-à-dire sur le nœud qui venait d’apparaître. Or une région live insérée en même temps
        que son contenu peut, selon le lecteur d’écran, n’être pas annoncée du tout : la technologie
        d’assistance surveille les régions qu’elle connaît déjà, et celle-là naissait avec son texte
        dedans. Le seul dispositif d’accessibilité du composant avait donc une chance sérieuse de ne
        rien faire. Chacun des six coins porte désormais{' '}
        <strong>deux régions vides montées avec le fournisseur</strong>, et les cartes sont insérées
        dedans.
      </p>

      <p className="tc-doc-prose">
        <strong>Deux régions et non une, parce que tout ne se dit pas sur le même ton.</strong> Une
        erreur de publication était annoncée aussi poliment qu’un brouillon enregistré, c’est-à-dire
        à la fin de ce que l’utilisateur était en train de lire. <code>default</code>,{' '}
        <code>success</code> et <code>info</code> vont dans une région{' '}
        <code>role=&quot;status&quot;</code> polie ; <code>warning</code> et <code>error</code> vont
        dans une région <code>role=&quot;alert&quot;</code> assertive, qui interrompt.{' '}
        <strong>Ce que ce découpage coûte</strong> : à l’intérieur d’un coin, les messages urgents
        se groupent entre eux au lieu de s’intercaler par ordre d’arrivée avec le reste. Deux
        niveaux de politesse ne tiennent pas dans une seule région, et entre un empilement
        chronologique parfait et une urgence correctement annoncée, c’est l’urgence qui gagne. Les
        deux régions portent <code>aria-atomic=&quot;false&quot;</code> :{' '}
        <code>role=&quot;status&quot;</code> implique l’inverse, et sans cette remise à faux toute
        la pile serait relue à chaque arrivée.
      </p>

      <p className="tc-doc-prose">
        <strong>Un message ne s’efface plus avant d’avoir pu être lu — WCAG 2.2.1.</strong> C’était
        la faute la plus sérieuse de la version d’avant : la minuterie courait quoi qu’il arrive.
        Quelqu’un qui lit lentement, qui traduit, ou qui vient tout juste d’atteindre la croix au
        clavier voyait la carte disparaître sous le curseur. La minuterie se met maintenant en pause
        au survol <em>et</em> dès que le focus entre dans la carte — les deux, parce que la souris
        et le doigt passent par le pointeur et le clavier par le focus —, puis reprend le temps qui
        restait plutôt que de rejouer la durée entière, ce qui punirait un survol accidentel.{' '}
        <code>duration: Infinity</code> reste la façon de la désarmer complètement. Le bouton de
        fermeture, lui, annonce désormais «&nbsp;Fermer la notification&nbsp;», en français comme le
        reste de la librairie.
      </p>

      <p className="tc-doc-prose">
        <strong>
          Ce n’est pas le message d’état dans le flux, et il ne faut pas les confondre.
        </strong>{' '}
        La 1.0 publiait un <code>Message</code> posé <em>à côté</em> de ce qui l’avait produit —
        lisible sans limite de temps, retrouvable en relisant la page. Cette file-ci fait l’inverse
        : elle sort la carte du flux pour la porter dans un coin de la fenêtre, et l’efface au bout
        de quatre secondes — sauf pendant qu’on la lit. Le composant qui reprend le rôle du message
        en place est <code>Opale.Toast</code> — voir{' '}
        <a className="tc-doc-link" href={hrefFor('composants/opale-toast')}>
          Toast
        </a>{' '}
        —, un <code>&lt;div role=&quot;status&quot;&gt;</code> rendu là où on l’écrit, ouvert et
        fermé par une prop <code>open</code>. Même mot, deux mécanismes : l’un interrompt, l’autre
        accompagne.
      </p>
    </PageBody>
  );
}
