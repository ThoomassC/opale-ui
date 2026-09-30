import { describe, expect, it } from 'vitest';

import { deploymentEnvironment, deploymentLabel } from './deployment-environment';

describe('environnement de la vitrine', () => {
  it('affiche la recette sur son domaine public et ses URL de déploiement', () => {
    expect(deploymentLabel('opale-ui-recette.vercel.app')).toBe('En recette');
    expect(deploymentLabel('opale-ui-recette-abc-thoomas27s-projects.vercel.app')).toBe(
      'En recette',
    );
  });

  it('affiche la production sur le domaine public de production', () => {
    expect(deploymentLabel('opale-ui.vercel.app')).toBe('En production');
  });

  it('accepte un canal explicite pour les futurs domaines personnalisés', () => {
    expect(deploymentEnvironment('example.com', 'recette')).toBe('recette');
    expect(deploymentLabel('example.com', 'recette')).toBe('En recette');
    expect(deploymentLabel('opale-ui-recette.vercel.app', 'production')).toBe('En production');
  });

  it('n’annonce pas la production en local', () => {
    expect(deploymentLabel('localhost')).toBe('En local');
  });
});
