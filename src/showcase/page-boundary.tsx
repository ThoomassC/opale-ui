import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

/* La frontière d'erreur du contenu de la page, et de lui seul : une page qui
   jette est nommée, la coquille reste navigable et l'erreur part en console.
   Une classe, car `componentDidCatch` n'a pas d'équivalent en hook. */

export interface PageBoundaryProps {
  /** Le slug de la page rendue : le changer remet la frontière à zéro. */
  readonly resetKey: string;
  readonly children: ReactNode;
}

interface PageBoundaryState {
  readonly failed: boolean;
  readonly message: string;
}

const CLEAR: PageBoundaryState = { failed: false, message: '' };

export class PageBoundary extends Component<PageBoundaryProps, PageBoundaryState> {
  state: PageBoundaryState = CLEAR;

  static getDerivedStateFromError(error: unknown): PageBoundaryState {
    return { failed: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidUpdate(previous: PageBoundaryProps): void {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) {
      this.setState(CLEAR);
    }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    /* La console et non un rapport silencieux : la vitrine est un outil de
       développement, et cette trace est le seul endroit où la pile survit. */
    console.error(
      `[vitrine] la page « ${this.props.resetKey || 'accueil'} » a jeté pendant son rendu.`,
      error,
      info.componentStack,
    );
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="tc-doc-section__body">
        {/* `role="alert"` ici, et pas la région polie de la coquille : la page
            demandée n'est pas à l'écran, c'est le seul cas de cette vitrine
            qui mérite de couper la parole. */}
        <p className="tc-doc-prose" role="alert">
          <strong>Cette page a échoué pendant son rendu.</strong> Le sommaire reste utilisable —
          choisissez une autre page. Le message est&nbsp;: <code>{this.state.message}</code>
        </p>
        <p className="tc-doc-prose tc-doc-aside">
          La pile complète est dans la console. Le reste du site n’est pas en cause : la coquille et
          le sommaire sont rendus hors de cette frontière.
        </p>
      </div>
    );
  }
}
