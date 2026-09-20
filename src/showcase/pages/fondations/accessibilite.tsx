import type { DocPage } from '../../doc-model';
import { hrefFor } from '../../doc-model';
import { Specimen } from '../../section';
import { PageBody } from '../api';

/* =============================================================================
   CE QUE CETTE PAGE A PERDU, ET POURQUOI ELLE LE DIT AU LIEU DE SE TAIRE.

   Elle portait TROIS engagements, chacun démontré sur des composants d'Opale :
   le double anneau de focus (sur `Button`, `Field`, `Input`), la couleur comme
   simple renfort (sur les trois tons de `Pill` et les trois variantes de `Tag`,
   côte à côte en couleur et en niveaux de gris), et la taille de cible. La 2.0
   ne publie plus un seul de ces composants.

   DEUX DES TROIS TIENNENT ENCORE, PARCE QU'ILS SONT PORTÉS PAR LES JETONS :

   - L'ANNEAU tient, et sa démonstration est même devenue plus juste.
     `tokens.css` déclare une règle `:focus-visible` universelle — un sélecteur
     nu, poids (0,1,0) — donc l'anneau ne vient d'aucun composant : il vient de
     la feuille de jetons, et n'importe quel élément focusable de la page en
     hérite. Le spécimen emploie donc des éléments NATIFS non habillés. C'est
     exactement ce que la garantie dit, et la version précédente le cachait
     derrière trois composants.
   - LA TAILLE DE CIBLE tient : `--target-min` (44 px) et `--target-button`
     (48 px) sont des jetons, et le spécimen ne les a jamais démontrés
     autrement que par deux boîtes mesurées.

   LE TROISIÈME EST PERDU, ET SON SPÉCIMEN A ÉTÉ RETIRÉ. « La couleur n'est
   qu'un renfort » était une garantie sur des COMPOSANTS : les trois tons de
   `Pill` mesuraient 1,16:1 l'un contre l'autre en simulation deutéranope, et ce
   qui les séparait était le glyphe et le libellé. Rien de tel ne survit. Le
   redémontrer sur les composants vendorés serait un mensonge : leurs six
   variantes de badge n'ont ni glyphe imposé ni libellé de repli, et aucun de
   leurs ratios n'a été mesuré. Le spécimen est donc remplacé par le paragraphe
   qui dit ce qui n'est plus garanti — un état vide honnête, pas une
   démonstration recyclée.
   ========================================================================== */

const FOCUS_RECIPE = `outline: 3px solid var(--focus-outer);
outline-offset: 2px;
box-shadow:
  0 0 0 2px var(--focus-inner),
  0 0 0 5px var(--focus-outer);`;

export const accessibilitePage: DocPage = {
  slug: 'accessibilite',
  label: 'Accessibilité',
  group: 'fondations',
  title: 'Le contrat d’accessibilité',
  lede: (
    <>
      Deux engagements portés par les jetons, vérifiables sur cette page : le focus se voit sur
      n’importe quel fond, et rien de cliquable ne descend sous la taille du doigt.{' '}
      <strong>Ce contrat ne couvre pas les quatorze composants publiés</strong> — ils sont vendorés
      et n’emploient aucun de ces jetons.
    </>
  ),
  render: () => (
    <PageBody>
      <Specimen
        title="Le double anneau de focus"
        note={
          <>
            Tabulez dans le cadre. Les trois éléments sont <strong>natifs et non habillés</strong> :
            l’anneau ne vient pas d’un composant, il vient de la règle <code>:focus-visible</code>{' '}
            universelle de <code>tokens.css</code>. <code>--focus-inner</code> et{' '}
            <code>--focus-outer</code> s’inversent entre les thèmes, si bien que l’un des deux
            contraste toujours avec le fond local.
          </>
        }
      >
        <div className="tc-doc-focusdemo">
          <button type="button">Un bouton natif</button>
          <a className="tc-doc-link" href={hrefFor('palette')}>
            Un lien vers la palette
          </a>
          {/* `<label for>` explicite, et non un `<label>` enveloppant : c'est
              la sémantique que la charte demande partout, et la seule qui
              survive à un champ déplacé dans la mise en page. */}
          <span>
            <label htmlFor="demo-focus">Un champ&nbsp;</label>
            <input id="demo-focus" type="text" placeholder="Tabulez jusqu’ici" />
          </span>
        </div>
        {/* Même raison que le tableau de la page palette : un bloc de code qui
            défile doit être atteignable au clavier (WCAG 2.1.1), et la liste
            blanche par défaut de la règle jsx-a11y ne modélise pas ce cas. */}
        <pre
          className="tc-doc-code"
          tabIndex={0}
          role="group"
          aria-label="Recette CSS du double anneau de focus, défilement horizontal"
        >
          <code>{FOCUS_RECIPE}</code>
        </pre>
        <p className="tc-doc-prose tc-doc-aside">
          L’<code>outline</code> porte l’anneau <strong>extérieur</strong> parce qu’il est peint
          au-dessus du <code>box-shadow</code> : l’intérieur ne contraste avec rien d’autre que
          l’aplat teal — 1,08:1 sur la carte, 1,16:1 sur le sol.
        </p>
      </Specimen>

      <Specimen title="Les cibles : 44 et 48 px">
        <div className="tc-doc-targets">
          <figure className="tc-doc-target">
            <div className="tc-doc-target__box tc-doc-target__box--min" aria-hidden="true">
              44 px
            </div>
            <figcaption className="tc-doc-target__caption">
              <code className="tc-doc-scale__token">--target-min</code>
              <span className="tc-doc-scale__usage">
                Champ, ligne de case à cocher, entrée de menu.
              </span>
            </figcaption>
          </figure>
          <figure className="tc-doc-target">
            <div className="tc-doc-target__box tc-doc-target__box--button" aria-hidden="true">
              48 px
            </div>
            <figcaption className="tc-doc-target__caption">
              <code className="tc-doc-scale__token">--target-button</code>
              <span className="tc-doc-scale__usage">
                Bouton — un plancher, pas une hauteur fixe.
              </span>
            </figcaption>
          </figure>
        </div>
      </Specimen>

      <Specimen title="Ce que la charte promet, en clair">
        <ul className="tc-doc-checklist">
          <li>
            <code>prefers-reduced-motion</code> restreint les propriétés animables aux couleurs et
            garde les 160 ms — on ne coupe pas la transition. Une préférence pour moins de{' '}
            <em>mouvement</em> n’est pas une demande de moins de <em>retour d’information</em>.
          </li>
          <li>
            Zéro requête hors origine : pas de police distante, pas de <code>@font-face</code>, pas
            même un <code>preconnect</code> — y compris dans la feuille des composants, dont l’
            <code>@import</code> Google Fonts d’origine a été retiré à la reprise du code.
          </li>
          <li>
            Le double anneau de focus s’applique à <strong>tout</strong> élément focusable de la
            page, composant vendoré compris : il est déclaré sur un sélecteur nu, pas sur une
            classe.
          </li>
          <li>
            Les ratios de la palette sont recalculés en intégration continue, et{' '}
            <a className="tc-doc-link" href={hrefFor('palette')}>
              les quatre manquements AA sont publiés
            </a>{' '}
            plutôt que tus.
          </li>
        </ul>
      </Specimen>

      <Specimen title="Ce que la 2.0 ne promet plus">
        <ul className="tc-doc-checklist">
          <li>
            <strong>« La couleur n’est qu’un renfort » n’est plus une garantie.</strong> Elle
            portait sur les trois tons de <code>Pill</code> et les trois variantes de{' '}
            <code>Tag</code> — indiscernables en simulation deutéranope (1,16:1 l’un contre
            l’autre), donc séparés par un glyphe et un libellé obligatoires. Ces composants ne sont
            plus publiés, et les trois tons de{' '}
            {/* LE LIEN VISAIT LE `Badge` VENDORÉ, dont la page a fusionné avec celle
                d'Opale. « Les SIX variantes » était son compte à lui
                (`default`, `positive`, `negative`, `warning`, `info`,
                `neutral`) ; `Opale.Badge` en expose TROIS — `primary`,
                `accent`, `danger`. Rediriger sans recompter aurait laissé un
                nombre faux sur la page qui promet justement de ne rien
                arrondir. Le reproche, lui, ne change pas : la teinte est le
                seul écart entre les trois. */}
            <a className="tc-doc-link" href={hrefFor('composants/opale-badge')}>
              Badge
            </a>{' '}
            n’imposent ni glyphe ni libellé de repli.
          </li>
          <li>
            <strong>Aucun état visuel n’est plus garanti sans JavaScript.</strong> La 1.0 portait
            survol, appui, focus, erreur et attente en sélecteurs CSS, sur des composants sans état.
            Les quatorze composants publiés tiennent de l’état React et exigent{' '}
            <code>&quot;use client&quot;</code>.
          </li>
          <li>
            <strong>La sémantique native n’est plus garantie.</strong> La règle était{' '}
            <code>&lt;button&gt;</code>, <code>&lt;a href&gt;</code>, <code>&lt;label for&gt;</code>{' '}
            d’abord, ARIA ensuite. Les composants vendorés s’en écartent — la case à cocher est un{' '}
            <code>&lt;button&gt;</code> sans <code>role</code> ni <code>aria-checked</code>, son
            libellé est un <code>&lt;span onClick&gt;</code> —, et ces écarts sont documentés page
            par page au lieu d’être corrigés.
          </li>
          <li>
            <strong>Aucun ratio de contraste n’est mesuré sur un composant.</strong> Le contrat
            porte sur les jetons ; les composants n’en emploient aucun.
          </li>
        </ul>
      </Specimen>
    </PageBody>
  ),
};
