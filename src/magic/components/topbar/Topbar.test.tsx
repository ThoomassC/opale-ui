import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Topbar from "./Topbar";

describe("Topbar component", () => {
  it("renders brand content with icon, title, and subtitle", () => {
    render(
      <Topbar>
        <Topbar.Brand icon="✨" title="Magic UI" subtitle="Command Center" />
      </Topbar>,
    );

    expect(screen.getByText("Magic UI")).toBeInTheDocument();
    expect(screen.getByText("Command Center")).toBeInTheDocument();
    expect(screen.getByText("✨")).toBeInTheDocument();
  });

  it("allows sections to grow and align content", () => {
    render(
      <Topbar>
        <Topbar.Section data-testid="grow-section" grow align="between">
          <span>Start</span>
          <span>End</span>
        </Topbar.Section>
      </Topbar>,
    );

    const section = screen.getByTestId("grow-section");
    // Classes are hashed, so we just check if it renders
    expect(section).toBeInTheDocument();
  });

  it("matches divider height to the selected size", () => {
    render(
      <Topbar size="compact">
        <Topbar.Actions>
          <Topbar.Divider data-testid="divider" />
        </Topbar.Actions>
      </Topbar>,
    );

    expect(screen.getByTestId("divider")).toBeInTheDocument();
  });

  it("exposes context through useTopbar helper", () => {
    const ReadSize = () => {
      const { size } = Topbar.useTopbar();
      return <span>size:{size}</span>;
    };

    render(
      <Topbar size="spacious">
        <Topbar.Section>
          <ReadSize />
        </Topbar.Section>
      </Topbar>,
    );

    expect(screen.getByText("size:spacious")).toBeInTheDocument();
  });
});

/* =============================================================================
   LES QUATRE CAS CI-DESSUS SONT LE CAHIER DES CHARGES, ET ILS N'ONT PAS BOUGÉ.

   Ils décrivent le comportement hérité, en anglais comme ils ont été écrits.
   Les deux cas ci-dessous sont nouveaux, donc écrits dans la langue du dépôt.
   ========================================================================== */

describe('Topbar — ce que la réécriture verrouille', () => {
  it('devrait rester le point de repère « banner » du document', () => {
    /* LE DÉFAUT QUE CE CAS EXISTE POUR EMPÊCHER. `TopbarProps` intersectait
       `GlassProps` en entier, donc exposait le `as` du verre — et `{...rest}`
       était étalé APRÈS `as="header"`. Un appelant pouvait remplacer l'élément
       rendu, c'est-à-dire supprimer le repère, par une prop que rien ne
       documentait. Le type l'interdit désormais ; ce cas tient le rendu. */
    render(
      <Topbar>
        <Topbar.Brand title="Voyages" />
      </Topbar>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('devrait retomber sur title et subtitle quand children vaut false', () => {
    /* `{condition && <a/>}` rend `false`, pas `undefined` : un `??` aurait
       laissé la marque VIDE — ni le lien conditionnel, ni le repli. */
    render(
      <Topbar>
        <Topbar.Brand title="Voyages" subtitle="12 étapes">
          {false}
        </Topbar.Brand>
      </Topbar>,
    );

    expect(screen.getByText('Voyages')).toBeInTheDocument();
    expect(screen.getByText('12 étapes')).toBeInTheDocument();
  });
});


