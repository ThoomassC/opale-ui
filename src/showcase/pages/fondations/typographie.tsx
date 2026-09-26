import { Specimen } from '../../section';
import { PageBody } from '../api';

interface TypeStep {
  readonly token: string;
  readonly size: string;
  readonly usage: string;
}

const TYPE_STEPS: readonly TypeStep[] = [
  { token: '--text-xs', size: '12 px', usage: 'mention légale, unité, note de bas de tableau' },
  { token: '--text-sm', size: '14 px', usage: 'étiquette, aide de champ, méta' },
  { token: '--text-base', size: '16 px', usage: 'texte courant — le pas de référence' },
  { token: '--text-md', size: '19 px', usage: 'chapeau de page, chapeau de spécimen' },
  { token: '--text-lg', size: '23 px', usage: 'titre de carte, titre de spécimen' },
  /* Aucun emploi dans la vitrine depuis que les sections numérotées ont
     disparu, et `section-heading.css` le refuse explicitement pour son niveau 2.
     Le pas reste dans l'échelle, mais l'annoncer « titre de section » serait
     faux : ce site n'en a plus. */
  { token: '--text-xl', size: '28 px', usage: 'inemployé — le pas laissé libre entre 23 et 30' },
  /* LES DEUX PAS D'AFFICHAGE NE PEIGNENT PLUS LES TITRES DE LA VITRINE, et le
     dire est plus honnête que de les retirer. La couche V3 écrit sa propre
     borne — `clamp(1.8rem, 3vw, 2.75rem)` sur `.tc-doc-page__title` — au lieu
     de lire un jeton. Les deux pas restent publiés pour les consommateurs du
     paquet ; leur emploi annoncé, lui, est corrigé. */
  {
    token: '--text-display-sm',
    size: '24 → 34 px (fluide)',
    usage: 'titre secondaire — publié, inemployé par la vitrine',
  },
  {
    token: '--text-display-md',
    size: '30 → 52 px (fluide)',
    usage: 'titre d’ouverture — la vitrine lui préfère sa propre borne fluide',
  },
];

interface FontFamily {
  readonly token: string;
  readonly name: string;
  readonly note: string;
}

/* =============================================================================
   LES FAMILLES ANNONCÉES ICI SONT CELLES QUI PEIGNENT LA PAGE, et ce n'était
   plus le cas.

   Cette liste décrivait les trois jetons `--font-*` de `roles.css` : une serif
   de système pour les titres, une sans de système pour le reste, une mono de
   système pour les mesures — avec la promesse « toutes systèmes, aucune requête
   hors origine ». Les trois affirmations sont devenues fausses en V3 sans que
   la page bouge, et c'est le genre de mensonge qu'une documentation de design
   system ne peut pas se permettre : on vient y lire ce qu'on doit écrire.

   CE QUI REND VRAIMENT LA VITRINE AUJOURD'HUI, mesuré dans le navigateur :
   Bricolage Grotesque sur les titres de pages et les chiffres de l'accueil,
   Chivo partout ailleurs, Hack pour le code. Les deux premières sont embarquées dans `opale.css` ; Hack est embarquée
   avec la vitrine.

   LES JETONS CITÉS SONT DONC LES `--opale-font-*` ET NON LES `--font-*`. Les
   seconds existent encore et `doc.css` les consomme cent trente-cinq fois,
   mais la couche V3 les recouvre : les nommer ici enverrait le lecteur vers
   des variables qui ne décident plus de rien. */
const FAMILIES: readonly FontFamily[] = [
  {
    token: '--opale-font-title',
    name: 'Bricolage Grotesque — opsz 72, graisse 600',
    note: 'Les titres de page et les chiffres de l’accueil, et eux seuls.',
  },
  {
    token: '--opale-font-body',
    name: 'Chivo, system-ui, Segoe UI, Roboto',
    note: 'Tout le reste : texte courant, contrôles, étiquettes, sommaire, onglets.',
  },
  {
    token: '--opale-font-display',
    name: 'Chivo, system-ui, Segoe UI, Roboto',
    note: 'Les titres des composants de la librairie — métrique, donut, plaques.',
  },
  {
    token: '--opale-font-mono',
    name: 'Hack, ui-monospace, Cascadia Code, Consolas',
    note: 'Les mesures et le code : hexadécimaux, ratios, noms de jetons.',
  },
];

/* LE CONTENU DE LA PAGE, chargé à la navigation. Ses métadonnées — titre,
   chapô, adresse — vivent dans `typographie.page.tsx`, que le sommaire lit sans
   rien charger. */
export default function TypographieContent() {
  return (
    <PageBody>
      <Specimen title="Les huit pas" note="Le texte courant est borné à --measure (66 caractères).">
        <ul className="tc-doc-scale">
          {TYPE_STEPS.map((step) => (
            <li className="tc-doc-scale__row" key={step.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{step.token}</code>
                <span className="tc-doc-scale__value">{step.size}</span>
                <span className="tc-doc-scale__usage">{step.usage}</span>
              </div>
              <p className="tc-doc-scale__sample" style={{ fontSize: `var(${step.token})` }}>
                Teal &amp; cuivre
              </p>
            </li>
          ))}
        </ul>
      </Specimen>

      <Specimen
        title="Les quatre familles"
        note="Bricolage Grotesque, Chivo et Hack sont servis localement."
      >
        <ul className="tc-doc-scale">
          {FAMILIES.map((family) => (
            <li className="tc-doc-scale__row" key={family.token}>
              <div className="tc-doc-scale__meta">
                <code className="tc-doc-scale__token">{family.token}</code>
                <span className="tc-doc-scale__usage">{family.note}</span>
              </div>
              <p
                className="tc-doc-scale__sample tc-doc-scale__sample--family"
                style={{ fontFamily: `var(${family.token})` }}
              >
                Portfolio &amp; travels — 0123456789
                <span className="tc-doc-scale__stack">{family.name}</span>
              </p>
            </li>
          ))}
        </ul>
      </Specimen>
    </PageBody>
  );
}
